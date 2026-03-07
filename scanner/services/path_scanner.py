"""
services/path_scanner.py
Async scanner for exposed sensitive paths.
Checks spec-required paths + any extras from robots.txt.
"""

import aiohttp
import asyncio
from loguru import logger
from urllib.parse import urlparse

# Full path list from spec
DEFAULT_PATHS = [
    ("/.env",          "exposed_env",        "Critical - Secrets exposed"),
    ("/.git/HEAD",     "exposed_git",        "Critical - Source code exposed"),
    ("/admin",         "exposed_admin",      "Medium - Admin panel accessible"),
    ("/login",         "exposed_admin",      "Medium - Login page accessible"),
    ("/wp-admin",      "exposed_admin",      "Medium - WordPress admin exposed"),
    ("/phpmyadmin",    "exposed_phpmyadmin", "High - Database manager exposed"),
    ("/phpinfo.php",   "exposed_phpinfo",    "High - PHP info page exposed"),
    ("/config",        "exposed_config",     "High - Config directory accessible"),
    ("/backup",        "exposed_backup",     "High - Backup directory accessible"),
    ("/backup.zip",    "exposed_backup",     "High - Backup file accessible"),
    ("/backup.sql",    "exposed_backup",     "High - DB backup accessible"),
    ("/.htaccess",     "exposed_htaccess",   "Medium - htaccess accessible"),
]

TIMEOUT = aiohttp.ClientTimeout(total=5)


async def _check_one(base_url: str, path: str, rule_key: str, risk: str) -> dict | None:
    url = base_url.rstrip("/") + path
    try:
        connector = aiohttp.TCPConnector(ssl=False)
        async with aiohttp.ClientSession(
            connector=connector, timeout=TIMEOUT,
            headers={"User-Agent": "CyberShield-Scanner/3.0"},
        ) as session:
            async with session.head(url, allow_redirects=False) as resp:
                if resp.status in (200, 403):
                    return {"path": path, "status": resp.status, "risk": risk, "rule": rule_key}
    except Exception:
        pass
    return None


async def scan_paths(url: str, extra_paths: list[str] = []) -> tuple[list[dict], list[str]]:
    """
    Returns stable tuple: (found_paths, failed_rule_keys)
    extra_paths: from robots.txt disallow list
    """
    parsed   = urlparse(url)
    base_url = f"{parsed.scheme}://{parsed.netloc}"
    found:   list[dict] = []
    rules:   list[str]  = []
    seen:    set[str]   = set()

    # Combine default + robots.txt paths
    all_paths = list(DEFAULT_PATHS)
    for ep in extra_paths[:10]:  # cap robots.txt extras
        if ep not in [p[0] for p in all_paths]:
            all_paths.append((ep, "exposed_admin", "Medium - Path from robots.txt"))

    try:
        tasks   = [_check_one(base_url, p, r, x) for p, r, x in all_paths]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for result in results:
            if result and not isinstance(result, Exception):
                found.append({"path": result["path"], "status": result["status"], "risk": result["risk"]})
                if result["rule"] not in seen:
                    rules.append(result["rule"])
                    seen.add(result["rule"])
    except Exception as e:
        logger.error(f"Path scan error {url}: {e}")

    return found, rules
