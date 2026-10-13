import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// React Router keeps the old scroll position on navigation; reset it on every page change.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const panel = document.querySelector(".staff-content");
    if (panel) panel.scrollTop = 0;
  }, [pathname]);

  return null;
}
