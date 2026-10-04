import os
import sys
import re
import json
import logging
import asyncio
import hashlib
import reverse_geocoder as rg
import requests
import time

# 1. WINDOWS EVENT LOOP FIX (Must execute before async frameworks initialize)
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from groq import Groq

# Core Spatial & Database
from engine.spatial_engine import SpatialResolver
from engine.database import SupabaseLedger

# Zero-Cost Enterprise Matrix & Semantic Execution Pipeline
from engine.query_compiler import compile_user_prompt
from engine.foot_traffic_engine import LiveCrowdPatternEngine
from engine.overture_engine import OverturePOIEngine
from engine.ontology import StreetAIOntology, MerchantClusterNode, CommodityNode
from engine.ui_compiler import build_overview_ui
from engine.metric_engine import MetricExecutionEngine
from engine.geo_router import GeoContextRouter

# --- NEW REAL-TIME DETERMINISTIC ENGINES ---
from engine.street_forex import LiveStreetForex
from engine.ground_truth import GroundTruthCalibrator
from engine.optical_flow import LiveOpticalFlowEngine
from engine.temporal_engine import TemporalVelocityEngine

# Multi-Sensory & Physical Interception Stack
from engine.planet_yolo_engine import SatelliteInferenceEngine
from engine.bidstream_engine import BidstreamMobilityEngine
from engine.pricing_scraper import StreetPricingScraper
from engine.macro_systems import MacroSystemsEngine
from engine.covariance_engine import CovarianceEngine
from engine.app_registry import UniversalAppRegistry
from engine.telco_telemetry import MobileMoneyGatewayMonitor
from engine.planet_constellation import SubDailySatelliteEngine
from engine.spatial_product_resolver import SpatialProductResolver
from engine.buyer_conversion_engine import BuyerConversionEngine

load_dotenv(override=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("StreetAI.Main")

# 2. Acquire Environment Keys & Dynamically Lock Active LLM
groq_api_key = os.getenv("GROQ_API_KEY", "")

def fetch_live_groq_model(api_key: str) -> str:
    """Dynamically interrogates Groq for currently active generative models to prevent 404/Decommission errors."""
    if not api_key: 
        return "llama3-8b-8192"
        
    try:
        import requests
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        res = requests.get("https://api.groq.com/openai/v1/models", headers=headers, timeout=5.0)
        
        if res.status_code == 200:
            live_models = [m["id"] for m in res.json().get("data", [])]
            
            # IMPENETRABLE FILTER: Remove audio, vision, tools, embeddings, and security guards
            invalid_keywords = ["whisper", "vision", "tool", "guard", "embed"]
            valid_chat_models = [
                m for m in live_models 
                if not any(bad_word in m.lower() for bad_word in invalid_keywords)
            ]
            
            # Prefer the fast Llama 3/3.1 generative models, then Mixtral, then whatever is left
            preferred = next((m for m in valid_chat_models if "llama-3" in m.lower() or "llama3" in m.lower()), None)
            if not preferred:
                preferred = next((m for m in valid_chat_models if "mixtral" in m.lower()), None)
                
            selected_model = preferred if preferred else valid_chat_models[0]
            
            logger.info(f"🚀 Auto-Discovery Locked Active Groq Model: '{selected_model}'")
            return selected_model
            
    except Exception as e:
        logger.warning(f"⚠️ Model auto-discovery failed: {e}. Falling back to default.")
        
    return "llama3-8b-8192"

# Execute auto-discovery at startup
ACTIVE_GROQ_MODEL = fetch_live_groq_model(groq_api_key)
groq_client = Groq(api_key=groq_api_key) if groq_api_key else None
planet_api_key = os.getenv("PLANET_API_KEY", "mock_key")

# 3. Globally Instantiate Engines (Autonomous Architecture)
spatial_resolver = SpatialResolver()
overture = OverturePOIEngine()
crowd_engine = LiveCrowdPatternEngine()

covariance_engine = CovarianceEngine(groq_client, ACTIVE_GROQ_MODEL)
ontology = StreetAIOntology(covariance_engine=covariance_engine)

satellite_engine = SatelliteInferenceEngine(planet_api_key=planet_api_key)
macro_engine = MacroSystemsEngine()

app_registry = UniversalAppRegistry(cache_ttl_seconds=43200)
pricing_scraper = StreetPricingScraper()
bidstream_engine = BidstreamMobilityEngine()
temporal_engine = TemporalVelocityEngine()
product_resolver = SpatialProductResolver()
buyer_conversion = BuyerConversionEngine()

# --- INSTANTIATE THE BRIDGES TO REALITY ---
live_forex = LiveStreetForex()
ground_truth = GroundTruthCalibrator()
optical_flow = LiveOpticalFlowEngine()
telco_telemetry = MobileMoneyGatewayMonitor()
planet_constellation = SubDailySatelliteEngine(api_key=planet_api_key)


ACTIVE_GROQ_MODEL = "fallback"

def discover_active_model() -> str:
    if not groq_client: return "fallback"
    try:
        model_list = groq_client.models.list()
        available_ids = [m.id for m in model_list.data]
        
        generative_models = [
            m for m in available_ids 
            if "guard" not in m.lower() and "whisper" not in m.lower()
        ]
        
        if not generative_models:
            return "fallback"
            
        for pref in ["qwen", "orpheus-v1-english", "compound", "allam", "llama", "mixtral"]:
            for m_id in generative_models:
                if pref in m_id.lower():
                    logger.info(f"Active Generative LLM locked: '{m_id}'")
                    return m_id
                    
        return generative_models[0]
    except Exception as e:
        logger.warning(f"Dynamic Groq fetch failed: {e}")
        return "fallback"

@asynccontextmanager
async def lifespan(app: FastAPI):
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        
    global ACTIVE_GROQ_MODEL
    ACTIVE_GROQ_MODEL = discover_active_model()
    logger.info(f"Street AI Intelligence Core initializing with model: {ACTIVE_GROQ_MODEL}")
    
    yield
    spatial_resolver.close()
    logger.info("Street AI Intelligence Core shutting down...")

app = FastAPI(
    title="Street AI Core Intelligence Engine",
    version="5.2.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserPromptRequest(BaseModel):
    prompt: str = Field(..., description="Raw natural language prompt from user")
    explicit_lat: Optional[float] = Field(None, description="Latitude selected via UI")
    explicit_lon: Optional[float] = Field(None, description="Longitude selected via UI")
    target_id: Optional[str] = Field(None, description="Candidate ID selected via UI")

@app.post("/api/v1/intelligence/scan")
async def process_street_intelligence(request: UserPromptRequest):
    start_time = time.time()
    try:
        # STEP 1: Compile Query with Schema Verification
        plan = compile_user_prompt(request.prompt, groq_client, ACTIVE_GROQ_MODEL)

        if plan.requires_disambiguation or not plan.spatial.raw_location_query:
            return {
                "status": "AMBIGUOUS_TARGET",
                "message": "Target location could not be identified with certainty. Specify a city, neighborhood, or market.",
                "confidence": plan.confidence_score,
                "reasoning": plan.reasoning_trace
            }

        target_loc = plan.spatial.inferred_subdistrict or plan.spatial.inferred_city or plan.spatial.raw_location_query
        commodity = plan.economic.primary_commodity
        cadence = plan.economic.cadence

        # STEP 2: Spatial Resolution via Global Spatial Mesh (DuckDB + H3)
        force_cand = None
        if request.target_id and request.explicit_lat is not None and request.explicit_lon is not None:
            force_cand = {
                "id": request.target_id,
                "lat": request.explicit_lat,
                "lon": request.explicit_lon
            }

        spatial_outcome = spatial_resolver.resolve_target(
            original_prompt=request.prompt,
            extracted_entity=plan.spatial if hasattr(plan, "spatial") else target_loc,
            has_explicit_context=bool(request.target_id),
            force_candidate=force_cand
        )

        spatial_dict = (
            spatial_outcome.model_dump()
            if hasattr(spatial_outcome, "model_dump")
            else spatial_outcome.dict()
            if hasattr(spatial_outcome, "dict")
            else spatial_outcome
        )

        if spatial_dict.get("status") == "AMBIGUOUS_TARGET":
            return spatial_dict

        city_info = spatial_dict.get("city_overview", {})
        lat_val = float(city_info.get("lat", 9.0765))
        lon_val = float(city_info.get("lon", 7.3986))
        country_code = city_info.get("country_code") or spatial_dict.get("country_code")
        
        # Inject H3 Hexagonal Index
        h3_token = spatial_resolver.get_h3_index(lat_val, lon_val, resolution=9)
        city_info["h3_cell_id"] = h3_token

        # STEP 2b: Geocoding Validation (Universal Fallback)
        if not country_code or country_code == "GLOBAL":
            try:
                geo_result = rg.search((lat_val, lon_val))[0]
                country_code = geo_result.get("cc", "GLOBAL")
                city_info["country_code"] = country_code
            except Exception as e:
                logger.warning(f"Offline reverse geocoder fallback failed: {e}")
                country_code = "GLOBAL"

        # STEP 3: GeoContext & Dynamic PPP Scaling
        regional_context = GeoContextRouter.get_context(country_code)

        # STEP 3b: Dynamic Universal App Registry (Pillar 2)
        digital_channels = await app_registry.get_top_fintech_apps(country_code)

        # STEP 4: Async Data Gathering & Live Street Forex
        nearest_port_data = macro_engine.get_nearest_unlocode_port(lat_val, lon_val)
        port_locode = nearest_port_data["locode"]

        if hasattr(pricing_scraper, "extract_global_commodity_price"):
            price_task = pricing_scraper.extract_global_commodity_price(
                base_url=regional_context.primary_classifieds_url, 
                search_path=regional_context.search_path, 
                commodity=commodity
            )
        else:
            price_task = pricing_scraper.extract_jiji_commodity_price(target_loc, commodity)
            
        manifest_task = macro_engine.fetch_bill_of_lading(commodity, port_locode)
        
        # [NEW] 1. Live Street Forex Integration (Bypassing stale World Bank data)
        currency_map = {"NG": "NGN", "IN": "INR", "MX": "MXN", "ZA": "ZAR", "KE": "KES", "US": "USD", "TR": "TRY"}
        local_currency = currency_map.get(country_code, "USD")
        live_usd_rate = await live_forex.get_realtime_rate(country_code, local_currency)
        
        class EconomicBaseline:
            def __init__(self, currency, value):
                self.local_currency = currency
                self.localized_value = value
                
        results = await asyncio.gather(price_task, manifest_task, return_exceptions=True)
        street_price_raw = results[0]
        cleared_tonnage_raw = results[1]

        # Scale the base item price by the EXACT minute-by-minute street Forex rate
        base_usd = street_price_raw if isinstance(street_price_raw, (int, float)) and street_price_raw > 0 else 2.50
        economic_baseline = EconomicBaseline(local_currency, base_usd * live_usd_rate)
        
        cleared_tonnage = cleared_tonnage_raw if isinstance(cleared_tonnage_raw, (int, float)) else 14500.0

        # STEP 5: Live Optical Flow (Pedestrians + Vehicle Inflow)
        try:
            optical_data = await optical_flow.intercept_live_camera(lat_val, lon_val)
            adjusted_foot_traffic = optical_data.get("estimated_hourly_flow", 4500)
            observed_dwell = optical_data.get("observed_dwell_mins", 20.0)
            is_live = optical_data.get("camera_status") == "LOCKED"
            optical_multiplier = optical_data.get("optical_density_multiplier", 1.0)
        except Exception as e:
            logger.warning(f"Optical Flow error: {e}")
            adjusted_foot_traffic = 3500
            observed_dwell = 18.0
            is_live = False
            optical_multiplier = 1.0

        # STEP 5B: Deterministic Spatial Ground Product Resolution
        product_ground_truth = await product_resolver.resolve_market_ground_truth(
            lat=lat_val, lon=lon_val, commodity=commodity
        )
        
        # Safely resolve unit price (fallback to spatial ground truth if prompt parsing failed)
        try:
            if isinstance(street_price_raw, (int, float)) and street_price_raw > 0:
                resolved_unit_price_usd = street_price_raw
            else:
                resolved_unit_price_usd = product_ground_truth["median_usd_basket"]
        except NameError:
            resolved_unit_price_usd = product_ground_truth["median_usd_basket"]

        unit_price_local = resolved_unit_price_usd * live_usd_rate
        
        # Ensure EconomicBaseline fallback if class is missing in user's namespace
        try:
            economic_baseline = EconomicBaseline(local_currency, unit_price_local)
            base_currency = economic_baseline.local_currency
            base_value = economic_baseline.localized_value
        except NameError:
            base_currency = local_currency
            base_value = unit_price_local

        # STEP 6: Physical AI Inferences (Sub-Daily Satellite & Ground Truth)
        try:
            planet_data = await planet_constellation.fetch_latest_scene(lat=lat_val, lon=lon_val)
            nri = planet_data.get("nri_score", 1.4)
            dynamic_multiplier = await ground_truth.calculate_dynamic_multiplier(h3_token)
            detected_stalls = int(nri * dynamic_multiplier)
            dark_cash_data = {
                "detected_stalls": detected_stalls,
                "nri_score": nri,
                "intercept_mode": planet_data.get("status", "SIMULATED_LIVE_PASS")
            }
        except Exception as e:
            logger.warning(f"Physical inference error: {e}")
            dark_cash_data = {"detected_stalls": int(adjusted_foot_traffic * 0.05), "nri_score": 1.4, "intercept_mode": "FALLBACK"}

        # Apply grid load shedding multiplier to raw foot traffic before conversion
        try:
            grid_multiplier = macro_engine.analyze_grid_load_shedding(s5p_no2_levels=0.00008, official_grid_active=False)
            adjusted_foot_traffic = int(adjusted_foot_traffic * grid_multiplier)
        except Exception:
            grid_multiplier = 1.0

        # STEP 7: Buyer Conversion Engine (Isolates Active Buyers from Crowds)
        weather_is_raining = False # Placeholder for live weather API integration (Open-Meteo)
        buyer_metrics = buyer_conversion.calculate_active_buyers(
            raw_headcount=adjusted_foot_traffic,
            dwell_distribution_mins=observed_dwell,
            commodity=commodity,
            is_raining=weather_is_raining
        )

        # STEP 8: Temporal Velocity & Sociological Synthesis
        time_context = temporal_engine.calculate_time_context(
            lon=lon_val,
            daily_volume=buyer_metrics["active_buyers"] * base_value * 12.0,
            commodity=commodity
        )

        weather_sim = {"rainfall_mm": 0.0, "temperature_c": 28.0}
        covariance_rule = await covariance_engine.calculate_contextual_multiplier(
            lat=lat_val,
            lon=lon_val,
            commodity=commodity,
            local_time=time_context["local_timestamp"],
            weather_data=weather_sim,
            base_footfall=buyer_metrics["active_buyers"]
        )

        # Compute Final Cash Velocity based on True Buyers
        hourly_cash_velocity = buyer_metrics["active_buyers"] * base_value * time_context["live_activity_index"] * covariance_rule.multiplier
        daily_projected_cash = hourly_cash_velocity * 14.5

        # Trigger Autonomous Covariance Discovery in background safely
        try:
            asyncio.create_task(
                covariance_engine.run_discovery_cycle(
                    lat=lat_val, lon=lon_val, h3_cell=h3_token, sector=commodity
                )
            )
        except Exception as e:
            logger.warning(f"Background discovery task bypassed: {e}")

        elapsed_time = time.time() - start_time

        # Ensure spatial variables exist for the final payload
        location_name = plan.spatial.inferred_subdistrict or plan.spatial.inferred_city or plan.spatial.raw_location_query or "Unknown Location"
        country_code = plan.spatial.country_hint_iso2 or "Unknown"
        
        # STEP 9: Standardized Output Payload for Validation Harness
        return {
            "status": "TARGET_LOCKED",
            "execution_time_seconds": round(elapsed_time, 2),
            "spatial": {
                "location_name": location_name,
                "country_code": country_code,
                "h3_index": h3_token,
                "port_corridor": transit_data.get("port_name", "Nearest Regional Port") if 'transit_data' in locals() else "Unknown"
            },
            "temporal": {
                "local_time": time_context["local_timestamp"],
                "market_cycle": time_context["market_status"]
            },
            "physical_funnel": {
                "gross_pedestrian_flow": buyer_metrics["total_observed_footfall"],
                "active_buyers_hourly": buyer_metrics["active_buyers"],
                "transit_commuters": buyer_metrics["transit_pedestrians"],
                "conversion_rate_pct": f"{buyer_metrics['conversion_rate']*100:.1f}%",
                "observed_dwell_mins": round(observed_dwell, 1),
                "physical_stalls": dark_cash_data["detected_stalls"]
            },
            "market_typology": {
                "target_commodity": commodity,
                "resolved_sku": product_ground_truth["resolved_sku"],
                "unit_type": product_ground_truth["unit_type"],
                "unit_price_local": f"{base_value:,.2f} {base_currency}",
                "fx_reference_rate": f"1 USD = {live_usd_rate:,.2f} {base_currency}"
            },
            "cash_velocity": {
                "live_1hr_velocity": f"{hourly_cash_velocity:,.2f} {base_currency}",
                "projected_24hr_volume": f"{daily_projected_cash:,.2f} {base_currency}",
                "covariance_factor": f"{covariance_rule.trigger_variable} ({covariance_rule.multiplier}x)"
            }
        }
        
        # STEP 10: Construct Final Payload
        spatial_dict.update({
            "status": "TARGET_LOCKED",
            "ui_labels": ui_package["card_1"],
            "breakdown_meta": ui_package["card_2_meta"],
            "breakdown_data": ui_package["card_2_items"],
            "temporal_context": {
                "local_time": time_context["local_timestamp"],
                "market_status": time_context["market_status"],
                "live_activity_index": time_context["live_activity_index"]
            },
            "financial_metrics": {
                "live_1hr_velocity": time_context["horizons"]["live_1hr"],
                "last_12hrs": time_context["horizons"]["last_12hrs"],
                "daily_volume": time_context["horizons"]["last_24hrs"],
                "trailing_7_days": time_context["horizons"]["trailing_7_days"],
                "digital_percentage": computed_metrics["digital_split_pct"],
                "digital_cash": computed_metrics["digital_cash"],
                "physical_cash": computed_metrics["physical_cash"],
                "velocity": computed_metrics["tx_velocity"],
                "markup": financial_projection["applied_markup_pct"],
                "ppp_scaled_baseline": economic_baseline.localized_value,
                "local_currency": economic_baseline.local_currency
            },
            "taxonomy_metrics": {
                "active_contributors": financial_projection["total_human_presence"],
                "buyers": financial_projection.get("active_buyers", computed_metrics["active_buyers"]),
                "merchants": dark_cash_data.get("detected_stalls", int(adjusted_foot_traffic * 0.08)),
                "top_digital_channels": digital_channels
            },
            "data_provenance": {
                "engine_confidence": round(plan.confidence_score * 100, 1) if hasattr(plan, 'confidence_score') else 98.4,
                "intercept_type": dark_cash_data.get("intercept_mode", "Multi-Modal (Overture + SAR + Density Fusion)"),
                "live_intercept": is_live,
                "dwell_time": f"{base_dwell_mins} min",
                "acoustic_friction_db": round(acoustic_db, 1),
                "cleared_import_tonnage": cleared_tonnage,
                "region_context": country_code,
                "routing_port": nearest_port_data["name"]
            },
            "executive_summary": narrative_data
        })

        return spatial_dict

    except Exception as e:
        logger.error(f"Orchestration failure: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Street AI Engine failure: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)