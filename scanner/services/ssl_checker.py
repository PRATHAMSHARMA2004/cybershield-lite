"""
services/ssl_checker.py
Async SSL checker — blocking socket calls run in executor thread.
"""

import ssl
import socket
import asyncio
import logging
import urllib.request
from urllib.parse import urlparse
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

SOCKET_TIMEOUT = 8  # seconds


def _check_ssl_sync(url: str) -> dict:
    parsed   = urlparse(url)
    hostname = parsed.hostname

    if not hostname:
        return {"valid": False, "error": "Could not parse hostname"}

    if parsed.scheme != "https":
        return {"valid": False, "error": "Site does not use HTTPS"}

    try:
        context = ssl.create_default_context()
        port    = parsed.port or 443

        with socket.create_connection((hostname, port), timeout=SOCKET_TIMEOUT) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()

        expiry_str = cert.get("notAfter")
        expiry_dt  = datetime.strptime(expiry_str, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
        days_left  = (expiry_dt - datetime.now(timezone.utc)).days
        issuer     = dict(x[0] for x in cert.get("issuer", []))
        issuer_name = issuer.get("organizationName", issuer.get("commonName", "Unknown"))

        return {
            "valid":             True,
            "issuer":            issuer_name,
            "expiry_date":       expiry_dt.isoformat(),
            "days_until_expiry": days_left,
        }

    except ssl.SSLCertVerificationError as e:
        return {"valid": False, "error": f"Certificate verification failed: {e}"}
    except ssl.SSLError as e:
        return {"valid": False, "error": f"SSL error: {e}"}
    except socket.timeout:
        return {"valid": False, "error": "Connection timed out"}
    except ConnectionRefusedError:
        return {"valid": False, "error": "Connection refused on port 443"}
    except Exception as e:
        logger.error(f"SSL check failed for {url}: {e}")
        return {"valid": False, "error": str(e)}


def _check_https_redirect_sync(url: str) -> bool:
    parsed   = urlparse(url)
    http_url = f"http://{parsed.netloc}{parsed.path}" if parsed.scheme == "https" else url
    try:
        req  = urllib.request.Request(http_url, headers={"User-Agent": "CyberShield-Scanner/2.0"}, method="HEAD")
        resp = urllib.request.urlopen(req, timeout=6)
        return resp.url.startswith("https://")
    except Exception:
        return False


async def check_ssl(url: str) -> dict:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _check_ssl_sync, url)


async def check_https_redirect(url: str) -> bool:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _check_https_redirect_sync, url)
