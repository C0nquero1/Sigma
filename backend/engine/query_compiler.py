import json
import logging
import httpx
from typing import Optional, List
from pydantic import BaseModel, Field, ValidationError
from groq import Groq

logger = logging.getLogger("StreetAI.QueryCompiler")

# --- Structured Output Schema ---

class SpatialEntity(BaseModel):
    raw_location_query: str = Field(..., description="Exact location text extracted from prompt")
    inferred_city: Optional[str] = Field(None, description="Standardized city name if recognizable")
    inferred_subdistrict: Optional[str] = Field(None, description="Market, street, neighborhood, or node name")
    country_hint_iso2: Optional[str] = Field(None, description="ISO-2 country code if explicit or heavily implied")
    spatial_granularity: str = "neighborhood_cluster" 

class EconomicEntity(BaseModel):
    primary_commodity: str = Field(..., description="Normalized sector/commodity")
    raw_items_mentioned: List[str] = Field(default_factory=list)
    cadence: str = "daily_velocity"
    intent_type: str = "market_sizing"

class CompiledExecutionPlan(BaseModel):
    spatial: SpatialEntity
    economic: EconomicEntity
    reasoning_trace: str = Field(..., description="CoT extraction logic explaining ambiguous or slang terms")
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    requires_disambiguation: bool = Field(False, description="True if location is completely absent or irrecoverably ambiguous")

# --- Zero-Downtime Router ---
class SyncLLMCascadeRouter:
    """Silently fails over to backup AI providers for the Query Compiler."""
    
    @staticmethod
    def execute_prompt(primary_client, primary_model: str, system_prompt: str, user_prompt: str) -> str:
        # ATTEMPT 1: Primary LLM Client (Groq)
        try:
            response = primary_client.chat.completions.create(
                model=primary_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=800,
                temperature=0.0
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.warning(f"Primary Compiler LLM Failed (Credit/Limit/Timeout): {e}. Cascading to Backup...")

        # ATTEMPT 2: Fallback to a secondary free Groq Key or alternative API
        BACKUP_API_KEY = "gsk_your_backup_free_key_here" 
        try:
            with httpx.Client() as client:
                headers = {
                    "Authorization": f"Bearer {BACKUP_API_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "llama3-8b-8192", 
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "response_format": {"type": "json_object"}
                }
                res = client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=15.0)
                if res.status_code == 200:
                    return res.json()["choices"][0]["message"]["content"]
                else:
                    raise Exception(f"Backup API returned {res.status_code}")
        except Exception as e:
            logger.error(f"Backup Compiler LLM also failed: {e}. Executing emergency heuristic.")
            
        # ATTEMPT 3: Absolute Emergency Fallback (Returns Safe JSON)
        return json.dumps({
            "spatial": {
                "raw_location_query": "Unknown",
                "inferred_city": None,
                "inferred_subdistrict": None,
                "country_hint_iso2": None,
                "spatial_granularity": "city_macro"
            },
            "economic": {
                "primary_commodity": "general_merchandise",
                "raw_items_mentioned": [],
                "cadence": "daily_velocity",
                "intent_type": "market_sizing"
            },
            "reasoning_trace": "Emergency network fallback executed. LLM APIs offline.",
            "confidence_score": 0.0,
            "requires_disambiguation": True
        })

# --- Prompt & Compiler Core ---

SYSTEM_INTENT_PROMPT = """
You are the Cognitive Parsing Core for Street AI (Sigma), a spatial intelligence engine for the global informal economy.
Your objective: Parse natural language queries into exact structural entities without hallucination.

Rules:
1. Recognize informal trading nodes, street markets, local slang, and transport hubs worldwide (e.g., Ladipo, Computer Village, Gikomba, Oshodi, Tepito, Chatuchak).
2. CRITICAL: If the location is a specific named neighborhood, market, or hub (e.g., "Ladipo Market", "Oshodi under-bridge"), LOCK THE TARGET. Do NOT set requires_disambiguation to true for known informal market hubs, even if a specific street address is missing.
3. If no location is specified or detectable at all, set requires_disambiguation to true and provide an empty string for raw_location_query. Do NOT default to any placeholder city.
4. Normalize informal items into standardized economic sectors (e.g., 'okrika' -> textiles; 'suya' -> informal food stalls; 'kabu-kabu' -> unregulated transport).
5. You MUST return a strictly nested JSON object exactly matching this structure:
{
    "spatial": {
        "raw_location_query": "Exact location text",
        "inferred_city": "City name if recognizable or null",
        "inferred_subdistrict": "Market/neighborhood name or null",
        "country_hint_iso2": "ISO-2 country code or null",
        "spatial_granularity": "street_node"
    },
    "economic": {
        "primary_commodity": "Normalized sector",
        "raw_items_mentioned": ["item1", "item2"],
        "cadence": "daily_velocity",
        "intent_type": "market_sizing"
    },
    "reasoning_trace": "CoT extraction logic",
    "confidence_score": 0.95,
    "requires_disambiguation": false
}
"""

def compile_user_prompt(prompt: str, client: Optional[Groq], model: str) -> CompiledExecutionPlan:
    """
    Compiles an unstructured natural language user query into a deterministic execution plan.
    """
    if not prompt or not prompt.strip():
        return CompiledExecutionPlan(
            spatial=SpatialEntity(raw_location_query="", requires_disambiguation=True),
            economic=EconomicEntity(primary_commodity="general_merchandise"),
            reasoning_trace="Empty prompt supplied.",
            confidence_score=0.0,
            requires_disambiguation=True
        )

    if not client or model == "fallback":
        clean = prompt.strip()
        return CompiledExecutionPlan(
            spatial=SpatialEntity(raw_location_query=clean, spatial_granularity="city_macro"),
            economic=EconomicEntity(primary_commodity="general_merchandise"),
            reasoning_trace="Executed local heuristic parser (Groq unavailable).",
            confidence_score=0.4,
            requires_disambiguation=False
        )

    try:
        content = SyncLLMCascadeRouter.execute_prompt(
            primary_client=client,
            primary_model=model,
            system_prompt=SYSTEM_INTENT_PROMPT,
            user_prompt=f"Parse query: \"{prompt}\""
        )
        
        parsed_json = json.loads(content)
        
        if "spatial" not in parsed_json:
            logger.warning("LLM returned flat JSON. Engaging smart mapping fallback.")
            return CompiledExecutionPlan(
                spatial=SpatialEntity(
                    raw_location_query=parsed_json.get("raw_location_query", prompt.strip()[:60]),
                    inferred_city=parsed_json.get("inferred_city"),
                    inferred_subdistrict=parsed_json.get("inferred_subdistrict"),
                    country_hint_iso2=parsed_json.get("country_hint_iso2"),
                    spatial_granularity=parsed_json.get("spatial_granularity", "neighborhood_cluster")
                ),
                economic=EconomicEntity(
                    primary_commodity=parsed_json.get("primary_commodity", "general_merchandise"),
                    raw_items_mentioned=parsed_json.get("raw_items_mentioned", []),
                    cadence=parsed_json.get("cadence", "daily_velocity"),
                    intent_type=parsed_json.get("intent_type", "market_sizing")
                ),
                reasoning_trace=parsed_json.get("reasoning_trace", "Flat JSON fallback mapping."),
                confidence_score=parsed_json.get("confidence_score", 0.5),
                requires_disambiguation=parsed_json.get("requires_disambiguation", False)
            )

        return CompiledExecutionPlan.model_validate(parsed_json)

    except (ValidationError, json.JSONDecodeError) as e:
        logger.error(f"Structured decoding failed: {e}. Falling back to safe extraction.")
        return CompiledExecutionPlan(
            spatial=SpatialEntity(raw_location_query=prompt.strip()[:60]),
            economic=EconomicEntity(primary_commodity="general_merchandise"),
            reasoning_trace=f"Validation failed: {str(e)}",
            confidence_score=0.3,
            requires_disambiguation=True
        )
    except Exception as e:
        logger.error(f"Groq execution failure: {e}")
        raise RuntimeError(f"Query compilation halted: {e}")