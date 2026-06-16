import React from "react";
import { Link } from "react-router-dom";
import featureImage from "../../images/salon-feature.jpg";

export default function AboutPage() {
  return (
    <div className="public-page">
      <section className="public-page-hero">
        <p className="public-eyebrow">About Us</p>
        <h2>Beauty crafted with care</h2>
        <p>A women's salon dedicated to confidence, comfort, and exceptional service.</p>
      </section>

      <section className="public-split">
        <img src={featureImage} alt="Salon team at work" className="public-split-image" />
        <div>
          <h3>Who we are</h3>
          <p>
            Lumière Salon is a modern women's salon offering hair, skin, nail, bridal, and wellness
            services in a calm, elegant environment. Our stylists and therapists are trained to
            listen first — then recommend treatments that suit your style, skin, and schedule.
          </p>
          <p>
            From everyday refresh to special-occasion glam, we combine professional products with
            thoughtful hospitality so every visit feels personal.
          </p>
        </div>
      </section>

      <section className="public-values-grid">
        <article>
          <h4>Expert Team</h4>
          <p>Certified stylists and therapists focused on women's beauty needs.</p>
        </article>
        <article>
          <h4>Premium Products</h4>
          <p>Salon-grade formulas selected for healthy hair and glowing skin.</p>
        </article>
        <article>
          <h4>Hygiene First</h4>
          <p>Sanitized tools, fresh linens, and strict cleanliness standards.</p>
        </article>
        <article>
          <h4>Transparent Pricing</h4>
          <p>View our <Link to="/services">service menu</Link> before you visit — no surprises.</p>
        </article>
      </section>
    </div>
  );
}
