// src/hooks/useSolver.ts
import { useState, useEffect, useRef } from 'react';
import SolverWorker from '../utils/solver.worker.ts?worker';
import type { ForecastSeasonalSummary } from '@/utils/aggregations';
import type { SolverResult, SolverWorkerResponse } from '@/utils/solver';
import type { Material } from '@/features/material/api/material.schema';
import type { Stock } from '@/features/stock/api/stock.schema';

export function useSolver(
  forecastData: ForecastSeasonalSummary[] | undefined,
  materialData: Material[] | undefined,
  stockData: Stock[] | undefined,
) {
  const [result, setResult] = useState<SolverResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Inputs of the last settled worker run. Updated only from worker
  // callbacks, so `loading` below can be derived during render instead of
  // being synced via setState inside the effect.
  const [settledInputs, setSettledInputs] = useState<
    readonly [ForecastSeasonalSummary[], Material[], Stock[]] | null
  >(null);
  const workerRef = useRef<Worker | null>(null);

  // Derived instead of synced: when inputs are missing there is no result.
  const canRun =
    forecastData !== undefined &&
    materialData !== undefined &&
    stockData !== undefined &&
    forecastData.length > 0;

  useEffect(() => {
    // Only run if we have all necessary input data
    if (!canRun) {
      return;
    }

    // Instantiate the Web Worker using Vite's ?worker import
    const worker = new SolverWorker();
    workerRef.current = worker;

    const runInputs = [forecastData, materialData, stockData] as const;

    // Send data to worker
    worker.postMessage({ forecastData, materialData, stockData });

    // Handle worker response
    worker.onmessage = (event: MessageEvent<SolverWorkerResponse>) => {
      const payload = event.data;
      if (payload.success) {
        setResult(payload.data);
        setError(null);
      } else {
        setError(payload.error);
      }
      setSettledInputs(runInputs);
      worker.terminate();
    };

    worker.onerror = (err: ErrorEvent) => {
      setError(err.message);
      setSettledInputs(runInputs);
      worker.terminate();
    };

    // Cleanup worker if inputs change or component unmounts
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [forecastData, materialData, stockData, canRun]);

  const loading =
    canRun &&
    (settledInputs === null ||
      settledInputs[0] !== forecastData ||
      settledInputs[1] !== materialData ||
      settledInputs[2] !== stockData);

  return {
    result: canRun ? result : null,
    loading,
    error: canRun ? error : null,
  };
}
