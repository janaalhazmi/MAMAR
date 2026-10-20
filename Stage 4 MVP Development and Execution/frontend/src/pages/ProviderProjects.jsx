import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Check,
  Clock3,
  Search,
} from "lucide-react";
import ProviderSidebar from "../components/ProviderSidebar";
import { useNavigate } from "react-router-dom";

const projects = [
  {
    id: "PRJ-001",
    name: "Northern Ring Road",
    city: "Riyadh",
    dates: "01–15 Oct 2026",
    duration: "15 days",
    progress: 68,
    status: "Active",
  },
  {
    id: "PRJ-002",
    name: "Olaya Road Works",
    city: "Riyadh",
    dates: "05–20 Oct 2026",
    duration: "16 days",
    progress: 35,
    status: "Active",
  },
  {
    id: "PRJ-003",
    name: "Al Mursalat – Road Maintenance",
    city: "Riyadh",
    dates: "25–30 Oct 2026",
    duration: "6 days",
    progress: 0,
    status: "Upcoming",
  },
  {
    id: "PRJ-004",
    name: "Qurtuba – Water Line",
    city: "Riyadh",
    dates: "15–25 Sep 2026",
    duration: "11 days",
    progress: 100,
    status: "Completed",
  },
];

const tabs = ["All Projects", "Active", "Upcoming", "Completed"];

function ProviderProjects() {
  const [activeTab, setActiveTab] = useState("All Projects");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesTab =
        activeTab === "All Projects" || project.status === activeTab;

      const term = search.trim().toLowerCase();

      const matchesSearch =
        !term ||
        project.name.toLowerCase().includes(term) ||
        project.id.toLowerCase().includes(term) ||
        project.city.toLowerCase().includes(term);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, search]);

  const activeCount = projects.filter(
    (project) => project.status === "Active"
  ).length;

  const upcomingCount = projects.filter(
    (project) => project.status === "Upcoming"
  ).length;

  const completedCount = projects.filter(
    (project) => project.status === "Completed"
  ).length;

  const handleProjectAction = (project) => {
  navigate(`/provider/projects/${project.id}`);
};

  return (
    <div className="provider-projects-page">
      <ProviderSidebar />

      <main className="provider-projects-main">
        <section className="provider-projects-heading">
          <h1>My Projects</h1>
          <p>View assigned projects and follow their execution progress.</p>
        </section>

        <section className="provider-project-stats">
          <article className="provider-stat-card">
            <div className="provider-stat-icon provider-stat-icon-yellow">
              <BriefcaseBusiness size={20} />
            </div>
            <div>
              <span>Total Assigned</span>
              <strong>{String(projects.length).padStart(2)}</strong>
            </div>
          </article>

          <article className="provider-stat-card">
            <div className="provider-stat-icon provider-stat-icon-green">
              <Check size={20} />
            </div>
            <div>
              <span>Active Projects</span>
              <strong>{String(activeCount).padStart(2)}</strong>
            </div>
          </article>

          <article className="provider-stat-card">
            <div className="provider-stat-icon provider-stat-icon-yellow">
              <Clock3 size={20} />
            </div>
            <div>
              <span>Upcoming</span>
              <strong>{String(upcomingCount).padStart(2)}</strong>
            </div>
          </article>

          <article className="provider-stat-card">
            <div className="provider-stat-icon provider-stat-icon-muted">
              <Check size={20} />
            </div>
            <div>
              <span>Completed</span>
              <strong>{String(completedCount).padStart(2)}</strong>
            </div>
          </article>
        </section>

        <section className="provider-projects-card">
          <div className="provider-projects-toolbar">
            <div className="provider-project-tabs">
              {tabs.map((tab) => {
                const count =
                  tab === "All Projects"
                    ? projects.length
                    : projects.filter((project) => project.status === tab)
                        .length;

                return (
                  <button
                    key={tab}
                    type="button"
                    className={activeTab === tab ? "active" : ""}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab} ({count})
                  </button>
                );
              })}
            </div>

            <label className="provider-project-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <div className="provider-projects-table-wrap">
            <table className="provider-projects-table">
              <thead>
                <tr>
                  <th>PROJECT</th>
                  <th>DATES</th>
                  <th>PROGRESS</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {filteredProjects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <div className="provider-project-name">
                        {project.name}
                      </div>
                      <div className="provider-project-meta">
                        {project.id} · {project.city}
                      </div>
                    </td>

                    <td>
                      <div className="provider-project-date">
                        {project.dates}
                      </div>
                      <div className="provider-project-meta">
                        {project.duration}
                      </div>
                    </td>

                    <td>
                      <div className="provider-progress-track">
                        <div
                          className={`provider-progress-fill ${
                            project.status === "Completed"
                              ? "completed"
                              : project.status === "Upcoming"
                                ? "upcoming"
                                : ""
                          }`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>

                      <div className="provider-project-meta">
                        {project.progress === 0
                          ? "Not started"
                          : `${project.progress}% complete`}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`provider-project-status ${project.status.toLowerCase()}`}
                      >
                        {project.status}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className={`provider-project-action ${
                          project.status === "Completed"
                            ? "summary"
                            : ""
                        }`}
                        onClick={() => handleProjectAction(project)}
                      >
                        {project.status === "Completed"
                          ? "View Summary →"
                          : "View Details →"}
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan="5" className="provider-projects-empty">
                      No projects found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="provider-projects-footer">
            <span>Showing {filteredProjects.length} assigned projects</span>
            <button type="button">1</button>
          </div>
        </section>

        <div className="provider-projects-breadcrumb">
          Provider / Projects
        </div>
      </main>
    </div>
  );
}

export default ProviderProjects;
