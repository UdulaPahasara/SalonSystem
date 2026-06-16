import React from "react";
import { Link } from "react-router-dom";
import heroImage from "../images/salon-hero.jpg";
import featureImage from "../images/salon-feature.jpg";

export default function Home() {
  const features = [
    {
      title: "Hair & Styling",
      desc: "Cuts, colour, treatments, and occasion-ready styling for every woman.",
    },
    {
      title: "Skin & Wellness",
      desc: "Facials, spa rituals, and relaxing treatments in a serene setting.",
    },
    {
      title: "Bridal & Nails",
      desc: "Bridal packages, party glam, manicures, and pedicures with care.",
    },
  ];

  return (
    <div className="public-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <p className="home-hero-eyebrow">Women's Salon</p>
          <h2>Where beauty meets<br />elegant care</h2>
          <p className="home-hero-text">
            Discover our services, transparent prices, and a team devoted to making
            every woman feel confident, refreshed, and beautifully herself.
          </p>
          <div className="home-hero-actions">
            <Link to="/services" className="public-btn public-btn-primary">
              View Services & Prices
            </Link>
            <Link to="/contact" className="home-btn-outline">
              Book a Visit
            </Link>
          </div>
        </div>
        <div className="home-hero-image-wrap">
          <img src={heroImage} alt="Elegant women's salon interior" className="home-hero-image" />
          <div className="home-hero-badge">Trusted by women since day one</div>
        </div>
      </section>

      <section className="home-feature-section">
        <div className="home-feature-image-wrap">
          <img src={featureImage} alt="Stylist serving a client in salon" className="home-feature-image" />
        </div>
        <div className="home-feature-copy">
          <h3>Your beauty, our passion</h3>
          <p>
            Lumière Salon offers a full menu of women's services — from everyday
            hair care to bridal transformations — with clear pricing and
            category-wise service listings online.
          </p>
          <ul className="home-feature-list">
            <li>Service categories with prices online</li>
            <li>About us, contact, and policy pages</li>
            <li>Professional staff & hygienic environment</li>
            <li>Main branch appointments & walk-ins welcome</li>
          </ul>
          <Link to="/about" className="public-btn public-btn-primary" style={{ marginTop: "1rem", display: "inline-block" }}>
            Learn About Us
          </Link>
        </div>
      </section>

      <section className="home-cards">
        {features.map((item) => (
          <article key={item.title} className="home-card">
            <h4>{item.title}</h4>
            <p>{item.desc}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
