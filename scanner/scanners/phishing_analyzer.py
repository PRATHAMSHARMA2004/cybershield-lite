import re
import tldextract
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

PHISHING_KEYWORDS = [
    "urgent", "verify your account", "suspended", "confirm your identity",
    "click here immediately", "unusual activity", "login attempt",
    "your account has been", "action required", "validate your",
    "update your payment", "security alert", "unauthorized access",
    "password expired", "limited time", "act now", "winner",
    "congratulations", "prize", "claim your", "free gift",
    "100% free", "no cost", "risk free", "guaranteed",
    "dear customer", "dear user", "dear account holder",
    "we have noticed", "you have been selected",
]

SUSPICIOUS_TLD = {".xyz", ".top", ".click", ".link", ".gq", ".ml", ".cf", ".tk", ".work"}

KNOWN_SPOOFED_BRANDS = [
    "paypal", "amazon", "google", "apple", "microsoft", "facebook",
    "netflix", "bank", "chase", "wellsfargo", "citibank", "irs",
    "fedex", "ups", "dhl", "dropbox", "docusign",
]


def extract_urls(text: str) -> list[str]:
    """Extract all URLs from email content."""
    url_pattern = re.compile(
        r"https?://[^\s<>\"']+|www\.[^\s<>\"']+"
        r"|[a-zA-Z0-9._%+-]+\.[a-zA-Z]{2,}(?:/[^\s<>\"']*)?",
        re.IGNORECASE,
    )
    urls = url_pattern.findall(text)
    # Normalize
    result = []
    for url in urls:
        if not url.startswith("http"):
            url = "http://" + url
        result.append(url)
    return list(set(result))[:20]  # Cap at 20


def check_domain_suspicious(url: str) -> tuple[bool, str]:
    """Check if a domain looks suspicious."""
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname or ""
        ext = tldextract.extract(url)
        domain = ext.domain.lower()
        tld = f".{ext.suffix}" if ext.suffix else ""

        reasons = []

        # Suspicious TLD
        if tld in SUSPICIOUS_TLD:
            reasons.append(f"Suspicious TLD: {tld}")

        # Brand impersonation
        for brand in KNOWN_SPOOFED_BRANDS:
            if brand in domain and domain != brand:
                reasons.append(f"Possible brand impersonation: '{brand}' in domain '{domain}'")
                break

        # IP address as domain
        if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", hostname):
            reasons.append("URL uses IP address instead of domain name")

        # Overly long domain
        if len(hostname) > 60:
            reasons.append("Unusually long domain name")

        # Multiple subdomains
        if hostname.count(".") > 3:
            reasons.append("Excessive subdomains in URL")

        return len(reasons) > 0, reasons

    except Exception:
        return False, []


def check_spoofing_indicators(email_text: str) -> list[str]:
    """Check for email spoofing indicators."""
    indicators = []
    text_lower = email_text.lower()

    # Mismatched sender patterns
    if re.search(r"from:.*?<.*?>", text_lower):
        from_match = re.search(r"from:.*?<([^>]+)>", text_lower)
        reply_match = re.search(r"reply-to:.*?<([^>]+)>", text_lower)
        if from_match and reply_match and from_match.group(1) != reply_match.group(1):
            indicators.append("Reply-To address differs from From address")

    # Generic greetings
    if re.search(r"dear (customer|user|account holder|member|sir|madam)", text_lower):
        indicators.append("Generic greeting used instead of your name")

    # Urgency + threat combo
    if re.search(r"(suspend|terminat|clos|block|lock)", text_lower) and re.search(
        r"(24 hour|48 hour|immediately|urgent)", text_lower
    ):
        indicators.append("Urgency + threat combination detected")

    return indicators


def analyze_phishing_email(email_content: str) -> dict:
    """Full phishing analysis of email content."""
    text_lower = email_content.lower()

    # 1. Keyword matching
    found_keywords = [kw for kw in PHISHING_KEYWORDS if kw in text_lower]

    # 2. URL extraction
    extracted_links = extract_urls(email_content)

    # 3. Domain analysis
    suspicious_domains = []
    domain_reasons = []
    for url in extracted_links:
        is_susp, reasons = check_domain_suspicious(url)
        if is_susp:
            suspicious_domains.append(url)
            domain_reasons.extend(reasons)

    # 4. Spoofing indicators
    spoofing_indicators = check_spoofing_indicators(email_content)

    # 5. Risk scoring
    score = 0
    reasons = []

    if found_keywords:
        kw_score = min(len(found_keywords) * 8, 40)
        score += kw_score
        reasons.append(f"Found {len(found_keywords)} phishing keyword(s): {', '.join(found_keywords[:5])}")

    if suspicious_domains:
        score += min(len(suspicious_domains) * 15, 30)
        reasons.extend(domain_reasons[:3])

    if spoofing_indicators:
        score += min(len(spoofing_indicators) * 10, 20)
        reasons.extend(spoofing_indicators)

    if len(extracted_links) > 5:
        score += 10
        reasons.append(f"Email contains {len(extracted_links)} links")

    score = min(score, 100)

    # 6. Risk level
    if score >= 60:
        risk_level = "high_risk"
        suggested_action = "Do NOT click any links. Mark as spam and delete immediately. Report to your IT team."
    elif score >= 30:
        risk_level = "suspicious"
        suggested_action = "Exercise caution. Verify sender identity through official channels before taking any action."
    else:
        risk_level = "safe"
        suggested_action = "Email appears safe but always verify unexpected requests through official channels."

    return {
        "risk_level": risk_level,
        "risk_score": score,
        "suspicious_keywords": found_keywords,
        "extracted_links": extracted_links[:10],
        "suspicious_domains": suspicious_domains[:10],
        "spoofing_indicators": spoofing_indicators,
        "reasons": reasons,
        "suggested_action": suggested_action,
    }
