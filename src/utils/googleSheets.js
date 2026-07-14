import Papa from 'papaparse';

export const buildCsvUrl = (
  spreadsheetId,
  sheetName,
  { query = null, range = null } = {},
) => {
  const params = new URLSearchParams({
    tqx: 'out:csv',
    headers: 1,
    sheet: sheetName,
    ...(range && { range }),
    ...(query && { tq: query }),
  });

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?${params}`;
};

export const parseCSV = (csvText) =>
  new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (result) => {
        // Filter header kosong dari gviz
        const validKeys = result.meta.fields.filter(
          (key) => key !== '' && key.trim() !== '',
        );

        const data = result.data.map((row) =>
          Object.fromEntries(validKeys.map((k) => [k, row[k]])),
        );

        resolve(data);
      },
      error: reject,
    });
  });

export const fetchSheet = async (spreadsheetId, sheetName, options = {}) => {
  const url = buildCsvUrl(spreadsheetId, sheetName, options);
  const res = await fetch(url);

  if (!res.ok) throw new Error(`Gagal fetch "${sheetName}": ${res.status}`);

  const csvText = await res.text();
  if (csvText.trim().startsWith('<') || csvText.trim().startsWith('{')) {
    throw new Error(`Sheet ${sheetName} tidak dapat diakses atau query gagal.`);
  }

  return parseCSV(csvText);
};

export const fetchAllSheets = async (spreadsheetId, sheetConfigs) => {
  const results = await Promise.allSettled(
    sheetConfigs.map(({ name, ...options }) =>
      fetchSheet(spreadsheetId, name, options),
    ),
  );

  return Object.fromEntries(
    sheetConfigs.map(({ name }, i) => [
      `${name}_${i}`,
      results[i].status === 'fulfilled'
        ? { data: results[i].value, error: null }
        : { data: [], error: results[i].reason.message },
    ]),
  );
};
