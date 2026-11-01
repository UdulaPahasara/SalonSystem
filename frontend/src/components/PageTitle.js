import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE = "Malroo Salon";
const PUBLIC = {
  "/": "Women's Salon in Ratiyelapaara",
  "/services": "Services & Prices",
  "/about": "About Us",
  "/contact": "Contact Us",
  "/privacy-policy": "Privacy Policy",
  "/terms-of-service": "Terms of Service",
  "/refund-policy": "Refund Policy",
  "/cancellation-policy": "Cancellation Policy",
  "/login": "Staff Sign In",
};

// Gives every page its own browser-tab title: public pages from a list, staff pages from their heading.
export default function PageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (PUBLIC[pathname]) {
      document.title = `${PUBLIC[pathname]} | ${SITE}`;
      return undefined;
    }
    const id = setTimeout(() => {
      const heading = document.querySelector(".staff-page-header h1, .dash-head h1, .public-page-hero h2");
      document.title = heading ? `${heading.textContent.trim()} | ${SITE}` : SITE;
    }, 350);
    return () => clearTimeout(id);
  }, [pathname]);

  return null;
}
