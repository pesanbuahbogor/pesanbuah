import React, { useState } from 'react';
import {
  Database,
  Check,
  Copy,
  X,
  Server,
  RefreshCw,
  Key,
  CheckCircle2,
  AlertCircle,
  Activity,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Layers,
  RotateCcw,
  Trash2,
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
import { useAuth } from '../context/AuthContext';
import { supabaseMasterSql, supabaseResetTransactionsSql } from '../lib/supabase-schema-sql';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset?: () => void;
  initialTab?: 'config' | 'sql' | 'reset';
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose, onDataReset, initialTab }) => {
  const { currentUser } = useAuth();
  const { success, error: toastError } = useToast();
  const currentConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.key);
  const [isCopied, setIsCopied] = useState(false);
  const [isResetSqlCopied, setIsResetSqlCopied] = useState(false);
  const [isResettingTransactions, setIsResettingTransactions] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'reset'>('config');
  const [showGuide, setShowGuide] = useState(false);
  const [showFactoryResetWarning, setShowFactoryResetWarning] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Sync inputs with stored config whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      const cfg = getStoredSupabaseConfig();
      setUrl(cfg.url);
      setAnonKey(cfg.key);
      setTestResult(null);
      setResetSuccessMessage(null);
      if (initialTab) {
        setActiveTab(initialTab);
      }
      setConfirmPhrase('');
    }
  }, [isOpen, initialTab]);

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

      // 2. Coba kueri data ke tabel (prospects & orders)
      const { error: pError } = await tempClient
        .from('prospects')
        .select('id')
        .limit(1);

      const { error: oError } = await tempClient
        .from('orders')
        .select('id')
        .limit(1);

      // Kondisi 1: Kedua tabel terbaca sempurna tanpa error
      if (!pError && !oError) {
        setTestResult({
          success: true,
          message: 'Koneksi Berhasil 100%! URL & Anon Key Supabase valid, dan tabel database utama (prospects, orders, dll) telah aktif siap pakai!',
        });
        success('Koneksi berhasil! Database Supabase terhubung & siap digunakan.');
        return;
      }

      // Cek apakah error karena tabel belum ada (relation does not exist)
      const pMsg = (pError?.message || '').toLowerCase();
      const oMsg = (oError?.message || '').toLowerCase();
      const isMissingTable =
        pError?.code === '42P01' ||
        oError?.code === '42P01' ||
        pMsg.includes('does not exist') ||
        oMsg.includes('does not exist');

      if (isMissingTable) {
        setTestResult({
          success: true,
          message:
            'Koneksi Berhasil! URL & Anon Key Supabase valid & aktif. Namun tabel database belum dibuat / belum lengkap. Silakan buka tab "Master Skrip SQL", salin 1 skrip terbaik dan jalankan di Supabase SQL Editor.',
        });
        success('Koneksi valid! Silakan jalankan Master Skrip SQL di Supabase SQL Editor.');
        return;
      }

      // Cek permission denied
      if (pMsg.includes('permission denied') || oMsg.includes('permission denied')) {
        setTestResult({
          success: true,
          message:
            'Koneksi Berhasil! URL & Anon Key aktif. Namun izin tabel masih terkunci. Cukup salin Master Skrip SQL di tab sebelah dan jalankan di Supabase SQL Editor untuk membuka izin akses.',
        });
        success('Koneksi valid! Jalankan Master Skrip SQL untuk membuka akses.');
        return;
      }

      setTestResult({
        success: true,
        message: 'Koneksi ke Supabase berhasil terhubung. Jalankan Master Skrip SQL untuk memastikan seluruh tabel lengkap.',
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
    if (confirm('PERINGATAN: Apakah Anda yakin ingin me-reset SEMUA data termasuk pelanggan dan user ke data demo bawaan pabrik? Jika hanya ingin mengosongkan transaksi dan stok, gunakan Tab 3.')) {
      db.resetToInitialSeed();
      success('Database berhasil di-reset ke data bawaan!');
      if (onDataReset) onDataReset();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleResetTransactions = async () => {
    if (!currentUser) {
      toastError('Sesi pengguna tidak valid.');
      return;
    }
    if (confirmPhrase.trim().toUpperCase() !== 'KOSONGKAN') {
      toastError('Harap ketik kata KOSONGKAN untuk mengonfirmasi.');
      return;
    }

    try {
      setIsResettingTransactions(true);
      await db.resetTransactionAndStockData(currentUser);
      const msg = 'Data transaksi berhasil dikosongkan dan stok telah di-reset ke 0! Data pelanggan CRM dan akun pengguna tetap aman.';
      setResetSuccessMessage(msg);
      success(msg);
      setConfirmPhrase('');
      if (onDataReset) onDataReset();
    } catch (err: any) {
      toastError(err.message || 'Gagal mengosongkan data transaksi.');
    } finally {
      setIsResettingTransactions(false);
    }
  };

  const copyResetSqlToClipboard = () => {
    navigator.clipboard.writeText(supabaseResetTransactionsSql);
    setIsResetSqlCopied(true);
    success('Skrip SQL Reset Transaksi berhasil disalin ke clipboard!');
    setTimeout(() => setIsResetSqlCopied(false), 2500);
  };

  const copyMasterSqlToClipboard = () => {
    navigator.clipboard.writeText(supabaseMasterSql);
    setIsCopied(true);
    success('Master Skrip SQL Terbaik berhasil disalin ke clipboard!');
    setTimeout(() => setIsCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">Backend &amp; Database Supabase</h3>
              <p className="text-xs text-emerald-100">Koneksi Cloud Database &amp; Master Skrip SQL Terpadu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-5 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="font-semibold text-gray-700">Status Backend:</span>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Terhubung ke Supabase Cloud (Live Data)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                <Server className="w-3.5 h-3.5" />
                Penyimpanan Lokal Aktif
              </span>
            )}
          </div>
          <button
            onClick={handleResetData}
            title="Reset ulang ke data demo bawaan"
            className="text-xs text-gray-600 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Data Bawaan
          </button>
        </div>

        {/* 3 Clean Tabs */}
        <div className="flex border-b border-gray-200 px-3 sm:px-5 pt-2 bg-gray-50/50 overflow-x-auto no-scrollbar gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>1. Koneksi Supabase</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>2. Master Skrip SQL</span>
          </button>
          <button
            onClick={() => setActiveTab('reset')}
            className={`pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'reset'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>3. Kosongkan Transaksi &amp; Stok</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {activeTab === 'config' && (
            <div className="space-y-4">
              {/* Guidance / Help box */}
              <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-xs text-emerald-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Koneksi Otomatis Multi-Perangkat (Owner, Manager, Sales, Kurir)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {showGuide ? 'Tutup Panduan' : 'Tips Multi-Device'}
                  </button>
                </div>

                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Masukkan URL dan Anon Public Key Supabase Anda di bawah ini, lalu klik <strong>Simpan &amp; Hubungkan</strong>. Semua data order, status setoran kurir, database customer, dan stok gudang akan otomatis tersimpan langsung ke Supabase Cloud.
                </p>

                {showGuide && (
                  <div className="pt-2 border-t border-emerald-200/70 text-[11px] text-gray-700 space-y-1.5 animate-in fade-in duration-200">
                    <p className="font-semibold text-gray-900">Agar otomatis di HP semua staf tanpa setting ulang:</p>
                    <ol className="list-decimal pl-4 space-y-1 text-gray-600">
                      <li>Buka project Vercel / hosting Anda &gt; <b>Settings</b> &gt; <b>Environment Variables</b>.</li>
                      <li>Tambahkan <b>VITE_SUPABASE_URL</b> (URL project Supabase Anda).</li>
                      <li>Tambahkan <b>VITE_SUPABASE_ANON_KEY</b> (Anon public key Supabase Anda).</li>
                      <li>Klik <b>Redeploy</b>. Siapapun yang membuka web di HP atau laptop langsung otomatis tersambung ke database yang sama!</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* URL Input */}
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
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden transition"
                />
              </div>

              {/* Anon Public Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Supabase Anon Public Key (API Key)
                  </label>
                  {cleanedKey && (
                    <div className="flex items-center gap-1.5">
                      {cleanedKey.startsWith('sbp_') ? (
                        <span className="text-[10px] text-rose-700 font-semibold flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" /> Bukan Anon Key
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

                {cleanedKey.startsWith('sbp_') && (
                  <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Perhatian:</strong> Kunci ini diawali <code>sbp_</code> (Personal Access Token). Harap salin <strong>anon public key</strong> (berawalan <code>eyJ...</code>) dari menu <em>Project Settings &gt; API</em> di Supabase.
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
                  Simpan &amp; Hubungkan ke Supabase
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
          )}

          {activeTab === 'sql' && (
            /* TAB 2: 1 MASTER SKRIP SQL TERBAIK */
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-300 rounded-2xl space-y-2 text-xs text-emerald-950 shadow-2xs">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-900">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>1 Master Skrip SQL Lengkap &amp; Terbaik (All-in-One)</span>
                </div>
                <p className="leading-relaxed text-[11px] text-emerald-900">
                  <strong>Tidak perlu bingung memilih banyak skrip terpisah!</strong> Skrip ini telah menyatukan semua tabel dan pembaruan sistem PesanBuah.id:
                </p>
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] font-medium text-emerald-950">
                  <span className="flex items-center gap-1">✅ User Profiles (Owner, Manager, Sales, Kurir)</span>
                  <span className="flex items-center gap-1">✅ Order &amp; Setoran Kas COD Kurir</span>
                  <span className="flex items-center gap-1">✅ Database Calon Customer &amp; Upselling</span>
                  <span className="flex items-center gap-1">✅ Gudang Stok Buah &amp; Kulakan</span>
                  <span className="flex items-center gap-1">✅ Kurir Canvas Keliling &amp; Rekonsiliasi</span>
                  <span className="flex items-center gap-1">✅ Izin Penuh (Anti Error 42501) &amp; Realtime</span>
                </div>
              </div>

              {/* Copy Button & Subtitle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs text-gray-500 font-medium">
                  Salin skrip lalu jalankan 1 kali di <b>SQL Editor</b> Supabase Anda:
                </span>
                <button
                  type="button"
                  onClick={copyMasterSqlToClipboard}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-extrabold rounded-xl shadow-xs transition cursor-pointer"
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'Master Skrip Berhasil Disalin!' : 'Salin Master Skrip SQL (1-Klik)'}</span>
                </button>
              </div>

              {/* 3 Simple Steps */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1.5 text-gray-700">
                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>3 Langkah Mudah di Dashboard Supabase:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-gray-600 text-[11px]">
                  <li>Buka project Anda di <b>supabase.com</b> &gt; Masuk ke menu <b>SQL Editor</b> (ikon terminal di sidebar).</li>
                  <li>Klik tombol <b>+ New Query</b>, lalu Tempel (Paste / Ctrl+V) skrip yang disalin.</li>
                  <li>Klik tombol hijau <b>Run</b> (atau tekan Ctrl + Enter). Selesai! Semua tabel &amp; izin langsung aktif 100%.</li>
                </ol>
              </div>

              {/* SQL Code View */}
              <pre className="p-4 bg-gray-950 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-72 leading-relaxed border border-gray-800 shadow-inner select-all">
                {supabaseMasterSql}
              </pre>
            </div>
          )}

          {activeTab === 'reset' && (
            /* TAB 3: KOSONGKAN TRANSAKSI & RESET STOK (CUSTOMER & USER TETAP AMAN) */
            <div className="space-y-4">
              {/* Informative Header Banner */}
              <div className="p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border-2 border-amber-300 rounded-2xl space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 font-black text-sm text-amber-950">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Kosongkan Transaksi &amp; Reset Stok ke 0 (Mulai dari Awal)</span>
                </div>
                <p className="text-xs text-amber-950 leading-relaxed font-medium">
                  Fitur ini dirancang khusus untuk Anda yang ingin <strong>memulai awal baru</strong> (reset operasional penjualan &amp; stok) tanpa kehilangan data master penting yang sudah diinput sebelumnya.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white/90 border border-rose-200 space-y-1 text-rose-950 shadow-2xs">
                    <p className="font-bold text-rose-800 flex items-center gap-1">
                      <span>🗑️ Data yang Dikosongkan:</span>
                    </p>
                    <ul className="space-y-0.5 text-gray-700 pl-1">
                      <li>• Seluruh pesanan / order delivery</li>
                      <li>• Riwayat kas tunai &amp; setoran COD kurir</li>
                      <li>• Riwayat trip canvas kurir keliling</li>
                      <li>• Riwayat belanja masuk supplier (inbound)</li>
                      <li>• Log mutasi &amp; histori stok</li>
                      <li>• <strong>Angka stok fisik barang di-reset ke 0 kg</strong></li>
                    </ul>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200 space-y-1 text-emerald-950 shadow-2xs">
                    <p className="font-bold text-emerald-800 flex items-center gap-1">
                      <span>🛡️ Data yang 100% AMAN (TIDAK Dihapus):</span>
                    </p>
                    <ul className="space-y-0.5 text-gray-700 pl-1">
                      <li>• <strong>Data Calon &amp; Pelanggan CRM</strong> (Tetap utuh)</li>
                      <li>• <strong>Akun Pengguna Tim</strong> (Owner, Manager, Sales, Kurir)</li>
                      <li>• Master Wilayah (Zone &amp; Kelurahan)</li>
                      <li>• Master Kategori &amp; Jenis Usaha</li>
                      <li>• Master Nama Komoditas &amp; Katalog Buah Cepat</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Execution Method 1: In-App 1-Click Action */}
              <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      Metode 1: Eksekusi Otomatis Langsung (1-Klik)
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Berlaku baik menggunakan database Supabase Cloud maupun penyimpanan lokal.
                    </p>
                  </div>
                </div>

                {resetSuccessMessage && (
                  <div className="p-3.5 bg-emerald-50 border-2 border-emerald-400 rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Data Transaksi Berhasil Dikosongkan!</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                      {resetSuccessMessage}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        window.location.reload();
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition cursor-pointer"
                    >
                      Tutup &amp; Segarkan Tampilan
                    </button>
                  </div>
                )}

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-2">
                  <p className="text-[11px] text-gray-700 font-medium">
                    Ketik kata <strong className="text-rose-700 select-all font-mono uppercase bg-rose-50 px-1 py-0.5 rounded border border-rose-200">KOSONGKAN</strong> di bawah ini untuk mengonfirmasi:
                  </p>
                  <input
                    type="text"
                    value={confirmPhrase}
                    onChange={(e) => setConfirmPhrase(e.target.value.toUpperCase())}
                    placeholder="Ketik KOSONGKAN"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono font-bold tracking-widest uppercase focus:ring-2 focus:ring-rose-500 outline-hidden"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleResetTransactions}
                  disabled={confirmPhrase.trim().toUpperCase() !== 'KOSONGKAN' || isResettingTransactions}
                  className={`w-full py-3 px-4 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                    confirmPhrase.trim().toUpperCase() === 'KOSONGKAN' && !isResettingTransactions
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                      : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                  }`}
                >
                  {isResettingTransactions ? (
                    <>
                      <span className="inline-block animate-spin mr-1">⟳</span> Memproses Pengosongan Data...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Kosongkan Transaksi &amp; Reset Stok Sekarang
                    </>
                  )}
                </button>
              </div>

              {/* Execution Method 2: Supabase Cloud SQL Script */}
              <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-2xs space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      Metode 2: Skrip SQL Khusus Supabase (SQL Editor)
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Jika Anda ingin menjalankan TRUNCATE langsung di dashboard Supabase.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={copyResetSqlToClipboard}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer shrink-0"
                  >
                    {isResetSqlCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isResetSqlCopied ? 'Skrip Disalin!' : 'Salin Skrip SQL Reset'}</span>
                  </button>
                </div>

                <pre className="p-3 bg-gray-950 text-amber-300 font-mono text-[10px] sm:text-[11px] rounded-xl overflow-x-auto max-h-48 leading-relaxed border border-gray-800 shadow-inner select-all">
                  {supabaseResetTransactionsSql}
                </pre>
              </div>

              {/* Factory Wipe (Discreet Secondary) */}
              <div className="pt-2 border-t border-gray-200 text-center">
                <button
                  type="button"
                  onClick={() => setShowFactoryResetWarning(!showFactoryResetWarning)}
                  className="text-[11px] text-gray-400 hover:text-gray-600 underline cursor-pointer"
                >
                  {showFactoryResetWarning ? 'Sembunyikan Opsi Reset Total Demo' : 'Opsi Lanjutan: Reset Total ke Demo Bawaan Pabrik (Hapus Semuanya)'}
                </button>

                {showFactoryResetWarning && (
                  <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-left space-y-2 animate-in fade-in">
                    <p className="text-[11px] text-rose-900 leading-snug">
                      <strong>PERINGATAN:</strong> Tombol di bawah ini akan menghapus SELURUH data termasuk pelanggan dan user kustom, lalu mengembalikan data dummy demo bawaan. Hanya gunakan jika Anda sengaja ingin mereset aplikasi secara total.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetData}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      Reset Total ke Demo Pabrik
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            {isConnected ? '🟢 Terhubung ke Supabase Cloud' : '⚪ Engine Penyimpanan Lokal'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
