import { useUserStore } from "../stores/user";

export const requestApi = async (url, options = {}) => {
  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  const userStore = useUserStore();
  if (userStore.token) {
    options.headers = {
      Authorization: `Bearer ${userStore.token}`,
      ...options.headers,
    };
  }
  if (options.method === "POST") {
    options.headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
  }

  const res = await fetch(`${API_BASE}${url}`, options);
  return res;
};
