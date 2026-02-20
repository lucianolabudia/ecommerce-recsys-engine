const API_BASE = "http://localhost:8000";

async function fetchJSON(url) {
  const response = await fetch(`${API_BASE}${url}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function postJSON(url, body) {
  const response = await fetch(`${API_BASE}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// Helper to get current language from localStorage
function getLang() {
  return localStorage.getItem("app_lang") || "en";
}

// Helper to append lang param to a URL
function withLang(url) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}lang=${getLang()}`;
}

export const api = {
  // Health
  health: () => fetchJSON("/"),

  // Dashboard
  getStats: () => fetchJSON("/dashboard/stats"),
  getTopProducts: (limit = 10) => fetchJSON(withLang(`/dashboard/top-products?limit=${limit}`)),
  getProducts: (page = 1, pageSize = 20, search = "") =>
    fetchJSON(withLang(`/dashboard/products?page=${page}&page_size=${pageSize}&search=${encodeURIComponent(search)}`)),
  getRules: (page = 1, pageSize = 20, minConfidence = 0) =>
    fetchJSON(withLang(`/dashboard/rules?page=${page}&page_size=${pageSize}&min_confidence=${minConfidence}`)),
  getUserProfile: (userId) => fetchJSON(withLang(`/dashboard/user/${userId}`)),
  getUsers: (page = 1, pageSize = 50) =>
    fetchJSON(`/dashboard/users?page=${page}&page_size=${pageSize}`),
  getModelInfo: () => fetchJSON("/dashboard/model-info"),
  getRecommendationDistribution: () => fetchJSON("/dashboard/recommendation-distribution"),

  // Search / Autocomplete
  searchProducts: (query, limit = 10) =>
    fetchJSON(withLang(`/dashboard/product-search?q=${encodeURIComponent(query)}&limit=${limit}`)),
  searchUsers: (query, limit = 10) =>
    fetchJSON(`/dashboard/user-search?q=${encodeURIComponent(query)}&limit=${limit}`),
  getCartItems: () => fetchJSON(withLang("/dashboard/cart-items")),

  // Recommendations
  getUserRecommendations: (userId, topN = 5) =>
    fetchJSON(withLang(`/recommend/user/${userId}?top_n=${topN}`)),
  getAssociationRecommendations: (cartItems, topN = 5) =>
    postJSON(withLang("/recommend/association"), { cart_items: cartItems, top_n: topN }),
};
