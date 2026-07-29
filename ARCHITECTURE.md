# BillBuddy — Architecture & Data Flow

How the app works end-to-end: where data comes from, how it flows through the system, and where it's stored.

---

## Overview

BillBuddy is a client-side Next.js app. There is **no backend, no database, no API calls**. All data lives in the browser's `localStorage`. The server only serves the initial HTML/JS — after that, everything runs in the browser.

```
┌─────────────────────────────────────────────────┐
│                    Browser                       │
│                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────────┐ │
│  │  React    │──▶│  lib/    │──▶│ localStorage │ │
│  │  (UI)     │   │  modules │   │  (storage)   │ │
│  └──────────┘   └──────────┘   └──────────────┘ │
│       │              │                           │
│       │              ▼                           │
│       │        ┌──────────┐                      │
│       └───────▶│  jsPDF   │──▶ PDF Blob          │
│                └──────────┘    (download/share)   │
└─────────────────────────────────────────────────┘
```

---

## Data Models

Defined in `src/lib/types.ts`:

### BillItem
A single line item on a bill.

```
{
  name: string        // e.g. "Rice Bag"
  hsn: string         // HSN code, e.g. "1006"
  quantity: number    // e.g. 2
  rate: number        // price per unit in ₹, e.g. 450
  gstRate: number     // GST percentage: 0 | 5 | 12 | 18 | 28
}
```

### Bill
A complete invoice record.

```
{
  id: string              // unique ID (timestamp + random)
  date: string            // ISO datetime of creation
  customerName: string
  customerPhone: string
  gstType: "intra" | "inter"
  items: BillItem[]       // 1-5 items
  totalBeforeTax: number  // sum of (qty × rate) for all items
  totalTax: number        // total GST amount
  grandTotal: number      // totalBeforeTax + totalTax
}
```

### Settings
Shop configuration, persisted across sessions.

```
{
  shopName: string
  shopAddress: string
  shopGSTIN: string       // 15-character GSTIN
  logo: string            // base64 data URL of uploaded image
  defaultGSTRate: number  // pre-fill rate for new items
}
```

---

## Storage Layer

File: `src/lib/storage.ts`

All persistence uses **localStorage** with two keys:

| Key | Contents | Format |
|-----|----------|--------|
| `billbuddy_bills` | Array of Bill objects | JSON |
| `billbuddy_settings` | Settings object | JSON |

### Functions

| Function | What it does |
|----------|-------------|
| `getBills()` | Reads all bills from localStorage, returns `[]` on error or SSR |
| `saveBill(bill)` | Prepends bill to array (newest first), writes back |
| `deleteBill(id)` | Filters out bill by ID, writes back |
| `getSettings()` | Reads settings, merges with defaults (so new fields are always present) |
| `saveSettings(settings)` | Writes settings object |

### SSR Safety

All read functions check `typeof window === "undefined"` before accessing localStorage. On the server (during SSR), they return safe defaults. This prevents crashes during Next.js server rendering.

### Storage Limits

localStorage has a ~5MB limit per origin. For BillBuddy's use case (text + small base64 logos), this supports thousands of bills. The logo is the biggest consumer — a typical shop logo is 20-100KB as base64.

---

## GST Calculation

File: `src/lib/gst.ts`

The `calculateBill()` function takes the items array and GST type, returns a `BillCalculation` with per-item and totals breakdown.

### Intra-State (CGST + SGST)

When the shop and customer are in the **same state**:

```
For each item:
  amount     = quantity × rate
  gstAmount  = amount × gstRate / 100
  cgst       = gstAmount / 2
  sgst       = gstAmount / 2

Grand Total = Σ(amount) + Σ(gstAmount)
```

Example: 2 × ₹450 rice bags at 18% GST
- Amount: ₹900
- CGST (9%): ₹81
- SGST (9%): ₹81
- Total: ₹1,062

### Inter-State (IGST)

When the shop and customer are in **different states**:

```
For each item:
  amount     = quantity × rate
  gstAmount  = amount × gstRate / 100
  igst       = gstAmount

Grand Total = Σ(amount) + Σ(gstAmount)
```

Same example: IGST (18%) = ₹162, Total = ₹1,062

### Rounding

All amounts are rounded to 2 decimal places using `Math.round(x * 100) / 100` to avoid floating-point display issues.

---

## Complete Data Flow

### 1. App Initialization

```
Browser loads page
       │
       ▼
React component mounts (page.tsx)
       │
       ├─ useState(() => getBills())     ← reads billbuddy_bills from localStorage
       ├─ useState(() => getSettings())  ← reads billbuddy_settings from localStorage
       └─ useState(() => newItem(defaultGSTRate))  ← first item uses saved default rate
```

### 2. Creating a Bill (User Flow)

```
User taps "+ New Bill"
       │
       ▼
Bill form appears (view state → "form")
       │
       ├─ User enters customer name + phone
       ├─ User selects Intra-State or Inter-State
       ├─ User adds items (name, HSN, qty, rate, GST%)
       │       │
       │       ▼
       │   Live calculation (calculateBill)
       │       │
       │       ▼
       │   Summary updates: subtotal, CGST/SGST or IGST, grand total
       │
       ▼
User taps action button
```

### 3. Saving a Bill

```
User taps "Save & Download PDF" / "Share" / "Save Only"
       │
       ▼
buildBill() creates Bill object
  - generates unique ID (timestamp + random)
  - captures current date, customer info, items, calculated totals
       │
       ▼
saveBill(bill) → storage.ts
  - reads existing bills from localStorage
  - prepends new bill (newest first)
  - writes updated array back to localStorage
       │
       ▼
setBills(getBills()) → re-reads from localStorage → UI updates to show new bill
       │
       ▼
setView("list") → returns to bill list
resetForm() → clears form fields for next bill
```

### 4. PDF Generation

```
downloadPDF(bill, settings) or sharePDF(bill, settings)
       │
       ▼
generateBillPDF(bill, settings)
       │
       ├─ Creates jsPDF document (A4 page)
       ├─ Renders header:
       │     - Logo (if uploaded) + Shop name + Address + GSTIN
       │     - "TAX INVOICE" title
       │     - Bill number + Date + Customer info + GST type
       │
       ├─ Renders items table (jspdf-autotable):
       │     Intra-state columns: #, Item, HSN, Qty, Rate, Amount, CGST, SGST, Total
       │     Inter-state columns: #, Item, HSN, Qty, Rate, Amount, IGST, Total
       │
       ├─ Renders totals: Subtotal, CGST/SGST or IGST, Grand Total
       │
       └─ Renders footer: "Generated by BillBuddy" + Signature line
```

### 5. Sharing (Download vs WhatsApp)

```
downloadPDF()                          sharePDF()
      │                                     │
      ▼                                     ▼
doc.save("bill-{id}.pdf")           doc.output("blob") → File object
      │                                     │
      ▼                                     ▼
Browser downloads file               navigator.share() available?
                                             │
                                   ┌─────Yes─┴──No────┐
                                   ▼                  ▼
                            Web Share API      WhatsApp fallback
                            (system share       Open wa.me/?text=...
                             sheet with         + download PDF
                             WhatsApp,          as backup
                             email, etc.)
```

### 6. Deleting a Bill

```
User taps "Del" on a bill card
       │
       ▼
handleDelete(id) → deleteBill(id)
  - reads all bills from localStorage
  - filters out the one with matching ID
  - writes filtered array back
       │
       ▼
setBills(getBills()) → UI re-renders without deleted bill
```

### 7. Settings Flow

```
User opens Settings page
       │
       ▼
useState(() => getSettings()) → reads billbuddy_settings from localStorage
       │
       ▼
Form displays: shop name, address, GSTIN, logo preview, default GST rate
       │
       ├─ Logo upload: FileReader reads file as base64 → stored in settings.logo
       ├─ Text fields: controlled inputs update settings state
       │
       ▼
User taps "Save Settings"
       │
       ▼
saveSettings(settings) → writes to localStorage
       │
       ▼
Back on main page → next useState(() => getSettings()) picks up new values
```

---

## File Responsibilities

| File | Role | Depends On |
|------|------|-----------|
| `src/lib/types.ts` | Data type definitions, constants | — |
| `src/lib/storage.ts` | localStorage CRUD operations | types.ts |
| `src/lib/gst.ts` | GST math (per-item + totals) | types.ts |
| `src/lib/pdf.ts` | PDF rendering, download, share | types.ts, gst.ts, jsPDF |
| `src/app/page.tsx` | Main UI: bill form + bill list | storage, gst, pdf, types |
| `src/app/settings/page.tsx` | Settings UI | storage, types |

---

## Key Decisions

1. **No backend** — MVP is fully client-side. Bills are private to the device/browser. No sign-up, no server costs, no latency.

2. **localStorage over IndexedDB** — simpler API, sufficient for the data volume (text + small images). IndexedDB would be the upgrade path if we need structured queries or larger storage.

3. **Base64 logo in localStorage** — avoids managing file storage. Trade-off: logos consume more localStorage space than blob URLs, but stay attached to the data without cleanup logic.

4. **Prepend on save** — bills array is always newest-first for the UI. No sorting needed on display.

5. **Lazy initializers** — `useState(() => localStorageRead())` instead of `useEffect` + `setState`. Avoids React 19 lint errors and unnecessary re-renders. SSR-safe via `typeof window` check.

6. **No product catalog (MVP)** — items are entered fresh each time. A catalog would reduce repetitive data entry for regular customers.

---

## Limitations & Upgrade Path

| Current | Upgrade |
|---------|---------|
| localStorage (per-device) | Cloud sync / database |
| Manual item entry | Product catalog with search |
| Single browser | Multi-device via accounts |
| No offline support | Service worker + cache |
| Basic bill ID (timestamp) | Sequential invoice numbers |
| No edit after save | Editable/draft bills |
| No tax filing export | GST report CSV/JSON export |
