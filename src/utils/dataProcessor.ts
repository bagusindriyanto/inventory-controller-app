import type { Material } from '@/features/material/api/material.schema';
import type { Stock } from '@/features/stock/api/stock.schema';
import type { ForecastSummary, ForecastWeek } from '@/utils/aggregations';

export type WeeklyPoint = {
  week: ForecastWeek;
  demand: number;
  closingStock: number;
};

export type MaterialProjectionResult = {
  materialId: string;
  name: string;
  color: string;
  unit: string;
  buyer: string;
  initialStock: number;
  leadTimeWeeks: number;
  shortageWeek: ForecastWeek | null;
  orderTriggerWeek: ForecastWeek | 'Terlambat' | 'Aman';
  timeline: WeeklyPoint[];
};

export type MaterialAvailabilityResult = {
  weeks: ForecastWeek[];
  projections: MaterialProjectionResult[];
};

/**
 * Memproses Ketersediaan Komponen Kumulatif Mingguan & Rekomendasi Waktu Pembelian (MRP)
 */
export function calculateMaterialAvailability(
  forecastData: ForecastSummary[],
  materialData: Material[],
  stockData: Stock[],
): MaterialAvailabilityResult {
  const weeks: ForecastWeek[] = Object.keys(forecastData[0]?.weeks ?? {})
    .map(Number)
    .sort((a, b) => a - b);

  // 2. Petakan Stok Awal Material berdasarkan ID
  const stockMap: Record<string, number> = {};
  stockData.forEach((stock) => {
    const id = stock.id;
    if (id) {
      stockMap[id] = stock.totalQty ?? 0;
    }
  });

  // 3. Hitung total kebutuhan material (ID) per minggu (Aggregate Demand)
  const forecastsByModel: Record<string, ForecastSummary[]> = {};
  forecastData.forEach((forecast) => {
    const modelCode = forecast.modelCode;

    if (!modelCode) return;

    if (!forecastsByModel[modelCode]) {
      forecastsByModel[modelCode] = [];
    }
    forecastsByModel[modelCode].push(forecast);
  });

  const weeklyMaterialDemand: Record<string, Record<string, number>> = {}; // Struktur: { [materialID]: { [weekKey]: demandJumlah } }
  const materialMetadata: Record<
    string,
    {
      name: string;
      color: string;
      unit: string;
      buyer: string;
      leadTimeDays: number;
      leadTimeWeeks: number;
    }
  > = {}; // Menyimpan metadata buyer, leadtime, nama, dll.

  materialData.forEach((material) => {
    const modelCode = material.modelCode;
    const materialId = material.id;
    const consumption = material.consumption ?? 0;
    const leadTimeDays = material.leadTime ?? 0;

    if (!materialId || !modelCode) return;

    // Simpan metadata komponen untuk referensi join tabel
    if (!materialMetadata[materialId]) {
      materialMetadata[materialId] = {
        name: material.name || 'Unknown Material',
        color: material.color || '-',
        unit: material.uom || 'N/A',
        buyer: material.buyer || 'NON NOMINATE',
        leadTimeDays: leadTimeDays,
        // Konversi lead time material dari hari ke minggu.
        leadTimeWeeks: Math.ceil(leadTimeDays / 7),
      };
    }

    // Cari demand forecast mingguan untuk model code ini
    const matchingForecasts = forecastsByModel[modelCode] || [];

    matchingForecasts.forEach((forecast) => {
      weeks.forEach((week) => {
        const forecastQty = forecast.weeks[week] ?? 0;
        const materialNeeded = forecastQty * consumption;

        if (!weeklyMaterialDemand[materialId])
          weeklyMaterialDemand[materialId] = {};
        if (!weeklyMaterialDemand[materialId][week])
          weeklyMaterialDemand[materialId][week] = 0;

        weeklyMaterialDemand[materialId][week] += materialNeeded;
      });
    });
  });

  // 4. Kalkulasi Proyeksi Kumulatif Mingguan & Cari Kapan Harus Beli
  const finalProjections: MaterialProjectionResult[] = [];

  Object.keys(materialMetadata).forEach((matId) => {
    const meta = materialMetadata[matId];
    const initialStock = stockMap[matId] || 0;
    let runningStock = initialStock;

    const weeklyTimeline: WeeklyPoint[] = [];
    let shortageWeek: ForecastWeek | null = null;
    let orderTriggerWeek: MaterialProjectionResult['orderTriggerWeek'] = 'Aman';

    weeks.forEach((week, index) => {
      const demand = weeklyMaterialDemand[matId]?.[week] || 0;
      runningStock = runningStock - demand;

      weeklyTimeline.push({
        week,
        demand: roundTo4Digit(demand),
        closingStock: roundTo4Digit(runningStock),
      });

      // Catat minggu pertama kali stok jatuh di bawah nol (Shortage)
      if (runningStock < 0 && shortageWeek === null) {
        shortageWeek = week;

        // Hitung mundur berdasarkan lead time material.
        const triggerIndex = index - meta.leadTimeWeeks;
        if (triggerIndex >= 0) {
          orderTriggerWeek = weeks[triggerIndex];
        } else {
          orderTriggerWeek = 'Terlambat'; // Jika minus, berarti window pemesanan aman sudah terlewati
        }
      }
    });

    finalProjections.push({
      materialId: matId,
      name: meta.name,
      color: meta.color,
      unit: meta.unit,
      buyer: meta.buyer,
      initialStock,
      leadTimeWeeks: meta.leadTimeWeeks,
      shortageWeek,
      orderTriggerWeek,
      timeline: weeklyTimeline,
    });
  });

  finalProjections.sort((a, b) => {
    const priorityA = getPriority(a.orderTriggerWeek);
    const priorityB = getPriority(b.orderTriggerWeek);

    // Prioritas berbeda
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Sama-sama week number
    if (
      typeof a.orderTriggerWeek === 'number' &&
      typeof b.orderTriggerWeek === 'number'
    ) {
      return a.orderTriggerWeek - b.orderTriggerWeek;
    }

    return 0;
  });

  return { weeks, projections: finalProjections };
}

// Helper function
function roundTo4Digit(num: number) {
  return Math.round(num * 10000) / 10000;
}

function getPriority(value: MaterialProjectionResult['orderTriggerWeek']) {
  if (value === 'Terlambat') return 0;
  if (value === 'Aman') return 2;
  return 1; // untuk nilai lain jika ada
}
