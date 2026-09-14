import solver from 'javascript-lp-solver';
import type { Model as LPModel, SolveResult } from 'javascript-lp-solver';

import type { Material } from '@/features/material/api/material.schema';
import type { Stock } from '@/features/stock/api/stock.schema';
import type { ForecastSummary, ForecastWeek } from './aggregations';

export type SolverStatus =
  | 'SAFE'
  | 'PARTIAL (SHORTAGE)'
  | 'UNFEASIBLE (STOP)'
  | 'EMPTY';

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

export type WeekAllocation = {
  forecast: number;
  actual: number;
  shortage: number;
  status: SolverStatus;
  style: string;
  materialsStock: MaterialStockInfo[];
};

export type WeekCell = {
  actual: number | string;
  forecast: number | string;
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

export type StylePurchasePlanEntry = {
  modelCode: string;
  style: string;
  maxLeadTimeDays: number;
  maxLeadTimeWeeks: number;
  shortageWeek: ForecastWeek | 'Safe (Stock Sufficient)';
  orderTriggerWeek: ForecastWeek | 'OVERDUE' | 'No Action Needed';
  criticalMaterials: CriticalMaterial[];
};

export type OptimumRow = {
  modelCode: string;
  style: string;
} & Partial<Record<ForecastWeek, WeekCell>>;

export type SolverResult = {
  weeks: ForecastWeek[];
  rows: OptimumRow[];
  remaining: Record<ForecastWeek, RemainingStockEntry[]>;
  stylePurchasePlan: StylePurchasePlanEntry[];
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
    components.forEach((comp) => usedMaterialIds.add(comp.id));
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

  const simulationReport: Record<
    ForecastWeek,
    Record<string, WeekAllocation>
  > = {};
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
        shortage: forecastQty - actualAllocated,
        status: status,
        style: forecast.style,
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
  const stylePurchasePlan: StylePurchasePlanEntry[] = [];

  normalizedForecasts.forEach((fc) => {
    const modelCode = fc.modelCode;
    const components = bomMap[modelCode] ?? [];

    // 1. Single-pass: hitung maxLeadTime & kumpulkan critical materials
    let maxLtDays = 0;
    components.forEach((comp) => {
      if (comp.leadTimeDays > maxLtDays) {
        maxLtDays = comp.leadTimeDays;
      }
    });

    const criticalMaterials: CriticalMaterial[] = [];
    if (maxLtDays > 0) {
      components.forEach((comp) => {
        if (comp.leadTimeDays === maxLtDays) {
          const meta = materialMetadataMap[comp.id];
          criticalMaterials.push({
            id: comp.id,
            name: meta.name ?? 'Unknown',
            leadTimeDays: comp.leadTimeDays,
          });
        }
      });
    }
    const maxLtWeeks = Math.ceil(maxLtDays / 7);

    // 2. Scan shortage week — minggu pertama status bukan SAFE
    let shortageWeek: ForecastWeek | 'Safe (Stock Sufficient)' | null = null;
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

    stylePurchasePlan.push({
      modelCode,
      style: fc.style,
      maxLeadTimeDays: maxLtDays,
      maxLeadTimeWeeks: maxLtWeeks,
      shortageWeek: shortageWeek ?? 'Safe (Stock Sufficient)',
      orderTriggerWeek: shortageWeek
        ? (orderTriggerWeek ?? 'OVERDUE')
        : 'No Action Needed',
      criticalMaterials,
    });
  });

  // Sort: OVERDUE pertama, lalu by week ASC, lalu Safe terakhir
  stylePurchasePlan.sort((a, b) => {
    const priorityA = getPurchasePlanPriority(a.orderTriggerWeek);
    const priorityB = getPurchasePlanPriority(b.orderTriggerWeek);
    if (priorityA !== priorityB) return priorityA - priorityB;
    if (
      typeof a.orderTriggerWeek === 'number' &&
      typeof b.orderTriggerWeek === 'number'
    ) {
      return a.orderTriggerWeek - b.orderTriggerWeek;
    }
    return 0;
  });

  const rows = transformOptimumReport(simulationReport, forecastData);

  return {
    weeks: [...weekKeys].sort((a, b) => a - b),
    rows,
    remaining: remainingStockByWeek,
    stylePurchasePlan,
  };
}

export function transformOptimumReport(
  report: Record<ForecastWeek, Record<string, WeekAllocation>>,
  forecastData: ForecastSummary[],
): OptimumRow[] {
  const weeks: ForecastWeek[] = Object.keys(report).map(Number);
  return forecastData.map((fc) => {
    const modelCode = fc.modelCode;
    const row: OptimumRow = {
      modelCode,
      style: fc.style,
    };

    weeks.forEach((week) => {
      const weekData = report[week]?.[modelCode];
      if (weekData) {
        row[week] = {
          actual: weekData.actual,
          forecast: weekData.forecast,
          status: weekData.status,
          materialsStock: weekData.materialsStock ?? [],
        };
      } else {
        row[week] = {
          actual: '-',
          forecast: '-',
          status: 'EMPTY',
          materialsStock: [],
        };
      }
    });

    return row;
  });
}

function getPurchasePlanPriority(
  value: ForecastWeek | 'OVERDUE' | 'No Action Needed',
): number {
  if (value === 'OVERDUE') return 0;
  if (value === 'No Action Needed') return 2;
  return 1;
}
