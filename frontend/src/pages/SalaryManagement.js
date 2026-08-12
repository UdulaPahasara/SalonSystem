import React, { useEffect, useMemo, useState } from "react";
import { getStaffSalaryStatus, paySalary, updateBaseSalary } from "../api/usersApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import PageHeader from "../components/staff/PageHeader";
import Pagination, { usePagination } from "../components/staff/Pagination";
import { getStaffHomePath } from "../utils/staffNav";
import { rs } from "../utils/format";
import "../components/DashboardLayout.css";
import "../styles/Dashboard.css";
import "../styles/StaffPages.css";

const FILTERS = ["All", "Unpaid", "Paid"];

export default function SalaryManagement() {
  const { userRole } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [newSalary, setNewSalary] = useState("");

  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const load = () => {
    setLoading(true);
    setError(false);
    return getStaffSalaryStatus(month)
      .then(setStaff)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const totals = useMemo(() => {
    const payroll = staff.reduce((s, m) => s + Number(m.baseSalary || 0), 0);
    const paid = staff.filter((m) => m.isPaid).reduce((s, m) => s + Number(m.baseSalary || 0), 0);
    return { payroll, paid, outstanding: payroll - paid, paidCount: staff.filter((m) => m.isPaid).length };
  }, [staff]);

  const rows = staff.filter((m) => {
    if (filter === "Paid" && !m.isPaid) return false;
    if (filter === "Unpaid" && m.isPaid) return false;
    const q = query.trim().toLowerCase();
    return !q || [m.name, m.role, m.branch].some((v) => (v || "").toLowerCase().includes(q));
  });

  const { page, setPage, pageItems, total: rowCount } = usePagination(rows, `${filter}|${query}|${month}`);

  const handlePay = async (member) => {
    const ok = await confirm(`Pay ${rs(member.baseSalary)} to ${member.name} for ${monthLabel}?`, {
      title: "Confirm salary payment",
      confirmLabel: "Pay",
    });
    if (!ok) return;
    try {
      await paySalary({ type: member.type, id: member.id, amount: member.baseSalary, month });
      toast.success(`Paid ${member.name} for ${monthLabel}.`);
      load();
    } catch (err) {
      toast.error("Failed to record payment.");
    }
  };

  const openEditor = (member) => {
    setEditing(member);
    setNewSalary(member.baseSalary || "");
  };

  const saveSalary = async (e) => {
    e.preventDefault();
    const value = parseFloat(newSalary);
    if (Number.isNaN(value) || value < 0) {
      toast.error("Enter a valid salary amount (0 or more).");
      return;
    }
    try {
      await updateBaseSalary({ type: editing.type, id: editing.id, baseSalary: value });
      toast.success("Base salary updated.");
      setEditing(null);
      load();
    } catch (err) {
      toast.error("Failed to update salary.");
    }
  };

  const kpis = [
    { label: "Monthly payroll", value: rs(totals.payroll), hint: `${staff.length} staff` },
    { label: "Paid", value: rs(totals.paid), hint: `${totals.paidCount} of ${staff.length} paid` },
    { label: "Outstanding", value: rs(totals.outstanding), hint: `For ${monthLabel}` },
  ];

  return (
    <div className="staff-page">
      <PageHeader
        title="Salary"
        subtitle="Set base salaries and record monthly payments."
        backTo={getStaffHomePath(userRole)}
      />

      <section className="dash-kpis staff-kpis" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }} aria-label="Payroll summary">
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
          <div className="staff-chips" role="group" aria-label="Filter by payment status">
            {FILTERS.map((f) => (
              <button key={f} type="button" className={`staff-chip${filter === f ? " active" : ""}`} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
          <input
            className="staff-input staff-search"
            type="search"
            placeholder="Search name, role or branch"
            aria-label="Search staff"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label className="staff-field-inline" htmlFor="salary-month">
          Month
          <input id="salary-month" type="month" className="staff-input" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        </label>
      </div>

      {loading ? (
        <p>Loading staff...</p>
      ) : error ? (
        <div className="staff-empty-state">
          <h3>Couldn't load salary data</h3>
          <p>Check that the server is running and try again.</p>
        </div>
      ) : (
        <table className="staff-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Branch</th>
              <th className="num">Base salary</th>
              <th>Status</th>
              <th className="staff-th-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((m) => (
              <tr key={`${m.type}-${m.id}`}>
                <td className="staff-cell-strong">{m.name}</td>
                <td><span className="role-badge">{m.role}</span></td>
                <td>{m.branch || <span className="staff-cell-muted">Head Office</span>}</td>
                <td className="num">{m.baseSalary ? rs(m.baseSalary) : <span className="staff-cell-muted">Not set</span>}</td>
                <td>
                  <span className={`status-badge ${m.isPaid ? "paid" : "pending"}`}>{m.isPaid ? "Paid" : "Unpaid"}</span>
                </td>
                <td className="staff-row-actions">
                  {!m.isPaid && (
                    <button
                      className="dashboard-btn-primary"
                      disabled={!m.baseSalary}
                      title={m.baseSalary ? undefined : "Set a base salary first"}
                      onClick={() => handlePay(m)}
                    >
                      Pay
                    </button>
                  )}
                  <button className="dashboard-btn-edit" onClick={() => openEditor(m)}>
                    {m.baseSalary ? "Edit salary" : "Set salary"}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr className="empty-row"><td colSpan="6">No staff match your filters.</td></tr>
            )}
          </tbody>
        </table>
      )}
      {!loading && !error && <Pagination page={page} total={rowCount} onPage={setPage} />}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="salary-dialog-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="salary-dialog-title">Base salary</h3>
            <form onSubmit={saveSalary}>
              <div className="form-group">
                <label htmlFor="base-salary">{editing.name} — monthly base salary (Rs.)</label>
                <input id="base-salary" type="number" min="0" step="0.01" className="staff-input" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} autoFocus required />
              </div>
              <div className="modal-actions">
                <button type="button" className="staff-btn staff-btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="staff-btn staff-btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
