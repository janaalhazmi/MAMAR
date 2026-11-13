import { Link } from "react-router-dom";
import ContractorShell from "../../components/ContractorShell";
import "../../styles/Weblogin/data-disclaimer.css";

const disclaimerSections = [
  {
    number: "01",
    title: "Information accuracy",
    text: "Project details, service descriptions, schedules, prices, quotations, and other information may be entered or updated by contractors and service providers. MAMAR does not independently verify every submission. Please review important details with the relevant party before making a decision.",
  },
  {
    number: "02",
    title: "Quotations and service providers",
    text: "Quotations, estimated costs, timelines, and service descriptions are provided by the respective service providers. They are proposals, not a guarantee of final cost, availability, quality, or completion date. Confirm the agreed scope and terms with the provider before work begins.",
  },
  {
    number: "03",
    title: "Location and map information",
    text: "Map locations, work-zone boundaries, and location-based information are provided for planning and coordination. They may be approximate or affected by device accuracy and third-party map data. Always verify the work area and site conditions on location.",
  },
  {
    number: "04",
    title: "Platform availability and external services",
    text: "Some features may depend on internet access, device permissions, or services provided by third parties. MAMAR cannot guarantee uninterrupted availability or the accuracy and continued operation of external services.",
  },
  {
    number: "05",
    title: "Your responsibility when submitting data",
    text: "You are responsible for ensuring that information and files you submit are accurate, lawful, and appropriate to share. Do not upload passwords, payment-card details, government identification numbers, or other sensitive information unless a feature specifically requests it through an approved secure process.",
  },
  {
    number: "06",
    title: "Privacy and data use",
    text: "This disclaimer explains limitations relating to information shown or submitted through MAMAR. It is not a full privacy policy. The collection, use, retention, and sharing of personal data should be explained in MAMAR’s separate Privacy Policy and applicable notices.",
  },
];

function DataDisclaimerPage() {
  return (
    <ContractorShell>
      <div className="data-disclaimer-page">
        <div className="dd-content">
          <Link to="/contractor-dashboard" className="dd-back-link">
            <span aria-hidden="true">←</span> Back to Dashboard
          </Link>

          <header className="dd-hero">
            <div className="dd-eyebrow">MAMAR · INFORMATION NOTICE</div>
            <h1>Data Disclaimer</h1>
            <p>
              Important information about the data displayed, submitted, and
              used through the MAMAR platform.
            </p>
            <div className="dd-status">
              <span className="dd-status-dot" />
              Please read before using platform information
            </div>
          </header>

          <section className="dd-intro-card" aria-label="Important notice">
            <div className="dd-info-icon" aria-hidden="true">i</div>
            <div>
              <h2>Information may change</h2>
              <p>
                MAMAR is a platform for project coordination and connecting
                contractors with service providers. Information shown in the
                platform is provided for general operational purposes and
                should be checked before you rely on it for important decisions.
              </p>
            </div>
          </section>

          <section className="dd-sections" aria-label="Data disclaimer details">
            {disclaimerSections.map((section) => (
              <article className="dd-section-card" key={section.number}>
                <span className="dd-section-number">{section.number}</span>
                <div>
                  <h2>{section.title}</h2>
                  <p>{section.text}</p>
                </div>
              </article>
            ))}
          </section>

          <footer className="dd-footer-note">
            <strong>By continuing to use MAMAR</strong>
            <p>
              You acknowledge that you have read this notice. This page is an
              informational disclaimer and does not replace the platform’s
              Terms of Use, Privacy Policy, or any written agreement between
              project parties. Have questions about a specific item of data?
              Contact the relevant project party or MAMAR support.
            </p>
          </footer>
        </div>
      </div>
    </ContractorShell>
  );
}

export default DataDisclaimerPage;
