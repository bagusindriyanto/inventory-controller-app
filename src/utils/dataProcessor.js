/**
 * Memproses Sisa Selection
 * Formula: Selection - Order - Total Forecast
 */
export function calculateSelectionRemaining(
  selectionData,
  orderData,
  forecastData,
) {
  const results = [];

  selectionData.forEach((sel) => {
    const season = String(sel.Season || sel.season || '').trim();
    const modelCode = String(sel['Model Code'] || sel.modelCode || '').trim();
    const style = String(sel.Style || sel.style || '').trim();
    const sumSelection = parseFloat(
      sel['SUM of Selection'] || sel.sumSelection || 0,
    );

    if (!modelCode) return;

    // Filter & sum order quantity
    const matchingOrders = orderData.filter(
      (ord) =>
        String(ord.Season || ord.season || '').trim() === season &&
        String(ord['Model Code'] || ord.modelCode || '').trim() === modelCode,
    );
    const totalOrderQty = matchingOrders.reduce(
      (acc, curr) => acc + parseFloat(curr['Qty ORDER'] || curr.qtyOrder || 0),
      0,
    );

    // Filter & sum total forecast data
    const matchingForecasts = forecastData.filter(
      (fc) =>
        String(fc.Season || fc.season || '').trim() === season &&
        String(fc['Model Code'] || fc.modelCode || '').trim() === modelCode,
    );
    const totalForecastQty = matchingForecasts.reduce(
      (acc, curr) => acc + parseFloat(curr.Totals || curr.totals || 0),
      0,
    );

    const remaining = sumSelection - totalOrderQty - totalForecastQty;

    results.push({
      season,
      modelCode,
      style,
      selectionQty: sumSelection,
      orderQty: totalOrderQty,
      forecastQty: totalForecastQty,
      remainingSelection: remaining,
      status:
        remaining < 0
          ? 'Over-consumed'
          : remaining === 0
            ? 'Balanced'
            : 'Surplus',
    });
  });

  return results;
}

/**
 * Memproses Ketersediaan Komponen Kumulatif Mingguan & Rekomendasi Waktu Pembelian (MRP)
 */
export function calculateMaterialAvailability(
  forecastData,
  materialDb,
  stockData,
) {
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
  const stockMap = {};
  stockData.forEach((stk) => {
    const id = String(stk.ID || stk.id || '').trim();
    if (id) {
      stockMap[id] = parseFloat(stk.Total || stk.total || 0);
    }
  });

  // 3. Hitung total kebutuhan material (ID) per minggu (Aggregate Demand)
  const weeklyMaterialDemand = {}; // Struktur: { [materialID]: { [weekKey]: demandJumlah } }
  const materialMetadata = {}; // Menyimpan metadata supplier, leadtime, nama, dll.

  materialDb.forEach((mat) => {
    const modelCode = String(mat['MODEL CODE'] || mat.modelCode || '').trim();
    const materialId = String(mat.ID || mat.id || '').trim();
    const consumption = parseFloat(mat.CONS || mat.cons || 0);
    const leadTimeDays = parseFloat(
      mat['Total LT (day)'] || mat.totalLtDays || 0,
    );

    if (!materialId || !modelCode) return;

    // Simpan metadata komponen untuk referensi join tabel
    if (!materialMetadata[materialId]) {
      materialMetadata[materialId] = {
        name: mat.NAMA || mat.name || 'Unknown Material',
        color: mat.COLOR || mat.color || '-',
        unit: mat.UOM || mat.uom || 'N/A',
        supplier: mat.Supplier || mat.supplier || 'NON NOMINATE',
        leadTimeDays: leadTimeDays,
        // Allowance 3 bulan (90 hari) dikonversi ke minggu bersama dengan Lead Time produksi & transportasi
        totalLtWeeks: Math.ceil((leadTimeDays + 90) / 7),
      };
    }

    // Cari demand forecast mingguan untuk model code ini
    const matchingForecasts = forecastData.filter(
      (fc) =>
        String(fc['Model Code'] || fc.modelCode || '').trim() === modelCode,
    );

    matchingForecasts.forEach((fc) => {
      weekKeys.forEach((week) => {
        const forecastQty = parseFloat(fc[week] || 0);
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
  const finalProjections = [];

  Object.keys(materialMetadata).forEach((matId) => {
    const meta = materialMetadata[matId];
    const initialStock = stockMap[matId] || 0;
    let runningStock = initialStock;

    const weeklyTimeline = [];
    let shortageWeek = null;
    let orderTriggerWeek = null;

    weekKeys.forEach((week, index) => {
      const demand = weeklyMaterialDemand[matId]?.[week] || 0;
      runningStock = runningStock - demand;

      weeklyTimeline.push({
        week,
        demand: parseFloat(demand.toFixed(4)),
        closingStock: parseFloat(runningStock.toFixed(4)),
      });

      // Catat minggu pertama kali stok jatuh di bawah nol (Shortage)
      if (runningStock < 0 && shortageWeek === null) {
        shortageWeek = week;

        // Hitung mundur berdasarkan total LT Weeks (LT + 3 Bulan Allowance)
        const triggerIndex = index - meta.totalLtWeeks;
        if (triggerIndex >= 0) {
          orderTriggerWeek = weekKeys[triggerIndex];
        } else {
          orderTriggerWeek = 'IMMEDIATE / OVERDUE'; // Jika minus, berarti window pemesanan aman sudah terlewati
        }
      }
    });

    finalProjections.push({
      materialId: matId,
      name: meta.name,
      color: meta.color,
      unit: meta.unit,
      supplier: meta.supplier,
      initialStock,
      currentBalance: runningStock,
      totalLtWeeks: meta.totalLtWeeks,
      shortageWeek: shortageWeek || 'Safe (Stock Sufficient)',
      orderTriggerWeek: shortageWeek ? orderTriggerWeek : 'No Action Needed',
      timeline: weeklyTimeline,
    });
  });

  finalProjections.sort((a, b) => {
    const getPriority = (value) => {
      if (value === 'IMMEDIATE / OVERDUE') return 0;
      if (value === 'No Action Needed') return 2;
      return 1; // untuk nilai lain jika ada
    };

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
