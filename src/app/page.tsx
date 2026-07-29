"use client";

import { useState, useEffect, useCallback } from "react";
import { Bill, BillItem, Settings, GST_RATES, DEFAULT_SETTINGS } from "@/lib/types";
import { getBills, saveBill, deleteBill, getSettings } from "@/lib/storage";
import { calculateBill, formatCurrency } from "@/lib/gst";
import { downloadPDF, sharePDF } from "@/lib/pdf";

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function newItem(gstRate: number): BillItem {
  return { name: "", hsn: "", quantity: 1, rate: 0, gstRate };
}

export default function Home() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [view, setView] = useState<"list" | "form">("list");
  const [mounted, setMounted] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [gstType, setGstType] = useState<"intra" | "inter">("intra");
  const [items, setItems] = useState<BillItem[]>([newItem(18)]);

  useEffect(() => {
    setBills(getBills());
    setSettings(getSettings());
    setMounted(true);
  }, []);

  // Update default GST rate when settings load
  useEffect(() => {
    if (settings.defaultGSTRate !== 18) {
      setItems((prev) =>
        prev.map((it) =>
          it.gstRate === 18 ? { ...it, gstRate: settings.defaultGSTRate } : it
        )
      );
    }
  }, [settings.defaultGSTRate]);

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

  if (!mounted) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-gray-50">
      {view === "list" ? (
        /* ---- BILL LIST ---- */
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">BillBuddy</h1>
            <a href="/settings" className="text-gray-500 hover:text-gray-700 p-2" aria-label="Settings">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </a>
          </div>

          <button
            onClick={() => setView("form")}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors mb-6 min-h-[48px]"
          >
            + New Bill
          </button>

          {bills.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-5xl mb-4">📄</p>
              <p className="text-lg font-medium">No bills yet</p>
              <p className="text-sm mt-1">Tap &quot;New Bill&quot; to create your first invoice</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bills.map((bill) => (
                <div key={bill.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{bill.customerName || "Walk-in"}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(bill.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-lg">{formatCurrency(bill.grandTotal)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${bill.gstType === "intra" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                        {bill.gstType === "intra" ? "Intra" : "Inter"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => downloadPDF(bill, settings)}
                      className="flex-1 text-sm py-2 px-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 min-h-[40px]"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => sharePDF(bill, settings)}
                      className="flex-1 text-sm py-2 px-3 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 min-h-[40px]"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => handleDelete(bill.id)}
                      className="text-sm py-2 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 min-h-[40px]"
                    >
                      Del
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ---- BILL FORM ---- */
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setView("list")} className="text-gray-500 hover:text-gray-700 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">New Bill</h1>
          </div>

          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Customer</h2>
            <input
              type="text"
              placeholder="Customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 mb-3 text-sm"
            />
            <input
              type="tel"
              placeholder="Phone number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>

          {/* GST Type */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">GST Type</h2>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setGstType("intra")}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
                  gstType === "intra" ? "bg-indigo-600 text-white" : "bg-white text-gray-700"
                }`}
              >
                Intra-State
              </button>
              <button
                onClick={() => setGstType("inter")}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
                  gstType === "inter" ? "bg-indigo-600 text-white" : "bg-white text-gray-700"
                }`}
              >
                Inter-State
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {gstType === "intra" ? "CGST + SGST" : "IGST"}
            </p>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Items</h2>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateItem(i, "name", e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[40px]"
                    />
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(i)}
                        className="text-red-400 hover:text-red-600 px-2 min-h-[40px] min-w-[40px] flex items-center justify-center"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="HSN"
                      value={item.hsn}
                      onChange={(e) => updateItem(i, "hsn", e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-2 text-sm min-h-[40px]"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      min={1}
                      value={item.quantity || ""}
                      onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 0)}
                      className="border border-gray-300 rounded-lg px-2 py-2 text-sm min-h-[40px]"
                    />
                    <input
                      type="number"
                      placeholder="Rate"
                      min={0}
                      value={item.rate || ""}
                      onChange={(e) => updateItem(i, "rate", parseFloat(e.target.value) || 0)}
                      className="border border-gray-300 rounded-lg px-2 py-2 text-sm min-h-[40px]"
                    />
                    <select
                      value={item.gstRate}
                      onChange={(e) => updateItem(i, "gstRate", parseInt(e.target.value))}
                      className="border border-gray-300 rounded-lg px-2 py-2 text-sm min-h-[40px] bg-white"
                    >
                      {GST_RATES.map((r) => (
                        <option key={r} value={r}>{r}%</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {formatCurrency(item.quantity * item.rate)}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={addItem}
              className="w-full mt-3 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-medium hover:border-indigo-400 hover:text-indigo-600 transition-colors min-h-[44px]"
            >
              + Add Item
            </button>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(calc.totalBeforeTax)}</span>
              </div>
              {gstType === "intra" ? (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>CGST</span>
                    <span>{formatCurrency(calc.totalGST / 2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>SGST</span>
                    <span>{formatCurrency(calc.totalGST / 2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-gray-600">
                  <span>IGST</span>
                  <span>{formatCurrency(calc.totalGST)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(calc.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSaveAndDownload}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors min-h-[48px]"
            >
              Save & Download PDF
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-700 active:bg-green-800 transition-colors min-h-[48px]"
              >
                Share
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-300 transition-colors min-h-[48px]"
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
