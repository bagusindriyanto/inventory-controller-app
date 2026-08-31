export type SheetRow = Record<string, unknown>;

export type SheetConfig = {
  name: string;
  range: string;
  query?: string;
};

const API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

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

export const buildValuesUrl = (
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
  return `${API_BASE}/${spreadsheetId}/values/${encodedRange}?${params}`;
};

const NA_PATTERN =
  /^#(?:N\/A|REF|VALUE|DIV\/0|NAME\?|NULL|NUM|ERROR)(?: ?!?|!? ?)(?:\(.*\))?$/i;

const cleanCell = (cell: unknown): unknown => {
  if (cell === null || cell === undefined) return null;
  if (typeof cell === 'string') {
    const trimmed = cell.trim();
    if (trimmed === '') return null;
    if (NA_PATTERN.test(trimmed)) return null;
  }
  return cell;
};

export const parseValuesToRows = (values: unknown[][]): SheetRow[] => {
  if (!values || values.length === 0) return [];

  const headers = values[0].map((h) => String(h ?? '').trim());
  const dataRows = values.slice(1);

  return dataRows.map((row) => {
    const record: SheetRow = {};
    headers.forEach((header, i) => {
      if (!header) return;
      record[header] = cleanCell(row[i]);
    });
    return record;
  });
};

export const fetchSheet = async (
  spreadsheetId: string,
  sheetName: string,
  range: string,
): Promise<SheetRow[]> => {
  const url = buildValuesUrl(spreadsheetId, sheetName, range);
  const res = await fetch(url);

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    let message = `Gagal fetch "${sheetName}" (${res.status})`;
    try {
      const body = JSON.parse(detail);
      message = body?.error?.message || message;
    } catch {
      // ignore non-JSON error body
    }
    throw new Error(message);
  }

  const body = (await res.json()) as { values?: unknown[][] };
  return parseValuesToRows(body.values ?? []);
};
