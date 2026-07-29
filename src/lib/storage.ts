import { Bill, Settings, DEFAULT_SETTINGS } from "./types";

const BILLS_KEY = "billbuddy_bills";
const SETTINGS_KEY = "billbuddy_settings";

export function getBills(): Bill[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(BILLS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveBill(bill: Bill): void {
  const bills = getBills();
  bills.unshift(bill); // newest first
  localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
}

export function deleteBill(id: string): void {
  const bills = getBills().filter((b) => b.id !== id);
  localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
}

export function getSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}