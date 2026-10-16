import {
  LayoutDashboard,
  FolderKanban,
  Wrench,
  BadgeCheck,
  Users,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Button from "../components/Button";

const providerItems = [
  {
    label: "Dashboard",
    path: "/provider-dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Projects",
    path: "/provider/projects",
    icon: FolderKanban,
  },
  {
    label: "Execution",
    path: "/provider/execution",
    icon: Wrench,
  },
  {
    label: "Device Verification",
    path: "/provider/device-verification",
    icon: BadgeCheck,
  },
  {
    label: "Field Team",
    path: "/provider/field-team",
    icon: Users,
  },
];

const summaryCards = [
  {
    label: "Assigned Projects",
    value: "04",
    icon: "＋",
    color: "yellow",
  },
  {
    label: "Active Execution",
    value: "02",
    icon: "✓",
    color: "green",
  },
  {
    label: "Upcoming",
    value: "01",
    icon: "□",
    color: "blue",
  },
  {
    label: "Completed Projects",
    value: "01",
    icon: "✓",
    color: "gray",
  },
];

const activeProjects = [
  {
    name: "Northern Ring Road",
    location: "Riyadh",
    progress: 68,
  },
  {
    name: "Olaya Road Works",
    location: "Riyadh",
    progress: 35,
  },
];

function ProviderDashboard() {
  return (
    <div className="provider-dashboard-page">
      <Sidebar items={providerItems} />

      <div className="provider-main-area">
        <header className="provider-topbar">
          <div />

          <div className="provider-account">
            <div className="provider-avatar">TC</div>

            <div>
              <strong>TCM</strong>
              <span>Service Provider</span>
            </div>
          </div>
        </header>

        <main className="provider-dashboard-content">
          <section className="provider-title">
            <h1>Provider Dashboard</h1>

            <p>
              Review service requests, manage assigned projects and track field
              execution.
            </p>
          </section>

          <section className="provider-summary-grid">
            {summaryCards.map((card) => (
              <article
                className="provider-summary-card"
                key={card.label}
              >
                <div
                  className={`provider-summary-icon ${card.color}`}
                >
                  {card.icon}
                </div>

                <div>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </div>
              </article>
            ))}
          </section>

          <section className="provider-section">
            <h2>New Service Request</h2>

            <article className="service-request-card">
              <span className="request-badge">
                ● &nbsp; NEW REQUEST
              </span>

              <h3>King Fahd Road – Water Line</h3>

              <p className="request-company">
                Al Noor Contracting · Infrastructure Project
              </p>

              <div className="request-details">
                <div>
                  <span>LOCATION</span>
                  <strong>King Fahd Road, Riyadh</strong>
                </div>

                <div>
                  <span>START DATE</span>
                  <strong>18 Oct 2026</strong>
                </div>

                <div>
                  <span>END DATE</span>
                  <strong>24 Oct 2026</strong>
                </div>

                <div>
                  <span>STATUS</span>
                  <strong className="request-status">
                    Awaiting Your Quote
                  </strong>
                </div>
              </div>

              <div className="request-footer">
                <div className="request-tags">
                  <span>Traffic Barriers</span>
                  <span>Traffic Cones</span>
                  <span>Road Signs</span>
                </div>

                <Button>
                  Prepare Quotation →
                </Button>
              </div>
            </article>
          </section>

          <section className="provider-section">
            <h2>New Assigned Project</h2>

            <article className="assigned-project-card">
              <div>
                <span className="accepted-badge">
                  QUOTE ACCEPTED
                </span>

                <h3>Al Mursalat – Road Maintenance</h3>

                <p>Riyadh · 25–30 Oct 2026</p>

                <span className="ready-status">
                  Ready to Start
                </span>
              </div>

              <Button variant="secondary">
                View Project →
              </Button>
            </article>
          </section>

          <section className="provider-bottom-grid">
            <article className="provider-bottom-card">
              <div className="provider-card-heading">
                <h2>Active Projects</h2>
                <a href="#projects">View All</a>
              </div>

              <div className="active-project-header">
                <span>PROJECT</span>
                <span>LOCATION</span>
                <span>PROGRESS</span>
                <span>STATUS</span>
              </div>

              {activeProjects.map((project) => (
                <div
                  className="active-project-row"
                  key={project.name}
                >
                  <span>{project.name}</span>
                  <span>{project.location}</span>

                  <div className="progress-area">
                    <div className="progress-bar">
                      <div
                        style={{
                          width: `${project.progress}%`,
                        }}
                      />
                    </div>

                    <span>{project.progress}%</span>
                  </div>

                  <span className="active-badge">
                    Active
                  </span>
                </div>
              ))}
            </article>

            <article className="provider-bottom-card execution-overview">
              <h2>Execution Overview</h2>

              <div className="execution-item">
                <span className="execution-icon yellow">
                  ✓
                </span>

                <div>
                  <small>FIELD TEAM</small>
                  <p>6 Workers Active</p>
                </div>
              </div>

              <div className="execution-item">
                <span className="execution-icon green">
                  ✓
                </span>

                <div>
                  <small>SITE EXECUTION</small>
                  <p>2 Sites Active</p>
                </div>
              </div>

              <a href="#execution">
                View Execution Details →
              </a>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}

export default ProviderDashboard;