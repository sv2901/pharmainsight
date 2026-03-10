from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import asyncio
import hashlib
from pathlib import Path
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt as pyjwt

from agents.market_research_agent import run_market_research
from agents.forecast_agent import run_forecast
from agents.strategy_agent import run_strategy
from agents.quick_insight_agent import run_quick_insight
from pdf_generator import generate_report_pdf

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'pharmainsight-jwt-secret')
OPENAI_API_KEY = os.environ.get('emergentllmkey')

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---- Models ----
class LoginInput(BaseModel):
    email: str
    password: str

class RegisterInput(BaseModel):
    email: str
    password: str
    name: str
    role: str = "analyst"

class ReportInput(BaseModel):
    drug_name: str
    disease: str
    region: str = "India"
    forecast_horizon: int = 5

class QuickInsightInput(BaseModel):
    drug_name: str
    disease: str
    region: str = "India"

class CompareInput(BaseModel):
    report_ids: List[str]


# ---- Auth Utilities ----
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header.split(" ")[1]
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def require_admin(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ---- Startup ----
@app.on_event("startup")
async def seed_admin():
    existing = await db.users.find_one({"email": "admin@pharmainsight.com"})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": "admin@pharmainsight.com",
            "password": hash_password("admin123"),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Admin user seeded: admin@pharmainsight.com / admin123")


# ---- Auth Routes ----
@api_router.post("/auth/login")
async def login(input: LoginInput):
    user = await db.users.find_one({"email": input.email}, {"_id": 0})
    if not user or not verify_password(input.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], user["role"])
    return {
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}
    }

@api_router.post("/auth/register")
async def register(input: RegisterInput, admin=Depends(require_admin)):
    existing = await db.users.find_one({"email": input.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": input.email,
        "password": hash_password(input.password),
        "name": input.name,
        "role": input.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    return {"id": user_doc["id"], "email": user_doc["email"], "name": user_doc["name"], "role": user_doc["role"]}

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}


# ---- Admin Routes ----
@api_router.get("/users")
async def list_users(admin=Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(100)
    return users

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin=Depends(require_admin)):
    if admin["id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}


# ---- Report Routes ----
@api_router.post("/reports/generate")
async def generate_report(input: ReportInput, user=Depends(get_current_user)):
    report_id = str(uuid.uuid4())
    report_doc = {
        "id": report_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "drug_name": input.drug_name,
        "disease": input.disease,
        "region": input.region,
        "forecast_horizon": input.forecast_horizon,
        "status": "generating",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "market_research": None,
        "forecast": None,
        "strategy": None,
        "error": None
    }
    await db.reports.insert_one(report_doc)
    asyncio.create_task(_process_report(report_id, input))
    return {"id": report_id, "status": "generating"}

def _cache_key(drug_name, disease, region, forecast_horizon):
    raw = f"{drug_name.lower().strip()}|{disease.lower().strip()}|{region.lower().strip()}|{forecast_horizon}"
    return hashlib.sha256(raw.encode()).hexdigest()

async def _get_cached_agent(cache_key, agent_name):
    """Check MongoDB cache for a recent agent result (24h TTL)."""
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    cached = await db.agent_cache.find_one(
        {"cache_key": cache_key, "agent": agent_name, "created_at": {"$gte": cutoff}},
        {"_id": 0}
    )
    if cached:
        logger.info(f"Cache HIT for {agent_name} (key={cache_key[:12]}...)")
        return cached.get("data")
    return None

async def _set_cached_agent(cache_key, agent_name, data):
    await db.agent_cache.update_one(
        {"cache_key": cache_key, "agent": agent_name},
        {"$set": {"cache_key": cache_key, "agent": agent_name, "data": data, "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )

async def _process_report(report_id: str, input: ReportInput):
    try:
        ck = _cache_key(input.drug_name, input.disease, input.region, input.forecast_horizon)

        logger.info(f"Report {report_id}: Starting market research...")
        await db.reports.update_one({"id": report_id}, {"$set": {"status": "researching"}})
        market_data = await _get_cached_agent(ck, "market_research")
        if not market_data:
            market_data = await run_market_research(
                OPENAI_API_KEY, input.drug_name, input.disease, input.region, input.forecast_horizon
            )
            await _set_cached_agent(ck, "market_research", market_data)
        await db.reports.update_one({"id": report_id}, {"$set": {"market_research": market_data}})

        logger.info(f"Report {report_id}: Starting forecast...")
        await db.reports.update_one({"id": report_id}, {"$set": {"status": "forecasting"}})
        forecast_data = await _get_cached_agent(ck, "forecast")
        if not forecast_data:
            forecast_data = await run_forecast(
                OPENAI_API_KEY, market_data, input.drug_name, input.disease, input.region, input.forecast_horizon
            )
            await _set_cached_agent(ck, "forecast", forecast_data)
        await db.reports.update_one({"id": report_id}, {"$set": {"forecast": forecast_data}})

        logger.info(f"Report {report_id}: Starting strategy analysis...")
        await db.reports.update_one({"id": report_id}, {"$set": {"status": "analyzing"}})
        strategy_data = await _get_cached_agent(ck, "strategy")
        if not strategy_data:
            strategy_data = await run_strategy(
                OPENAI_API_KEY, market_data, forecast_data, input.drug_name, input.disease, input.region
            )
            await _set_cached_agent(ck, "strategy", strategy_data)
        await db.reports.update_one({"id": report_id}, {"$set": {"strategy": strategy_data, "status": "completed"}})
        logger.info(f"Report {report_id}: Completed successfully")
    except Exception as e:
        logger.error(f"Report {report_id} failed: {e}")
        await db.reports.update_one({"id": report_id}, {"$set": {"status": "failed", "error": str(e)}})

@api_router.get("/reports")
async def list_reports(user=Depends(get_current_user)):
    reports = await db.reports.find(
        {"user_id": user["id"]},
        {"_id": 0, "market_research": 0, "forecast": 0, "strategy": 0}
    ).sort("created_at", -1).to_list(50)
    return reports

@api_router.get("/reports/{report_id}")
async def get_report(report_id: str, user=Depends(get_current_user)):
    report = await db.reports.find_one({"id": report_id, "user_id": user["id"]}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@api_router.delete("/reports/{report_id}")
async def delete_report(report_id: str, user=Depends(get_current_user)):
    result = await db.reports.delete_one({"id": report_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"message": "Report deleted"}


# ---- PDF Export ----
@api_router.get("/reports/{report_id}/pdf")
async def export_report_pdf(report_id: str, token: str = None, request: Request = None):
    # Support both header auth and query param token for direct browser downloads
    user = None
    if token:
        try:
            payload = pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")
    else:
        user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    report = await db.reports.find_one({"id": report_id, "user_id": user["id"]}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report["status"] != "completed":
        raise HTTPException(status_code=400, detail="Report not yet completed")
    try:
        pdf_buffer = generate_report_pdf(report)
        filename = f"PharmaInsight_{report['drug_name']}_{report['region']}_{report['created_at'][:10]}.pdf"
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        import traceback
        logger.error(f"PDF generation failed: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="PDF generation failed")


# ---- Quick Insight ----
@api_router.post("/quick-insight")
async def quick_insight(input: QuickInsightInput, user=Depends(get_current_user)):
    try:
        result = await run_quick_insight(OPENAI_API_KEY, input.drug_name, input.disease, input.region)
        # Store quick insight
        await db.quick_insights.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "drug_name": input.drug_name,
            "disease": input.disease,
            "region": input.region,
            "result": result,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        return result
    except Exception as e:
        logger.error(f"Quick insight failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---- Report Comparison ----
@api_router.post("/reports/compare")
async def compare_reports(input: CompareInput, user=Depends(get_current_user)):
    if len(input.report_ids) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 reports to compare")
    reports = await db.reports.find(
        {"id": {"$in": input.report_ids}, "user_id": user["id"], "status": "completed"},
        {"_id": 0}
    ).to_list(10)
    if len(reports) < 2:
        raise HTTPException(status_code=400, detail="Not enough completed reports found")
    return reports


# ---- Include Router & Middleware ----
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Serve Static Frontend (Railway production) ----
frontend_build = Path(__file__).parent.parent / "frontend" / "build"
if frontend_build.exists():
    app.mount("/", StaticFiles(directory=str(frontend_build), html=True), name="static")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
