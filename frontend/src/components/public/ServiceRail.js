import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { prefersReducedMotion } from "./Reveal";

// Swipeable horizontal rail of service cards with arrows and gentle auto-advance.
export default function ServiceRail({ services }) {
  const track = useRef(null);
  const [paused, setPaused] = useState(false);

  const step = () => {
    const card = track.current?.querySelector(".rail-card");
    return card ? card.getBoundingClientRect().width + 16 : 300;
  };
  const move = (dir) => track.current?.scrollBy({ left: dir * step(), behavior: "smooth" });

  useEffect(() => {
    if (paused || prefersReducedMotion() || services.length < 4) return undefined;
    const id = setInterval(() => {
      const el = track.current;
      if (!el || document.hidden) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      if (atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
      else el.scrollBy({ left: step(), behavior: "smooth" });
    }, 3600);
    return () => clearInterval(id);
  }, [paused, services.length]);

  if (services.length === 0) return null;

  return (
    <div className="rail" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onTouchStart={() => setPaused(true)}>
      <div className="rail-controls">
        <button type="button" className="rail-btn" aria-label="Previous services" onClick={() => move(-1)}>←</button>
        <button type="button" className="rail-btn" aria-label="Next services" onClick={() => move(1)}>→</button>
      </div>
      <div className="rail-track" ref={track} role="group" aria-label="Popular services">
        {services.map((s) => (
          <Link to="/services" className="rail-card" key={s.name}>
            <span className="rail-tag">{s.category || "Service"}</span>
            <strong>{s.name}</strong>
            <span className="rail-meta">{s.durationMins ? `${s.durationMins} min` : " "}</span>
            <span className="rail-price">Rs. {Number(s.price).toLocaleString()}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
