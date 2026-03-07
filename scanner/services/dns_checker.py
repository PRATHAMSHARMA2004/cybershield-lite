"""
services/dns_checker.py
Async DNS security checker.
Checks SPF, DMARC, DKIM records via asyncio executor (dnspython is sync).
"""

import asyncio
import dns.resolver
from loguru import logger


def _check_dns_sync(domain: str) -> dict:
    result = {
        "spf":   False,
        "dmarc": False,
        "dkim":  False,
        "issues": [],
    }

    # SPF — TXT record on root domain
    try:
        answers = dns.resolver.resolve(domain, "TXT", lifetime=5)
        for rdata in answers:
            txt = rdata.to_text().lower()
            if "v=spf1" in txt:
                result["spf"] = True
                break
        if not result["spf"]:
            result["issues"].append("No SPF record found")
    except Exception:
        result["issues"].append("SPF record lookup failed")

    # DMARC — TXT on _dmarc.domain
    try:
        answers = dns.resolver.resolve(f"_dmarc.{domain}", "TXT", lifetime=5)
        for rdata in answers:
            if "v=dmarc1" in rdata.to_text().lower():
                result["dmarc"] = True
                break
        if not result["dmarc"]:
            result["issues"].append("No DMARC record found")
    except Exception:
        result["issues"].append("DMARC record not found")

    # DKIM — check common selector (default._domainkey)
    try:
        answers = dns.resolver.resolve(f"default._domainkey.{domain}", "TXT", lifetime=5)
        for rdata in answers:
            if "v=dkim1" in rdata.to_text().lower():
                result["dkim"] = True
                break
    except Exception:
        pass  # DKIM selector varies — not finding it is common, don't penalize hard

    return result


async def check_dns(domain: str) -> dict:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _check_dns_sync, domain)
