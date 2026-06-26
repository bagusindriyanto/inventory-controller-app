export const ENVIRONTMENT = {
  SPREADSHEET_ID: '17fRpcH0Y_emWyXHxU7B9IHwyyUlDlCLFpubTE_rIa8A',
  SHEET_CONFIGS: [
    {
      name: 'New Selection Data',
      range: 'A2:F',
      query: `SELECT B,D,E,SUM(F) WHERE A IS NOT NULL GROUP BY B,D,E LABEL SUM(F) 'SUM of Selection'`,
    },
    {
      name: 'RAW DATA',
      range: 'A1:N',
      query: `SELECT G,K,SUM(N) WHERE A IS NOT NULL GROUP BY G,K LABEL SUM(N) 'Qty ORDER'`,
    },
    {
      name: 'Forecast Decathlon',
      range: 'A4:AN',
      query: `SELECT A,C,D,SUM(H) WHERE A IS NOT NULL GROUP BY A,C,D ORDER BY SUM(H) LABEL A 'Season',C 'Style',D 'Model Code',SUM(H) 'Totals'`,
    },
  ],
};
