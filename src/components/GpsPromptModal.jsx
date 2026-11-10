import React from "react";
import { LocateFixed, MapPinOff, AlertTriangle, Compass, X, Settings, ArrowRight } from "lucide-react";

/**
 * GpsPromptModal - Foydalanuvchidan telefonning o'z geolokatsiyasini (GPS) yoqishni
 * so'rovchi va to'g'ridan-to'g'ri telefon sozlamalariga yo'naltiruvchi zamonaviy modal.
 */
export default function GpsPromptModal({
  isOpen,
  onClose,
  onRequestGps,
  onOpenSettings,
  isLocating = false,
  locationStatus = "disabled",
  isThemeLight = false,
}) {
  if (!isOpen) return null;

  const isDenied = locationStatus === "denied";
  const isDisabled = locationStatus === "disabled";

  const handleSettingsClick = () => {
    if (typeof onOpenSettings === "function") {
      onOpenSettings();
    } else {
      // Fallback intent URL for Android
      try {
        if (/android/i.test(navigator.userAgent)) {
          window.location.href = "intent:#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end";
        }
      } catch (e) {
        console.warn("Intent xatoligi:", e);
      }
      if (typeof onRequestGps === "function") {
        onRequestGps();
      }
    }
  };

  return (
    <div className="add-station-overlay gps-prompt-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className={`reopen-modal-sheet gps-prompt-sheet ${isThemeLight ? "is-light" : ""}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "420px",
          width: "92%",
          margin: "auto",
          textAlign: "center",
          padding: "26px 20px",
          background: isThemeLight ? "#ffffff" : "linear-gradient(145deg, #0f172a 0%, #090d16 100%)",
          border: isThemeLight ? "1px solid #e2e8f0" : "1px solid rgba(56, 189, 248, 0.3)",
          borderRadius: "24px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(56, 189, 248, 0.2)",
          position: "relative",
          animation: "gpsModalPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <style>{`
          @keyframes gpsModalPopIn {
            0% { transform: scale(0.92); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes gpsRadarPulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.6); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 18px rgba(56, 189, 248, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
          }
          @keyframes gpsPulseWarning {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 18px rgba(245, 158, 11, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
          }
        `}</style>

        {/* Yopish tugmasi */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: "transparent",
            border: "none",
            color: isThemeLight ? "#64748b" : "#94a3b8",
            cursor: "pointer",
            padding: "6px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Yopish"
        >
          <X size={20} />
        </button>

        {/* Radar / GPS datchigi animatsiyasi */}
        <div
          style={{
            width: "68px",
            height: "68px",
            borderRadius: "50%",
            background: isDisabled
              ? "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.3))"
              : isDenied
              ? "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(185, 28, 28, 0.3))"
              : "linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(2, 132, 199, 0.3))",
            color: isDisabled ? "#f59e0b" : isDenied ? "#ef4444" : "#38bdf8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            animation: isDisabled ? "gpsPulseWarning 2s infinite" : "gpsRadarPulse 2s infinite",
            border: isDisabled
              ? "2px solid rgba(245, 158, 11, 0.4)"
              : isDenied
              ? "2px solid rgba(239, 68, 68, 0.4)"
              : "2px solid rgba(56, 189, 248, 0.4)",
          }}
        >
          {isDisabled ? <AlertTriangle size={34} /> : isDenied ? <MapPinOff size={34} /> : <LocateFixed size={34} />}
        </div>

        {/* Sarlavha */}
        <h3
          style={{
            fontSize: "1.25rem",
            fontWeight: "800",
            margin: "0 0 10px",
            color: isThemeLight ? "#0f172a" : "#ffffff",
            fontFamily: "Outfit, sans-serif",
          }}
        >
          {isDisabled
            ? "Telefoningizda GPS o'chiq"
            : isDenied
            ? "Joylashuvga ruxsat bering"
            : "Geolokatsiyani yoqing"}
        </h3>

        {/* Yo'riqnoma matni */}
        <p
          style={{
            fontSize: "0.9rem",
            lineHeight: "1.5",
            color: isThemeLight ? "#475569" : "#cbd5e1",
            margin: "0 0 18px",
          }}
        >
          {isDisabled
            ? "Eng yaqin metan, propan va zapravkalarni aniq masofasi bilan ko'rish uchun telefoningizning 'Joylashuv' (GPS) datchigini yoqing."
            : isDenied
            ? "Telefon yoki brauzer sozlamalarida AX-Map ilovasiga joylashuvni aniqlashga ruxsat berilmagan. Sozlamalardan ruxsat bering."
            : "Sizga eng yaqin metan, propan, benzin va elektr quvvatlagichlarni ko'rsatish uchun ilovaga geolokatsiyaga ruxsat bering."}
        </p>

        {/* Qulay yo'riqnoma qadami (agar datchik o'chiq bo'lsa) */}
        {isDisabled && (
          <div
            style={{
              background: isThemeLight ? "#f1f5f9" : "rgba(15, 23, 42, 0.6)",
              border: isThemeLight ? "1px solid #e2e8f0" : "1px solid rgba(148, 163, 184, 0.15)",
              borderRadius: "14px",
              padding: "10px 14px",
              marginBottom: "18px",
              textAlign: "left",
              fontSize: "0.82rem",
              lineHeight: "1.45",
              color: isThemeLight ? "#334155" : "#94a3b8",
            }}
          >
            <div style={{ fontWeight: "700", color: isThemeLight ? "#0f172a" : "#e2e8f0", marginBottom: "4px" }}>
              💡 Qanday yoqish mumkin:
            </div>
            <div>1. Quyidagi tugma orqali telefon Sozlamalarini oching va <b>"Joylashuv"</b>ni yoqing.</div>
            <div>2. Yoki telefoningizning yuqori pardasini tushirib <b>"Joylashuv"</b> (GPS) belgisini bosing.</div>
          </div>
        )}

        {/* Harakat tugmalari */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {isDisabled ? (
            <>
              <button
                type="button"
                onClick={handleSettingsClick}
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "14px",
                  fontSize: "0.98rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 8px 20px rgba(2, 132, 199, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Settings size={19} />
                <span>Telefon sozlamalarida GPS ni yoqish</span>
              </button>

              <button
                type="button"
                onClick={onRequestGps}
                disabled={isLocating}
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  background: isThemeLight ? "#f8fafc" : "rgba(30, 41, 59, 0.6)",
                  color: isThemeLight ? "#0284c7" : "#38bdf8",
                  border: isThemeLight ? "1px solid #cbd5e1" : "1px solid rgba(56, 189, 248, 0.3)",
                  borderRadius: "12px",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  cursor: isLocating ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Compass size={18} className={isLocating ? "animate-spin" : ""} />
                <span>{isLocating ? "Aniqlanmoqda..." : "Qayta tekshirish"}</span>
              </button>
            </>
          ) : isDenied ? (
            <>
              <button
                type="button"
                onClick={handleSettingsClick}
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "14px",
                  fontSize: "0.98rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 8px 20px rgba(220, 38, 38, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Settings size={19} />
                <span>Sozlamalarni ochish</span>
              </button>

              <button
                type="button"
                onClick={onRequestGps}
                disabled={isLocating}
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  background: isThemeLight ? "#f8fafc" : "rgba(30, 41, 59, 0.6)",
                  color: isThemeLight ? "#0284c7" : "#38bdf8",
                  border: isThemeLight ? "1px solid #cbd5e1" : "1px solid rgba(56, 189, 248, 0.3)",
                  borderRadius: "12px",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  cursor: isLocating ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Compass size={18} className={isLocating ? "animate-spin" : ""} />
                <span>{isLocating ? "Aniqlanmoqda..." : "Ruxsatni qayta so'rash"}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onRequestGps}
              disabled={isLocating}
              style={{
                width: "100%",
                padding: "14px 20px",
                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "14px",
                fontSize: "1rem",
                fontWeight: "700",
                cursor: isLocating ? "not-allowed" : "pointer",
                boxShadow: "0 8px 20px rgba(2, 132, 199, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Compass size={20} className={isLocating ? "animate-spin" : ""} />
              <span>{isLocating ? "Aniqlanmoqda..." : "Geolokatsiyani yoqish"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              padding: "9px 16px",
              background: "transparent",
              color: isThemeLight ? "#64748b" : "#94a3b8",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Keyinroq
          </button>
        </div>
      </div>
    </div>
  );
}
