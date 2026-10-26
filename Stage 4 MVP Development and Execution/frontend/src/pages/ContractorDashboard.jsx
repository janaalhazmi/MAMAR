
import { Link } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";



function ContractorDashboard() {
  const statistics = [
    { icon: "▤", value: 5, label: "Total Projects" },
    { icon: "◷", value: 2, label: "In Progress" },
    { icon: "✓", value: 2, label: "Completed" },
    { icon: "•••", value: 1, label: "Pending Quotes" },
  ];

  const projects = [
    {
      name: "King Fahd Road – Water Line",
      location: "Riyadh",
      startDate: "10 Sep 2025",
      endDate: "20 Sep 2025",
      status: "In Progress",
      statusClass: "in-progress",
    },
    {
      name: "Olaya Street – Maintenance",
      location: "Riyadh",
      startDate: "01 Oct 2025",
      endDate: "15 Oct 2025",
      status: "Pending Quotes",
      statusClass: "pending-quotes",
    },
    {
      name: "Northern Ring Road",
      location: "Riyadh",
      startDate: "12 Oct 2025",
      endDate: "05 Nov 2025",
      status: "Completed",
      statusClass: "completed",
    },
    {
      name: "Al Yarmouk Intersection",
      location: "Riyadh",
      startDate: "20 Nov 2025",
      endDate: "05 Dec 2025",
      status: "Planned",
      statusClass: "planned",
    },
  ];

  const activities = [
    {
      icon: "▤",
      title: "New quote received",
      description: "King Fahd Road – Water Line",
      time: "2h ago",
      type: "quote",
    },
    {
      icon: "✓",
      title: "Project status updated",
      description: "Olaya Street – Maintenance",
      time: "5h ago",
      type: "success",
    },
    {
      icon: "□",
      title: "Provider message",
      description: "Safety Arabia Co. LTD",
      time: "1d ago",
      type: "message",
    },
    {
      icon: "+",
      title: "Project created",
      description: "Northern Ring Road",
      time: "2d ago",
      type: "created",
    },
  ];

  return (
    <div className="contractor-dashboard">
      {/* Sidebar */}
      <aside className="contractor-sidebar">
        <Link to="/" className="dashboard-brand">
          <img src={logo} alt="MAMAR Logo" />
        </Link>

        <nav className="dashboard-navigation">
          <a href="#dashboard" className="active">
            <span className="navigation-icon">▦</span>
            Dashboard
          </a>

          <a href="#projects">
            <span className="navigation-icon">▣</span>
            My Projects
          </a>

          <Link to="/create-project">
            <span className="navigation-icon">⊕</span>
            Create Project
          </Link>

          <Link to="/providers">
            <span className="navigation-icon">♧</span>
            Providers
          </Link>

          <a href="#quotations">
            <span className="navigation-icon">▤</span>
            Quotations
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

      {/* Main Content */}
      <main className="contractor-main">
        <header className="dashboard-header">
          <Link to="/" className="dashboard-header-logo">
            <img src={logo} alt="MAMAR" />
          </Link>

          <div className="dashboard-user">
            <div className="user-avatar">K</div>

            <div className="user-information">
              <strong>Kayan</strong>
              <span>Contractor</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content" id="dashboard">
          {/* Welcome */}
          <section className="dashboard-welcome">
            <div>
              <h1>
                Welcome Back, Kayan <span>👋</span>
              </h1>

              <p>
                Here's an overview of your projects and activity.
              </p>
            </div>

            <Link
              to="/create-project"
              className="create-project-button"
            >
              <span>+</span>
              Create New Project
            </Link>
          </section>

          {/* Statistics */}
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

          {/* Dashboard Grid */}
          <div className="dashboard-grid">
            <div className="dashboard-left-column">
              {/* Project Locations */}
              <section className="dashboard-panel locations-panel">
                <div className="panel-heading">
                  <h2>Project Locations</h2>
                </div>

                <div className="map-placeholder">
                  <div className="map-road map-road-one" />
                  <div className="map-road map-road-two" />
                  <div className="map-road map-road-three" />

                  <span className="map-marker marker-one">1</span>
                  <span className="map-marker marker-two">2</span>
                  <span className="map-marker marker-three">3</span>

                  <span className="map-label">
                    Project locations
                  </span>
                </div>

                <button
                  type="button"
                  className="map-full-button"
                  onClick={() => {
                    alert("Map integration will be added later.");
                  }}
                >
                  View Full Map →
                </button>
              </section>

              {/* Projects Table */}
              <section className="dashboard-panel projects-panel" id="projects">
                <div className="panel-heading">
                  <h2>My Projects</h2>

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

            {/* Right Column */}
            <div className="dashboard-right-column">
              {/* Quick Actions */}
              <section className="dashboard-panel quick-actions-panel">
                <h2>Quick Actions</h2>

                <Link to="/create-project" className="quick-action">
                  <span className="action-icon">+</span>

                  <span className="action-information">
                    <strong>Create New Project</strong>
                    <small>Add a new road project</small>
                  </span>

                  <span className="action-arrow">›</span>
                </Link>

                <Link to="/providers" className="quick-action">
                  <span className="action-icon">♧</span>

                  <span className="action-information">
                    <strong>Browse Providers</strong>
                    <small>Compare traffic control companies</small>
                  </span>

                  <span className="action-arrow">›</span>
                </Link>

                <a href="#locations" className="quick-action">
                  <span className="action-icon">⌖</span>

                  <span className="action-information">
                    <strong>Open Map</strong>
                    <small>Explore project locations</small>
                  </span>

                  <span className="action-arrow">›</span>
                </a>
              </section>

              {/* Recent Activity */}
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

export default ContractorDashboard;