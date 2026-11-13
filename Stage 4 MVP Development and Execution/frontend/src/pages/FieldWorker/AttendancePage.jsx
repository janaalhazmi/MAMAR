import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FieldWorkerShell from "../../components/FieldWorkerShell";
import AttendanceCard from "../../components/AttendanceCard";
import TrafficCard from "../../components/TrafficCard";
import { getSession } from "../../services/auth";
import { fetchFieldProjects } from "../../services/api";

// Opened by scanning the site QR: /attendance?projectId=12&code=AB12CD34EF
// Without a project in the link, the worker picks one of their projects.
export default function AttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const code = searchParams.get("code") || "";
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getSession()?.access_token;
    if (!token) return undefined;
    let active = true;
    fetchFieldProjects(token)
      .then((list) => { if (active) setProjects(list.filter((item) => !["completed", "cancelled"].includes(item.project.project_status))); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  const current = projects?.find((item) => String(item.project.project_id) === String(projectId));

  return (
    <FieldWorkerShell activeKey="attendance">
      <Link to="/field-worker-dashboard" className="pf-backlink">‹ Back to Dashboard</Link>
      <div className="pf-title-row">
        <section className="pf-heading">
          <h1>Site Attendance</h1>
          <p>Check in when you arrive at the work zone and check out when you leave.</p>
        </section>
      </div>

      {error && <p className="pf-alert" role="alert">{error}</p>}

      {projects && projects.length === 0 && (
        <p className="pf-empty">You have no open project. Ask your provider to assign you to a project.</p>
      )}

      {projects && projects.length > 0 && (
        <label className="att-pick">
          Project
          <select
            value={projectId || ""}
            onChange={(event) => setSearchParams(event.target.value ? { projectId: event.target.value } : {})}
          >
            <option value="">Choose a project…</option>
            {projects.map((item) => (
              <option key={item.project.project_id} value={item.project.project_id}>
                {item.project.project_name}
              </option>
            ))}
          </select>
        </label>
      )}

      {projectId && projects && !current && (
        <p className="pf-alert" role="alert">You are not assigned to this project, or it is closed.</p>
      )}

      {current && (
        <>
          <p className="att-where">📍 {current.project.location || "Work zone"}</p>
          <AttendanceCard key={projectId} projectId={projectId} initialCode={code} />
          <TrafficCard projectId={projectId} />
          <Link className="pf-backlink" to={`/field-execution?projectId=${projectId}`}>Open Field Execution ›</Link>
        </>
      )}
    </FieldWorkerShell>
  );
}
