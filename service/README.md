# GridWise Service (FastAPI)

The Python service that powers the GridWise dashboard. The Next.js
front-end in `../src/` calls this service over HTTP — it owns the
analysis engine, recommendation catalog, and forecast math.

## Endpoints

| Method | Path              | Purpose                                       |
| ------ | ----------------- | --------------------------------------------- |
| GET    | `/health`         | Liveness probe + version info                 |
| POST   | `/analyze`        | Full analysis (totals, score, recs, breakdown)|
| POST   | `/recommendations`| Recommendations + potential-savings summary   |
| POST   | `/appliances`     | Hydrated appliance breakdown + monthly cost   |
| POST   | `/forecast`       | Baseline vs optimized bill / kWh projection   |
| GET    | `/docs`           | Auto-generated Swagger UI                     |

All `POST` endpoints accept an optional JSON body. Any omitted field
falls back to the bundled sample data, so an empty `{}` is a valid
request.

## Local development

```bash
# 1. install deps (Python 3.11+ recommended)
cd service
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt

# 2. copy env defaults (optional)
copy .env.example .env          # Windows
# cp .env.example .env          # macOS / Linux

# 3. run the server with hot reload
uvicorn main:app --reload --port 8000
```

Then visit:

- http://localhost:8000/        — service info
- http://localhost:8000/health  — health probe
- http://localhost:8000/docs    — Swagger UI

## Smoke test

```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/analyze -H "Content-Type: application/json" -d "{}"
curl -X POST http://localhost:8000/recommendations -H "Content-Type: application/json" -d "{}"
curl -X POST http://localhost:8000/appliances -H "Content-Type: application/json" -d "{}"
curl -X POST http://localhost:8000/forecast -H "Content-Type: application/json" -d "{\"horizons\": [7, 30, 365]}"
```

## Connecting the Next.js front-end

Set the dashboard's base URL to point at this service:

```bash
# in the project root, create .env.local
echo NEXT_PUBLIC_API_BASE=http://localhost:8000 > .env.local
npm run dev
```

When you deploy both halves to production, swap in the public URL of
the deployed FastAPI service (Render, Railway, Fly.io, Cloud Run, ECS,
etc.). The browser client (`src/lib/api-client.ts`) reads that env var
— there are no other code changes required.

## Project layout

```
service/
├── README.md           — this file
├── requirements.txt    — pinned Python deps
├── .env.example        — env var template
├── main.py             — FastAPI app + 5 endpoints + CORS
├── analyzer.py         — rule engine (mirror of src/lib/analyzer.ts)
├── schemas.py          — Pydantic models (mirror of src/lib/types.ts)
├── sample_data.py      — bundled default dataset
└── api_client.py       — Python client for calling the service
```
