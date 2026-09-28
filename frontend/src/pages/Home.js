import React from "react";
import { Link } from "react-router-dom";
import heroImage from "../images/redesign/reference/hero-cover-photo.png";
import careIcon from "../images/redesign/reference/icon-care.png";
import locationIcon from "../images/redesign/reference/icon-location.png";
import welcomeIcon from "../images/redesign/reference/icon-welcome.png";
import leavesLeft from "../images/redesign/reference/leaves-left.png";
import leavesRight from "../images/redesign/reference/leaves-right.png";
import hairImage from "../images/redesign/service-hair.png";
import facialImage from "../images/redesign/service-facial.png";
import nailsImage from "../images/redesign/service-nails.png";
import { SALON_INFO } from "../utils/salonInfo";

export default function Home() {
  const services = [
    {
      title: "Hair Care",
      desc: "Cuts, colour, styling and treatments.",
      image: hairImage,
    },
    {
      title: "Skin & Facials",
      desc: "Cleanse, refresh and glow.",
      image: facialImage,
    },
    {
      title: "Nails",
      desc: "Care, colour and nail art.",
      image: nailsImage,
    },
  ];

  return (
    <div className="home-page">
      <section className="home-hero">
        <img
          src={heroImage}
          alt="Malroo Salon stylist shaping a client's hair"
          className="home-hero-image"
        />
        <div className="home-hero-content">
          <p className="home-hero-eyebrow">Women's Salon</p>
          <h2>
            Beauty that<br />
            feels <span>unmistakably</span><br />
            <em>yours.</em>
          </h2>
          <p className="home-hero-text">
            Expert hair, skin, nail and bridal care — thoughtfully tailored,
            clearly priced.
          </p>
          <div className="home-hero-actions">
            <Link to="/services" className="public-btn public-btn-primary">
              Explore services & prices
            </Link>
            <Link to="/contact" className="home-btn-outline">
              Book an appointment
            </Link>
          </div>
          <div className="home-trust-row" aria-label="Salon highlights">
            <span><img src={careIcon} alt="" />Expert care<br />by women, for women</span>
            <span><img src={locationIcon} alt="" />Govinna Handiya,<br />Ratiyelapaara</span>
            <span><img src={welcomeIcon} alt="" />A welcoming space<br />to be yourself</span>
          </div>
        </div>
      </section>

      <section className="home-services-section">
        <img className="home-leaves home-leaves-left" src={leavesLeft} alt="" />
        <img className="home-leaves home-leaves-right" src={leavesRight} alt="" />
        <div className="home-section-heading">
          <p className="public-eyebrow">Our services</p>
          <h3>Services for every you.</h3>
          <p>
            From everyday hair care to bridal transformations, explore our salon services, all with clear pricing.
          </p>
        </div>

        <div className="home-service-grid">
          {services.map((service) => (
            <Link to="/services" className="home-service-tile" key={service.title}>
              <img src={service.image} alt="" />
              <span className="home-service-overlay" />
              <span className="home-service-copy">
                <strong>{service.title}</strong>
                <small>{service.desc}</small>
                <span className="home-service-link">View services</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-story-section">
        <div>
          <p className="public-eyebrow">Thoughtful care</p>
          <h3>Beauty expertise, made personal.</h3>
        </div>
        <p>
          {SALON_INFO.name} brings professional products, careful consultation and
          warm hospitality together in one calm space. Come for an everyday refresh
          or let us help shape your biggest celebration.
        </p>
        <Link to="/about" className="home-text-link">Meet Malroo Salon</Link>
      </section>
    </div>
  );
}
