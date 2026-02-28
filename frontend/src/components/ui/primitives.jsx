import Card from "./Card";

// Loading spinner
export function Spinner({ size = "md" }) {
  const dim =
    size === "lg" ? "w-10 h-10" : size === "sm" ? "w-4 h-4" : "w-6 h-6";
  return (
    <div
      className={`animate-spin ${dim} border-2 border-cs-primary border-t-transparent rounded-full`}
    />
  );
}

// Page header
export function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight text-cs-text">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-cs-muted mt-2">{subtitle}</p>
      )}
    </div>
  );
}

// Stat card
export function StatCard({ label, value, icon, accent = "primary" }) {
  const accentMap = {
    primary: "text-cs-primary",
    success: "text-cs-success",
    warning: "text-cs-warning",
    danger:  "text-cs-danger",
    muted:   "text-cs-muted",
  };
  return (
    <Card className="hover:bg-cs-elevated transition-all duration-200">
      <p className="text-xs text-cs-subtle uppercase tracking-wider">{label}</p>
      <div className="flex items-end justify-between mt-4">
        <p className="text-3xl font-semibold text-cs-text">{value ?? "—"}</p>
        <span className={`text-2xl ${accentMap[accent] || accentMap.primary}`}>
          {icon}
        </span>
      </div>
    </Card>
  );
}

// Security score circle (SVG)
export function ScoreCircle({ score, size = "lg" }) {
  const color =
    score >= 80 ? "#22C55E" : score >= 50 ? "#F59E0B" : "#EF4444";
  const label =
    score >= 80 ? "Low Risk" : score >= 50 ? "Fair Risk" : "High Risk";
  const dim = size === "lg" ? 96 : 64;
  const r   = size === "lg" ? 40 : 26;
  const c   = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        <circle
          cx={dim / 2} cy={dim / 2} r={r}
          fill="none" stroke="#1F2937" strokeWidth="6"
        />
        <circle
          cx={dim / 2} cy={dim / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${dim / 2} ${dim / 2})`}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text
          x={dim / 2} y={dim / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize={size === "lg" ? "18" : "12"}
          fontWeight="600"
        >
          {score}
        </text>
      </svg>
      <span className="text-xs font-medium" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

// Risk badge for phishing
export function RiskBadge({ riskLevel }) {
  const map = {
    safe:      { label: "Safe",      cls: "bg-cs-success/10 text-cs-success border-cs-success/20" },
    suspicious:{ label: "Suspicious",cls: "bg-cs-warning/10 text-cs-warning border-cs-warning/20" },
    high_risk: { label: "High Risk", cls: "bg-cs-danger/10  text-cs-danger  border-cs-danger/20"  },
  };
  const { label, cls } = map[riskLevel] || map.suspicious;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {label.toUpperCase()}
    </span>
  );
}
