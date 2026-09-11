// src/utils/solver.worker.ts
import { calculateOptimumAllocation } from './solver';
import type {
  SolverWorkerRequest,
  SolverWorkerResponse,
} from './solver';

self.onmessage = (e: MessageEvent<SolverWorkerRequest>): void => {
  const { forecastData, materialData, stockData } = e.data;

  try {
    const result = calculateOptimumAllocation(
      forecastData,
      materialData,
      stockData,
    );
    const response: SolverWorkerResponse = { success: true, data: result };
    self.postMessage(response);
  } catch (error) {
    const response: SolverWorkerResponse = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};
