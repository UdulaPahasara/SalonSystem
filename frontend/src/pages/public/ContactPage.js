import React from "react";

export default function ContactPage() {
  return (
    <div className="public-page">
      <section className="public-page-hero">
        <p className="public-eyebrow">Contact Us</p>
        <h2>We'd love to hear from you</h2>
        <p>Book an appointment, ask about services, or visit our main branch.</p>
      </section>

      <section className="contact-grid">
        <article className="contact-card">
          <h4>Salon Address</h4>
          <p>123 Main Street<br />Colombo, Sri Lanka</p>
        </article>
        <article className="contact-card">
          <h4>Phone</h4>
          <p>+94 11 555 0100</p>
          <p>+94 77 123 4567 (WhatsApp)</p>
        </article>
        <article className="contact-card">
          <h4>Email</h4>
          <p>hello@lumieresalon.lk</p>
          <p>bookings@lumieresalon.lk</p>
        </article>
        <article className="contact-card">
          <h4>Opening Hours</h4>
          <p>Mon – Fri: 9:00 AM – 7:00 PM</p>
          <p>Sat: 9:00 AM – 6:00 PM</p>
          <p>Sun: 10:00 AM – 4:00 PM</p>
        </article>
      </section>

      <section className="public-form-section">
        <h3>Send us a message</h3>
        <form className="public-contact-form" onSubmit={(e) => e.preventDefault()}>
          <label>
            Full Name
            <input type="text" placeholder="Your name" required />
          </label>
          <label>
            Email
            <input type="email" placeholder="you@email.com" required />
          </label>
          <label>
            Phone
            <input type="tel" placeholder="+94..." />
          </label>
          <label>
            Message
            <textarea rows="4" placeholder="How can we help you?" required />
          </label>
          <button type="submit" className="public-btn public-btn-primary">Send Message</button>
        </form>
      </section>
    </div>
  );
}
