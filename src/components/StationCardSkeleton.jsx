import React from 'react';

export default function StationCardSkeleton() {
  return (
    <div className="custom-station-card station-card-skeleton" aria-hidden="true">
      {/* 1. Header (Title and Status / Distance) */}
      <div className="custom-sc-header">
        <div className="skeleton-line skeleton-title"></div>
        <div className="custom-sc-header-right">
          <div className="skeleton-line skeleton-status-badge"></div>
          <div className="skeleton-line skeleton-distance-val"></div>
        </div>
      </div>

      {/* 2. Fuel Types line */}
      <div className="skeleton-line skeleton-fuel-type"></div>

      {/* 3. Address line */}
      <div className="skeleton-line skeleton-address"></div>

      {/* 4. Details / Price / Pressure lines */}
      <div className="skeleton-details-box">
        <div className="skeleton-line skeleton-details-line1"></div>
        <div className="skeleton-line skeleton-details-line2"></div>
      </div>

      {/* 5. Action Buttons (Batafsil / Borish) */}
      <div className="custom-sc-actions">
        <div className="skeleton-line skeleton-action-btn"></div>
        <div className="skeleton-line skeleton-action-btn"></div>
      </div>
    </div>
  );
}
