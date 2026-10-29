import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Users,
  Fuel,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  RefreshCw,
  ArrowLeft,
  Search,
  Send,
  Database,
  Radio,
  Clock,
  ChevronRight,
  TrendingUp,
  Layers,
  Sparkles,
} from 'lucide-react';
import api from '../api/client';

export default function SuperAdminDashboard({ user, onBack, isThemeLight, appTheme }) {
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'feedbacks' | 'stations' | 'users'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Dashboard ma'lumotlari
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStations: 0,
    openStations: 0,
    pendingStations: 0,
    totalFeedbacks: 0,
    newFeedbacks: 0,
    averageMetanPressure: 0,
    fuelBreakdown: [],
    recentFeedbacks: [],
  });

  const [feedbacks, setFeedbacks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [pendingStations, setPendingStations] = useState([]);
  const [allStationsList, setAllStationsList] = useState([]);
  const [stationFilterMode, setStationFilterMode] = useState('all'); // 'all' | 'pending'

  // Fikrga javob berish
  const [replyText, setReplyText] = useState({});
  const [submittingReply, setSubmittingReply] = useState(null);

  // Qidiruv
  const [searchQuery, setSearchQuery] = useState('');

  const handleDeleteUser = async (user) => {
    if (user.role === 'super_admin' && user.phone?.includes('77 278 18 08')) {
      alert("Asosiy Super Admin hisobini o'chirib bo'lmaydi!");
      return;
    }

    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.phone;
    if (!window.confirm(`Haqiqatan ham "${userName}" foydalanuvchisini o'chirmoqchimisiz?`)) {
      return;
    }

    try {
      const res = await api.admin.deleteUser(user.id);
      if (res && res.success) {
        setUsersList((prev) => prev.filter((u) => u.id !== user.id));
        alert(res.message || "Foydalanuvchi muvaffaqiyatli o'chirildi.");
      } else {
        alert(res?.message || "O'chirishda xatolik yuz berdi.");
      }
    } catch (err) {
      alert(err.message || "Server bilan aloqa uzildi.");
    }
  };


  // Ma'lumotlarni serverdan yuklash
  const loadDashboardData = useCallback(async () => {
    setError('');
    try {
      const [statsRes, feedbacksRes, usersRes, stationsRes] = await Promise.allSettled([
        api.admin.getStats(),
        api.feedbacks.getAll(),
        api.admin.getUsers(),
        api.admin.getAllStations(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
        setStats(statsRes.value.stats);
      }

      if (feedbacksRes.status === 'fulfilled' && feedbacksRes.value?.success) {
        setFeedbacks(feedbacksRes.value.feedbacks || []);
      }

      if (usersRes.status === 'fulfilled' && usersRes.value?.success) {
        setUsersList(usersRes.value.users || []);
      }

      if (stationsRes.status === 'fulfilled' && stationsRes.value?.success) {
        const all = stationsRes.value.stations || [];
        setAllStationsList(all);
        setPendingStations(all.filter((s) => !s.isApproved));
      }
    } catch (err) {
      console.error('Super Admin ma\'lumotlarini yuklashda xato:', err);
      setError('Ma\'lumotlarni yuklashda xatolik yuz berdi. Backend ulanishini tekshiring.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Shahobchani tasdiqlash yoki rad etish
  const handleModerateStation = async (stationId, approve) => {
    try {
      await api.admin.approveStation(stationId, approve);
      setPendingStations((prev) => prev.filter((s) => s.id !== stationId));
      loadDashboardData();
    } catch (err) {
      alert(`Xatolik: ${err.message}`);
    }
  };

  // Fikrga javob yozish
  const handleSendFeedbackReply = async (feedbackId) => {
    const text = replyText[feedbackId];
    if (!text || !text.trim()) return;

    setSubmittingReply(feedbackId);
    try {
      await api.feedbacks.reply(feedbackId, {
        status: 'ko\'rib chiqildi',
        adminReply: text.trim(),
      });
      setReplyText((prev) => ({ ...prev, [feedbackId]: '' }));
      loadDashboardData();
    } catch (err) {
      alert(`Javob yuborishda xato: ${err.message}`);
    } finally {
      setSubmittingReply(null);
    }
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      f.message?.toLowerCase().includes(q) ||
      f.author?.toLowerCase().includes(q) ||
      f.phone?.includes(q) ||
      f.type?.toLowerCase().includes(q)
    );
  });

  const filteredUsers = usersList.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className={`admin-dashboard-container ${isThemeLight ? 'is-light' : ''}`}
      style={{
        '--theme-accent': appTheme?.accent || '#38bdf8',
        '--theme-bg': appTheme?.bg || '#0b0f19',
        '--theme-card': appTheme?.card || '#131b2e',
        '--theme-border': appTheme?.border || 'rgba(255, 255, 255, 0.1)',
        '--theme-panel': appTheme?.panel || '#0f172a',
        '--theme-text': appTheme?.text || (isThemeLight ? '#0f172a' : '#ffffff'),
        '--theme-muted': appTheme?.textMuted || (isThemeLight ? '#64748b' : '#94a3b8'),
      }}
    >
      {/* 1. ADMIN TOP BAR */}
      <div className="admin-header-bar">
        <div className="admin-header-left">
          <button type="button" className="admin-back-btn" onClick={onBack} title="Dasturga qaytish">
            <ArrowLeft size={18} />
            <span>Ortga</span>
          </button>
          <div className="admin-title-badge">
            <ShieldCheck size={20} className="text-amber-400" />
            <div>
              <h2 className="admin-heading">Super Admin Boshqaruvi</h2>
              <div className="admin-live-indicator">
                <span className="live-pulse-dot" />
                <span>PostgreSQL (amaps_db) Jonli Ulandi</span>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-header-right">
          <button
            type="button"
            className={`admin-refresh-btn ${refreshing ? 'spinning' : ''}`}
            onClick={handleRefresh}
            title="Yangilash"
          >
            <RefreshCw size={16} />
            <span>{refreshing ? 'Yangilanmoqda...' : 'Yangilash'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-error-banner">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* 2. STATISTIKA KARTALARI (OVERVIEW TILES) */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-card-icon users-icon">
            <Users size={22} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-label">Jami Foydalanuvchilar</span>
            <strong className="stat-card-val">{stats.totalUsers}</strong>
            <span className="stat-card-sub">PostgreSQL jadvallarida</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-icon stations-icon">
            <Fuel size={22} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-label">Shahobchalar</span>
            <strong className="stat-card-val">{stats.totalStations}</strong>
            <span className="stat-card-sub text-emerald-400">
              {stats.openStations} tasi ochiq ishlamoqda
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-icon feedback-icon">
            <MessageSquare size={22} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-label">Fikr & Shikoyatlar</span>
            <strong className="stat-card-val">{stats.totalFeedbacks}</strong>
            <span className="stat-card-sub text-amber-400">
              {stats.newFeedbacks} ta yangi ko'rilmagan
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-icon pressure-icon">
            <Flame size={22} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-label">O'rtacha Metan Bosimi</span>
            <strong className="stat-card-val">{stats.averageMetanPressure} <small>atm</small></strong>
            <span className="stat-card-sub text-cyan-400">Barqaror holatda</span>
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATSIYASI */}
      <div className="admin-tabs-nav">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <TrendingUp size={16} />
          <span>Statistika & Tahlil</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'feedbacks' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedbacks')}
        >
          <MessageSquare size={16} />
          <span>Fikr & Shikoyatlar ({feedbacks.length})</span>
          {stats.newFeedbacks > 0 && <span className="tab-pill-badge">{stats.newFeedbacks}</span>}
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'stations' ? 'active' : ''}`}
          onClick={() => setActiveTab('stations')}
        >
          <Fuel size={16} />
          <span>Shahobchalar ({allStationsList.length})</span>
          {pendingStations.length > 0 && <span className="tab-pill-badge">{pendingStations.length}</span>}
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          <span>Foydalanuvchilar ({usersList.length})</span>
        </button>
      </div>

      {/* 4. TAB LAR MAZMUNI */}
      <div className="admin-tab-content">
        {/* TAB 1: ASOSIY TAHLIL */}
        {activeTab === 'stats' && (
          <div className="admin-view-section">
            <div className="admin-section-card">
              <h3 className="section-title">
                <Database size={18} className="text-cyan-400" />
                <span>Yoqilg'i turlari bo'yicha taqsimot</span>
              </h3>
              <div className="fuel-distribution-row">
                {stats.fuelBreakdown && stats.fuelBreakdown.length > 0 ? (
                  stats.fuelBreakdown.map((item, idx) => (
                    <div key={idx} className="fuel-dist-box">
                      <span className="fuel-dist-name">{item.fuelType?.toUpperCase()}</span>
                      <strong className="fuel-dist-count">{item.count} ta</strong>
                    </div>
                  ))
                ) : (
                  <div className="text-muted p-3">Hozircha yoqilg'i shahobchalari kiritilmagan.</div>
                )}
              </div>
            </div>

            <div className="admin-section-card mt-4">
              <h3 className="section-title">
                <Clock size={18} className="text-emerald-400" />
                <span>Oxirgi bildirishnomalar va harakatlar</span>
              </h3>
              <div className="recent-activity-list">
                {stats.recentFeedbacks && stats.recentFeedbacks.length > 0 ? (
                  stats.recentFeedbacks.map((f) => (
                    <div key={f.id} className="recent-act-item">
                      <div className="recent-act-head">
                        <span className="recent-author">{f.author || 'Anonim'}</span>
                        <span className={`status-badge ${f.status === 'yangi' ? 'status-yangi' : 'status-done'}`}>{f.status}</span>
                      </div>
                      <p className="recent-msg">"{f.message}"</p>
                      <span className="recent-time">
                        {new Date(f.createdAt).toLocaleString('uz-UZ')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-muted p-3">Oxirgi harakatlar yo'q.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FIKR VA SHIKOYATLAR */}
        {activeTab === 'feedbacks' && (
          <div className="admin-view-section">
            <div className="admin-filter-bar">
              <div className="admin-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Fikr, muallif yoki telefon bo'yicha qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-feedbacks-list">
              {filteredFeedbacks.length === 0 ? (
                <div className="empty-admin-box">
                  <MessageSquare size={36} className="text-muted" />
                  <p>Hech qanday fikr yoki taklif topilmadi.</p>
                </div>
              ) : (
                filteredFeedbacks.map((item) => (
                  <div key={item.id} className="admin-feedback-card">
                    <div className="fb-card-top">
                      <div className="fb-card-author">
                        <strong>{item.author || 'Foydalanuvchi'}</strong>
                        {item.phone && <span className="fb-author-phone">{item.phone}</span>}
                      </div>
                      <div className="fb-card-meta">
                        <span className={`fb-type-pill type-${item.type}`}>{item.type}</span>
                        <span className={`status-badge ${item.status === 'yangi' ? 'status-yangi' : 'status-done'}`}>{item.status}</span>
                        <span className="fb-card-date">
                          {new Date(item.createdAt).toLocaleString('uz-UZ', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="fb-card-body">
                      <p className="fb-message-text">{item.message}</p>
                    </div>

                    {item.adminReply && (
                      <div className="fb-admin-reply-box">
                        <div className="reply-label">
                          <ShieldCheck size={14} className="text-amber-400" />
                          <span>Super Admin javobi:</span>
                        </div>
                        <p>{item.adminReply}</p>
                      </div>
                    )}

                    <div className="fb-reply-action-row">
                      <input
                        type="text"
                        className="fb-reply-input"
                        placeholder="Foydalanuvchiga javob yozish..."
                        value={replyText[item.id] || ''}
                        onChange={(e) =>
                          setReplyText((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendFeedbackReply(item.id);
                        }}
                      />
                      <button
                        type="button"
                        className="fb-reply-btn"
                        onClick={() => handleSendFeedbackReply(item.id)}
                        disabled={submittingReply === item.id}
                      >
                        <Send size={15} />
                        <span>{submittingReply === item.id ? '...' : 'Javob berish'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SHAHOBCHALAR MODERATSIYASI VA BOSHQARUVI */}
        {activeTab === 'stations' && (
          <div className="admin-view-section">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="section-title mb-0">
                <Fuel size={18} className="text-cyan-400" />
                <span>Shahobchalar nazorati & moderatsiya ({allStationsList.length})</span>
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`admin-subfilter-btn ${stationFilterMode === 'all' ? 'active' : ''}`}
                  onClick={() => setStationFilterMode('all')}
                >
                  Barchasi ({allStationsList.length})
                </button>
                <button
                  type="button"
                  className={`admin-subfilter-btn ${stationFilterMode === 'pending' ? 'active' : ''}`}
                  onClick={() => setStationFilterMode('pending')}
                >
                  Kutilmoqda ({pendingStations.length})
                </button>
              </div>
            </div>

            {(stationFilterMode === 'pending' ? pendingStations : allStationsList).length === 0 ? (
              <div className="empty-admin-box">
                <CheckCircle2 size={36} className="text-emerald-400" />
                <p>
                  {stationFilterMode === 'pending'
                    ? "Tasdiqlash kutilayotgan yangi shahobcha yo'q! Barchasi ko'rib chiqilgan."
                    : "Hozircha ma'lumotlar bazasida hech qanday shahobcha mavjud emas (0 ta)."}
                </p>
              </div>
            ) : (
              <div className="pending-stations-list">
                {(stationFilterMode === 'pending' ? pendingStations : allStationsList).map((st) => (
                  <div key={st.id} className="pending-station-card">
                    <div className="pst-info">
                      <div className="flex items-center gap-2">
                        <strong>{st.name}</strong>
                        <span className={`status-badge-mini ${st.isApproved ? 'approved' : 'pending'}`}>
                          {st.isApproved ? 'Tasdiqlangan' : 'Kutilmoqda'}
                        </span>
                        <span className={`status-badge-mini ${st.isOpen ? 'open' : 'closed'}`}>
                          {st.isOpen ? 'Ochiq' : 'Yopiq'}
                        </span>
                      </div>
                      <span className="pst-city">
                        {st.city || 'Toshkent'} • {st.address || "Manzil ko'rsatilmagan"} {st.phone ? `• Tel: ${st.phone}` : ''}
                      </span>
                      {st.ownerFirstName && (
                        <span className="text-xs text-slate-400 mt-1 block">
                          Egasi: {st.ownerFirstName} {st.ownerLastName} ({st.ownerPhone})
                        </span>
                      )}
                      <div className="pst-fuels mt-2">
                        {st.prices && Object.keys(st.prices).length > 0 ? (
                          Object.entries(st.prices).map(([ft, pr]) => (
                            <span key={ft} className="fuel-pill">
                              {ft}: {typeof pr === 'object' ? pr.price : pr} so'm
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">Narxlar kiritilmagan</span>
                        )}
                        {st.gasPressure > 0 && (
                          <span className="fuel-pill text-cyan-400 font-semibold">
                            Metan: {st.gasPressure} atm
                          </span>
                        )}
                      </div>

                      {/* 3 ta Tekshiruv Rasmi */}
                      {(() => {
                        const v = st.verificationImages || st.verification_images;
                        let parsed = v;
                        if (typeof v === 'string') {
                          try { parsed = JSON.parse(v); } catch(e) { parsed = null; }
                        }
                        const imgs = parsed && (parsed.exterior || parsed.interior || parsed.roadside) ? parsed : (Array.isArray(st.images) && st.images.length > 0 ? { exterior: st.images[0], interior: st.images[1], roadside: st.images[2] } : null);
                        if (!imgs) return null;
                        return (
                          <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8', display: 'block', marginBottom: '6px' }}>
                              Tekshiruv uchun 3 ta rasm:
                            </span>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {imgs.exterior && (
                                <div style={{ textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>Tashqari</span>
                                  <img src={imgs.exterior} alt="Tashqari" style={{ width: '60px', height: '50px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }} onClick={() => window.open(imgs.exterior, '_blank')} />
                                </div>
                              )}
                              {imgs.interior && (
                                <div style={{ textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>Ichki</span>
                                  <img src={imgs.interior} alt="Ichki" style={{ width: '60px', height: '50px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }} onClick={() => window.open(imgs.interior, '_blank')} />
                                </div>
                              )}
                              {imgs.roadside && (
                                <div style={{ textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>Yo'l yuzi</span>
                                  <img src={imgs.roadside} alt="Yo'l yuzi" style={{ width: '60px', height: '50px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }} onClick={() => window.open(imgs.roadside, '_blank')} />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="pst-actions">
                      {!st.isApproved ? (
                        <button
                          type="button"
                          className="btn-approve"
                          onClick={() => handleModerateStation(st.id, true)}
                        >
                          <CheckCircle2 size={16} />
                          <span>Tasdiqlash</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-reject"
                          onClick={() => handleModerateStation(st.id, false)}
                          title="Tasdiqni bekor qilish"
                        >
                          <XCircle size={16} />
                          <span>Qaytarish</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-delete-mini"
                        onClick={async () => {
                          if (window.confirm(`"${st.name}" shahobchasini bazadan o'chirmoqchimisiz?`)) {
                            try {
                              await api.stations.delete(st.id);
                              setAllStationsList((prev) => prev.filter((item) => item.id !== st.id));
                              setPendingStations((prev) => prev.filter((item) => item.id !== st.id));
                              loadDashboardData();
                            } catch (e) {
                              alert(e.message);
                            }
                          }
                        }}
                      >
                        O'chirish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: FOYDALANUVCHILAR */}
        {activeTab === 'users' && (
          <div className="admin-view-section">
            <div className="admin-filter-bar">
              <div className="admin-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Ism, familiya yoki telefon bo'yicha qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Foydalanuvchi</th>
                    <th>Telefon</th>
                    <th>Roli</th>
                    <th>Qo'shilgan sana</th>
                    <th style={{ textAlign: 'center' }}>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-4 text-muted">
                        Foydalanuvchilar topilmadi.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="user-td-cell">
                            <strong>{u.firstName} {u.lastName}</strong>
                            {u.bio && <span className="user-td-bio">{u.bio}</span>}
                          </div>
                        </td>
                        <td>{u.phone}</td>
                        <td>
                          <span className={`role-badge role-${u.role}`}>
                            {u.role === 'super_admin' ? '👑 Super Admin' : 'Foydalanuvchi'}
                          </span>
                        </td>
                        <td>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('uz-UZ') : '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {u.role === 'super_admin' && u.phone?.includes('77 278 18 08') ? (
                            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Asosiy Admin</span>
                          ) : (
                            <button
                              type="button"
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              onClick={() => handleDeleteUser(u)}
                              style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                              🗑️ O'chirish
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
