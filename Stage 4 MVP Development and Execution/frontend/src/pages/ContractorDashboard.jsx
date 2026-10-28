import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";
import MamarMap from "../components/MamarMap";
import { logout } from "../services/auth";
import { getSession } from "../services/auth";

/* Small inline icon set (outlined, 24x24) so no new dependency is needed. */
const ICON_PATHS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  projects: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
    </>
  ),
  create: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  providers: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M17 14c2.8 0 4.5 2 4.5 5" />
    </>
  ),
  quotations: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M9 8h3M9 12h7M9 16h7" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.5" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17v.5" />
    </>
  ),
  logout: <path d="M4 12h16M14 6l6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  list: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 9h16M4 14h16" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  dots: (
    <>
      <circle cx="9" cy="10" r="1" />
      <circle cx="15" cy="10" r="1" />
      <circle cx="12" cy="16" r="1" />
    </>
  ),
  triangle: <path d="M12 4l8 15H4z" />,
  target: (
    <>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    </>
  ),
  square: <rect x="6" y="6" width="12" height="12" rx="2" />,
  pin: (
    <>
      <path d="M12 21s-6-5.5-6-11a6 6 0 1 1 12 0c0 5.5-6 11-6 11z" />
      <circle cx="12" cy="10" r="2" />
    </>
  ),
  chevron: <path d="M9 6l6 6-6 6" />,
  more: (
    <>
      <circle cx="12" cy="5" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="12" cy="19" r="1.2" />
    </>
  ),
};

function Icon({ name, size = 20 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

function ContractorDashboard() {
  const navigate = useNavigate();

  /*
   * TODO(auth): replace `null` with the signed-in user from the app's
   * existing session/auth mechanism. Until it is wired, the UI falls back
   * to a neutral greeting instead of a hardcoded person's name.
   */
  const sessionUser = getSession()?.user;
  const rawName = sessionUser?.full_name || sessionUser?.name || "";
  const displayName =
     (typeof rawName === "string" ? rawName.trim() : "") || "there";
  const userInitial = displayName.charAt(0).toUpperCase();

  const statistics = [
    { title: "Total Projects", value: "5", icon: "list" },
    { title: "In Progress", value: "2", icon: "clock" },
    { title: "Completed", value: "2", icon: "check" },
    { title: "Pending Quotes", value: "1", icon: "dots" },
  ];

  const projects = [
    {
      name: "King Fahd Road – Water Line",
      location: "Riyadh",
      start: "10 Sep 2025",
      end: "20 Sep 2025",
      status: "In Progress",
      statusClass: "cd-status-in-progress",
      thumbClass: "cd-thumb-orange",
    },
    {
      name: "Olaya Street – Maintenance",
      location: "Riyadh",
      start: "01 Oct 2025",
      end: "15 Oct 2025",
      status: "Pending Quotes",
      statusClass: "cd-status-pending",
      thumbClass: "cd-thumb-orange",
    },
    {
      name: "Northern Ring Road",
      location: "Riyadh",
      start: "12 Oct 2025",
      end: "05 Nov 2025",
      status: "Completed",
      statusClass: "cd-status-completed",
      thumbClass: "cd-thumb-green",
    },
    {
      name: "Al Yarmouk Intersection",
      location: "Riyadh",
      start: "20 Nov 2025",
      end: "05 Dec 2025",
      status: "Planned",
      statusClass: "cd-status-planned",
      thumbClass: "cd-thumb-grey",
    },
  ];

  const quickActions = [
    {
      title: "Create New Project",
      description: "Add a new road project",
      icon: "plus",
      to: "/create-project",
    },
    {
      title: "Browse Providers",
      description: "Compare traffic control companies",
      icon: "triangle",
      to: "/providers",
    },
    {
      title: "Open Map",
      description: "Explore project locations",
      icon: "target",
      to: "/project/location",
    },
  ];

  const activities = [
    {
      icon: "list",
      className: "cd-activity-yellow",
      title: "New quote received",
      description: "King Fahd Road – Water Line",
      time: "2h ago",
    },
    {
      icon: "check",
      className: "cd-activity-green",
      title: "Project status updated",
      description: "Olaya Street – Maintenance",
      time: "5h ago",
    },
    {
      icon: "square",
      className: "cd-activity-grey",
      title: "Provider message",
      description: "Safety Arabia Co. LTD",
      time: "1d ago",
    },
    {
      icon: "plus",
      className: "cd-activity-yellow",
      title: "Project created",
      description: "Northern Ring Road",
      time: "2d ago",
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

            <Link to="/contractor-dashboard#projects">
              <Icon name="projects" />
              <span>My Projects</span>
            </Link>

            <Link to="/create-project">
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
              onClick={() => navigate("/create-project")}
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
                  <strong>{statistic.value}</strong>
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

                  <Link
                    to="/contractor-dashboard#projects"
                    className="cd-link"
                  >
                    View all →
                  </Link>
                </div>

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
                        <tr key={project.name}>
                          <td>
                            <div className="cd-project-name">
                              <span
                                className={`cd-thumb ${project.thumbClass}`}
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
                          <td>{project.start}</td>
                          <td>{project.end}</td>
                          <td>
                            <span className={`cd-status ${project.statusClass}`}>
                              {project.status}
                            </span>
                          </td>
                          <td className="cd-col-actions">
                            <button
                              type="button"
                              className="cd-row-menu"
                              aria-label={`Actions for ${project.name}`}
                            >
                              <Icon name="more" size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                      onClick={() => navigate(action.to)}
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

                  <button
                    type="button"
                    className="cd-link"
                    onClick={() => navigate("/contractor-dashboard")}
                  >
                    View all →
                  </button>
                </div>

                <div className="cd-activity-list">
                  {activities.map((activity, index) => (
                    <article
                      className="cd-activity-item"
                      key={`${activity.title}-${index}`}
                    >
                      <div className={`cd-activity-icon ${activity.className}`}>
                        <Icon name={activity.icon} size={16} />
                      </div>
                      <div className="cd-activity-info">
                        <strong>{activity.title}</strong>
                        <p>{activity.description}</p>
                      </div>
                      <span className="cd-activity-time">{activity.time}</span>
                    </article>
                  ))}
                </div>
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
