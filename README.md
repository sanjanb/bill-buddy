# BillBuddy

Mobile-first PWA for Indian shop owners to create GST bills, generate PDFs, and share via WhatsApp.

## Tech Stack

- Next.js 16 + Tailwind CSS
- jsPDF + jspdf-autotable (PDF generation)
- localStorage (MVP storage)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Deploy — zero config needed

### Manual

```bash
npm run build
npm start
```

## CI/CD

GitHub Actions runs on every push/PR to `main`:
- ESLint
- TypeScript type check
- Production build

Vercel auto-deploys from `main` branch.

## Features

- Create GST invoices (CGST+SGST / IGST)
- Custom shop branding & letterhead upload
- PDF download & WhatsApp share
- Bill history with localStorage
