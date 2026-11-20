import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FieldWorkerShell from "../../components/FieldWorkerShell";
import Icon from "../../components/Icons";
import { formatDate, getFieldWorkerDashboard } from "../../services/FieldWorker/FieldWorker";

const pad = (n) => String(n).padStart(2, "0");

function FieldWorkerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getFieldWorkerDashboard()
      .then((result) => active && setData(result))
      .catch(() => active && setError("Could not load your dashboard."));
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <FieldWorkerShell activeKey="dashboard">
        <p className="pf-alert" role="alert">
          {error}
        </p>
      </FieldWorkerShell>
    );
  }

  if (!data) {
    return (
      <FieldWorkerShell activeKey="dashboard">
        <p className="pf-empty">Loading…</p>
      </FieldWorkerShell>
    );
  }

  const { stats, newProject, activeProjects, overview } = data;

  const statCards = [
    { label: "Assigned Projects", value: stats.assigned, icon: "plus", tone: "yellow" },
    { label: "Active Execution", value: stats.active, icon: "check", tone: "green" },
    { label: "Upcoming", value: stats.upcoming, icon: "square", tone: "blue" },
    { label: "Completed Projects", value: stats.completed, icon: "check", tone: "grey" },
  ];

  return (
    <FieldWorkerShell activeKey="dashboard">
      <section className="pf-heading">
        <h1>Field Worker Dashboard</h1>
        <p>Manage field work and provide evidence.</p>
      </section>

      <section className="fw-stats">
        {statCards.map((card) => (
          <div className="pf-card fw-stat" key={card.label}>
            <span className={`fw-stat-icon fw-tone-${card.tone}`}>
              <Icon name={card.icon} size={18} />
            </span>
            <div>
              <span className="pf-label">{card.label}</span>
              <strong className="pf-big">{pad(card.value)}</strong>
            </div>
          </div>
        ))}
      </section>

      <section className="pf-section">
        <h2>New Assigned Project</h2>
      </section>

      {newProject && (
        <article className="pf-card fw-assigned">
          <span className="pf-pill pf-pill-yellow">
            <i aria-hidden="true" />
            New Project
          </span>

          <h3 className="fw-assigned-title">{newProject.name}</h3>
          <p className="pf-sub">{newProject.type}</p>

          <div className="fw-assigned-grid">
            <div>
              <span className="pf-label">Location</span>
              <strong>{newProject.location}</strong>
            </div>
            <div>
              <span className="pf-label">Start Date</span>
              <strong>{formatDate(newProject.startDate)}</strong>
            </div>
            <div>
              <span className="pf-label">End Date</span>
              <strong>{formatDate(newProject.endDate)}</strong>
            </div>
          </div>

          <div className="fw-assigned-bottom">
            <div>
              <span className="pf-label">Required Services</span>
              <div className="fw-chips">
                {newProject.services.map((service) => (
                  <span className="fw-chip" key={service}>
                    {service}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="pf-label">Status</span>
              <span className="pf-pill pf-pill-yellow">
                <i aria-hidden="true" />
                {newProject.status}
              </span>
            </div>
            <button
              type="button"
              className="pf-btn pf-btn-primary"
              onClick={() => navigate("/field-execution")}
            >
              Open Project →
            </button>
          </div>
        </article>
      )}

      <div className="fw-two-col">
        <section className="pf-card pf-pad">
          <div className="fw-card-head">
            <h2>Active Projects</h2>
            <button type="button" className="fw-link" onClick={() => navigate("/field-execution")}>
              View All
            </button>
          </div>

          <div className="pf-table-wrap fw-flat">
            <table className="pf-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Location</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeProjects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <strong>{project.name}</strong>
                    </td>
                    <td>{project.location}</td>
                    <td>
                      <div className="pf-progress-row">
                        <div className="pf-bar" aria-hidden="true">
                          <span style={{ width: `${project.progress}%` }} />
                        </div>
                        <small>{project.progress}%</small>
                      </div>
                    </td>
                    <td>
                      <span className="pf-pill pf-pill-green">{project.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="pf-card pf-pad">
          <h2>Execution Overview</h2>

          <ul className="fw-overview">
            <li>
              <span className="pf-tick pf-tick-soft" aria-hidden="true">
                <Icon name="check" size={14} />
              </span>
              <div>
                <span className="pf-label">Field Team</span>
                <strong>{overview.workersActive} Workers Active</strong>
              </div>
            </li>
            <li>
              <span className="pf-tick pf-tick-green" aria-hidden="true">
                <Icon name="check" size={14} />
              </span>
              <div>
                <span className="pf-label">Site Check-ins</span>
                <strong>{overview.sitesActive} Sites Active</strong>
              </div>
            </li>
          </ul>

          <button
            type="button"
            className="pf-btn pf-btn-secondary fw-full"
            onClick={() => navigate("/field-execution")}
          >
            View Execution Details →
          </button>
        </section>
      </div>
    </FieldWorkerShell>
  );
}

export default FieldWorkerDashboard;
