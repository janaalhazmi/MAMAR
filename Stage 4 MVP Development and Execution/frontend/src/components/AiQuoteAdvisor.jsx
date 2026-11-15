import { useState } from "react";
import { getSession } from "../services/auth";
import { fetchQuoteComparison } from "../services/api";
import { useAiEnabled } from "../services/ai";
import "../styles/ai.css";

// "AI recommendation" on Quotations: for each project with two or more open quotations, Claude
// compares price, duration, start date, rating and notes. The contractor still decides.
// projects = [{ id, name, count }]; onResult(projectId, result) lets the page mark the AI pick.
export default function AiQuoteAdvisor({ projects, onResult }) {
  const enabled = useAiEnabled();
  const [results, setResults] = useState({});
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  if (!enabled || projects.length === 0) return null;

  async function compare(projectId, refresh = false) {
    setBusy(projectId);
    setError("");
    try {
      const result = await fetchQuoteComparison(getSession()?.access_token, projectId, refresh);
      setResults((current) => ({ ...current, [projectId]: result }));
      onResult?.(projectId, result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="ai-card" aria-label="AI quotation advisor">
      <div className="ai-head">
        <div>
          <span className="ai-tag">✨ AI</span>
          <h2>Not sure which quotation to pick?</h2>
          <p>Claude compares the price, duration, start date, rating and notes of each provider. You make the final choice.</p>
        </div>
      </div>
      {error && <p className="ai-error">{error}</p>}
      <div className="ai-advice-list">
        {projects.map((project) => {
          const result = results[project.id];
          return (
            <div key={project.id} className="ai-advice-row">
              <div className="ai-advice-top">
                <div>
                  <b>{project.name}</b>
                  <small>{project.count} quotations to compare</small>
                </div>
                <button type="button" className="ai-btn" onClick={() => compare(project.id, Boolean(result))} disabled={busy === project.id}>
                  {busy === project.id ? "Comparing…" : result ? "Compare again" : "✨ Compare with AI"}
                </button>
              </div>
              {result && (
                <div className="ai-compare">
                  {result.recommended_company && (
                    <p className="ai-headline">🏆 Suggested: {result.recommended_company}</p>
                  )}
                  <p>{result.headline}</p>
                  <div className="ai-compare-grid">
                    {result.quotes.map((quote) => (
                      <div key={quote.quote_id} className={quote.quote_id === result.recommended_quote_id ? "pick" : ""}>
                        <b>{quote.company}</b>
                        <ul>
                          {quote.pros.map((pro) => <li key={pro} className="pro">+ {pro}</li>)}
                          {quote.cons.map((con) => <li key={con} className="con">− {con}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                  {result.tip && <p className="ai-advice">💡 {result.tip}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="ai-foot">AI can make mistakes. Read the quotations before you confirm a provider.</p>
    </section>
  );
}
