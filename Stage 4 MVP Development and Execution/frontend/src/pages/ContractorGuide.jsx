import { Link } from "react-router-dom";
import {
  Check,
  UserPlus,
  FileText,
  MapPin,
  BadgeDollarSign,
  BarChart3,
  Clock3,
  Users,
  ShieldCheck,
  Eye,
  ArrowRight,
} from "lucide-react";
import logo from "../assets/mamar-logo.svg";

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: "Create your account",
    text: "Sign up as a contractor and access your workspace.",
  },
  {
    number: 2,
    icon: FileText,
    title: "Create a project",
    text: "Add dates, project details and traffic-control needs.",
  },
  {
    number: 3,
    icon: MapPin,
    title: "Define the work zone",
    text: "Select the project location and draw the area on the map.",
  },
  {
    number: 4,
    icon: BadgeDollarSign,
    title: "Compare quotations",
    text: "Receive provider offers and choose the best option.",
  },
  {
    number: 5,
    icon: BarChart3,
    title: "Track execution",
    text: "Follow progress and stay updated.",
  },
];

const benefits = [
  {
    icon: Clock3,
    title: "Save time",
    text: "Manage everything in one place.",
  },
  {
    icon: Users,
    title: "Coordinate clearly",
    text: "Keep project information organized.",
  },
  {
    icon: ShieldCheck,
    title: "Work with confidence",
    text: "Compare approved provider offers.",
  },
  {
    icon: Eye,
    title: "Full visibility",
    text: "Follow status from request to execution.",
  },
];

function ContractorGuide() {
  return (
    <div className="contractor-guide-page">
      <header className="contractor-guide-header">
        <Link to="/" className="contractor-guide-logo">
          <img src={logo} alt="MAMAR" />
        </Link>
      </header>

      <main className="contractor-guide-content">
        <section className="contractor-guide-hero">
          <div className="contractor-guide-hero-copy">
            <span className="contractor-guide-badge">
              FOR CONTRACTORS
            </span>

            <h1>
              Your guide to using <span>MAMAR</span>
            </h1>

            <p>
              Create projects, define your work zone, request quotations and
              follow execution — all from one simple platform built to make
              roadwork coordination easier.
            </p>
          </div>

          <div className="contractor-guide-highlights">
            <div>
              <span className="guide-highlight-icon yellow">
                <Check size={20} />
              </span>
              <section>
                <strong>Simple workflow</strong>
                <p>Everything in one place</p>
              </section>
            </div>

            <div>
              <span className="guide-highlight-icon blue">
                <Check size={20} />
              </span>
              <section>
                <strong>Trusted providers</strong>
                <p>Compare quotations easily</p>
              </section>
            </div>

            <div>
              <span className="guide-highlight-icon green">
                <Check size={20} />
              </span>
              <section>
                <strong>Clear project tracking</strong>
                <p>Know what is happening next</p>
              </section>
            </div>

            <div>
              <span className="guide-highlight-icon gray">
                <Check size={20} />
              </span>
              <section>
                <strong>Better coordination</strong>
                <p>Less manual follow-up</p>
              </section>
            </div>
          </div>
        </section>

        <section className="contractor-guide-how">
          <span className="contractor-guide-section-label">
            HOW IT WORKS
          </span>

          <h2>Start your project in five simple steps</h2>

          <div className="contractor-guide-steps">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div className="contractor-guide-step-wrap" key={step.number}>
                  <article className="contractor-guide-step">
                    <span className="contractor-guide-step-number">
                      {step.number}
                    </span>

                    <Icon className="contractor-guide-step-icon" size={45} />

                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </article>

                  {index < steps.length - 1 && (
                    <ArrowRight
                      className="contractor-guide-arrow"
                      size={21}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="contractor-guide-benefits">
          <span className="contractor-guide-section-label benefit-label">
            WHY CONTRACTORS USE MAMAR
          </span>

          <h2>Less admin. Better visibility. Safer projects.</h2>

          <div className="contractor-guide-benefit-grid">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <article
                  className="contractor-guide-benefit"
                  key={benefit.title}
                >
                  <span>
                    <Icon size={22} />
                  </span>

                  <div>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="contractor-guide-cta">
          <div>
            <h2>Ready to start your next project?</h2>
            <p>
              MAMAR helps you move from project setup to execution with less
              complexity.
            </p>
          </div>

          <Link to="/register" className="contractor-guide-cta-button">
            Create Account
            <ArrowRight size={17} />
          </Link>
        </section>
      </main>
    </div>
  );
}

export default ContractorGuide;
