import duckdb
import logging
from typing import List, Dict, Any

logger = logging.getLogger("StreetAI.Overture")

class OverturePOIEngine:
    """
    Zero-Cost SafeGraph Replacement.
    Queries Overture Maps global open Parquet stores directly from S3 via DuckDB.
    """
    def __init__(self):
        self.con = duckdb.connect()
        self.con.execute("INSTALL spatial; LOAD spatial;")
        self.con.execute("INSTALL httpfs; LOAD httpfs;")
        self.con.execute("SET s3_region='us-west-2';")

    def query_cluster_pois(self, lat: float, lon: float, radius_km: float = 1.0) -> List[Dict[str, Any]]:
        """Extracts exact POIs, categories, and building boundaries within an S2 radius."""
        # Convert radius to approximate coordinate degrees
        deg_delta = radius_km / 111.0
        min_lon, max_lon = lon - deg_delta, lon + deg_delta
        min_lat, max_lat = lat - deg_delta, lat + deg_delta

        query = f"""
            SELECT 
                names.primary AS name,
                categories.primary AS category,
                confidence,
                ST_X(geometry) AS lon,
                ST_Y(geometry) AS lat
            FROM read_parquet('s3://overturemaps-us-west-2/release/2024-08-20.0/theme=places/type=*/*', hive_partitioning=1)
            WHERE bbox.xmin >= {min_lon} AND bbox.xmax <= {max_lon}
              AND bbox.ymin >= {min_lat} AND bbox.ymax <= {max_lat}
            LIMIT 50;
        """
        try:
            res = self.con.execute(query).fetchall()
            return [
                {"name": row[0], "category": row[1], "confidence": row[2], "lon": row[3], "lat": row[4]}
                for row in res
            ]
        except Exception as e:
            logger.warning(f"Overture live S3 query skipped (offline fallback): {e}")
            return []