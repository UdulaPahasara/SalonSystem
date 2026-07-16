import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getStatDefinitions } from "../../utils/dashboardStats";
import StaffModuleIcon from "./StaffModuleIcon";
import "../../styles/Dashboard.css";

export default function StaffDashboardHome({ config, userName, roleLabel }) {
  const { userRole, branchId } = useAuth();
  const greeting = getGreeting();
  const definitions = getStatDefinitions(userRole, { branchId });
  const [values, setValues] = useState({});

  useEffect(() => {
    let cancelled = false;
    getStatDefinitions(userRole, { branchId }).forEach((def) => {
      def.load()
        .then((v) => !cancelled && setValues((prev) => ({ ...prev, [def.label]: v })))
        .catch(() => !cancelled && setValues((prev) => ({ ...prev, [def.label]: "—" })));
    });
    return () => { cancelled = true; };
  }, [userRole, branchId]);

  return (
    <div className="staff-dashboard-home">
      <header className="staff-dashboard-hero">
        <div>
          <p className="staff-dashboard-eyebrow">{greeting}{userName ? `, ${userName}` : ""}</p>
          <h1>{config.title}</h1>
          <p className="staff-dashboard-subtitle">{config.subtitle}</p>
        </div>
        {roleLabel && <span className="staff-role-badge">{roleLabel}</span>}
      </header>

      <section className="staff-stats-row">
        {definitions.map((stat) => (
          <article key={stat.label} className="staff-stat-card">
            <p className="staff-stat-label">{stat.label}</p>
            <p className="staff-stat-value">{values[stat.label] ?? "…"}</p>
            <p className="staff-stat-hint">{stat.hint}</p>
          </article>
        ))}
      </section>

      <section className="staff-modules-section">
        <h2>Quick access</h2>
        <div className="staff-module-grid">
          {config.modules.map((mod) => (
            <Link
              key={mod.path}
              to={mod.path}
              className={`staff-module-card${mod.highlight ? " staff-module-card-highlight" : ""}`}
            >
              <StaffModuleIcon name={mod.icon} />
              <div>
                <h3>{mod.title}</h3>
                <p>{mod.desc}</p>
              </div>
              <span className="staff-module-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
