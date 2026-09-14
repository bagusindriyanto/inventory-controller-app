import { buildSheetUrl } from './client';
import { parseValuesToRows } from './helper';
import type { SheetRow, SheetValue } from './types';

type GoogleSheetResponse = {
  values?: SheetValue[][];
};

type FetchSheetParams = {
  spreadsheetId: string;
  sheetName: string;
  range: string;
};

export const fetchSheet = async ({
  spreadsheetId,
  sheetName,
  range,
}: FetchSheetParams): Promise<SheetRow[]> => {
  const url = buildSheetUrl(spreadsheetId, sheetName, range);
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

  const data: GoogleSheetResponse = await res.json();
  return parseValuesToRows(data.values ?? []);
};
