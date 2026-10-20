import { Link, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Wrench,
  BadgeCheck,
  Users,
  Info,
  CircleHelp,
  LogOut,
} from "lucide-react";

import logo from "../assets/mamar-logo.svg";

const providerNavigation = [
  {
    label: "Dashboard",
    path: "/provider-dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Projects",
    path: "/provider/projects",
    icon: FolderKanban,
  },
  {
    label: "Execution",
    path: "/provider/execution",
    icon: Wrench,
  },
  {
    label: "Device Verification",
    path: "/provider/device-verification",
    icon: BadgeCheck,
  },
  {
    label: "Field Team",
    path: "/provider/field-team",
    icon: Users,
  },
];

function ProviderSidebar() {
  return (
    <aside className="mamar-sidebar">
      <Link to="/" className="mamar-sidebar-logo">
        <img src={logo} alt="MAMAR Logo" />
      </Link>

      <nav className="mamar-sidebar-nav">
        {providerNavigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "active" : ""
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mamar-sidebar-bottom">
        <Link to="/data-disclaimer">
          <Info size={18} />
          <span>Data Disclaimer</span>
        </Link>

        <Link to="/support">
          <CircleHelp size={18} />
          <span>Help & Support</span>
        </Link>

        <Link to="/login">
          <LogOut size={18} />
          <span>Log out</span>
        </Link>
      </div>
    </aside>
  );
}

export default ProviderSidebar;
