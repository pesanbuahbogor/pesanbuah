-- ==============================================================================
-- PESANBUAH.ID - MASTER DATABASE SCHEMA, RLS & REALTIME (1 SKRIP LENGKAP & TERBAIK)
-- Salin dan jalankan skrip ini langsung di Supabase SQL Editor (1x Klik Run).
-- Otomatis membuat/memperbarui seluruh tabel, kolom, izin akses (GRANT), dan data master.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM ROLE PENGGUNA (Jika sistem lama masih memakai ENUM)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('Owner', 'Manager', 'Sales', 'Kurir');
    ELSE
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Kurir';
        EXCEPTION WHEN duplicate_object THEN null;
        END;
    END IF;
END $$;

-- 3. TABEL PROFILES (Pengguna Sistem: Owner, Manager, Sales, Kurir)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Sales',
    is_courier BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    password TEXT DEFAULT 'password123',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'Sales';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_courier BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'password123';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 4. TABEL ZONES (Wilayah Operasional Distribusi)
CREATE TABLE IF NOT EXISTS public.zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABEL ZONE MEMBERS (Pemetaan Sales / Kurir ke Wilayah)
CREATE TABLE IF NOT EXISTS public.zone_members (
    id TEXT PRIMARY KEY,
    zone_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    CONSTRAINT unique_zone_user UNIQUE (zone_id, user_id)
);

-- 6. TABEL BUSINESS TYPES (Jenis Usaha Target Customer: Resto, Hotel, Kafe, dll)
CREATE TABLE IF NOT EXISTS public.business_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABEL PROSPECTS (Database Calon Customer & Pelanggan Buah)
CREATE TABLE IF NOT EXISTS public.prospects (
    id TEXT PRIMARY KEY,
    business_name TEXT NOT NULL,
    pic_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    business_type_id TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    gps_captured_at TIMESTAMPTZ,
    zone_id TEXT,
    sales_id TEXT,
    status TEXT NOT NULL DEFAULT 'Prospect',
    notes TEXT,
    potential_needs TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS potential_needs TEXT;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS gps_captured_at TIMESTAMPTZ;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS zone_id TEXT;
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS sales_id TEXT;

-- 8. TABEL PROSPECT PHOTOS (Dokumentasi Foto Kunjungan)
CREATE TABLE IF NOT EXISTS public.prospect_photos (
    id TEXT PRIMARY KEY,
    prospect_id TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABEL ORDERS (Transaksi Pesanan Buah, Jadwal Slot Antar & Remittance Kas)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    prospect_id TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    zone_id TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    order_items JSONB DEFAULT '[]'::jsonb,
    items_summary TEXT NOT NULL,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'Tunai',
    payment_status TEXT NOT NULL DEFAULT 'Belum Lunas',
    status TEXT NOT NULL DEFAULT 'Diterima',
    delivery_slot TEXT NOT NULL DEFAULT 'Pagi (08:00 - 11:00)',
    delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
    courier_id TEXT,
    courier_name TEXT,
    customer_notes TEXT,
    delivery_notes TEXT,
    delivered_at TIMESTAMPTZ,
    proof_photo_url TEXT,
    courier_remittance_status TEXT DEFAULT 'Belum Disetor (Ada di Kurir)',
    courier_remitted_at TIMESTAMPTZ,
    courier_remitted_by_name TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_remittance_status TEXT DEFAULT 'Belum Disetor (Ada di Kurir)';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_remitted_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_remitted_by_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_slot TEXT DEFAULT 'Pagi (08:00 - 11:00)';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS proof_photo_url TEXT;

-- 10. TABEL QUICK FRUITS (Katalog Buah Cepat & Referensi Harga Jual)
CREATE TABLE IF NOT EXISTS public.quick_fruits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    price NUMERIC NOT NULL DEFAULT 0,
    emoji TEXT DEFAULT '🍊',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TABEL STOCK ITEMS (Gudang Stok Buah & Monitor Minimum Stok)
CREATE TABLE IF NOT EXISTS public.stock_items (
    id TEXT PRIMARY KEY,
    fruit_name TEXT NOT NULL UNIQUE,
    unit TEXT NOT NULL DEFAULT 'kg',
    current_stock NUMERIC NOT NULL DEFAULT 0,
    canvas_allocated_stock NUMERIC NOT NULL DEFAULT 0,
    min_stock_alert NUMERIC NOT NULL DEFAULT 10,
    avg_cost_price NUMERIC NOT NULL DEFAULT 0,
    latest_selling_price NUMERIC NOT NULL DEFAULT 0,
    emoji TEXT DEFAULT '🍊',
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS latest_selling_price NUMERIC DEFAULT 0;
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '🍊';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN DEFAULT FALSE;

-- 12. TABEL STOCK INBOUNDS (Riwayat Kulakan / Belanja Supplier)
CREATE TABLE IF NOT EXISTS public.stock_inbounds (
    id TEXT PRIMARY KEY,
    fruit_name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    quantity NUMERIC NOT NULL DEFAULT 0,
    cost_price NUMERIC NOT NULL DEFAULT 0,
    total_cost NUMERIC NOT NULL DEFAULT 0,
    supplier_name TEXT,
    notes TEXT,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. TABEL CANVAS TRIPS (Penugasan Kurir Canvas Keliling & Setoran Kas)
CREATE TABLE IF NOT EXISTS public.canvas_trips (
    id TEXT PRIMARY KEY,
    courier_id TEXT NOT NULL,
    courier_name TEXT NOT NULL,
    vehicle_type TEXT DEFAULT 'Motor Roda Tiga',
    vehicle_plate TEXT,
    trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'Sedang Keliling',
    items JSONB DEFAULT '[]'::jsonb,
    total_expected_cash NUMERIC NOT NULL DEFAULT 0,
    actual_cash_submitted NUMERIC NOT NULL DEFAULT 0,
    cash_difference NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    settlement_notes TEXT,
    verified_by_name TEXT,
    remittance_status TEXT DEFAULT 'Belum Disetor (Ada di Kurir)',
    remitted_at TIMESTAMPTZ,
    remitted_by_name TEXT,
    departed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.canvas_trips ADD COLUMN IF NOT EXISTS remittance_status TEXT DEFAULT 'Belum Disetor (Ada di Kurir)';
ALTER TABLE public.canvas_trips ADD COLUMN IF NOT EXISTS remitted_at TIMESTAMPTZ;
ALTER TABLE public.canvas_trips ADD COLUMN IF NOT EXISTS remitted_by_name TEXT;

-- 14. TABEL STOCK MOVEMENT LOGS (Audit Trail Mutasi Stok)
CREATE TABLE IF NOT EXISTS public.stock_movement_logs (
    id TEXT PRIMARY KEY,
    fruit_name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    type TEXT NOT NULL,
    qty_change NUMERIC NOT NULL DEFAULT 0,
    stock_after NUMERIC NOT NULL DEFAULT 0,
    reference_id TEXT,
    reference_note TEXT,
    operator_name TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 15. HAK AKSES LENGKAP & MENGATASI ERROR "PERMISSION DENIED 42501"
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Nonaktifkan RLS agar akses query melalui Anon Key tidak diblokir izin kode 42501
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_fruits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_inbounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movement_logs DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 16. SINKRONISASI REALTIME KE SEMUA CLIENT / PERANGKAT
-- ==============================================================================
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
        public.profiles,
        public.zones,
        public.business_types,
        public.prospects,
        public.orders,
        public.quick_fruits,
        public.stock_items,
        public.canvas_trips;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;

ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.prospects REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.quick_fruits REPLICA IDENTITY FULL;
ALTER TABLE public.stock_items REPLICA IDENTITY FULL;
ALTER TABLE public.canvas_trips REPLICA IDENTITY FULL;

-- ==============================================================================
-- 17. DATA MASTER BAWAAN (SEEDED HANYA JIKA BELUM ADA DATA)
-- ==============================================================================
INSERT INTO public.profiles (id, name, email, phone, role, is_courier, active, password) VALUES
    ('usr-owner-000', 'Owner PesanBuah', 'pesanbuahbogor@gmail.com', '081234567890', 'Owner', true, true, 'password123'),
    ('usr-owner-001', 'Budi Santoso (Owner)', 'owner@pesanbuah.id', '081234567890', 'Owner', true, true, 'password123'),
    ('usr-manager-002', 'Hendra Wijaya', 'manager@pesanbuah.id', '081298765432', 'Manager', true, true, 'password123'),
    ('usr-sales-003', 'Dimas Satria (Sales)', 'dimas@pesanbuah.id', '081311223344', 'Sales', false, true, 'password123'),
    ('usr-courier-004', 'Dani Kurir (Logistik)', 'dani@pesanbuah.id', '081399887766', 'Kurir', true, true, 'password123')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.zones (id, name, active) VALUES
    ('zone-001', 'Zone 1 - Bogor Tengah & Pajajaran', true),
    ('zone-002', 'Zone 2 - Bogor Timur & Baranangsiang', true),
    ('zone-003', 'Zone 3 - Sentul & Babakan Madang', true),
    ('zone-004', 'Zone 4 - Cibinong & Depok Selatan', true),
    ('zone-005', 'Zone 5 - Bogor Barat & Dramaga', true),
    ('zone-006', 'Zone 6 - Tanah Sareal & Kedunghalang', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.business_types (id, name, active) VALUES
    ('bt-001', 'Cafe & Coffee Shop', true),
    ('bt-002', 'Restoran & Rumah Makan', true),
    ('bt-003', 'Hotel & Resort', true),
    ('bt-004', 'Juice Bar & Minuman Segar', true),
    ('bt-005', 'Bakery & Pastry', true),
    ('bt-006', 'Catering & Event', true),
    ('bt-007', 'Toko Buah / Retailer', true),
    ('bt-008', 'Pedagang Keliling / UMKM', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quick_fruits (id, name, unit, price, emoji, is_active) VALUES
    ('qf-1', 'Jeruk Medan Manis', 'kg', 28000, '🍊', true),
    ('qf-2', 'Jeruk Peras Segar', 'kg', 18000, '🍊', true),
    ('qf-3', 'Pisang Cavendish Super', 'dus', 185000, '🍌', true),
    ('qf-4', 'Lemon California Segar', 'kg', 25000, '🍋', true),
    ('qf-5', 'Semangka Non Biji Merah', 'kg', 9500, '🍉', true),
    ('qf-6', 'Melon Sky Rocket', 'kg', 14000, '🍈', true),
    ('qf-7', 'Alpukat Mentega Super', 'kg', 28000, '🥑', true),
    ('qf-8', 'Apel Fuji Segar', 'kg', 35000, '🍎', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stock_items (id, fruit_name, unit, current_stock, canvas_allocated_stock, min_stock_alert, avg_cost_price, notes) VALUES
    ('stk-1', 'Jeruk Medan Manis', 'kg', 120.0, 0, 20, 22000, 'Kondisi segar, grade A'),
    ('stk-2', 'Jeruk Peras Segar', 'kg', 85.0, 0, 25, 13500, 'Kualitas peras tinggi'),
    ('stk-3', 'Pisang Cavendish Super', 'dus', 15.0, 0, 5, 150000, 'Kemasan box standar 13kg'),
    ('stk-4', 'Lemon California Segar', 'kg', 45.0, 0, 10, 19000, 'Asam segar, kulit mulus'),
    ('stk-5', 'Semangka Non Biji Merah', 'kg', 210.0, 0, 40, 7000, 'Manis renyah, bobot 3-6kg'),
    ('stk-6', 'Melon Sky Rocket', 'kg', 90.0, 0, 20, 10500, 'Aroma wangi'),
    ('stk-7', 'Alpukat Mentega Super', 'kg', 60.0, 0, 15, 21000, 'Daging tebal gurih'),
    ('stk-8', 'Apel Fuji Segar', 'kg', 40.0, 0, 10, 27000, 'Garing manis impor')
ON CONFLICT (fruit_name) DO NOTHING;
