import React from "react";
import { Phone, ArrowRight } from "lucide-react";
import axLogoImg from "../assets/ax-header-logo.png";
import footerBgImg from "../assets/desktop-footer-bg.jpg";

export default function DesktopFooter({ onNavigate }) {
  const handleNav = (tab) => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  return (
    <footer
      className="desktop-footer-section"
      style={{
        backgroundImage: `url(${footerBgImg})`,
      }}
    >
      <div className="desktop-footer-backdrop-overlay" />

      <div className="desktop-footer-container">
        {/* 3 ASOSIY USTUN (3 Main Columns) */}
        <div className="desktop-footer-grid">
          {/* 1-USTUN (Chap tomon: AX kompaniyasi haqida) */}
          <div className="footer-col footer-col-left">
            <div className="footer-logo-row">
              <img src={axLogoImg} alt="AX" className="footer-ax-logo-img" />
            </div>

            <h4 className="footer-company-tagline">
              Startap va dasturlar yaratuvchi kampaniya
            </h4>

            <p className="footer-company-desc">
              Biz insonlarga manfati tegadigan, qaysidir og'ir muammo bo'lib turgan holatlarga yechim berish uchun startap yaratuvchi kampaniyamiz!
            </p>

            <p className="footer-company-desc">
              Biz g'oyangizni ishlaydigan dasturga aylantiramiz va jumladan sizga dasturiy ta'minot kerak bo'lsa biz tayyormiz!
            </p>

            <div className="footer-tags-row">
              <span className="footer-tag-pill">Startaplar</span>
              <span className="footer-tag-pill">Veb-saytlar</span>
              <span
                className="footer-tag-pill"
                onClick={() => handleNav("apps")}
                style={{ cursor: "pointer" }}
                title="AX-Map mobil ilovasini yuklab olish"
              >
                Mobil ilovalar
              </span>
            </div>

            <div className="footer-products-list">
              <div 
                className="footer-product-item active"
                onClick={() => handleNav("home")}
                role="button"
                tabIndex={0}
                title="AX-Map asosiy sahifasi"
              >
                AX-Map
              </div>
              <div className="footer-product-item muted" title="Tez kunda">
                AX-Store
              </div>
              <div className="footer-product-item muted" title="Tez kunda">
                AX-Taxi
              </div>
            </div>
          </div>

          {/* 2-USTUN (O'rta tomon: Dasturiy ta'minot bo'yicha yo'riqnoma va kontaktlar) */}
          <div className="footer-col footer-col-center">
            <h3 className="footer-center-title">
              Dasturiy ta'minotga ehtiyojingiz bor bo'lsa
            </h3>

            <p
              className="footer-center-subtitle"
              onClick={() => handleNav("guide")}
              style={{ cursor: "pointer" }}
              title="Qo'llanmalar bo'limiga o'tish"
            >
              Dasturiy ta'minot olish bo'yicha yo'riqnomalar
            </p>

            <button
              type="button"
              className="footer-guide-action-btn"
              onClick={() => handleNav("guide")}
              title="Qo'llanmani ko'rish"
            >
              <span>Qo'llanmani ko'rish</span>
              <ArrowRight size={18} strokeWidth={2.4} />
            </button>

            <div className="footer-center-contacts">
              <a href="tel:+998772781808" className="footer-contact-item" title="Qo'ng'iroq qilish">
                <div className="footer-contact-icon-circle blue-icon">
                  <Phone size={14} />
                </div>
                <span className="footer-contact-text">+998 77 278 18 08</span>
              </a>

              <a
                href="https://t.me/xaamiitov"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-contact-item"
                title="Telegram orqali bog'lanish"
              >
                <div className="footer-contact-icon-circle dark-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.18 3.35-1.39 3.73-1.39.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                </div>
                <span className="footer-contact-text">@xaamiitov</span>
              </a>
            </div>
          </div>

          {/* 3-USTUN (O'ng tomon: Katta AX-Map va Murojaat uchun) */}
          <div className="footer-col footer-col-right">
            <h2
              className="footer-big-brand-title"
              onClick={() => handleNav("home")}
              style={{ cursor: "pointer" }}
              title="AX-Map asosiy sahifasi"
            >
              AX-Map
            </h2>

            <h4
              className="footer-right-category"
              onClick={() => handleNav("guide")}
              role="button"
              tabIndex={0}
              title="Qo'llanmalar bo'limiga o'tish"
            >
              Qo'llanmalar
            </h4>

            <p className="footer-right-desc">
              Yoqilg'i shahobchalarini qidirishda, ochiq-yopiqligini, yoqilg'i narxlarini va gaz bosimlarini jonli online bilib turishda yordam beradi.
            </p>

            <a
              href="tel:+998772781808"
              className="footer-murojaat-card-pill"
              title="Murojaat uchun qo'ng'iroq qilish"
            >
              <div className="footer-murojaat-icon-circle">
                <Phone size={15} />
              </div>
              <span className="footer-murojaat-text">
                Murojaat uchun: +998 77 278 18 08
              </span>
            </a>
          </div>
        </div>

        {/* PASTKI CHIZIQ (Copyright & Sayt nomi) */}
        <div className="desktop-footer-bottom-bar">
          <span className="footer-copyright-text">
            © 2026 AX. Barcha huquqlar himoyalangan.
          </span>
          <span className="footer-brand-domain">
            AX-Map.uz — AX dasturlari
          </span>
        </div>
      </div>
    </footer>
  );
}
