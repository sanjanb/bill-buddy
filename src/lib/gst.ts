import { BillItem } from "./types";

export interface ItemCalculation {
  amount: number;       // qty * rate
  gstAmount: number;    // amount * gstRate / 100
  cgst: number;         // intra-state only: gstAmount / 2
  sgst: number;         // intra-state only: gstAmount / 2
  igst: number;         // inter-state only: gstAmount
}

export interface BillCalculation {
  items: ItemCalculation[];
  totalBeforeTax: number;
  totalGST: number;
  grandTotal: number;
}

export function calculateBill(
  items: BillItem[],
  gstType: "intra" | "inter"
): BillCalculation {
  const calcs = items.map((item) => {
    const amount = item.quantity * item.rate;
    const gstAmount = Math.round(amount * item.gstRate / 100 * 100) / 100;
    const isInter = gstType === "inter";
    return {
      amount,
      gstAmount,
      cgst: isInter ? 0 : Math.round(gstAmount / 2 * 100) / 100,
      sgst: isInter ? 0 : Math.round(gstAmount / 2 * 100) / 100,
      igst: isInter ? gstAmount : 0,
    };
  });

  const totalBeforeTax = calcs.reduce((s, c) => s + c.amount, 0);
  const totalGST = calcs.reduce((s, c) => s + c.gstAmount, 0);

  return {
    items: calcs,
    totalBeforeTax: Math.round(totalBeforeTax * 100) / 100,
    totalGST: Math.round(totalGST * 100) / 100,
    grandTotal: Math.round((totalBeforeTax + totalGST) * 100) / 100,
  };
}

export function formatCurrency(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}