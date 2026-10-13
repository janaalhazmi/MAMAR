import { Link } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";

function ProviderDashboard() {
  return (
    <div className="provider-dashboard-page">

      {/* Sidebar */}
      <aside className="provider-sidebar">

        <Link to="/" className="provider-sidebar-logo">
          <img src={logo} alt="MAMAR Logo" />
        </Link>

        <nav className="provider-sidebar-nav">
          <Link to="/provider-dashboard" className="active">
            <span>▦</span>
            Dashboard
          </Link>

          <Link to="/provider/projects">
            <span>▣</span>
            Projects
          </Link>

          <Link to="/provider/execution">
            <span>↗</span>
            Execution
          </Link>

          <Link to="/provider/device-verification">
            <span>♢</span>
            Device Verification
          </Link>

          <Link to="/provider/field-team">
            <span>♧</span>
            Field Team
          </Link>
        </nav>

        <div className="provider-sidebar-bottom">
          <a href="#disclaimer">
            <span>ⓘ</span>
            Data Disclaimer
          </a>

          <a href="#support">
            <span>?</span>
            Help & Support
          </a>

          <Link to="/login">
            <span>→</span>
            Log out
          </Link>
        </div>

      </aside>


      {/* Main */}
      <div className="provider-main-area">

        {/* Header */}
        <header className="provider-topbar">

          <div />

          <div className="provider-account">
            <div className="provider-avatar">TC</div>

            <div>
              <strong>TCM</strong>
              <span>Service Provider</span>
            </div>
          </div>

        </header>


        <main className="provider-dashboard-content">

          {/* Title */}
          <section className="provider-title">
            <h1>Provider Dashboard</h1>

            <p>
              Review service requests, manage assigned projects and track field
              execution.
            </p>
          </section>


          {/* Statistics */}
          <section className="provider-summary-grid">

            <article className="provider-summary-card">
              <div className="provider-summary-icon yellow">＋</div>

              <div>
                <span>Assigned Projects</span>
                <strong>04</strong>
              </div>
            </article>

            <article className="provider-summary-card">
              <div className="provider-summary-icon green">✓</div>

              <div>
                <span>Active Execution</span>
                <strong>02</strong>
              </div>
            </article>

            <article className="provider-summary-card">
              <div className="provider-summary-icon blue">□</div>

              <div>
                <span>Upcoming</span>
                <strong>01</strong>
              </div>
            </article>

            <article className="provider-summary-card">
              <div className="provider-summary-icon gray">✓</div>

              <div>
                <span>Completed Projects</span>
                <strong>01</strong>
              </div>
            </article>

          </section>


          {/* New Service Request */}
          <section className="provider-section">

            <h2>New Service Request</h2>

            <article className="service-request-card">

              <span className="request-badge">
                ● &nbsp; NEW REQUEST
              </span>

              <h3>King Fahd Road – Water Line</h3>

              <p className="request-company">
                Al Noor Contracting · Infrastructure Project
              </p>


              <div className="request-details">

                <div>
                  <span>LOCATION</span>
                  <strong>King Fahd Road, Riyadh</strong>
                </div>

                <div>
                  <span>START DATE</span>
                  <strong>18 Oct 2026</strong>
                </div>

                <div>
                  <span>END DATE</span>
                  <strong>24 Oct 2026</strong>
                </div>

                <div>
                  <span>STATUS</span>
                  <strong className="request-status">
                    Awaiting Your Quote
                  </strong>
                </div>

              </div>


              <div className="request-footer">

                <div className="request-tags">
                  <span>Traffic Barriers</span>
                  <span>Traffic Cones</span>
                  <span>Road Signs</span>
                </div>

                <button type="button" className="prepare-quotation-btn">
                  Prepare Quotation →
                </button>

              </div>

            </article>

          </section>


          {/* Assigned Project */}
          <section className="provider-section">

            <h2>New Assigned Project</h2>

            <article className="assigned-project-card">

              <div>
                <span className="accepted-badge">
                  QUOTE ACCEPTED
                </span>

                <h3>Al Mursalat – Road Maintenance</h3>

                <p>Riyadh · 25–30 Oct 2026</p>

                <span className="ready-status">
                  Ready to Start
                </span>
              </div>

              <button type="button" className="view-project-btn">
                View Project →
              </button>

            </article>

          </section>


          {/* Bottom Grid */}
          <section className="provider-bottom-grid">

            {/* Active Projects */}
            <article className="provider-bottom-card">

              <div className="provider-card-heading">
                <h2>Active Projects</h2>
                <a href="#projects">View All</a>
              </div>


              <div className="active-project-header">
                <span>PROJECT</span>
                <span>LOCATION</span>
                <span>PROGRESS</span>
                <span>STATUS</span>
              </div>


              <div className="active-project-row">

                <span>Northern Ring Road</span>
                <span>Riyadh</span>

                <div className="progress-area">
                  <div className="progress-bar">
                    <div style={{ width: "68%" }} />
                  </div>
                  <span>68%</span>
                </div>

                <span className="active-badge">Active</span>

              </div>


              <div className="active-project-row">

                <span>Olaya Road Works</span>
                <span>Riyadh</span>

                <div className="progress-area">
                  <div className="progress-bar">
                    <div style={{ width: "35%" }} />
                  </div>
                  <span>35%</span>
                </div>

                <span className="active-badge">Active</span>

              </div>

            </article>


            {/* Execution Overview */}
            <article className="provider-bottom-card execution-overview">

              <h2>Execution Overview</h2>

              <div className="execution-item">
                <span className="execution-icon yellow">✓</span>

                <div>
                  <small>FIELD TEAM</small>
                  <p>6 Workers Active</p>
                </div>
              </div>


              <div className="execution-item">
                <span className="execution-icon green">✓</span>

                <div>
                  <small>SITE EXECUTION</small>
                  <p>2 Sites Active</p>
                </div>
              </div>


              <a href="#execution">
                View Execution Details →
              </a>

            </article>

          </section>

        </main>
      </div>
    </div>
  );
}

export default ProviderDashboard;
