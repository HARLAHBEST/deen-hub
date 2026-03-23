import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ddh_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function healthCheck() {
  const { data } = await api.get("/health");
  return data;
}

export async function fetchPublicItems(params = {}) {
  const { data } = await api.get("/items", { params });
  return data;
}

export async function fetchAllItems() {
  const { data } = await api.get("/items/all", { params: { limit: 200 } });
  return data;
}

export async function loginAdmin(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function seedAdmin() {
  const { data } = await api.post("/auth/seed-default-admin");
  return data;
}

export async function updateItem(uid, payload) {
  const { data } = await api.patch(`/items/${encodeURIComponent(uid)}`, payload);
  return data;
}

export async function getSettings() {
  const { data } = await api.get("/settings");
  return data;
}

export async function updateSettings(payload) {
  const { data } = await api.patch("/settings", payload);
  return data;
}
