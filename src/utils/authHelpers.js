import axios from "axios";

export function getDecodedTokenProfile() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));

    return {
      id: payload.id || payload._id || null,
      name: payload.name || payload.username || "User",
      username: payload.username || "user",
      photo: payload.photo || ""
    };
  } catch (e) {
    console.error("Token decoding error:", e);
    return null;
  }
}

export async function fetchUserProfileAPI() {
  try {
    const { data } = await axios.get("https://route-posts.routemisr.com/users/profile-data", {
      headers: {
        token: localStorage.getItem("token"),
      },
      timeout: 5000, // 5 seconds timeout
    });
    return data?.data?.user || data?.user || null;
  } catch (err) {
    throw err;
  }
}

