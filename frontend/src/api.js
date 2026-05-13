const BASE = "http://127.0.0.1:3000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  register: (username, password) =>
    apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ username, password }) }),

  login: (username, password) =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),

  getMyMaps: () => apiFetch("/maps/mine"),

  getPublicMaps: () => apiFetch("/maps"),

  getMap: (id) => apiFetch(`/maps/${id}`),

  createMap: (grid, name) =>
    apiFetch("/maps", { method: "POST", body: JSON.stringify({ grid, name }) }),

  updateMap: (id, grid, name) =>
    apiFetch(`/maps/${id}`, { method: "PUT", body: JSON.stringify({ grid, name }) }),

  completeMap: (id) =>
    apiFetch(`/maps/${id}/complete`, { method: "POST" }),

  publishMap: (id) =>
    apiFetch(`/maps/${id}/publish`, { method: "POST" }),
};
