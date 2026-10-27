import React, { useEffect, useMemo, useState } from "react";
import { getBranches } from "../api/branchApi";
import { getAllTransactions, getTransactionsByBranch } from "../api/usersApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/staff/PageHeader";
import { getStaffHomePath } from "../utils/staffNav";
import { rs, PERIODS, inPeriod, downloadCsv } from "../utils/format";
import "../components/DashboardLayout.css";
import "../styles/Dashboard.css";
import "../styles/StaffPages.css";

const METHODS = ["All", "Cash", "Card"];
const itemName = (i) => (i.service ? i.service.name : i.product ? i.product.productName : "Item");

export default function AdminBillingHistory() {
  const { userRole } = useAuth();
  const toast = useToast();
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState("All");
  const [period, setPeriod] = useState("all");
  const [open, setOpen] = useState(null);

  useEffect(() => {
    getBranches().then(setBranches).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    (branchId ? getTransactionsByBranch(branchId) : getAllTransactions())
      .then((data) => setTransactions([...data].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))))
      .catch(() => toast.error("Error loading transactions."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const rows = useMemo(
    () =>
      transactions.filter(
        (t) => inPeriod(t.dateTime, period) && (method === "All" || (t.paymentMethod || "").toUpperCase() === method.toUpperCase())
      ),
    [transactions, period, method]
  );

  const total = rows.reduce((s, t) => s + Number(t.totalAmount || 0), 0);
  const cardCount = rows.filter((t) => (t.paymentMethod || "").toUpperCase() === "CARD").length;
  const kpis = [
    { label: "Total sales", value: rs(total), hint: "For the selected filters" },
    { label: "Transactions", value: rows.length, hint: "Completed checkouts" },
    { label: "Average sale", value: rs(rows.length ? total / rows.length : 0), hint: "Per transaction" },
    { label: "Card payments", value: rows.length ? `${Math.round((cardCount / rows.length) * 100)}%` : "—", hint: `${cardCount} of ${rows.length}` },
  ];

  const exportCsv = () =>
    downloadCsv(
      `billing-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Receipt", "Date", "Branch", "Cashier", "Customer", "Payment", "Amount"],
      rows.map((t) => [t.transactionId, new Date(t.dateTime).toLocaleString(), t.branch?.branchName, t.cashier?.fullName, t.customer?.fullName || "Walk-in", t.paymentMethod, t.totalAmount])
    );

  return (
    <div className="staff-page">
      <PageHeader
        title="Billing & Payments"
        subtitle="Every sale across your branches."
        backTo={getStaffHomePath(userRole)}
        actions={
          <button className="staff-btn staff-btn-secondary" onClick={exportCsv} disabled={rows.length === 0}>
            Export CSV
          </button>
        }
      />

      <section className="dash-kpis staff-kpis" aria-label="Sales summary">
        {kpis.map((k) => (
          <article key={k.label} className="dash-kpi">
            <p className="dash-kpi-label">{k.label}</p>
            <p className="dash-kpi-value">{loading ? "…" : k.value}</p>
            <p className="dash-kpi-hint">{k.hint}</p>
          </article>
        ))}
      </section>

      <div className="staff-filter-bar">
        <div className="staff-chips" role="group" aria-label="Filter by payment method">
          {METHODS.map((m) => (
            <button key={m} type="button" className={`staff-chip${method === m ? " active" : ""}`} aria-pressed={method === m} onClick={() => setMethod(m)}>
              {m}
            </button>
          ))}
        </div>
        <div className="staff-filter-group">
          <select className="staff-input" aria-label="Period" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIODS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <select className="staff-input" aria-label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.branchName}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading transactions...</p>
      ) : transactions.length === 0 ? (
        <div className="staff-empty-state">
          <h3>No transactions yet</h3>
          <p>Sales appear here after a cashier completes a checkout.</p>
        </div>
      ) : (
        <div className="table-scroll">
        <table className="staff-table nowrap-table">
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Date</th>
              <th>Branch</th>
              <th>Customer</th>
              <th>Payment</th>
              <th className="num">Amount</th>
              <th aria-label="Details" />
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <React.Fragment key={t.transactionId}>
                <tr>
                  <td className="staff-cell-strong">#{t.transactionId}</td>
                  <td>
                    {new Date(t.dateTime).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {t.cashier && <span className="cell-sub">by {t.cashier.fullName}</span>}
                  </td>
                  <td>{t.branch ? t.branch.branchName : "—"}</td>
                  <td>
                    {t.customer ? t.customer.fullName : <span className="staff-cell-muted">Walk-in</span>}
                    {t.customer && t.customer.loyaltyMember && <span className="status-badge loyalty">Loyalty</span>}
                  </td>
                  <td><span className="status-badge method">{(t.paymentMethod || "").toUpperCase() === "CARD" ? "Card" : "Cash"}</span></td>
                  <td className="num staff-cell-strong">{rs(t.totalAmount)}</td>
                  <td className="num">
                    <button className="link-btn" aria-expanded={open === t.transactionId} onClick={() => setOpen(open === t.transactionId ? null : t.transactionId)}>
                      {open === t.transactionId ? "Hide" : "Details"}
                    </button>
                  </td>
                </tr>
                {open === t.transactionId && (
                  <tr className="row-detail">
                    <td colSpan="7">
                      <ul className="row-detail-list">
                        {(t.items || []).map((i) => (
                          <li key={i.id}>
                            <span>{itemName(i)} × {i.quantity}</span>
                            <span>{rs(Number(i.unitPrice) * i.quantity)}</span>
                          </li>
                        ))}
                        {(!t.items || t.items.length === 0) && <li><span>No line items recorded.</span></li>}
                      </ul>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {rows.length === 0 && <tr className="empty-row"><td colSpan="7">No transactions match your filters.</td></tr>}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
