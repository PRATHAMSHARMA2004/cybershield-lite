"""
services/ssrf_validator.py
Validates URLs before scanning — blocks SSRF attempts.
Rejects: localhost, 127.x, 10.x, 172.16-31.x, 192.168.x, file://, ftp://
"""

import ipaddress
import socket
import re
from urllib.parse import urlparse


BLOCKED_SCHEMES  = {"file", "ftp", "gopher", "ldap", "dict", "data"}
BLOCKED_HOSTNAMES = {
    "localhost", "127.0.0.1", "0.0.0.0", "::1",
    "metadata.google.internal",  # GCP metadata
    "169.254.169.254",           # AWS metadata
}


def _is_private_ip(hostname: str) -> bool:
    try:
        ip = ipaddress.ip_address(hostname)
        return ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved
    except ValueError:
        # Not an IP — resolve it
        try:
            resolved = socket.gethostbyname(hostname)
            ip       = ipaddress.ip_address(resolved)
            return ip.is_private or ip.is_loopback or ip.is_link_local
        except Exception:
            return False


def validate_url(url: str) -> tuple[bool, str]:
    """
    Returns (is_valid, error_message).
    valid=True means safe to scan.
    """
    if not url or len(url) > 2048:
        return False, "URL is empty or too long"

    # Add scheme if missing
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    try:
        parsed = urlparse(url)
    except Exception:
        return False, "Invalid URL format"

    # Block non-http schemes
    if parsed.scheme in BLOCKED_SCHEMES:
        return False, f"Scheme '{parsed.scheme}' is not allowed"

    if parsed.scheme not in ("http", "https"):
        return False, "Only http and https URLs are allowed"

    hostname = parsed.hostname
    if not hostname:
        return False, "Could not extract hostname from URL"

    # Block known bad hostnames
    if hostname.lower() in BLOCKED_HOSTNAMES:
        return False, f"Scanning internal addresses is not allowed"

    # Block private/internal IPs
    if _is_private_ip(hostname):
        return False, "Scanning private/internal IP ranges is not allowed"

    # Must look like a real domain or IP
    if not re.match(r"^[a-zA-Z0-9.\-]+$", hostname):
        return False, "Invalid hostname"

    return True, ""


def normalize_url(url: str) -> str:
    """Add https:// if scheme missing."""
    if not url.startswith(("http://", "https://")):
        return "https://" + url
    return url
