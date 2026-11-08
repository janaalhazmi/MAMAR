import ProviderSidebar from "../../components/ProviderSidebar";
import { useEffect, useState } from "react";
import { getProviderProjects } from "../../services/providerFlow";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, Check, Clock3, Search } from "lucide-react";

const statuses = {
  active: "Active",
  upcoming: "Upcoming",
  completed: "Completed",
};

// GET /provider/projects returns Active / Upcoming / Completed; the page uses
// lowercase keys for its filters and badge colours.
function toRow(project) {
  return { ...project, status: String(project.status || "").toLowerCase() };
}

export default function ProviderProjects({ projects: given }) {
  const [loaded, setLoaded] = useState(null);
  const [loading, setLoading] = useState(!given);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (given) return undefined;
    let active = true;
    getProviderProjects()
      .then((rows) => {
        if (active) setLoaded(rows.map(toRow));
      })
      .catch((error) => {
        if (active) setLoadError(error.message || "Could not load your projects.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [given]);

  const projects = given || loaded || [];
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const counts = { all: projects.length, active: 0, upcoming: 0, completed: 0 };

  for (const project of projects) {
    if (Object.hasOwn(statuses, project.status)) {
      counts[project.status] += 1;
    }
  }

  const cards = [
    { key: "all", label: "Total Assigned", Icon: BriefcaseBusiness },
    { key: "active", label: "Active Projects", Icon: Check },
    { key: "upcoming", label: "Upcoming", Icon: Clock3 },
    { key: "completed", label: "Completed", Icon: Check },
  ];

  const query = search.trim().toLowerCase();
  const visibleProjects = projects.filter((project) => {
    const matchesStatus = filter === "all" || project.status === filter;
    const matchesSearch = [project.name, project.reference, project.location]
      .some((value) => String(value ?? "").toLowerCase().includes(query));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="provider-dashboard-page">
      <ProviderSidebar />
      <div className="provider-main-area">
        <main className="provider-dashboard-content">
        <section aria-labelledby="pp-title">
      <h1 id="pp-title">My Projects</h1>
      <p className="pp-description">
        View assigned projects and follow their execution progress.
      </p>

      <div className="pp-stats">
        {cards.map(({ key, label, Icon }) => (
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
        <div className="pp-toolbar">
          <div className="pp-filters" role="group" aria-label="Project status">
            {cards.map(({ key }) => (
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
              {loading && (
                <tr>
                  <td className="pp-empty" colSpan={5}>
                    <strong>Loading your projects…</strong>
                  </td>
                </tr>
              )}

              {!loading && loadError && (
                <tr>
                  <td className="pp-empty" colSpan={5} role="alert">
                    <strong>{loadError}</strong>
                    <span>Please refresh the page to try again.</span>
                  </td>
                </tr>
              )}

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

              {visibleProjects.map((project) => {
                const progress = Number.isFinite(project.progress)
                  ? Math.max(0, Math.min(100, project.progress))
                  : null;
                const completed = project.status === "completed";

                return (
                  <tr key={project.id}>
                    <td>
                      <strong>{project.name}</strong>
                      <small>
                        {[project.reference, project.location]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    </td>
                    <td>{project.dateLabel || "—"}</td>
                    <td>
                      {progress === null ? (
                        <span className="pp-muted">—</span>
                      ) : (
                        <>
                          <progress
                            className={completed ? "pp-progress-complete" : ""}
                            value={progress}
                            max={100}
                            aria-label={`${project.name} progress`}
                          />
                          <small>
                            {progress === 0 ? "Not started" : `${progress}% complete`}
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
                        className={`pp-link${completed ? " pp-summary" : ""}`}
                        to={`/provider/projects/${encodeURIComponent(project.id)}`}
                      >
                        {completed ? "View Summary" : "View Details"} →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

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