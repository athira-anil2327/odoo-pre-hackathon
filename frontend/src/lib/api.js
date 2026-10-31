import { browser } from "$app/environment";

// In development or production with Vite proxy, relative /api paths route to backend
// Fallback to http://localhost:5000 if needed
const API_BASE = "/api";

export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (browser) {
    const token = localStorage.getItem("bl_token");
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error?.message || data?.message || `HTTP error ${res.status}`;
      return {
        success: false,
        error: { message: errorMsg },
        status: res.status
      };
    }

    return {
      success: true,
      data: data?.data !== undefined ? data.data : data,
      message: data?.message,
      status: res.status
    };
  } catch (err) {
    console.error("API Fetch Network Error:", err);
    return {
      success: false,
      error: { message: err.message || "Network request failed" },
      status: 0
    };
  }
}

// Domain API Clients
export const authApi = {
  login: (email, password) => apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (payload) => apiFetch("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  getMe: () => apiFetch("/auth/me"),
  forgotPassword: (email) => apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (payload) => apiFetch("/auth/reset-password", { method: "POST", body: JSON.stringify(payload) }),
  getUsers: () => apiFetch("/auth/users"),
  createStaff: (payload) => apiFetch("/auth/staff", { method: "POST", body: JSON.stringify(payload) })
};

export const customersApi = {
  getAll: () => apiFetch("/customers"),
  getById: (id) => apiFetch(`/customers/${id}`),
  create: (payload) => apiFetch("/customers", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => apiFetch(`/customers/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (id) => apiFetch(`/customers/${id}`, { method: "DELETE" })
};

export const productsApi = {
  getAll: (params = "") => apiFetch(`/products${params ? `?${params}` : ""}`),
  getById: (id) => apiFetch(`/products/${id}`),
  create: (payload) => apiFetch("/products", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => apiFetch(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (id) => apiFetch(`/products/${id}`, { method: "DELETE" }),
  addVariant: (productId, payload) => apiFetch(`/products/${productId}/variants`, { method: "POST", body: JSON.stringify(payload) }),
  updateVariant: (variantId, payload) => apiFetch(`/products/variants/${variantId}`, { method: "PUT", body: JSON.stringify(payload) })
};

export const plansApi = {
  getAll: () => apiFetch("/plans"),
  getById: (id) => apiFetch(`/plans/${id}`),
  create: (payload) => apiFetch("/plans", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => apiFetch(`/plans/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (id) => apiFetch(`/plans/${id}`, { method: "DELETE" })
};

export const quotationsApi = {
  getAll: () => apiFetch("/quotations"),
  getById: (id) => apiFetch(`/quotations/${id}`),
  create: (payload) => apiFetch("/quotations", { method: "POST", body: JSON.stringify(payload) }),
  createFromTemplate: (payload) => apiFetch("/quotations/from-template", { method: "POST", body: JSON.stringify(payload) }),
  send: (id) => apiFetch(`/quotations/${id}/send`, { method: "POST" }),
  confirm: (id) => apiFetch(`/quotations/${id}/confirm`, { method: "POST" }),
  cancel: (id) => apiFetch(`/quotations/${id}/cancel`, { method: "POST" }),
  getTemplates: () => apiFetch("/quotations/templates"),
  getTemplateById: (id) => apiFetch(`/quotations/templates/${id}`),
  createTemplate: (payload) => apiFetch("/quotations/templates", { method: "POST", body: JSON.stringify(payload) })
};

export const subscriptionsApi = {
  getAll: () => apiFetch("/subscriptions"),
  getById: (id) => apiFetch(`/subscriptions/${id}`),
  create: (payload) => apiFetch("/subscriptions", { method: "POST", body: JSON.stringify(payload) }),
  pause: (id, reason) => apiFetch(`/subscriptions/${id}/pause`, { method: "POST", body: JSON.stringify({ reason }) }),
  resume: (id) => apiFetch(`/subscriptions/${id}/resume`, { method: "POST" }),
  close: (id, reason) => apiFetch(`/subscriptions/${id}/close`, { method: "POST", body: JSON.stringify({ reason }) }),
  renew: (id) => apiFetch(`/subscriptions/${id}/renew`, { method: "POST" }),
  getEvents: (id) => apiFetch(`/subscriptions/${id}/events`)
};

export const invoicesApi = {
  getAll: () => apiFetch("/invoices"),
  getById: (id) => apiFetch(`/invoices/${id}`),
  create: (payload) => apiFetch("/invoices", { method: "POST", body: JSON.stringify(payload) }),
  generateBillingCycle: () => apiFetch("/invoices/generate-billing-cycle", { method: "POST" }),
  confirm: (id) => apiFetch(`/invoices/${id}/confirm`, { method: "POST" }),
  cancel: (id) => apiFetch(`/invoices/${id}/cancel`, { method: "POST" })
};

export const taxesApi = {
  getAll: () => apiFetch("/taxes"),
  create: (payload) => apiFetch("/taxes", { method: "POST", body: JSON.stringify(payload) })
};

export const discountsApi = {
  getAll: () => apiFetch("/discounts"),
  create: (payload) => apiFetch("/discounts", { method: "POST", body: JSON.stringify(payload) }),
  validate: (payload) => apiFetch("/discounts/validate", { method: "POST", body: JSON.stringify(payload) })
};

export const paymentsApi = {
  getAll: () => apiFetch("/payments"),
  record: (payload) => apiFetch("/payments", { method: "POST", body: JSON.stringify(payload) })
};

export const dashboardApi = {
  getFinanceSummary: () => apiFetch("/dashboard/finance-summary"),
  getSubscriptionsSummary: () => apiFetch("/dashboard/subscriptions-summary"),
  getOverdueInvoices: () => apiFetch("/dashboard/overdue-invoices")
};
