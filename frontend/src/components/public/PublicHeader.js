import { Link, useLocation } from "react-router-dom";
import { SALON_INFO } from "../../utils/salonInfo";
import brandSpark from "../../images/redesign/reference/brand-spark.png";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function PublicHeader() {
  const location = useLocation();

  return (
    <header className="public-header">
      <Link to="/" className="public-brand">
        <img className="public-brand-mark" src={brandSpark} alt="" />
        <div>
          <p className="public-brand-tag">{SALON_INFO.tagline}</p>
          <h1 className="public-brand-title">{SALON_INFO.name}</h1>
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
        Staff login
      </Link>
    </header>
  );
}
