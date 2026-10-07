import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PesanBuah App Uncaught Error:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleResetSession = () => {
    localStorage.removeItem('pesanbuah_active_user_v1');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 text-center border border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-lg font-extrabold text-gray-900">
              Terjadi Kendala Tampilan
            </h2>

            <p className="text-xs text-gray-600 leading-relaxed">
              Aplikasi mendeteksi galat sementara. Silakan segarkan halaman atau reset sesi login untuk memuat ulang sistem secara aman.
            </p>

            {this.state.error && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-left text-[11px] font-mono text-rose-700 max-h-32 overflow-y-auto break-all">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Segarkan Halaman (Reload)
              </button>

              <button
                type="button"
                onClick={this.handleResetSession}
                className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Reset Sesi &amp; Kembali ke Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
