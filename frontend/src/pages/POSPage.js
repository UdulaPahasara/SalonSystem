import React from "react";
import PageHeader from "../components/staff/PageHeader";
import { getStaffHomePath } from "../utils/staffNav";
import { useAuth } from "../context/AuthContext";
import "../components/DashboardLayout.css";

export default function POSPage() {
  const { userRole } = useAuth();

  return (
    <div className="staff-page">
      <PageHeader
        title="Point of Sale"
        subtitle="Checkout for services and products — full POS coming in the next release."
        backTo={getStaffHomePath(userRole)}
      />
      <div className="staff-empty-state">
        <h3>POS module in development</h3>
        <p>
          The cashier checkout screen will support service selection, product sales,
          payment recording, and receipt generation.
        </p>
      </div>
    </div>
  );
}
