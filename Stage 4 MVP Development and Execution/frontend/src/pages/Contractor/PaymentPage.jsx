import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ContractorShell from "../../components/ContractorShell";
import {
  formatPrice,
  getCurrentProject,
  handleConfirmProvider,
  getConfirmedQuotationId,
} from "../../services/Contractor/Contractor";


function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const project = location.state?.project || getCurrentProject();
  const quotation = location.state?.quotation || null;

  const [method, setMethod] = useState("card");
  const [cardholder, setCardholder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const paymentLock = useRef(false);

  // Keep a record per quotation so returning to this page cannot pay it twice.
  function getQuotationPaymentKey() {
    if (quotation?.id !== undefined && quotation?.id !== null) {
      return `quotation-${quotation.id}`;
    }
    return `project-${project?.id ?? project?.name ?? "unknown"}-provider-${quotation?.providerName ?? "unknown"}`;
  }

  function readSavedPayment() {
    try {
      const records = JSON.parse(sessionStorage.getItem("mamarDemoPayments") || "{}");
      return records[getQuotationPaymentKey()] || null;
    } catch {
      return null;
    }
  }

  const [existingPayment, setExistingPayment] = useState(() => readSavedPayment());

  const amount = Number(quotation?.totalPrice || 0);

  function formatCardNumber(value) {
    return value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  }

  function formatExpiry(value) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length < 3) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  function validateCard() {
    const digits = cardNumber.replace(/\s/g, "");
    if (!cardholder.trim()) return "Please enter the cardholder name.";
    if (digits.length !== 16) return "Enter a valid 16-digit test card number.";
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return "Enter expiry as MM/YY.";
    const [month] = expiry.split("/").map(Number);
    if (month < 1 || month > 12) return "Enter a valid expiry month.";
    if (!/^\d{3,4}$/.test(cvv)) return "Enter a valid test CVV.";
    return "";
  }

  async function finishDemoPayment() {
  if (paymentLock.current || readSavedPayment()) {
    setExistingPayment(readSavedPayment());
    setError("This quotation has already been paid in demo mode.");
    return;
  }

  paymentLock.current = true;
  setProcessing(true);
  setError("");

  try {
    // Check whether this quotation was already confirmed.
    const confirmedId = getConfirmedQuotationId();

    if (String(confirmedId) !== String(quotation.id)) {
      // Send confirmation to backend.
      await handleConfirmProvider(project, quotation);
    }

    // Demo payment only.
    await new Promise((resolve) => setTimeout(resolve, 900));

    const reference = `DEMO-${Date.now().toString().slice(-8)}`;

    const demoRecord = {
      reference,
      projectName: project?.name || "Project",
      quotationId: quotation.id,
      providerName: quotation.providerName || "Selected provider",
      amount,
      method,
      status: "demo-paid",
      createdAt: new Date().toISOString(),
    };

    const records = JSON.parse(
      sessionStorage.getItem("mamarDemoPayments") || "{}"
    );

    records[getQuotationPaymentKey()] = demoRecord;

    sessionStorage.setItem(
      "mamarDemoPayments",
      JSON.stringify(records)
    );

    sessionStorage.setItem(
      "mamarLastDemoPayment",
      JSON.stringify(demoRecord)
    );

    setPaymentReference(reference);
    setExistingPayment(demoRecord);
    setPaid(true);

  } catch (err) {
    setError(
      err?.message ||
      "Could not confirm the quotation with the server."
    );

    paymentLock.current = false;

  } finally {
    setProcessing(false);
  }
}

  function handlePay() {
    if (paymentLock.current || readSavedPayment()) {
      setExistingPayment(readSavedPayment());
      setError("This quotation has already been paid in demo mode. Duplicate payment is blocked.");
      return;
    }
    if (!quotation) {
      setError("Quotation details are missing. Please return to Quotations and accept a quote again.");
      return;
    }

    if (method === "card") {
      const validationError = validateCard();
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    finishDemoPayment();
  }

  if (existingPayment && !paid) {
    return (
      <ContractorShell activeKey="quotations">
        <div className="payment-page">
          <section className="payment-success-card">
            <div className="payment-success-mark">✓</div>
            <p className="payment-eyebrow">ALREADY COMPLETED</p>
            <h1>This quotation is already paid</h1>
            <p className="payment-success-copy">
              A demo payment has already been recorded for this quotation.
              You cannot pay for the same quotation twice.
            </p>
            <div className="payment-reference">
              <span>Existing demo reference</span>
              <strong>{existingPayment.reference}</strong>
            </div>
            <button className="payment-primary-button" type="button" onClick={() => navigate("/quotations")}>
              Back to Quotations
            </button>
          </section>
        </div>
      </ContractorShell>
    );
  }

  if (paid) {
    return (
      <ContractorShell activeKey="quotations">
        <div className="payment-page">
          <section className="payment-success-card">
            <div className="payment-success-mark">✓</div>
            <p className="payment-eyebrow">DEMO PAYMENT COMPLETE</p>
            <h1>Payment successful!</h1>
            <p className="payment-success-copy">
              This is a simulated payment. No money was charged and no card
              details were sent to a payment provider.
            </p>
            <div className="payment-reference">
              <span>Demo reference</span>
              <strong>{paymentReference}</strong>
            </div>
            <div className="payment-success-details">
              <div><span>Project</span><strong>{project?.name || "—"}</strong></div>
              <div><span>Provider</span><strong>{quotation?.providerName || "—"}</strong></div>
              <div><span>Amount</span><strong>{formatPrice(amount)}</strong></div>
            </div>
            <button
              className="payment-primary-button"
              type="button"
              onClick={() => navigate("/quotations")}
            >
              Back to Quotations
            </button>
          </section>
        </div>
      </ContractorShell>
    );
  }

  return (
    <ContractorShell activeKey="quotations">
      <div className="payment-page">
        <div className="payment-heading">
          <div>
            <p className="payment-eyebrow">SECURE CHECKOUT · DEMO MODE</p>
            <h1>Complete your payment</h1>
            <p>Review the accepted quotation and choose a payment method.</p>
          </div>
          <span className="payment-demo-badge">Test only · No real charge</span>
        </div>

        <div className="payment-layout">
          <section className="payment-panel">
            <h2>Payment method</h2>
            <p className="payment-muted">Choose how you want to simulate the payment.</p>

            <div className="payment-methods">
              <button
                type="button"
                className={`payment-method ${method === "card" ? "selected" : ""}`}
                onClick={() => { setMethod("card"); setError(""); }}
              >
                <span className="payment-method-symbol">▰</span>
                <span><strong>Credit / Debit Card</strong><small>Visa, Mastercard</small></span>
                <span className="payment-radio">{method === "card" ? "●" : "○"}</span>
              </button>

              <button
                type="button"
                className={`payment-method ${method === "apple" ? "selected" : ""}`}
                onClick={() => { setMethod("apple"); setError(""); }}
              >
                <span className="payment-apple">●</span>
                <span><strong>Apple Pay <em className="payment-inline-demo">DEMO</em></strong><small>Visual simulation only · Not connected to Apple Wallet</small></span>
                <span className="payment-radio">{method === "apple" ? "●" : "○"}</span>
              </button>
            </div>

            {method === "card" ? (
              <div className="payment-form">
                <label>
                  Cardholder name
                  <input
                    value={cardholder}
                    onChange={(event) => setCardholder(event.target.value)}
                    placeholder="Name on card"
                    autoComplete="off"
                  />
                </label>

                <label>
                  Card number
                  <input
                    value={cardNumber}
                    onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                    placeholder="1234 5678 9012 3456"
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </label>

                <div className="payment-form-row">
                  <label>
                    Expiry date
                    <input
                      value={expiry}
                      onChange={(event) => setExpiry(formatExpiry(event.target.value))}
                      placeholder="MM/YY"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                  </label>
                  <label>
                    CVV
                    <input
                      value={cvv}
                      onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                  </label>
                </div>
                <p className="payment-demo-note">
                  Use any 16 digits, a valid month in MM/YY format, and 3–4 CVV digits.
                  These are test-only fields; do not enter real card details.
                </p>
              </div>
            ) : (
              <div className="payment-apple-info">
                <div className="payment-apple-large"> Pay <span>DEMO</span></div>
                <strong className="payment-apple-demo-title">Apple Pay is not connected</strong>
                <p>
                  This is a visual demonstration for the MAMAR project only.
                  Selecting “Simulate Apple Pay” will show a sample success
                  screen. It will not open Apple Wallet, contact your bank, or
                  charge any money.
                </p>
              </div>
            )}

            {error && <p className="payment-error" role="alert">{error}</p>}

            <button
              type="button"
              className={`payment-primary-button ${method === "apple" ? "apple-button" : ""}`}
              onClick={handlePay}
              disabled={processing}
            >
              {processing
                ? "Processing demo payment…"
                : method === "apple"
                  ? "Simulate Apple Pay (Demo)"
                  : `Pay ${formatPrice(amount)}`}
            </button>

            <p className="payment-security-note">
              DEMO ONLY — No real payment is processed. No payment gateway is connected.
            </p>
          </section>

          <aside className="payment-panel payment-summary">
            <h2>Order summary</h2>
            <div className="payment-summary-row">
              <span>Project</span>
              <strong>{project?.name || "Not available"}</strong>
            </div>
            <div className="payment-summary-row">
              <span>Provider</span>
              <strong>{quotation?.providerName || "Not available"}</strong>
            </div>
            <div className="payment-summary-row">
              <span>Quotation ID</span>
              <strong>{quotation?.id ?? "—"}</strong>
            </div>
            <div className="payment-summary-divider" />
            <div className="payment-total-row">
              <span>Total due</span>
              <strong>{formatPrice(amount)}</strong>
            </div>
            <p className="payment-summary-footnote">
              The total is taken from the selected provider quotation.
            </p>
            <button
              type="button"
              className="payment-back-button"
              onClick={() => navigate("/quotations")}
            >
              ← Back to Quotations
            </button>
          </aside>
        </div>
      </div>
    </ContractorShell>
  );
}

export default PaymentPage;
