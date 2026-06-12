import React, { useEffect, useState } from "react";
import {
  getUsers,
  getRoles,
  createUser,
  updateUser,
  deleteUser,
  getUsersByBranch
} from "../api/usersApi"; // ensure getUsersByBranch is exported
import { getBranches } from "../api/branchApi";
import "./AdminUserPage.css";

export default function AdminUsersPage() {
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
      // Define the exact order and allowed roles (User requested 'Chashire')
      const ALLOWED_AND_ORDERED = ["Owner", "Branch Manager", "Product Manager", "Reception", "Chashire"];

      // Map backend 'Cashier' to UI 'Chashire'
      const mappedRoles = r.map(role => ({
        ...role,
        roleName: role.roleName === 'Cashier' ? 'Chashire' : role.roleName
      }));

      // Filter roles to only include those in the allowed list
      const filtered = mappedRoles.filter(role => ALLOWED_AND_ORDERED.includes(role.roleName));

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

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await deleteUser(id);
      loadUsers();
    } catch (err) {
      // Show the backend error message if available (e.g. "Cannot delete user...")
      const msg = err.response?.data || err.message;
      alert("Operation failed: " + msg);
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
        alert("User updated");
      } else {
        await createUser(payload);
        alert("User created");
      }
      closeModal();
      loadUsers();
    } catch (err) {
      alert("Operation failed: " + err.message);
    }
  };

  /* ---------------- RENDER HELPERS ---------------- */
  // Get unique roles for sidebar from the loaded roles list (or could be unique roles from user list)
  // Using the actual Role entities for the filter list is cleaner
  // Get unique roles for sidebar
  const roleNames = ['All', ...new Set(roles.map(r => r.roleName || r.name || r.role_name || 'Unknown'))];

  return (
    <div className="adminusers-container">
      {/* SIDEBAR */}
      <div className="admin-sidebar">
        <div className="sidebar-header">Users</div>
        <button
          className={`sidebar-btn ${selectedRole === 'All' ? 'active' : ''}`}
          onClick={() => setSelectedRole('All')}
        >
          👥 All Users
        </button>
        {roles.map(r => (
          <button
            key={r.id || r.roleName}
            className={`sidebar-btn ${selectedRole === r.roleName ? 'active' : ''}`}
            onClick={() => setSelectedRole(r.roleName)}
          >
            👤 {r.roleName}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="admin-content">
        <div className="content-header">
          <h2>{selectedRole === 'All' ? 'All Users' : `${selectedRole}s`}</h2>

          <div className="header-actions">
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px' }}
            >
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.branchName}</option>
              ))}
            </select>

            <button className="btn-add-user" onClick={() => openModal()}>
              + Add User
            </button>
          </div>
        </div>

        <div className="users-grid">
          {users
            .map(u => ({
              ...u,
              roleName: (u.roleName === 'Cashier' || u.roleName === 'Cashire') ? 'Chashire' : u.roleName
            }))
            .filter(u => selectedRole === 'All' || u.roleName === selectedRole)
            .map(u => (
              <div key={u.id} className="user-card">
                <div className="card-header">
                  <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{u.fullName || u.username}</div>
                  <span className="role-badge">{u.roleName}</span>
                </div>
                <div className="card-details">
                  <p><strong>Username:</strong> {u.username}</p>
                  <p><strong>Branch:</strong> {u.branchName || ""}</p>
                </div>

                <div className="card-actions">
                  <button className="action-btn btn-edit" onClick={() => openModal(u)}>Edit</button>
                  <button className="action-btn btn-delete" onClick={() => handleDelete(u.id)}>Delete</button>
                </div>
              </div>
            ))}
          {users.length === 0 && <p>No users found.</p>}
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editingUser ? "Edit User" : "Create New User"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Username</label>
                <input className="form-input" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Password {editingUser && "(Leave blank to keep same)"}</label>
                <input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editingUser} />
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select className="form-input" value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })} required>
                  <option value="">Select Role</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.roleName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Branch</label>
                <select className="form-input" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}>
                  <option value="">No Branch (Head Office)</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.branchName}</option>)}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-add-user">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
