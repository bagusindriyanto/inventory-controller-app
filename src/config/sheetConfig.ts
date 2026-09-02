export type SheetSource = {
  spreadsheetId: string;
  sheetName: string;
  range: string;
};

export const SHEETS = {
  business: {
    spreadsheetId: '17fRpcH0Y_emWyXHxU7B9IHwyyUlDlCLFpubTE_rIa8A',
    selection: { sheetName: 'New Selection Data', range: 'A2:G' },
    order: { sheetName: 'RAW DATA', range: 'G1:N' },
    forecast: { sheetName: 'Forecast Decathlon', range: 'A3:AN' },
  },
  warehouse: {
    spreadsheetId: '1TINI8aq5NGmvvNAdRr1LbaE4ZmXzzdsjFCB4vlm-EkQ',
    material: { sheetName: 'Database Material', range: 'A2:K' },
    stock: { sheetName: 'Stok Material (Synthetic)', range: 'B4:H' },
  },
} as const;