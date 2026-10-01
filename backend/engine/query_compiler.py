import json
import logging
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ValidationError
from groq import Groq

logger = logging.getLogger("StreetAI.QueryCompiler")

# --- Structured Output Schema ---

class SpatialEntity(BaseModel):
    raw_location_query: str = Field(..., description="Exact location text extracted from prompt")
    inferred_city: Optional[str] = Field(None, description="Standardized city name if recognizable")
    inferred_subdistrict: Optional[str] = Field(None, description="Market, street, neighborhood, or node name")
    country_hint_iso2: Optional[str] = Field(None, description="ISO-2 country code if explicit or heavily implied")
    spatial_granularity: Literal["street_node", "neighborhood_cluster", "city_macro", "cross_border"] = "neighborhood_cluster"

class EconomicEntity(BaseModel):
    primary_commodity: str = Field(..., description="Normalized sector/commodity (e.g., electronics, perishables, textiles, fuel)")
    raw_items_mentioned: List[str] = Field(default_factory=list, description="Specific trade items mentioned in prompt")
    cadence: Literal["hourly_surge", "daily_velocity", "weekly_aggregate", "annual_tam"] = "daily_velocity"
    intent_type: Literal["market_sizing", "logistics_friction", "underwriting_risk", "footfall_tracking"] = "market_sizing"

class CompiledExecutionPlan(BaseModel):
    spatial: SpatialEntity
    economic: EconomicEntity
    reasoning_trace: str = Field(..., description="CoT extraction logic explaining ambiguous or slang terms")
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    requires_disambiguation: bool = Field(False, description="True if location is completely absent or irrecoverably ambiguous")

# --- Prompt & Compiler Core ---

SYSTEM_INTENT_PROMPT = """
You are the Cognitive Parsing Core for Street AI (Sigma), a spatial intelligence engine for the global informal economy.
Your objective: Parse natural language queries into exact structural entities without hallucination.

Rules:
1. Recognize informal trading nodes, street markets, local slang, and transport hubs worldwide (e.g., Computer Village, Gikomba, Oshodi, Tepito, Dharavi, Khan el-Khalili, Chatuchak).
2. If no location is specified or detectable, set requires_disambiguation to true and provide an empty string for raw_location_query. Do NOT default to any placeholder city.
3. Normalize informal items into standardized economic sectors (e.g., 'okrika' -> textiles; 'suya' -> informal food stalls; 'kabu-kabu' -> unregulated transport).
4. Output valid JSON matching the schema strictly.
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
        # Safe heuristic parser when Groq client is offline
        clean = prompt.strip()
        return CompiledExecutionPlan(
            spatial=SpatialEntity(raw_location_query=clean, spatial_granularity="city_macro"),
            economic=EconomicEntity(primary_commodity="general_merchandise"),
            reasoning_trace="Executed local heuristic parser (Groq unavailable).",
            confidence_score=0.4,
            requires_disambiguation=False
        )

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_INTENT_PROMPT},
                {"role": "user", "content": f"Parse query: \"{prompt}\""}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )

        content = response.choices[0].message.content
        parsed_json = json.loads(content)
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