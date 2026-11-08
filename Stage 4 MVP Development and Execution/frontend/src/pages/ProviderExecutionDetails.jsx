import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProviderSidebar from "../components/ProviderSidebar";
import MamarMap from "../components/MamarMap";
import Button from "../components/Button";
import { postReturnToTeam, postSubmitCompletion } from "../services/api";
import { getSession } from "../services/auth";
import { formatDate } from "../services/projectFlow";

const apiUrl = (
  import.meta.env.VITE_API_URL || "https://mamar-api.onrender.com"
).replace(/\/+$/, "");

export default function ProviderProjectDetails() {
  const { projectId } = useParams();
  const session = getSession();
  const token = session?.access_token;
  const name = session?.user?.full_name || "Provider";
  const initials = name.trim().split(/\s+/).slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase()).join("") || "P";

  const [result, setResult] = useState(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewNotice, setReviewNotice] = useState("");
  const [note, setNote] = useState("");

  // Field worker -> provider -> contractor. The page shows the updated project
  // the server returns, so the status and buttons change at once.
  async function review(action) {
    if (reviewBusy) return;
    if (action === "return" && !note.trim()) {
      setReviewError("Write a note for the field team first.");
      return;
    }
    setReviewBusy(true);
    setReviewError("");
    setReviewNotice("");
    try {
      const data = action === "submit"
        ? await postSubmitCompletion(token, projectId)
        : await postReturnToTeam(token, projectId, note.trim());
      setResult({ projectId, token, data });
      setNote("");
      setReviewNotice(action === "submit"
        ? "Sent to the contractor for review."
        : "Returned to the field team with your note.");
    } catch (error) {
      setReviewError(error.message || "Could not update the project. Please try again.");
    } finally {
      setReviewBusy(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        if (!projectId) throw new Error("No project was selected.");
        if (!token) throw new Error("Please sign in to continue.");

        const response = await fetch(
          `${apiUrl}/provider/projects/${encodeURIComponent(projectId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Could not load this project (${response.status}).`);
        }

        const data = await response.json();
        if (!controller.signal.aborted) setResult({ projectId, token, data });
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({ projectId, token, error: error.message });
        }
      }
    }

    load();
    return () => controller.abort();
  }, [projectId, token]);

  const current = result?.projectId === projectId && result?.token === token
    ? result
    : null;
  const details = current?.data;
  const project = details?.project;
  const progress = Math.max(0, Math.min(100, Number(details?.progress) || 0));
  const team = details?.team ?? [];
  const photos = details?.photos ?? [];

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
        </header>

        <main className="provider-dashboard-content">
          <div className="pex-page">
            <Link to="/provider/projects">← Back to Projects</Link>

            <div className="pex-heading">
              <div>
                <h1>{project?.project_name || "Execution Details"}</h1>
                <p>Project Execution</p>
              </div>
              {details && <span className="pex-status">{details.status}</span>}
            </div>

            {!current && <p role="status">Loading project details…</p>}
            {current?.error && <p role="alert">{current.error}</p>}

            {project && (
              <>
                <dl className="pex-card pex-summary">
                  <div>
                    <dt>Project ID</dt>
                    <dd>{project.project_id}</dd>
                  </div>
                  <div>
                    <dt>Project Dates</dt>
                    <dd>
                      {project.start_date ? formatDate(project.start_date) : "—"}
                      {" – "}
                      {project.end_date ? formatDate(project.end_date) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Services</dt>
                    <dd>{project.services?.join(", ") || "—"}</dd>
                  </div>
                  <div>
                    <dt>Overall Progress</dt>
                    <dd className="pex-progress">
                      <progress aria-label="Overall progress" value={progress} max={100} />
                      <span>{progress}%</span>
                    </dd>
                  </div>
                </dl>

                <div className="pex-grid pex-grid-wide">
                  <section className="pex-card">
                    <h2>Work Zone</h2>
                    {project.work_zone ? (
                      <div
                        style={{
                          height: "400px",
                          width: "100%",
                          overflow: "hidden",
                          borderRadius: "12px",
                        }}
                      >
                        <MamarMap
                          workZone={project.work_zone}
                          readOnly
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
                    <p className="pex-status">{details.site_status || "Not available"}</p>
                    <p>{details.field_team_count ?? team.length} team members assigned</p>
                    <p>
                      Last check-in{" "}
                      {details.last_check_in
                        ? new Date(details.last_check_in).toLocaleString()
                        : "—"}
                    </p>
                  </section>
                </div>

                {(details.awaiting_review || details.completion_submitted) && (
                  <section className="pex-card" aria-label="Completion review">
                    <h2>Completion Review</h2>
                    {details.awaiting_review ? (
                      <>
                        <p>
                          The field team marked this work as Completed. Check the
                          site photos, then send it to the contractor or return it
                          to the team.
                        </p>
                        <label>
                          Note for the field team (only when returning)
                          <textarea
                            value={note}
                            maxLength={1000}
                            rows={3}
                            onChange={(event) => setNote(event.target.value)}
                          />
                        </label>
                        <div className="pex-actions">
                          <Button onClick={() => review("submit")} disabled={reviewBusy}>
                            {reviewBusy ? "Please wait…" : "Send to Contractor"}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => review("return")}
                            disabled={reviewBusy}
                          >
                            Return to Field Team
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p>
                        Sent to the contractor
                        {details.submitted_at
                          ? ` on ${new Date(
                              /[zZ]|[+-]\d\d:?\d\d$/.test(details.submitted_at)
                                ? details.submitted_at
                                : `${details.submitted_at}Z`
                            ).toLocaleString()}`
                          : ""}
                        . Waiting for their review.
                      </p>
                    )}
                    {reviewNotice && <p role="status">{reviewNotice}</p>}
                    {reviewError && <p role="alert">{reviewError}</p>}
                  </section>
                )}

                <div className="pex-grid">
                  <section className="pex-card">
                    <h2>Field Team</h2>
                    {team.length ? (
                      <ul className="pex-list">
                        {team.map((member) => (
                          <li key={member.user_id}>{member.full_name}</li>
                        ))}
                      </ul>
                    ) : <p>No team members assigned yet.</p>}
                  </section>

                  <section className="pex-card">
                    <h2>Site Updates</h2>
                    {details.change_note && <p>{details.change_note}</p>}
                    {photos.length ? (
                      <ul className="pex-list">
                        {photos.map((photo) => (
                          <li key={photo.photo_id}>
                            {photo.caption || "Site photo"}
                            {photo.created_at && ` · ${formatDate(photo.created_at)}`}
                          </li>
                        ))}
                      </ul>
                    ) : <p>No site photos yet.</p>}
                  </section>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
