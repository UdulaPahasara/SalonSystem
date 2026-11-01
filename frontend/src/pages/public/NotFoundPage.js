import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="public-page">
      <section className="public-page-hero">
        <p className="public-eyebrow">Page not found</p>
        <h2>We can't find that page</h2>
        <p>The address may be mistyped or the page may have moved.</p>
        <p style={{ marginTop: "1.5rem" }}>
          <Link to="/" className="public-btn public-btn-primary">Back to home</Link>
        </p>
      </section>
    </div>
  );
}
