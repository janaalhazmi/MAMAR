import { Link, useParams } from "react-router-dom";
import NotificationBell from "../../components/NotificationBell";
import ProviderSidebar from "../../components/ProviderSidebar";
import MamarMap from "../../components/MamarMap";
import { getSession } from "../../services/auth";
import { useDeviceVerificationProjects } from "../../services/providers/api";

export default function ProviderDeviceVerification() {
  const { projectId } = useParams();
  const { projects, loadError } = useDeviceVerificationProjects();

  const name = getSession()?.user?.full_name || "Provider";
  const initials = name.trim().split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("") || "P";

  const selected = projects?.find(
    (project) => String(project.id) === projectId
  );

  return (
    <div className="provider-dashboard-page">
      <ProviderSidebar />

      <div className="provider-main-area">
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
            <Link to="/provider/projects">
              ← Back to Projects
            </Link>

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

            {loadError ? (
              <p role="alert">{loadError}</p>
            ) : projects === null ? (
              <p role="status">Loading projects...</p>
            ) : !projectId ? (
              <section className="provider-section">
                {projects.length === 0 && (
                  <p>No assigned projects yet.</p>
                )}

                {projects.map((project) => (
                  <article
                    className="assigned-project-card"
                    key={project.id}
                  >
                    <div>
                      <h3>{project.name}</h3>
                      <p>{project.status || "Not available"}</p>
                    </div>

                    <Link to={
                      "/provider/device-verification/" +
                      encodeURIComponent(project.id)
                    }>
                      View Details →
                    </Link>
                  </article>
                ))}
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
              value={Math.max(0, Math.min(100, Number(project.progress) || 0))}
              max={100}
            />
            <span>
              {Math.max(0, Math.min(100, Number(project.progress) || 0))}%
            </span>
          </dd>
        </div>
      </dl>

      {/* Work Zone + Site Status */}
      <div className="pex-grid pex-grid-wide">
        <section className="pex-card">
          <h2>Work Zone</h2>

          {project.workZone ? (
            <div style={{
              height: 300,
              width: "100%",
              overflow: "hidden",
              borderRadius: 12
            }}>
              <MamarMap workZone={project.workZone} readOnly />
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

      {/* Verification status */}
      <div className="pex-grid">
        <section className="pex-card">
          <h2>Device Verification Status</h2>
          <p>
            Verification is performed by assigned field workers.
          </p>
          <p role="status">
            Verification records are not available yet.
          </p>
        </section>

        <section className="pex-card">
          <h2>Device Details</h2>
          <p>
            Device ID, type, planned location and verification
            results will appear here once the backend provides them.
          </p>
        </section>
      </div>
    </>
  );
}
