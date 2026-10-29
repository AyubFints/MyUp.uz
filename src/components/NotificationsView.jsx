import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Bell,
  MessageSquarePlus,
  Send,
  X,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Clock,
  ArrowDown,
  Trash2,
  MessageSquare,
  Lightbulb,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  User,
  AlertCircle,
} from "lucide-react";
import amapsEmptyMascot from "../assets/amaps-empty-notif.png";
import api from "../api/client";

// Sana formatlovchi yordamchi funksiya: masalan, "25-okt 14:30"
const formatNotifDate = (dateVal) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const months = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}-${month} ${hours}:${mins}`;
};

export default function NotificationsView({
  user,
  onBack,
  hasUnread,
  onClearUnread,
  onUpdateUser,
  onGoToAuth,
  onGoToLocationRegister,
  isThemeLight,
  appTheme,
}) {

  // Fikr qoldirish formasi ochiq/yopiq holati
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("fikr"); // taklif, fikr, shikoyat
  const [feedbackText, setFeedbackText] = useState("");
  const [successToast, setSuccessToast] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ========================================================
  // JOYLASHUV QO'SHISHNI TASDIQLASH HOLATLARI
  // ========================================================
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);
  const [showLocationConfirmModal, setShowLocationConfirmModal] = useState(false);
  const [selectedLocationChoice, setSelectedLocationChoice] = useState(null); // true = Ha, false = Yo'q
  const [showSuccessAnimationModal, setShowSuccessAnimationModal] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(5);

  const isLocationActive = Boolean(user?.hasLocation || user?.has_location);

  // Joylashuv qo'shish tugmasi bosilganda -> Joylashuv joylash registratsiyasiga olib borish
  const handleOpenLocationFlow = () => {
    if (typeof onGoToLocationRegister === "function") {
      onGoToLocationRegister();
      return;
    }
    if (!user) {
      if (typeof onGoToAuth === "function") {
        onGoToAuth();
      } else {
        setShowAuthRequiredModal(true);
      }
      return;
    }
    setSelectedLocationChoice(isLocationActive ? true : null);
    setShowLocationConfirmModal(true);
  };

  // "Ha" ni tanlab "Tasdiqlash" bosilganda
  const handleConfirmLocationActivation = () => {
    const updatedUser = { ...user, hasLocation: true, has_location: true };
    try {
      localStorage.setItem("myup_user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error(err);
    }
    if (typeof onUpdateUser === "function") {
      onUpdateUser(updatedUser);
    }

    // Backend bazada ham has_location ni saqlash
    try {
      api.auth.updateProfile({ hasLocation: true });
    } catch (err) {
      console.warn("Backend hasLocation update xatosi:", err);
    }

    setShowLocationConfirmModal(false);

    // 5 sekundlik markaziy animatsiyali modalni ochish
    setCountdownSeconds(5);
    setShowSuccessAnimationModal(true);
  };

  // "Yo'q" ni tanlab saqlaganda (agar o'chirmoqchi bo'lsa)
  const handleDeactivateLocation = () => {
    const updatedUser = { ...user, hasLocation: false, has_location: false };
    try {
      localStorage.setItem("myup_user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error(err);
    }
    if (typeof onUpdateUser === "function") {
      onUpdateUser(updatedUser);
    }

    try {
      api.auth.updateProfile({ hasLocation: false });
    } catch (err) {
      console.warn("Backend hasLocation update xatosi:", err);
    }

    setShowLocationConfirmModal(false);
    setSuccessToast("Joylashuv qo'shish imkoniyati o'chirildi.");
    setTimeout(() => {
      setSuccessToast("");
    }, 3500);
  };

  // 5 sekundlik taymer
  useEffect(() => {
    if (!showSuccessAnimationModal) return;
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowSuccessAnimationModal(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showSuccessAnimationModal]);

  // 1. Foydalanuvchining O'ZI yuborgan bildirishnomalari (Fikr, taklif, shikoyatlar)
  const [myFeedbacks, setMyFeedbacks] = useState(() => {
    try {
      const saved = localStorage.getItem("myup_my_sent_feedbacks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2. Foydalanuvchiga KELGAN bildirishnomalar (ko'rib bo'linganidan so'ng 1 kun saqlanadi)
  const [incomingNotifications, setIncomingNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("myup_incoming_notifications");
      if (saved) {
        const parsed = JSON.parse(saved);
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        const filtered = parsed.filter((item) => {
          if (item.readAt) {
            const age = Date.now() - new Date(item.readAt).getTime();
            if (age >= ONE_DAY_MS) return false;
          }
          return item.id !== "sys_amaps_welcome" && !item.id?.startsWith("incoming_reply_");
        });
        return filtered;
      }
    } catch {
      // fallback
    }
    return [];
  });

  const formSectionRef = useRef(null);

  // Eski tizim eslatmasi saqlangan bo'lsa uni localStorage dan tozalash
  useEffect(() => {
    try {
      const saved = localStorage.getItem("myup_incoming_notifications");
      if (saved) {
        const parsed = JSON.parse(saved);
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        const filtered = parsed.filter((item) => {
          if (item.readAt) {
            const age = Date.now() - new Date(item.readAt).getTime();
            if (age >= ONE_DAY_MS) return false;
          }
          return item.id !== "sys_amaps_welcome" && !item.id?.startsWith("incoming_reply_");
        });
        localStorage.setItem("myup_incoming_notifications", JSON.stringify(filtered));
      }
    } catch {
      // ignore
    }
  }, []);

  // PostgreSQL bazasidan faqat ushbu foydalanuvchining o'zi yuborgan bildirishnomalarini yuklash
  useEffect(() => {
    let isMounted = true;
    const userPhone = user?.phoneNumber || user?.phone || "";
    const userId = user?.id || null;

    api.feedbacks
      .getAll({ userId: userId || "", phone: userPhone })
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.feedbacks)) {
          const formatted = res.feedbacks.map((f) => ({
            id: f.id,
            userId: f.userId,
            type: f.type,
            text: f.message,
            author: f.author || `${user?.firstName || user?.first_name || ""} ${user?.lastName || user?.last_name || ""}`.trim() || "Siz",
            phone: f.phone || "",
            date: formatNotifDate(f.createdAt),
            status: f.status === "yangi" ? "Yuborildi" : f.status,
            adminReply: f.adminReply,
          }));

          setMyFeedbacks(formatted);
          localStorage.setItem("myup_my_sent_feedbacks", JSON.stringify(formatted));
        }
      })
      .catch((err) => {
        console.warn("API dan fikrlarni olishda xato (offline rejim):", err.message);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // PostgreSQL bazasidan kelgan bildirishnomalarni yuklash va o'qilgan deb belgilash
  useEffect(() => {
    let isMounted = true;
    const userPhone = user?.phoneNumber || user?.phone || "";
    const userId = user?.id || null;

    if (!userPhone && !userId) return;

    api.notifications
      ?.getAll({ userId: userId || "", phone: userPhone })
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.notifications)) {
          const ONE_DAY_MS = 24 * 60 * 60 * 1000;
          const apiNotifs = res.notifications
            .map((n) => ({
              id: n.id,
              title: n.title,
              message: n.message,
              badge: n.badge || (n.type === 'station_approved' ? "Tasdiqlandi" : "Moderatsiya"),
              date: formatNotifDate(n.createdAt),
              type: n.type,
              stationId: n.stationId,
              isRead: true,
              readAt: n.readAt || new Date().toISOString(),
              sender: "Super Administrator",
            }))
            .filter((n) => {
              if (n.readAt) {
                const age = Date.now() - new Date(n.readAt).getTime();
                return age < ONE_DAY_MS;
              }
              return true;
            });

          setIncomingNotifications(apiNotifs);
          try {
            localStorage.setItem("myup_incoming_notifications", JSON.stringify(apiNotifs));
          } catch (e) {}

          // Ko'rib bo'lingan deb belgilash (1 kundan keyin admindan va ilovadan avtomatik o'chadi)
          api.notifications?.markAllRead({ userId: userId || "", phone: userPhone }).catch(() => {});
          if (typeof onClearUnread === "function") {
            onClearUnread();
          }
        }
      })
      .catch((err) => {
        console.warn("API notifications error:", err.message);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  
  // Foydalanuvchi yangi bildirishnoma/fikr yuborishi
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim() || isSubmitting) return;

    const trimmedText = feedbackText.trim();
    const authorName = `${user?.firstName || user?.first_name || "Foydalanuvchi"} ${user?.lastName || user?.last_name || ""}`.trim();
    const authorPhone = user?.phoneNumber || user?.phone || "";
    const userId = user?.id || null;

    const localItem = {
      id: "fb_" + Date.now(),
      userId,
      type: feedbackType,
      text: trimmedText,
      author: authorName || "Siz",
      phone: authorPhone,
      date: formatNotifDate(new Date()),
      status: "Yuborildi",
      adminReply: null,
    };

    const updated = [localItem, ...myFeedbacks];
    setMyFeedbacks(updated);
    try {
      localStorage.setItem("myup_my_sent_feedbacks", JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setFeedbackText("");
    setIsFormOpen(false);
    setSuccessToast("Bildirishnomangiz muvaffaqiyatli yuborildi! Rahmat.");
    setTimeout(() => {
      setSuccessToast("");
    }, 3500);

    setIsSubmitting(true);
    try {
      const res = await api.feedbacks.create({
        type: feedbackType,
        message: trimmedText,
        authorName,
        authorPhone,
        userId,
      });
      if (res.success && res.feedback) {
        setMyFeedbacks((prev) =>
          prev.map((item) => (item.id === localItem.id ? { ...item, id: res.feedback.id } : item))
        );
      }
    } catch (apiErr) {
      console.warn("PostgreSQL ga saqlashda xato (faqat localda saqlandi):", apiErr.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // O'zi yuborgan bildirishnomani o'chirish
  const handleDeleteMyFeedback = async (id) => {
    const updated = myFeedbacks.filter((n) => n.id !== id);
    setMyFeedbacks(updated);
    try {
      localStorage.setItem("myup_my_sent_feedbacks", JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    if (typeof id === "string" && !id.startsWith("fb_")) {
      try {
        await api.feedbacks.delete(id);
      } catch (err) {
        console.warn("Serverdan o'chirishda xatolik:", err.message);
      }
    }
  };

  // Foydalanuvchiga kelgan bildirishnomani o'chirish
  const handleDeleteIncoming = async (id) => {
    const updated = incomingNotifications.filter((n) => n.id !== id);
    setIncomingNotifications(updated);
    try {
      localStorage.setItem("myup_incoming_notifications", JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    try {
      if (api.notifications?.delete) {
        await api.notifications.delete(id);
      }
    } catch (err) {
      console.warn("Serverdan o'chirish xatosi:", err.message);
    }
  };

  return (
    <div
      className={`notif-view-container ${isThemeLight ? "is-light" : ""}`}
      style={{
        "--theme-accent": appTheme?.accent || "#38bdf8",
        "--theme-bg": appTheme?.bg || "#0e0e10",
        "--theme-card": appTheme?.card || "#1c1c1e",
        "--theme-border": appTheme?.border || "rgba(255, 255, 255, 0.08)",
        "--theme-panel": appTheme?.panel || "#161618",
        "--theme-text": appTheme?.text || (isThemeLight ? "#0f172a" : "#ffffff"),
        "--theme-muted": appTheme?.textMuted || (isThemeLight ? "#64748b" : "#94a3b8"),
      }}
    >
      {/* 1. TEPADA: ORTGA TUGMASI VA BILDIRISHNOMALAR SARLAVHASI */}
      <div className="notif-top-header">
        <button
          type="button"
          className="notif-back-btn"
          onClick={onBack}
          title="Profilga qaytish"
        >
          <ArrowLeft size={18} />
          <span>Ortga</span>
        </button>

        <div className="notif-header-title-box">
          <h3 className="notif-header-title">Bildirishnomalar</h3>
        </div>

        <button
          type="button"
          className="notif-help-btn"
          onClick={() => { setIsFormOpen(true); setTimeout(() => { formSectionRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100); }}
          title="Qo'llanmani ko'rish"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      {/* Toast bildirishnomasi */}
      {successToast && (
        <div className="notif-toast-banner">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 3. BILDIRISHNOMA QOLDIRISH TUGMASI VA YOZISH JOYI */}
      <div className="notif-action-card" ref={formSectionRef}>
        <div className="notif-action-header-row">
          <div className="notif-action-icon-wrap">
            <MessageSquarePlus size={22} />
          </div>
          <div className="notif-action-text-wrap">
            <h4 className="notif-action-title">Bildirishnoma qoldirish</h4>
            <p className="notif-action-desc">Taklif, fikr yoki shikoyatingizni yozib qoldiring</p>
          </div>
          <button
            type="button"
            className={`notif-toggle-form-btn ${isFormOpen ? "active" : ""}`}
            onClick={() => setIsFormOpen(!isFormOpen)}
          >
            {isFormOpen ? "Yopish" : "Fikr bildirish"}
          </button>
        </div>

        {/* Yozadigan joy */}
        {isFormOpen && (
          <form className="notif-feedback-form" onSubmit={handleSubmitFeedback}>
            <div className="notif-type-pills">
              <button
                type="button"
                className={`notif-type-pill ${feedbackType === "fikr" ? "active" : ""}`}
                onClick={() => setFeedbackType("fikr")}
              >
                <MessageSquare size={14} />
                <span>Fikr</span>
              </button>
              <button
                type="button"
                className={`notif-type-pill ${feedbackType === "taklif" ? "active" : ""}`}
                onClick={() => setFeedbackType("taklif")}
              >
                <Lightbulb size={14} />
                <span>Taklif</span>
              </button>
              <button
                type="button"
                className={`notif-type-pill ${feedbackType === "shikoyat" ? "active" : ""}`}
                onClick={() => setFeedbackType("shikoyat")}
              >
                <AlertTriangle size={14} />
                <span>Shikoyat</span>
              </button>
            </div>

            <div className="notif-textarea-wrapper">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Sizdagi qandaydir taklif yoki dastur haqidagi fikrlaringiz bo'lsa yoki nimadirdan norozi bo'lsangiz, shu yerga yozib qoldiring..."
                rows={4}
                className="notif-comment-textarea"
                maxLength={800}
                autoFocus
              />
              <div className="notif-textarea-footer">
                <span className="notif-char-counter">
                  {feedbackText.length}/800
                </span>
                <button
                  type="submit"
                  disabled={!feedbackText.trim() || isSubmitting}
                  className="notif-send-btn"
                >
                  <Send size={15} />
                  <span>{isSubmitting ? "Yuborilmoqda..." : "Yuborish"}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ========================================================
          4. BILDIRISHNOMA QOLDIRISH PASTIDA:
             MENING BILDIRISHNOMALARIM
          ======================================================== */}
      <div className="notif-section-block">
        <div className="notif-list-heading-bar">
          <div className="notif-section-title-wrap">
            <Send size={16} className="notif-heading-icon sent-icon" />
            <h4 className="notif-list-title">Mening bildirishnomalarim</h4>
          </div>
          {myFeedbacks.length > 0 && (
            <span className="notif-count-pill">{myFeedbacks.length}</span>
          )}
        </div>

        {myFeedbacks.length > 0 ? (
          <div className="notif-items-vertical-stack">
            {myFeedbacks.map((item) => (
              <div key={item.id} className="notif-message-card my-sent-card">
                <div className="notif-message-top">
                  <span
                    className={`notif-message-badge notif-badge-${item.type}`}
                    style={
                      item.type === "ochirish" || item.text?.includes("[O'chirilgan manzil]")
                        ? {
                            background: "rgba(239, 68, 68, 0.16)",
                            color: "#f87171",
                            border: "1px solid rgba(239, 68, 68, 0.35)",
                            fontWeight: 700,
                          }
                        : {}
                    }
                  >
                    {item.type === "ochirish" || item.text?.includes("[O'chirilgan manzil]")
                      ? "Manzil o'chirildi"
                      : item.type === "taklif"
                      ? "Taklif"
                      : item.type === "shikoyat"
                      ? "Shikoyat"
                      : "Fikr"}
                  </span>
                  <div className="notif-message-date-box">
                    <Clock size={12} />
                    <span>{item.date}</span>
                    <button
                      type="button"
                      className="notif-msg-delete-btn"
                      onClick={() => handleDeleteMyFeedback(item.id)}
                      title="O'chirish"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <p className="notif-message-content">{item.text}</p>

                <div className="notif-message-footer">
                  <span className="notif-author-label">
                    Yuboruvchi: {item.author || "Siz"}
                  </span>
                  <span className="notif-status-indicator">
                    <span className="status-dot"></span>
                    {item.adminReply ? "Javob berildi" : item.status || "Yuborildi"}
                  </span>
                </div>

                {/* Super Admin javobi */}
                {item.adminReply && (
                  <div className="notif-admin-reply-card">
                    <div className="admin-reply-title-row">
                      <ShieldCheck size={15} color="#38bdf8" />
                      <span>A-Maps Administratori javobi:</span>
                    </div>
                    <p className="admin-reply-body">{item.adminReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="notif-empty-sent-box">
            <p className="notif-empty-sent-text">
              Siz hali hech qanday bildirishnoma yubormagansiz. Yuqoridagi <strong>«Fikr bildirish»</strong> tugmasi orqali o'z taklif, fikr yoki shikoyatingizni yozib qoldirishingiz mumkin.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================
          5. UNING PASTIDA:
             MENGA KELGAN BILDIRISHNOMALAR
          ======================================================== */}
      <div className="notif-section-block">
        <div className="notif-list-heading-bar">
          <div className="notif-section-title-wrap">
            <Bell size={16} className="notif-heading-icon incoming-icon" />
            <h4 className="notif-list-title">Menga kelgan bildirishnomalar</h4>
          </div>
          {incomingNotifications.length > 0 && (
            <span className="notif-count-pill incoming-pill">
              {incomingNotifications.length}
            </span>
          )}
        </div>

        {incomingNotifications.length > 0 ? (
          <div className="notif-items-vertical-stack">
            {incomingNotifications.map((item) => {
              const isApprovedNotif = item.type === 'station_approved' || item.badge === 'Tasdiqlandi' || (item.title && item.title.includes('tasdiqlandi'));
              const isRejectedNotif = item.type === 'station_rejected' || item.badge === 'Rad etildi' || (item.title && item.title.includes('rad etildi'));

              return (
                <div 
                  key={item.id} 
                  className={`notif-message-card incoming-card ${isApprovedNotif ? 'notif-approved-card' : ''}`}
                  style={isApprovedNotif ? {
                    border: '1px solid rgba(16, 185, 129, 0.45)',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)',
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)',
                    borderRadius: '16px'
                  } : isRejectedNotif ? {
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(15, 23, 42, 0.95) 100%)',
                    borderRadius: '16px'
                  } : {}}
                >
                  <div className="notif-message-top">
                    <span 
                      className="notif-message-badge notif-badge-incoming"
                      style={isApprovedNotif ? {
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid rgba(16, 185, 129, 0.5)',
                        color: '#10b981',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      } : isRejectedNotif ? {
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#ef4444',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      } : {}}
                    >
                      {isApprovedNotif ? <CheckCircle2 size={13} color="#10b981" /> : isRejectedNotif ? <X size={13} color="#ef4444" /> : null}
                      {item.badge || (isApprovedNotif ? "Tasdiqlandi" : "A-Maps Tizimi")}
                    </span>
                    <div className="notif-message-date-box">
                      <Clock size={12} />
                      <span>{item.date}</span>
                      <button
                        type="button"
                        className="notif-msg-delete-btn"
                        onClick={() => handleDeleteIncoming(item.id)}
                        title="O'chirish"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <h5 
                    className="incoming-notif-title"
                    style={isApprovedNotif ? { color: '#10b981', fontWeight: 700, fontSize: '0.96rem' } : isRejectedNotif ? { color: '#ef4444', fontWeight: 700 } : {}}
                  >
                    {item.title}
                  </h5>
                  <p className="notif-message-content" style={{ lineHeight: 1.55 }}>{item.message}</p>

                  <div className="notif-message-footer">
                    <span className="notif-author-label">
                      Yuboruvchi: {item.sender || "Super Administrator"}
                    </span>
                    <span 
                      className="notif-status-indicator incoming-status"
                      style={isApprovedNotif ? { color: '#10b981' } : {}}
                    >
                      <CheckCircle2 size={13} />
                      <span>{isApprovedNotif ? "Tasdiqlandi" : "Yetkazildi"}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* BO'SH HOLAT: A-Maps Limon personaji */
          <div className="notif-empty-state-box">
            <div className="notif-empty-illustration-wrapper">
              <img
                src={amapsEmptyMascot}
                alt="A-Maps bildirishnoma yo'q"
                className="notif-empty-character-img"
              />
            </div>

            <h4 className="notif-empty-title">Sizga kelgan bildirishnoma yo'q</h4>
            <p className="notif-empty-subtitle">
              Hozircha sizga hech qanday xabar yoki eslatma kelmagan. Agar tizimdan yangilik yoki javob kelsa, shu yerda ko'rinadi.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================
          ENG TAGIDA: JOYLASHUV QO'SHISHNI TASDIQLASH KARTASI
          Menga kelgan bildirishnomalarning tagida turadi
          ======================================================== */}
      <div className="notif-action-card location-action-card" style={{ marginTop: '16px' }}>
        <div className="notif-action-header-row">
          <div className="notif-action-icon-wrap location-icon-wrap">
            <MapPin size={22} className="text-sky-400" />
          </div>
          <div className="notif-action-text-wrap">
            <h4 className="notif-action-title">Joylashuv qo'shishni tasdiqlash</h4>
            <p className="notif-action-desc">
              {isLocationActive
                ? "Sizda A-Maps ga joylashuv qo'shish faol"
                : "A-Maps ga o'z xizmat ko'rsatish markazingizni qo'shish"}
            </p>
          </div>
          <button
            type="button"
            className={`notif-toggle-form-btn location-flow-btn ${isLocationActive ? "active" : ""}`}
            onClick={handleOpenLocationFlow}
          >
            {isLocationActive ? "Faol (O'zgartirish)" : "Faollashtirish"}
          </button>
        </div>
      </div>

      {/* ========================================================
          MODAL 1: AGAR FOYDALANUVCHI REGISTER BO'LMAGAN BO'LSA
          "Avval registratsiyadan o'ting" degan modal
          ======================================================== */}
      {showAuthRequiredModal && (
        <div className="notif-modal-overlay" onClick={() => setShowAuthRequiredModal(false)}>
          <div className="notif-modal-card auth-warning-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="notif-modal-close-btn"
              onClick={() => setShowAuthRequiredModal(false)}
            >
              <X size={18} />
            </button>

            <div className="notif-modal-header">
              <div className="notif-modal-badge-icon auth-warning-badge">
                <AlertCircle size={26} color="#f59e0b" />
              </div>
              <h3 className="notif-modal-title">Avval registratsiyadan o'ting</h3>
            </div>

            <div className="notif-modal-body">
              <p className="notif-modal-main-text">
                Joylashuv qo'shish imkoniyatini yoqish uchun avval dasturda ro'yxatdan o'tishingiz yoki profilingizga kirishingiz lozim.
              </p>
              <p className="notif-modal-sub-text">
                Ro'yxatdan o'tgach, profilingiz orqali A-Maps dasturiga bemalol o'z xizmat ko'rsatish markazingizni joylashtirishingiz mumkin.
              </p>
            </div>

            <div className="notif-modal-actions">
              <button
                type="button"
                className="notif-modal-submit-btn auth-redirect-btn"
                onClick={() => {
                  setShowAuthRequiredModal(false);
                  if (typeof onGoToLocationRegister === "function") {
                    onGoToLocationRegister();
                  } else if (typeof onGoToAuth === "function") {
                    onGoToAuth();
                  }
                }}
              >
                <User size={16} />
                <span>Registratsiyadan o'tish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: JOYLASHUV QO'SHMOQCHIMISIZ? (HA / YO'Q)
          Ha ni bossa tagida "Tasdiqlash" chiqadi
          ======================================================== */}
      {showLocationConfirmModal && (
        <div className="notif-modal-overlay" onClick={() => setShowLocationConfirmModal(false)}>
          <div className="notif-modal-card location-choice-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="notif-modal-close-btn"
              onClick={() => setShowLocationConfirmModal(false)}
            >
              <X size={18} />
            </button>

            <div className="notif-modal-header">
              <div className="notif-modal-badge-icon location-pin-badge">
                <MapPin size={26} color="#38bdf8" />
              </div>
              <h3 className="notif-modal-title">Joylashuv qo'shmoqchimisiz?</h3>
            </div>

            <div className="notif-modal-body">
              <p className="notif-modal-main-text">
                A-Maps dasturiga o'z xizmat ko'rsatish markazingiz yoki shaxobchangizni joylashtirmoqchimisiz?
              </p>

              {/* Ha va Yo'q tanlash tugmalari */}
              <div className="modern-choice-pills modal-choice-pills">
                <button
                  type="button"
                  className={`modern-choice-pill ${selectedLocationChoice === false ? "active" : ""}`}
                  onClick={() => setSelectedLocationChoice(false)}
                >
                  <span className="choice-dot"></span>
                  <span>Yo'q</span>
                </button>
                <button
                  type="button"
                  className={`modern-choice-pill ${selectedLocationChoice === true ? "active" : ""}`}
                  onClick={() => setSelectedLocationChoice(true)}
                >
                  <span className="choice-dot"></span>
                  <span>Ha</span>
                </button>
              </div>

              {/* Agar HA tanlansa: tagida "Tasdiqlash" tugmasi paydo bo'ladi */}
              {selectedLocationChoice === true && (
                <div className="location-confirm-action-box animate-slide-down">
                  <p className="location-choice-hint">
                    Tasdiqlasangiz, profil bo'limida <strong>«Joylashuv qo'shish»</strong> va <strong>«Mening joylashuvlarim»</strong> bo'limi faol bo'ladi.
                  </p>
                  <button
                    type="button"
                    className="notif-modal-submit-btn location-confirm-submit-btn"
                    onClick={handleConfirmLocationActivation}
                  >
                    <CheckCircle2 size={16} />
                    <span>Tasdiqlash</span>
                  </button>
                </div>
              )}

              {/* Agar YO'Q tanlansa: o'chirib qo'yish yoki yopish */}
              {selectedLocationChoice === false && (
                <div className="location-confirm-action-box animate-slide-down">
                  <p className="location-choice-hint">
                    Joylashuv qo'shish bo'limi profilingizda yashirilgan holatda qoladi.
                  </p>
                  <button
                    type="button"
                    className="location-deactivate-save-btn"
                    onClick={handleDeactivateLocation}
                  >
                    <span>Saqlash va Yopish</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: 5 SEKUNDLIK O'RTADAN ANIMATSIYA BO'LIB CHIQADIGAN MODAL
          "Profil bo'limidan bemalol dasturga joylashuv qoshsangiz bo'ladi"
          ======================================================== */}
      {showSuccessAnimationModal && (
        <div className="notif-modal-overlay success-modal-overlay-blur" onClick={() => setShowSuccessAnimationModal(false)}>
          <div className="notif-modal-card success-popup-center-card animate-pop-in-bounce" onClick={(e) => e.stopPropagation()}>
            <div className="success-pulse-icon-ring">
              <div className="success-pulse-core">
                <CheckCircle2 size={44} color="#10b981" />
              </div>
            </div>

            <h3 className="success-modal-title">Muvaffaqiyatli faollashtirildi!</h3>

            <p className="success-modal-desc">
              Profil bo'limidan bemalol dasturga joylashuv qo'shsangiz bo'ladi.
            </p>

            {/* 5 sekundlik indikator progress chizig'i */}
            <div className="success-timer-bar-wrap">
              <div className="success-timer-progress-fill" />
            </div>

            <div className="success-modal-actions-row">
              <button
                type="button"
                className="notif-modal-submit-btn success-goto-profile-btn"
                onClick={() => {
                  setShowSuccessAnimationModal(false);
                  if (typeof onGoToAuth === "function") {
                    onGoToAuth();
                  }
                }}
              >
                <span>Profilga o'tish ({countdownSeconds}s)</span>
              </button>
            </div>
          </div>
        </div>
      )}

          </div>
  );
}
