import React, { useEffect, useState } from "react";
import { getBranches, createBranch, updateBranch, deleteBranch } from "../api/branchApi";
import { getUsers } from "../api/usersApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import PageHeader from "../components/staff/PageHeader";
import { getStaffHomePath } from "../utils/staffNav";
import "../components/DashboardLayout.css";

const EMPTY_FORM = { branchName: "", address: "", phone: "" };

export default function BranchPage() {
  const { userRole } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [branches, setBranches] = useState([]);
  const [teamSizes, setTeamSizes] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [branchList, users] = await Promise.all([getBranches(), getUsers().catch(() => [])]);
      setBranches(branchList);
      const sizes = {};
      users.forEach((u) => { if (u.branchId) sizes[u.branchId] = (sizes[u.branchId] || 0) + 1; });
      setTeamSizes(sizes);
    } catch (err) {
      toast.error("Couldn't load branches. Check that the server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDialog = (branch = null) => {
    setEditingId(branch ? branch.id : null);
    setForm(branch ? { branchName: branch.branchName || "", address: branch.address || "", phone: branch.phone || "" } : EMPTY_FORM);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { branchName: form.branchName.trim(), address: form.address.trim(), phone: form.phone.trim() };
    if (!payload.branchName) {
      toast.error("Branch name is required.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateBranch(editingId, payload);
        toast.success("Branch updated.");
      } else {
        await createBranch(payload);
        toast.success("Branch added.");
      }
      closeDialog();
      load();
    } catch (err) {
      toast.error("Couldn't save the branch. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (branch) => {
    const ok = await confirm(`Delete ${branch.branchName}? This cannot be undone.`, {
      title: "Delete branch",
      danger: true,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await deleteBranch(branch.id);
      toast.success("Branch deleted.");
      load();
    } catch (err) {
      toast.error("This branch can't be deleted while it still has staff, services or records.");
    }
  };

  return (
    <div className="staff-page">
      <PageHeader
        title="Branches"
        subtitle="Manage your salon locations."
        backTo={getStaffHomePath(userRole)}
        actions={
          <button className="staff-btn staff-btn-primary" onClick={() => openDialog()}>
            + Add Branch
          </button>
        }
      />

      {loading ? (
        <p>Loading branches...</p>
      ) : branches.length === 0 ? (
        <div className="staff-empty-state">
          <h3>No branches yet</h3>
          <p>Add your first salon location to start assigning staff and services.</p>
          <button className="staff-btn staff-btn-primary" onClick={() => openDialog()}>
            + Add Branch
          </button>
        </div>
      ) : (
        <>
          <p className="staff-table-meta">
            {branches.length} {branches.length === 1 ? "branch" : "branches"}
          </p>
          <table className="staff-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Address</th>
                <th>Phone</th>
                <th>Team</th>
                <th className="staff-th-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id}>
                  <td className="staff-cell-strong">{b.branchName}</td>
                  <td>{b.address || <span className="staff-cell-muted">—</span>}</td>
                  <td className="nowrap">{b.phone || <span className="staff-cell-muted">—</span>}</td>
                  <td>{teamSizes[b.id] || 0} {(teamSizes[b.id] || 0) === 1 ? "member" : "members"}</td>
                  <td className="staff-row-actions">
                    <button className="dashboard-btn-edit" onClick={() => openDialog(b)}>Edit</button>
                    <button className="dashboard-btn-delete" onClick={() => remove(b)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {dialogOpen && (
        <div className="modal-overlay" onClick={closeDialog}>
          <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="branch-dialog-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="branch-dialog-title">{editingId ? "Edit Branch" : "Add Branch"}</h3>
            <form onSubmit={submit}>
              <div className="form-group">
                <label htmlFor="branch-name">Branch name</label>
                <input
                  id="branch-name"
                  className="staff-input"
                  placeholder="e.g. Colombo Branch"
                  value={form.branchName}
                  onChange={(e) => setForm({ ...form, branchName: e.target.value })}
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="branch-address">Address</label>
                <input
                  id="branch-address"
                  className="staff-input"
                  placeholder="Street, town"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="branch-phone">Phone</label>
                <input
                  id="branch-phone"
                  type="tel"
                  className="staff-input"
                  placeholder="+94 77 123 4567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="staff-btn staff-btn-secondary" onClick={closeDialog}>Cancel</button>
                <button type="submit" className="staff-btn staff-btn-primary" disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Save changes" : "Add branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
