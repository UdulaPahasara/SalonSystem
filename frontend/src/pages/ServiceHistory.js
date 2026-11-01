import React, { useEffect, useMemo, useState } from "react";
import { getAllTransactions, getTransactionsByBranch } from "../api/usersApi";
import { getBranches } from "../api/branchApi";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/staff/PageHeader";
import Pagination, { usePagination } from "../components/staff/Pagination";
import { getStaffHomePath } from "../utils/staffNav";
import { rs, PERIODS, inPeriod, downloadCsv } from "../utils/format";
import "../components/DashboardLayout.css";
import "../styles/Dashboard.css";
import "../styles/StaffPages.css";

// A "service performed" is a service line on a completed checkout.
function toServiceRows(transactions) {
  return transactions
    .flatMap((t) =>
      (t.items || [])
        .filter((i) => i.service)
        .map((i) => ({
          key: `${t.transactionId}-${i.id}`,
          date: t.dateTime,
          name: i.service.name,
          category: i.service.category || "Other",
          qty: i.quantity,
          revenue: Number(i.unitPrice || i.service.price || 0) * i.quantity,
          customer: t.customer ? t.customer.fullName : null,
          branch: t.branch,
          cashier: t.cashier ? t.cashier.fullName : null,
        }))
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export default function ServiceHistory() {
  const { userRole, branchId: ownBranchId } = useAuth();
  const isOwner = userRole === "Owner";
  const [rowsAll, setRowsAll] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [category, setCategory] = useState("All");
  const [period, setPeriod] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOwner) getBranches().then(setBranches).catch(() => {});
  }, [isOwner]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const load = isOwner ? (branchId ? getTransactionsByBranch(branchId) : getAllTransactions()) : getTransactionsByBranch(ownBranchId);
    load
      .then((data) => setRowsAll(toServiceRows(data)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [isOwner, branchId, ownBranchId]);

  const categories = useMemo(() => ["All", ...new Set(rowsAll.map((r) => r.category))], [rowsAll]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rowsAll.filter(
      (r) =>
        inPeriod(r.date, period) &&
        (category === "All" || r.category === category) &&
        (!q || [r.name, r.customer, r.cashier].some((v) => (v || "").toLowerCase().includes(q)))
    );
  }, [rowsAll, period, category, query]);

  const { page, setPage, pageItems, total } = usePagination(rows, [period, category, query, branchId].join("|"));

  const performed = rows.reduce((s, r) => s + r.qty, 0);
  const revenue = rows.reduce((s, r) => s + r.revenue, 0);
  const popular = useMemo(() => {
    const tally = {};
    rows.forEach((r) => { tally[r.name] = (tally[r.name] || 0) + r.qty; });
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
    return top ? { name: top[0], count: top[1] } : null;
  }, [rows]);

  const kpis = [
    { label: "Services performed", value: performed, hint: "In the selected period" },
    { label: "Service revenue", value: rs(revenue), hint: "From checkout sales" },
    { label: "Average price", value: rs(performed ? revenue / performed : 0), hint: "Per service" },
    { label: "Most popular", value: popular ? popular.name : "—", hint: popular ? `${popular.count} performed` : "No services yet" },
  ];

  const exportCsv = () =>
    downloadCsv(
      `service-history-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Date", "Service", "Category", "Qty", "Revenue", "Customer", "Branch", "Cashier"],
      rows.map((r) => [new Date(r.date).toLocaleString(), r.name, r.category, r.qty, r.revenue, r.customer || "Walk-in", r.branch?.branchName, r.cashier])
    );

  return (
    <div className="staff-page">
      <PageHeader
        title="Service History"
        subtitle="Every service performed, from completed checkouts."
        backTo={getStaffHomePath(userRole)}
        actions={
          <button className="staff-btn staff-btn-secondary" onClick={exportCsv} disabled={rows.length === 0}>
            Export CSV
          </button>
        }
      />

      <section className="dash-kpis staff-kpis" aria-label="Service summary">
        {kpis.map((k) => (
          <article key={k.label} className="dash-kpi">
            <p className="dash-kpi-label">{k.label}</p>
            <p className="dash-kpi-value dash-kpi-value-sm">{loading ? "…" : k.value}</p>
            <p className="dash-kpi-hint">{k.hint}</p>
          </article>
        ))}
      </section>

      <div className="staff-filter-bar">
        <div className="staff-filter-group">
          <div className="staff-chips" role="group" aria-label="Filter by category">
            {categories.map((c) => (
              <button key={c} type="button" className={`staff-chip${category === c ? " active" : ""}`} aria-pressed={category === c} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
          <input className="staff-input staff-search" type="search" placeholder="Search service or customer" aria-label="Search services" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="staff-filter-group">
          <select className="staff-input" aria-label="Period" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIODS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          {isOwner && (
            <select className="staff-input" aria-label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.branchName}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <p>Loading services...</p>
      ) : error ? (
        <div className="staff-empty-state">
          <h3>Couldn't load service history</h3>
          <p>Check that the server is running and try again.</p>
        </div>
      ) : rowsAll.length === 0 ? (
        <div className="staff-empty-state">
          <h3>No services recorded yet</h3>
          <p>Services appear here after a cashier checks out a sale that includes them.</p>
        </div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="staff-table nowrap-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Service</th>
                  <th>Customer</th>
                  {isOwner && <th>Branch</th>}
                  <th className="num">Qty</th>
                  <th className="num">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r) => (
                  <tr key={r.key}>
                    <td>
                      {new Date(r.date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                      <span className="cell-sub">{new Date(r.date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                    </td>
                    <td>
                      <span className="staff-cell-strong">{r.name}</span>
                      <span className="cell-sub">{r.category}</span>
                    </td>
                    <td>{r.customer || <span className="staff-cell-muted">Walk-in</span>}</td>
                    {isOwner && <td>{r.branch ? r.branch.branchName : "—"}</td>}
                    <td className="num">{r.qty}</td>
                    <td className="num staff-cell-strong">{rs(r.revenue)}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr className="empty-row"><td colSpan={isOwner ? 6 : 5}>No services match your filters.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} onPage={setPage} />
        </>
      )}
    </div>
  );
}
