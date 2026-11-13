import { useEffect, useRef, useState } from "react";
import FieldWorkerShell from "../../components/FieldWorkerShell";

import {
  fetchMyProfile,
  uploadMyProfilePicture,
  deleteMyProfilePicture,
} from "../../services/Contractor/profileService";

import {
  getPictureUrl,
  formatProfileDate,
  getProfileInitial,
} from "../../services/Contractor/profileUtils";

import "../../styles/Contractor/profile.css";

const EMPTY_PROFILE = {
  full_name: "",
  email: "",
  phone: "",
  role: "worker",
  profile_picture: "",
  created_at: "",
};

function notifyShellUser(profile) {
  window.dispatchEvent(
    new CustomEvent("mamar:session-user-updated", {
      detail: profile,
    })
  );
}

export default function FieldWorkerProfile() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [pictureBusy, setPictureBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageError, setImageError] = useState(false);

  const fileInput = useRef(null);

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const user = await fetchMyProfile();
      const updatedProfile = {
        ...EMPTY_PROFILE,
        ...user,
        role: "worker",
      };

      setProfile(updatedProfile);
      notifyShellUser(updatedProfile);
    } catch (err) {
      setError(err?.message || "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handlePictureSelected(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a JPG, PNG or WEBP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("The image must be 5 MB or smaller.");
      return;
    }

    setError("");
    setSuccess("");
    setPictureBusy(true);

    try {
      await uploadMyProfilePicture(file);

      const updatedUser = await fetchMyProfile();
      const updatedProfile = {
        ...profile,
        ...updatedUser,
        role: "worker",
      };

      setProfile(updatedProfile);
      setImageError(false);
      notifyShellUser(updatedProfile);

      setSuccess("Your profile picture has been updated.");
    } catch (err) {
      setError(
        err?.message || "Unable to upload your profile picture."
      );
    } finally {
      setPictureBusy(false);
    }
  }

  async function handleDeletePicture() {
    setError("");
    setSuccess("");
    setPictureBusy(true);

    try {
      await deleteMyProfilePicture();

      const updatedUser = await fetchMyProfile();
      const updatedProfile = {
        ...profile,
        ...updatedUser,
        role: "worker",
      };

      setProfile(updatedProfile);
      setImageError(false);
      notifyShellUser(updatedProfile);

      setSuccess("Your profile picture has been removed.");
    } catch (err) {
      setError(
        err?.message || "Unable to remove your profile picture."
      );
    } finally {
      setPictureBusy(false);
    }
  }

  const pictureUrl = getPictureUrl(profile);

  return (
    <FieldWorkerShell>
      <div className="profile-page">
        <div className="profile-heading">
          <div>
            <span className="profile-eyebrow">ACCOUNT INFORMATION</span>
            <h1>My Profile</h1>
            <p>
              View your personal information and manage your profile picture.
            </p>
          </div>
        </div>

        {error && (
          <div className="profile-alert profile-alert-error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="profile-alert profile-alert-success" role="status">
            {success}
          </div>
        )}

        {loading ? (
          <div className="profile-loading">Loading your profile…</div>
        ) : !error || profile.full_name ? (
          <div className="profile-layout">
            <section className="profile-card profile-identity-card">
              <div className="profile-card-heading">
                <div>
                  <h2>Profile picture</h2>
                  <p>This image represents you across MAMAR.</p>
                </div>
              </div>

              <div className="profile-avatar-wrap">
                {pictureUrl && !imageError ? (
                  <img
                    className="profile-avatar-image"
                    src={pictureUrl}
                    alt="Profile"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="profile-avatar-placeholder">
                    {getProfileInitial(profile.full_name)}
                  </div>
                )}
              </div>

              <div className="profile-picture-actions">
                <button
                  className="profile-button profile-button-primary"
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={pictureBusy}
                >
                  {pictureBusy ? "Please wait…" : "Upload picture"}
                </button>

                {pictureUrl && (
                  <button
                    className="profile-button profile-button-quiet"
                    type="button"
                    onClick={handleDeletePicture}
                    disabled={pictureBusy}
                  >
                    Remove
                  </button>
                )}

                <input
                  ref={fileInput}
                  className="profile-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePictureSelected}
                />
              </div>

              <span className="profile-hint">
                JPG, PNG or WEBP · Maximum 5 MB
              </span>

              <div className="profile-account-meta">
                <div>
                  <span>Account type</span>
                  <strong>WORKER</strong>
                </div>

                <div>
                  <span>Member since</span>
                  <strong>{formatProfileDate(profile.created_at)}</strong>
                </div>

                <div>
                  <span>User ID</span>
                  <strong>{profile.user_id ?? "—"}</strong>
                </div>
              </div>
            </section>

            <div className="profile-content">
              <section className="profile-card">
                <div className="profile-card-heading">
                  <h2>Personal information</h2>
                  <p>Your registered account information.</p>
                </div>

                <div className="profile-form-grid">
                  <div className="profile-field">
                    <span>Full name</span>
                    <input
                      value={profile.full_name || ""}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="profile-field">
                    <span>Email address</span>
                    <input
                      value={profile.email || ""}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="profile-field profile-field-full">
                    <span>Phone number</span>
                    <input
                      value={profile.phone || ""}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </FieldWorkerShell>
  );
}
