import requests
import logging

logger = logging.getLogger(__name__)

SECURITY_HEADERS = [
    "Strict-Transport-Security",
    "Content-Security-Policy",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
]


def check_security_headers(url: str) -> dict:
    """Check for presence/absence of important security headers."""
    try:
        response = requests.get(
            url,
            timeout=15,
            allow_redirects=True,
            headers={"User-Agent": "CyberShield-Scanner/1.0"},
            verify=False,  # We check SSL separately
        )
        response_headers = {k.lower(): v for k, v in response.headers.items()}

        missing = []
        present = []

        for header in SECURITY_HEADERS:
            if header.lower() in response_headers:
                present.append(header)
            else:
                missing.append(header)

        # Check for information disclosure
        info_headers = []
        disclosure_headers = ["server", "x-powered-by", "x-aspnet-version", "x-aspnetmvc-version"]
        for h in disclosure_headers:
            if h in response_headers:
                info_headers.append(f"{h}: {response_headers[h]}")

        return {
            "missing": missing,
            "present": present,
            "info_disclosure": info_headers,
            "status_code": response.status_code,
        }

    except requests.exceptions.SSLError:
        return {"missing": SECURITY_HEADERS, "present": [], "info_disclosure": [], "error": "SSL error"}
    except requests.exceptions.ConnectionError as e:
        return {"missing": [], "present": [], "info_disclosure": [], "error": str(e)}
    except requests.exceptions.Timeout:
        return {"missing": [], "present": [], "info_disclosure": [], "error": "Request timed out"}
    except Exception as e:
        logger.error(f"Header check error: {e}")
        return {"missing": [], "present": [], "info_disclosure": [], "error": str(e)}
