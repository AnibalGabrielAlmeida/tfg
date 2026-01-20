const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

function getToken() {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Request failed");
  return data as T;
}

export const api = {
  setToken(token: string) {
    localStorage.setItem("token", token);
  },

  clearToken() {
    localStorage.removeItem("token");
  },

  getToken() {
    return localStorage.getItem("token");
  },

  isConnected() {
    return Boolean(localStorage.getItem("token"));
  },

  register(email: string, password: string) {
    return request<{ id: string; email: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  login(email: string, password: string) {
    return request<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  listProgressions() {
    return request<Array<{ id: string; title: string }>>("/progressions");
  },

  saveProgression(payload: any) {
    return request<any>("/progressions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getProgression(id: string) {
    return request<any>(`/progressions/${id}`);
  },
};
