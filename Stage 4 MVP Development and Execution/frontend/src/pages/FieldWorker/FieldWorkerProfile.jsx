import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import FieldWorkerShell from "../../components/FieldWorkerShell";
import { getSession } from "../../services/auth";
import { getCurrentUser } from "../../services/api";

export default function FieldWorkerProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const token = getSession()?.access_token;

        if (!token) {
          navigate("/login");
          return;
        }

        const user = await getCurrentUser(token);

        if (mounted) {
          setProfile(user);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err.message || "Unable to load your profile."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const fullName =
    profile?.full_name ||
    profile?.name ||
    profile?.username ||
    "Field Worker";

  const email = profile?.email || "Not provided";
  const phone =
    profile?.phone_number ||
    profile?.phone ||
    "Not provided";

  const role = profile?.role || "Field Worker";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <FieldWorkerShell>
      <div className="fw-profile-page">

        <div className="fw-profile-header">
          <div>
            <h1>My Profile</h1>
            <p>
              View your personal information and account details.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="fw-profile-state">
            Loading your profile...
          </div>
        ) : error ? (
          <div className="fw-profile-error">
            {error}
          </div>
        ) : (
          <>
            <section className="fw-profile-card">
              <div className="fw-profile-identity">
                <div className="fw-profile-avatar">
                  {initials || "FW"}
                </div>

                <div>
                  <h2>{fullName}</h2>
                  <span className="fw-profile-role">
                    {role}
                  </span>
                </div>
              </div>
            </section>

            <section className="fw-profile-card">
              <div className="fw-profile-section-header">
                <div>
                  <h2>Personal Information</h2>
                  <p>
                    Your registered account information.
                  </p>
                </div>
              </div>

              <div className="fw-profile-details">

                <div className="fw-profile-field">
                  <span>Full Name</span>
                  <strong>{fullName}</strong>
                </div>

                <div className="fw-profile-field">
                  <span>Email Address</span>
                  <strong>{email}</strong>
                </div>

                <div className="fw-profile-field">
                  <span>Phone Number</span>
                  <strong>{phone}</strong>
                </div>

                <div className="fw-profile-field">
                  <span>Account Role</span>
                  <strong>{role}</strong>
                </div>

              </div>
            </section>
          </>
        )}

      </div>

      <style>{`
        .fw-profile-page {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          padding: 28px;
          color: #202b38;
        }

        .fw-profile-header {
          margin-bottom: 28px;
        }

        .fw-profile-header h1 {
          margin: 0 0 8px;
          font-size: 28px;
          font-weight: 700;
        }

        .fw-profile-header p {
          margin: 0;
          color: #7a8491;
          font-size: 14px;
        }

        .fw-profile-card {
          background: #fff;
          border: 1px solid #e8ebef;
          border-radius: 14px;
          padding: 26px;
          margin-bottom: 20px;
        }

        .fw-profile-identity {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .fw-profile-avatar {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: #eaf2ef;
          color: #26745d;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .fw-profile-identity h2 {
          margin: 0 0 8px;
          font-size: 20px;
        }

        .fw-profile-role {
          display: inline-block;
          padding: 5px 12px;
          border-radius: 20px;
          background: #eaf2ef;
          color: #26745d;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .fw-profile-section-header {
          margin-bottom: 24px;
        }

        .fw-profile-section-header h2 {
          margin: 0 0 7px;
          font-size: 18px;
        }

        .fw-profile-section-header p {
          margin: 0;
          color: #89919c;
          font-size: 13px;
        }

        .fw-profile-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 24px;
        }

        .fw-profile-field {
          display: flex;
          flex-direction: column;
          gap: 9px;
          padding-bottom: 16px;
          border-bottom: 1px solid #edf0f2;
          min-width: 0;
        }

        .fw-profile-field span {
          color: #89919c;
          font-size: 13px;
        }

        .fw-profile-field strong {
          font-size: 14px;
          font-weight: 600;
          overflow-wrap: anywhere;
        }

        .fw-profile-state,
        .fw-profile-error {
          padding: 24px;
          border-radius: 12px;
          background: #fff;
          border: 1px solid #e8ebef;
        }

        .fw-profile-error {
          color: #b42318;
        }

        @media (max-width: 650px) {
          .fw-profile-page {
            padding: 18px;
          }

          .fw-profile-details {
            grid-template-columns: 1fr;
          }

          .fw-profile-card {
            padding: 20px;
          }
        }
      `}</style>
    </FieldWorkerShell>
  );
}