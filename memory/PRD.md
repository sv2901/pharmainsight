# PharmaInsight - Product Requirements Document

## Original Problem Statement
Build an AI-powered pharmaceutical market forecasting consultant web application. The app uses three sequential AI agents (Market Research, Forecasting, Strategy) to generate detailed market reports for drugs/diseases in specific regions. Must be deployable on Railway.

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI, Recharts
- **Backend**: FastAPI, Python, MongoDB (motor async driver)
- **AI**: Standard `openai` Python SDK (gpt-4o model)
- **Auth**: JWT-based with bcrypt password hashing
- **Deployment**: Railway (Railpack builder)

## Core Features (All Implemented)
- [x] User authentication (admin & standard users)
- [x] 3-agent AI pipeline (Market Research -> Forecast -> Strategy)
- [x] Multi-tab report viewer with charts
- [x] PDF report export
- [x] Response caching (24h TTL in MongoDB)
- [x] Quick Insight feature
- [x] Historical report comparison
- [x] Admin panel (user management)

## Railway Deployment Configuration (Completed)
- [x] Removed `emergentintegrations` dependency
- [x] Switched all agents to standard `openai` SDK
- [x] API key read from `emergentllmkey` env var
- [x] Frontend uses relative `/api` baseURL
- [x] Backend serves static React frontend build
- [x] `certifi` CA certificates for MongoDB Atlas SSL
- [x] Conditional TLS (Atlas only, not localhost)
- [x] Resilient startup (seed_admin won't crash app)
- [x] Updated pymongo 4.16.0 + motor 3.7.1 (Python 3.13 compatible)
- [x] `.python-version` file for Railpack (3.11)

## Railway Settings
- Root Directory: `/backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- Environment Variables: `emergentllmkey`, `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `CORS_ORIGINS`

## Key API Endpoints
- `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`
- `POST /api/reports/generate`, `GET /api/reports`, `GET /api/reports/{id}`, `GET /api/reports/{id}/pdf`
- `POST /api/quick-insight`, `POST /api/reports/compare`, `GET /api/users`

## Test Credentials
- Email: admin@pharmainsight.com
- Password: admin123
