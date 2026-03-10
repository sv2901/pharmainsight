import json
import re
import logging
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)


async def run_forecast(api_key, market_data, drug_name, disease, region, forecast_horizon):
    chat = LlmChat(
        api_key=api_key,
        session_id=f"fc-{drug_name}-{region}-{id(api_key)}",
        system_message=(
            "You are an expert pharmaceutical market forecasting analyst. "
            "You build quantitative market forecasts using: Revenue = Patient Population x Treatment Rate x Adoption Rate x Drug Price. "
            "Generate base, best, and worst case scenarios with mathematically consistent calculations. "
            "Return ONLY valid JSON with no markdown formatting or extra text."
        )
    ).with_model("openai", "gpt-5.2")

    prompt = f"""Based on the following market research data, generate a quantitative forecast for {drug_name} in {disease} market in {region} over {forecast_horizon} years.

Market Research Data:
{json.dumps(market_data, indent=2)}

Formula: Revenue = Eligible Patients x Treatment Rate x Adoption Rate x Annual Drug Price

Return a JSON object with this exact structure:

{{
  "forecast_parameters": {{
    "eligible_patients": 0,
    "drug_price_annual_usd": 0,
    "base_initial_treatment_rate": 0.0,
    "base_initial_adoption_rate": 0.0,
    "best_initial_treatment_rate": 0.0,
    "best_initial_adoption_rate": 0.0,
    "worst_initial_treatment_rate": 0.0,
    "worst_initial_adoption_rate": 0.0,
    "annual_patient_growth_rate": 0.0
  }},
  "yearly_forecast": [
    {{
      "year": 2025,
      "eligible_patients": 0,
      "adoption_rate_base": 0.0,
      "adoption_rate_best": 0.0,
      "adoption_rate_worst": 0.0,
      "patients_treated_base": 0,
      "patients_treated_best": 0,
      "patients_treated_worst": 0,
      "revenue_base_millions": 0,
      "revenue_best_millions": 0,
      "revenue_worst_millions": 0
    }}
  ],
  "summary": {{
    "cagr_base_pct": 0,
    "cagr_best_pct": 0,
    "cagr_worst_pct": 0,
    "total_cumulative_revenue_base_millions": 0,
    "total_cumulative_revenue_best_millions": 0,
    "total_cumulative_revenue_worst_millions": 0,
    "peak_year": 2030,
    "peak_revenue_base_millions": 0
  }},
  "adoption_curve": {{
    "curve_type": "S-curve or Modified Bass",
    "description": "Brief description of the adoption pattern",
    "inflection_point_year": 2027
  }}
}}

Requirements:
- Generate data for each year from current year to current year + {forecast_horizon}
- Adoption rates should follow an S-curve pattern
- Best case should be 20-40% more optimistic than base
- Worst case should be 20-40% more pessimistic than base
- All numbers must be mathematically consistent
- Revenue in millions USD
- Return ONLY the JSON object"""

    response = await chat.send_message(UserMessage(text=prompt))
    return _parse_json(response, "forecast")


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
