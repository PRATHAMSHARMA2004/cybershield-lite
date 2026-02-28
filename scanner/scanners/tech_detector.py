import requests
from bs4 import BeautifulSoup
import re
import logging

logger = logging.getLogger(__name__)

TECH_SIGNATURES = {
    "WordPress": [
        (r"wp-content|wp-includes", "html"),
        ("x-powered-by", "WordPress", "header"),
    ],
    "Drupal": [(r"Drupal", "html"), ("x-generator", "Drupal", "header")],
    "Joomla": [(r"/components/com_", "html")],
    "React": [(r"__reactFiber|react-root|_reactListening", "html")],
    "Angular": [(r"ng-version|ng-app", "html")],
    "Vue.js": [(r"vue\.js|__vue__", "html")],
    "jQuery": [(r"jquery", "html")],
    "Bootstrap": [(r"bootstrap\.css|bootstrap\.min\.css", "html")],
    "Nginx": [("server", "nginx", "header")],
    "Apache": [("server", "apache", "header")],
    "PHP": [("x-powered-by", "php", "header")],
    "ASP.NET": [("x-powered-by", "asp.net", "header"), ("x-aspnet-version", None, "header")],
    "Cloudflare": [("cf-ray", None, "header"), ("server", "cloudflare", "header")],
}


def detect_technologies(url: str) -> list[str]:
    """Detect technologies used by the website."""
    detected = set()

    try:
        response = requests.get(
            url,
            timeout=15,
            allow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (compatible; CyberShield/1.0)"},
            verify=False,
        )

        html = response.text.lower()
        headers = {k.lower(): v.lower() for k, v in response.headers.items()}

        for tech, signatures in TECH_SIGNATURES.items():
            for sig in signatures:
                if len(sig) == 2:
                    pattern, source = sig
                    if source == "html" and re.search(pattern, html, re.IGNORECASE):
                        detected.add(tech)
                elif len(sig) == 3:
                    header_name, header_val, source = sig
                    if source == "header" and header_name in headers:
                        if header_val is None or header_val in headers[header_name]:
                            detected.add(tech)

    except Exception as e:
        logger.error(f"Tech detection error: {e}")

    return sorted(list(detected))
