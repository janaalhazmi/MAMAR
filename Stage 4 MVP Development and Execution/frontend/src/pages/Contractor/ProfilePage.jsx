import { useEffect, useRef, useState } from "react";
import ContractorShell from "../../components/ContractorShell";
import {
  fetchMyProfile,
  updateMyProfile,
  changeMyPassword,
  uploadMyProfilePicture,
  deleteMyProfilePicture,
} from "../../services/Contractor/profileService";
import "../../styles/Contractor/profile.css";

const EMPTY_PROFILE = {
  full_name: "",
  email: "",
  phone: "",
  role: "contractor",
  profile_picture: "",
  created_at: "",
};

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

function getPictureUrl(profile) {
  return profile?.profile_picture_url || profile?.profile_picture || profile?.avatar_url || "";
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [pictureBusy, setPictureBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInput = useRef(null);

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const user = await fetchMyProfile();
      setProfile({ ...EMPTY_PROFILE, ...user });
      setForm({
        full_name: user?.full_name || "",
        email: user?.email || "",
        phone: user?.phone || "",
      });
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load your profile."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.full_name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await updateMyProfile({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
      });
      setProfile((current) => ({ ...current, ...updated }));
      setForm({
        full_name: updated.full_name ?? form.full_name.trim(),
        email: updated.email ?? form.email.trim().toLowerCase(),
        phone: updated.phone ?? form.phone.trim(),
      });
      setEditing(false);
      setSuccess("Your profile details have been updated.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update your profile."));
    } finally {
      setSavingProfile(false);
    }
  }

  function handleCancelEdit() {
    setForm({
      full_name: profile.full_name || "",
      email: profile.email || "",
      phone: profile.phone || "",
    });
    setEditing(false);
    setError("");
  }

  function updatePasswordField(event) {
    const { name, value } = event.target;
    setPasswords((current) => ({ ...current, [name]: value }));
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!passwords.current_password || !passwords.new_password) {
      setError("Enter your current password and a new password.");
      return;
    }
    if (passwords.new_password.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }
    if (passwords.new_password !== passwords.confirm_password) {
      setError("The new password and confirmation do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      await changeMyPassword(passwords.current_password, passwords.new_password);
      setPasswords({ current_password: "", new_password: "", confirm_password: "" });
      setSuccess("Your password has been changed.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to change your password."));
    } finally {
      setSavingPassword(false);
    }
  }

  async function handlePictureSelected(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
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
      const updated = await uploadMyProfilePicture(file);
      if (updated && typeof updated === "object") {
        setProfile((current) => ({ ...current, ...updated }));
      } else {
        await loadProfile();
      }
      setSuccess("Your profile picture has been updated.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to upload your profile picture."));
    } finally {
      setPictureBusy(false);
    }
  }

  async function handleDeletePicture() {
    setError("");
    setSuccess("");
    setPictureBusy(true);
    try {
      const updated = await deleteMyProfilePicture();
      if (updated && typeof updated === "object") {
        setProfile((current) => ({ ...current, ...updated }));
      } else {
        setProfile((current) => ({
          ...current,
          profile_picture: "",
          profile_picture_url: "",
          avatar_url: "",
        }));
      }
      setSuccess("Your profile picture has been removed.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to remove your profile picture."));
    } finally {
      setPictureBusy(false);
    }
  }

  const picture = getPictureUrl(profile);
  const initial = (profile.full_name || "U").trim().charAt(0).toUpperCase();

  return (
    <ContractorShell activeKey="profile">
      <div className="profile-page">
        <div className="profile-heading">
          <div>
            <span className="profile-eyebrow">ACCOUNT SETTINGS</span>
            <h1>My Profile</h1>
            <p>Manage your personal information and account security.</p>
          </div>
        </div>

        {error && <div className="profile-alert profile-alert-error" role="alert">{error}</div>}
        {success && <div className="profile-alert profile-alert-success" role="status">{success}</div>}

        {loading ? (
          <div className="profile-loading">Loading your profile…</div>
        ) : (
          <div className="profile-layout">
            <section className="profile-card profile-identity-card">
              <div className="profile-card-heading">
                <div>
                  <h2>Profile picture</h2>
                  <p>This image represents you across MAMAR.</p>
                </div>
              </div>

              <div className="profile-avatar-wrap">
                {picture ? (
                  <img className="profile-avatar-image" src={picture} alt="Profile" />
                ) : (
                  <div className="profile-avatar-placeholder">{initial}</div>
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
                {picture && (
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
                  accept="image/*"
                  onChange={handlePictureSelected}
                />
              </div>
              <span className="profile-hint">JPG, PNG or WEBP · Maximum 5 MB</span>

              <div className="profile-account-meta">
                <div><span>Account type</span><strong>{profile.role || "Contractor"}</strong></div>
                <div><span>Member since</span><strong>{formatDate(profile.created_at)}</strong></div>
                <div><span>User ID</span><strong>{profile.user_id ?? "—"}</strong></div>
              </div>
            </section>

            <div className="profile-content">
              <section className="profile-card">
                <div className="profile-card-heading profile-heading-row">
                  <div>
                    <h2>Personal information</h2>
                    <p>Keep your contact details up to date.</p>
                  </div>
                  {!editing && (
                    <button className="profile-button profile-button-outline" type="button" onClick={() => setEditing(true)}>
                      Edit details
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveProfile}>
                  <div className="profile-form-grid">
                    <label className="profile-field">
                      <span>Full name</span>
                      <input name="full_name" value={form.full_name} onChange={updateField} disabled={!editing} autoComplete="name" />
                    </label>
                    <label className="profile-field">
                      <span>Email address</span>
                      <input name="email" type="email" value={form.email} onChange={updateField} disabled={!editing} autoComplete="email" />
                    </label>
                    <label className="profile-field profile-field-full">
                      <span>Phone number</span>
                      <input name="phone" type="tel" value={form.phone} onChange={updateField} disabled={!editing} autoComplete="tel" />
                    </label>
                  </div>

                  {editing && (
                    <div className="profile-form-actions">
                      <button className="profile-button profile-button-quiet" type="button" onClick={handleCancelEdit} disabled={savingProfile}>Cancel</button>
                      <button className="profile-button profile-button-primary" type="submit" disabled={savingProfile}>
                        {savingProfile ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  )}
                </form>
              </section>

              <section className="profile-card">
                <div className="profile-card-heading">
                  <h2>Change password</h2>
                  <p>Choose a strong password you do not use elsewhere.</p>
                </div>

                <form onSubmit={handleChangePassword}>
                  <div className="profile-form-grid">
                    <label className="profile-field profile-field-full">
                      <span>Current password</span>
                      <input name="current_password" type="password" value={passwords.current_password} onChange={updatePasswordField} autoComplete="current-password" />
                    </label>
                    <label className="profile-field">
                      <span>New password</span>
                      <input name="new_password" type="password" value={passwords.new_password} onChange={updatePasswordField} autoComplete="new-password" />
                    </label>
                    <label className="profile-field">
                      <span>Confirm new password</span>
                      <input name="confirm_password" type="password" value={passwords.confirm_password} onChange={updatePasswordField} autoComplete="new-password" />
                    </label>
                  </div>
                  <div className="profile-form-actions">
                    <button className="profile-button profile-button-primary" type="submit" disabled={savingPassword}>
                      {savingPassword ? "Updating…" : "Update password"}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        )}
      </div>
    </ContractorShell>
  );
}
