export type Selection = {
  'Model Code': number;
  'MTS?': string;
  PB: string;
  Season: string;
  Style: string;
  'SUM of ORDER Qty': number;
  'SUM of Selection': number;
};

export type Order = {
  'IMAN No.': number;
  'Model Code': number;
  'Order Type': string;
  PO: number;
  'Qty ORDER': number;
  'SPO No.': string;
  Season: string;
  Style: string;
};

export type Material = {
  Buyer: string;
  COLOR: string;
  CONS: number;
  ID: string;
  'LT material': number;
  NAMA: string;
  'R3/SKU': number;
  Season: string;
  Style: string;
  UOM: string;
  Unit: string;
};

export type Stock = {
  Color: string;
  ID: string;
  Name: string;
  'Qty Cons (Buffer In)': number;
  'Qty Cons (Inventory In)': number;
  Total: number;
  'Unit Cons': string;
};
