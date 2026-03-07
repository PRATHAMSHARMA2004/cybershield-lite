"""
services/cookie_checker.py
Async cookie security checker.
Checks: Secure flag, HttpOnly flag, SameSite flag.
"""

import aiohttp
import logging
from loguru import logger

TIMEOUT = aiohttp.ClientTimeout(total=10)


async def check_cookies(url: str) -> dict:
    """
    Returns:
    {
        "cookies_found": bool,
        "secure": bool,        # All cookies have Secure flag
        "httponly": bool,      # All cookies have HttpOnly flag
        "samesite": bool,      # All cookies have SameSite flag
        "issues": [...]        # List of specific cookie problems
    }
    """
    result = {
        "cookies_found": False,
        "secure":        True,
        "httponly":      True,
        "samesite":      True,
        "issues":        [],
    }

    try:
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(
            connector=connector,
            timeout=TIMEOUT,
            headers={"User-Agent": "CyberShield-Scanner/3.0"},
        ) as session:
            async with session.get(url, allow_redirects=True, max_redirects=5) as resp:
                raw_cookies = resp.headers.getall("Set-Cookie", [])

        if not raw_cookies:
            result["cookies_found"] = False
            return result

        result["cookies_found"] = True

        for cookie in raw_cookies:
            cookie_lower = cookie.lower()
            name         = cookie.split("=")[0].strip()

            if "secure" not in cookie_lower:
                result["secure"] = False
                result["issues"].append(f"Cookie '{name}' missing Secure flag")

            if "httponly" not in cookie_lower:
                result["httponly"] = False
                result["issues"].append(f"Cookie '{name}' missing HttpOnly flag")

            if "samesite" not in cookie_lower:
                result["samesite"] = False
                result["issues"].append(f"Cookie '{name}' missing SameSite flag")

        return result

    except Exception as e:
        logger.error(f"Cookie check error {url}: {e}")
        return result
