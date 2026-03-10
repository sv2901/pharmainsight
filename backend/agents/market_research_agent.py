import json
import re
import logging
from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("EMERGENT_LLM_KEY"))

logger = logging.getLogger(__name__)


async def run_market_research(api_key, drug_name, disease, region, forecast_horizon):
    chat = LlmChat(
        api_key=api_key,
        session_id=f"mr-{drug_name}-{region}-{id(api_key)}",
        system_message=(
            "You are an expert pharmaceutical market research analyst specializing in global and Indian pharmaceutical markets. "
            "You provide accurate, data-driven market intelligence based on real epidemiological data, published clinical studies, "
            "WHO/ICMR reports, and industry databases. All data must be based on real published sources. "
            "Return ONLY valid JSON with no markdown formatting or extra text."
        )
    ).with_model("openai", "gpt-5.2")

    prompt = f"""Conduct a comprehensive market research analysis:

Drug Name: {drug_name}
Disease Area: {disease}
Region: {region}
Forecast Horizon: {forecast_horizon} years

Return a JSON object with this exact structure (all numbers must be realistic and based on actual published data for {region}):

{{
  "market_overview": {{
    "disease_name": "{disease}",
    "drug_name": "{drug_name}",
    "region": "{region}",
    "market_summary": "A 3-4 sentence overview of the current market landscape for this drug/disease in this region",
    "current_market_size_usd_millions": 0,
    "projected_market_size_usd_millions": 0,
    "market_growth_rate_pct": 0,
    "key_market_trends": ["trend1", "trend2", "trend3", "trend4"]
  }},
  "patient_population": {{
    "total_population": 0,
    "disease_prevalence_rate_pct": 0,
    "total_patients": 0,
    "diagnosed_patients": 0,
    "eligible_for_treatment": 0,
    "currently_treated": 0,
    "treatment_gap": 0,
    "annual_new_cases": 0,
    "data_sources": ["source1", "source2"]
  }},
  "competitor_landscape": {{
    "competitors": [
      {{
        "drug_name": "name",
        "manufacturer": "company",
        "market_share_pct": 0,
        "avg_annual_cost_usd": 0,
        "mechanism": "mechanism of action",
        "approval_year": 2020,
        "strengths": ["str1"],
        "weaknesses": ["weak1"]
      }}
    ],
    "market_concentration": "description",
    "pricing_overview": "overview of pricing dynamics",
    "unmet_needs": ["need1", "need2"]
  }},
  "treatment_dynamics": {{
    "current_treatment_rate_pct": 0,
    "treatment_penetration_pct": 0,
    "avg_drug_price_annual_usd": 0,
    "price_sensitivity": "High/Medium/Low",
    "reimbursement_landscape": "description",
    "key_prescriber_segments": ["segment1", "segment2"]
  }}
}}

Requirements:
- All numbers must be realistic based on published epidemiological data
- Include at least 4-5 competitors with real drug names and manufacturers
- Prices should reflect actual market prices in {region}
- Return ONLY the JSON object"""

    response = await chat.send_message(UserMessage(text=prompt))
    return _parse_json(response, "market research")


def _parse_json(response, agent_name):
    text = response.strip()
    if text.startswith("```"):
        parts = text.split("```")
        if len(parts) >= 2:
            text = parts[1]
            if text.startswith("json"):
                text = text[4:]
        text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            return json.loads(json_match.group())
        logger.error(f"Failed to parse {agent_name} response: {response[:300]}")
        raise ValueError(f"Failed to parse {agent_name} agent response as JSON")
