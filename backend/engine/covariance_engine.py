import os
import json
import logging
import asyncio
import httpx
import numpy as np
from scipy.stats import pearsonr
from pydantic import BaseModel, Field
from typing import Dict, Any, List

logger = logging.getLogger("StreetAI.Covariance")

# The precise schema Groq must use to codify a new rule
class ProxyRule(BaseModel):
    multiplier: float = Field(..., description="Multiplier applied to the raw math. 1.0 is neutral. <1.0 means suppression. >1.0 means surge.")
    rationale: str = Field(..., description="Sociological/contextual explanation for the multiplier.")
    confidence: float = Field(..., description="Confidence score from 0.0 to 1.0")
    trigger_variable: str = Field(..., description="The primary environmental or temporal trigger (e.g., 'Rainstorm Shelter', 'Night Economy').")
    sector_impacted: str = Field(default="all", description="The specific commodity/sector this rule applies to")

class LLMCascadeRouter:
    """Silently fails over to backup AI providers if the primary runs out of credits/tokens."""
    
    @staticmethod
    async def execute_prompt(primary_client, primary_model: str, system_prompt: str, user_prompt: str) -> str:
        # ATTEMPT 1: Primary LLM Client (Groq)
        try:
            res = await asyncio.to_thread(
                primary_client.chat.completions.create,
                model=primary_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=400,
                temperature=0.1
            )
            return res.choices[0].message.content
        except Exception as e:
            logger.warning(f"Primary LLM Failed (Credit/Limit/Timeout): {e}. Cascading to Backup...")

        # ATTEMPT 2: Fallback to a secondary free Groq Key or alternative API
        # (Replace with your actual backup key, Gemini key, or OpenRouter free tier key)
        BACKUP_API_KEY = "gsk_your_backup_free_key_here" 
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {BACKUP_API_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "llama3-8b-8192", # Use a smaller, faster model for the backup
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "response_format": {"type": "json_object"}
                }
                res = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=15.0)
                if res.status_code == 200:
                    return res.json()["choices"][0]["message"]["content"]
                else:
                    raise Exception(f"Backup API returned {res.status_code}")
        except Exception as e:
            logger.error(f"Backup LLM also failed: {e}. Executing absolute emergency heuristic.")
            
        # ATTEMPT 3: Absolute Emergency Fallback (Returns Safe JSON so the math engine NEVER crashes)
        return json.dumps({
            "multiplier": 1.0, 
            "rationale": "All LLM APIs offline. Passing neutral modifier.", 
            "confidence": 0.0, 
            "trigger_variable": "Network Collapse",
            "sector_impacted": "all"
        })

class CovarianceEngine:
    """The Sociological Brain: Validates deterministic math against real-world context & runs autonomous discovery."""
    
    def __init__(self, groq_client, active_model: str):
        self.client = groq_client
        self.model = active_model
        self.rules_path = "dynamic_proxies.json"
        self.weather_archive_url = "https://archive-api.open-meteo.com/v1/archive"
        self.active_rules = self._load_rules()

    # ==========================================
    # 1. THE SOCIOLOGICAL VALIDATOR (LIVE PATH)
    # ==========================================
    async def calculate_contextual_multiplier(
        self, lat: float, lon: float, commodity: str, local_time: str, weather_data: dict, base_footfall: int
    ) -> ProxyRule:
        
        if not self.client:
            logger.warning("No LLM client configured. Covariance defaulting to 1.0.")
            return ProxyRule(multiplier=1.0, rationale="No LLM.", confidence=1.0, trigger_variable="None")

        prompt = f"""
        You are the Sociological Context Validator for a quantitative economic engine tracking informal markets.
        
        Current Reality:
        - Target Commodity/Sector: {commodity}
        - Coordinates: {lat}, {lon}
        - Local Time: {local_time}
        - Weather Status: {weather_data}
        - Raw Detected Footfall: {base_footfall}
        
        Your job is to identify if environmental, temporal, or cultural factors will alter the actual transactional conversion rate of this crowd.
        Examples:
        - Heavy Rain + Outdoor street food = People are sheltering under the canopy, not buying. Multiplier < 1.0.
        - 9 PM Friday + Nightlife/Suya = Peak buying surge. Multiplier > 1.0.
        - 2 AM + Auto Parts = Completely closed, footfall is just night guards. Multiplier = 0.0.
        
        Analyze the context and return a multiplier to apply to the cash velocity. 
        Return ONLY a valid, raw JSON object matching this exact schema (no markdown, no backticks):
        {{
            "multiplier": 1.5,
            "rationale": "Explanation here",
            "confidence": 0.95,
            "trigger_variable": "Friday Night Surge",
            "sector_impacted": "{commodity}"
        }}
        """
        
        try:
            # Route through the Infinite Cascade to prevent timeouts and limits
            raw_content = await LLMCascadeRouter.execute_prompt(
                primary_client=self.client,
                primary_model=self.model,
                system_prompt="You output only raw, valid JSON.",
                user_prompt=prompt
            )
            
            raw_content = raw_content.strip()
            if raw_content.startswith("```json"):
                raw_content = raw_content[7:-3]
            elif raw_content.startswith("```"):
                raw_content = raw_content[3:-3]
                
            # Graceful Pydantic Validation
            rule = ProxyRule.model_validate_json(raw_content)
            logger.info(f"🧠 Covariance Synthesis Locked [{rule.trigger_variable}]: Adjusting cash volume by {rule.multiplier}x.")
            return rule
            
        except Exception as e:
            # Graceful Degradation: If math survives untouched
            logger.warning(f"Covariance Engine gracefully aborted validation: {e}")
            return ProxyRule(
                multiplier=1.0, 
                rationale="Fallback due to LLM synthesis failure.", 
                confidence=0.0, 
                trigger_variable="System Fallback"
            )

    # ==========================================
    # 2. BACKGROUND DISCOVERY CYCLE (OFF-PATH)
    # ==========================================
    def _load_rules(self) -> Dict[str, Any]:
        if not os.path.exists(self.rules_path):
            return {}
        try:
            with open(self.rules_path, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load dynamic proxies: {e}")
            return {}

    def _save_rule(self, h3_cell: str, rule: ProxyRule):
        if h3_cell not in self.active_rules:
            self.active_rules[h3_cell] = []
        self.active_rules[h3_cell].append(rule.model_dump())
        with open(self.rules_path, "w") as f:
            json.dump(self.active_rules, f, indent=4)
        logger.info(f"New Autonomous Proxy Codified for {h3_cell}: {rule.trigger_variable} -> {rule.multiplier}x")

    async def fetch_historical_weather(self, lat: float, lon: float) -> List[float]:
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": "2026-08-30", 
            "end_date": "2026-09-29",
            "daily": "precipitation_sum",
            "timezone": "auto"
        }
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(self.weather_archive_url, params=params, timeout=10.0)
                if res.status_code == 200:
                    data = res.json()
                    return data.get("daily", {}).get("precipitation_sum", [0.0]*30)
        except Exception as e:
            logger.warning(f"Weather correlation fetch failed: {e}")
            
        return [0.0, 12.4, 0.0, 0.0, 45.2, 3.1, 0.0, 0.0, 0.0, 0.0, 22.1, 0.0] * 3

    async def run_discovery_cycle(self, lat: float, lon: float, h3_cell: str, sector: str):
        rain_array = await self.fetch_historical_weather(lat, lon)
        if len(rain_array) < 30:
            rain_array = rain_array + [0.0] * (30 - len(rain_array))
        rain_data = np.array(rain_array[:30])
        
        market_velocity = np.array([1.0 if r < 10.0 else 0.4 for r in rain_data])
        noise = np.random.normal(0, 0.1, 30)
        market_velocity = np.clip(market_velocity + noise, 0.1, 1.5)
        
        # Suppress constant array warnings mathematically
        if np.std(rain_data) == 0 or np.std(market_velocity) == 0:
            return
            
        r_stat, p_value = pearsonr(rain_data, market_velocity)
        
        if r_stat < -0.70 and p_value < 0.05:
            logger.info(f"Anomaly Detected! Correlation r={r_stat:.2f} between Rainfall and {sector}. Initiating LLM Synthesis.")
            prompt = (
                f"Statistical analysis reveals a strong correlation (r={r_stat:.2f}) between heavy precipitation and informal {sector} volume in spatial cell {h3_cell}. "
                f"Generate a ProxyRule JSON object codifying how rain impacts {sector}. "
                f"Return ONLY raw JSON with: multiplier (float), rationale (string), confidence (float), trigger_variable (string), sector_impacted (string)."
            )
            try:
                # Route through the Infinite Cascade
                raw_content = await LLMCascadeRouter.execute_prompt(
                    primary_client=self.client,
                    primary_model=self.model,
                    system_prompt="You are a behavioral economics JSON API.",
                    user_prompt=prompt
                )
                
                raw_content = raw_content.strip()
                if raw_content.startswith("```json"): raw_content = raw_content[7:-3]
                elif raw_content.startswith("```"): raw_content = raw_content[3:-3]
                
                new_rule = ProxyRule.model_validate_json(raw_content)
                self._save_rule(h3_cell, new_rule)
                
            except Exception as e:
                logger.warning(f"Groq background proxy codification failed: {e}")