import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Download,
  Star,
  CheckCircle2,
  Share2,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  MessageSquarePlus,
  Send,
  X,
  Sparkles,
} from "lucide-react";

const INITIAL_REVIEWS = [
  {
    id: "rev_1",
    author: "Ayubxon Xamitov",
    rating: 5,
    date: "12 Noyabr 2026",
    comment: "Juda qulay ilova, gaz bosimini aniq ko'rsatmoqda! Yo'lda juda qo'l keladi.",
  },
  {
    id: "rev_2",
    author: "Sardorbek Rahimov",
    rating: 5,
    date: "10 Noyabr 2026",
    comment: "Eng yaqin metan zapravkalarni tez topib beradi, narxlar har doim yangilanib turadi.",
  },
  {
    id: "rev_3",
    author: "Jamshid Qodirov",
    rating: 5,
    date: "8 Noyabr 2026",
    comment: "Dizayni juda chiroyli va qorong'i rejimda ko'zni charchatmaydi. Rahmat!",
  },
  {
    id: "rev_4",
    author: "Otabek Umarov",
    rating: 4.8,
    date: "5 Noyabr 2026",
    comment: "Ilova tez ishlaydi, qotmaydi. Barcha haydovchilarga tavsiya qilaman.",
  },
];

export default function AppDownloadPage({
  onBack,
  isThemeLight = false,
  appTheme = null,
}) {
  // Sahifaga kirganda eng yuqoriga chiqarish
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // Jonli yuklamalar soni (localStorage orqali saqlanadi va oshiriladi)
  const [downloadCount, setDownloadCount] = useState(() => {
    try {
      const saved = localStorage.getItem("axmap_live_downloads");
      if (saved) return parseInt(saved, 10);
    } catch (e) {}
    return 104280;
  });

  // Jonli sharhlar ro'yxati
  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem("axmap_app_user_reviews");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_REVIEWS;
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Sharh qoldirish modal holati
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // APK yuklab olish funksiyasi
  const handleDownload = () => {
    setIsDownloading(true);

    // Yuklashlar sonini jonli oshirish
    const nextCount = downloadCount + 1;
    setDownloadCount(nextCount);
    try {
      localStorage.setItem("axmap_live_downloads", nextCount.toString());
    } catch (e) {}

    // Haqiqiy APK faylni yuklab olish
    setTimeout(() => {
      try {
        const link = document.createElement("a");
        link.href = "/ax-map.apk";
        link.download = "uz.axmap.app-v1.0.0-release.apk";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        window.location.href = "/ax-map.apk";
      }

      setIsDownloading(false);
      setDownloadSuccess(true);
      showToast("AX-Map APK ilovasi yuklab olinmoqda!");
      setTimeout(() => setDownloadSuccess(false), 4000);
    }, 600);
  };

  // Ulashish (Share)
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AX-Map.uz mobil ilovasi",
          text: "Yo'ldagi barcha zapravkalarni aniq ko'rsatuvchi AX-Map ilovasini yuklab oling!",
          url: window.location.href,
        });
      } catch (e) {}
    } else {
      navigator.clipboard?.writeText(window.location.href);
      showToast("Havola nusxalandi!");
    }
  };

  // Yangi sharh qoldirish
  const handleAddReview = (e) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;

    const newRev = {
      id: "rev_" + Date.now(),
      author: newReviewAuthor.trim() || "Foydalanuvchi",
      rating: newReviewRating,
      date: "Bugun",
      comment: newReviewComment.trim(),
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);
    try {
      localStorage.setItem("axmap_app_user_reviews", JSON.stringify(updated));
    } catch (e) {}

    setShowReviewModal(false);
    setNewReviewAuthor("");
    setNewReviewComment("");
    setNewReviewRating(5);
    showToast("Sharhingiz muvaffaqiyatli qo'shildi!");
  };

  const bgColor = appTheme?.bg || "#0e0e10";
  const cardBg = appTheme?.card || "#18181b";
  const borderColor = appTheme?.border || "rgba(255, 255, 255, 0.08)";
  const textPrimary = appTheme?.text || (isThemeLight ? "#0f172a" : "#f8fafc");
  const textMuted = appTheme?.textMuted || (isThemeLight ? "#64748b" : "#94a3b8");

  // O'rtacha baho
  const totalReviewsCount = 12480 + (reviews.length - INITIAL_REVIEWS.length);

  return (
    <div
      className={`app-download-page-root ${isThemeLight ? "is-light" : ""}`}
      style={{
        backgroundColor: bgColor,
        color: textPrimary,
      }}
    >
      {/* Toast Bildirishnoma */}
      {toastMessage && (
        <div className="app-download-toast">
          <CheckCircle2 size={18} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TEPADAGI NAVIGATSIYA QATORI: "Ilovalar" va Orqaga qaytish */}
      <div className="app-download-top-header" style={{ borderColor }}>
        <button
          type="button"
          className="app-download-back-btn"
          onClick={onBack}
          aria-label="Orqaga qaytish"
          title="Orqaga qaytish"
        >
          <ArrowLeft size={22} />
        </button>

        <h1 className="app-download-header-title">Ilovalar</h1>

        <button
          type="button"
          className="app-download-share-btn"
          onClick={handleShare}
          aria-label="Ulashish"
          title="Ilovani ulashish"
        >
          <Share2 size={20} />
        </button>
      </div>

      <div className="app-download-main-container">
        {/* ASOSIY ILOVA TAFSILOTLARI KARTASI (Play Market uslubida) */}
        <div className="app-details-hero-card" style={{ background: cardBg, borderColor }}>
          <div className="app-details-hero-top">
            {/* 2-RASM: 3D AX PIN LOGO (Foydalanuvchi tanlagan) */}
            <div className="app-details-icon-wrapper">
              <img
                src="/ax-app-icon-3d.jpg"
                alt="AX-Map Ilova Belgisi"
                className="app-details-app-icon"
              />
            </div>

            <div className="app-details-hero-meta">
              <h2 className="app-details-title">AX-Map.uz</h2>
              <span className="app-details-developer">AX dasturlari</span>

              {/* JONLI STATISTIKA (Baho, Sharhlar va Yuklamalar) */}
              <div className="app-details-stats-row">
                <div className="app-stat-item">
                  <div className="app-stat-rating-badge">
                    <span className="app-stat-score">4.9</span>
                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  </div>
                  <span className="app-stat-label">
                    ({(totalReviewsCount / 1000).toFixed(0)}K sharh)
                  </span>
                </div>

                <div className="app-stat-divider" />

                <div className="app-stat-item">
                  <span className="app-stat-downloads-val">100K+</span>
                  <span className="app-stat-label">Yuklangan</span>
                </div>
              </div>
            </div>
          </div>

          {/* ASOSIY YUKLAB OLISH TUGMASI (To'liq va nusxalashsiz toza ko'rinish) */}
          <div className="app-details-action-area">
            <button
              type="button"
              className={`app-primary-download-btn ${isDownloading ? "loading" : ""} ${downloadSuccess ? "success" : ""}`}
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download size={20} className={isDownloading ? "animate-bounce" : ""} />
              <span>
                {isDownloading
                  ? "Yuklanmoqda..."
                  : downloadSuccess
                  ? "Yuklab olindi! (4.5 MB)"
                  : "Yuklab olish (4.5 MB)"}
              </span>
            </button>
          </div>

          {/* ILOVA XUSUSIYATLAR PILLARI */}
          <div className="app-details-pills-row">
            <span className="app-spec-pill">4.5 MB</span>
            <span className="app-spec-dot">•</span>
            <span className="app-spec-pill">Hamma uchun</span>
            <span className="app-spec-dot">•</span>
            <span className="app-spec-pill">Xarita &amp; Navigatsiya</span>
            <span className="app-spec-dot">•</span>
            <span className="app-spec-pill">Android 8.0+</span>
          </div>
        </div>

        {/* ILOVA HAQIDA BO'LIMI */}
        <div className="app-download-section-card" style={{ background: cardBg, borderColor }}>
          <div className="app-section-header-row">
            <h3 className="app-section-title">Ilova haqida</h3>
            <span className="app-section-badge">Rasmiy reliz</span>
          </div>

          <p className="app-about-description">
            Yo'l chetidagi barcha yoqilg'i shahobchalarini (Metan, Propan, Benzin) qidirish,
            ularning ochiq yoki yopiqligini, narxlarni va gaz bosimlarini jonli (online) bilib
            olishda yordam beradi.
          </p>

          <div className="app-category-tags">
            <span className="app-category-tag">Xarita va navigatsiya</span>
            <span className="app-category-tag">Gaz bosimi monitoringi</span>
            <span className="app-category-tag">Yoqilg'i narxlari</span>
          </div>

          {/* QO'SHIMCHA TEXNIK MA'LUMOTLAR */}
          <div className="app-tech-specs-grid">
            <div className="app-tech-spec-item">
              <span className="app-spec-k" style={{ color: textMuted }}>Versiya</span>
              <span className="app-spec-v">1.0.0 (Release)</span>
            </div>
            <div className="app-tech-spec-item">
              <span className="app-spec-k" style={{ color: textMuted }}>Yangilangan sana</span>
              <span className="app-spec-v">Noyabr 2026</span>
            </div>
            <div className="app-tech-spec-item">
              <span className="app-spec-k" style={{ color: textMuted }}>Ishlab chiquvchi</span>
              <span className="app-spec-v">AX Dasturlari</span>
            </div>
            <div className="app-tech-spec-item">
              <span className="app-spec-k" style={{ color: textMuted }}>Xavfsizlik</span>
              <span className="app-spec-v text-emerald-400">Tekshirilgan va xavfsiz ✓</span>
            </div>
          </div>
        </div>

        {/* JONLI BAHOLAR VA SHARHLAR BO'LIMI */}
        <div className="app-download-section-card" style={{ background: cardBg, borderColor }}>
          <div className="app-section-header-row">
            <div>
              <h3 className="app-section-title">Baholar va Sharhlar</h3>
              <p className="app-section-subtitle" style={{ color: textMuted }}>
                Foydalanuvchilarning jonli fikrlari
              </p>
            </div>

            <button
              type="button"
              className="app-add-review-btn"
              onClick={() => setShowReviewModal(true)}
              title="Fikr bildirish"
            >
              <MessageSquarePlus size={16} />
              <span>Sharh qoldirish</span>
            </button>
          </div>

          {/* Katta Baho Xulosasi */}
          <div className="app-rating-summary-box">
            <div className="app-rating-big-num">4.9</div>
            <div className="app-rating-stars-col">
              <div className="app-rating-stars-row">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={18} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <span className="app-rating-count-text" style={{ color: textMuted }}>
                Jami {totalReviewsCount.toLocaleString()} ta foydalanuvchi baholagan
              </span>
            </div>
          </div>

          {/* Sharhlar ro'yxati */}
          <div className="app-reviews-list">
            {reviews.map((rev) => (
              <div key={rev.id} className="app-review-item-card" style={{ borderColor }}>
                <div className="app-review-item-top">
                  <div className="app-review-author-avatar">
                    {rev.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="app-review-author-meta">
                    <span className="app-review-author-name">{rev.author}</span>
                    <span className="app-review-date" style={{ color: textMuted }}>
                      {rev.date}
                    </span>
                  </div>
                  <div className="app-review-stars-badge">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        fill={s <= Math.round(rev.rating) ? "#f59e0b" : "transparent"}
                        color="#f59e0b"
                      />
                    ))}
                  </div>
                </div>
                <p className="app-review-comment-text">{rev.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* XAVFSIZLIK VA PRIVACY ISHONCH BLOKI */}
        <div className="app-security-trust-box" style={{ borderColor }}>
          <ShieldCheck size={26} color="#10b981" />
          <div className="app-security-trust-text">
            <strong>Google Play Xavfsizlik talablariga mos</strong>
            <p style={{ color: textMuted }}>
              Ilova zararli kodlardan to'liq tozalangan va rasmiy sertifikat bilan imzolangan.
            </p>
          </div>
        </div>
      </div>

      {/* SHARH QOLDIRISH MODALI */}
      {showReviewModal && (
        <div className="app-review-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div
            className="app-review-modal-content"
            style={{ background: cardBg, borderColor }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="app-review-modal-header">
              <h3 className="app-review-modal-title">Fikr va sharh qoldirish</h3>
              <button
                type="button"
                className="app-review-modal-close"
                onClick={() => setShowReviewModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddReview} className="app-review-form">
              <div className="app-review-rating-select">
                <span className="app-review-rating-label">Bahoyingiz:</span>
                <div className="app-review-stars-interactive">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="app-star-pick-btn"
                      onClick={() => setNewReviewRating(star)}
                    >
                      <Star
                        size={26}
                        fill={star <= newReviewRating ? "#f59e0b" : "transparent"}
                        color="#f59e0b"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="app-review-input-group">
                <label className="app-review-field-label">Ismingiz (ixtiyoriy):</label>
                <input
                  type="text"
                  placeholder="Ismingizni kiriting"
                  value={newReviewAuthor}
                  onChange={(e) => setNewReviewAuthor(e.target.value)}
                  className="app-review-text-input"
                />
              </div>

              <div className="app-review-input-group">
                <label className="app-review-field-label">Sharhingiz:</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Ilova haqida fikringiz va tajribangizni yozing..."
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  className="app-review-textarea"
                />
              </div>

              <div className="app-review-form-actions">
                <button
                  type="button"
                  className="app-review-cancel-btn"
                  onClick={() => setShowReviewModal(false)}
                >
                  Bekor qilish
                </button>
                <button type="submit" className="app-review-submit-btn">
                  <Send size={16} />
                  <span>Yuborish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
