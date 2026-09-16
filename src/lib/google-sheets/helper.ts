import type { SheetRow, SheetValue } from './types';

const NA_PATTERN =
  /^#(?:N\/A|REF|VALUE|DIV\/0|NAME\?|NULL|NUM|ERROR)(?: ?!?|!? ?)(?:\(.*\))?$/i;

const cleanCell = (cell: SheetValue): SheetValue => {
  if (cell === null) return null;
  if (typeof cell === 'string') {
    const trimmed = cell.trim();
    if (trimmed === '') return null;
    if (NA_PATTERN.test(trimmed)) return null;
  }
  return cell;
};

export const parseValuesToRows = (values: SheetValue[][]): SheetRow[] => {
  if (!values || values.length <= 1) return [];

  const headers = values[0].map((header) => String(header ?? '').trim());
  const rows = values.slice(1);

  return rows.map((row) => {
    const record: SheetRow = {};
    headers.forEach((header, i) => {
      if (!header) return;
      record[header] = cleanCell(row[i]);
    });
    return record;
  });
};
