import { Bill, Settings } from "./types";
import { calculateBill, formatCurrency } from "./gst";

// ── Helpers ──────────────────────────────────────────────

function pdfCurrency(n: number): string {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

export async function generateBillPDF(bill: Bill, settings: Settings) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF("p", "mm", "a4");
  const W = doc.internal.pageSize.getWidth(); // 210
  const H = doc.internal.pageSize.getHeight(); // 297
  const M = 15; // margin
  const CW = W - 2 * M; // content width = 180
  const calc = calculateBill(bill.items, bill.gstType);

  // Colors
  const indigo = [79, 70, 229] as const;
  const dark = [30, 41, 59] as const;
  const gray50 = [248, 250, 252] as const;
  const gray100 = [241, 245, 249] as const;
  const gray300 = [203, 213, 225] as const;
  const gray400 = [148, 163, 184] as const;
  const gray500 = [100, 116, 139] as const;
  const white = [255, 255, 255] as const;

  // ─── PAGE 1: TAX INVOICE ───

  let y = M;

  // ── Top accent bar ──
  doc.setFillColor(...indigo);
  doc.rect(0, 0, W, 3, "F");
  y = M;

  // ── Header: Shop Details ──
  const hasLogo = !!settings.logo;
  if (hasLogo) {
    try {
      doc.addImage(settings.logo, "JPEG", M, y, 20, 20);
    } catch {
      // invalid logo, treat as no logo
    }
  }

  const headerX = hasLogo ? M + 23 : M;

  // Shop name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...dark);
  doc.text(settings.shopName || "Your Shop Name", headerX, y + 7);

  // Address line
  if (settings.shopAddress) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...gray500);
    doc.text(settings.shopAddress, headerX, y + 13);
  }

  // GSTIN
  if (settings.shopGSTIN) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...indigo);
    doc.text(`GSTIN: ${settings.shopGSTIN}`, headerX, y + 19);
  }

  // Right side: TAX INVOICE label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...indigo);
  doc.text("TAX INVOICE", W - M, y + 7, { align: "right" });

  y += hasLogo ? 26 : settings.shopGSTIN ? 24 : settings.shopAddress ? 18 : 12;

  // ── Thin separator ──
  doc.setDrawColor(...indigo);
  doc.setLineWidth(0.8);
  doc.line(M, y, W - M, y);
  y += 6;

  // ── Invoice Meta + Buyer Info (two-column) ──
  const leftX = M;
  const rightX = W / 2 + 5;

  // Helper: label-value pair
  const metaLine = (label: string, value: string, lx: number, ly: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...gray500);
    doc.text(label, lx, ly);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    doc.text(value, lx + 25, ly);
  };

  // Left: Invoice details
  metaLine("Invoice No:", bill.id.slice(0, 16).toUpperCase(), leftX, y);
  y += 5;
  metaLine("Date:", new Date(bill.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), leftX, y);
  y += 5;
  metaLine("GST Type:", bill.gstType === "intra" ? "Intra-State (CGST + SGST)" : "Inter-State (IGST)", leftX, y);

  // Right: Buyer details
  let ry = y - 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...gray500);
  doc.text("Bill To:", rightX, ry);
  ry += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  doc.text(bill.customerName || "Walk-in Customer", rightX, ry);
  if (bill.customerPhone) {
    ry += 5;
    doc.setFontSize(8);
    doc.setTextColor(...gray500);
    doc.text(`Ph: ${bill.customerPhone}`, rightX, ry);
  }

  y += 10;

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
        item.name,
        item.hsn || "-",
        String(item.quantity),
        pdfCurrency(item.rate),
        pdfCurrency(c.amount),
        pdfCurrency(c.igst),
        pdfCurrency(rowTotal),
      ];
    }
    return [
      String(i + 1),
      item.name,
      item.hsn || "-",
      String(item.quantity),
      pdfCurrency(item.rate),
      pdfCurrency(c.amount),
      pdfCurrency(c.cgst),
      pdfCurrency(c.sgst),
      pdfCurrency(rowTotal),
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
      textColor: [...dark],
      lineColor: [...gray300],
      lineWidth: 0.2,
      overflow: "visible",
    },
    headStyles: {
      fillColor: [...indigo],
      textColor: [...white],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
      cellPadding: 3,
      lineColor: [...indigo],
      lineWidth: 0.3,
    },
    alternateRowStyles: {
      fillColor: [...gray50],
    },
    columnStyles: isInter
      ? {
          0: { halign: "center", cellWidth: 8 },
          1: { halign: "left" },
          2: { halign: "center", cellWidth: 14 },
          3: { halign: "center", cellWidth: 10 },
          4: { halign: "right", cellWidth: 22 },
          5: { halign: "right", cellWidth: 22 },
          6: { halign: "right", cellWidth: 22 },
          7: { halign: "right", cellWidth: 24 },
        }
      : {
          0: { halign: "center", cellWidth: 8 },
          1: { halign: "left" },
          2: { halign: "center", cellWidth: 14 },
          3: { halign: "center", cellWidth: 10 },
          4: { halign: "right", cellWidth: 22 },
          5: { halign: "right", cellWidth: 22 },
          6: { halign: "right", cellWidth: 20 },
          7: { halign: "right", cellWidth: 20 },
          8: { halign: "right", cellWidth: 24 },
        },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 5;

  // ── Summary Block (right-aligned) ──
  const summaryW = 88;
  const summaryX = M + CW - summaryW;
  const lineH = 6;

  // Subtotal
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...gray500);
  doc.text("Subtotal", summaryX, y + 1);
  doc.setTextColor(...dark);
  doc.text(pdfCurrency(calc.totalBeforeTax), M + CW, y + 1, { align: "right" });
  y += lineH;

  // Tax lines
  if (isInter) {
    doc.setTextColor(...gray500);
    doc.text("IGST", summaryX, y + 1);
    doc.setTextColor(...dark);
    doc.text(pdfCurrency(calc.totalGST), M + CW, y + 1, { align: "right" });
  } else {
    doc.setTextColor(...gray500);
    doc.text("CGST", summaryX, y + 1);
    doc.setTextColor(...dark);
    doc.text(pdfCurrency(calc.totalGST / 2), M + CW, y + 1, { align: "right" });
    y += lineH;
    doc.setTextColor(...gray500);
    doc.text("SGST", summaryX, y + 1);
    doc.setTextColor(...dark);
    doc.text(pdfCurrency(calc.totalGST / 2), M + CW, y + 1, { align: "right" });
  }
  y += lineH;

  // Divider
  doc.setDrawColor(...gray400);
  doc.setLineWidth(0.4);
  doc.line(summaryX, y, M + CW, y);
  y += 4;

  // Grand Total with highlight
  doc.setFillColor(...indigo);
  doc.roundedRect(summaryX - 2, y - 4, summaryW + 2, 9, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...white);
  doc.text("Grand Total", summaryX + 2, y + 1);
  doc.text(pdfCurrency(calc.grandTotal), M + CW - 2, y + 1, { align: "right" });
  y += lineH + 5;

  // ── Amount in Words ──
  doc.setFillColor(...gray100);
  doc.roundedRect(M, y - 3, CW, 9, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...dark);
  doc.text("Amount in Words:", M + 3, y + 2);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...gray500);
  doc.text(numberToWords(calc.grandTotal), M + 35, y + 2);
  y += 12;

  // ── Reverse Charge ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...gray500);
  doc.text("Reverse Charge: No", M, y);
  y += 10;

  // ── Signature block (right-aligned) ──
  const sigX = W - M - 55;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...dark);
  doc.text("For " + (settings.shopName || "Shop"), sigX + 27.5, y, { align: "center" });
  y += 12;
  doc.setDrawColor(...gray400);
  doc.setLineWidth(0.3);
  doc.line(sigX, y, sigX + 55, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...gray400);
  doc.text("Authorised Signatory", sigX + 27.5, y, { align: "center" });

  // ── Footer bar ──
  doc.setFillColor(...indigo);
  doc.rect(0, H - 8, W, 8, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...white);
  doc.text("Generated by BillBuddy", M, H - 3);
  doc.text(`Invoice: ${bill.id.slice(0, 8).toUpperCase()}`, W - M, H - 3, { align: "right" });

  // ─── PAGE 2: TERMS & CONDITIONS ───
  doc.addPage();

  y = M;

  // Top accent bar
  doc.setFillColor(...indigo);
  doc.rect(0, 0, W, 3, "F");
  y = M;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...indigo);
  doc.text("TERMS & CONDITIONS", M, y + 6);
  y += 10;

  // Separator
  doc.setDrawColor(...indigo);
  doc.setLineWidth(0.5);
  doc.line(M, y, W - M, y);
  y += 8;

  // Terms
  const terms = [
    "Payment is due within 30 days from the date of invoice.",
    "Interest at 18% per annum will be charged on overdue payments.",
    "Goods once sold will not be taken back or exchanged.",
    "All disputes are subject to local jurisdiction only.",
    "This is a computer-generated invoice and does not require a physical signature.",
    "E. & O.E (Errors and Omissions Excepted).",
    "Subject to reverse charge mechanism as per GST regulations.",
    "Please verify the invoice details within 7 days of receipt.",
    "Any discrepancy must be reported within 7 days; thereafter the invoice will be deemed accepted.",
    "The seller reserves the right to modify terms without prior notice.",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  for (let i = 0; i < terms.length; i++) {
    if (i % 2 === 0) {
      doc.setFillColor(...gray50);
      doc.rect(M - 2, y - 3.5, CW + 4, 6, "F");
    }
    doc.setTextColor(...indigo);
    doc.setFont("helvetica", "bold");
    doc.text(`${i + 1}.`, M + 2, y);
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "normal");
    doc.text(terms[i], M + 10, y);
    y += 6;
  }

  y += 10;

  // ── Bank Details Box ──
  doc.setFillColor(...gray100);
  doc.roundedRect(M, y - 4, CW, 42, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...indigo);
  doc.text("Bank Details", M + 5, y + 2);
  y += 8;

  const bankField = (label: string, value: string, bx: number, by: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...gray500);
    doc.text(label, bx, by);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    doc.text(value, bx + 32, by);
  };

  bankField("Bank Name:", settings.shopName || "Your Bank", M + 5, y);
  y += 7;
  bankField("Account Name:", settings.shopName || "Your Name", M + 5, y);
  y += 7;
  bankField("Account No:", "XXXXXXXX", M + 5, y);
  y += 7;
  bankField("IFSC Code:", "XXXXX000000", M + 5, y);
  y += 7;
  bankField("UPI ID:", "yourname@upi", M + 5, y);

  y += 18;

  // ── Thank You ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...indigo);
  doc.text("Thank you for your business!", W / 2, y, { align: "center" });

  // ── Footer bar ──
  doc.setFillColor(...indigo);
  doc.rect(0, H - 8, W, 8, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...white);
  doc.text("Generated by BillBuddy", M, H - 3);
  doc.text(`Invoice: ${bill.id.slice(0, 8).toUpperCase()}`, W - M, H - 3, { align: "right" });

  return doc;
}

// ── Download ──

export async function downloadPDF(bill: Bill, settings: Settings): Promise<void> {
  const doc = await generateBillPDF(bill, settings);
  doc.save(`invoice-${bill.id.slice(0, 8)}.pdf`);
}

// ── Share ──

export async function sharePDF(bill: Bill, settings: Settings): Promise<void> {
  const doc = await generateBillPDF(bill, settings);
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
