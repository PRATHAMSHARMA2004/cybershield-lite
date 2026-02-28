import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getScanHistory, downloadReport } from "../services/api";
import Card from "../components/ui/Card";
import SeverityBadge from "../components/ui/SeverityBadge";
import { GhostButton, PrimaryButton } from "../components/ui/Button";
import { PageHeader, Spinner } from "../components/ui/primitives";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function HistoryPage() {
  const [scans, setScans] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    setLoading(true);
    getScanHistory(page)
      .then((res) => { setScans(res.data.scans); setPagination(res.data.pagination); })
      .catch(() => toast.error("Failed to load history"))
      .finally(() => setLoading(false));
  }, [page]);

  const handleDownload = async (scanId, e) => {
    e.stopPropagation();
    setDownloading(scanId);
    try { await downloadReport(scanId); toast.success("Report downloaded"); }
    catch { toast.error("Failed to generate report"); }
    finally { setDownloading(null); }
  };

  const statusStyle = {
    completed: "bg-cs-success/10 text-cs-success",
    running:   "bg-cs-primary/10 text-cs-primary",
    failed:    "bg-cs-danger/10  text-cs-danger",
    pending:   "bg-cs-elevated   text-cs-muted",
  };

  return (
    <div>
      <PageHeader title="Scan History" subtitle={`${pagination.total ?? 0} total scans`} />

      {loading ? (
        <div className="flex justify-center pt-20"><Spinner size="lg" /></div>
      ) : scans.length === 0 ? (
        <div className="text-center py-20 text-cs-subtle">
          <p className="text-sm">No scans yet</p>
          <Link to="/scan" className="text-cs-primary text-sm mt-2 inline-block hover:opacity-80">
            Start your first scan →
          </Link>
        </div>
      ) : (
        <>
          <Card className="p-0 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 text-xs font-medium text-cs-subtle uppercase tracking-wider px-6 py-3 border-b border-cs-border bg-cs-elevated">
              <div className="col-span-5">Website</div>
              <div className="col-span-2">Score</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {scans.map((scan, idx) => (
              <div key={scan._id}
                className={`grid grid-cols-12 items-center px-6 py-4 hover:bg-cs-elevated transition-all duration-200 ${idx < scans.length - 1 ? "border-b border-cs-border" : ""}`}>
                <div className="col-span-5 min-w-0 pr-4">
                  <p className="text-sm text-cs-text font-medium truncate">{scan.websiteUrl}</p>
                  {scan.summary && (
                    <p className="text-xs text-cs-subtle mt-0.5">
                      {scan.summary.critical > 0 && <span className="text-cs-danger">{scan.summary.critical}C </span>}
                      {scan.summary.high > 0     && <span className="text-cs-danger">{scan.summary.high}H </span>}
                      {scan.summary.medium > 0   && <span className="text-cs-warning">{scan.summary.medium}M </span>}
                      {scan.summary.low > 0      && <span className="text-cs-success">{scan.summary.low}L</span>}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  {scan.status === "completed" && scan.securityScore !== null ? (
                    <span className={`text-sm font-semibold ${
                      scan.securityScore >= 80 ? "text-cs-success" :
                      scan.securityScore >= 50 ? "text-cs-warning" : "text-cs-danger"
                    }`}>
                      {scan.securityScore}
                    </span>
                  ) : <span className="text-cs-subtle text-sm">—</span>}
                </div>
                <div className="col-span-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyle[scan.status] || statusStyle.pending}`}>
                    {scan.status}
                  </span>
                </div>
                <div className="col-span-2 text-xs text-cs-subtle">
                  {format(new Date(scan.createdAt), "PP")}
                </div>
                <div className="col-span-1 flex justify-end gap-2">
                  {scan.status === "completed" && (
                    <>
                      <Link to={`/scan/${scan._id}`}
                        className="text-xs text-cs-primary hover:opacity-80 transition-opacity">
                        View
                      </Link>
                      <button onClick={(e) => handleDownload(scan._id, e)} disabled={downloading === scan._id}
                        className="text-xs text-cs-subtle hover:text-cs-text transition-colors disabled:opacity-40">
                        {downloading === scan._id ? "..." : "PDF"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </Card>

          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm transition-all duration-200 ${
                    p === page
                      ? "bg-cs-primary text-white"
                      : "text-cs-muted hover:text-cs-text hover:bg-cs-elevated"
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
