import React, { useState } from "react";

const INITIAL_FORM = { name: "", email: "", phone: "", message: "" };

export default function ContactPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setForm(INITIAL_FORM);
  };

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
        {submitted && (
          <p className="public-form-success" role="status">
            Thank you! We received your message and will get back to you soon.
          </p>
        )}
        <form className="public-contact-form" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@email.com"
              required
            />
          </label>
          <label>
            Phone
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+94..."
            />
          </label>
          <label>
            Message
            <textarea
              name="message"
              rows="4"
              value={form.message}
              onChange={handleChange}
              placeholder="How can we help you?"
              required
            />
          </label>
          <button type="submit" className="public-btn public-btn-primary">
            Send Message
          </button>
        </form>
      </section>
    </div>
  );
}
