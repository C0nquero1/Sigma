import json
import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

logger = logging.getLogger("StreetAI.QueryCompiler")

class QueryExecutionPlan(BaseModel):
    target_region: str = Field(..., description="Specific market, corridor, or city extracted from prompt")
    target_commodity: Optional[str] = Field("General Merchandise", description="Target product or sector")
    query_objective: str = Field(
        ..., 
        description="Intent type: ARBITRAGE_PRICE | VENDOR_DENSITY | CASH_VELOCITY | SUPPLY_FRICTION | MACRO_VOLUME"
    )
    cadence: str = Field("DAILY", description="Timeframe: HOURLY | DAILY | WEEKLY | ANNUALLY")
    focal_question: str = Field(..., description="Single sentence defining exactly what decision the user is making")
    sub_clusters: List[str] = Field(default_factory=list, description="Specific sub-zones, gates, or roads mentioned")
    risk_vectors: List[str] = Field(default_factory=list, description="Implicit risks: currency, logistics, police, weather")

SYSTEM_DECOMPILER_PROMPT = """
You are the Lead Telemetry Query Decompiler for Street AI.
Analyze the user's prompt and extract structured operational intent into a JSON object adhering to this schema:
{
  "target_region": "Name of city, market, or informal settlement",
  "target_commodity": "Specific sector, good, or currency rail",
  "query_objective": "ARBITRAGE_PRICE | VENDOR_DENSITY | CASH_VELOCITY | SUPPLY_FRICTION | MACRO_VOLUME",
  "cadence": "HOURLY | DAILY | WEEKLY | ANNUALLY",
  "focal_question": "Direct summary of the core operational question",
  "sub_clusters": ["Sub-district 1", "Gate/Terminal 2"],
  "risk_vectors": ["Identified operational risk 1", "Risk 2"]
}
Rules:
- Infer implicit regions: 'Wuse' -> target_region: 'Wuse Market, Abuja'. 'Dharavi' -> target_region: 'Dharavi, Mumbai'.
- Standardize commodities: 'tyres' -> 'Rubber & Automotive'. 'foodstuff' -> 'Staple Groceries'.
- Never hallucinate regions outside the prompt's intent. Output pure JSON only.
"""

def compile_user_prompt(prompt: str, groq_client, active_model: str) -> QueryExecutionPlan:
    if not groq_client or active_model == "fallback":
        return _heuristic_decompiler(prompt)

    try:
        response = groq_client.chat.completions.create(
            model=active_model,
            messages=[
                {"role": "system", "content": "You are a JSON parsing engine. You output valid JSON only."},
                {"role": "user", "content": f"{SYSTEM_DECOMPILER_PROMPT}\n\nUser Prompt: \"{prompt}\""}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        parsed = json.loads(response.choices[0].message.content)
        return QueryExecutionPlan(**parsed)
    except Exception as e:
        logger.warning(f"Structured compilation failed: {e}. Falling back to heuristic parsing.")
        return _heuristic_decompiler(prompt)

def _heuristic_decompiler(prompt: str) -> QueryExecutionPlan:
    p = prompt.lower()
    
    # Extract objective
    if any(k in p for k in ["price", "cost", "cheap", "expensive", "spread"]):
        obj = "ARBITRAGE_PRICE"
    elif any(k in p for k in ["density", "crowd", "people", "stalls", "vendors", "busy"]):
        obj = "VENDOR_DENSITY"
    elif any(k in p for k in ["traffic", "port", "shipment", "customs", "delay", "friction"]):
        obj = "SUPPLY_FRICTION"
    elif any(k in p for k in ["cash", "ussd", "mobile money", "digital", "velocity"]):
        obj = "CASH_VELOCITY"
    else:
        obj = "MACRO_VOLUME"

    # Extract cadence
    cadence = "DAILY"
    if "hour" in p or "live" in p: cadence = "HOURLY"
    elif "week" in p: cadence = "WEEKLY"
    elif "year" in p or "annual" in p: cadence = "ANNUALLY"

    # Identify commodity
    comm = "General Merchandise"
    for candidate in ["rubber", "electronics", "groceries", "textiles", "sugar", "fuel", "produce"]:
        if candidate in p:
            comm = candidate.capitalize()
            break

    # Identify primary locality token
    region = "Target Node"
    for token in ["wuse", "dharavi", "balogun", "makoko", "kejetia", "alaba", "las vegas"]:
        if token in p:
            region = token.title()
            break

    return QueryExecutionPlan(
        target_region=region,
        target_commodity=comm,
        query_objective=obj,
        cadence=cadence,
        focal_question=f"Evaluating informal {comm.lower()} flow across {region}",
        sub_clusters=["Central Transit Hub", "Secondary Retail Lane", "Wholesale Loading Depot"],
        risk_vectors=["Settlement Currency Devaluation", "Physical Route Congestion"]
    )