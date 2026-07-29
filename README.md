<div align="center">

# BillBuddy

**GST invoicing for Indian shop owners, right from your phone.**

Create GST-compliant bills, generate branded PDFs, and share via WhatsApp. No sign-up, no server, no complexity.

[![CI](https://github.com/sanjanb/bill-buddy/actions/workflows/ci.yml/badge.svg)](https://github.com/sanjanb/bill-buddy/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green)](#license)

</div>

---

## Why BillBuddy?

Small shop owners in India need to generate GST bills daily. Existing solutions are either too complex (full accounting software) or too limited (pen and paper). BillBuddy sits in the middle: **fast, free, and focused** on one thing: getting a GST bill into your customer's WhatsApp.

- **No account needed**: works entirely in your browser
- **GST compliant**: CGST+SGST (intra-state) and IGST (inter-state) with HSN codes
- **Branded PDFs**: your shop logo, your details, professional output
- **One-tap sharing**: WhatsApp, email, or download

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [CI/CD](#cicd)
- [How It Works](#how-it-works)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Features

### Bill Creation
- Add line items with **name, HSN code, quantity, rate, and GST rate**
- Up to 5 items per bill
- **Live calculation**: totals update as you type
- Customer name and phone number fields

### GST Compliance
- **Intra-state:** CGST + SGST split (e.g., 9% + 9% for 18% slab)
- **Inter-state:** IGST (e.g., 18% directly)
- Common GST slabs: 0%, 5%, 12%, 18%, 28%
- GSTIN field on shop settings
- HSN code tracking per item

### PDF Generation & Sharing
- Professional PDF with **shop logo and branding**
- Auto-generated bill number with date
- Itemized table with HSN codes, quantities, rates, and tax breakdown
- **Download** to device or **share via WhatsApp** (Web Share API)

### Custom Branding
- Upload your shop logo (stored locally as base64)
- Set shop name, address, and GSTIN
- Default GST rate preference

### Bill History
- View all past bills with date, customer, total, and GST type
- Re-download or re-share any previous bill
- Delete bills you no longer need

## Demo

<!-- Replace with actual screenshot or recording -->
<!-- ![BillBuddy Screenshot](./public/screenshot.png) -->

> **Live demo:** [billbuddy.vercel.app](https://billbuddy.vercel.app) *(deploy your own, see [Deployment](#deployment))*

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | [Next.js 16](https://nextjs.org) | App Router, React Server Components |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) | Utility-first, responsive design |
| Language | [TypeScript 5](https://typescriptlang.org) | Type safety across the codebase |
| PDF | [jsPDF](https://github.com/simonbengtsson/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jspdf-autotable) | Client-side PDF generation |
| Storage | localStorage | Bill and settings persistence (MVP) |
| CI | [GitHub Actions](https://github.com/features/actions) | Lint, typecheck, build on every push |
| Deploy | [Vercel](https://vercel.com) | Zero-config Next.js hosting |

## Getting Started

### Prerequisites

- **Node.js 20+**: run `node -v` to verify
- **npm**: included with Node

### Installation

```bash
git clone https://github.com/sanjanb/bill-buddy.git
cd bill-buddy
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### First-Time Setup

1. Tap the **gear icon** to open Settings
2. Enter your **shop name**, **address**, and **GSTIN**
3. Upload your **shop logo** for branded PDFs
4. Go back to **Home** and create your first bill

## Project Structure

```
billbuddy/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, Geist fonts, metadata
│   │   ├── page.tsx                # Bill form + bill history (main view)
│   │   ├── settings/
│   │   │   └── page.tsx            # Shop settings (name, logo, GSTIN)
│   │   └── globals.css             # Global styles, focus rings
│   └── lib/
│       ├── types.ts                # BillItem, Bill, Settings interfaces
│       ├── storage.ts              # localStorage CRUD (SSR-safe)
│       ├── gst.ts                  # GST calculation (CGST/SGST/IGST)
│       └── pdf.ts                  # PDF generation, download, share
├── .github/workflows/
│   └── ci.yml                      # CI pipeline
├── vercel.json                     # Vercel config
├── package.json
└── tsconfig.json
```

## Deployment

### Vercel (Recommended)

Vercel is free for personal projects and requires zero configuration:

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Click **Deploy**

Your app will be live at `https://your-project.vercel.app`.

### Self-Hosted

```bash
npm run build
npm start
```

Runs as a static site: no database or server runtime needed.

## CI/CD

**GitHub Actions** runs on every push and PR to `main`:

| Check | Command |
|-------|---------|
| Lint | `eslint` |
| Type Check | `tsc --noEmit` |
| Build | `next build` |

**Vercel** auto-deploys from the `main` branch.

## How It Works

1. **Create a bill**: Enter customer info, add items with HSN codes and rates
2. **GST calculates automatically**: Toggle between intra-state (CGST+SGST) and inter-state (IGST)
3. **Download or share**: Generate a branded PDF, download it, or send it via WhatsApp
4. **Everything stays local**: Bills stored in your browser's localStorage (no server, no sign-up)

## Roadmap

- [ ] Product catalog with saved items
- [ ] Customer database and history
- [ ] Cloud sync across devices
- [ ] Offline-first with service worker
- [ ] Multi-user / multi-device support
- [ ] Export reports and GST filings

## Contributing

Contributions welcome. Open an issue first for feature requests.

```bash
git checkout -b feature/your-feature
npm install
# make changes
npm run lint        # must pass
npx tsc --noEmit    # must pass
npm run build       # must pass
git commit -m "feat: your feature"
git push
```

Then open a Pull Request against `main`.

## License

MIT. See [LICENSE](./LICENSE) for details.
