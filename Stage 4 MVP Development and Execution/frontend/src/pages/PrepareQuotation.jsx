import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import logo from "../assets/mamar-logo.svg";
import MamarMap from "../components/MamarMap";

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
  const [services, setServices] = useState(initialServices);
  const [delivery, setDelivery] = useState(1200);
  const [showWorkZone, setShowWorkZone] = useState(false);

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

        {showWorkZone && (
          <div className="quotation-map">
            <MamarMap />
          </div>
        )}

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

            <Button className="quotation-submit">
              Submit Quotation →
            </Button>

            <Button
              variant="secondary"
              className="quotation-draft"
            >
              Save Draft
            </Button>
          </section>
        </div>

        <small className="quotation-preview-note">
          Sample project and prices for the design preview.
        </small>
      </main>
      {showWorkZone && (
  <div className="work-zone-overlay">
    <div className="work-zone-modal">
      <div className="work-zone-modal-header">
        <div>
          <h2>Project Work Zone</h2>
          <p>Al Mursalat, Riyadh</p>
        </div>

        <button
          type="button"
          className="work-zone-close"
          onClick={() => setShowWorkZone(false)}
        >
          ×
        </button>
      </div>

      <div className="work-zone-map">
        <MamarMap />
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default PrepareQuotation;