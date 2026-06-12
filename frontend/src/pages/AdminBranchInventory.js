import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBranches } from "../api/branchApi";
import { getInventoryByBranch } from "../api/productApi";
import "../components/DashboardLayout.css";

export default function AdminBranchInventory() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const data = await getBranches();
      setBranches(data);
    } catch (err) {
      console.error("Failed to load branches", err);
    }
  };

  useEffect(() => {
    if (selectedBranchId) {
      loadInventory(selectedBranchId);
    } else {
      setInventory([]);
    }
  }, [selectedBranchId]);

  const loadInventory = async (branchId) => {
    setLoading(true);
    try {
      const data = await getInventoryByBranch(branchId);
      setInventory(data);
    } catch (err) {
      console.error("Failed to load inventory", err);
      alert("Error loading inventory for this branch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-content-header">
          <h2>Branch Inventory Viewer</h2>
          <button className="dashboard-btn-secondary" onClick={() => navigate("/admin-dashboard")}>
            ← Back to Dashboard
          </button>
        </div>

        <div className="dashboard-form" style={{ marginBottom: "30px", maxWidth: "400px" }}>
          <div className="form-group">
            <label>Select Branch</label>
            <select
              className="dashboard-input"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
            >
              <option value="">-- Choose Branch --</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branchName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading inventory...</p>
        ) : selectedBranchId && inventory.length === 0 ? (
          <p>No inventory found for this branch.</p>
        ) : inventory.length > 0 ? (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>Unit Price</th>
                <th>Quantity Available</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.inventoryId}>
                  <td>{item.productId}</td>
                  <td>{item.productName}</td>
                  <td>Rs. {item.unitPrice}</td>
                  <td style={{ fontWeight: "bold", color: item.quantity < 5 ? "red" : "black" }}>
                    {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Please select a branch to view inventory.</p>
        )}
      </div>
    </div>
  );
}
