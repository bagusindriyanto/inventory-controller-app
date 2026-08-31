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

export function useSheet({ spreadsheetId, sheetName, range }: UseSheetOptions) {
  return useQuery<SheetRow[]>({
    queryKey: sheetKeys.range(spreadsheetId, sheetName, range),
    queryFn: () => fetchSheet(spreadsheetId, sheetName, range),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
