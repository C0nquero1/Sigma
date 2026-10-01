import os
import json
import logging
import asyncio
import httpx
import numpy as np
from scipy.stats import pearsonr
from pydantic import BaseModel, Field, ValidationError
from typing import Dict, Any, List

logger = logging.getLogger("StreetAI.Covariance")

# The precise schema Groq must use to codify a new rule
class ProxyRule(BaseModel):
    trigger_variable: str = Field(..., description="e.g., 'heavy_rainfall', 'grid_collapse', 'public_holiday'")
    sector_impacted: str = Field(..., description="The specific commodity/sector this rule applies to")
    multiplier: float = Field(..., description="The mathematical multiplier to apply to base volume (e.g., 0.6 for a 40% drop)")
    rationale: str = Field(..., description="Economic reasoning for why this correlation exists")
    confidence: float = Field(..., ge=0.0, le=1.0)

class CovarianceDiscoveryEngine:
    def __init__(self, groq_client, active_model: str):
        self.groq_client = groq_client
        self.model = active_model
        self.rules_path = "dynamic_proxies.json"
        
        # Open-Meteo Historical Archive API for weather correlation
        self.weather_archive_url = "https://archive-api.open-meteo.com/v1/archive"
        
        # Load the dynamic rulebook into memory
        self.active_rules = self._load_rules()

    def _load_rules(self) -> Dict[str, Any]:
        """Loads autonomously discovered proxies from disk."""
        if not os.path.exists(self.rules_path):
            return {}
        try:
            with open(self.rules_path, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load dynamic proxies: {e}")
            return {}

    def _save_rule(self, h3_cell: str, rule: ProxyRule):
        """Permanently codifies a new proxy into the dynamic rulebook."""
        if h3_cell not in self.active_rules:
            self.active_rules[h3_cell] = []
            
        self.active_rules[h3_cell].append(rule.model_dump())
        
        with open(self.rules_path, "w") as f:
            json.dump(self.active_rules, f, indent=4)
        logger.info(f"New Autonomous Proxy Codified for {h3_cell}: {rule.trigger_variable} -> {rule.multiplier}x")

    async def fetch_historical_weather(self, lat: float, lon: float) -> List[float]:
        """Fetches the last 30 days of precipitation data to find weather anomalies."""
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": "2026-08-30", # Simulating the past 30 days
            "end_date": "2026-09-29",
            "daily": "precipitation_sum",
            "timezone": "auto"
        }
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(self.weather_archive_url, params=params, timeout=10.0)
                if res.status_code == 200:
                    data = res.json()
                    # Return 30-day precipitation array
                    return data.get("daily", {}).get("precipitation_sum", [0.0]*30)
        except Exception as e:
            logger.warning(f"Weather correlation fetch failed: {e}")
            
        # Fallback simulated dataset if API fails
        return [0.0, 12.4, 0.0, 0.0, 45.2, 3.1, 0.0, 0.0, 0.0, 0.0, 22.1, 0.0] * 3

    async def run_discovery_cycle(self, lat: float, lon: float, h3_cell: str, sector: str):
        """
        The Autonomous AI Loop:
        1. Fetch alternative data arrays (e.g., weather).
        2. Compare against market velocity.
        3. If strongly correlated, ask LLM to invent a mathematical proxy rule.
        """
        # Step 1: Get unstructured data (Precipitation in mm)
        rain_array = await self.fetch_historical_weather(lat, lon)
        if len(rain_array) < 30:
            rain_array = rain_array + [0.0] * (30 - len(rain_array))
        rain_data = np.array(rain_array[:30])
        
        # Step 2: Simulate historical market performance (In production, this queries your own DB)
        # We simulate a baseline market that drops heavily when rain exceeds 10mm
        market_velocity = np.array([1.0 if r < 10.0 else 0.4 for r in rain_data])
        
        # Add some random real-world noise
        noise = np.random.normal(0, 0.1, 30)
        market_velocity = np.clip(market_velocity + noise, 0.1, 1.5)
        
        # Step 3: Pearson Correlation Math
        r_stat, p_value = pearsonr(rain_data, market_velocity)
        
        # Step 4: Covariance Trigger (Strong Negative Correlation)
        if r_stat < -0.70 and p_value < 0.05:
            logger.info(f"Anomaly Detected! Correlation r={r_stat:.2f} between Rainfall and {sector}. Initiating LLM Synthesis.")
            
            prompt = (
                f"You are the Covariance AI for Sigma. "
                f"Statistical analysis reveals a strong correlation (r={r_stat:.2f}) between heavy precipitation and informal {sector} volume in spatial cell {h3_cell}. "
                f"Based on behavioral economics, generate a definitive ProxyRule JSON object that codifies how rain impacts {sector}. "
                f"Set a strict multiplier (e.g., 0.4 for a 60% penalty)."
            )
            
            try:
                res = await asyncio.to_thread(
                    self.groq_client.chat.completions.create,
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a behavioral economics JSON API."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.1
                )
                
                rule_json = json.loads(res.choices[0].message.content)
                new_rule = ProxyRule.model_validate(rule_json)
                
                # Permanently save the discovery
                self._save_rule(h3_cell, new_rule)
                return new_rule
                
            except Exception as e:
                logger.error(f"Groq proxy codification failed: {e}")
                
        return None

    def apply_active_proxies(self, h3_cell: str, sector: str, base_volume: float) -> float:
        """Applies discovered rules to current live calculations."""
        if h3_cell not in self.active_rules:
            return base_volume
            
        modified_volume = base_volume
        for rule_dict in self.active_rules[h3_cell]:
            # Apply sector-specific rules
            if sector.lower() in rule_dict.get("sector_impacted", "").lower():
                multiplier = rule_dict.get("multiplier", 1.0)
                modified_volume *= multiplier
                logger.debug(f"Applied dynamic proxy: {rule_dict['trigger_variable']} ({multiplier}x)")
                
        return round(modified_volume, 2)