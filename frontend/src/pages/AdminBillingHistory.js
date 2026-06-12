import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBranches } from "../api/branchApi";
import { getTransactionsByBranch } from "../api/usersApi";
import "../components/DashboardLayout.css";

export default function AdminBillingHistory() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [transactions, setTransactions] = useState([]);
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
      loadTransactions(selectedBranchId);
    } else {
      setTransactions([]);
    }
  }, [selectedBranchId]);

  const loadTransactions = async (branchId) => {
    setLoading(true);
    try {
      const data = await getTransactionsByBranch(branchId);
      setTransactions(data);
    } catch (err) {
      console.error("Failed to load transactions", err);
      alert("Error loading transactions for this branch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-content-header">
          <h2>Branch Billing & Payments History</h2>
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
          <p>Loading transactions...</p>
        ) : selectedBranchId && transactions.length === 0 ? (
          <p>No transactions found for this branch.</p>
        ) : transactions.length > 0 ? (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Total Amount</th>
                <th>Payment Method</th>
                <th>Cashier</th>
                <th>Loyalty Member</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.transactionId}>
                  <td>{t.transactionId}</td>
                  <td>{new Date(t.dateTime).toLocaleString()}</td>
                  <td>Rs. {t.totalAmount}</td>
                  <td>{t.paymentMethod}</td>
                  <td>{t.cashier ? t.cashier.fullName : "N/A"}</td>
                  <td>{t.customer && t.customer.loyaltyMember ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Please select a branch to view transactions.</p>
        )}
      </div>
    </div>
  );
}
