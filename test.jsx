export default function App() {
  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="top-header">
        <div className="logo-text">myup.uz</div>

        {/* Desktop Nav */}
        <nav className="desktop-nav">
          <button
            className={`desktop-nav-item ${activeTab === "home" ? "active" : ""}`}
            onClick={() => handleTabChange("home")}
          >
            <Search size={18} /> <span>Qidiruv</span>
          </button>
          <button
            className={`desktop-nav-item ${activeTab === "map" ? "active" : ""}`}
            onClick={() => handleTabChange("map")}
          >
            <Map size={18} /> <span>Xarita</span>
          </button>
          <button
            className={`desktop-nav-item ${activeTab === "services" ? "active" : ""}`}
            onClick={() => handleTabChange("services")}
          >
            <Settings size={18} /> <span>Xizmatlar</span>
          </button>
          <button
            className={`desktop-nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => handleTabChange("profile")}
          >
            <User size={18} /> <span>Profil</span>
          </button>
          <button
            className="desktop-nav-item"
            onClick={() => setShowSettingsModal(true)}
          >
            <Settings size={18} /> <span>Sozlamalar</span>
          </button>
        </nav>

        {/* Mobile Profile Btn */}
        <button className="mobile-profile-btn">
          <User size={20} />
        </button>
      </header>

      <div className="app-content">
        {/* LEFT PANEL / MOBILE MAIN */}
        <div
          className="left-panel"
          style={{
            display:
              activeTab === "home" || activeTab === "search" ? "flex" : "none",
          }}
        >
          {/* FUEL TYPE GRID */}
          <div className="fuel-filters-grid">
            <button
              className={`fuel-btn ${fuelSubFilter === "metan" ? "active" : ""}`}
              onClick={() => {
                setActiveCategory("fuel");
                setFuelSubFilter("metan");
              }}
            >
              <Fuel className="fuel-icon" size={20} /> Metan Gaz
            </button>
            <button
              className={`fuel-btn ${fuelSubFilter === "benzin" ? "active" : ""}`}
              onClick={() => {
                setActiveCategory("fuel");
                setFuelSubFilter("benzin");
              }}
            >
              <Droplets className="fuel-icon" size={20} /> Benzin
            </button>
            <button
              className={`fuel-btn ${fuelSubFilter === "propan" ? "active" : ""}`}
              onClick={() => {
                setActiveCategory("fuel");
                setFuelSubFilter("propan");
              }}
            >
              <Flame className="fuel-icon" size={20} /> Propan
            </button>
            <button
              className={`fuel-btn ${fuelSubFilter === "elektr" ? "active" : ""}`}
              onClick={() => {
                setActiveCategory("fuel");
                setFuelSubFilter("elektr");
              }}
            >
              <Zap className="fuel-icon" size={20} /> Elektr Zaryadlash
            </button>
          </div>

          {/* SORT PILLS */}
          <div className="sort-pills-scroll">
            <button
              className={`sort-pill ${fuelSortBy === "nearest" ? "active" : ""}`}
              onClick={() => setFuelSortBy("nearest")}
            >
              Eng Yaqin
            </button>
            <button
              className={`sort-pill ${fuelSortBy === "nearest_best" ? "active" : ""}`}
              onClick={() => setFuelSortBy("nearest_best")}
            >
              Eng Sifatli
            </button>
            <button
              className={`sort-pill ${fuelSortBy === "cheapest" ? "active" : ""}`}
              onClick={() => setFuelSortBy("cheapest")}
            >
              Eng Arzon
            </button>
          </div>

          {/* LIST */}
          <div className="station-list">
            {filteredStations.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                userDistance={station.calculatedDistance}
                isFavorite={favorites.includes(station.id)}
                onToggleFavorite={null}
                onSelectStation={setDetailStation}
              />
            ))}

            {/* MOBILE MAP PREVIEW */}
            <div
              className="mobile-map-preview"
              onClick={() => handleTabChange("map")}
            >
              <div className="mmp-text">
                <h3>Xaritada ko'rish</h3>
                <p>Top un Karitadi korls.</p>
              </div>
              <div className="mmp-image">
                <img
                  src="/map-preview.jpg"
                  alt="Map"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL MAP (Desktop) */}
        <div
          className="right-panel-map"
          style={{ display: activeTab === "map" ? "block" : "" }}
        >
          <MapView />
        </div>
      </div>

      {/* Profile Detail Modal */}
      <ProfileDetailModal
        user={user}
        isOpen={showProfileDetail}
        onClose={() => setShowProfileDetail(false)}
        onUpdateUser={setUser}
        onLogout={handleLogout}
      />

      {/* Add / Edit Station Modal */}
      <AddStationModal
        isOpen={showAddStation}
        onClose={() => {
          setShowAddStation(false);
          setEditingStation(null);
        }}
        onSave={handleSaveStation}
        editStation={editingStation}
      />

      <StationDetailModal
        station={detailStation}
        userDistance={
          detailStation
            ? calculateDistance(
                userCoords.lat,
                userCoords.lng,
                detailStation.lat,
                detailStation.lng,
              )
            : 0
        }
        onClose={() => setDetailStation(null)}
        onStartNavigation={(target) => setNavigationTarget(target)}
        onRateStation={handleRateStation}
      />

      {/* Settings Modal */}
      {showSettingsModal && (
        <div
          className="add-station-overlay"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="reopen-modal-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              Sozlamalar
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <button
                className="add-st-submit-btn"
                style={{
                  background: "#fee2e2",
                  color: "#ef4444",
                  boxShadow: "none",
                }}
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowLogoutConfirm(true);
                }}
              >
                Dasturdan chiqish
              </button>
              <button
                className="add-st-submit-btn"
                style={{
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  boxShadow: "none",
                }}
                onClick={() => setShowSettingsModal(false)}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div
          className="add-station-overlay"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="reopen-modal-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--text-primary)",
                marginBottom: "10px",
              }}
            >
              Tizimdan chiqish
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                marginBottom: "20px",
              }}
            >
              Rostdan ham tizimdan (dasturdan) chiqmoqchimisiz?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="add-st-submit-btn"
                style={{
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  boxShadow: "none",
                }}
                onClick={() => setShowLogoutConfirm(false)}
              >
                Yo'q
              </button>
              <button
                className="add-st-submit-btn"
                style={{
                  background: "#ef4444",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(239,68,68,0.3)",
                }}
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
              >
                Ha, chiqish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yopish vaqti Modali */}
      {reopenModal.isOpen && (
        <div
          className="add-station-overlay"
          onClick={() => setReopenModal({ isOpen: false, stationId: null })}
        >
          <div
            className="reopen-modal-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--text-primary)",
                marginBottom: "10px",
              }}
            >
              Qachon ochiladi?
            </h3>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginBottom: "16px",
              }}
            >
              Foydalanuvchilarga ma'lumot berish uchun taxminiy vaqtni yozing.
            </p>
            <input
              type="text"
              placeholder="Masalan: 08:00, Ertaga ertalab"
              value={reopenTimeInput}
              onChange={(e) => setReopenTimeInput(e.target.value)}
              className="add-st-input"
              style={{ marginBottom: "16px" }}
              autoFocus
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="add-st-submit-btn"
                style={{
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  boxShadow: "none",
                }}
                onClick={() =>
                  setReopenModal({ isOpen: false, stationId: null })
                }
              >
                Bekor qilish
              </button>
              <button className="add-st-submit-btn" onClick={submitReopenTime}>
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
    </div>
  );
}
