import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import { Home, Map, Menu, Settings, HelpCircle } from "lucide-react";

const renderBadge = (badge) => {
  if (!badge) return null;
  if (badge === true || badge === "dot") {
    return <span className="nav-badge-dot" aria-hidden="true" />;
  }
  const text = typeof badge === "number" ? (badge > 99 ? "99+" : String(badge)) : String(badge);
  if (!text || text === "0") return null;
  return <span className="nav-badge-count">{text}</span>;
};

const TAB_KEYS = ["home", "map", "services", "guide", "settings"];

export default function BottomNav({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenServices,
  isHiddenOnScroll = false,
  badges = {},
}) {
  const navRef = useRef(null);
  const itemsRef = useRef([]);

  // Active tab index (if 'my' or 'profile', map to settings index 4)
  const activeIndex = Math.max(
    0,
    TAB_KEYS.indexOf(activeTab === "my" ? "settings" : activeTab)
  );

  const [indicatorStyle, setIndicatorStyle] = useState(() => {
    const initialWidth = 36;
    const initialPercent = (activeIndex + 0.5) * 20;
    return {
      left: 0,
      width: `${initialWidth}px`,
      transform: `translate3d(calc(${initialPercent}% - ${initialWidth / 2}px), 0, 0)`,
      opacity: 1,
    };
  });

  const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    const updatePosition = () => {
      const navEl = navRef.current;
      const targetItem = itemsRef.current[activeIndex];
      if (!navEl || !targetItem) return;

      const navRect = navEl.getBoundingClientRect();
      const itemRect = targetItem.getBoundingClientRect();

      // 1-video 1-telefon ("1 Sliding bar"): silliq va mutanosib suriluvchi chiziq
      const barWidth = Math.min(42, Math.max(30, Math.round(itemRect.width * 0.48)));
      const barLeft = Math.round(itemRect.left - navRect.left + (itemRect.width - barWidth) / 2);

      setIndicatorStyle({
        left: 0,
        width: `${barWidth}px`,
        transform: `translate3d(${barLeft}px, 0, 0)`,
        opacity: 1,
      });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition, { passive: true });
    return () => {
      window.removeEventListener("resize", updatePosition);
    };
  }, [activeIndex]);

  return (
    <nav
      ref={navRef}
      className={`bottom-nav-bar modern-bottom-nav ${isHiddenOnScroll ? "is-scroll-hidden" : ""}`}
    >
      {/* 1-video 1-telefon: "1 Sliding bar" sekin suriluvchi chiziq indikatori */}
      <span className="nav-sliding-bar" style={indicatorStyle} aria-hidden="true" />

      <button
        ref={(el) => (itemsRef.current[0] = el)}
        type="button"
        className={`bottom-nav-item ${activeTab === "home" ? "active" : ""}`}
        onClick={() => setActiveTab("home")}
      >
        <span className="nav-icon-wrap">
          <Home size={20} className="nav-icon" />
          {renderBadge(badges?.home)}
        </span>
        <span className="nav-label">Asosiy</span>
      </button>

      <button
        ref={(el) => (itemsRef.current[1] = el)}
        type="button"
        className={`bottom-nav-item ${activeTab === "map" ? "active" : ""}`}
        onClick={() => setActiveTab("map")}
      >
        <span className="nav-icon-wrap">
          <Map size={20} className="nav-icon" />
          {renderBadge(badges?.map)}
        </span>
        <span className="nav-label">Xarita</span>
      </button>

      <button
        ref={(el) => (itemsRef.current[2] = el)}
        type="button"
        className={`bottom-nav-item ${activeTab === "services" ? "active" : ""}`}
        onClick={() => (setActiveTab ? setActiveTab("services") : onOpenServices?.())}
      >
        <span className="nav-icon-wrap">
          <Menu size={20} className="nav-icon" />
          {renderBadge(badges?.services)}
        </span>
        <span className="nav-label">Xizmatlar</span>
      </button>

      <button
        ref={(el) => (itemsRef.current[3] = el)}
        type="button"
        className={`bottom-nav-item ${activeTab === "guide" ? "active" : ""}`}
        onClick={() => setActiveTab("guide")}
      >
        <span className="nav-icon-wrap">
          <HelpCircle size={20} className="nav-icon" />
          {renderBadge(badges?.guide)}
        </span>
        <span className="nav-label">Qo'llanma</span>
      </button>

      <button
        ref={(el) => (itemsRef.current[4] = el)}
        type="button"
        className={`bottom-nav-item ${activeTab === "settings" || activeTab === "my" ? "active" : ""}`}
        onClick={() => (setActiveTab ? setActiveTab("settings") : onOpenSettings?.())}
      >
        <span className="nav-icon-wrap">
          <Settings size={20} className="nav-icon" />
          {renderBadge(badges?.settings)}
        </span>
        <span className="nav-label">Sozlamalar</span>
      </button>
    </nav>
  );
}
