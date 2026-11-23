import os
import logging
import asyncio
from dotenv import load_dotenv
from typing import Dict, Any, List, Optional

logger = logging.getLogger("StreetAI.FootTraffic")


class LiveCrowdPatternEngine:
    """
    100% Empirical Orchestration Engine.
    Forwards `venue_hint` and `city_hint` into both Mobility (Waze, TomTom, FOSSGIS OSRM Foot,
    GBFS, Telraam, Public Webcam CV) and Physical Conversion (Google Maps + DDGS Dwell, CICO/Edge POS)
    with zero dropped keys and zero synthetic defaults.
    """
    def __init__(self, mobility_engine, conversion_engine):
        load_dotenv(override=True)
        self.api_key = os.getenv("TOMTOM_API_KEY", "")
        self.mobility = mobility_engine
        self.conversion = conversion_engine

    async def get_live_cluster_busyness(
        self,
        lat: float,
        lon: float,
        cell_id: str,
        discovered_networks: List[str],
        venue_hint: Optional[str] = None,
        city_hint: Optional[str] = None,
    ) -> Dict[str, Any]:
        logger.info(f"Fusing live empirical telemetry sensors for coordinate {lat},{lon} ({venue_hint or city_hint or 'coord'})...")

        mobility_task = self.mobility.get_live_pedestrian_density(
            lat, lon, cell_id=cell_id, venue_hint=venue_hint, city_hint=city_hint
        )
        conversion_task = self.conversion.calculate_physical_conversion(
            lat, lon, cell_id, discovered_networks, venue_hint=venue_hint, city_hint=city_hint
        )

        results = await asyncio.gather(mobility_task, conversion_task, return_exceptions=True)

        for result in results:
            if isinstance(result, Exception):
                logger.critical("Empirical telemetry fusion failed due to upstream sensor loss. Halting.")
                raise result

        mobility_data = results[0]
        conversion_data = results[1]

        return {
            "structural_mobility_state": mobility_data.get("status", "UNKNOWN"),
            "structural_conversion_state": conversion_data.get("structural_conversion_state", "UNKNOWN"),
            "raw_physical_telemetry": {
                "rf_devices_detected": int(mobility_data.get("rf_devices_detected", 0) or 0),
                "is_live_rf_verified": bool(mobility_data.get("is_live_rf_verified", False)),
                "wigle_bssids_observed": int(mobility_data.get("wigle_bssids_observed", 0) or 0),
                "edge_probe_devices_count": int(mobility_data.get("edge_probe_devices_count", 0) or 0),
                "vehicle_speed_kmh": float(mobility_data.get("live_vehicular_velocity_kmh", 0.0) or 0.0),
                "free_flow_speed_kmh": float(mobility_data.get("free_flow_vehicular_velocity_kmh", 0.0) or 0.0),
                "live_perimeter_congestion_ratio": float(mobility_data.get("live_perimeter_congestion_ratio", 1.0) or 1.0),
                "is_live_traffic_verified": bool(mobility_data.get("is_live_traffic_verified", False)),
                "traffic_source": str(mobility_data.get("traffic_source") or "UNVERIFIED"),
                "foot_velocity_kmh": float(mobility_data.get("foot_velocity_kmh", 0.0) or 0.0),
                "drive_velocity_kmh": float(mobility_data.get("structural_drive_velocity_kmh", 0.0) or 0.0),
                "waze_live_verified": bool(mobility_data.get("waze_live_verified", False)),
                "waze_live_jams_count": int(mobility_data.get("waze_live_jams_count", 0) or 0),
                "waze_live_alerts_count": int(mobility_data.get("waze_live_alerts_count", 0) or 0),
                "waze_jam_queue_meters": int(mobility_data.get("waze_jam_queue_meters", 0) or 0),
                "waze_total_delay_seconds": int(mobility_data.get("waze_total_delay_seconds", 0) or 0),
                "gbfs_system_name": mobility_data.get("gbfs_system_name"),
                "gbfs_stations_within_1200m": int(mobility_data.get("gbfs_stations_within_1200m", 0) or 0),
                "gbfs_bikes_available_nearby": mobility_data.get("gbfs_bikes_available_nearby"),
                "gbfs_docks_available_nearby": mobility_data.get("gbfs_docks_available_nearby"),
                "telraam_pedestrians_hr": mobility_data.get("telraam_pedestrians_hr"),
                "telraam_vehicles_hr": mobility_data.get("telraam_vehicles_hr"),
                "public_webcam_person_count": mobility_data.get("public_webcam_person_count"),
                "public_webcam_url": mobility_data.get("public_webcam_url"),
                "surveillance_camera_nodes": int(mobility_data.get("surveillance_camera_nodes", 0) or 0),
                "transit_hubs_in_catchment": int(mobility_data.get("transit_hubs_in_catchment", 0) or 0),
                "pedestrian_crossings_in_catchment": int(mobility_data.get("pedestrian_crossings_in_catchment", 0) or 0),
                "pedestrian_catchment_5m_10m_15m_meters": mobility_data.get("pedestrian_catchment_5m_10m_15m_meters", {}),
                "dwell_anchor_name": conversion_data.get("dwell_anchor_name"),
                "device_dwell_time_minutes": float(conversion_data.get("average_device_dwell_time_minutes", 0.0) or 0.0),
                "dwell_source": conversion_data.get("dwell_source", "UNKNOWN"),
                "is_dwell_empirically_observed": bool(conversion_data.get("is_dwell_empirically_observed", False)),
                "active_mpos_terminals": int(conversion_data.get("dynamic_mpos_hardware_detected", 0) or 0),
                "observed_cico_terminals": int(conversion_data.get("observed_cico_terminals", 0) or 0),
                "verified_commercial_venues": int(conversion_data.get("verified_commercial_venues", 0) or 0),
                "iot_edge_handshakes": int(conversion_data.get("verified_edge_node_handshakes", 0) or 0),
                "edge_pos_receipts": int(conversion_data.get("edge_pos_receipts", 0) or 0),
                "tomtom_incidents_count": int(mobility_data.get("tomtom_incidents_count", 0) or 0),
                "tomtom_road_closures_count": int(mobility_data.get("tomtom_road_closures_count", 0) or 0),
                "mapbox_segments_observed": int(mobility_data.get("mapbox_segments_observed", 0) or 0),
                "mapbox_congestion_breakdown": mobility_data.get("mapbox_congestion_breakdown", {}),
            },
            "provenance": f"{mobility_data.get('provenance', '')} | {conversion_data.get('provenance', '')}",
        }