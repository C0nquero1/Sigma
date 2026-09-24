import os
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import httpx
from dotenv import load_dotenv

try:
    import s2sphere
    HAS_S2 = True
except ImportError:
    HAS_S2 = False

load_dotenv(override=True)
logger = logging.getLogger("StreetAI.SpatialEngine")

class LocationCandidate(BaseModel):
    candidate_id: str
    name: str
    context: str
    location_type: str
    confidence_score: float
    latitude: float
    longitude: float

class DisambiguationPayload(BaseModel):
    status: str = "AMBIGUOUS_TARGET"
    original_prompt: str
    extracted_entity: str
    candidates: List[LocationCandidate]

class TargetLockedPayload(BaseModel):
    status: str = "TARGET_LOCKED"
    city_overview: Dict[str, Any]
    ui_schema: Dict[str, Any]
    sim_data: Dict[str, Any]

STREET_AI_CKB: Dict[str, Dict[str, Any]] = {
    "computer village": {
        "candidate_id": "GEO-CKB-LAGOS-CV",
        "name": "COMPUTER VILLAGE",
        "context": "Ikeja, Lagos, Nigeria",
        "location_type": "Informal Tech Megahub",
        "confidence_score": 1.0,
        "latitude": 6.5932,
        "longitude": 3.3421
    },
    "ladipo market": {
        "candidate_id": "GEO-CKB-LAGOS-LDP",
        "name": "LADIPO MARKET",
        "context": "Mushin, Lagos, Nigeria",
        "location_type": "Auto-Parts Wholesale Hub",
        "confidence_score": 1.0,
        "latitude": 6.5381,
        "longitude": 3.3512
    },
    "kejetia market": {
        "candidate_id": "GEO-CKB-KUMASI-KEJ",
        "name": "KEJETIA MARKET",
        "context": "Kumasi, Ashanti, Ghana",
        "location_type": "West African Wholesale Hub",
        "confidence_score": 1.0,
        "latitude": 6.6961,
        "longitude": -1.6244
    },
    "dharavi": {
        "candidate_id": "GEO-CKB-MUMBAI-DH",
        "name": "DHARAVI SECTOR 17",
        "context": "Mumbai, Maharashtra, India",
        "location_type": "Manufacturing & Recycling Hub",
        "confidence_score": 1.0,
        "latitude": 19.0380,
        "longitude": 72.8538
    },
    "tepito": {
        "candidate_id": "GEO-CKB-MEXICO-TEP",
        "name": "BARRIO DE TEPITO",
        "context": "Cuauhtémoc, Mexico City, Mexico",
        "location_type": "Informal Commercial Core",
        "confidence_score": 1.0,
        "latitude": 19.4442,
        "longitude": -99.1283
    },
    "ariaria market": {
        "candidate_id": "GEO-CKB-ABA-ARI",
        "name": "ARIARIA INTERNATIONAL MARKET",
        "context": "Aba, Abia, Nigeria",
        "location_type": "Industrial & Apparel Hub",
        "confidence_score": 1.0,
        "latitude": 5.1121,
        "longitude": 7.3392
    }
}

class SpatialResolver:
    # Regional macroeconomic default parameters
    REGIONAL_ANCHORS = {
        "Sub-Saharan Africa": {"currency": "USD", "parity_ratio": 1.12},
        "Latin America": {"currency": "USD", "parity_ratio": 1.08},
        "South Asia": {"currency": "USD", "parity_ratio": 1.15},
        "Southeast Asia": {"currency": "USD", "parity_ratio": 1.10},
        "Global Default": {"currency": "USD", "parity_ratio": 1.05}
    }

    def __init__(self):
        self.api_key = os.getenv("GEOAPIFY_API_KEY", "ad59606f7d2545d388c6702eb08b164d")
        self.client = httpx.Client(
            timeout=15.0,
            headers={"User-Agent": "StreetAI-SpatialEngine/2.1"},
            limits=httpx.Limits(max_keepalive_connections=10, max_connections=20)
        )

    def close(self):
        self.client.close()

    def get_s2_token(self, lat: float, lon: float, level: int = 11) -> str:
        if HAS_S2:
            try:
                p = s2sphere.LatLng.from_degrees(lat, lon)
                cell = s2sphere.CellId.from_lat_lng(p).parent(level)
                return cell.to_token()
            except Exception:
                pass
        return hex(abs(hash(f"{round(lat, 3)}_{round(lon, 3)}")))[2:9]

    def _resolve_macro_anchor(self, lat: float, lng: float) -> dict:
        """Determines macroeconomic anchoring based on geographical bounding boxes."""
        if 4.0 <= lat <= 15.0 and -18.0 <= lng <= 15.0:
            region = "Sub-Saharan Africa"
        elif -35.0 <= lat <= 30.0 and -120.0 <= lng <= -35.0:
            region = "Latin America"
        elif 5.0 <= lat <= 37.0 and 60.0 <= lng <= 97.0:
            region = "South Asia"
        elif -11.0 <= lat <= 28.0 and 95.0 <= lng <= 141.0:
            region = "Southeast Asia"
        else:
            region = "Sub-Saharan Africa" # Defaulting to core target market

        return self.REGIONAL_ANCHORS.get(region, self.REGIONAL_ANCHORS["Global Default"])

    def query_geoapify_radar(self, entity: str) -> List[LocationCandidate]:
        candidates: List[LocationCandidate] = []
        if not self.api_key:
            return candidates

        params = {
            "text": entity,
            "apiKey": self.api_key,
            "limit": 5
        }

        for attempt in range(2):
            try:
                response = self.client.get("https://api.geoapify.com/v1/geocode/search", params=params, timeout=12.0)
                if response.status_code == 200:
                    features = response.json().get("features", [])
                    for feat in features:
                        props = feat.get("properties", {})
                        rank = props.get("rank", {})
                        confidence = rank.get("confidence", 0.5)

                        if confidence < 0.2:
                            continue

                        city = props.get("city") or props.get("county") or props.get("state", "")
                        country = props.get("country", "")
                        context_str = f"{city}, {country}".strip(", ")

                        candidates.append(LocationCandidate(
                            candidate_id=f"GEO-{props.get('place_id', 'node_id')}",
                            name=props.get("name") or props.get("street") or entity.title(),
                            context=context_str if context_str else "Global Node",
                            location_type=(props.get("category") or "Commercial District").replace("_", " ").title(),
                            confidence_score=confidence,
                            latitude=props.get("lat", 0.0),
                            longitude=props.get("lon", 0.0)
                        ))
                    break
            except Exception as err:
                logger.warning(f"Geoapify search attempt {attempt + 1} failed: {err}")

        return candidates

    def query_nominatim_fallback(self, entity: str) -> List[LocationCandidate]:
        candidates: List[LocationCandidate] = []
        try:
            params = {"q": entity, "format": "json", "addressdetails": 1, "limit": 5}
            response = self.client.get("https://nominatim.openstreetmap.org/search", params=params, timeout=10.0)
            if response.status_code == 200:
                for idx, item in enumerate(response.json()):
                    addr = item.get("address", {})
                    city = addr.get("city") or addr.get("town") or addr.get("county") or addr.get("state", "")
                    country = addr.get("country", "")
                    context_str = f"{city}, {country}".strip(", ")

                    candidates.append(LocationCandidate(
                        candidate_id=f"OSM-{item.get('place_id', idx)}",
                        name=item.get("display_name", "").split(",")[0].title() or entity.title(),
                        context=context_str if context_str else "Global Region",
                        location_type=(item.get("type") or "Informal Trade Node").replace("_", " ").title(),
                        confidence_score=0.85 - (idx * 0.1),
                        latitude=float(item.get("lat", 0.0)),
                        longitude=float(item.get("lon", 0.0))
                    ))
        except Exception as err:
            logger.warning(f"Nominatim fallback query failed: {err}")
        return candidates

    def resolve_target(self, original_prompt: str, extracted_entity: str, has_explicit_context: bool = False, force_candidate: Optional[dict] = None) -> Any:
        # STEP A: Selection Override via Scroll Up
        if force_candidate:
            cand = LocationCandidate(
                candidate_id=force_candidate["id"],
                name=extracted_entity.title(),
                context="Selected Location Anchor",
                location_type="Geofenced Target Node",
                confidence_score=1.0,
                latitude=force_candidate["lat"],
                longitude=force_candidate["lon"]
            )
            return self._build_lock_response(cand)

        # STEP B: Check Custom Knowledge Base for System D Hubs
        entity_key = extracted_entity.lower().strip()
        for ckb_key, ckb_data in STREET_AI_CKB.items():
            if ckb_key in entity_key:
                logger.info(f"CKB System D match locked: '{ckb_key}'")
                cand = LocationCandidate(**ckb_data)
                return self._build_lock_response(cand)

        # STEP C: Multi-Engine Radar Search
        candidates = self.query_geoapify_radar(extracted_entity)
        if not candidates:
            candidates = self.query_nominatim_fallback(extracted_entity)

        if not candidates:
            # Global Lagos Default Fallback Anchor if completely unknown
            fallback = LocationCandidate(
                candidate_id="GEO-DEFAULT-LAGOS",
                name=extracted_entity.title(),
                context="Lagos, Nigeria",
                location_type="Informal Megahub",
                confidence_score=0.9,
                latitude=6.5244,
                longitude=3.3792
            )
            return self._build_lock_response(fallback)

        unique_contexts = {c.context for c in candidates if c.context}

        # Trigger AMBIGUOUS_TARGET if no explicit context was typed and matches span multiple distinct regions
        if not has_explicit_context and len(candidates) > 1 and len(unique_contexts) > 1:
            logger.info(f"Disambiguation required for un-contextualized query '{extracted_entity}'. Returning candidates to UI.")
            return DisambiguationPayload(
                original_prompt=original_prompt,
                extracted_entity=extracted_entity,
                candidates=candidates
            )

        return self._build_lock_response(candidates[0])

    def _build_lock_response(self, candidate: LocationCandidate) -> TargetLockedPayload:
        s2_token = self.get_s2_token(candidate.latitude, candidate.longitude)
        macro_anchor = self._resolve_macro_anchor(candidate.latitude, candidate.longitude)

        return TargetLockedPayload(
            city_overview={
                "lat": candidate.latitude,
                "lon": candidate.longitude,
                "city_name": candidate.name.upper(),
                "full_context": candidate.context,
                "s2_cell_id": s2_token,
                "currency_code": macro_anchor["currency"],
                "formal_parity_ratio": macro_anchor["parity_ratio"]
            },
            ui_schema={
                "layout_type": "MACRO_DASHBOARD",
                "focus_sector": candidate.location_type
            },
            sim_data={
                "spatial_capacity": int(candidate.confidence_score * 100),
                "target_node": {
                    "id": candidate.candidate_id,
                    "lat": candidate.latitude,
                    "lon": candidate.longitude
                }
            }
        )