import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getRoleDisplayName } from "../../utils/authRoutes";
import { getStaffHomePath } from "../../utils/staffNav";

// Lets only the listed roles through; anyone else is sent back to their own dashboard.
export default function RoleGate({ roles }) {
  const { userRole } = useAuth();
  if (!roles.includes(getRoleDisplayName(userRole))) {
    return <Navigate to={getStaffHomePath(userRole)} replace />;
  }
  return <Outlet />;
}
