import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Bill, Settings } from "./types";
import { calculateBill, formatCurrency } from "./gst";

// ── Helpers ──────────────────────────────────────────────

function numberToWords(n: number): string {
  if (n === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function chunk(num: number): string {
    if (num === 0) return "";
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
    return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " and " + chunk(num % 100) : "");
  }

  const intPart = Math.floor(n);
  const decPart = Math.round((n - intPart) * 100);

  let result = "";
  if (intPart >= 10000000) {
    result += chunk(Math.floor(intPart / 10000000)) + " Crore ";
    n = intPart % 10000000;
  } else { n = intPart; }
  if (n >= 100000) {
    result += chunk(Math.floor(n / 100000)) + " Lakh ";
    n = n % 100000;
  }
  if (n >= 1000) {
    result += chunk(Math.floor(n / 1000)) + " Thousand ";
    n = n % 1000;
  }
  result += chunk(n);
  result = result.trim();

  if (decPart > 0) {
    result += " and " + chunk(decPart) + " Paise";
  }
  return "Rupees " + result + " Only";
}

// ── PDF Generator ────────────────────────────────────────

export function generateBillPDF(bill: Bill, settings: Settings): jsPDF {
  const doc = new jsPDF("p", "mm", "a4");
  const W = doc.internal.pageSize.getWidth(); // 210
  const H = doc.internal.pageSize.getHeight(); // 297
  const M = 15; // margin
  const CW = W - 2 * M; // content width = 180
  const calc = calculateBill(bill.items, bill.gstType);

  // ─── PAGE 1: TAX INVOICE ───

  let y = M;

  // ── Header: Logo + Shop Details ──
  if (settings.logo) {
    try {
      doc.addImage(settings.logo, "JPEG", M, y, 25, 25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(settings.shopName || "Shop", M + 28, y + 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      if (settings.shopAddress) {
        doc.text(settings.shopAddress, M + 28, y + 14);
      }
      if (settings.shopGSTIN) {
        doc.text(`GSTIN: ${settings.shopGSTIN}`, M + 28, y + 19);
      }
      y += 30;
    } catch {
      // invalid logo, skip
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(settings.shopName || "Shop", M, y + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    if (settings.shopAddress) {
      doc.text(settings.shopAddress, M, y + 14);
    }
    if (settings.shopGSTIN) {
      doc.text(`GSTIN: ${settings.shopGSTIN}`, M, y + 19);
    }
    y += settings.shopGSTIN ? 28 : settings.shopAddress ? 22 : 16;
  }

  // ── Tax Invoice title ──
  doc.setFillColor(30, 30, 30);
  doc.rect(M, y, CW, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TAX INVOICE", W / 2, y + 7, { align: "center" });
  doc.setTextColor(0, 0, 0);
  y += 14;

  // ── Invoice Meta + Buyer Info (two-column) ──
  const leftX = M;
  const rightX = W / 2 + 5;
  const midY = y;

  // Left: Invoice details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Invoice No:", leftX, y);
  doc.setFont("helvetica", "normal");
  doc.text(bill.id.slice(0, 16).toUpperCase(), leftX + 28, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Date:", leftX, y);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(bill.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), leftX + 28, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("GST Type:", leftX, y);
  doc.setFont("helvetica", "normal");
  doc.text(bill.gstType === "intra" ? "Intra-State (CGST + SGST)" : "Inter-State (IGST)", leftX + 28, y);

  // Right: Buyer details
  let ry = midY;
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", rightX, ry);
  ry += 5;
  doc.setFont("helvetica", "normal");
  doc.text(bill.customerName || "Walk-in Customer", rightX, ry);
  ry += 5;
  if (bill.customerPhone) {
    doc.text(`Ph: ${bill.customerPhone}`, rightX, ry);
    ry += 5;
  }

  y = Math.max(y, ry) + 8;

  // ── Items Table ──
  const isInter = bill.gstType === "inter";

  const headerRow = isInter
    ? ["#", "Description", "HSN", "Qty", "Rate", "Amount", "IGST", "Total"]
    : ["#", "Description", "HSN", "Qty", "Rate", "Amount", "CGST", "SGST", "Total"];

  const bodyRows = bill.items.map((item, i) => {
    const c = calc.items[i];
    const rowTotal = c.amount + c.gstAmount;
    if (isInter) {
      return [
        String(i + 1),
        item.name || "-",
        item.hsn || "-",
        String(item.quantity),
        formatCurrency(item.rate),
        formatCurrency(c.amount),
        formatCurrency(c.igst),
        formatCurrency(rowTotal),
      ];
    }
    return [
      String(i + 1),
      item.name || "-",
      item.hsn || "-",
      String(item.quantity),
      formatCurrency(item.rate),
      formatCurrency(c.amount),
      formatCurrency(c.cgst),
      formatCurrency(c.sgst),
      formatCurrency(rowTotal),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [headerRow],
    body: bodyRows,
    theme: "grid",
    margin: { left: M, right: M },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [30, 30, 30],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: isInter ? 40 : 32 },
      2: { halign: "center", cellWidth: 16 },
      3: { halign: "center", cellWidth: 12 },
      4: { halign: "right", cellWidth: 22 },
      5: { halign: "right", cellWidth: 22 },
      6: { halign: "right", cellWidth: 22 },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 4;

  // ── Summary Block (outside the table) ──
  const summaryX = M + CW - 72; // right-aligned block, 72mm wide
  const labelW = 38;
  const valW = 34;
  const lineH = 6;

  // Subtotal
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Subtotal", summaryX, y);
  doc.text(formatCurrency(calc.totalBeforeTax), summaryX + labelW + valW, y, { align: "right" });
  y += lineH;

  // Tax
  if (isInter) {
    doc.text("IGST", summaryX, y);
    doc.text(formatCurrency(calc.totalGST), summaryX + labelW + valW, y, { align: "right" });
  } else {
    doc.text("CGST", summaryX, y);
    doc.text(formatCurrency(calc.totalGST / 2), summaryX + labelW + valW, y, { align: "right" });
    y += lineH;
    doc.text("SGST", summaryX, y);
    doc.text(formatCurrency(calc.totalGST / 2), summaryX + labelW + valW, y, { align: "right" });
  }
  y += lineH;


  // Divider line
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.5);
  doc.line(summaryX, y - 2, summaryX + labelW + valW, y - 2);

  // Grand Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Grand Total", summaryX, y + 2);
  doc.text(formatCurrency(calc.grandTotal), summaryX + labelW + valW, y + 2, { align: "right" });
  y += lineH + 3;

  // ── Amount in Words ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Amount in Words:", M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const words = numberToWords(calc.grandTotal);
  doc.text(words, M + 32, y);

  y += 6;

  // ── Reverse Charge Declaration ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Reverse Charge: No", M, y);

  y += 5;

  // ── Signature line ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("For " + (settings.shopName || "Shop"), M, y);
  y += 15;
  doc.line(M, y, M + 40, y);
  doc.setFontSize(8);
  doc.text("Authorised Signatory", M, y + 4);

  // ─── PAGE 2: TERMS & CONDITIONS ───
  doc.addPage();

  y = M;

  // Title
  doc.setFillColor(30, 30, 30);
  doc.rect(M, y, CW, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TERMS & CONDITIONS", W / 2, y + 7, { align: "center" });
  doc.setTextColor(0, 0, 0);
  y += 16;

  // Terms
  const terms = [
    "1. Payment is due within 30 days from the date of invoice.",
    "2. Interest at 18% per annum will be charged on overdue payments.",
    "3. Goods once sold will not be taken back or exchanged.",
    "4. All disputes are subject to local jurisdiction only.",
    "5. This is a computer-generated invoice and does not require a physical signature.",
    "6. E. & O.E (Errors and Omissions Excepted).",
    "7. Subject to reverse charge mechanism as per GST regulations.",
    "8. Please verify the invoice details within 7 days of receipt.",
    "9. Any discrepancy must be reported within 7 days; thereafter the invoice will be deemed accepted.",
    "10. The seller reserves the right to modify terms without prior notice.",
  ];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Standard Terms & Conditions", M, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  for (const term of terms) {
    doc.text(term, M + 2, y);
    y += 5;
  }

  y += 6;

  // ── Bank Details ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Bank Details", M, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Bank Name: ${settings.shopName || "Your Bank"}`, M + 2, y);
  y += 5;
  doc.text("Account Name: " + (settings.shopName || "Your Name"), M + 2, y);
  y += 5;
  doc.text("Account No: XXXXXXXX", M + 2, y);
  y += 5;
  doc.text("IFSC Code: XXXXX000000", M + 2, y);
  y += 5;
  doc.text("UPI ID: yourname@upi", M + 2, y);

  y += 12;

  // ── Thank You ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Thank you for your business!", W / 2, y, { align: "center" });

  y += 15;

  // ── Footer ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("Generated by BillBuddy", M, H - M);
  doc.text(`Invoice: ${bill.id.slice(0, 8).toUpperCase()}`, W - M, H - M, { align: "right" });

  return doc;
}

// ── Download ──

export function downloadPDF(bill: Bill, settings: Settings): void {
  const doc = generateBillPDF(bill, settings);
  doc.save(`invoice-${bill.id.slice(0, 8)}.pdf`);
}

// ── Share ──

export function sharePDF(bill: Bill, settings: Settings): void {
  const doc = generateBillPDF(bill, settings);
  const blob = doc.output("blob");
  const file = new File([blob], `invoice-${bill.id.slice(0, 8)}.pdf`, { type: "application/pdf" });

  if (navigator.share) {
    navigator.share({
      title: `Invoice from ${settings.shopName || "Shop"}`,
      text: `Invoice from ${settings.shopName || "Shop"}, Total: ${formatCurrency(bill.grandTotal)}`,
      files: [file],
    }).catch(() => {
      downloadPDF(bill, settings);
    });
  } else {
    const msg = encodeURIComponent(
      `Invoice from ${settings.shopName || "Shop"}\nTotal: ${formatCurrency(bill.grandTotal)}\nDate: ${new Date(bill.date).toLocaleDateString("en-IN")}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
    downloadPDF(bill, settings);
  }
}

export function downloadBillJSON(bill: Bill, settings: Settings): void {
  const calc = calculateBill(bill.items, bill.gstType);
  const date = new Date(bill.date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  const data = {
    invoice: {
      id: bill.id,
      date: bill.date,
      customerName: bill.customerName,
      customerPhone: bill.customerPhone,
      gstType: bill.gstType,
      items: bill.items,
      totalBeforeTax: calc.totalBeforeTax,
      totalTax: calc.totalGST,
      grandTotal: calc.grandTotal,
    },
    shop: {
      name: settings.shopName,
      address: settings.shopAddress,
      gstin: settings.shopGSTIN,
    },
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bills-${year}-${month}-${bill.id.slice(0, 8)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
