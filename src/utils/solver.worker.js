// src/utils/solver.worker.js
import { calculateOptimumAllocation } from './solver';

self.onmessage = function (e) {
  const { forecastData, materialData, stockData } = e.data;

  try {
    const result = calculateOptimumAllocation(
      forecastData,
      materialData,
      stockData,
    );
    self.postMessage({ success: true, data: result });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};
