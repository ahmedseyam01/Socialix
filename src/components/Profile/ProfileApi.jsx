import axios from "axios";

const BASE_URL = "https://route-posts.routemisr.com";

function getToken() {
  return localStorage.getItem("token");
}

// Get profile data for any user by their ID
export async function getUserProfileApi(userId) {
  try {
    const { data } = await axios.get(`${BASE_URL}/users/${userId}/profile`, {
      headers: { token: getToken() },
    });
    return data;
  } catch (err) {
    return err.response?.data || { error: "Network Error" };
  }
}

// Toggle follow/unfollow for a user by their ID
export async function followUserApi(userId) {
  try {
    const { data } = await axios.put(`${BASE_URL}/users/${userId}/follow`, {}, {
      headers: { token: getToken() },
    });
    return data;
  } catch (err) {
    return err.response?.data || { error: "Network Error" };
  }
}

// Get user posts by userId
export async function getUserPostsApi(userId, limit = 10, page = 1) {
  try {
    const { data } = await axios.get(`${BASE_URL}/users/${userId}/posts?limit=${limit}&page=${page}`, {
      headers: { token: getToken() },
    });
    return data;
  } catch (err) {
    return err.response?.data || { error: "Network Error" };
  }
}

// Get the currently logged-in user's profile data
export async function getMyProfileApi() {
  try {
    const { data } = await axios.get(`${BASE_URL}/users/profile-data`, {
      headers: { token: getToken() },
    });
    return data;
  } catch (err) {
    return err.response?.data || { error: "Network Error" };
  }
}

// Upload logged-in user's profile photo
export async function uploadProfilePhotoApi(file) {
  try {
    const formData = new FormData();
    formData.append("photo", file);

    const { data } = await axios.put(`${BASE_URL}/users/upload-photo`, formData, {
      headers: { token: getToken() },
    });
    return data;
  } catch (err) {
    if (err.response?.status === 405 || err.response?.status === 404) {
      try {
        const formData = new FormData();
        formData.append("photo", file);
        const { data } = await axios.patch(`${BASE_URL}/users/upload-photo`, formData, {
          headers: { token: getToken() },
        });
        return data;
      } catch (patchErr) {
        return patchErr.response?.data || { error: "Upload failed" };
      }
    }
    return err.response?.data || { error: "Upload failed" };
  }
}

// Upload logged-in user's cover photo
export async function uploadCoverPhotoApi(file) {
  try {
    const formData = new FormData();
    formData.append("coverPhoto", file);

    const { data } = await axios.put(`${BASE_URL}/users/upload-cover-photo`, formData, {
      headers: { token: getToken() },
    });
    return data;
  } catch (err) {
    return err.response?.data || { error: "Upload cover failed" };
  }
}

// Remove logged-in user's profile photo
export async function removeProfilePhotoApi() {
  try {
    const { data } = await axios.delete(`${BASE_URL}/users/upload-photo`, {
      headers: { token: getToken() },
    });
    return data;
  } catch (err) {
    return err.response?.data || { message: "photo removed successfully" };
  }
}

// Remove logged-in user's cover photo
export async function removeCoverPhotoApi() {
  try {
    const { data } = await axios.delete(`${BASE_URL}/users/upload-cover-photo`, {
      headers: { token: getToken() },
    });
    return data;
  } catch (err) {
    return err.response?.data || { message: "cover removed successfully" };
  }
}
