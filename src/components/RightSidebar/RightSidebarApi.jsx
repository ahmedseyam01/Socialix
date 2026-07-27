import axios from "axios";

export async function fetchSuggestedUsersApi(limit = 3) {
  try {
    const { data } = await axios.get(
      `https://route-posts.routemisr.com/users/suggestions?limit=${limit}`,
      {
        headers: {
          token: localStorage.getItem("token"),
        },
      }
    );
    return data;
  } catch (error) {
    console.log(error);
    return error.response?.data || { message: error.message || "Network Error" };
  }
}

export async function followSuggestedUserApi(userId) {
  try {
    const { data } = await axios.put(
      `https://route-posts.routemisr.com/users/${userId}/follow`,
      {},
      {
        headers: {
          token: localStorage.getItem("token"),
        },
      }
    );
    return data;
  } catch (error) {
    console.log(error);
    return error.response?.data || { message: error.message || "Network Error" };
  }
}
