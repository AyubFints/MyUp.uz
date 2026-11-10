import React, { useEffect } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Compass,
  Flame,
  ShieldAlert,
  HardDrive,
  Lock,
  Mail,
  Send,
  ExternalLink,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import axLogoImg from "../assets/ax-logo.png";

/**
 * PrivacyPolicyPage - Google Play Store va Xalqaro Maxfiylik Standartlariga
 * to'liq moslashtirilgan rasmiy maxfiylik siyosati sahifasi.
 *
 * @param {Object} props
 * @param {Function} props.onBack - Asosiy xaritaga qaytish handler funksiyasi
 * @param {boolean} [props.isThemeLight=false]
 * @param {Object} [props.appTheme=null]
 */
export default function PrivacyPolicyPage({
  onBack,
  isThemeLight = false,
  appTheme = null,
}) {
  // Sahifa ochilganda sahifani eng yuqorisiga aylantirish
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const bgColor = appTheme?.bg || "#090d16";
  const cardBg = appTheme?.card || "rgba(19, 29, 53, 0.75)";
  const borderColor = appTheme?.border || "rgba(56, 189, 248, 0.15)";
  const textPrimary = appTheme?.text || "#f8fafc";
  const _textMuted = appTheme?.textMuted || "#94a3b8";
  const _accentColor = appTheme?.accent || "#38bdf8";

  return (
    <div
      className={`privacy-page-root ${isThemeLight ? "is-light" : ""}`}
      style={{
        backgroundColor: bgColor,
        color: textPrimary,
        minHeight: "100vh",
        paddingBottom: "100px",
      }}
    >
      <style>{`
        .privacy-page-root {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          user-select: text !important;
          -webkit-user-select: text !important;
        }
        .privacy-container {
          max-width: 860px;
          margin: 0 auto;
          padding: 24px 20px;
        }
        .privacy-top-nav-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 0 24px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 28px;
        }
        .privacy-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(56, 189, 248, 0.12);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 12px;
          padding: 10px 18px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .privacy-back-btn:hover {
          background: #38bdf8;
          color: #090d16;
          box-shadow: 0 4px 16px rgba(56, 189, 248, 0.35);
          transform: translateY(-1px);
        }
        .privacy-brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          color: #94a3b8;
        }
        .privacy-brand-badge img {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }
        .privacy-hero-card {
          border-radius: 20px;
          padding: 28px;
          margin-bottom: 24px;
          border: 1px solid rgba(56, 189, 248, 0.25);
          background: linear-gradient(145deg, rgba(19, 29, 53, 0.9) 0%, rgba(9, 13, 22, 0.95) 100%);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          position: relative;
          overflow: hidden;
        }
        .privacy-hero-card::after {
          content: "";
          position: absolute;
          top: -40px;
          right: -40px;
          width: 140px;
          height: 140px;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%);
          pointer-events: none;
        }
        .privacy-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #34d399;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .privacy-hero-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.85rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 10px;
          color: #ffffff;
        }
        .privacy-hero-subtitle {
          font-size: 0.98rem;
          line-height: 1.6;
          color: #cbd5e1;
        }
        .privacy-meta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 16px;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.85rem;
          color: #94a3b8;
        }
        .privacy-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .privacy-section-card {
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(19, 29, 53, 0.6);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
          transition: border-color 0.2s ease;
        }
        .privacy-section-card:hover {
          border-color: rgba(56, 189, 248, 0.3);
        }
        .privacy-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .privacy-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .privacy-section-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffffff;
        }
        .privacy-section-subtitle {
          font-size: 0.84rem;
          color: #94a3b8;
        }
        .privacy-body-text {
          font-size: 0.95rem;
          line-height: 1.7;
          color: #cbd5e1;
          margin-bottom: 14px;
        }
        .privacy-highlight-box {
          border-radius: 12px;
          padding: 16px;
          margin: 14px 0;
          font-size: 0.92rem;
          line-height: 1.6;
        }
        .privacy-highlight-green {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #a7f3d0;
        }
        .privacy-highlight-blue {
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.35);
          color: #bae6fd;
        }
        .privacy-highlight-amber {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.35);
          color: #fde68a;
        }
        .privacy-bullet-list {
          list-style: none;
          padding: 0;
          margin: 12px 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .privacy-bullet-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.93rem;
          line-height: 1.6;
          color: #cbd5e1;
        }
        .privacy-bullet-icon {
          flex-shrink: 0;
          margin-top: 4px;
          color: #38bdf8;
        }
        .privacy-contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 14px;
          margin-top: 16px;
        }
        .privacy-contact-card {
          border-radius: 12px;
          padding: 16px;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
        }
        .privacy-contact-card:hover {
          border-color: #38bdf8;
          transform: translateY(-2px);
          background: rgba(56, 189, 248, 0.08);
        }
        .privacy-contact-info-title {
          font-size: 0.84rem;
          color: #94a3b8;
          margin-bottom: 2px;
        }
        .privacy-contact-info-value {
          font-family: 'Outfit', sans-serif;
          font-size: 0.98rem;
          font-weight: 600;
          color: #38bdf8;
        }
        .privacy-bottom-action-bar {
          margin-top: 36px;
          text-align: center;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .privacy-return-btn-large {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: #ffffff;
          border: none;
          border-radius: 14px;
          padding: 14px 28px;
          font-family: 'Outfit', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(2, 132, 199, 0.4);
          transition: all 0.2s ease;
        }
        .privacy-return-btn-large:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(2, 132, 199, 0.6);
          filter: brightness(1.1);
        }
        @media (max-width: 768px) {
          .privacy-container {
            padding: 16px 14px;
          }
          .privacy-hero-title {
            font-size: 1.45rem;
          }
          .privacy-top-nav-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .privacy-back-btn {
            justify-content: center;
            width: 100%;
          }
          .privacy-section-card {
            padding: 18px 16px;
          }
          .privacy-return-btn-large {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <div className="privacy-container">
        {/* Yuqori navigatsiya paneli: Asosiy xaritaga qaytish */}
        <div className="privacy-top-nav-bar">
          <button
            type="button"
            className="privacy-back-btn"
            onClick={onBack}
            title="Asosiy xaritaga qaytish"
          >
            <ArrowLeft size={18} />
            <span>Asosiy xaritaga qaytish</span>
          </button>

          <div className="privacy-brand-badge">
            <img src={axLogoImg} alt="AX-Map Logo" />
            <span>AX-Map — O'zbekiston Yoqilg'i Xaritasi</span>
          </div>
        </div>

        {/* Hero Sarlavha Kartasi */}
        <div className="privacy-hero-card">
          <div className="privacy-badge-pill">
            <ShieldCheck size={14} />
            <span>Google Play Store Muvofiqligi</span>
          </div>

          <h1 className="privacy-hero-title">Maxfiylik Siyosati (Privacy Policy)</h1>
          <p className="privacy-hero-subtitle">
            AX-Map mobil va veb ilovasida shaxsiy ma'lumotlar xavfsizligi, geolokatsiya (GPS)
            ruxsatlari, jamoaviy ma'lumotlar almashinuvi va foydalanuvchi huquqlari bo'yicha rasmiy qoidalar.
          </p>

          <div className="privacy-meta-row">
            <div className="privacy-meta-item">
              <Clock size={14} />
              <span>Kuchga kirish sanasi: <strong>2026-yil 10-noyabr</strong></span>
            </div>
            <div className="privacy-meta-item">
              <UserCheck size={14} />
              <span>Ilova ID: <strong>uz.axmap.app</strong></span>
            </div>
            <div className="privacy-meta-item">
              <CheckCircle2 size={14} />
              <span>Versiya: <strong>1.0.0 (Release)</strong></span>
            </div>
          </div>
        </div>

        {/* 1. UMUMIY QOIDALAR VA QAMROV */}
        <section className="privacy-section-card" style={{ background: cardBg, borderColor }}>
          <div className="privacy-section-header">
            <div className="privacy-icon-box" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="privacy-section-title">1. Umumiy qoidalar va Qamrov (Overview & Scope)</h2>
              <span className="privacy-section-subtitle">AX-Map platformasining maqsadi va tamoyillari</span>
            </div>
          </div>
          <p className="privacy-body-text">
            Ushbu Maxfiylik Siyosati <strong>AX-Map</strong> (bundan buyon «Ilova» yoki «Platforma»)
            foydalanuvchilari (haydovchilar, shoxobcha egalari va mehmonlar) shaxsiy ma'lumotlarining
            qanday to'planishi, ishlatilishi va himoyalanishini belgilaydi.
          </p>
          <p className="privacy-body-text">
            AX-Map O'zbekiston Respublikasining <em>«Shaxsga doir ma'lumotlar to'g'risida»</em>gi Qonuni
            hamda Google Play Dasturchilar Siyosatiga (Google Play Developer Distribution Agreement &
            User Data Policy) qat'iy amal qilgan holda faoliyat yuritadi.
          </p>
        </section>

        {/* 2. GEOLOKATSIYA: FOREGROUND GPS (ENG ASOSIY DISCLOSURE) */}
        <section className="privacy-section-card" style={{ background: cardBg, borderColor }}>
          <div className="privacy-section-header">
            <div className="privacy-icon-box" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>
              <MapPin size={22} />
            </div>
            <div>
              <h2 className="privacy-section-title">2. Geolokatsiya va Joylashuv Ruxsatlari (Foreground Location)</h2>
              <span className="privacy-section-subtitle">Aniq GPS ma'lumotlaridan faqat dastur ochiq paytida foydalanish</span>
            </div>
          </div>

          <p className="privacy-body-text">
            AX-Map sizga qulay xizmat ko'rsatish uchun qurilmangizning aniq koordinatalarini
            (<code>ACCESS_FINE_LOCATION</code> va <code>ACCESS_COARSE_LOCATION</code>) so'raydi.
            Ushbu ruxsat <strong>faqat ilova ekranda faol (foreground) ishlayotgan paytda</strong> quyidagi aniq maqsadlarda ishlatiladi:
          </p>

          <ul className="privacy-bullet-list">
            <li className="privacy-bullet-item">
              <Compass size={18} className="privacy-bullet-icon" />
              <span>
                <strong>Eng yaqin shoxobchalarni topish:</strong> Foydalanuvchining joriy nuqtasiga eng yaqin
                metan (CNG), propan (LPG), benzin va elektr quvvatlash stansiyalarini aniqlash va xaritada ko'rsatish.
              </span>
            </li>
            <li className="privacy-bullet-item">
              <Compass size={18} className="privacy-bullet-icon" />
              <span>
                <strong>Masofani real vaqtda hisoblash:</strong> Joriy koordinatangizdan tanlangan shahobchagacha
                bo'lgan aniq masofani (kilometrda) hisoblab berish.
              </span>
            </li>
            <li className="privacy-bullet-item">
              <Compass size={18} className="privacy-bullet-icon" />
              <span>
                <strong>Turn-by-turn navigatsiya va marshrutlash:</strong> Haydovchi tanlagan manzilga yetib borishi
                uchun OSRM marshrutlash algoritmi orqali optimal avtomobil yo'lini chizish.
              </span>
            </li>
            <li className="privacy-bullet-item">
              <Compass size={18} className="privacy-bullet-icon" />
              <span>
                <strong>Yaqinlik bo'yicha tartiblash:</strong> Shoxobchalar ro'yxatini haydovchiga yaqinlik darajasi
                bo'yicha saralash.
              </span>
            </li>
          </ul>

          <div className="privacy-highlight-box privacy-highlight-blue">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", marginBottom: "4px" }}>
              <CheckCircle2 size={16} />
              <span>Geolokatsiyadan foydalanish shaffofligi</span>
            </div>
            Siz istalgan vaqtda telefoningizning sozlamalari orqali AX-Map uchun geolokatsiya ruxsatini yoqishingiz yoki
            o'chirib qo'yishingiz mumkin. Ruxsat o'chirilgan taqdirda xaritadan qo'lda qidiruv orqali foydalanish imkoniyati saqlanib qoladi.
          </div>
        </section>

        {/* 3. STRICT NO BACKGROUND LOCATION TRACKING (GOOGLE PLAY TALABI) */}
        <section className="privacy-section-card" style={{ background: cardBg, borderColor }}>
          <div className="privacy-section-header">
            <div className="privacy-icon-box" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 className="privacy-section-title">3. Orqa Fonda Kuzatuv O'tkazilmasligi (Strict NO Background Tracking)</h2>
              <span className="privacy-section-subtitle">Google Play xavfsizlik kafolati</span>
            </div>
          </div>

          <div className="privacy-highlight-box privacy-highlight-green">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "800", fontSize: "1rem", marginBottom: "6px" }}>
              <CheckCircle2 size={18} color="#10b981" />
              <span>Qat'iy Kafolat: Orqa fonda joylashuv hech qachon kuzatilmaydi</span>
            </div>
            <p style={{ margin: 0, lineHeight: 1.65 }}>
              AX-Map ilovasi foydalanuvchi ilovadan chiqqanda, dastur minimallashtirilganda yoki telefon ekrani
              qulflanganda foydalanuvchining joylashuvini <strong>MUTLAQO KUZATMAYDI, TO'PLAMAYDI VA SAQLAMAYDI</strong>.
            </p>
          </div>

          <ul className="privacy-bullet-list">
            <li className="privacy-bullet-item">
              <CheckCircle2 size={18} className="privacy-bullet-icon" style={{ color: "#10b981" }} />
              <span>
                Ilova tizimdan <code>ACCESS_BACKGROUND_LOCATION</code> ruxsatini talab qilmaydi va orqa fonda GPS modemni ishlatmaydi.
              </span>
            </li>
            <li className="privacy-bullet-item">
              <CheckCircle2 size={18} className="privacy-bullet-icon" style={{ color: "#10b981" }} />
              <span>
                Foydalanuvchining harakatlanish yo'nalishi (location history / timeline) serverlarda to'planmaydi, profiling qilinmaydi va uchinchi shaxslarga berilmaydi.
              </span>
            </li>
            <li className="privacy-bullet-item">
              <CheckCircle2 size={18} className="privacy-bullet-icon" style={{ color: "#10b981" }} />
              <span>
                Koordinatalar faqat qurilma xotirasida (RAM) vaqtinchalik hisob-kitoblar uchun saqlanadi va ilova yopilishi bilan tozalanadi.
              </span>
            </li>
          </ul>
        </section>

        {/* 4. JAMOA SHOHOBCHALARI, METAN BOSIMI VA SHARHLAR */}
        <section className="privacy-section-card" style={{ background: cardBg, borderColor }}>
          <div className="privacy-section-header">
            <div className="privacy-icon-box" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
              <Flame size={22} />
            </div>
            <div>
              <h2 className="privacy-section-title">4. Jamoaviy Ma'lumotlar, Gaz Bosimi va Sharhlar (Community Data Terms)</h2>
              <span className="privacy-section-subtitle">Foydalanuvchilar tomonidan kiritiladigan ochiq ma'lumotlar</span>
            </div>
          </div>

          <p className="privacy-body-text">
            AX-Map haydovchilar jamoasi tomonidan to'ldiriladigan jonli ma'lumotlar platformasidir:
          </p>

          <ul className="privacy-bullet-list">
            <li className="privacy-bullet-item">
              <Flame size={18} className="privacy-bullet-icon" style={{ color: "#f59e0b" }} />
              <span>
                <strong>Metan gaz bosimi ko'rsatkichi (bar):</strong> Haydovchilar metan quyish shoxobchalaridagi
                amaldagi gaz bosimi (masalan, 180-220 bar) va navbat holatini real vaqtda yangilab borishlari mumkin.
                Ushbu ma'lumotlar barcha haydovchilar uchun ochiq e'lon qilinadi.
              </span>
            </li>
            <li className="privacy-bullet-item">
              <Flame size={18} className="privacy-bullet-icon" style={{ color: "#f59e0b" }} />
              <span>
                <strong>Yangi shoxobchalar qo'shish:</strong> Foydalanuvchilar yangi shoxobcha nomi, manzili,
                geografik nuqtasi, mavjud yoqilg'i turlari va qulayliklarini (oshxona, namozxona, tualet, do'kon, kompressor) kiritishlari mumkin.
                Barcha arizalar moderatorlar tomonidan tekshirilib tasdiqlanadi.
              </span>
            </li>
            <li className="privacy-bullet-item">
              <Flame size={18} className="privacy-bullet-icon" style={{ color: "#f59e0b" }} />
              <span>
                <strong>Sharhlar va baholash:</strong> Shoxobchalarga berilgan baholar (1-5 yulduz) va fikr-mulohazalar
                boshqa haydovchilarga to'g'ri tanlov qilishda yordam beradi. Tizimda yolg'on, haqoratomuz yoki reklama
                xarakteridagi matnlarni moderatorlar o'chirish huquqiga ega.
              </span>
            </li>
          </ul>
        </section>

        {/* 5. LOCAL STORAGE VA MA'LUMOTLARNI SAQLASH */}
        <section className="privacy-section-card" style={{ background: cardBg, borderColor }}>
          <div className="privacy-section-header">
            <div className="privacy-icon-box" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#a855f7" }}>
              <HardDrive size={22} />
            </div>
            <div>
              <h2 className="privacy-section-title">5. Qurilma Xotirasi va Kesh (Local Storage & Data Retention)</h2>
              <span className="privacy-section-subtitle">Ilovaning oflayn va tezkor ishlashini ta'minlash</span>
            </div>
          </div>

          <p className="privacy-body-text">
            AX-Map foydalanuvchi tajribasini optimallashtirish maqsadida qurilmaning xotirasidan
            (<code>localStorage</code> va <code>sessionStorage</code>) quyidagi ma'lumotlarni saqlashda foydalanadi:
          </p>

          <ul className="privacy-bullet-list">
            <li className="privacy-bullet-item">
              <CheckCircle2 size={18} className="privacy-bullet-icon" style={{ color: "#a855f7" }} />
              <span>
                <strong>Kesh qilingan shoxobchalar:</strong> Internet uzilgan yoki zaif bo'lgan holatda ham
                xaritani ko'rsatish uchun oxirgi yuklangan ma'lumotlar saqlanadi.
              </span>
            </li>
            <li className="privacy-bullet-item">
              <CheckCircle2 size={18} className="privacy-bullet-icon" style={{ color: "#a855f7" }} />
              <span>
                <strong>Foydalanuvchi sozlamalari:</strong> Tanlangan interfeys mavzusi (Dark/Light yoki rangli mavzular)
                va saralash filtrlari.
              </span>
            </li>
            <li className="privacy-bullet-item">
              <CheckCircle2 size={18} className="privacy-bullet-icon" style={{ color: "#a855f7" }} />
              <span>
                <strong>Avtorizatsiya tokeni:</strong> Shaxsiy profilga kirganda sessiyani ushlab turish uchun
                xavfsiz token saqlanadi.
              </span>
            </li>
          </ul>

          <p className="privacy-body-text" style={{ marginTop: "10px" }}>
            Ilova uchinchi tomon reklama trekerlari yoki foydalanuvchini saytdan-saytga kuzatuvchi
            josuslik fayllaridan (cross-site tracking cookies) foydalanmaydi.
          </p>
        </section>

        {/* 6. XAVFSIZLIK VA SHIFRLASH */}
        <section className="privacy-section-card" style={{ background: cardBg, borderColor }}>
          <div className="privacy-section-header">
            <div className="privacy-icon-box" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>
              <Lock size={22} />
            </div>
            <div>
              <h2 className="privacy-section-title">6. Ma'lumotlar Xavfsizligi (Security Standards)</h2>
              <span className="privacy-section-subtitle">Xalqaro shifrlash va himoya standartlari</span>
            </div>
          </div>

          <p className="privacy-body-text">
            Barcha server so'rovlari <strong>HTTPS (TLS 1.2 / 1.3)</strong> xavfsiz shifrlangan kanallar orqali
            uzatiladi. Foydalanuvchi hisobining parollari zamonaviy bir tomonlama xeshlash algoritmlari
            (bcrypt) yordamida himoyalangan va ochiq matn shaklida hech qachon saqlanmaydi.
          </p>
        </section>

        {/* 7. AKKAUNT VA MA'LUMOTLARNI O'CHIRISH (GOOGLE PLAY TALABI) */}
        <section className="privacy-section-card" style={{ background: cardBg, borderColor }}>
          <div className="privacy-section-header">
            <div className="privacy-icon-box" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
              <UserCheck size={22} />
            </div>
            <div>
              <h2 className="privacy-section-title">7. Akkaunt va Ma'lumotlarni O'chirish (Account & Data Deletion)</h2>
              <span className="privacy-section-subtitle">Foydalanuvchi huquqi va shaxsiy ma'lumotlarni o'chirish tartibi</span>
            </div>
          </div>

          <p className="privacy-body-text">
            Google Play siyosati talablariga muvofiq, har qanday foydalanuvchi istalgan vaqtda o'zining
            akkountini va unga bog'langan barcha ma'lumotlarni (telefon raqami, ism, yozilgan sharhlar,
            kiritilgan shoxobchalar arizalari) to'liq va qaytarib bo'lmaydigan qilib o'chirishni talab qilish huquqiga ega.
          </p>

          <div className="privacy-highlight-box privacy-highlight-amber">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", marginBottom: "4px" }}>
              <AlertCircle size={16} />
              <span>O'chirish arizasini topshirish tartibi</span>
            </div>
            Akkauntni o'chirish uchun ro'yxatdan o'tgan telefon raqamingizni ko'rsatgan holda quyidagi aloqa vositalari
            orqali bizga murojaat qiling. Arizangiz <strong>48 soat ichida (uzog'i bilan 7 ish kuni)</strong> to'liq bajariladi:
          </div>

          <div className="privacy-contact-grid">
            <a
              href="mailto:support@axmap.uz?subject=Akkauntni%20ochirish%20(Delete%20Account)%20talabi"
              className="privacy-contact-card"
              title="Email orqali murojaat qilish"
            >
              <div className="privacy-icon-box" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>
                <Mail size={20} />
              </div>
              <div>
                <div className="privacy-contact-info-title">Rasmiy Email Qo'llab-quvvatlash</div>
                <div className="privacy-contact-info-value">support@axmap.uz</div>
              </div>
            </a>

            <a
              href="https://t.me/axmap_admin"
              target="_blank"
              rel="noopener noreferrer"
              className="privacy-contact-card"
              title="Telegram admin bilan bog'lanish"
            >
              <div className="privacy-icon-box" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>
                <Send size={20} />
              </div>
              <div>
                <div className="privacy-contact-info-title">Telegram Qo'llab-quvvatlash</div>
                <div className="privacy-contact-info-value">@axmap_admin</div>
              </div>
            </a>
          </div>
        </section>

        {/* 8. BOG'LANISH VA MUALLIFLIK HUQUQLARI */}
        <section className="privacy-section-card" style={{ background: cardBg, borderColor }}>
          <div className="privacy-section-header">
            <div className="privacy-icon-box" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>
              <ExternalLink size={22} />
            </div>
            <div>
              <h2 className="privacy-section-title">8. Aloqa va Bog'lanish Ma'lumotlari</h2>
              <span className="privacy-section-subtitle">Savol va takliflar uchun rasmiy manba</span>
            </div>
          </div>
          <p className="privacy-body-text">
            Ushbu Maxfiylik Siyosati bo'yicha savollaringiz, takliflaringiz yoki e'tirozlaringiz bo'lsa,
            quyidagi aloqa kanallari orqali biz bilan bog'lanishingiz mumkin:
          </p>
          <ul className="privacy-bullet-list">
            <li className="privacy-bullet-item">
              <CheckCircle2 size={16} className="privacy-bullet-icon" />
              <span><strong>Dastur nomi:</strong> AX-Map (uz.axmap.app)</span>
            </li>
            <li className="privacy-bullet-item">
              <CheckCircle2 size={16} className="privacy-bullet-icon" />
              <span><strong>Veb-sayt:</strong> <a href="https://myupuz.vercel.app" style={{ color: "#38bdf8", textDecoration: "none" }}>https://myupuz.vercel.app</a></span>
            </li>
            <li className="privacy-bullet-item">
              <CheckCircle2 size={16} className="privacy-bullet-icon" />
              <span><strong>Aloqa pochtasi:</strong> support@axmap.uz / admin@myup.uz</span>
            </li>
            <li className="privacy-bullet-item">
              <CheckCircle2 size={16} className="privacy-bullet-icon" />
              <span><strong>Manzil:</strong> O'zbekiston Respublikasi, Toshkent shahri</span>
            </li>
          </ul>
        </section>

        {/* Pastki Harakat Tugmasi: Xaritaga Qaytish */}
        <div className="privacy-bottom-action-bar">
          <button
            type="button"
            className="privacy-return-btn-large"
            onClick={onBack}
            title="Asosiy xaritaga qaytish"
          >
            <ArrowLeft size={20} />
            <span>Asosiy xaritaga qaytish</span>
          </button>
        </div>
      </div>
    </div>
  );
}
