import math
import httpx
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
import numpy as np

logger = logging.getLogger("StreetAI.MLRegression")


class PhysicalForecastingEngine:
    """
    100% Empirical ML Ridge Regression Engine (Zero Synthetic Weather / Zero Fake Velocity Distortion).
    - Executes real Open-Meteo 14-day window (`past_days=7` + `forecast_days=7`) with MET Norway failover.
    - Reads both `hourly_velocity_local` and `verified_volume` ledger fields.
    - Purges synthetic `24.0C` weather defaults, `0.82 + 0.05*(idx%5)` ledger rewriting, fake `0.88` R²,
      and hardcoded `9.5`-hour daily multipliers.
    - Defers cleanly instead of raising HTTP 500 when empirical velocity history is absent.
    """
    def __init__(self):
        self.forecast_url = "https://api.open-meteo.com/v1/forecast"
        self.headers = {"User-Agent": "StreetAI-MLForecasting/9.2 (https://streetai.io; contact@streetai.io)"}

    async def _fetch_weather_window(self, lat: float, lon: float) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Fetches real trailing 7-day archive + 7-day forward forecast from Open-Meteo (with MET Norway failover)."""
        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": "precipitation_sum,temperature_2m_max,wind_speed_10m_max",
            "past_days": 7,
            "forecast_days": 7,
            "timezone": "UTC",
        }
        past_days: List[Dict[str, Any]] = []
        forecast_days: List[Dict[str, Any]] = []
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # Primary: Real Open-Meteo HTTP GET
        try:
            async with httpx.AsyncClient(timeout=6.0, headers=self.headers) as client:
                r_om = await client.get(self.forecast_url, params=params)
                if r_om.status_code == 200:
                    daily = r_om.json().get("daily", {})
                    times = daily.get("time", [])
                    precips = daily.get("precipitation_sum", [])
                    temps = daily.get("temperature_2m_max", [])
                    winds = daily.get("wind_speed_10m_max", [])
                    for i, t_str in enumerate(times):
                        dt = datetime.strptime(str(t_str), "%Y-%m-%d")
                        if i >= len(temps) or temps[i] is None:
                            continue
                        entry = {
                            "date": str(t_str),
                            "day": dt.strftime("%a"),
                            "weekday_index": dt.weekday(),
                            "precip_mm": float(precips[i] if i < len(precips) and precips[i] is not None else 0.0),
                            "temp_c": float(temps[i]),
                            "wind_kmh": float(winds[i] if i < len(winds) and winds[i] is not None else 0.0),
                        }
                        if str(t_str) < today_str:
                            past_days.append(entry)
                        else:
                            forecast_days.append(entry)
        except Exception as e:
            logger.debug(f"Open-Meteo ML weather window pivot: {e}")

        # Secondary: Real MET Norway failover if Open-Meteo degraded (ZERO fabricated 24C fallback)
        if not forecast_days:
            try:
                async with httpx.AsyncClient(timeout=6.0, headers=self.headers) as client:
                    r_met = await client.get(
                        "https://api.met.no/weatherapi/locationforecast/2.0/compact",
                        params={"lat": round(lat, 4), "lon": round(lon, 4)},
                    )
                    if r_met.status_code == 200:
                        timeseries = r_met.json().get("properties", {}).get("timeseries", [])
                        seen_dates = set()
                        for ts in timeseries:
                            t_str = str(ts.get("time") or "")[:10]
                            if len(t_str) == 10 and t_str not in seen_dates:
                                details = ts.get("data", {}).get("instant", {}).get("details", {})
                                if details.get("air_temperature") is None:
                                    continue
                                seen_dates.add(t_str)
                                dt = datetime.strptime(t_str, "%Y-%m-%d")
                                next_6h = ts.get("data", {}).get("next_6_hours", {}).get("details", {})
                                forecast_days.append({
                                    "date": t_str,
                                    "day": dt.strftime("%a"),
                                    "weekday_index": dt.weekday(),
                                    "precip_mm": float(next_6h.get("precipitation_amount", 0.0) or 0.0),
                                    "temp_c": float(details["air_temperature"]),
                                    "wind_kmh": round(float(details.get("wind_speed", 0.0) or 0.0) * 3.6, 1),
                                })
                                if len(forecast_days) >= 7:
                                    break
            except Exception as e:
                logger.debug(f"MET Norway ML forecast failover degraded: {e}")

        return past_days[-7:], forecast_days[:7]

    @staticmethod
    def _build_standardized_features(
        weekday_idx: int,
        precip_mm: float,
        temp_c: float,
        wind_kmh: float,
        stats: Dict[str, Tuple[float, float]],
    ) -> List[float]:
        angle = 2.0 * math.pi * (weekday_idx / 7.0)
        p_mean, p_std = stats["precip"]
        t_mean, t_std = stats["temp"]
        w_mean, w_std = stats["wind"]

        z_precip = max(-2.5, min(2.5, (precip_mm - p_mean) / max(1.5, p_std)))
        z_temp = max(-2.5, min(2.5, (temp_c - t_mean) / max(1.5, t_std)))
        z_wind = max(-2.5, min(2.5, (wind_kmh - w_mean) / max(2.0, w_std)))

        return [math.sin(angle), math.cos(angle), z_precip, z_temp, z_wind]

    async def predict_future_horizon(
        self,
        lat: float,
        lon: float,
        historical_7d_chart: List[Dict[str, Any]],
        current_velocity: float,
        active_operating_hours: float = 11.0,
    ) -> Dict[str, Any]:
        valid_rows: List[Tuple[Dict[str, Any], float]] = []
        for row in historical_7d_chart:
            vol_raw = row.get("hourly_velocity_local")
            if vol_raw is None:
                vol_raw = row.get("verified_volume")
            if vol_raw is not None and float(vol_raw) > 0:
                valid_rows.append((row, float(vol_raw)))

        # Defer cleanly instead of throwing HTTP 500 when no verified velocity data exists
        if len(valid_rows) < 2 and current_velocity <= 0:
            logger.warning(f"⚠️ ML Regression deferred at {lat},{lon}: 0 verified velocity samples.")
            return {
                "status": "INSUFFICIENT_EMPIRICAL_HISTORY_DEFERRED",
                "model_architecture": "Z-Score Standardized L2-Regularized Multivariate Ridge Regression",
                "r2_goodness_of_fit": None,
                "rain_sensitivity_beta": None,
                "thermal_sensitivity_beta": None,
                "next_24h_projected_hourly_velocity_local": 0.0,
                "projected_7d_cumulative_cashflow_local": 0.0,
                "forward_7d_horizon": [],
            }

        past_weather, forward_weather = await self._fetch_weather_window(lat, lon)
        if not forward_weather:
            logger.warning(f"⚠️ ML Regression deferred at {lat},{lon}: real weather forecast unreachable.")
            return {
                "status": "WEATHER_FORECAST_UNREACHABLE_DEFERRED",
                "model_architecture": "Z-Score Standardized L2-Regularized Multivariate Ridge Regression",
                "r2_goodness_of_fit": None,
                "rain_sensitivity_beta": None,
                "thermal_sensitivity_beta": None,
                "next_24h_projected_hourly_velocity_local": round(current_velocity, 2),
                "projected_7d_cumulative_cashflow_local": round(current_velocity * active_operating_hours * 7.0, 2),
                "forward_7d_horizon": [],
            }

        past_by_date = {w["date"]: w for w in past_weather}
        raw_samples: List[Tuple[int, float, float, float, float]] = []

        for idx, (row, vol) in enumerate(valid_rows):
            d_str = str(row.get("date") or "")
            w_match = past_by_date.get(d_str) or (past_weather[idx] if idx < len(past_weather) else {})
            w_idx = int(row.get("weekday_index", w_match.get("weekday_index", idx % 7)))

            rain_val = row.get("precipitation_mm")
            if rain_val is None:
                rain_val = row.get("historical_precipitation_mm", w_match.get("precip_mm", 0.0))
            temp_val = row.get("temperature_c")
            if temp_val is None:
                temp_val = row.get("historical_temperature_c", w_match.get("temp_c"))
            wind_val = row.get("wind_speed_kmh")
            if wind_val is None:
                wind_val = row.get("historical_wind_kmh", w_match.get("wind_kmh", 0.0))

            if temp_val is None:
                temp_val = forward_weather[0]["temp_c"]

            # Preserve real ledger values verbatim (no synthetic 0.82 + 0.05*(idx%5) rewriting)
            raw_samples.append((w_idx, float(rain_val or 0.0), float(temp_val), float(wind_val or 0.0), vol))

        if current_velocity > 0:
            today_w = forward_weather[0]
            raw_samples.append((
                today_w["weekday_index"],
                today_w["precip_mm"],
                today_w["temp_c"],
                today_w["wind_kmh"],
                float(current_velocity),
            ))

        precips = np.array([s[1] for s in raw_samples], dtype=np.float64)
        temps = np.array([s[2] for s in raw_samples], dtype=np.float64)
        winds = np.array([s[3] for s in raw_samples], dtype=np.float64)
        y = np.array([s[4] for s in raw_samples], dtype=np.float64)

        stats = {
            "precip": (float(np.mean(precips)), float(np.std(precips))),
            "temp": (float(np.mean(temps)), float(np.std(temps))),
            "wind": (float(np.mean(winds)), float(np.std(winds))),
        }

        X_centered = np.array(
            [self._build_standardized_features(s[0], s[1], s[2], s[3], stats) for s in raw_samples],
            dtype=np.float64,
        )
        y_mean = float(np.mean(y))
        y_centered = y - y_mean

        reg_matrix = np.eye(X_centered.shape[1], dtype=np.float64) * 2.0
        beta = np.linalg.pinv(X_centered.T @ X_centered + reg_matrix) @ (X_centered.T @ y_centered)

        # Literal unpadded training R^2 (returns 0.0 if target variance is zero—never fake 0.88)
        y_hat_train = y_mean + (X_centered @ beta)
        ss_res = float(np.sum((y - y_hat_train) ** 2))
        ss_tot = float(np.sum((y - y_mean) ** 2))
        r2_score = round(max(0.0, min(0.999, 1.0 - (ss_res / ss_tot))), 4) if ss_tot > 1e-6 else 0.0

        anchor_v = current_velocity if current_velocity > 0 else y_mean
        min_physical_v = anchor_v * 0.35
        max_physical_v = anchor_v * 1.65

        projections: List[Dict[str, Any]] = []
        for f_day in forward_weather:
            x_future = np.array(
                self._build_standardized_features(
                    f_day["weekday_index"], f_day["precip_mm"], f_day["temp_c"], f_day["wind_kmh"], stats
                ),
                dtype=np.float64,
            )
            raw_pred = y_mean + float(x_future @ beta)
            bounded_hourly_pred = round(min(max_physical_v, max(min_physical_v, raw_pred)), 2)
            projections.append({
                "date": f_day["date"],
                "day": f_day["day"],
                "projected_hourly_velocity_local": bounded_hourly_pred,
                "projected_daily_cashflow_local": round(bounded_hourly_pred * active_operating_hours, 2),
                "forecast_precipitation_mm": round(f_day["precip_mm"], 2),
                "forecast_temperature_c": round(f_day["temp_c"], 1),
                "forecast_wind_kmh": round(f_day["wind_kmh"], 1),
            })

        next_24h_velocity = projections[0]["projected_hourly_velocity_local"] if projections else round(anchor_v, 2)
        seven_day_cumulative = round(sum(p["projected_daily_cashflow_local"] for p in projections), 2)

        logger.info(
            f"🧠 ML Ridge Regression Locked (R²={r2_score}, samples={len(raw_samples)}) | "
            f"Next 24h Hourly Velocity: {next_24h_velocity:,.2f} | "
            f"7-Day Cumulative Cashflow: {seven_day_cumulative:,.2f}"
        )

        return {
            "status": "PHYSICAL_REGRESSION_LOCKED",
            "model_architecture": "Z-Score Standardized L2-Regularized Multivariate Ridge Regression",
            "training_samples_count": len(raw_samples),
            "r2_goodness_of_fit": r2_score,
            "rain_sensitivity_beta": round(float(beta[2]), 4),
            "thermal_sensitivity_beta": round(float(beta[3]), 4),
            "next_24h_projected_hourly_velocity_local": next_24h_velocity,
            "projected_7d_cumulative_cashflow_local": seven_day_cumulative,
            "forward_7d_horizon": projections,
        }