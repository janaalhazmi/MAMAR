import { Link } from "react-router-dom";

import logo from "../assets/mamar-logo.svg";
import hero from "../assets/hero.jpg";

import tcm from "../assets/provider-tcm.jpg";
import safetyArabia from "../assets/provider-safety-arabia.jpg";
import shawahid from "../assets/provider-shawahid.jpg";
import safetyTriangle from "../assets/provider-safety-triangle.jpg";

function LandingPage() {
  return (
    <div className="landing-page">

      {/* Navbar */}
      <header className="navbar">

        <Link to="/" className="brand">
          <img
            src={logo}
            alt="MAMAR Logo"
            className="brand-logo"
          />
        </Link>

        <div className="nav-buttons">

          <Link
            to="/login"
            className="nav-btn sign-in"
          >
            Sign in <span>→</span>
          </Link>

          <Link
            to="/register"
            className="nav-btn get-started"
          >
            Get Started
          </Link>

        </div>

      </header>


      <main>

        {/* Hero */}
        <section className="hero">

          <img
            src={hero}
            alt="Roadwork"
            className="hero-image"
          />

          <div className="hero-content">

            <h1>
              <span className="hero-gray">
                Manage Roadwork
              </span>

              <span className="hero-yellow">
                Coordinate Every Move.
              </span>
            </h1>

            <div className="hero-actions">

              <Link
                to="/register"
                className="primary-btn"
              >
                Start a Project <span>→</span>
              </Link>

              <a
                href="#how-mamar-works"
                className="outline-btn"
              >
                Explore MAMAR <span>→</span>
              </a>

            </div>

          </div>

        </section>


        {/* How MAMAR Works */}
        <section
          className="how-section"
          id="how-mamar-works"
        >

          <div className="how-title">
            How <span>MAMAR</span> Works
          </div>

          <div className="steps-box">

            <article className="step-card">
              <span className="step-number">1</span>

              <h3>
                Define Your Project
              </h3>

              <p>
                Tell us about your project, scope,
                timeline, and traffic-control needs.
              </p>
            </article>


            <article className="step-card">
              <span className="step-number">2</span>

              <h3>
                Map Work Zone
              </h3>

              <p>
                Define the project work zone using
                MAMAR's map-based tools.
              </p>
            </article>


            <article className="step-card">
              <span className="step-number">3</span>

              <h3>
                Request & Compare Quotes
              </h3>

              <p>
                Request services and compare quotations
                from qualified providers.
              </p>
            </article>


            <article className="step-card">
              <span className="step-number">4</span>

              <h3>
                Manage & Verify Execution
              </h3>

              <p>
                Follow project execution and verify
                field installations.
              </p>
            </article>

          </div>

        </section>


        {/* Providers */}
        <section className="providers-section">

          <div className="providers-title">
            Featured Service Providers
          </div>

          <div className="providers-grid">

            <article className="provider-card">
              <img
                src={tcm}
                alt="TCM"
              />

              <h3>
                TCM
              </h3>

              <p>
                Traffic and Construction Management
              </p>
            </article>


            <article className="provider-card">
              <img
                src={safetyArabia}
                alt="Safety Arabia"
              />

              <h3>
                Safety Arabia Co. LTD
              </h3>
            </article>


            <article className="provider-card">
              <img
                src={shawahid}
                alt="Shawahid Roads"
              />

              <h3>
                Shawahid Roads Industrial Co.
              </h3>
            </article>


            <article className="provider-card">
              <img
                src={safetyTriangle}
                alt="Safety Triangle"
              />

              <h3>
                Safety Triangle Company
              </h3>
            </article>

          </div>

        </section>


        {/* Why MAMAR */}
        <section className="why-section">

          <h2>
            Why <span>MAMAR?</span>
          </h2>

          <div className="why-grid">

            <article>
              <h3>
                Location-Based Coordination
              </h3>

              <p>
                Manage project work zones and roadwork
                locations through map-based coordination.
              </p>
            </article>


            <article>
              <h3>
                Qualified Providers
              </h3>

              <p>
                Connect contractors with traffic-control
                service providers.
              </p>
            </article>


            <article>
              <h3>
                Smarter Procurement
              </h3>

              <p>
                Request, compare, and select provider
                quotations in one workflow.
              </p>
            </article>


            <article>
              <h3>
                Verified Field Execution
              </h3>

              <p>
                Support field verification using device
                location and installation evidence.
              </p>
            </article>

          </div>

        </section>


        {/* CTA */}
        <section className="cta-section">

          <div>
            <h2>
              Coordinate your next project with confidence.
            </h2>
          </div>

          <Link
            to="/register"
            className="primary-btn"
          >
            Start a Project <span>→</span>
          </Link>

        </section>

      </main>


      {/* Footer */}
      <footer className="footer">

        <div className="footer-brand">

          <img
            src={logo}
            alt="MAMAR Logo"
          />

          <p>
            Temporary Traffic Control Coordination Platform
          </p>

        </div>


        <div className="footer-columns">

          <div>
            <h4>Product</h4>
            <a href="#how-mamar-works">
              How it works
            </a>
          </div>


          <div>
            <h4>For</h4>
            <Link to="/register">
              Contractors
            </Link>
            <Link to="/register">
              Providers
            </Link>
          </div>


          <div>
            <h4>Company</h4>
            <a href="#">
              About
            </a>
          </div>

        </div>


        <div className="footer-bottom">
          © 2026 MAMAR. All rights reserved.
        </div>

      </footer>

    </div>
  );
}

export default LandingPage;
