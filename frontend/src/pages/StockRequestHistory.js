import React, { useState, useEffect, useMemo } from "react";
import { getStockRequestsByBranch, getAllStockRequests } from "../api/stockRequestApi";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/staff/PageHeader";
import Pagination, { usePagination } from "../components/staff/Pagination";
import { getStaffHomePath } from "../utils/staffNav";
import { DEFAULT_PERIOD, inPeriod, periodKey } from "../utils/period";
import PeriodFilter from "../components/staff/PeriodFilter";
import "../components/DashboardLayout.css";
import "../styles/Dashboard.css";
import "../styles/StaffPages.css";

const STATUSES = ["All", "Pending", "Approved", "Rejected"];

export default function StockRequestHistory() {
  const { userRole, branchId } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState("All");
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = userRole === "Product Manager" || userRole === "Owner"
      ? getAllStockRequests()
      : getStockRequestsByBranch(branchId);
    load
      .then((res) => setRequests([...res.data].sort((a, b) => (b.requestId || 0) - (a.requestId || 0)))) // newest first
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userRole, branchId]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      if (period.period !== "all" && !(r.createdAt && inPeriod(r.createdAt, period))) return false;
      if (status !== "All" && (r.status || "").toUpperCase() !== status.toUpperCase()) return false;
      return !q || [r.product?.productName, r.product?.brand, r.requestedBy?.fullName, r.branch?.branchName].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [requests, status, period, query]);

  const { page, setPage, pageItems, total } = usePagination(rows, [status, periodKey(period), query].join("|"));
  const count = (s) => requests.filter((r) => (r.status || "").toUpperCase() === s).length;
  const kpis = [
    { label: "Total requests", value: requests.length, hint: "All time" },
    { label: "Pending", value: count("PENDING"), hint: "Waiting for approval" },
    { label: "Approved", value: count("APPROVED"), hint: "Stock added" },
    { label: "Rejected", value: count("REJECTED"), hint: "Declined" },
  ];

  return (
    <div className="staff-page">
      <PageHeader
        title="Stock Request History"
        subtitle="Every stock request and whether it was approved."
        backTo={getStaffHomePath(userRole)}
      />

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
              <button key={s} type="button" className={`staff-chip${status === s ? " active" : ""}`} aria-pressed={status === s} onClick={() => setStatus(s)}>
                {s}
              </button>
            ))}
          </div>
          <input className="staff-input staff-search" type="search" placeholder="Search product, brand or branch" aria-label="Search requests" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {loading ? (
        <p>Loading stock requests...</p>
      ) : error ? (
        <div className="staff-empty-state">
          <h3>Couldn't load stock requests</h3>
          <p>Check that the server is running and try again.</p>
        </div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="staff-table nowrap-table">
              <thead>
                <tr>
                  <th>Requested</th>
                  <th>Product</th>
                  <th className="num">Qty</th>
                  <th>Requested by</th>
                  <th>Branch</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r) => (
                  <tr key={r.requestId}>
                    <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : <span className="staff-cell-muted">—</span>}</td>
                    <td>
                      <span className="staff-cell-strong">{r.product?.productName || "—"}</span>
                      {r.product?.brand && <span className="cell-sub">{r.product.brand}</span>}
                    </td>
                    <td className="num">{r.requestedQuantity}</td>
                    <td>{r.requestedBy?.fullName || r.requestedBy?.username || "—"}</td>
                    <td>{r.branch?.branchName || "—"}</td>
                    <td>
                      <span className={`status-badge ${(r.status || "").toLowerCase()}`}>
                        {(r.status || "").charAt(0) + (r.status || "").slice(1).toLowerCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr className="empty-row"><td colSpan="6">{requests.length === 0 ? "No stock requests yet." : "No requests match your filters."}</td></tr>
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
