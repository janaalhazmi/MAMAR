import { Link } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";

function Sidebar({ items, activePath }) {
  return (
    <aside className="mamar-sidebar">
      <Link to="/" className="mamar-sidebar-logo">
        <img src={logo} alt="MAMAR Logo" />
      </Link>

      <nav className="mamar-sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={
                activePath === item.path ? "active" : ""
              }
            >
              {Icon && <Icon size={20} />}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mamar-sidebar-bottom">
        <Link to="/support">Help & Support</Link>
        <Link to="/login">Log out</Link>
      </div>
    </aside>
  );
}

export default Sidebar;
