import React, { useEffect, useMemo, useState } from "react";
import { getStockRequestsByBranch, approveStockRequest, rejectStockRequest } from "../api/stockRequestApi";
import { getInventoryByBranch } from "../api/productApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import PageHeader from "../components/staff/PageHeader";
import PeriodFilter from "../components/staff/PeriodFilter";
import Pagination, { usePagination } from "../components/staff/Pagination";
import { getStaffHomePath } from "../utils/staffNav";
import { DEFAULT_PERIOD, inPeriod, periodKey } from "../utils/period";
import "../components/DashboardLayout.css";
import "../styles/Dashboard.css";
import "../styles/StaffPages.css";

const STATUSES = ["Pending", "Approved", "Rejected", "All"];
const errorText = (err, fallback) => (typeof err.response?.data === "string" && err.response.data ? err.response.data : fallback);

export default function BranchManagerStockApproval() {
  const { branchId, userRole } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [requests, setRequests] = useState([]);
  const [stock, setStock] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState("Pending");
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(null);

  const load = async () => {
    try {
      const [res, inv] = await Promise.all([getStockRequestsByBranch(branchId), getInventoryByBranch(branchId).catch(() => [])]);
      setRequests([...res.data].sort((a, b) => (b.requestId || 0) - (a.requestId || 0)));
      setStock(Object.fromEntries(inv.map((i) => [i.productId, i.quantity])));
      setError(false);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const count = (s) => requests.filter((r) => r.status === s).length;
  const pendingUnits = requests.filter((r) => r.status === "PENDING").reduce((s, r) => s + Number(r.requestedQuantity || 0), 0);

  // open on the Pending tab, but fall back to All when there is nothing to review
  useEffect(() => {
    if (!loading && status === "Pending" && requests.length > 0 && count("PENDING") === 0) setStatus("All");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      if (status !== "All" && (r.status || "").toUpperCase() !== status.toUpperCase()) return false;
      if (period.period !== "all" && !(r.createdAt && inPeriod(r.createdAt, period))) return false;
      return !q || [r.product?.productName, r.product?.brand, r.requestedBy?.fullName].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [requests, status, period, query]);
  const { page, setPage, pageItems, total } = usePagination(rows, [status, periodKey(period), query].join("|"));

  const decide = async (r, approve) => {
    const have = stock[r.product?.productId] || 0;
    const ok = await confirm(
      approve
        ? `Add ${r.requestedQuantity} × ${r.product?.productName} to your stock? You have ${have} now, so you'll have ${have + r.requestedQuantity}.`
        : `Reject the request for ${r.requestedQuantity} × ${r.product?.productName}?`,
      approve ? { title: "Approve stock request", confirmLabel: "Approve" } : { title: "Reject stock request", danger: true, confirmLabel: "Reject" }
    );
    if (!ok) return;
    setBusy(r.requestId);
    try {
      await (approve ? approveStockRequest(r.requestId) : rejectStockRequest(r.requestId));
      toast.success(approve ? "Approved. Stock added to your branch." : "Request rejected.");
    } catch (err) {
      toast.error(errorText(err, "Couldn't update the request."));
    } finally {
      setBusy(null);
      load();
    }
  };

  const kpis = [
    { label: "Pending", value: count("PENDING"), hint: "Waiting for your decision" },
    { label: "Units pending", value: pendingUnits, hint: "If all are approved" },
    { label: "Approved", value: count("APPROVED"), hint: "Added to stock" },
    { label: "Rejected", value: count("REJECTED"), hint: "Declined" },
  ];

  return (
    <div className="staff-page">
      <PageHeader title="Stock Requests" subtitle="Approve or reject product requests for your branch." backTo={getStaffHomePath(userRole)} />

      <section className="dash-kpis staff-kpis" aria-label="Request summary">
        {kpis.map((k) => (
          <article key={k.label} className="dash-kpi">
            <p className="dash-kpi-label">{k.label}</p>
            <p className="dash-kpi-value">{loading ? "…" : k.value}</p>
            <p className="dash-kpi-hint">{k.hint}</p>
          </article>
        ))}
      </section>

      <div className="staff-filter-bar">
        <div className="staff-filter-group">
          <div className="staff-chips" role="group" aria-label="Filter by status">
            {STATUSES.map((s) => (
              <button key={s} type="button" className={`staff-chip${status === s ? " active" : ""}`} aria-pressed={status === s} onClick={() => setStatus(s)}>{s}</button>
            ))}
          </div>
          <input className="staff-input staff-search" type="search" placeholder="Search product or brand" aria-label="Search requests" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {!branchId ? (
        <div className="staff-empty-state"><h3>No branch assigned</h3><p>Ask the owner to assign your account to a branch.</p></div>
      ) : loading ? (
        <p>Loading stock requests...</p>
      ) : error ? (
        <div className="staff-empty-state"><h3>Couldn't load stock requests</h3><p>Check that the server is running and try again.</p></div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="staff-table nowrap-table">
              <thead>
                <tr><th>Requested</th><th>Product</th><th className="num">Qty</th><th className="num">In stock now</th><th>Requested by</th><th>Status</th><th className="staff-th-right">Actions</th></tr>
              </thead>
              <tbody>
                {pageItems.map((r) => {
                  const st = (r.status || "").toUpperCase();
                  const have = stock[r.product?.productId] ?? 0;
                  return (
                    <tr key={r.requestId}>
                      <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : <span className="staff-cell-muted">—</span>}</td>
                      <td><span className="staff-cell-strong">{r.product?.productName || "—"}</span>{r.product?.brand && <span className="cell-sub">{r.product.brand}</span>}</td>
                      <td className="num">{r.requestedQuantity}</td>
                      <td className="num"><span className={have < 5 ? "stock-low" : ""}>{have}</span></td>
                      <td>{r.requestedBy?.fullName || r.requestedBy?.username || "—"}</td>
                      <td><span className={`status-badge ${st.toLowerCase()}`}>{st.charAt(0) + st.slice(1).toLowerCase()}</span></td>
                      <td className="staff-row-actions">
                        {st === "PENDING" && (
                          <>
                            <button className="dashboard-btn-primary" disabled={busy === r.requestId} onClick={() => decide(r, true)}>Approve</button>
                            <button className="dashboard-btn-delete" disabled={busy === r.requestId} onClick={() => decide(r, false)}>Reject</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr className="empty-row"><td colSpan="7">{status === "Pending" ? "No requests waiting for approval." : "No requests match your filters."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} onPage={setPage} />
        </>
      )}
    </div>
  );
}
