import axios from "axios";

export async function createCommentApi(postId, content) {
  try {
    // RouteMisr API strictly enforces: "content" length must be <= 300 characters long
    const cleanContent = (content || "").slice(0, 300);

    const { data } = await axios.post(
      `https://route-posts.routemisr.com/posts/${postId}/comments`,
      {
        content: cleanContent,
      },
      {
        headers: {
          token: localStorage.getItem("token"),
        },
        timeout: 10000,
      }
    );
    return data;
  } catch (err) {
    console.log("createCommentApi error:", err);
    return err.response?.data || { message: err.message || "Network Error" };
  }
}

export async function createReplyApi(postId, commentId, content) {
    try {
        const cleanContent = (content || "").slice(0, 300);
        const { data } = await axios.post(
            `https://route-posts.routemisr.com/posts/${postId}/comments/${commentId}/replies`,
            { content: cleanContent },
            {
                headers: {
                    token: localStorage.getItem("token"),
                },
                timeout: 10000,
            }
        );
        return data;
    } catch (err) {
        console.log(err);
        return err.response?.data || { message: err.message || "Network Error" };
    }
}

export async function getCommentRepliesApi(postId, commentId, page = 1, limit = 10) {
    try {
        const { data } = await axios.get(
            `https://route-posts.routemisr.com/posts/${postId}/comments/${commentId}/replies?page=${page}&limit=${limit}`,
            {
                headers: {
                    token: localStorage.getItem("token"),
                },
                timeout: 10000,
            }
        );
        return data;
    } catch (err) {
        console.log(err);
        return err.response?.data || { message: err.message || "Network Error" };
    }
}

export async function updateCommentApi(postId, commentId, content) {
    try {
        const cleanContent = (content || "").slice(0, 300);
        const { data } = await axios.put(
            `https://route-posts.routemisr.com/posts/${postId}/comments/${commentId}`,
            { content: cleanContent },
            {
                headers: {
                    token: localStorage.getItem("token"),
                },
                timeout: 10000,
            }
        );
        return data;
    } catch (err) {
        console.log(err);
        return err.response?.data || { message: err.message || "Network Error" };
    }
}

export async function deleteCommentApi(postId, commentId) {
    try {
        const { data } = await axios.delete(
            `https://route-posts.routemisr.com/posts/${postId}/comments/${commentId}`,
            {
                headers: {
                    token: localStorage.getItem("token"),
                },
                timeout: 10000,
            }
        );
        return data;
    } catch (err) {
        console.log(err);
        return err.response?.data || { message: err.message || "Network Error" };
    }
}