"""
services/scoring_engine.py
Rule-based scoring engine — production version
"""

from models.response_models import Issue, IssuesBySeverity, RiskLevel, Severity

SECURITY_RULES = {

"ssl_invalid":{
"title":"Invalid SSL certificate",
"description":"SSL certificate invalid or missing",
"severity":Severity.CRITICAL,
"category":"ssl",
"weight":15,
"recommendation":"Install a valid SSL certificate"
},

"missing_hsts":{
"title":"HSTS header missing",
"description":"HTTP Strict Transport Security header not set",
"severity":Severity.HIGH,
"category":"headers",
"weight":8,
"recommendation":"Enable HSTS header"
},

"missing_csp":{
"title":"Content Security Policy missing",
"description":"CSP header not present",
"severity":Severity.MEDIUM,
"category":"headers",
"weight":6,
"recommendation":"Add Content Security Policy"
},

"missing_x_frame":{
"title":"X-Frame-Options missing",
"description":"Clickjacking protection header missing",
"severity":Severity.MEDIUM,
"category":"headers",
"weight":5,
"recommendation":"Add X-Frame-Options header"
},

"missing_x_content_type":{
"title":"X-Content-Type-Options missing",
"description":"MIME sniffing protection missing",
"severity":Severity.LOW,
"category":"headers",
"weight":4,
"recommendation":"Add X-Content-Type-Options header"
},

"missing_spf":{
"title":"SPF record missing",
"description":"Email SPF DNS record not configured",
"severity":Severity.MEDIUM,
"category":"dns",
"weight":5,
"recommendation":"Add SPF DNS record"
},

"missing_dmarc":{
"title":"DMARC record missing",
"description":"DMARC policy not configured",
"severity":Severity.MEDIUM,
"category":"dns",
"weight":5,
"recommendation":"Add DMARC DNS record"
},

"directory_listing":{
"title":"Directory listing enabled",
"description":"Server exposes directory contents",
"severity":Severity.HIGH,
"category":"server",
"weight":8,
"recommendation":"Disable directory listing"
}

}
def calculate_score(failed_rules: list[str], evidences: dict[str, str] | None = None):

    if evidences is None:
        evidences = {}

    score = 100
    issues = IssuesBySeverity()
    recommendations = set()

    penalized_categories = {}

    # remove duplicate rules
    unique_rules = set(failed_rules)

    for rule_key in unique_rules:

        rule = SECURITY_RULES.get(rule_key)
        if not rule:
            continue

        category = rule["category"]
        penalty = rule["weight"]

        # category penalty limiter
        category_count = penalized_categories.get(category, 0)

        if category_count >= 2:
            penalty = max(1, penalty // 2)

        penalized_categories[category] = category_count + 1

        score -= penalty

        issue = Issue(
            title=rule["title"],
            description=rule["description"],
            severity=rule["severity"],
            category=rule["category"],
            recommendation=rule["recommendation"],
            evidence=evidences.get(rule_key),
        )

        severity = rule["severity"]

        if severity == Severity.CRITICAL:
            issues.critical.append(issue)

        elif severity == Severity.HIGH:
            issues.high.append(issue)

        elif severity == Severity.MEDIUM:
            issues.medium.append(issue)

        else:
            issues.low.append(issue)

        recommendations.add(rule["recommendation"])

    final_score = max(0, min(100, score))

    return final_score, issues, list(recommendations)[:5]


def get_risk_level(score: int) -> RiskLevel:

    if score >= 85:
        return RiskLevel.LOW

    elif score >= 60:
        return RiskLevel.MEDIUM

    else:
        return RiskLevel.HIGH