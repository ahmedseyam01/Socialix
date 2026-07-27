import axios from "axios";

export async function getPosts(limit = 10, page = 1) {
  try {
    const { data } = await axios.get(`https://route-posts.routemisr.com/posts?limit=${limit}&page=${page}`, {
      headers: {
        token: localStorage.getItem("token"),
      },
    });
    return data;
  } catch (err) {
    console.log(err);
    return err.response?.data || { message: err.message || "Network Error" };
  }
}

export async function getUserPosts(userId, limit = 10, page = 1) {
  try {
    const { data } = await axios.get(`https://route-posts.routemisr.com/users/${userId}/posts?limit=${limit}&page=${page}`, {
      headers: {
        token: localStorage.getItem("token"),
      },
    });
    return data;
  } catch (err) {
    console.log(err);
    return err.response?.data || { message: err.message || "Network Error" };
  }
}

export async function getSinglePost(postId) {
  try {
    const { data } = await axios.get(`https://route-posts.routemisr.com/posts/${postId}`, {
      headers: {
        token: localStorage.getItem("token"),
      },
    });
    return data;
  } catch (err) {
    console.log(err);
    return err.response?.data || { message: err.message || "Network Error" };
  }
}

export async function getPostComments(postId) {
  try {
    const { data } = await axios.get(`https://route-posts.routemisr.com/posts/${postId}/comments`, {
      headers: {
        token: localStorage.getItem("token"),
      },
    });
    console.log("Comments data:", data);
    return data;
  } catch (err) {
    console.log(err);
    return err.response?.data || { message: err.message || "Network Error" };
  }
}

export async function createPostApi(body, image = null) {
  try {
    const token = localStorage.getItem("token");
    let response;
    if (image) {
      const formData = new FormData();
      formData.append("body", body || "");
      formData.append("image", image);
      response = await axios.post("https://route-posts.routemisr.com/posts", formData, {
        headers: {
          token: token,
          "Content-Type": "multipart/form-data",
        },
      });
    } else {
      response = await axios.post("https://route-posts.routemisr.com/posts", { body: body || "" }, {
        headers: {
          token: token,
        },
      });
    }
    return response.data;
  } catch (err) {
    console.log(err);
    return err.response?.data || { message: err.message || "Network Error" };
  }
}

// Toggle like on a post — returns { liked, likesCount }
export async function togglePostLike(postId) {
  try {
    const { data } = await axios.put(
      `https://route-posts.routemisr.com/posts/${postId}/like`,
      {},
      { headers: { token: localStorage.getItem("token") } }
    );
    return data;
  } catch (err) {
    return err.response?.data || { message: err.message || "Network Error" };
  }
}

// Fetch the list of users who liked a post — returns meta.pagination.total for count
export async function getPostLikes(postId, page = 1, limit = 20) {
  try {
    const { data } = await axios.get(
      `https://route-posts.routemisr.com/posts/${postId}/likes?page=${page}&limit=${limit}`,
      { headers: { token: localStorage.getItem("token") } }
    );
    return data;
  } catch (err) {
    return err.response?.data || { message: err.message || "Network Error" };
  }
}
