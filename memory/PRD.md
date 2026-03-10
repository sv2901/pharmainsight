# PharmaInsight - AI Pharma Market Forecasting Consultant

## Problem Statement
Build an AI system that predicts pharmaceutical drug market size and adoption using 3 AI agents, generating consulting-grade reports with charts, for the Indian pharma market primarily.

## Architecture
- **Frontend**: React + Tailwind + Shadcn UI + Recharts
- **Backend**: FastAPI + MongoDB + emergentintegrations (OpenAI GPT-5.2)
- **AI Agents**: Market Research → Forecasting → Strategy (sequential pipeline)
- **Auth**: JWT-based with admin user management

## User Personas
1. **Pharmaceutical Consultant** - Primary user, generates market reports for clients
2. **Admin** - Manages team access, creates analyst accounts

## Core Requirements
- [x] JWT authentication with admin/analyst roles
- [x] Hidden admin panel (Ctrl+Shift+A on login page)
- [x] 3 AI agents using GPT-5.2 (Market Research, Forecast, Strategy)
- [x] Async report generation with status polling
- [x] 8-tab consulting report (Overview, Population, Competitors, Forecast, Revenue, Drivers, Risks, Strategy)
- [x] Interactive Recharts charts (Revenue Forecast, Adoption Curve, Scenario Comparison, Market Share Pie)
- [x] India-focused pharma market intelligence
- [x] Professional consulting firm aesthetic (Playfair Display + Manrope fonts)

## What's Been Implemented (March 10, 2026)
- Full backend with auth, user management, report CRUD, 3-agent orchestration
- Complete frontend with login, dashboard, new analysis, report view, admin panel
- Real-time AI-powered analysis using GPT-5.2 via Emergent LLM key
- Revenue Forecast, Adoption Rate, Scenario Comparison, Patient Funnel, Market Share charts
- Background task processing for report generation
- Admin user seeding on startup (admin@pharmainsight.com / admin123)

### Phase 2 (March 10, 2026)
- PDF Export: Professional consulting-style PDF with embedded matplotlib charts (cover page, 8 sections, tables, charts)
- Response Caching: 24-hour MongoDB-backed cache for agent results, dramatically reducing API costs on repeat analyses
- Quick Insight: Single-call rapid executive brief with Opportunity Score (1-10), GO/NO-GO recommendation, key metrics
- Historical Comparison: Side-by-side comparison of 2+ reports with revenue, CAGR, market size charts and executive summary comparison

## Prioritized Backlog
### P0 (Critical)
- All core features implemented ✅

### P1 (Important)
- Report sharing between team members
- Bulk drug analysis (analyze multiple drugs at once)
- Custom report templates
- Email notifications when report completes

### P2 (Nice to Have)
- Dashboard analytics (trends over time)
- Drug interaction analysis
- Multi-language support
- API rate limiting
- Report versioning and audit trail

## Next Tasks
1. Add report sharing/collaboration features
2. Bulk drug analysis (multiple drugs in one request)
3. Email notifications via SendGrid/Resend when report completes
4. Dashboard analytics with trend charts over time
5. Report versioning
