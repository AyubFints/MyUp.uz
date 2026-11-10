import React from "react";
import { LocateFixed, MapPinOff, AlertTriangle, Compass, X } from "lucide-react";

/**
 * GpsPromptModal - Foydalanuvchidan geolokatsiyani yoqishni so'rovchi
 * zamonaviy, diqqatni tortuvchi va qat'iy modal muloqot oynasi.
 */
export default function GpsPromptModal({
  isOpen,
  onClose,
  onRequestGps,
  isLocating = false,
  locationStatus = "disabled",
  isThemeLight = false,
}) {
  if (!isOpen) return null;

  const isDenied = locationStatus === "denied";
  const isDisabled = locationStatus === "disabled";

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
          padding: "28px 22px",
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

        {/* Pulsatsiyali Radar / Joylashuv Ikonkasi */}
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: isDisabled
              ? "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.3))"
              : "linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(2, 132, 199, 0.3))",
            color: isDisabled ? "#f59e0b" : "#38bdf8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
            animation: "gpsRadarPulse 2s infinite",
            border: isDisabled ? "2px solid rgba(245, 158, 11, 0.4)" : "2px solid rgba(56, 189, 248, 0.4)",
          }}
        >
          {isDisabled ? <AlertTriangle size={36} /> : <LocateFixed size={36} />}
        </div>

        {/* Sarlavha */}
        <h3
          style={{
            fontSize: "1.3rem",
            fontWeight: "800",
            margin: "0 0 10px",
            color: isThemeLight ? "#0f172a" : "#ffffff",
            fontFamily: "Outfit, sans-serif",
          }}
        >
          {isDenied
            ? "Joylashuvga ruxsat bering"
            : isDisabled
            ? "Geolokatsiyani (GPS) yoqing"
            : "Geolokatsiyani belgilang"}
        </h3>

        {/* Tavsif matni */}
        <p
          style={{
            fontSize: "0.92rem",
            lineHeight: "1.5",
            color: isThemeLight ? "#475569" : "#cbd5e1",
            margin: "0 0 20px",
          }}
        >
          {isDisabled
            ? "Telefoningizning yuqori pardasini tushirib 'Joylashuv' (GPS) datchigini yoqing, shunda sizga eng yaqin zapravkalar aniq masofasi bilan ko'rsatiladi."
            : isDenied
            ? "Ilovaga joylashuvingizni aniqlashga ruxsat bering. Bu shahobchalargacha bo'lgan masofani aniq hisoblash uchun zarur."
            : "Sizga eng yaqin metan, propan, benzin zapravkalar va xizmatlarni topish uchun ilovaga joylashuvingizni aniqlashga ruxsat bering."}
        </p>

        {/* Amallar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
              transition: "transform 0.15s ease",
            }}
          >
            <Compass size={20} className={isLocating ? "animate-spin" : ""} />
            <span>{isLocating ? "Aniqlanmoqda..." : "Geolokatsiyani yoqish"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "transparent",
              color: isThemeLight ? "#64748b" : "#94a3b8",
              border: "none",
              fontSize: "0.88rem",
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
