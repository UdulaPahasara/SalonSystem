import React from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useConfirm } from "../../context/ConfirmContext";
import { getRoleDisplayName } from "../../utils/authRoutes";
import { getStaffHomePath, getStaffNavItems } from "../../utils/staffNav";
import { SALON_INFO } from "../../utils/salonInfo";
import "../../styles/StaffTheme.css";

export default function StaffLayout() {
  const { user, logout, userRole, fullName, username } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirm();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const roleLabel = getRoleDisplayName(userRole);
  const navItems = getStaffNavItems(userRole);
  const homePath = getStaffHomePath(userRole);

  const handleLogout = async () => {
    const ok = await confirm("Are you sure you want to sign out?", {
      title: "Sign out",
      confirmLabel: "Sign out",
      danger: true,
    });
    if (ok) {
      logout();
      navigate("/login");
    }
  };

  return (
    <div className="staff-shell">
      <aside className="staff-sidebar">
        <Link to={homePath} className="staff-sidebar-brand">
          <span className="staff-sidebar-icon">✦</span>
          <div>
            <p className="staff-sidebar-tag">{SALON_INFO.tagline}</p>
            <p className="staff-sidebar-title">{SALON_INFO.name}</p>
          </div>
        </Link>

        <nav className="staff-sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`staff-sidebar-link${location.pathname === item.path ? " active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link to="/" className="staff-sidebar-public">
          View public website
        </Link>
      </aside>

      <div className="staff-main">
        <header className="staff-topbar">
          <div className="staff-topbar-user">
            <p className="staff-topbar-name">{fullName || username}</p>
            <p className="staff-topbar-role">{roleLabel}</p>
          </div>
          <button type="button" className="staff-topbar-logout" onClick={handleLogout}>
            Sign out
          </button>
        </header>

        <main className="staff-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
