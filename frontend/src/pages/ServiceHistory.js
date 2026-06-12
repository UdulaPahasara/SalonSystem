import React from "react";
import { useNavigate } from "react-router-dom";
import "../components/DashboardLayout.css";

export default function ServiceHistory() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-content-header">
          <h2>Service History</h2>
          <button className="dashboard-btn-secondary" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
        <p>Completed service history is available through appointment records and reports.</p>
      </div>
    </div>
  );
}
