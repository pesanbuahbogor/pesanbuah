import React, { useState, useEffect } from 'react';
import { ShieldAlert, Copy, Check, ChevronDown, ChevronUp, Terminal, ExternalLink } from 'lucide-react';
import { subscribeToPermissionDenied, clearPermissionDenied } from '../lib/db';
import { supabaseQuickPermissionFixSql } from '../lib/supabase-schema-sql';
import { useToast } from './Toast';

interface PermissionDeniedBannerProps {
  forcedTable?: string | null;
  className?: string;
  onDismiss?: () => void;
}

export const PermissionDeniedBanner: React.FC<PermissionDeniedBannerProps> = ({
  forcedTable,
  className = '',
  onDismiss,
}) => {
  const { success } = useToast();
  const [deniedTable, setDeniedTable] = useState<string | null>(forcedTable || null);
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    if (forcedTable !== undefined) {
      setDeniedTable(forcedTable);
      return;
    }

    const unsubscribe = subscribeToPermissionDenied((table) => {
      setDeniedTable(table);
    });

    return () => {
      unsubscribe();
    };
  }, [forcedTable]);

  if (!deniedTable) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(supabaseQuickPermissionFixSql);
    setCopied(true);
    success('Script SQL perbaikan berhasil disalin ke clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleClose = () => {
    clearPermissionDenied();
    setDeniedTable(null);
    if (onDismiss) onDismiss();
  };

  return (
    <div
      className={`bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-amber-400/40 animate-in fade-in slide-in-from-top-2 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-sm sm:text-base tracking-tight text-white drop-shadow-xs">
                Izin Database Supabase Ditolak: <code>table {deniedTable}</code>
              </h4>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full text-white">
                Error 42501
              </span>
            </div>
            <p className="text-xs text-amber-50 leading-relaxed max-w-2xl">
              PostgreSQL di Supabase belum memberikan hak akses (<code>GRANT</code>) untuk role <code>anon</code> pada tabel <strong>{deniedTable}</strong>. Cukup salin script SQL di bawah ini dan jalankan di <strong>SQL Editor Supabase</strong> sekali untuk memperbaikinya secara instan.
            </p>
          </div>
        </div>

        <button
          onClick={handleClose}
          type="button"
          className="self-end sm:self-start text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-lg transition shrink-0 cursor-pointer"
        >
          Tutup ✕
        </button>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="px-4 py-2 bg-white text-orange-950 hover:bg-amber-50 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-98"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Script SQL Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-orange-700" />
              <span>Salin Script Perbaikan SQL (1-Klik)</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowSql(!showSql)}
          className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-xl transition flex items-center gap-1 cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{showSql ? 'Sembunyikan Kode SQL' : 'Lihat Kode SQL'}</span>
          {showSql ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 text-xs font-medium text-amber-100 hover:text-white underline flex items-center gap-1 ml-auto"
        >
          Buka Supabase Dashboard <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* SQL Code Box Preview */}
      {showSql && (
        <div className="mt-3 bg-gray-950/90 rounded-xl p-3 text-emerald-400 font-mono text-[11px] leading-relaxed border border-white/10 overflow-x-auto shadow-inner">
          <div className="flex items-center justify-between text-gray-400 text-[10px] pb-1.5 mb-1.5 border-b border-gray-800">
            <span>SQL Script Solusi Izin Anon/Authenticated:</span>
            <button
              onClick={handleCopy}
              className="text-amber-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3 h-3" /> Salin
            </button>
          </div>
          <pre className="whitespace-pre-wrap">{supabaseQuickPermissionFixSql}</pre>
        </div>
      )}

      {/* 3 Step Instruction */}
      <div className="mt-3 bg-black/15 rounded-xl p-2.5 text-[11px] text-amber-100 flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
        <span className="font-bold text-white uppercase text-[10px] tracking-wider shrink-0">
          Langkah Mudah:
        </span>
        <span className="flex-1">
          1. Klik tombol <strong>Salin Script</strong> di atas &bull; 2. Buka <strong>Supabase &gt; SQL Editor &gt; New query</strong> &bull; 3. Tempel (Paste) lalu klik <strong>Run</strong>.
        </span>
      </div>
    </div>
  );
};
