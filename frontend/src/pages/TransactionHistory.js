import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTransactionsByBranch } from "../api/usersApi";
import "../components/DashboardLayout.css";

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { branchId } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (branchId) {
      setLoading(true);
      getTransactionsByBranch(branchId)
        .then(setTransactions)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [branchId]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-content-header">
          <h2>Transaction History</h2>
          <button className="dashboard-btn-secondary" onClick={() => navigate("/cashier")}>
            ← Back to Cashier Dashboard
          </button>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : transactions.length === 0 ? (
          <p>No transactions found.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Payment Method</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.transactionId}>
                  <td>{t.transactionId}</td>
                  <td>{new Date(t.dateTime).toLocaleString()}</td>
                  <td>Rs. {t.totalAmount}</td>
                  <td>{t.paymentMethod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
