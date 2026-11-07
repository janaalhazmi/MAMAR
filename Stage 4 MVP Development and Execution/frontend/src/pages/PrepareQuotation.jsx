import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getOpenRequestById,
  submitProviderQuotation,
} from "../services/providerQuotes";
import Button from "../components/Button";
import logo from "../assets/mamar-logo.svg";
import MamarMap from "../components/MamarMap";
import { getSession } from "../services/auth";
import { fetchRequestWorkZone } from "../services/api";

const initialServices = [
  {
    id: 1,
    name: "Traffic Barriers",
    quantity: 20,
    unitPrice: 150,
  },
  {
    id: 2,
    name: "Traffic Cones",
    quantity: 10,
    unitPrice: 80,
  },
  {
    id: 3,
    name: "Temporary Road Signs",
    quantity: 5,
    unitPrice: 200,
  },
];

function PrepareQuotation() {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("requestId");
  const submitting = useRef(false);
  const [services, setServices] = useState(initialServices);
  const [delivery, setDelivery] = useState(1200);
  const [showWorkZone, setShowWorkZone] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [workZone, setWorkZone] = useState(null);
const [requestDetails, setRequestDetails] = useState(null);

useEffect(() => {
  if (!requestId) return;

  const accessToken = getSession()?.access_token;
  if (!accessToken) return;

  fetchRequestWorkZone(accessToken, requestId)
    .then((data) => {
      setRequestDetails(data);
      setWorkZone(data.work_zone ?? null);
    })
    .catch((error) => {
      console.error("Failed to load work zone:", error);
    });
}, [requestId]);

  const handleWorkZoneSelect = (polygon) => {
  sessionStorage.setItem(
    "providerWorkZone",
    JSON.stringify(polygon)
  );
};

  const handleQuantityChange = (id, value) => {
    const newQuantity = Number(value);

    setServices((currentServices) =>
      currentServices.map((service) =>
        service.id === id
          ? {
              ...service,
              quantity: Number.isNaN(newQuantity) ? 0 : newQuantity,
            }
          : service
      )
    );
  };

  const handleUnitPriceChange = (id, value) => {
    const newPrice = Number(value);

    setServices((currentServices) =>
      currentServices.map((service) =>
        service.id === id
          ? {
              ...service,
              unitPrice: Number.isNaN(newPrice) ? 0 : newPrice,
            }
          : service
      )
    );
  };

  const subtotal = services.reduce(
    (total, service) =>
      total + service.quantity * service.unitPrice,
    0
  );

  const total = subtotal + Number(delivery || 0);

  const getQuotationData = () => ({
    requestId,
    services,
    delivery,
    subtotal,
    total,
    location: selectedLocation,
    workZone,
    notes: document.querySelector(".quotation-notes textarea")?.value || "",
    validUntil: document.querySelector(".quotation-date")?.value || "",
  });

  const handleSaveDraft = () => {
    const quotation = getQuotationData();

    localStorage.setItem(
      "providerQuotationDraft",
      JSON.stringify(quotation)
    );

    alert("Quotation draft saved successfully.");
  };

  const handleSubmitQuotation = async () => {
    if (submitting.current) return;

    if (!requestId) {
      alert("Open this quotation from a service request.");
      return;
    }

    const quotation = getQuotationData();
    const hasInvalidService = quotation.services.some(
      ({ quantity, unitPrice }) =>
        !Number.isFinite(quantity) || quantity <= 0 ||
        !Number.isFinite(unitPrice) || unitPrice <= 0
    );

    if (hasInvalidService || !Number.isFinite(quotation.total) || quotation.total <= 0) {
      alert("Please enter a valid quantity and unit price for all services.");
      return;
    }

    submitting.current = true;
    try {
      const request = await getOpenRequestById(requestId);
      if (!request?.projectId) {
        throw new Error("This request is no longer available for quotation.");
      }

      const start = Date.parse(request.startDate?.slice(0, 10) ?? "");
      const end = Date.parse(request.endDate?.slice(0, 10) ?? "");
      const durationDays = (end - start) / 86400000 + 1;

      if (!Number.isInteger(durationDays) || durationDays < 1) {
        throw new Error("The request needs valid start and end dates.");
      }

      const notes = [
        quotation.notes,
        ...quotation.services.map(
          ({ name, quantity, unitPrice }) => name + ": " + quantity + " × SAR " + unitPrice
        ),
        "Delivery: SAR " + quotation.delivery,
        quotation.validUntil && "Valid until: " + quotation.validUntil,
      ].filter(Boolean).join("\n");

      await submitProviderQuotation({
        request,
        price: quotation.total,
        durationDays,
        notes,
      });

      localStorage.removeItem("providerQuotationDraft");
      alert("Quotation submitted successfully.");
    } catch (error) {
      alert(error.message || "Could not submit the quotation. Please try again.");
    } finally {
      submitting.current = false;
    }
  };

  return (
    <div className="quotation-page">
      <header className="quotation-topbar">
        <Link to="/" className="quotation-logo">
          <img src={logo} alt="MAMAR Logo" />
        </Link>

        <div className="quotation-account">
          <div className="quotation-avatar">TC</div>

          <div>
            <strong>TCM</strong>
            <span>Service Provider</span>
          </div>
        </div>
      </header>

      <main className="quotation-content">
        <Link
          to="/provider-dashboard"
          className="quotation-back"
        >
          ← Back to <strong>Dashboard</strong>
        </Link>

        <h1>Prepare Quotation</h1>

        <p className="quotation-subtitle">
          Review the requested services and enter your prices to prepare an
          offer.
        </p>

        <section className="quotation-request-card">
          <div>
            <span className="quotation-label">
              REQUEST · REQ-024
            </span>

            <h2>Water Pipeline Installation</h2>

            <p>Contractor: Al Noor Contracting</p>
          </div>

          <div>
            <span className="quotation-label">
              LOCATION
            </span>

            <strong>Al Mursalat, Riyadh</strong>
          </div>

          <div>
            <span className="quotation-label">
              PROJECT DATES
            </span>

            <strong>18–24 Oct 2026 · 7 days</strong>
          </div>

          <Button
  variant="secondary"
  onClick={() => setShowWorkZone(true)}
>
            View Work Zone
          </Button>
        </section>

        <div className="quotation-layout">
          <div className="quotation-left">
            <section className="quotation-card pricing-card">
              <h2>Service Pricing</h2>

              <p>
                Enter quantities and unit prices for the full project duration.
                All amounts are in SAR.
              </p>

              <div className="pricing-header">
                <span>Requested Service</span>
                <span>Quantity</span>
                <span>Unit Price</span>
                <span>Amount</span>
              </div>

              {services.map((service) => {
                const amount =
                  service.quantity * service.unitPrice;

                return (
                  <div
                    className="pricing-row"
                    key={service.id}
                  >
                    <span>{service.name}</span>

                    <input
                      className="quantity-input"
                      type="number"
                      min="0"
                      value={service.quantity}
                      onChange={(event) =>
                        handleQuantityChange(
                          service.id,
                          event.target.value
                        )
                      }
                    />

                    <input
                      type="number"
                      min="0"
                      value={service.unitPrice}
                      onChange={(event) =>
                        handleUnitPriceChange(
                          service.id,
                          event.target.value
                        )
                      }
                    />

                    <strong>
                      {amount.toLocaleString()}
                    </strong>
                  </div>
                );
              })}

              <small>
                Line amount = quantity × unit price
              </small>
            </section>

            {showWorkZone && (
              <section className="quotation-card work-zone-card">
                <div className="work-zone-header">
                <div>
                   <h2>Project Work Zone</h2>
                   <p>Al Mursalat, Riyadh</p>
               </div>

                  <button
                   type="button"
                   className="work-zone-close"
                   onClick={() => setShowWorkZone(false)}
                   aria-label="Close map"
                  >
                  ×
                 </button>
               </div>

               <div className="work-zone-map">
{requestDetails && workZone ? (
                  <MamarMap
                    key={requestId}
                    workZone={workZone}
                    readOnly
                  />
                ) : (
                  <p>
                    {requestDetails
                      ? "No work zone has been saved for this project."
                      : "Loading work zone..."}
                  </p>
                )}
             </div>
          </section>
         )}

            <section className="quotation-card quotation-notes">
              <h2>Notes and Inclusions</h2>

              <textarea
                defaultValue={
                  "Includes equipment rental for 7 days, delivery, installation,\nand removal after project completion."
                }
              />
            </section>
          </div>

          <section className="quotation-card quotation-summary">
            <h2>Quotation Summary</h2>

            <div className="summary-line">
              <span>Services subtotal</span>

              <strong>
                SAR {subtotal.toLocaleString()}
              </strong>
            </div>

            <hr />

            <label>
              Delivery, installation and removal
            </label>

            <div className="quotation-input">
              <span>SAR</span>

              <input
                type="number"
                min="0"
                value={delivery}
                onChange={(event) =>
                  setDelivery(Number(event.target.value))
                }
              />
            </div>

            <label>Offer Valid Until</label>

            <input
              className="quotation-date"
              type="text"
              defaultValue="16 Oct 2026"
            />

            <div className="quotation-total">
              <span>Total Quote · Before Tax</span>

              <strong>
                SAR {total.toLocaleString()}
              </strong>
            </div>

            <Button
              className="quotation-submit"
              onClick={handleSubmitQuotation}
            >
              Submit Quotation →
            </Button>

            <Button
              variant="secondary"
              className="quotation-draft"
              onClick={handleSaveDraft}
            >
              Save Draft
            </Button>
          </section>
        </div>

        <small className="quotation-preview-note">
          Sample project and prices for the design preview.
        </small>
      </main>
    </div>
  );
}

export default PrepareQuotation;