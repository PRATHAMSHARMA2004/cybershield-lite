import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { startScan, getScanResult } from "../services/api";
import { PrimaryButton } from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Spinner, PageHeader } from "../components/ui/primitives";
import toast from "react-hot-toast";

const CHECKS = [
  "Checking SSL certificate",
  "Analyzing security headers",
  "Scanning open ports",
  "Detecting technologies",
];

export default function ScanPage() {
  const [url, setUrl] = useState("");
  const [scanId, setScanId] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const pollRef = useRef(null);

  const handleScan = async (e) => {
    e.preventDefault();
    let normalized = url.trim();
    if (!normalized.startsWith("http")) normalized = "https://" + normalized;
    setLoading(true);
    try {
      const { data } = await startScan(normalized);
      setScanId(data.scanId);
      setStatus("running");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start scan");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!scanId || status === "completed" || status === "failed") return;
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await getScanResult(scanId);
        if (data.scan.status === "completed" || data.scan.status === "failed") {
          clearInterval(pollRef.current);
          setStatus(data.scan.status);
          setLoading(false);
          if (data.scan.status === "completed") {
            toast.success("Scan complete");
            navigate(`/scan/${scanId}`);
          } else {
            toast.error("Scan failed. Please try again.");
          }
        }
      } catch { clearInterval(pollRef.current); setLoading(false); }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [scanId, status, navigate]);

  return (
    <div>
      <PageHeader title="Website Scanner" subtitle="Detect vulnerabilities, SSL issues, and misconfigurations" />

      <div className="max-w-2xl space-y-6">
        <Card>
          <p className="text-sm text-cs-muted mb-4">Enter a URL to scan</p>
          <form onSubmit={handleScan} className="flex gap-3">
            <input
              type="text" value={url} required disabled={loading}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="flex-1 bg-cs-elevated border border-cs-border rounded-lg px-3 py-2.5 text-sm text-cs-text placeholder-cs-subtle focus:outline-none focus:border-cs-primary transition-all duration-200 disabled:opacity-50"
            />
            <PrimaryButton type="submit" disabled={loading} className="px-5 py-2.5">
              {loading ? "Scanning..." : "Scan"}
            </PrimaryButton>
          </form>
          <p className="text-xs text-cs-subtle mt-3">
            Only scan websites you own or have written permission to test.
          </p>
        </Card>

        {loading && status === "running" && (
          <Card>
            <div className="flex items-center gap-4 mb-6">
              <Spinner />
              <div>
                <p className="text-sm font-medium text-cs-text">Scan in progress</p>
                <p className="text-xs text-cs-subtle mt-0.5">This usually takes 30–90 seconds</p>
              </div>
            </div>
            <div className="space-y-2">
              {CHECKS.map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-cs-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-cs-primary animate-pulse" />
                  {step}
                </div>
              ))}
            </div>
          </Card>
        )}

        {!loading && (
          <Card>
            <p className="text-sm font-medium text-cs-text mb-4">What we check</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "SSL / TLS",         desc: "Certificate validity, issuer, expiry" },
                { label: "Security Headers",  desc: "HSTS, CSP, X-Frame-Options and more"  },
                { label: "Open Ports",        desc: "Detect exposed services and databases" },
                { label: "Technologies",      desc: "Identify vulnerable or outdated software" },
              ].map((item) => (
                <div key={item.label} className="bg-cs-elevated rounded-xl p-4 hover:scale-[1.01] transition-all duration-200">
                  <p className="text-sm font-medium text-cs-text">{item.label}</p>
                  <p className="text-xs text-cs-subtle mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
