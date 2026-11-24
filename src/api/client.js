// MyUp.uz Markaziy API mijozi (Frontend -> Backend Express + PostgreSQL)

export const PUBLIC_BACKEND_URL = 'https://api.ax-map.online/api';

// Xavfsizlik: Faqat ishonchli domen va server manzillariga ruxsat berish
export const isTrustedApiUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    // 1. Lokal rivojlanish
    if (host === 'localhost' || host === '127.0.0.1') return true;
    // 2. Wi-Fi / Lokal tarmoq IP lari (192.168.*, 10.*, 172.16-31.*)
    if (/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host) || host.endsWith('.local')) return true;
    // 3. Ishonchli Cloudflare tunnel domeni (*.trycloudflare.com)
    if (host.endsWith('.trycloudflare.com')) return true;
    // 4. Loyiha rasmiy domeni (myup.uz, *.myup.uz, ax-map.online, *.ax-map.online)
    if (host === 'myup.uz' || host.endsWith('.myup.uz') || host === 'ax-map.online' || host.endsWith('.ax-map.online')) return true;
    // 5. Build vaqtida ko'rsatilgan VITE_API_URL domeni
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && envUrl.startsWith('http')) {
      const envHost = new URL(envUrl).hostname.toLowerCase();
      if (host === envHost) return true;
    }
    return false;
  } catch {
    return false;
  }
};

export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // 0. URL parametri orqali kiritilgan ishonchli backend manzili (?api=...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const queryApi = urlParams.get('api') || urlParams.get('apiUrl');
      if (queryApi && queryApi.startsWith('http') && isTrustedApiUrl(queryApi)) {
        const clean = queryApi.replace(/\/$/, '');
        try {
          localStorage.setItem('myup_api_url', clean);
        } catch {}
        return clean;
      }
    } catch {}

    // 1. Brauzer xotirasidagi dinamik API manzili (faqat ishonchli bo'lsa va eski lokal bo'lmasa)
    try {
      const savedApi = localStorage.getItem('myup_api_url') || localStorage.getItem('amaps_admin_api_url');
      if (savedApi && savedApi.startsWith('http') && isTrustedApiUrl(savedApi) && !savedApi.includes('localhost') && !savedApi.includes('trycloudflare')) {
        return savedApi.replace(/\/$/, '');
      }
    } catch {}

    const hostname = window.location.hostname;
    const isLocalIp = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname) || hostname.endsWith('.local');

    // 2. Wi-Fi dagi telefon kompyuterning lokal IP si (192.168.x.x) orqali kirayotgan bo'lsa
    const envUrl = import.meta.env.VITE_API_URL;
    if (isLocalIp) {
      if (envUrl && envUrl.includes('localhost')) {
        return envUrl.replace('localhost', hostname);
      }
      return `http://${hostname}:5000/api`;
    }

    // 3. Agar haqiqiy tashqi/production VITE_API_URL berilgan bo'lsa
    if (envUrl && !envUrl.includes('localhost') && envUrl.startsWith('http')) {
      return envUrl.replace(/\/$/, '');
    }

    // 4. Vercel yoki internetdagi tashqi domen orqali kirilayotgan bo'lsa (Cloudflare HTTP/2 tunnel)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return PUBLIC_BACKEND_URL;
    }

    if (envUrl) return envUrl.replace(/\/$/, '');
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Yordamchi so'rov yuboruvchi funksiya (avtomatik retry va barqaror timeout)
async function request(endpoint, options = {}, retries = 2) {
  const token = localStorage.getItem('myup_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Katta so'rovlar (masalan shahobcha yaratish) uchun 90s, oddiylar uchun 30s
  const timeoutMs = options.timeout || (options.method === 'POST' ? 90000 : 30000);
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
      if ((!response.ok || contentType.includes('text/html')) && baseUrl !== PUBLIC_BACKEND_URL && PUBLIC_BACKEND_URL) {
        // Asosiy baseUrl xato bersa, Cloudflare orqali sinab ko'rish
        try {
          const fbRes = await fetch(`${PUBLIC_BACKEND_URL}${endpoint}`, {
            ...options,
            headers,
            signal: options.signal || controller.signal,
          });
          const fbType = fbRes.headers.get('content-type') || '';
          if (fbRes.ok && !fbType.includes('text/html')) {
            response = fbRes;
          }
        } catch {}
      }
    } catch (netErr) {
      if (baseUrl !== PUBLIC_BACKEND_URL && PUBLIC_BACKEND_URL) {
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

    // Agar mobil tarmoq uzilsa yoki vaqtinchalik timeout / socket uzilishi bo'lsa, avtomatik qayta sinash
    const isNetworkErr = err.name === 'AbortError' || err.message?.includes('fetch') || err.name === 'TypeError';
    if (retries > 0 && isNetworkErr) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return request(endpoint, options, retries - 1);
    }

    if (err.name === 'AbortError') {
      throw new Error("Server javob berish vaqti tugadi (Timeout). Iltimos, internet aloqasini tekshirib qaytadan urinib ko'ring.");
    }
    if (err.message?.includes('fetch') || err.name === 'TypeError') {
      throw new Error("Internet aloqasi sustligi yoki tarmoq uzilishi sababli serverga ulanib bo'lmadi. Internet aloqangizni tekshirib, qaytadan urinib ko'ring.");
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
        timeout: 60000,
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
