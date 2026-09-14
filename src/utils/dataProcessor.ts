import type { Material } from '@/features/material/api/material.schema';
import type { Stock } from '@/features/stock/api/stock.schema';
import type { ForecastSummary } from '@/utils/aggregations';

/** Single sheet cell after cleaning (`null` = empty / `#N/A`-style error). */
type SheetCell = string | number | null | undefined;

const readCell = (row: object, key: string): SheetCell =>
  (row as Record<string, SheetCell>)[key];

export type WeeklyPoint = {
  week: string;
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
  currentBalance: number;
  totalLtWeeks: number;
  shortageWeek: string;
  orderTriggerWeek: string;
  timeline: WeeklyPoint[];
};

export type MaterialAvailabilityResult = {
  weekKeys: string[];
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
  // 1. Ekstrak header minggu (Kolom N s.d AN biasanya dinamai W23, W24, atau berupa penomoran minggu)
  // Sebagai fallback aman, kita mendeteksi semua properti yang memiliki prefiks huruf W atau berupa angka minggu/string minggu
  const sampleForecast = forecastData[0] || {};
  const weekKeys = Object.keys(sampleForecast).filter(
    (key) =>
      /^(W|w|Week|week)?\s*\d+$/.test(key) &&
      key.toLowerCase() !== 'id' &&
      key.toLowerCase() !== 'cc',
  );

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
      totalLtWeeks: number;
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
        // Allowance 3 bulan (90 hari) dikonversi ke minggu bersama dengan Lead Time produksi & transportasi
        totalLtWeeks: Math.ceil(leadTimeDays / 7),
      };
    }

    // Cari demand forecast mingguan untuk model code ini
    const matchingForecasts = forecastsByModel[modelCode] || [];

    matchingForecasts.forEach((forecast) => {
      weekKeys.forEach((week) => {
        const forecastQty = Number(readCell(forecast, week) ?? 0);
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
    let shortageWeek: string | null = null;
    let orderTriggerWeek: string | null = null;

    weekKeys.forEach((week, index) => {
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

        // Hitung mundur berdasarkan total LT Weeks (LT + 3 Bulan Allowance)
        const triggerIndex = index - meta.totalLtWeeks;
        if (triggerIndex >= 0) {
          orderTriggerWeek = weekKeys[triggerIndex];
        } else {
          orderTriggerWeek = 'OVERDUE'; // Jika minus, berarti window pemesanan aman sudah terlewati
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
      currentBalance: runningStock,
      totalLtWeeks: meta.totalLtWeeks,
      shortageWeek: shortageWeek || 'Safe (Stock Sufficient)',
      orderTriggerWeek: shortageWeek
        ? orderTriggerWeek || ''
        : 'No Action Needed',
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
    if (priorityA === 1) {
      return a.orderTriggerWeek.localeCompare(b.orderTriggerWeek);
    }

    return 0;
  });

  return { weekKeys, projections: finalProjections };
}

// Helper function
function roundTo4Digit(num: number) {
  return Math.round(num * 10000) / 10000;
}

function getPriority(value: string) {
  if (value === 'OVERDUE') return 0;
  if (value === 'No Action Needed') return 2;
  return 1; // untuk nilai lain jika ada
}
