# INSTITUTION360 — Backend (FastAPI + PostgreSQL)

Backend for the AICTE institution-related complaint monitoring and tracking
system (SIH26264). This is the initial backend foundation; the Next.js frontend
in the repository root currently runs standalone on synthetic demo data and is
**not yet wired** to this API.

**Demonstration stage:** seeded synthetic data, demo-grade authentication
(PBKDF2 password hashes + JWT). Do not use real credentials.

## Stack

- Python 3.11+, FastAPI
- PostgreSQL (psycopg 3) — SQLite supported for local dev/tests
- SQLAlchemy 2.x, Alembic migrations
- Pydantic v2 request/response schemas
- PyJWT access tokens

## Setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env   # then edit .env — set SECRET_KEY and DATABASE_URL
```

Create the schema and seed demo data (SQLite local dev):

```powershell
.venv\Scripts\python -m alembic upgrade head
.venv\Scripts\python -m app.seed
```

For PostgreSQL, set `DATABASE_URL=postgresql+psycopg://user:pass@host:5432/db`
in `.env` **before** running the migration commands.

Run the API:

```powershell
.venv\Scripts\uvicorn app.main:app --reload --port 8000
```

- Health check: http://localhost:8000/api/health
- Interactive docs: http://localhost:8000/docs

Run tests:

```powershell
.venv\Scripts\python -m pytest tests -q
```

Tests use an in-memory SQLite database via dependency overrides; they never
touch the configured database.

## Demo accounts (seeded)

| Name | Email | Role | Bureau |
| --- | --- | --- | --- |
| Rajesh Kumar | admin@demo.institution360.gov | admin | — |
| Priya Sharma | priya.sharma@demo.institution360.gov | bureau_officer | RB |
| Amit Patel | amit.patel@demo.institution360.gov | bureau_officer | PGRC |
| Sunita Reddy | sunita.reddy@demo.institution360.gov | oversight_officer | — |
| Vikram Singh | vikram.singh@demo.institution360.gov | bureau_officer | APC |

Password for all seeded accounts: the `SEED_PASSWORD` value from `.env`
(default `demo-password-123`). These are demonstration credentials only.

## API surface (`/api`)

| Endpoint | Method | Auth | Notes |
| --- | --- | --- | --- |
| `/health` | GET | public | service status |
| `/auth/login` | POST | public | returns JWT + user |
| `/auth/me` | GET | bearer | current user |
| `/institutions`, `/institutions/{id}`, `/institutions/{id}/complaints` | GET | bearer | read; detail includes case-history counts |
| `/complaints` | GET | bearer | filters: search, bureau_code, status, category, is_overdue, page |
| `/complaints/{id}` | GET | bearer | case detail |
| `/complaints/{id}/history` | GET | bearer | merged status/assignment/action history |
| `/complaints/{id}/status-change` | POST | bearer, non-oversight, bureau-scoped | validates lifecycle transitions |
| `/complaints/{id}/assignment` | POST | bearer, non-oversight, bureau-scoped | same-bureau officer only |
| `/complaints/{id}/transfer` | POST | bearer, non-oversight, bureau-scoped | target bureau + its officer |
| `/overlaps` | GET | bearer | list alerts (filter by alert_status) |
| `/overlaps/detect` | POST | bearer, non-oversight | cross-bureau detection keyed on AICTE Permanent ID |
| `/overlaps/{id}/review` | POST | bearer, non-oversight | review decision + reason |
| `/notifications` | GET | bearer | overdue / due-soon / new-overlap alerts |
| `/reports/summary`, `/reports/summary.csv` | GET | bearer | bureau/region/status/ageing reports |
| `/dashboard/metrics` | GET | bearer | dashboard metric cards |
| `/audit-events` | GET | admin only | audit trail |

## Server-enforced role rules

- `admin`: full access.
- `bureau_officer`: read everything; mutations only on complaints owned by
  their bureau (403 otherwise).
- `oversight_officer`: read-only (403 on all mutations).

## Frontend ↔ backend mapping

See `app/models/mapping.py` for the explicit mapping from the frontend's
`src/types/index.ts` demo types to backend models. Derived fields the frontend
stores (`isOverdue`, `daysOverdue`) are computed on read; `DemoConfig`
thresholds live in environment settings. The frontend still consumes synthetic
in-memory data; wiring it to this API is pending (by design, in a later phase).
