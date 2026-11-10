import logo from "../../assets/mamar-logo.svg";
import NotificationBell from "../../components/NotificationBell";
import { useProviderDashboard } from "../../services/providers/api";
import { Link } from "react-router-dom";
import ProviderSidebar from "../../components/ProviderSidebar";
import Button from "../../components/Button";
import { getSession } from "../../services/auth";
import { formatDate } from "../../services/projectFlow";
import { getProviderDashboard } from "../../services/providers/providerQuotes";

function ProviderDashboard() {
  const { displayName, initials, data, loading, error } =
    useProviderDashboard(getSession, getProviderDashboard);

  const stats = data?.stats || { assigned: 0, active: 0, upcoming: 0, completed: 0 };

  const summaryCards = [
    { label: "Assigned Projects", value: stats.assigned, icon: "＋", color: "yellow" },
    { label: "Active Execution", value: stats.active, icon: "✓", color: "green" },
    { label: "Upcoming", value: stats.upcoming, icon: "□", color: "blue" },
    { label: "Completed Projects", value: stats.completed, icon: "✓", color: "gray" },
  ];

  const newRequests = data?.newRequests || [];
  const newProject = data?.newProject || null;
  const activeProjects = data?.activeProjects || [];
  const overview = data?.overview || { workersActive: 0, sitesActive: 0 };

  return (
    <div className="provider-dashboard-page">
      <ProviderSidebar />

      <div className="provider-main-area">
        <header className="provider-topbar">
          <div />

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "24px" }}>
            <NotificationBell />

            <div className="provider-account">
              <Link
              to="/provider/profile"
              className="provider-avatar"
              aria-label="Open my profile"
              style={{ textDecoration: "none" }}
            >{initials || "P"}</Link>

              <div>
                <strong>{displayName}</strong>
                <span>Service Provider</span>
              </div>
            </div>
          </div>
        </header>

        <main className="provider-dashboard-content">
          <section className="provider-title">
            <h1>Provider Dashboard</h1>

            <p>
              Review service requests, manage assigned projects and track field
              execution.
            </p>
          </section>

          {error && (
            <p className="review-error" role="alert">
              {error}
            </p>
          )}

          <section className="provider-summary-grid">
            {summaryCards.map((card) => (
              <article className="provider-summary-card" key={card.label}>
                <div className={`provider-summary-icon ${card.color}`}>
                  {card.icon}
                </div>

                <div>
                  <span>{card.label}</span>
                  <strong>{loading ? "–" : card.value}</strong>
                </div>
              </article>
            ))}
          </section>

          <section className="provider-section">
            <h2>New Service Request</h2>

            {loading ? (
              <p className="pf-empty">Loading requests…</p>
            ) : newRequests.length === 0 ? (
              <p className="pf-empty">
                No new service requests right now. New requests from
                contractors will appear here.
              </p>
            ) : (
              newRequests.map((request) => (
                <article
                  className="service-request-card"
                  key={request.id}
                  style={{ marginBottom: 16 }}
                >
                  <span className="request-badge">● &nbsp; NEW REQUEST</span>

                  <h3>{request.name}</h3>

                  <p className="request-company">{request.type}</p>

                  <div className="request-details">
                    <div>
                      <span>LOCATION</span>
                      <strong>{request.location}</strong>
                    </div>

                    <div>
                      <span>START DATE</span>
                      <strong>{formatDate(request.startDate)}</strong>
                    </div>

                    <div>
                      <span>END DATE</span>
                      <strong>{formatDate(request.endDate)}</strong>
                    </div>

                    <div>
                      <span>STATUS</span>
                      <strong className="request-status">{request.status}</strong>
                    </div>
                  </div>

                  <div className="request-footer">
                    <div className="request-tags">
                      {request.services.map((service) => (
                        <span key={service}>{service}</span>
                      ))}
                    </div>

                    <Button to={`/provider/quotation?requestId=${request.id}`}>
                      Prepare Quotation →
                    </Button>
                  </div>
                </article>
              ))
            )}
          </section>

          <section className="provider-section">
            <h2>New Assigned Project</h2>

            {loading ? (
              <p className="pf-empty">Loading…</p>
            ) : !newProject ? (
              <p className="pf-empty">
                No new assigned projects. A project appears here when a
                contractor accepts your quotation.
              </p>
            ) : (
              <article className="assigned-project-card">
                <div>
                  <span className="accepted-badge">QUOTE ACCEPTED</span>

                  <h3>{newProject.name}</h3>

                  <p>{newProject.subtitle}</p>

                  <span className="ready-status">{newProject.status}</span>
                </div>

                <Button to={`/provider/projects/${encodeURIComponent(newProject.id)}`}>View Project →</Button>
              </article>
            )}
          </section>

          <section className="provider-bottom-grid">
            <article className="provider-bottom-card">
              <div className="provider-card-heading">
                <h2>Active Projects</h2>
                <Link to="/provider/projects">View All</Link>
              </div>

              <div className="active-project-header">
                <span>PROJECT</span>
                <span>LOCATION</span>
                <span>PROGRESS</span>
                <span>STATUS</span>
              </div>

              {!loading && activeProjects.length === 0 && (
                <p className="pf-empty">No active projects.</p>
              )}

              {activeProjects.map((project) => (
                <div className="active-project-row" key={project.id}>
                  <span>{project.name}</span>
                  <span>{project.city}</span>

                  <div className="progress-area">
                    <div className="progress-bar">
                      <div style={{ width: `${project.progress}%` }} />
                    </div>

                    <span>{project.progress}%</span>
                  </div>

                  <span className="active-badge">Active</span>
                </div>
              ))}
            </article>

            <article className="provider-bottom-card execution-overview">
              <h2>Execution Overview</h2>

              <div className="execution-item">
                <span className="execution-icon yellow">✓</span>

                <div>
                  <small>FIELD TEAM</small>
                  <p>{overview.workersActive} Workers Active</p>
                </div>
              </div>

              <div className="execution-item">
                <span className="execution-icon green">✓</span>

                <div>
                  <small>SITE EXECUTION</small>
                  <p>{overview.sitesActive} Sites Active</p>
                </div>
              </div>

              <Link to="/provider/projects">View Execution Details →</Link>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}

export default ProviderDashboard;
