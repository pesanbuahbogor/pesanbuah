-- ==============================================================================
-- PESANBUAH.ID - DATABASE SCHEMA & ROW LEVEL SECURITY (SUPABASE)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM FOR USER ROLES & PROSPECT STATUS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Owner', 'Manager', 'Sales');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE prospect_status AS ENUM ('Prospect', 'Follow Up', 'Customer', 'Tidak Jadi');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'Sales',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ZONES TABLE
CREATE TABLE IF NOT EXISTS public.zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ZONE MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.zone_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT unique_zone_user UNIQUE (zone_id, user_id)
);

-- 6. BUSINESS TYPES TABLE
CREATE TABLE IF NOT EXISTS public.business_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PROSPECTS TABLE
CREATE TABLE IF NOT EXISTS public.prospects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL,
    pic_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    business_type_id UUID NOT NULL REFERENCES public.business_types(id) ON DELETE RESTRICT,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    gps_captured_at TIMESTAMPTZ,
    zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
    sales_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status prospect_status NOT NULL DEFAULT 'Prospect',
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. PROSPECT PHOTOS TABLE
CREATE TABLE IF NOT EXISTS public.prospect_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TRIGGER FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prospects_updated_at ON public.prospects;
CREATE TRIGGER trigger_prospects_updated_at
BEFORE UPDATE ON public.prospects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_photos ENABLE ROW LEVEL SECURITY;

-- Helper function: get user role
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() AND active = true;
$$ LANGUAGE sql SECURITY DEFINER;

-- --- PROFILES RLS ---
-- All active users can read profiles
CREATE POLICY "Active users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- CRITICAL: Only Owner can INSERT, UPDATE, or DELETE profiles!
-- Manager and Sales are strictly rejected by the database engine.
CREATE POLICY "Only Owner can insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (public.get_auth_user_role() = 'Owner');

CREATE POLICY "Only Owner can update profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.get_auth_user_role() = 'Owner')
WITH CHECK (public.get_auth_user_role() = 'Owner');

CREATE POLICY "Only Owner can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.get_auth_user_role() = 'Owner');

-- --- ZONES RLS ---
CREATE POLICY "Anyone authenticated can view zones"
ON public.zones FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Owner and Manager can manage zones"
ON public.zones FOR ALL
TO authenticated
USING (public.get_auth_user_role() IN ('Owner', 'Manager'))
WITH CHECK (public.get_auth_user_role() IN ('Owner', 'Manager'));

-- --- ZONE MEMBERS RLS ---
CREATE POLICY "Anyone authenticated can view zone members"
ON public.zone_members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Owner and Manager can manage zone members"
ON public.zone_members FOR ALL
TO authenticated
USING (public.get_auth_user_role() IN ('Owner', 'Manager'))
WITH CHECK (public.get_auth_user_role() IN ('Owner', 'Manager'));

-- --- BUSINESS TYPES RLS ---
CREATE POLICY "Anyone authenticated can view business types"
ON public.business_types FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Owner and Manager can manage business types"
ON public.business_types FOR ALL
TO authenticated
USING (public.get_auth_user_role() IN ('Owner', 'Manager'))
WITH CHECK (public.get_auth_user_role() IN ('Owner', 'Manager'));

-- --- PROSPECTS RLS ---
-- Owner & Manager can view all prospects. Sales views prospects assigned to them or created by them.
CREATE POLICY "View prospects policy"
ON public.prospects FOR SELECT
TO authenticated
USING (
    public.get_auth_user_role() IN ('Owner', 'Manager')
    OR sales_id = auth.uid()
    OR created_by = auth.uid()
);

-- Owner, Manager, and Sales can insert prospects
CREATE POLICY "Insert prospects policy"
ON public.prospects FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IS NOT NULL AND (
        public.get_auth_user_role() IN ('Owner', 'Manager')
        OR (public.get_auth_user_role() = 'Sales' AND (sales_id = auth.uid() OR sales_id IS NULL))
    )
);

-- Owner & Manager can update any prospect. Sales can update their own prospect.
CREATE POLICY "Update prospects policy"
ON public.prospects FOR UPDATE
TO authenticated
USING (
    public.get_auth_user_role() IN ('Owner', 'Manager')
    OR sales_id = auth.uid()
    OR created_by = auth.uid()
)
WITH CHECK (
    public.get_auth_user_role() IN ('Owner', 'Manager')
    OR sales_id = auth.uid()
    OR created_by = auth.uid()
);

-- Owner and Manager can delete prospects.
CREATE POLICY "Delete prospects policy"
ON public.prospects FOR DELETE
TO authenticated
USING (
    public.get_auth_user_role() IN ('Owner', 'Manager')
);

-- --- PROSPECT PHOTOS RLS ---
CREATE POLICY "View prospect photos policy"
ON public.prospect_photos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Insert prospect photos policy"
ON public.prospect_photos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Delete prospect photos policy"
ON public.prospect_photos FOR DELETE
TO authenticated
USING (public.get_auth_user_role() IN ('Owner', 'Manager'));

-- ==============================================================================
-- STORAGE BUCKET FOR PROSPECT PHOTOS
-- ==============================================================================
-- In Supabase Storage, create bucket 'prospect-photos' with Public = true.
-- Policy: Allow authenticated uploads, public select.
