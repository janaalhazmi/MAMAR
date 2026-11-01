import { Link } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";
import { logout, getSession } from "../services/auth";
import Icon from "./Icons";

// Uses the same cd-* classes as ProviderPage, so the look is identical.
// activeKey: "dashboard" | "projects" | "create" | "providers" | "quotations"
const NAV = [
  { key: "dashboard", to: "/contractor-dashboard", icon: "dashboard", label: "Dashboard" },
  { key: "projects", to: "/contractor-dashboard#projects", icon: "projects", label: "My Projects" },
  { key: "create", to: "/create-project", icon: "create", label: "Create Project" },
  { key: "providers", to: "/providers", icon: "providers", label: "Providers" },
  { key: "quotations", to: "/quotations", icon: "quotations", label: "Quotations" },
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
        <Link
          to="/contractor-dashboard"
          className="cd-header-logo"
          aria-label="MAMAR Dashboard"
        >
          <img src={logo} alt="MAMAR" />
        </Link>

        <div className="cd-user">
          <div className="cd-user-avatar">{userInitial}</div>
          <div className="cd-user-info">
            <strong>{displayName}</strong>
            <span>Contractor</span>
          </div>
        </div>
      </header>

      <div className="cd-body">
        <aside className="cd-sidebar">
          <nav className="cd-nav" aria-label="Main navigation">
            {NAV.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                className={item.key === activeKey ? "cd-nav-active" : undefined}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="cd-sidebar-bottom">
            {/* No /data-disclaimer route exists yet. Add one in App.jsx or
                point this to an existing page. */}
            <Link to="/data-disclaimer">
              <Icon name="info" />
              <span>Data Disclaimer</span>
            </Link>

            <Link to="/help">
              <Icon name="help" />
              <span>Help &amp; Support</span>
            </Link>

            <Link to="/login" onClick={logout}>
              <Icon name="logout" />
              <span>Log out</span>
            </Link>
          </div>
        </aside>

        <main className="cd-main pf-main">{children}</main>
      </div>
    </div>
  );
}

export default ContractorShell;
