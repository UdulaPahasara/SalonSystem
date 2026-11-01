import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getServicesByBranch, createService, updateService, deleteService } from "../api/serviceApi";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import PageHeader from "../components/staff/PageHeader";
import Pagination, { usePagination } from "../components/staff/Pagination";
import { getStaffHomePath } from "../utils/staffNav";
import { rs } from "../utils/format";
import "../components/DashboardLayout.css";
import "../styles/Dashboard.css";
import "../styles/StaffPages.css";

const CATEGORIES = ["Hair Care", "Skin & Facials", "Nails", "Bridal & Occasions", "Spa & Wellness"];
const EMPTY = { name: "", category: CATEGORIES[0], price: "", durationMins: "" };
const errorText = (err, fallback) => (typeof err.response?.data === "string" && err.response.data ? err.response.data : fallback);

export default function BranchServiceManagement() {
  const { branchId, userRole } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () =>
    getServicesByBranch(branchId)
      .then(setServices)
      .catch(() => toast.error("Couldn't load services."))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (branchId) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const openDialog = (s = null) => {
    setEditing(s);
    setForm(s ? { name: s.name, category: s.category || CATEGORIES[0], price: String(s.price), durationMins: String(s.durationMins) } : EMPTY);
    setDialog(true);
  };

  // Dashboard "Add a service" opens the dialog straight away (?new=1)
  useEffect(() => {
    if (searchParams.get("new")) {
      openDialog();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => ["All", ...new Set([...CATEGORIES.filter((c) => services.some((s) => s.category === c)), ...services.map((s) => s.category).filter(Boolean)])], [services]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services
      .filter((s) => (category === "All" || s.category === category) && (!q || (s.name || "").toLowerCase().includes(q)))
      .sort((a, b) => (a.category || "").localeCompare(b.category || "") || a.name.localeCompare(b.name));
  }, [services, category, query]);
  const { page, setPage, pageItems, total } = usePagination(rows, `${category}|${query}`);

  const save = async (e) => {
    e.preventDefault();
    const payload = { name: form.name.trim(), category: form.category, price: parseFloat(form.price), durationMins: parseInt(form.durationMins, 10), branch: { id: branchId } };
    setSaving(true);
    try {
      if (editing) await updateService(editing.serviceId, payload);
      else await createService(payload);
      toast.success(editing ? "Service updated." : "Service added.");
      setDialog(false);
      load();
    } catch (err) {
      toast.error(errorText(err, "Couldn't save the service."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    const ok = await confirm(`Delete ${s.name}? It will disappear from the public price list.`, { title: "Delete service", danger: true, confirmLabel: "Delete" });
    if (!ok) return;
    try {
      await deleteService(s.serviceId);
      toast.success("Service deleted.");
      load();
    } catch (err) {
      toast.error(errorText(err, "Couldn't delete the service."));
    }
  };

  const avg = services.length ? services.reduce((s, x) => s + Number(x.price), 0) / services.length : 0;
  const kpis = [
    { label: "Services", value: services.length, hint: "On your public menu" },
    { label: "Categories", value: new Set(services.map((s) => s.category).filter(Boolean)).size, hint: "Groups customers browse by" },
    { label: "Average price", value: rs(Math.round(avg)), hint: "Across all services" },
  ];

  return (
    <div className="staff-page">
      <PageHeader
        title="Branch Services"
        subtitle="Your menu, prices and durations. Changes show on the public website."
        backTo={getStaffHomePath(userRole)}
        actions={<button className="staff-btn staff-btn-primary" onClick={() => openDialog()}>+ Add Service</button>}
      />

      <section className="dash-kpis staff-kpis" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }} aria-label="Menu summary">
        {kpis.map((k) => (
          <article key={k.label} className="dash-kpi">
            <p className="dash-kpi-label">{k.label}</p>
            <p className="dash-kpi-value">{loading ? "…" : k.value}</p>
            <p className="dash-kpi-hint">{k.hint}</p>
          </article>
        ))}
      </section>

      <div className="staff-filter-bar">
        <div className="staff-chips" role="group" aria-label="Filter by category">
          {categories.map((c) => (
            <button key={c} type="button" className={`staff-chip${category === c ? " active" : ""}`} aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
        <input className="staff-input staff-search" type="search" placeholder="Search services" aria-label="Search services" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {loading ? (
        <p>Loading services...</p>
      ) : services.length === 0 ? (
        <div className="staff-empty-state">
          <h3>No services yet</h3>
          <p>Add your first service so customers can see it and cashiers can sell it.</p>
          <button className="staff-btn staff-btn-primary" onClick={() => openDialog()}>+ Add Service</button>
        </div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="staff-table nowrap-table">
              <thead>
                <tr><th>Service</th><th className="num">Duration</th><th className="num">Price</th><th className="staff-th-right">Actions</th></tr>
              </thead>
              <tbody>
                {pageItems.map((s) => (
                  <tr key={s.serviceId}>
                    <td>
                      <span className="staff-cell-strong">{s.name}</span>
                      <span className="cell-sub">{s.category || "Other"}</span>
                    </td>
                    <td className="num">{s.durationMins} min</td>
                    <td className="num staff-cell-strong">{rs(s.price)}</td>
                    <td className="staff-row-actions">
                      <button className="dashboard-btn-edit" onClick={() => openDialog(s)}>Edit</button>
                      <button className="dashboard-btn-delete" onClick={() => remove(s)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr className="empty-row"><td colSpan="4">No services match your filters.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} onPage={setPage} />
        </>
      )}

      {dialog && (
        <div className="modal-overlay" onClick={() => setDialog(false)}>
          <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="svc-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="svc-title">{editing ? "Edit service" : "Add service"}</h3>
            <form onSubmit={save}>
              <div className="form-group">
                <label htmlFor="svc-name">Service name</label>
                <input id="svc-name" className="staff-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus required />
              </div>
              <div className="form-group">
                <label htmlFor="svc-cat">Category</label>
                <select id="svc-cat" className="staff-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="svc-price">Price (Rs.)</label>
                  <input id="svc-price" type="number" min="1" step="0.01" className="staff-input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="svc-dur">Duration (minutes)</label>
                  <input id="svc-dur" type="number" min="5" step="5" className="staff-input" value={form.durationMins} onChange={(e) => setForm({ ...form, durationMins: e.target.value })} required />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="staff-btn staff-btn-secondary" onClick={() => setDialog(false)}>Cancel</button>
                <button type="submit" className="staff-btn staff-btn-primary" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Add service"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
