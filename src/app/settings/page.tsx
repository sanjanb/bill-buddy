"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Settings, GST_RATES, DEFAULT_SETTINGS } from "@/lib/types";
import { getSettings, saveSettings } from "@/lib/storage";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(() => typeof window !== "undefined" ? getSettings() : DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSettings((s) => ({ ...s, logo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    saveSettings(settings);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Link href="/" className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors duration-150 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Settings</h1>
        </div>
        <div className="h-px bg-gradient-to-r from-indigo-500/40 via-indigo-400/20 to-transparent mb-6" />

        {/* Shop Details */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 mb-4 shadow-sm">
          <h2 className="font-semibold text-slate-500 mb-3 text-xs uppercase tracking-wider">Shop Details</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Shop Name</label>
              <input
                type="text"
                value={settings.shopName}
                onChange={(e) => setSettings((s) => ({ ...s, shopName: e.target.value }))}
                placeholder="My Shop"
                disabled={!editing}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-3 text-sm text-slate-900 placeholder-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Shop Address</label>
              <textarea
                value={settings.shopAddress}
                onChange={(e) => setSettings((s) => ({ ...s, shopAddress: e.target.value }))}
                placeholder="123 Main St, City, State"
                rows={2}
                disabled={!editing}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-3 text-sm text-slate-900 placeholder-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[44px] resize-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">GSTIN</label>
              <input
                type="text"
                value={settings.shopGSTIN}
                onChange={(e) => setSettings((s) => ({ ...s, shopGSTIN: e.target.value.toUpperCase() }))}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                disabled={!editing}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-3 text-sm text-slate-900 placeholder-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[44px] uppercase disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 mb-4 shadow-sm">
          <h2 className="font-semibold text-slate-500 mb-3 text-xs uppercase tracking-wider">Logo</h2>
          {settings.logo && (
            <div className="mb-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={settings.logo} alt="Logo preview" className="h-16 w-16 object-contain rounded-lg border border-slate-200/60 bg-slate-50/50 p-1" />
              <button
                onClick={() => { setSettings((s) => ({ ...s, logo: "" })); if (fileRef.current) fileRef.current.value = ""; }}
                disabled={!editing}
                className="text-sm font-medium text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Remove
              </button>
            </div>
          )}
          <div
            role="button"
            tabIndex={editing ? 0 : -1}
            onClick={() => editing && fileRef.current?.click()}
            onKeyDown={(e) => { if (editing && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); fileRef.current?.click(); } }}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-all duration-150 ${
              editing
                ? "border-slate-200 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30"
                : "border-slate-100 opacity-60 cursor-not-allowed"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-medium text-slate-500">Tap to upload logo</p>
            <p className="text-xs text-slate-400">PNG, JPG up to 2MB</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="sr-only"
            />
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 mb-6 shadow-sm">
          <h2 className="font-semibold text-slate-500 mb-3 text-xs uppercase tracking-wider">Preferences</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Default GST Rate</label>
            <select
              value={settings.defaultGSTRate}
              onChange={(e) => setSettings((s) => ({ ...s, defaultGSTRate: parseInt(e.target.value) }))}
              disabled={!editing}
              className="w-full border border-slate-200 rounded-lg px-3.5 py-3 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {GST_RATES.map((r) => (
                <option key={r} value={r}>{r}%</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 mb-6 shadow-sm">
          <h2 className="font-semibold text-slate-500 mb-3 text-xs uppercase tracking-wider">Bank Details</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bank Name</label>
              <input
                type="text"
                value={settings.bankName}
                onChange={(e) => setSettings((s) => ({ ...s, bankName: e.target.value }))}
                placeholder="HDFC Bank"
                disabled={!editing}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-3 text-sm text-slate-900 placeholder-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Name</label>
              <input
                type="text"
                value={settings.bankAccountName}
                onChange={(e) => setSettings((s) => ({ ...s, bankAccountName: e.target.value }))}
                placeholder="AQUARIES POWER TECHNOLOGIES"
                disabled={!editing}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-3 text-sm text-slate-900 placeholder-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Number</label>
              <input
                type="text"
                value={settings.bankAccountNo}
                onChange={(e) => setSettings((s) => ({ ...s, bankAccountNo: e.target.value }))}
                placeholder="XXXXXXXX"
                disabled={!editing}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-3 text-sm text-slate-900 placeholder-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">IFSC Code</label>
              <input
                type="text"
                value={settings.bankIFSC}
                onChange={(e) => setSettings((s) => ({ ...s, bankIFSC: e.target.value.toUpperCase() }))}
                placeholder="XXXXX000000"
                maxLength={11}
                disabled={!editing}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-3 text-sm text-slate-900 placeholder-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[44px] uppercase disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">UPI ID</label>
              <input
                type="text"
                value={settings.bankUPI}
                onChange={(e) => setSettings((s) => ({ ...s, bankUPI: e.target.value }))}
                placeholder="yourname@upi"
                disabled={!editing}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-3 text-sm text-slate-900 placeholder-slate-300 bg-slate-50/50 focus:bg-white focus:border-indigo-300 transition-colors duration-150 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Save / Edit */}
        {editing ? (
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-3.5 px-5 rounded-xl font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-all duration-150 active:scale-[0.98] shadow-sm min-h-[52px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`flex-[2] py-3.5 px-5 rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] shadow-sm min-h-[52px] ${
                saved
                  ? "bg-emerald-500 text-white shadow-emerald-200"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-indigo-200"
              }`}
            >
              {saved ? "Saved!" : "Save Settings"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="w-full py-3.5 px-5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 transition-all duration-150 active:scale-[0.98] shadow-sm shadow-indigo-200 min-h-[52px] mb-4"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
