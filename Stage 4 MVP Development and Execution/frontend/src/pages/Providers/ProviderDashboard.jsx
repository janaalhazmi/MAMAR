// Shared interface components.
import Button from "../../components/Button";
import NotificationBell from "../../components/NotificationBell";
import ProviderSidebar from "../../components/ProviderSidebar";

// Navigation and dashboard services.
import { Link } from "react-router-dom";
import { useProviderDashboardPage } from "../../services/providers/api";
import { formatDate } from "../../services/projectFlow";

// Provider dashboard view.
function ProviderDashboard() {
  const {
    displayName,
    initials,
    picture,
    successMessage,
    loading,
    error,
    summaryCards,
    newRequests,
    newProject,
    activeProjects,
    overview,
  } = useProviderDashboardPage();

  return (
    <div className="provider-dashboard-page">
      {/* Provider navigation */}
      <ProviderSidebar />

      <div className="provider-main-area">
        {/* Account and notifications */}
        <header className="provider-topbar">
          <div />

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "24px",
            }}
          >
            <NotificationBell />

            <div className="provider-account">
              <Link
                to="/provider/profile"
                className="provider-avatar"
                aria-label="Open my profile"
                style={{
                  textDecoration: "none",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {picture ? (
                  <img
                    src={picture}
                    alt="Profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  initials || "P"
                )}
              </Link>

              <div>
                <strong>{displayName}</strong>
                <span>Service Provider</span>
              </div>
            </div>
          </div>
        </header>

        <main className="provider-dashboard-content">
          {/* Quotation success message */}
          {successMessage && (
            <div
              role="status"
              style={{
                padding: "12px 16px",
                marginBottom: "20px",
                backgroundColor: "#e8f5e9",
                color: "#1b5e20",
                border: "1px solid #a5d6a7",
                borderRadius: "8px",
              }}
            >
              {successMessage}
            </div>
          )}

          {/* Page heading */}
          <section className="provider-title">
            <h1>Provider Dashboard</h1>
            <p>
              Review service requests, manage assigned projects and track field
              execution.
            </p>
          </section>

          {/* Dashboard error message */}
          {error && (
            <p className="review-error" role="alert">
              {error}
            </p>
          )}

          {/* Project statistics */}
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

          {/* New service requests */}
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

          {/* Newly assigned project */}
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
                <Button to={`/provider/projects/${encodeURIComponent(newProject.id)}`}>
                  View Project →
                </Button>
              </article>
            )}
          </section>

          {/* Active projects and execution overview */}
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
