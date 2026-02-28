import { useState } from "react";
import { analyzePhishing } from "../services/api";
import Card from "../components/ui/Card";
import { PrimaryButton } from "../components/ui/Button";
import { RiskBadge, PageHeader } from "../components/ui/primitives";
import toast from "react-hot-toast";

const SAMPLE = `From: security@paypa1.com
Subject: URGENT: Your account will be suspended in 24 hours

Dear Customer,

We have noticed unusual activity in your account. You must verify your account immediately or it will be permanently suspended.

Click here to verify: http://paypal-secure-login.xyz/verify?user=abc123

Action required within 24 hours. This is your final warning.

PayPal Security Team`;

export default function PhishingPage() {
  const [emailContent, setEmailContent] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (emailContent.trim().length < 10) { toast.error("Please paste email content first"); return; }
    setLoading(true); setResult(null);
    try {
      const { data } = await analyzePhishing(emailContent);
      setResult(data.report);
    } catch (err) {
      toast.error(err.response?.data?.message || "Analysis failed");
    } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Phishing Analyzer" subtitle="Detect phishing attempts and social engineering in emails" />

      <div className="max-w-3xl space-y-6">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-cs-muted">Paste email content or headers</p>
            <button onClick={() => setEmailContent(SAMPLE)}
              className="text-xs text-cs-primary hover:opacity-80 transition-opacity">
              Load sample
            </button>
          </div>
          <form onSubmit={handleAnalyze}>
            <textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Paste the full email here..."
              rows={10} disabled={loading}
              className="w-full bg-cs-elevated border border-cs-border rounded-xl px-4 py-3 text-sm text-cs-muted font-mono placeholder-cs-subtle focus:outline-none focus:border-cs-primary resize-none transition-all duration-200 disabled:opacity-50"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-cs-subtle">{emailContent.length.toLocaleString()} characters</span>
              <PrimaryButton type="submit" disabled={loading}>
                {loading ? "Analyzing..." : "Analyze Email"}
              </PrimaryButton>
            </div>
          </form>
        </Card>

        {result && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <p className="text-lg font-medium text-cs-text">Analysis Result</p>
              <RiskBadge riskLevel={result.riskLevel} />
            </div>

            {/* Risk bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-cs-subtle mb-1.5">
                <span className="uppercase tracking-wider">Risk Score</span>
                <span className="text-cs-text font-semibold">{result.riskScore}/100</span>
              </div>
              <div className="h-1.5 bg-cs-elevated rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    result.riskLevel === "safe"      ? "bg-cs-success" :
                    result.riskLevel === "suspicious"? "bg-cs-warning" : "bg-cs-danger"
                  }`}
                  style={{ width: `${result.riskScore}%` }}
                />
              </div>
            </div>

            {/* Suggested action */}
            <div className="bg-cs-elevated rounded-xl p-4 mb-6">
              <p className="text-xs text-cs-subtle uppercase tracking-wider mb-1">Recommended Action</p>
              <p className="text-sm text-cs-text">{result.suggestedAction}</p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {result.analysisDetails?.reasons?.length > 0 && (
                <div>
                  <p className="text-xs text-cs-subtle uppercase tracking-wider mb-3">Why This Is Flagged</p>
                  <ul className="space-y-2">
                    {result.analysisDetails.reasons.map((r, i) => (
                      <li key={i} className="text-sm text-cs-muted flex items-start gap-2">
                        <span className="text-cs-danger mt-0.5 shrink-0">·</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.analysisDetails?.suspiciousKeywords?.length > 0 && (
                <div>
                  <p className="text-xs text-cs-subtle uppercase tracking-wider mb-3">Suspicious Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {result.analysisDetails.suspiciousKeywords.map((kw) => (
                      <span key={kw} className="px-2 py-0.5 bg-cs-danger/10 text-cs-danger rounded text-xs">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.analysisDetails?.spoofingIndicators?.length > 0 && (
                <div>
                  <p className="text-xs text-cs-subtle uppercase tracking-wider mb-3">Spoofing Indicators</p>
                  <ul className="space-y-2">
                    {result.analysisDetails.spoofingIndicators.map((s, i) => (
                      <li key={i} className="text-sm text-cs-warning flex items-start gap-2">
                        <span className="shrink-0">▲</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.analysisDetails?.suspiciousDomains?.length > 0 && (
                <div>
                  <p className="text-xs text-cs-subtle uppercase tracking-wider mb-3">Suspicious Domains</p>
                  <ul className="space-y-1">
                    {result.analysisDetails.suspiciousDomains.map((d, i) => (
                      <li key={i} className="text-xs font-mono text-cs-danger break-all">{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
