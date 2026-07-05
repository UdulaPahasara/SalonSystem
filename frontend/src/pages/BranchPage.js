import React, { useEffect, useState } from "react";
import { getBranches, createBranch, updateBranch, deleteBranch } from "../api/branchApi";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import "../components/DashboardLayout.css";

export default function BranchPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [branchName, setBranchName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [branches, setBranches] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const data = await getBranches();
      setBranches(data);
    } catch (err) {
      console.error(err);
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateBranch(editingId, { branchName, address, phone });
        toast.success("Branch updated");
        setEditingId(null);
      } else {
        await createBranch({ branchName, address, phone });
        toast.success("Branch added");
      }

      setBranchName("");
      setAddress("");
      setPhone("");
      loadBranches();
    } catch (err) {
      toast.error("Error saving branch");
      console.error(err);
    }
  };

  const remove = async (id) => {
    const ok = await confirm("Are you sure?", { title: "Delete branch", danger: true, confirmLabel: "Delete" });
    if (!ok) return;
    try {
      await deleteBranch(id);
      toast.success("Branch deleted");
      loadBranches();
    } catch (err) {
      toast.error("This branch can't be deleted while it still has staff, services or records.");
    }
  };

  const edit = (branch) => {
    setEditingId(branch.id);
    setBranchName(branch.branchName);
    setAddress(branch.address);
    setPhone(branch.phone);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setBranchName("");
    setAddress("");
    setPhone("");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-content-header">
          <h2>Branch Management</h2>
          <button className="dashboard-btn-secondary" onClick={() => navigate("/admin-dashboard")}>
            ← Back to Dashboard
          </button>
        </div>

        <div className="staff-split">
          <div className="staff-split-side">
            <form onSubmit={submit} className="dashboard-form">
              <h3 className="staff-form-title">
                {editingId ? "Edit Branch" : "Add Branch"}
              </h3>

              <div className="form-group">
                <label>Branch Name</label>
                <input
                  className="dashboard-input"
                  placeholder="e.g. Colombo Branch"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  className="dashboard-input"
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  className="dashboard-input"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="staff-form-actions">
                <button type="submit" className="dashboard-btn-primary staff-btn-block">
                  {editingId ? "Update Branch" : "Add Branch"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="dashboard-btn-secondary staff-btn-block"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="staff-split-main">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Branch Name</th>
                  <th>Address</th>
                  <th>Phone</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>{b.branchName}</td>
                    <td>{b.address}</td>
                    <td className="nowrap">{b.phone}</td>
                    <td className="staff-row-actions">
                      <button onClick={() => edit(b)} className="dashboard-btn-edit">
                        Edit
                      </button>
                      <button onClick={() => remove(b.id)} className="dashboard-btn-delete">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {branches.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan="5">
                      No branches found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
