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
    <section className="ai-card sum-card" aria-label="AI daily summary">
      <div className="sum-intro">
        <div className="sum-icon" aria-hidden="true">📝</div>
        <div className="sum-title">
          <h2>Today&apos;s Summary <span className="ai-tag">✨ AI</span></h2>
          <p>Written from today&apos;s attendance, safety checks, weather, traffic and activity.</p>
        </div>
        <button type="button" className="sum-refresh" onClick={() => load(true)} disabled={busy}>
          {busy ? "Writing…" : "Refresh"}
        </button>
      </div>

      {error && <p className="ai-error">{error}</p>}
      {!report && !error && <p className="sum-wait">Writing today&apos;s summary…</p>}

      {report && (
        <div className="sum-body">
          <p className="sum-headline">{report.headline}</p>
          <p className="sum-text">{report.summary}</p>

          <div className="sum-cols">
            {report.highlights.length > 0 && (
              <div>
                <h3>Highlights</h3>
                <ul className="sum-list">
                  {report.highlights.map((item) => (
                    <li key={item}><span className="sum-mark ok" aria-hidden="true">✓</span>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h3>Needs attention</h3>
              {report.risks.length > 0 ? (
                <ul className="sum-list">
                  {report.risks.map((item) => (
                    <li key={item}><span className="sum-mark bad" aria-hidden="true">!</span>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="sum-none">Nothing today 👍</p>
              )}
            </div>
          </div>

          <p className="sum-foot">Report for {report.date} · AI can make mistakes, check the important facts.</p>
        </div>
      )}
    </section>
  );
}
