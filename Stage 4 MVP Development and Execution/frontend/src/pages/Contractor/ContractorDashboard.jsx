import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";
import MamarMap from "../../components/MamarMap";
import { logout } from "../../services/auth";
import { getSession } from "../../services/auth";
import Icon from "../../components/Icons";
import { formatDate } from "../../services/projectFlow";
import {
  buildActivity,
  fetchProjects,
  getStats,
  nextStepFor,
  openProjectInFlow,
  startNewProject,
  thumbTone,
} from "../../services/projects";

function ContractorDashboard() {
  const navigate = useNavigate();

  const sessionUser = getSession()?.user;
  const rawName = sessionUser?.full_name || sessionUser?.name || "";
  const displayName =
    (typeof rawName === "string" ? rawName.trim() : "") || "there";
  const userInitial = displayName.charAt(0).toUpperCase();

  // Real projects from the backend (GET /projects)
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetchProjects()
      .then((list) => active && setAllProjects(list))
      .catch(
        (err) =>
          active && setError(err.message || "Could not load your projects.")
      )
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const stats = getStats(allProjects);

  const statistics = [
    { title: "Total Projects", value: stats.total, icon: "list" },
    { title: "In Progress", value: stats.inProgress, icon: "clock" },
    { title: "Completed", value: stats.completed, icon: "check" },
    { title: "Pending Quotes", value: stats.pendingQuotes, icon: "dots" },
  ];

  // The dashboard shows the 4 newest. "View all" opens the full page.
  const projects = allProjects.slice(0, 4);
  const activities = buildActivity(allProjects);

  function handleCreateProject() {
    startNewProject(); // so the form starts empty
    navigate("/create-project");
  }

  function handleOpenProject(project) {
    const step = nextStepFor(project);
    if (!step) return;
    openProjectInFlow(project);
    navigate(step.to);
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
    <div className="cd-page">
      {/* Header */}
      <header className="cd-header">
        <Link
          to="/contractor-dashboard"
          className="cd-header-logo"
          aria-label="MAMAR Dashboard"
        >
          <img src={logo} alt="MAMAR" />
        </Link>

        <div className="cd-user">
          <div className="cd-user-avatar">{userInitial}</div>
          <div className="cd-user-info">
            <strong>{displayName}</strong>
            <span>Contractor</span>
          </div>
        </div>
      </header>

      <div className="cd-body">
        {/* Sidebar */}
        <aside className="cd-sidebar">
          <nav className="cd-nav" aria-label="Main navigation">
            <Link to="/contractor-dashboard" className="cd-nav-active">
              <Icon name="dashboard" />
              <span>Dashboard</span>
            </Link>

            <Link to="/my-projects">
              <Icon name="projects" />
              <span>My Projects</span>
            </Link>

            <Link to="/create-project" onClick={startNewProject}>
              <Icon name="create" />
              <span>Create Project</span>
            </Link>

            <Link to="/providers">
              <Icon name="providers" />
              <span>Providers</span>
            </Link>

            <Link to="/quotations">
              <Icon name="quotations" />
              <span>Quotations</span>
            </Link>
          </nav>

          <div className="cd-sidebar-bottom">
            <Link to="/data-disclaimer">
              <Icon name="info" />
              <span>Data Disclaimer</span>
            </Link>

            <Link to="/help">
              <Icon name="help" />
              <span>Help &amp; Support</span>
            </Link>

            <Link to="/login" onClick={logout}>
              <Icon name="logout" />
              <span>Log out</span>
            </Link>
          </div>
        </aside>

        {/* Main dashboard */}
        <main className="cd-main">
          {/* Welcome */}
          <section className="cd-welcome">
            <div>
              <h1>
                Welcome Back, {displayName.split(" ")[0]}{" "}
                <span role="img" aria-label="waving hand">
                  👋
                </span>
              </h1>
              <p>Here&apos;s an overview of your projects and activity.</p>
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
                  <h2>Project Locations</h2>
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

                {/* TODO(BACKEND): GET /activity for quotes, status changes and
                    provider messages. For now: "Project created" only. */}
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
        </main>
      </div>
    </div>
  );
}

export default ContractorDashboard;
