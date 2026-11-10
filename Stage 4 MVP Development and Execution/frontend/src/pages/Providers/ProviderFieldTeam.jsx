import NotificationBell from "../../components/NotificationBell";
import { useState } from "react";
import {
  assignProviderWorker,
  useFieldWorkerRegistration,
  useProviderFieldWorkers,
  useWorkerAssignmentProjects,
} from "../../services/providers/api";
import ProviderSidebar from "../../components/ProviderSidebar";
import { getSession } from "../../services/auth";


const statuses = ["Active", "Available", "On Leave"];


function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase()).join("") || "P";
}

export default function ProviderFieldTeam() {
  const { workers, setWorkers, loadingWorkers, workersError } =
    useProviderFieldWorkers();

  const name = getSession()?.user?.full_name || "Provider";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [project, setProject] = useState("");
  const [selected, setSelected] = useState(null);
  const [addingWorker, setAddingWorker] = useState(false);
  const projects = [...new Set(workers.map((worker) => worker.project).filter(Boolean))];

  function addRegisteredWorker(worker) {
    setWorkers((current) => [
      ...current.filter((item) => item.email !== worker.email),
      worker,
    ]);
  }

  const query = search.trim().toLowerCase();
  const visible = workers.filter((worker) =>
    (!status || worker.status === status) &&
    (!project || worker.project === project) &&
    [worker.name, worker.id, worker.email].some((value) =>
      String(value).toLowerCase().includes(query)
    )
  );

  const stats = [
    ["Total Workers", workers.length, "Registered workers"],
    ...statuses.map((item, index) => [
      item === "On Leave" ? item : item + " Workers",
      workers.filter((worker) => worker.status === item).length,
      ["Assigned to projects", "Ready for assignment", "Temporarily unavailable"][index],
    ]),
  ];

  return (
    <div className="provider-dashboard-page">
      <ProviderSidebar />
      <div className="provider-main-area">
        <header className="provider-topbar">
          <NotificationBell />
          <div />
          <div className="provider-account">
            <div className="provider-avatar">{initials(name)}</div>
            <div><strong>{name}</strong><span>Service Provider</span></div>
          </div>
        </header>

        <main className="provider-dashboard-content pft-page">
          {loadingWorkers && (
            <p role="status">Loading field workers…</p>
          )}
          {workersError && (
            <p role="alert">{workersError}</p>
          )}

          {!selected && !addingWorker && (
            <>
          <div className="pft-heading">
            <section className="provider-title">
              <h1>Field Team</h1>
              <p>Manage field workers, monitor assignments, and track availability.</p>
            </section>
            <button
              className="pft-primary"
              type="button"
              onClick={() => setAddingWorker(true)}
              disabled={loadingWorkers}
            >
              + Add Field Worker
            </button>
          </div>

          <section className="pft-stats" aria-label="Field team summary">
            {stats.map(([label, count, detail]) => (
              <article className="pft-card" key={label}>
                <small>{label}</small>
                <strong className="pft-count">{String(count).padStart(2, "0")}</strong>
                <small>{detail}</small>
              </article>
            ))}
          </section>

          <section className="pft-card pft-directory">
            <h2>Workforce Directory</h2>
            <p>All registered workers and their current project assignments.</p>

            <div className="pft-filters">
              <input
                type="search"
                aria-label="Search workers"
                placeholder="Search by worker name or ID…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select aria-label="Worker status" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="">All Status</option>
                {statuses.map((item) => <option key={item}>{item}</option>)}
              </select>
              <select aria-label="Assigned project" value={project} onChange={(event) => setProject(event.target.value)}>
                <option value="">All Projects</option>
                {projects.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>

            <div className="pft-tabs" role="group" aria-label="Filter by worker status">
              {["", ...statuses].map((item) => (
                <button key={item} type="button" aria-pressed={status === item} onClick={() => setStatus(item)}>
                  {item || "All Workers"} ({item ? workers.filter((worker) => worker.status === item).length : workers.length})
                </button>
              ))}
            </div>

            <div className="pft-table-wrap">
              <table className="pft-table" aria-label="Field workers">
                <thead>
                  <tr>
                    {["Field Worker", "Worker ID", "Assigned Project", "Status", "Last Activity", "Action"].map(
                      (label) => <th key={label} scope="col">{label}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((worker) => (
                    <tr key={worker.id}>
                      <td>
                        <div className="pft-person">
                          <span className="pft-avatar">{initials(worker.name)}</span>
                          <div><strong>{worker.name}</strong><small>{worker.email}</small></div>
                        </div>
                      </td>
                      <td>{worker.id}</td>
                      <td>{worker.project || "Not assigned"}</td>
                      <td><span className="pft-status" data-status={worker.status}>{worker.status}</span></td>
                      <td>{worker.activity}</td>
                      <td><button className="pft-view" type="button" onClick={() => setSelected(worker)}>View →</button></td>
                    </tr>
                  ))}
                  {!loadingWorkers && !workersError && visible.length === 0 && <tr><td colSpan={6}>{workers.length ? "No workers match these filters." : "No field workers to display yet."}</td></tr>}
                </tbody>
              </table>
            </div>
            <p>Showing {visible.length} of {workers.length} field workers</p>
          </section>

            </>
          )}

          {addingWorker && (
            <AddFieldWorkerForm
              onClose={() => setAddingWorker(false)}
              onCreated={addRegisteredWorker}
            />
          )}

          {selected && (
            <section className="pft-card pft-details" aria-label="Worker details">
              <button className="pft-view" type="button" onClick={() => setSelected(null)}>
                ← Back to Field Team
              </button>
              <h2 style={{ marginTop: 16 }}>{selected.name}</h2>
              <dl className="pft-stats" style={{ marginTop: 16 }}>
                <div className="pft-card"><dt>Full Name</dt><dd>{selected.name}</dd></div>
                <div className="pft-card"><dt>Phone Number</dt><dd>{selected.phone || "Not available"}</dd></div>
                <div className="pft-card"><dt>Company Email</dt><dd>{selected.email}</dd></div>
                <div className="pft-card"><dt>Assigned Project</dt><dd>{selected.project || "Not assigned"}</dd></div>
              </dl>
            <WorkerAssignmentForm
                key={selected.id}
                worker={selected}
                onAssigned={(project) => {
                  const updated = { ...selected, project: project.name, status: "Active" };
                  setWorkers((current) => current.map((item) =>
                    item.id === updated.id ? updated : item
                  ));
                  setSelected(updated);
                }}
              />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function AddFieldWorkerForm({ onClose, onCreated }) {
  const { worker, busy, error, created, submit } =
    useFieldWorkerRegistration(onCreated);

  return (
    <section className="pft-card pft-details" aria-label="Add field worker">
      <h2>Add Field Worker</h2>
      {created ? (
        <p role="status">Field worker account created.</p>
      ) : (
        <form onSubmit={submit} key={worker ? "verify" : "details"}>
          {worker ? (
            <>
              <p>Enter the verification code sent to {worker.email}.</p>
              <label>
                Verification code
                <input name="passcode" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required />
              </label>
            </>
          ) : (
            <div className="pft-filters">
              <label>Full Name<input name="full_name" maxLength={100} required /></label>
              <label>Company Email<input name="email" type="email" placeholder="Ahmed1@tcmksa.com" required /></label>
              <label>Phone Number<input name="phone" type="tel" maxLength={20} /></label>
              <label>Password<input name="password" type="password" autoComplete="new-password" minLength={6} required /></label>
            </div>
          )}
          <button className="pft-primary" type="submit" disabled={busy}>
            {busy ? "Please wait…" : worker ? "Create Worker Account" : "Send Verification Code"}
          </button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
      <button className="pft-view" type="button" onClick={onClose} disabled={busy}>
        {created ? "Done" : "Cancel"}
      </button>
    </section>
  );
}

function WorkerAssignmentForm({ worker, onAssigned }) {
  const [projectId, setProjectId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const workerId = Number(worker.id);
  const canAssign = !worker.project && Number.isSafeInteger(workerId) && workerId > 0;

  const projects = useWorkerAssignmentProjects(canAssign, setError);

  async function assign(event) {
    event.preventDefault();
    const project = projects?.find((item) => String(item.id) === projectId);
    if (!canAssign || !project || saving) return;

    setSaving(true);
    setError("");

    try {
      await assignProviderWorker(project.id, workerId);
      onAssigned(project);
    } catch (failure) {
      setError(failure.message || "Could not assign the worker.");
    } finally {
      setSaving(false);
    }
  }

  if (worker.project) return <p role="status">Assigned to {worker.project}.</p>;
  if (!canAssign) return <p>The worker's account ID is required to assign a project.</p>;

  return (
    <form onSubmit={assign}>
      <div className="pft-filters">
        <label>
          Assign to Project
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)}
            disabled={!projects?.length || saving} required>
            <option value="">Select a project</option>
            {projects?.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </label>
      </div>
      {!projects && !error && <p role="status">Loading projects…</p>}
      {projects?.length === 0 && <p>No projects available for assignment.</p>}
      {error && <p role="alert">{error}</p>}
      <button className="pft-primary" type="submit" disabled={!projectId || saving}>
        {saving ? "Saving…" : "Save Assignment"}
      </button>
    </form>
  );
}
