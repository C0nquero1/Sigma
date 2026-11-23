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
    """Exact protobuf field-count-verified parameter for `/maps/preview/place` (`!1m14` = 1 + 13)."""
    return (
        f"!1m14!1s{ftid}!3m12!1m3!1d3000!2d{lon:.6f}!3d{lat:.6f}"
        "!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1"
        "!12m4!2m3!1i360!2i120!4i8!13m1!1e1!16m1!1e1!17m1!1e1"
    )


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


def _parse_place_node_fields(
    chosen: List[Any], local_hour: int, local_weekday_mon0: int
) -> Dict[str, Any]:
    """Extracts live open/closed (`[203]`/`[34]`), sub-merchant ratio (`[204]`), Popular Times (`[84]`), and Dwell (`[117]`)."""
    hourly_map: Dict[int, int] = {}
    live_pct: Optional[int] = None
    status_text: Optional[str] = None
    dwell_mins: Optional[float] = None
    is_open_now: Optional[bool] = None
    hours_text: Optional[str] = None
    sub_open_states: List[bool] = []

    # 1. Primary Venue Live Open/Closed Badge (`info[203][1][4][0]` & `info[34]`)
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

    # 2. Sub-Merchant Live Open/Closed Ratio Inside Market (`info[204][0][i][1][6][1][4][0]`)
    sub_list = _idx(chosen, 204, 0)
    if isinstance(sub_list, list):
        for sub in sub_list[:15]:
            badge = _idx(sub, 1, 6, 1, 4, 0)
            if isinstance(badge, str):
                st = _parse_open_badge_string(badge)
                if st is not None:
                    sub_open_states.append(st)

    # 3. Popular Times 7-Day Array (`info[84][0]`) & Live Busyness % (`info[84][7][1]`)
    target_gmaps_day = local_weekday_mon0 + 1
    pop_days = _idx(chosen, 84, 0)
    if isinstance(pop_days, list):
        day_blocks = [d for d in pop_days if isinstance(d, list) and len(d) >= 2]
        matched_day = next((d for d in day_blocks if d[0] == target_gmaps_day and isinstance(d[1], list)), None)
        if matched_day is None:
            matched_day = next((d for d in day_blocks if isinstance(d[1], list) and d[1]), None)
        if matched_day and isinstance(matched_day[1], list):
            for hr_row in matched_day[1]:
                if isinstance(hr_row, list) and len(hr_row) >= 2:
                    h_val, pct_val = hr_row[0], hr_row[1]
                    if isinstance(h_val, int) and isinstance(pct_val, (int, float)) and 0 <= h_val <= 23:
                        hourly_map[h_val] = int(round(pct_val))

    live_pct_raw = _idx(chosen, 84, 7, 1)
    if isinstance(live_pct_raw, (int, float)):
        live_pct = min(100, max(0, int(round(live_pct_raw))))

    for idx_path in ((84, 7, 0), (84, 6), (84, 7, 2)):
        sv = _idx(chosen, *idx_path)
        if isinstance(sv, str) and len(sv.strip()) >= 4:
            status_text = sv.strip()[:60]
            break

    # 4. Visitor Dwell Time (`info[117][0]`)
    dwell_mins = _parse_dwell_minutes_any(_idx(chosen, 117, 0)) or _parse_dwell_minutes_any(_idx(chosen, 117))

    # Fallback: Check full serialized node for live busyness / dwell text if shifted
    if dwell_mins is None or (live_pct is None and not hourly_map):
        flat_node = json.dumps(chosen, ensure_ascii=False)
        if dwell_mins is None:
            m_dw = re.search(r"People typically spend[^\"\\]{3,45}", flat_node, flags=re.IGNORECASE)
            if m_dw:
                dwell_mins = _parse_dwell_minutes_any(m_dw.group(0))
        if status_text is None:
            m_st = re.search(
                r"\b(As busy as it gets|Busier than usual|Usually as busy as it gets|"
                r"A little busy|Usually a little busy|Not too busy|Usually not too busy|Less busy than usual)\b",
                flat_node,
                flags=re.IGNORECASE,
            )
            if m_st:
                status_text = m_st.group(1)

    obs_current = live_pct if live_pct is not None else hourly_map.get(local_hour)
    nonzero_bars = [v for v in hourly_map.values() if v > 0]
    obs_trading = int(round(sum(nonzero_bars) / len(nonzero_bars))) if nonzero_bars else obs_current
    sub_open_ratio = (
        round(sum(1 for s in sub_open_states if s) / len(sub_open_states), 3)
        if sub_open_states
        else None
    )
    verified = any(x is not None for x in (live_pct, obs_current, obs_trading, is_open_now, dwell_mins))

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
        "browser_verified": verified,
    }


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


class LiveOccupancyBrowser:
    """
    Sub-Second, Zero-Chromium Google Maps `tbm=map&tch=1` + `/maps/preview/place` Live Telemetry Engine.
    Uses raw `pb=` URLs (avoiding httpx double-encoding) to lock:
      - Primary Venue Live Open/Closed Badge & Schedule (`info[203]`, `info[34]`)
      - Sub-Merchant Live Open Ratio Inside the Market (`info[204]`)
      - 7-Day Popular Times & Live Smartphone Busyness % (`info[84]`)
      - Observed Visitor Dwell Time (`info[117]`)
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
            "browser_verified": False,
        }
        clean_v = (venue_name or "").strip()
        clean_c = (city_hint or "").strip()
        if not clean_v:
            return empty

        ck = f"gmaps_tch_v2:{round(lat, 3)}:{round(lon, 3)}:{clean_v.lower()[:40]}"
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
            try:
                async with httpx.AsyncClient(
                    timeout=7.5,
                    follow_redirects=True,
                    headers=headers,
                    cookies=GOOGLE_CONSENT_COOKIES,
                ) as client:
                    res = await client.get(search_url)
                    if res.status_code == 200 and res.text and "consent.google.com" not in str(res.url):
                        jdata = _decode_gmaps_json(res.text)
                        nodes = _extract_place_nodes(jdata)
                        if nodes:
                            chosen = next((n for n in nodes if _idx(n, 84) is not None), nodes[0])
                            result = _parse_place_node_fields(chosen, local_hour, local_wd)

                        # Follow-up `/maps/preview/place` on exact FTID if Popular Times or Dwell absent
                        if result["observed_current_hour_occupancy_pct"] is None or result["observed_dwell_minutes"] is None:
                            ftid_m = re.search(r"0x[0-9a-f]+:0x[0-9a-f]+", res.text)
                            if ftid_m:
                                pb_place = _build_gmaps_preview_place_pb(ftid_m.group(0), lat, lon)
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
                                        ):
                                            if result.get(k) is None and p2.get(k) is not None:
                                                result[k] = p2[k]
                                        if not result["hourly_histogram"] and p2["hourly_histogram"]:
                                            result["hourly_histogram"] = p2["hourly_histogram"]
                                        result["browser_verified"] = bool(result["browser_verified"] or p2["browser_verified"])

                        if result.get("browser_verified"):
                            logger.info(
                                f"📡 GMaps Live Telemetry Locked [{clean_v}]: "
                                f"Live={result['observed_live_busyness_pct']}% | "
                                f"Hr={result['observed_current_hour_occupancy_pct']}% | "
                                f"TradingAvg={result['observed_trading_window_occupancy_pct']}% "
                                f"({len(result['hourly_histogram'])} bars, Status={result['live_occupancy_status_text']}) | "
                                f"OpenNow={result['is_open_now']} ({result['observed_hours_text']}) | "
                                f"SubOpen={result['sub_merchants_open_ratio']} ({result['sub_merchants_observed']}) | "
                                f"Dwell={result['observed_dwell_minutes']}m"
                            )
            except Exception as e:
                logger.debug(f"GMaps tch=1 telemetry pivot ({clean_v}): {e}")

            ttl = 1200 if result.get("browser_verified") else 300
            llm_router.set_cached(ck, result, ttl_seconds=ttl)
            return result


live_occupancy_browser = LiveOccupancyBrowser()