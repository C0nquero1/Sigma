import json
import logging
import asyncio
from typing import Dict, Any

logger = logging.getLogger("StreetAI.DeepSynthesizer")

class DeepAnalysisSynthesizer:
    """Generates hyper-peculiar, context-aware intelligence for both Overview and Deep Analysis dashboards."""

    @staticmethod
    async def generate_peculiar_insights(commodity: str, location: str, client, model: str) -> Dict[str, Any]:
        
        fallback_data = {
            "overview_executive_summary": f"Spatial analysis indicates concentrated informal liquidity for {commodity} in {location}. Unrecorded cash velocity outperforms formal sector baselines, though minor logistical bottlenecks persist.",
            "live_friction_events": [
                {"time": "14:22", "event": f"Supply chain bottleneck detected entering {location}", "sev": "Moderate"},
                {"time": "14:18", "event": f"Price anomaly observed in local {commodity} trading", "sev": "Peak"}
            ],
            "demographics_breakdown": [
                {"name": "Local Consumers", "pct": 65, "c": "#3ca096"},
                {"name": "Wholesale Distributors", "pct": 25, "c": "#d4d95c"},
                {"name": "Transit Proxies", "pct": 10, "c": "#74c365"}
            ],
            "supply_chain_origin": f"Regional wholesale depots supplying {location}",
            "buyer_demographic": "Mixed transit and local consumer traffic",
            "operational_risks": "Standard informal market friction (task forces, weather)",
            "micro_hotspots": [
                {"name": f"Main {commodity} Junction", "flow_share": "55%", "peak_time": "14:00"},
                {"name": "Secondary Transit Node", "flow_share": "30%", "peak_time": "17:30"},
                {"name": "Perimeter Stalls", "flow_share": "15%", "peak_time": "09:00"}
            ]
        }

        if not client or model == "fallback":
            return fallback_data

        prompt = f"""
        You are a quantitative intelligence analyst tracking the global informal economy.
        
        TARGET COMMODITY: {commodity}
        TARGET LOCATION: {location}
        
        Generate a highly peculiar, localized intelligence payload for this exact trade in this exact location.
        If it's "Suya in Wuse 2", mention AEPB task forces, abattoirs, and nightlife patrons. If it's "Scrap Mercedes in Ladipo", mention Apapa port clearance, mechanics, and Wharf delays.
        
        Return ONLY valid JSON matching this schema:
        {{
            "overview_executive_summary": "2-sentence highly professional executive brief summarizing the market heat and capital flow specific to this location.",
            "live_friction_events": [
                {{"time": "14:22", "event": "Specific local event (e.g., 'Customs bottleneck at Apapa toll' or 'AEPB raid near junction')", "sev": "Peak"}},
                {{"time": "14:05", "event": "Another highly specific local event", "sev": "Moderate"}}
            ],
            "demographics_breakdown": [
                {{"name": "Exact buyer type 1 (e.g., 'Nightlife Patrons')", "pct": 60, "c": "#3ca096"}},
                {{"name": "Exact buyer type 2 (e.g., 'Ride-hail Drivers')", "pct": 25, "c": "#d4d95c"}},
                {{"name": "Exact buyer type 3", "pct": 15, "c": "#74c365"}}
            ],
            "supply_chain_origin": "1 sentence explaining exactly where this good comes from locally or internationally.",
            "buyer_demographic": "1 sentence describing the broader behavioral demographic.",
            "operational_risks": "1 sentence describing the local regulatory, gang, or physical friction specific to this location.",
            "micro_hotspots": [
                {{"name": "Specific street, corner, or plaza name", "flow_share": "Percentage like 45%", "peak_time": "Time like 11:30 PM"}},
                {{"name": "Another specific local node", "flow_share": "...", "peak_time": "..."}},
                {{"name": "Third specific node", "flow_share": "...", "peak_time": "..."}}
            ]
        }}
        """

        try:
            res = await asyncio.to_thread(
                client.chat.completions.create,
                model=model,
                messages=[
                    {"role": "system", "content": "You output only raw, valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=800,
                temperature=0.2
            )
            raw_content = res.choices[0].message.content.strip()
            return json.loads(raw_content)
        except Exception as e:
            logger.warning(f"Deep Synthesis LLM failed: {e}. Returning safe fallback.")
            return fallback_data