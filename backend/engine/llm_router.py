import os
import json
import time
import hashlib
import sqlite3
import logging
import asyncio
import httpx
from dotenv import load_dotenv
from typing import Dict, Any, List, Optional

logger = logging.getLogger("StreetAI.LLMRouter")


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


class ResilientFreeLLMRouter:
    """
    Zero-Cost, Rate-Limit-Immune Multi-Provider LLM Router, Persistent SQLite WAL Cache,
    and Shared Bounded-Concurrency Web Search Gateway.
    - Uses verified active Groq production models (`llama-3.3-70b-versatile`, `qwen/qwen3-32b`,
      `openai/gpt-oss-120b`, `llama-3.1-8b-instant`) and immediately cools down 400/404/429 endpoints.
    - Rotates seamlessly across Groq, Cerebras, OpenRouter, Gemini, Mistral, GitHub Models, and SambaNova.
    - Centralizes `ddgs` search behind a bounded semaphore + 6-hour SQLite cache so scans never stampede or time out.
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
    def _discover_providers() -> List[Dict[str, str]]:
        endpoints: List[Dict[str, str]] = []

        # 1. Groq Multi-Key Pool (Verified Active 2026 Production Models — zero dead 404 IDs!)
        groq_keys: List[str] = []
        multi = os.getenv("GROQ_API_KEYS", "")
        if multi:
            groq_keys.extend([k.strip() for k in multi.split(",") if k.strip()])
        primary = os.getenv("GROQ_API_KEY", "").strip()
        if primary and primary not in groq_keys:
            groq_keys.append(primary)
        for i in range(2, 10):
            k_i = os.getenv(f"GROQ_API_KEY_{i}", "").strip()
            if k_i and k_i not in groq_keys:
                groq_keys.append(k_i)

        for idx, gk in enumerate(groq_keys):
            for model in (
                "llama-3.3-70b-versatile",
                "qwen/qwen3-32b",
                "openai/gpt-oss-120b",
                "llama-3.1-8b-instant",
            ):
                endpoints.append({
                    "id": f"groq_{idx}_{model}",
                    "url": "https://api.groq.com/openai/v1/chat/completions",
                    "key": gk,
                    "model": model,
                })

        # 2. Cerebras Free Tier
        cer_key = os.getenv("CEREBRAS_API_KEY", "").strip()
        if cer_key:
            endpoints.append({
                "id": "cerebras_llama33_70b",
                "url": "https://api.cerebras.ai/v1/chat/completions",
                "key": cer_key,
                "model": "llama-3.3-70b",
            })

        # 3. OpenRouter Free Models Router
        or_key = os.getenv("OPENROUTER_API_KEY", "").strip()
        if or_key:
            endpoints.append({
                "id": "openrouter_free",
                "url": "https://openrouter.ai/api/v1/chat/completions",
                "key": or_key,
                "model": "openrouter/free",
            })

        # 4. Google Gemini OpenAI-Compatible Free Tier
        gem_key = os.getenv("GEMINI_API_KEY", "").strip()
        if gem_key:
            endpoints.append({
                "id": "gemini_flash",
                "url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                "key": gem_key,
                "model": "gemini-2.5-flash",
            })

        # 5. Mistral Experiment Free Tier
        mis_key = os.getenv("MISTRAL_API_KEY", "").strip()
        if mis_key:
            endpoints.append({
                "id": "mistral_small",
                "url": "https://api.mistral.ai/v1/chat/completions",
                "key": mis_key,
                "model": "mistral-small-latest",
            })

        # 6. GitHub Models Free Tier
        gh_key = os.getenv("GITHUB_TOKEN", "").strip()
        if gh_key:
            endpoints.append({
                "id": "github_models",
                "url": "https://models.inference.ai.azure.com/chat/completions",
                "key": gh_key,
                "model": "gpt-4o-mini",
            })

        # 7. SambaNova Free Tier
        sn_key = os.getenv("SAMBANOVA_API_KEY", "").strip()
        if sn_key:
            endpoints.append({
                "id": "sambanova_llama33",
                "url": "https://api.sambanova.ai/v1/chat/completions",
                "key": sn_key,
                "model": "Meta-Llama-3.3-70B-Instruct",
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

        async with httpx.AsyncClient(timeout=14.0) as client:
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

                body: Dict[str, Any] = {
                    "model": prov["model"],
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": max_tokens,
                    "temperature": 0.0,
                }
                if "openrouter.ai" not in prov["url"] and "qwen3" not in prov["model"]:
                    body["response_format"] = {"type": "json_object"}

                try:
                    res = await client.post(prov["url"], headers=headers, json=body)
                    if res.status_code == 429:
                        self._cooldowns[pid] = time.time() + 65.0
                        logger.warning(f"⚡ LLM provider {pid} hit 429; cooling down 65s and failing over.")
                        continue
                    if res.status_code in (400, 404):
                        self._cooldowns[pid] = time.time() + 86400.0
                        logger.warning(f"⚡ LLM provider {pid} returned HTTP {res.status_code}; disabling 24h.")
                        continue
                    if res.status_code in (401, 403):
                        self._cooldowns[pid] = time.time() + 3600.0
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


llm_router = ResilientFreeLLMRouter()