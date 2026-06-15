import React from "react";
import { useNavigate } from "react-router-dom";
import "../components/DashboardLayout.css";

export default function TaskManagement() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-content-header">
          <h2>Task Management</h2>
          <button className="dashboard-btn-secondary" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
        <p>Task management will be available in a future update.</p>
      </div>
    </div>
  );
}
