import { useState, useEffect, useCallback } from 'react';
import { fetchAllSheets } from '../utils/googleSheets';

export function useGoogleSheets(spreadsheetId, sheetConfigs) {
  const [sheets, setSheets] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Serialize config sebagai dependency key
  const configKey = JSON.stringify(sheetConfigs);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAllSheets(spreadsheetId, sheetConfigs);
      setSheets(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [spreadsheetId, configKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { sheets, loading, error, refetch: load };
}
