import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Fuel,
  Navigation,
  User,
  UserPlus,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  ChevronRight,
  Info,
  ShieldCheck,
  Layers,
  Settings,
  Coffee,
  HelpCircle,
  Check,
  MapPin,
  ExternalLink,
} from "lucide-react";

/**
 * SmartOnboardingModal - Dasturga interaktiv aqlli yo'riqnoma tizimi
 * 
 * Rejimlar (mode):
 * - 'welcome_tour': Yangi kirganda ketma-ket tanishtiruv slaydlari
 * - 'register_prompt': Profil yaratish va ro'yxatdan o'tish afzalliklari
 * - 'add_location_guide': Joylashuv qo'shishni 5 bosqichda o'rgatuvchi qo'llanma
 * - 'station_submitted': Joylashuv administratorga yuborilganda "Tekshiruvda" modal oynasi
 * - 'approved_info': Administrator tasdiqlaganidan keyingi xushxabar
 * - 'sections_guide': Dastur bo'limlarining vazifalarini tushuntiruvchi oyna
 * - 'menu': Barcha qo'llanmalar markazi (istalgan vaqtda yo'riqnomalarni tanlash)
 */
export default function SmartOnboardingModal({
  isOpen,
  mode = "welcome_tour",
  onClose,
  onNavigate,
  onStartAddLocation,
  user = null,
  submittedStation = null,
  isThemeLight = false,
  appTheme = null,
  onChangeMode = null,
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeMode, setActiveMode] = useState(mode);

  useEffect(() => {
    setActiveMode(mode);
    setCurrentSlide(0);
  }, [mode, isOpen]);

  if (!isOpen) return null;

  const handleModeSwitch = (newMode) => {
    setActiveMode(newMode);
    setCurrentSlide(0);
    if (typeof onChangeMode === "function") {
      onChangeMode(newMode);
    }
  };

  const handleFinishTour = (markDone = true) => {
    if (markDone) {
      try {
        localStorage.setItem("myup_onboarding_completed", "true");
      } catch (e) {}
    }
    onClose();
  };

  // Welcome tour slaydlari (5 ta interaktiv slayd)
  const tourSlides = [
    {
      id: "welcome",
      badge: "Xush kelibsiz",
      badgeColor: "#38bdf8",
      title: "AX-Map ilovasiga xush kelibsiz!",
      subtitle: "O'zbekistondagi eng qulay avto-xarita",
      desc: "Metan, Propan, Benzin va Elektr quvvatlash stansiyalarining real vaqtdagi gaz bosimi, narxlari va qulayliklarini bir joydan toping.",
      highlights: [
        { icon: <Sparkles size={15} color="#38bdf8" />, text: "Real vaqtda gaz bosimi (bar)" },
        { icon: <Fuel size={15} color="#10b981" />, text: "Barcha yoqilg'i turlari va narxlar" },
        { icon: <Navigation size={15} color="#f59e0b" />, text: "Eng yaqin shoxobchaga navigatsiya" },
      ],
      icon: <Sparkles size={36} color="#38bdf8" />,
      actionText: null,
    },
    {
      id: "home",
      badge: "Asosiy sahifa",
      badgeColor: "#10b981",
      title: "Asosiy sahifa va narxlar",
      subtitle: "Tezkor filtrlar va qulay qidiruv",
      desc: "Shahobchalarni masofasi, ochiq/yopiq holati, gaz bosimi va narxlari bo'yicha bir zumda saralang. Jonli qidiruv orqali kerakli manzilni oson toping.",
      highlights: [
        { icon: <Fuel size={15} color="#38bdf8" />, text: "Metan (CNG) va Propan (LPG)" },
        { icon: <Fuel size={15} color="#f59e0b" />, text: "Ai-80 / 92 / 95 / 98 Benzin" },
        { icon: <Fuel size={15} color="#10b981" />, text: "Elektr quvvatlash (EV)" },
      ],
      icon: <Fuel size={36} color="#10b981" />,
      actionText: "Asosiy bo'limga o'tish",
      actionTab: "home",
    },
    {
      id: "map",
      badge: "Interaktiv Xarita",
      badgeColor: "#38bdf8",
      title: "Xarita va Jonli Navigatsiya",
      subtitle: "To'g'ridan-to'g'ri marshrut chizing",
      desc: "Xaritadagi belgilar orqali barcha shahobchalar joylashuvini ko'ring, tirbandliklar va masofani hisoblang hamda Yandex Navigator orqali yo'lga chiqing.",
      highlights: [
        { icon: <Navigation size={15} color="#38bdf8" />, text: "GPS orqali eng yaqin shoxobcha" },
        { icon: <MapPin size={15} color="#10b981" />, text: "Real vaqtdagi radius va masofa" },
        { icon: <Clock size={15} color="#f59e0b" />, text: "Ish vaqti va holat indikatori" },
      ],
      icon: <Navigation size={36} color="#38bdf8" />,
      actionText: "Xaritani ochish",
      actionTab: "map",
    },
    {
      id: "services",
      badge: "Xizmatlar",
      badgeColor: "#f59e0b",
      title: "Qo'shimcha Xizmatlar",
      subtitle: "Avtoyuvish, Moy almashtirish, Do'kon",
      desc: "Yoqilg'i quyish bilan birga shoxobcha hududida mavjud barcha qulayliklar: avtomoyka, vulkanizatsiya, mini-market va boshqa xizmatlar bilan tanishing.",
      highlights: [
        { icon: <Coffee size={15} color="#f59e0b" />, text: "Kafe, do'kon va dam olish joylari" },
        { icon: <ShieldCheck size={15} color="#10b981" />, text: "Ishonchli sifat va tekshirilgan ma'lumot" },
      ],
      icon: <Coffee size={36} color="#f59e0b" />,
      actionText: "Xizmatlarni ko'rish",
      actionTab: "services",
    },
    {
      id: "profile",
      badge: "Profil va Boshqaruv",
      badgeColor: "#a855f7",
      title: "O'z shoxobchangizni qo'shing",
      subtitle: "Biznesingizni xaritada targ'ib qiling",
      desc: "Profilingizni yaratib, o'z yoqilg'i quyish yoki servis maskaningizni xaritaga joylashtiring. Narxlar va gaz bosimini real vaqtda yangilab turing!",
      highlights: [
        { icon: <UserPlus size={15} color="#a855f7" />, text: "Tezkor va oson ro'yxatdan o'tish" },
        { icon: <Building2 size={15} color="#38bdf8" />, text: "Joylashuv qo'shish va admin tasdig'i" },
        { icon: <CheckCircle2 size={15} color="#10b981" />, text: "Minglab haydovchilarga ko'rining" },
      ],
      icon: <Building2 size={36} color="#a855f7" />,
      actionText: user ? "Profilga o'tish" : "Profil yaratish",
      actionTab: "my",
      authMode: user ? undefined : "register",
    },
  ];

  // Joylashuv qo'shish qadamlari (5 bosqich)
  const addLocationSteps = [
    {
      step: 1,
      title: "Profil bo'limiga o'ting",
      desc: "Ilovaning pastki menyusidagi «Profil» bo'limini bosing va u yerdagi ko'k rangli «Joylashuv qo'shish» tugmasini tanlang.",
      badge: "1-qadam",
    },
    {
      step: 2,
      title: "Xaritadan aniq nuqtani belgilang",
      desc: "Interaktiv xarita orqali shahobchangiz yoki xizmat ko'rsatish markazingizning aniq koordinatasini bosing.",
      badge: "2-qadam",
    },
    {
      step: 3,
      title: "Asosiy ma'lumotlarni kiriting",
      desc: "Shoxobcha nomi, joylashgan manzili, shahar/viloyat va mijozlar bog'lanishi uchun aloqa telefon raqamingizni yozing.",
      badge: "3-qadam",
    },
    {
      step: 4,
      title: "Yoqilg'i turlari va narxlarni belgilang",
      desc: "Shahobchangizda sotiladigan yoqilg'i turlari (metan, propan, benzin, elektro), joriy narxlar va gaz bosimini ko'rsating.",
      badge: "4-qadam",
    },
    {
      step: 5,
      title: "Tasdiqlash rasmlarini yuklang va yuboring",
      desc: "Joylashuvingizning haqiqiyligini tasdiqlovchi shoxobcha fotosuratlarini yuklang va «Administratorga yuborish» tugmasini bosing.",
      badge: "5-qadam",
    },
  ];

  // Dastur bo'limlari haqida ma'lumotlar
  const sectionsList = [
    {
      tab: "home",
      icon: <Fuel size={22} color="#10b981" />,
      name: "Asosiy sahifa",
      badge: "Shahobchalar ro'yxati",
      desc: "Barcha yoqilg'i shoxobchalari ro'yxati, real vaqtdagi gaz bosimi (bar), narxlar, navbat holati va qulay filtrlar.",
    },
    {
      tab: "map",
      icon: <Navigation size={22} color="#38bdf8" />,
      name: "Xarita",
      badge: "Interaktiv xarita",
      desc: "Shahobchalarning xaritadagi aniq o'rni, atrofingizdagi eng yaqin joylar va Yandex Navigator orqali marshrut chizish.",
    },
    {
      tab: "services",
      icon: <Coffee size={22} color="#f59e0b" />,
      name: "Xizmatlar",
      badge: "Qulayliklar",
      desc: "Avtomoyka, moy almashtirish, vulkanizatsiya, kafe, mini-market va namozxona xizmatlari haqida batafsil ma'lumot.",
    },
    {
      tab: "my",
      icon: <User size={22} color="#a855f7" />,
      name: "Profil",
      badge: "Boshqaruv markazi",
      desc: "Shaxsiy profilingiz, joylashuv qo'shish, o'z shoxobchalaringizni boshqarish, narxlarni yangilash va bildirishnomalar.",
    },
    {
      tab: "settings",
      icon: <Settings size={22} color="#94a3b8" />,
      name: "Sozlamalar",
      badge: "Moslashtirish",
      desc: "Ilova rang mavzusi (12 ta dizayn), tungi/kunduzgi rejim, bildirishnoma sozlamalari va qo'llanma bo'limi.",
    },
  ];

  return (
    <div
      className="profile-overlay smart-onboarding-overlay"
      onClick={() => handleFinishTour(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`smart-onboarding-card ${isThemeLight ? "is-light" : ""}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: appTheme?.panel || (isThemeLight ? "#ffffff" : "#13151b"),
          borderColor: appTheme?.border || (isThemeLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.1)"),
          color: appTheme?.text || (isThemeLight ? "#0f172a" : "#ffffff"),
        }}
      >
        {/* Yuqori yopish tugmasi */}
        <button
          type="button"
          className="smart-onboarding-close-btn"
          onClick={() => handleFinishTour(false)}
          title="Yopish"
        >
          <X size={18} />
        </button>

        {/* ========================================================
            REJIM 1: WELCOME TOUR (Ketma-ket tanishtiruv slaydlari)
            ======================================================== */}
        {activeMode === "welcome_tour" && (
          <div className="smart-tour-container">
            {/* Slayd indikatori va status */}
            <div className="smart-tour-top-bar">
              <div
                className="smart-tour-badge"
                style={{
                  background: `${tourSlides[currentSlide].badgeColor}22`,
                  color: tourSlides[currentSlide].badgeColor,
                  borderColor: `${tourSlides[currentSlide].badgeColor}44`,
                }}
              >
                {tourSlides[currentSlide].badge}
              </div>
              <div className="smart-tour-steps-text">
                {currentSlide + 1} / {tourSlides.length}
              </div>
            </div>

            {/* Slayd markaziy qismi */}
            <div className="smart-tour-body">
              <div className="smart-tour-icon-halo">
                {tourSlides[currentSlide].icon}
              </div>

              <h2 className="smart-tour-title">{tourSlides[currentSlide].title}</h2>
              <p className="smart-tour-subtitle">{tourSlides[currentSlide].subtitle}</p>
              <p className="smart-tour-desc">{tourSlides[currentSlide].desc}</p>

              {/* Afzalliklar / imkoniyatlar ro'yxati */}
              <div className="smart-tour-highlights">
                {tourSlides[currentSlide].highlights.map((item, idx) => (
                  <div key={idx} className="smart-tour-highlight-item">
                    <span className="smart-highlight-icon">{item.icon}</span>
                    <span className="smart-highlight-text">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Shu bo'limga to'g'ridan-to'g'ri o'tish tugmasi (agar mavjud bo'lsa) */}
              {tourSlides[currentSlide].actionText && (
                <button
                  type="button"
                  className="smart-tour-action-shortcut"
                  onClick={() => {
                    handleFinishTour(true);
                    if (typeof onNavigate === "function") {
                      onNavigate(tourSlides[currentSlide].actionTab, tourSlides[currentSlide].authMode);
                    }
                  }}
                >
                  <span>{tourSlides[currentSlide].actionText}</span>
                  <ExternalLink size={14} />
                </button>
              )}
            </div>

            {/* Pastki navigatsiya va nuqtalar */}
            <div className="smart-tour-footer">
              {/* Nuqtalar */}
              <div className="smart-tour-dots">
                {tourSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`smart-tour-dot ${idx === currentSlide ? "active" : ""}`}
                    onClick={() => setCurrentSlide(idx)}
                    title={`${idx + 1}-slayd`}
                  />
                ))}
              </div>

              {/* Tugmalar */}
              <div className="smart-tour-nav-btns">
                {currentSlide > 0 ? (
                  <button
                    type="button"
                    className="smart-btn-secondary"
                    onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
                  >
                    <ArrowLeft size={16} />
                    <span>Orqaga</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="smart-btn-ghost"
                    onClick={() => handleFinishTour(true)}
                  >
                    <span>O'tkazib yuborish</span>
                  </button>
                )}

                {currentSlide < tourSlides.length - 1 ? (
                  <button
                    type="button"
                    className="smart-btn-primary"
                    onClick={() => setCurrentSlide((prev) => Math.min(tourSlides.length - 1, prev + 1))}
                  >
                    <span>Keyingi</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="smart-btn-primary finish"
                    onClick={() => handleFinishTour(true)}
                  >
                    <Check size={16} />
                    <span>Tushunarli, boshlash!</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            REJIM 2: REGISTER PROMPT (Profil yaratish va ro'yxatdan o'tish)
            ======================================================== */}
        {activeMode === "register_prompt" && (
          <div className="smart-prompt-container">
            <div className="smart-prompt-icon-wrap cyan">
              <UserPlus size={36} color="#38bdf8" />
            </div>

            <h2 className="smart-prompt-title">Profilingizni yarating</h2>
            <p className="smart-prompt-lead">
              Dastur imkoniyatlaridan to‘liq foydalanish, o‘z joylashuvingizni qo‘shish va xizmatlaringizni boshqarish uchun profilingizni yarating.
            </p>

            <div className="smart-prompt-benefits">
              <div className="smart-benefit-row">
                <div className="smart-benefit-check">
                  <Check size={14} />
                </div>
                <div>
                  <strong>O'z joylashuvingizni xaritaga joylashtiring</strong>
                  <p>Mijozlar shoxobchangizni bir zumda topishadi va yo'l chizishadi.</p>
                </div>
              </div>

              <div className="smart-benefit-row">
                <div className="smart-benefit-check">
                  <Check size={14} />
                </div>
                <div>
                  <strong>Gaz bosimi va narxlarni boshqaring</strong>
                  <p>Narxlar o'zgarganda darhol o'zingiz yangilashingiz mumkin.</p>
                </div>
              </div>

              <div className="smart-benefit-row">
                <div className="smart-benefit-check">
                  <Check size={14} />
                </div>
                <div>
                  <strong>Barcha qurilmalarda avtomatik saqlanadi</strong>
                  <p>Boshqa telefondan kirganingizda ham joylashuvlaringiz chiqadi.</p>
                </div>
              </div>
            </div>

            <div className="smart-prompt-actions">
              <button
                type="button"
                className="smart-btn-primary full-width"
                onClick={() => {
                  onClose();
                  if (typeof onNavigate === "function") {
                    onNavigate("my", "register");
                  }
                }}
              >
                <UserPlus size={18} />
                <span>Profil yaratish</span>
              </button>

              <button
                type="button"
                className="smart-btn-ghost full-width"
                onClick={onClose}
              >
                <span>Keyinroq</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            REJIM 3: ADD LOCATION GUIDE (Joylashuv qo'shishni o'rgatish)
            ======================================================== */}
        {activeMode === "add_location_guide" && (
          <div className="smart-guide-container">
            <div className="smart-prompt-icon-wrap amber">
              <MapPin size={34} color="#f59e0b" />
            </div>

            <h2 className="smart-prompt-title">Endi joylashuvingizni qo‘shing</h2>
            <p className="smart-prompt-lead">
              Dasturda o‘z faoliyatingizni boshlash uchun joylashuvingizni qo‘shishingiz kerak. Joylashuv qo‘shish juda oson. Sizga bosqichma-bosqich ko‘rsatamiz.
            </p>

            <div className="smart-steps-list">
              {addLocationSteps.map((st) => (
                <div key={st.step} className="smart-step-card">
                  <div className="smart-step-num-badge">{st.step}</div>
                  <div className="smart-step-content">
                    <h4 className="smart-step-heading">{st.title}</h4>
                    <p className="smart-step-desc">{st.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="smart-prompt-actions">
              <button
                type="button"
                className="smart-btn-primary amber-gradient full-width"
                onClick={() => {
                  onClose();
                  if (typeof onStartAddLocation === "function") {
                    onStartAddLocation();
                  } else if (typeof onNavigate === "function") {
                    onNavigate("my");
                  }
                }}
              >
                <Building2 size={18} />
                <span>Joylashuv qo‘shishni boshlash</span>
              </button>

              <button
                type="button"
                className="smart-btn-ghost full-width"
                onClick={onClose}
              >
                <span>Tushunarli</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            REJIM 4: STATION SUBMITTED (Administratorga yuborildi)
            ======================================================== */}
        {activeMode === "station_submitted" && (
          <div className="smart-submitted-container">
            <div className="smart-submitted-icon-halo">
              <Clock size={40} color="#f59e0b" />
            </div>

            <div className="smart-status-pill amber-pill">
              <span className="status-dot-pulse" />
              <span>Tekshiruvda</span>
            </div>

            <h2 className="smart-prompt-title">Joylashuvingiz administratorga yuborildi!</h2>
            <p className="smart-prompt-lead">
              Tabriklaymiz! Siz {submittedStation?.name ? `"${submittedStation.name}"` : "joylashuvingizni"} muvaffaqiyatli yubordingiz. Endi administrator ushbu ma’lumotlarni tekshiradi va tasdiqlaydi. Tasdiqlash jarayoni yakunlangach, sizga avtomatik ravishda xabar yuboramiz.
            </p>

            <div className="smart-info-box">
              <div className="smart-info-row">
                <Info size={16} color="#38bdf8" />
                <span>Joylashuv hozirda Dastur Administratsiyasi tekshiruvida.</span>
              </div>
              <div className="smart-info-row">
                <ShieldCheck size={16} color="#f59e0b" />
                <span>Administrator tasdiqlamaguncha ommaviy xaritada ko'rinmaydi.</span>
              </div>
              <div className="smart-info-row">
                <Building2 size={16} color="#10b981" />
                <span>Yuborgan joylashuvingiz holatini «Profil»dagi «Mening joylashuvlarim»dan kuzatishingiz mumkin.</span>
              </div>
            </div>

            <div className="smart-prompt-actions">
              <button
                type="button"
                className="smart-btn-primary full-width"
                onClick={() => {
                  onClose();
                  if (typeof onNavigate === "function") {
                    onNavigate("my");
                  }
                }}
              >
                <User size={18} />
                <span>Mening joylashuvlarimni ko'rish</span>
              </button>

              <button
                type="button"
                className="smart-btn-ghost full-width"
                onClick={onClose}
              >
                <span>Yopish</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            REJIM 5: APPROVED INFO (Administrator tasdiqlaganidan keyin)
            ======================================================== */}
        {activeMode === "approved_info" && (
          <div className="smart-submitted-container">
            <div className="smart-submitted-icon-halo emerald">
              <CheckCircle2 size={42} color="#10b981" />
            </div>

            <div className="smart-status-pill emerald-pill">
              <Check size={14} />
              <span>Tasdiqlandi</span>
            </div>

            <h2 className="smart-prompt-title">Joylashuvingiz tasdiqlandi!</h2>
            <p className="smart-prompt-lead">
              Tabriklaymiz! Joylashuvingiz administrator tomonidan tasdiqlandi. Endi dasturdagi barcha tegishli imkoniyatlardan to'liq foydalanishingiz mumkin!
            </p>

            <div className="smart-info-box">
              <div className="smart-info-row">
                <CheckCircle2 size={16} color="#10b981" />
                <span>Joylashuv barcha haydovchilar xaritasida ko'rinadi.</span>
              </div>
              <div className="smart-info-row">
                <Fuel size={16} color="#38bdf8" />
                <span>Narxlar va gaz bosimini real vaqtda yangilab borishingiz mumkin.</span>
              </div>
            </div>

            <div className="smart-prompt-actions">
              <button
                type="button"
                className="smart-btn-primary full-width"
                onClick={() => {
                  onClose();
                  if (typeof onNavigate === "function") {
                    onNavigate("my");
                  }
                }}
              >
                <span>Boshqaruvga o'tish</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            REJIM 6: SECTIONS GUIDE (Dastur bo'limlari vazifalari)
            ======================================================== */}
        {activeMode === "sections_guide" && (
          <div className="smart-sections-container">
            <div className="smart-tour-top-bar">
              <button
                type="button"
                className="smart-btn-ghost small"
                onClick={() => handleModeSwitch("menu")}
              >
                <ArrowLeft size={15} />
                <span>Menyuga qaytish</span>
              </button>
              <div className="smart-tour-badge" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>
                Bo'limlar
              </div>
            </div>

            <h2 className="smart-prompt-title" style={{ marginTop: "0.5rem" }}>
              Dastur bo'limlari va vazifalari
            </h2>
            <p className="smart-prompt-lead">
              AX-Map ilovasi 5 ta asosiy bo'limdan iborat. Har bir bo'limning o'ziga xos imkoniyatlari mavjud:
            </p>

            <div className="smart-sections-list">
              {sectionsList.map((sec) => (
                <div
                  key={sec.tab}
                  className="smart-section-card"
                  onClick={() => {
                    handleFinishTour(true);
                    if (typeof onNavigate === "function") {
                      onNavigate(sec.tab);
                    }
                  }}
                  title="Ushbu bo'limga o'tish"
                >
                  <div className="smart-section-icon">{sec.icon}</div>
                  <div className="smart-section-info">
                    <div className="smart-section-header">
                      <span className="smart-section-name">{sec.name}</span>
                      <span className="smart-section-badge">{sec.badge}</span>
                    </div>
                    <p className="smart-section-desc">{sec.desc}</p>
                  </div>
                  <ChevronRight size={18} className="smart-section-arrow" />
                </div>
              ))}
            </div>

            <div className="smart-prompt-actions" style={{ marginTop: "1rem" }}>
              <button type="button" className="smart-btn-ghost full-width" onClick={onClose}>
                <span>Yopish</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            REJIM 7: MENU (Qo'llanma va Yo'riqnomalar markazi)
            ======================================================== */}
        {activeMode === "menu" && (
          <div className="smart-menu-container">
            <div className="smart-prompt-icon-wrap cyan">
              <HelpCircle size={36} color="#38bdf8" />
            </div>

            <h2 className="smart-prompt-title">Yo'riqnoma va Qo'llanma</h2>
            <p className="smart-prompt-lead">
              Dasturdan foydalanish, profil ochish yoki o'z joylashuvingizni xaritaga qo'shish bo'yicha kerakli mavzuni tanlang:
            </p>

            {/* Foydalanuvchi joriy holati nishoni */}
            <div className="smart-user-status-card">
              <div className="smart-status-header">
                <span className="smart-status-label">Sizning holatingiz:</span>
                <span className="smart-status-val">
                  {user ? (user.hasLocation || user.has_location ? "Shoxobcha egasi" : "Ro'yxatdan o'tgan foydalanuvchi") : "Mehmon (Ro'yxatdan o'tmagan)"}
                </span>
              </div>
            </div>

            <div className="smart-menu-list">
              <button
                type="button"
                className="smart-menu-item"
                onClick={() => handleModeSwitch("welcome_tour")}
              >
                <div className="smart-menu-item-icon blue">
                  <Sparkles size={20} />
                </div>
                <div className="smart-menu-item-text">
                  <strong>Dastur bilan tanishuv</strong>
                  <span>Ilova haqida to'liq umumiy ko'rsatkich va imkoniyatlar</span>
                </div>
                <ChevronRight size={18} />
              </button>

              <button
                type="button"
                className="smart-menu-item"
                onClick={() => handleModeSwitch("register_prompt")}
              >
                <div className="smart-menu-item-icon purple">
                  <UserPlus size={20} />
                </div>
                <div className="smart-menu-item-text">
                  <strong>Profil va Ro'yxatdan o'tish</strong>
                  <span>Profil ochish afzalliklari va qulayliklari</span>
                </div>
                <ChevronRight size={18} />
              </button>

              <button
                type="button"
                className="smart-menu-item"
                onClick={() => handleModeSwitch("add_location_guide")}
              >
                <div className="smart-menu-item-icon amber">
                  <MapPin size={20} />
                </div>
                <div className="smart-menu-item-text">
                  <strong>Joylashuv qo'shish bo'yicha qo'llanma</strong>
                  <span>O'z shoxobchangizni 5 qadamda xaritaga kiritish</span>
                </div>
                <ChevronRight size={18} />
              </button>

              <button
                type="button"
                className="smart-menu-item"
                onClick={() => handleModeSwitch("sections_guide")}
              >
                <div className="smart-menu-item-icon emerald">
                  <Layers size={20} />
                </div>
                <div className="smart-menu-item-text">
                  <strong>Bo'limlar va ularning vazifalari</strong>
                  <span>Asosiy, Xarita, Xizmatlar, Profil va Sozlamalar</span>
                </div>
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="smart-prompt-actions" style={{ marginTop: "1.25rem" }}>
              <button type="button" className="smart-btn-ghost full-width" onClick={onClose}>
                <span>Yopish</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
