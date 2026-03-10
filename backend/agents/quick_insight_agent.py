import json
import re
import logging
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)


async def run_quick_insight(api_key, drug_name, disease, region):
    chat = LlmChat(
        api_key=api_key,
        session_id=f"qi-{drug_name}-{region}-{id(api_key)}",
        system_message=(
            "You are a senior pharmaceutical market analyst providing rapid executive briefs. "
            "You provide concise, data-driven 1-page assessments. All data must be based on real published sources. "
            "Return ONLY valid JSON with no markdown or extra text."
        )
    ).with_model("openai", "gpt-5.2")

    prompt = f"""Provide a rapid executive brief for the following pharmaceutical opportunity:

Drug: {drug_name}
Disease: {disease}
Region: {region}

Return a JSON object with this exact structure:

{{
  "opportunity_score": <number 1-10>,
  "score_rationale": "1-2 sentence explanation of the score",
  "market_size_estimate_usd_millions": <number>,
  "market_growth_pct": <number>,
  "patient_population_millions": <number>,
  "treatment_penetration_pct": <number>,
  "key_competitors": [
    {{"name": "drug name", "market_share_pct": <number>, "manufacturer": "company"}}
  ],
  "top_opportunities": [
    "opportunity 1",
    "opportunity 2",
    "opportunity 3"
  ],
  "top_risks": [
    "risk 1",
    "risk 2",
    "risk 3"
  ],
  "go_no_go": "GO / CONDITIONAL GO / NO GO",
  "go_no_go_rationale": "2-3 sentence rationale for the recommendation",
  "brief_analysis": "A concise 3-4 sentence executive summary of the market opportunity",
  "recommended_price_range_usd": "annual price range as string",
  "estimated_peak_revenue_usd_millions": <number>,
  "time_to_peak_years": <number>
}}

Requirements:
- All numbers must be realistic and based on published data for {region}
- Include 4-5 key competitors
- Be decisive in the GO/NO GO recommendation
- Return ONLY the JSON object"""

    response = await chat.send_message(UserMessage(text=prompt))

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
        logger.error(f"Failed to parse quick insight response: {response[:300]}")
        raise ValueError("Failed to parse quick insight response")
