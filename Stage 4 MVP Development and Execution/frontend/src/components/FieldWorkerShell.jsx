import NotificationBell from "./NotificationBell";
import { Link } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";
import { logout, getSession } from "../services/auth";
import Icon from "./Icons";

// Same cd-* header/sidebar classes as the contractor pages.
// activeKey: "dashboard" | "team"
const NAV = [
  { key: "dashboard", to: "/field-worker-dashboard", icon: "dashboard", label: "Dashboard" },
  { key: "team", to: "/field-execution", icon: "providers", label: "Field Team" },
];

function FieldWorkerShell({ activeKey, children }) {
  const sessionUser = getSession()?.user;
  const rawName = sessionUser?.full_name || sessionUser?.name || "";
  const displayName =
    (typeof rawName === "string" ? rawName.trim() : "") || "there";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="cd-page">
      <header className="cd-header">
        <Link
          to="/field-worker-dashboard"
          className="cd-header-logo"
          aria-label="MAMAR Dashboard"
        >
          <img src={logo} alt="MAMAR" />
        </Link>

        <div className="cd-header-actions">
          <NotificationBell />
          <div className="cd-user">
          <div className="cd-user-avatar">{userInitial}</div>
          <div className="cd-user-info">
            <strong>{displayName}</strong>
            <span>Field Worker</span>
          </div>
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

        <main className="cd-main fw-main">{children}</main>
      </div>
    </div>
  );
}

export default FieldWorkerShell;
