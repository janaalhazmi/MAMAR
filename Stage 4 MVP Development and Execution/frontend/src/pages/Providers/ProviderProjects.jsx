// Shared interface components.
import ProviderSidebar from "../../components/ProviderSidebar";

// Navigation, icons and project page logic.
import { Link } from "react-router-dom";
import { BriefcaseBusiness, Check, Clock3, Search } from "lucide-react";
import { useProviderProjectsPage } from "../../services/providers/api";

// Summary card presentation.
const PROJECT_CARDS = [
  { key: "all", label: "Total Assigned", Icon: BriefcaseBusiness },
  { key: "active", label: "Active Projects", Icon: Check },
  { key: "upcoming", label: "Upcoming", Icon: Clock3 },
  { key: "completed", label: "Completed", Icon: Check },
];

// Provider project directory view.
export default function ProviderProjects({ projects: given }) {
  const {
    projects,
    loading,
    loadError,
    filter,
    setFilter,
    search,
    setSearch,
    counts,
    statuses,
    visibleProjects,
  } = useProviderProjectsPage(given);

  return (
    <div className="provider-dashboard-page">
      {/* Provider navigation */}
      <ProviderSidebar />

      <div className="provider-main-area">
        <main className="provider-dashboard-content">
          <section aria-labelledby="pp-title">
            {/* Page heading */}
            <h1 id="pp-title">My Projects</h1>
            <p className="pp-description">
              View assigned projects and follow their execution progress.
            </p>

            {/* Project statistics */}
            <div className="pp-stats">
              {PROJECT_CARDS.map(({ key, label, Icon }) => (
                <div className="pp-card" key={key}>
                  <span className={`pp-icon pp-${key}`}>
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <div>
                    <span className="pp-muted">{label}</span>
                    <strong>{counts[key]}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="pp-panel">
              {/* Status filters and project search */}
              <div className="pp-toolbar">
                <div
                  className="pp-filters"
                  role="group"
                  aria-label="Project status"
                >
                  {PROJECT_CARDS.map(({ key }) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={filter === key}
                      onClick={() => setFilter(key)}
                    >
                      {key === "all" ? "All Projects" : statuses[key]} ({counts[key]})
                    </button>
                  ))}
                </div>

                <label className="pp-search">
                  <Search size={17} aria-hidden="true" />
                  <input
                    type="search"
                    aria-label="Search projects"
                    placeholder="Search projects..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
              </div>

              {/* Assigned projects table */}
              <div className="pp-table-wrap">
                <table className="pp-table" aria-label="Assigned projects">
                  <thead>
                    <tr>
                      <th scope="col">Project</th>
                      <th scope="col">Dates</th>
                      <th scope="col">Progress</th>
                      <th scope="col">Status</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Loading state */}
                    {loading && (
                      <tr>
                        <td className="pp-empty" colSpan={5}>
                          <strong>Loading your projects…</strong>
                        </td>
                      </tr>
                    )}

                    {/* Loading error */}
                    {!loading && loadError && (
                      <tr>
                        <td className="pp-empty" colSpan={5} role="alert">
                          <strong>{loadError}</strong>
                          <span>Please refresh the page to try again.</span>
                        </td>
                      </tr>
                    )}

                    {/* Empty directory or filtered results */}
                    {!loading && !loadError && visibleProjects.length === 0 && (
                      <tr>
                        <td className="pp-empty" colSpan={5}>
                          {projects.length === 0 ? (
                            <>
                              <strong>No assigned projects yet</strong>
                              <span>
                                Projects appear here when a contractor accepts your
                                quotation.
                              </span>
                            </>
                          ) : (
                            <strong>No projects match your search or filter.</strong>
                          )}
                        </td>
                      </tr>
                    )}

                    {/* Project rows and details navigation */}
                    {visibleProjects.map((project) => (
                      <tr key={project.id}>
                        <td>
                          <strong>{project.name}</strong>
                          <small>{project.referenceLabel}</small>
                        </td>
                        <td>{project.dateLabel || "—"}</td>
                        <td>
                          {project.progress === null ? (
                            <span className="pp-muted">—</span>
                          ) : (
                            <>
                              <progress
                                className={
                                  project.completed ? "pp-progress-complete" : ""
                                }
                                value={project.progress}
                                max={100}
                                aria-label={`${project.name} progress`}
                              />
                              <small>
                                {project.progress === 0
                                  ? "Not started"
                                  : `${project.progress}% complete`}
                              </small>
                            </>
                          )}
                        </td>
                        <td>
                          <span className={`pp-badge pp-${project.status}`}>
                            {statuses[project.status] ?? "Status unavailable"}
                          </span>
                        </td>
                        <td>
                          <Link
                            className={`pp-link${project.completed ? " pp-summary" : ""}`}
                            to={`/provider/projects/${encodeURIComponent(project.id)}`}
                          >
                            {project.completed ? "View Summary" : "View Details"} →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Visible result count */}
              <p className="pp-footer">
                Showing {visibleProjects.length} of {projects.length} assigned projects
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
