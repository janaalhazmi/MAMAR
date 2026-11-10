// src/services/Contractor/payments.js
// ---------------------------------------------------------------------------
// Payment of the accepted quotation through PayPal in SANDBOX mode (issue #48):
// real PayPal pages and sandbox buyer accounts, no real money.
//
//   startPayment()   POST /projects/{id}/payments, then opens the PayPal page
//   PayPal sends the contractor back to /payment/return?token=<order id>
//   finishPayment()  POST /payments/orders/{order id}/capture  (or /cancel)
// ---------------------------------------------------------------------------
import { getSession } from "../auth";
import {
  fetchProjectPayments,
  postCancelPayment,
  postCapturePayment,
  postStartPayment,
} from "../api";

// The project and quotation shown on the page, kept while the contractor is on PayPal.
const PENDING_KEY = "mamarPendingPayment";

function token() {
  const accessToken = getSession()?.access_token;
  if (!accessToken) throw new Error("Please sign in again.");
  return accessToken;
}

export async function getCompletedPayment(projectId) {
  if (projectId === undefined || projectId === null) return null;
  const payments = await fetchProjectPayments(token(), projectId);
  return payments.find((payment) => payment.status === "completed") || null;
}

export async function startPayment(project, quotation) {
  const origin = window.location.origin;
  const started = await postStartPayment(
    token(),
    project.id,
    `${origin}/payment/return`,
    `${origin}/payment/cancel`
  );
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ project, quotation }));
  } catch {
    // The page still works; it only loses the names shown after PayPal.
  }
  window.location.assign(started.approve_url);
}

export function readPendingPayment() {
  try {
    return JSON.parse(sessionStorage.getItem(PENDING_KEY) || "null");
  } catch {
    return null;
  }
}

export function clearPendingPayment() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // nothing to clear
  }
}

export async function finishPayment(orderId, cancelled) {
  return cancelled
    ? postCancelPayment(token(), orderId)
    : postCapturePayment(token(), orderId);
}
