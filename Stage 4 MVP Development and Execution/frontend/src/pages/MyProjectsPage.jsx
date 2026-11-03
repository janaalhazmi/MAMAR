
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContractorShell from "../components/ContractorShell";
import Icon from "../components/Icons";
import { formatDate } from "../services/projectFlow";
import {
  STATUS_FILTERS,
  fetchProjects,
  nextStepFor,
  openProjectInFlow,
  startNewProject,
  thumbTone,
} from "../services/projects";

function MyProjectsPage() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  useEffect(() => {
    let active = true;

    fetchProjects()
      .then((list) => active && setProjects(list))
      .catch((err) => active && setError(err.message || "Could not load your projects."))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !term ||
        project.name.toLowerCase().includes(term) ||
        project.location.toLowerCase().includes(term);
      const matchesStatus = status === "All" || project.statusLabel === status;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, status]);

  function handleCreate() {
    startNewProject();
    navigate("/create-project");
  }

  function handleOpen(project) {
    const step = nextStepFor(project);
    if (!step) return;
    openProjectInFlow(project);
    navigate(step.to);
  }

  return (
    <ContractorShell activeKey="projects">
      <div className="pf-title-row">
        <section className="pf-heading">
          <h1>My Projects</h1>
          <p>All your road projects in one place.</p>
        </section>

        <button type="button" className="pf-btn pf-btn-primary" onClick={handleCreate}>
          <Icon name="plus" size={16} /> Create Project
        </button>
      </div>

      <section className="cd-panel">
        <div className="mp-toolbar">
          <label className="mp-search">
            <Icon name="target" size={16} />
            <input
              type="text"
              placeholder="Search by project or location"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <select
            className="mp-select"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter by status"
          >
            {STATUS_FILTERS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="pf-alert" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="pf-empty">
            Loading your projects… the server can take a few seconds to wake up.
          </p>
        ) : projects.length === 0 && !error ? (
          <div className="pf-empty">
            <p>You have no projects yet.</p>
            <button
              type="button"
              className="pf-btn pf-btn-primary mp-empty-button"
              onClick={handleCreate}
            >
              Create your first project
            </button>
          </div>
        ) : visible.length === 0 ? (
          <p className="pf-empty">No projects match your search.</p>
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
                {visible.map((project) => {
                  const step = nextStepFor(project);

                  return (
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
                          <Icon name="pin" size={13} />
                          {project.location}
                        </span>
                      </td>
                      <td>{formatDate(project.startDate)}</td>
                      <td>{formatDate(project.endDate)}</td>
                      <td>
                        <span className={`cd-status cd-status-${project.statusTone}`}>
                          {project.statusLabel}
                        </span>
                      </td>
                      <td className="cd-col-actions">
                        {step && (
                          <button
                            type="button"
                            className="mp-row-action"
                            onClick={() => handleOpen(project)}
                          >
                            {step.label}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </ContractorShell>
  );
}

export default MyProjectsPage;
