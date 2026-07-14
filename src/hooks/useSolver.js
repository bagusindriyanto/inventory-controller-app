// src/hooks/useSolver.js
import { useState, useEffect, useRef } from 'react';

export function useSolver(forecastData, materialData, stockData) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const workerRef = useRef(null);

  useEffect(() => {
    // Only run if we have all necessary input data
    if (
      !forecastData ||
      !materialData ||
      !stockData ||
      forecastData.length === 0
    ) {
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Instantiate the Web Worker using Vite's native URL support
    const worker = new Worker(
      new URL('../utils/solver.worker.js', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;

    // Send data to worker
    worker.postMessage({ forecastData, materialData, stockData });

    // Handle worker response
    worker.onmessage = (event) => {
      const { success, data, error } = event.data;
      if (success) {
        setResult(data);
      } else {
        setError(error);
      }
      setLoading(false);
      worker.terminate();
    };

    worker.onerror = (err) => {
      setError(err.message);
      setLoading(false);
      worker.terminate();
    };

    // Cleanup worker if inputs change or component unmounts
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [forecastData, materialData, stockData]);

  return { result, loading, error };
}
