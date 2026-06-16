import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllServices } from "../../api/serviceApi";

const FALLBACK_SERVICES = [
  { category: "Hair Care", name: "Women's Haircut & Blow Dry", price: 3500, durationMins: 60 },
  { category: "Hair Care", name: "Full Hair Colour", price: 8500, durationMins: 120 },
  { category: "Hair Care", name: "Keratin Smoothing Treatment", price: 12000, durationMins: 150 },
  { category: "Skin & Facials", name: "Classic Deep Cleansing Facial", price: 4500, durationMins: 60 },
  { category: "Skin & Facials", name: "Gold Glow Facial", price: 6500, durationMins: 75 },
  { category: "Nails", name: "Classic Manicure", price: 1800, durationMins: 45 },
  { category: "Nails", name: "Gel Manicure", price: 3200, durationMins: 60 },
  { category: "Nails", name: "Spa Pedicure", price: 3800, durationMins: 60 },
  { category: "Bridal & Occasions", name: "Bridal Hair & Makeup Trial", price: 15000, durationMins: 120 },
  { category: "Bridal & Occasions", name: "Party Makeup", price: 7500, durationMins: 90 },
  { category: "Spa & Wellness", name: "Head & Shoulder Massage", price: 2500, durationMins: 30 },
  { category: "Spa & Wellness", name: "Aromatherapy Body Relaxation", price: 9000, durationMins: 90 },
];

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

  useEffect(() => {
    getAllServices()
      .then((data) => {
        const list = data && data.length > 0 ? data : FALLBACK_SERVICES;
        setGrouped(groupByCategory(list));
      })
      .catch(() => setGrouped(groupByCategory(FALLBACK_SERVICES)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="public-page">
      <section className="public-page-hero">
        <p className="public-eyebrow">Our Menu</p>
        <h2>Services & Prices</h2>
        <p>Browse our women's salon services by category. Prices shown in LKR (Rs.).</p>
      </section>

      {loading ? (
        <p className="public-loading">Loading services...</p>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
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
