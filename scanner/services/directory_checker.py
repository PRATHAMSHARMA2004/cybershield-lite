"""
services/directory_checker.py
Detects:
  1. Directory listing enabled ("Index of /")
  2. robots.txt sensitive Disallow paths — adds them to scan targets
"""

import aiohttp
from loguru import logger
import re

TIMEOUT = aiohttp.ClientTimeout(total=10)
DIR_LISTING_SIGNATURES = ["index of /", "directory listing for", "parent directory"]


async def check_directory_listing(url: str) -> bool:
    """Returns True if directory listing is detected."""
    try:
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(
            connector=connector,
            timeout=TIMEOUT,
            headers={"User-Agent": "CyberShield-Scanner/3.0"},
        ) as session:
            async with session.get(url, allow_redirects=True) as resp:
                text = (await resp.text()).lower()
                return any(sig in text for sig in DIR_LISTING_SIGNATURES)
    except Exception as e:
        logger.error(f"Directory listing check error: {e}")
        return False


async def get_robots_disallow_paths(url: str) -> list[str]:
    """
    Fetches /robots.txt and returns all Disallow paths.
    These are added to the path scan targets.
    """
    from urllib.parse import urlparse
    parsed   = urlparse(url)
    base_url = f"{parsed.scheme}://{parsed.netloc}"
    robots_url = f"{base_url}/robots.txt"

    try:
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(
            connector=connector,
            timeout=TIMEOUT,
            headers={"User-Agent": "CyberShield-Scanner/3.0"},
        ) as session:
            async with session.get(robots_url, allow_redirects=False) as resp:
                if resp.status != 200:
                    return []
                text = await resp.text()

        # Extract Disallow paths
        paths = re.findall(r"^Disallow:\s*(.+)$", text, re.MULTILINE | re.IGNORECASE)
        # Filter out wildcards and blanks, keep real paths
        clean = [p.strip() for p in paths if p.strip() and "*" not in p and p.strip() != "/"]
        return clean[:10]  # Cap at 10 to avoid abuse

    except Exception as e:
        logger.error(f"robots.txt fetch error: {e}")
        return []
