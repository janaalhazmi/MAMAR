import ProviderSidebar from "../../components/ProviderSidebar";
import { useProviderProfile } from "../../services/providers/api";
import "../../styles/Providers/providerProfile.css";

export default function ProviderProfilePage() {
  const {
    profile,
    form,
    passwords,
    loading,
    savingProfile,
    savingPassword,
    pictureBusy,
    editing,
    error,
    success,
    fileInput,
    picture,
    initial,
    setEditing,
    updateField,
    updatePasswordField,
    handleSaveProfile,
    handleCancelEdit,
    handleChangePassword,
    handlePictureSelected,
    handleDeletePicture,
    formatDate,
    companyName,
  } = useProviderProfile();

  return (
    <div className="provider-dashboard-page">
      <ProviderSidebar />
      <main className="provider-main-area">
        <div className="profile-page provider-profile-page">
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
                  <div><span>Account type</span><strong>{profile.role || "Provider"}</strong></div>
                  <div><span>Company Name</span><strong>{companyName}</strong></div>
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
      </main>
    </div>
  );
}
