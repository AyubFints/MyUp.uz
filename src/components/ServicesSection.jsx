import React from 'react';
import { 
  Car, 
  Wrench, 
  Disc, 
  Truck, 
  BatteryCharging, 
  Sparkles, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

const SERVICES_DATA = [
  {
    id: 'car-wash',
    title: 'Avtoyuvish (Avtomoyka)',
    desc: 'Sizga eng yaqin sifatli kontaktsiz, robot va qo\'l yuvish shahobchalari.',
    badge: 'Tez kunda',
    icon: Car,
    color: '#0ea5e9',
    bgColor: 'rgba(14, 165, 233, 0.12)'
  },
  {
    id: 'auto-repair',
    title: 'Avtoservis & Ustaxona',
    desc: 'Kompyuter diagnostikasi, motor, xodovoy va tezkor moy almashtirish servislari.',
    badge: 'Tez kunda',
    icon: Wrench,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.12)'
  },
  {
    id: 'tire-service',
    title: 'Vulkanizatsiya',
    desc: 'Balon ta\'mirlash, balansirovka, bosimni tekshirish va mavsumiy shina almashtirish.',
    badge: 'Tez kunda',
    icon: Disc,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.12)'
  },
  {
    id: 'evacuator',
    title: 'Evakuator 24/7',
    desc: 'Kutilmagan texnik nosozliklarda shahar va respublika bo\'ylab kechayu-kunduz tezkor chaqiruv.',
    badge: '24/7 Tez kunda',
    icon: Truck,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.12)'
  },
  {
    id: 'battery-service',
    title: 'Akkumulyator Xizmati',
    desc: 'Joyiga borib zaryadlash ("prikurka"), yangi akkumulyator yetkazish va diagnostika.',
    badge: 'Tez kunda',
    icon: BatteryCharging,
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.12)'
  },
  {
    id: 'detailing',
    title: 'Deteyling & Ximchistka',
    desc: 'Professional salon tozalash, polirovka, keramik himoya va hid yo\'qotish xizmatlari.',
    badge: 'Tez kunda',
    icon: Sparkles,
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.12)'
  }
];

export default function ServicesSection({ isThemeLight, appTheme, onGoToProfile }) {
  const isLight = Boolean(isThemeLight);

  return (
    <div className={`services-section-wrapper ${isLight ? 'is-light' : ''}`}>
      {/* HEADER CARD */}
      <div className="services-hero-banner">
        <div className="services-hero-badge">
          <Zap size={14} className="services-badge-icon" />
          <span>AX-Map Servislar Ekotizimi</span>
        </div>
        <h2 className="services-hero-title">
          Qo'shimcha Xizmatlar
        </h2>
        <p className="services-hero-desc">
          Avtomobilingiz uchun barcha muhim va tezkor servislar bir joyda. Tez orada har bir servis xaritada jonli narxlari, ish vaqti va mijozlar baholari bilan aks etadi!
        </p>

        <div className="services-features-row">
          <div className="services-feat-item">
            <CheckCircle2 size={16} color="#10b981" />
            <span>Xaritada aniq geolokatsiya</span>
          </div>
          <div className="services-feat-item">
            <CheckCircle2 size={16} color="#10b981" />
            <span>Haqiqiy mijozlar sharhlari</span>
          </div>
          <div className="services-feat-item">
            <CheckCircle2 size={16} color="#10b981" />
            <span>Tezkor marshrut & qo'ng'iroq</span>
          </div>
        </div>
      </div>

      {/* SERVICES GRID */}
      <div className="services-grid-list">
        {SERVICES_DATA.map((srv) => {
          const IconComponent = srv.icon;
          return (
            <div key={srv.id} className="service-card-item">
              <div className="service-card-header">
                <div 
                  className="service-icon-box"
                  style={{ backgroundColor: srv.bgColor, color: srv.color }}
                >
                  <IconComponent size={24} />
                </div>
                <span className="service-status-pill">{srv.badge}</span>
              </div>

              <h3 className="service-card-title">{srv.title}</h3>
              <p className="service-card-desc">{srv.desc}</p>

              <div className="service-card-footer">
                <span className="service-launch-note">
                  <Clock size={13} style={{ marginRight: '4px' }} />
                  Tayyorgarlik bosqichida
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* CALL TO ACTION FOR SERVICE OWNERS */}
      <div className="services-partner-card">
        <div className="partner-card-icon">
          <ShieldCheck size={32} color="#38bdf8" />
        </div>
        <div className="partner-card-info">
          <h4>Sizda ham avto-servis, moyka yoki ustaxona bormi?</h4>
          <p>O'z xizmatlaringizni AX-Map xaritasiga birinchilardan bo'lib qo'shing va minglab haydovchilarni jalb qiling!</p>
        </div>
        <button 
          type="button" 
          className="partner-card-btn"
          onClick={() => onGoToProfile && onGoToProfile()}
        >
          <span>Joylashuv qo'shish</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
