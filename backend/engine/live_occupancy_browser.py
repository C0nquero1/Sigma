import os
import re
import json
import httpx
import logging
import asyncio
from urllib.parse import quote_plus
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Tuple
from engine.llm_router import llm_router
from engine.overture_engine import GOOGLE_CONSENT_COOKIES

logger = logging.getLogger("StreetAI.LiveOccupancyBrowser")


def _load_gmaps_cookies() -> Dict[str, str]:
    """
    Merges Google consent cookies with optional local `GMAPS_COOKIE_HEADER`
    (from a dedicated throwaway account in `.env`) to bypass 2026 signed-out Limited View.
    """
    cookies = dict(GOOGLE_CONSENT_COOKIES)
    raw_hdr = os.getenv("GMAPS_COOKIE_HEADER", "").strip()
    if raw_hdr:
        for part in raw_hdr.split(";"):
            if "=" in part:
                k, v = part.split("=", 1)
                k, v = k.strip(), v.strip()
                if k and v:
                    cookies[k] = v
    return cookies


def _idx(arr: Any, *indices: int) -> Any:
    cur = arr
    for i in indices:
        if isinstance(cur, list) and 0 <= i < len(cur):
            cur = cur[i]
        else:
            return None
    return cur


def _parse_dwell_minutes_any(raw_val: Any) -> Optional[float]:
    if raw_val is None:
        return None
    txt = " ".join(str(x) for x in raw_val if x is not None) if isinstance(raw_val, list) else str(raw_val)
    m = re.search(
        r"(\d+(?:\.\d+)?)\s*(?:(?:-|to|–|—)\s*(\d+(?:\.\d+)?)\s*)?(min(?:ute)?s?|hr?s?|hours?)",
        txt.lower(),
    )
    if not m:
        return None
    v1 = float(m.group(1))
    v2 = float(m.group(2)) if m.group(2) else None
    val = (v1 + v2) / 2.0 if v2 else v1
    mins = val * 60.0 if m.group(3).startswith("h") else val
    return round(mins, 1) if (5.0 <= mins <= 480.0) else None


def _build_gmaps_search_pb(lat: float, lon: float) -> str:
    return (
        f"!4m12!1m3!1d4005.9771522653964!2d{lon:.6f}!3d{lat:.6f}"
        "!2m3!1f0!2f0!3f0!3m2!1i1125!2i976!4f13.1!7i20!10b1"
        "!12m6!2m3!5m1!6e2!20e3!10b1!16b1"
        "!19m3!2m2!1i392!2i106"
        "!20m61!2m2!1i203!2i100!3m2!2i4!5b1"
        "!6m6!1m2!1i86!2i86!1m2!1i408!2i200"
        "!7m46!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e3!2b0!3e3"
        "!1m3!1e4!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e3!2b1!3e2!1m3!1e9!2b1!3e2"
        "!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!2b1!4b1!9b0"
        "!22m6!1sa9fVWea_MsX8adX8j8AE%3A1!2zMWk6Mix0OjExODg3LGU6MSxwOmE5ZlZXZWFfTXNYOGFkWDhqOEFFOjE"
        "!7e81!12e3!17sa9fVWea_MsX8adX8j8AE%3A564!18e15"
        "!24m15!2b1!5m4!2b1!3b1!5b1!6b1!10m1!8e3!17b1!24b1!25b1!26b1!30m1!2b1!36b1"
        "!26m3!2m2!1i80!2i92"
        "!30m28!1m6!1m2!1i0!2i0!2m2!1i458!2i976!1m6!1m2!1i1075!2i0!2m2!1i1125!2i976"
        "!1m6!1m2!1i0!2i0!2m2!1i1125!2i20!1m6!1m2!1i0!2i956!2m2!1i1125!2i976"
        "!37m1!1e81!42b1!47m0!49m1!3b1"
    )


def _build_gmaps_preview_place_pb(ftid: str, lat: float, lon: float) -> str:
    """Full Place Details protobuf mask requesting Popular Times, Live Busyness, Dwell, and Reported Spend."""
    return (
        f"!1m17!1s{ftid}!3m12!1m3!1d3000!2d{lon:.6f}!3d{lat:.6f}"
        "!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!8m2!3d"
        f"{lat:.6f}!4d{lon:.6f}"
        "!12m4!2m3!1i360!2i120!4i8!13m1!1e1!16m1!1e1!17m1!1e1"
    )


def _decode_gmaps_json(raw_text: str) -> Optional[Any]:
    if not raw_text:
        return None
    cleaned = raw_text.split('/*""*/')[0].strip()
    try:
        outer = json.loads(cleaned)
        inner_str = str(outer.get("d") or "") if isinstance(outer, dict) else cleaned
    except Exception:
        inner_str = cleaned
    if inner_str.startswith(")]}'"):
        inner_str = inner_str[4:].lstrip("\r\n")
    try:
        return json.loads(inner_str)
    except Exception:
        return None


def _extract_place_nodes(jdata: Any) -> List[List[Any]]:
    nodes: List[List[Any]] = []
    direct = _idx(jdata, 6)
    if isinstance(direct, list) and len(direct) >= 35:
        nodes.append(direct)
    results_list = _idx(jdata, 0, 1)
    if isinstance(results_list, list):
        for entry in results_list[:5]:
            node = _idx(entry, 14)
            if isinstance(node, list) and len(node) >= 35:
                nodes.append(node)
    return nodes


def _parse_open_badge_string(s: str) -> Optional[bool]:
    low = (s or "").strip().lower().replace("\u202f", " ").replace("\u00a0", " ")
    if not low:
        return None
    if low.startswith(("open 24", "open ", "open·", "open ⋅", "open ·", "closes soon", "closes ")):
        return True
    if low.startswith(("closed", "opens ", "temporarily closed", "permanently closed")):
        return False
    return None


def scan_tree_for_popular_times_and_spend(
    root: Any, target_gmaps_day: int
) -> Dict[str, Any]:
    """
    Index-independent recursive structural scanner for Google Maps Place payloads.
    Automatically locates Popular Times 7-day histograms, live busyness %, dwell strings,
    and shopper-reported spend ranges even when Google shifts array indices off [84]/[117].
    """
    hourly_map: Dict[int, int] = {}
    live_pct: Optional[int] = None
    status_text: Optional[str] = None
    dwell_mins: Optional[float] = None
    reported_spend_ranges: List[Tuple[float, float]] = []
    recent_review_mentions: int = 0

    def _is_hour_bar_list(obj: Any) -> bool:
        if not isinstance(obj, list) or len(obj) < 4 or len(obj) > 24:
            return False
        valid_rows = 0
        for row in obj:
            if (
                isinstance(row, list)
                and len(row) >= 2
                and isinstance(row[0], int)
                and not isinstance(row[0], bool)
                and 0 <= row[0] <= 23
                and isinstance(row[1], (int, float))
                and not isinstance(row[1], bool)
                and 0 <= row[1] <= 100
            ):
                valid_rows += 1
        return valid_rows >= 4

    def _walk(obj: Any, depth: int = 0):
        nonlocal live_pct, status_text, dwell_mins, recent_review_mentions
        if depth > 14:
            return
        if isinstance(obj, str):
            s = obj.replace("\u202f", " ").replace("\u00a0", " ").strip()
            if not s or len(s) > 220:
                return
            low = s.lower()

            if dwell_mins is None and ("typically spend" in low or "spend up to" in low):
                dwell_mins = _parse_dwell_minutes_any(s)

            if live_pct is None and "currently" in low and "busy" in low:
                m_lv = re.search(r"currently\s+(\d{1,3})%\s+busy", low)
                if m_lv:
                    live_pct = min(100, max(0, int(m_lv.group(1))))

            if status_text is None:
                m_st = re.search(
                    r"\b(As busy as it gets|Busier than usual|Usually as busy as it gets|"
                    r"A little busy|Usually a little busy|Not too busy|Usually not too busy|Less busy than usual)\b",
                    s,
                    flags=re.IGNORECASE,
                )
                if m_st:
                    status_text = m_st.group(1)

            # Shopper-reported spend brackets (e.g., "TRY 400–800", "€10–20", "$20–30")
            m_sp = re.search(
                r"(?:reported\s+by\s+\d+|per\s+person|spend)[^\d]{0,16}(\d[\d,.]*)\s*[–—\-]\s*(\d[\d,.]*)",
                low,
            )
            if m_sp:
                try:
                    v1 = float(m_sp.group(1).replace(",", ""))
                    v2 = float(m_sp.group(2).replace(",", ""))
                    if 1.0 <= v1 <= v2 <= 10_000_000.0:
                        reported_spend_ranges.append((v1, v2))
                except ValueError:
                    pass

            if re.search(r"\b(\d+\s+(?:hours?|days?|weeks?)\s+ago|a\s+(?:day|week)\s+ago)\b", low):
                recent_review_mentions += 1
            return

        if isinstance(obj, list):
            # Structural match for 7-day Popular Times block: [[day_1_to_7, [[hr, pct, ...], ...]], ...]
            if not hourly_map and 5 <= len(obj) <= 7 and all(isinstance(d, list) and len(d) >= 2 for d in obj):
                day_ids = [d[0] for d in obj if isinstance(d[0], int) and not isinstance(d[0], bool) and 1 <= d[0] <= 7]
                if len(set(day_ids)) >= 5:
                    day_match = next((d for d in obj if d[0] == target_gmaps_day and _is_hour_bar_list(d[1])), None)
                    if day_match is None:
                        day_match = next((d for d in obj if _is_hour_bar_list(d[1])), None)
                    if day_match:
                        for hr_row in day_match[1]:
                            if isinstance(hr_row, list) and len(hr_row) >= 2 and isinstance(hr_row[0], int):
                                hourly_map[int(hr_row[0])] = int(round(float(hr_row[1])))
                        return

            # Structural match for Popular Times parent wrapper carrying live_pct at [7][1]
            if (
                live_pct is None
                and len(obj) >= 8
                and isinstance(obj[0], list)
                and 5 <= len(obj[0]) <= 7
                and isinstance(obj[7], list)
                and len(obj[7]) >= 2
                and isinstance(obj[7][1], (int, float))
                and not isinstance(obj[7][1], bool)
                and 0 <= obj[7][1] <= 100
            ):
                live_pct = int(round(float(obj[7][1])))

            for item in obj:
                _walk(item, depth + 1)

    _walk(root, 0)
    return {
        "hourly_histogram": hourly_map,
        "observed_live_busyness_pct": live_pct,
        "live_occupancy_status_text": status_text,
        "observed_dwell_minutes": dwell_mins,
        "reported_spend_ranges": reported_spend_ranges[:10],
        "recent_review_mentions": recent_review_mentions,
    }


def _parse_place_node_fields(
    chosen: List[Any], local_hour: int, local_weekday_mon0: int
) -> Dict[str, Any]:
    target_gmaps_day = local_weekday_mon0 + 1
    is_open_now: Optional[bool] = None
    hours_text: Optional[str] = None
    sub_open_states: List[bool] = []

    for path in ((203, 1, 4, 0), (203, 1, 5, 0), (34, 4, 4), (34, 4, 0)):
        val = _idx(chosen, *path)
        if isinstance(val, str) and val.strip():
            state = _parse_open_badge_string(val)
            if state is not None:
                is_open_now = state
                hours_text = val.replace("\u202f", " ").strip()[:80]
                break

    if is_open_now is None:
        for slot in (203, 34):
            raw_slot = _idx(chosen, slot)
            if raw_slot is not None:
                flat = json.dumps(raw_slot, ensure_ascii=False).replace("\u202f", " ")
                m_oh = re.search(
                    r'"((?:Open\s*24\s*hours|Open\s*[·⋅•][^"]{0,30}|Closes\s+soon[^"]{0,25}|Closed\s*[·⋅•][^"]{0,30}|Opens\s+[^"]{0,30}))"',
                    flat,
                    flags=re.IGNORECASE,
                )
                if m_oh:
                    hours_text = m_oh.group(1).strip()[:80]
                    is_open_now = _parse_open_badge_string(hours_text)
                    break

    # Reject bogus crowdsourced "Open 24 hours" tags on traditional markets overnight (21:00–05:00)
    if hours_text and "24 hours" in hours_text.lower() and (local_hour >= 21 or local_hour < 5):
        is_open_now = None

    sub_list = _idx(chosen, 204, 0)
    if isinstance(sub_list, list):
        for sub in sub_list[:15]:
            badge = _idx(sub, 1, 6, 1, 4, 0)
            if isinstance(badge, str):
                st = _parse_open_badge_string(badge)
                if st is not None:
                    sub_open_states.append(st)

    scanned = scan_tree_for_popular_times_and_spend(chosen, target_gmaps_day)
    hourly_map: Dict[int, int] = scanned["hourly_histogram"]
    live_pct: Optional[int] = scanned["observed_live_busyness_pct"]
    status_text: Optional[str] = scanned["live_occupancy_status_text"]
    dwell_mins: Optional[float] = scanned["observed_dwell_minutes"]
    spend_ranges = scanned["reported_spend_ranges"]
    reported_spend_mid = (
        round(sum((a + b) / 2.0 for a, b in spend_ranges) / len(spend_ranges), 2)
        if spend_ranges
        else None
    )

    obs_current = live_pct if live_pct is not None else hourly_map.get(local_hour)
    nonzero_bars = [v for v in hourly_map.values() if v > 0]
    obs_trading = int(round(sum(nonzero_bars) / len(nonzero_bars))) if nonzero_bars else obs_current
    sub_open_ratio = (
        round(sum(1 for s in sub_open_states if s) / len(sub_open_states), 3)
        if sub_open_states
        else None
    )
    verified = any(x is not None for x in (live_pct, obs_current, obs_trading, is_open_now, dwell_mins, reported_spend_mid))

    return {
        "observed_live_busyness_pct": live_pct,
        "observed_current_hour_occupancy_pct": obs_current,
        "observed_trading_window_occupancy_pct": obs_trading,
        "live_occupancy_status_text": status_text,
        "hourly_histogram": hourly_map,
        "is_open_now": is_open_now,
        "observed_hours_text": hours_text,
        "sub_merchants_open_ratio": sub_open_ratio,
        "sub_merchants_observed": len(sub_open_states),
        "observed_dwell_minutes": dwell_mins,
        "reported_spend_midpoint_local": reported_spend_mid,
        "reported_spend_samples": len(spend_ranges),
        "recent_review_mentions": int(scanned["recent_review_mentions"]),
        "browser_verified": verified,
    }


async def _fetch_serpapi_live_popular_times(
    client: httpx.AsyncClient, ftid: str, lat: float, lon: float, local_hour: int, local_wd: int
) -> Dict[str, Any]:
    """
    Optional authenticated fallback via SerpApi `google_maps&type=place` (active ONLY if `SERPAPI_API_KEYS`
    is configured in `.env`). Returns Google's live smartphone `live_hash` + 7-day `graph_results`.
    """
    api_key = serpapi_pool.next_key()
    if not api_key or not ftid:
        return {}
    try:
        data_param = f"!4m5!3m4!1s{ftid}!8m2!3d{lat:.6f}!4d{lon:.6f}"
        r = await client.get(
            "https://serpapi.com/search.json",
            params={"engine": "google_maps", "type": "place", "data": data_param, "hl": "en", "api_key": api_key},
            timeout=8.0,
        )
        if r.status_code == 429:
            serpapi_pool.mark_cooldown(api_key, 3600.0)
            return {}
        if r.status_code != 200:
            return {}
        place = r.json().get("place_results") or {}
        pt = place.get("popular_times") or {}
        live_hash = pt.get("live_hash") or {}
        live_pct = None
        if isinstance(live_hash.get("info"), str):
            m_lv = re.search(r"(\d{1,3})%", live_hash["info"])
            if m_lv:
                live_pct = int(m_lv.group(1))

        days_en = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")
        day_name = days_en[local_wd % 7]
        graph = (pt.get("graph_results") or {}).get(day_name) or []
        hourly_map: Dict[int, int] = {}
        for row in graph:
            if isinstance(row, dict) and row.get("busyness_score") is not None:
                m_t = re.search(r"(\d{1,2})\s*(am|pm)", str(row.get("time") or ""), re.I)
                if m_t:
                    hr = int(m_t.group(1)) % 12 + (12 if m_t.group(2).lower() == "pm" else 0)
                    hourly_map[hr] = int(row["busyness_score"])

        dwell_mins = _parse_dwell_minutes_any(live_hash.get("time_spent"))
        return {
            "observed_live_busyness_pct": live_pct,
            "live_occupancy_status_text": live_hash.get("info"),
            "hourly_histogram": hourly_map,
            "observed_dwell_minutes": dwell_mins,
        }
    except Exception as e:
        logger.debug(f"SerpApi popular_times fallback degraded: {e}")
        return {}


class LiveOccupancyBrowser:
    """
    Sub-Second, Zero-Chromium Google Maps Live Telemetry Engine:
      1. Raw `tbm=map&tch=1` + `/maps/preview/place` with index-independent structural Popular Times scanner.
      2. Extracts Live Busyness %, 7-Day Hourly Histogram, Live Open/Closed Badge, Sub-Merchant Open Ratio,
         Visitor Dwell Time, and Shopper-Reported Spend Brackets.
      3. Supports optional free `GMAPS_COOKIE_HEADER` (throwaway account in `.env`) to bypass 2026 Limited View;
         explicitly sets `limited_view_detected=True` when signed-out Google strips Popular Times.
    """
    _locks: Dict[str, asyncio.Lock] = {}

    @classmethod
    async def fetch_live_place_telemetry(
        cls,
        lat: float,
        lon: float,
        venue_name: str,
        city_hint: str,
        local_hour: int,
    ) -> Dict[str, Any]:
        empty: Dict[str, Any] = {
            "observed_live_busyness_pct": None,
            "observed_current_hour_occupancy_pct": None,
            "observed_trading_window_occupancy_pct": None,
            "live_occupancy_status_text": None,
            "hourly_histogram": {},
            "is_open_now": None,
            "observed_hours_text": None,
            "sub_merchants_open_ratio": None,
            "sub_merchants_observed": 0,
            "observed_dwell_minutes": None,
            "reported_spend_midpoint_local": None,
            "reported_spend_samples": 0,
            "recent_review_mentions": 0,
            "limited_view_detected": False,
            "browser_verified": False,
        }
        clean_v = (venue_name or "").strip()
        clean_c = (city_hint or "").strip()
        if not clean_v:
            return empty

        has_auth_cookie = bool(os.getenv("GMAPS_COOKIE_HEADER", "").strip())
        auth_tag = "auth" if has_auth_cookie else "anon"
        ck = f"gmaps_tch_v4:{auth_tag}:{round(lat, 3)}:{round(lon, 3)}:{clean_v.lower()[:40]}"
        cached = llm_router.get_cached(ck)
        if isinstance(cached, dict):
            return cached

        lock = cls._locks.setdefault(ck, asyncio.Lock())
        async with lock:
            cached2 = llm_router.get_cached(ck)
            if isinstance(cached2, dict):
                return cached2

            approx_dt = datetime.now(timezone.utc) + timedelta(hours=round(lon / 15.0))
            local_wd = approx_dt.weekday()
            query_q = quote_plus(f"{clean_v} {clean_c}".strip())
            pb_search = _build_gmaps_search_pb(lat, lon)
            search_url = f"https://www.google.com/search?tbm=map&tch=1&hl=en&gl=us&ucbcb=1&q={query_q}&pb={pb_search}"

            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
                ),
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": "https://www.google.com/maps",
            }

            result = dict(empty)
            ftid: Optional[str] = None
            try:
                async with httpx.AsyncClient(
                    timeout=7.5,
                    follow_redirects=True,
                    headers=headers,
                    cookies=_load_gmaps_cookies(),
                ) as client:
                    res = await client.get(search_url)
                    if res.status_code == 200 and res.text and "consent.google.com" not in str(res.url):
                        jdata = _decode_gmaps_json(res.text)
                        nodes = _extract_place_nodes(jdata)
                        if nodes:
                            result = _parse_place_node_fields(nodes[0], local_hour, local_wd)
                            result.setdefault("limited_view_detected", False)

                        ftid_m = re.search(r"0x[0-9a-f]+:0x[0-9a-f]+", res.text)
                        ftid = ftid_m.group(0) if ftid_m else None

                        if ftid and (
                            result["observed_current_hour_occupancy_pct"] is None
                            or result["observed_dwell_minutes"] is None
                        ):
                            pb_place = _build_gmaps_preview_place_pb(ftid, lat, lon)
                            place_url = f"https://www.google.com/maps/preview/place?authuser=0&hl=en&gl=us&pb={pb_place}"
                            r2 = await client.get(place_url)
                            if r2.status_code == 200 and len(r2.text) > 500:
                                j2 = _decode_gmaps_json(r2.text)
                                nodes2 = _extract_place_nodes(j2)
                                if nodes2:
                                    p2 = _parse_place_node_fields(nodes2[0], local_hour, local_wd)
                                    for k in (
                                        "observed_live_busyness_pct",
                                        "observed_current_hour_occupancy_pct",
                                        "observed_trading_window_occupancy_pct",
                                        "live_occupancy_status_text",
                                        "is_open_now",
                                        "observed_hours_text",
                                        "observed_dwell_minutes",
                                        "reported_spend_midpoint_local",
                                    ):
                                        if result.get(k) is None and p2.get(k) is not None:
                                            result[k] = p2[k]
                                    if not result["hourly_histogram"] and p2["hourly_histogram"]:
                                        result["hourly_histogram"] = p2["hourly_histogram"]
                                    result["reported_spend_samples"] = max(
                                        result["reported_spend_samples"], p2["reported_spend_samples"]
                                    )
                                    result["recent_review_mentions"] = max(
                                        result["recent_review_mentions"], p2["recent_review_mentions"]
                                    )
                                    result["browser_verified"] = bool(result["browser_verified"] or p2["browser_verified"])

                        # Detect Google's 2026 signed-out Limited View transparently (never fabricate occupancy)
                        if (
                            result["observed_current_hour_occupancy_pct"] is None
                            and not has_auth_cookie
                            and ("limited view" in res.text.lower() or result["is_open_now"] is not None)
                        ):
                            result["limited_view_detected"] = True

                        if result.get("browser_verified"):
                            logger.info(
                                f"📡 GMaps Live Telemetry Locked [{clean_v}]: "
                                f"Live={result['observed_live_busyness_pct']}% | "
                                f"Hr={result['observed_current_hour_occupancy_pct']}% | "
                                f"TradingAvg={result['observed_trading_window_occupancy_pct']}% "
                                f"({len(result['hourly_histogram'])} bars, Status={result['live_occupancy_status_text']}) | "
                                f"OpenNow={result['is_open_now']} ({result['observed_hours_text']}) | "
                                f"SubOpen={result['sub_merchants_open_ratio']} ({result['sub_merchants_observed']}) | "
                                f"SpendMid={result['reported_spend_midpoint_local']} | Dwell={result['observed_dwell_minutes']}m | "
                                f"LimitedView={result['limited_view_detected']}"
                            )
            except Exception as e:
                logger.debug(f"GMaps tch=1 telemetry pivot ({clean_v}): {e}")

            ttl = 1200 if result.get("browser_verified") else 300
            llm_router.set_cached(ck, result, ttl_seconds=ttl)
            return result


live_occupancy_browser = LiveOccupancyBrowser()