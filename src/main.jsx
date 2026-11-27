import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Vite yangi versiya chiqqanda asset/CSS preload xatolarini avtomatik tutish va sahifani muammosiz yangilash
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    console.warn('Yangi reliz sababli kesh tozalanmoqda va sahifa yangilanmoqda...');
    try {
      if ('caches' in window) {
        caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))).finally(() => {
          window.location.reload();
        });
        return;
      }
    } catch (e) {}
    window.location.reload();
  });
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    const msg = String(error?.message || error || '').toLowerCase();
    const isChunkOrPreloadError =
      msg.includes('failed to fetch dynamically imported module') ||
      msg.includes('dynamically imported module') ||
      msg.includes('importing a module script failed') ||
      msg.includes('error loading dynamically imported module') ||
      msg.includes('load failed') ||
      msg.includes('failed to fetch') ||
      msg.includes('loading chunk') ||
      msg.includes('unable to preload css') ||
      msg.includes('preload css') ||
      msg.includes('unable to preload') ||
      msg.includes('failed to load resource') ||
      msg.includes('loading css chunk') ||
      msg.includes('networkerror') ||
      msg.includes('mime type');

    if (isChunkOrPreloadError) {
      const lastReload = parseInt(sessionStorage.getItem('chunk_reload_ts') || '0', 10);
      const now = Date.now();
      // Oxirgi 12 soniya ichida yangilanmagan bo'lsa, xatolik ko'rsatmasdan jimjit yangilaymiz
      if (now - lastReload > 12000) {
        sessionStorage.setItem('chunk_reload_ts', String(now));
        try {
          if ('caches' in window) {
            caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))).finally(() => {
              window.location.reload();
            });
            return { hasError: false, error: null, errorInfo: null };
          }
        } catch (e) {}
        window.location.reload();
        return { hasError: false, error: null, errorInfo: null };
      }
    }
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Xatoligi (ErrorBoundary):", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#090d16',
          color: '#f87171',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '650px',
            width: '100%',
            backgroundColor: '#131b2e',
            border: '1px solid #ef4444',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ margin: '0 0 12px 0', color: '#f87171', fontSize: '20px' }}>
              ⚠️ Ilovada xatolik yuz berdi
            </h2>
            <p style={{ margin: '0 0 16px 0', color: '#94a3b8', fontSize: '14px' }}>
              Xatolik matni:
            </p>
            <pre style={{
              background: '#0a0f1d',
              padding: '14px',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '13px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: '260px',
              overflowY: 'auto',
              border: '1px solid #1e293b'
            }}>
              {this.state.error?.toString() || 'Noma\'lum xatolik'}
              {'\n\n'}
              {this.state.error?.stack || ''}
              {this.state.errorInfo?.componentStack ? `\n\nComponent Stack:\n${this.state.errorInfo.componentStack}` : ''}
            </pre>
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button
                onClick={async () => {
                  try {
                    localStorage.removeItem('myup_my_stations');
                    localStorage.removeItem('myup_stations');
                    sessionStorage.clear();
                    if ('serviceWorker' in navigator) {
                      const registrations = await navigator.serviceWorker.getRegistrations();
                      for (const reg of registrations) {
                        await reg.unregister();
                      }
                    }
                    if ('caches' in window) {
                      const keys = await caches.keys();
                      await Promise.all(keys.map((k) => caches.delete(k)));
                    }
                  } catch (e) {}
                  window.location.reload();
                }}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Keshni tozalash va Qayta yuklash
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#334155',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Qayta urinish
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Service Worker ro'yxatdan o'tkazish (Bildirishnomalar va fon xabarlari uchun)
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('✅ A-Maps Service Worker faollashtirildi:', reg.scope);
      })
      .catch((err) => {
        console.warn('Service Worker registratsiya ogohlantirish:', err.message);
      });
  });
}

