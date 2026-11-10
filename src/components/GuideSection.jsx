import React, { useState } from "react";
import {
  HelpCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  MapPin,
  Fuel,
  Navigation,
  ShieldCheck,
  UserPlus,
  Building2,
  Clock,
  ArrowRight,
  Info,
  AlertCircle,
  Smartphone,
} from "lucide-react";

/**
 * GuideSection - Professional, tushunarli va lo'nda dastur qo'llanmasi
 * O'zbek tilida to'liq texnik va foydalanuvchi ma'lumotlari
 */
export default function GuideSection({
  user,
  onGoToRegister,
  onGoToAddLocation,
  isThemeLight = false,
  appTheme = null,
}) {
  const [openAccordion, setOpenAccordion] = useState({
    about: false,
    register: false,
    location: false,
    admin: false,
  });

  const toggleSection = (key) => {
    setOpenAccordion((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const cardBg = appTheme?.card || (isThemeLight ? "#ffffff" : "#18181b");
  const borderColor = appTheme?.border || (isThemeLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.08)");
  const textPrimary = appTheme?.text || (isThemeLight ? "#0f172a" : "#f8fafc");
  const textMuted = appTheme?.textMuted || (isThemeLight ? "#64748b" : "#94a3b8");
  const accentColor = appTheme?.accent || "#38bdf8";

  return (
    <div className="guide-view-container">
      {/* Sarlavha paneli */}
      <div className="guide-view-header">
        <div className="guide-header-icon-wrap">
          <BookOpen size={24} color={accentColor} />
        </div>
        <div>
          <h1 className="guide-view-main-title">Dastur bo'yicha qo'llanma</h1>
          <p className="guide-view-subtitle">
            AX-Map imkoniyatlari, ro'yxatdan o'tish va joylashuv qo'shish tartibi
          </p>
        </div>
      </div>

      <div className="guide-sections-wrapper">
        {/* ========================================================
            1-BO'LIM: DASTUR NIMA QILIB BERADI?
            ======================================================== */}
        <section
          className="guide-card-block"
          style={{ background: cardBg, borderColor }}
        >
          <div
            className="guide-card-header"
            onClick={() => toggleSection("about")}
            role="button"
            tabIndex={0}
          >
            <div className="guide-card-title-group">
              <span className="guide-card-number">1</span>
              <div>
                <h2 className="guide-card-title" style={{ color: textPrimary }}>
                  AX-Map nima va qanday xizmat ko'rsatadi?
                </h2>
                <span className="guide-card-meta" style={{ color: textMuted }}>
                  Ilovaning asosiy vazifasi va haydovchilar uchun imkoniyatlari
                </span>
              </div>
            </div>
            <div className="guide-accordion-arrow" style={{ color: textMuted }}>
              {openAccordion.about ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>

          {openAccordion.about && (
            <div className="guide-card-body">
              <p className="guide-lead-text" style={{ color: textPrimary }}>
                <strong>AX-Map</strong> — O'zbekistondagi barcha yoqilg'i quyish va avto-servis shahobchalarini yagona platformada birlashtiruvchi axborot tizimidir. Ilova haydovchilarga o'zlariga kerakli yoqilg'i va xizmatlarni ortiqcha vaqt sarflamasdan topishga yordam beradi.
              </p>

              <div className="guide-features-grid">
                <div className="guide-feature-item">
                  <div className="guide-feature-icon-box">
                    <Fuel size={18} color="#38bdf8" />
                  </div>
                  <div>
                    <h4 style={{ color: textPrimary }}>Real vaqtdagi gaz bosimi va narxlar</h4>
                    <p style={{ color: textMuted }}>
                      Metan (CNG) shahobchalarining amaldagi gaz bosimi (bar), Propan (LPG), Ai-80, 92, 95, 98 benzin hamda Elektr quvvatlash (EV) stansiyalarining kunlik narxlari ko'rsatib boriladi.
                    </p>
                  </div>
                </div>

                <div className="guide-feature-item">
                  <div className="guide-feature-icon-box">
                    <Navigation size={18} color="#10b981" />
                  </div>
                  <div>
                    <h4 style={{ color: textPrimary }}>Eng yaqin shahobchalar va Navigatsiya</h4>
                    <p style={{ color: textMuted }}>
                      GPS koordinatalar orqali joriy joylashuvingizga eng yaqin shahobchani aniqlaydi va bir bosishda Yandex Navigator yoki Google Maps orqali to'g'ri marshrut chizib beradi.
                    </p>
                  </div>
                </div>

                <div className="guide-feature-item">
                  <div className="guide-feature-icon-box">
                    <Clock size={18} color="#f59e0b" />
                  </div>
                  <div>
                    <h4 style={{ color: textPrimary }}>Ochiq/yopiq holati va navbat ma'lumotlari</h4>
                    <p style={{ color: textMuted }}>
                      Shahobchalarning ish vaqtlari, tanaffus va ta'mirlash holatlari real vaqt rejimida yangilanadi, shuningdek boshqa haydovchilar qoldirgan navbat ma'lumotlari chiqadi.
                    </p>
                  </div>
                </div>

                <div className="guide-feature-item">
                  <div className="guide-feature-icon-box">
                    <Building2 size={18} color="#a855f7" />
                  </div>
                  <div>
                    <h4 style={{ color: textPrimary }}>Qo'shimcha servis xizmatlari</h4>
                    <p style={{ color: textMuted }}>
                      Faqat yoqilg'i emas, balki hududdagi avtomoyka, moy almashtirish xizmati, vulkanizatsiya, kafe, mini-market va namozxonalar haqida to'liq ma'lumot beriladi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================
            2-BO'LIM: PROFIL YARATISH VA RO'YXATDAN O'TISH
            ======================================================== */}
        <section
          className="guide-card-block"
          style={{ background: cardBg, borderColor }}
        >
          <div
            className="guide-card-header"
            onClick={() => toggleSection("register")}
            role="button"
            tabIndex={0}
          >
            <div className="guide-card-title-group">
              <span className="guide-card-number">2</span>
              <div>
                <h2 className="guide-card-title" style={{ color: textPrimary }}>
                  Profil yaratish va ro'yxatdan o'tish
                </h2>
                <span className="guide-card-meta" style={{ color: textMuted }}>
                  Ro'yxatdan o'tish afzalliklari va bosqichma-bosqich ko'rsatma
                </span>
              </div>
            </div>
            <div className="guide-accordion-arrow" style={{ color: textMuted }}>
              {openAccordion.register ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>

          {openAccordion.register && (
            <div className="guide-card-body">
              <div className="guide-info-callout">
                <Info size={18} color="#38bdf8" />
                <p>
                  Dasturdan ro'yxatdan o'tmasdan ham foydalanish mumkin. Biroq o'z shahobchangizni qo'shish, ma'lumotlarni tahrirlash hamda barcha telefonlarda ma'lumotlaringizni saqlab qolish uchun profil yaratish talab etiladi.
                </p>
              </div>

              <h4 className="guide-subheading" style={{ color: textPrimary }}>
                Ro'yxatdan o'tish bosqichlari:
              </h4>

              <div className="guide-ordered-steps">
                <div className="guide-step-row">
                  <div className="guide-step-index">1</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>«Profil» bo'limiga kiring</strong>
                    <p style={{ color: textMuted }}>
                      Mobil menyuning pastidagi yoki kompyuter tepadagi «Profil» tugmasini bosing.
                    </p>
                  </div>
                </div>

                <div className="guide-step-row">
                  <div className="guide-step-index">2</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>Telefon raqamingizni kiriting</strong>
                    <p style={{ color: textMuted }}>
                      O'zbekiston mobil raqamingizni (+998 ...) kiritib tasdiqlang.
                    </p>
                  </div>
                </div>

                <div className="guide-step-row">
                  <div className="guide-step-index">3</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>Ismingiz va parolingizni belgilang</strong>
                    <p style={{ color: textMuted }}>
                      Tizimga kirish uchun o'zingiz biladigan ishonchli parol o'rnating.
                    </p>
                  </div>
                </div>

                <div className="guide-step-row">
                  <div className="guide-step-index">4</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>Profil tayyor</strong>
                    <p style={{ color: textMuted }}>
                      Endi siz o'z shahobchalaringizni qo'shishingiz va shaxsiy kabinetingizni boshqarishingiz mumkin.
                    </p>
                  </div>
                </div>
              </div>

              {!user && (
                <div className="guide-action-footer">
                  <button
                    type="button"
                    className="guide-primary-btn"
                    onClick={onGoToRegister}
                  >
                    <UserPlus size={16} />
                    <span>Profil yaratish yoki kirish</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ========================================================
            3-BO'LIM: JOYLASHUV QO'SHISH TARTIBI
            ======================================================== */}
        <section
          className="guide-card-block"
          style={{ background: cardBg, borderColor }}
        >
          <div
            className="guide-card-header"
            onClick={() => toggleSection("location")}
            role="button"
            tabIndex={0}
          >
            <div className="guide-card-title-group">
              <span className="guide-card-number">3</span>
              <div>
                <h2 className="guide-card-title" style={{ color: textPrimary }}>
                  Joylashuv qo'shish (Shahobcha egalari uchun)
                </h2>
                <span className="guide-card-meta" style={{ color: textMuted }}>
                  Shoxobchangizni 5 ta aniq qadamda xaritaga joylashtirish
                </span>
              </div>
            </div>
            <div className="guide-accordion-arrow" style={{ color: textMuted }}>
              {openAccordion.location ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>

          {openAccordion.location && (
            <div className="guide-card-body">
              <p className="guide-lead-text" style={{ color: textPrimary }}>
                Agar siz yoqilg'i quyish stansiyasi (Metan, Propan, Benzin, Elektr zaryadka) yoki avto-servis (moyka, moy almashtirish) egasi bo'lsangiz, o'z ob'ektingizni bepul xaritaga qo'shishingiz mumkin:
              </p>

              <div className="guide-ordered-steps">
                <div className="guide-step-row">
                  <div className="guide-step-index">1</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>«Joylashuv qo'shish» tugmasini bosing</strong>
                    <p style={{ color: textMuted }}>
                      Profil sahifasining pastki qismidagi ko'k rangli «Joylashuv qo'shish» tugmasini tanlang.
                    </p>
                  </div>
                </div>

                <div className="guide-step-row">
                  <div className="guide-step-index">2</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>Xaritadan nuqtani belgilang</strong>
                    <p style={{ color: textMuted }}>
                      Xaritadagi qizil markerni shahobchangiz joylashgan aniq manzil ustiga olib boring yoki «Mening joylashuvim» tugmasini bosing.
                    </p>
                  </div>
                </div>

                <div className="guide-step-row">
                  <div className="guide-step-index">3</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>Asosiy ma'lumotlarni kiriting</strong>
                    <p style={{ color: textMuted }}>
                      Shahobcha nomi (masalan: «Real Metan Gaz»), viloyat/shahar nomi, aniq mo'ljal va mijozlar qo'ng'iroq qilishi uchun telefon raqami.
                    </p>
                  </div>
                </div>

                <div className="guide-step-row">
                  <div className="guide-step-index">4</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>Yoqilg'i turlari va narxlarni belgilang</strong>
                    <p style={{ color: textMuted }}>
                      Metan, Propan, Ai-80, 92, 95 yoki Elektro turlarini belgilab, joriy narxlarini (so'mda) va amaldagi gaz bosimini kiriting.
                    </p>
                  </div>
                </div>

                <div className="guide-step-row">
                  <div className="guide-step-index">5</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>Rasmlarni yuklang va yuboring</strong>
                    <p style={{ color: textMuted }}>
                      Ob'ektingizning tashqi ko'rinishi, peshtoqi yoki stendi aks etgan fotosuratlarni biriktiring va «Saqlash» (yuborish) tugmasini bosing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="guide-action-footer">
                <button
                  type="button"
                  className="guide-primary-btn"
                  onClick={onGoToAddLocation}
                >
                  <Building2 size={16} />
                  <span>Hozir joylashuv qo'shish</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================
            4-BO'LIM: ADMINISTRATORGA YUBORILISHI VA TASDIQLANISHI
            ======================================================== */}
        <section
          className="guide-card-block"
          style={{ background: cardBg, borderColor }}
        >
          <div
            className="guide-card-header"
            onClick={() => toggleSection("admin")}
            role="button"
            tabIndex={0}
          >
            <div className="guide-card-title-group">
              <span className="guide-card-number">4</span>
              <div>
                <h2 className="guide-card-title" style={{ color: textPrimary }}>
                  Administrator tekshiruvi va tasdiqlanish tartibi
                </h2>
                <span className="guide-card-meta" style={{ color: textMuted }}>
                  Yuborilgan shahobcha qanday tekshiriladi va qachon ochiladi?
                </span>
              </div>
            </div>
            <div className="guide-accordion-arrow" style={{ color: textMuted }}>
              {openAccordion.admin ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>

          {openAccordion.admin && (
            <div className="guide-card-body">
              <div className="guide-timeline-list">
                <div className="guide-timeline-item">
                  <div className="guide-timeline-badge amber">
                    <Clock size={16} />
                  </div>
                  <div className="guide-timeline-content">
                    <strong style={{ color: textPrimary }}>1. Joylashuv yuborildi («Tekshiruvda» holati)</strong>
                    <p style={{ color: textMuted }}>
                      Siz joylashuvni yuborganingizda, ma'lumotlar avtomatik tarzda Dastur Administratsiyasi boshqaruv paneliga tushadi. Shahobcha profilingizdagi «Mening joylashuvlarim» ro'yxatida sariq «Ko'rib chiqilmoqda» nishoni bilan aks etadi.
                    </p>
                  </div>
                </div>

                <div className="guide-timeline-item">
                  <div className="guide-timeline-badge blue">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="guide-timeline-content">
                    <strong style={{ color: textPrimary }}>2. Ma'lumotlar mutaxassislar tomonidan tekshiriladi</strong>
                    <p style={{ color: textMuted }}>
                      Administrator kiritilgan koordinata, nom va yuklangan fotosuratlar haqiqatga mosligini tekshiradi. Bu soxta ma'lumotlar tarqalishining oldini oladi.
                    </p>
                  </div>
                </div>

                <div className="guide-timeline-item">
                  <div className="guide-timeline-badge emerald">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="guide-timeline-content">
                    <strong style={{ color: textPrimary }}>3. Tasdiqlandi — Xaritada ommaga ochiladi</strong>
                    <p style={{ color: textMuted }}>
                      Administrator tasdiqlashi bilan profilingizga bildirishnoma yetib keladi. Joylashuv barcha haydovchilar xaritasida paydo bo'ladi. Siz esa istalgan paytda gaz bosimi, narxlar va ochiq/yopiq holatini o'zingiz boshqara olasiz.
                    </p>
                  </div>
                </div>

                <div className="guide-timeline-item">
                  <div className="guide-timeline-badge red">
                    <AlertCircle size={16} />
                  </div>
                  <div className="guide-timeline-content">
                    <strong style={{ color: textPrimary }}>4. Agar rad etilsa nima bo'ladi?</strong>
                    <p style={{ color: textMuted }}>
                      Agar ma'lumotlar to'liq bo'lmasa yoki fotosurat xira bo'lsa, sababi ko'rsatilgan holda xabar yuboriladi. Profilingizdan joylashuvni tahrirlab qayta yuborish imkoni bo'ladi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Qo'shimcha yordam va aloqa */}
        <div className="guide-help-footer" style={{ borderColor }}>
          <div className="guide-help-text">
            <Smartphone size={20} color="#38bdf8" />
            <div>
              <strong style={{ color: textPrimary }}>Savollaringiz yoki takliflaringiz bormi?</strong>
              <p style={{ color: textMuted }}>
                «Sozlamalar» bo'limidagi bildirishnomalar yoki fikr bildirish orqali administrator bilan to'g'ridan-to'g'ri bog'lanishingiz mumkin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
