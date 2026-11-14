// MyUp.uz Markaziy API mijozi (Frontend -> Backend Express + PostgreSQL)

export const PUBLIC_BACKEND_URL = 'https://shift-eggs-sugar-top.trycloudflare.com/api';

export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // 0. URL parametri orqali kiritilgan backend manzili (masalan: ?api=https://... yoki ngrok)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const queryApi = urlParams.get('api') || urlParams.get('apiUrl');
      if (queryApi && queryApi.startsWith('http')) {
        const clean = queryApi.replace(/\/$/, '');
        localStorage.setItem('myup_custom_api_url', clean);
        return clean;
      }
    } catch {}

    // 1. Saqlangan maxsus backend manzili
    try {
      const storedApi = localStorage.getItem('myup_custom_api_url');
      if (storedApi && storedApi.startsWith('http')) {
        return storedApi.replace(/\/$/, '');
      }
    } catch {}

    const hostname = window.location.hostname;
    const isLocalIp = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname) || hostname.endsWith('.local');

    // 2. Wi-Fi dagi telefon kompyuterning lokal IP si (192.168.x.x) orqali kirayotgan bo'lsa
    const envUrl = import.meta.env.VITE_API_URL;
    if (isLocalIp && envUrl && envUrl.includes('localhost')) {
      return envUrl.replace('localhost', hostname);
    }

    // 3. Vercel yoki internetdagi domen orqali kirilayotgan bo'lsa (Cloudflare orqali markaziy serverga to'g'ridan-to'g'ri ulanish)
    if (!isLocalIp && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      if (envUrl && !envUrl.includes('localhost')) {
        return envUrl.replace(/\/$/, '');
      }
      return PUBLIC_BACKEND_URL;
    }

    if (envUrl) return envUrl.replace(/\/$/, '');
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
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
    const baseUrl = getApiBaseUrl();
    let response;

    try {
      response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      });

      const contentType = response.headers.get('content-type') || '';
      if ((!response.ok || contentType.includes('text/html')) && baseUrl !== PUBLIC_BACKEND_URL) {
        // Asosiy baseUrl xato bersa, to'g'ridan-to'g'ri Cloudflare backendiga ulanish
        const fbRes = await fetch(`${PUBLIC_BACKEND_URL}${endpoint}`, {
          ...options,
          headers,
          signal: options.signal || controller.signal,
        });
        const fbType = fbRes.headers.get('content-type') || '';
        if (fbRes.ok && !fbType.includes('text/html')) {
          response = fbRes;
        }
      }
    } catch (netErr) {
      if (baseUrl !== PUBLIC_BACKEND_URL) {
        response = await fetch(`${PUBLIC_BACKEND_URL}${endpoint}`, {
          ...options,
          headers,
          signal: options.signal || controller.signal,
        });
      } else {
        throw netErr;
      }
    }

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error("Server API javobi o'rniga HTML qaytdi (Backend ulanmagan yoki so'rov yo'naltirilmadi)");
    }

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
