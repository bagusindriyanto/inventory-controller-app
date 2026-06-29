// src/utils/solver.worker.js
import { calculateOptimumAllocation } from './solver';

self.onmessage = function (e) {
  const { forecastData, materialDb, stockData } = e.data;

  try {
    const result = calculateOptimumAllocation(
      forecastData,
      materialDb,
      stockData,
    );
    self.postMessage({ success: true, data: result });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};
