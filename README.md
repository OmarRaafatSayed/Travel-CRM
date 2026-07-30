# Travel Agency CRM — Professional Edition

A production-grade, full-stack CRM built for travel agencies. Handles real-time flight search, hotel inventory management, visa tracking, and manual payment recording — with secure multi-user authentication backed by Supabase.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI (Python 3.12), Pydantic v2, python-jose |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth — JWT, persisted in `localStorage` |
| Scraping | Playwright + Chromium (Network Interception Engine) |
| Optional | Bright Data Cloud Browser (secondary scraping fallback) |
| Deployment | Docker + Docker Compose, Nginx reverse proxy |

---

## Features

- **Real-time Flight Search** — Intercepts Google Flights XHR responses via Playwright. No CSS selectors. No fragile HTML parsing. Results cached in Supabase for 12 hours.
- **Hotel Inventory Management** — Bulk-upload hotel offers from Excel / CSV / DOCX. Full CRUD with per-user data isolation.
- **Persistent Authentication** — Session token stored in `localStorage`; survives page refresh. Token automatically attached to every API request.
- **Multi-tenancy / Data Isolation** — Every database write is tagged with `created_by` (profile UUID). Users only ever see their own records.
- **JWT Auth Guard** — All protected API endpoints require a valid Supabase Bearer token. Missing or expired tokens return `401 Unauthorized`.
- **Visa Tracking** — State-machine lifecycle from document collection → embassy appointment → approval.
- **Manual Payment Ledger** — Track offline cash, bank transfers, cheques, and POS payments with full audit trail.
- **Bilingual UI** — Full Arabic / English support with RTL layout via `react-i18next`.

---

## Project Structure

```
travel-agency-custom/
├── src/                          # React frontend (Vite)
│   ├── components/               # UI components
│   │   ├── FlightSearch.tsx
│   │   ├── HotelManagement.tsx
│   │   ├── VisaManagement.tsx
│   │   ├── ManualPaymentLedger.tsx
│   │   └── Sidebar.tsx
│   ├── services/
│   │   ├── api.ts                # FastAPI client (auto-injects Bearer token)
│   │   └── supabase.ts           # Session store (localStorage + memory cache)
│   ├── i18n/locales/             # en.ts + ar.ts translation files
│   └── App.tsx                   # Root component with persistent auth logic
│
├── fastapi-backend/fastapi-backend/
│   ├── main.py                   # App entry point + fail-fast env validation
│   └── app/
│       ├── core/security.py      # JWT dependency (require_auth)
│       ├── routers/
│       │   ├── auth.py           # /signup, /login
│       │   ├── flights.py        # /search (🔒), /health
│       │   ├── hotels.py         # /bulk-insert (🔒), /search (🔒)
│       │   └── documents.py      # /parse-hotel-data (🔒)
│       ├── services/
│       │   ├── supabase_client.py
│       │   ├── brightdata_scraper.py
│       │   └── flight_cache.py
│       └── middleware/security.py
│
├── supabase/migrations/          # SQL migrations (run in Supabase SQL Editor)
├── docker-compose.yml
├── Dockerfile
└── .env.example                  # Template — copy to .env and fill in values
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.12+
- A [Supabase](https://supabase.com) project
- (Optional) [Playwright](https://playwright.dev) for flight scraping

### 1. Clone & install

```bash
git clone https://github.com/OmarRaafatSayed/Travel-CRM.git
cd Travel-CRM
```

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd fastapi-backend/fastapi-backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
playwright install chromium   # required for flight scraping
```

### 2. Configure environment variables

**Backend** — copy the template and fill in your values:
```bash
cp fastapi-backend/fastapi-backend/.env.example fastapi-backend/fastapi-backend/.env
```

Open `.env` and set all **REQUIRED** keys (see `.env.example` for the full list):

```env
# Supabase — get from: https://app.supabase.com/project/<id>/settings/api
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
SUPABASE_JWT_SECRET=

# JWT — generate with: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=
```

**Frontend** — create `.env.production` (or `.env.local` for dev):
```env
VITE_API_URL=http://localhost:8000/api/v1
```

### 3. Apply database migrations

In your **Supabase Dashboard → SQL Editor**, run the following files in order:

1. `minimal_schema.sql` — profiles + organizations tables
2. `single-tenant-migration.sql` — hotel_offers, visa_tracking, payments, etc.
3. `supabase/migrations/hotel_offers_ensure_schema.sql` — indexes + RLS policies

### 4. Run the application

**Backend** (in one terminal):
```bash
cd fastapi-backend/fastapi-backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend** (in another terminal):
```bash
npm run dev
# → http://localhost:4000
```

---

## API Endpoints

### Auth (public)
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/signup` | Register new user |
| POST | `/api/v1/auth/login` | Login → returns Bearer token |

### Flights 🔒
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/flights/search` | Real-time flight search |
| POST | `/api/v1/flights/clear-cache` | Purge expired cache |
| GET | `/api/v1/flights/health` | Public health check |

### Hotels 🔒
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/hotels/bulk-insert` | Persist hotel offers |
| GET | `/api/v1/hotels/search` | Search with filters |
| DELETE | `/api/v1/hotels/offers/{id}` | Soft-delete an offer |

### Documents 🔒
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/documents/parse-hotel-data` | Parse Excel/CSV/DOCX |

> 🔒 All protected endpoints require: `Authorization: Bearer <access_token>`

---

## Docker Deployment

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f
```

---

## Security Notes

- All secrets are loaded from environment variables. The app **refuses to start** if `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, or `JWT_SECRET_KEY` are missing.
- `.env` and `.env.production` files are in `.gitignore` and must **never** be committed.
- Only `.env.example` (with empty values) is tracked by Git.
- Database writes include `created_by` for application-level data isolation, in addition to Supabase RLS policies.

---

## License

MIT
