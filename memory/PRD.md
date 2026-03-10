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

## Prioritized Backlog
### P0 (Critical)
- All core features implemented ✅

### P1 (Important)
- PDF export of consulting reports
- Report sharing between team members
- Historical report comparison
- Bulk drug analysis

### P2 (Nice to Have)
- Dashboard analytics (trends over time)
- Custom report templates
- Drug interaction analysis
- Multi-language support
- API rate limiting and caching for GPT-5.2 calls

## Next Tasks
1. Add PDF export functionality for reports
2. Add report sharing/collaboration features
3. Implement caching to reduce GPT-5.2 API costs
4. Add more chart types (waterfall, treemap)
5. Add user activity audit log
