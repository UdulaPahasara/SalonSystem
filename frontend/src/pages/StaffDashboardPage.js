import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRoleDisplayName } from "../utils/authRoutes";
import { getDashboardConfig } from "../utils/dashboardConfigs";
import { getStaffHomePath } from "../utils/staffNav";
import StaffDashboardHome from "../components/staff/StaffDashboardHome";

export default function StaffDashboardPage() {
  const { userRole, fullName } = useAuth();
  const config = getDashboardConfig(userRole);
  const homePath = getStaffHomePath(userRole);

  if (!config) {
    return (
      <div className="staff-empty-state">
        <h3>Dashboard unavailable</h3>
        <p>Your role is not configured for dashboard access.</p>
      </div>
    );
  }

  return (
    <StaffDashboardHome
      config={config}
      userName={fullName}
      roleLabel={getRoleDisplayName(userRole)}
    />
  );
}

/** Redirect legacy dashboard URLs if needed */
export function StaffDashboardRedirect() {
  const { userRole } = useAuth();
  return <Navigate to={getStaffHomePath(userRole)} replace />;
}
