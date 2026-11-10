import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CalendarDays, Pencil, Check } from "lucide-react";

import ContractorShell from "../../components/ContractorShell";
import Button from "../../components/Button";
import MamarMap from "../../components/MamarMap";

import {
  formatDateRange,
  getDraftProject,
  getSelectedServiceOptions,
  handleConfirmProject,
  handleSaveDraft,
} from "../../services/Contractor/Contractor";

function ReviewPage() {
  const navigate = useNavigate();

  const [project, setProject] = useState(getDraftProject);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const services = getSelectedServiceOptions(project);
  const projectDates = formatDateRange(
    project.startDate,
    project.endDate
  );

  const handleEditDetails = () => navigate("/create-project");
  const handleEditLocation = () => navigate("/project-location");
  const handleEditServices = () => navigate("/services");

  async function onSaveDraft() {
    if (saving) return;

    setSaving(true);
    setError("");
    setSavedMessage("");

    try {
      setProject(await handleSaveDraft(project));
      setSavedMessage("Project draft saved successfully.");
    } catch (err) {
      setError(
        err.message ||
          "Unable to save the project draft. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function onConfirm() {
    if (saving) return;

    setSaving(true);
    setError("");
    setSavedMessage("");

    try {
      const confirmed = await handleConfirmProject(project);

      navigate("/providers", {
        state: { project: confirmed },
      });
    } catch (err) {
      setError(
        err.message || "Unable to save the project. Please try again."
      );
      setSaving(false);
    }
  }

  return (
    <ContractorShell activeKey="create">
      <div className="review-content">
        <div className="review-heading">
          <h1>Review Project</h1>
          <p>
            Review your project details before finding the right
            traffic-control providers.
          </p>
        </div>

        {/* Progress */}
        <div className="review-progress">
          <ProgressStep
            number={<Check size={16} />}
            label="Project Details"
            status="completed"
          />

          <div className="review-progress-line completed" />

          <ProgressStep
            number={<Check size={16} />}
            label="Location"
            status="completed"
          />

          <div className="review-progress-line completed" />

          <ProgressStep
            number={<Check size={16} />}
            label="Service"
            status="completed"
          />

          <div className="review-progress-line completed" />

          <ProgressStep number="4" label="Review" status="active" />
        </div>

        {/* Review Grid */}
        <div className="review-grid">
          {/* Project Details */}
          <section className="review-card review-details-card">
            <div className="review-card-heading">
              <div>
                <h2>Project Details</h2>
                <p>Basic information about your project.</p>
              </div>

              <button
                type="button"
                className="review-edit-button"
                onClick={handleEditDetails}
              >
                <Pencil size={15} />
                Edit
              </button>
            </div>

            <ReviewField
              label="Project Name"
              value={project.name || "Not specified"}
            />

            <ReviewField
              label="Project Type"
              value={project.type || "Not specified"}
            />

            <ReviewField
              label="Project Dates"
              value={projectDates}
            />

            <ReviewField
              label="Description"
              value={project.description || "Not specified"}
            />
          </section>

          {/* Project Location */}
          <section className="review-card review-location-card">
            <div className="review-card-heading">
              <div>
                <h2>Project Location</h2>
                <p>Selected location for the work zone.</p>
              </div>

              <button
                type="button"
                className="review-edit-button"
                onClick={handleEditLocation}
              >
                <Pencil size={15} />
                Edit
              </button>
            </div>

            <div className="review-map">
              {project.latitude != null &&
              project.longitude != null ? (
                <MamarMap
                  latitude={project.latitude}
                  longitude={project.longitude}
                  workZone={project.workZone}
                  readOnly
                />
              ) : (
                <div className="review-map-empty">
                  <MapPin size={28} />
                  <span>No location selected</span>
                </div>
              )}
            </div>

            <div className="review-location-info">
              <MapPin size={18} />

              <div>
                <strong>Project Location</strong>
                <p>
                  {project.location || "No location selected"}
                </p>

                {project.latitude != null &&
                  project.longitude != null && (
                    <small>
                      {project.latitude}, {project.longitude}
                    </small>
                  )}
              </div>
            </div>

            {project.area != null && (
              <div className="review-field">
                <span>Work Zone Area</span>
                <strong>
                  {Number(project.area).toLocaleString()} m²
                </strong>
              </div>
            )}

            {(project.polygon || project.workZone) && (
              <div className="review-field">
                <span>Work Zone</span>
                <strong>Polygon completed</strong>
              </div>
            )}
          </section>

          {/* Selected Services */}
          <section className="review-card review-services-card">
            <div className="review-card-heading">
              <div>
                <h2>Selected Services</h2>
                <p>Services requested for this project.</p>
              </div>

              <button
                type="button"
                className="review-edit-button"
                onClick={handleEditServices}
              >
                <Pencil size={15} />
                Edit
              </button>
            </div>

            {services.length > 0 ? (
              <div className="review-services-list">
                {services.map((service) => (
                  <div
                    className="review-service-item"
                    key={service.id}
                  >
                    <span className="review-service-check">
                      <Check size={16} />
                    </span>

                    <div>
                      <h3>{service.title}</h3>
                      <p>{service.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="review-empty-services">
                No services selected.
              </p>
            )}
          </section>
        </div>

        {/* Confirmation */}
        <section className="review-confirmation">
          <div className="review-confirmation-icon">
            <CalendarDays size={23} />
          </div>

          <div className="review-confirmation-text">
            <h2>Ready to continue?</h2>
            <p>
              Confirm your project details to continue to the provider
              selection process.
            </p>
          </div>
        </section>

        {/* Messages */}
        {error && (
          <p className="review-error" role="alert">
            {error}
          </p>
        )}

        {savedMessage && (
          <p className="review-success" role="status">
            {savedMessage}
          </p>
        )}

        {/* Actions */}
        <div className="review-actions">
          <Button
            variant="secondary"
            onClick={() => navigate("/services")}
            disabled={saving}
          >
            ← Back
          </Button>

          <div className="review-actions-right">
            <Button
              variant="secondary"
              onClick={onSaveDraft}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Draft"}
            </Button>

            <Button onClick={onConfirm} disabled={saving}>
              {saving
                ? "Saving…"
                : "Confirm & Find Providers →"}
            </Button>
          </div>
        </div>
      </div>
    </ContractorShell>
  );
}

function ProgressStep({ number, label, status }) {
  return (
    <div className={`review-progress-step ${status}`}>
      <span className="review-progress-number">{number}</span>
      <span className="review-progress-label">{label}</span>
    </div>
  );
}

function ReviewField({ label, value }) {
  return (
    <div className="review-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default ReviewPage;