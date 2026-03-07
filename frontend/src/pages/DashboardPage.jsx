import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import { getDashboard } from "../services/api";
import { StatCard, Spinner, PageHeader } from "../components/ui/primitives";
import Card from "../components/ui/Card";
import { chartTheme } from "../components/ui/chartTheme";
import { format } from "date-fns";

function UsageMeter({ usage, plan }) {
  if (!usage || plan === "pro") return null;

  const { scansThisMonth, scansRemaining, monthlyLimit, resetsOn } = usage;
  const pct = Math.round((scansThisMonth / monthlyLimit) * 100);
  const isFull = scansRemaining === 0;
  const barColor =
    isFull ? "bg-cs-danger" : pct >= 80 ? "bg-cs-warning" : "bg-cs-primary";

  return (
    <Card className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-cs-subtle uppercase tracking-wider">
          Free Plan — Monthly Scans
        </p>

        <Link
          to="/upgrade"
          className="text-xs font-semibold px-3 py-1 rounded-full bg-cs-primary text-white hover:opacity-90 transition"
        >
          Upgrade to Pro
        </Link>
      </div>

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

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data.dashboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-cs-danger text-sm">Failed to load dashboard.</div>;
  }

  const { stats, usage, scoreTrend, user } = data;

  return (
    <div>
      {/* Header + Plan Badge */}
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Dashboard" subtitle="Security posture overview" />

        {user?.plan === "pro" ? (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-cs-success/10 text-cs-success">
            👑 Pro Plan Active
          </span>
        ) : (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-cs-warning/10 text-cs-warning">
            Free Plan
          </span>
        )}
      </div>

      {/* Usage meter only for free users */}
      <UsageMeter usage={usage} plan={user?.plan} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Scans" value={stats.totalScans} icon="⬡" accent="primary" />
        <StatCard
          label="Last Score"
          value={stats.lastSecurityScore !== null ? `${stats.lastSecurityScore}` : null}
          icon="◎"
          accent="success"
        />
        <StatCard
          label="Phishing Reports"
          value={stats.totalPhishingReports}
          icon="⚑"
          accent="warning"
        />
        <StatCard
          label="High Risk Scans"
          value={stats.highSeverityScans}
          icon="▲"
          accent="danger"
        />
      </div>

      {/* Chart + Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <p className="text-sm text-cs-muted mb-4">Security Score Trend</p>

          {scoreTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={scoreTrend.map((s) => ({
                  name: format(new Date(s.createdAt), "MMM d"),
                  score: s.securityScore,
                }))}
              >
                <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke={chartTheme.axis} tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke={chartTheme.axis} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    border: `1px solid ${chartTheme.tooltipBorder}`,
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={chartTheme.primary}
                  strokeWidth={2}
                  dot={{ fill: chartTheme.primary, r: 3 }}
                />
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
              <h2 className="text-4xl font-bold text-cs-text">
                {stats.lastSecurityScore}
              </h2>
              <p className="text-sm text-cs-subtle mt-2">
                {stats.lastSecurityScore >= 80
                  ? "Low Risk Level"
                  : stats.lastSecurityScore >= 50
                  ? "Fair Risk Level"
                  : "High Risk Level"}
              </p>
            </>
          ) : (
            <p className="text-sm text-cs-subtle">No scans yet</p>
          )}
        </Card>
      </div>
    </div>
  );
}