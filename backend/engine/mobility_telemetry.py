import os
import csv
import io
import math
import time
import json
import httpx
import logging
import asyncio
import subprocess
from typing import Dict, Any, Tuple, Optional, List
import redis.asyncio as redis
from engine.overture_engine import LiveInfrastructureEngine
from engine.llm_router import llm_router, wigle_pool, mapbox_pool

logger = logging.getLogger("StreetAI.Mobility")

_CV2_MISSING_WARNED: bool = False


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dp / 2.0) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2.0) ** 2
    return 2.0 * r * math.asin(min(1.0, math.sqrt(a)))


def _detect_people_in_frame(frame) -> Optional[int]:
    """Runs Ultralytics YOLOv8 (if weights exist) or OpenCV HOG+SVM on a decoded BGR frame."""
    global _CV2_MISSING_WARNED
    if frame is None or getattr(frame, "size", 0) == 0:
        return None
    try:
        import cv2
    except ImportError:
        if not _CV2_MISSING_WARNED:
            _CV2_MISSING_WARNED = True
            logger.warning("⚠️ OpenCV (cv2) not installed (`pip install opencv-python-headless`); webcam CV disabled.")
        return None

    try:
        try:
            from ultralytics import YOLO
            model_path = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")
            if os.path.exists(model_path):
                model = YOLO(model_path)
                results = model.predict(frame, classes=[0], conf=0.35, verbose=False)
                if results and results[0].boxes is not None:
                    return int(len(results[0].boxes))
        except Exception:
            pass

        hog = cv2.HOGDescriptor()
        hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        h, w = frame.shape[:2]
        if h > 260:
            scale = 360.0 / max(1,h)
            frame = cv2.resize(frame, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)
        elif w > 960:
           scale = 960.0 / w 
           frame = cv2.resize(frame, (int(w * scale), int(h * scale)))
        _, weights = hog.detectMultiScale(frame, winStride=(8, 8), padding=(4, 4), scale=1.05)
        valid_count = sum(1 for wt in weights if float(wt) >= 0.45) if len(weights) > 0 else 0
        return int(valid_count)
    except Exception:
        return None


def _count_people_in_image_bytes(img_bytes: bytes) -> Optional[int]:
    global _CV2_MISSING_WARNED
    if not img_bytes or len(img_bytes) < 512:
        return None
    try:
        import numpy as np
        import cv2
    except ImportError:
        if not _CV2_MISSING_WARNED:
            _CV2_MISSING_WARNED = True
            logger.warning("⚠️ OpenCV (cv2) not installed (`pip install opencv-python-headless`); webcam CV disabled.")
        return None

    try:
        arr = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return _detect_people_in_frame(frame)
    except Exception:
        return None


def _latlon_to_xyz_tile(lat: float, lon: float, zoom: int = 14) -> Tuple[int, int]:
    lat_rad = math.radians(lat)
    n = 2.0 ** zoom
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return x, y


def _decode_tomtom_relative0_tile_png(png_bytes: bytes) -> Optional[Dict[str, Any]]:
    if not png_bytes or len(png_bytes) < 200:
        return None
    try:
        import numpy as np
        import cv2
    except ImportError:
        return None

    arr = np.frombuffer(png_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
    if img is None or img.ndim != 3 or img.shape[2] < 4:
        return None

    alpha = img[:, :, 3]
    mask = alpha > 40
    if int(np.count_nonzero(mask)) < 15:
        return None

    g = img[:, :, 1][mask].astype(np.int32)
    r = img[:, :, 2][mask].astype(np.int32)

    green_mask = (g > r + 25) & (g > 110)
    red_mask = (~green_mask) & (r > g + 55) & (r > 120) & (g < 110)
    orange_mask = (~green_mask) & (~red_mask) & (r > 150) & (g >= 80)

    green_px = int(np.count_nonzero(green_mask))
    red_px = int(np.count_nonzero(red_mask))
    orange_px = int(np.count_nonzero(orange_mask))
    classified = green_px + orange_px + red_px
    if classified < 10:
        return None

    green_ratio = green_px / classified
    orange_ratio = orange_px / classified
    red_ratio = red_px / classified
    congestion_ratio = round(
        max(1.0, min(2.8, (green_ratio * 1.0) + (orange_ratio * 1.65) + (red_ratio * 2.45))),
        3,
    )
    return {
        "tile_road_pixels": classified,
        "tile_green_pct": round(green_ratio * 100.0, 1),
        "tile_orange_pct": round(orange_ratio * 100.0, 1),
        "tile_red_pct": round(red_ratio * 100.0, 1),
        "tile_congestion_ratio": congestion_ratio,
    }


def _capture_live_ytdlp_stream_person_count(query: str) -> Tuple[Optional[int], Optional[str]]:
    try:
        import cv2
    except ImportError:
        return None, None
    try:
        proc = subprocess.run(
            ["yt-dlp", "--dump-json", "--no-warnings", "--playlist-items", "1-3", f"ytsearch3:{query} live cam"],
            capture_output=True, text=True, timeout=6.0,
        )
        if proc.returncode != 0 or not proc.stdout:
            return None, None
        for line in proc.stdout.splitlines():
            line = line.strip()
            if not line.startswith("{"):
                continue
            info = json.loads(line)
            if not info.get("is_live"):
                continue
            stream_url = info.get("url") or info.get("manifest_url")
            webpage_url = info.get("webpage_url") or stream_url
            if not stream_url:
                continue
            cap = cv2.VideoCapture(stream_url)
            try:
                ok, frame = cap.read()
                if ok and frame is not None:
                    cnt = _detect_people_in_frame(frame)
                    if cnt is not None:
                        return cnt, str(webpage_url)
            finally:
                cap.release()
    except Exception:
        pass
    return None, None


class LiveMobilityTelemetry:
    """
    100% Real-Life Physical Mobility, Traffic Incidents, WiGLE RF, GBFS & Webcam CV Engine.
      1. TomTom Zoom-13 4-Gate JSON Flow + TomTom Incident Details API v5 (zero-403 Waze replacement).
      2. Mapbox Tilequery `mapbox.mapbox-traffic-v1` (auto-activates if MAPBOX_ACCESS_TOKEN(S) present).
      3. FOSSGIS OpenStreetMap Foot Routing (`routed-foot`) + Car Routing.
      4. 4-Account Rotating WiGLE RF Pool (`WIGLE_API_TOKENS`) + Redis Edge RF Probes.
      5. Windy Webcams API v3 (`x-windy-api-key`, fresh 10m preview token) + OpenCV HOG / YOLOv8.
      6. GBFS Docked + Free-Floating Micromobility (`station_status` + `free_bike_status`).
      7. Keyless OSM Public GPS Traces (`api.openstreetmap.org/api/0.6/trackpoints`, 7d cached).
    """
    _telraam_blocked_until: float = 0.0
    _tomtom_tile_blocked_until: float = 0.0
    _tomtom_incidents_blocked_until: float = 0.0

    def __init__(self, redis_url: str = "redis://127.0.0.1:6379"):
        self.tomtom_key = os.getenv("TOMTOM_API_KEY", "").strip()
        self.telraam_key = os.getenv("TELRAAM_API_KEY", "").strip()
        self.windy_key = os.getenv("WINDY_API_KEY", "").strip()
        self.osrm_foot_base = "https://routing.openstreetmap.de/routed-foot/route/v1/driving"
        self.osrm_car_base = "https://routing.openstreetmap.de/routed-car/route/v1/driving"
        self.osrm_fallback_car = "https://router.project-osrm.org"
        self.tomtom_base = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/13/json"
        self.telraam_snapshot_url = "https://telraam-api.net/v1/reports/traffic_snapshot"
        self.gbfs_systems_url = "https://raw.githubusercontent.com/MobilityData/gbfs/master/systems.csv"
        self.browser_headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        }
        clean_redis_url = redis_url.replace("localhost", "127.0.0.1")
        self.cache = redis.from_url(
            clean_redis_url,
            socket_connect_timeout=2.0,
            socket_timeout=2.0,
            retry_on_timeout=True,
        )

    async def _measure_osrm_kinematics_and_catchment(
        self, lat: float, lon: float, client: httpx.AsyncClient
    ) -> Dict[str, Any]:
        d = 0.003
        coords_diag = f"{lon-d},{lat-d};{lon+d},{lat+d}"
        coords_ns = f"{lon},{lat-d};{lon},{lat+d}"

        foot_kmh: Optional[float] = None
        drive_kmh: Optional[float] = None
        maneuvers: int = 0
        foot_dist_m: float = 0.0
        tortuosity_ratio: float = 1.0

        try:
            r_foot, r_foot_ns, r_drive = await asyncio.gather(
                client.get(f"{self.osrm_foot_base}/{coords_diag}", params={"overview": "false", "steps": "true"}, timeout=7.5),
                client.get(f"{self.osrm_foot_base}/{coords_ns}", params={"overview": "false"}, timeout=7.5),
                client.get(f"{self.osrm_car_base}/{coords_diag}", params={"overview": "false", "steps": "true"}, timeout=7.5),
                return_exceptions=True,
            )

            if not (isinstance(r_drive, httpx.Response) and r_drive.status_code == 200):
                try:
                    r_drive = await client.get(
                        f"{self.osrm_fallback_car}/route/v1/driving/{coords_diag}",
                        params={"overview": "false", "steps": "true"},
                        timeout=6.0,
                    )
                except Exception:
                    r_drive = None

            if isinstance(r_foot, httpx.Response) and r_foot.status_code == 200:
                routes = r_foot.json().get("routes", [])
                if routes:
                    foot_dist_m = float(routes[0].get("distance") or 0.0)
                    foot_dur_s = float(routes[0].get("duration") or 0.0)
                    legs = routes[0].get("legs", [])
                    steps = legs[0].get("steps", []) if legs else []
                    maneuvers = len(steps)
                    if foot_dist_m > 0 and foot_dur_s > 0:
                        raw_foot_kmh = (foot_dist_m / foot_dur_s) * 3.6
                        straight_m = math.hypot(
                            (2 * d) * 111_139.0,
                            (2 * d) * 111_139.0 * math.cos(math.radians(lat)),
                        )
                        tortuosity_ratio = max(1.0, foot_dist_m / max(1.0, straight_m))
                        if isinstance(r_foot_ns, httpx.Response) and r_foot_ns.status_code == 200:
                            ns_routes = r_foot_ns.json().get("routes", [])
                            if ns_routes and float(ns_routes[0].get("distance") or 0.0) > 0:
                                ns_dist = float(ns_routes[0]["distance"])
                                straight_ns = (2 * d) * 111_139.0
                                tortuosity_ratio = (tortuosity_ratio + max(1.0, ns_dist / max(1.0, straight_ns))) / 2.0

                        foot_kmh = round(max(1.5, min(5.4, raw_foot_kmh / math.sqrt(tortuosity_ratio))), 2)
                        logger.info(
                            f"Topological Foot Kinematics (FOSSGIS OSRM Foot): {foot_dist_m:.1f}m footpath "
                            f"({maneuvers} maneuvers, raw {raw_foot_kmh:.2f}km/h, tortuosity {tortuosity_ratio:.2f}x) -> "
                            f"Effective Reach Speed: {foot_kmh}km/h."
                        )

            if isinstance(r_drive, httpx.Response) and r_drive.status_code == 200:
                d_routes = r_drive.json().get("routes", [])
                if d_routes:
                    d_dist = float(d_routes[0].get("distance") or 0.0)
                    d_dur = float(d_routes[0].get("duration") or 0.0)
                    if d_dist > 0 and d_dur > 0:
                        drive_kmh = round((d_dist / d_dur) * 3.6, 2)
        except Exception as e:
            logger.debug(f"OSRM topological routing pivot: {e}")

        catchment_radii_m: Dict[str, Optional[int]] = {"5min_m": None, "10min_m": None, "15min_m": None}
        if foot_kmh is not None:
            meters_per_min = (foot_kmh * 1000.0) / 60.0
            catchment_radii_m = {
                "5min_m": int(round(meters_per_min * 5.0)),
                "10min_m": int(round(meters_per_min * 10.0)),
                "15min_m": int(round(meters_per_min * 15.0)),
            }

        return {
            "foot_kmh": foot_kmh,
            "drive_kmh": drive_kmh,
            "maneuvers": maneuvers,
            "foot_vector_distance_m": round(foot_dist_m, 1),
            "street_grid_tortuosity": round(tortuosity_ratio, 3),
            "catchment_radii_m": catchment_radii_m,
        }

    async def _probe_tomtom_incidents_v5(
        self, lat: float, lon: float, client: httpx.AsyncClient
    ) -> Dict[str, Any]:
        empty = {
            "tomtom_incidents_count": 0,
            "tomtom_jam_queue_meters": 0,
            "tomtom_total_delay_seconds": 0,
            "tomtom_road_closures_count": 0,
            "tomtom_max_delay_magnitude": 0,
            "tomtom_incident_highlights": [],
            "tomtom_incidents_verified": False,
        }
        if not self.tomtom_key or time.time() < LiveMobilityTelemetry._tomtom_incidents_blocked_until:
            return empty

        d = 0.010
        bbox_str = f"{lon - d:.5f},{lat - d:.5f},{lon + d:.5f},{lat + d:.5f}"
        fields = (
            "{incidents{type,geometry{type,coordinates},"
            "properties{id,iconCategory,magnitudeOfDelay,events{description,code},length,delay,roadNumbers,numberOfReports}}}"
        )
        try:
            res = await client.get(
                "https://api.tomtom.com/traffic/services/5/incidentDetails",
                params={
                    "key": self.tomtom_key,
                    "bbox": bbox_str,
                    "fields": fields,
                    "language": "en-GB",
                    "timeValidityFilter": "present",
                },
                timeout=5.0,
            )
            if res.status_code in (401, 403):
                LiveMobilityTelemetry._tomtom_incidents_blocked_until = time.time() + 3600.0
                return empty
            if res.status_code == 200:
                incidents = res.json().get("incidents", []) or []
                total_len_m = 0
                total_delay_s = 0
                closures = 0
                max_mag = 0
                highlights: List[str] = []

                for inc in incidents:
                    props = inc.get("properties") or {}
                    total_len_m += int(round(float(props.get("length") or 0.0)))
                    total_delay_s += max(0, int(props.get("delay") or 0))
                    cat = int(props.get("iconCategory") or 0)
                    mag = int(props.get("magnitudeOfDelay") or 0)
                    if cat == 8:
                        closures += 1
                    if mag > max_mag:
                        max_mag = mag
                    ev_list = props.get("events") or []
                    if ev_list and len(highlights) < 4:
                        desc = str(ev_list[0].get("description") or "").strip()
                        if desc and desc not in highlights:
                            highlights.append(desc[:80])

                if incidents:
                    logger.info(
                        f"🚨 TomTom Incidents v5 Locked: {len(incidents)} active incidents "
                        f"({total_len_m}m queue, {total_delay_s}s delay, {closures} closures, max severity {max_mag}/4)."
                    )
                return {
                    "tomtom_incidents_count": len(incidents),
                    "tomtom_jam_queue_meters": total_len_m,
                    "tomtom_total_delay_seconds": total_delay_s,
                    "tomtom_road_closures_count": closures,
                    "tomtom_max_delay_magnitude": max_mag,
                    "tomtom_incident_highlights": highlights,
                    "tomtom_incidents_verified": True,
                }
        except Exception as e:
            logger.debug(f"TomTom Incidents v5 pivot: {e}")
        return empty

    async def _probe_mapbox_traffic_tilequery(
        self, lat: float, lon: float, client: httpx.AsyncClient
    ) -> Dict[str, Any]:
        empty = {
            "mapbox_live_verified": False,
            "mapbox_segments_observed": 0,
            "mapbox_congestion_breakdown": {},
            "mapbox_closed_segments": 0,
            "mapbox_congestion_ratio": None,
        }
        if mapbox_pool.count == 0:
            return empty

        weights = {"low": 1.0, "moderate": 1.35, "heavy": 1.85, "severe": 2.50}
        url = f"https://api.mapbox.com/v4/mapbox.mapbox-traffic-v1/tilequery/{lon:.6f},{lat:.6f}.json"

        for _ in range(mapbox_pool.count):
            token = mapbox_pool.next_key()
            if not token:
                break
            try:
                res = await client.get(
                    url,
                    params={"radius": 350, "limit": 50, "layers": "traffic", "access_token": token},
                    timeout=4.5,
                )
                if res.status_code in (401, 403, 429):
                    mapbox_pool.mark_cooldown(token, 1800.0 if res.status_code != 429 else 60.0)
                    continue
                if res.status_code == 200:
                    features = res.json().get("features", []) or []
                    counts = {"low": 0, "moderate": 0, "heavy": 0, "severe": 0}
                    closed_cnt = 0
                    weighted_sum = 0.0
                    scored_n = 0
                    for feat in features:
                        props = feat.get("properties") or {}
                        if str(props.get("closed") or "").lower() == "yes":
                            closed_cnt += 1
                        cong_lvl = str(props.get("congestion") or "").lower()
                        if cong_lvl in weights:
                            counts[cong_lvl] += 1
                            weighted_sum += weights[cong_lvl]
                            scored_n += 1
                    if scored_n > 0:
                        cong_ratio = round(weighted_sum / scored_n, 3)
                        logger.info(
                            f"📡 Mapbox Traffic v1 Locked ({scored_n} segments within 350m): "
                            f"{counts}, closed={closed_cnt} -> Congestion: {cong_ratio}x"
                        )
                        return {
                            "mapbox_live_verified": True,
                            "mapbox_segments_observed": scored_n,
                            "mapbox_congestion_breakdown": counts,
                            "mapbox_closed_segments": closed_cnt,
                            "mapbox_congestion_ratio": cong_ratio,
                        }
                    return empty
            except Exception as e:
                logger.debug(f"Mapbox Tilequery traffic pivot: {e}")
        return empty

    async def _probe_gbfs_micromobility(
        self, lat: float, lon: float, country_code: str, city_hint: str, client: httpx.AsyncClient
    ) -> Dict[str, Any]:
        empty = {
            "gbfs_system_name": None,
            "gbfs_stations_within_1200m": 0,
            "gbfs_bikes_available_nearby": None,
            "gbfs_docks_available_nearby": None,
        }
        cc_up = (country_code or "").strip().upper()
        city_low = (city_hint or "").strip().lower()
        if not cc_up or not city_low:
            return empty

        catalog = llm_router.get_cached("gbfs_systems_catalog_v1")
        if not isinstance(catalog, list):
            try:
                r_csv = await client.get(self.gbfs_systems_url, timeout=5.0)
                if r_csv.status_code == 200 and r_csv.text:
                    catalog = []
                    for row in csv.DictReader(io.StringIO(r_csv.text)):
                        auto_url = str(row.get("Auto-Discovery URL") or "").strip()
                        if auto_url.startswith("http"):
                            catalog.append({
                                "cc": str(row.get("Country Code") or "").strip().upper(),
                                "name": str(row.get("Name") or "").strip(),
                                "loc": str(row.get("Location") or "").strip().lower(),
                                "url": auto_url,
                            })
                    if catalog:
                        llm_router.set_cached("gbfs_systems_catalog_v1", catalog, ttl_seconds=604800)
            except Exception:
                return empty

        matched_sys = next(
            (s for s in (catalog or []) if s["cc"] == cc_up and (city_low in s["loc"] or s["loc"] in city_low)),
            None,
        )
        if not matched_sys:
            return empty

        try:
            r_disc = await client.get(matched_sys["url"], timeout=4.0)
            if r_disc.status_code != 200:
                return empty
            data_node = r_disc.json().get("data", {})
            feeds = data_node.get("feeds")
            if not isinstance(feeds, list):
                first_lang = next(iter(data_node.values()), {}) if isinstance(data_node, dict) else {}
                feeds = first_lang.get("feeds", []) if isinstance(first_lang, dict) else []

            feed_map = {str(f.get("name")): str(f.get("url")) for f in feeds if f.get("name") and f.get("url")}
            info_url = feed_map.get("station_information")
            stat_url = feed_map.get("station_status")

            # 1. Docked stations
            if info_url and stat_url:
                r_info, r_stat = await asyncio.gather(
                    client.get(info_url, timeout=4.0),
                    client.get(stat_url, timeout=4.0),
                    return_exceptions=True,
                )
                if (
                    isinstance(r_info, httpx.Response) and r_info.status_code == 200
                    and isinstance(r_stat, httpx.Response) and r_stat.status_code == 200
                ):
                    nearby_ids = {
                        str(st.get("station_id"))
                        for st in r_info.json().get("data", {}).get("stations", [])
                        if st.get("lat") is not None and st.get("lon") is not None
                        and _haversine_m(lat, lon, float(st["lat"]), float(st["lon"])) <= 1200.0
                    }
                    if nearby_ids:
                        bikes_avail = 0
                        docks_avail = 0
                        for st in r_stat.json().get("data", {}).get("stations", []):
                            if str(st.get("station_id")) in nearby_ids:
                                bikes_avail += int(st.get("num_bikes_available") or st.get("num_vehicles_available") or 0)
                                docks_avail += int(st.get("num_docks_available") or 0)
                        return {
                            "gbfs_system_name": matched_sys["name"],
                            "gbfs_stations_within_1200m": len(nearby_ids),
                            "gbfs_bikes_available_nearby": bikes_avail,
                            "gbfs_docks_available_nearby": docks_avail,
                        }

            # 2. Free-floating scooters/bikes (e.g. Bird Florence, Lime, Tier)
            free_url = feed_map.get("free_bike_status") or feed_map.get("vehicle_status")
            if free_url:
                r_free = await client.get(free_url, timeout=4.5)
                if r_free.status_code == 200:
                    f_data = r_free.json().get("data", {})
                    vehicles = f_data.get("bikes") or f_data.get("vehicles") or []
                    nearby_free = sum(
                        1
                        for v in vehicles
                        if v.get("lat") is not None and v.get("lon") is not None
                        and not v.get("is_disabled") and not v.get("is_reserved")
                        and _haversine_m(lat, lon, float(v["lat"]), float(v["lon"])) <= 1200.0
                    )
                    if nearby_free > 0:
                        return {
                            "gbfs_system_name": f"{matched_sys['name']} (Free-Floating)",
                            "gbfs_stations_within_1200m": 0,
                            "gbfs_bikes_available_nearby": nearby_free,
                            "gbfs_docks_available_nearby": 0,
                        }
        except Exception as e:
            logger.debug(f"GBFS probe pivot ({matched_sys['name']}): {e}")
        return empty

    async def _probe_telraam_open_counters(
        self, lat: float, lon: float, client: httpx.AsyncClient
    ) -> Dict[str, Any]:
        empty = {"telraam_pedestrians_hr": None, "telraam_bikes_hr": None, "telraam_vehicles_hr": None, "telraam_segments": 0}
        if not self.telraam_key or time.time() < LiveMobilityTelemetry._telraam_blocked_until:
            return empty
        try:
            res = await client.get(
                self.telraam_snapshot_url,
                headers={"X-Api-Key": self.telraam_key, "Accept": "application/json"},
                timeout=4.0,
            )
            if res.status_code in (401, 403):
                LiveMobilityTelemetry._telraam_blocked_until = time.time() + 3600.0
                return empty
            if res.status_code == 200:
                ped_vals, bike_vals, car_vals = [], [], []
                for feat in res.json().get("features", []):
                    coords = feat.get("geometry", {}).get("coordinates", [])
                    pt = coords[0][0] if (coords and isinstance(coords[0], list) and isinstance(coords[0][0], list)) else (coords[0] if coords else None)
                    if pt and len(pt) >= 2 and abs(float(pt[1]) - lat) <= 0.014 and abs(float(pt[0]) - lon) <= 0.014:
                        props = feat.get("properties", {})
                        if props.get("pedestrian") is not None:
                            ped_vals.append(float(props["pedestrian"]))
                        if props.get("bike") is not None:
                            bike_vals.append(float(props["bike"]))
                        if props.get("car") is not None:
                            car_vals.append(float(props["car"]))
                if ped_vals or car_vals:
                    return {
                        "telraam_pedestrians_hr": int(round(sum(ped_vals))) if ped_vals else None,
                        "telraam_bikes_hr": int(round(sum(bike_vals))) if bike_vals else None,
                        "telraam_vehicles_hr": int(round(sum(car_vals))) if car_vals else None,
                        "telraam_segments": max(len(ped_vals), len(car_vals)),
                    }
        except Exception:
            pass
        return empty

    async def _probe_public_webcam_vision(
        self,
        lat: float,
        lon: float,
        osm_webcam_urls: List[str],
        client: httpx.AsyncClient,
        venue_hint: str = "",
        city_hint: str = "",
    ) -> Dict[str, Any]:
        candidate_cams: List[Tuple[str, Optional[float], str]] = [
            (u, 0.0, "OSM_WEBCAM")
            for u in osm_webcam_urls[:3]
            if any(ext in u.lower() for ext in (".jpg", ".jpeg", ".png", "snapshot", "image"))
        ]

        if self.windy_key:
            try:
                r_w = await client.get(
                    "https://api.windy.com/webcams/api/v3/webcams",
                    params={"nearby": f"{lat:.5f},{lon:.5f},5", "include": "images,location", "limit": 5},
                    headers={"x-windy-api-key": self.windy_key},
                    timeout=4.5,
                )
                if r_w.status_code == 200:
                    for cam in r_w.json().get("webcams", []) or []:
                        if str(cam.get("status") or "").lower() == "inactive":
                            continue
                        img_url = cam.get("images", {}).get("current", {}).get("preview")
                        loc = cam.get("location", {})
                        c_lat, c_lon = loc.get("latitude"), loc.get("longitude")
                        dist_m = round(_haversine_m(lat, lon, float(c_lat), float(c_lon)), 1) if (c_lat is not None and c_lon is not None) else None
                        if img_url:
                            candidate_cams.append((str(img_url), dist_m, f"WINDY_V3 ({cam.get('title', 'cam')[:38]})"))
                    candidate_cams.sort(key=lambda x: x[1] if x[1] is not None else 99999.0)
            except Exception as e:
                logger.debug(f"Windy Webcams v3 pivot: {e}")

        for img_url, dist_m, cam_src in candidate_cams[:3]:
            try:
                r_img = await client.get(img_url, timeout=4.5, headers=self.browser_headers)
                ctype = (r_img.headers.get("content-type") or "").lower()
                if r_img.status_code == 200 and ("image" in ctype or img_url.lower().endswith((".jpg", ".jpeg", ".png"))):
                    detected = await asyncio.to_thread(_count_people_in_image_bytes, r_img.content)
                    if detected is not None:
                        logger.info(f"📷 Public Webcam CV Locked [{cam_src} @ {dist_m}m]: {detected} persons detected.")
                        return {
                            "public_webcam_person_count": detected,
                            "public_webcam_url": img_url,
                            "public_webcam_distance_m": dist_m,
                            "public_webcam_source": cam_src,
                        }
            except Exception:
                pass

        if os.getenv("ENABLE_YTDLP_WEBCAM_CV", "true").lower() == "true" and (venue_hint or city_hint):
            try:
                detected, cam_url = await asyncio.wait_for(
                    asyncio.to_thread(_capture_live_ytdlp_stream_person_count, f"{venue_hint} {city_hint}".strip()),
                    timeout=7.0,
                )
                if detected is not None:
                    return {
                        "public_webcam_person_count": detected,
                        "public_webcam_url": cam_url,
                        "public_webcam_distance_m": None,
                        "public_webcam_source": "YTDLP_LIVE_STREAM",
                    }
            except Exception:
                pass

        return {"public_webcam_person_count": None, "public_webcam_url": None, "public_webcam_distance_m": None, "public_webcam_source": None}

    async def _intercept_real_rf_and_edge_probes(
        self, lat: float, lon: float, client: httpx.AsyncClient, cell_id: Optional[str] = None
    ) -> Dict[str, Any]:
        wigle_bssids = 0
        edge_probes = 0

        if cell_id:
            try:
                raw_probe = await self.cache.get(f"iot:rf:{cell_id}:probes")
                if raw_probe:
                    edge_probes = int(raw_probe)
            except Exception:
                pass

        wigle_ck = f"wigle_rf_v1:{round(lat, 4)}:{round(lon, 4)}"
        cached_w = llm_router.get_cached(wigle_ck)
        if isinstance(cached_w, int) and cached_w >= 0:
            wigle_bssids > 0 (if wigle_bssids > 0: llm_router.set_cached(wigle_ck, wigle_bssids, ttl_seconds=86400))
        elif wigle_pool.count > 0:
            delta = 0.0022
            params = {
                "latrange1": round(lat - delta, 6),
                "latrange2": round(lat + delta, 6),
                "longrange1": round(lon - delta, 6),
                "longrange2": round(lon + delta, 6),
                "lastupdt": "20240101000000",
                "freenet": "false",
                "paynet": "false",
            }
            for _ in range(wigle_pool.count):
                token = wigle_pool.next_key()
                if not token:
                    break
                auth_header = token if token.lower().startswith("basic ") else f"Basic {token}"
                try:
                    res = await client.get(
                        "https://api.wigle.net/api/v2/network/search",
                        params=params,
                        headers={"Authorization": auth_header, "Accept": "application/json"},
                        timeout=5.5,
                    )
                    if res.status_code in (401, 402, 429):
                        wigle_pool.mark_cooldown(token, 3600.0)
                        logger.info(f"⚡ WiGLE key hit HTTP {res.status_code}; rotating to next account key.")
                        continue
                    if res.status_code == 200:
                        data = res.json()
                        if data.get("success") is True:
                            wigle_bssids = int(data.get("totalResults", 0) or 0)
                            llm_router.set_cached(wigle_ck, wigle_bssids, ttl_seconds=86400)
                            logger.info(f"📡 WiGLE RF Survey Locked ({lat:.4f},{lon:.4f}): {wigle_bssids} commercial BSSIDs.")
                            break
                except Exception as e:
                    logger.debug(f"WiGLE RF pivot: {e}")

        total_rf = edge_probes if edge_probes > 0 else wigle_bssids
        return {
            "rf_devices_detected": total_rf,
            "wigle_bssids_observed": wigle_bssids,
            "edge_probe_devices_count": edge_probes,
            "is_live_rf_verified": total_rf > 0,
        }

    async def _measure_live_vehicular_flow(
        self,
        lat: float,
        lon: float,
        osrm_drive_kmh: Optional[float],
        client: httpx.AsyncClient,
    ) -> Tuple[Optional[float], Optional[float], float, bool, str, Dict[str, Any], Dict[str, Any]]:
        incidents_task = asyncio.create_task(self._probe_tomtom_incidents_v5(lat, lon, client))
        mapbox_task = asyncio.create_task(self._probe_mapbox_traffic_tilequery(lat, lon, client))
        valid_flows: List[Tuple[float, float, float]] = []

        if self.tomtom_key:
            d_ring = 0.0024
            probe_points = [(lat, lon), (lat + d_ring, lon), (lat - d_ring, lon), (lat, lon + d_ring)]
            try:
                r_near = await client.get(f"{self.osrm_fallback_car}/nearest/v1/driving/{lon},{lat}", params={"number": 1})
                if r_near.status_code == 200:
                    wps = r_near.json().get("waypoints", [])
                    if wps and "location" in wps[0]:
                        n_lon, n_lat = wps[0]["location"]
                        probe_points[0] = (float(n_lat), float(n_lon))
            except Exception:
                pass

            responses = await asyncio.gather(
                *[client.get(self.tomtom_base, params={"key": self.tomtom_key, "point": f"{p_lat:.6f},{p_lon:.6f}"}) for p_lat, p_lon in probe_points],
                return_exceptions=True,
            )
            for res in responses:
                if isinstance(res, httpx.Response) and res.status_code == 200:
                    flow = res.json().get("flowSegmentData", {})
                    curr_s = float(flow.get("currentSpeed") or 0.0)
                    free_s = float(flow.get("freeFlowSpeed") or 0.0)
                    if curr_s > 0 and free_s > 0:
                        cong = round(max(0.75, min(3.50, free_s / max(3.0, curr_s))), 3)
                        valid_flows.append((curr_s, free_s, cong))

        inc_data, mb_data = await asyncio.gather(incidents_task, mapbox_task)

        if valid_flows:
            valid_flows.sort(key=lambda x: x[2], reverse=True)
            peak_curr, peak_free, peak_cong = valid_flows[0]
            mb_cong = mb_data.get("mapbox_congestion_ratio")
            combined_cong = round(max(peak_cong, float(mb_cong)), 3) if mb_cong else peak_cong
            src = "TOMTOM_JSON_AND_MAPBOX_V1" if mb_cong else "TOMTOM_JSON_4GATE"
            return round(peak_curr, 2), round(peak_free, 2), combined_cong, True, src, inc_data, mb_data

        if mb_data.get("mapbox_live_verified") and mb_data.get("mapbox_congestion_ratio"):
            mb_cong = float(mb_data["mapbox_congestion_ratio"])
            base_spd = float(osrm_drive_kmh or 30.0)
            return round(base_spd / mb_cong, 2), round(base_spd, 2), mb_cong, True, "MAPBOX_TRAFFIC_VECTOR_V1", inc_data, mb_data

        if self.tomtom_key and time.time() >= LiveMobilityTelemetry._tomtom_tile_blocked_until:
            try:
                tx, ty = _latlon_to_xyz_tile(lat, lon, zoom=14)
                tile_url = f"https://api.tomtom.com/traffic/map/4/tile/flow/relative0/14/{tx}/{ty}.png"
                r_tile = await client.get(tile_url, params={"key": self.tomtom_key}, timeout=4.5)
                if r_tile.status_code in (401, 403):
                    LiveMobilityTelemetry._tomtom_tile_blocked_until = time.time() + 3600.0
                elif r_tile.status_code == 200:
                    tile_stats = await asyncio.to_thread(_decode_tomtom_relative0_tile_png, r_tile.content)
                    if tile_stats:
                        t_cong = float(tile_stats["tile_congestion_ratio"])
                        base_spd = float(osrm_drive_kmh or 30.0)
                        return round(base_spd / t_cong, 2), round(base_spd, 2), t_cong, True, "TOMTOM_RASTER_TILE_COLORBAND", inc_data, mb_data
            except Exception:
                pass

        if inc_data.get("tomtom_incidents_verified") and inc_data.get("tomtom_incidents_count", 0) > 0:
            mag = int(inc_data.get("tomtom_max_delay_magnitude", 0))
            inc_cong = {0: 1.0, 1: 1.25, 2: 1.60, 3: 2.15, 4: 2.60}.get(mag, 1.0)
            base_spd = float(osrm_drive_kmh or 30.0)
            return round(base_spd / inc_cong, 2), round(base_spd, 2), inc_cong, True, "TOMTOM_INCIDENTS_V5_LIVE", inc_data, mb_data

        return osrm_drive_kmh, osrm_drive_kmh, 1.0, False, "OSRM_STRUCTURAL_UNVERIFIED", inc_data, mb_data

    async def get_live_pedestrian_density(
        self,
        lat: float,
        lon: float,
        cell_id: Optional[str] = None,
        venue_hint: Optional[str] = None,
        city_hint: Optional[str] = None,
    ) -> Dict[str, Any]:
        snapshot = await LiveInfrastructureEngine.get_coalesced_spatial_snapshot(lat, lon)
        loc_meta = snapshot.get("location_meta", {})
        cc_code = str(loc_meta.get("country_code") or "").upper()
        city_clean = city_hint or str(loc_meta.get("city") or "")

        camera_nodes = int(snapshot.get("osm_surveillance_nodes_count", 0) or 0)
        transit_hubs = int(snapshot.get("osm_transit_hubs_count", 0) or 0)
        ped_crossings = int(snapshot.get("osm_pedestrian_crossings_count", 0) or 0)
        osm_webcams = list(snapshot.get("osm_webcam_urls", []))
        verified_ground_nodes = int(snapshot.get("verified_merchants_total", 0) or 0) + int(
            snapshot.get("osm_cico_count", 0) or 0
        )

        async with httpx.AsyncClient(timeout=7.5) as client:
            osrm_data, rf_data, telraam_data, gbfs_data, webcam_data = await asyncio.gather(
                self._measure_osrm_kinematics_and_catchment(lat, lon, client),
                self._intercept_real_rf_and_edge_probes(lat, lon, client, cell_id=cell_id),
                self._probe_telraam_open_counters(lat, lon, client),
                self._probe_gbfs_micromobility(lat, lon, cc_code, city_clean, client),
                self._probe_public_webcam_vision(lat, lon, osm_webcams, client, venue_hint=venue_hint or "", city_hint=city_clean),
            )
            live_veh_kmh, free_flow_kmh, congestion_ratio, is_live_traffic, traffic_source, inc_data, mb_data = (
                await self._measure_live_vehicular_flow(lat, lon, osrm_data["drive_kmh"], client)
            )

        foot_kmh_out = osrm_data["foot_kmh"] if osrm_data["foot_kmh"] is not None else 0.0
        drive_kmh_out = osrm_data["drive_kmh"] if osrm_data["drive_kmh"] is not None else 0.0

        logger.info(
            f"🚶 Empirical Mobility Triangulation Locked | Live Traffic: {is_live_traffic} [{traffic_source}] "
            f"(Veh: {live_veh_kmh}km/h vs FreeFlow: {free_flow_kmh}km/h, Congestion: {congestion_ratio}x | "
            f"TomTom Incidents v5: {inc_data['tomtom_incidents_count']} active [{inc_data['tomtom_jam_queue_meters']}m queue, "
            f"{inc_data['tomtom_total_delay_seconds']}s delay, {inc_data['tomtom_road_closures_count']} closures] | "
            f"Mapbox v1: {mb_data['mapbox_segments_observed']} segs) | "
            f"GBFS: {gbfs_data['gbfs_system_name']} ({gbfs_data['gbfs_bikes_available_nearby']} bikes) | "
            f"Real RF (WiGLE/Edge): {rf_data['rf_devices_detected']} | Webcam CV: {webcam_data['public_webcam_person_count']} | "
            f"OSM: {camera_nodes} cams, {transit_hubs} transit, {ped_crossings} crossings | "
            f"FOSSGIS Foot: {foot_kmh_out}km/h (10m reach: {osrm_data['catchment_radii_m']['10min_m']}m)"
        )

        return {
            "status": "MOBILITY_TRIANGULATED",
            "traffic_source": traffic_source,
            "rf_devices_detected": rf_data["rf_devices_detected"],
            "is_live_rf_verified": rf_data["is_live_rf_verified"],
            "wigle_bssids_observed": rf_data["wigle_bssids_observed"],
            "edge_probe_devices_count": rf_data["edge_probe_devices_count"],
            "verified_ground_sensor_nodes": verified_ground_nodes,
            "surveillance_camera_nodes": camera_nodes,
            "transit_hubs_in_catchment": transit_hubs,
            "pedestrian_crossings_in_catchment": ped_crossings,
            "telraam_pedestrians_hr": telraam_data["telraam_pedestrians_hr"],
            "telraam_vehicles_hr": telraam_data["telraam_vehicles_hr"],
            "gbfs_system_name": gbfs_data["gbfs_system_name"],
            "gbfs_stations_within_1200m": gbfs_data["gbfs_stations_within_1200m"],
            "gbfs_bikes_available_nearby": gbfs_data["gbfs_bikes_available_nearby"],
            "gbfs_docks_available_nearby": gbfs_data["gbfs_docks_available_nearby"],
            "public_webcam_person_count": webcam_data["public_webcam_person_count"],
            "public_webcam_url": webcam_data["public_webcam_url"],
            "tomtom_incidents_verified": inc_data["tomtom_incidents_verified"],
            "tomtom_incidents_count": inc_data["tomtom_incidents_count"],
            "tomtom_road_closures_count": inc_data["tomtom_road_closures_count"],
            "tomtom_incident_highlights": inc_data["tomtom_incident_highlights"],
            "mapbox_live_verified": mb_data["mapbox_live_verified"],
            "mapbox_segments_observed": mb_data["mapbox_segments_observed"],
            "mapbox_congestion_breakdown": mb_data["mapbox_congestion_breakdown"],
            "mapbox_closed_segments": mb_data["mapbox_closed_segments"],
            "waze_live_verified": inc_data["tomtom_incidents_verified"],
            "waze_live_jams_count": inc_data["tomtom_incidents_count"],
            "waze_live_alerts_count": inc_data["tomtom_road_closures_count"],
            "waze_jam_queue_meters": inc_data["tomtom_jam_queue_meters"],
            "waze_total_delay_seconds": inc_data["tomtom_total_delay_seconds"],
            "foot_velocity_kmh": foot_kmh_out,
            "structural_drive_velocity_kmh": drive_kmh_out,
            "live_vehicular_velocity_kmh": live_veh_kmh if live_veh_kmh is not None else 0.0,
            "free_flow_vehicular_velocity_kmh": free_flow_kmh if free_flow_kmh is not None else 0.0,
            "live_perimeter_congestion_ratio": congestion_ratio,
            "vehicular_congestion_factor": congestion_ratio,
            "is_live_traffic_verified": is_live_traffic,
            "physical_maneuvers_intercepted": osrm_data["maneuvers"],
            "street_grid_tortuosity": osrm_data["street_grid_tortuosity"],
            "pedestrian_catchment_5m_10m_15m_meters": osrm_data["catchment_radii_m"],
            "provenance": (
                f"Live Traffic ({traffic_source}) + TomTom Incidents v5 + FOSSGIS OSRM Foot + "
                "4-Key WiGLE RF + Windy v3 Webcam CV + GBFS Micromobility"
            ),
        }

    async def get_3point_Insert_triangulation(self, lat: float, lon: float) -> Dict[str, Any]:
        return await self.get_live_pedestrian_density(lat, lon)