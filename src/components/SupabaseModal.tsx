import React, { useState } from 'react';
import { Database, Check, Copy, X, Server, RefreshCw, Key, ExternalLink } from 'lucide-react';
import { getStoredSupabaseConfig, saveSupabaseConfig, resetSupabaseClient, getSupabase } from '../lib/supabase';
import { db } from '../lib/db';
import { useToast } from './Toast';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset?: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose, onDataReset }) => {
  const { success, error: toastError } = useToast();
  const currentConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.key);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'sql'>('config');

  if (!isOpen) return null;

  const isConnected = !!getSupabase();

  const handleSave = () => {
    try {
      saveSupabaseConfig(url, anonKey);
      resetSupabaseClient();
      success('Konfigurasi Supabase berhasil disimpan! Memuat ulang koneksi...');
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err: any) {
      toastError(err.message || 'Gagal menyimpan konfigurasi');
    }
  };

  const handleDisconnect = () => {
    saveSupabaseConfig('', '');
    resetSupabaseClient();
    setUrl('');
    setAnonKey('');
    success('Beralih ke Engine Penyimpanan Lokal.');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleResetData = () => {
    if (confirm('Apakah Anda yakin ingin me-reset database ke data awal? Semua perubahan tes akan kembali ke data bawaan PesanBuah.id.')) {
      db.resetToInitialSeed();
      success('Database berhasil di-reset ke data bawaan!');
      if (onDataReset) onDataReset();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const sqlCode = `-- ==============================================================================
-- PESANBUAH.ID - SUPABASE SCHEMA & RLS SETUP
-- Copy dan Paste script ini di Supabase SQL Editor:
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Owner', 'Manager', 'Sales');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE prospect_status AS ENUM ('Prospect', 'Follow Up', 'Customer', 'Tidak Jadi');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 1. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'Sales',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. zones
CREATE TABLE IF NOT EXISTS public.zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. zone_members
CREATE TABLE IF NOT EXISTS public.zone_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT unique_zone_user UNIQUE (zone_id, user_id)
);

-- 4. business_types
CREATE TABLE IF NOT EXISTS public.business_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. prospects
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

-- 6. prospect_photos
CREATE TABLE IF NOT EXISTS public.prospect_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_photos ENABLE ROW LEVEL SECURITY;

-- Helper role function
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() AND active = true;
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: Only Owner can insert, update, or delete profiles!
CREATE POLICY "Profiles view" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only Owner insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.get_auth_user_role() = 'Owner');
CREATE POLICY "Only Owner update" ON public.profiles FOR UPDATE TO authenticated USING (public.get_auth_user_role() = 'Owner');
CREATE POLICY "Only Owner delete" ON public.profiles FOR DELETE TO authenticated USING (public.get_auth_user_role() = 'Owner');

-- Zones & Business Types: Owner & Manager can manage
CREATE POLICY "Zones view" ON public.zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Zones manage" ON public.zones FOR ALL TO authenticated USING (public.get_auth_user_role() IN ('Owner', 'Manager'));

CREATE POLICY "Types view" ON public.business_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Types manage" ON public.business_types FOR ALL TO authenticated USING (public.get_auth_user_role() IN ('Owner', 'Manager'));

-- Prospects: Owner/Manager view all, Sales view their assigned
CREATE POLICY "Prospects view" ON public.prospects FOR SELECT TO authenticated
USING (public.get_auth_user_role() IN ('Owner', 'Manager') OR sales_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Prospects insert" ON public.prospects FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Prospects update" ON public.prospects FOR UPDATE TO authenticated
USING (public.get_auth_user_role() IN ('Owner', 'Manager') OR sales_id = auth.uid());

CREATE POLICY "Prospects delete" ON public.prospects FOR DELETE TO authenticated
USING (public.get_auth_user_role() IN ('Owner', 'Manager'));
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setIsCopied(true);
    success('Script SQL Supabase berhasil disalin ke clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Backend & Database Supabase</h3>
              <p className="text-xs text-emerald-100">Konfigurasi Cloud Backend & Skrip SQL RLS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-gray-700">Status Backend:</span>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Terhubung ke Supabase Cloud
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                <Server className="w-3.5 h-3.5" />
                Engine Penyimpanan Lokal Aktif (Data Tersimpan Persisten)
              </span>
            )}
          </div>
          <button
            onClick={handleResetData}
            title="Reset ulang ke data demo bawaan"
            className="text-xs text-gray-600 hover:text-rose-600 flex items-center gap-1 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Data Bawaan
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-5 pt-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pengaturan Koneksi
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Skrip SQL Schema & RLS
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'config' ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
                <p className="font-semibold text-sm mb-1 text-emerald-950">Informasi Integrasi Supabase</p>
                Aplikasi PesanBuah.id siap terhubung dengan Supabase Cloud secara langsung. Anda dapat memasukkan Project URL dan Anon Key project Supabase Anda di bawah ini, atau gunakan environment variable <code className="bg-emerald-200/60 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code>.
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Supabase Project URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Supabase Anon Public Key
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  Hubungkan ke Supabase
                </button>
                {isConnected && (
                  <button
                    onClick={handleDisconnect}
                    className="py-2.5 px-4 border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold text-sm rounded-xl transition"
                  >
                    Putuskan
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Jalankan skrip ini di <b>Supabase SQL Editor</b> untuk membuat tabel & hak akses RLS.
                </span>
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? 'Tersalin!' : 'Salin SQL'}
                </button>
              </div>

              <pre className="p-4 bg-gray-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-96 leading-relaxed select-all">
                {sqlCode}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
