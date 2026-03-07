"""
services/tech_detector.py
Async technology fingerprinting via HTML patterns + response headers.
"""

import aiohttp
import asyncio
import re
import logging

logger  = logging.getLogger(__name__)
TIMEOUT = aiohttp.ClientTimeout(total=10)  # BUG4 FIX: explicit timeout

TECH_SIGNATURES = {
    "WordPress":  [("html", r"wp-content|wp-includes"), ("header", "x-powered-by", "wordpress")],
    "Drupal":     [("html", r"drupal"),                 ("header", "x-generator", "drupal")],
    "Joomla":     [("html", r"/components/com_")],
    "React":      [("html", r"__reactfiber|react-root|_reactlistening")],
    "Angular":    [("html", r"ng-version|ng-app")],
    "Vue.js":     [("html", r"vue\.js|__vue__")],
    "jQuery":     [("html", r"jquery")],
    "Bootstrap":  [("html", r"bootstrap\.css|bootstrap\.min\.css")],
    "Nginx":      [("header", "server", "nginx")],
    "Apache":     [("header", "server", "apache")],
    "PHP":        [("header", "x-powered-by", "php")],
    "ASP.NET":    [("header", "x-powered-by", "asp.net"), ("header", "x-aspnet-version", None)],
    "Cloudflare": [("header", "cf-ray", None),            ("header", "server", "cloudflare")],
    "Next.js":    [("header", "x-powered-by", "next.js"), ("html", r"__next_data__")],
    "Vercel":     [("header", "x-vercel-id", None)],
}


async def detect_technologies(url: str) -> list[str]:
    detected: set[str] = set()
    try:
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(
            connector=connector,
            timeout=TIMEOUT,
            headers={"User-Agent": "Mozilla/5.0 (compatible; CyberShield/2.0)"},
        ) as session:
            async with session.get(url, allow_redirects=True, max_redirects=5) as resp:
                html    = (await resp.text()).lower()
                headers = {k.lower(): v.lower() for k, v in resp.headers.items()}

        for tech, sigs in TECH_SIGNATURES.items():
            for sig in sigs:
                if sig[0] == "html":
                    if re.search(sig[1], html, re.IGNORECASE):
                        detected.add(tech)
                elif sig[0] == "header":
                    h_name = sig[1]
                    h_val  = sig[2] if len(sig) > 2 else None
                    if h_name in headers:
                        if h_val is None or h_val in headers[h_name]:
                            detected.add(tech)

    except Exception as e:
        logger.error(f"Tech detection error {url}: {e}")

    return sorted(detected)
