import Header from "../components/Header";
import Footer from "../components/Footer";
import Button from "../components/Button";

import hero from "../assets/hero.jpg";

import tcm from "../assets/provider-tcm.jpg";
import safetyArabia from "../assets/provider-safety-arabia.jpg";
import shawahid from "../assets/provider-shawahid.jpg";
import safetyTriangle from "../assets/provider-safety-triangle.jpg";

const steps = [
  {
    number: "1",
    title: "Define Your Project",
    description:
      "Tell us about your project, scope, timeline, and traffic-control needs.",
  },
  {
    number: "2",
    title: "Map Work Zone",
    description:
      "Define the project work zone using MAMAR's map-based tools.",
  },
  {
    number: "3",
    title: "Request & Compare Quotes",
    description:
      "Request services and compare quotations from qualified providers.",
  },
  {
    number: "4",
    title: "Manage & Verify Execution",
    description:
      "Follow project execution and verify field installations.",
  },
];

const providers = [
  {
    image: tcm,
    alt: "TCM",
    name: "TCM",
    description: "Traffic and Construction Management",
  },
  {
    image: safetyArabia,
    alt: "Safety Arabia",
    name: "Safety Arabia Co. LTD",
  },
  {
    image: shawahid,
    alt: "Shawahid Roads",
    name: "Shawahid Roads Industrial Co.",
  },
  {
    image: safetyTriangle,
    alt: "Safety Triangle",
    name: "Safety Triangle Company",
  },
];

const benefits = [
  {
    title: "Location-Based Coordination",
    description:
      "Manage project work zones and roadwork locations through map-based coordination.",
  },
  {
    title: "Qualified Providers",
    description:
      "Connect contractors with traffic-control service providers.",
  },
  {
    title: "Smarter Procurement",
    description:
      "Request, compare, and select provider quotations in one workflow.",
  },
  {
    title: "Verified Field Execution",
    description:
      "Support field verification using device location and installation evidence.",
  },
];

function LandingPage() {
  return (
    <div className="landing-page">
      <Header />

      <main>
        {/* Hero */}
        <section className="hero">
          <img
            src={hero}
            alt="Roadwork"
            className="hero-image"
          />

          <div className="hero-content">
            <h1>
              <span className="hero-gray">
                Manage Roadwork
              </span>

              <span className="hero-yellow">
                Coordinate Every Move.
              </span>
            </h1>

            <div className="hero-actions">
              <Button to="/register">
                Start a Project →
              </Button>

              <a
                href="#how-mamar-works"
                className="outline-btn"
              >
                Explore MAMAR →
              </a>
            </div>
          </div>
        </section>

      {/* How MAMAR Works */}
<section
  className="how-section"
  id="how-mamar-works"
>
  <div className="how-title">
    <span className="how-title-text">How</span>
    <span className="how-title-highlight">MAMAR</span>
    <span className="how-title-text">Works</span>
  </div>

  <div className="steps-box">
    {steps.map((step) => (
      <article
        className="step-card"
        key={step.number}
      >
        <span className="step-number">
          {step.number}
        </span>

        <h3>{step.title}</h3>
        <p>{step.description}</p>
      </article>
    ))}
  </div>
</section>

{/* Providers */}
<section className="providers-section">
          <div className="providers-title">
            Featured Service Providers
          </div>

          <div className="providers-grid">
            {providers.map((provider) => (
              <article
                className="provider-card"
                key={provider.name}
              >
                <img
                  src={provider.image}
                  alt={provider.alt}
                />

                <h3>{provider.name}</h3>

                {provider.description && (
                  <p>{provider.description}</p>
                )}
              </article>
            ))}
          </div>
        </section>

       {/* Why MAMAR */}
<section className="why-section">
  <h2>
    Why <span>MAMAR?</span>
  </h2>

  <div className="why-grid">
    {benefits.map((benefit) => (
      <article key={benefit.title}>
        <h3>{benefit.title}</h3>
        <p>{benefit.description}</p>
      </article>
    ))}
  </div>
</section>

        {/* CTA */}
        <section className="cta-section">
          <div>
            <h2>
              Coordinate your next project with confidence.
            </h2>
          </div>

          <Button to="/register">
            Start a Project →
          </Button>
        </section>

      </main>

      <Footer/>
    </div>
  );
}

export default LandingPage;