import React from "react";

const FALLBACK = ["Hair Care", "Skin & Facials", "Nails", "Bridal & Occasions", "Spa & Wellness"];

// Endless horizontal band of services. The list is repeated so the loop is seamless;
// the repeat is hidden from screen readers. Motion pauses on hover.
export default function ServiceTicker({ services }) {
  const items = services.length
    ? services.map((s) => ({ key: s.name, text: s.name, price: s.price }))
    : FALLBACK.map((c) => ({ key: c, text: c }));

  const row = (copy) =>
    items.map((i) => (
      <span className="ticker-item" key={`${copy}-${i.key}`}>
        {i.text}
        {i.price ? <em>Rs. {Number(i.price).toLocaleString()}</em> : null}
        <i className="ticker-dot" aria-hidden="true">✦</i>
      </span>
    ));

  return (
    <div className="ticker" role="region" aria-label="Our services">
      <div className="ticker-track">
        <div className="ticker-group">{row("a")}</div>
        <div className="ticker-group" aria-hidden="true">{row("b")}</div>
      </div>
    </div>
  );
}
