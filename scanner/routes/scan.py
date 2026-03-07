import asyncio
import time
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException
from loguru import logger

from models.response_models import (
    ScanRequest, ScanResponse, SSLInfo, HeadersInfo,
    CookieInfo, DNSInfo, ExposedPath, IssuesBySeverity, RiskLevel
)

from services.ssl_checker import check_ssl, check_https_redirect
from services.header_checker import check_headers
from services.port_checker import check_ports
from services.path_scanner import scan_paths
from services.tech_detector import detect_technologies
from services.cookie_checker import check_cookies
from services.dns_checker import check_dns
from services.directory_checker import check_directory_listing, get_robots_disallow_paths
from services.scoring_engine import calculate_score, get_risk_level
from services.ssrf_validator import validate_url, normalize_url

router = APIRouter()

SCAN_TIMEOUT = 30
SCAN_CONCURRENCY = asyncio.Semaphore(5)

DANGEROUS_PORT_RULES = {
    21: "port_ftp",
    23: "port_telnet",
    3306: "port_mysql",
    3389: "port_rdp",
    6379: "port_redis",
    27017: "port_mongodb",
}

HEADER_RULE_MAP = {
    "Strict-Transport-Security": "missing_hsts",
    "Content-Security-Policy": "missing_csp",
    "X-Frame-Options": "missing_x_frame",
    "X-Content-Type-Options": "missing_x_content_type",
    "Referrer-Policy": "missing_referrer_policy",
    "Permissions-Policy": "missing_permissions_policy",
}


@router.post("/scan")
async def scan_website(request: ScanRequest):

    raw_url = request.url.strip()
    start_ms = int(time.time() * 1000)

    url = normalize_url(raw_url)

    valid, err = validate_url(url)
    if not valid:
        raise HTTPException(status_code=400, detail=err)

    domain = urlparse(url).hostname or url

    logger.info(f"scan_started domain={domain}")

    try:

        # robots.txt
        try:
            robots_paths = await asyncio.wait_for(
                get_robots_disallow_paths(url),
                timeout=5
            )
        except Exception:
            robots_paths = []

        # parallel checks
        async with SCAN_CONCURRENCY:

            results = await asyncio.wait_for(
                asyncio.gather(
                    check_ssl(url),
                    check_https_redirect(url),
                    check_headers(url),
                    check_ports(domain),
                    scan_paths(url, extra_paths=robots_paths),
                    detect_technologies(url),
                    check_cookies(url),
                    check_dns(domain),
                    check_directory_listing(url),
                    return_exceptions=True
                ),
                timeout=SCAN_TIMEOUT
            )

        ssl_res, https_ok, headers_res, ports, path_data, techs, cookies_res, dns_res, dir_listing = results

        paths, path_rules = path_data if not isinstance(path_data, Exception) else ([], [])

        if isinstance(headers_res, Exception):
            headers_res = HeadersInfo()

        if isinstance(ports, Exception):
            ports = []

        if isinstance(cookies_res, Exception):
            cookies_res = {"cookies_found": False}

        if isinstance(dns_res, Exception):
            dns_res = {}

        failed = []
        evidences = {}

        # SSL
        if isinstance(ssl_res, Exception):

            failed.append("ssl_invalid")

        elif isinstance(ssl_res, dict):

            if ssl_res.get("valid") is False:

                failed.append("ssl_invalid")
                evidences["ssl_invalid"] = ssl_res.get("error", "Invalid SSL")

            else:

                days = ssl_res.get("days_until_expiry", 999)

                if days < 7:
                    failed.append("ssl_expiring_critical")

                elif days < 30:
                    failed.append("ssl_expiring_soon")

        # HTTPS redirect
        if https_ok is False:
            failed.append("no_https_redirect")

        # Headers
        missing_headers = headers_res.missing if hasattr(headers_res, "missing") else []

        for header, rule in HEADER_RULE_MAP.items():

            if header in missing_headers:
                failed.append(rule)

        if getattr(headers_res, "info_disclosure", None):
            failed.append("server_info_disclosure")

        # Ports
        for port in ports:

            rule = DANGEROUS_PORT_RULES.get(port)

            if rule:
                failed.append(rule)

        # Paths
        for rule in path_rules:
            failed.append(rule)

        # Cookies
        if cookies_res.get("cookies_found"):

            if not cookies_res.get("secure"):
                failed.append("cookie_no_secure")

            if not cookies_res.get("httponly"):
                failed.append("cookie_no_httponly")

            if not cookies_res.get("samesite"):
                failed.append("cookie_no_samesite")

        # DNS
        if isinstance(dns_res, dict):

            if dns_res.get("spf") == False:
                failed.append("missing_spf")

            if dns_res.get("dmarc") == False:
                failed.append("missing_dmarc")

        # Directory listing
        if dir_listing:
            failed.append("directory_listing")

        # remove duplicates safely
        failed = list(dict.fromkeys(failed))

        # score calculation
        score, issues, recs = calculate_score(failed, evidences)

        risk = get_risk_level(score)

        elapsed = int(time.time() * 1000) - start_ms

        resp = ScanResponse(
            domain=domain,
            score=score,
            risk_level=risk,
            scan_time_ms=elapsed,
            ssl=SSLInfo(**ssl_res) if isinstance(ssl_res, dict) else None,
            headers=headers_res,
            cookies=CookieInfo(**cookies_res) if cookies_res else None,
            dns=DNSInfo(**dns_res) if dns_res else None,
            open_ports=ports,
            exposed_paths=[ExposedPath(**p) if isinstance(p, dict) else p for p in paths],
            technologies=techs,
            issues=issues,
            recommendations=recs
        )

        return resp.model_dump()

    except Exception as e:

        logger.error(f"scan_failed {domain} {e}")

        return {
            "domain": domain,
            "score": 0,
            "risk_level": RiskLevel.HIGH,
            "scan_time_ms": int(time.time() * 1000) - start_ms,
            "issues": IssuesBySeverity().model_dump(),
            "recommendations": [str(e)],
            "open_ports": [],
            "technologies": [],
            "exposed_paths": []
        }