# INSTITUTION360 — QA & Demo-Readiness Report

**Project:** SIH26264 — AICTE Institution Complaint Monitoring Dashboard (front-end prototype)
**Audited:** October 26, 2026
**Scope:** Demo-readiness audit of the client-only Next.js prototype (Part 1, this document), followed by a portal-completion build the same day (Part 2 addendum). Verified fixes only; no rebuild of data, no backend.

## Executive Summary

The prototype is **demo-ready**. All errors found during the audit were fixed. The app now passes strict TypeScript (`npx tsc --noEmit`, 0 errors including the Next.js route validator), ESLint (0 errors, 0 warnings), a full production build (12/12 pages prerendered at audit time — **superseded by 16 routes after the portal build, see Part 2 below**), and a served-HTML spot check across all 9 routes (also superseded).

Three classes of real (non-cosmetic) defects were found and fixed:

1. **Six route pages had no `export default`** — the `AppPageConfig` type errors in `.next/types/validator.ts` were *not* harmless; they were this exact defect surfaced as type errors.
2. **Both `[id]` detail pages were Server Components calling client hooks** — `/institutions/[id]` crashed `next build` prerendering ("Attempted to call useDemoState() from the server"). Both also violated the Next 16 `params` contract (`params` is a `Promise`, and its access must sit inside a `<Suspense>` boundary under Cache Components).
3. **The `Table` component stringified every cell** (`String(row[col.key])`), so any React-node cell rendered as the literal text `[object Object]` — this broke the "View"/"View Details" action links and the role `Badge`s on Administration.

## Final verification (frontend hand-off, October 26, 2026)

Final state at frontend completion — all commands re-run immediately before the frontend commit:

| Check | Command | Result |
| --- | --- | --- |
| TypeScript (strict) | `npx tsc --noEmit` | PASS — exit 0, no errors |
| Lint | `npm run lint` | PASS — exit 0, 0 errors, 0 warnings |
| Production build | `npm run build` | PASS — exit 0, 16 routes prerendered |
| Dev server routes | `npm run dev` + HTTP probe | PASS — 200 on `/login`, `/dashboard`, `/complaints`, `/institutions`, `/overlaps`, `/reports`, `/administration`, `/notifications`, `/audit-log`, `/profile`, `/help` |
| Dev log | server log review | PASS — no errors, no instant-navigation complaints |
| SSR shell content | served-HTML check | PASS — sticky sidebar classes, drawer close button, rendered page content present |

**Interactive browser checks were NOT performed (no browser automation available).** The following require manual verification in a real browser: drawer open/close/backdrop/Escape at ~375px, 1440px visual alignment, sign-in/sign-out/role-switcher flows, complaint status/assign/transfer dialogs, overlap review, CSV download click, and absence of browser-console errors. Known limitations are listed in the addendum and bug-fix sections below.

## Verification results (original audit)

| Check | Command | Result |
| --- | --- | --- |
| TypeScript (strict) | `npx tsc --noEmit` | PASS — 0 errors |
| Lint | `npm run lint` | PASS — 0 errors, 0 warnings (was: 0 errors, 35 warnings) |
| Production build | `npm run build` | PASS — 12/12 pages; `/complaints/[id]` and `/institutions/[id]` correctly Partial-Prerendered |
| Dev server | `npm run dev` | All 9 routes return HTTP 200 (`/`, `/dashboard`, `/institutions`, `/complaints`, `/overlaps`, `/reports`, `/administration`, `/institutions/inst-001`, `/complaints/cmp-001`) |
| Rendered content spot checks | (curl of served HTML) | Dashboard metric cards present; complaints table shows all 14 case IDs; "View Details"/"View" links and role badges now in HTML; detail pages ship static shell + streamed data |
| Overlap detection logic | code review | Verified: keyed on `institutionAicteId` (canonical AICTE Permanent ID), triggers only for active statuses, alerts across ≥2 bureaus — OK, no changes needed |

## Issues found and fixed

### 0. Part 2 — Portal completion build (October 26, 2026, same day)

**Why the app "appeared dashboard-only":** `MainLayout` (nav/header/footer chrome) existed but was **never mounted by any page or layout**; the root page was a bare `redirect("/dashboard")`, and there was no sign-in experience, no notifications/audit-log/profile/help surface, and no sign-out. Reviewers only ever saw raw feature pages without the portal shell.

**What was built (frontend-only, synthetic data unchanged):**

1. **Demo session + auth flow** — `lib/demo-state.ts` added a module-level `sessionUserId` with `signInDemo(email, password)` / `signOutDemo()` / `isDemoSignedIn()` / `getSessionUserId()` / `getDemoUserById()`, and a pub/sub `subscribeDemoState()` + `notify()` (all mutators now call `notify()`). `demo-state-context.tsx` was rewritten to subscribe to the store so every consumer re-renders on updates, plus a `useDemoSession()` hook (built on `React.useSyncExternalStore`) that satisfies the project's `react-hooks/set-state-in-effect` lint rule. Sign-in accepts any of the five listed demo emails plus **any** password (prototype rule, disclosed in the UI); sign-out returns to `/login`; direct URLs to protected pages redirect to `/login` when signed out.
2. **App shell mounted at last** — pages moved into the `src/app/(app)/` route group (URLs unchanged, only the group folder moved) with `src/app/(app)/layout.tsx` wrapping everything in a rebuilt, self-contained `components/layout/main-layout.tsx`: persistent desktop sidebar with 10 nav items (+ live counts for Overlaps/Notifications, admin-only Administration), mobile drawer + overlay, breadcrumbs, notifications bell (unread count), profile menu (with outside-click/Esc close), sign-out, footer user info, a demo-role switcher (three roles, first user of the role is selected), DEMONSTRATION PROTOTYPE badge + notice strip, skip link, `main` landmark, and footer. The old `sidebar.tsx` / `header.tsx` / `breadcrumbs.tsx` are now unused.
3. **New pages** (all with real `h1` page headers, neutral navy/white gov-portal styling): `/login` (`(auth)` group, metadata + server page + client form), `/notifications` (overdue, due-soon and new-overlap alert tables with empty states), `/audit-log` (merged status/assignment/action histories with type + case filters), `/profile` (session info + role permission can/cannot lists), `/help` (usage guide, status definitions, valid transitions, thresholds, known limitations), `/access-denied`, custom `src/app/not-found.tsx`, and root `/` as a client redirector (signed in → `/dashboard`, otherwise → `/login`).
4. **Role-aware enforcement** — `administration/page.tsx` now guards admin-only access (redirects non-admins to `/access-denied`, with a redirect-resistance notice) and its "reset demo data" action runs behind a confirm `Dialog`. Complaint detail shows a read-only notice for oversight officer instead of silently hiding the action buttons; the Administration page remains hidden in the sidebar for non-admins.
5. **Interaction/UX fixes on data pages** — institution detail gained cross-bureau activity + real overlap-alert cards + complaint rows linking to case pages (previously dead buttons); reports CSV export verified as a real download; `components/ui/dialog.tsx` upgraded with Escape handling, initial focus and focus return for a11y.
6. **Not-found handling on `[id]` pages** — `notFound()` cannot retitle already-streamed HTML from a client component, so unknown complaint/institution IDs now render a bespoke `NotFoundView` inline (with dataset-specific copy and recovery links) via `components/portal/not-found-view.tsx` instead of the generic 404.
7. **PPR correctness** — the dynamic shell (`MainLayout`) and `LoginForm` are wrapped in `<Suspense>` in their layouts/pages, satisfying the Cache Components `CLIENT_HOOK_DYNAMIC` prerender rule discovered via `next build`.

**Verification (after portal build):** `npx tsc --noEmit` 0 errors; `npm run lint` 0 errors / 0 warnings; `npm run build` green with 16 routes (detail pages Partial-Prerendered, everything else static); production server spot check returned HTTP 200 for `/login`, `/dashboard`, `/complaints`, `/institutions`, `/overlaps`, `/reports`, `/administration`, `/notifications`, `/audit-log`, `/profile`, `/help`, `/access-denied`, plus valid and unknown detail IDs (unknown IDs show the shell, then the bespoke not-found view once hydrated — see limitation below); `/not-a-page` correctly returns HTTP 404.

**Remaining limitations (accepted, non-blocking):**
- The session is client-side memory (module state): hard refresh signs the demo user out and returns to `/login`; SSR always renders the signed-out shell snapshot (a brief "Loading portal…" state may be visible on first paint or in curl/SSR-only checks). The invalid-ID not-found view likewise only streams into HTML for a signed-in session.
- Overlap review buttons are currently enabled for bureau officers across **all** bureaus (`canModify = role !== oversight`); complaint-level actions are bureau-scoped as before. Tighten if cross-bureau review should be restricted.
- No manifest, robots, or production auth (out of scope for a frontend prototype).

### 1. Missing `export default` on six route pages (verify-level severity)
- Files: `src/app/dashboard/page.tsx`, `src/app/institutions/page.tsx`, `src/app/complaints/page.tsx`, `src/app/overlaps/page.tsx`, `src/app/reports/page.tsx`, `src/app/administration/page.tsx` — all had only `export function XPage() {}` named exports.
- **Effect:** App Router pages must default-export a component. It was also the root cause of the twelve `AppPageConfig<"...">` type errors in `.next/types/validator.ts` and `.next/dev/types/validator.ts` earlier assumed harmless.
- **Fix:** appended `export default XPage;` to each file. tsc errors and build both green afterwards.

### 2. Broken `[id]` detail pages — server/client boundary & Next 16 params contract
- `src/app/institutions/[id]/page.tsx` and `src/app/complaints/[id]/page.tsx`:
  - No `"use client"` directive while calling `useDemoState()` (a client context hook) → production prerender crashed with `Attempted to call useDemoState() from the server…`.
  - `params` typed as `{ id: string }` and read synchronously; Next 16 delivers `{ params }` as a `Promise` (docs: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`).
  - `params` read outside a `<Suspense>` boundary also fails `next build` under Cache Components with "encountered uncached or runtime data during prerendering".
- **Fix (per Next 16 docs pattern for runtime data / PPR):**
  - Added `"use client"` at top.
  - Page is now a thin wrapper: static shell + `<Suspense fallback={<DetailPageFallback />}>` wrapping an inner view component; fallback is a small skeleton ("Loading case details…" / "Loading institution details…", `aria-busy`).
  - Inner component unwraps params with `React.use(params)` and uses the unwrapped `id`.

### 3. `src/components/ui/table.tsx` — cells stringified, React elements lost
- Cell renderer was `{String(row[col.key] ?? "")}`, so every `React.ReactNode` cell became `[object Object]`: the **Complaints** "View" link, the **Institutions** "View Details" link, and the Administration role `Badge`s were broken (in both prerendered HTML and hydration.
- **Fix:** render cell value as React node: `{row[col.key] as React.ReactNode}` (keys stay stringified via `String(row[rowKey])`).

### 4. Dynamic action/assignment/status history
- `src/lib/demo-state.ts` builds `statusHistory` / `assignmentHistory` / `actionHistory` records; the complaint-detail page merge-sorts all three per case into a single event timeline (most recent first) and renders it as previously static "History" section.
- Verified `recordStatusChange` / `recordAssignment` / `recordAction` are actually called from `updateComplaintStatus`, `assignOfficer`, and `transferCase` (actor, from/to values, and reason captured before mutation), `resetDemoData` clears all three + counter, `demo-state-context.tsx` exposes the getters, and the detail page consumes them — end-to-end wired and type-clean.

### 5. Other correctness fixes during audit
- `src/lib/demo-state.ts` — `transferCase` was missing the final metrics/overlaps recompute and `return { success: true }` (built fine but returned `undefined`); `assignOfficer` referenced an undefined `changedBy` identifier and two `bureauName` assignments needed `BureauName` casts; `recordAssignment`'s `toBureauName` param is now `BureauName`-typed.
- `src/lib/formatting.ts` — `generateReportData` now takes `Institution[]` so region-derived report fields (`regionCode`, `regionName`) resolve from real institution data instead of a hardcoded value; `bureauWise`/`regionWise` name lookups from `BUREAUS`/`REGIONS` with proper `BureauName`/`RegionName` casts; mapping types extended with `regionName`.
- `src/lib/overlap-detection.ts` — removed dead `latestDate` computation (alert already carries `latestActionDates`).
- `src/app/complaints/page.tsx` — replaced non-functional `sortKey`/`sortDirection` state (setters never called) with a direct date-desc sort on `receivedDate`.
- Workspace-wide lint cleanup: unused imports/values removed in 16 files (`header.tsx`, `sidebar.tsx`, `breadcrumbs.tsx`, `pagination.tsx`, `toast.tsx`, `dashboard-metrics.tsx`, `demo-data.ts`, `demo-state-context.tsx`, page files). `header.tsx`'s unused `isSidebarOpen`/`setIsSidebarOpen` props were removed from the interface and the `main-layout.tsx` call site.

## Files changed

| Area | Files |
| --- | --- |
| App pages | `dashboard/page.tsx`, `institutions/page.tsx`, `complaints/page.tsx`, `overlaps/page.tsx`, `reports/page.tsx`, `administration/page.tsx` (default export, lint) |
| Detail pages | `institutions/[id]/page.tsx`, `complaints/[id]/page.tsx` ("use client", params Promise, Suspense wrapper, fallback, dynamic history rendering) |
| UI primitives | `components/ui/table.tsx` (React-node cells), `components/ui/pagination.tsx`, `components/ui/toast.tsx`, `components/ui/dashboard-metrics.tsx` (dead props/imports) |
| Layout | `components/layout/header.tsx`, `sidebar.tsx`, `breadcrumbs.tsx`, `main-layout.tsx` (dead props/imports) |
| Lib | `lib/demo-state.ts`, `lib/formatting.ts`, `lib/overlap-detection.ts`, `lib/demo-state-context.tsx` |
| Data | `data/demo-data.ts` (unused type imports) |

## Remaining observations (accepted; non-blocking)

### 0a. Bug-fix pass (October 26, 2026): sidebar overlap + maximum-update-depth loop

**Bug 1 — sidebar overlapped main content.** Root cause: the sidebar `aside` was `position: fixed` (removed from flex flow) while the content column was a plain `flex-1` with no offset, so all page content started at x=0 underneath the 256px drawer. Fix in `components/layout/main-layout.tsx`: the aside is now a real flex column item on desktop — `lg:sticky lg:top-0 lg:h-dvh` (in-flow, viewport-height, stays pinned while the page scrolls) — so content, header and footer start after it with no magic offsets; `w-64 shrink-0` keeps the width consistent. Mobile keeps the fixed off-canvas drawer (`-translate-x-full` when closed, so it cannot obscure the page) with a new close button in the drawer header, Escape-key close, and body scroll-lock while open; backdrop click already closed it. `.table-container` (`overflow-x: auto`) plus `min-w-0` on the content column keep long tables scrolling inside the content area. The old `sidebar.tsx`/`header.tsx` components remain unused legacy files (the real shell is self-contained in `main-layout.tsx`).

**Bug 2 — "Maximum update depth exceeded".** Root cause: `refreshDemoState` was created inline inside the context `useMemo` (`refreshDemoState: () => setVersion(…)`), so its identity changed on **every** version bump; `/notifications`, `/audit-log` and `/administration` each had `React.useEffect(() => { refreshDemoState(); }, [refreshDemoState])` — bump → new callback identity → effect reruns → bump — an infinite self-triggering loop. Fix: `refreshDemoState` is now a stable `React.useCallback(() => setVersion(v => v + 1), [])`; the context `useMemo` dependency list is fully exhaustive (`[version, toasts, addToast, removeToast, refreshDemoState]` — all stable or intentional) and the `eslint-disable react-hooks/exhaustive-deps` suppression was removed; the memo body now exposes the data `version` so the dependency is genuinely used. The redundant refresh effects were **deleted from all three pages** — every page already derives notifications, audit rows, metrics and overlap data directly from the reactive shared demo state (mutators call `notify()` → provider re-renders consumers), so nothing goes stale after status changes, transfers, assignments, or overlap reviews. A side benefit: rendering `children` unconditionally in `(app)/layout.tsx` (instead of gating on the signed-out client snapshot) also eliminated the dev-only "instant navigation" segment-drop validation errors, which appeared in the dev overlay for every `(app)` page.

**Checks after the fix:** `npx tsc --noEmit` 0 errors; `npm run lint` 0 errors / 0 warnings; `npm run build` green (16 routes); dev server returns 200 on `/login`, `/dashboard`, `/complaints`, `/institutions`, `/overlaps`, `/reports`, `/administration`, `/notifications`, `/audit-log`, `/profile`, `/help`; dev log free of errors; SSR HTML verified to contain the sticky sidebar (`lg:sticky`, `lg:h-dvh`), the drawer close button, and fully rendered page content. Interactive browser checks (drawer open/close at 375px, Escape handling, role switching, complaint actions, 1440px visual check) were not run in a real browser and require manual verification.

- **Demo state is module-level** (`let` variables in `lib/demo-state.ts`): resets on a hard page refresh, persists across client-side navigation. Acceptable for the demo; for persistence, move the store into context state (`useSyncExternalStore` or reducer in the provider).
- **Loosely-typed `Table`** (`Record<string, unknown>[]` + `as unknown as …` casts at call sites) is scaffolding; a `Table<T>` generic would remove the casts. Demonstration-safe, noted for post-demo cleanup.
- Initial cleanup removed a couple of destructured-but-unused context values (`getMetrics` on institution detail, `canUserChangeComplaint` on the Overlaps page) — behavior unchanged where the value was genuinely dead; the remaining permission logic uses `currentUser.role` directly.
- Manual browser checks still required for: demo role switch flows, dialog interactions (status change, assign, transfer), toast rendering, and CSV download triggered by a real user click (export code path runs in a click handler only).

## Part 3 — Enriched demo dataset & named demo accounts (October 28, 2026)

**Why:** the original synthetic data used real institution names with fabricated allegations attached, officer accounts on a real-looking `aicte.gov.in` domain, and only 5 generic demo users. The dataset was rebuilt end-to-end so nothing fabricated implies facts about real colleges, offices or people, and so every demo role is a named person.

### What changed

- **All 16 institutions are now fictional** (`Sunrise Valley Institute of Technology`, `Blue Ridge College of Engineering`, …) with `AICTE-DEMO-10xx` permanent IDs and contact emails/websites on reserved documentation domains (`*.example.edu`). No real institution names remain anywhere in `src/` (verified by workspace scan).
- **6 named demo accounts** (emails `*@example.com`, fictional): Tanmay Mugdal (System Administrator), Raghav Mangle (Bureau Officer, Regulation Bureau), Pranay Pedamkar (Bureau Officer, Public Grievance Redressal Cell), Niranjan Balwadkal (Bureau Officer, Approval Process Cell), Chaitrali Narkhede and Pranjal Thorat (Oversight Officers, read-only). Old accounts and all `aicte.gov.in` addresses removed, including the login placeholder.
- **42 complaints** (was 14) across all 10 bureaus/cells, every status in the state machine represented, each carrying a new `priority` field (`High` 13 / `Medium` 18 / `Low` 11) surfaced on the detail page and as a register column. Received dates Jun–Oct 2026 with deadlines engineered so **11 active cases are overdue** and **5 are due within 7 days** of the dataset anchor.
- **Deadline arithmetic is rule-driven, not hand-typed:** `lib/demo-state.ts` recomputes `isOverdue`/`daysOverdue` (overdue = active status AND disposal date past the anchor) and metrics on every read/mutation from a single `DEMO_DATA_AS_OF = "2026-10-28"` anchor constant (PPR forbids a live `new Date()` in the render path; a fixed snapshot keeps the demo internally consistent forever).
- **13 overlap alerts** (one per institution with active cases in ≥2 desks) with mixed review states seeded via `SEED_ALERT_REVIEWS`: 8 `new`, 2 `reviewed`, 1 `related`, 1 `not_overlapping`, 1 `coordination_required` — so the review workflow can be demonstrated immediately, including alerts where the officer concluded there was no overlap. Detection now carries prior review state forward only when the underlying case combination is unchanged (sorted case-ID set comparison), so repeated detection is idempotent — same alert IDs, no duplicates, review decisions survive unrelated case mutations, and a changed case set resets the alert to `new`. Every alert also carries generated `matchReasons` ("why this was detected": shared AICTE ID, cases involved, desks involved, coordination hint) rendered in the expanded alert card. Negative examples included: an institution with several same-bureau complaints (inst-010), a rejected second-bureau case that must not trigger an alert (inst-015), and a cross-bureau pair that is all disposed/closed.
- **30 seeded history entries** (`SEED_STATUS_HISTORY` / `SEED_ASSIGNMENT_HISTORY` / `SEED_ACTION_HISTORY`, `h-seed-*` IDs): status timelines ending exactly at each complaint's current status, an initial-assignment and a SWRO→RB transfer record, plus notes/clarification/escalation entries — so the audit log and case timelines demonstrate real workflow before any user action. Runtime history records now store the actor's **display name** (resolved from the user list) instead of a raw user ID.
- **Role switcher → user switcher:** the sidebar now switches between all 6 named demo users (not 3 abstract roles), and notifications/permission logic is unchanged (roles still drive behaviour).

### Verification (October 28, 2026)

- `npx tsc --noEmit` 0 errors; `npm run lint` 0 errors / 0 warnings; `npm run build` green (18 route entries incl. PPR variants).
- Detection logic compiled and exercised headlessly: 13 alerts, unique IDs, exact status mix (8/2/1/1/1), re-detection idempotent (same count/IDs), seeded reviews restored on reset, runtime review survives re-detection, case-set change produces no duplicates.
- Served HTML spot-checks: dashboard shows 42 complaints / 11 overdue; institutions register lists fictional names only; audit log renders seeded actor names (no raw `user-*` IDs in content); complaints register shows the Priority column; all 6 accounts with `example.com` emails on `/login`; all routes (including detail pages and bogus-ID paths) return 200.
- `Reset demo data` restores the full enriched dataset including seeded reviews and histories.

## Part 4 — Empty Overlap Alerts fix, disclaimer cleanup & deployment readiness (October 28, 2026)

### Root cause of the empty Overlap Alerts page

`src/lib/demo-state.ts` initialised the module-level store with `let overlapAlerts = [];`. Detection (`detectOverlaps`) only ran inside mutation paths (`setComplaints`, `updateComplaintStatus`, `assignOfficer`, `transferCase`, `resetDemoData`) — never during initial state construction. A fresh page load therefore exposed zero alerts to the context, so `/overlaps` rendered an empty table with `0 New / 0 Reviewed`, the dashboard overlap widget showed no alerts, and notifications omitted the 8 seeded pending alerts. The Part 3 verification missed it because the headless check called `detectOverlaps` directly instead of exercising the store's initialisation path. (Clicking "Reset demo data" would have populated the page — the bug only affected the initial load.)

**Fix:** `overlapAlerts` is now initialised via `detectOverlaps(complaints, INSTITUTIONS)` so the seeded alerts (with seeded review states) exist before first render. `detectedAt` for seed-derived alerts uses the deterministic dataset anchor instead of a live clock, keeping the initial module evaluation PPR-safe. No hardcoded rows or counts were added; everything still derives from the same rule engine.

### Overlap Alerts page rework

- Summary badges now count the actual returned records per review state: **8 Pending review, 2 Reviewed, 1 Related, 1 Not overlapping, 1 Coordination required** (sums to 13 = table rows).
- Table shows institution name (linked to `/institutions/[id]`), canonical AICTE Permanent ID, related case IDs (each linked to `/complaints/[id]`), involved bureaus, case statuses, latest action date and review status.
- Review dialog shows the full alert context, generated "why this was detected" reasons, and any existing review (status, recorded reason, reviewer, date). A single submit path now requires a decision **and** a written reason; the reviewer is recorded from the signed-in demo user. Oversight roles get a read-only notice instead of controls.
- Human-review notice retained but styled as a normal informational note; detection explicitly described as rule-based (no ML claims).
- Dashboard widget review actions now attribute the signed-in user instead of a hardcoded ID.

### Disclaimer banner removal

- The repeated warning strip under the app header ("Demonstration prototype — all data is synthetic, no backend, not production-grade…") is removed from the authenticated layout.
- A compact footer note now carries the disclosure: independent demonstration prototype (SIH26264), synthetic data, not connected to AICTE production systems, changes reset on refresh, link to Help.
- The small "DEMO DATA" badge remains (restyled from warning to informational colour). Login-page disclosure that demo sign-in is not real authentication, the Help page's prototype section, and per-page "synthetic data" footnotes are retained.

### Regression test

`scripts/test-overlaps.mjs` (`npm run test:overlaps`) compiles the real `demo-data`, `formatting`, `overlap-detection` and `demo-state` modules into a cache folder and asserts, against the actual store:
1. initial demo state exposes a nonzero seeded alert set (13) — the empty-table regression;
2. per-status counts equal the returned records (8/2/1/1/1, sum = total);
3. every record carries the fields the page renders (institution, AICTE ID, ≥2 unique case IDs, ≥2 bureaus, statuses, match reasons, dates);
4. re-detection is idempotent (same IDs, no duplicates) and preserves seeded reviews;
5. a review updates the alert and moves the counts;
6. an unrelated complaint status change does not erase the review decision;
7. `resetDemoData` restores the seeded review states.

### Verification (October 28, 2026)

- `npx tsc --noEmit` — 0 errors.
- `npm run lint` — 0 errors / 0 warnings.
- `npm run build` — green, 18 route entries (PPR variants included).
- `npm run test:overlaps` — all 7 checks pass.
- Existing backend suite (`pytest backend/tests`) — 29 passed (backend untouched by this task).
- Served-HTML probes: `/overlaps` renders the 13 alert records with the 8/2/1/1/1 counters, institution links (`/institutions/inst-002`) and complaint links (`/complaints/complaint-*`); `/dashboard` shows "8 new" in the overlap widget; the disclaimer strip is absent and the footer note present; all routes (`/dashboard`, `/overlaps`, `/notifications`, `/complaints`, `/institutions`, `/reports`, `/administration`, `/audit-log`, `/profile`, `/help`, detail pages, invalid IDs, `/login`) return 200; invalid IDs render the inline not-found view.
- Outstanding manual browser checks: interactive review dialog, filters/sorting clicks, responsive drawer behaviour at mobile widths, and visual review at desktop widths — no browser automation is available in this environment.

### Deployment readiness

- No environment variables are required: the prototype performs no network calls and reads no secrets (verified: no `process.env`, `localhost` URLs, API keys or `.env` files in `src/`).
- Stack is a standard Next.js 16 app (React 19, Tailwind 4). `next.config.ts` uses `cacheComponents`/`partialPrefetching` (PPR) and Turbopack; **do not** use `output: "export"` — this app is not a static export.
- Recommended hosting (Vercel): import the repo, framework preset **Next.js**, build command `npm run build`, install `npm install`, no env vars. Alternative Node hosts: Node 20.9+ (or 24 LTS), `npm ci && npm run build && npm run start` behind a reverse proxy.
- Demo state is intentionally in-memory per browser tab (resets on hard refresh); this is documented in the footer/Help and requires no server.

## How to run

```powershell
cd INSTITUTION360
npm install      # already done in this workspace
npm run dev      # → http://localhost:3000
```

Production check:

```powershell
npm run build
npm run start    # serves the optimized build
```

## Suggested browser demo path

0. **Sign in** — `/login`: pick any of the 6 named demo accounts (Tanmay Mugdal admin, Raghav Mangle / Pranay Pedamkar / Niranjan Balwadkal bureau officers, Chaitrali Narkhede / Pranjal Thorat oversight), any password.
1. Dashboard → 7 metric cards (42 complaints, 11 overdue), Bureau-wise Workload & Status Distribution charts, Overlap Alerts widget.
2. Complaints → 42 case rows with Priority column, search/filters reset; "View" opens a detail page smoothly (PPR shell skeletons).
3. Complaint detail (as admin or the case's bureau officer) → change status / assign officer / transfer → all three history sections update with timestamped, actionable entries. Switch to Chaitrali or Pranjal (sidebar user switcher) to see the read-only notice.
4. Overlaps → 13 alerts with mixed states (8 new, 2 reviewed, 1 related, 1 not-overlapping, 1 coordination-required); expand an alert for the match reasons, and move a new alert through the review dialog — the decision persists across re-detection and resets restore it.
5. Reports → CSV export works; Administration → users, bureaus, thresholds and status definitions all render correctly (admin only; other roles are redirected to `/access-denied`).
6. Navigation lives in the new sidebar/bell/profile menu: `/notifications`, `/audit-log`, `/profile`, `/help`; sign out from the profile menu or sidebar footer returns to `/login`. Administration → "Reset demo data" restores the seed dataset behind a confirm dialog.
