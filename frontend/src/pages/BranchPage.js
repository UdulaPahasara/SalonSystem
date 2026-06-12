import React, { useEffect, useState } from "react";
import { getBranches, createBranch, updateBranch, deleteBranch } from "../api/branchApi";
import { useNavigate } from "react-router-dom";
import "../components/DashboardLayout.css";

export default function BranchPage() {
  const navigate = useNavigate();
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
        alert("Branch updated");
        setEditingId(null);
      } else {
        await createBranch({ branchName, address, phone });
        alert("Branch added");
      }

      setBranchName("");
      setAddress("");
      setPhone("");
      loadBranches();
    } catch (err) {
      alert("Error saving branch");
      console.error(err);
    }
  };

  const remove = async (id) => {
    if (window.confirm("Are you sure?")) {
      await deleteBranch(id);
      loadBranches();
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

        <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
          <div style={{ flex: "0 0 350px" }}>
            <form onSubmit={submit} className="dashboard-form">
              <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#555" }}>
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

              <div style={{ marginTop: "15px" }}>
                <button type="submit" className="dashboard-btn-primary" style={{ width: "100%" }}>
                  {editingId ? "Update Branch" : "Add Branch"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="dashboard-btn-secondary"
                    style={{ marginTop: "10px", width: "100%" }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div style={{ flex: 1 }}>
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
                    <td>{b.phone}</td>
                    <td>
                      <button onClick={() => edit(b)} className="dashboard-btn-edit" style={{ marginRight: 5 }}>
                        Edit
                      </button>
                      <button onClick={() => remove(b.id)} className="dashboard-btn-delete">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {branches.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center">
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
