import { Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services & Prices" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact Us" },
];

export default function PublicHeader() {
  const location = useLocation();

  return (
    <header className="public-header">
      <Link to="/" className="public-brand">
        <span className="public-brand-icon">✦</span>
        <div>
          <p className="public-brand-tag">Women's Salon</p>
          <h1 className="public-brand-title">Lumière Salon</h1>
        </div>
      </Link>

      <nav className="public-nav">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`public-nav-link${location.pathname === link.to ? " active" : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <Link to="/login" className="public-header-btn">
        Staff Login
      </Link>
    </header>
  );
}
