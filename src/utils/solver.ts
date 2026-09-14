import solver from 'javascript-lp-solver';
import type { Model as LPModel, SolveResult } from 'javascript-lp-solver';

import type { Material } from '@/features/material/api/material.schema';
import type { Stock } from '@/features/stock/api/stock.schema';
import type { ForecastSummary, ForecastWeek } from './aggregations';

export type SolverStatus = 'SAFE' | 'PARTIAL (SHORTAGE)' | 'UNFEASIBLE (STOP)';

export type MaterialMetadata = {
  name: string;
  color: string;
  unit: string;
  buyer: string;
};

type BomComponent = {
  id: string;
  consumption: number;
  leadTimeDays: number;
};

type NormalizedForecast = {
  raw: ForecastSummary;
  modelCode: string;
  style: string;
};

export type MaterialStockInfo = {
  id: string;
  consumption: number;
  needed: number;
  actual: number;
  remaining: number;
  name: string;
  color: string;
  unit: string;
  buyer: string;
};

export type Allocation = {
  forecast: number;
  actual: number;
  status: SolverStatus;
  materialsStock: MaterialStockInfo[];
};

export type RemainingStockEntry = {
  id: string;
  qty: number;
  name: string;
  color: string;
  unit: string;
  buyer: string;
};

export type CriticalMaterial = {
  id: string;
  name: string;
  leadTimeDays: number;
};

export type PurchasePlan = {
  maxLeadTimeDays: number;
  maxLeadTimeWeeks: number;
  shortageWeek: ForecastWeek | null;
  orderTriggerWeek: ForecastWeek | 'OVERDUE' | 'No Action Needed';
  criticalMaterials: CriticalMaterial[];
};

export type StyleProjection = {
  modelCode: string;
  style: string;
  purchasePlan: PurchasePlan;
  weeks: Partial<Record<ForecastWeek, Allocation>>;
};

export type SolverResult = {
  weeks: ForecastWeek[];
  styles: StyleProjection[];
  remainingByWeek: Partial<Record<ForecastWeek, RemainingStockEntry[]>>;
};

export type SolverWorkerRequest = {
  forecastData: ForecastSummary[];
  materialData: Material[];
  stockData: Stock[];
};

export type SolverWorkerResponse =
  | { success: true; data: SolverResult }
  | { success: false; error: string };

export function calculateOptimumAllocation(
  forecastData: ForecastSummary[],
  materialData: Material[],
  stockData: Stock[],
): SolverResult {
  // A. Kelompokkan BOM per Style & kumpulkan metadata material
  const bomMap: Record<string, BomComponent[]> = {};
  const materialMetadataMap: Record<string, MaterialMetadata> = {};
  materialData.forEach((material) => {
    const modelCode = material.modelCode;
    const materialId = material.id;
    const consumption = material.consumption ?? 0;
    const leadTimeDays = material.leadTime ?? 0;

    if (!materialId) return;

    if (!materialMetadataMap[materialId]) {
      materialMetadataMap[materialId] = {
        name: material.name || 'Unknown Material',
        color: material.color || '-',
        unit: material.uom || 'N/A',
        buyer: material.buyer || 'NON NOMINATE',
      };
    }

    if (!modelCode) return;

    if (!bomMap[modelCode]) bomMap[modelCode] = [];
    bomMap[modelCode].push({ id: materialId, consumption, leadTimeDays });
  });

  // B. Kumpulkan semua material ID yang dipakai di BOM & ada di forecast
  const forecastModelCodes = new Set<string>();
  // C. Pre-normalize Forecast Data sekali di awal (Mengurangi string overhead & loop tunggal)
  const normalizedForecasts: NormalizedForecast[] = [];
  forecastData.forEach((forecast) => {
    const modelCode = forecast.modelCode;
    const style = forecast.style;
    if (!modelCode && !style) return;

    forecastModelCodes.add(modelCode);

    normalizedForecasts.push({
      raw: forecast,
      modelCode,
      style,
    });
  });

  const usedMaterialIds = new Set<string>();
  Object.entries(bomMap).forEach(([modelCode, components]) => {
    if (!forecastModelCodes.has(modelCode)) return;
    components.forEach((component) => usedMaterialIds.add(component.id));
  });

  // D. Transformasikan array stock, hanya track material yang dipakai solver
  const currentStockTracker: Record<string, number> = {};
  stockData.forEach((stock) => {
    const id = stock.id;
    if (id && usedMaterialIds.has(id)) {
      currentStockTracker[id] = stock.totalQty ?? 0;
    }
  });

  // E. Dapatkan daftar minggu
  const weekKeys: ForecastWeek[] = Object.keys(
    forecastData[0]?.weeks ?? {},
  ).map(Number);

  const simulationReport: Record<ForecastWeek, Record<string, Allocation>> = {};
  const remainingStockByWeek: Record<ForecastWeek, RemainingStockEntry[]> = {};

  // --- RUN SIMULATION LOOP MINGGUAN ---
  weekKeys.forEach((currentWeek) => {
    // Inisialisasi Model Simplex untuk minggu berjalan (locals agar `ints` tetap defined)
    const variables: Record<string, Record<string, number>> = {};
    const constraints: Record<string, { max: number }> = {};
    const ints: Record<string, 0 | 1> = {};
    const lpModel: LPModel = {
      optimize: 'output',
      opType: 'max',
      timeout: 120000,
      tolerance: 0.05,
      constraints,
      variables,
      ints, // Mengunci agar hasil alokasi berupa bilangan bulat
    };

    // 1. Setup Variabel & Kendala untuk setiap Style berdasarkan Forecast Minggu Ini
    normalizedForecasts.forEach((forecast) => {
      // Mengambil nilai demand menggunakan nomor minggu berjalan sebagai key
      const forecastQty = forecast.raw.weeks[currentWeek] ?? 0;
      if (forecastQty <= 0) return; // Lewati jika tidak ada target

      const modelCode = forecast.modelCode;
      const components = bomMap[modelCode] ?? [];

      // Fungsi Tujuan: Memaksimalkan total volume produksi
      variables[modelCode] = { output: 1 };
      ints[modelCode] = 1;

      // Hubungkan koefisien pemakaian material (BOM) ke dalam model solver
      components.forEach((component) => {
        if (constraints[component.id] === undefined) {
          constraints[component.id] = {
            max: currentStockTracker[component.id] ?? 0,
          };
        }
        variables[modelCode][component.id] = component.consumption;
      });
      // Kendala Batas Atas: forecast minggu ini
      const capConstraintKey = `max_forecast_${modelCode}`;
      constraints[capConstraintKey] = { max: forecastQty };
      variables[modelCode][capConstraintKey] = 1;
    });

    // 2. JALANKAN METODE SIMPLEX SOLVER
    const solution = solver.Solve(lpModel) as SolveResult;
    // 3. PENGURANGAN STOK GUDANG, REKAM HASIL & SIMPAN DATA SISA MATERIAL MINGGU INI
    simulationReport[currentWeek] = {};
    normalizedForecasts.forEach((forecast) => {
      const forecastQty = forecast.raw.weeks[currentWeek] ?? 0;
      if (forecastQty <= 0) return;
      const modelCode = forecast.modelCode;
      const solvedValue = solution[modelCode];
      const actualAllocated = typeof solvedValue === 'number' ? solvedValue : 0;

      let status: SolverStatus = 'SAFE';
      if (actualAllocated === 0) status = 'UNFEASIBLE (STOP)';
      else if (actualAllocated < forecastQty) status = 'PARTIAL (SHORTAGE)';

      const components = bomMap[modelCode] ?? [];
      const materialsStock = components
        .map((component) => {
          const forecastMaterialNeeded = forecastQty * component.consumption;
          const actualMaterialNeeded = actualAllocated * component.consumption;

          if (currentStockTracker[component.id] !== undefined) {
            currentStockTracker[component.id] -= actualMaterialNeeded;
            if (currentStockTracker[component.id] < 0.0001) {
              currentStockTracker[component.id] = 0;
            }
          }

          const meta = materialMetadataMap[component.id] ?? {
            name: 'Unknown Material',
            color: '-',
            unit: 'N/A',
            buyer: 'NON NOMINATE',
          };

          return {
            id: component.id,
            consumption: component.consumption,
            needed: forecastMaterialNeeded,
            actual: actualMaterialNeeded,
            remaining: currentStockTracker[component.id],
            name: meta.name,
            color: meta.color,
            unit: meta.unit,
            buyer: meta.buyer,
          };
        })
        .sort(
          (a, b) => a.remaining - b.remaining || a.name.localeCompare(b.name),
        );

      simulationReport[currentWeek]![modelCode] = {
        forecast: forecastQty,
        actual: actualAllocated,
        status: status,
        materialsStock: materialsStock,
      };
    });

    remainingStockByWeek[currentWeek] = Object.entries(currentStockTracker)
      .map(([id, qty]) => {
        const meta = materialMetadataMap[id] ?? {
          name: 'Unknown Material',
          color: '-',
          unit: 'N/A',
          buyer: 'NON NOMINATE',
        };

        return {
          id,
          qty,
          name: meta.name,
          color: meta.color,
          unit: meta.unit,
          buyer: meta.buyer,
        };
      })
      .sort((a, b) => a.qty - b.qty || a.name.localeCompare(b.name));
  });

  // --- KALKULASI SHORTAGE WEEK & PURCHASE PLAN PER STYLE ---
  const styles = normalizedForecasts.map((forecast): StyleProjection => {
    const modelCode = forecast.modelCode;
    const components = bomMap[modelCode] ?? [];

    // 1. Single-pass: hitung maxLeadTime & kumpulkan critical materials
    let maxLtDays = 0;
    components.forEach((component) => {
      if (component.leadTimeDays > maxLtDays) {
        maxLtDays = component.leadTimeDays;
      }
    });

    const criticalMaterials: CriticalMaterial[] = [];
    if (maxLtDays > 0) {
      components.forEach((component) => {
        if (component.leadTimeDays === maxLtDays) {
          const meta = materialMetadataMap[component.id];
          criticalMaterials.push({
            id: component.id,
            name: meta.name ?? 'Unknown',
            leadTimeDays: component.leadTimeDays,
          });
        }
      });
    }
    const maxLtWeeks = Math.ceil(maxLtDays / 7);

    // 2. Scan shortage week — minggu pertama status bukan SAFE
    let shortageWeek: ForecastWeek | null = null;
    let orderTriggerWeek: ForecastWeek | 'OVERDUE' | null = null;

    for (let i = 0; i < weekKeys.length; i++) {
      const week = weekKeys[i];
      const weekReport = simulationReport[week]?.[modelCode];
      if (!weekReport) continue;

      if (weekReport.status !== 'SAFE') {
        shortageWeek = week;

        // 3. Hitung mundur order trigger berdasarkan max lead time
        const triggerIndex = i - maxLtWeeks;
        if (triggerIndex >= 0) {
          orderTriggerWeek = weekKeys[triggerIndex];
        } else {
          orderTriggerWeek = 'OVERDUE';
        }
        break;
      }
    }

    const weeks: StyleProjection['weeks'] = {};
    for (const week of weekKeys) {
      const allocation = simulationReport[week]?.[modelCode];
      if (allocation) weeks[week] = allocation;
    }

    return {
      modelCode,
      style: forecast.style,
      weeks,
      purchasePlan: {
        maxLeadTimeDays: maxLtDays,
        maxLeadTimeWeeks: maxLtWeeks,
        shortageWeek,
        orderTriggerWeek: orderTriggerWeek ?? 'No Action Needed',
        criticalMaterials,
      },
    };
  });

  return {
    weeks: [...weekKeys].sort((a, b) => a - b),
    styles,
    remainingByWeek: remainingStockByWeek,
  };
}
