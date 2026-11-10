import { getSession } from "../auth";
import { authed, JSON_H, asJson } from "../api";

function getToken() {
  const accessToken = getSession()?.access_token;

  if (!accessToken) {
    throw new Error("Please sign in to continue.");
  }

  return accessToken;
}

// 1. Fetch current user's profile
export async function fetchMyProfile() {
  return authed("/auth/me", getToken());
}

// 2. Update name, email and phone
export async function updateMyProfile(profileData) {
  return authed("/auth/me", getToken(), {
    method: "PATCH",
    headers: JSON_H,
    body: asJson(profileData),
  });
}

// 3. Change password
export async function changeMyPassword(currentPassword, newPassword) {
  return authed("/auth/change-password", getToken(), {
    method: "POST",
    headers: JSON_H,
    body: asJson({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

// 4. Upload profile picture
export async function uploadMyProfilePicture(file) {
  const formData = new FormData();
  formData.append("file", file);

  return authed("/auth/me/avatar", getToken(), {
    method: "POST",
    body: formData,
  });
}

// 5. Delete profile picture
export async function deleteMyProfilePicture() {
  return authed("/auth/me/avatar", getToken(), {
    method: "DELETE",
  });
}