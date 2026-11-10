import os
import logging
import asyncio
from dotenv import load_dotenv
from typing import Dict, Any, List

logger = logging.getLogger("StreetAI.FootTraffic")


class LiveCrowdPatternEngine:
    """
    100% Physical Reality Orchestration Engine.
    Fuses Triangulated Mobility Kinematics and Dynamic Physical Conversion Telemetry.
    """
    def __init__(self, mobility_engine, conversion_engine):
        load_dotenv(override=True)
        self.api_key = os.getenv("TOMTOM_API_KEY", "")
        self.mobility = mobility_engine
        self.conversion = conversion_engine

    async def get_live_cluster_busyness(self, lat: float, lon: float, cell_id: str, discovered_networks: List[str]) -> Dict[str, Any]:
        logger.info(f"Fusing live physical reality sensors for coordinate {lat},{lon}...")

        mobility_task = self.mobility.get_live_pedestrian_density(lat, lon)
        conversion_task = self.conversion.calculate_physical_conversion(lat, lon, cell_id, discovered_networks)

        results = await asyncio.gather(mobility_task, conversion_task, return_exceptions=True)

        for result in results:
            if isinstance(result, Exception):
                logger.critical("Physical telemetry fusion failed due to upstream sensor loss. Halting.")
                raise result

        mobility_data = results[0]
        conversion_data = results[1]

        return {
            "structural_mobility_state": mobility_data.get("triangulated_mobility_state", "UNKNOWN"),
            "structural_conversion_state": conversion_data.get("structural_conversion_state", "UNKNOWN"),
            "raw_physical_telemetry": {
                "rf_devices_detected": mobility_data.get("unique_rf_devices_detected", 0),
                "vehicle_speed_kmh": mobility_data.get("tomtom_live_vehicle_speed_kmh", 0.0),
                "free_flow_speed_kmh": mobility_data.get("tomtom_baseline_empty_road_speed_kmh", 0.0),
                "foot_velocity_kmh": mobility_data.get("osrm_structural_foot_velocity_kmh", 4.8),
                "drive_velocity_kmh": mobility_data.get("osrm_structural_driving_velocity_kmh", 25.0),
                "device_dwell_time_minutes": conversion_data.get("average_device_dwell_time_minutes", 0.0),
                "active_mpos_terminals": conversion_data.get("dynamic_mpos_hardware_detected", 0),
                "verified_commercial_venues": conversion_data.get("verified_commercial_venues", 0),
                "iot_edge_handshakes": conversion_data.get("verified_edge_node_handshakes", 0)
            },
            "provenance": "Fused OSINT Reality: WiGLE RF, TomTom GPS, BestTime Dwell, OSRM Kinematics, Redis IoT"
        }