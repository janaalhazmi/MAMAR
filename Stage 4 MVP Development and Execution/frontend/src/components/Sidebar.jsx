import { Link, NavLink } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";

function Sidebar({ items }) {
  return (
    <aside className="mamar-sidebar">
      <Link to="/" className="mamar-sidebar-logo">
        <img src={logo} alt="MAMAR Logo" />
      </Link>

      <nav className="mamar-sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "active" : ""
              }
            >
              {Icon && <Icon size={20} />}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mamar-sidebar-bottom">
         <Link to="/data-disclaimer">
          Data Disclaimer
         </Link>

        <Link to="/support">
          Help & Support
        </Link>

        <Link to="/login">
          Log out
        </Link>
      </div>
    </aside>
  );
}

export default Sidebar;