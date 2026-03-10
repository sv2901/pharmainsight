import json
import re
import logging
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)


async def run_strategy(api_key, market_data, forecast_data, drug_name, disease, region):
    chat = LlmChat(
        api_key=api_key,
        session_id=f"st-{drug_name}-{region}-{id(api_key)}",
        system_message=(
            "You are a senior pharmaceutical strategy consultant at a top-tier firm (McKinsey/BCG level). "
            "You provide executive-ready strategic insights and recommendations based on market research and forecast data. "
            "Your analysis must be structured, specific, and actionable. "
            "Return ONLY valid JSON with no markdown formatting or extra text."
        )
    ).with_model("openai", "gpt-5.2")

    prompt = f"""Based on the market research and forecast data below, provide a comprehensive strategic analysis for commercializing {drug_name} for {disease} in {region}.

Market Research:
{json.dumps(market_data, indent=2)}

Forecast Data:
{json.dumps(forecast_data, indent=2)}

Return a JSON object with this exact structure:

{{
  "executive_summary": "A concise 4-5 sentence executive summary of the strategic outlook",
  "market_drivers": [
    {{
      "driver": "Driver name",
      "impact": "High/Medium/Low",
      "description": "2-3 sentence explanation",
      "timeframe": "Short-term/Medium-term/Long-term"
    }}
  ],
  "key_risks": [
    {{
      "risk": "Risk name",
      "severity": "High/Medium/Low",
      "probability": "High/Medium/Low",
      "description": "2-3 sentence explanation",
      "mitigation": "Recommended mitigation strategy"
    }}
  ],
  "competitive_threats": [
    {{
      "threat": "Threat description",
      "source": "Competitor or market force",
      "impact_level": "High/Medium/Low",
      "response_strategy": "How to respond"
    }}
  ],
  "pricing_strategy": {{
    "recommended_price_range_usd": "range as string",
    "pricing_model": "description of pricing model",
    "rationale": "explanation",
    "competitive_positioning": "premium/parity/discount"
  }},
  "market_entry_strategy": {{
    "recommended_approach": "overall approach description",
    "phase_1": {{
      "description": "First phase strategy",
      "timeline": "timeline",
      "target_segment": "target"
    }},
    "phase_2": {{
      "description": "Second phase strategy",
      "timeline": "timeline",
      "target_segment": "target"
    }},
    "phase_3": {{
      "description": "Third phase strategy",
      "timeline": "timeline",
      "target_segment": "target"
    }},
    "key_success_factors": ["factor1", "factor2", "factor3"]
  }},
  "strategic_recommendations": [
    {{
      "recommendation": "Recommendation title",
      "priority": "High/Medium/Low",
      "rationale": "Why this matters",
      "expected_impact": "Expected impact description",
      "implementation_timeline": "timeline"
    }}
  ]
}}

Requirements:
- Provide at least 4-5 market drivers
- Provide at least 4-5 key risks with mitigations
- Provide at least 3 competitive threats
- Provide at least 5 strategic recommendations ranked by priority
- All insights must be specific to {region} market dynamics
- Return ONLY the JSON object"""

    response = await chat.send_message(UserMessage(text=prompt))
    return _parse_json(response, "strategy")


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
