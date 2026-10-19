import axios from "axios";

const api = axios.create({
  baseURL: "/salon-app/api",
});

// Every request carries the signed-in user's token.
api.interceptors.request.use((config) => {
  try {
    const token = JSON.parse(localStorage.getItem("user") || "null")?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {
    /* unreadable saved login: the server will answer 401 */
  }
  return config;
});

// An expired or invalid token sends the user back to sign in.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogin = (error.config?.url || "").includes("/users/login");
    if (error.response?.status === 401 && !isLogin) {
      localStorage.removeItem("user");
      if (!window.location.pathname.endsWith("/login")) {
        window.location.assign("/salon-app/login?expired=1");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
