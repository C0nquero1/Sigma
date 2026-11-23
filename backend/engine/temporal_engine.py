import os
import re
import time
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
    100% Real-Life Temporal, OSM Schedule Evaluator, Live Occupancy & Bluesky/Mastodon/GDELT/News Pulse Engine.
    """
    _besttime_unavailable: bool = True
    _bsky_token_cache: Tuple[float, Optional[str]] = (0.0, None)
    _bsky_auth_blocked_until: float = 0.0
    _gdelt_lock: Optional[asyncio.Lock] = None
    _gdelt_last_call: float = 0.0

    def __init__(self, db_ledger=None):
        self.db_ledger = db_ledger
        self.meteo_url = "https://api.open-meteo.com/v1/forecast"
        self.metno_url = "https://api.met.no/weatherapi/locationforecast/2.0/compact"
        self.gdelt_url = "https://api.gdeltproject.org/api/v2/doc/doc"
        self.headers = {"User-Agent": "StreetAI-Temporal-Node/9.6 (https://streetai.io; contact@streetai.io)"}
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
        handle = os.getenv("BSKY_HANDLE", "").strip().lstrip("@")
        app_pw = os.getenv("BSKY_APP_PASSWORD", "").strip()
        if not (handle and app_pw):
            return None
        now = time.time()
        if now < DynamicTemporalEngine._bsky_auth_blocked_until:
            return None
        if self._bsky_token_cache[1] and (now - self._bsky_token_cache[0]) < 3600:
            return self._bsky_token_cache[1]
        try:
            res = await client.post(
                "https://bsky.social/xrpc/com.atproto.server.createSession",
                json={"identifier": handle, "password": app_pw},
                timeout=4.5,
            )
            if res.status_code == 200 and res.json().get("accessJwt"):
                jwt = str(res.json()["accessJwt"])
                DynamicTemporalEngine._bsky_token_cache = (now, jwt)
                return jwt
            if res.status_code in (400, 401, 403):
                DynamicTemporalEngine._bsky_auth_blocked_until = time.time() + 600.0
                logger.warning(
                    f"🛡️ Bluesky login failed (HTTP {res.status_code}): {res.text[:160]} — "
                    "Verify BSKY_HANDLE (no '@') & BSKY_APP_PASSWORD. Cooling down 10m."
                )
        except Exception as e:
            logger.debug(f"Bluesky session pivot: {e}")
        return None

    async def _fetch_gdelt_articles_safe(self, query: str) -> List[Dict[str, Any]]:
        ck = f"gdelt_v1:{query.lower()[:80]}"
        cached = llm_router.get_cached(ck)
        if isinstance(cached, list):
            return cached
        if DynamicTemporalEngine._gdelt_lock is None:
            DynamicTemporalEngine._gdelt_lock = asyncio.Lock()

        async with DynamicTemporalEngine._gdelt_lock:
            elapsed = time.time() - DynamicTemporalEngine._gdelt_last_call
            if elapsed < 3.0:
                await asyncio.sleep(3.0 - elapsed)
            DynamicTemporalEngine._gdelt_last_call = time.time()
            try:
                async with httpx.AsyncClient(timeout=8.5, headers=self.headers) as g_client:
                    res = await g_client.get(
                        self.gdelt_url,
                        params={
                            "query": query,
                            "mode": "artlist",
                            "format": "json",
                            "maxrecords": "15",
                            "timespan": "14d",
                            "sort": "datedesc",
                        },
                    )
                    if res.status_code == 200 and res.text.strip().startswith("{"):
                        arts = res.json().get("articles", []) or []
                        llm_router.set_cached(ck, arts, ttl_seconds=3600)
                        return arts
            except Exception as e:
                logger.debug(f"GDELT fetch pivot: {e}")
        return []

    async def _probe_gdelt_and_bluesky_pulse(
        self, client: httpx.AsyncClient, venue_name: str, clean_city: str
    ) -> Dict[str, Any]:
        highlights: List[str] = []
        cutoff_dt = datetime.now(timezone.utc) - timedelta(days=14)
        cutoff_iso = cutoff_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        clean_v = re.sub(r'["()]', "", venue_name).strip()
        search_phrase = f"{clean_v} {clean_city}".strip()
        gdelt_query = (
            f'"{clean_v}"'
            if len(clean_v.split()) >= 2
            else (f'("{clean_v}" AND "{clean_city}")' if clean_city else f'"{clean_v}"')
        )
        bsky_jwt = await self._get_bluesky_bearer(client)

        tasks: List[Any] = [
            self._fetch_gdelt_articles_safe(gdelt_query),
            llm_router.fast_ddgs_news(f'"{clean_v}" {clean_city}'.strip(), max_results=8, timelimit="m"),
            client.get(
                "https://mastodon.social/api/v2/search",
                params={"q": search_phrase, "type": "statuses", "limit": 15},
                headers={"User-Agent": "StreetAI-Temporal/9.6 (https://streetai.io)"},
                timeout=4.5,
            ),
        ]
        if bsky_jwt:
            tasks.append(
                client.get(
                    "https://bsky.social/xrpc/app.bsky.feed.searchPosts",
                    params={"q": search_phrase, "since": cutoff_iso, "limit": 20},
                    headers={"Authorization": f"Bearer {bsky_jwt}"},
                    timeout=5.0,
                )
            )

        results = await asyncio.gather(*tasks, return_exceptions=True)
        gdelt_articles = results[0] if isinstance(results[0], list) else []
        ddgs_news = results[1] if isinstance(results[1], list) else []
        r_masto = results[2]
        r_bsky = results[3] if len(results) > 3 else None

        for art in gdelt_articles[:2]:
            t = str(art.get("title") or "").strip()
            if t:
                highlights.append(t[:95])

        bsky_posts_14d = 0
        if isinstance(r_bsky, httpx.Response) and r_bsky.status_code == 200:
            try:
                posts = r_bsky.json().get("posts", []) or []
                bsky_posts_14d = len(posts)
                for p in posts[:2]:
                    txt = str((p.get("record") or {}).get("text") or "").strip()
                    if txt and len(highlights) < 5:
                        highlights.append(f"[Bluesky] {txt[:85]}")
            except Exception:
                pass

        masto_posts_14d = 0
        if isinstance(r_masto, httpx.Response) and r_masto.status_code == 200:
            try:
                for st in r_masto.json().get("statuses", []) or []:
                    c_at = str(st.get("created_at") or "")
                    if c_at:
                        try:
                            dt = datetime.fromisoformat(c_at.replace("Z", "+00:00"))
                            if dt >= cutoff_dt:
                                masto_posts_14d += 1
                                if len(highlights) < 5:
                                    clean_c = html.unescape(re.sub(r"<[^>]+>", " ", str(st.get("content") or ""))).strip()
                                    if clean_c:
                                        highlights.append(f"[Mastodon] {clean_c[:85]}")
                        except Exception:
                            pass
            except Exception:
                pass

        ddgs_count = len(ddgs_news)
        for item in ddgs_news[:2]:
            t = item.get("title", "")
            if t and t[:95] not in highlights and len(highlights) < 5:
                highlights.append(t[:95])

        total_social_14d = bsky_posts_14d + masto_posts_14d
        recent_news_count = max(len(gdelt_articles), ddgs_count)
        social_pulse_mult = round(
            min(1.25, 1.0 + (total_social_14d * 0.012) + (recent_news_count * 0.012)),
            3,
        )

        return {
            "gdelt_articles_14d": len(gdelt_articles),
            "bluesky_posts_14d": bsky_posts_14d,
            "mastodon_posts_14d": masto_posts_14d,
            "recent_social_posts_14d": total_social_14d,
            "social_media_posts_indexed": total_social_14d,
            "news_articles_indexed": recent_news_count,
            "social_pulse_multiplier": social_pulse_mult,
            "social_highlights": highlights,
        }

    @staticmethod
    def _extract_verified_gmaps_histogram(raw_pb: str, local_hour: int) -> Tuple[Optional[int], Optional[int], Optional[str]]:
        live_status_text: Optional[str] = None
        m_status = re.search(
            r"\b(As busy as it gets|Busier than usual|A little busy|Usually not too busy|Not too busy|Usually a little busy|Less busy than usual)\b",
            raw_pb,
            flags=re.IGNORECASE,
        )
        if m_status:
            live_status_text = m_status.group(1)

        best_map: Dict[int, int] = {}
        for block_m in re.finditer(r"\[\s*(?:\[\d{1,2},\d{1,3},[^\]]{1,90}\]\s*,?\s*){4,24}\]", raw_pb):
            block_str = block_m.group(0)
            hr_map: Dict[int, int] = {}
            for pair in re.finditer(r"\[(\d{1,2}),(\d{1,3}),", block_str):
                h, pct = int(pair.group(1)), int(pair.group(2))
                if 0 <= h <= 23 and 1 <= pct <= 100:
                    hr_map[h] = pct
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
                logger.warning(f"⚠️ Social/News pulse error: {repr(pulse_data)}")
                pulse_data = {
                    "gdelt_articles_14d": 0,
                    "bluesky_posts_14d": 0,
                    "mastodon_posts_14d": 0,
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

        async with httpx.AsyncClient(timeout=5.5, headers=self.headers) as client:
            try:
                res = await client.get(
                    self.meteo_url,
                    params={
                        "latitude": lat,
                        "longitude": lon,
                        "current": ["is_day", "precipitation", "temperature_2m"],
                        "timezone": "auto",
                    },
                )
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
                r_met = await client.get(self.metno_url, params={"lat": round(lat, 4), "lon": round(lon, 4)})
                if r_met.status_code == 200:
                    ts = r_met.json().get("properties", {}).get("timeseries", [])
                    if ts:
                        inst = ts[0].get("data", {}).get("instant", {}).get("details", {})
                        nxt1 = ts[0].get("data", {}).get("next_1_hours", {}).get("details", {})
                        return {
                            "is_day": 6 <= approx_local_dt.hour <= 18,
                            "local_hour": approx_local_dt.hour,
                            "local_weekday": approx_local_dt.weekday(),
                            "precipitation_mm": float(nxt1.get("precipitation_amount", 0.0)),
                            "ambient_temperature_c": float(inst.get("air_temperature", 0.0)),
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
            "mastodon_posts_14d": occ_social.get("mastodon_posts_14d", 0),
            "recent_social_posts_14d": occ_social["recent_social_posts_14d"],
            "social_media_posts_indexed": occ_social["social_media_posts_indexed"],
            "news_articles_indexed": occ_social["news_articles_indexed"],
            "social_highlights": occ_social["social_highlights"],
            "venue_anchor": venue_anchor,
            "provenance": (
                f"Verified GMaps Histogram (Observed={is_occ_observed}) + {schedule_source} + "
                f"Bluesky/Mastodon/GDELT/DDGS 14d Pulse ({occ_social['gdelt_articles_14d']} GDELT, "
                f"{occ_social['bluesky_posts_14d']} Bluesky, {occ_social.get('mastodon_posts_14d', 0)} Mastodon, "
                f"{occ_social['news_articles_indexed']} news) + {solar_data['weather_source']} ({local_hour:02d}:00 {operating_state})"
            ),
        }

        open_pct_log = f"{int(clock_open_ratio * 100)}%" if clock_open_ratio is not None else "UNVERIFIED"
        logger.info(
            f"⏱️ Empirical Temporal Reality Locked | Venue: {venue_anchor} | "
            f"Observed Occupancy: {obs_current_occ}% now / {obs_trading_occ}% trading (Status: {occ_social['live_occupancy_status_text']}) | "
            f"Clock @ {local_hour:02d}:00 [{operating_state}] Open: {open_pct_log} ({osm_evaluated_count} OSM schedules) | "
            f"14d Event Pulse: {social_mult}x (GDELT: {occ_social['gdelt_articles_14d']}, Bluesky: {occ_social['bluesky_posts_14d']}, "
            f"Mastodon: {occ_social.get('mastodon_posts_14d', 0)}, News: {occ_social['news_articles_indexed']}) | "
            f"Weather: {solar_data['weather_source']} (Rain: {rain_mm}mm)"
        )

        return {
            "mobile_device_telemetry": device_data,
            "planetary_physics": solar_data,
            "provenance": device_data["provenance"],
        }