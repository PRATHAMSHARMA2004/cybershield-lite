export default function SeverityBadge({ level }) {
  const styles = {
    critical: "bg-cs-danger/10 text-cs-danger",
    high:     "bg-cs-danger/10 text-cs-danger",
    medium:   "bg-cs-warning/10 text-cs-warning",
    low:      "bg-cs-success/10 text-cs-success",
    // uppercase variants
    CRITICAL: "bg-cs-danger/10 text-cs-danger",
    HIGH:     "bg-cs-danger/10 text-cs-danger",
    MEDIUM:   "bg-cs-warning/10 text-cs-warning",
    LOW:      "bg-cs-success/10 text-cs-success",
  };

  return (
    <span className={`px-3 py-1 text-xs rounded-full font-medium ${styles[level] || "bg-cs-elevated text-cs-muted"}`}>
      {String(level).toUpperCase()}
    </span>
  );
}
