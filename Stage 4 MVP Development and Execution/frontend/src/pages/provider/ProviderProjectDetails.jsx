import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  Wrench,
} from "lucide-react";
import ProviderSidebar from "../../components/ProviderSidebar";
import MamarMap from "../../components/MamarMap";

const projects = {
  "PRJ-001": {
    id: "PRJ-001",
    name: "Northern Ring Road",
    city: "Riyadh",
    status: "Active",
    startDate: "01 Oct 2026",
    endDate: "15 Oct 2026",
    duration: "15 days",
    progress: 68,
    description:
      "Temporary traffic control and work-zone management for scheduled road works along the Northern Ring Road.",
    services: [
      "Traffic Barriers",
      "Traffic Cones",
      "Temporary Road Signs",
    ],
    workers: 6,
    devices: 24,
  },
};

function ProviderProjectDetails() {
  const { projectId } = useParams();
  const project = projects[projectId];

  if (!project) {
    return (
      <div className="provider-project-details-page">
        <ProviderSidebar />

        <main className="provider-project-details-main">
          <h1>Project not found</h1>
          <Link to="/provider/projects">Back to My Projects</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="provider-project-details-page">
      <ProviderSidebar />

      <main className="provider-project-details-main">
        <Link
          to="/provider/projects"
          className="provider-project-back"
        >
          <ArrowLeft size={17} />
          Back to My Projects
        </Link>

        <section className="provider-project-details-header">
          <div>
            <div className="provider-project-details-id">
              {project.id}
            </div>

            <h1>{project.name}</h1>

            <p>
              View project information and monitor execution progress.
            </p>
          </div>

          <span className="provider-project-details-status">
            {project.status}
          </span>
        </section>

        <section className="provider-project-details-summary">
          <article>
            <MapPin size={20} />
            <div>
              <span>Location</span>
              <strong>{project.city}</strong>
            </div>
          </article>

          <article>
            <CalendarDays size={20} />
            <div>
              <span>Project Dates</span>
              <strong>
                {project.startDate} – {project.endDate}
              </strong>
              <small>{project.duration}</small>
            </div>
          </article>

          <article>
            <Users size={20} />
            <div>
              <span>Field Team</span>
              <strong>{project.workers} Workers</strong>
            </div>
          </article>

          <article>
            <Wrench size={20} />
            <div>
              <span>Devices</span>
              <strong>{project.devices} Assigned</strong>
            </div>
          </article>
        </section>

        <section className="provider-project-details-grid">
          <div className="provider-project-details-left">
            <article className="provider-project-details-card">
              <h2>Project Overview</h2>

              <p className="provider-project-description">
                {project.description}
              </p>

              <div className="provider-detail-progress-heading">
                <span>Execution Progress</span>
                <strong>{project.progress}%</strong>
              </div>

              <div className="provider-detail-progress-track">
                <div
                  className="provider-detail-progress-fill"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </article>

            <article className="provider-project-details-card">
              <h2>Requested Services</h2>

              <div className="provider-project-services">
                {project.services.map((service) => (
                  <div key={service}>
                    <span>✓</span>
                    {service}
                  </div>
                ))}
              </div>
            </article>

            <article className="provider-project-details-card">
              <h2>Notes</h2>
              <p className="provider-project-description">
                Follow the approved traffic control plan and maintain
                all assigned safety devices throughout the project
                execution period.
              </p>
            </article>
          </div>

          <div className="provider-project-details-right">
            <article className="provider-project-details-card">
              <div className="provider-work-zone-title">
                <div>
                  <h2>Work Zone</h2>
                  <p>Project location and approved work area.</p>
                </div>
              </div>

              <div className="provider-project-map">
                <MamarMap readOnly />
              </div>
            </article>
          </div>
        </section>

        <div className="provider-projects-breadcrumb">
          Provider / Projects / {project.name}
        </div>
      </main>
    </div>
  );
}

export default ProviderProjectDetails;
