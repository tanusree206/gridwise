# GridWise

AI-powered energy analysis **web service** with a Next.js dashboard
front-end. The analysis engine, recommendation catalog, and forecast
math live in a Python FastAPI service. The dashboard renders the
service's JSON.

## Architecture

```
┌────────────────────────┐    HTTP/JSON    ┌────────────────────────┐
│  Next.js dashboard     │ ───────────────▶│  FastAPI service       │
│  (src/)                │ ◀───────────────│  (service/)            │
│  Port 3000             │                 │  Port 8000             │
└────────────────────────┘                 └────────────────────────┘
```

The browser client (`src/lib/api-client.ts`) reads `NEXT_PUBLIC_API_BASE`
to find the service. Set it to your FastAPI URL — see
[`.env.local.example`](./.env.local.example).

## Layout

```
.
├── src/                Next.js 14 app router dashboard
│   ├── app/            pages: /, /usage, /recommendations, /forecast, /appliances, /about
│   ├── components/     sidebar, charts, recommendation cards, modals
│   └── lib/            shared types, api client, in-process analyzer fallback
├── service/            FastAPI service (Python)
│   ├── main.py         FastAPI app + 5 endpoints + CORS
│   ├── analyzer.py     rule engine (port of src/lib/analyzer.ts)
│   ├── schemas.py      Pydantic models (port of src/lib/types.ts)
│   ├── sample_data.py  bundled default dataset
│   ├── api_client.py   Python client for the service
│   └── requirements.txt
├── .env.local.example  dashboard env template
└── package.json
```

## Run locally — two processes

### 1. Start the FastAPI service

```bash
cd service
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

…or from the project root:

```bash
npm run service:install
npm run service:dev
```

Open the Swagger UI at http://localhost:8000/docs.

### 2. Start the dashboard

```bash
copy .env.local.example .env.local   # Windows
# cp .env.local.example .env.local   # macOS / Linux
npm install
npm run dev
```

Dashboard at http://localhost:3000.

## Service endpoints

| Method | Path               | Purpose                                          |
| ------ | ------------------ | ------------------------------------------------ |
| GET    | `/health`          | Liveness probe                                   |
| POST   | `/analyze`         | Full analysis (score, recs, breakdown)           |
| POST   | `/recommendations` | Rec catalog + potential-savings summary          |
| POST   | `/appliances`      | Hydrated appliance breakdown                     |
| POST   | `/forecast`        | Baseline vs optimized projection over horizons   |
| GET    | `/docs`            | Auto-generated Swagger UI                        |

All `POST` endpoints accept an optional JSON body. Empty `{}` is valid.

## Smoke tests

```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/analyze -H "Content-Type: application/json" -d "{}"
```

## Deploy

The two halves deploy independently.

- **Service** → any Python host: Render, Railway, Fly.io, Cloud Run,
  AWS ECS, etc. Set `GRIDWISE_ALLOWED_ORIGINS` to your dashboard's
  origin so CORS is locked down in production.
- **Dashboard** → Vercel. Set `NEXT_PUBLIC_API_BASE` to the deployed
  service URL.

When `NEXT_PUBLIC_API_BASE` is empty, the dashboard's `gridwise`
client hits relative paths — convenient for preview deployments
before the Python service is wired up.
