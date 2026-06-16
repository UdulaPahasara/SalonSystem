import React from "react";

export default function PolicyPage({ title, children }) {
  return (
    <div className="public-page">
      <section className="public-page-hero">
        <p className="public-eyebrow">Policy</p>
        <h2>{title}</h2>
      </section>
      <section className="policy-content">{children}</section>
    </div>
  );
}
