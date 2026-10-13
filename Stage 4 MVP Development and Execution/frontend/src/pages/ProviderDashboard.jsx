import { Link } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";

function ProviderDashboard() {
  const statistics = [
    { icon: "▤", value: 4, label: "New Requests" },
    { icon: "◷", value: 2, label: "Pending Quotations" },
    { icon: "✓", value: 3, label: "Active Projects" },
    { icon: "•••", value: 8, label: "Field Workers" },
  ];

  const projects = [
    {
      name: "King Fahd Road – Water Line",
      location: "Riyadh",
      startDate: "10 Sep 2026",
      endDate: "20 Sep 2026",
      status: "Active",
      statusClass: "in-progress",
    },
    {
      name: "Olaya Street – Maintenance",
      location: "Riyadh",
      startDate: "01 Oct 2026",
      endDate: "15 Oct 2026",
      status: "Quotation Pending",
      statusClass: "pending-quotes",
    },
    {
      name: "Northern Ring Road",
      location: "Riyadh",
      startDate: "12 Oct 2026",
      endDate: "05 Nov 2026",
      status: "Assigned",
      statusClass: "completed",
    },
    {
      name: "Al Yarmouk Intersection",
      location: "Riyadh",
      startDate: "20 Nov 2026",
      endDate: "05 Dec 2026",
      status: "New Request",
      statusClass: "planned",
    },
  ];

  const activities = [
    {
      icon: "▤",
      title: "New service request received",
      description: "King Fahd Road – Water Line",
      time: "2h ago",
      type: "quote",
    },
    {
      icon: "✓",
      title: "Quotation submitted",
      description: "Olaya Street – Maintenance",
      time: "5h ago",
      type: "success",
    },
    {
      icon: "□",
      title: "Field worker assigned",
      description: "Northern Ring Road",
      time: "1d ago",
      type: "message",
    },
    {
      icon: "+",
      title: "Project execution started",
      description: "King Fahd Road – Water Line",
      time: "2d ago",
      type: "created",
    },
  ];

  return (
    <div className="contractor-dashboard">
      <aside className="contractor-sidebar">
        <Link to="/" className="dashboard-brand">
          <img src={logo} alt="MAMAR Logo" />
        </Link>

        <nav className="dashboard-navigation">
          <Link to="/provider-dashboard" className="active">
            <span className="navigation-icon">▦</span>
            Dashboard
          </Link>

          <a href="#projects">
            <span className="navigation-icon">▣</span>
            Projects
          </a>

          <a href="#requests">
            <span className="navigation-icon">⊕</span>
            Service Requests
          </a>

          <a href="#quotations">
            <span className="navigation-icon">▤</span>
            Quotations
          </a>

          <a href="#execution">
            <span className="navigation-icon">⌖</span>
            Field Execution
          </a>

          <a href="#workers">
            <span className="navigation-icon">♧</span>
            Field Workers
          </a>
        </nav>

        <div className="sidebar-bottom">
          <a href="#disclaimer">
            <span>ⓘ</span>
            Data Disclaimer
          </a>

          <Link to="/support">
            <span>ⓘ</span>
            Help &amp; Support
          </Link>

          <Link to="/login">
            <span>→</span>
            Log out
          </Link>
        </div>
      </aside>

      <main className="contractor-main">
        <header className="dashboard-header">
          <Link to="/" className="dashboard-header-logo">
            <img src={logo} alt="MAMAR" />
          </Link>

          <div className="dashboard-user">
            <div className="user-avatar">S</div>

            <div className="user-information">
              <strong>Safety Arabia</strong>
              <span>Service Provider</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content" id="dashboard">
          <section className="dashboard-welcome">
            <div>
              <h1>
                Welcome Back, Safety Arabia <span>👋</span>
              </h1>

              <p>
                Here's an overview of your requests, quotations, and active projects.
              </p>
            </div>

            <a href="#requests" className="create-project-button">
              <span>+</span>
              View New Requests
            </a>
          </section>

          <section className="statistics-grid">
            {statistics.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <div className="stat-icon">{stat.icon}</div>

                <div className="stat-information">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              </article>
            ))}
          </section>

          <div className="dashboard-grid">
            <div className="dashboard-left-column">
              <section className="dashboard-panel locations-panel">
                <div className="panel-heading">
                  <h2>Active Project Locations</h2>
                </div>

                <div className="map-placeholder">
                  <div className="map-road map-road-one" />
                  <div className="map-road map-road-two" />
                  <div className="map-road map-road-three" />

                  <span className="map-marker marker-one">1</span>
                  <span className="map-marker marker-two">2</span>
                  <span className="map-marker marker-three">3</span>

                  <span className="map-label">
                    Active project locations
                  </span>
                </div>

                <Link
                  to="/project/location"
                  className="map-full-button"
                >
                  View Full Map →
                </Link>
              </section>

              <section className="dashboard-panel projects-panel" id="projects">
                <div className="panel-heading">
                  <h2>Assigned Projects</h2>

                  <a href="#projects">View all →</a>
                </div>

                <div className="projects-table-wrapper">
                  <table className="projects-table">
                    <thead>
                      <tr>
                        <th>Project Name</th>
                        <th>Location</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {projects.map((project) => (
                        <tr key={project.name}>
                          <td>
                            <div className="project-name-cell">
                              <span className="project-thumbnail" />
                              <strong>{project.name}</strong>
                            </div>
                          </td>

                          <td>{project.location}</td>
                          <td>{project.startDate}</td>
                          <td>{project.endDate}</td>

                          <td>
                            <span
                              className={`project-status ${project.statusClass}`}
                            >
                              {project.status}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="project-actions-button"
                              aria-label={`Actions for ${project.name}`}
                            >
                              ⋮
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div className="dashboard-right-column">
              <section className="dashboard-panel quick-actions-panel">
                <h2>Quick Actions</h2>

                <a href="#requests" className="quick-action">
                  <span className="action-icon">+</span>

                  <span className="action-information">
                    <strong>Review Service Requests</strong>
                    <small>View new contractor requests</small>
                  </span>

                  <span className="action-arrow">›</span>
                </a>

                <a href="#quotations" className="quick-action">
                  <span className="action-icon">▤</span>

                  <span className="action-information">
                    <strong>Manage Quotations</strong>
                    <small>Submit and review quotations</small>
                  </span>

                  <span className="action-arrow">›</span>
                </a>

                <a href="#workers" className="quick-action">
                  <span className="action-icon">♧</span>

                  <span className="action-information">
                    <strong>Assign Field Worker</strong>
                    <small>Manage project assignments</small>
                  </span>

                  <span className="action-arrow">›</span>
                </a>
              </section>

              <section className="dashboard-panel activity-panel">
                <div className="panel-heading">
                  <h2>Recent Activity</h2>

                  <a href="#activity">View all →</a>
                </div>

                <div className="activity-list" id="activity">
                  {activities.map((activity) => (
                    <article
                      className="activity-item"
                      key={activity.title}
                    >
                      <span
                        className={`activity-icon ${activity.type}`}
                      >
                        {activity.icon}
                      </span>

                      <div className="activity-information">
                        <strong>{activity.title}</strong>
                        <p>{activity.description}</p>
                        <small>{activity.time}</small>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProviderDashboard;
