import axios from "axios";

const api = axios.create({
  baseURL: "https://agriwatch-backend.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});


// =====================================================
// ATTACH JWT TOKEN TO EVERY REQUEST
// =====================================================

api.interceptors.request.use(
  (config) => {

    const token =
      localStorage.getItem(
        "agriwatch_token"
      );

    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;

    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);


export default api;