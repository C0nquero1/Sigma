import os
import re
import math
import html
import httpx
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, Tuple, Set, List
from engine.overture_engine import LiveInfrastructureEngine, GOOGLE_CONSENT_COOKIES
from engine.llm_router import llm_router

logger = logging.getLogger("StreetAI.TemporalEngine")

_DAY_INDEX = {"mo": 0, "tu": 1, "we": 2, "th": 3, "fr": 4, "sa": 5, "su": 6}


def _clean_city_label(raw_city: str) -> str:
    c = re.sub(
        r"^(?:Special Capital Region of|Metropolitan City of|Federal Capital Territory|Province of|State of|Governorate of)\s+",
        "",
        (raw_city or "").strip(),
        flags=re.IGNORECASE,
    )
    return c.split(",")[0].strip()


def _ddgs_recent_news_sync(query: str, max_results: int = 8) -> List[Dict[str, str]]:
    """Pulls recent real news articles via `ddgs.news(..., timelimit='w')` (last 7-14 days)."""
    try:
        try:
            from ddgs import DDGS
        except ImportError:
            from duckduckgo_search import DDGS

        out: List[Dict[str, str]] = []
        with DDGS() as ddgs:
            for r in ddgs.news(query, timelimit="m", max_results=max_results) or []:
                if isinstance(r, dict):
                    out.append({
                        "title": str(r.get("title") or "").strip(),
                        "date": str(r.get("date") or "").strip(),
                        "source": str(r.get("source") or "").strip(),
                    })
        return out
    except Exception:
        return []


def _evaluate_osm_opening_hours_string(oh_str: str, local_weekday: int, local_hour: int) -> Optional[bool]:
    s = (oh_str or "").strip()
    if not s:
        return None
    if "24/7" in s:
        return True

    rules = [r.strip() for r in s.split(";") if r.strip()]
    matched_any_rule = False
    is_open = False

    for rule in rules:
        low = rule.lower()
        applies_today = False
        day_ranges = re.findall(r"\b(mo|tu|we|th|fr|sa|su)\s*-\s*(mo|tu|we|th|fr|sa|su)\b", low)
        single_days = re.findall(r"\b(mo|tu|we|th|fr|sa|su)\b", low)

        if day_ranges:
            for d1, d2 in day_ranges:
                i1, i2 = _DAY_INDEX[d1], _DAY_INDEX[d2]
                if i1 <= i2:
                    if i1 <= local_weekday <= i2:
                        applies_today = True
                else:
                    if local_weekday >= i1 or local_weekday <= i2:
                        applies_today = True
        elif single_days:
            if any(_DAY_INDEX[d] == local_weekday for d in single_days):
                applies_today = True
        else:
            applies_today = True

        if not applies_today:
            continue

        if "off" in low or "closed" in low:
            matched_any_rule = True
            is_open = False
            continue

        time_spans = re.findall(r"(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})", low)
        for sh, sm, eh, em in time_spans:
            matched_any_rule = True
            start_f = int(sh) + int(sm) / 60.0
            end_f = int(eh) + int(em) / 60.0
            cur_f = local_hour + 0.5
            if end_f >= start_f:
                if start_f <= cur_f < end_f:
                    is_open = True
            else:
                if cur_f >= start_f or cur_f < end_f:
                    is_open = True

    return is_open if matched_any_rule else None


class DynamicTemporalEngine:
    """
    100% Real-Life Temporal, OSM Schedule Evaluator, Live Occupancy & GDELT/Bluesky Event Pulse Engine.
    - Evaluates real OSM `opening_hours` strings + Google Maps live `is_open_now` / hours text.
    - Fixes false `1%` occupancy matches by requiring >= 4 consecutive hourly points in a genuine
      Google Maps popular-times histogram block.
    - Replaces broken Bing RSS social/news with GDELT Doc 2.0 API (keyless, 65 languages, 14d window),
      Bluesky AT Protocol search (optional `BSKY_HANDLE` + `BSKY_APP_PASSWORD`), and `ddgs.news`.
    - ZERO fabricated occupancy floors or forced midnight open ratios.
    """
    _besttime_unavailable: bool = True
    _bsky_token_cache: Tuple[float, Optional[str]] = (0.0, None)

    def __init__(self, db_ledger=None):
        self.db_ledger = db_ledger
        self.meteo_url = "https://api.open-meteo.com/v1/forecast"
        self.metno_url = "https://api.met.no/weatherapi/locationforecast/2.0/compact"
        self.gdelt_url = "https://api.gdeltproject.org/api/v2/doc/doc"
        self.headers = {"User-Agent": "StreetAI-Temporal-Node/9.3 (https://streetai.io; contact@streetai.io)"}
        self.browser_headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }

    @staticmethod
    def is_clean_venue_name(name: str, dynamic_admin_names: Optional[Set[str]] = None) -> bool:
        clean = (name or "").strip()
        if len(clean) < 3 or len(clean) > 55:
            return False
        if any(ch in clean for ch in ("·", "⋅", "•", "[", "]", "{", "}", "=", ";", "\\", "<", ">", "+")):
            return False
        words = clean.split()
        if len(words) > 6:
            return False
        if len(words) == 2 and words[0].replace(",", "").isdigit():
            return False
        if re.match(r"^\d{1,6}\b", clean):
            return False
        alpha_count = sum(1 for c in clean if c.isalpha())
        digit_count = sum(1 for c in clean if c.isdigit())
        if alpha_count < 3 or digit_count > alpha_count:
            return False
        if dynamic_admin_names and clean.lower() in dynamic_admin_names:
            return False
        return True

    async def _extract_primary_physical_venue(
        self,
        lat: float,
        lon: float,
        venue_hint: Optional[str] = None,
        city_hint: Optional[str] = None,
        spatial_snapshot: Optional[Dict[str, Any]] = None,
    ) -> Tuple[str, str, int, Dict[str, Any]]:
        if not spatial_snapshot:
            spatial_snapshot = await LiveInfrastructureEngine.get_coalesced_spatial_snapshot(lat, lon)

        pois = spatial_snapshot.get("gmaps_pois", [])
        osm_names = spatial_snapshot.get("osm_venue_names", [])
        loc_meta = spatial_snapshot.get("location_meta", {})
        active_count = max(
            int(spatial_snapshot.get("verified_merchants_total", 0) or 0),
            len(pois) + len(osm_names),
        )

        clean_city = _clean_city_label(city_hint or loc_meta.get("city") or loc_meta.get("country") or "")
        dynamic_admins: Set[str] = set()
        for k in ("city", "country", "country_code"):
            val = str(loc_meta.get(k) or "").strip().lower()
            if val:
                dynamic_admins.add(val)
        if clean_city:
            dynamic_admins.add(clean_city.lower())

        city_label = clean_city or f"{lat:.4f},{lon:.4f}"
        full_addr = loc_meta.get("label") or loc_meta.get("display_name") or city_label

        if venue_hint and self.is_clean_venue_name(venue_hint, dynamic_admins):
            clean_v = venue_hint.strip()
            return clean_v, f"{clean_v}, {city_label}", active_count, spatial_snapshot

        for osm_n in osm_names:
            if self.is_clean_venue_name(osm_n, dynamic_admins):
                return osm_n.strip(), full_addr, active_count, spatial_snapshot

        for p in pois:
            name = str(p.get("title") or "").strip()
            if self.is_clean_venue_name(name, dynamic_admins):
                return name, f"{name}, {city_label}", active_count, spatial_snapshot

        return full_addr, full_addr, active_count, spatial_snapshot

    async def _get_bluesky_bearer(self, client: httpx.AsyncClient) -> Optional[str]:
        handle = os.getenv("BSKY_HANDLE", "").strip()
        app_pw = os.getenv("BSKY_APP_PASSWORD", "").strip()
        if not (handle and app_pw):
            return None
        now = datetime.now(timezone.utc).timestamp()
        if self._bsky_token_cache[1] and (now - self._bsky_token_cache[0]) < 3600:
            return self._bsky_token_cache[1]
        try:
            res = await client.post(
                "https://bsky.social/xrpc/com.atproto.server.createSession",
                json={"identifier": handle, "password": app_pw},
                timeout=4.0,
            )
            if res.status_code == 200 and res.json().get("accessJwt"):
                jwt = str(res.json()["accessJwt"])
                DynamicTemporalEngine._bsky_token_cache = (now, jwt)
                return jwt
        except Exception:
            pass
        return None

    async def _probe_gdelt_and_bluesky_pulse(
        self, client: httpx.AsyncClient, venue_name: str, clean_city: str
    ) -> Dict[str, Any]:
        """
        Real-time zero-hardware event & social pulse:
          1. GDELT Doc 2.0 API (`mode=artlist`, `format=json`, `timespan=14d`) with valid quoted syntax.
          2. Bluesky AT Protocol search (fires ONLY when `BSKY_HANDLE` + `BSKY_APP_PASSWORD` are set; avoids 403).
          3. Bounded timeout-proof `llm_router.fast_ddgs_news` (`bing,yahoo`).
        """
        gdelt_articles: List[Dict[str, Any]] = []
        bsky_posts_14d = 0
        highlights: List[str] = []
        cutoff_iso = (datetime.now(timezone.utc) - timedelta(days=14)).strftime("%Y-%m-%dT%H:%M:%SZ")

        clean_v = re.sub(r'["()]', "", venue_name).strip()
        # GDELT requires clean quoted phrase or parenthesized terms without bare stray punctuation
        gdelt_query = f'"{clean_v}"' if len(clean_v.split()) >= 2 else f'("{clean_v}" AND "{clean_city}")' if clean_city else f'"{clean_v}"'
        bsky_jwt = await self._get_bluesky_bearer(client)

        tasks: List[Any] = [
            client.get(
                self.gdelt_url,
                params={
                    "query": gdelt_query,
                    "mode": "artlist",
                    "format": "json",
                    "maxrecords": "20",
                    "timespan": "14d",
                    "sort": "datedesc",
                },
                timeout=5.0,
            ),
            llm_router.fast_ddgs_news(f'"{clean_v}" {clean_city}'.strip(), max_results=8, timelimit="m"),
        ]
        if bsky_jwt:
            tasks.append(
                client.get(
                    "https://bsky.social/xrpc/app.bsky.feed.searchPosts",
                    params={"q": f"{clean_v} {clean_city}".strip(), "since": cutoff_iso, "limit": 20},
                    headers={"Authorization": f"Bearer {bsky_jwt}"},
                    timeout=4.5,
                )
            )

        results = await asyncio.gather(*tasks, return_exceptions=True)
        r_gdelt = results[0]
        ddgs_news = results[1]
        r_bsky = results[2] if len(results) > 2 else None

        # 1. GDELT Doc 2.0 real-time global news
        if isinstance(r_gdelt, httpx.Response) and r_gdelt.status_code == 200:
            try:
                gdelt_articles = r_gdelt.json().get("articles", []) or []
                for art in gdelt_articles[:3]:
                    t = str(art.get("title") or "").strip()
                    if t:
                        highlights.append(t[:95])
            except Exception:
                pass

        # 2. Bluesky AT Protocol posts (<= 14 days, authenticated)
        if isinstance(r_bsky, httpx.Response) and r_bsky.status_code == 200:
            try:
                posts = r_bsky.json().get("posts", []) or []
                bsky_posts_14d = len(posts)
                for p in posts[:2]:
                    txt = str((p.get("record") or {}).get("text") or "").strip()
                    if txt and len(highlights) < 4:
                        highlights.append(txt[:95])
            except Exception:
                pass

        # 3. Fast DDGS news (`bing,yahoo`)
        ddgs_count = 0
        if isinstance(ddgs_news, list):
            ddgs_count = len(ddgs_news)
            for item in ddgs_news[:2]:
                t = item.get("title", "")
                if t and t[:95] not in highlights and len(highlights) < 4:
                    highlights.append(t[:95])

        recent_news_count = max(len(gdelt_articles), ddgs_count)
        social_pulse_mult = round(
            min(1.25, 1.0 + (bsky_posts_14d * 0.015) + (recent_news_count * 0.012)),
            3,
        )

        return {
            "gdelt_articles_14d": len(gdelt_articles),
            "bluesky_posts_14d": bsky_posts_14d,
            "recent_social_posts_14d": bsky_posts_14d,
            "social_media_posts_indexed": bsky_posts_14d,
            "news_articles_indexed": recent_news_count,
            "social_pulse_multiplier": social_pulse_mult,
            "social_highlights": highlights,
        }

    @staticmethod
    def _extract_verified_gmaps_histogram(raw_pb: str, local_hour: int) -> Tuple[Optional[int], Optional[int], Optional[str]]:
        """
        Strict Google Maps Popular-Times histogram parser.
        Requires >= 4 distinct hourly tuples `[hour, pct, ...]` within a single contiguous histogram
        sequence so protobuf header fragments (`[5, 1, null]`) NEVER trigger false `1%` readings.
        """
        live_status_text: Optional[str] = None
        m_status = re.search(
            r"\b(As busy as it gets|Busier than usual|A little busy|Usually not too busy|Not too busy|Usually a little busy|Less busy than usual)\b",
            raw_pb,
            flags=re.IGNORECASE,
        )
        if m_status:
            live_status_text = m_status.group(1)

        # Look for genuine multi-hour histogram blocks: `[[6,12,...],[7,25,...],[8,48,...],[9,62,...]]`
        best_map: Dict[int, int] = {}
        for block_m in re.finditer(r"\[\s*(?:\[\d{1,2},\d{1,3},[^\]]{1,90}\]\s*,?\s*){4,24}\]", raw_pb):
            block_str = block_m.group(0)
            hr_map: Dict[int, int] = {}
            for pair in re.finditer(r"\[(\d{1,2}),(\d{1,3}),", block_str):
                h, pct = int(pair.group(1)), int(pair.group(2))
                if 0 <= h <= 23 and 1 <= pct <= 100:
                    hr_map[h] = pct
            # Must contain at least 4 distinct hours with non-trivial variance (>5%)
            if len(hr_map) >= 4 and max(hr_map.values()) >= 15:
                best_map = hr_map
                break

        if not best_map:
            return None, None, live_status_text

        obs_current = best_map.get(local_hour)
        daytime_vals = [v for h, v in best_map.items() if 8 <= h <= 18]
        obs_trading = int(round(sum(daytime_vals) / len(daytime_vals))) if daytime_vals else None
        return obs_current, obs_trading, live_status_text

    async def _probe_live_occupancy_and_social_pulse(
        self, lat: float, lon: float, venue_name: str, city_hint: str, local_hour: int
    ) -> Dict[str, Any]:
        clean_city = _clean_city_label(city_hint)
        pb_param = (
            f"!4m12!1m3!1d1500.0!2d{lon}!3d{lat}"
            f"!2m3!1f0!2f0!3f0!3m2!1i1280!2i800!4f13.1!7i10!10b1"
        )

        obs_current_pct: Optional[int] = None
        obs_trading_pct: Optional[int] = None
        live_status_text: Optional[str] = None

        async with httpx.AsyncClient(
            timeout=5.5,
            follow_redirects=True,
            headers=self.browser_headers,
            cookies=GOOGLE_CONSENT_COOKIES,
        ) as client:
            r_pb, pulse_data = await asyncio.gather(
                client.get(
                    "https://www.google.com/search",
                    params={
                        "tbm": "map",
                        "hl": "en",
                        "ucbcb": "1",
                        "pb": pb_param,
                        "q": f"{venue_name} {clean_city}".strip(),
                    },
                ),
                self._probe_gdelt_and_bluesky_pulse(client, venue_name, clean_city),
                return_exceptions=True,
            )

            if (
                isinstance(r_pb, httpx.Response)
                and r_pb.status_code == 200
                and r_pb.text
                and "consent.google.com" not in str(r_pb.url)
            ):
                obs_current_pct, obs_trading_pct, live_status_text = self._extract_verified_gmaps_histogram(
                    r_pb.text, local_hour
                )

            if not isinstance(pulse_data, dict):
                pulse_data = {
                    "gdelt_articles_14d": 0,
                    "bluesky_posts_14d": 0,
                    "recent_social_posts_14d": 0,
                    "social_media_posts_indexed": 0,
                    "news_articles_indexed": 0,
                    "social_pulse_multiplier": 1.0,
                    "social_highlights": [],
                }

        return {
            "observed_current_hour_occupancy_pct": obs_current_pct,
            "observed_trading_window_occupancy_pct": obs_trading_pct,
            "live_occupancy_status_text": live_status_text,
            **pulse_data,
        }

    async def _measure_live_planetary_physics(self, lat: float, lon: float) -> Dict[str, Any]:
        utc_now = datetime.now(timezone.utc)
        approx_local_dt = utc_now + timedelta(hours=round(lon / 15.0))

        async with httpx.AsyncClient(timeout=5.0, headers=self.headers) as client:
            try:
                params = {
                    "latitude": lat,
                    "longitude": lon,
                    "current": ["is_day", "precipitation", "temperature_2m"],
                    "timezone": "auto",
                }
                res = await client.get(self.meteo_url, params=params)
                if res.status_code == 200:
                    current = res.json().get("current", {})
                    if current:
                        t_str = str(current.get("time") or "")
                        local_hr = approx_local_dt.hour
                        local_wd = approx_local_dt.weekday()
                        if "T" in t_str:
                            try:
                                parsed_dt = datetime.fromisoformat(t_str)
                                local_hr = parsed_dt.hour
                                local_wd = parsed_dt.weekday()
                            except Exception:
                                pass
                        return {
                            "is_day": current.get("is_day", 1) == 1,
                            "local_hour": local_hr,
                            "local_weekday": local_wd,
                            "precipitation_mm": float(current.get("precipitation", 0.0)),
                            "ambient_temperature_c": float(current.get("temperature_2m", 0.0)),
                            "weather_source": "Open-Meteo",
                        }
            except Exception:
                pass

            try:
                r_met = await client.get(
                    self.metno_url, params={"lat": round(lat, 4), "lon": round(lon, 4)}
                )
                if r_met.status_code == 200:
                    ts = r_met.json().get("properties", {}).get("timeseries", [])
                    if ts:
                        inst = ts[0].get("data", {}).get("instant", {}).get("details", {})
                        nxt1 = ts[0].get("data", {}).get("next_1_hours", {}).get("details", {})
                        temp_c = float(inst.get("air_temperature", 0.0))
                        rain_mm = float(nxt1.get("precipitation_amount", 0.0))
                        return {
                            "is_day": 6 <= approx_local_dt.hour <= 18,
                            "local_hour": approx_local_dt.hour,
                            "local_weekday": approx_local_dt.weekday(),
                            "precipitation_mm": rain_mm,
                            "ambient_temperature_c": temp_c,
                            "weather_source": "MET Norway",
                        }
            except Exception:
                pass

        return {
            "is_day": 6 <= approx_local_dt.hour <= 18,
            "local_hour": approx_local_dt.hour,
            "local_weekday": approx_local_dt.weekday(),
            "precipitation_mm": 0.0,
            "ambient_temperature_c": None,
            "weather_source": "UNREACHABLE",
        }

    async def calculate_time_context(
        self,
        lat: float,
        lon: float,
        venue_hint: Optional[str] = None,
        city_hint: Optional[str] = None,
        spatial_snapshot: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        (venue_anchor, venue_addr, active_nodes, snapshot), solar_data = await asyncio.gather(
            self._extract_primary_physical_venue(lat, lon, venue_hint, city_hint, spatial_snapshot),
            self._measure_live_planetary_physics(lat, lon),
        )

        local_hour = int(solar_data.get("local_hour", 12))
        local_weekday = int(solar_data.get("local_weekday", 0))
        rain_mm = float(solar_data.get("precipitation_mm", 0.0) or 0.0)

        observed_states: List[bool] = []
        osm_oh_list = snapshot.get("osm_opening_hours_observed", [])
        osm_evaluated_count = 0
        for oh_str in osm_oh_list:
            ev = _evaluate_osm_opening_hours_string(oh_str, local_weekday, local_hour)
            if ev is not None:
                observed_states.append(ev)
                osm_evaluated_count += 1

        for p in snapshot.get("gmaps_pois", []):
            if p.get("is_open_now") is not None:
                observed_states.append(bool(p["is_open_now"]))
            elif p.get("observed_hours_text"):
                ht = str(p["observed_hours_text"]).lower()
                if "open 24" in ht or ht.startswith("open ") or "closes " in ht:
                    observed_states.append(True)
                elif "closed" in ht or "opens " in ht:
                    observed_states.append(False)

        if observed_states:
            clock_open_ratio: Optional[float] = round(
                sum(1 for st in observed_states if st) / len(observed_states), 3
            )
            schedule_source = (
                f"EMPIRICAL_SCHEDULE ({osm_evaluated_count} OSM opening_hours + "
                f"{len(observed_states) - osm_evaluated_count} GMaps live flags)"
            )
        else:
            clock_open_ratio = None
            schedule_source = "NO_LIVE_SCHEDULE_TAGGED"

        occ_social = await self._probe_live_occupancy_and_social_pulse(
            lat, lon, venue_anchor, city_hint or "", local_hour
        )

        obs_current_occ = occ_social["observed_current_hour_occupancy_pct"]
        obs_trading_occ = occ_social["observed_trading_window_occupancy_pct"]
        social_mult = float(occ_social["social_pulse_multiplier"])
        rain_friction = max(0.50, 1.0 - (rain_mm * 0.038))

        is_occ_observed = (obs_current_occ is not None) or (obs_trading_occ is not None)

        if obs_trading_occ is not None:
            active_window_occupancy = min(100, max(1, int(round(obs_trading_occ * social_mult * rain_friction))))
        elif obs_current_occ is not None:
            active_window_occupancy = min(100, max(1, int(round(obs_current_occ * social_mult * rain_friction))))
        else:
            active_window_occupancy = 0

        if obs_current_occ is not None:
            instant_density_index = min(100, max(0, int(round(obs_current_occ * social_mult * rain_friction))))
        elif clock_open_ratio is not None and active_window_occupancy > 0:
            instant_density_index = int(round(active_window_occupancy * clock_open_ratio))
        else:
            instant_density_index = 0

        if clock_open_ratio is not None:
            operating_state = "OPEN_ACTIVE_TRADING" if clock_open_ratio >= 0.30 else "AFTER_HOURS_CLOSED"
        else:
            operating_state = "DAYLIGHT_TRADING_WINDOW" if solar_data.get("is_day", True) else "NIGHT_CYCLE_UNVERIFIED_HOURS"

        device_data = {
            "live_device_density_index": active_window_occupancy,
            "instantaneous_clock_hour_density_index": instant_density_index,
            "observed_protobuf_occupancy_pct": obs_current_occ,
            "observed_trading_window_occupancy_pct": obs_trading_occ,
            "live_occupancy_status_text": occ_social["live_occupancy_status_text"],
            "is_occupancy_empirically_observed": is_occ_observed,
            "market_operating_state": operating_state,
            "clock_hour_open_merchant_ratio": clock_open_ratio,
            "live_open_merchant_ratio": clock_open_ratio if clock_open_ratio is not None else 0.0,
            "osm_opening_hours_evaluated": osm_evaluated_count,
            "schedule_provenance": schedule_source,
            "live_event_pulse_multiplier": social_mult,
            "gdelt_articles_14d": occ_social["gdelt_articles_14d"],
            "bluesky_posts_14d": occ_social["bluesky_posts_14d"],
            "recent_social_posts_14d": occ_social["recent_social_posts_14d"],
            "social_media_posts_indexed": occ_social["social_media_posts_indexed"],
            "news_articles_indexed": occ_social["news_articles_indexed"],
            "social_highlights": occ_social["social_highlights"],
            "venue_anchor": venue_anchor,
            "provenance": (
                f"Verified GMaps Histogram (Observed={is_occ_observed}) + {schedule_source} + "
                f"GDELT/Bluesky/DDGS 14d Pulse ({occ_social['gdelt_articles_14d']} GDELT, "
                f"{occ_social['bluesky_posts_14d']} Bluesky, {occ_social['news_articles_indexed']} news) + "
                f"{solar_data['weather_source']} ({local_hour:02d}:00 {operating_state})"
            ),
        }

        open_pct_log = f"{int(clock_open_ratio * 100)}%" if clock_open_ratio is not None else "UNVERIFIED"
        logger.info(
            f"⏱️ Empirical Temporal Reality Locked | Venue: {venue_anchor} | "
            f"Observed Occupancy: {obs_current_occ}% now / {obs_trading_occ}% trading (Status: {occ_social['live_occupancy_status_text']}) | "
            f"Clock @ {local_hour:02d}:00 [{operating_state}] Open: {open_pct_log} ({osm_evaluated_count} OSM schedules) | "
            f"14d Event Pulse: {social_mult}x (GDELT: {occ_social['gdelt_articles_14d']}, Bluesky: {occ_social['bluesky_posts_14d']}, News: {occ_social['news_articles_indexed']}) | "
            f"Weather: {solar_data['weather_source']} (Rain: {rain_mm}mm)"
        )

        return {
            "mobile_device_telemetry": device_data,
            "planetary_physics": solar_data,
            "provenance": device_data["provenance"],
        }