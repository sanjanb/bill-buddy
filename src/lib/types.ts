export interface BillItem {
  name: string;
  hsn: string;
  quantity: number;
  rate: number;
  gstRate: number; // percentage: 0, 5, 12, 18, 28
}

export interface Bill {
  id: string;
  invoiceNumber: string;
  date: string; // ISO date string
  dueDate: string;
  customerName: string;
  customerPhone: string;
  gstType: "intra" | "inter";
  items: BillItem[];
  notes: string;
  totalBeforeTax: number;
  totalTax: number;
  grandTotal: number;
}

export interface Product {
  id: string;
  name: string;
  hsn: string;
  rate: number;
  gstRate: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  lastUsed: string; // ISO date string
}

export interface Settings {
  shopName: string;
  shopAddress: string;
  shopGSTIN: string;
  logo: string; // base64 data URL
  defaultGSTRate: number;
  bankName: string;
  bankAccountName: string;
  bankAccountNo: string;
  bankIFSC: string;
  bankUPI: string;
}

export const GST_RATES = [0, 5, 12, 18, 28] as const;

export const DEFAULT_SETTINGS: Settings = {
  shopName: "",
  shopAddress: "",
  shopGSTIN: "",
  logo: "",
  defaultGSTRate: 18,
  bankName: "",
  bankAccountName: "",
  bankAccountNo: "",
  bankIFSC: "",
  bankUPI: "",
};