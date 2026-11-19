import os
import sys
import time
import inspect
import logging
import asyncio
import hashlib
import requests
import httpx
import reverse_geocoder as rg
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
from contextlib import asynccontextmanager

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from groq import Groq

# Core Spatial, Compiler & Database Engines
from engine.spatial_engine import SpatialResolver
from engine.database import UnifiedGlobalLedger
from engine.query_compiler import compile_user_prompt
from engine.ui_compiler import build_overview_ui
from engine.deep_synthesizer import DeepAnalysisSynthesizer
from engine.metric_engine import MetricExecutionEngine

# 100% Empirical OSINT, Scope & Sensor Engines
from engine.overture_engine import LiveInfrastructureEngine
from engine.spatial_product_resolver import SpatialProductResolver
from engine.ground_truth import GroundTruthCalibrator
from engine.empirical_scope_engine import EmpiricalScopeEngine
from engine.street_forex import LiveStreetForex
from engine.pricing_scraper import AbsolutePhysicalPricingEngine
from engine.mobility_telemetry import LiveMobilityTelemetry
from engine.optical_flow import LivePhysicalConversionEngine
from engine.foot_traffic_engine import LiveCrowdPatternEngine
from engine.temporal_engine import DynamicTemporalEngine
from engine.inventory_depletion_engine import ZonalCapacityEngine
from engine.macro_systems import MacroSystemsEngine
from engine.telco_telemetry import TripartiteGlobalGateway
from engine.historical_exhaust import HistoricalExhaustEngine
from engine.ml_regression_engine import PhysicalForecastingEngine
from engine.market_share_engine import MarketShareEngine
from engine.resilience_bus import EnterpriseResilienceBus

load_dotenv(override=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("StreetAI.Main")

groq_api_key = os.getenv("GROQ_API_KEY", "")

PREFERRED_GROQ_MODELS = [
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "llama-3.1-8b-instant",
]

EXCLUDED_MODEL_SUBSTRINGS = ("orpheus", "whisper", "guard", "tts", "audio", "allam", "vision", "embed")


def discover_active_groq_model(api_key: str) -> str:
    """Dynamically interrogates Groq for active models with instant offline/SSL-timeout failover."""
    if not api_key:
        logger.warning("⚠️ GROQ_API_KEY missing; defaulting to deterministic mode.")
        return PREFERRED_GROQ_MODELS[0]

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    try:
        res = requests.get("https://api.groq.com/openai/v1/models", headers=headers, timeout=5.0)
        if res.status_code == 200:
            available_ids = [m["id"] for m in res.json().get("data", [])]
            valid_models = [
                m for m in available_ids
                if not any(excl in m.lower() for excl in EXCLUDED_MODEL_SUBSTRINGS)
            ]
            for pref in PREFERRED_GROQ_MODELS:
                if pref in valid_models:
                    logger.info(f"🚀 Auto-Discovery Locked Active Groq Model: '{pref}'")
                    return pref
            if valid_models:
                logger.info(f"🚀 Auto-Discovery Locked Active Groq Model: '{valid_models[0]}'")
                return valid_models[0]
    except Exception as e:
        logger.warning(f"⚡ Groq model discovery SSL/network timeout ({e}); locking default '{PREFERRED_GROQ_MODELS[0]}'")

    return PREFERRED_GROQ_MODELS[0]


ACTIVE_GROQ_MODEL = discover_active_groq_model(groq_api_key)
groq_client = Groq(api_key=groq_api_key, max_retries=0, timeout=12.0) if groq_api_key else None

# Globally Instantiate Pure Physical Reality Engines
spatial_resolver = SpatialResolver()
db_ledger = UnifiedGlobalLedger()
resilience_bus = EnterpriseResilienceBus()

overture = LiveInfrastructureEngine()
product_resolver = SpatialProductResolver()
ground_truth = GroundTruthCalibrator(db_client=db_ledger)
empirical_scope_engine = EmpiricalScopeEngine()

live_forex = LiveStreetForex(db_ledger=db_ledger)
pricing_scraper = AbsolutePhysicalPricingEngine()

mobility_engine = LiveMobilityTelemetry()
optical_flow = LivePhysicalConversionEngine()
crowd_engine = LiveCrowdPatternEngine(mobility_engine, optical_flow)

temporal_engine = DynamicTemporalEngine(db_ledger=db_ledger)
zonal_capacity = ZonalCapacityEngine()
macro_engine = MacroSystemsEngine()
telco_gateway = TripartiteGlobalGateway()
historical_engine = HistoricalExhaustEngine(db_ledger=db_ledger)
ml_engine = PhysicalForecastingEngine()
market_share = MarketShareEngine()
metrics_engine = MetricExecutionEngine()

COUNTRY_METADATA_CACHE: Dict[str, Tuple[str, str, str]] = {}
SPOT_FX_CACHE: Tuple[float, Dict[str, float]] = (0.0, {})


async def _fetch_interbank_spot_rate(currency_code: str) -> float:
    """Fetches live interbank USD -> currency spot rate from open.er-api.com (cached 30 min)."""
    global SPOT_FX_CACHE
    curr = (currency_code or "USD").upper().strip()
    if curr == "USD":
        return 1.0

    now = time.time()
    if SPOT_FX_CACHE[1] and (now - SPOT_FX_CACHE[0]) < 1800:
        if curr in SPOT_FX_CACHE[1]:
            return float(SPOT_FX_CACHE[1][curr])

    try:
        async with httpx.AsyncClient(timeout=4.5) as client:
            res = await client.get("https://open.er-api.com/v6/latest/USD")
            if res.status_code == 200:
                rates = res.json().get("rates", {})
                if isinstance(rates, dict) and rates:
                    SPOT_FX_CACHE = (now, {k.upper(): float(v) for k, v in rates.items() if v})
                    if curr in SPOT_FX_CACHE[1]:
                        return float(SPOT_FX_CACHE[1][curr])
    except Exception as e:
        logger.debug(f"Interbank spot FX fetch pivot ({curr}): {e}")
    return 1.0


async def _resolve_live_country_metadata(
    country_code: str, lat_val: float, lon_val: float
) -> Tuple[str, str, str]:
    """
    100% Live OSINT Sovereign Country & Currency Resolver.
    Returns (verified_iso2_country_code, country_name, active_iso4217_currency_code).
    """
    clean_cc = (country_code or "").strip().upper()
    c_name = ""
    c_curr = ""

    headers = {
        "User-Agent": "StreetAI-PhysicalEngine/9.0 (https://streetai.io; contact@streetai.io) httpx/0.27",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient(timeout=7.0, follow_redirects=True, headers=headers) as client:
        # Live Tier 1: BigDataCloud WGS84 Reverse Geocoder
        try:
            r_bdc = await client.get(
                "https://api-bdc.io/data/reverse-geocode-client",
                params={"latitude": lat_val, "longitude": lon_val, "localityLanguage": "en"},
            )
            if r_bdc.status_code == 200:
                bdc_data = r_bdc.json()
                cc_hit = (bdc_data.get("countryCode") or "").strip().upper()
                if len(cc_hit) == 2 and (not clean_cc or clean_cc in ("UNKNOWN", "GLOBAL") or len(clean_cc) != 2):
                    clean_cc = cc_hit
                c_name = (bdc_data.get("countryName") or "").strip()
        except Exception as e:
            logger.debug(f"BigDataCloud coordinate ISO lock pivot: {e}")

        # Live Tier 2: GeoNames KD-Tree if ISO2 still unverified
        if not clean_cc or len(clean_cc) != 2:
            hits = await asyncio.to_thread(rg.search, (lat_val, lon_val), verbose=False)
            if hits and hits[0].get("cc"):
                clean_cc = hits[0]["cc"].strip().upper()

        if not clean_cc or len(clean_cc) != 2:
            raise RuntimeError(f"CRITICAL: Unable to lock physical ISO country code at ({lat_val}, {lon_val}).")

        if clean_cc in COUNTRY_METADATA_CACHE:
            return COUNTRY_METADATA_CACHE[clean_cc]

        # Live Tier 3: Wikidata SPARQL (`p:P38/ps:P38`)
        try:
            sparql = (
                f'SELECT ?countryLabel ?isoCurr WHERE {{ '
                f'?country wdt:P297 "{clean_cc}" ; p:P38/ps:P38 ?curr . '
                f'?curr wdt:P498 ?isoCurr . '
                f'FILTER(STRLEN(STR(?isoCurr)) = 3) '
                f'SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }} '
                f'}} LIMIT 1'
            )
            r_wd = await client.get(
                "https://query.wikidata.org/sparql",
                params={"query": sparql, "format": "json"},
                headers={
                    "Accept": "application/sparql-results+json",
                    "User-Agent": "StreetAI-PhysicalEngine/9.0 (https://streetai.io; contact@streetai.io) httpx/0.27",
                },
            )
            if r_wd.status_code == 200:
                bindings = r_wd.json().get("results", {}).get("bindings", [])
                if bindings:
                    c_name = c_name or bindings[0].get("countryLabel", {}).get("value", "").strip()
                    c_curr = bindings[0].get("isoCurr", {}).get("value", "").strip().upper()
        except Exception as e:
            logger.debug(f"Wikidata sovereign currency lookup pivot for {clean_cc}: {e}")

        # Live Tier 4: JSDelivr World-Countries Official ISO-4217 CDN
        if not c_name or len(c_curr) != 3:
            try:
                if AbsolutePhysicalPricingEngine._world_countries_cache is None:
                    r_cdn = await client.get("https://cdn.jsdelivr.net/npm/world-countries@latest/countries.json")
                    if r_cdn.status_code == 200 and isinstance(r_cdn.json(), list):
                        AbsolutePhysicalPricingEngine._world_countries_cache = r_cdn.json()

                for item in AbsolutePhysicalPricingEngine._world_countries_cache or []:
                    iso2 = str(item.get("cca2") or "").strip().upper()
                    if iso2 == clean_cc:
                        name_obj = item.get("name", {})
                        if isinstance(name_obj, dict):
                            c_name = c_name or str(name_obj.get("common") or name_obj.get("official") or "").strip()
                        currencies = item.get("currencies", {})
                        if isinstance(currencies, dict) and currencies:
                            c_curr = c_curr or next(iter(currencies.keys()), "").strip().upper()
                        break
            except Exception as e:
                logger.debug(f"World-Countries CDN lookup pivot for {clean_cc}: {e}")

    if not c_name or len(c_curr) != 3:
        raise RuntimeError(f"CRITICAL: Live sovereign currency lookup failed for ISO country '{clean_cc}'.")

    result_tuple = (clean_cc, c_name, c_curr)
    COUNTRY_METADATA_CACHE[clean_cc] = result_tuple
    return result_tuple


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Intelligence Core operational with model: {ACTIVE_GROQ_MODEL}")
    yield
    spatial_resolver.close()
    logger.info("Intelligence Core shutting down...")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserPromptRequest(BaseModel):
    prompt: str = Field(..., description="Raw natural language prompt from user")
    explicit_lat: Optional[float] = None
    explicit_lon: Optional[float] = None


class EdgeTelemetryIngestRequest(BaseModel):
    lat: float = Field(..., description="Latitude of automated sensor/POS node")
    lon: float = Field(..., description="Longitude of automated sensor/POS node")
    source_system: str = Field(
        default="automated_edge",
        description="e.g., frigate_nvr, supervision_cv, esp32_paxcounter, kismet, ltesniffer, odoo_pos, erpnext, openmeter",
    )
    rf_probes: Optional[int] = Field(default=None, ge=0)
    vision_dwell_seconds: Optional[float] = Field(default=None, gt=0)
    pos_handshakes: Optional[int] = Field(default=None, ge=0)
    pos_receipts: Optional[int] = Field(default=None, ge=0)
    ttl_seconds: int = Field(default=1800, ge=60, le=86400)


@app.post("/api/v1/telemetry/ingest")
async def ingest_automated_edge_telemetry(payload: EdgeTelemetryIngestRequest):
    """
    Machine-to-machine ingestion endpoint for automated open-source streams
    (Frigate NVR / Supervision, ESP32-Paxcounter / Kismet / LTESniffer, Odoo POS / OpenMeter).
    Zero human observers required; binds directly to H3 cell in Redis.
    """
    h3_cell = spatial_resolver.get_h3_index(payload.lat, payload.lon)
    result = db_ledger.ingest_edge_telemetry(
        h3_cell=h3_cell,
        rf_probes=payload.rf_probes,
        vision_dwell_seconds=payload.vision_dwell_seconds,
        pos_handshakes=payload.pos_handshakes,
        pos_receipts=payload.pos_receipts,
        ttl_seconds=payload.ttl_seconds,
    )
    return {
        "status": "INGESTED" if result.get("stored") else "DEGRADED",
        "source_system": payload.source_system,
        "h3_cell": h3_cell,
        "details": result,
    }


@app.post("/trigger-pulse")
async def trigger_manual_pulse(lat: float, lon: float, commodity: str = "general_merchandise"):
    """Fires a full physical telemetry scan directly on explicit coordinates."""
    req = UserPromptRequest(
        prompt=f"Map the live cashflow at {lat},{lon}",
        explicit_lat=lat,
        explicit_lon=lon,
    )
    return await process_street_intelligence(req)


@app.post("/api/v1/intelligence/scan")
async def process_street_intelligence(request: UserPromptRequest):
    start_time = time.time()
    try:
        # STEP 1: Compile Query & Resolve Verified Spatial Coordinates
        plan = await compile_user_prompt(request.prompt, groq_client, ACTIVE_GROQ_MODEL)
        if getattr(plan, "requires_disambiguation", False) and not (request.explicit_lat and request.explicit_lon):
            return {"status": "AMBIGUOUS_TARGET", "message": "Specify physical target."}

        target_loc = (
            getattr(plan.spatial, "inferred_subdistrict", None)
            or getattr(plan.spatial, "raw_location_query", request.prompt)
        )
        if request.explicit_lat is not None and request.explicit_lon is not None:
            force_cand = {"lat": request.explicit_lat, "lon": request.explicit_lon}
        elif plan.spatial.verified_lat is not None and plan.spatial.verified_lon is not None:
            force_cand = {"lat": plan.spatial.verified_lat, "lon": plan.spatial.verified_lon}
        else:
            force_cand = None

        spatial_outcome = await spatial_resolver.resolve_target_async(target_loc, force_candidate=force_cand)
        spatial_dict = spatial_outcome.model_dump() if hasattr(spatial_outcome, "model_dump") else spatial_outcome

        if spatial_dict.get("status") == "AMBIGUOUS_TARGET":
            return spatial_dict

        city_info = spatial_dict.get("city_overview", {})
        lat_val = float(city_info.get("lat", 0.0))
        lon_val = float(city_info.get("lon", 0.0))
        country_code = plan.spatial.country_hint_iso2 or city_info.get("country_code", "UNKNOWN")
        city_info["country_code"] = country_code
        h3_token = city_info.get("h3_cell_id", "")
        commodity = getattr(plan.economic, "primary_commodity", "general_merchandise")

        # ⚡ CACHE BYPASS
        live_memory_state = db_ledger.fetch_live_state(h3_token, commodity)
        if live_memory_state:
            live_memory_state["execution_time_seconds"] = round(time.time() - start_time, 4)
            return live_memory_state

        # =========================================================================
        # ⚡ 100% EMPIRICAL CONCURRENT OSINT & SENSOR FUSION PIPELINE
        # =========================================================================
        # Step 1: Single-Shot Coalesced Spatial Multiplexer + Live Sovereign Currency Metadata
        (country_code, country_name, local_currency), spatial_snapshot = await asyncio.gather(
            _resolve_live_country_metadata(country_code, lat_val, lon_val),
            overture.get_coalesced_spatial_snapshot(lat_val, lon_val),
        )
        city_info["country_code"] = country_code
        city_name_str = (
            spatial_snapshot.get("location_meta", {}).get("city")
            or plan.spatial.inferred_city
            or city_info.get("city_name", "")
        )

        # Step 2: Live Interbank Spot FX + Structural Density Multiplier + Multi-Sector Native SKU Resolution
        spot_fx_rate, structural_multiplier = await asyncio.gather(
            _fetch_interbank_spot_rate(local_currency),
            ground_truth.calculate_dynamic_multiplier(h3_token, lat_val, lon_val),
        )
        fx_rate_per_usd = float(spot_fx_rate or 1.0)

        resolved_sku_data = await product_resolver.resolve_market_ground_truth(
            lat=lat_val,
            lon=lon_val,
            requested_commodity=commodity,
            spatial_snapshot=spatial_snapshot,
            local_currency=local_currency,
            fx_rate_per_usd=fx_rate_per_usd,
            target_name=target_loc or city_name_str,
        )

        # Step 2B: Whole-Internet Empirical Scope (buildings, stalls, economic units, footfall, spend)
        empirical_scope = await empirical_scope_engine.resolve_empirical_scope(
            lat=lat_val,
            lon=lon_val,
            target_name=target_loc,
            city_name=city_name_str,
            country_name=country_name,
            local_currency=local_currency,
            fx_rate_per_usd=fx_rate_per_usd,
            commodity=commodity,
            spatial_snapshot=spatial_snapshot,
        )
        physical_poi_count = int(
            empirical_scope.get("scoped_economic_units")
            or spatial_snapshot.get("verified_merchants_total", 0)
        )

        # Step 3: Macro, Port, Working-Capital FX, Order-Book Pricing, Telco, Capacity, MarketShare & Temporal
        (
            macro_payload,
            nearest_port,
            forex_payload,
            pricing_payload,
            gateway_payload,
            capacity_payload,
            market_share_data,
            temporal_payload,
        ) = await asyncio.gather(
            macro_engine.evaluate_systemic_friction(lat_val, lon_val),
            macro_engine.get_nearest_physical_port(lat_val, lon_val),
            live_forex.get_realtime_rate(
                country_code, local_currency, lat_val, lon_val, empirical_scope=empirical_scope
            ),
            pricing_scraper.get_absolute_street_price(
                lat_val,
                lon_val,
                commodity,
                local_currency,
                resolved_sku_data=resolved_sku_data,
                country_code=country_code,
                fx_rate_per_usd=fx_rate_per_usd,
                empirical_scope=empirical_scope,
            ),
            telco_gateway.calculate_digital_liquidity_index(
                lat_val,
                lon_val,
                country_code,
                country_name=country_name,
                currency_code=local_currency,
                spatial_snapshot=spatial_snapshot,
            ),
            zonal_capacity.calculate_mass_depletion_and_cap(
                lat_val, lon_val, commodity, city_name_str, empirical_scope=empirical_scope
            ),
            market_share.calculate_market_share(lat_val, lon_val),
            temporal_engine.calculate_time_context(
                lat_val, lon_val, venue_hint=target_loc, city_hint=city_name_str, spatial_snapshot=spatial_snapshot
            ),
        )

        active_networks = forex_payload.get("active_networks_detected") or gateway_payload.get("discovered_local_rails", [])
        unit_price = float(pricing_payload.get("price", 0.0))
        sector_breakdown = pricing_payload.get("sector_breakdown", [])

        # Step 4: Mobility, Public Sensors & Empirical Dwell Conversion Triangulation
        crowd_payload = await crowd_engine.get_live_cluster_busyness(lat_val, lon_val, h3_token, active_networks)
        raw_crowd = crowd_payload.get("raw_physical_telemetry", {})
        active_mpos_hardware = int(raw_crowd.get("active_mpos_terminals", 0))
        rf_devices = int(raw_crowd.get("rf_devices_detected", 0))
        dwell_mins = float(raw_crowd.get("device_dwell_time_minutes", 0.0))
        foot_kmh = float(raw_crowd.get("foot_velocity_kmh", 0.0))

        temp_mob = temporal_payload.get("mobile_device_telemetry", {})
        temp_density = int(temp_mob.get("live_device_density_index", 0) or 0)
        planet_phys = temporal_payload.get("planetary_physics", {})
        is_day = bool(planet_phys.get("is_day", True))
        local_hr = int(planet_phys.get("local_hour", 12))
        rain_mm = float(planet_phys.get("precipitation_mm", 0.0) or 0.0)

        # Step 5: Execute Zero-Simulation Cohort Cash Velocity & Double-Entry Treasury Float
        metrics_payload = metrics_engine.execute_plan(
            exact_unit_price=unit_price,
            active_mpos_hardware=active_mpos_hardware,
            rf_devices_detected=rf_devices,
            dwell_time_minutes=dwell_mins,
            foot_velocity_kmh=foot_kmh,
            structural_multiplier=structural_multiplier,
            temporal_density_index=temp_density,
            is_daylight=is_day,
            sector_breakdown=sector_breakdown,
            empirical_scope=empirical_scope,
            local_hour=local_hr,
            precipitation_mm=rain_mm,
            pricing_payload=pricing_payload,
            temporal_payload=temporal_payload,
            crowd_payload=crowd_payload,
            forex_payload=forex_payload,
            gateway_payload=gateway_payload,
            capacity_payload=capacity_payload,
        )
        current_velocity = float(metrics_payload.get("verified_velocity_floor_local", 0.0))
        active_buyers_now = int(metrics_payload.get("active_buyers_live", 0))
        treasury_float = metrics_payload.get("treasury_float_metrics", {})

        # Step 5B: Commit Real Observation & Balanced Double-Entry Settlement Journal into SQLite Ledger
        today_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if current_velocity > 0:
            await db_ledger.commit_historical_volume(h3_token, today_utc, current_velocity)

        ledger_tx_id = db_ledger.record_double_entry_settlement(
            h3_cell=h3_token,
            currency=local_currency,
            authorized_inflow_local=current_velocity,
            in_transit_float_local=float(treasury_float.get("in_transit_settlement_float_local", 0.0) or 0.0),
            cleared_cash_local=float(treasury_float.get("cleared_working_capital_hourly_local", 0.0) or 0.0),
            inventory_payables_local=round(current_velocity * 0.65, 2),
            reference=f"SCAN:{target_loc}:{commodity}",
        )
        db_ledger.record_telemetry_observation(
            h3_cell=h3_token,
            commodity=commodity,
            local_currency=local_currency,
            hourly_velocity_local=current_velocity,
            hourly_visitors=int(metrics_payload.get("hourly_visitors_footfall", 0) or 0),
            clearing_price_local=unit_price,
            occupancy_pct=temp_mob.get("observed_protobuf_occupancy_pct"),
            congestion_ratio=float(raw_crowd.get("live_perimeter_congestion_ratio", 1.0) or 1.0),
            precipitation_mm=rain_mm,
            operating_state=str(metrics_payload.get("market_operating_state", "UNKNOWN")),
        )

        # Step 6: Extract Anchored 7-Day Historical Ledger & Execute Live ML Ridge Regression
        historical_7d_chart = await historical_engine.generate_7d_ledger(
            lat_val, lon_val, h3_token, commodity, current_velocity=current_velocity
        )
        ml_projections = await ml_engine.predict_future_horizon(
            lat_val, lon_val, historical_7d_chart, current_velocity
        )

        # Step 7: Dynamic LLM Executive Synthesis based strictly on verified telemetry
        intent_type = getattr(plan.economic, "intent_type", "cashflow_location")
        synthesis_data = await DeepAnalysisSynthesizer.generate_ui_synthesis(
            commodity=resolved_sku_data.get("resolved_sku", commodity),
            location=city_info.get("city_name", "Target Zone"),
            metrics={
                "local_currency": local_currency,
                "hourly_cash_velocity": current_velocity,
                "daily_cashflow": metrics_payload.get("projected_daily_cashflow_local", 0.0),
                "active_buyers": active_buyers_now,
                "conversion_rate_pct": metrics_payload.get("physical_conversion_rate_pct", 0.0),
                "sector_breakdown": sector_breakdown,
                "structural_limit_reached": False,
            },
            intent=intent_type,
            client=groq_client,
            model=ACTIVE_GROQ_MODEL,
        )

        elapsed_time = time.time() - start_time
        city_info["port_corridor"] = nearest_port.get("port_name", "UNKNOWN")

        final_payload = {
            "status": "TARGET_LOCKED",
            "execution_time_seconds": round(elapsed_time, 2),
            "city_overview": city_info,
            "chat_ui": {"target_locked_subtitle": synthesis_data["chat_subtitle"]},
            "data_overview_ui": build_overview_ui(plan, metrics_payload, gateway_payload, local_currency),
            "deep_analysis_ui": {"macro_thesis": synthesis_data["deep_analysis_report"]},
            "market_share_data": market_share_data,
            "temporal_context": temporal_payload,
            "historical_metrics": {"trailing_7d_chart": historical_7d_chart},
            "financial_metrics": {
                "local_currency": local_currency,
                "forex_telemetry": forex_payload,
                "pricing_matrix": pricing_payload,
                "live_deterministic": metrics_payload,
                "ml_projected": ml_projections,
                "treasury_float_ledger": {
                    "ledger_tx_id": ledger_tx_id,
                    **treasury_float,
                },
            },
            "structural_ground_truth": {
                "density_multiplier": structural_multiplier,
                "physical_merchants": physical_poi_count,
                "permanent_buildings_count": empirical_scope.get("permanent_buildings_count", 1),
                "registered_stalls_complex": empirical_scope.get("registered_stalls_complex", physical_poi_count),
                "total_zone_economic_units": empirical_scope.get("total_zone_economic_units_complex", physical_poi_count),
                "osm_3d_gross_floor_sqm": spatial_snapshot.get("total_osm_3d_gross_floor_sqm", 0.0),
                "spatial_sub_blocks": spatial_snapshot.get("spatial_sub_blocks", []),
                "empirical_scope": empirical_scope,
                "scope_mode": resolved_sku_data.get("scope_mode", "LOCATION_ECOSYSTEM"),
                "resolved_sku": resolved_sku_data.get("resolved_sku", commodity),
                "sector_portfolio": resolved_sku_data.get("sector_portfolio", []),
            },
            "empirical_verification_scorecard": metrics_payload.get("empirical_verification_scorecard", {}),
            "macro_logistics": macro_payload,
            "physical_funnel": crowd_payload,
            "digital_gateway": gateway_payload,
            "zonal_capacity": capacity_payload,
        }

        db_ledger.commit_live_state(h3_token, commodity, final_payload)
        return final_payload

    except Exception as e:
        logger.error(f"Engine Core Failure: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Street AI Engine halted: {str(e)}")


@app.websocket("/api/v1/intelligence/stream")
async def stream_street_intelligence(websocket: WebSocket):
    await websocket.accept()
    try:
        init_data = await websocket.receive_json()
        lat_val = float(init_data.get("lat"))
        lon_val = float(init_data.get("lon"))
        commodity = str(init_data.get("commodity", "general_merchandise"))
        h3_token = spatial_resolver.get_h3_index(lat_val, lon_val)

        _, _, local_currency = await _resolve_live_country_metadata("UNKNOWN", lat_val, lon_val)
        resolved_sku_data = await product_resolver.resolve_market_ground_truth(
            lat=lat_val, lon=lon_val, requested_commodity=commodity
        )
        pricing_payload = await pricing_scraper.get_absolute_street_price(
            lat_val, lon_val, commodity, local_currency, resolved_sku_data=resolved_sku_data
        )
        live_unit_price = float(pricing_payload.get("price", 0.0))

        await websocket.send_json({"status": "UPLINK_ESTABLISHED", "message": "Physical sensors locked onto coordinates."})

        while True:
            cycle_start = time.time()
            try:
                crowd_payload, temporal_payload, structural_mult = await asyncio.gather(
                    crowd_engine.get_live_cluster_busyness(lat_val, lon_val, h3_token, []),
                    temporal_engine.calculate_time_context(lat_val, lon_val),
                    ground_truth.calculate_dynamic_multiplier(h3_token, lat_val, lon_val),
                )

                raw_crowd = crowd_payload.get("raw_physical_telemetry", {})
                active_mpos = int(raw_crowd.get("active_mpos_terminals", 0))
                rf_devices = int(raw_crowd.get("rf_devices_detected", 0))
                dwell_mins = float(raw_crowd.get("device_dwell_time_minutes", 0.0))
                foot_kmh = float(raw_crowd.get("foot_velocity_kmh", 0.0))
                temp_density = int(temporal_payload.get("mobile_device_telemetry", {}).get("live_device_density_index", 0))
                is_day = bool(temporal_payload.get("planetary_physics", {}).get("is_day", True))

                metrics = metrics_engine.execute_plan(
                    exact_unit_price=live_unit_price,
                    active_mpos_hardware=active_mpos,
                    rf_devices_detected=rf_devices,
                    dwell_time_minutes=dwell_mins,
                    foot_velocity_kmh=foot_kmh,
                    structural_multiplier=structural_mult,
                    temporal_density_index=temp_density,
                    is_daylight=is_day,
                    pricing_payload=pricing_payload,
                    temporal_payload=temporal_payload,
                    crowd_payload=crowd_payload,
                )

                tick_payload = {
                    "timestamp": time.time(),
                    "live_metrics": {
                        "hourly_velocity_floor": metrics.get("verified_velocity_floor_local", 0.0),
                        "active_buyers_live": metrics.get("active_buyers_live", 0),
                        "instantaneous_clock_hour_active_buyers": metrics.get("instantaneous_clock_hour_active_buyers", 0),
                        "active_mpos_hardware": active_mpos,
                        "device_dwell_time_minutes": dwell_mins,
                        "temporal_context": temporal_payload,
                        "empirical_verification_scorecard": metrics.get("empirical_verification_scorecard", {}),
                    },
                }
                await websocket.send_json(tick_payload)
            except Exception as e:
                await websocket.send_json({"status": "TELEMETRY_LOSS", "error": str(e)})

            process_time = time.time() - cycle_start
            await asyncio.sleep(max(0.0, 5.0 - process_time))

    except WebSocketDisconnect:
        logger.info("🔴 Live Telemetry Stream Disconnected")
    except Exception as e:
        logger.error(f"Stream failure: {str(e)}")
        await websocket.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)