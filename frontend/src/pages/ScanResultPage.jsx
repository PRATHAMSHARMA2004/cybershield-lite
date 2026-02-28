import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getScanResult, downloadReport } from "../services/api";
import Card from "../components/ui/Card";
import SeverityBadge from "../components/ui/SeverityBadge";
import { PrimaryButton } from "../components/ui/Button";
import { Spinner, PageHeader } from "../components/ui/primitives";
import { format } from "date-fns";
import toast from "react-hot-toast";

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

  const handleDownload = async () => {
    setDownloading(true);
    try { await downloadReport(scanId); toast.success("Report downloaded"); }
    catch { toast.error("Failed to generate report"); }
    finally { setDownloading(false); }
  };

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;
  if (!scan) return <div className="text-cs-danger text-sm">Scan not found.</div>;

  const byPriority = ["critical","high","medium","low"];

  return (
    <div>
      <div className="mb-6">
        <Link to="/history" className="text-cs-subtle text-sm hover:text-cs-muted transition-colors">
          ← Back to History
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-cs-text">{scan.websiteUrl}</h1>
          <p className="text-sm text-cs-muted mt-2">
            Scanned {format(new Date(scan.createdAt), "PPP")} · {scan.scanDuration ?? "—"}s
          </p>
        </div>
        {scan.status === "completed" && (
          <PrimaryButton onClick={handleDownload} disabled={downloading}>
            {downloading ? "Generating..." : "Download PDF Report"}
          </PrimaryButton>
        )}
      </div>

      {/* Score block */}
      <Card className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-cs-subtle uppercase tracking-wider">Overall Security Score</p>
            <h2 className="text-4xl font-bold text-cs-text mt-2">{scan.securityScore}</h2>
            <p className={`mt-1 text-sm font-medium ${
              scan.securityScore >= 80 ? "text-cs-success" :
              scan.securityScore >= 50 ? "text-cs-warning" : "text-cs-danger"
            }`}>
              {scan.securityScore >= 80 ? "Low Risk Level" : scan.securityScore >= 50 ? "Fair Risk Level" : "High Risk Level"}
            </p>
          </div>
          <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${
            scan.securityScore >= 80 ? "border-cs-success" :
            scan.securityScore >= 50 ? "border-cs-warning" : "border-cs-danger"
          }`}>
            <span className="text-xl font-semibold text-cs-text">{scan.securityScore}%</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-cs-border">
          {[
            { label: "Critical", val: scan.summary.critical, color: "text-cs-danger"  },
            { label: "High",     val: scan.summary.high,     color: "text-cs-danger"  },
            { label: "Medium",   val: scan.summary.medium,   color: "text-cs-warning" },
            { label: "Low",      val: scan.summary.low,      color: "text-cs-success" },
          ].map(({ label, val, color }) => (
            <div key={label} className="text-center">
              <p className={`text-3xl font-bold ${color}`}>{val}</p>
              <p className="text-xs text-cs-subtle mt-1">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* SSL */}
      {scan.sslInfo && (
        <Card className="mb-6">
          <p className="text-lg font-medium text-cs-text mb-4">SSL Certificate</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-cs-subtle">Status</p>
              <p className={`mt-1 font-medium ${scan.sslInfo.valid ? "text-cs-success" : "text-cs-danger"}`}>
                {scan.sslInfo.valid ? "Valid" : "Invalid"}
              </p>
            </div>
            {scan.sslInfo.issuer && <div><p className="text-xs text-cs-subtle">Issuer</p><p className="text-cs-text mt-1">{scan.sslInfo.issuer}</p></div>}
            {scan.sslInfo.expiryDate && <div><p className="text-xs text-cs-subtle">Expires</p><p className="text-cs-text mt-1">{format(new Date(scan.sslInfo.expiryDate), "PP")}</p></div>}
            {scan.sslInfo.daysUntilExpiry !== undefined && (
              <div>
                <p className="text-xs text-cs-subtle">Days Until Expiry</p>
                <p className={`mt-1 font-medium ${scan.sslInfo.daysUntilExpiry < 30 ? "text-cs-warning" : "text-cs-success"}`}>
                  {scan.sslInfo.daysUntilExpiry} days
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Vulnerabilities */}
      {scan.vulnerabilities?.length > 0 && (
        <div className="mb-6">
          <p className="text-lg font-medium text-cs-text mb-4">
            Vulnerabilities Found <span className="text-cs-subtle text-sm font-normal">({scan.vulnerabilities.length})</span>
          </p>
          <div className="space-y-3">
            {byPriority.flatMap((sev) =>
              scan.vulnerabilities.filter((v) => v.severity === sev).map((vuln, i) => (
                <Card key={`${sev}-${i}`}>
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-cs-text">{vuln.title}</h3>
                    <SeverityBadge level={vuln.severity} />
                  </div>
                  {vuln.description && (
                    <p className="text-cs-muted mt-3 text-sm">{vuln.description}</p>
                  )}
                  {vuln.evidence && (
                    <p className="text-xs text-cs-subtle font-mono bg-cs-elevated px-3 py-2 rounded-lg mt-3">
                      {vuln.evidence}
                    </p>
                  )}
                  {vuln.recommendation && (
                    <p className="text-sm text-cs-subtle mt-3">
                      <span className="text-cs-success font-medium">Recommendation: </span>
                      {vuln.recommendation}
                    </p>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Ports + Tech */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scan.openPorts?.length > 0 && (
          <Card>
            <p className="text-lg font-medium text-cs-text mb-4">Open Ports</p>
            <div className="flex flex-wrap gap-2">
              {scan.openPorts.map((port) => (
                <span key={port} className="px-3 py-1 bg-cs-elevated text-cs-muted rounded-lg text-sm font-mono border border-cs-border">
                  {port}
                </span>
              ))}
            </div>
          </Card>
        )}
        {scan.technologies?.length > 0 && (
          <Card>
            <p className="text-lg font-medium text-cs-text mb-4">Detected Technologies</p>
            <div className="flex flex-wrap gap-2">
              {scan.technologies.map((tech) => (
                <span key={tech} className="px-3 py-1 bg-cs-primary/10 text-cs-primary border border-cs-primary/20 rounded-lg text-sm">
                  {tech}
                </span>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
