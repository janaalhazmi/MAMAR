import { Link } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";
import Button from "./Button";

function Header() {
  return (
    <header className="mamar-header">
      <Link to="/" className="mamar-header-logo">
        <img src={logo} alt="MAMAR Logo" />
      </Link>

      <div className="mamar-header-actions">
        <Button to="/login" variant="secondary">
          Sign in →
        </Button>

        <Button to="/register">
          Get Started
        </Button>
      </div>
    </header>
  );
}

export default Header;
