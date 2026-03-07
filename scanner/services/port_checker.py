"""
services/port_checker.py
Async port scanner — all ports checked concurrently.
"""

import asyncio
from loguru import logger
from urllib.parse import urlparse

# Spec-required ports
PORTS_TO_SCAN   = [21, 22, 23, 25, 80, 443, 3306, 3389, 6379, 8080, 8443, 27017]
CONNECT_TIMEOUT = 2.0


async def _check_port(host: str, port: int) -> int | None:
    try:
        _, writer = await asyncio.wait_for(
            asyncio.open_connection(host, port),
            timeout=CONNECT_TIMEOUT,
        )
        writer.close()
        try: await writer.wait_closed()
        except Exception: pass
        return port
    except Exception:
        return None


async def check_ports(url: str) -> list[int]:
    parsed = urlparse(url)
    host   = parsed.hostname
    if not host:
        return []
    results = await asyncio.gather(
        *[_check_port(host, p) for p in PORTS_TO_SCAN],
        return_exceptions=True,
    )
    return sorted([r for r in results if isinstance(r, int)])
