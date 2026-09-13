"""Асинхронный token bucket.

Правовой контур: клиент провайдера обёрнут в этот лимитер, поэтому лимит запросов не
может быть превышен физически — запрос не выпускается, пока не набрался токен.
"""

import asyncio
import time


class TokenBucket:
    def __init__(self, rate_per_sec: float, burst: int) -> None:
        self._rate = rate_per_sec
        self._capacity = float(burst)
        self._tokens = float(burst)
        self._updated = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self) -> None:
        async with self._lock:
            while True:
                now = time.monotonic()
                elapsed = now - self._updated
                self._updated = now
                self._tokens = min(self._capacity, self._tokens + elapsed * self._rate)
                if self._tokens >= 1.0:
                    self._tokens -= 1.0
                    return
                # ждём, пока набежит один токен
                need = (1.0 - self._tokens) / self._rate
                await asyncio.sleep(need)
