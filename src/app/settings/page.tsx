"use client";

import { useState, useEffect, useRef } from "react";
import { Settings, GST_RATES, DEFAULT_SETTINGS } from "@/lib/types";
import { getSettings, saveSettings } from "@/lib/storage";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(getSettings());
    setMounted(true);
  }, []);

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
    setTimeout(() => setSaved(false), 2000);
  }

  if (!mounted) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <a href="/" className="text-gray-500 hover:text-gray-700 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
            <input
              type="text"
              value={settings.shopName}
              onChange={(e) => setSettings((s) => ({ ...s, shopName: e.target.value }))}
              placeholder="My Shop"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Address</label>
            <textarea
              value={settings.shopAddress}
              onChange={(e) => setSettings((s) => ({ ...s, shopAddress: e.target.value }))}
              placeholder="123 Main St, City, State"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
            <input
              type="text"
              value={settings.shopGSTIN}
              onChange={(e) => setSettings((s) => ({ ...s, shopGSTIN: e.target.value.toUpperCase() }))}
              placeholder="22AAAAA0000A1Z5"
              maxLength={15}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo / Letterhead</label>
            {settings.logo && (
              <div className="mb-2">
                <img src={settings.logo} alt="Logo preview" className="h-16 object-contain border rounded" />
                <button
                  onClick={() => { setSettings((s) => ({ ...s, logo: "" })); if (fileRef.current) fileRef.current.value = ""; }}
                  className="text-xs text-red-500 hover:text-red-700 mt-1"
                >
                  Remove logo
                </button>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default GST Rate</label>
            <select
              value={settings.defaultGSTRate}
              onChange={(e) => setSettings((s) => ({ ...s, defaultGSTRate: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white"
            >
              {GST_RATES.map((r) => (
                <option key={r} value={r}>{r}%</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors min-h-[48px] ${
            saved
              ? "bg-green-500 text-white"
              : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800"
          }`}
        >
          {saved ? "✓ Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
