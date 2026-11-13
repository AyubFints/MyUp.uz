import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Download,
  Star,
  CheckCircle2,
  Share2,
  ChevronRight,
  MessageSquarePlus,
  Send,
  X,
  Maximize2,
} from "lucide-react";

// Foydalanuvchi yuborgan 4 ta rasmiy skrinshot
const SCREENSHOTS = [
  {
    id: "sc_1",
    src: "/screenshots/screenshot-1.jpg",
    title: "1-rasm: Asosiy sahifa - Shahobchalar ro'yxati",
  },
  {
    id: "sc_2",
    src: "/screenshots/screenshot-2.jpg",
    title: "2-rasm: Jonli xarita va eng yaqin zapravkalar",
  },
  {
    id: "sc_3",
    src: "/screenshots/screenshot-3.jpg",
    title: "3-rasm: Dastur bo'yicha to'liq qo'llanma",
  },
  {
    id: "sc_4",
    src: "/screenshots/screenshot-4.jpg",
    title: "4-rasm: Profil va Joylashuvlar boshqarmasi",
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

  // Jonli yuklamalar soni (Boshlanishida 0 tursin, yuklab olinganda 1, 2 bo'lib oshib boradi)
  const [downloadCount, setDownloadCount] = useState(() => {
    try {
      const saved = localStorage.getItem("axmap_live_downloads");
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        return isNaN(parsed) ? 0 : parsed;
      }
    } catch (e) {}
    return 0;
  });

  // Jonli sharhlar ro'yxati (Boshlanishida 0 tursin, yangi sharh kiritilganda oshadi)
  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem("axmap_app_user_reviews");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Sharh qoldirish modal holati
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [toastMessage, setToastMessage] = useState("");

  // Kattalashtirib ko'rish uchun tanlangan skrinshot
  const [selectedImage, setSelectedImage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // APK yuklab olish funksiyasi (Avtomatik 1, 2... qilib oshiradi)
  const handleDownload = () => {
    setIsDownloading(true);

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

  // Yangi sharh qoldirish (Avtomatik soni oshadi)
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
  const textPrimary = appTheme?.text || (isThemeLight ? "#0f172a" : "#f8fafc");
  const textMuted = appTheme?.textMuted || (isThemeLight ? "#64748b" : "#94a3b8");

  // O'rtacha baho
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
      : "4.9";

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
      <div className="app-download-top-header">
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
        {/* 1. ASOSIY ILOVA TAFSILOTLARI (3-rasmdek: fon bilan bir butun, ajratilmagan) */}
        <section className="app-seamless-hero-section">
          <div className="app-details-hero-top">
            {/* 3D AX PIN LOGO (2-rasm) */}
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

              {/* JONLI STATISTIKA: Sharhlar 0 va Yuklanganlar 0 */}
              <div className="app-details-stats-row">
                <div className="app-stat-item">
                  <div className="app-stat-rating-badge">
                    <span className="app-stat-score">{averageRating}</span>
                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  </div>
                  <span className="app-stat-label">
                    ({reviews.length} sharh)
                  </span>
                </div>

                <div className="app-stat-divider" />

                <div className="app-stat-item">
                  <span className="app-stat-downloads-val">{downloadCount}</span>
                  <span className="app-stat-label">Yuklangan</span>
                </div>
              </div>
            </div>
          </div>

          {/* ASOSIY YUKLAB OLISH TUGMASI (To'liq va nusxalash tugmasisiz) */}
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
        </section>

        {/* 2. SKRINSHOTLAR BO'LIMI (1, 2, 3 va 4-rasmlar bilan, tiniq va yirik) */}
        <section className="app-seamless-section">
          <div className="app-seamless-section-header">
            <h3 className="app-seamless-title">Skrinshotlar</h3>
          </div>

          <div className="app-screenshots-scroll-row">
            {SCREENSHOTS.map((item, idx) => (
              <div
                key={item.id}
                className="app-screenshot-card-item"
                onClick={() => setSelectedImage(item.src)}
                role="button"
                tabIndex={0}
                title={`${idx + 1}-skrinshotni kattalashtirib ko'rish`}
              >
                <img
                  src={item.src}
                  alt={item.title}
                  className="app-screenshot-img"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>

        {/* 3. ILOVA HAQIDA (4-rasmdek: aynan ko'rsatilgan matn va pill, orqafon bilan bir xil) */}
        <section className="app-seamless-section">
          <div className="app-seamless-section-header">
            <h3 className="app-seamless-title">Ilova haqida</h3>
            <ChevronRight size={20} color={textMuted} />
          </div>

          <p className="app-about-seamless-description">
            Yo'l chetidagi barcha yoqilg'i shahobchalarini (Metan, Propan, Benzin) qidirish,
            ularning ochiq yoki yopiqligini, narxlarni va gaz bosimlarini jonli (online) bilib
            olishda yordam beradi.
          </p>

          <div className="app-category-tags">
            <span className="app-category-tag">Xarita va navigatsiya</span>
          </div>
        </section>

        {/* 4. BAHOLAR VA SHARHLAR (Fon bilan bir xil, 0 ta sharh) */}
        <section className="app-seamless-section">
          <div className="app-seamless-section-header">
            <div>
              <h3 className="app-seamless-title">Baholar va Sharhlar</h3>
              <p className="app-seamless-subtitle" style={{ color: textMuted }}>
                {reviews.length > 0
                  ? `${reviews.length} ta foydalanuvchi fikr bildirgan`
                  : "Hozircha sharhlar yo'q"}
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

          {reviews.length === 0 ? (
            <div className="app-reviews-empty-state">
              <span className="app-reviews-empty-score">0.0</span>
              <div className="app-reviews-empty-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} color="rgba(255, 255, 255, 0.2)" />
                ))}
              </div>
              <p className="app-reviews-empty-text" style={{ color: textMuted }}>
                Ilovadan foydalanib birinchi bo'lib o'z fikringiz va bahoyingizni qoldiring!
              </p>
            </div>
          ) : (
            <div className="app-reviews-list">
              {reviews.map((rev) => (
                <div key={rev.id} className="app-review-item-card">
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
          )}
        </section>
      </div>

      {/* SHARH QOLDIRISH MODALI */}
      {showReviewModal && (
        <div className="app-review-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div
            className="app-review-modal-content"
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
      {/* KATTALASHTIRILGAN SKRINSHOT MODALI (Tiniq ko'rish uchun) */}
      {selectedImage && (
        <div
          className="app-screenshot-lightbox-overlay"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            className="app-lightbox-close-btn"
            onClick={() => setSelectedImage(null)}
            title="Yopish"
          >
            <X size={26} />
          </button>
          <img
            src={selectedImage}
            alt="Skrinshot"
            className="app-lightbox-full-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
