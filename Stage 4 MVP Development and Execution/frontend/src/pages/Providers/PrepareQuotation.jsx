// Shared interface components and branding.
import Button from "../../components/Button";
import MamarMap from "../../components/MamarMap";
import NotificationBell from "../../components/NotificationBell";
import logo from "../../assets/mamar-logo.svg";

// Navigation and quotation page logic.
import { Link } from "react-router-dom";
import { usePrepareQuotationPage } from "../../services/providers/api";

// Provider quotation view.
function PrepareQuotation() {
  const {
    providerName,
    providerInitials,
    requestId,
    services,
    delivery,
    setDelivery,
    showWorkZone,
    setShowWorkZone,
    requestDetails,
    realRequest,
    workZone,
    workZoneError,
    handleQuantityChange,
    handleUnitPriceChange,
    subtotal,
    total,
    handleDeclineRequest,
    handleSubmitQuotation,
  } = usePrepareQuotationPage();

  return (
    <div className="quotation-page">
      {/* Branding, provider account and notifications */}
      <header className="quotation-topbar">
          
        <Link to="/" className="quotation-logo">
          <img src={logo} alt="MAMAR Logo" />
        </Link>

        <div className="quotation-account">
          <div className="quotation-avatar">{providerInitials}</div>

          <div>
            <strong>{providerName}</strong>
            <span>Service Provider</span>
          </div>
        </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}><NotificationBell /></div>
</header>

      <main className="quotation-content">
        {/* Return to the provider dashboard */}
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

        {/* Selected service request */}
        <section className="quotation-request-card">
          <div>
            <span className="quotation-label">
              REQUEST · REQ-{requestId}
            </span>

            <h2>{realRequest?.title || requestDetails?.project_name || 'Loading project...'}</h2>

            <p>Project #{realRequest?.projectId || requestDetails?.project_id || '...'}</p>
          </div>

          <div>
            <span className="quotation-label">
              LOCATION
            </span>

            <strong>{realRequest?.location || 'Riyadh, Saudi Arabia'}</strong>
          </div>

          <div>
            <span className="quotation-label">
              PROJECT DATES
            </span>

            <strong>{realRequest?.startDate || requestDetails?.start_date || '—'} – {realRequest?.endDate || requestDetails?.end_date || '—'}</strong>
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
            {/* Service quantities and unit prices */}
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

            {/* Read-only project work zone */}
            {showWorkZone && (
              <section className="quotation-card work-zone-card">
                <div className="work-zone-header">
                <div>
                   <h2>Project Work Zone</h2>
                   <p>{realRequest?.location || 'Project location'}</p>
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
        {workZoneError ? (
  <p>{workZoneError}</p>
        ) : !requestDetails ? (
  <p>Loading work zone...</p>
    ) : workZone ? (
    <MamarMap
    key={requestId}
    workZone={workZone}
    readOnly
   />
  ) : (
  <p>No work zone has been saved for this project.</p>
)}
             </div>
          </section>
         )}

            {/* Quotation notes and inclusions */}
            <section className="quotation-card quotation-notes">
              <h2>Notes and Inclusions</h2>

              <textarea
                defaultValue={
                  "Includes equipment rental for 7 days, delivery, installation,\nand removal after project completion."
                }
              />
            </section>
          </div>

          {/* Quotation totals and delivery charges */}
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

            {/* Submit or decline the request */}
            <div className="quotation-actions">
              <Button className="quotation-action" onClick={handleSubmitQuotation}>
                Submit Quotation →
              </Button>

              <Button variant="secondary" className="quotation-action" onClick={handleDeclineRequest}>
                Decline Request
              </Button>

            </div>
          </section>
        </div>

        {/* Existing design preview notice */}
        <small className="quotation-preview-note">
          Sample project and prices for the design preview.
        </small>
      </main>
    </div>
  );
}

export default PrepareQuotation;