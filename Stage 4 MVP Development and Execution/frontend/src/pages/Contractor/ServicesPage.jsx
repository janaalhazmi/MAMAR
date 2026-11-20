import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContractorShell from "../../components/ContractorShell";
import MamarMap from "../../components/MamarMap";
import "../../styles/Contractor/servicepage.css";

const STORAGE_KEY = "mamarNewProject";
const DEFAULT_SERVICES = ["ttc-plan", "road-signs"];

const SERVICE_OPTIONS = [
  {
    id: "ttc-plan",
    icon: "A",
    title: "Temporary Traffic Control Plan (TTC) Service",
    description:
      "Planning and implementation services provided by qualified traffic-control providers.",
    tags: ["Traffic Management Plan", "Site Setup"],
  },
  {
    id: "cones-barriers",
    icon: "▥",
    title: "Traffic Cones & Barriers",
    description: "Supply and installation of traffic cones and barriers.",
    tags: ["Cones", "Road Barriers"],
  },
  {
    id: "road-signs",
    icon: "⚠",
    title: "Road Signs & Variable Message Signs",
    description:
      "Installation and rental of road signs and variable message signs.",
    tags: ["Road Signs", "Variable Message Signs"],
  },
];

const PROGRESS_STEPS = [
  { number: "✓", label: "Project Details", status: "completed" },
  { number: "✓", label: "Location", status: "completed" },
  { number: "3", label: "Service", status: "active" },
  { number: "4", label: "Review", status: "" },
];

/* ---------- Helpers ---------- */

function readProject() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCoordinate(value) {
  return value != null ? Number(value).toFixed(6) : "Not specified";
}

/* ---------- Page ---------- */

function ServicesPage() {
  const navigate = useNavigate();

  const [project] = useState(readProject);

  const [selectedServices, setSelectedServices] = useState(() => {
    const saved = readProject();
    return Array.isArray(saved.services) ? saved.services : DEFAULT_SERVICES;
  });

  const [error, setError] = useState("");

  function toggleService(serviceId) {
    setSelectedServices((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId]
    );
    setError("");
  }

  function handleNext() {
    if (selectedServices.length === 0) {
      setError("Please select at least one service.");
      return;
    }

    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...readProject(), services: selectedServices })
    );

    navigate("/review");
  }

  const workZone = project.polygon ?? project.workZone ?? null;

  const projectName = project.name || "King Fahd Road – Water Line";
  const projectType = project.type || "Road Maintenance";

  const projectDates =
    project.startDate && project.endDate
      ? `${formatDate(project.startDate)} – ${formatDate(project.endDate)}`
      : "2 Oct 2026 – 23 Oct 2026";

  const servicesCount = `${selectedServices.length} ${
    selectedServices.length === 1 ? "service" : "services"
  }`;

  return (
    <ContractorShell activeKey="create">
      <div className="services-page">
        <div className="services-content">
          {/* Heading */}
          <div className="services-page-heading">
            <h1>Select Traffic-Control Service</h1>
            <p>
              Choose the services you need for this project. You can select
              more than one.
            </p>
          </div>

          {/* Progress */}
          <div className="services-progress">
            {PROGRESS_STEPS.map((step, index) => (
              <ProgressItem
                key={step.label}
                step={step}
                isFirst={index === 0}
              />
            ))}
          </div>

          {/* Workspace */}
          <div className="services-workspace">
            {/* Services list */}
            <section className="services-list-panel">
              <div className="services-panel-heading">
                <h2>Available Services</h2>
                <p>
                  Select the traffic-control services required for your
                  project.
                </p>
              </div>

              <div className="services-options">
                {SERVICE_OPTIONS.map((service) => {
                  const isSelected = selectedServices.includes(service.id);

                  return (
                    <label
                      key={service.id}
                      className={`services-option${
                        isSelected ? " selected" : ""
                      }`}
                    >
                      <div className="services-option-icon">
                        {service.icon}
                      </div>

                      <div className="services-option-content">
                        <h3>{service.title}</h3>
                        <p>{service.description}</p>

                        <div className="services-option-tags">
                          {service.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleService(service.id)}
                        aria-label={`Select ${service.title}`}
                      />
                    </label>
                  );
                })}
              </div>

              {error && (
                <p className="services-error" role="alert">
                  {error}
                </p>
              )}
            </section>

            {/* Project summary */}
            <aside className="services-summary-panel">
              <h2>Project Summary</h2>

              <p className="services-summary-description">
                Review your selected project details before continuing.
              </p>

              <div className="services-summary-map">
                <MamarMap
                  latitude={project.latitude ?? null}
                  longitude={project.longitude ?? null}
                  polygon={workZone}
                  readOnly fitPolygon
                />
              </div>

              <div className="services-summary-items">
                <SummaryItem label="Project Name" value={projectName} full />
                <SummaryItem label="Project Type" value={projectType} />
                <SummaryItem label="Project Dates" value={projectDates} />
                <SummaryItem
                  label="Latitude"
                  value={formatCoordinate(project.latitude)}
                />
                <SummaryItem
                  label="Longitude"
                  value={formatCoordinate(project.longitude)}
                />
                <SummaryItem
                  label="Work Zone Area"
                  value={
                    project.area != null
                      ? `${Number(project.area).toLocaleString()} m²`
                      : "Not specified"
                  }
                />
                <SummaryItem
                  label="Work Zone"
                  value={workZone ? "Polygon completed" : "Not selected"}
                />
                <SummaryItem
                  label="Services Selected"
                  value={servicesCount}
                  full
                />
              </div>
            </aside>
          </div>

          {/* Actions */}
          <div className="services-actions">
            <button
              type="button"
              className="services-back-button"
              onClick={() => navigate("/project-location")}
            >
              ← Back
            </button>

            <button
              type="button"
              className="services-next-button"
              onClick={handleNext}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </ContractorShell>
  );
}

/* ---------- Small components ---------- */

function ProgressItem({ step, isFirst }) {
  // The line before a step is green when that step is done or current
  const lineClass = `services-progress-line${
    step.status === "completed" || step.status === "active"
      ? " completed-line"
      : ""
  }`;

  return (
    <>
      {!isFirst && <div className={lineClass} />}
      <div className={`services-progress-step ${step.status}`}>
        <span className="services-progress-number">{step.number}</span>
        <span className="services-progress-label">{step.label}</span>
      </div>
    </>
  );
}

function SummaryItem({ label, value, full = false }) {
  return (
    <div className={`services-summary-item${full ? " full" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default ServicesPage;
