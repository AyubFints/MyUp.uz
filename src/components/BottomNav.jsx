import React from "react";
import { Search, Map, User, Navigation } from "lucide-react";

export default function BottomNav({ activeTab, setActiveTab, onOpenSettings }) {
  return (
    <nav className="bottom-nav-bar modern-bottom-nav">
      <button
        className={`bottom-nav-item ${activeTab === "search" ? "active" : ""}`}
        onClick={() => setActiveTab("search")}
      >
        <Search size={22} className="nav-icon" />
        <span>Qidiruv</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === "map" ? "active" : ""}`}
        onClick={() => setActiveTab("map")}
      >
        <Map size={22} className="nav-icon" />
        <span>Xarita</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === "my" ? "active" : ""}`}
        onClick={() => setActiveTab("my")}
      >
        <User size={22} className="nav-icon" />
        <span>Profil</span>
      </button>

      <div className="bottom-nav-settings-wrapper">
        <button
          className="bottom-nav-settings-btn"
          onClick={() => onOpenSettings && onOpenSettings()}
        >
          <div className="floating-circle">
            <Navigation size={24} className="nav-icon floating-icon" />
          </div>
          <span>Sozlamalar</span>
        </button>
      </div>
    </nav>
  );
}
