import solver from 'javascript-lp-solver';

export function calculateOptimumAllocation(
  forecastData,
  materialDb,
  stockData,
) {
  // A. Transformasikan array stock menjadi Objek Map Kunci-Nilai O(1)
  const currentStockTracker = {};
  stockData.forEach((stk) => {
    const id = String(stk.ID || stk.id || '').trim();
    if (id) {
      currentStockTracker[id] = parseFloat(stk.Total || stk.total || 0);
    }
  });

  // B. Kelompokkan BOM per Style
  const bomMap = {};
  materialDb.forEach((mat) => {
    const modelCode = String(mat['MODEL CODE'] || mat.modelCode || '').trim();
    const materialId = String(mat.ID || mat.id || '').trim();
    const consumption = parseFloat(mat.CONS || mat.cons || 0);

    if (!materialId || !modelCode) return;

    if (!bomMap[modelCode]) bomMap[modelCode] = [];
    bomMap[modelCode].push({ id: materialId, cons: consumption });
  });

  // C. Pre-normalize Forecast Data sekali di awal (Mengurangi string overhead)
  const normalizedForecasts = forecastData.map((fc) => {
    return {
      raw: fc,
      modelCode: String(fc['Model Code'] || fc.modelCode || '').trim(),
      style: String(fc.Model || fc.model || '').trim(),
    };
  });

  // D. Dapatkan daftar minggu
  const sampleForecast = forecastData[0] || {};
  const weekKeys = Object.keys(sampleForecast).filter(
    (key) =>
      /^(W|w|Week|week)?\s*\d+$/.test(key) &&
      key.toLowerCase() !== 'id' &&
      key.toLowerCase() !== 'cc',
  );

  const simulationReport = {};

  // --- RUN SIMULATION LOOP MINGGUAN ---
  weekKeys.forEach((currentWeek) => {
    // Inisialisasi Model Simplex untuk minggu berjalan
    const lpModel = {
      optimize: 'output',
      opType: 'max',
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
    // 3. REKAM HASIL & EKSEKUSI PENGURANGAN STOK GUDANG
    simulationReport[currentWeek] = {};
    normalizedForecasts.forEach((fc) => {
      const forecastQty = fc.raw[currentWeek] || 0;
      if (forecastQty <= 0) return;
      const modelCode = fc.modelCode;
      const actualAllocated = solution[modelCode] || 0;

      let status = 'SAFE';
      if (actualAllocated === 0) status = 'UNFEASIBLE (STOP)';
      else if (actualAllocated < forecastQty) status = 'PARTIAL (SHORTAGE)';

      simulationReport[currentWeek][modelCode] = {
        forecast: forecastQty,
        actual: actualAllocated,
        shortage: forecastQty - actualAllocated,
        status: status,
        style: fc.style,
      };
      // Potong stok gudang secara riil untuk minggu berikutnya
      const components = bomMap[modelCode] || [];
      components.forEach((comp) => {
        if (currentStockTracker[comp.id] !== undefined) {
          currentStockTracker[comp.id] -= actualAllocated * comp.cons;
          if (currentStockTracker[comp.id] < 0.0001) {
            currentStockTracker[comp.id] = 0;
          }
        }
      });
    });
  });

  return simulationReport;
}

export function transformOptimumReport(report, forecastData) {
  const weeks = Object.keys(report); // Extract keys once outside the loop
  return forecastData.map((fc) => {
    const codeStyle = fc['Model Code'] || fc.modelCode || '';
    const row = {
      codeStyle,
      style: fc.Style || fc.style || '',
    };

    weeks.forEach((week) => {
      const weekData = report[week][codeStyle];
      if (weekData) {
        row[week] = {
          actual: weekData.actual,
          forecast: weekData.forecast,
          status: weekData.status,
        };
      } else {
        row[week] = { actual: '-', forecast: '-', status: 'EMPTY' };
      }
    });

    return row;
  });
}
