import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getServiceStaff, createServiceStaff, updateServiceStaff, deleteServiceStaff } from "../api/staffApi";
import { getUsersByBranch } from "../api/usersApi";
import { getAllAppointments } from "../api/appointmentApi";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import PageHeader from "../components/staff/PageHeader";
import Pagination, { usePagination } from "../components/staff/Pagination";
import { getStaffHomePath } from "../utils/staffNav";
import { getRoleDisplayName } from "../utils/authRoutes";
import "../components/DashboardLayout.css";
import "../styles/Dashboard.css";
import "../styles/StaffPages.css";

const ROLES = ["Stylist", "Barber", "Therapist", "Makeup Artist", "Nail Technician"];
const errorText = (err, fallback) => (typeof err.response?.data === "string" && err.response.data ? err.response.data : fallback);

export default function BranchStaffManagement() {
  const { branchId, userRole } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [staff, setStaff] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ fullName: "", role: ROLES[0] });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [s, a, ap] = await Promise.allSettled([getServiceStaff(branchId), getUsersByBranch(branchId), getAllAppointments(branchId)]);
    setStaff(s.status === "fulfilled" ? s.value : []);
    setAccounts(a.status === "fulfilled" ? a.value : []);
    setAppts(ap.status === "fulfilled" ? ap.value : []);
    if (s.status === "rejected") toast.error("Couldn't load staff.");
    setLoading(false);
  };

  useEffect(() => {
    if (branchId) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const upcoming = useMemo(() => {
    const now = new Date();
    const map = {};
    appts.forEach((a) => {
      if (a.assignedStaff && (a.status || "BOOKED") === "BOOKED" && new Date(a.appointmentTime) >= now) map[a.assignedStaff.id] = (map[a.assignedStaff.id] || 0) + 1;
    });
    return map;
  }, [appts]);

  const rows = staff.filter((s) => { const q = query.trim().toLowerCase(); return !q || [s.fullName, s.role].some((v) => (v || "").toLowerCase().includes(q)); }).sort((a, b) => a.fullName.localeCompare(b.fullName));
  const { page, setPage, pageItems, total } = usePagination(rows, query);

  const openDialog = (s = null) => {
    setEditing(s);
    setForm(s ? { fullName: s.fullName, role: s.role } : { fullName: "", role: ROLES[0] });
    setDialog(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { fullName: form.fullName.trim(), role: form.role.trim(), branchId };
      if (editing) await updateServiceStaff(editing.id, payload);
      else await createServiceStaff(payload);
      toast.success(editing ? "Staff member updated." : "Staff member added.");
      setDialog(false);
      load();
    } catch (err) {
      toast.error(errorText(err, "Couldn't save this staff member."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    const ok = await confirm(`Remove ${s.fullName} from your branch?`, { title: "Remove staff member", danger: true, confirmLabel: "Remove" });
    if (!ok) return;
    try {
      await deleteServiceStaff(s.id);
      toast.success("Staff member removed.");
      load();
    } catch (err) {
      toast.error(errorText(err, "Couldn't remove this staff member."));
    }
  };

  return (
    <div className="staff-page">
      <PageHeader
        title="Branch Staff"
        subtitle="The stylists and therapists you can assign to appointments."
        backTo={getStaffHomePath(userRole)}
        actions={<button className="staff-btn staff-btn-primary" onClick={() => openDialog()}>+ Add Staff</button>}
      />

      <div className="staff-filter-bar">
        <input className="staff-input staff-search" type="search" placeholder="Search name or role" aria-label="Search staff" value={query} onChange={(e) => setQuery(e.target.value)} />
        <span className="report-period">{staff.length} on your team</span>
      </div>

      {loading ? (
        <p>Loading staff...</p>
      ) : staff.length === 0 ? (
        <div className="staff-empty-state">
          <h3>No staff yet</h3>
          <p>Add the stylists and therapists who work at this branch, then assign them when booking.</p>
          <button className="staff-btn staff-btn-primary" onClick={() => openDialog()}>+ Add Staff</button>
        </div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="staff-table nowrap-table">
              <thead><tr><th>Name</th><th>Role</th><th className="num">Upcoming bookings</th><th className="staff-th-right">Actions</th></tr></thead>
              <tbody>
                {pageItems.map((s) => (
                  <tr key={s.id}>
                    <td className="staff-cell-strong">{s.fullName}</td>
                    <td><span className="role-badge">{s.role}</span></td>
                    <td className="num">{upcoming[s.id] || 0}</td>
                    <td className="staff-row-actions">
                      <button className="dashboard-btn-edit" onClick={() => openDialog(s)}>Edit</button>
                      <button className="dashboard-btn-delete" onClick={() => remove(s)}>Remove</button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr className="empty-row"><td colSpan="4">No staff match your search.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} onPage={setPage} />
        </>
      )}

      <h2 className="staff-section-title">Team accounts</h2>
      <p className="report-note" style={{ marginTop: 0 }}>People at this branch who sign in to the system. The owner manages accounts and salaries.</p>
      {accounts.length === 0 ? (
        <p className="staff-cell-muted">No accounts linked to this branch.</p>
      ) : (
        <div className="table-scroll">
          <table className="staff-table nowrap-table">
            <thead><tr><th>Name</th><th>Username</th><th>Role</th></tr></thead>
            <tbody>
              {accounts.map((u) => (
                <tr key={u.id}>
                  <td className="staff-cell-strong">{u.fullName || u.username}</td>
                  <td className="staff-cell-muted">{u.username}</td>
                  <td><span className="role-badge">{getRoleDisplayName(u.roleName)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialog && (
        <div className="modal-overlay" onClick={() => setDialog(false)}>
          <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="staff-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="staff-title">{editing ? "Edit staff member" : "Add staff member"}</h3>
            <form onSubmit={save}>
              <div className="form-group">
                <label htmlFor="staff-name">Full name</label>
                <input id="staff-name" className="staff-input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} autoFocus required />
              </div>
              <div className="form-group">
                <label htmlFor="staff-role">Role</label>
                <input id="staff-role" className="staff-input" list="staff-roles" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required />
                <datalist id="staff-roles">{ROLES.map((r) => <option key={r} value={r} />)}</datalist>
              </div>
              <div className="modal-actions">
                <button type="button" className="staff-btn staff-btn-secondary" onClick={() => setDialog(false)}>Cancel</button>
                <button type="submit" className="staff-btn staff-btn-primary" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Add staff"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
