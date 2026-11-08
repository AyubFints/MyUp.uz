import React, { useState } from 'react';
import { Star, X, Check, Fuel, Sparkles, ThumbsUp } from 'lucide-react';

export default function StationReviewModal({ station, onSubmit, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!station) return null;

  const quickTags = [
    '⚡ Sifatli yoqilg\'i',
    '🚀 Tezkor xizmat',
    '⛽ Yuqori gaz bosimi',
    '🧹 Toza hudud',
    '💳 Qulay to\'lov',
    '👥 Xushmuomala xodimlar',
  ];

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const getRatingLabel = (val) => {
    switch (val) {
      case 1:
        return '😡 Juda yomon (1 ball)';
      case 2:
        return '🙁 Qoniqarsiz (2 ball)';
      case 3:
        return '😐 O\'rtacha (3 ball)';
      case 4:
        return '🙂 Yaxshi (4 ball)';
      case 5:
        return '🌟 A\'lo darajada! (5 ball)';
      default:
        return 'Yulduzchalarni tanlang (1 dan 5 gacha)';
    }
  };

  const currentDisplayRating = hoverRating || rating;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitted(true);
    setTimeout(() => {
      if (onSubmit) {
        onSubmit(station.id, rating, { tags: selectedTags, comment });
      }
    }, 1500);
  };

  return (
    <div className="srm-overlay" onClick={onClose}>
      <style>{`
        .srm-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(15, 23, 42, 0.72);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: srmFadeIn 0.25s ease-out;
        }

        @keyframes srmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .srm-card {
          position: relative;
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          border-radius: 24px;
          padding: 24px 22px 20px 22px;
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.06);
          animation: srmSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          color: #0f172a;
          box-sizing: border-box;
          max-height: 90vh;
          overflow-y: auto;
        }

        @keyframes srmSlideUp {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .srm-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: none;
          background: #f1f5f9;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }

        .srm-close-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
          transform: rotate(90deg);
        }

        .srm-header {
          text-align: center;
          margin-bottom: 16px;
        }

        .srm-badge-icon {
          width: 54px;
          height: 54px;
          margin: 0 auto 12px auto;
          border-radius: 18px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #d97706;
          box-shadow: 0 8px 16px -4px rgba(217, 119, 6, 0.25);
        }

        .srm-title {
          font-size: 19px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
          line-height: 1.25;
        }

        .srm-subtitle {
          font-size: 12.5px;
          color: #64748b;
          margin: 0;
        }

        .srm-station-pill {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 10px 14px;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
        }

        .srm-st-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #eff6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #11286b;
          flex-shrink: 0;
        }

        .srm-st-details {
          min-width: 0;
          flex: 1;
        }

        .srm-st-name {
          font-size: 14.5px;
          font-weight: 700;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .srm-st-addr {
          font-size: 11.5px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .srm-prompt {
          font-size: 13.5px;
          font-weight: 700;
          color: #1e293b;
          text-align: center;
          margin-bottom: 12px;
        }

        .srm-stars-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .srm-star-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
          transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #cbd5e1;
        }

        .srm-star-btn:hover {
          transform: scale(1.22);
        }

        .srm-star-btn.active {
          color: #f59e0b;
          filter: drop-shadow(0 2px 8px rgba(245, 158, 11, 0.45));
        }

        .srm-rating-desc {
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          color: ${currentDisplayRating > 0 ? '#d97706' : '#94a3b8'};
          min-height: 20px;
          margin-bottom: 16px;
          transition: color 0.2s;
        }

        .srm-tags-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
          justify-content: center;
        }

        .srm-tag-chip {
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #475569;
          padding: 5px 11px;
          border-radius: 9999px;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          user-select: none;
        }

        .srm-tag-chip:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .srm-tag-chip.active {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #1d4ed8;
          font-weight: 700;
        }

        .srm-comment-input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 9px 12px;
          font-size: 12.5px;
          font-family: inherit;
          color: #0f172a;
          resize: none;
          box-sizing: border-box;
          margin-bottom: 18px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .srm-comment-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        .srm-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .srm-submit-btn {
          width: 100%;
          padding: 12px 18px;
          border-radius: 14px;
          border: none;
          background: #11286b;
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(17, 40, 107, 0.3);
        }

        .srm-submit-btn:hover:not(:disabled) {
          background: #0d1e52;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(17, 40, 107, 0.4);
        }

        .srm-submit-btn:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }

        .srm-later-btn {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          padding: 6px;
          text-align: center;
          transition: color 0.15s;
        }

        .srm-later-btn:hover {
          color: #0f172a;
        }

        .srm-success-box {
          text-align: center;
          padding: 30px 10px;
        }

        .srm-success-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px auto;
          border-radius: 50%;
          background: #dcfce7;
          color: #16a34a;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px -4px rgba(22, 163, 74, 0.3);
          animation: srmPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes srmPop {
          0% { transform: scale(0.4); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .srm-success-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
        }

        .srm-success-desc {
          font-size: 13.5px;
          color: #475569;
          margin: 0;
          line-height: 1.4;
        }
      `}</style>

      <div className="srm-card" onClick={(e) => e.stopPropagation()}>
        {!isSubmitted ? (
          <>
            <button
              type="button"
              className="srm-close-btn"
              onClick={onClose}
              title="Yopish"
              aria-label="Yopish"
            >
              <X size={18} />
            </button>

            {/* HEADER */}
            <div className="srm-header">
              <div className="srm-badge-icon">
                <Sparkles size={28} />
              </div>
              <h2 className="srm-title">Shahobchani baholang</h2>
              <p className="srm-subtitle">
                Siz yaqinda ushbu yoqilg'i shahobchasiga tashrif buyurdingiz:
              </p>
            </div>

            {/* SHAHOBCHA MA'LUMOTI */}
            <div className="srm-station-pill">
              <div className="srm-st-icon-wrap">
                <Fuel size={20} />
              </div>
              <div className="srm-st-details">
                <div className="srm-st-name">{station.name || 'Yoqilg\'i shahobchasi'}</div>
                <div className="srm-st-addr">{station.address || 'Manzil ko\'rsatilmagan'}</div>
              </div>
            </div>

            {/* SAVOL */}
            <div className="srm-prompt">
              Xizmat koʻrsatishi va yoqilg'isini baholab keting:
            </div>

            {/* 5 TA INTERAKTIV YULDUZ */}
            <div className="srm-stars-row">
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isLit = currentDisplayRating >= starVal;
                return (
                  <button
                    key={starVal}
                    type="button"
                    className={`srm-star-btn ${isLit ? 'active' : ''}`}
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`${starVal} yulduz`}
                  >
                    <Star
                      size={36}
                      fill={isLit ? '#f59e0b' : 'none'}
                      stroke={isLit ? '#d97706' : '#cbd5e1'}
                      strokeWidth={1.8}
                    />
                  </button>
                );
              })}
            </div>

            {/* BALL IZOHI */}
            <div className="srm-rating-desc">
              {getRatingLabel(currentDisplayRating)}
            </div>

            {/* TEZKOR TEGLAR */}
            <div className="srm-tags-grid">
              {quickTags.map((tag) => (
                <span
                  key={tag}
                  className={`srm-tag-chip ${selectedTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* IXTIYORIY FIKR */}
            <textarea
              className="srm-comment-input"
              rows={2}
              placeholder="Qo'shimcha fikringiz bo'lsa yozing (ixtiyoriy)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            {/* TUGMALAR */}
            <div className="srm-actions">
              <button
                type="button"
                className="srm-submit-btn"
                disabled={rating === 0}
                onClick={handleSubmit}
              >
                <ThumbsUp size={16} />
                <span>Baholash ({rating > 0 ? `${rating} ball` : 'tanlang'})</span>
              </button>
              <button
                type="button"
                className="srm-later-btn"
                onClick={onClose}
              >
                Keyinroq
              </button>
            </div>
          </>
        ) : (
          <div className="srm-success-box">
            <div className="srm-success-icon">
              <Check size={36} strokeWidth={2.8} />
            </div>
            <h3 className="srm-success-title">Rahmat!</h3>
            <p className="srm-success-desc">
              Bahoyingiz muvaffaqiyatli qabul qilindi va <strong>{station.name}</strong> shahobchasining umumiy sifat reytingiga qo'shildi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
