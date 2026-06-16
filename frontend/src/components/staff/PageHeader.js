import React from "react";
import { Link } from "react-router-dom";

export default function PageHeader({ title, subtitle, backTo, backLabel = "Back to dashboard", actions }) {
  return (
    <header className="staff-page-header">
      <div>
        {backTo && (
          <Link to={backTo} className="staff-page-back">
            ← {backLabel}
          </Link>
        )}
        <h1>{title}</h1>
        {subtitle && <p className="staff-page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="staff-page-actions">{actions}</div>}
    </header>
  );
}
