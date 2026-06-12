import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getInventoryByBranch } from "../api/productApi";
import "../components/DashboardLayout.css";

export default function BranchProductInventory() {
  const navigate = useNavigate();
  const { branchId } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (branchId) {
      setLoading(true);
      getInventoryByBranch(branchId)
        .then(setInventory)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [branchId]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-content-header">
          <h2>Branch Product Inventory</h2>
          <button className="dashboard-btn-secondary" onClick={() => navigate("/branch-dashboard")}>
            ← Back to Branch Dashboard
          </button>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : inventory.length === 0 ? (
          <p>No inventory found for this branch.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Unit Price</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.inventoryId}>
                  <td>{item.productName}</td>
                  <td>Rs. {item.unitPrice}</td>
                  <td>{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
