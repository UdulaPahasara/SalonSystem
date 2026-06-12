import React from "react";
import { useNavigate } from "react-router-dom";
import "../components/DashboardLayout.css";

export default function POSPage() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-content-header">
          <h2>Point of Sale</h2>
          <button className="dashboard-btn-secondary" onClick={() => navigate("/cashier")}>
            ← Back to Cashier Dashboard
          </button>
        </div>
        <p>POS checkout will be available in a future update.</p>
      </div>
    </div>
  );
}
