// Navigation.
import { Link } from "react-router-dom";
import NotificationBell from "../../components/NotificationBell";
import ProviderSidebar from "../../components/ProviderSidebar";
import MamarMap from "../../components/MamarMap";
import DeviceStatusList from "../../components/DeviceStatusList";
// Device verification page logic.
import { useProviderDeviceVerificationPage } from "../../services/providers/api";

// Provider device verification directory and project view.
export default function ProviderDeviceVerification() {
  const {
    projectId,
    projects,
    loadError,
    name,
    initials,
    selected,
  } = useProviderDeviceVerificationPage();

  return (
    <div className="provider-dashboard-page">
      {/* Provider navigation */}
      <ProviderSidebar />

      <div className="provider-main-area">
        {/* Provider account and notifications */}
        <header className="provider-topbar">
          <div />

          <div className="provider-account">
            <div className="provider-avatar">{initials}</div>
            <div>
              <strong>{name}</strong>
              <span>Service Provider</span>
            </div>
          </div>

          <div style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center"
          }}>
            <NotificationBell />
          </div>
        </header>

        <main className="provider-dashboard-content">
          <div className="pex-page pex-organized">
            {/* Return to the device verification directory */}
            {projectId && (
              <Link to="/provider/device-verification">
                ← Back to Device Verification Status
              </Link>
            )}

            {/* Page heading and selected project status */}
            <div className="pex-heading">
              <div>
                <h1>
                  {selected?.name || "Device Verification Status"}
                </h1>
                <p>Monitor device verification for your projects.</p>
              </div>

              {selected?.status && (
                <span className="pex-status">
                  {selected.status}
                </span>
              )}
            </div>

            {/* Loading, errors, project directory and selected details */}
            {loadError ? (
              <p role="alert">{loadError}</p>
            ) : projects === null ? (
              <p role="status">Loading projects...</p>
            ) : !projectId ? (
              <section aria-label="Projects for device verification">
                {/* Assigned project count */}
                <div className="pdvs-list-heading">
                  <h2>Your Projects</h2>
                  <span>
                    {projects.length} {projects.length === 1 ? "project" : "projects"}
                  </span>
                </div>

                {/* Empty directory or project selection cards */}
                {projects.length === 0 ? (
                  <div className="pdvs-empty">
                    <h3>No assigned projects yet</h3>
                    <p>Your assigned projects will appear here.</p>
                  </div>
                ) : (
                  <div className="pdvs-project-grid">
                    {projects.map((project) => (
                      <article className="pdvs-project-card" key={project.id}>
                        <div className="pdvs-card-top">
                          <span className="pdvs-project-icon" aria-hidden="true">
                            <svg
                              width="22"
                              height="22"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.7"
                            >
                              <rect x="4" y="7" width="16" height="14" rx="2" />
                              <path d="M9 7V4h6v3M8 12h8M8 16h5" />
                            </svg>
                          </span>

                          <span className="pdvs-project-status">
                            {project.status || "Status unavailable"}
                          </span>
                        </div>

                        <h2>{project.name}</h2>
                        <p className="pdvs-project-reference">
                          Project ID · {project.code || project.id}
                        </p>

                        <div className="pdvs-card-footer">
                          <Link
                            className="pdvs-details-link"
                            to={
                              "/provider/device-verification/" +
                              encodeURIComponent(project.id)
                            }
                            aria-label={`View device verification details for ${project.name}`}
                          >
                            View Details →
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ) : selected ? (
              <ProjectDeviceStatus project={selected} />
            ) : (
              <p role="alert">
                This project is not in your assigned projects.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Selected project summary, location and verification records.
function ProjectDeviceStatus({ project }) {
  return (
    <>
      {/* Project Summary */}
      <dl className="pex-card pex-summary">
        <div>
          <dt>Project ID</dt>
          <dd>{project.code || project.id}</dd>
        </div>
        <div>
          <dt>Project Dates</dt>
          <dd>
            {project.startDate || "—"} – {project.endDate || "—"}
          </dd>
        </div>
        <div>
          <dt>Project Status</dt>
          <dd>{project.status || "—"}</dd>
        </div>
        <div>
          <dt>Overall Progress</dt>
          <dd className="pex-progress">
            <progress
              value={project.displayProgress}
              max={100}
            />
            <span>
              {project.displayProgress}%
            </span>
          </dd>
        </div>
      </dl>

      {/* Work zone map and site status */}
      <div className="pex-grid pex-grid-wide">
        <section className="pex-card">
          <h2>Work Zone</h2>

          {(project.workZone ||
              (project.latitude != null && project.longitude != null)) ? (
            <div style={{
              height: 380,
              width: "100%",
              minWidth: 0,
              overflow: "hidden",
              borderRadius: 12
            }}>
              <MamarMap
                workZone={project.workZone}
                latitude={project.latitude}
                longitude={project.longitude}
                readOnly
                fitPolygon
              />
            </div>
          ) : (
            <div className="pex-map-empty">
              Work zone location is unavailable.
            </div>
          )}
        </section>

        <section className="pex-card">
          <h2>Site Status</h2>
          <p className="pex-status">
            {project.siteStatus || "Not available"}
          </p>
          <p>
            {project.teamCount ?? 0} team members assigned
          </p>
          <p>
            Project location: {project.location || "Not available"}
          </p>
        </section>
      </div>

      {/* Verification records saved by assigned field workers */}
      <section className="pex-card">
        <h2>Device Verification Status</h2>
        <DeviceStatusList projectId={project.id} />
      </section>
    </>
  );
}