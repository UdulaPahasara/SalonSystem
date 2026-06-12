import React from "react";
import { useNavigate } from "react-router-dom";
import AppointmentManagement from "./AppointmentManagement";
import "../components/DashboardLayout.css";

export default function CashierAppointments() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-content-header">
          <h2>Cashier Appointments</h2>
          <button className="dashboard-btn-secondary" onClick={() => navigate("/cashier")}>
            ← Back to Cashier Dashboard
          </button>
        </div>
        <AppointmentManagement />
      </div>
    </div>
  );
}
