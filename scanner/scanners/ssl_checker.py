import ssl
import socket
from urllib.parse import urlparse
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


def check_ssl(url: str) -> dict:
    """Check SSL certificate validity, issuer, and expiry."""
    parsed = urlparse(url)
    hostname = parsed.hostname

    if not hostname:
        return {"valid": False, "error": "Could not parse hostname from URL"}

    if parsed.scheme != "https":
        return {
            "valid": False,
            "error": "Site does not use HTTPS",
            "issuer": None,
            "expiry_date": None,
            "days_until_expiry": None,
        }

    try:
        context = ssl.create_default_context()
        port = parsed.port or 443

        with socket.create_connection((hostname, port), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()

        # Parse expiry
        expiry_str = cert.get("notAfter")
        expiry_date = datetime.strptime(expiry_str, "%b %d %H:%M:%S %Y %Z").replace(
            tzinfo=timezone.utc
        )
        now = datetime.now(timezone.utc)
        days_until_expiry = (expiry_date - now).days

        # Parse issuer
        issuer_dict = dict(x[0] for x in cert.get("issuer", []))
        issuer = issuer_dict.get("organizationName", issuer_dict.get("commonName", "Unknown"))

        return {
            "valid": True,
            "issuer": issuer,
            "expiry_date": expiry_date.isoformat(),
            "days_until_expiry": days_until_expiry,
            "subject": dict(x[0] for x in cert.get("subject", [])),
        }

    except ssl.SSLCertVerificationError as e:
        return {"valid": False, "error": f"SSL verification failed: {str(e)}"}
    except ssl.SSLError as e:
        return {"valid": False, "error": f"SSL error: {str(e)}"}
    except socket.timeout:
        return {"valid": False, "error": "Connection timed out"}
    except ConnectionRefusedError:
        return {"valid": False, "error": "Connection refused on port 443"}
    except Exception as e:
        logger.error(f"SSL check failed for {hostname}: {e}")
        return {"valid": False, "error": str(e)}
