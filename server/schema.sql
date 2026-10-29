-- ========================================================
-- A-MAPS (MYUP) POSTGRESQL DATABASE SCHEMA
-- Production-Ready for AWS RDS / Local PostgreSQL
-- ========================================================

-- UUID va PostGIS kengaytmalarini yoqish
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FOYDALANUVCHILAR JADVALI (Users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    password_hash VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'owner', 'super_admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. SHAHOBCHALAR JADVALI (Stations)
CREATE TABLE IF NOT EXISTS stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    address TEXT,
    city VARCHAR(100) DEFAULT 'Toshkent',
    phone VARCHAR(30),
    is_open BOOLEAN DEFAULT true,
    reopen_time VARCHAR(20),
    rating NUMERIC(3, 2) DEFAULT 5.0,
    rating_count INTEGER DEFAULT 1,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_approved BOOLEAN DEFAULT true,
    description TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    types JSONB DEFAULT '[]'::jsonb,
    gas_pressure INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tezkor masofa hisoblash va geolokatsiya indekslari
CREATE INDEX IF NOT EXISTS idx_stations_coords ON stations (lat, lng);
CREATE INDEX IF NOT EXISTS idx_stations_city ON stations (city);
CREATE INDEX IF NOT EXISTS idx_stations_approved ON stations (is_approved);

-- 3. YOQILG'I NARXLARI VA GAZ BOSIMI (Fuel Prices & Pressure)
CREATE TABLE IF NOT EXISTS fuel_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    fuel_type VARCHAR(20) NOT NULL CHECK (fuel_type IN ('metan', 'propan', 'benzin', 'ai92', 'ai95', 'dizel', 'elektr')),
    price NUMERIC(10, 2) DEFAULT 0,
    pressure_atm INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_station_fuel UNIQUE (station_id, fuel_type)
);

CREATE INDEX IF NOT EXISTS idx_fuel_station ON fuel_prices (station_id);
CREATE INDEX IF NOT EXISTS idx_fuel_type ON fuel_prices (fuel_type);

-- 4. QULAYLIKLAR (Station Amenities)
CREATE TABLE IF NOT EXISTS station_amenities (
    station_id UUID PRIMARY KEY REFERENCES stations(id) ON DELETE CASCADE,
    coffee BOOLEAN DEFAULT false,
    toilet BOOLEAN DEFAULT false,
    shop BOOLEAN DEFAULT false,
    car_wash BOOLEAN DEFAULT false,
    prayer_room BOOLEAN DEFAULT false,
    wifi BOOLEAN DEFAULT false,
    food BOOLEAN DEFAULT false,
    tires BOOLEAN DEFAULT false
);

-- 5. TO'LOV TURLARI (Station Payments)
CREATE TABLE IF NOT EXISTS station_payments (
    station_id UUID PRIMARY KEY REFERENCES stations(id) ON DELETE CASCADE,
    cash BOOLEAN DEFAULT true,
    uzcard BOOLEAN DEFAULT true,
    humo BOOLEAN DEFAULT true,
    visa BOOLEAN DEFAULT false,
    mastercard BOOLEAN DEFAULT false
);

-- 6. FIKR VA SHIKOYATLAR (Feedbacks & Reports)
CREATE TABLE IF NOT EXISTS feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(150),
    author_phone VARCHAR(30),
    type VARCHAR(50) DEFAULT 'fikr',
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'yangi' CHECK (status IN ('yangi', 'korildi', 'hal_etildi')),
    admin_reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks (status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created ON feedbacks (created_at DESC);

-- 7. REYTING VA SHARHLAR (Reviews)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_station ON reviews (station_id);

-- 8. SUPER ADMIN HARAKATLAR TARIXI (Super Admin Audit Logs)
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs (created_at DESC);

-- 9. REKLAMA VIDEOLARI VA BANNERLAR (Video Ads & Billing)
CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    target_link TEXT,
    side VARCHAR(20) DEFAULT 'both' CHECK (side IN ('left', 'right', 'both')),
    is_active BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    price_uzs NUMERIC(15, 2) DEFAULT 0,
    advertiser_name VARCHAR(150),
    advertiser_phone VARCHAR(30),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ads_active ON ads (is_active);

-- 10. FOYDALANUVCHI BILDIRISHNOMALARI (User Notifications - Kalakolchik)
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_phone VARCHAR(30),
    station_id UUID REFERENCES stations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    badge VARCHAR(50),
    type VARCHAR(50) DEFAULT 'general',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_notif_user ON user_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_user_notif_phone ON user_notifications (user_phone);
CREATE INDEX IF NOT EXISTS idx_user_notif_read ON user_notifications (is_read, read_at);
CREATE INDEX IF NOT EXISTS idx_user_notif_created ON user_notifications (created_at DESC);
