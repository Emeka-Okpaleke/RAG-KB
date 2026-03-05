const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  token?: string;
}

async function apiFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(rest.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...rest,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth
export const authAPI = {
  register: (data: { email: string; password: string; name: string }) =>
    apiFetch("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    apiFetch("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  me: (token: string) => apiFetch("/api/v1/auth/me", { token }),
};

// Collections
export const collectionsAPI = {
  list: (token: string) => apiFetch("/api/v1/collections", { token }),
  get: (token: string, id: string) =>
    apiFetch(`/api/v1/collections/${id}`, { token }),
  create: (token: string, data: { name: string; description?: string }) =>
    apiFetch("/api/v1/collections", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    }),
  delete: (token: string, id: string) =>
    apiFetch(`/api/v1/collections/${id}`, { method: "DELETE", token }),
};

// Documents
export const documentsAPI = {
  upload: (token: string, file: File, collectionId: string, description?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("collection_id", collectionId);
    if (description) formData.append("description", description);
    return apiFetch("/api/v1/documents/upload", {
      method: "POST",
      token,
      body: formData,
    });
  },
  get: (token: string, id: string) =>
    apiFetch(`/api/v1/documents/${id}`, { token }),
  getChunks: (token: string, id: string, page = 1) =>
    apiFetch(`/api/v1/documents/${id}/chunks?page=${page}`, { token }),
  delete: (token: string, id: string) =>
    apiFetch(`/api/v1/documents/${id}`, { method: "DELETE", token }),
};

// Query / RAG
export const queryAPI = {
  ask: (
    token: string,
    data: {
      question: string;
      collection_ids?: string[];
      conversation_id?: string;
      top_k?: number;
    }
  ) =>
    apiFetch("/api/v1/query", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    }),
  listConversations: (token: string) =>
    apiFetch("/api/v1/query/conversations", { token }),
  getConversation: (token: string, id: string) =>
    apiFetch(`/api/v1/query/conversations/${id}`, { token }),
  deleteConversation: (token: string, id: string) =>
    apiFetch(`/api/v1/query/conversations/${id}`, { method: "DELETE", token }),
};

// Health
export const healthAPI = {
  check: () => apiFetch("/health"),
  ready: () => apiFetch("/health/ready"),
  stats: () => apiFetch("/stats"),
};
