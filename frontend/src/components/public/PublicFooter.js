import { Link } from "react-router-dom";

const POLICY_LINKS = [
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/terms-of-service", label: "Terms of Service" },
  { to: "/refund-policy", label: "Refund Policy" },
  { to: "/cancellation-policy", label: "Cancellation Policy" },
];

export default function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer-grid">
        <div>
          <h4>Lumière Salon</h4>
          <p>Elegant women's salon services — hair, skin, nails, and bridal care.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/services">Services & Prices</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact Us</Link>
        </div>
        <div>
          <h4>Policies</h4>
          {POLICY_LINKS.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </div>
        <div>
          <h4>Staff</h4>
          <Link to="/login">Staff Login →</Link>
        </div>
      </div>
      <p className="public-footer-copy">
        © {new Date().getFullYear()} Lumière Salon. All rights reserved.
      </p>
    </footer>
  );
}
