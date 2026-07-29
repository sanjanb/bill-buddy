export interface BillItem {
  name: string;
  hsn: string;
  quantity: number;
  rate: number;
  gstRate: number; // percentage: 0, 5, 12, 18, 28
}

export interface Bill {
  id: string;
  date: string; // ISO date string
  customerName: string;
  customerPhone: string;
  gstType: "intra" | "inter";
  items: BillItem[];
  totalBeforeTax: number;
  totalTax: number;
  grandTotal: number;
}

export interface Settings {
  shopName: string;
  shopAddress: string;
  shopGSTIN: string;
  logo: string; // base64 data URL
  defaultGSTRate: number;
}

export const GST_RATES = [0, 5, 12, 18, 28] as const;

export const DEFAULT_SETTINGS: Settings = {
  shopName: "",
  shopAddress: "",
  shopGSTIN: "",
  logo: "",
  defaultGSTRate: 18,
};