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
  Download,
  Bell,
  Sparkles,
} from "lucide-react";

/**
 * GuideSection - Professional, tushunarli va lo'nda dastur qo'llanmasi
 * O'zbek tilida to'liq texnik va foydalanuvchi ma'lumotlari
 */
export default function GuideSection({
  user,
  onGoToRegister,
  onGoToAddLocation,
  onOpenDownload,
  isInstalledApp = false,
  isThemeLight = false,
  appTheme = null,
}) {
  const [openAccordion, setOpenAccordion] = useState({
    about: false,
    register: false,
    activation: true,
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
        <div className="guide-header-title-row">
          <div className="guide-header-icon-wrap">
            <BookOpen size={24} color={accentColor} />
          </div>
          <h1 className="guide-view-main-title">Dastur bo'yicha qo'llanma</h1>
        </div>
        <p className="guide-view-subtitle">
          AX-Map imkoniyatlari, ro'yxatdan o'tish va joylashuv qo'shish tartibi
        </p>
      </div>

      <div className="guide-sections-wrapper">
        {/* AX-MAP RASMIY MOBIL ILOVA BANNERI (Faqat veb-saytda ko'rinadi) */}
        {!isInstalledApp && (
          <div
            className="home-download-app-card"
            onClick={onOpenDownload}
            role="button"
            tabIndex={0}
            title="Rasmiy mobil ilova"
          >
            <div className="home-download-card-content">
              <img
                src="/ax-app-icon-3d.jpg"
                alt="AX-Map"
                className="home-download-card-icon"
              />
              <div className="home-download-card-info">
                <span className="home-download-card-title">Rasmiy mobil ilova</span>
              </div>
            </div>
            <button
              type="button"
              className="home-download-card-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenDownload) onOpenDownload();
              }}
            >
              <Download size={14} />
              <span>Yuklab olish</span>
            </button>
          </div>
        )}

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
            3-BO'LIM: PROFIL OCHIB, JOYLASHUV QO'SHISHNI FAOLLASHTIRISH (MAXSUS QO'LLANMA)
            ======================================================== */}
        <section
          className="guide-card-block"
          style={{ background: cardBg, borderColor }}
        >
          <div
            className="guide-card-header"
            onClick={() => toggleSection("activation")}
            role="button"
            tabIndex={0}
          >
            <div className="guide-card-title-group">
              <span className="guide-card-number" style={{ background: 'linear-gradient(135deg, #0284c7, #38bdf8)', color: '#ffffff' }}>3</span>
              <div>
                <h2 className="guide-card-title" style={{ color: textPrimary, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>Profil ochib, joylashuv qo'shishni qayerdan faollashtirish kerak?</span>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.18)', color: '#38bdf8', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    Muhim qo'llanma
                  </span>
                </h2>
                <span className="guide-card-meta" style={{ color: textMuted }}>
                  Ro'yxatdan o'tgan bo'lsangiz-u, joylashuv qo'shish tugmasi ko'rinmayotgan bo'lsa nima qilish kerak?
                </span>
              </div>
            </div>
            <div className="guide-accordion-arrow" style={{ color: textMuted }}>
              {openAccordion.activation ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>

          {openAccordion.activation && (
            <div className="guide-card-body">
              <div 
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                <Info size={20} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.86rem', lineHeight: 1.5, color: textPrimary }}>
                  <strong>Nima uchun darhol «Joylashuv qo'shish» chiqmaydi?</strong>
                  <p style={{ margin: '4px 0 0', color: textMuted }}>
                    AX-Map ilovasida oddiy haydovchilar ortiqcha murakkab boshqaruv tugmalaridan chalg'imasligi uchun dastlab oddiy shaxsiy profil beriladi. Yoqilg'i shahobchalari yoki avto-servis egalari esa o'z profilida 1 marta tasdiqlash orqali <strong>«Joylashuv qo'shish»</strong> huquqini juda oson faollashtirib oladilar.
                  </p>
                </div>
              </div>

              <h4 className="guide-subheading" style={{ color: textPrimary }}>
                Qanday holatda nima qilish kerak? (Bosqichma-bosqich):
              </h4>

              <div className="guide-ordered-steps">
                <div className="guide-step-row">
                  <div className="guide-step-index">1</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>«Profil» bo'limiga o'ting</strong>
                    <p style={{ color: textMuted }}>
                      Ilovaning pastki o'ng burchagidagi (yoki kompyuterda tepa o'ngdagi) <strong>«Profil»</strong> tugmasini bosing va o'z hisobingizga kiring.
                    </p>
                  </div>
                </div>

                <div className="guide-step-row">
                  <div className="guide-step-index">2</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>«Joylashuv qo'shishni faollashtirish» tugmasini toping</strong>
                    <p style={{ color: textMuted }}>
                      Profilingiz sahifasida shaxsiy ma'lumotlaringiz tagida joylashgan havorang-ko'k hoshiyali <strong>«Yoqilg'i shahobchangiz bormi? Joylashuv qo'shishni faollashtirish»</strong> tugmasini bosing. (Shuningdek, profilingiz tepasidagi qo'ng'iroqcha <Bell size={13} style={{ display: 'inline', verticalAlign: 'middle', color: '#38bdf8' }} /> bildirishnomalar oynasi orqali ham buni 1 bosishda ochishingiz mumkin).
                    </p>
                  </div>
                </div>

                <div className="guide-step-row">
                  <div className="guide-step-index">3</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>Shahobcha boshqaruv ma'lumotlarini kiriting</strong>
                    <p style={{ color: textMuted }}>
                      Ochilgan oynada shahobchangizning asosiy nomi, mas'ul inson ismi, boshqaruv paroli va telefon raqamingizni kiriting hamda «Saqlash» tugmasini bosing.
                    </p>
                  </div>
                </div>

                <div className="guide-step-row">
                  <div className="guide-step-index">4</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>Profilingizda «Joylashuv qo'shish» tugmasi ochiladi!</strong>
                    <p style={{ color: textMuted }}>
                      Tasdiqlashingiz bilan profilingizda darhol <strong>«Barcha joylashuvlar boshqarmasi»</strong> hamda yorqin ko'k rangdagi <strong>«Joylashuv qo'shish»</strong> tugmasi doimiy ravishda ko'rinib turadi. Endi siz istalgancha o'z shahobchalaringizni qo'shishingiz mumkin!
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
                  <Sparkles size={16} />
                  <span>Profilingizga o'tib faollashtirish</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================
            4-BO'LIM: JOYLASHUV QO'SHISH TARTIBI (7 TA QADAM)
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
              <span className="guide-card-number">4</span>
              <div>
                <h2 className="guide-card-title" style={{ color: textPrimary }}>
                  Shahobchani xaritaga joylashtirish tartibi (7 bosqich)
                </h2>
                <span className="guide-card-meta" style={{ color: textMuted }}>
                  «Joylashuv qo'shish» bosilgandan so'ng ma'lumotlarni to'ldirish bosqichlari
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
                Ko'k rangli <strong>«Joylashuv qo'shish»</strong> tugmasini bosganingizdan keyin 7 ta aniq bosqich orqali manzilingiz shakllanadi:
              </p>

              <div className="guide-ordered-steps">
                <div className="guide-step-row">
                  <div className="guide-step-index">1</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>1-bosqich: Xaritadan nuqtani aniq belgilang</strong>
                    <p style={{ color: textMuted }}>
                      Xaritadagi qizil belgi (pin)ni surib, shahobchangizning kirish yo'li yoki binosi ustiga to'g'rilang va «Joylashuvni tasdiqlash» tugmasini bosing.
                    </p>
                  </div>
                </div>

                <div className="guide-step-row">
                  <div className="guide-step-index">2</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>2-bosqich: Manzil turi va nomi</strong>
                    <p style={{ color: textMuted }}>
                      Shahobcha turini (Yoqilg'i shahobchasi) va uning rasmiy nomini kiriting (Masalan: «Mustang Gaz», «Real Metan», «UzGazOil»).
                    </p>
                  </div>
                </div>

                <div className="guide-step-row">
                  <div className="guide-step-index">3</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>3-bosqich: Yoqilg'i turlari va narxlar</strong>
                    <p style={{ color: textMuted }}>
                      Shahobchangizda mavjud yoqilg'i turlarini tanlang: Metan, Propan, Benzin (Ai-80, 92, 95), Dizel yoki Elektr zaryadka. Har birining amaldagi so'mdagi narxini va metan uchun amaldagi gaz bosimini kiriting.
                    </p>
                  </div>
                </div>

                <div className="guide-step-row">
                  <div className="guide-step-index">4</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>4-bosqich: Menejer telefoni</strong>
                    <p style={{ color: textMuted }}>
                      Mijozlar qo'ng'iroq qilishi va ma'lumot olishi uchun shahobcha operatori yoki menejerining amaldagi telefon raqamini ko'rsating.
                    </p>
                  </div>
                </div>

                <div className="guide-step-row">
                  <div className="guide-step-index">5</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>5-bosqich: Tavsif, umumiy rasmlar va Super Admin uchun 3 ta rasm</strong>
                    <p style={{ color: textMuted }}>
                      Foydalanuvchilar ko'rishi uchun qisqacha tavsif yozing. So'ngra shahobchaning haqiqiyligini tekshirish uchun Dastur Administratsiyasi talab qiladigan <strong>3 ta rasm</strong>ni yuklang: 1) Tashqi tomondan, 2) Ichki tomondan, 3) Yo'l yuzi tomonidan olingan rasmlar.
                    </p>
                  </div>
                </div>

                <div className="guide-step-row">
                  <div className="guide-step-index">6</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>6-bosqich: Qulayliklar va to'lov turlari</strong>
                    <p style={{ color: textMuted }}>
                      Shahobchangizda Qahva, Hojatxona, Do'kon bormi («Bor» yoki «Yo'q» ni belgilang). Shuningdek qabul qilinadigan to'lov usullarini (Naqd, Uzcard, HUMO, Visa) tasdiqlang.
                    </p>
                  </div>
                </div>

                <div className="guide-step-row">
                  <div className="guide-step-index">7</div>
                  <div className="guide-step-detail">
                    <strong style={{ color: textPrimary }}>7-bosqich: So'nggi savollar va tasdiqlash</strong>
                    <p style={{ color: textMuted }}>
                      Har kuni narxlarni yangilab turish bo'yicha qisqa savollarga javob bering va <strong>«Tasdiqlash va saqlash»</strong> tugmasini bosing.
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
            5-BO'LIM: ADMINISTRATORGA YUBORILISHI VA TASDIQLANISHI
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
              <span className="guide-card-number">5</span>
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
