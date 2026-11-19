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
from engine.llm_router import llm_router

logger = logging.getLogger("StreetAI.Mobility")


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dp / 2.0) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2.0) ** 2
    return 2.0 * r * math.asin(min(1.0, math.sqrt(a)))


def _detect_people_in_frame(frame) -> Optional[int]:
    """Runs Ultralytics YOLOv8 (if weights exist) or built-in OpenCV HOG+SVM on a decoded BGR frame."""
    if frame is None or getattr(frame, "size", 0) == 0:
        return None
    try:
        import cv2
    except ImportError:
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
        if w > 960:
            scale = 960.0 / w
            frame = cv2.resize(frame, (int(w * scale), int(h * scale)))
        _, weights = hog.detectMultiScale(frame, winStride=(8, 8), padding=(4, 4), scale=1.05)
        valid_count = sum(1 for wt in weights if float(wt) >= 0.45) if len(weights) > 0 else 0
        return int(valid_count)
    except Exception:
        return None


def _latlon_to_xyz_tile(lat: float, lon: float, zoom: int = 14) -> Tuple[int, int]:
    """Converts WGS84 (lat, lon) to Slippy Map XYZ tile coordinates."""
    lat_rad = math.radians(lat)
    n = 2.0 ** zoom
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return x, y


def _decode_tomtom_relative0_tile_png(png_bytes: bytes) -> Optional[Dict[str, Any]]:
    """
    Decodes a live TomTom Traffic Flow Raster Tile (`style=relative0`, transparent PNG)
    strictly by disjoint road-pixel RGB color bands (Zero Simulation):
      - Green pixels (free flow >= 75% speed): congestion weight 1.0x
      - Yellow/Orange pixels (moderate 35-75% speed): congestion weight 1.65x
      - Red / Dark-Red pixels (heavy jam < 35% speed): congestion weight 2.45x
    Returns None if OpenCV/NumPy unavailable or the tile contains < 15 traffic road pixels.
    """
    if not png_bytes or len(png_bytes) < 200:
        return None
    try:
        import numpy as np
        import cv2
    except ImportError:
        return None

    arr = np.frombuffer(png_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)  # BGRA
    if img is None or img.ndim != 3 or img.shape[2] < 4:
        return None

    alpha = img[:, :, 3]
    mask = alpha > 40
    road_pixels = int(np.count_nonzero(mask))
    if road_pixels < 15:
        return None

    g = img[:, :, 1][mask].astype(np.int32)
    r = img[:, :, 2][mask].astype(np.int32)

    # Strictly disjoint color masks so green + orange + red never double-count pixels
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


def _count_people_in_image_bytes(img_bytes: bytes) -> Optional[int]:
    if not img_bytes or len(img_bytes) < 1024:
        return None
    try:
        import numpy as np
        import cv2
        arr = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return _detect_people_in_frame(frame)
    except Exception:
        return None


def _capture_live_ytdlp_stream_person_count(query: str) -> Tuple[Optional[int], Optional[str]]:
    """
    Uses `yt-dlp` (if installed) to locate a live public webcam stream for the target landmark/city,
    extracts a single live frame via OpenCV, and counts detected people. Returns (None, None) if absent.
    """
    try:
        import cv2
    except ImportError:
        return None, None

    try:
        proc = subprocess.run(
            [
                "yt-dlp",
                "--dump-json",
                "--no-warnings",
                "--playlist-items", "1-3",
                f"ytsearch3:{query} live cam",
            ],
            capture_output=True,
            text=True,
            timeout=6.0,
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


def _waze_env_for_coords(lat: float, lon: float) -> str:
    if 29.4 <= lat <= 33.5 and 34.2 <= lon <= 35.9:
        return "il"
    if lon <= -30.0 and lat >= 12.0:
        return "na"
    return "row"


def _fetch_waze_georss_browser_impersonated(lat: float, lon: float, d: float = 0.012) -> Dict[str, Any]:
    """
    Queries Waze Live Map GeoRSS using `curl_cffi` Chrome TLS/JA3/HTTP2 impersonation + warmed
    session cookies. Supports optional `WAZE_PROXY_URL` env var if the host ISP IP is WAF-blocked.
    """
    env_code = _waze_env_for_coords(lat, lon)
    params = {
        "top": round(lat + d, 5),
        "bottom": round(lat - d, 5),
        "left": round(lon - d, 5),
        "right": round(lon + d, 5),
        "env": env_code,
        "types": "alerts,traffic",
    }
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.waze.com/live-map",
        "Origin": "https://www.waze.com",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "X-Requested-With": "XMLHttpRequest",
    }
    proxy_url = os.getenv("WAZE_PROXY_URL", "").strip()
    proxies = {"http": proxy_url, "https": proxy_url} if proxy_url else None

    try:
        from curl_cffi import requests as cffi_requests

        with cffi_requests.Session(impersonate="chrome") as s:
            if proxies:
                s.proxies = proxies
            s.get("https://www.waze.com/live-map", timeout=4.0)
            res = s.get(
                "https://www.waze.com/live-map/api/georss",
                params=params,
                headers=headers,
                timeout=5.0,
            )
            if res.status_code == 200:
                return {"status_code": 200, "data": res.json(), "transport": "curl_cffi_chrome"}
            return {"status_code": res.status_code, "data": None, "transport": "curl_cffi_chrome"}
    except ImportError:
        logger.debug("curl_cffi not installed; falling back to httpx warmed session for Waze.")
    except Exception as e:
        logger.debug(f"Waze curl_cffi probe pivot: {e}")

    try:
        full_headers = {
            **headers,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        }
        with httpx.Client(timeout=5.0, follow_redirects=True, http2=False, proxy=proxy_url or None) as c:
            c.get("https://www.waze.com/live-map", headers={"User-Agent": full_headers["User-Agent"]})
            res = c.get("https://www.waze.com/live-map/api/georss", params=params, headers=full_headers)
            if res.status_code == 200:
                return {"status_code": 200, "data": res.json(), "transport": "httpx_warmed"}
            return {"status_code": res.status_code, "data": None, "transport": "httpx_warmed"}
    except Exception as e:
        logger.debug(f"Waze httpx fallback pivot: {e}")

    return {"status_code": 0, "data": None, "transport": "none"}


class LiveMobilityTelemetry:
    """
    100% Real-Life Physical Mobility, Traffic Tile Decoder, Waze, GBFS & Camera CV Engine.
    Triangulates 8 zero-hardware real telemetry sources:
      1. TomTom Zoom-13 4-Gate JSON Flow (live arterial currentSpeed vs freeFlowSpeed).
      2. TomTom Traffic Flow Raster Tile Color-Band Decoder (`relative0` PNG via OpenCV/NumPy) —
         recovers real live GPS road congestion in emerging cities where JSON flow returns 400!
      3. Waze Live GeoRSS (`curl_cffi` Chrome TLS + 10-min 403 WAF circuit breaker).
      4. FOSSGIS OpenStreetMap Foot Routing (`routed-foot`) + Car Routing.
      5. GBFS Open Micromobility (`MobilityData/gbfs` `systems.csv`) — live nearby bikes/docks.
      6. Telraam Open Traffic/Pedestrian Counters (`telraam-api.net`).
      7. Public OSM/Windy/YouTube-Live (`yt-dlp`) Webcam Computer Vision (`OpenCV HOG / YOLOv8`).
      8. Coalesced Overture/OSM Cameras/Transit/Crossings + WiGLE / Redis Edge RF Probes.
    """
    _waze_blocked_until: float = 0.0

    def __init__(self, redis_url: str = "redis://127.0.0.1:6379"):
        self.tomtom_key = os.getenv("TOMTOM_API_KEY", "").strip()
        self.wigle_api_token = os.getenv("WIGLE_API_TOKEN", "").strip()
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

    async def _probe_waze_live_jams_and_alerts(self, lat: float, lon: float) -> Dict[str, Any]:
        """Executes browser-impersonated Waze Live GeoRSS fetch with a 10-minute 403 WAF circuit breaker."""
        empty_blocked = {
            "waze_jams_count": 0,
            "waze_alerts_count": 0,
            "waze_jam_queue_meters": 0,
            "waze_total_delay_seconds": 0,
            "waze_avg_speed_kmh": None,
            "waze_congestion_ratio": None,
            "waze_live_verified": False,
            "waze_http_status": 403,
        }
        # Check circuit breaker BEFORE making any network call
        if time.time() < LiveMobilityTelemetry._waze_blocked_until:
            return empty_blocked

        raw_res = await asyncio.to_thread(_fetch_waze_georss_browser_impersonated, lat, lon, 0.012)
        status = int(raw_res.get("status_code", 0) or 0)
        data = raw_res.get("data")
        transport = raw_res.get("transport", "none")

        if status == 403:
            LiveMobilityTelemetry._waze_blocked_until = time.time() + 600.0
            logger.info("🛡️ Waze WAF returned 403 on host IP; activating 10-min circuit breaker.")
            return empty_blocked

        if status == 200 and isinstance(data, dict):
            jams = data.get("jams", []) or []
            alerts = data.get("alerts", []) or []
            total_jam_len_m = sum(int(j.get("length", 0) or 0) for j in jams)
            total_delay_s = sum(max(0, int(j.get("delay", 0) or 0)) for j in jams)
            valid_speeds = [
                float(j["speedKMH"])
                for j in jams
                if isinstance(j.get("speedKMH"), (int, float)) and float(j["speedKMH"]) > 0
            ]
            avg_jam_kmh = round(sum(valid_speeds) / len(valid_speeds), 2) if valid_speeds else None

            travel_ratios: List[float] = []
            for j in jams:
                j_len = float(j.get("length") or 0.0)
                j_spd = float(j.get("speedKMH") or 0.0)
                j_del = max(0.0, float(j.get("delay") or 0.0))
                if j_len > 20.0 and j_spd > 0.5:
                    actual_t = j_len / (j_spd / 3.6)
                    free_t = max(1.0, actual_t - j_del)
                    travel_ratios.append(min(3.5, actual_t / free_t))
            measured_cong = round(sum(travel_ratios) / len(travel_ratios), 3) if travel_ratios else None

            logger.info(
                f"🚗 Waze Live GeoRSS Unlocked ({transport}): {len(jams)} jams ({total_jam_len_m}m queue, "
                f"{total_delay_s}s delay), {len(alerts)} live alerts."
            )
            return {
                "waze_jams_count": len(jams),
                "waze_alerts_count": len(alerts),
                "waze_jam_queue_meters": total_jam_len_m,
                "waze_total_delay_seconds": total_delay_s,
                "waze_avg_speed_kmh": avg_jam_kmh,
                "waze_congestion_ratio": measured_cong,
                "waze_live_verified": True,
                "waze_http_status": 200,
            }

        logger.debug(f"Waze Live GeoRSS unavailable (HTTP {status} via {transport}).")
        return {
            **empty_blocked,
            "waze_http_status": status,
        }

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
                    reader = csv.DictReader(io.StringIO(r_csv.text))
                    for row in reader:
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
            except Exception as e:
                logger.debug(f"GBFS catalog fetch pivot: {e}")
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
            if not (info_url and stat_url):
                return empty

            r_info, r_stat = await asyncio.gather(
                client.get(info_url, timeout=4.0),
                client.get(stat_url, timeout=4.0),
                return_exceptions=True,
            )
            if not (isinstance(r_info, httpx.Response) and r_info.status_code == 200):
                return empty
            if not (isinstance(r_stat, httpx.Response) and r_stat.status_code == 200):
                return empty

            nearby_ids = set()
            for st in r_info.json().get("data", {}).get("stations", []):
                s_lat, s_lon = st.get("lat"), st.get("lon")
                if s_lat is not None and s_lon is not None:
                    if _haversine_m(lat, lon, float(s_lat), float(s_lon)) <= 1200.0:
                        nearby_ids.add(str(st.get("station_id")))

            if not nearby_ids:
                return empty

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
        except Exception as e:
            logger.debug(f"GBFS live station probe pivot ({matched_sys['name']}): {e}")
            return empty

    async def _probe_telraam_open_counters(
        self, lat: float, lon: float, client: httpx.AsyncClient
    ) -> Dict[str, Any]:
        if not self.telraam_key:
            return {"telraam_pedestrians_hr": None, "telraam_bikes_hr": None, "telraam_vehicles_hr": None, "telraam_segments": 0}
        try:
            headers = {"X-Api-Key": self.telraam_key, "Accept": "application/json"}
            res = await client.get(self.telraam_snapshot_url, headers=headers, timeout=4.0)
            if res.status_code == 200:
                features = res.json().get("features", [])
                ped_vals, bike_vals, car_vals = [], [], []
                for feat in features:
                    geom = feat.get("geometry", {})
                    coords = geom.get("coordinates", [])
                    pt = None
                    if coords and isinstance(coords[0], list):
                        pt = coords[0][0] if isinstance(coords[0][0], list) else coords[0]
                    if pt and len(pt) >= 2:
                        s_lon, s_lat = float(pt[0]), float(pt[1])
                        if abs(s_lat - lat) <= 0.014 and abs(s_lon - lon) <= 0.014:
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
        except Exception as e:
            logger.debug(f"Telraam open counter pivot: {e}")
        return {"telraam_pedestrians_hr": None, "telraam_bikes_hr": None, "telraam_vehicles_hr": None, "telraam_segments": 0}

    async def _probe_public_webcam_vision(
        self,
        lat: float,
        lon: float,
        osm_webcam_urls: List[str],
        client: httpx.AsyncClient,
        venue_hint: str = "",
        city_hint: str = "",
    ) -> Dict[str, Any]:
        candidate_img_urls: List[str] = [
            u for u in osm_webcam_urls[:3]
            if any(ext in u.lower() for ext in (".jpg", ".jpeg", ".png", "snapshot", "image"))
        ]

        if self.windy_key and not candidate_img_urls:
            try:
                r_w = await client.get(
                    "https://api.windy.com/webcams/api/v3/webcams",
                    params={"nearby": f"{lat},{lon},2", "include": "images", "limit": 3},
                    headers={"x-windy-api-key": self.windy_key},
                    timeout=3.5,
                )
                if r_w.status_code == 200:
                    for cam in r_w.json().get("webcams", []):
                        img_url = cam.get("images", {}).get("current", {}).get("preview")
                        if img_url:
                            candidate_img_urls.append(str(img_url))
            except Exception:
                pass

        for img_url in candidate_img_urls[:2]:
            try:
                r_img = await client.get(img_url, timeout=3.5, headers=self.browser_headers)
                ctype = (r_img.headers.get("content-type") or "").lower()
                if r_img.status_code == 200 and "image" in ctype:
                    detected = await asyncio.to_thread(_count_people_in_image_bytes, r_img.content)
                    if detected is not None:
                        return {"public_webcam_person_count": detected, "public_webcam_url": img_url}
            except Exception:
                pass

        if os.getenv("ENABLE_YTDLP_WEBCAM_CV", "true").lower() == "true" and (venue_hint or city_hint):
            q_cam = f"{venue_hint} {city_hint}".strip()
            try:
                detected, cam_url = await asyncio.wait_for(
                    asyncio.to_thread(_capture_live_ytdlp_stream_person_count, q_cam),
                    timeout=7.0,
                )
                if detected is not None:
                    return {"public_webcam_person_count": detected, "public_webcam_url": cam_url}
            except Exception:
                pass

        return {"public_webcam_person_count": None, "public_webcam_url": None}

    async def _measure_live_vehicular_flow(
        self,
        lat: float,
        lon: float,
        osrm_drive_kmh: Optional[float],
        client: httpx.AsyncClient,
    ) -> Tuple[Optional[float], Optional[float], float, bool, str, Dict[str, Any]]:
        """
        3-Tier Live Traffic Flow Triangulation:
          Tier 1: TomTom Zoom-13 4-Gate JSON Speed API
          Tier 2: TomTom Live Raster Traffic Tile Color-Band Decoder (`relative0` PNG via OpenCV/NumPy)
                  — activates automatically in emerging markets (e.g. Lagos, Addis Ababa) where JSON returns 400!
          Tier 3: Waze Live GeoRSS Speed & Delay telemetry
        """
        waze_task = asyncio.create_task(self._probe_waze_live_jams_and_alerts(lat, lon))
        valid_flows: List[Tuple[float, float, float]] = []

        if self.tomtom_key:
            d_ring = 0.0024
            probe_points = [
                (lat, lon),
                (lat + d_ring, lon),
                (lat - d_ring, lon),
                (lat, lon + d_ring),
            ]
            try:
                r_near = await client.get(
                    f"{self.osrm_fallback_car}/nearest/v1/driving/{lon},{lat}", params={"number": 1}
                )
                if r_near.status_code == 200:
                    wps = r_near.json().get("waypoints", [])
                    if wps and "location" in wps[0]:
                        n_lon, n_lat = wps[0]["location"]
                        probe_points[0] = (float(n_lat), float(n_lon))
            except Exception:
                pass

            tasks = [
                client.get(
                    self.tomtom_base,
                    params={"key": self.tomtom_key, "point": f"{p_lat:.6f},{p_lon:.6f}"},
                )
                for p_lat, p_lon in probe_points
            ]
            responses = await asyncio.gather(*tasks, return_exceptions=True)

            for res in responses:
                if isinstance(res, httpx.Response) and res.status_code == 200:
                    flow = res.json().get("flowSegmentData", {})
                    curr_s = float(flow.get("currentSpeed") or 0.0)
                    free_s = float(flow.get("freeFlowSpeed") or 0.0)
                    if curr_s > 0 and free_s > 0:
                        cong = round(max(0.75, min(3.50, free_s / max(3.0, curr_s))), 3)
                        valid_flows.append((curr_s, free_s, cong))

        waze_data = await waze_task

        # Tier 1: TomTom JSON Flow (+ Waze fusion if live)
        if valid_flows:
            valid_flows.sort(key=lambda x: x[2], reverse=True)
            peak_curr, peak_free, peak_cong = valid_flows[0]
            waze_cong = waze_data.get("waze_congestion_ratio")
            combined_cong = round(max(peak_cong, float(waze_cong)), 3) if waze_cong else peak_cong
            src = "TOMTOM_JSON_AND_WAZE" if waze_cong else "TOMTOM_JSON_4GATE"
            return round(peak_curr, 2), round(peak_free, 2), combined_cong, True, src, waze_data

        # Tier 2: TomTom Live Traffic Raster Tile Color-Band Decoder (Lagos / Addis Ababa / emerging cities)
        if self.tomtom_key:
            try:
                tx, ty = _latlon_to_xyz_tile(lat, lon, zoom=14)
                tile_url = f"https://api.tomtom.com/traffic/map/4/tile/flow/relative0/14/{tx}/{ty}.png"
                r_tile = await client.get(tile_url, params={"key": self.tomtom_key}, timeout=4.5)
                if r_tile.status_code == 200:
                    tile_stats = await asyncio.to_thread(_decode_tomtom_relative0_tile_png, r_tile.content)
                    if tile_stats:
                        t_cong = float(tile_stats["tile_congestion_ratio"])
                        waze_cong = waze_data.get("waze_congestion_ratio")
                        final_cong = round(max(t_cong, float(waze_cong)), 3) if waze_cong else t_cong
                        base_spd = float(osrm_drive_kmh or 30.0)
                        est_curr = round(base_spd / final_cong, 2)
                        logger.info(
                            f"🗺️ TomTom Raster Traffic Tile Decoded (z14/{tx}/{ty}): "
                            f"{tile_stats['tile_road_pixels']} road px (Green {tile_stats['tile_green_pct']}% | "
                            f"Orange {tile_stats['tile_orange_pct']}% | Red {tile_stats['tile_red_pct']}%) -> "
                            f"Congestion: {final_cong}x"
                        )
                        return est_curr, round(base_spd, 2), final_cong, True, "TOMTOM_RASTER_TILE_COLORBAND", waze_data
            except Exception as e:
                logger.debug(f"TomTom raster traffic tile decode pivot: {e}")

        # Tier 3: Waze Live GeoRSS alone
        if waze_data["waze_live_verified"] and waze_data["waze_avg_speed_kmh"] is not None:
            w_curr = float(waze_data["waze_avg_speed_kmh"])
            w_cong = float(waze_data["waze_congestion_ratio"] or 1.0)
            w_free = round(w_curr * w_cong, 2)
            return round(w_curr, 2), w_free, round(w_cong, 3), True, "WAZE_GEORSS_LIVE", waze_data

        return osrm_drive_kmh, osrm_drive_kmh, 1.0, False, "OSRM_STRUCTURAL_UNVERIFIED", waze_data

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

        if self.wigle_api_token and not getattr(LiveInfrastructureEngine, "_wigle_exhausted", False):
            delta = 0.002
            params = {
                "latrange1": lat - delta,
                "latrange2": lat + delta,
                "longrange1": lon - delta,
                "longrange2": lon + delta,
                "lastupdt": "20240101000000",
                "freenet": "false",
                "paynet": "false",
            }
            headers = {"Authorization": f"Basic {self.wigle_api_token}", "Accept": "application/json"}
            try:
                res = await client.get("https://api.wigle.net/api/v2/network/search", params=params, headers=headers)
                if res.status_code in (401, 402, 429):
                    LiveInfrastructureEngine._wigle_exhausted = True
                elif res.status_code == 200:
                    data = res.json()
                    if data.get("success") is True:
                        wigle_bssids = int(data.get("totalResults", 0) or 0)
            except Exception:
                pass

        total_rf = edge_probes if edge_probes > 0 else wigle_bssids
        return {
            "rf_devices_detected": total_rf,
            "wigle_bssids_observed": wigle_bssids,
            "edge_probe_devices_count": edge_probes,
            "is_live_rf_verified": total_rf > 0,
        }

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
                self._probe_public_webcam_vision(
                    lat, lon, osm_webcams, client, venue_hint=venue_hint or "", city_hint=city_clean
                ),
            )
            live_veh_kmh, free_flow_kmh, congestion_ratio, is_live_traffic, traffic_source, waze_data = (
                await self._measure_live_vehicular_flow(lat, lon, osrm_data["drive_kmh"], client)
            )

        foot_kmh_out = osrm_data["foot_kmh"] if osrm_data["foot_kmh"] is not None else 0.0
        drive_kmh_out = osrm_data["drive_kmh"] if osrm_data["drive_kmh"] is not None else 0.0

        logger.info(
            f"🚶 Empirical Mobility Triangulation Locked | Live Traffic: {is_live_traffic} [{traffic_source}] "
            f"(Veh: {live_veh_kmh}km/h vs FreeFlow: {free_flow_kmh}km/h, Congestion: {congestion_ratio}x | "
            f"Waze Live={waze_data['waze_live_verified']} [HTTP {waze_data['waze_http_status']}]: "
            f"{waze_data['waze_jams_count']} jams [{waze_data['waze_jam_queue_meters']}m queue, {waze_data['waze_total_delay_seconds']}s delay], "
            f"{waze_data['waze_alerts_count']} alerts) | "
            f"GBFS: {gbfs_data['gbfs_system_name']} ({gbfs_data['gbfs_bikes_available_nearby']} bikes @ {gbfs_data['gbfs_stations_within_1200m']} stations) | "
            f"Real RF: {rf_data['rf_devices_detected']} | Telraam: {telraam_data['telraam_pedestrians_hr']} | "
            f"Webcam CV: {webcam_data['public_webcam_person_count']} | "
            f"OSM: {camera_nodes} cameras, {transit_hubs} transit stops, {ped_crossings} crossings | "
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
            "waze_live_verified": waze_data["waze_live_verified"],
            "waze_http_status": waze_data["waze_http_status"],
            "waze_live_jams_count": waze_data["waze_jams_count"],
            "waze_live_alerts_count": waze_data["waze_alerts_count"],
            "waze_jam_queue_meters": waze_data["waze_jam_queue_meters"],
            "waze_total_delay_seconds": waze_data["waze_total_delay_seconds"],
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
                f"Live Traffic ({traffic_source}) + FOSSGIS OSRM Foot Kinematics + "
                "GBFS Micromobility + Telraam Counters + Public Webcam CV + OSM Transit/Surveillance"
            ),
        }

    async def get_3point_Insert_triangulation(self, lat: float, lon: float) -> Dict[str, Any]:
        return await self.get_live_pedestrian_density(lat, lon)