import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getUsers,
  getRoles,
  createUser,
  updateUser,
  deleteUser,
  getUsersByBranch
} from "../api/usersApi";
import { getBranches } from "../api/branchApi";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import { getRoleDisplayName } from "../utils/authRoutes";
import PageHeader from "../components/staff/PageHeader";
import { useAuth } from "../context/AuthContext";
import { getStaffHomePath } from "../utils/staffNav";
import "../components/DashboardLayout.css";

const errorMessage = (err, fallback) => {
  const data = err.response?.data;
  return typeof data === "string" && data.trim() ? data : fallback;
};

export default function AdminUsersPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { userId, userRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState({
    username: "",
    password: "",
    fullName: "",
    roleId: "",
    branchId: "",
  });

  useEffect(() => {
    loadRoles();
    loadBranches();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [selectedBranchId]); // Reload users when branch changes

  /* ---------------- LOADERS ---------------- */
  const loadUsers = async () => {
    try {
      let data;
      if (selectedBranchId) {
        data = await getUsersByBranch(selectedBranchId);
      } else {
        data = await getUsers();
      }
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const loadRoles = async () => {
    try {
      const r = await getRoles();
      const ALLOWED_AND_ORDERED = ["Owner", "Branch Manager", "Product Manager", "Reception", "Cashier"];

      const filtered = r.filter(role => ALLOWED_AND_ORDERED.includes(role.roleName));

      // Deduplicate roles by name (in case both 'Cashier' and 'Chashire' existing in DB resulted in duplicates here)
      const uniqueRoles = [];
      const seen = new Set();
      for (const role of filtered) {
        if (!seen.has(role.roleName)) {
          uniqueRoles.push(role);
          seen.add(role.roleName);
        }
      }

      // Sort them according to the defined order
      uniqueRoles.sort((a, b) => {
        return ALLOWED_AND_ORDERED.indexOf(a.roleName) - ALLOWED_AND_ORDERED.indexOf(b.roleName);
      });

      setRoles(uniqueRoles);
    } catch (err) { console.error(err); }
  };

  const loadBranches = async () => {
    try {
      const data = await getBranches();
      setBranches(data);
    } catch (err) { console.error(err); }
  };

  /* ---------------- HANDLERS ---------------- */
  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setForm({
        username: user.username,
        password: "",
        fullName: user.fullName || "",
        roleId: user.roleId || "",
        branchId: user.branchId || "",
      });
    } else {
      setEditingUser(null);
      setForm({
        username: "",
        password: "",
        fullName: "",
        roleId: "",
        branchId: "",
      });
    }
    setIsModalOpen(true);
  };

  // Dashboard "Add staff user" opens the form directly via ?new=1
  useEffect(() => {
    if (searchParams.get("new")) {
      openModal();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleDelete = async (id) => {
    const ok = await confirm("Delete this user? This cannot be undone.", { title: "Delete user", danger: true, confirmLabel: "Delete" });
    if (!ok) return;
    try {
      await deleteUser(id);
      toast.success("User deleted.");
      loadUsers();
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete this user."));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      username: form.username,
      password: form.password || undefined,
      fullName: form.fullName,
      roleId: parseInt(form.roleId),
      branchId: form.branchId ? parseInt(form.branchId) : null,
    };

    try {
      if (editingUser) {
        await updateUser(editingUser.id, payload);
        toast.success("User updated.");
      } else {
        await createUser(payload);
        toast.success("User created.");
      }
      closeModal();
      loadUsers();
    } catch (err) {
      toast.error(errorMessage(err, "Could not save this user. The username may already be taken."));
    }
  };

  /* ---------------- RENDER ---------------- */
  const visibleUsers = users.filter(
    (u) => selectedRole === "All" || getRoleDisplayName(u.roleName) === selectedRole
  );

  return (
    <div className="staff-page">
      <PageHeader
        title="Users"
        subtitle="Create staff accounts and assign roles and branches."
        backTo={getStaffHomePath(userRole)}
        actions={
          <button className="staff-btn staff-btn-primary" onClick={() => openModal()}>
            + Add User
          </button>
        }
      />

      <div className="staff-filter-bar">
        <div className="staff-chips" role="group" aria-label="Filter by role">
          {["All", ...roles.map((r) => r.roleName)].map((name) => (
            <button
              key={name}
              type="button"
              className={`staff-chip${selectedRole === name ? " active" : ""}`}
              aria-pressed={selectedRole === name}
              onClick={() => setSelectedRole(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <select
          className="staff-input"
          aria-label="Filter by branch"
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
        >
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.branchName}</option>
          ))}
        </select>
      </div>

      <table className="staff-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Role</th>
            <th>Branch</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visibleUsers.map((u) => (
            <tr key={u.id}>
              <td>{u.fullName || u.username}</td>
              <td>{u.username}</td>
              <td><span className="role-badge">{getRoleDisplayName(u.roleName)}</span></td>
              <td>{u.branchName || "Head Office"}</td>
              <td className="staff-row-actions">
                <button className="dashboard-btn-edit" onClick={() => openModal(u)}>Edit</button>
                {u.id !== userId && (
                  <button className="dashboard-btn-delete" onClick={() => handleDelete(u.id)}>Delete</button>
                )}
              </td>
            </tr>
          ))}
          {visibleUsers.length === 0 && (
            <tr className="empty-row"><td colSpan="5">No users found.</td></tr>
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>{editingUser ? "Edit User" : "Create New User"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="user-username">Username</label>
                <input id="user-username" className="staff-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              </div>
              <div className="form-group">
                <label htmlFor="user-password">Password {editingUser && "(leave blank to keep current)"}</label>
                <input id="user-password" className="staff-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingUser} />
              </div>
              <div className="form-group">
                <label htmlFor="user-fullname">Full Name</label>
                <input id="user-fullname" className="staff-input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="user-role">Role</label>
                <select id="user-role" className="staff-input" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} required>
                  <option value="">Select role</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.roleName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="user-branch">Branch</label>
                <select id="user-branch" className="staff-input" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                  <option value="">No branch (Head Office)</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.branchName}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="staff-btn staff-btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="staff-btn staff-btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
