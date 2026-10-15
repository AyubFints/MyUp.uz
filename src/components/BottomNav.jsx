import React from "react";
import { Home, Map, Settings } from "lucide-react";

export default function BottomNav({ activeTab, setActiveTab, onOpenSettings }) {
  return (
    <nav className="bottom-nav-bar modern-bottom-nav">
      <button
        className={`bottom-nav-item ${activeTab === "home" ? "active" : ""}`}
        onClick={() => setActiveTab("home")}
      >
        <Home size={20} className="nav-icon" />
        <span>Asosiy</span>
      </button>
 
      <button
        className={`bottom-nav-item ${activeTab === "map" ? "active" : ""}`}
        onClick={() => setActiveTab("map")}
      >
        <Map size={20} className="nav-icon" />
        <span>Xarita</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === "settings" ? "active" : ""}`}
        onClick={() => setActiveTab("settings")}
      >
        <Settings size={20} className="nav-icon" />
        <span>Sozlamalar</span>
      </button>
    </nav>
  );
}