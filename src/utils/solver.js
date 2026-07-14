import solver from 'javascript-lp-solver';

export function calculateOptimumAllocation(
  forecastData,
  materialData,
  stockData,
) {
  // A. Kelompokkan BOM per Style & kumpulkan metadata material
  const bomMap = {};
  const materialMetadataMap = {};
  materialData.forEach((mat) => {
    const modelCode = String(mat['MODEL CODE'] || mat.modelCode || '').trim();
    const materialId = String(mat.ID || mat.id || '').trim();
    const consumption = parseFloat(mat.CONS || mat.cons || 0);

    if (!materialId) return;

    if (!materialMetadataMap[materialId]) {
      materialMetadataMap[materialId] = {
        name: mat.NAMA || mat.name || 'Unknown Material',
        color: mat.COLOR || mat.color || '-',
        unit: mat.UOM || mat.uom || 'N/A',
        supplier: mat.Supplier || mat.supplier || 'NON NOMINATE',
      };
    }

    if (!modelCode) return;

    if (!bomMap[modelCode]) bomMap[modelCode] = [];
    bomMap[modelCode].push({ id: materialId, cons: consumption });
  });

  // B. Kumpulkan semua material ID yang dipakai di BOM & ada di forecast
  const forecastModelCodes = new Set();
  // C. Pre-normalize Forecast Data sekali di awal (Mengurangi string overhead & loop tunggal)
  const normalizedForecasts = [];
  forecastData.forEach((fc) => {
    const modelCode = String(fc['Model Code'] || fc.modelCode || '').trim();
    const style = String(fc.Model || fc.model || '').trim();
    if (!modelCode && !style) return;

    forecastModelCodes.add(modelCode);

    normalizedForecasts.push({
      raw: fc,
      modelCode,
      style,
    });
  });

  const usedMaterialIds = new Set();
  Object.entries(bomMap).forEach(([modelCode, components]) => {
    if (!forecastModelCodes.has(modelCode)) return;
    components.forEach((comp) => usedMaterialIds.add(comp.id));
  });

  // D. Transformasikan array stock, hanya track material yang dipakai solver
  const currentStockTracker = {};
  stockData.forEach((stk) => {
    const id = String(stk.ID || stk.id || '').trim();
    if (id && usedMaterialIds.has(id)) {
      currentStockTracker[id] = parseFloat(stk.Total || stk.total || 0);
    }
  });

  // E. Dapatkan daftar minggu
  const sampleForecast = forecastData[0] || {};
  const weekKeys = Object.keys(sampleForecast).filter(
    (key) =>
      /^(W|w|Week|week)?\s*\d+$/.test(key) &&
      key.toLowerCase() !== 'id' &&
      key.toLowerCase() !== 'cc',
  );

  const simulationReport = {};
  const remainingStockByWeek = {};

  // --- RUN SIMULATION LOOP MINGGUAN ---
  weekKeys.forEach((currentWeek) => {
    // Inisialisasi Model Simplex untuk minggu berjalan
    const lpModel = {
      optimize: 'output',
      opType: 'max',
      tolerance: 0.05,
      constraints: {},
      variables: {},
      ints: {}, // Mengunci agar hasil alokasi berupa bilangan bulat
    };

    // 1. Setup Variabel & Kendala untuk setiap Style berdasarkan Forecast Minggu Ini
    normalizedForecasts.forEach((fc) => {
      // Mengambil nilai demand menggunakan nomor minggu berjalan sebagai key
      const forecastQty = fc.raw[currentWeek] || 0;
      if (forecastQty <= 0) return; // Lewati jika tidak ada target

      const modelCode = fc.modelCode;
      const components = bomMap[modelCode] || [];

      // Fungsi Tujuan: Memaksimalkan total volume produksi
      lpModel.variables[modelCode] = { output: 1 };
      lpModel.ints[modelCode] = 1;

      // Hubungkan koefisien pemakaian material (BOM) ke dalam model solver
      components.forEach((comp) => {
        if (lpModel.constraints[comp.id] === undefined) {
          lpModel.constraints[comp.id] = {
            max: currentStockTracker[comp.id] || 0,
          };
        }
        lpModel.variables[modelCode][comp.id] = comp.cons;
      });
      // Kendala Batas Atas: forecast minggu ini
      const capConstraintKey = `max_forecast_${modelCode}`;
      lpModel.constraints[capConstraintKey] = { max: forecastQty };
      lpModel.variables[modelCode][capConstraintKey] = 1;
    });

    // 2. JALANKAN METODE SIMPLEX SOLVER
    const solution = solver.Solve(lpModel);
    // 3. PENGURANGAN STOK GUDANG, REKAM HASIL & SIMPAN DATA SISA MATERIAL MINGGU INI
    simulationReport[currentWeek] = {
      allocation: {},
    };
    normalizedForecasts.forEach((fc) => {
      const forecastQty = fc.raw[currentWeek] || 0;
      if (forecastQty <= 0) return;
      const modelCode = fc.modelCode;
      const actualAllocated = solution[modelCode] || 0;

      let status = 'SAFE';
      if (actualAllocated === 0) status = 'UNFEASIBLE (STOP)';
      else if (actualAllocated < forecastQty) status = 'PARTIAL (SHORTAGE)';

      const components = bomMap[modelCode] || [];
      const materialsStock = components
        .map((comp) => {
          const forecastMaterialNeeded = forecastQty * comp.cons;
          const actualMaterialNeeded = actualAllocated * comp.cons;

          if (currentStockTracker[comp.id] !== undefined) {
            currentStockTracker[comp.id] -= actualMaterialNeeded;
            if (currentStockTracker[comp.id] < 0.0001) {
              currentStockTracker[comp.id] = 0;
            }
          }

          const meta = materialMetadataMap[comp.id] || {
            name: 'Unknown Material',
            color: '-',
            unit: 'N/A',
            supplier: 'NON NOMINATE',
          };

          return {
            id: comp.id,
            cons: comp.cons,
            needed: forecastMaterialNeeded,
            actual: actualMaterialNeeded,
            remaining:
              currentStockTracker[comp.id] !== undefined
                ? currentStockTracker[comp.id]
                : 0,
            name: meta.name,
            color: meta.color,
            unit: meta.unit,
            supplier: meta.supplier,
          };
        })
        .sort(
          (a, b) => a.remaining - b.remaining || a.name.localeCompare(b.name),
        );

      simulationReport[currentWeek].allocation[modelCode] = {
        forecast: forecastQty,
        actual: actualAllocated,
        shortage: forecastQty - actualAllocated,
        status: status,
        style: fc.style,
        materialsStock: materialsStock,
      };
    });

    simulationReport[currentWeek].remaining = Object.entries(
      currentStockTracker,
    )
      .map(([id, qty]) => {
        const meta = materialMetadataMap[id] || {
          name: 'Unknown Material',
          color: '-',
          unit: 'N/A',
          supplier: 'NON NOMINATE',
        };

        return {
          id,
          qty,
          name: meta.name,
          color: meta.color,
          unit: meta.unit,
          supplier: meta.supplier,
        };
      })
      .sort((a, b) => a.qty - b.qty || a.name.localeCompare(b.name));

    remainingStockByWeek[currentWeek] = simulationReport[currentWeek].remaining;
  });

  const rows = transformOptimumReport(simulationReport, forecastData);

  return {
    weeks: weekKeys.sort((a, b) => parseInt(a) - parseInt(b)),
    rows,
    remaining: remainingStockByWeek,
  };
}

export function transformOptimumReport(report, forecastData) {
  const weeks = Object.keys(report); // Extract keys once outside the loop
  return forecastData.map((fc) => {
    const modelCode = fc['Model Code'] || fc.modelCode || '';
    const row = {
      modelCode,
      style: fc.Style || fc.style || '',
    };

    weeks.forEach((week) => {
      const weekData = report[week].allocation[modelCode];
      if (weekData) {
        row[week] = {
          actual: weekData.actual,
          forecast: weekData.forecast,
          status: weekData.status,
          materialsStock: weekData.materialsStock || [],
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
