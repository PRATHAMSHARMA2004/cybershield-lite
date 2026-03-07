import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getScanResult, downloadReport } from "../services/api";
import Card from "../components/ui/Card";
import { PrimaryButton } from "../components/ui/Button";
import { Spinner } from "../components/ui/primitives";
import { format } from "date-fns";
import toast from "react-hot-toast";
import SecurityScoreCard from "../components/SecurityScoreCard";

export default function ScanResultPage() {
  const { scanId } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getScanResult(scanId)
      .then((res) => setScan(res.data.scan))
      .catch(() => toast.error("Failed to load scan"))
      .finally(() => setLoading(false));
  }, [scanId]);
  console.log("SCAN OBJECT:", scan);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadReport(scanId);
      toast.success("Report downloaded");
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setDownloading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center pt-20">
        <Spinner size="lg" />
      </div>
    );

  if (!scan)
    return <div className="text-cs-danger text-sm">Scan not found.</div>;

  const scoreChange = scan.scoreChange ?? 0;
const hasPrevious =
  scan.previousScore !== null &&
  scan.previousScore !== undefined;

const isImproved = scoreChange > 0;
const isDropped = scoreChange < 0;

  const byPriority = ["critical", "high", "medium", "low"];

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/history"
          className="text-cs-subtle text-sm hover:text-cs-muted transition-colors"
        >
          ← Back to History
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-cs-text">
            {scan.websiteUrl}
          </h1>
          <p className="text-sm text-cs-muted mt-2">
            Scanned {format(new Date(scan.createdAt), "PPP")} ·{" "}
            {scan.scanDuration ?? "—"}s
          </p>
        </div>

        {scan.status === "completed" && (
          <PrimaryButton onClick={handleDownload} disabled={downloading}>
            {downloading ? "Generating..." : "Download PDF Report"}
          </PrimaryButton>
        )}
      </div>

      {/* SCORE BLOCK */}
      <Card className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          
          {/* Left Side Text */}
          <div>
            <p className="text-xs text-cs-subtle uppercase tracking-wider">
              Overall Security Score
            </p>

            <p
              className={`mt-2 text-sm font-medium ${
                scan.securityScore >= 80
                  ? "text-cs-success"
                  : scan.securityScore >= 50
                  ? "text-cs-warning"
                  : "text-cs-danger"
              }`}
            >
              {scan.securityScore >= 80
                ? "Low Risk Level"
                : scan.securityScore >= 50
                ? "Fair Risk Level"
                : "High Risk Level"}
            </p>
            {hasPrevious && (
  <div className="mt-2 text-sm font-medium">
    {isImproved && (
      <span className="text-green-500">
        ↑ Improved by +{scoreChange}%
      </span>
    )}
    {isDropped && (
      <span className="text-red-500">
        ↓ Dropped by {Math.abs(scoreChange)}%
      </span>
    )}
    {!isImproved && !isDropped && (
      <span className="text-gray-400">
        No change from previous scan
      </span>
    )}
  </div>
)}
          </div>

          {/* Circular Score */}
          <SecurityScoreCard score={scan.securityScore} />
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-cs-border">
          {[
            { label: "Critical", val: scan.summary.critical, color: "text-cs-danger" },
            { label: "High", val: scan.summary.high, color: "text-cs-danger" },
            { label: "Medium", val: scan.summary.medium, color: "text-cs-warning" },
            { label: "Low", val: scan.summary.low, color: "text-cs-success" },
          ].map(({ label, val, color }) => (
            <div key={label} className="text-center">
              <p className={`text-3xl font-bold ${color}`}>{val}</p>
              <p className="text-xs text-cs-subtle mt-1">{label}</p>
            </div>
          ))}
        </div>
      </Card>
      {/* Security Advisor */}
<Card className="mt-6 p-4">
  <h3 className="text-lg font-semibold mb-3">Security Advisor</h3>
  {scan.summary.high > 0 && (
  <div className="mb-3 inline-block px-3 py-1 rounded-full bg-red-600/20 text-red-400 text-xs font-semibold">
    Immediate Attention Required
  </div>
)}

{scan.summary.high === 0 && scan.summary.medium > 0 && (
  <div className="mb-3 inline-block px-3 py-1 rounded-full bg-yellow-600/20 text-yellow-400 text-xs font-semibold">
    Moderate Risk
  </div>
)}
{scan.summary.high === 0 && scan.summary.medium === 0 && (
  <div className="mb-3 inline-block px-3 py-1 rounded-full bg-green-600/20 text-green-400 text-xs font-semibold">
    System Secure
  </div>
)}
{scan.summary.high > 0 && (
  <p className="text-sm text-red-400 mb-3 font-medium">
    Your website has critical security risks requiring immediate remediation.
  </p>
)}

{scan.summary.high === 0 && scan.summary.medium > 0 && (
  <p className="text-sm text-yellow-400 mb-3 font-medium">
    Your website shows moderate security concerns that should be reviewed.
  </p>
)}

{scan.summary.high === 0 && scan.summary.medium === 0 && (
  <p className="text-sm text-green-400 mb-3 font-medium">
    Your website security posture appears strong based on this scan.
  </p>
)}
{scan.summary.high > 0 && (
  <div className="h-1 w-full bg-red-500 rounded mb-4"></div>
)}

{scan.summary.high === 0 && scan.summary.medium > 0 && (
  <div className="h-1 w-full bg-yellow-500 rounded mb-4"></div>
)}

{scan.summary.high === 0 && scan.summary.medium === 0 && (
  <div className="h-1 w-full bg-green-500 rounded mb-4"></div>
)}
{(scan.summary.high > 0 || scan.summary.medium > 0) && (
  <p className="text-sm text-gray-400 mb-4">
    These security issues could impact data protection,
    customer trust, and regulatory compliance if not addressed promptly.
  </p>
)}

  {scan.summary.high > 0 && (
    <p className="text-red-400">
      ⚠️ {scan.summary.high} high severity issues need immediate attention.
    </p>
  )}

  {scan.summary.medium > 0 && (
    <p className="text-yellow-400">
      ⚠️ {scan.summary.medium} medium risk issues should be reviewed.
    </p>
  )}

  {scan.sslInfo?.valid ? (
  <p className="text-green-400">
    ✅ SSL certificate is properly configured and encrypting traffic.
  </p>
) : (
  <div className="text-red-400">
    ❌ SSL certificate is invalid or missing.
    <div className="text-sm text-gray-400 mt-1">
      This may expose users to man-in-the-middle attacks and data interception.
    </div>
  </div>
)}
  {scan.summary.high > 0 && (
  <div className="mt-3 text-sm text-gray-300">
    <strong>Recommended Action:</strong>
    <ul className="list-disc ml-5 mt-1">
      <li>Review exposed endpoints and server configurations.</li>
      <li>Ensure firewall and access controls are properly configured.</li>
      <li>Patch outdated software components immediately.</li>
    </ul>
  </div>
)}
{scan.summary.medium > 0 && (
  <div className="mt-3 text-sm text-gray-300">
    <strong>Suggested Review:</strong>
    <ul className="list-disc ml-5 mt-1">
      <li>Check configuration for security best practices.</li>
      <li>Monitor logs for suspicious activity.</li>
      <li>Plan remediation in the next security update cycle.</li>
    </ul>
  </div>
)}
</Card>

      {/* SSL */}
      {scan.sslInfo && (
        <Card className="mb-6">
          <p className="text-lg font-medium text-cs-text mb-4">
            SSL Certificate
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-cs-subtle">Status</p>
              <p
                className={`mt-1 font-medium ${
                  scan.sslInfo.valid
                    ? "text-cs-success"
                    : "text-cs-danger"
                }`}
              >
                {scan.sslInfo.valid ? "Valid" : "Invalid"}
              </p>
            </div>

            {scan.sslInfo.issuer && (
              <div>
                <p className="text-xs text-cs-subtle">Issuer</p>
                <p className="text-cs-text mt-1">
                  {scan.sslInfo.issuer}
                </p>
              </div>
            )}

            {scan.sslInfo.expiryDate && (
              <div>
                <p className="text-xs text-cs-subtle">Expires</p>
                <p className="text-cs-text mt-1">
                  {format(new Date(scan.sslInfo.expiryDate), "PP")}
                </p>
              </div>
            )}

            {scan.sslInfo.daysUntilExpiry !== undefined && (
              <div>
                <p className="text-xs text-cs-subtle">
                  Days Until Expiry
                </p>
                <p
                  className={`mt-1 font-medium ${
                    scan.sslInfo.daysUntilExpiry < 30
                      ? "text-cs-warning"
                      : "text-cs-success"
                  }`}
                >
                  {scan.sslInfo.daysUntilExpiry} days
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
      {/* Vulnerabilities */}
{scan.vulnerabilities && scan.vulnerabilities.length > 0 && (
  <Card className="mb-6">
    <p className="text-lg font-medium text-cs-text mb-4">
      Detected Vulnerabilities
    </p>

    <div className="space-y-4">
      {scan.vulnerabilities.map((issue, index) => (
        <div
          key={index}
          className="border border-cs-border rounded-lg p-4"
        >
          <p className="font-semibold text-cs-text">
            {issue.title || "Security Issue"}
          </p>

          {issue.description && (
            <p className="text-sm text-cs-muted mt-1">
              {issue.description}
            </p>
          )}

          {issue.severity && (
            <p className="text-xs mt-2 text-yellow-400">
              Severity: {issue.severity}
            </p>
          )}

          {issue.recommendation && (
            <div className="mt-3 bg-green-500/10 border-l-4 border-green-500 p-3 rounded">
              <p className="text-sm text-green-400 font-semibold">
                Recommended Fix
              </p>
              <p className="text-sm text-cs-muted mt-1">
                {issue.recommendation}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  </Card>
)}
    </div>
  );
}