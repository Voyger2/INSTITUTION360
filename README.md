# INSTITUTION360

AICTE Institution Complaint Monitoring Dashboard — Frontend prototype for SIH26264.

## Overview

INSTITUTION360 is a frontend-only prototype of a centralised institution-related complaint monitoring system for authorised AICTE personnel. It helps officials view complaint cases across bureaus/cells, identify responsible bureaus and officers, search institutions, track complaint statuses, detect potential overlapping cases, and review reports.

**Important:** This is a demonstration frontend using synthetic data. It is not connected to AICTE internal systems and does not implement real authentication or backend APIs.

## Technology Stack

- **Framework:** Next.js 16.4.3 with App Router
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **Charts:** Recharts v2
- **Icons:** Lucide React
- **State:** React hooks with centralised demo state

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    page.tsx              # Home (redirects to dashboard)
    layout.tsx            # Root layout with providers
    globals.css           # Design tokens and global styles
    dashboard/page.tsx    # Dashboard with metrics and charts
    institutions/page.tsx # Institution registry
    institutions/[id]/page.tsx  # Institution detail
    complaints/page.tsx   # Complaint register
    complaints/[id]/page.tsx  # Complaint detail with actions
    overlaps/page.tsx     # Overlap alerts
    reports/page.tsx      # Reports with CSV export
    administration/page.tsx # Demo configuration
  components/
    layout/               # Shell components (sidebar, header, breadcrumbs)
    navigation/           # Navigation components
    ui/                   # Reusable UI primitives (button, input, select, etc.)
    dashboard/            # Dashboard-specific widgets
  lib/
    demo-state.ts         # Centralised demo state and actions
    demo-state-context.tsx  # React context for demo state + toasts
    formatting.ts         # Date, number, and metrics formatting
    overlap-detection.ts  # Transparent overlap detection logic
  data/
    demo-data.ts          # Synthetic demonstration dataset
  types/
    index.ts              # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+ (tested with v24.13.0)
- npm (comes with Node.js)

### Installation

```bash
cd INSTITUTION360
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npx tsc --noEmit
```

### Production Build

```bash
npm run build
```

### Production Start

```bash
npm start
```

## Demo Roles

The application includes a demo role switcher (not secure authentication):

- **System Administrator** — Full access to all pages and actions, can reset demo data
- **Bureau/Cell Officer** — Can view and modify cases within their assigned bureau
- **Read-only Oversight Officer** — Can view all records but cannot modify any data

## Key Features

1. **Dashboard** — Metrics (total, pending, under process, disposed, transferred, overdue, overlap alerts), bureau workload chart, status distribution, recent activity, overlap alerts widget
2. **Institution Registry** — Search by name or AICTE Permanent ID, filter by region, view institution details and complaint history
3. **Complaint Register** — Search, filter (bureau, status, category, overdue), sort, paginate cases
4. **Complaint Details** — View case details, action history, update status, assign officer, transfer case (frontend-only, session-limited)
5. **Overlap Alerts** — Detects institutions with multiple active cases across different bureaus, review and mark alerts
6. **Reports** — Bureau-wise, region-wise, status-wise distribution, overdue cases, institution-wise history, CSV export
7. **Administration** — Demo users, bureaus, deadline thresholds, status definitions, reset demo data

## Data

All data is synthetic demonstration data. Records are clearly labeled as demo data. Changes made during a session (status updates, assignments, transfers, alert reviews) are held in memory and reset on page reload. Use the "Reset Demo Data" action in Administration to restore the initial state.

## Accessibility

The application targets WCAG 2.2 AA compliance:
- Semantic HTML landmarks (`<header>`, `<nav>`, `<main>`, `<section>`)
- Skip-to-content link
- Logical heading hierarchy
- Labels for all form controls
- Keyboard-accessible navigation and dialogs
- Visible focus indicators
- Color + text for status indicators
- Accessible table headers
- Reduced-motion support

## Deployment

### Vercel (Frontend)

```bash
npm run build
# Deploy the .next folder or connect your GitHub repo to Vercel
```

## Limitations

- Frontend-only prototype; no backend API integration
- Demo state is in-memory; changes do not persist across reloads
- Demo roles are UI demonstrations only, not secure authentication
- No real database or persistent storage
- Synthetic data only; not connected to AICTE internal systems

## License

MIT License