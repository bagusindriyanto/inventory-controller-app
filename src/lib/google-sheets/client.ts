const API_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

const getApiKey = (): string => {
  const key = import.meta.env.VITE_SHEETS_API_KEY;
  if (!key) {
    throw new Error(
      'VITE_SHEETS_API_KEY is not set. Add it to your .env.local file.',
    );
  }
  return key;
};

export const buildRange = (sheetName: string, range: string): string => {
  const needsQuoting = /[^\w]/.test(sheetName);
  const sheet = needsQuoting ? `'${sheetName}'` : sheetName;
  return `${sheet}!${range}`;
};

export const buildSheetUrl = (
  spreadsheetId: string,
  sheetName: string,
  range: string,
): string => {
  const encodedRange = encodeURIComponent(buildRange(sheetName, range));
  const params = new URLSearchParams({
    key: getApiKey(),
    majorDimension: 'ROWS',
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  return `${API_BASE_URL}/${spreadsheetId}/values/${encodedRange}?${params}`;
};
