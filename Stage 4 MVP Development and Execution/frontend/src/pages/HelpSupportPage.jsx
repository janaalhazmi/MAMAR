import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import logo from "../assets/mamar-logo.svg";
import { getSession } from "../services/auth";

/* Adjust here if any of your routes are named differently */
const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  contractorDashboard: "/contractor-dashboard",
};

const SUPPORT_EMAIL = "support@mamar.sa";
const SUPPORT_PHONE = "+966 11 123 4567";
const SUPPORT_HOURS = "Sun – Thu, 9:00 AM – 6:00 PM (KSA)";

const NAV_LINKS = [
  { label: "Home", to: ROUTES.home },
  { label: "How it works", to: ROUTES.home },
  { label: "Services", to: ROUTES.home },
  { label: "For Contractors", to: ROUTES.home },
  { label: "For Field Workers", to: ROUTES.home },
];

const QUICK_HELP = [
  {
    id: "account",
    title: "Account & Login",
    description: "Create an account, reset password, and manage your profile.",
    icon: "user",
    faqId: "create-account",
  },
  {
    id: "posting",
    title: "Posting a Project",
    description: "Learn how to post, manage, and track your project.",
    icon: "folder",
    faqId: "post-project",
  },
  {
    id: "hiring",
    title: "Hiring & Working",
    description: "Guides for contractors and field workers.",
    icon: "users",
    faqId: "find-hire",
  },
  {
    id: "payments",
    title: "Payments & Invoices",
    description: "Information about payments, invoices, and fees.",
    icon: "card",
    faqId: "payments",
  },
];

const FAQS = [
  {
    id: "create-account",
    question: "How do I create an account on MAMAR?",
    answer:
      "Select Get Started, choose your role (Contractor, Provider, or Field Worker), and enter your details. We email you a verification code to confirm your address; enter it to finish creating your account, then sign in with your email and password. Providers and field workers may be asked for an additional provider ID.",
  },
  {
    id: "post-project",
    question: "How do I post a project?",
    answer:
      "Sign in as a contractor and choose Create Project. Follow the four steps: add your project details, search for the road or neighborhood and draw your work zone on the map, select the traffic-control services you need, then review and confirm. You can edit any step from the review page before you confirm.",
  },
  {
    id: "find-hire",
    question: "How do I find and hire a contractor or field worker?",
    answer:
      "After you confirm a project, MAMAR takes you to Providers, where you can browse traffic-control providers. Providers send quotations for your project, which you can review under Quotations before you decide. Field workers are linked to provider companies, so you work with them through the provider you select.",
  },
  {
    id: "manage-project",
    question: "How do I manage my project?",
    answer:
      "Open My Projects from the dashboard to see your projects with their location, dates, and status (for example In Progress, Pending Quotes, Completed, or Planned). Recent Activity on the dashboard shows new quotes and status updates.",
  },
  {
    id: "payments",
    question: "How do payments work?",
    answer:
      "Providers submit a quotation with itemized pricing and a total for your project, and you review it under Quotations. For questions about invoices, payments, or fees that a quotation doesn’t answer, contact support at support@mamar.sa.",
  },
  {
    id: "area",
    question: "Is MAMAR available in my area?",
    answer:
      "MAMAR currently supports projects in Riyadh, Saudi Arabia, and the location search and work-zone map are focused on Riyadh. If your project is somewhere else, contact support and we’ll let you know.",
  },
  {
    id: "reset-password",
    question: "How can I reset my password?",
    answer:
      "On the sign-in page, choose Forgot password and follow the instructions. If you don’t receive an email, check your spam folder or contact support.",
  },
  {
    id: "contact",
    question: "Where can I contact support if I have another question?",
    answer:
      "Email support@mamar.sa, call +966 11 123 4567, or send a message with the form on this page. Support hours are Sunday to Thursday, 9:00 AM to 6:00 PM (KSA).",
  },
];

const TOPICS = [
  "Account & Login",
  "Posting a Project",
  "Hiring & Working",
  "Payments & Invoices",
  "Other",
];

const STOP_WORDS = new Set([
  "a", "an", "the", "i", "my", "me", "to", "do", "how", "can", "is", "in",
  "of", "for", "and", "or", "on", "it", "e.g",
]);

const ICON_PATHS = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
    </>
  ),
  folder: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M17 14c2.8 0 4.5 2 4.5 5" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  phone: (
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
};

function Icon({ name, size = 22 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

function getSearchTerms(query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const meaningful = words.filter(
    (word) => word.length > 1 && !STOP_WORDS.has(word)
  );

  return meaningful.length > 0 ? meaningful : words;
}

function scoreText(text, terms) {
  const lower = text.toLowerCase();

  return terms.reduce((total, term) => total + (lower.includes(term) ? 1 : 0), 0);
}

function formatRole(role) {
  if (!role) return "";

  const label = String(role).replace(/[_-]+/g, " ");

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function HelpSupportPage() {
  // Signed-in visitors see their name in the header; guests (e.g. coming
  // from the landing page) see Sign in / Get Started instead.
  const sessionUser = getSession()?.user || null;
  const isSignedIn = Boolean(sessionUser);
  const displayName = sessionUser?.full_name?.trim() || "User";
  const roleLabel = formatRole(sessionUser?.role);

  const faqRef = useRef(null);
  const contactRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  const [form, setForm] = useState({
    name: sessionUser?.full_name?.trim() || "",
    email: sessionUser?.email || "",
    topic: "",
    message: "",
  });
  const [formError, setFormError] = useState("");
  const [formStatus, setFormStatus] = useState("");

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;
  const terms = isSearching ? getSearchTerms(trimmedQuery) : [];

  const quickResults = isSearching
    ? QUICK_HELP.map((item) => ({
        item,
        score: scoreText(`${item.title} ${item.description}`, terms),
      }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.item)
    : QUICK_HELP;

  const faqResults = isSearching
    ? FAQS.map((item) => ({
        item,
        score: scoreText(`${item.question} ${item.answer}`, terms),
      }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.item)
    : FAQS;

  const noResults =
    isSearching && quickResults.length === 0 && faqResults.length === 0;

  function scrollTo(ref) {
    window.requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    if (isSearching) scrollTo(faqRef);
  }

  function clearSearch() {
    setQuery("");
  }

  function handleQuickHelp(item) {
    setQuery("");
    setOpenFaq(item.faqId);
    scrollTo(faqRef);
  }

  function handleViewAll() {
    setQuery("");
    scrollTo(faqRef);
  }

  function toggleFaq(id) {
    setOpenFaq((current) => (current === id ? null : id));
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({ ...previous, [name]: value }));
    setFormError("");
    setFormStatus("");
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();

    if (!name || !email || !form.topic || !message) {
      setFormError("Please fill in all fields before sending.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    // No support endpoint exists yet, so the message is prepared as an
    // email to the support address in the visitor's mail app.
    const subject = `[${form.topic}] Support request from ${name}`;
    const body = `Name: ${name}\nEmail: ${email}\nTopic: ${form.topic}\n\n${message}`;

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    setFormError("");
    setFormStatus(
      `Your email app should open with your message ready to send. If it doesn’t, email us at ${SUPPORT_EMAIL}.`
    );
  }

  const userChip = (
    <>
      <span className="hs-user-avatar">
        {displayName.charAt(0).toUpperCase()}
      </span>
      <span className="hs-user-info">
        <strong>{displayName}</strong>
        {roleLabel && <span>{roleLabel}</span>}
      </span>
    </>
  );

  return (
    <div className="hs-page">
      {/* Header */}
      <header className="hs-header">
        <Link to={ROUTES.home} className="hs-logo" aria-label="MAMAR home">
          <img src={logo} alt="MAMAR" />
        </Link>

        <nav
          id="hs-nav"
          className={`hs-nav ${menuOpen ? "open" : ""}`}
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <Link
            to="/help"
            className="hs-nav-current"
            aria-current="page"
            onClick={() => setMenuOpen(false)}
          >
            Help &amp; Support
          </Link>

          {!isSignedIn && (
            <Link to={ROUTES.login} className="hs-nav-signin">
              Sign in
            </Link>
          )}
        </nav>

        <div className="hs-header-actions">
          {isSignedIn ? (
            sessionUser.role === "contractor" ? (
              <Link to={ROUTES.contractorDashboard} className="hs-user">
                {userChip}
              </Link>
            ) : (
              <div className="hs-user">{userChip}</div>
            )
          ) : (
            <>
              <Link to={ROUTES.login} className="hs-btn hs-btn-light hs-signin">
                Sign in
              </Link>
              <Link to={ROUTES.signup} className="hs-btn hs-btn-primary">
                Get Started
              </Link>
            </>
          )}

          <button
            type="button"
            className="hs-menu-button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="hs-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? "close" : "menu"} size={24} />
          </button>
        </div>
      </header>

      {/* Hero + search */}
      <section className="hs-hero">
        <div className="hs-hero-deco" aria-hidden="true" />

        <div className="hs-container hs-hero-inner">
          <p className="hs-eyebrow">HELP &amp; SUPPORT</p>

          <h1>
            We’re here
            <span>to help.</span>
          </h1>

          <p className="hs-hero-text">
            Find answers, guides, and support to make the most of MAMAR.
          </p>

          <form
            className="hs-search"
            role="search"
            onSubmit={handleSearchSubmit}
          >
            <span className="hs-search-icon">
              <Icon name="search" size={22} />
            </span>

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for help (e.g. create account, post a project, payment)"
              aria-label="Search for help"
            />

            <button type="submit">Search</button>
          </form>
        </div>
      </section>

      {isSearching && (
        <div className="hs-container">
          <div className="hs-search-status" role="status">
            <span>
              {quickResults.length + faqResults.length === 0
                ? "No results"
                : `${quickResults.length + faqResults.length} result${
                    quickResults.length + faqResults.length === 1 ? "" : "s"
                  }`}{" "}
              for “{trimmedQuery}”
            </span>

            <button type="button" onClick={clearSearch}>
              Clear search
            </button>
          </div>
        </div>
      )}

      {noResults && (
        <div className="hs-container">
          <div className="hs-no-results">
            <h2>We couldn’t find a match</h2>
            <p>
              Try different words, or send us a message and our team will
              help.
            </p>
            <button
              type="button"
              className="hs-btn hs-btn-primary"
              onClick={() => scrollTo(contactRef)}
            >
              Contact support
            </button>
          </div>
        </div>
      )}

      {/* Quick Help */}
      {quickResults.length > 0 && (
        <section className="hs-quick">
          <div className="hs-container">
            <h2 className="hs-section-title">Quick Help</h2>
            <p className="hs-section-text">
              Get help with common tasks and find useful resources.
            </p>

            <div className="hs-quick-grid">
              {quickResults.map((item) => (
                <button
                  type="button"
                  className="hs-quick-card"
                  key={item.id}
                  onClick={() => handleQuickHelp(item)}
                >
                  <span className="hs-quick-icon">
                    <Icon name={item.icon} size={24} />
                  </span>

                  <span className="hs-quick-info">
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </span>

                  <span className="hs-quick-arrow">
                    <Icon name="chevronRight" size={20} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqResults.length > 0 && (
        <section className="hs-faq" id="faq" ref={faqRef}>
          <div className="hs-container">
            <div className="hs-faq-heading">
              <div>
                <h2 className="hs-section-title">Frequently Asked Questions</h2>
                <p className="hs-section-text">
                  Find answers to the most common questions about MAMAR.
                </p>
              </div>

              <button
                type="button"
                className="hs-link-button"
                onClick={handleViewAll}
              >
                View all FAQs →
              </button>
            </div>

            <div className="hs-faq-list">
              {faqResults.map((faq) => {
                const isOpen = openFaq === faq.id;

                return (
                  <div
                    className={`hs-faq-item ${isOpen ? "open" : ""}`}
                    key={faq.id}
                  >
                    <h3>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${faq.id}`}
                        id={`faq-button-${faq.id}`}
                        onClick={() => toggleFaq(faq.id)}
                      >
                        <span>{faq.question}</span>
                        <span className="hs-faq-chevron">
                          <Icon name="chevronDown" size={22} />
                        </span>
                      </button>
                    </h3>

                    {isOpen && (
                      <div
                        className="hs-faq-answer"
                        id={`faq-panel-${faq.id}`}
                        role="region"
                        aria-labelledby={`faq-button-${faq.id}`}
                      >
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section className="hs-contact" id="contact" ref={contactRef}>
        <div className="hs-container hs-contact-grid">
          <div className="hs-contact-info">
            <p className="hs-contact-eyebrow">CONTACT SUPPORT</p>
            <h2>Still need help?</h2>
            <p className="hs-section-text">
              Our support team is here to assist you.
            </p>

            <ul className="hs-contact-list">
              <li>
                <span className="hs-contact-icon">
                  <Icon name="mail" />
                </span>
                <div>
                  <strong>Email Us</strong>
                  <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                </div>
              </li>

              <li>
                <span className="hs-contact-icon">
                  <Icon name="phone" />
                </span>
                <div>
                  <strong>Call Us</strong>
                  <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}>
                    {SUPPORT_PHONE}
                  </a>
                </div>
              </li>

              <li>
                <span className="hs-contact-icon">
                  <Icon name="clock" />
                </span>
                <div>
                  <strong>Support Hours</strong>
                  <span>{SUPPORT_HOURS}</span>
                </div>
              </li>
            </ul>
          </div>

          <form className="hs-form" onSubmit={handleFormSubmit} noValidate>
            <h2>Send us a message</h2>
            <p className="hs-form-text">
              Fill out the form below and we’ll get back to you as soon as
              possible.
            </p>

            <div className="hs-form-row">
              <div className="hs-field">
                <label htmlFor="hs-name">Full Name</label>
                <input
                  id="hs-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={handleFormChange}
                />
              </div>

              <div className="hs-field">
                <label htmlFor="hs-email">Email Address</label>
                <input
                  id="hs-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="hs-field">
              <label htmlFor="hs-topic">Subject</label>
              <select
                id="hs-topic"
                name="topic"
                value={form.topic}
                onChange={handleFormChange}
              >
                <option value="" disabled>
                  Select a topic
                </option>
                {TOPICS.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            <div className="hs-field">
              <label htmlFor="hs-message">Message</label>
              <textarea
                id="hs-message"
                name="message"
                rows={5}
                placeholder="Describe your issue or question..."
                value={form.message}
                onChange={handleFormChange}
              />
            </div>

            {formError && (
              <p className="hs-form-error" role="alert">
                {formError}
              </p>
            )}

            {formStatus && (
              <p className="hs-form-success" role="status">
                {formStatus}
              </p>
            )}

            <button type="submit" className="hs-btn hs-btn-primary hs-submit">
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="hs-footer">
        <div className="hs-container hs-footer-grid">
          <div className="hs-footer-brand">
            <Link to={ROUTES.home} aria-label="MAMAR home">
              <img src={logo} alt="MAMAR" />
            </Link>
            <p>© 2026 MAMAR. All rights reserved.</p>
          </div>

          <div className="hs-footer-column">
            <strong>Product</strong>
            <Link to={ROUTES.home}>How it Works</Link>
            <Link to={ROUTES.home}>Services</Link>
          </div>

          <div className="hs-footer-column">
            <strong>For</strong>
            <Link to={ROUTES.home}>Contractors</Link>
            <Link to={ROUTES.home}>Field Workers</Link>
          </div>

          <div className="hs-footer-column">
            <strong>Company</strong>
            <Link to={ROUTES.home}>About Us</Link>
            <Link to={ROUTES.home}>Resources</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HelpSupportPage;
