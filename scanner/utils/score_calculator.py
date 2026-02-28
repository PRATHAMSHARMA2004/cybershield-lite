def calculate_security_score(vulnerabilities: list, ssl_info: dict | None) -> int:
    """
    Calculate a security score from 0-100 based on findings.
    Starts at 100 and deducts points for issues found.
    """
    score = 100

    # SSL penalties
    if ssl_info:
        if not ssl_info.get("valid"):
            score -= 25
        elif ssl_info.get("days_until_expiry", 999) < 7:
            score -= 20
        elif ssl_info.get("days_until_expiry", 999) < 30:
            score -= 10

    # Vulnerability penalties
    severity_penalties = {
        "critical": 20,
        "high": 12,
        "medium": 6,
        "low": 2,
    }

    # Track categories to avoid double-penalizing same category
    penalized_categories = {}

    for vuln in vulnerabilities:
        severity = vuln.get("severity", "low")
        category = vuln.get("category", "other")
        penalty = severity_penalties.get(severity, 2)

        # Diminishing returns per category
        if category not in penalized_categories:
            penalized_categories[category] = 0

        if penalized_categories[category] < 2:
            score -= penalty
            penalized_categories[category] += 1
        else:
            score -= max(1, penalty // 2)

    return max(0, min(100, score))
