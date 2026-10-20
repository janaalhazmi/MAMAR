import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";
import MamarMap from "../components/MamarMap";
import "./ContractorDashboard.css";

function ContractorDashboard() {
  const navigate = useNavigate();

  const statistics = [
    {
      title: "Total Projects",
      value: "12",
      change: "+2 this month",
      icon: "▦",
      className: "stat-icon-yellow",
    },
    {
      title: "Active Projects",
      value: "4",
      change: "Currently in progress",
      icon: "◷",
      className: "stat-icon-blue",
    },
    {
      title: "Pending Quotations",
      value: "3",
      change: "Awaiting your response",
      icon: "▤",
      className: "stat-icon-orange",
    },
    {
      title: "Completed Projects",
      value: "8",
      change: "Successfully completed",
      icon: "✓",
      className: "stat-icon-green",
    },
  ];

  const projects = [
    {
      name: "King Fahd Road – Water Line",
      type: "Infrastructure",
      location: "King Fahd Road, Riyadh",
      status: "In Progress",
      statusClass: "status-progress",
      progress: 65,
      date: "20 Sep 2026",
    },
    {
      name: "North Riyadh Road Maintenance",
      type: "Road Maintenance",
      location: "Al Narjis, Riyadh",
      status: "Pending",
      statusClass: "status-pending",
      progress: 20,
      date: "25 Sep 2026",
    },
    {
      name: "Olaya Street Development",
      type: "Road Development",
      location: "Olaya, Riyadh",
      status: "Completed",
      statusClass: "status-completed",
      progress: 100,
      date: "10 Sep 2026",
    },
  ];

  const activities = [
    {
      icon: "✓",
      className: "activity-icon-green",
      title: "Project status updated",
      description: "King Fahd Road – Water Line is now in progress.",
      time: "2 hours ago",
    },
    {
      icon: "▤",
      className: "activity-icon-yellow",
      title: "New quotation received",
      description: "A provider submitted a quotation for your project.",
      time: "Yesterday",
    },
    {
      icon: "＋",
      className: "activity-icon-blue",
      title: "Project created",
      description: "North Riyadh Road Maintenance was created.",
      time: "2 days ago",
    },
  ];

  return (
    <div className="contractor-dashboard">
      {/* Sidebar */}
      <aside className="contractor-sidebar">
        <div className="dashboard-logo">
          <Link to="/contractor-dashboard" aria-label="MAMAR Dashboard">
            <img src={logo} alt="MAMAR" />
          </Link>
        </div>

        <nav className="dashboard-navigation" aria-label="Main navigation">
          <Link to="/contractor-dashboard" className="dashboard-nav-active">
            <span className="dashboard-nav-icon">▦</span>
            <span>Dashboard</span>
          </Link>

          <Link to="/contractor-dashboard#projects">
            <span className="dashboard-nav-icon">▣</span>
            <span>My Projects</span>
          </Link>

          <Link to="/create-project">
            <span className="dashboard-nav-icon">＋</span>
            <span>Create Project</span>
          </Link>

          <Link to="/providers">
            <span className="dashboard-nav-icon">♧</span>
            <span>Providers</span>
          </Link>

          <Link to="/quotations">
            <span className="dashboard-nav-icon">▤</span>
            <span>Quotations</span>
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <Link to="/data-disclaimer">
            <span className="dashboard-nav-icon">ⓘ</span>
            <span>Data Disclaimer</span>
          </Link>

          <Link to="/support">
            <span className="dashboard-nav-icon">ⓘ</span>
            <span>Help &amp; Support</span>
          </Link>

          <Link to="/login">
            <span className="dashboard-nav-icon">↪</span>
            <span>Log out</span>
          </Link>
        </div>
      </aside>

      {/* Main dashboard */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="dashboard-header-logo">
            <img src={logo} alt="MAMAR" />
          </div>

          <div className="dashboard-header-right">
            <button
              type="button"
              className="dashboard-notification-button"
              aria-label="Notifications"
            >
              ♧
              <span className="notification-dot" />
            </button>

            <div className="dashboard-user">
              <div className="dashboard-avatar">K</div>
              <div className="dashboard-user-info">
                <strong>Kayan</strong>
                <span>Contractor</span>
              </div>
              <span className="dashboard-user-chevron">⌄</span>
            </div>
          </div>
        </header>

        {/* Dashboard content */}
        <div className="dashboard-content">
          {/* Welcome */}
          <section className="dashboard-welcome">
            <div>
              <h1>Welcome back, Kayan!</h1>
              <p>Here&apos;s an overview of your projects and activities.</p>
            </div>

            <button
              type="button"
              className="dashboard-create-button"
              onClick={() => navigate("/create-project")}
            >
              <span>＋</span>
              Create New Project
            </button>
          </section>

          {/* Statistics */}
          <section className="statistics-grid">
            {statistics.map((statistic) => (
              <article className="stat-card" key={statistic.title}>
                <div className="stat-card-top">
                  <div className={`stat-icon ${statistic.className}`}>
                    {statistic.icon}
                  </div>
                  <span className="stat-menu">•••</span>
                </div>

                <div className="stat-information">
                  <span>{statistic.title}</span>
                  <strong>{statistic.value}</strong>
                  <small>{statistic.change}</small>
                </div>
              </article>
            ))}
          </section>

          {/* Projects and map */}
          <div className="dashboard-main-grid">
            <section className="dashboard-panel projects-panel" id="projects">
              <div className="panel-heading">
                <div>
                  <h2>Recent Projects</h2>
                  <p>Track and manage your latest projects.</p>
                </div>

                <Link
                  to="/contractor-dashboard#projects"
                  className="panel-heading-link"
                >
                  View All →
                </Link>
              </div>

              <div className="projects-table-wrapper">
                <table className="projects-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.name}>
                        <td>
                          <div className="project-name-cell">
                            <strong>{project.name}</strong>
                            <span>
                              {project.type} · {project.location}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`project-status ${project.statusClass}`}
                          >
                            {project.status}
                          </span>
                        </td>
                        <td>
                          <div className="project-progress-cell">
                            <div className="project-progress-track">
                              <div
                                className="project-progress-fill"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                            <span>{project.progress}%</span>
                          </div>
                        </td>
                        <td className="project-date">{project.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Project locations map */}
            <section className="dashboard-panel locations-panel" id="locations">
              <div className="panel-heading">
                <div>
                  <h2>Project Locations</h2>
                  <p>Explore locations on the map.</p>
                </div>

                <button
                  type="button"
                  className="map-expand-button"
                  onClick={() => navigate("/project/location")}
                  aria-label="Open full map"
                >
                  ↗
                </button>
              </div>

              <div className="dashboard-map-frame">
                <MamarMap readOnly height="100%" />
              </div>

              <button
                type="button"
                className="map-full-button"
                onClick={() => navigate("/project/location")}
              >
                View Full Map →
              </button>
            </section>
          </div>

          {/* Quick actions and recent activity */}
          <div className="dashboard-bottom-grid">
            <section className="dashboard-panel quick-actions-panel">
              <div className="panel-heading">
                <div>
                  <h2>Quick Actions</h2>
                  <p>Shortcuts to common tasks.</p>
                </div>
              </div>

              <div className="quick-actions-list">
                <button
                  type="button"
                  className="quick-action"
                  onClick={() => navigate("/create-project")}
                >
                  <span className="action-icon">＋</span>
                  <span className="action-information">
                    <strong>Create Project</strong>
                    <small>Start a new project</small>
                  </span>
                  <span className="action-arrow">›</span>
                </button>

                <button
                  type="button"
                  className="quick-action"
                  onClick={() => navigate("/project/location")}
                >
                  <span className="action-icon">⌖</span>
                  <span className="action-information">
                    <strong>Open Map</strong>
                    <small>Explore project locations</small>
                  </span>
                  <span className="action-arrow">›</span>
                </button>

                <button
                  type="button"
                  className="quick-action"
                  onClick={() => navigate("/quotations")}
                >
                  <span className="action-icon">▤</span>
                  <span className="action-information">
                    <strong>View Quotations</strong>
                    <small>Review provider offers</small>
                  </span>
                  <span className="action-arrow">›</span>
                </button>

                <button
                  type="button"
                  className="quick-action"
                  onClick={() => navigate("/providers")}
                >
                  <span className="action-icon">♧</span>
                  <span className="action-information">
                    <strong>Find Providers</strong>
                    <small>Browse service providers</small>
                  </span>
                  <span className="action-arrow">›</span>
                </button>
              </div>
            </section>

            <section className="dashboard-panel activity-panel">
              <div className="panel-heading">
                <div>
                  <h2>Recent Activity</h2>
                  <p>Stay up to date with your projects.</p>
                </div>

                <button
                  type="button"
                  className="panel-heading-link"
                  onClick={() => navigate("/contractor-dashboard")}
                >
                  View All →
                </button>
              </div>

              <div className="activity-list">
                {activities.map((activity, index) => (
                  <article
                    className="activity-item"
                    key={`${activity.title}-${index}`}
                  >
                    <div className={`activity-icon ${activity.className}`}>
                      {activity.icon}
                    </div>
                    <div className="activity-information">
                      <strong>{activity.title}</strong>
                      <p>{activity.description}</p>
                      <span>{activity.time}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          {/* Footer */}
          <footer className="dashboard-footer">
            <span>© 2026 MAMAR. All rights reserved.</span>
            <div>
              <Link to="/data-disclaimer">Privacy &amp; Data</Link>
              <Link to="/support">Help &amp; Support</Link>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default ContractorDashboard;
