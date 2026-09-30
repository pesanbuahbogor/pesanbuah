import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check, Apple } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'nav' | 'banner' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'nav',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  // If already running inside installed standalone PWA app, hide button
  if (isInstalled) {
    return null;
  }

  // If user dismissed floating banner
  if (variant === 'banner' && dismissedBanner) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div
          className={`bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-3.5 py-2 rounded-xl shadow-lg flex items-center justify-between gap-3 border border-emerald-500/30 animate-in fade-in slide-in-from-bottom-2 ${className}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-bold leading-tight truncate">Pasang Aplikasi PesanBuah.id</p>
              <p className="text-[10px] text-emerald-100/80 leading-tight truncate">
                Akses cepat dari layar utama HP / Laptop
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={install}
              className="px-3 py-1 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
            >
              Install
            </button>
            <button
              onClick={() => setDismissedBanner(true)}
              className="p-1 text-white/70 hover:text-white rounded-md cursor-pointer"
              title="Tutup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        title="Pasang aplikasi di HP atau desktop"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer ${className}`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        {variant === 'banner' ? (
          <div
            className={`bg-gradient-to-r from-emerald-800 to-teal-900 text-white px-3.5 py-2 rounded-xl shadow-lg flex items-center justify-between gap-3 border border-emerald-500/30 ${className}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Apple className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-bold leading-tight truncate">Install di iPhone / iPad</p>
                <p className="text-[10px] text-emerald-100/80 leading-tight truncate">
                  Jadikan ikon aplikasi di Home Screen
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowIOSGuide(true)}
                className="px-3 py-1 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
              >
                Cara Pasang
              </button>
              <button
                onClick={() => setDismissedBanner(true)}
                className="p-1 text-white/70 hover:text-white rounded-md cursor-pointer"
                title="Tutup"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            title="Install aplikasi di iPhone / iPad"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition cursor-pointer ${className}`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Install di iOS</span>
          </button>
        )}

        {/* Modal petunjuk install iOS */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                    🍎
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Install di iPhone / iPad</h3>
                    <p className="text-[11px] text-gray-500">PesanBuah.id Calon Customer</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-gray-700">
                <div className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="leading-snug">
                    Buka link ini di browser <strong>Safari</strong> (bukan Chrome/browser dalam aplikasi WA).
                  </p>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="leading-snug">
                    Ketuk tombol <strong>Share / Bagikan</strong> (ikon kotak dengan panah atas di bilah bawah Safari).
                  </p>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="leading-snug">
                    Gulir ke bawah lalu pilih <strong>Add to Home Screen (Tambah ke Layar Utama)</strong>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
