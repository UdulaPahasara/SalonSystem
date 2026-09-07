import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBranches } from "../api/branchApi";
import { getAllTransactions, getTransactionsByBranch } from "../api/usersApi";
import { useToast } from "../context/ToastContext";
import "../components/DashboardLayout.css";

export default function AdminBillingHistory() {
  const navigate = useNavigate();
  const toast = useToast();
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
    loadTransactions(selectedBranchId);
  }, [selectedBranchId]);

  const loadTransactions = async (branchId) => {
    setLoading(true);
    try {
      const data = branchId ? await getTransactionsByBranch(branchId) : await getAllTransactions();
      setTransactions(data);
    } catch (err) {
      console.error("Failed to load transactions", err);
      toast.error("Error loading transactions");
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

        <div className="dashboard-form staff-form-narrow">
          <div className="form-group">
            <label>Select Branch</label>
            <select
              className="dashboard-input"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
            >
              <option value="">All Branches</option>
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
        ) : transactions.length === 0 ? (
          <div className="staff-empty-state">
            <h3>No transactions yet</h3>
            <p>Sales appear here after a cashier completes a checkout.</p>
          </div>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Branch</th>
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
                  <td>{t.branch ? t.branch.branchName : "N/A"}</td>
                  <td>Rs. {Number(t.totalAmount).toLocaleString()}</td>
                  <td>{t.paymentMethod}</td>
                  <td>{t.cashier ? t.cashier.fullName : "N/A"}</td>
                  <td>{t.customer && t.customer.loyaltyMember ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
