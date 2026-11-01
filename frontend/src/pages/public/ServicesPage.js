import { SALON_INFO } from "../../utils/salonInfo";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllServices } from "../../api/serviceApi";


function groupByCategory(services) {
  return services.reduce((acc, service) => {
    const category = service.category || "Other Services";
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {});
}

export default function ServicesPage() {
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    getAllServices()
      .then((data) => {
        setGrouped(groupByCategory(data || []));
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="public-page">
      <section className="public-page-hero">
        <p className="public-eyebrow">Our Menu</p>
        <h2>Services & Prices</h2>
        <p>Browse our women's salon services by category. Prices shown in LKR (Rs.).</p>
      </section>

      {!loading && (
        <div className="service-filter" role="group" aria-label="Filter by category">
          {["", ...Object.keys(grouped)].map((category) => (
            <button
              key={category || "all"}
              type="button"
              className={`service-filter-btn${activeCategory === category ? " active" : ""}`}
              aria-pressed={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            >
              {category || "All"}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="public-loading">Loading services...</p>
      ) : failed || Object.keys(grouped).length === 0 ? (
        <p className="public-loading">
          {failed ? "We couldn't load our menu right now." : "Our menu is being updated."} Please{" "}
          <a href={SALON_INFO.phoneHref}>call {SALON_INFO.phone}</a> for prices.
        </p>
      ) : (
        Object.entries(grouped)
          .filter(([category]) => !activeCategory || category === activeCategory)
          .map(([category, items]) => (
          <section key={category} className="service-category-block">
            <h3 className="service-category-title">{category}</h3>
            <div className="service-price-grid">
              {items.map((service) => (
                <article key={`${category}-${service.name}-${service.serviceId || service.name}`} className="service-price-card">
                  <h4>{service.name}</h4>
                  <p className="service-duration">{service.durationMins} mins</p>
                  <p className="service-price">Rs. {Number(service.price).toLocaleString()}</p>
                </article>
              ))}
            </div>
          </section>
        ))
      )}

      <section className="public-cta-banner">
        <h3>Ready to visit us?</h3>
        <p>Call or visit our salon to book your appointment.</p>
        <Link to="/contact" className="public-btn public-btn-primary">Contact Us</Link>
      </section>
    </div>
  );
}
