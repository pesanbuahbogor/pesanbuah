import React, { useState } from 'react';
import {
  Database,
  Check,
  Copy,
  X,
  Server,
  RefreshCw,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Activity,
  HelpCircle,
  Sparkles,
  Radio,
  ShieldAlert,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  resetSupabaseClient,
  getSupabase,
  sanitizeSupabaseUrl,
  sanitizeAnonKey,
} from '../lib/supabase';
import { db } from '../lib/db';
import { useToast } from './Toast';
import { supabaseSetupSql, supabaseQuickPermissionFixSql } from '../lib/supabase-schema-sql';

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
  const [isFixCopied, setIsFixCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'fix'>('config');
  const [showGuide, setShowGuide] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  // Sync inputs with stored config whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      const cfg = getStoredSupabaseConfig();
      setUrl(cfg.url);
      setAnonKey(cfg.key);
      setTestResult(null);
    }
  }, [isOpen]);

  const isConnected = !!getSupabase();
  const cleanedUrl = sanitizeSupabaseUrl(url);
  const cleanedKey = sanitizeAnonKey(anonKey);

  const handleTestConnection = async () => {
    if (!url.trim()) {
      toastError('Harap masukkan Supabase Project URL terlebih dahulu.');
      return;
    }
    if (!cleanedUrl) {
      setTestResult({
        success: false,
        message: 'Format URL belum valid. Contoh yang benar: https://[project-id].supabase.co',
      });
      return;
    }
    if (!cleanedKey) {
      setTestResult({
        success: false,
        message: 'Anon Public Key masih kosong. Salin anon key dari Supabase.',
      });
      return;
    }

    if (cleanedKey.startsWith('sbp_')) {
      setTestResult({
        success: false,
        message:
          'Kunci yang Anda masukkan berawalan "sbp_", yaitu Personal Access Token akun (bukan Project API Key). Silakan buka Supabase > Project Settings > API, lalu salin "anon public" key yang berawalan "eyJ...".',
      });
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    try {
      // 1. Inisialisasi client Supabase sementara dengan URL dan Anon Key yang telah disanitasi
      const tempClient = createClient(cleanedUrl, cleanedKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      // 2. Coba kueri data ke tabel (prospects)
      const { data, error, status } = await tempClient
        .from('prospects')
        .select('id')
        .limit(1);

      // Kondisi 1: Berhasil membaca tabel (HTTP 200)
      if (!error || status === 200) {
        setTestResult({
          success: true,
          message: 'Koneksi Berhasil! URL & Anon Key Supabase valid, dan tabel database siap digunakan.',
        });
        success('Koneksi berhasil! Database Supabase terhubung.');
        return;
      }

      // Kondisi 2: Autentikasi anon key BERHASIL diterima oleh Supabase & PostgreSQL,
      // tetapi tabel prospects belum dibuat (error PostgreSQL: relation does not exist / 42P01 / PGRST204)
      const errorMsg = (error.message || '').toLowerCase();
      const isMissingTable =
        error.code === '42P01' ||
        error.code === 'PGRST204' ||
        error.code === 'PGRST200' ||
        errorMsg.includes('relation') ||
        errorMsg.includes('does not exist');

      if (isMissingTable) {
        setTestResult({
          success: true,
          message:
            'Koneksi Berhasil! URL & Anon Key Supabase valid & aktif. (Catatan: Tabel database belum dibuat. Silakan buka tab "Skrip SQL Schema & RLS", salin kodenya dan jalankan di Supabase SQL Editor).',
        });
        success('Koneksi berhasil! Silakan jalankan Skrip SQL di Supabase SQL Editor.');
        return;
      }

      // Kondisi 3: Permission Denied (error 42501)
      if (errorMsg.includes('permission denied') || error.code === '42501') {
        setTestResult({
          success: true,
          message:
            'Koneksi Berhasil! URL & Anon Key Supabase valid & aktif. Namun PostgreSQL mengunci izin tabel ("permission denied"). Cukup buka tab "Solusi Izin (Fix 42501)", salin script SQL dan jalankan di Supabase SQL Editor untuk membukanya.',
        });
        success('Koneksi valid! Buka tab "Solusi Izin (Fix 42501)" untuk membuka akses tabel.');
        return;
      }

      // Kondisi 4: Cek endpoint GoTrue Auth /auth/v1/settings untuk memvalidasi apikey
      try {
        const authRes = await fetch(`${cleanedUrl}/auth/v1/settings`, {
          method: 'GET',
          headers: {
            apikey: cleanedKey,
          },
        });

        if (authRes.ok) {
          setTestResult({
            success: true,
            message:
              'Koneksi Berhasil! Proyek Supabase dan Anon Key Anda valid & aktif. Anda dapat langsung menyimpan konfigurasi ini.',
          });
          success('Koneksi ke Supabase berhasil!');
          return;
        }
      } catch (authErr) {
        // Abaikan jika fetch tertahan CORS atau lainnya
      }

      // Kondisi 4: Jika status 401 atau 403 (Kunci ditolak)
      if (status === 401 || status === 403 || errorMsg.includes('api key') || errorMsg.includes('jwt')) {
        setTestResult({
          success: false,
          message: `Anon Key ditolak oleh Supabase (HTTP ${status || 401}): ${error.message || 'Invalid API Key'}. Pastikan Anda menyalin "anon public key" (dimulai dengan eyJ...) dari Project Settings > API.`,
        });
        return;
      }

      // Kondisi 5: Respon error lainnya
      setTestResult({
        success: false,
        message: `Respon Supabase: ${error.message || 'Status ' + status}. Periksa kembali URL dan Anon Key.`,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Gagal menghubungi URL "${cleanedUrl}": ${err.message || 'Koneksi gagal'}. Pastikan URL project sudah benar dan perangkat terhubung ke internet.`,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = () => {
    if (!url.trim()) {
      toastError('Harap masukkan Supabase Project URL.');
      return;
    }
    if (!cleanedKey) {
      toastError('Harap masukkan Supabase Anon Public Key.');
      return;
    }
    try {
      saveSupabaseConfig(cleanedUrl || url, cleanedKey);
      resetSupabaseClient();
      success('Koneksi Supabase berhasil disimpan! Memuat ulang sistem...');
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
    setTestResult(null);
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

  const sqlCode = supabaseSetupSql;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setIsCopied(true);
    success('Script SQL Supabase berhasil disalin ke clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const copyFixToClipboard = () => {
    navigator.clipboard.writeText(supabaseQuickPermissionFixSql);
    setIsFixCopied(true);
    success('Script Solusi Izin SQL berhasil disalin ke clipboard!');
    setTimeout(() => setIsFixCopied(false), 2000);
  };

  if (!isOpen) return null;

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
          <button
            onClick={() => setActiveTab('fix')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'fix'
                ? 'border-amber-500 text-amber-700 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            Solusi Izin (Fix 42501)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'config' ? (
            <div className="space-y-4">
              {/* Guidance / Help box */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/90 rounded-xl text-xs text-emerald-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Koneksi Otomatis untuk Semua User (Owner, Manager, Sales)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {showGuide ? 'Tutup Panduan' : 'Tips Agar Semua Device Otomatis Konek'}
                  </button>
                </div>

                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Agar staf dan user lain di perangkat mana pun <strong>langsung terhubung tanpa perlu menyetel URL/Key manual</strong>, cukup pasang <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> di <b>Vercel &gt; Settings &gt; Environment Variables</b> atau simpan di form ini sekali.
                </p>

                {showGuide && (
                  <div className="pt-2 border-t border-emerald-200/70 text-[11px] text-gray-700 space-y-1.5 animate-in fade-in duration-200">
                    <p className="font-semibold text-gray-900">Cara agar otomatis di semua device (Paling Direkomendasikan):</p>
                    <ol className="list-decimal pl-4 space-y-1 text-gray-600">
                      <li>Buka project Vercel Anda &gt; <b>Settings</b> &gt; <b>Environment Variables</b>.</li>
                      <li>
                        Tambahkan variable: <b>VITE_SUPABASE_URL</b> (isi URL project Supabase Anda).
                      </li>
                      <li>
                        Tambahkan variable: <b>VITE_SUPABASE_ANON_KEY</b> (isi anon public key Supabase).
                      </li>
                      <li>
                        Klik <b>Redeploy</b> di Vercel. Setelah itu, siapapun yang membuka website di HP, laptop, atau tablet langsung otomatis terhubung ke Supabase tanpa perlu login/setting apa pun!
                      </li>
                    </ol>
                  </div>
                )}
              </div>

              {/* URL Input with smart feedback */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Supabase Project URL
                  </label>
                  {cleanedUrl && (
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> URL Valid
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="https://xyzproject.supabase.co"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden font-mono"
                />

                {/* Auto conversion / Sanitization Feedback */}
                {url.trim() && cleanedUrl && url.trim() !== cleanedUrl && (
                  <div className="mt-1.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Otomatis diselaraskan ke API Endpoint: <strong className="font-mono">{cleanedUrl}</strong>
                    </span>
                  </div>
                )}

                {url.trim() && !cleanedUrl && (
                  <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      Format URL belum tepat. Masukkan URL berformat <b>https://[project-id].supabase.co</b> (atau tempel link dashboard / ID project Anda).
                    </span>
                  </div>
                )}
              </div>

              {/* Anon Key Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Supabase Anon Public Key
                  </label>
                  {cleanedKey && (
                    <div className="flex items-center gap-1.5">
                      {cleanedKey.startsWith('eyJ') ? (
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Format JWT Valid
                        </span>
                      ) : cleanedKey.startsWith('sbp_') ? (
                        <span className="text-[10px] text-rose-700 font-semibold flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" /> Token Akun (Bukan Anon Key)
                        </span>
                      ) : (
                        <span className="text-[10px] text-blue-700 font-semibold flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          <Key className="w-3 h-3 text-blue-600" /> Kunci Terisi
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <textarea
                  rows={2}
                  value={anonKey}
                  onChange={(e) => {
                    setAnonKey(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-[11px] font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden resize-none"
                />

                {/* Feedback for cleanedKey */}
                {anonKey.trim() && cleanedKey && anonKey.trim() !== cleanedKey && (
                  <div className="mt-1.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Otomatis dibersihkan dari spasi / tanda kutip / prefix tak sengaja tersalin.
                    </span>
                  </div>
                )}

                {cleanedKey.startsWith('sbp_') && (
                  <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Perhatian:</strong> Kunci ini diawali <code>sbp_</code>, yaitu Personal Access Token. Supabase mengharuskan penggunaan <strong>anon public key</strong> (berawalan <code>eyJ...</code>) yang ada di menu <em>Project Settings &gt; API</em>.
                    </span>
                  </div>
                )}
              </div>

              {/* Test Connection Result Box */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-in fade-in duration-150 ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-snug">{testResult.message}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {testingConnection ? (
                    <>
                      <span className="inline-block animate-spin mr-1">⟳</span> Menguji...
                    </>
                  ) : (
                    <>
                      <Activity className="w-3.5 h-3.5 text-gray-600" /> Tes Koneksi
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  Simpan & Hubungkan ke Supabase
                </button>

                {isConnected && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="py-2.5 px-3 border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold text-xs rounded-xl transition cursor-pointer"
                  >
                    Putuskan
                  </button>
                )}
              </div>
            </div>
          ) : activeTab === 'sql' ? (
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
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-950">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  Mengatasi Error "permission denied for table profiles"
                </div>
                <p className="leading-relaxed">
                  Pesan error <code>permission denied for table profiles</code> (PostgreSQL 42501) terjadi karena role <code>anon</code> belum memiliki hak <code>GRANT</code> pada skema <code>public</code> di Supabase.
                </p>
                <p className="leading-relaxed font-semibold text-amber-900">
                  Script di bawah ini akan memberikan hak akses (GRANT) dan membuka RLS secara instan tanpa menghapus atau mengubah struktur tabel yang sudah ada.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">
                  Script Solusi Izin (Cepat &amp; Aman Tanpa Hapus Data)
                </span>
                <button
                  type="button"
                  onClick={copyFixToClipboard}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  {isFixCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {isFixCopied ? 'Script Tersalin!' : 'Salin Script Solusi (1-Klik)'}
                </button>
              </div>

              <pre className="p-4 bg-gray-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-72 leading-relaxed border border-gray-800 shadow-inner select-all">
                {supabaseQuickPermissionFixSql}
              </pre>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1.5 text-gray-700">
                <div className="font-bold text-gray-900">Langkah Menjalankan di Supabase:</div>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Klik tombol <b>Salin Script Solusi (1-Klik)</b> di atas.</li>
                  <li>Buka tab baru ke dashboard Supabase Anda &gt; menu <b>SQL Editor</b> (ikon terminal di sidebar kiri).</li>
                  <li>Klik <b>New Query</b>, tempel (Paste) script yang baru disalin.</li>
                  <li>Klik tombol hijau <b>Run</b> (atau tekan Ctrl+Enter).</li>
                  <li>Kembali ke aplikasi ini dan error <i>permission denied</i> langsung hilang 100%!</li>
                </ol>
              </div>
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
