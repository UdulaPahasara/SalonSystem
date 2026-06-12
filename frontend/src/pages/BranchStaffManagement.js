import React from "react";
import { useNavigate } from "react-router-dom";
import "../components/DashboardLayout.css";

export default function BranchStaffManagement() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-content-header">
          <h2>Branch Staff Management</h2>
          <button className="dashboard-btn-secondary" onClick={() => navigate("/branch-dashboard")}>
            ← Back to Branch Dashboard
          </button>
        </div>
        <p>Manage stylists, barbers, and therapists from the salary module for now.</p>
      </div>
    </div>
  );
}
