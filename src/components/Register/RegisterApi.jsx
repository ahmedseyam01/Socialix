import axios from "axios";

export async function sendRegisterData(values) {
  try {
    const { data } = await axios.post(`https://route-posts.routemisr.com/users/signup`, values);
    return data;
  } catch (err) {
    return err.response?.data || { error: "Network Error" };
  }
}
