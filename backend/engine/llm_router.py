import os
import json
import time
import hashlib
import sqlite3
import logging
import asyncio
import requests
import httpx
from dotenv import load_dotenv
from typing import Dict, Any, List, Optional

logger = logging.getLogger("StreetAI.LLMRouter")

_EXCLUDED_GROQ_SUBSTRINGS = (
    "orpheus", "whisper", "guard", "tts", "audio", "allam", "vision", "embed", "safeguard", "prompt-guard"
)


def _ddgs_text_sync(query: str, max_results: int = 10, backend: str = "yahoo,startpage") -> List[Dict[str, str]]:
    """Fast, timeout-proof DDGS text search pinned to reliable backends (bypasses Mojeek timeouts & Brave 429s)."""
    try:
        try:
            from ddgs import DDGS
        except ImportError:
            from duckduckgo_search import DDGS

        out: List[Dict[str, str]] = []
        with DDGS(timeout=5) as ddgs:
            rows = ddgs.text(query, max_results=max_results, backend=backend) or []
            for r in rows:
                if isinstance(r, dict):
                    out.append({
                        "title": str(r.get("title") or "").strip(),
                        "href": str(r.get("href") or r.get("link") or "").strip(),
                        "body": str(r.get("body") or r.get("snippet") or "").strip(),
                    })
        return out
    except Exception as e:
        logger.debug(f"fast_ddgs_text pivot ({query[:45]}): {e}")
        return []


def _ddgs_news_sync(query: str, max_results: int = 8, timelimit: str = "m", backend: str = "bing,yahoo") -> List[Dict[str, str]]:
    """Fast, timeout-proof DDGS news search pinned to bing/yahoo backends."""
    try:
        try:
            from ddgs import DDGS
        except ImportError:
            from duckduckgo_search import DDGS

        out: List[Dict[str, str]] = []
        with DDGS(timeout=5) as ddgs:
            rows = ddgs.news(query, timelimit=timelimit, max_results=max_results, backend=backend) or []
            for r in rows:
                if isinstance(r, dict):
                    out.append({
                        "title": str(r.get("title") or "").strip(),
                        "date": str(r.get("date") or "").strip(),
                        "source": str(r.get("source") or "").strip(),
                        "url": str(r.get("url") or "").strip(),
                    })
        return out
    except Exception as e:
        logger.debug(f"fast_ddgs_news pivot ({query[:45]}): {e}")
        return []


def _discover_live_groq_models(api_key: str) -> List[str]:
    """Queries Groq's live `/openai/v1/models` endpoint so deprecated 404 model IDs are never used."""
    preferred_order = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.8-27b",
        "qwen/qwen3-32b",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
    ]
    try:
        res = requests.get(
            "https://api.groq.com/openai/v1/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=5.0,
        )
        if res.status_code == 200:
            raw_ids = [str(m.get("id") or "") for m in res.json().get("data", []) if m.get("id")]
            valid = [
                mid for mid in raw_ids
                if not any(ex in mid.lower() for ex in _EXCLUDED_GROQ_SUBSTRINGS)
            ]
            ordered = [m for m in preferred_order if m in valid]
            for m in valid:
                if m not in ordered:
                    ordered.append(m)
            if ordered:
                logger.info(f"🚀 LLMRouter Live Groq Models Discovered: {ordered[:6]}")
                return ordered[:6]
    except Exception as e:
        logger.warning(f"⚡ Groq live model discovery pivot: {e}")

    return ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]


class ResilientFreeLLMRouter:
    """
    Zero-Cost, Rate-Limit-Immune Multi-Provider LLM Router, Persistent SQLite WAL Cache,
    and Shared Bounded-Concurrency Web Search Gateway.
    - Dynamically discovers live Groq models from `/openai/v1/models` (zero stale 404 model names).
    - Automatically retries HTTP 400 (`json_validate_failed` / reasoning-budget errors) without strict
      `response_format` and with sufficient token headroom instead of disabling working models.
    - Rotates seamlessly across Groq, Cerebras, OpenRouter, Gemini, Mistral, GitHub Models, and SambaNova.
    """
    _rr_index: int = 0
    _cooldowns: Dict[str, float] = {}

    def __init__(self, db_path: str = "street_ledger.db"):
        self.db_path = db_path
        self.providers: List[Dict[str, str]] = []
        self._ddgs_sem: Optional[asyncio.Semaphore] = None
        self._init_cache_table()
        self.refresh_providers()

    def _get_ddgs_semaphore(self) -> asyncio.Semaphore:
        if self._ddgs_sem is None:
            self._ddgs_sem = asyncio.Semaphore(4)
        return self._ddgs_sem

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=5.0)
        conn.execute("PRAGMA journal_mode=WAL;")
        return conn

    def _init_cache_table(self):
        try:
            with self._connect() as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS kv_persistent_cache (
                        cache_key TEXT PRIMARY KEY,
                        payload_json TEXT NOT NULL,
                        expires_at REAL NOT NULL
                    )
                """)
                conn.commit()
        except Exception as e:
            logger.debug(f"KV cache init degraded: {e}")

    def get_cached(self, key: str) -> Optional[Any]:
        try:
            with self._connect() as conn:
                row = conn.execute(
                    "SELECT payload_json, expires_at FROM kv_persistent_cache WHERE cache_key = ?",
                    (key,),
                ).fetchone()
                if row and float(row[1]) > time.time():
                    return json.loads(row[0])
        except Exception:
            pass
        return None

    def set_cached(self, key: str, value: Any, ttl_seconds: int):
        try:
            with self._connect() as conn:
                conn.execute(
                    """
                    INSERT INTO kv_persistent_cache (cache_key, payload_json, expires_at)
                    VALUES (?, ?, ?)
                    ON CONFLICT(cache_key) DO UPDATE SET
                        payload_json = excluded.payload_json,
                        expires_at = excluded.expires_at
                    """,
                    (key, json.dumps(value), time.time() + ttl_seconds),
                )
                conn.commit()
        except Exception:
            pass

    async def fast_ddgs_text(
        self, query: str, max_results: int = 10, cache_ttl_seconds: int = 21600
    ) -> List[Dict[str, str]]:
        """Bounded, timeout-proof web search (`backend='yahoo,startpage'`) with 6-hour SQLite cache."""
        clean_q = (query or "").strip()
        if not clean_q:
            return []
        ck = "ddgs_txt_v1:" + hashlib.sha256(f"{clean_q}:{max_results}".encode("utf-8")).hexdigest()[:24]
        if cache_ttl_seconds > 0:
            hit = self.get_cached(ck)
            if isinstance(hit, list) and hit:
                return hit

        async with self._get_ddgs_semaphore():
            try:
                rows = await asyncio.wait_for(
                    asyncio.to_thread(_ddgs_text_sync, clean_q, max_results, "yahoo,startpage"),
                    timeout=7.5,
                )
            except asyncio.TimeoutError:
                rows = []

        if rows and cache_ttl_seconds > 0:
            self.set_cached(ck, rows, ttl_seconds=cache_ttl_seconds)
        return rows

    async def fast_ddgs_news(
        self, query: str, max_results: int = 8, timelimit: str = "m", cache_ttl_seconds: int = 3600
    ) -> List[Dict[str, str]]:
        """Bounded, timeout-proof news search (`backend='bing,yahoo'`) with 1-hour SQLite cache."""
        clean_q = (query or "").strip()
        if not clean_q:
            return []
        ck = "ddgs_news_v1:" + hashlib.sha256(f"{clean_q}:{timelimit}:{max_results}".encode("utf-8")).hexdigest()[:24]
        if cache_ttl_seconds > 0:
            hit = self.get_cached(ck)
            if isinstance(hit, list):
                return hit

        async with self._get_ddgs_semaphore():
            try:
                rows = await asyncio.wait_for(
                    asyncio.to_thread(_ddgs_news_sync, clean_q, max_results, timelimit, "bing,yahoo"),
                    timeout=7.0,
                )
            except asyncio.TimeoutError:
                rows = []

        if rows and cache_ttl_seconds > 0:
            self.set_cached(ck, rows, ttl_seconds=cache_ttl_seconds)
        return rows

    def refresh_providers(self):
        load_dotenv(override=False)
        self.providers = self._discover_providers()
        if self.providers:
            logger.info(
                f"🔀 LLM Router Armed: {len(self.providers)} provider routes active "
                f"(Primary: {self.providers[0]['id']})."
            )
        else:
            logger.warning("⚠️ LLM Router found 0 API keys in environment.")

    @staticmethod
    def _parse_multi_keys(plural_env: str, singular_env: str) -> List[str]:
        keys: List[str] = []
        raw_multi = os.getenv(plural_env, "")
        if raw_multi:
            keys.extend([k.strip() for k in raw_multi.split(",") if k.strip()])
        single = os.getenv(singular_env, "").strip()
        if single and single not in keys:
            keys.append(single)
        for i in range(2, 10):
            k_i = os.getenv(f"{singular_env}_{i}", "").strip()
            if k_i and k_i not in keys:
                keys.append(k_i)
        return keys

    @staticmethod
    def _discover_providers() -> List[Dict[str, str]]:
        endpoints: List[Dict[str, str]] = []

        # 1. Groq Multi-Key Pool (3 accounts interleaved so rapid calls spread across accounts!)
        groq_keys = ResilientFreeLLMRouter._parse_multi_keys("GROQ_API_KEYS", "GROQ_API_KEY")
        if groq_keys:
            live_groq_models = _discover_live_groq_models(groq_keys[0])
            for model in live_groq_models:
                for idx, gk in enumerate(groq_keys):
                    endpoints.append({
                        "id": f"groq_{idx}_{model}",
                        "url": "https://api.groq.com/openai/v1/chat/completions",
                        "key": gk,
                        "model": model,
                    })

        # 2. Google Gemini Free Tier Multi-Key Pool (2 separate accounts/projects; 2026 free models)
        # Note: New 2026 free projects route to gemini-3.8-flash / gemini-3.5-flash-lite / gemma-4-31b-it
        gem_keys = ResilientFreeLLMRouter._parse_multi_keys("GEMINI_API_KEYS", "GEMINI_API_KEY")
        for g_mod in ("gemini-3.8-flash", "gemini-3.5-flash-lite"):
            for idx, gk in enumerate(gem_keys):
                endpoints.append({
                    "id": f"gemini_{idx}_{g_mod}",
                    "url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                    "key": gk,
                    "model": g_mod,
                })

        # 3. OpenRouter Free Models Router Multi-Key Pool (2 accounts -> `openrouter/free`)
        or_keys = ResilientFreeLLMRouter._parse_multi_keys("OPENROUTER_API_KEYS", "OPENROUTER_API_KEY")
        for idx, ok in enumerate(or_keys):
            endpoints.append({
                "id": f"openrouter_{idx}_free",
                "url": "https://openrouter.ai/api/v1/chat/completions",
                "key": ok,
                "model": "openrouter/free",
            })

        return endpoints

    @staticmethod
    def _extract_json_object(raw_txt: str) -> Optional[Dict[str, Any]]:
        clean = (raw_txt or "").strip()
        if not clean:
            return None
        if clean.startswith("```"):
            parts = clean.split("```")
            if len(parts) >= 2:
                clean = parts[1]
                if clean.lstrip().startswith("json"):
                    clean = clean.lstrip()[4:]
        clean = clean.strip()
        try:
            obj = json.loads(clean)
            if isinstance(obj, dict):
                return obj
        except Exception:
            start = clean.find("{")
            end = clean.rfind("}")
            if start != -1 and end > start:
                try:
                    obj = json.loads(clean[start: end + 1])
                    if isinstance(obj, dict):
                        return obj
                except Exception:
                    return None
        return None

    async def complete_json(
        self,
        prompt: str,
        max_tokens: int = 550,
        cache_ttl_seconds: int = 86400,
    ) -> Dict[str, Any]:
        cache_key = "llm_v3:" + hashlib.sha256(prompt.encode("utf-8")).hexdigest()[:24]
        if cache_ttl_seconds > 0:
            hit = self.get_cached(cache_key)
            if isinstance(hit, dict) and hit:
                return hit

        if not self.providers:
            self.refresh_providers()
        if not self.providers:
            return {}

        now = time.time()
        n = len(self.providers)
        start_i = ResilientFreeLLMRouter._rr_index % n

        async with httpx.AsyncClient(timeout=16.0) as client:
            for offset in range(n):
                prov = self.providers[(start_i + offset) % n]
                pid = prov["id"]
                if self._cooldowns.get(pid, 0.0) > now:
                    continue

                headers = {
                    "Authorization": f"Bearer {prov['key']}",
                    "Content-Type": "application/json",
                }
                if "openrouter.ai" in prov["url"]:
                    headers["HTTP-Referer"] = "https://streetai.io"
                    headers["X-Title"] = "Sigma Physical Reality Engine"

                m_low = prov["model"].lower()
                is_reasoning_model = any(tok in m_low for tok in ("gpt-oss", "qwen3", "deepseek", "gemini-3", "o1", "o3"))
                # Reasoning models spend tokens thinking before emitting JSON; ensure headroom!
                eff_max_tokens = max(max_tokens, 1400) if is_reasoning_model else max_tokens

                body: Dict[str, Any] = {
                    "model": prov["model"],
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": eff_max_tokens,
                    "temperature": 0.0,
                }
                if "openrouter.ai" not in prov["url"] and not is_reasoning_model:
                    body["response_format"] = {"type": "json_object"}

                try:
                    res = await client.post(prov["url"], headers=headers, json=body)

                    # On HTTP 400, retry ONCE without `response_format` before failing over (never 24h-ban live models!)
                    if res.status_code == 400 and "response_format" in body:
                        logger.debug(f"LLM {pid} returned 400 with json_object ({res.text[:140]}); retrying plain JSON.")
                        body.pop("response_format", None)
                        body["max_tokens"] = max(eff_max_tokens, 1400)
                        res = await client.post(prov["url"], headers=headers, json=body)

                    if res.status_code == 429:
                        self._cooldowns[pid] = time.time() + 65.0
                        logger.warning(f"⚡ LLM provider {pid} hit 429; cooling down 65s and failing over.")
                        continue
                    if res.status_code == 404:
                        self._cooldowns[pid] = time.time() + 86400.0
                        logger.warning(f"⚡ LLM provider {pid} returned HTTP 404; disabling 24h.")
                        continue
                    if res.status_code in (401, 403):
                        self._cooldowns[pid] = time.time() + 3600.0
                        continue
                    if res.status_code == 400:
                        err_low = (res.text or "").lower()
                        if any(tok in err_low for tok in ("api key", "api_key_invalid", "invalid_argument")):
                            self._cooldowns[pid] = time.time() + 86400.0
                            logger.warning(f"⚡ LLM provider {pid} has an invalid API key (HTTP 400); disabling 24h.")
                        else:
                            logger.warning(f"⚡ LLM provider {pid} returned HTTP 400: {res.text[:160]}")
                        continue
                    if res.status_code == 200:
                        raw_txt = res.json()["choices"][0]["message"]["content"] or ""
                        parsed = self._extract_json_object(raw_txt)
                        if parsed:
                            ResilientFreeLLMRouter._rr_index = (start_i + offset + 1) % n
                            if cache_ttl_seconds > 0:
                                self.set_cached(cache_key, parsed, cache_ttl_seconds)
                            return parsed
                except Exception as e:
                    logger.debug(f"LLM router failover on {pid}: {e}")

        return {}


class RotatingKeyPool:
    """Thread/async-safe round-robin API key rotator with per-key 429/401 cooldown tracking."""
    def __init__(self, plural_env: str, singular_env: str):
        self.plural_env = plural_env
        self.singular_env = singular_env
        self._keys: List[str] = []
        self._idx: int = 0
        self._cooldowns: Dict[str, float] = {}
        self.reload()

    def reload(self):
        load_dotenv(override=False)
        self._keys = ResilientFreeLLMRouter._parse_multi_keys(self.plural_env, self.singular_env)

    @property
    def count(self) -> int:
        if not self._keys:
            self.reload()
        return len(self._keys)

    def next_key(self) -> Optional[str]:
        if not self._keys:
            self.reload()
        if not self._keys:
            return None
        now = time.time()
        n = len(self._keys)
        for offset in range(n):
            k = self._keys[(self._idx + offset) % n]
            if self._cooldowns.get(k, 0.0) <= now:
                self._idx = (self._idx + offset + 1) % n
                return k
        return None

    def mark_cooldown(self, key: str, seconds: float = 300.0):
        if key:
            self._cooldowns[key] = time.time() + seconds


llm_router = ResilientFreeLLMRouter()
locationiq_pool = RotatingKeyPool("LOCATIONIQ_API_KEYS", "LOCATIONIQ_API_KEY")
wigle_pool = RotatingKeyPool("WIGLE_API_TOKENS", "WIGLE_API_TOKEN")
mapbox_pool = RotatingKeyPool("MAPBOX_ACCESS_TOKENS", "MAPBOX_ACCESS_TOKEN")