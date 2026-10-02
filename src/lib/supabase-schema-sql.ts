export const supabaseSetupSql = `-- ==============================================================================
-- PESANBUAH.ID - SUPABASE SCHEMA, RLS & REALTIME SETUP (RESILIENT VERSION)
-- Salin dan jalankan script ini di Supabase SQL Editor:
-- ==============================================================================

-- 1. Bersihkan tabel lama yang mungkin terlanjur dibuat dengan format UUID
DROP TABLE IF EXISTS public.prospect_photos CASCADE;
DROP TABLE IF EXISTS public.prospects CASCADE;
DROP TABLE IF EXISTS public.zone_members CASCADE;
DROP TABLE IF EXISTS public.business_types CASCADE;
DROP TABLE IF EXISTS public.zones CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Enable Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Custom Enum Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Owner', 'Manager', 'Sales');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE prospect_status AS ENUM ('Prospect', 'Follow Up', 'Customer', 'Tidak Jadi');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 4. Profiles (Staf Internal: Owner, Manager, Sales)
CREATE TABLE public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'Sales',
    active BOOLEAN NOT NULL DEFAULT true,
    password TEXT DEFAULT 'password123',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Zones (Wilayah Operasional)
CREATE TABLE public.zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Zone Members (Pemetaan Sales ke Zone)
CREATE TABLE public.zone_members (
    id TEXT PRIMARY KEY,
    zone_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    CONSTRAINT unique_zone_user UNIQUE (zone_id, user_id)
);

-- 7. Business Types (Jenis Usaha Target)
CREATE TABLE public.business_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Prospects (Database Calon Customer)
CREATE TABLE public.prospects (
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
    status prospect_status NOT NULL DEFAULT 'Prospect',
    notes TEXT,
    potential_needs TEXT, -- Potensi kebutuhan tambahan customer (sayur, mie, santan, bumbu, buah dll untuk upselling)
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tambahkan kolom jika tabel prospects sudah ada sebelumnya:
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS potential_needs TEXT;

-- 9. Prospect Photos
CREATE TABLE public.prospect_photos (
    id TEXT PRIMARY KEY,
    prospect_id TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Grant Hak Akses Penuh ke Role anon & authenticated (Wajib untuk mencegah 'permission denied')
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Grant eksplisit setiap tabel
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.zones TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.zone_members TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.business_types TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.prospects TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.prospect_photos TO anon, authenticated, service_role;

-- 11. Security Policies (Akses penuh untuk anon dan authenticated)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon and authenticated" ON public.profiles;
CREATE POLICY "Allow all for anon and authenticated" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon and authenticated" ON public.zones;
CREATE POLICY "Allow all for anon and authenticated" ON public.zones FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon and authenticated" ON public.zone_members;
CREATE POLICY "Allow all for anon and authenticated" ON public.zone_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon and authenticated" ON public.business_types;
CREATE POLICY "Allow all for anon and authenticated" ON public.business_types FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon and authenticated" ON public.prospects;
CREATE POLICY "Allow all for anon and authenticated" ON public.prospects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon and authenticated" ON public.prospect_photos;
CREATE POLICY "Allow all for anon and authenticated" ON public.prospect_photos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 12. Enable REALTIME Replication on All Tables (Aman dijalankan berulang kali)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.prospects;
    EXCEPTION WHEN duplicate_object THEN null;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.zones;
    EXCEPTION WHEN duplicate_object THEN null;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.business_types;
    EXCEPTION WHEN duplicate_object THEN null;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    EXCEPTION WHEN duplicate_object THEN null;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.prospect_photos;
    EXCEPTION WHEN duplicate_object THEN null;
    END;
END $$;

-- 13. Full Replica Identity for Realtime Updates
ALTER TABLE public.prospects REPLICA IDENTITY FULL;
ALTER TABLE public.zones REPLICA IDENTITY FULL;
ALTER TABLE public.business_types REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.prospect_photos REPLICA IDENTITY FULL;

-- 14. Seed Master Data Awal (Data Bawaan)
INSERT INTO public.profiles (id, name, email, phone, role, active, password) VALUES
    ('usr-owner-001', 'Budi Santoso', 'owner@pesanbuah.id', '081234567890', 'Owner', true, 'password123'),
    ('usr-manager-002', 'Hendra Wijaya', 'manager@pesanbuah.id', '081298765432', 'Manager', true, 'password123'),
    ('usr-sales-003', 'Rian Saputra', 'rian@pesanbuah.id', '081311223344', 'Sales', true, 'password123'),
    ('usr-sales-004', 'Siti Aisyah', 'siti@pesanbuah.id', '081399887766', 'Sales', true, 'password123')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.zones (id, name, active) VALUES
    ('zone-001', 'Zone 1 - Bogor Tengah & Pajajaran', true),
    ('zone-002', 'Zone 2 - Bogor Timur & Baranangsiang', true),
    ('zone-003', 'Zone 3 - Sentul & Babakan Madang', true),
    ('zone-004', 'Zone 4 - Cibinong & Depok Selatan', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.business_types (id, name, active) VALUES
    ('bt-001', 'Cafe & Coffee Shop', true),
    ('bt-002', 'Restoran', true),
    ('bt-003', 'Hotel & Resort', true),
    ('bt-004', 'Juice Bar & Healthy Drink', true),
    ('bt-005', 'Bakery & Pastry', true),
    ('bt-006', 'Catering', true),
    ('bt-007', 'Toko Buah / Retail', true),
    ('bt-008', 'Lainnya', true)
ON CONFLICT (id) DO NOTHING;
`;

export const supabaseQuickPermissionFixSql = `-- ==============================================================================
-- SOLUSI CEPAT: PERBAIKAN "PERMISSION DENIED FOR TABLE PROFILES"
-- Salin dan jalankan script ini di SQL Editor Supabase Anda untuk membuka izin:
-- ==============================================================================

-- 1. Berikan hak akses skema public ke role anon dan authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 2. Pastikan tabel baru otomatis mendapatkan izin
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 3. Berikan hak akses eksplisit ke semua tabel aplikasi
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.zones TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.zone_members TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.business_types TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.prospects TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.prospect_photos TO anon, authenticated, service_role;

-- 4. Buka Row Level Security agar tidak memblokir query API
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_photos DISABLE ROW LEVEL SECURITY;
`;

export const supabaseAddPotentialNeedsSql = `-- ==============================================================================
-- UPDATE SKEMA: TAMBAH KOLOM POTENSI KEBUTUHAN TAMBAHAN (UPSELLING)
-- Jalankan script ini jika tabel prospects Anda sudah ada di Supabase:
-- ==============================================================================

-- 1. Tambah kolom potential_needs jika belum ada
ALTER TABLE public.prospects 
ADD COLUMN IF NOT EXISTS potential_needs TEXT;

-- 2. Pastikan hak akses tetap terbuka untuk role anon dan authenticated
GRANT ALL ON TABLE public.prospects TO anon, authenticated, service_role;
`;
