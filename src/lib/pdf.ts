import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Bill, Settings } from "./types";
import { calculateBill } from "./gst";

// ── Helpers ──────────────────────────────────────────────

function formatPDFCurrency(amount: number): string {
  return "Rs. " + amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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

  // ── Design Tokens ──
  const BRAND = [79, 70, 229] as [number, number, number]; // Indigo 600
  const TEXT_MAIN = [31, 41, 55] as [number, number, number]; // Gray 800
  const TEXT_MUTED = [107, 114, 128] as [number, number, number]; // Gray 500
  const BG_LIGHT = [249, 250, 251] as [number, number, number]; // Gray 50

  // ─── PAGE 1: TAX INVOICE ───
  let y = M;

  // Top Accent Bar
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, W, 4, "F");
  
  y += 5; // Move down below the bar

  // ── Header Section ──
  // Left: Logo & Shop Details
  if (settings.logo) {
    try {
      doc.addImage(settings.logo, "JPEG", M, y, 22, 22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(...TEXT_MAIN);
      doc.text(settings.shopName || "Shop", M + 26, y + 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...TEXT_MUTED);
      if (settings.shopAddress) doc.text(settings.shopAddress, M + 26, y + 14);
      if (settings.shopGSTIN) doc.text(`GSTIN: ${settings.shopGSTIN}`, M + 26, y + 19);
    } catch {
      // fallback
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...TEXT_MAIN);
    doc.text(settings.shopName || "Shop", M, y + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_MUTED);
    if (settings.shopAddress) doc.text(settings.shopAddress, M, y + 14);
    if (settings.shopGSTIN) doc.text(`GSTIN: ${settings.shopGSTIN}`, M, y + 19);
  }

  // Right: Title & Invoice Meta
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...BRAND);
  doc.text("TAX INVOICE", W - M, y + 8, { align: "right" });

  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont("helvetica", "bold");
  
  const metaY = y + 18;
  doc.text("Invoice No:", W - M - 40, metaY);
  doc.text("Date:", W - M - 40, metaY + 5);
  doc.text("GST Type:", W - M - 40, metaY + 10);
  if (bill.dueDate) doc.text("Due Date:", W - M - 40, metaY + 15);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_MAIN);
  doc.text(bill.invoiceNumber || bill.id.slice(0, 16).toUpperCase(), W - M, metaY, { align: "right" });
  doc.text(new Date(bill.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), W - M, metaY + 5, { align: "right" });
  doc.text(bill.gstType === "intra" ? "Intra-State" : "Inter-State", W - M, metaY + 10, { align: "right" });
  if (bill.dueDate) {
    doc.text(new Date(bill.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), W - M, metaY + 15, { align: "right" });
  }

  y += Math.max(35, bill.dueDate ? 40 : 35);

  // ── Bill To Section ──
  doc.setFillColor(...BG_LIGHT);
  doc.roundedRect(M, y, CW, 25, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("BILL TO", M + 5, y + 8);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_MAIN);
  doc.text(bill.customerName || "Walk-in Customer", M + 5, y + 14);
  
  if (bill.customerPhone) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Ph: ${bill.customerPhone}`, M + 5, y + 20);
  }

  y += 35;

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
        formatPDFCurrency(item.rate),
        formatPDFCurrency(c.amount),
        formatPDFCurrency(c.igst),
        formatPDFCurrency(rowTotal),
      ];
    }
    return [
      String(i + 1),
      item.name || "-",
      item.hsn || "-",
      String(item.quantity),
      formatPDFCurrency(item.rate),
      formatPDFCurrency(c.amount),
      formatPDFCurrency(c.cgst),
      formatPDFCurrency(c.sgst),
      formatPDFCurrency(rowTotal),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [headerRow],
    body: bodyRows,
    theme: "striped",
    margin: { left: M, right: M },
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: 5,
      textColor: TEXT_MAIN,
    },
    headStyles: {
      fillColor: BRAND,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: BG_LIGHT,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: isInter ? 40 : 34 },
      2: { halign: "center", cellWidth: 16 },
      3: { halign: "center", cellWidth: 12 },
      4: { halign: "right", cellWidth: 22 },
      5: { halign: "right", cellWidth: 22 },
      6: { halign: "right", cellWidth: 20 },
      7: { halign: "right", cellWidth: isInter ? 22 : 20 },
      8: { halign: "right", cellWidth: 24 },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Summary Block ──
  const summaryX = M + CW - 75; 
  const labelW = 35;
  const valW = 40;
  const lineH = 7;

  // Subtotal
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Subtotal", summaryX, y);
  doc.setTextColor(...TEXT_MAIN);
  doc.text(formatPDFCurrency(calc.totalBeforeTax), summaryX + labelW + valW, y, { align: "right" });
  y += lineH;

  // Tax
  if (isInter) {
    doc.setTextColor(...TEXT_MUTED);
    doc.text("IGST", summaryX, y);
    doc.setTextColor(...TEXT_MAIN);
    doc.text(formatPDFCurrency(calc.totalGST), summaryX + labelW + valW, y, { align: "right" });
  } else {
    doc.setTextColor(...TEXT_MUTED);
    doc.text("CGST", summaryX, y);
    doc.setTextColor(...TEXT_MAIN);
    doc.text(formatPDFCurrency(calc.totalGST / 2), summaryX + labelW + valW, y, { align: "right" });
    y += lineH;
    doc.setTextColor(...TEXT_MUTED);
    doc.text("SGST", summaryX, y);
    doc.setTextColor(...TEXT_MAIN);
    doc.text(formatPDFCurrency(calc.totalGST / 2), summaryX + labelW + valW, y, { align: "right" });
  }
  y += lineH;

  // Divider
  doc.setDrawColor(229, 231, 235); // Gray 200
  doc.setLineWidth(0.5);
  doc.line(summaryX, y - 3, summaryX + labelW + valW, y - 3);

  // Grand Total Block
  doc.setFillColor(...BG_LIGHT);
  doc.roundedRect(summaryX - 5, y - 1, labelW + valW + 10, 10, 2, 2, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND);
  doc.text("Grand Total", summaryX, y + 5.5);
  doc.text(formatPDFCurrency(calc.grandTotal), summaryX + labelW + valW, y + 5.5, { align: "right" });
  y += lineH + 10;

  // ── Amount in Words ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Amount in Words:", M, y);
  
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(...TEXT_MAIN);
  const words = numberToWords(calc.grandTotal);
  doc.text(words, M, y + 6);

  y += 15;

  // ── Notes & Reverse Charge ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Reverse Charge: No", M, y);
  y += 6;

  if (bill.notes) {
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", M, y);
    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(bill.notes, CW / 2); // only take half width to leave space for signature
    doc.text(noteLines, M, y + 5);
  }

  // ── Signature line ──
  const sigY = y + 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_MAIN);
  doc.text("For " + (settings.shopName || "Shop"), W - M, sigY, { align: "right" });
  
  doc.setDrawColor(156, 163, 175); // Gray 400
  doc.setLineWidth(0.3);
  doc.line(W - M - 50, sigY + 15, W - M, sigY + 15);
  
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Authorised Signatory", W - M, sigY + 20, { align: "right" });

  // ─── PAGE 2: TERMS & CONDITIONS ───
  doc.addPage();
  
  y = M;

  // Top Accent Bar
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, W, 4, "F");
  
  y += 15;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...TEXT_MAIN);
  doc.text("TERMS & CONDITIONS", M, y);
  y += 10;
  
  doc.setDrawColor(229, 231, 235);
  doc.line(M, y, W - M, y);
  y += 10;

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

  doc.setFontSize(10);
  doc.text("Standard Terms & Conditions", M, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_MUTED);
  for (const term of terms) {
    doc.text(term, M, y);
    y += 6.5;
  }
  
  y += 10;
  doc.setDrawColor(229, 231, 235);
  doc.line(M, y, W - M, y);
  y += 10;

  // ── Bank Details ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_MAIN);
  doc.text("Bank Details", M, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Bank Name: ${settings.shopName || "Your Bank"}`, M, y);
  y += 6.5;
  doc.text("Account Name: " + (settings.shopName || "Your Name"), M, y);
  y += 6.5;
  doc.text("Account No: XXXXXXXX", M, y);
  y += 6.5;
  doc.text("IFSC Code: XXXXX000000", M, y);
  y += 6.5;
  doc.text("UPI ID: yourname@upi", M, y);

  y += 20;

  // ── Thank You ──
  doc.setFillColor(...BG_LIGHT);
  doc.roundedRect(M, y, CW, 20, 2, 2, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...BRAND);
  doc.text("Thank you for your business!", W / 2, y + 12, { align: "center" });

  // ── Footer (both pages) ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text("Generated by BillBuddy", M, H - 10);
    doc.text(`Invoice: ${bill.invoiceNumber || bill.id.slice(0, 8).toUpperCase()} | Page ${i} of ${pageCount}`, W - M, H - 10, { align: "right" });
  }

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
      text: `Invoice from ${settings.shopName || "Shop"}, Total: ${formatPDFCurrency(bill.grandTotal)}`,
      files: [file],
    }).catch(() => {
      downloadPDF(bill, settings);
    });
  } else {
    const msg = encodeURIComponent(
      `Invoice from ${settings.shopName || "Shop"}\nTotal: ${formatPDFCurrency(bill.grandTotal)}\nDate: ${new Date(bill.date).toLocaleDateString("en-IN")}`
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
      invoiceNumber: bill.invoiceNumber,
      dueDate: bill.dueDate,
      notes: bill.notes,
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

