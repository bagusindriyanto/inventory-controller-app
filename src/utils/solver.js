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

  // C. DINAMIS: Ambil daftar minggu langsung dari properti key objek baris pertama
  // Mengabaikan key non-minggu seperti 'style'
  const sampleForecast = forecastData[0] || {};
  const uniqueWeeks = Object.keys(sampleForecast).filter(
    (key) =>
      /^(W|w|Week|week)?\s*\d+$/.test(key) &&
      key.toLowerCase() !== 'id' &&
      key.toLowerCase() !== 'cc',
  );

  const simulationReport = {};

  // --- RUN SIMULATION LOOP MINGGUAN ---
  uniqueWeeks.forEach((currentWeek) => {
    // Inisialisasi Model Simplex untuk minggu berjalan
    const lpModel = {
      optimize: 'totalOutputVolume',
      opType: 'max',
      constraints: {},
      variables: {},
      ints: {}, // Mengunci agar hasil alokasi berupa bilangan bulat
    };

    // 1. Set Kendala Batas Maksimal berdasarkan Sisa Stok Gudang berjalan
    Object.keys(currentStockTracker).forEach((matId) => {
      lpModel.constraints[matId] = { max: currentStockTracker[matId] };
    });

    // 2. Set Variabel & Kendala Forecast per Style khusus untuk minggu ini
    forecastData.forEach((fc) => {
      // Mengambil nilai demand menggunakan nomor minggu berjalan sebagai key
      const forecastQty = fc[currentWeek] || 0;
      if (forecastQty <= 0) return; // Lewati jika minggu ini tidak ada target produksi

      const modelCode = String(fc['Model Code'] || fc.modelCode || '').trim();
      const components = bomMap[modelCode] || [];

      // Fungsi Tujuan: Memaksimalkan total volume produksi
      lpModel.variables[modelCode] = { totalOutputVolume: 1 };
      lpModel.ints[modelCode] = 1;

      // Hubungkan koefisien pemakaian material (BOM) ke dalam model solver
      components.forEach((comp) => {
        if (lpModel.constraints[comp.id]) {
          lpModel.variables[modelCode][comp.id] = comp.cons;
        }
      });

      // Kendala Batas Atas: Alokasi aktual tidak boleh lebih besar dari target minggu ini
      const capConstraintKey = `max_forecast_${modelCode}`;
      lpModel.constraints[capConstraintKey] = { max: forecastQty };
      lpModel.variables[modelCode][capConstraintKey] = 1;
    });

    // 3. JALANKAN METODE SIMPLEX SOLVER
    const solution = solver.Solve(lpModel);

    // 4. REKAM HASIL & EKSEKUSI PENGURANGAN STOK GUDANG
    simulationReport[currentWeek] = {
      allocatedProduction: {},
      stockAtStart: { ...currentStockTracker },
    };

    forecastData.forEach((fc) => {
      const forecastQty = fc[currentWeek] || 0;
      if (forecastQty <= 0) return;

      const modelCode = String(fc['Model Code'] || fc.modelCode || '').trim();

      const actualAllocated = solution[modelCode] || 0;

      let status = '🟢 SAFE';
      if (actualAllocated === 0) status = '🔴 UNFEASIBLE (STOP)';
      else if (actualAllocated < forecastQty) status = '🟡 PARTIAL (SHORTAGE)';

      simulationReport[currentWeek].allocatedProduction[modelCode] = {
        forecast: forecastQty,
        actual: actualAllocated,
        shortage: forecastQty - actualAllocated,
        status: status,
        style: String(fc.Model || fc.model || '').trim(),
      };

      // Potong stok gudang secara riil untuk dioperasikan ke siklus minggu berikutnya (Week + 1)
      const components = bomMap[modelCode] || [];
      components.forEach((comp) => {
        if (currentStockTracker[comp.id] !== undefined) {
          currentStockTracker[comp.id] -= actualAllocated * comp.cons;
          if (currentStockTracker[comp.id] < 0.0001)
            currentStockTracker[comp.id] = 0;
        }
      });
    });
  });

  return simulationReport;
}

export function transformOptimumReport(report, forecastData) {
  // 1. Loop berdasarkan data baris input asli Anda
  return forecastData.map((fc) => {
    // 2. Sekarang baris tabel memiliki dua informasi identitas di kiri
    const row = {
      codeStyle: fc['Model Code'] || fc.modelCode || '',
      style: fc.Style || fc.style || '',
    };

    // 3. Masukkan data mingguan seperti biasa
    Object.keys(report).forEach((week) => {
      const weekData = report[week].allocatedProduction[row.codeStyle]; // Cari berdasarkan codeStyle

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
