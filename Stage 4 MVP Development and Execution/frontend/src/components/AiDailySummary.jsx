import { useCallback, useEffect, useState } from "react";
import { getSession } from "../services/auth";
import { fetchDailySummary } from "../services/api";
import { useAiEnabled } from "../services/ai";
import "../styles/ai.css";

// "Today's summary": Claude reads today's attendance, photo checks, weather, traffic and activity
// of the project and writes a short report. Saved for the day; Refresh writes it again.
export default function AiDailySummary({ projectId }) {
  const enabled = useAiEnabled();
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false) => {
    const token = getSession()?.access_token;
    if (!projectId || !token) return;
    setBusy(true);
    setError("");
    try {
      setReport(await fetchDailySummary(token, projectId, refresh));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!enabled) return undefined;
    const first = setTimeout(() => load(false), 0);
    return () => clearTimeout(first);
  }, [enabled, load]);

  if (!enabled || !projectId) return null;

  return (
    <section className="ai-card" aria-label="AI daily summary">
      <div className="ai-head">
        <div>
          <span className="ai-tag">✨ AI</span>
          <h2>Today&apos;s Summary</h2>
          <p>Written by Claude from today&apos;s attendance, safety checks, weather, traffic and activity.</p>
        </div>
        <button type="button" className="ai-btn ghost" onClick={() => load(true)} disabled={busy}>
          {busy ? "Writing…" : "Refresh"}
        </button>
      </div>
      {error && <p className="ai-error">{error}</p>}
      {!report && !error && <p className="ai-muted">Writing today&apos;s summary…</p>}
      {report && (
        <>
          <p className="ai-headline">{report.headline}</p>
          <p>{report.summary}</p>
          <div className="ai-cols">
            {report.highlights.length > 0 && (
              <div>
                <h3>Highlights</h3>
                <ul>{report.highlights.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            )}
            <div>
              <h3>Needs attention</h3>
              {report.risks.length > 0
                ? <ul className="ai-risks">{report.risks.map((item) => <li key={item}>{item}</li>)}</ul>
                : <p className="ai-muted">Nothing today 👍</p>}
            </div>
          </div>
          <p className="ai-foot">Report for {report.date} · AI can make mistakes, check the important facts.</p>
        </>
      )}
    </section>
  );
}
