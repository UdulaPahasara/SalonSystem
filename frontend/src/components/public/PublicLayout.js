import { Outlet } from "react-router-dom";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";
import "../../styles/PublicSite.css";

export default function PublicLayout() {
  return (
    <div className="public-site">
      <PublicHeader />
      <main className="public-main">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
