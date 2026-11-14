// MyUp.uz Markaziy API mijozi (Frontend -> Backend Express + PostgreSQL)

export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    // Agar telefon yoki boshqa qurilmadan kompyuterning lokal IP si orqali kirilayotgan bo'lsa
    if (envUrl && envUrl.includes('localhost') && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return envUrl.replace('localhost', window.location.hostname);
    }
    if (!envUrl && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `${window.location.protocol}//${window.location.hostname}:5000/api`;
    }
  }
  return envUrl || 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Yordamchi so'rov yuboruvchi funksiya (avtomatik retry va 8s barqaror timeout)
async function request(endpoint, options = {}, retries = 1) {
  const token = localStorage.getItem('myup_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // 8 soniyalik qulay timeout (mobil internet va 3G/4G tarmoqlarda barqaror ishlashi uchun)
  const timeoutMs = options.timeout || 8000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `So'rovda xatolik yuz berdi (${response.status})`);
    }
    return data;
  } catch (err) {
    clearTimeout(timeoutId);

    // Agar mobil tarmoq uzilsa yoki vaqtinchalik timeout bo'lsa, GET so'rovlarni avtomatik 1 marta qayta sinash
    const isGetOrSafe = !options.method || options.method === 'GET';
    if (retries > 0 && isGetOrSafe && (err.name === 'AbortError' || err.message?.includes('fetch') || err.name === 'TypeError')) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return request(endpoint, options, retries - 1);
    }

    if (err.name === 'AbortError') {
      throw new Error("Server javob berish vaqti tugadi (Timeout)");
    }
    throw err;
  }
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

    getMyStations: (params = {}) => {
      const query = new URLSearchParams();
      if (params.userId) query.set('userId', params.userId);
      if (params.phone) query.set('phone', params.phone);
      const qs = query.toString();
      return request(`/stations/my${qs ? `?${qs}` : ''}`);
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

    deleteFuel: (stationId, fuelType) =>
      request(`/stations/${stationId}/fuels/${fuelType}`, {
        method: 'DELETE',
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
