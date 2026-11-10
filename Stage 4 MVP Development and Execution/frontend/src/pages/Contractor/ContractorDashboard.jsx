import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MamarMap from "../../components/MamarMap";
import Icon from "../../components/Icons";
import ContractorShell from "../../components/ContractorShell";

import {
  buildDashboard,
  fetchProjects,
  formatDate,
  getDisplayUser,
  nextStepFor,
  openProject,
  startNewProject,
  thumbTone,
} from "../../services/Contractor/Contractor";

function ContractorDashboard() {
  const navigate = useNavigate();
  const { displayName } = getDisplayUser();

  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetchProjects()
      .then((list) => active && setAllProjects(list))
      .catch((err) =>
        active && setError(err.message || "Could not load your projects.")
      )
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const { statistics, projects, activities } = buildDashboard(allProjects);

  function handleCreateProject() {
    startNewProject();
    navigate("/create-project");
  }

  function handleOpenProject(project) {
    const path = openProject(project);
    if (path) navigate(path);
  }

  const quickActions = [
    {
      title: "Create New Project",
      description: "Add a new road project",
      icon: "plus",
      onClick: handleCreateProject,
    },
    {
      title: "Browse Providers",
      description: "Compare traffic control companies",
      icon: "triangle",
      onClick: () => navigate("/providers"),
    },
    {
      title: "Open Map",
      description: "Explore project locations",
      icon: "target",
      onClick: () => navigate("/project/location"),
    },
  ];

  return (
    <ContractorShell activeKey="dashboard">
      {/* Welcome */}
      <section className="cd-welcome">
        <div>
          <h1>
            Welcome Back, {displayName.split(" ")[0]}{" "}
            <span role="img" aria-label="waving hand">
              👋
            </span>
          </h1>
          <p>Here's an overview of your projects and activity.</p>
        </div>

        <button
          type="button"
          className="cd-create-button"
          onClick={handleCreateProject}
        >
          <Icon name="plus" size={16} />
          Create New Project
        </button>
      </section>

      {/* Statistics */}
      <section className="cd-stats" aria-label="Project statistics">
        {statistics.map((statistic) => (
          <article className="cd-stat-card" key={statistic.title}>
            <div className="cd-stat-icon">
              <Icon name={statistic.icon} size={22} />
            </div>

            <div className="cd-stat-info">
              <strong>{loading ? "–" : statistic.value}</strong>
              <span>{statistic.title}</span>
            </div>
          </article>
        ))}
      </section>

      <div className="cd-grid">
        {/* Left column: map + projects */}
        <div className="cd-column">
          <section className="cd-panel" id="locations">
            <div className="cd-panel-heading">
              <h2>Projects Location</h2>
            </div>

            <div className="cd-map-frame">
              <MamarMap readOnly height="100%" />

              <button
                type="button"
                className="cd-map-button"
                onClick={() => navigate("/project/location")}
              >
                View Full Map →
              </button>
            </div>
          </section>

          <section className="cd-panel" id="projects">
            <div className="cd-panel-heading">
              <h2>My Projects</h2>

              <Link to="/my-projects" className="cd-link">
                View all →
              </Link>
            </div>

            {error ? (
              <p className="cd-empty" role="alert">
                {error}
              </p>
            ) : loading ? (
              <p className="cd-empty">
                Loading your projects… the server can take a few seconds to
                wake up.
              </p>
            ) : projects.length === 0 ? (
              <p className="cd-empty">
                You have no projects yet. Create your first project to see
                it here.
              </p>
            ) : (
              <div className="cd-table-wrapper">
                <table className="cd-table">
                  <thead>
                    <tr>
                      <th>Project Name</th>
                      <th>Location</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                      <th className="cd-col-actions">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id}>
                        <td>
                          <div className="cd-project-name">
                            <span
                              className={`cd-thumb cd-thumb-${thumbTone(project)}`}
                              aria-hidden="true"
                            />
                            <strong>{project.name}</strong>
                          </div>
                        </td>

                        <td>
                          <span className="cd-location">
                            <Icon name="pin" size={12} />
                            {project.location}
                          </span>
                        </td>

                        <td>{formatDate(project.startDate)}</td>
                        <td>{formatDate(project.endDate)}</td>

                        <td>
                          <span
                            className={`cd-status cd-status-${project.statusTone}`}
                          >
                            {project.statusLabel}
                          </span>
                        </td>

                        <td className="cd-col-actions">
                          <button
                            type="button"
                            className="cd-row-menu"
                            aria-label={`Open ${project.name}`}
                            onClick={() => handleOpenProject(project)}
                            disabled={!nextStepFor(project)}
                          >
                            <Icon name="more" size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right column: quick actions + activity */}
        <div className="cd-column">
          <section className="cd-panel">
            <div className="cd-panel-heading">
              <h2>Quick Actions</h2>
            </div>

            <div className="cd-quick-list">
              {quickActions.map((action) => (
                <button
                  type="button"
                  className="cd-quick-action"
                  key={action.title}
                  onClick={action.onClick}
                >
                  <span className="cd-quick-icon">
                    <Icon name={action.icon} size={18} />
                  </span>

                  <span className="cd-quick-info">
                    <strong>{action.title}</strong>
                    <small>{action.description}</small>
                  </span>

                  <span className="cd-quick-arrow">
                    <Icon name="chevron" size={14} />
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="cd-panel">
            <div className="cd-panel-heading">
              <h2>Recent Activity</h2>

              <Link to="/my-projects" className="cd-link">
                View all →
              </Link>
            </div>

            {activities.length === 0 ? (
              <p className="cd-empty">No activity yet.</p>
            ) : (
              <div className="cd-activity-list">
                {activities.map((activity) => (
                  <article className="cd-activity-item" key={activity.id}>
                    <div
                      className={`cd-activity-icon cd-activity-${activity.tone}`}
                    >
                      <Icon name="plus" size={16} />
                    </div>

                    <div className="cd-activity-info">
                      <strong>{activity.title}</strong>
                      <p>{activity.text}</p>
                    </div>

                    <span className="cd-activity-time">{activity.time}</span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="cd-footer">
        <span>© 2026 MAMAR. All rights reserved.</span>

        <div className="cd-footer-links">
          <Link to="/data-disclaimer">Privacy &amp; Data</Link>
        </div>
      </footer>
    </ContractorShell>
  );
}

export default ContractorDashboard;