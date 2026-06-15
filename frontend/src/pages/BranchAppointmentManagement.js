import React from "react";
import { useNavigate } from "react-router-dom";
import AppointmentManagement from "./AppointmentManagement";
import "../components/DashboardLayout.css";

export default function BranchAppointmentManagement() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-content-header">
          <h2>Branch Appointments</h2>
          <button className="dashboard-btn-secondary" onClick={() => navigate("/branch-dashboard")}>
            ← Back to Branch Dashboard
          </button>
        </div>
        <AppointmentManagement />
      </div>
    </div>
  );
}
