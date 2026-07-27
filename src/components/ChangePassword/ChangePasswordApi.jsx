import axios from "axios";

export async function sendChangePasswordData(values) {
  try {
    const { data } = await axios.patch(`https://route-posts.routemisr.com/users/change-password`, {
      password: values.password,
      newPassword: values.newPassword,
    }, {
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

