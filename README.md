# BillBuddy

A mobile-first PWA for Indian shop owners to create GST-compliant invoices, generate professional PDFs, and share them instantly via WhatsApp — right from your phone.

## Features

### Bill Creation
- Add line items with **name, HSN code, quantity, rate, and GST rate**
- Add up to 5 items per bill
- **Live calculation** — GST breakdown and total update as you type
- Customer name and address fields

### GST Compliance
- **Intra-state:** CGST + SGST split (e.g., 9% + 9% for 18% slab)
- **Inter-state:** IGST (e.g., 18% directly)
- Common GST slabs: 0%, 5%, 12%, 18%, 28%
- GSTIN validation on shop settings
- HSN code tracking per item

### PDF Generation & Sharing
- Professional PDF with your **shop logo and branding**
- Auto-generated bill number with date
- Itemized table with HSN codes, quantities, rates, and GST breakdown
- **Download PDF** to device
- **Share via WhatsApp** — uses Web Share API with WhatsApp fallback

### Custom Branding
- Upload your shop logo (stored locally as base64)
- Set shop name, address, and GSTIN
- Default GST rate preference

### Bill History
- View all past bills with date, customer, total, and GST type
- Re-download or re-share any previous bill
- Delete bills you no longer need

## Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** | App Router, React Server Components |
| **Tailwind CSS v4** | Utility-first styling, responsive design |
| **TypeScript** | Type safety across the codebase |
| **jsPDF + jspdf-autotable** | PDF generation with tables |
| **localStorage** | Client-side bill and settings storage (MVP) |
| **GitHub Actions** | CI pipeline (lint, typecheck, build) |
| **Vercel** | Zero-config deployment for Next.js |

## Project Structure

```
billbuddy/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with Geist fonts
│   │   ├── page.tsx            # Main bill form + bill history
│   │   ├── settings/
│   │   │   └── page.tsx        # Shop settings (name, logo, GSTIN)
│   │   └── globals.css         # Global styles
│   └── lib/
│       ├── types.ts            # TypeScript interfaces, GST rates
│       ├── storage.ts          # localStorage CRUD helpers
│       ├── gst.ts              # GST calculation logic
│       └── pdf.ts              # PDF generation + download + share
├── .github/workflows/
│   └── ci.yml                  # CI pipeline
├── vercel.json                 # Vercel deployment config
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- **Node.js 20+** (run `node -v` to check)
- **npm** (comes with Node)

### Setup

```bash
# Clone the repo
git clone https://github.com/sanjanb/bill-buddy.git
cd bill-buddy

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First-Time Usage

1. Go to **Settings** (gear icon) and fill in your shop name, address, and GSTIN
2. Upload your shop logo for branded PDFs
3. Go back to the **Home** screen and create your first bill
4. Add items, select intra-state or inter-state, and save/download/share

## Deployment

### Vercel (Recommended)

Vercel is free for personal projects and requires zero configuration for Next.js:

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Click **Deploy** — that's it

Your app will be live at `https://your-project.vercel.app`.

### Manual Deployment

```bash
npm run build    # Build the production bundle
npm start        # Start the production server
```

The app runs as a static site — no database or server runtime needed.

## CI/CD

**GitHub Actions** runs on every push and pull request to `main`:

- ESLint (code quality)
- TypeScript type checking (`tsc --noEmit`)
- Production build verification

**Vercel** auto-deploys from the `main` branch on every push.

## How It Works

1. **Create a bill** — Enter customer info, add line items with HSN codes and rates
2. **GST is calculated automatically** — Toggle between intra-state (CGST+SGST) and inter-state (IGST)
3. **Download or share** — Generate a PDF with your branding, download it, or send it via WhatsApp
4. **Everything is local** — Bills are stored in your browser's localStorage (no server, no sign-up)

## Future Scope

- Product catalog with saved items
- Customer database and history
- Cloud sync across devices
- Offline-first with service worker
- Multi-user / multi-device support
- Export reports and GST filings

## License

This project is open source. See the repository for license details.
