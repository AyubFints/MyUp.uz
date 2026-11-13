import { useState, useEffect } from "react";

/**
 * Foydalanuvchi o'rnatilgan mobil ilova (TWA / PWA / Android app) ichida
 * ekanligini yoki brauzerda veb-sayt sifatida kirganini aniqlash.
 * 
 * Ilova ichida bo'lsa: true qaytaradi (yuklab olish tugmalari ko'rsatilmaydi).
 * Veb-saytda bo'lsa: false qaytaradi (yuklab olish tugmalari ko'rsatiladi).
 */
export const isInstalledApp = () => {
  if (typeof window === "undefined") return false;

  try {
    const urlParams = new URLSearchParams(window.location.search);

    // Agar atayin veb-sayt rejimini tekshirish so'ralsa (?web=1 yoki ?source=browser)
    if (urlParams.get("web") === "1" || urlParams.get("source") === "browser") {
      try {
        localStorage.removeItem("myup_is_installed_app");
      } catch (e) {}
      return false;
    }

    // 1. Agar avval o'rnatilgan ilova sifatida ochilgan bo'lsa (kesh)
    if (localStorage.getItem("myup_is_installed_app") === "true") {
      return true;
    }

    // 2. Android TWA / PWA startUrl parametri: /?source=pwa yoki ?source=twa
    const sourceParam = urlParams.get("source") || urlParams.get("utm_source");
    if (sourceParam === "pwa" || sourceParam === "twa" || sourceParam === "app") {
      try {
        localStorage.setItem("myup_is_installed_app", "true");
      } catch (e) {}
      return true;
    }

    // 3. Standalone displey rejimi (Android TWA, PWA, WebAPK)
    if (
      window.matchMedia &&
      (window.matchMedia("(display-mode: standalone)").matches ||
       window.matchMedia("(display-mode: fullscreen)").matches ||
       window.matchMedia("(display-mode: minimal-ui)").matches)
    ) {
      try {
        localStorage.setItem("myup_is_installed_app", "true");
      } catch (e) {}
      return true;
    }

    // 4. iOS Safari Standalone
    if (window.navigator && window.navigator.standalone === true) {
      try {
        localStorage.setItem("myup_is_installed_app", "true");
      } catch (e) {}
      return true;
    }

    // 5. Android package referrer (masalan: android-app://uz.axmap.app)
    if (document.referrer && document.referrer.startsWith("android-app://")) {
      try {
        localStorage.setItem("myup_is_installed_app", "true");
      } catch (e) {}
      return true;
    }

    // 6. Android WebView tekshiruvi (TWA / WebView fallback)
    const ua = navigator.userAgent || "";
    const isAndroid = /Android/i.test(ua);
    const isWebView = isAndroid && (/wv/i.test(ua) || /Version\/[\d.]+/i.test(ua));
    if (isWebView) {
      try {
        localStorage.setItem("myup_is_installed_app", "true");
      } catch (e) {}
      return true;
    }
  } catch (err) {
    // xatolik yuz bersa xavfsiz holda false
  }

  return false;
};

/**
 * React komponentlari uchun qulay hook
 */
export function useIsInstalledApp() {
  const [isApp, setIsApp] = useState(() => isInstalledApp());

  useEffect(() => {
    setIsApp(isInstalledApp());

    // Displey rejimi o'zgarganda (masalan, PWA o'rnatilganda)
    if (window.matchMedia) {
      const matcher = window.matchMedia("(display-mode: standalone)");
      const handler = (e) => {
        if (e.matches) {
          try {
            localStorage.setItem("myup_is_installed_app", "true");
          } catch (err) {}
          setIsApp(true);
        }
      };
      matcher.addEventListener?.("change", handler);
      return () => matcher.removeEventListener?.("change", handler);
    }
  }, []);

  return isApp;
}
