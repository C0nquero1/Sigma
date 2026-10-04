import logging
import asyncio

try:
    from engine.database import SupabaseLedger
except ImportError:
    SupabaseLedger = None

logger = logging.getLogger("StreetAI.GroundTruth")

class GroundTruthCalibrator:
    """Queries the centralized intelligence ledger for field-agent verified stall counts."""
    
    def __init__(self, db_client=None):
        self.db = db_client
        self.global_default_multiplier = 8.5
        
        # The Genesis Ledger: Fallback physical ground counts if the database is unreachable
        self.truth_ledger = {
            "8958f468b77ffff": {"name": "Abuja Wuse Zone 4", "actual_stalls": 142, "nri_baseline": 12.4},
            "89588265dafffff": {"name": "Computer Village Lagos", "actual_stalls": 3200, "nri_baseline": 45.2},
            "894995b86abffff": {"name": "Tepito Mexico City", "actual_stalls": 12000, "nri_baseline": 88.7},
            "897a6e4216fffff": {"name": "Eastleigh Nairobi", "actual_stalls": 4100, "nri_baseline": 38.1},
            "89bcc352db7ffff": {"name": "Bree Street Johannesburg", "actual_stalls": 850, "nri_baseline": 19.3}
        }

    async def calculate_dynamic_multiplier(self, h3_cell: str) -> float:
        """Pulls the latest physical field report for this exact hex from the database."""
        
        # 1. Attempt Live Database Fetch
        if self.db and hasattr(self.db, 'client'):
            try:
                # Query the database where field agents post daily calibration counts
                response = self.db.client.table("ground_truth_ledger").select("*").eq("h3_index", h3_cell).order("timestamp", desc=True).limit(1).execute()
                
                if hasattr(response, 'data') and response.data:
                    truth = response.data[0]
                    exact_multiplier = truth["actual_stalls"] / max(0.1, truth["nri_baseline"])
                    logger.info(f"Ground Truth Engaged [{h3_cell}]: Last calibrated by agent {truth.get('agent_id', 'SYS')} at {truth.get('timestamp')}. Multiplier: {exact_multiplier:.2f}")
                    return exact_multiplier
            except Exception as e:
                logger.error(f"Ground truth DB fetch failed: {e}. Falling back to Genesis Ledger.")

        # 2. Fallback to Genesis Ledger
        if h3_cell in self.truth_ledger:
            truth = self.truth_ledger[h3_cell]
            exact_multiplier = truth["actual_stalls"] / max(0.1, truth["nri_baseline"])
            logger.info(f"Ground Truth Engaged [{truth['name']}]: Calibrated SAR multiplier to {exact_multiplier:.2f}")
            return exact_multiplier
            
        # 3. Complete Unknown Zone
        logger.warning(f"No human ground-truth for {h3_cell}. Defaulting to orbital physics ({self.global_default_multiplier}).")
        return self.global_default_multiplier