export const createLookupKey = (season: string, modelCode: string): string =>
  JSON.stringify([season, modelCode]);
