import { getSession, logout } from "../services/auth";
import { Link } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";
import Button from "./Button";

function Header() {
  const session = getSession();
  return (
    <header className="mamar-header">
      <Link to="/" className="mamar-header-logo">
        <img src={logo} alt="MAMAR Logo" />
      </Link>

      <div className="mamar-header-actions">
        {session ? (
          <>
            <Button to={session.user.role === "provider"
              ? "/provider-dashboard" : "/contractor-dashboard"}>
              Dashboard
            </Button>
            <Button to="/login" variant="secondary" onClick={logout}>
              Log out
            </Button>
          </>
        ) : (
          <>
        <Button to="/login" variant="secondary">
          Sign in →
        </Button>

        <Button to="/register">
          Get Started
        </Button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
