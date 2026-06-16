import React from "react";
import { useNavigate } from "react-router-dom";
import StaffModuleIcon from "./StaffModuleIcon";

export default function StaffDashboardHome({ config, userName, roleLabel }) {
  const navigate = useNavigate();
  const greeting = getGreeting();

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
        {config.stats.map((stat) => (
          <article key={stat.label} className="staff-stat-card">
            <p className="staff-stat-label">{stat.label}</p>
            <p className="staff-stat-value">{stat.value}</p>
            <p className="staff-stat-hint">{stat.hint}</p>
          </article>
        ))}
      </section>

      <section className="staff-modules-section">
        <h2>Quick access</h2>
        <div className="staff-module-grid">
          {config.modules.map((mod) => (
            <button
              key={mod.path}
              type="button"
              className={`staff-module-card${mod.highlight ? " staff-module-card-highlight" : ""}`}
              onClick={() => navigate(mod.path)}
            >
              <StaffModuleIcon name={mod.icon} />
              <div>
                <h3>{mod.title}</h3>
                <p>{mod.desc}</p>
              </div>
              <span className="staff-module-arrow">→</span>
            </button>
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
