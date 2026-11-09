import { logout } from "../services/auth";
import { Link, NavLink } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";
import Icon from "./Icons";

function Sidebar({ items = [], activeKey }) {
  return (
    <aside className="mamar-sidebar">
      <Link to="/" className="mamar-sidebar-logo">
        <img src={logo} alt="MAMAR Logo" />
      </Link>

      <nav className="mamar-sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={item.key === activeKey ? "active" : ""}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mamar-sidebar-bottom">
        <Link to="/data-disclaimer">
          <Icon name="info" size={20} />
          <span>Data Disclaimer</span>
        </Link>

        <Link to="/help">
          <Icon name="help" size={20} />
          <span>Help & Support</span>
        </Link>

        <Link to="/login" onClick={logout}>
          <Icon name="logout" size={20} />
          <span>Log out</span>
        </Link>
      </div>
    </aside>
  );
}

export default Sidebar;