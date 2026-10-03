import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const storedAuth = localStorage.getItem("aqpf-auth");

  if (storedAuth) {
    try {
      const parsed = JSON.parse(storedAuth);
      const token = parsed?.state?.token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error(
        "Failed to read AQPF authentication:",
        error
      );
    }
  }

  return config;
});

export default api;