import { useEffect, useState } from "react";
import { getSession } from "../../services/auth";
import { getServiceRequests } from "../../services/api";
import ProviderSidebar from "../../components/ProviderSidebar";

const summaryCards = [
  {
    label: "Assigned Projects",
    value: "—",
    icon: "＋",
    color: "yellow",
  },
  {
    label: "Active Execution",
    value: "—",
    icon: "✓",
    color: "green",
  },
  {
    label: "Upcoming",
    value: "—",
    icon: "□",
    color: "blue",
  },
  {
    label: "Completed Projects",
    value: "—",
    icon: "✓",
    color: "gray",
  },
];

function ProviderDashboard() {
  const session = getSession();
  const fullName = session?.user?.full_name || "Service Provider";
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => Array.from(word)[0])
    .join("")
    .toUpperCase() || "SP";

  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRequests() {
      try {
        const session = getSession();

        if (!session?.access_token) {
          throw new Error("Please sign in again.");
        }

        const data = await getServiceRequests(session.access_token);

        if (!Array.isArray(data)) {
          throw new Error("Unexpected response from the server.");
        }

        if (!cancelled) {
          setRequests(data);
        }
      } catch (error) {
        if (!cancelled) {
          setRequestsError(
            error.message || "Unable to load service requests."
          );
        }
      } finally {
        if (!cancelled) {
          setRequestsLoading(false);
        }
      }
    }

    loadRequests();

    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <div className="provider-dashboard-page">
      <ProviderSidebar />

      <div className="provider-main-area">
        <header className="provider-topbar">
          <div />

          <div className="provider-account">
            <div className="provider-avatar">{initials}</div>

            <div>
              <strong>{fullName}</strong>
              <span>Service Provider</span>
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

          <section className="provider-summary-grid">
            {summaryCards.map((card) => (
              <article
                className="provider-summary-card"
                key={card.label}
              >
                <div
                  className={`provider-summary-icon ${card.color}`}
                >
                  {card.icon}
                </div>

                <div>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </div>
              </article>
            ))}
          </section>

          <section className="provider-section">
            <h2>New Service Requests</h2>

            {requestsLoading ? (
              <p>Loading service requests...</p>
            ) : requestsError ? (
              <p role="alert">{requestsError}</p>
            ) : requests.length === 0 ? (
              <article className="service-request-card">
                <h3>No open service requests</h3>
                <p>Open service requests will appear here.</p>
              </article>
            ) : (
              requests.map((request) => (
                <article
                  className="service-request-card"
                  key={request.request_id}
                >
                  <span className="request-badge">● OPEN REQUEST</span>
                  <h3>{request.title}</h3>
                  <p className="request-company">
                    Project ID: {request.project_id}
                  </p>

                  {request.details && <p>{request.details}</p>}

                  <div className="request-details">
                    <div>
                      <span>REQUIRED BY</span>
                      <strong>{request.required_by}</strong>
                    </div>

                    <div>
                      <span>STATUS</span>
                      <strong>{request.status}</strong>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>

          <section className="provider-section">
            <h2>New Assigned Project</h2>

            <article className="assigned-project-card">
              <div>
                <h3>Project data unavailable</h3>
                <p>Assigned projects will appear when connected.</p>
              </div>
            </article>
          </section>

          <section className="provider-bottom-grid">
            <article className="provider-bottom-card">
              <div className="provider-card-heading">
                <h2>Active Projects</h2>
                <a href="#projects">View All</a>
              </div>

              <p>Active project data is currently unavailable.</p>
            </article>

            <article className="provider-bottom-card execution-overview">
              <h2>Execution Overview</h2>

              <div className="execution-item">
                <span className="execution-icon yellow">
                  ✓
                </span>

                <div>
                  <small>FIELD TEAM</small>
                  <p>Worker data unavailable</p>
                </div>
              </div>

              <div className="execution-item">
                <span className="execution-icon green">
                  ✓
                </span>

                <div>
                  <small>SITE EXECUTION</small>
                  <p>Site data unavailable</p>
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