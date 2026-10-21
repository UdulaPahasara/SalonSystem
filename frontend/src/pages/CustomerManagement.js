import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getAllCustomers, createCustomer, updateCustomer, deleteCustomer } from "../api/customerApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import PageHeader from "../components/staff/PageHeader";
import Pagination, { usePagination } from "../components/staff/Pagination";
import { getStaffHomePath } from "../utils/staffNav";
import "../components/DashboardLayout.css";
import "../styles/Dashboard.css";
import "../styles/StaffPages.css";

const EMPTY = { fullName: "", phone: "", email: "", loyaltyMember: false };
const errorText = (err, fallback) => (typeof err.response?.data === "string" && err.response.data ? err.response.data : fallback);

export default function CustomerManagement() {
  const { branchId, userRole } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () =>
    getAllCustomers(branchId)
      .then(setCustomers)
      .catch(() => toast.error("Couldn't load customers."))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const openDialog = (c = null) => {
    setEditing(c);
    setForm(c ? { fullName: c.fullName, phone: c.phone, email: c.email || "", loyaltyMember: !!c.loyaltyMember } : EMPTY);
    setDialog(true);
  };

  // Dashboard "Register customer" opens the dialog straight away (?new=1)
  useEffect(() => {
    if (searchParams.get("new")) {
      openDialog();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers
      .filter((c) => (filter === "All" || c.loyaltyMember) && (!q || [c.fullName, c.phone, c.email].some((v) => (v || "").toLowerCase().includes(q))))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [customers, filter, query]);
  const { page, setPage, pageItems, total } = usePagination(rows, `${filter}|${query}`);

  const save = async (e) => {
    e.preventDefault();
    const phone = form.phone.replace(/\s|-/g, "");
    if (!/^\d{10}$/.test(phone)) {
      toast.error("Enter a 10-digit phone number, for example 0771234567.");
      return;
    }
    setSaving(true);
    try {
      const payload = { fullName: form.fullName.trim(), phone, email: form.email.trim(), loyaltyMember: form.loyaltyMember };
      if (editing) await updateCustomer(editing.customerId, payload);
      else await createCustomer({ ...payload, branchId });
      toast.success(editing ? "Customer updated." : "Customer registered.");
      setDialog(false);
      load();
    } catch (err) {
      toast.error(errorText(err, "Couldn't save the customer."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    const ok = await confirm(`Delete ${c.fullName}? This cannot be undone.`, { title: "Delete customer", danger: true, confirmLabel: "Delete" });
    if (!ok) return;
    try {
      await deleteCustomer(c.customerId);
      toast.success("Customer deleted.");
      load();
    } catch (err) {
      toast.error(errorText(err, "Couldn't delete the customer."));
    }
  };

  const members = customers.filter((c) => c.loyaltyMember).length;
  const kpis = [
    { label: "Customers", value: customers.length, hint: "Registered at your branch" },
    { label: "Loyalty members", value: members, hint: customers.length ? `${Math.round((members / customers.length) * 100)}% of customers` : "—" },
    { label: "Loyalty points", value: customers.reduce((s, c) => s + Number(c.loyaltyPoints || 0), 0).toLocaleString(), hint: "Members earn 1 point per Rs. 100" },
  ];

  return (
    <div className="staff-page">
      <PageHeader
        title="Customers"
        subtitle="Client records for your branch."
        backTo={getStaffHomePath(userRole)}
        actions={<button className="staff-btn staff-btn-primary" onClick={() => openDialog()}>+ Register Customer</button>}
      />

      <section className="dash-kpis staff-kpis" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }} aria-label="Customer summary">
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
          <div className="staff-chips" role="group" aria-label="Filter customers">
            {["All", "Loyalty members"].map((f) => (
              <button key={f} type="button" className={`staff-chip${filter === f ? " active" : ""}`} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
          <input className="staff-input staff-search" type="search" placeholder="Search name, phone or email" aria-label="Search customers" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <p>Loading customers...</p>
      ) : customers.length === 0 ? (
        <div className="staff-empty-state">
          <h3>No customers yet</h3>
          <p>Register your first client to start booking appointments.</p>
          <button className="staff-btn staff-btn-primary" onClick={() => openDialog()}>+ Register Customer</button>
        </div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="staff-table nowrap-table">
              <thead>
                <tr><th>Customer</th><th>Phone</th><th>Loyalty</th><th className="staff-th-right">Actions</th></tr>
              </thead>
              <tbody>
                {pageItems.map((c) => (
                  <tr key={c.customerId}>
                    <td>
                      <span className="staff-cell-strong">{c.fullName}</span>
                      {c.email && <span className="cell-sub">{c.email}</span>}
                    </td>
                    <td>{c.phone}</td>
                    <td>
                      {c.loyaltyMember ? <><span className="status-badge loyalty" style={{ marginLeft: 0 }}>Member</span> <span className="staff-cell-muted">{c.loyaltyPoints} pts</span></> : <span className="staff-cell-muted">—</span>}
                    </td>
                    <td className="staff-row-actions">
                      <Link className="dashboard-btn-primary" style={{ textDecoration: "none" }} to={`/reception/appointments?new=1&customer=${c.customerId}`}>Book</Link>
                      <button className="dashboard-btn-edit" onClick={() => openDialog(c)}>Edit</button>
                      <button className="dashboard-btn-delete" onClick={() => remove(c)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr className="empty-row"><td colSpan="4">No customers match your filters.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} onPage={setPage} />
        </>
      )}

      {dialog && (
        <div className="modal-overlay" onClick={() => setDialog(false)}>
          <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="cust-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="cust-title">{editing ? "Edit customer" : "Register customer"}</h3>
            <form onSubmit={save}>
              <div className="form-group">
                <label htmlFor="cust-name">Full name</label>
                <input id="cust-name" className="staff-input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} autoFocus required />
              </div>
              <div className="form-group">
                <label htmlFor="cust-phone">Phone (10 digits)</label>
                <input id="cust-phone" type="tel" inputMode="numeric" className="staff-input" placeholder="0771234567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </div>
              <div className="form-group">
                <label htmlFor="cust-email">Email (optional)</label>
                <input id="cust-email" type="email" className="staff-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <label className="form-check">
                <input type="checkbox" checked={form.loyaltyMember} onChange={(e) => setForm({ ...form, loyaltyMember: e.target.checked })} />
                Loyalty member
              </label>
              <div className="modal-actions">
                <button type="button" className="staff-btn staff-btn-secondary" onClick={() => setDialog(false)}>Cancel</button>
                <button type="submit" className="staff-btn staff-btn-primary" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Register"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
