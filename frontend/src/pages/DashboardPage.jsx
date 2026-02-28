import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import { getDashboard } from "../services/api";
import { StatCard, ScoreCircle, Spinner, PageHeader } from "../components/ui/primitives";
import Card from "../components/ui/Card";
import { chartTheme } from "../components/ui/chartTheme";
import { format } from "date-fns";

// ── Usage Meter ───────────────────────────────────────────────────────────────
function UsageMeter({ usage }) {
  if (!usage) return null;
  const { scansThisMonth, scansRemaining, monthlyLimit, resetsOn } = usage;
  const pct      = Math.round((scansThisMonth / monthlyLimit) * 100);
  const isFull   = scansRemaining === 0;
  const barColor = isFull ? "bg-cs-danger" : pct >= 80 ? "bg-cs-warning" : "bg-cs-primary";

  return (
    <Card className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-cs-subtle uppercase tracking-wider">Free Plan — Monthly Scans</p>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          isFull ? "bg-cs-danger/10 text-cs-danger" : "bg-cs-primary/10 text-cs-primary"
        }`}>
          {scansRemaining} remaining
        </span>
      </div>

      {/* Bar */}
      <div className="h-1.5 bg-cs-elevated rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-cs-text">
          <span className="font-semibold">{scansThisMonth}</span>
          <span className="text-cs-subtle"> / {monthlyLimit} scans used this month</span>
        </p>
        <p className="text-xs text-cs-subtle">Resets {resetsOn}</p>
      </div>

      {isFull && (
        <p className="text-xs text-cs-danger mt-3 bg-cs-danger/10 border border-cs-danger/20 rounded-lg px-3 py-2">
          Limit reached. Upgrade to Pro for unlimited scans.
        </p>
      )}
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data.dashboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
  );
  if (!data) return (
    <div className="text-cs-danger text-sm">Failed to load dashboard.</div>
  );

  const { stats, usage, recentScans, scoreTrend, alerts } = data;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Security posture overview" />

      {/* Usage meter — always visible */}
      <UsageMeter usage={usage} />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Scans"      value={stats.totalScans}           icon="⬡" accent="primary" />
        <StatCard label="Last Score"       value={stats.lastSecurityScore !== null ? `${stats.lastSecurityScore}` : null} icon="◎" accent="success" />
        <StatCard label="Phishing Reports" value={stats.totalPhishingReports} icon="⚑" accent="warning" />
        <StatCard label="High Risk Scans"  value={stats.highSeverityScans}    icon="▲" accent="danger"  />
      </div>

      {/* Score + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <p className="text-sm text-cs-muted mb-4">Security Score Trend</p>
          {scoreTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={scoreTrend.map((s) => ({
                name: format(new Date(s.createdAt), "MMM d"),
                score: s.securityScore,
              }))}>
                <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke={chartTheme.axis} tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke={chartTheme.axis} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{
                  backgroundColor: chartTheme.tooltipBg,
                  border: `1px solid ${chartTheme.tooltipBorder}`,
                  borderRadius: "12px", fontSize: "12px",
                }} />
                <Line type="monotone" dataKey="score"
                  stroke={chartTheme.primary} strokeWidth={2}
                  dot={{ fill: chartTheme.primary, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-cs-subtle">
              <p className="text-sm">No scan history yet</p>
              <Link to="/scan" className="text-cs-primary text-sm mt-2 hover:opacity-80">
                Run your first scan →
              </Link>
            </div>
          )}
        </Card>

        <Card className="flex flex-col items-center justify-center">
          <p className="text-xs text-cs-subtle uppercase tracking-wider mb-4 self-start">
            Overall Security Score
          </p>
          {stats.lastSecurityScore !== null ? (
            <>
              <div className="flex justify-between items-center w-full">
                <div>
                  <h2 className="text-4xl font-bold text-cs-text mt-2">{stats.lastSecurityScore}</h2>
                  <p className={`mt-1 text-sm font-medium ${
                    stats.lastSecurityScore >= 80 ? "text-cs-success" :
                    stats.lastSecurityScore >= 50 ? "text-cs-warning" : "text-cs-danger"
                  }`}>
                    {stats.lastSecurityScore >= 80 ? "Low Risk Level" :
                     stats.lastSecurityScore >= 50 ? "Fair Risk Level" : "High Risk Level"}
                  </p>
                </div>
                <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${
                  stats.lastSecurityScore >= 80 ? "border-cs-success" :
                  stats.lastSecurityScore >= 50 ? "border-cs-warning" : "border-cs-danger"
                }`}>
                  <span className="text-lg font-semibold text-cs-text">{stats.lastSecurityScore}%</span>
                </div>
              </div>
              {stats.lastScannedSite && (
                <p className="text-xs text-cs-subtle mt-4 self-start truncate w-full">
                  {stats.lastScannedSite}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-cs-subtle">No scans yet</p>
          )}
        </Card>
      </div>

      {/* Alerts */}
      {alerts?.length > 0 && (
        <div className="mb-8">
          <p className="text-sm text-cs-muted mb-3 uppercase tracking-wider">Active Alerts</p>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <Card key={alert._id} className="flex items-center justify-between py-4 hover:bg-cs-elevated transition-all duration-200">
                <div>
                  <p className="text-sm font-medium text-cs-text">{alert.websiteUrl}</p>
                  <p className="text-xs text-cs-subtle mt-1">
                    {alert.summary.critical > 0 && `${alert.summary.critical} critical · `}
                    {alert.summary.high > 0 && `${alert.summary.high} high severity`}
                  </p>
                </div>
                <Link to={`/scan/${alert._id}`} className="text-cs-primary text-xs hover:opacity-80 ml-4 shrink-0">
                  View →
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent scans */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <p className="text-lg font-medium text-cs-text">Recent Scans</p>
          <Link to="/history" className="text-cs-primary text-sm hover:opacity-80">View all →</Link>
        </div>
        {recentScans?.length > 0 ? (
          <div className="space-y-1">
            {recentScans.map((scan) => (
              <div key={scan._id}
                className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-cs-elevated transition-all duration-200">
                <div>
                  <p className="text-sm text-cs-text font-medium">{scan.websiteUrl}</p>
                  <p className="text-xs text-cs-subtle mt-0.5">{format(new Date(scan.createdAt), "PPp")}</p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  {scan.status === "completed" && scan.securityScore !== null && (
                    <span className={`text-sm font-semibold ${
                      scan.securityScore >= 80 ? "text-cs-success" :
                      scan.securityScore >= 50 ? "text-cs-warning" : "text-cs-danger"
                    }`}>{scan.securityScore}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    scan.status === "completed" ? "bg-cs-success/10 text-cs-success" :
                    scan.status === "running"   ? "bg-cs-primary/10 text-cs-primary" :
                    scan.status === "failed"    ? "bg-cs-danger/10  text-cs-danger"  :
                    "bg-cs-elevated text-cs-muted"
                  }`}>{scan.status}</span>
                  {scan.status === "completed" && (
                    <Link to={`/scan/${scan._id}`} className="text-cs-primary text-xs hover:opacity-80">
                      Details →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-cs-subtle">
            <p className="text-sm">No scans yet</p>
            <Link to="/scan" className="text-cs-primary text-sm mt-2 inline-block hover:opacity-80">
              Scan your first website →
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
