import { Link } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";

function Footer() {
  return (
    <footer className="mamar-footer">
      <div className="mamar-footer-brand">
        <img src={logo} alt="MAMAR Logo" />

        <p>
          Temporary Traffic Control Management 
        </p>
      </div>

      <div className="mamar-footer-links">
        <a href="#how-mamar-works">How it works</a>
        <Link to="/register">Contractors</Link>
        <Link to="/register">Providers</Link>
        <Link to="/support">Help &amp; Support</Link>
      </div>

      <div className="mamar-footer-bottom">
        © 2026 MAMAR. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
