from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import logging
import platform
import sys
import time
from datetime import datetime, timezone
from typing import Optional

from scanners.ssl_checker import check_ssl
from scanners.header_checker import check_security_headers
from scanners.port_scanner import scan_ports
from scanners.tech_detector import detect_technologies
from scanners.phishing_analyzer import analyze_phishing_email
from utils.score_calculator import calculate_security_score

# ── Structured logging ────────────────────────────────────────────────────────
import json, os

class JSONFormatter(logging.Formatter):
    def format(self, record):
        return json.dumps({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level":     record.levelname,
            "message":   record.getMessage(),
            "service":   "cybershield-scanner",
        })

class PrettyFormatter(logging.Formatter):
    def format(self, record):
        return f"{datetime.now().strftime('%H:%M:%S')} [{record.levelname}] {record.getMessage()}"

handler = logging.StreamHandler()
is_prod = os.getenv("NODE_ENV") == "production"
handler.setFormatter(JSONFormatter() if is_prod else PrettyFormatter())

logging.basicConfig(level=logging.INFO, handlers=[handler])
logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
START_TIME = time.time()

app = FastAPI(title="CyberShield Scanner", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class ScanRequest(BaseModel):
    url: str
    scan_id: Optional[str] = None


class PhishingRequest(BaseModel):
    email_content: str


# ── Health endpoint ───────────────────────────────────────────────────────────
# Returns service status, uptime, Python version, and capability list.
# Used by Docker health checks, backend ping, and uptime monitors.
@app.get("/health")
def health():
    uptime_seconds = round(time.time() - START_TIME)
    return {
        "status":    "ok",
        "service":   "cybershield-scanner",
        "version":   "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime":    f"{uptime_seconds}s",
        "runtime": {
            "python":   sys.version.split()[0],
            "platform": platform.system(),
        },
        "capabilities": [
            "ssl_check",
            "security_headers",
            "port_scan",
            "tech_detection",
            "phishing_analysis",
        ],
    }


@app.post("/scan")
async def scan_website(request: ScanRequest):
    url = request.url.strip()
    logger.info(f"Starting scan for: {url}")

    vulnerabilities = []
    ssl_info = None
    headers_result = {"missing": [], "present": []}
    open_ports = []
    technologies = []

    # 1. SSL Check
    try:
        ssl_info = check_ssl(url)
        if not ssl_info.get("valid"):
            vulnerabilities.append({
                "title": "SSL Certificate Invalid or Missing",
                "description": "The website does not have a valid SSL/TLS certificate.",
                "severity": "high",
                "category": "SSL/TLS",
                "recommendation": "Install a valid SSL certificate from a trusted CA (e.g., Let's Encrypt).",
                "evidence": ssl_info.get("error", ""),
            })
        elif ssl_info.get("days_until_expiry", 999) < 30:
            vulnerabilities.append({
                "title": "SSL Certificate Expiring Soon",
                "description": f"SSL certificate expires in {ssl_info['days_until_expiry']} days.",
                "severity": "medium",
                "category": "SSL/TLS",
                "recommendation": "Renew your SSL certificate immediately.",
                "evidence": f"Expiry: {ssl_info.get('expiry_date')}",
            })
    except Exception as e:
        logger.error(f"SSL check error: {e}")

    # 2. Security Headers
    try:
        headers_result = check_security_headers(url)
        for missing_header in headers_result.get("missing", []):
            severities = {
                "Strict-Transport-Security": "high",
                "Content-Security-Policy": "high",
                "X-Frame-Options": "medium",
                "X-Content-Type-Options": "medium",
                "Referrer-Policy": "low",
                "Permissions-Policy": "low",
            }
            vulns_map = {
                "Strict-Transport-Security": (
                    "Missing HSTS Header",
                    "Without HSTS, browsers may connect over HTTP first, enabling downgrade attacks.",
                    "Add 'Strict-Transport-Security: max-age=31536000; includeSubDomains' to server config.",
                ),
                "Content-Security-Policy": (
                    "Missing Content-Security-Policy Header",
                    "Without CSP, the site is vulnerable to Cross-Site Scripting (XSS) attacks.",
                    "Define a strict Content-Security-Policy header to restrict resource loading.",
                ),
                "X-Frame-Options": (
                    "Missing X-Frame-Options Header",
                    "Site may be vulnerable to clickjacking attacks.",
                    "Add 'X-Frame-Options: SAMEORIGIN' or 'DENY'.",
                ),
                "X-Content-Type-Options": (
                    "Missing X-Content-Type-Options Header",
                    "Browsers may MIME-sniff responses, potentially executing malicious content.",
                    "Add 'X-Content-Type-Options: nosniff' header.",
                ),
                "Referrer-Policy": (
                    "Missing Referrer-Policy Header",
                    "Sensitive URL information may be leaked to third parties.",
                    "Add 'Referrer-Policy: strict-origin-when-cross-origin' header.",
                ),
                "Permissions-Policy": (
                    "Missing Permissions-Policy Header",
                    "Browser features like camera/mic access are not restricted.",
                    "Add a Permissions-Policy header to restrict unnecessary browser features.",
                ),
            }
            if missing_header in vulns_map:
                title, desc, rec = vulns_map[missing_header]
                vulnerabilities.append({
                    "title": title,
                    "description": desc,
                    "severity": severities.get(missing_header, "low"),
                    "category": "Security Headers",
                    "recommendation": rec,
                    "evidence": f"Header '{missing_header}' not found in response",
                })
    except Exception as e:
        logger.error(f"Header check error: {e}")

    # 3. Port Scan (common web ports)
    try:
        open_ports = scan_ports(url)
        dangerous_ports = {
            21: ("FTP Port Open", "FTP (port 21) transmits data unencrypted.", "high",
                 "Disable FTP or use SFTP/FTPS instead."),
            23: ("Telnet Port Open", "Telnet (port 23) is unencrypted and dangerous.", "critical",
                 "Disable Telnet and use SSH instead."),
            3306: ("MySQL Port Exposed", "MySQL port is accessible publicly.", "high",
                   "Restrict database port access using a firewall."),
            5432: ("PostgreSQL Port Exposed", "PostgreSQL port is accessible publicly.", "high",
                   "Restrict database port access using a firewall."),
            27017: ("MongoDB Port Exposed", "MongoDB port is accessible publicly.", "critical",
                    "Restrict MongoDB access. Ensure authentication is enabled."),
        }
        for port in open_ports:
            if port in dangerous_ports:
                title, desc, sev, rec = dangerous_ports[port]
                vulnerabilities.append({
                    "title": title,
                    "description": desc,
                    "severity": sev,
                    "category": "Open Ports",
                    "recommendation": rec,
                    "evidence": f"Port {port} is open",
                })
    except Exception as e:
        logger.error(f"Port scan error: {e}")

    # 4. Technology Detection
    try:
        technologies = detect_technologies(url)
    except Exception as e:
        logger.error(f"Tech detection error: {e}")

    # 5. Calculate score
    security_score = calculate_security_score(vulnerabilities, ssl_info)

    return {
        "security_score": security_score,
        "vulnerabilities": vulnerabilities,
        "ssl_info": ssl_info,
        "headers": headers_result,
        "open_ports": open_ports,
        "technologies": technologies,
    }


@app.post("/analyze/phishing")
async def analyze_phishing(request: PhishingRequest):
    logger.info("Analyzing email for phishing indicators")
    result = analyze_phishing_email(request.email_content)
    return result


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
