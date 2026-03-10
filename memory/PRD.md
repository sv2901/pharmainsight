# PharmaInsight - Product Requirements Document

## Original Problem Statement
Build an AI-powered pharmaceutical market forecasting consultant web application. The app uses three sequential AI agents (Market Research, Forecasting, Strategy) to generate detailed market reports for drugs/diseases in specific regions.

The application was originally built on the Emergent platform and has been migrated to be self-contained and deployable on Railway.

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI, Recharts
- **Backend**: FastAPI, Python, MongoDB (motor async driver)
- **AI**: Standard `openai` Python SDK (gpt-4o model)
- **Auth**: JWT-based with bcrypt password hashing
- **Production Server**: gunicorn with UvicornWorker
- **Deployment**: Railway (Procfile-based)

## Core Features (All Implemented)
- [x] User authentication (admin & standard users)
- [x] 3-agent AI pipeline (Market Research -> Forecast -> Strategy)
- [x] Multi-tab report viewer with charts (Recharts)
- [x] PDF report export
- [x] Response caching (24h TTL in MongoDB)
- [x] Quick Insight feature (rapid executive summary)
- [x] Historical report comparison
- [x] Admin panel (user management)

## Railway Deployment Configuration (Completed)
- [x] Removed `emergentintegrations` dependency
- [x] Switched all agents to standard `openai` SDK
- [x] API key read from `emergentllmkey` env var
- [x] Frontend uses relative `/api` baseURL
- [x] Backend serves static React frontend build
- [x] `Procfile` created with gunicorn command
- [x] `runtime.txt` created (python-3.11.8)
- [x] `requirements.txt` updated (no emergentintegrations, added gunicorn)

## Railway Deployment Steps
1. Push code to GitHub
2. Connect repo to Railway
3. Set environment variables on Railway:
   - `emergentllmkey` = your OpenAI API key
   - `MONGO_URL` = your MongoDB connection string
   - `DB_NAME` = your database name
   - `JWT_SECRET` = a secure random string
4. Set build command: `cd frontend && yarn install && yarn build`
5. Railway will use the Procfile to start the server

## Key API Endpoints
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (admin only)
- `GET /api/auth/me` - Current user
- `POST /api/reports/generate` - Start new analysis
- `GET /api/reports` - List reports
- `GET /api/reports/{id}` - Get report
- `GET /api/reports/{id}/pdf` - Download PDF
- `POST /api/quick-insight` - Quick summary
- `POST /api/reports/compare` - Compare reports
- `GET /api/users` - Admin: list users

## Database Collections
- **users**: id, email, password, name, role, created_at
- **reports**: id, user_id, drug_name, disease, region, status, market_research, forecast, strategy
- **agent_cache**: cache_key, agent, data, created_at
- **quick_insights**: id, user_id, drug_name, disease, region, result, created_at

## Test Credentials
- Email: admin@pharmainsight.com
- Password: admin123
