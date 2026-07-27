import axios from "axios";

export async function likeCommentApi(commentId) {
  try {
    const { data } = await axios.post(
      `https://route-posts.routemisr.com/comments/${commentId}/like`,
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
