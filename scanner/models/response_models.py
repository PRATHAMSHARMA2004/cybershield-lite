from pydantic import BaseModel
from typing import Optional
from enum import Enum


class RiskLevel(str, Enum):
    LOW    = "Low"
    MEDIUM = "Medium"
    HIGH   = "High"


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH     = "high"
    MEDIUM   = "medium"
    LOW      = "low"


class ScanRequest(BaseModel):
    url:     str
    scan_id: Optional[str] = None


class PhishingRequest(BaseModel):
    email_content: str


class Issue(BaseModel):
    title:          str
    description:    str
    severity:       Severity
    category:       str
    recommendation: str
    evidence:       Optional[str] = None


class IssuesBySeverity(BaseModel):
    critical: list[Issue] = []
    high:     list[Issue] = []
    medium:   list[Issue] = []
    low:      list[Issue] = []


class SSLInfo(BaseModel):
    valid:             bool
    issuer:            Optional[str] = None
    expiry_date:       Optional[str] = None
    days_until_expiry: Optional[int] = None
    error:             Optional[str] = None


class HeadersInfo(BaseModel):
    present:         list[str] = []
    missing:         list[str] = []
    info_disclosure: list[str] = []


class CookieInfo(BaseModel):
    cookies_found: bool      = False
    secure:        bool      = True
    httponly:      bool      = True
    samesite:      bool      = True
    issues:        list[str] = []


class DNSInfo(BaseModel):
    spf:    bool      = False
    dmarc:  bool      = False
    dkim:   bool      = False
    issues: list[str] = []


class ExposedPath(BaseModel):
    path:   str
    status: int
    risk:   str


class ScanResponse(BaseModel):
    # Spec-required top-level fields
    domain:      str       = ""
    score:       int
    risk_level:  RiskLevel
    scan_time_ms: int      = 0

    # Grouped results
    ssl:          Optional[SSLInfo]     = None
    headers:      Optional[HeadersInfo] = None
    cookies:      Optional[CookieInfo]  = None
    dns:          Optional[DNSInfo]     = None
    open_ports:   list[int]             = []
    exposed_paths: list[ExposedPath]    = []
    technologies: list[str]             = []

    # Issues + recommendations
    issues:          IssuesBySeverity
    recommendations: list[str]          = []

    # Legacy — Node.js backend compatibility
    security_score:  int        = 0
    vulnerabilities: list[dict] = []

    def model_post_init(self, __context):
        self.security_score = self.score
        all_issues = (
            self.issues.critical + self.issues.high +
            self.issues.medium   + self.issues.low
        )
        self.vulnerabilities = [i.model_dump() for i in all_issues]
