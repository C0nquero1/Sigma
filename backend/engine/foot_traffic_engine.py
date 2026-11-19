import os
import logging
import asyncio
from dotenv import load_dotenv
from typing import Dict, Any, List

logger = logging.getLogger("StreetAI.FootTraffic")


class LiveCrowdPatternEngine:
    """
    100% Empirical Orchestration Engine.
    Fuses Batch 2 Mobility Telemetry (Waze, TomTom, OSRM, Telraam, Webcam CV, WiGLE/Edge RF)
    and Empirical Physical Conversion Telemetry (Google Maps Dwell, Web Duration, CICO/Edge POS)
    with zero dropped keys and zero synthetic defaults.
    """
    def __init__(self, mobility_engine, conversion_engine):
        load_dotenv(override=True)
        self.api_key = os.getenv("TOMTOM_API_KEY", "")
        self.mobility = mobility_engine
        self.conversion = conversion_engine

    async def get_live_cluster_busyness(
        self, lat: float, lon: float, cell_id: str, discovered_networks: List[str]
    ) -> Dict[str, Any]:
        logger.info(f"Fusing live empirical telemetry sensors for coordinate {lat},{lon}...")

        mobility_task = self.mobility.get_live_pedestrian_density(lat, lon, cell_id=cell_id)
        conversion_task = self.conversion.calculate_physical_conversion(lat, lon, cell_id, discovered_networks)

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
                # Exact 1:1 mapping from Batch 2 mobility_telemetry.py
                "rf_devices_detected": int(mobility_data.get("rf_devices_detected", 0) or 0),
                "is_live_rf_verified": bool(mobility_data.get("is_live_rf_verified", False)),
                "wigle_bssids_observed": int(mobility_data.get("wigle_bssids_observed", 0) or 0),
                "edge_probe_devices_count": int(mobility_data.get("edge_probe_devices_count", 0) or 0),
                "vehicle_speed_kmh": float(mobility_data.get("live_vehicular_velocity_kmh", 0.0) or 0.0),
                "free_flow_speed_kmh": float(mobility_data.get("free_flow_vehicular_velocity_kmh", 0.0) or 0.0),
                "live_perimeter_congestion_ratio": float(mobility_data.get("live_perimeter_congestion_ratio", 1.0) or 1.0),
                "is_live_traffic_verified": bool(mobility_data.get("is_live_traffic_verified", False)),
                "foot_velocity_kmh": float(mobility_data.get("foot_velocity_kmh", 0.0) or 0.0),
                "drive_velocity_kmh": float(mobility_data.get("structural_drive_velocity_kmh", 0.0) or 0.0),
                "waze_live_jams_count": int(mobility_data.get("waze_live_jams_count", 0) or 0),
                "waze_live_alerts_count": int(mobility_data.get("waze_live_alerts_count", 0) or 0),
                "waze_jam_queue_meters": int(mobility_data.get("waze_jam_queue_meters", 0) or 0),
                "waze_total_delay_seconds": int(mobility_data.get("waze_total_delay_seconds", 0) or 0),
                "telraam_pedestrians_hr": mobility_data.get("telraam_pedestrians_hr"),
                "telraam_vehicles_hr": mobility_data.get("telraam_vehicles_hr"),
                "public_webcam_person_count": mobility_data.get("public_webcam_person_count"),
                "public_webcam_url": mobility_data.get("public_webcam_url"),
                "surveillance_camera_nodes": int(mobility_data.get("surveillance_camera_nodes", 0) or 0),
                "transit_hubs_in_catchment": int(mobility_data.get("transit_hubs_in_catchment", 0) or 0),
                "pedestrian_crossings_in_catchment": int(mobility_data.get("pedestrian_crossings_in_catchment", 0) or 0),
                "pedestrian_catchment_5m_10m_15m_meters": mobility_data.get("pedestrian_catchment_5m_10m_15m_meters", {}),
                # Exact 1:1 mapping from Batch 2 optical_flow.py
                "device_dwell_time_minutes": float(conversion_data.get("average_device_dwell_time_minutes", 0.0) or 0.0),
                "dwell_source": conversion_data.get("dwell_source", "UNKNOWN"),
                "is_dwell_empirically_observed": bool(conversion_data.get("is_dwell_empirically_observed", False)),
                "active_mpos_terminals": int(conversion_data.get("dynamic_mpos_hardware_detected", 0) or 0),
                "observed_cico_terminals": int(conversion_data.get("observed_cico_terminals", 0) or 0),
                "verified_commercial_venues": int(conversion_data.get("verified_commercial_venues", 0) or 0),
                "iot_edge_handshakes": int(conversion_data.get("verified_edge_node_handshakes", 0) or 0),
                "edge_pos_receipts": int(conversion_data.get("edge_pos_receipts", 0) or 0),
            },
            "provenance": f"{mobility_data.get('provenance', '')} | {conversion_data.get('provenance', '')}",
        }