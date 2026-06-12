import axios from "axios";

const api = axios.create({
  baseURL: "/salon-app/api",
});

export default api;
