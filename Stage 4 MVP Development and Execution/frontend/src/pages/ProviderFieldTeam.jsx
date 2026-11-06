import { useEffect as useAssignmentEffect } from "react";
import { getProviderProjects as loadAssignmentProjects } from "../services/providerFlow";
import { registerUser, sendPasscode } from "../services/api";
import { useEffect, useState } from "react";
import { listAssignments } from "../services/api";
import ProviderSidebar from "../components/ProviderSidebar";
import { getSession } from "../services/auth";


const statuses = ["Active", "Available", "On Leave"];


function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase()).join("") || "P";
}

export default function ProviderFieldTeam() {
  useEffect(() => {
    const token = getSession()?.access_token;

    if (!token) {
      console.warn("Field Team: provider session is missing.");
      return;
    }

    let active = true;

    listAssignments(token)
      .then((data) => {
        if (!active) return;

        if (!Array.isArray(data)) {
          console.info("Field Team: response fields", Object.keys(data ?? {}));
          return;
        }

        console.info("Field Team: assignments loaded", {
          count: data.length,
          fields: Object.keys(data[0] ?? {}),
        });
      })
      .catch((error) => {
        if (active) console.error("Field Team: could not load assignments.", error.message);
      });

    return () => { active = false; };
  }, []);
  const name = getSession()?.user?.full_name || "Provider";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [project, setProject] = useState("");
  const [selected, setSelected] = useState(null);
  const [addingWorker, setAddingWorker] = useState(false);
  const [workers, setWorkers] = useState([]);
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
          <div />
          <div className="provider-account">
            <div className="provider-avatar">{initials(name)}</div>
            <div><strong>{name}</strong><span>Service Provider</span></div>
          </div>
        </header>

        <main className="provider-dashboard-content pft-page">
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
                  {visible.length === 0 && <tr><td colSpan={6}>{workers.length ? "No workers match these filters." : "No field workers to display yet."}</td></tr>}
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
  const [worker, setWorker] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (busy || created) return;

    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError("");

    try {
      if (worker) {
        const passcode = String(fields.get("passcode") || "").trim();
        if (!/^\d{6}$/.test(passcode)) {
          throw new Error("Enter the 6-digit passcode.");
        }

        const registered = await registerUser(worker, passcode);
        const user = registered?.user ?? registered;
        const email = worker.email.trim().toLowerCase();

        onCreated({
          id: user?.user_id ?? user?.id ?? email,
          name: user?.full_name ?? worker.full_name,
          email,
          phone: user?.phone ?? worker.phone,
          project: "",
          status: "Available",
          activity: "—",
        });
        setWorker(null);
        setCreated(true);
        return;
      }

      const session = getSession();
      const providerId = Number(session?.user?.provider_id ?? session?.provider_id);
      if (!Number.isInteger(providerId) || providerId < 1) {
        throw new Error("Your session is missing the company provider ID.");
      }

      const fullName = String(fields.get("full_name") || "").trim();
      if (!fullName) throw new Error("Enter the worker's full name.");

      const registration = {
        full_name: fullName,
        email: String(fields.get("email") || "").trim(),
        password: String(fields.get("password") || ""),
        phone: String(fields.get("phone") || "").trim() || null,
        role: "worker",
        provider_id: providerId,
      };

      await sendPasscode(registration.email);
      setWorker(registration);
    } catch (failure) {
      setError(failure.message || "Could not register the field worker.");
    } finally {
      setBusy(false);
    }
  }

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
  const [projects, setProjects] = useState(null);
  const [projectId, setProjectId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const workerId = Number(worker.id);
  const canAssign = !worker.project && Number.isSafeInteger(workerId) && workerId > 0;

  useAssignmentEffect(() => {
    if (!canAssign) return;
    let active = true;

    loadAssignmentProjects()
      .then((items) => { if (active) setProjects(items); })
      .catch(() => { if (active) setError("Could not load assigned projects."); });

    return () => { active = false; };
  }, [canAssign]);

  async function assign(event) {
    event.preventDefault();
    const project = projects?.find((item) => String(item.id) === projectId);
    if (!canAssign || !project || saving) return;

    setSaving(true);
    setError("");

    try {
      const token = getSession()?.access_token;
      if (!token) throw new Error("Please sign in again.");

      const base = (import.meta.env.VITE_API_URL || "https://mamar-api.onrender.com")
        .replace(/\/+$/, "");
      const response = await fetch(
        base + "/projects/" + encodeURIComponent(project.id) + "/assignments",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ worker_id: workerId }),
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(typeof body?.detail === "string"
          ? body.detail
          : "Assignment failed (" + response.status + ").");
      }

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
