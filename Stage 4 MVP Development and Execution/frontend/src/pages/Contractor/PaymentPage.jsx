import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ContractorShell from "../../components/ContractorShell";
import { getSession } from "../../services/auth";
import { downloadReceipt } from "../../services/api";
import {
  formatPrice,
  getCurrentProject,
  handleConfirmProvider,
  getConfirmedQuotationId,
} from "../../services/Contractor/Contractor";
import {
  clearPendingPayment,
  finishPayment,
  getCompletedPayment,
  readPendingPayment,
  startPayment,
} from "../../services/Contractor/payments";

// PayPal does not take SAR, so the backend charges the same amount in US dollars.
const SAR_PER_USD = 3.75;

function formatUsd(amount) {
  return `USD ${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // PayPal sends the contractor back to /payment/return or /payment/cancel with ?token=<order id>.
  const orderId = new URLSearchParams(location.search).get("token");
  const cancelledOnPayPal = location.pathname.startsWith("/payment/cancel");
  const backFromPayPal = Boolean(orderId) && (cancelledOnPayPal || location.pathname.startsWith("/payment/return"));
  // Read once: it is cleared after the payment is finished.
  const [pending] = useState(() => (backFromPayPal ? readPendingPayment() : null));

  const project = location.state?.project || pending?.project || getCurrentProject();
  const quotation = location.state?.quotation || pending?.quotation || null;

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [processing, setProcessing] = useState(false);
  const [checking, setChecking] = useState(true);
  const [paidPayment, setPaidPayment] = useState(null);
  const [existingPayment, setExistingPayment] = useState(null);
  const [receiptError, setReceiptError] = useState("");
  const paymentLock = useRef(false);
  const started = useRef(false);

  const amount = Number(quotation?.totalPrice || 0);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (backFromPayPal) {
      // Finish the payment the contractor approved (or cancelled) on PayPal.
      finishPayment(orderId, cancelledOnPayPal)
        .then((payment) => {
          if (cancelledOnPayPal) {
            setNotice("You cancelled the payment on PayPal. You can try again.");
          } else {
            setPaidPayment(payment);
            clearPendingPayment();
          }
        })
        .catch((err) => setError(err?.message || "Could not finish the payment."))
        .finally(() => setChecking(false));
      return;
    }

    // Opening the page again after paying shows the saved payment, so it cannot be paid twice.
    getCompletedPayment(project?.id)
      .then((payment) => setExistingPayment(payment))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [backFromPayPal, cancelledOnPayPal, orderId, project?.id]);

  async function handlePay() {
    if (paymentLock.current) return;
    if (!quotation) {
      setError("Quotation details are missing. Please return to Quotations and accept a quote again.");
      return;
    }

    paymentLock.current = true;
    setProcessing(true);
    setError("");
    setNotice("");

    try {
      // The quotation is confirmed first, so the backend knows what is being paid.
      if (String(getConfirmedQuotationId()) !== String(quotation.id)) {
        await handleConfirmProvider(project, quotation);
      }
      // Opens the PayPal sandbox page. PayPal brings the contractor back to this page.
      await startPayment(project, quotation);
    } catch (err) {
      setError(err?.message || "Could not start the payment. Please try again.");
      paymentLock.current = false;
      setProcessing(false);
    }
  }

  if (checking) {
    return (
      <ContractorShell activeKey="quotations">
        <div className="payment-page">
          <section className="payment-success-card">
            <p className="payment-eyebrow">PAYPAL SANDBOX</p>
            <h1>{backFromPayPal ? "Finishing your payment…" : "Loading…"}</h1>
          </section>
        </div>
      </ContractorShell>
    );
  }

  if (paidPayment || existingPayment) {
    const payment = paidPayment || existingPayment;
    return (
      <ContractorShell activeKey="quotations">
        <div className="payment-page">
          <section className="payment-success-card">
            <div className="payment-success-mark">✓</div>
            <p className="payment-eyebrow">
              {paidPayment ? "PAYMENT COMPLETE · PAYPAL SANDBOX" : "ALREADY COMPLETED"}
            </p>
            <h1>{paidPayment ? "Payment successful!" : "This quotation is already paid"}</h1>
            <p className="payment-success-copy">
              {paidPayment
                ? "Paid through PayPal in sandbox mode. No real money was charged."
                : "A payment is already saved for this project. You cannot pay for it twice."}
            </p>
            <div className="payment-reference">
              <span>PayPal reference</span>
              <strong>{payment.paypal_order_id}</strong>
            </div>
            <div className="payment-success-details">
              <div><span>Project</span><strong>{project?.name || `Project #${payment.project_id}`}</strong></div>
              <div><span>Provider</span><strong>{quotation?.providerName || "—"}</strong></div>
              <div><span>Amount</span><strong>{formatPrice(payment.amount)}</strong></div>
              <div><span>Charged on PayPal</span><strong>{formatUsd(payment.charged_amount)}</strong></div>
            </div>
            {receiptError && <p className="payment-error" role="alert">{receiptError}</p>}
            <button
              className="payment-back-button"
              type="button"
              onClick={() => {
                setReceiptError("");
                downloadReceipt(getSession()?.access_token, payment.payment_id).catch((err) =>
                  setReceiptError(err.message)
                );
              }}
            >
              ⬇ Download PDF Receipt
            </button>
            <button
              className="payment-primary-button"
              type="button"
              onClick={() => navigate("/project-monitoring")}
            >
              Go to Project Monitoring
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
            <p className="payment-eyebrow">SECURE CHECKOUT · PAYPAL SANDBOX</p>
            <h1>Complete your payment</h1>
            <p>Review the accepted quotation and pay with PayPal.</p>
          </div>
          <span className="payment-demo-badge">Sandbox · No real charge</span>
        </div>

        <div className="payment-layout">
          <section className="payment-panel">
            <h2>Payment method</h2>
            <p className="payment-muted">You will pay on the PayPal sandbox page, then come back here.</p>

            <div className="payment-methods">
              <button type="button" className="payment-method selected">
                <span className="payment-method-symbol">P</span>
                <span>
                  <strong>PayPal</strong>
                  <small>PayPal account or card · Sandbox test accounts only</small>
                </span>
                <span className="payment-radio">●</span>
              </button>
            </div>

            <p className="payment-demo-note">
              Sign in on PayPal with a sandbox buyer account (developer.paypal.com &gt; Testing Tools &gt;
              Sandbox Accounts). Do not use your real PayPal account or card.
            </p>

            {notice && <p className="payment-demo-note" role="status">{notice}</p>}
            {error && <p className="payment-error" role="alert">{error}</p>}

            <button
              type="button"
              className="payment-primary-button"
              onClick={handlePay}
              disabled={processing}
            >
              {processing ? "Opening PayPal…" : `Pay ${formatPrice(amount)} with PayPal`}
            </button>

            <p className="payment-security-note">
              SANDBOX — PayPal test mode. No real money is charged.
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
              The total is taken from the selected provider quotation. PayPal charges it as{" "}
              {formatUsd(amount / SAR_PER_USD)} (3.75 SAR per dollar).
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
