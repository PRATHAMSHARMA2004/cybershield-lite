"""
services/header_checker.py
Async security header checker using aiohttp.
"""

import aiohttp
import logging
from models.response_models import HeadersInfo

logger = logging.getLogger(__name__)

SECURITY_HEADERS = [
    "Strict-Transport-Security",
    "Content-Security-Policy",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
]
DISCLOSURE_HEADERS = ["server", "x-powered-by", "x-aspnet-version"]
TIMEOUT = aiohttp.ClientTimeout(total=10)  # BUG4 FIX: explicit timeout


async def check_headers(url: str) -> HeadersInfo:
    try:
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(
            connector=connector,
            timeout=TIMEOUT,
            headers={"User-Agent": "CyberShield-Scanner/2.0"},
        ) as session:
            async with session.get(url, allow_redirects=True, max_redirects=5) as resp:
                h = {k.lower(): v for k, v in resp.headers.items()}

        present    = [x for x in SECURITY_HEADERS if x.lower() in h]
        missing    = [x for x in SECURITY_HEADERS if x.lower() not in h]
        disclosure = [f"{x}: {h[x]}" for x in DISCLOSURE_HEADERS if x in h]
        return HeadersInfo(present=present, missing=missing, info_disclosure=disclosure)

    except aiohttp.ClientConnectorError:
        logger.warning(f"Could not connect to {url} for header check")
        return HeadersInfo(missing=SECURITY_HEADERS, present=[], info_disclosure=[])
    except Exception as e:
        logger.error(f"Header check error {url}: {e}")
        return HeadersInfo(missing=SECURITY_HEADERS, present=[], info_disclosure=[])
