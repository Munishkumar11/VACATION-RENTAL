const BASE = "http://localhost:5000";

const req = async (url, options = {}) => {
  const res = await fetch(`${BASE}${url}`, {
    credentials: "include",
    ...options,
  });
  return res.json();
};

const api = {
  // AUTH
  register: (data) => req("/user/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  login:    (data) => req("/user/login",    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  logout:   ()     => req("/user/logout",   { method: "POST" }),

  // PROFILE
  getProfile:  ()     => req("/user/me"),
  saveProfile: (data) => {
    if (data.photo instanceof File) {
      const form = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v instanceof File) form.append(k, v);
        else if (typeof v === "object" && v !== null) form.append(k, JSON.stringify(v));
        else form.append(k, v);
      });
      return req("/user/me", { method: "PUT", body: form });
    }
    return req("/user/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  },

  // CARDS
  addCard:    (data)   => req("/user/me/cards",           { method: "POST",   headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  deleteCard: (cardId) => req(`/user/me/cards/${cardId}`, { method: "DELETE" }),

  // BANK
  saveBank: (data) => req("/user/me/bank", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),

  // BOOKINGS
  getMyBookings: () => req("/booking/my-bookings"),

  // MESSAGES
  getConversations: () => req("/message/conversations"),
  getConversationMessages: (userId, propertyId) =>
    req(`/message/with/${userId}${propertyId ? `?propertyId=${propertyId}` : ""}`),
  sendMessage: (data) =>
    req("/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deleteMessage: (messageId) =>
    req(`/message/${messageId}`, {
      method: "DELETE",
    }),
  markConversationRead: (userId, propertyId) =>
    req(`/message/read/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(propertyId ? { propertyId } : {}),
    }),
};

export default api;
