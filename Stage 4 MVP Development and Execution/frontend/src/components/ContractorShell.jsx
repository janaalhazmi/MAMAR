import { Link } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";
import { getSession } from "../services/auth";
import Sidebar from "./Sidebar";
import Icon from "./Icons";

const NAV = [
  { key: "dashboard", path: "/contractor-dashboard", icon: "dashboard", label: "Dashboard" },
  { key: "projects", path: "/my-projects", icon: "projects", label: "My Projects" },
  { key: "create", path: "/create-project", icon: "create", label: "Create Project" },
  { key: "providers", path: "/providers", icon: "providers", label: "Providers" },
  { key: "quotations", path: "/quotations", icon: "quotations", label: "Quotations" },
];

function ContractorShell({ activeKey, children }) {
  const sessionUser = getSession()?.user;
  const rawName = sessionUser?.full_name || sessionUser?.name || "";
  const displayName =
    (typeof rawName === "string" ? rawName.trim() : "") || "there";

  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="cd-page">
      <header className="cd-header">
        <Link to="/contractor-dashboard" className="cd-header-logo">
          <img src={logo} alt="MAMAR" />
        </Link>

        <div className="cd-header-actions">
          <Link
            to="/notifications"
            className="cd-notification-button"
            aria-label="Notifications"
            title="Notifications"
          >
            <Icon name="bell" size={21} />
          </Link>

          <div className="cd-user">
            <div className="cd-user-avatar">{userInitial}</div>

            <div className="cd-user-info">
              <strong>{displayName}</strong>
              <span>Contractor</span>
            </div>
          </div>
        </div>
      </header>

      <div className="cd-body">
        <Sidebar items={NAV} activeKey={activeKey} />

        <main className="cd-main pf-main">
          {children}
        </main>
      </div>
    </div>
  );
}

export default ContractorShell;