# BillBuddy — Architecture & Data Flow

How the app works end-to-end: where data comes from, how it flows through the system, and where it's stored.

---

## Overview

BillBuddy is a client-side Next.js app. There is **no backend, no database, no API calls**. All data lives in the browser's `localStorage`. The server only serves the initial HTML/JS — after that, everything runs in the browser.

```mermaid
graph LR
    subgraph Browser
        A[React UI] --> B[lib/ modules]
        B --> C[(localStorage)]
        A --> D[jsPDF]
        D --> E[PDF Blob]
    end
    E --> F((Download))
    E --> G((WhatsApp Share))
```

---

## System Architecture

```mermaid
graph TB
    subgraph Frontend["Frontend (Next.js + Tailwind)"]
        UI[page.tsx — Bill Form & List]
        STG[settings/page.tsx — Settings]
    end

    subgraph Core["Core Logic (src/lib/)"]
        T[types.ts — Interfaces & Constants]
        S[storage.ts — localStorage CRUD]
        G[gst.ts — GST Calculation]
        P[pdf.ts — PDF Generation]
    end

    subgraph Storage["Browser Storage"]
        LS[(localStorage)]
    end

    subgraph External["External"]
        JSPDF[jsPDF + autotable]
        SHARE[Web Share API / WhatsApp]
    end

    UI --> S
    UI --> G
    UI --> P
    STG --> S
    S --> LS
    G --> T
    P --> G
    P --> JSPDF
    P --> SHARE
```

---

## Data Models

Defined in `src/lib/types.ts`:

### BillItem

A single line item on a bill.

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | e.g. "Rice Bag" |
| `hsn` | string | HSN code, e.g. "1006" |
| `quantity` | number | e.g. 2 |
| `rate` | number | Price per unit in ₹, e.g. 450 |
| `gstRate` | number | GST percentage: 0, 5, 12, 18, 28 |

### Bill

A complete invoice record.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique ID (timestamp + random) |
| `date` | string | ISO datetime of creation |
| `customerName` | string | Buyer name |
| `customerPhone` | string | Buyer phone |
| `gstType` | "intra" \| "inter" | CGST+SGST or IGST |
| `items` | BillItem[] | 1–5 items |
| `totalBeforeTax` | number | Sum of (qty × rate) |
| `totalTax` | number | Total GST amount |
| `grandTotal` | number | totalBeforeTax + totalTax |

### Settings

Shop configuration, persisted across sessions.

| Field | Type | Description |
|-------|------|-------------|
| `shopName` | string | Business name |
| `shopAddress` | string | Full address |
| `shopGSTIN` | string | 15-character GSTIN |
| `logo` | string | Base64 data URL of uploaded image |
| `defaultGSTRate` | number | Pre-fill rate for new items |

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
| `getBills()` | Reads all bills, returns `[]` on error or SSR |
| `saveBill(bill)` | Prepends bill (newest first), writes back |
| `deleteBill(id)` | Filters out by ID, writes back |
| `getSettings()` | Reads settings, merges with defaults |
| `saveSettings(settings)` | Writes settings object |

### SSR Safety

All read functions check `typeof window === "undefined"` before accessing localStorage. On the server (during SSR), they return safe defaults.

### Storage Limits

localStorage has a ~5MB limit per origin. The logo is the biggest consumer — typically 20–100KB as base64.

---

## GST Calculation

File: `src/lib/gst.ts`

### Intra-State (CGST + SGST)

When shop and customer are in the **same state**:

```mermaid
graph LR
    A[Item: qty × rate] --> B[amount]
    B --> C["gstAmount = amount × gstRate / 100"]
    C --> D["cgst = gstAmount / 2"]
    C --> E["sgst = gstAmount / 2"]
    B --> F[grandTotal]
    D --> F
    E --> F
```

**Example:** 2 × ₹450 rice bags at 18% GST
- Amount: ₹900
- CGST (9%): ₹81
- SGST (9%): ₹81
- **Total: ₹1,062**

### Inter-State (IGST)

When shop and customer are in **different states**:

```mermaid
graph LR
    A[Item: qty × rate] --> B[amount]
    B --> C["gstAmount = amount × gstRate / 100"]
    C --> D["igst = gstAmount"]
    B --> E[grandTotal]
    D --> E
```

**Same example:** IGST (18%) = ₹162, **Total: ₹1,062**

### Rounding

All amounts rounded to 2 decimal places: `Math.round(x * 100) / 100`

---

## Complete Data Flow

### 1. App Initialization

```mermaid
sequenceDiagram
    participant B as Browser
    participant R as React (page.tsx)
    participant LS as localStorage

    B->>R: Loads page
    R->>LS: getBills() → billbuddy_bills
    LS-->>R: Bill[] or []
    R->>LS: getSettings() → billbuddy_settings
    LS-->>R: Settings or defaults
    R->>R: useState(() => ...) — lazy init
    R-->>B: Renders bill list
```

### 2. Creating a Bill

```mermaid
sequenceDiagram
    participant U as User
    participant R as React UI
    participant G as gst.ts

    U->>R: Tap "+ New Bill"
    R->>R: view = "form"
    U->>R: Enter customer name, phone, GST type
    U->>R: Add items (name, HSN, qty, rate, GST%)
    R->>G: calculateBill(items, gstType)
    G-->>R: BillCalculation (subtotals, tax, grand total)
    R-->>U: Live summary updates
```

### 3. Saving a Bill

```mermaid
sequenceDiagram
    participant U as User
    participant R as React UI
    participant S as storage.ts
    participant LS as localStorage

    U->>R: Tap "Save & Download" / "Share" / "Save Only"
    R->>R: buildBill() — creates Bill object with ID, date, items, totals
    R->>S: saveBill(bill)
    S->>LS: Read existing bills
    LS-->>S: Bill[]
    S->>S: Prepend new bill (newest first)
    S->>LS: Write updated array
    R->>R: setBills(getBills()) — re-read & re-render
    R->>R: setView("list"), resetForm()
```

### 4. PDF Generation

```mermaid
flowchart TD
    A[downloadPDF / sharePDF] --> B[generateBillPDF]
    B --> C[Create jsPDF A4 document]
    C --> D[Page 1: TAX INVOICE]
    C --> E[Page 2: TERMS & CONDITIONS]

    D --> D1[Header: Logo + Shop + GSTIN]
    D --> D2["TAX INVOICE" title bar"]
    D --> D3[Invoice #, Date, GST Type]
    D --> D4[Buyer: Name, Phone]
    D --> D5[Items Table — autotable]
    D --> D6[Tax Summary: CGST/SGST or IGST]
    D --> D7[Grand Total]
    D --> D8[Amount in Words]
    D --> D9[Reverse Charge Declaration]
    D --> D10[Authorised Signatory]

    E --> E1[10 Standard GST Terms]
    E --> E2[Bank Details]
    E --> E3[Thank You + Footer]
```

### 5. Sharing (Download vs WhatsApp)

```mermaid
flowchart TD
    A[sharePDF] --> B{navigator.share?}
    B -->|Yes| C[Web Share API]
    C --> D[System share sheet]
    D --> E((WhatsApp / Email / etc))
    B -->|No| F[Open wa.me]
    F --> G[WhatsApp web]
    A --> H[Also download PDF as backup]
```

### 6. Deleting a Bill

```mermaid
sequenceDiagram
    participant U as User
    participant R as React UI
    participant S as storage.ts
    participant LS as localStorage

    U->>R: Tap "Del" on bill card
    R->>S: deleteBill(id)
    S->>LS: Read all bills
    LS-->>S: Bill[]
    S->>S: Filter out matching ID
    S->>LS: Write filtered array
    R->>R: setBills(getBills()) — re-render
```

### 7. Settings Flow

```mermaid
sequenceDiagram
    participant U as User
    participant S as Settings Page
    participant LS as localStorage

    U->>S: Open /settings
    S->>LS: getSettings()
    LS-->>S: Settings object
    S-->>U: Form with current values
    U->>S: Edit name, address, GSTIN, logo, GST rate
    U->>S: Tap "Save Settings"
    S->>LS: saveSettings(settings)
    Note over S: Logo: FileReader → base64 → stored
    U->>U: Navigate back to main page
```

---

## PDF Layout (2 Pages)

### Page 1 — Tax Invoice

```
┌─────────────────────────────────────────────┐
│  [LOGO]  Shop Name                          │
│          Address                             │
│          GSTIN: 27AAAAA0000A1Z5             │
├─────────────────────────────────────────────┤
│           TAX INVOICE                        │
├─────────────────────┬───────────────────────┤
│ Invoice No: xxxxx   │ Bill To:              │
│ Date: 29-Jul-2026   │ Customer Name         │
│ GST Type: Intra     │ Ph: 98765xxxxx        │
├────┬────┬─────┬─────┼─────┬───────┬────────┤
│ #  │Item│ HSN │ Qty │Rate│ Amount│ CGST  │ SGST  │ Total  │
├────┼────┼─────┼─────┼─────┼───────┼────────┤
│ 1  │... │ ... │  2  │450  │ 900   │ 81    │ 81    │ 1062   │
├────┴────┴─────┴─────┼─────┼───────┼────────┤
│                     │Subtotal│ 900  │        │
│                     │CGST    │ 81   │        │
│                     │SGST    │ 81   │        │
│                     │TOTAL   │1062  │        │
├─────────────────────┴───────┴────────┤
│ Amount in Words: Rupees One Thousand  │
│ Sixty Two Only                        │
│ Reverse Charge: No                     │
│                                        │
│ For Shop Name                         │
│ _________________                     │
│ Authorised Signatory                  │
└────────────────────────────────────────┘
```

### Page 2 — Terms & Conditions

```
┌────────────────────────────────────────┐
│         TERMS & CONDITIONS              │
├────────────────────────────────────────┤
│ 1. Payment due within 30 days.          │
│ 2. Interest at 18% p.a. on overdue.    │
│ 3. Goods once sold will not be returned.│
│ 4. Disputes subject to local jurisdiction│
│ 5. Computer-generated, no signature reqd│
│ 6. E. & O.E                            │
│ 7-10. [Additional standard terms]       │
├────────────────────────────────────────┤
│ Bank Details                            │
│ Bank: HDFC Bank                         │
│ A/c: XXXXXXXX | IFSC: HDFC0001234     │
│ UPI: shopname@upi                      │
├────────────────────────────────────────┤
│     Thank you for your business!        │
│                                         │
│ Generated by BillBuddy                 │
└────────────────────────────────────────┘
```

---

## File Responsibilities

| File | Role | Depends On |
|------|------|-----------|
| `src/lib/types.ts` | Data type definitions, constants | — |
| `src/lib/storage.ts` | localStorage CRUD operations | types.ts |
| `src/lib/gst.ts` | GST math (per-item + totals) | types.ts |
| `src/lib/pdf.ts` | 2-page PDF rendering, download, share | types.ts, gst.ts, jsPDF |
| `src/app/page.tsx` | Main UI: bill form + bill list | storage, gst, pdf, types |
| `src/app/settings/page.tsx` | Settings UI | storage, types |

---

## Key Decisions

1. **No backend** — MVP is fully client-side. Bills are private to the device/browser. No sign-up, no server costs, no latency.

2. **localStorage over IndexedDB** — simpler API, sufficient for the data volume (text + small images). IndexedDB would be the upgrade path for structured queries or larger storage.

3. **Base64 logo in localStorage** — avoids managing file storage. Trade-off: logos consume more localStorage space than blob URLs, but stay attached to the data without cleanup logic.

4. **Prepend on save** — bills array is always newest-first for the UI. No sorting needed on display.

5. **Lazy initializers** — `useState(() => localStorageRead())` instead of `useEffect` + `setState`. Avoids React 19 lint errors and unnecessary re-renders. SSR-safe via `typeof window` check.

6. **No product catalog (MVP)** — items are entered fresh each time. A catalog would reduce repetitive data entry for regular customers.

7. **2-page PDF** — Page 1 is the tax invoice (mandatory GST fields, items table, totals, amount in words). Page 2 has terms & conditions, bank details, and thank-you footer. Professional layout matching standard Indian GST invoice templates.

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
| Placeholder bank details | Configurable bank details in Settings |
