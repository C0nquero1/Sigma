import math
from datetime import datetime, timedelta, timezone

class TemporalVelocityEngine:
    """Slices static daily projections into real-time transactional velocity with commodity awareness."""

    def calculate_time_context(self, lon: float, daily_volume: float, commodity: str = "") -> dict:
        utc_now = datetime.now(timezone.utc)
        offset_hours = lon / 15.0
        local_time = utc_now + timedelta(hours=offset_hours)
        hour = local_time.hour
        
        # 1. Commodity-Aware Diurnal Curve
        night_keywords = ["suya", "food", "khat", "miraa", "night", "club", "kabu-kabu", "kombis"]
        is_night_economy = any(word in commodity.lower() for word in night_keywords)

        if is_night_economy:
            # Night Economy: Wakes up at 16:00, peaks at 21:00, dies down at 03:00
            if 16 <= hour <= 23 or 0 <= hour <= 3:
                adjusted_hour = hour if hour >= 16 else hour + 24
                curve_position = (adjusted_hour - 16) / 11.0
                activity_multiplier = math.sin(curve_position * math.pi)
            else:
                activity_multiplier = 0.08 # Daytime prep
        else:
            # Day Economy: Wakes up at 06:00, peaks at 13:00, dies down at 19:00
            if 6 <= hour <= 19:
                curve_position = (hour - 6) / 13.0
                activity_multiplier = math.sin(curve_position * math.pi)
            else:
                activity_multiplier = 0.03 # Nighttime security/skeleton crew

        # Never let a street economy hit absolute zero
        activity_multiplier = max(0.02, activity_multiplier)

        # 2. Calculate Real-Time Market Status
        if activity_multiplier > 0.8:
            status = "PEAK_SURGE"
        elif activity_multiplier > 0.4:
            status = "ACTIVE_TRADING"
        elif activity_multiplier > 0.15:
            status = "WINDING_DOWN_OR_WAKING"
        else:
            status = "DORMANT_OR_CLOSED"

        # 3. Slice the Liquidity Horizons
        live_1hr_velocity = daily_volume * (1.0 / 12.0) * activity_multiplier
        last_12hr_velocity = daily_volume * 0.55
        trailing_7d_velocity = daily_volume * 6.4 
        
        return {
            "local_timestamp": local_time.strftime("%Y-%m-%d %H:%M:%S"),
            "local_hour": hour,
            "market_status": status,
            "live_activity_index": round(activity_multiplier, 2),
            "horizons": {
                "live_1hr": round(live_1hr_velocity, 2),
                "last_12hrs": round(last_12hr_velocity, 2),
                "last_24hrs": round(daily_volume, 2),
                "trailing_7_days": round(trailing_7d_velocity, 2)
            }
        }