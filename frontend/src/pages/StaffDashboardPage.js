import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getStaffHomePath } from "../utils/staffNav";
import OwnerDashboard from "../components/staff/OwnerDashboard";
import ManagerDashboard from "../components/staff/ManagerDashboard";
import ReceptionDashboard from "../components/staff/ReceptionDashboard";
import CashierDashboard from "../components/staff/CashierDashboard";
import ProductManagerDashboard from "../components/staff/ProductManagerDashboard";

export default function StaffDashboardPage() {
  const { userRole, fullName } = useAuth();

  if (userRole === "Owner") return <OwnerDashboard userName={fullName} />;
  if (userRole === "Branch Manager") return <ManagerDashboard />;
  if (userRole === "Reception") return <ReceptionDashboard />;
  if (userRole === "Cashier" || userRole === "Chashire") return <CashierDashboard />;
  if (userRole === "Product Manager") return <ProductManagerDashboard />;

  return (
    <div className="staff-empty-state">
      <h3>Dashboard unavailable</h3>
      <p>Your role is not configured for dashboard access.</p>
    </div>
  );
}

/** Redirect legacy dashboard URLs if needed */
export function StaffDashboardRedirect() {
  const { userRole } = useAuth();
  return <Navigate to={getStaffHomePath(userRole)} replace />;
}
