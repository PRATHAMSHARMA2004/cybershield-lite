import re
import tldextract
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

PHISHING_KEYWORDS = [
    "urgent","verify your account","suspended","confirm your identity",
    "click here immediately","unusual activity","login attempt",
    "your account has been","action required","validate your",
    "update your payment","security alert","unauthorized access",
    "password expired","limited time","act now","winner",
    "congratulations","prize","claim your","free gift",
    "100% free","no cost","risk free","guaranteed",
    "dear customer","dear user","dear account holder",
    "we have noticed","you have been selected"
]

SUSPICIOUS_TLD = {
".xyz",".top",".click",".link",".gq",".ml",".cf",".tk",".work",".buzz",".monster"
}

URL_SHORTENERS = {
"bit.ly","tinyurl.com","t.co","goo.gl","ow.ly","buff.ly","rebrand.ly"
}

KNOWN_SPOOFED_BRANDS = [
"paypal","amazon","google","apple","microsoft","facebook",
"netflix","bank","chase","wellsfargo","citibank","irs",
"fedex","ups","dhl","dropbox","docusign"
]


# --------------------------------------------------

def extract_urls(text:str)->list[str]:

    url_pattern = re.compile(
        r"https?://[^\s<>\"']+|www\.[^\s<>\"']+"
        r"|[a-zA-Z0-9._%+-]+\.[a-zA-Z]{2,}(?:/[^\s<>\"']*)?",
        re.IGNORECASE,
    )

    urls = url_pattern.findall(text)

    result = []

    for url in urls:

        if not url.startswith("http"):
            url="http://"+url

        result.append(url)

    return list(set(result))[:20]


# --------------------------------------------------

def check_domain_suspicious(url:str):

    try:

        parsed=urlparse(url)
        hostname=parsed.hostname or ""

        ext=tldextract.extract(url)

        domain=ext.domain.lower()
        tld="."+ext.suffix if ext.suffix else ""

        reasons=[]

        # Suspicious TLD
        if tld in SUSPICIOUS_TLD:
            reasons.append(f"Suspicious TLD detected: {tld}")

        # URL shortener
        if hostname in URL_SHORTENERS:
            reasons.append("URL shortener detected — destination hidden")

        # Brand impersonation
        for brand in KNOWN_SPOOFED_BRANDS:

            if brand in hostname and hostname!=brand:
                reasons.append(f"Possible brand impersonation: {hostname}")
                break

        # IP address domain
        if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$",hostname):
            reasons.append("URL uses IP address instead of domain")

        # long domain
        if len(hostname)>60:
            reasons.append("Unusually long domain name")

        # too many subdomains
        if hostname.count(".")>3:
            reasons.append("Excessive subdomains used")

        return len(reasons)>0,reasons

    except Exception as e:

        logger.warning(f"Domain analysis failed for {url}: {e}")

        return False,[]


# --------------------------------------------------

def check_spoofing_indicators(email_text:str):

    indicators=[]

    text=email_text.lower()

    from_match=re.search(r"from:.*?<([^>]+)>",text)
    reply_match=re.search(r"reply-to:.*?<([^>]+)>",text)

    if from_match and reply_match:

        if from_match.group(1)!=reply_match.group(1):

            indicators.append("Reply-To address differs from From address")

    if re.search(r"dear (customer|user|account holder|member|sir|madam)",text):

        indicators.append("Generic greeting used")

    if re.search(r"(suspend|terminat|clos|block|lock)",text) and re.search(
        r"(24 hour|48 hour|immediately|urgent)",text):

        indicators.append("Urgency + threat language detected")

    return indicators


# --------------------------------------------------

def analyze_phishing_email(email_content:str):

    try:

        text=email_content.lower()

        # keywords
        found_keywords=[kw for kw in PHISHING_KEYWORDS if kw in text]

        # urls
        links=extract_urls(email_content)

        suspicious_domains=[]
        domain_reasons=[]

        for url in links:

            is_susp,reasons=check_domain_suspicious(url)

            if is_susp:

                suspicious_domains.append(url)

                domain_reasons.extend(reasons)

        spoofing_indicators=check_spoofing_indicators(email_content)

        score=0
        reasons=[]

        if found_keywords:

            score+=min(len(found_keywords)*12,50)

            reasons.append(
                f"{len(found_keywords)} phishing keyword(s) detected"
            )

        if suspicious_domains:

            score+=min(len(suspicious_domains)*20,40)

            reasons.extend(domain_reasons[:3])

        if spoofing_indicators:

            score+=min(len(spoofing_indicators)*10,20)

            reasons.extend(spoofing_indicators)

        if len(links)>5:

            score+=10
            reasons.append(f"Email contains {len(links)} links")

        score=min(score,100)

        if score>=60:

            risk="high_risk"
            action="Do NOT click links. Report email immediately."

        elif score>=30:

            risk="suspicious"
            action="Verify sender through official website before action."

        else:

            risk="safe"
            action="Email appears safe but verify unexpected requests."

        return {

            "risk_level":risk,
            "risk_score":score,
            "suspicious_keywords":found_keywords,
            "extracted_links":links[:10],
            "suspicious_domains":suspicious_domains[:10],
            "spoofing_indicators":spoofing_indicators,
            "reasons":reasons,
            "suggested_action":action,

        }

    except Exception as e:

        logger.error(f"Phishing analysis failed: {e}")

        return {
            "risk_level":"unknown",
            "risk_score":0,
            "reasons":["Analyzer error"],
        }