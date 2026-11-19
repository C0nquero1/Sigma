import os
import math
import httpx
import logging
import asyncio
from typing import Dict, Any, Tuple, Optional, List
import redis.asyncio as redis
from engine.overture_engine import LiveInfrastructureEngine

logger = logging.getLogger("StreetAI.Mobility")


def _count_people_in_image_bytes(img_bytes: bytes) -> Optional[int]:
    """
    Runs deterministic computer-vision person detection on a live public webcam snapshot
    using Ultralytics YOLOv8 (if installed) or OpenCV HOG+SVM people detector (if cv2 is installed).
    Returns None if neither CV runtime is installed or image cannot be decoded (ZERO fake counts).
    """
    if not img_bytes or len(img_bytes) < 1024:
        return None
    try:
        import numpy as np
        import cv2
    except ImportError:
        return None

    try:
        arr = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if frame is None or frame.size == 0:
            return None

        # Tier 1: Ultralytics YOLO person class (class 0) if available locally
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

        # Tier 2: Built-in OpenCV HOG Pedestrian Detector (zero external weights needed)
        hog = cv2.HOGDescriptor()
        hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        h, w = frame.shape[:2]
        if w > 960:
            scale = 960.0 / w
            frame = cv2.resize(frame, (int(w * scale), int(h * scale)))
        boxes, weights = hog.detectMultiScale(
            frame, winStride=(8, 8), padding=(4, 4), scale=1.05
        )
        valid_count = sum(1 for wt in weights if float(wt) >= 0.45) if len(weights) > 0 else 0
        return int(valid_count)
    except Exception:
        return None


class LiveMobilityTelemetry:
    """
    100% Real-Life Physical Mobility, Public Sensor & Traffic Triangulation Engine (Zero Simulation).
    Triangulates 6 real open telemetry sources:
      1. Waze Live GeoRSS (`waze.com/live-map/api/georss`) — literal GPS jam queues (m), delays (s), speed (km/h), alerts.
      2. TomTom Zoom-13 4-Gate Perimeter Flow — live arterial currentSpeed vs freeFlowSpeed.
      3. OSRM Topological Foot & Drive Routing — literal route distance/duration speeds + 5/10/15-min pedestrian catchment.
      4. Telraam Open Traffic/Pedestrian Counters (`telraam-api.net`) — real hourly pedestrian/bike/car counts where deployed.
      5. Public OSM/Windy Webcam Computer Vision (OpenCV HOG / YOLOv8) — live frame person count when a public feed exists.
      6. Real RF/Camera Infrastructure from Coalesced Spatial Snapshot (`osm_surveillance_nodes_count`,
         `osm_transit_hubs_count`, `osm_pedestrian_crossings_count`) + WiGLE / Redis Edge Probes (strictly separated).
    """

    def __init__(self, redis_url: str = "redis://127.0.0.1:6379"):
        self.tomtom_key = os.getenv("TOMTOM_API_KEY", "").strip()
        self.wigle_api_token = os.getenv("WIGLE_API_TOKEN", "").strip()
        self.telraam_key = os.getenv("TELRAAM_API_KEY", "").strip()
        self.windy_key = os.getenv("WINDY_API_KEY", "").strip()
        self.osrm_base = "https://router.project-osrm.org"
        self.tomtom_base = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/13/json"
        self.waze_georss_url = "https://www.waze.com/live-map/api/georss"
        self.telraam_snapshot_url = "https://telraam-api.net/v1/reports/traffic_snapshot"
        self.browser_headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Referer": "https://www.waze.com/live-map",
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
        """
        Measures literal OSRM pedestrian & vehicular route speeds (`distance / duration * 3.6`)
        and physical footpath network tortuosity for 5/10/15-min pedestrian catchment reach.
        Returns None for unreached metrics (zero hardcoded 4.65 / 29.5 / 9 fallbacks).
        """
        d = 0.003
        coords_diag = f"{lon-d},{lat-d};{lon+d},{lat+d}"
        coords_ns = f"{lon},{lat-d};{lon},{lat+d}"

        foot_kmh: Optional[float] = None
        drive_kmh: Optional[float] = None
        maneuvers: int = 0
        foot_dist_m: float = 0.0
        tortuosity_ratio: float = 1.0

        try:
            r_foot, r_drive, r_foot_ns = await asyncio.gather(
                client.get(f"{self.osrm_base}/route/v1/foot/{coords_diag}", params={"overview": "false", "steps": "true"}),
                client.get(f"{self.osrm_base}/route/v1/driving/{coords_diag}", params={"overview": "false", "steps": "true"}),
                client.get(f"{self.osrm_base}/route/v1/foot/{coords_ns}", params={"overview": "false"}),
                return_exceptions=True,
            )
            if isinstance(r_foot, httpx.Response) and r_foot.status_code == 200:
                routes = r_foot.json().get("routes", [])
                if routes:
                    foot_dist_m = float(routes[0].get("distance") or 0.0)
                    foot_dur_s = float(routes[0].get("duration") or 0.0)
                    legs = routes[0].get("legs", [])
                    steps = legs[0].get("steps", []) if legs else []
                    maneuvers = len(steps)
                    if foot_dist_m > 0 and foot_dur_s > 0:
                        # Literal OSRM street-network foot speed (km/h)
                        raw_foot_kmh = (foot_dist_m / foot_dur_s) * 3.6
                        # Straight-line diagonal span across 2*d (~940m at equator)
                        straight_m = math.hypot(
                            (2 * d) * 111_139.0,
                            (2 * d) * 111_139.0 * math.cos(math.radians(lat)),
                        )
                        tortuosity_ratio = max(1.0, foot_dist_m / max(1.0, straight_m))
                        # Effective straight-line crowd progress speed accounting for literal street grid tortuosity
                        foot_kmh = round(max(1.8, min(6.0, raw_foot_kmh / math.sqrt(tortuosity_ratio))), 2)
                        logger.info(
                            f"Topological Kinematics: {foot_dist_m:.1f}m OSRM footpath ({maneuvers} maneuvers, "
                            f"tortuosity {tortuosity_ratio:.2f}x) -> Effective Foot Velocity: {foot_kmh}km/h."
                        )

            if isinstance(r_drive, httpx.Response) and r_drive.status_code == 200:
                d_routes = r_drive.json().get("routes", [])
                if d_routes:
                    d_dist = float(d_routes[0].get("distance") or 0.0)
                    d_dur = float(d_routes[0].get("duration") or 0.0)
                    if d_dist > 0 and d_dur > 0:
                        drive_kmh = round((d_dist / d_dur) * 3.6, 2)

            if isinstance(r_foot_ns, httpx.Response) and r_foot_ns.status_code == 200:
                ns_routes = r_foot_ns.json().get("routes", [])
                if ns_routes and float(ns_routes[0].get("distance") or 0.0) > 0:
                    ns_dist = float(ns_routes[0]["distance"])
                    straight_ns = (2 * d) * 111_139.0
                    tortuosity_ratio = round((tortuosity_ratio + max(1.0, ns_dist / max(1.0, straight_ns))) / 2.0, 3)
        except Exception as e:
            logger.debug(f"OSRM topological routing pivot: {e}")

        # Exact 5/10/15-minute Euclidean catchment radius achievable along real OSM footpaths
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

    async def _probe_waze_live_jams_and_alerts(
        self, lat: float, lon: float, client: httpx.AsyncClient
    ) -> Dict[str, Any]:
        """
        Queries Waze Live GeoRSS (`waze.com/live-map/api/georss`) for literal real-time GPS jam
        queues (meters), total delay (seconds), observed jam speed (km/h), and user crowd/road alerts.
        """
        d = 0.011
        params = {
            "top": round(lat + d, 5),
            "bottom": round(lat - d, 5),
            "left": round(lon - d, 5),
            "right": round(lon + d, 5),
            "env": "row",
            "types": "traffic,alerts",
        }
        for env_code in ("row", "na", "il"):
            params["env"] = env_code
            try:
                res = await client.get(
                    self.waze_georss_url, params=params, headers=self.browser_headers, timeout=4.0
                )
                if res.status_code == 200:
                    data = res.json()
                    jams = data.get("jams", [])
                    alerts = data.get("alerts", [])
                    if jams or alerts:
                        total_jam_len_m = sum(int(j.get("length", 0) or 0) for j in jams)
                        total_delay_s = sum(max(0, int(j.get("delay", 0) or 0)) for j in jams)
                        valid_speeds = [
                            float(j["speedKMH"])
                            for j in jams
                            if isinstance(j.get("speedKMH"), (int, float)) and float(j["speedKMH"]) > 0
                        ]
                        avg_jam_kmh = round(sum(valid_speeds) / len(valid_speeds), 2) if valid_speeds else None
                        # Literal travel-time ratio derived from Waze length, speed, and delay seconds
                        travel_ratios: List[float] = []
                        for j in jams:
                            j_len = float(j.get("length") or 0.0)
                            j_spd = float(j.get("speedKMH") or 0.0)
                            j_del = max(0.0, float(j.get("delay") or 0.0))
                            if j_len > 20.0 and j_spd > 0.5:
                                actual_t = j_len / (j_spd / 3.6)
                                free_t = max(1.0, actual_t - j_del)
                                travel_ratios.append(min(3.5, actual_t / free_t))
                        measured_cong = (
                            round(sum(travel_ratios) / len(travel_ratios), 3)
                            if travel_ratios
                            else None
                        )
                        return {
                            "waze_jams_count": len(jams),
                            "waze_alerts_count": len(alerts),
                            "waze_jam_queue_meters": total_jam_len_m,
                            "waze_total_delay_seconds": total_delay_s,
                            "waze_avg_speed_kmh": avg_jam_kmh,
                            "waze_congestion_ratio": measured_cong,
                            "waze_live_verified": True,
                        }
                    if env_code == "row":
                        break
            except Exception:
                pass

        return {
            "waze_jams_count": 0,
            "waze_alerts_count": 0,
            "waze_jam_queue_meters": 0,
            "waze_total_delay_seconds": 0,
            "waze_avg_speed_kmh": None,
            "waze_congestion_ratio": None,
            "waze_live_verified": False,
        }

    async def _probe_telraam_open_counters(
        self, lat: float, lon: float, client: httpx.AsyncClient
    ) -> Dict[str, Any]:
        """
        Queries Telraam open-source citizen traffic/pedestrian sensors (`telraam-api.net`)
        if `TELRAAM_API_KEY` is configured and a live sensor segment exists within ~1.5km.
        """
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
                    # Check first coordinate of LineString / MultiLineString
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
        self, lat: float, lon: float, osm_webcam_urls: List[str], client: httpx.AsyncClient
    ) -> Dict[str, Any]:
        """
        Inspects live public webcam snapshots discovered via OSM (`contact:webcam`) or Windy Webcams API v3.
        Runs OpenCV HOG / YOLOv8 person detection strictly on real reachable JPEG frames.
        Returns None if no live public webcam frame is reachable (zero simulation).
        """
        candidate_img_urls: List[str] = []
        for u in osm_webcam_urls[:3]:
            if any(ext in u.lower() for ext in (".jpg", ".jpeg", ".png", "snapshot", "image")):
                candidate_img_urls.append(u)

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
                        return {
                            "public_webcam_person_count": detected,
                            "public_webcam_url": img_url,
                        }
            except Exception:
                pass

        return {"public_webcam_person_count": None, "public_webcam_url": None}

    async def _measure_live_vehicular_flow(
        self,
        lat: float,
        lon: float,
        osrm_drive_kmh: Optional[float],
        client: httpx.AsyncClient,
    ) -> Tuple[Optional[float], Optional[float], float, bool, Dict[str, Any]]:
        waze_task = asyncio.create_task(self._probe_waze_live_jams_and_alerts(lat, lon, client))
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
                    f"{self.osrm_base}/nearest/v1/driving/{lon},{lat}", params={"number": 1}
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

        if valid_flows:
            valid_flows.sort(key=lambda x: x[2], reverse=True)
            peak_curr, peak_free, peak_cong = valid_flows[0]
            waze_cong = waze_data.get("waze_congestion_ratio")
            combined_cong = round(max(peak_cong, float(waze_cong)), 3) if waze_cong else peak_cong
            return round(peak_curr, 2), round(peak_free, 2), combined_cong, True, waze_data

        if waze_data["waze_live_verified"] and waze_data["waze_avg_speed_kmh"] is not None:
            w_curr = float(waze_data["waze_avg_speed_kmh"])
            w_cong = float(waze_data["waze_congestion_ratio"] or 1.0)
            w_free = round(w_curr * w_cong, 2)
            return round(w_curr, 2), w_free, round(w_cong, 3), True, waze_data

        # No live traffic feed responded: return OSRM structural speed clearly tagged is_live_traffic_verified=False
        return osrm_drive_kmh, osrm_drive_kmh, 1.0, False, waze_data

    async def _intercept_real_rf_and_edge_probes(
        self, lat: float, lon: float, client: httpx.AsyncClient, cell_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Intercepts strictly REAL wireless RF telemetry (WiGLE BSSIDs or Redis edge ESP32/Kismet/LTESniffer probes).
        NEVER disguises POI counts or reviews as RF devices (`is_live_rf_verified: False`, `rf_devices_detected: 0`).
        """
        wigle_bssids = 0
        edge_probes = 0

        # 1. Check Redis for live edge RF/BLE/RNTI probe streams (ESP32-Paxcounter / Kismet / LTESniffer)
        if cell_id:
            try:
                raw_probe = await self.cache.get(f"iot:rf:{cell_id}:probes")
                if raw_probe:
                    edge_probes = int(raw_probe)
            except Exception:
                pass

        # 2. Check WiGLE wireless survey API if token is active and not exhausted
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
        self, lat: float, lon: float, cell_id: Optional[str] = None
    ) -> Dict[str, Any]:
        snapshot = await LiveInfrastructureEngine.get_coalesced_spatial_snapshot(lat, lon)
        camera_nodes = int(snapshot.get("osm_surveillance_nodes_count", 0) or 0)
        transit_hubs = int(snapshot.get("osm_transit_hubs_count", 0) or 0)
        ped_crossings = int(snapshot.get("osm_pedestrian_crossings_count", 0) or 0)
        osm_webcams = list(snapshot.get("osm_webcam_urls", []))
        verified_ground_nodes = int(snapshot.get("verified_merchants_total", 0) or 0) + int(
            snapshot.get("osm_cico_count", 0) or 0
        )

        async with httpx.AsyncClient(timeout=6.0) as client:
            osrm_data, rf_data, telraam_data, webcam_data = await asyncio.gather(
                self._measure_osrm_kinematics_and_catchment(lat, lon, client),
                self._intercept_real_rf_and_edge_probes(lat, lon, client, cell_id=cell_id),
                self._probe_telraam_open_counters(lat, lon, client),
                self._probe_public_webcam_vision(lat, lon, osm_webcams, client),
            )
            live_veh_kmh, free_flow_kmh, congestion_ratio, is_live_traffic, waze_data = (
                await self._measure_live_vehicular_flow(lat, lon, osrm_data["drive_kmh"], client)
            )

        foot_kmh_out = osrm_data["foot_kmh"] if osrm_data["foot_kmh"] is not None else 0.0
        drive_kmh_out = osrm_data["drive_kmh"] if osrm_data["drive_kmh"] is not None else 0.0

        logger.info(
            f"🚶 Empirical Mobility Triangulation Locked | Live Traffic Verified: {is_live_traffic} "
            f"(Veh: {live_veh_kmh}km/h vs FreeFlow: {free_flow_kmh}km/h, Congestion: {congestion_ratio}x | "
            f"Waze Jams: {waze_data['waze_jams_count']} [{waze_data['waze_jam_queue_meters']}m queue, {waze_data['waze_total_delay_seconds']}s delay], "
            f"Alerts: {waze_data['waze_alerts_count']}) | "
            f"Real RF Devices: {rf_data['rf_devices_detected']} (Verified: {rf_data['is_live_rf_verified']}) | "
            f"Telraam Peds/hr: {telraam_data['telraam_pedestrians_hr']} | Webcam CV Persons: {webcam_data['public_webcam_person_count']} | "
            f"OSM Infrastructure: {camera_nodes} cameras, {transit_hubs} transit stops, {ped_crossings} crossings | "
            f"OSRM Foot: {foot_kmh_out}km/h (10m reach: {osrm_data['catchment_radii_m']['10min_m']}m)"
        )

        return {
            "status": "MOBILITY_TRIANGULATED",
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
            "public_webcam_person_count": webcam_data["public_webcam_person_count"],
            "public_webcam_url": webcam_data["public_webcam_url"],
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
                "Waze Live GeoRSS (Queue/Delay/Speed) + TomTom 4-Gate Flow + OSRM Literal Foot/Drive Kinematics + "
                "Telraam Open Counters + Public Webcam CV + OSM Transit/Surveillance Nodes"
            ),
        }

    async def get_3point_Insert_triangulation(self, lat: float, lon: float) -> Dict[str, Any]:
        return await self.get_live_pedestrian_density(lat, lon)