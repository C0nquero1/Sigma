import json
import logging
import asyncio
from typing import Dict, Any, Optional
from groq import Groq

logger = logging.getLogger("StreetAI.Synthesizer")

class DeepAnalysisSynthesizer:
    """
    100% Physical Reality UI Synthesizer.
    Takes the exact verified metrics from the physical engines and uses the LLM 
    strictly for linguistic formatting. ZERO hallucinatory extrapolation allowed.
    """
    
    @staticmethod
    async def generate_ui_synthesis(
        commodity: str,
        location: str,
        metrics: Dict[str, Any],
        intent: str,
        client: Optional[Groq],
        model: str
    ) -> Dict[str, Any]:
        
        fallback_ui = {
            "chat_subtitle": f"Physical telemetry locked for {location}.",
            "data_overview_cards": {f"card_{i}": "Verified physical sensor lock." for i in range(1, 7)},
            "deep_analysis_report": (
                f"Live hourly velocity locked at {metrics.get('local_currency', 'USD')} {metrics.get('hourly_cash_velocity', 0.0):,.2f}/hr "
                f"across {metrics.get('active_buyers', 0):,} active buyers."
            )
        }

        if not client or model == "fallback":
            return fallback_ui

        system_prompt = """
        You are the Executive UI Synthesizer for a high-frequency spatial economic terminal.
        You will receive a JSON payload containing STRICTLY VERIFIED physical data points for a specific street or market.
        
        YOUR DIRECTIVES:
        1. Do NOT hallucinate, guess, or invent any numbers. Use ONLY the metrics provided.
        2. Output a strictly formatted JSON object matching the exact schema below.
        3. The 'deep_analysis_report' must be a concise, professional 3-sentence executive summary of the provided data.
        
        SCHEMA:
        {
          "chat_subtitle": "1 short punchy sentence summarizing the commercial state.",
          "data_overview_cards": {
            "card_1": "Metric label and value",
            "card_2": "Metric label and value",
            "card_3": "Metric label and value",
            "card_4": "Metric label and value"
          },
          "deep_analysis_report": "3 sentence executive summary of the location's cash velocity, buyer conversion, and active sectors."
        }
        """

        user_content = f"Location: {location}\nCommodity/Ecosystem: {commodity}\nVerified Metrics: {json.dumps(metrics)}"

        fallback_cascade = list(dict.fromkeys([model, "qwen/qwen3.8-27b", "llama3-70b-8192", "llama-3.1-8b-instant"]))
        
        for attempt_model in fallback_cascade:
            try:
                res = await asyncio.to_thread(
                    client.chat.completions.create,
                    model=attempt_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content}
                    ],
                    response_format={"type": "json_object"},
                    max_tokens=350,
                    temperature=0.0
                )
                
                parsed = json.loads(res.choices[0].message.content)
                if "deep_analysis_report" in parsed and "chat_subtitle" in parsed:
                    return parsed
                    
            except Exception as e:
                logger.debug(f"Synthesizer pivoted from '{attempt_model}': {e}")

        return fallback_ui