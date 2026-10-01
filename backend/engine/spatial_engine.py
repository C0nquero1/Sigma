import os
import logging
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field
import httpx
import duckdb
from dotenv import load_dotenv

# Replaced S2 with Uber H3 Hexagonal Grid System
try:
    import h3
    HAS_H3 = True
except ImportError:
    HAS_H3 = False

try:
    import reverse_geocoder as rg
    HAS_RG = True
except ImportError:
    HAS_RG = False

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
    country_code: str = "GLOBAL"

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

# System D Knowledge Base for hyper-dense informal megahubs
STREET_AI_CKB: Dict[str, Dict[str, Any]] = {
    "computer village": {
        "candidate_id": "GEO-CKB-LAGOS-CV",
        "name": "COMPUTER VILLAGE",
        "context": "Ikeja, Lagos, Nigeria",
        "location_type": "Informal Tech Megahub",
        "confidence_score": 1.0,
        "latitude": 6.5932,
        "longitude": 3.3421,
        "country_code": "NG"
    },
    "ladipo market": {
        "candidate_id": "GEO-CKB-LAGOS-LDP",
        "name": "LADIPO MARKET",
        "context": "Mushin, Lagos, Nigeria",
        "location_type": "Auto-Parts Wholesale Hub",
        "confidence_score": 1.0,
        "latitude": 6.5381,
        "longitude": 3.3512,
        "country_code": "NG"
    },
    "kejetia market": {
        "candidate_id": "GEO-CKB-KUMASI-KEJ",
        "name": "KEJETIA MARKET",
        "context": "Kumasi, Ashanti, Ghana",
        "location_type": "West African Wholesale Hub",
        "confidence_score": 1.0,
        "latitude": 6.6961,
        "longitude": -1.6244,
        "country_code": "GH"
    },
    "dharavi": {
        "candidate_id": "GEO-CKB-MUMBAI-DH",
        "name": "DHARAVI SECTOR 17",
        "context": "Mumbai, Maharashtra, India",
        "location_type": "Manufacturing & Recycling Hub",
        "confidence_score": 1.0,
        "latitude": 19.0380,
        "longitude": 72.8538,
        "country_code": "IN"
    },
    "tepito": {
        "candidate_id": "GEO-CKB-MEXICO-TEP",
        "name": "BARRIO DE TEPITO",
        "context": "Cuauhtémoc, Mexico City, Mexico",
        "location_type": "Informal Commercial Core",
        "confidence_score": 1.0,
        "latitude": 19.4442,
        "longitude": -99.1283,
        "country_code": "MX"
    },
    "ariaria market": {
        "candidate_id": "GEO-CKB-ABA-ARI",
        "name": "ARIARIA INTERNATIONAL MARKET",
        "context": "Aba, Abia, Nigeria",
        "location_type": "Industrial & Apparel Hub",
        "confidence_score": 1.0,
        "latitude": 5.1121,
        "longitude": 7.3392,
        "country_code": "NG"
    }
}

class SpatialResolver:
    def __init__(self):
        self.geoapify_key = os.getenv("GEOAPIFY_API_KEY", "")
        self.client = httpx.Client(
            timeout=12.0,
            headers={"User-Agent": "StreetAI-SpatialEngine/3.0"},
            limits=httpx.Limits(max_keepalive_connections=10, max_connections=20)
        )
        
        # Initialize DuckDB for Overture GeoParquet streaming
        self.db = duckdb.connect(':memory:')
        try:
            self.db.execute("INSTALL spatial; LOAD spatial;")
            self.db.execute("INSTALL httpfs; LOAD httpfs;")
            self.db.execute("SET s3_region='us-west-2';")
            self.duckdb_ready = True
            logger.info("DuckDB Spatial & HTTPFS initialized successfully.")
        except Exception as e:
            logger.warning(f"DuckDB spatial initialization warning: {e}. Falling back to REST geocoders.")
            self.duckdb_ready = False

        # Overture Maps S3 release path
        self.overture_places_s3 = "s3://overturemaps-us-west-2/release/2026-09-23.0/theme=places/type=place/*"

    def close(self):
        self.client.close()
        try:
            self.db.close()
        except Exception:
            pass

    def get_h3_index(self, lat: float, lon: float, resolution: int = 9) -> str:
        """
        Resolution 9 = ~100m edge length (Market stall cluster level)
        Resolution 11 = ~25m edge length (Individual vendor row level)
        """
        if HAS_H3:
            try:
                # Handles both H3 v3 and v4 Python bindings
                if hasattr(h3, 'latlng_to_cell'):
                    return h3.latlng_to_cell(lat, lon, resolution)
                else:
                    return h3.geo_to_h3(lat, lon, resolution)
            except Exception as e:
                logger.debug(f"H3 indexing failed: {e}")
        return hex(abs(hash(f"{round(lat, 3)}_{round(lon, 3)}")))[2:10]

    def _reverse_country_code(self, lat: float, lon: float) -> str:
        if HAS_RG:
            try:
                res = rg.search((lat, lon))[0]
                return res.get('cc', 'GLOBAL')
            except Exception:
                pass
        return "GLOBAL"

    def _query_overture_box(self, micro_target: str, lat: float, lon: float, offset: float = 0.08) -> Optional[LocationCandidate]:
        """Queries Overture Places GeoParquet on S3 using an indexed bounding box."""
        if not self.duckdb_ready:
            return None

        minx, maxx = lon - offset, lon + offset
        miny, maxy = lat - offset, lat + offset
        sanitized_target = micro_target.replace("'", "''").lower()

        duck_query = f"""
            SELECT 
                id, 
                names.primary AS name, 
                categories.primary AS category,
                confidence,
                ST_Y(geometry) as latitude, 
                ST_X(geometry) as longitude
            FROM read_parquet('{self.overture_places_s3}', filename=true, hive_partitioning=1)
            WHERE bbox.xmin BETWEEN {minx} AND {maxx}
              AND bbox.ymin BETWEEN {miny} AND {maxy}
              AND lower(names.primary) LIKE '%{sanitized_target}%'
            ORDER BY confidence DESC
            LIMIT 1
        """
        try:
            cursor = self.db.execute(duck_query)
            row = cursor.fetchone()
            if row:
                r_lat, r_lon = float(row[4]), float(row[5])
                return LocationCandidate(
                    candidate_id=f"OVR-{row[0]}",
                    name=str(row[1]).upper(),
                    context=f"Overture Verified Node ({row[2]})",
                    location_type=(row[2] or "Commercial Node").replace("_", " ").title(),
                    confidence_score=float(row[3]) if row[3] else 0.95,
                    latitude=r_lat,
                    longitude=r_lon,
                    country_code=self._reverse_country_code(r_lat, r_lon)
                )
        except Exception as e:
            logger.debug(f"Overture Parquet stream missed/failed: {e}")
        return None

    def query_nominatim(self, entity: str) -> List[LocationCandidate]:
        candidates: List[LocationCandidate] = []
        try:
            params = {"q": entity, "format": "json", "addressdetails": 1, "limit": 5}
            res = self.client.get("https://nominatim.openstreetmap.org/search", params=params, timeout=8.0)
            if res.status_code == 200:
                for idx, item in enumerate(res.json()):
                    addr = item.get("address", {})
                    city = addr.get("city") or addr.get("town") or addr.get("county") or addr.get("state", "")
                    country = addr.get("country", "")
                    cc = addr.get("country_code", "global").upper()
                    r_lat, r_lon = float(item.get("lat", 0.0)), float(item.get("lon", 0.0))

                    candidates.append(LocationCandidate(
                        candidate_id=f"OSM-{item.get('place_id', idx)}",
                        name=item.get("display_name", "").split(",")[0].title() or entity.title(),
                        context=f"{city}, {country}".strip(", ") or "Global Coordinate",
                        location_type=(item.get("type") or "Informal Trade Node").replace("_", " ").title(),
                        confidence_score=max(0.3, 0.85 - (idx * 0.1)),
                        latitude=r_lat,
                        longitude=r_lon,
                        country_code=cc if cc != "GLOBAL" else self._reverse_country_code(r_lat, r_lon)
                    ))
        except Exception as e:
            logger.warning(f"Nominatim lookup failed: {e}")
        return candidates

    def resolve_target(
        self, 
        original_prompt: str = "", 
        extracted_entity: Any = None, 
        has_explicit_context: bool = False, 
        force_candidate: Optional[dict] = None
    ) -> Union[TargetLockedPayload, DisambiguationPayload]:
        
        # 1. Handle UI Selection Override
        if force_candidate:
            c_lat = float(force_candidate["lat"])
            c_lon = float(force_candidate["lon"])
            cand = LocationCandidate(
                candidate_id=str(force_candidate.get("id", "PIN-LOCK")),
                name=str(extracted_entity or "Selected Anchor").title(),
                context="Selected Geographic Anchor",
                location_type="Geofenced Target Node",
                confidence_score=1.0,
                latitude=c_lat,
                longitude=c_lon,
                country_code=self._reverse_country_code(c_lat, c_lon)
            )
            return self._build_lock_response(cand)

        # 2. Extract string tokens whether passed from plan or raw string
        if hasattr(extracted_entity, "raw_location_query"):
            macro_target = extracted_entity.inferred_city or extracted_entity.raw_location_query
            micro_target = extracted_entity.inferred_subdistrict or extracted_entity.raw_location_query
            search_query = f"{micro_target} {macro_target}".strip()
        else:
            search_query = str(extracted_entity or original_prompt or "Abuja").strip()
            micro_target = search_query
            macro_target = search_query

        # 3. Check System D CKB
        search_lower = search_query.lower()
        for key, data in STREET_AI_CKB.items():
            if key in search_lower:
                logger.info(f"Matched CKB System D Core Hub: '{key}'")
                cand = LocationCandidate(**data)
                return self._build_lock_response(cand)

        # 4. Multi-Engine Radar (OSM / Nominatim)
        candidates = self.query_nominatim(search_query)

        # If a candidate is found, attempt Overture micro-market pinpointing inside the bounding box
        if candidates and self.duckdb_ready:
            best_match = candidates[0]
            ovr_candidate = self._query_overture_box(micro_target, best_match.latitude, best_match.longitude)
            if ovr_candidate:
                logger.info(f"Overture Mesh locked high-confidence POI: {ovr_candidate.name}")
                return self._build_lock_response(ovr_candidate)

        # 5. Handle Disambiguation / Multiple Candidates
        if not candidates:
            # Fallback Anchor
            fallback = LocationCandidate(
                candidate_id="GEO-DEFAULT-GLOBAL",
                name=search_query.title(),
                context="Unresolved Spatial Coordinate",
                location_type="Macro Synthetic Cluster",
                confidence_score=0.4,
                latitude=9.0765,
                longitude=7.3986,
                country_code="NG"
            )
            return self._build_lock_response(fallback)

        unique_contexts = {c.context for c in candidates if c.context}
        if not has_explicit_context and len(candidates) > 1 and len(unique_contexts) > 1:
            return DisambiguationPayload(
                status="AMBIGUOUS_TARGET",
                original_prompt=original_prompt,
                extracted_entity=search_query,
                candidates=candidates
            )

        return self._build_lock_response(candidates[0])

    def _build_lock_response(self, candidate: LocationCandidate) -> TargetLockedPayload:
        # Replaced S2 with H3
        h3_token = self.get_h3_index(candidate.latitude, candidate.longitude, resolution=9)
        
        return TargetLockedPayload(
            status="TARGET_LOCKED",
            city_overview={
                "lat": candidate.latitude,
                "lon": candidate.longitude,
                "city_name": candidate.name.upper(),
                "full_context": candidate.context,
                "country_code": candidate.country_code,
                "h3_cell_id": h3_token,
                "currency_code": "USD",
                "formal_parity_ratio": 1.10
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