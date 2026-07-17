export const ENVIRONMENT = {
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
      query: `SELECT G,K,SUM(N) WHERE G IS NOT NULL GROUP BY G,K LABEL SUM(N) 'Qty ORDER'`,
    },
    {
      name: 'Forecast Decathlon',
      range: 'A4:AN',
      query: `
      SELECT A, C, D, SUM(H)
WHERE A IS NOT NULL AND C IS NOT NULL AND D IS NOT NULL
GROUP BY A, C, D
LABEL A 'Season', C 'Style', D 'Model Code', SUM(H) 'Totals'
      `,
    },
    {
      name: 'Forecast Decathlon',
      range: 'A4:AN',
      query: `
      SELECT C, D, SUM(H), SUM(Q), SUM(R), SUM(S), SUM(T), SUM(U), SUM(V), SUM(W), SUM(X), SUM(Y), SUM(Z), SUM(AA), SUM(AB), SUM(AC), SUM(AD), SUM(AE), SUM(AF), SUM(AG), SUM(AH), SUM(AI), SUM(AJ), SUM(AK), SUM(AL), SUM(AM)
WHERE A IS NOT NULL AND C IS NOT NULL AND D IS NOT NULL
GROUP BY C, D
LABEL C 'Style', D 'Model Code', SUM(H) 'Totals', SUM(Q) '30', SUM(R) '31', SUM(S) '32', SUM(T) '33', SUM(U) '34', SUM(V) '35', SUM(W) '36', SUM(X) '37', SUM(Y) '38', SUM(Z) '39', SUM(AA) '40', SUM(AB) '41', SUM(AC) '42', SUM(AD) '43', SUM(AE) '44', SUM(AF) '45', SUM(AG) '46', SUM(AH) '47', SUM(AI) '48', SUM(AJ) '49', SUM(AK) '50', SUM(AL) '51', SUM(AM) '52'
      `,
    },
  ],
};
