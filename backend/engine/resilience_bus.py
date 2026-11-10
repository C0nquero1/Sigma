import time
import json
import logging
import asyncio
from typing import Callable, Any, Dict, Optional
import redis

logger = logging.getLogger("StreetAI.ResilienceBus")

class AsyncTokenBucket:
    """Strictly enforces provider rate limits without dropping requests."""
    def __init__(self, rate_per_sec: float, capacity: int = 1):
        self.rate = rate_per_sec
        self.capacity = capacity
        self.tokens = float(capacity)
        self.last_refill = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self) -> bool:
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self.last_refill
            self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
            self.last_refill = now
            if self.tokens >= 1.0:
                self.tokens -= 1.0
                return True
            return False

class EnterpriseResilienceBus:
    """
    100% Physical Reality Resilience Bus.
    Provides Request Coalescing and caching.
    ZERO mathematical extrapolations or fallbacks.
    """
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(EnterpriseResilienceBus, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        if getattr(self, "_initialized", False):
            return
        self._initialized = True

        self._inflight: Dict[str, asyncio.Future] = {}
        self._inflight_lock = asyncio.Lock()
        self._l1_cache: Dict[str, tuple[float, Any]] = {}

        try:
            self.redis = redis.from_url(redis_url, decode_responses=True)
            self.redis.ping()
        except Exception:
            self.redis = None

        self.buckets: Dict[str, AsyncTokenBucket] = {
            "overpass": AsyncTokenBucket(rate_per_sec=1.0, capacity=2),
            "coingecko": AsyncTokenBucket(rate_per_sec=1.0, capacity=2)
        }

    def _get_cache(self, cache_key: str) -> Optional[Any]:
        now = time.time()
        if cache_key in self._l1_cache:
            exp, val = self._l1_cache[cache_key]
            if now < exp:
                return val
            del self._l1_cache[cache_key]

        if self.redis:
            try:
                raw = self.redis.get(f"resilience:cache:{cache_key}")
                if raw is not None:
                    return json.loads(raw)
            except Exception:
                pass
        return None

    def _set_cache(self, cache_key: str, value: Any, ttl_seconds: int):
        now = time.time()
        self._l1_cache[cache_key] = (now + ttl_seconds, value)
        if self.redis:
            try:
                self.redis.setex(f"resilience:cache:{cache_key}", ttl_seconds, json.dumps(value))
            except Exception:
                pass

    async def execute_coalesced(self, cache_key: str, ttl_seconds: int, coro_factory: Callable[[], Any]) -> Any:
        cached = self._get_cache(cache_key)
        if cached is not None:
            return cached

        async with self._inflight_lock:
            if cache_key in self._inflight:
                future = self._inflight[cache_key]
                is_leader = False
            else:
                future = asyncio.get_running_loop().create_future()
                self._inflight[cache_key] = future
                is_leader = True

        if not is_leader:
            return await future

        try:
            result = await coro_factory()
            if result is not None:
                self._set_cache(cache_key, result, ttl_seconds)
            future.set_result(result)
            return result
        except Exception as e:
            if not future.done():
                future.set_exception(e)
            raise e
        finally:
            async with self._inflight_lock:
                self._inflight.pop(cache_key, None)