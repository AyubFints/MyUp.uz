import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
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
                onClick={() => {
                  try {
                    localStorage.removeItem('myup_my_stations');
                    localStorage.removeItem('myup_stations');
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

