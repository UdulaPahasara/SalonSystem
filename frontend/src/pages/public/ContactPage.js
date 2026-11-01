import React, { useEffect, useState } from "react";
import { SALON_INFO } from "../../utils/salonInfo";
import { submitContactMessage } from "../../api/contactApi";
import { getBranches } from "../../api/branchApi";

const INITIAL_FORM = { name: "", email: "", phone: "", message: "" };

export default function ContactPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    getBranches().then(setBranches).catch(() => setBranches([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSubmitted(false);

    try {
      await submitContactMessage({
        fullName: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
      });
      setSubmitted(true);
      setForm(INITIAL_FORM);
    } catch (err) {
      const reason = err.response?.data;
      setError(
        [400, 429].includes(err.response?.status) && typeof reason === "string" && reason
          ? reason
          : "Could not send your message. Please try again or call us directly."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
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
          <p>
            {SALON_INFO.address.line1}
            <br />
            {SALON_INFO.address.city}
          </p>
        </article>
        <article className="contact-card">
          <h4>Phone</h4>
          <p><a href={SALON_INFO.phoneHref}>{SALON_INFO.phone}</a></p>
        </article>
        <article className="contact-card">
          <h4>Facebook</h4>
          <p>
            <a href={SALON_INFO.facebook} target="_blank" rel="noopener noreferrer">
              Message us on Facebook
            </a>
          </p>
        </article>
        <article className="contact-card">
          <h4>Opening Hours</h4>
          {SALON_INFO.hours.length ? (
            SALON_INFO.hours.map((line) => <p key={line}>{line}</p>)
          ) : (
            <p>Please <a href={SALON_INFO.phoneHref}>call {SALON_INFO.phone}</a> to confirm our opening hours.</p>
          )}
        </article>
      </section>

      {branches.length > 0 && (
        <section className="public-form-section">
          <h3>Our Branches</h3>
          <div className="contact-grid">
            {branches.map((b) => (
              <article key={b.id} className="contact-card">
                <h4>{b.branchName}</h4>
                <p>{b.address}</p>
                {b.phone && (
                  <p>
                    <a href={`tel:${b.phone.replace(/\s/g, "")}`}>{b.phone}</a>
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="public-form-section">
        <h3>Send us a message</h3>
        {submitted && (
          <p className="public-form-success" role="status">
            Thank you! We received your message and will get back to you soon.
          </p>
        )}
        {error && (
          <p className="public-form-error" role="alert">
            {error}
          </p>
        )}
        <form className="public-contact-form" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              type="text"
              name="name"
              maxLength={100}
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              required
              disabled={loading}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              maxLength={150}
              value={form.email}
              onChange={handleChange}
              placeholder="you@email.com"
              required
              disabled={loading}
            />
          </label>
          <label>
            Phone
            <input
              type="tel"
              name="phone"
              maxLength={30}
              value={form.phone}
              onChange={handleChange}
              placeholder="+94..."
              disabled={loading}
            />
          </label>
          <label>
            Message
            <textarea
              name="message"
              rows="4"
              maxLength={2000}
              value={form.message}
              onChange={handleChange}
              placeholder="How can we help you?"
              required
              disabled={loading}
            />
          </label>
          <button type="submit" className="public-btn public-btn-primary" disabled={loading}>
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </section>
    </div>
  );
}
