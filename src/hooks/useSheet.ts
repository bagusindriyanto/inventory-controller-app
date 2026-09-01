import { useQuery } from '@tanstack/react-query';
import { fetchSheet, type SheetRow } from '@/utils/googleSheets';

type UseSheetOptions = {
  spreadsheetId: string;
  sheetName: string;
  range: string;
};

export const sheetKeys = {
  all: ['sheets'] as const,
  range: (spreadsheetId: string, sheetName: string, range: string) =>
    ['sheets', spreadsheetId, sheetName, range] as const,
};

export function useSheet<T extends Record<string, unknown> = SheetRow>({
  spreadsheetId,
  sheetName,
  range,
}: UseSheetOptions) {
  return useQuery<T[]>({
    queryKey: sheetKeys.range(spreadsheetId, sheetName, range),
    queryFn: () => fetchSheet<T>(spreadsheetId, sheetName, range),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
