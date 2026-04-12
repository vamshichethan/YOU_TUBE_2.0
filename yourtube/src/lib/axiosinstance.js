import axios from "axios";
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000",
});

axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?._id) {
          config.headers = config.headers || {};
          config.headers.userid = parsedUser._id;
        }
      } catch (error) {
        console.warn("Unable to read user from storage for request headers.");
      }
    }
  }

  return config;
});

export default axiosInstance;
