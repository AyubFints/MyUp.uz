// MyUp.uz Markaziy API mijozi (Frontend -> Backend Express + PostgreSQL)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Yordamchi so'rov yuboruvchi funksiya
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('myup_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `So'rovda xatolik yuz berdi (${response.status})`);
  }
  return data;
}

export const api = {
  // 1. AUTENTIFIKATSIYA (Auth)
  auth: {
    login: (phone, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      }),

    register: (userData) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),

    getMe: () => request('/auth/me'),

    updateProfile: (profileData) =>
      request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }),
  },

  // 2. SHAHOBCHALAR (Stations)
  stations: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.userLat) query.set('userLat', params.userLat);
      if (params.userLng) query.set('userLng', params.userLng);
      if (params.city) query.set('city', params.city);
      if (params.fuelType) query.set('fuelType', params.fuelType);
      if (params.all) query.set('all', 'true');
      const qs = query.toString();
      return request(`/stations${qs ? `?${qs}` : ''}`);
    },

    create: (stationData) =>
      request('/stations', {
        method: 'POST',
        body: JSON.stringify(stationData),
      }),

    updateStatus: (id, statusData) =>
      request(`/stations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(statusData),
      }),

    updateFuelPrice: (stationId, fuelType, fuelData) =>
      request(`/stations/${stationId}/fuels/${fuelType}`, {
        method: 'PUT',
        body: JSON.stringify(fuelData),
      }),

    delete: (id, data = null) =>
      request(`/stations/${id}`, {
        method: 'DELETE',
        ...(data ? { body: JSON.stringify(data) } : {}),
      }),
  },

  // 3. FIKR VA BILDIRISHNOMALAR (Feedbacks)
  feedbacks: {
    create: (feedbackData) =>
      request('/feedbacks', {
        method: 'POST',
        body: JSON.stringify(feedbackData),
      }),

    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/feedbacks${query ? `?${query}` : ''}`);
    },

    reply: (id, replyData) =>
      request(`/feedbacks/${id}/reply`, {
        method: 'PATCH',
        body: JSON.stringify(replyData),
      }),
  },

  // 4. SUPER ADMIN (Dashboard stats, approvals, users)
  admin: {
    getStats: () => request('/admin/stats'),
    getAllStations: () => request('/admin/stations'),
    getUsers: () => request('/admin/users'),
    approveStation: (stationId, isApproved) =>
      request(`/admin/stations/${stationId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ isApproved }),
      }),
    deleteUser: (userId) =>
      request(`/admin/users/${userId}`, {
        method: 'DELETE',
      }),
  },

  // 5. REKLAMALAR VA BILLING (Video Ads)
  ads: {
    getActive: (side) => request(`/ads${side ? `?side=${side}` : ''}`),
    getAllAdmin: () => request('/ads/admin'),
    recordView: (id) => request(`/ads/${id}/view`, { method: 'POST' }),
    recordClick: (id) => request(`/ads/${id}/click`, { method: 'POST' }),
    create: (adData) =>
      request('/ads/admin', {
        method: 'POST',
        body: JSON.stringify(adData),
      }),
    toggleStatus: (id, isActive) =>
      request(`/ads/admin/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),
    delete: (id) =>
      request(`/ads/admin/${id}`, {
        method: 'DELETE',
      }),
  },

  // 6. JONLI TRAFIK VA TASHRIFLAR (Live Analytics)
  analytics: {
    sendVisit: (data) =>
      request('/analytics/visit', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getTraffic: () => request('/analytics/live'),
  },

  // 8. BILDIRISHNOMALAR (User Notifications)
  notifications: {
    getAll: (params) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/notifications${qs}`);
    },
    markAllRead: (params) =>
      request('/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify(params || {}),
      }),
    delete: (id) =>
      request(`/notifications/${id}`, {
        method: 'DELETE',
      }),
  },

  // 7. SERVER SOG'LIG'I (Health check)
  checkHealth: () => request('/health'),
};

export default api;
