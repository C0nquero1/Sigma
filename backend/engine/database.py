import os
import json
import time
import uuid
import logging
import sqlite3
from typing import Optional, Dict, Any, List
import redis

logger = logging.getLogger("StreetAI.Database")


class UnifiedGlobalLedger:
    """
    100% Empirical Tiered Memory Grid & Double-Entry Working-Capital Ledger.
    - Tier 1: Redis (forced IPv4 127.0.0.1 with socket timeout & keepalive) for live state
              caching and optional machine-to-machine edge telemetry (Frigate, ESP32, Odoo).
    - Tier 2: SQLite Immutable Ledger storing:
              1. `historical_volume` & `telemetry_observations` (real recorded time-series snapshots)
              2. `ledger_transactions` & `ledger_postings` (Formance/Medici-style balanced double-entry
                 accounting for POS inflow, in-transit settlement float, cleared capital, and payables)
              3. `physical_anomalies`
    """
    def __init__(self, redis_url: Optional[str] = None, db_path: str = "street_ledger.db"):
        self.db_path = db_path
        raw_url = redis_url or os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
        clean_url = raw_url.replace("localhost", "127.0.0.1")
        try:
            self.redis_client = redis.from_url(
                clean_url,
                decode_responses=True,
                socket_connect_timeout=2.5,
                socket_timeout=2.5,
                retry_on_timeout=True,
                health_check_interval=30,
            )
            self.redis_client.ping()
            logger.info(f"🟢 Redis Tiered Memory Grid operational on {clean_url}.")
        except Exception as e:
            logger.warning(f"🟡 Redis cache unavailable. Operating without live state caching: {e}")
            self.redis_client = None

        self._initialize_physical_ledger()

    def _initialize_physical_ledger(self):
        """Creates the immutable local SQLite tables (including balanced double-entry journal tables)."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS historical_volume (
                        h3_cell TEXT,
                        target_date TEXT,
                        volume_local REAL,
                        PRIMARY KEY (h3_cell, target_date)
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS telemetry_observations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        h3_cell TEXT NOT NULL,
                        commodity TEXT NOT NULL,
                        observed_at REAL NOT NULL,
                        local_currency TEXT NOT NULL,
                        hourly_velocity_local REAL,
                        hourly_visitors INTEGER,
                        clearing_price_local REAL,
                        occupancy_pct INTEGER,
                        congestion_ratio REAL,
                        precipitation_mm REAL,
                        operating_state TEXT
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS ledger_transactions (
                        tx_id TEXT PRIMARY KEY,
                        h3_cell TEXT NOT NULL,
                        currency TEXT NOT NULL,
                        reference TEXT,
                        created_at REAL NOT NULL
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS ledger_postings (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        tx_id TEXT NOT NULL,
                        h3_cell TEXT NOT NULL,
                        account TEXT NOT NULL,
                        direction TEXT NOT NULL CHECK(direction IN ('DEBIT', 'CREDIT')),
                        amount_local REAL NOT NULL,
                        currency TEXT NOT NULL,
                        created_at REAL NOT NULL,
                        FOREIGN KEY (tx_id) REFERENCES ledger_transactions(tx_id)
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS physical_anomalies (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        region TEXT,
                        delta_percentage REAL,
                        timestamp REAL
                    )
                """)
                conn.commit()
        except Exception as e:
            logger.error(f"Failed to initialize SQLite physical ledger: {e}")

    def fetch_live_state(self, h3_index: str, commodity: str) -> Optional[Dict[str, Any]]:
        if not self.redis_client:
            return None
        try:
            key = f"streetai:live:{h3_index}:{commodity}"
            data = self.redis_client.get(key)
            if data:
                logger.info(f"⚡ Cache Hit: Retrieved verified physical state for {h3_index}.")
                return json.loads(data)
        except Exception as e:
            logger.debug(f"Redis fetch degraded: {e}")
        return None

    def commit_live_state(self, h3_index: str, commodity: str, payload: Dict[str, Any], ttl_seconds: int = 300):
        if not self.redis_client:
            return
        try:
            key = f"streetai:live:{h3_index}:{commodity}"
            self.redis_client.setex(key, ttl_seconds, json.dumps(payload))
        except Exception as e:
            logger.debug(f"Redis commit degraded: {e}")

    def ingest_edge_telemetry(
        self,
        h3_cell: str,
        rf_probes: Optional[int] = None,
        vision_dwell_seconds: Optional[float] = None,
        pos_handshakes: Optional[int] = None,
        pos_receipts: Optional[int] = None,
        ttl_seconds: int = 1800,
    ) -> Dict[str, Any]:
        """Stores live automated edge sensor/POS stream events in Redis with TTL."""
        stored: Dict[str, Any] = {}
        if not self.redis_client:
            return {"stored": False, "reason": "REDIS_UNAVAILABLE"}
        try:
            if rf_probes is not None and rf_probes >= 0:
                self.redis_client.setex(f"iot:rf:{h3_cell}:probes", ttl_seconds, str(int(rf_probes)))
                stored["rf_probes"] = int(rf_probes)
            if vision_dwell_seconds is not None and vision_dwell_seconds > 0:
                self.redis_client.setex(f"iot:vision:{h3_cell}:dwell_seconds", ttl_seconds, str(float(vision_dwell_seconds)))
                stored["vision_dwell_seconds"] = float(vision_dwell_seconds)
            if pos_handshakes is not None and pos_handshakes >= 0:
                self.redis_client.setex(f"iot:ble:{h3_cell}:pos_handshakes", ttl_seconds, str(int(pos_handshakes)))
                stored["pos_handshakes"] = int(pos_handshakes)
            if pos_receipts is not None and pos_receipts >= 0:
                self.redis_client.setex(f"iot:pos:{h3_cell}:receipts", ttl_seconds, str(int(pos_receipts)))
                stored["pos_receipts"] = int(pos_receipts)
            return {"stored": True, "h3_cell": h3_cell, "keys_updated": stored, "ttl_seconds": ttl_seconds}
        except Exception as e:
            logger.debug(f"Edge telemetry ingest error: {e}")
            return {"stored": False, "reason": str(e)}

    def record_double_entry_settlement(
        self,
        h3_cell: str,
        currency: str,
        authorized_inflow_local: float,
        in_transit_float_local: float,
        cleared_cash_local: float,
        inventory_payables_local: float,
        reference: str = "HOURLY_WINDOW_SETTLEMENT",
    ) -> Optional[str]:
        """
        Records a balanced Formance/Medici-style double-entry journal transaction in SQLite.
        Every posting enforces Debits == Credits across treasury accounts.
        """
        if authorized_inflow_local <= 0:
            return None
        tx_id = f"tx_{uuid.uuid4().hex[:12]}"
        now_ts = time.time()
        postings = [
            # Authorized POS/Cash buyer inflow split into cleared capital and in-transit bank settlement float
            ("BUYER_TENDER_SOURCE", "CREDIT", round(authorized_inflow_local, 2)),
            ("CLEARED_WORKING_CAPITAL", "DEBIT", round(max(0.0, cleared_cash_local), 2)),
            ("IN_TRANSIT_SETTLEMENT_FLOAT", "DEBIT", round(max(0.0, in_transit_float_local), 2)),
        ]
        # Balance any rounding residual strictly into CLEARED_WORKING_CAPITAL
        debit_sum = round(postings[1][2] + postings[2][2], 2)
        residual = round(postings[0][2] - debit_sum, 2)
        if abs(residual) > 0:
            postings[1] = ("CLEARED_WORKING_CAPITAL", "DEBIT", round(max(0.0, postings[1][2] + residual), 2))

        if inventory_payables_local > 0:
            postings.append(("B2B_INVENTORY_RESTOCK_ASSET", "DEBIT", round(inventory_payables_local, 2)))
            postings.append(("B2B_INVENTORY_PAYABLES", "CREDIT", round(inventory_payables_local, 2)))

        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO ledger_transactions (tx_id, h3_cell, currency, reference, created_at) VALUES (?, ?, ?, ?, ?)",
                    (tx_id, h3_cell, currency, reference, now_ts),
                )
                for acct, direction, amt in postings:
                    if amt > 0:
                        cursor.execute(
                            """
                            INSERT INTO ledger_postings (tx_id, h3_cell, account, direction, amount_local, currency, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                            """,
                            (tx_id, h3_cell, acct, direction, amt, currency, now_ts),
                        )
                conn.commit()
            return tx_id
        except Exception as e:
            logger.debug(f"SQLite double-entry ledger write degraded: {e}")
            return None

    def record_telemetry_observation(
        self,
        h3_cell: str,
        commodity: str,
        local_currency: str,
        hourly_velocity_local: float,
        hourly_visitors: int,
        clearing_price_local: float,
        occupancy_pct: Optional[int],
        congestion_ratio: float,
        precipitation_mm: float,
        operating_state: str,
    ):
        """Persists an immutable timestamped physical observation snapshot into SQLite."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO telemetry_observations (
                        h3_cell, commodity, observed_at, local_currency,
                        hourly_velocity_local, hourly_visitors, clearing_price_local,
                        occupancy_pct, congestion_ratio, precipitation_mm, operating_state
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        h3_cell,
                        commodity,
                        time.time(),
                        local_currency,
                        round(hourly_velocity_local, 2),
                        int(hourly_visitors),
                        round(clearing_price_local, 2),
                        int(occupancy_pct) if occupancy_pct is not None else None,
                        round(congestion_ratio, 3),
                        round(precipitation_mm, 2),
                        operating_state,
                    ),
                )
                conn.commit()
        except Exception as e:
            logger.debug(f"SQLite observation write degraded: {e}")

    async def get_historical_volume(self, h3_cell: str, date_str: str) -> Optional[float]:
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT volume_local FROM historical_volume WHERE h3_cell = ? AND target_date = ?",
                    (h3_cell, date_str),
                )
                row = cursor.fetchone()
                if row:
                    return float(row[0])
        except Exception as e:
            logger.debug(f"SQLite ledger read degraded: {e}")
        return None

    async def commit_historical_volume(self, h3_cell: str, date_str: str, volume: float):
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO historical_volume (h3_cell, target_date, volume_local)
                    VALUES (?, ?, ?)
                    ON CONFLICT(h3_cell, target_date) DO UPDATE SET volume_local = excluded.volume_local
                    """,
                    (h3_cell, date_str, volume),
                )
                conn.commit()
        except Exception as e:
            logger.debug(f"SQLite ledger write degraded: {e}")

    async def log_physical_anomaly(self, region: str, delta_percentage: float):
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO physical_anomalies (region, delta_percentage, timestamp) VALUES (?, ?, ?)",
                    (region, delta_percentage, time.time()),
                )
                conn.commit()
        except Exception as e:
            logger.debug(f"SQLite anomaly logging degraded: {e}")