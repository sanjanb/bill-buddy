"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Bill, BillItem, Product, Settings, GST_RATES, DEFAULT_SETTINGS } from "@/lib/types";
import { getBills, saveBill, deleteBill, getSettings, getProducts } from "@/lib/storage";
import { calculateBill, formatCurrency } from "@/lib/gst";
import { downloadPDF, sharePDF } from "@/lib/pdf";

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function newItem(gstRate: number): BillItem {
  return { name: "", hsn: "", quantity: 1, rate: 0, gstRate };
}

export default function Home() {
  const [bills, setBills] = useState<Bill[]>(() => typeof window !== "undefined" ? getBills() : []);
  const [settings] = useState<Settings>(() => typeof window !== "undefined" ? getSettings() : DEFAULT_SETTINGS);
  const [view, setView] = useState<"list" | "form">("list");
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");

  // Form state: initialize items with settings default GST rate
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [gstType, setGstType] = useState<"intra" | "inter">("intra");
  const [items, setItems] = useState<BillItem[]>(() => {
    const s = typeof window !== "undefined" ? getSettings() : DEFAULT_SETTINGS;
    return [newItem(s.defaultGSTRate)];
  });

  const calc = calculateBill(items, gstType);

  const updateItem = useCallback((i: number, field: keyof BillItem, value: string | number) => {
    setItems((prev) =>
      prev.map((it, idx) =>
        idx === i ? { ...it, [field]: value } : it
      )
    );
  }, []);

  const addItem = () => setItems((prev) => [...prev, newItem(settings.defaultGSTRate)]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const pickFromCatalog = (product: Product) => {
    setItems((prev) => [...prev, { name: product.name, hsn: product.hsn, quantity: 1, rate: product.rate, gstRate: product.gstRate }]);
    setShowCatalogPicker(false);
    setCatalogSearch("");
  };

  function buildBill(): Bill {
    return {
      id: makeId(),
      date: new Date().toISOString(),
      customerName,
      customerPhone,
      gstType,
      items,
      totalBeforeTax: calc.totalBeforeTax,
      totalTax: calc.totalGST,
      grandTotal: calc.grandTotal,
    };
  }

  function handleSave() {
    const bill = buildBill();
    saveBill(bill);
    setBills(getBills());
    setView("list");
    resetForm();
  }

  function handleSaveAndDownload() {
    const bill = buildBill();
    saveBill(bill);
    setBills(getBills());
    downloadPDF(bill, settings);
    setView("list");
    resetForm();
  }

  function handleShare() {
    const bill = buildBill();
    saveBill(bill);
    setBills(getBills());
    sharePDF(bill, settings);
    setView("list");
    resetForm();
  }

  function resetForm() {
    setCustomerName("");
    setCustomerPhone("");
    setGstType("intra");
    setItems([newItem(settings.defaultGSTRate)]);
  }

  function handleDelete(id: string) {
    deleteBill(id);
    setBills(getBills());
  }

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-50">
      {view === "list" ? (
        /* ---- BILL LIST ---- */
        <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">BillBuddy</h1>
            </div>
            <Link href="/settings" className="text-slate-400 hover:text-slate-600 p-2.5 rounded-xl hover:bg-slate-100 transition-colors duration-150" aria-label="Settings">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <Link href="/catalog" className="text-slate-400 hover:text-slate-600 p-2.5 rounded-xl hover:bg-slate-100 transition-colors duration-150" aria-label="Product Catalog">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </Link>
          </div>

          {/* CTA */}
          <button
            onClick={() => setView("form")}
            className="w-full bg-indigo-600 text-white py-3.5 px-5 rounded-xl font-semibold text-base hover:bg-indigo-700 active:bg-indigo-800 active:scale-[0.98] transition-all duration-150 mb-8 shadow-sm shadow-indigo-200 min-h-[52px]"
          >
            + New Bill
          </button>

          {bills.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-slate-700 mb-1">No bills yet</p>
              <p className="text-sm text-slate-400">Create your first invoice to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bills.map((bill) => (
                <div key={bill.id} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-base truncate">{bill.customerName || "Walk-in"}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(bill.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="font-bold text-slate-900 text-lg leading-tight">{formatCurrency(bill.grandTotal)}</p>
                      <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 ${bill.gstType === "intra" ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200/60" : "bg-purple-50 text-purple-600 ring-1 ring-purple-200/60"}`}>
                        {bill.gstType === "intra" ? "Intra" : "Inter"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => downloadPDF(bill, settings)}
                      className="flex-1 text-sm font-medium py-2.5 px-3 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors duration-150 min-h-[44px]"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => sharePDF(bill, settings)}
                      className="flex-1 text-sm font-medium py-2.5 px-3 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:bg-emerald-200 transition-colors duration-150 min-h-[44px]"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => handleDelete(bill.id)}
                      className="text-sm font-medium py-2.5 px-3 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 active:bg-red-200 transition-colors duration-150 min-h-[44px] border border-red-200/60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ---- BILL FORM ---- */
        <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <button onClick={() => setView("list")} className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors duration-150 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-slate-900">New Bill</h1>
          </div>

          {/* Customer */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 mb-4 shadow-sm">
            <h2 className="font-semibold text-slate-500 mb-3 text-xs uppercase tracking-wider">Customer</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Customer Name</label>
                <input
                  type="text"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-3 text-sm text-slate-900 placeholder-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-3 text-sm text-slate-900 placeholder-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* GST Type */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 mb-4 shadow-sm">
            <h2 className="font-semibold text-slate-500 mb-3 text-xs uppercase tracking-wider">GST Type</h2>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50 p-1">
              <button
                onClick={() => setGstType("intra")}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 min-h-[44px] ${gstType === "intra" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                  }`}
              >
                Intra-State
              </button>
              <button
                onClick={() => setGstType("inter")}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 min-h-[44px] ${gstType === "inter" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                  }`}
              >
                Inter-State
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2.5 pl-1">
              {gstType === "intra" ? "Applies CGST + SGST" : "Applies IGST"}
            </p>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 mb-4 shadow-sm">
            <h2 className="font-semibold text-slate-500 mb-3 text-xs uppercase tracking-wider">Items</h2>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="border border-slate-200/80 rounded-xl p-3.5 bg-slate-50/30">
                  <div className="flex gap-2 mb-2.5">
                    <input
                      type="text"
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateItem(i, "name", e.target.value)}
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-300 bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[44px]"
                    />
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(i)}
                        className="text-slate-300 hover:text-red-500 px-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors duration-150"
                        aria-label="Remove item"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 pl-0.5">HSN</label>
                      <input
                        type="text"
                        placeholder="Code"
                        value={item.hsn}
                        onChange={(e) => updateItem(i, "hsn", e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-900 placeholder-slate-300 bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[40px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 pl-0.5">Qty</label>
                      <input
                        type="number"
                        placeholder="1"
                        min={1}
                        value={item.quantity || ""}
                        onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-900 placeholder-slate-300 bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[40px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 pl-0.5">Rate</label>
                      <input
                        type="number"
                        placeholder="0"
                        min={0}
                        value={item.rate || ""}
                        onChange={(e) => updateItem(i, "rate", parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-900 placeholder-slate-300 bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[40px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 pl-0.5">GST%</label>
                      <select
                        value={item.gstRate}
                        onChange={(e) => updateItem(i, "gstRate", parseInt(e.target.value))}
                        className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-900 bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[40px]"
                      >
                        {GST_RATES.map((r) => (
                          <option key={r} value={r}>{r}%</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-right font-medium">
                    {formatCurrency(item.quantity * item.rate)}
                  </p>
                </div>
              ))}
            </div>

            {/* Catalog picker */}
            {showCatalogPicker && (
              <CatalogPicker
                search={catalogSearch}
                onSearchChange={setCatalogSearch}
                onSelect={pickFromCatalog}
                onClose={() => { setShowCatalogPicker(false); setCatalogSearch(""); }}
              />
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowCatalogPicker(!showCatalogPicker)}
                className="flex-1 py-3 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-500 font-medium hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-150 min-h-[48px] text-sm"
              >
                {showCatalogPicker ? "Close Catalog" : "Pick from Catalog"}
              </button>
              <button
                onClick={addItem}
                className="flex-1 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-medium hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all duration-150 min-h-[48px] text-sm"
              >
                + Add Empty
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 mb-6 shadow-sm">
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-medium text-slate-700">{formatCurrency(calc.totalBeforeTax)}</span>
              </div>
              {gstType === "intra" ? (
                <>
                  <div className="flex justify-between text-slate-500">
                    <span>CGST</span>
                    <span className="font-medium text-slate-700">{formatCurrency(calc.totalGST / 2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>SGST</span>
                    <span className="font-medium text-slate-700">{formatCurrency(calc.totalGST / 2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-500">
                  <span>IGST</span>
                  <span className="font-medium text-slate-700">{formatCurrency(calc.totalGST)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg text-slate-900 pt-3 border-t border-slate-100">
                <span>Total</span>
                <span>{formatCurrency(calc.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSaveAndDownload}
              className="w-full bg-indigo-600 text-white py-3.5 px-5 rounded-xl font-semibold hover:bg-indigo-700 active:bg-indigo-800 active:scale-[0.98] transition-all duration-150 shadow-sm shadow-indigo-200 min-h-[52px]"
            >
              Save & Download PDF
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="flex-1 bg-emerald-500 text-white py-3.5 px-4 rounded-xl font-semibold hover:bg-emerald-600 active:bg-emerald-700 active:scale-[0.98] transition-all duration-150 min-h-[52px]"
              >
                Share
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-slate-100 text-slate-600 py-3.5 px-4 rounded-xl font-semibold hover:bg-slate-200 active:bg-slate-300 active:scale-[0.98] transition-all duration-150 min-h-[52px]"
              >
                Save Only
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CatalogPicker({ search, onSearchChange, onSelect }: {
  search: string;
  onSearchChange: (v: string) => void;
  onSelect: (product: Product) => void;
}) {
  const products = typeof window !== "undefined" ? getProducts() : [];
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.hsn.includes(search)
  );

  return (
    <div className="border border-indigo-200 rounded-xl p-3.5 bg-indigo-50/20 mt-3">
      <input
        type="text"
        placeholder="Search catalog..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-300 bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[44px] mb-2"
      />
      {filtered.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-3">
          {products.length === 0 ? "No products in catalog yet" : "No matches"}
        </p>
      ) : (
        <div className="max-h-48 overflow-y-auto space-y-1.5">
          {filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => onSelect(product)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200/60 hover:border-indigo-200 transition-colors duration-150 text-left min-h-[44px]"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                <p className="text-[10px] text-slate-400">
                  {product.hsn && `HSN ${product.hsn} · `}{product.gstRate}% GST
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-700 ml-2">
                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(product.rate)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
