import { useEffect, useState } from "react";

import { testBackendConnection } from "../services/api";

// Sprint 1 integration check: calls GET /health on mount and shows whether
// the React frontend can actually reach the FastAPI backend.
// Loading / success / error are the three states required by the sprint task.
function BackendStatus() {
  const [state, setState] = useState("loading"); // "loading" | "success" | "error"
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    testBackendConnection()
      .then((result) => {
        if (!isMounted) return;
        setData(result);
        setState("success");
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Backend connection failed");
        setState("error");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className={`backend-status backend-status--${state}`}>
      {state === "loading" && <span>Checking backend…</span>}

      {state === "success" && (
        <span>
          Backend: {data.status} · DB: {data.database}
        </span>
      )}

      {state === "error" && <span>Backend unreachable: {error}</span>}
    </div>
  );
}

export default BackendStatus;
