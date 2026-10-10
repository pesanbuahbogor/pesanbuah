import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Warehouse,
  Truck,
  FileText,
  Plus,
  Scale,
  AlertTriangle,
  Search,
  ArrowDownToLine,
  RotateCcw,
  Trash2,
  Edit3,
  LayoutGrid,
  List,
  Coins,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  StockItem,
  StockInbound,
  CanvasTrip,
  StockMovementLog,
  Profile,
  QuickFruitItem,
} from '../types';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { formatRupiah } from '../lib/orderScheduleUtils';
import { StockInboundModal } from '../components/StockInboundModal';
import { CanvasTripModal } from '../components/CanvasTripModal';
import { CanvasReconciliationModal } from '../components/CanvasReconciliationModal';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal';
import { FruitMasterModal } from '../components/FruitMasterModal';
import { subscribeToRealtime } from '../lib/supabase';

interface InventoryPageProps {
  onNavigateToOrdersRemittance?: () => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ onNavigateToOrdersRemittance }) => {
  const { currentUser, isOwner, isManager } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'stock' | 'inbounds' | 'canvas' | 'logs'>('stock');
  const [stockViewMode, setStockViewMode] = useState<'grid' | 'table'>('grid');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'safe' | 'low' | 'out'>('all');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [inbounds, setStockInbounds] = useState<StockInbound[]>([]);
  const [canvasTrips, setCanvasTrips] = useState<CanvasTrip[]>([]);
  const [movementLogs, setMovementLogs] = useState<StockMovementLog[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [quickFruits, setQuickFruits] = useState<QuickFruitItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [fruitFilter, setFruitFilter] = useState('');

  // Modals
  const [isInboundModalOpen, setIsInboundModalOpen] = useState(false);
  const [isCanvasModalOpen, setIsCanvasModalOpen] = useState(false);
  const [selectedCanvasForReconcile, setSelectedCanvasForReconcile] = useState<CanvasTrip | null>(null);
  const [selectedStockForAdjust, setSelectedStockForAdjust] = useState<StockItem | null>(null);
  const [isFruitModalOpen, setIsFruitModalOpen] = useState(false);
  const [selectedStockForEdit, setSelectedStockForEdit] = useState<StockItem | null>(null);
  const [deleteFruitConfirmItem, setDeleteFruitConfirmItem] = useState<StockItem | null>(null);
  const [deleteInboundConfirmItem, setDeleteInboundConfirmItem] = useState<StockInbound | null>(null);
  const [deleteCanvasConfirmItem, setDeleteCanvasConfirmItem] = useState<CanvasTrip | null>(null);
  const [isClearMasterConfirmOpen, setIsClearMasterConfirmOpen] = useState(false);
  const [isResetMasterConfirmOpen, setIsResetMasterConfirmOpen] = useState(false);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [stocks, inb, trips, logs, profs, fruits] = await Promise.all([
        db.getStockItems(),
        db.getStockInbounds(),
        db.getCanvasTrips(),
        db.getStockMovementLogs(),
        db.getProfiles(),
        db.getQuickFruits(),
      ]);
      setStockItems(stocks);
      setStockInbounds(inb);
      setCanvasTrips(trips);
      setMovementLogs(logs);
      setProfiles(profs);
      setQuickFruits(fruits);
    } catch (err: any) {
      toastError(err.message || 'Gagal memuat data stok dan gudang.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();

    // Supabase Realtime subscriptions
    const unsubStock = subscribeToRealtime('stock_items', () => {
      db.getStockItems().then(setStockItems).catch(() => {});
    });
    const unsubInbound = subscribeToRealtime('stock_inbounds', () => {
      db.getStockInbounds().then(setStockInbounds).catch(() => {});
    });
    const unsubCanvas = subscribeToRealtime('canvas_trips', () => {
      db.getCanvasTrips().then(setCanvasTrips).catch(() => {});
    });

    return () => {
      unsubStock();
      unsubInbound();
      unsubCanvas();
    };
  }, []);

  if (!isOwner && !isManager) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Warehouse className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Akses Khusus Manajemen (Owner &amp; Manager)</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Hak akses untuk belanja buah ke supplier, penugasan kurir canvas keliling, audit opname, serta perubahan stok gudang hanya dapat dilakukan oleh <strong>Owner</strong> dan <strong>Manager</strong>.
        </p>
        <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500 border border-gray-200 inline-block text-left">
          Akun Anda: <span className="font-semibold text-gray-800">{currentUser?.name}</span> ({currentUser?.role})
        </div>
      </div>
    );
  }

  const couriers = profiles.filter((p) => p.is_courier || p.role === 'Kurir' || p.role === 'Sales');

  // KPI Calculations
  const totalStockKg = stockItems.reduce((acc, s) => acc + (s.unit === 'kg' ? s.current_stock : 0), 0);
  const totalCanvasKg = stockItems.reduce((acc, s) => acc + (s.unit === 'kg' ? s.canvas_allocated_stock : 0), 0);
  const totalAssetValue = stockItems.reduce((acc, s) => acc + s.current_stock * (s.avg_cost_price || 0), 0);
  const lowStockCount = stockItems.filter((s) => s.current_stock <= (s.min_stock_alert || 10)).length;
  const activeCanvasTrips = canvasTrips.filter((t) => t.status === 'Sedang Keliling').length;
  const safeStockCount = stockItems.filter((s) => s.current_stock > (s.min_stock_alert || 10)).length;
  const outOfStockCount = stockItems.filter((s) => s.current_stock <= 0).length;

  const filteredStocks = stockItems.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!s.fruit_name.toLowerCase().includes(q)) return false;
    }
    const isLow = s.current_stock <= (s.min_stock_alert || 10);
    const isOut = s.current_stock <= 0;
    if (stockStatusFilter === 'safe' && (isLow || isOut)) return false;
    if (stockStatusFilter === 'low' && (!isLow || isOut)) return false;
    if (stockStatusFilter === 'out' && !isOut) return false;
    return true;
  });

  const filteredLogs = movementLogs.filter((l) => {
    if (fruitFilter) {
      return l.fruit_name.toLowerCase() === fruitFilter.toLowerCase();
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        l.fruit_name.toLowerCase().includes(q) ||
        l.reference_note.toLowerCase().includes(q) ||
        l.operator_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDeleteFruit = async (item: StockItem) => {
    if (!currentUser) return;
    try {
      await db.deleteStockItem(item.id, currentUser);
      success(`Buah "${item.fruit_name}" berhasil dihapus dari master katalog.`);
      setDeleteFruitConfirmItem(null);
      loadAllData();
    } catch (err: any) {
      toastError(err.message || 'Gagal menghapus buah.');
    }
  };

  const handleClearAllFruits = async () => {
    if (!currentUser) return;
    try {
      await db.clearAllFruitMaster(currentUser);
      success('Seluruh data buah bawaan telah dibersihkan! Anda dapat mulai menambahkan produk sendiri dari nol.');
      setIsClearMasterConfirmOpen(false);
      loadAllData();
    } catch (err: any) {
      toastError(err.message || 'Gagal mengosongkan master buah.');
    }
  };

  const handleResetDefaultFruits = async () => {
    if (!currentUser) return;
    try {
      await db.resetStockItemsToDefault(currentUser);
      success('Master buah berhasil dikembalikan ke daftar acuan standar.');
      setIsResetMasterConfirmOpen(false);
      loadAllData();
    } catch (err: any) {
      toastError(err.message || 'Gagal mereset master buah.');
    }
  };

  const handleDeleteInbound = async (item: StockInbound) => {
    if (!currentUser) return;
    try {
      await db.deleteStockInbound(item.id, currentUser);
      success(`Riwayat belanja ${item.fruit_name} dari ${item.supplier_name || 'supplier'} berhasil dihapus.`);
      setDeleteInboundConfirmItem(null);
      loadAllData();
    } catch (err: any) {
      toastError(err.message || 'Gagal menghapus riwayat belanja.');
    }
  };

  const handleDeleteCanvas = async (trip: CanvasTrip) => {
    if (!currentUser) return;
    try {
      await db.deleteCanvasTrip(trip.id, currentUser);
      success(`Riwayat canvas kurir ${trip.courier_name} berhasil dihapus.`);
      setDeleteCanvasConfirmItem(null);
      loadAllData();
    } catch (err: any) {
      toastError(err.message || 'Gagal menghapus riwayat canvas.');
    }
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'KULAKAN_MASUK':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'SUSUT_SORTIR':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'ORDER_KELUAR':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'CANVAS_BAWA':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'CANVAS_RETURN':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'PENYESUAIAN':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-5 space-y-3.5">
      {/* Top Banner Notice: Remittance is moved to Order & Antar */}
      {onNavigateToOrdersRemittance && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-950">
                Pusat Monitoring Kas &amp; Setoran Uang Kurir
              </p>
              <p className="text-[11px] text-amber-800 truncate">
                Penerimaan setoran uang tunai COD kurir &amp; omset canvas kini dikelola terpusat di menu <strong>Order Delivery</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToOrdersRemittance}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl font-bold text-xs shrink-0 shadow-2xs transition cursor-pointer"
          >
            <span>Buka Kas Kurir</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs text-xl">
            📦
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-tight">
              Inventory
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Belanja supplier &amp; sortir susut, alokasi canvas kurir, serta mutasi stok fisik harian.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsInboundModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>+ Belanja Supplier</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCanvasModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Truck className="w-4 h-4" />
            <span>+ Canvas Kurir</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedStockForEdit(null);
              setIsFruitModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-gray-600" />
            <span>+ Tambah Buah</span>
          </button>
        </div>
      </div>

      {/* Modern KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nilai Aset Stok</span>
            <span className="text-xs">💰</span>
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-700 font-mono">
            {formatRupiah(totalAssetValue)}
          </div>
          <p className="text-[10px] text-gray-400">Akumulasi HPP modal kulakan</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stok Gudang Utama</span>
            <span className="text-xs">🏢</span>
          </div>
          <div className="text-base sm:text-lg font-black text-gray-900">
            {totalStockKg.toFixed(1)} <span className="text-xs font-semibold text-gray-500">kg</span>
          </div>
          <p className="text-[10px] text-gray-400">{stockItems.length} komoditas buah aktif</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-blue-200/90 bg-blue-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Dibawa Canvas</span>
            <span className="text-xs">🚚</span>
          </div>
          <div className="text-base sm:text-lg font-black text-blue-900">
            {totalCanvasKg.toFixed(1)} <span className="text-xs font-semibold text-blue-700">kg</span>
          </div>
          <p className="text-[10px] text-blue-700 font-medium">{activeCanvasTrips} kurir sedang keliling</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-200/90 bg-amber-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Perlu Restock</span>
            <span className="text-xs">⚠️</span>
          </div>
          <div className="text-base sm:text-lg font-black text-amber-950">
            {lowStockCount} <span className="text-xs font-semibold text-amber-800">buah</span>
          </div>
          <p className="text-[10px] text-amber-800 font-medium">Stok &le; batas minimum</p>
        </div>
      </div>

      {/* Main Clean Tab Navigation */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar bg-gray-50/80 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'stock'
                ? 'bg-white text-emerald-800 shadow-2xs border border-gray-200/90'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
            }`}
          >
            <Boxes className="w-4 h-4 text-emerald-600" />
            <span>Katalog &amp; Stok Buah ({stockItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inbounds')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'inbounds'
                ? 'bg-white text-emerald-800 shadow-2xs border border-gray-200/90'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
            }`}
          >
            <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
            <span>Belanja Supplier ({inbounds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('canvas')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'canvas'
                ? 'bg-white text-blue-800 shadow-2xs border border-gray-200/90'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
            }`}
          >
            <Truck className="w-4 h-4 text-blue-600" />
            <span>
              Canvas Kurir ({canvasTrips.length})
              {activeCanvasTrips > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-600 text-white font-bold">
                  {activeCanvasTrips} aktif
                </span>
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'bg-white text-gray-900 shadow-2xs border border-gray-200/90'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
            }`}
          >
            <FileText className="w-4 h-4 text-gray-500" />
            <span>Buku Mutasi Audit</span>
          </button>
        </div>

        {/* TAB 1: Katalog & Stok Buah */}
        {activeTab === 'stock' && (
          <div className="p-3.5 sm:p-4 space-y-3.5">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative min-w-[200px] max-w-sm flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama buah..."
                    className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Status chips */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
                  <button
                    type="button"
                    onClick={() => setStockStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                      stockStatusFilter === 'all'
                        ? 'bg-gray-900 text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Semua ({stockItems.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockStatusFilter('safe')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 ${
                      stockStatusFilter === 'safe'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <span>🟢 Aman</span>
                    <span>({safeStockCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockStatusFilter('low')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 ${
                      stockStatusFilter === 'low'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    <span>🟡 Menipis</span>
                    <span>({lowStockCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockStatusFilter('out')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 ${
                      stockStatusFilter === 'out'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                    }`}
                  >
                    <span>🔴 Habis</span>
                    <span>({outOfStockCount})</span>
                  </button>
                </div>
              </div>

              {/* View mode toggle & Refresh */}
              <div className="flex items-center gap-2 justify-end">
                <div className="inline-flex rounded-xl bg-gray-100 p-0.5 border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setStockViewMode('grid')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      stockViewMode === 'grid'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Kartu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockViewMode('table')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      stockViewMode === 'table'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Tabel</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={loadAllData}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                  title="Muat Ulang"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List / Grid of Stocks */}
            {isLoading ? (
              <div className="py-12 text-center text-xs text-gray-400">
                Memuat data stok gudang...
              </div>
            ) : filteredStocks.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <p className="text-sm font-semibold text-gray-700">Tidak ada komoditas buah yang cocok</p>
                <p className="text-xs text-gray-400">Coba ubah kata kunci pencarian atau filter status.</p>
              </div>
            ) : stockViewMode === 'grid' ? (
              /* MODERN SLEEK CARD VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredStocks.map((item) => {
                  const isLow = item.current_stock <= (item.min_stock_alert || 10) && item.current_stock > 0;
                  const isOut = item.current_stock <= 0;
                  const cost = item.avg_cost_price || 0;
                  const price = item.latest_selling_price || 0;
                  const marginNominal = price - cost;

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-200/90 rounded-2xl p-3.5 space-y-3 shadow-2xs hover:shadow-xs transition"
                    >
                      {/* Top Header: Emoji, Name, Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl p-1 bg-gray-50 rounded-xl border border-gray-100 shrink-0">
                            {item.emoji || '🍎'}
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 truncate">
                              {item.fruit_name}
                            </h3>
                            <span className="text-[10px] text-gray-400 font-medium">
                              Satuan: {item.unit} &bull; Min: {item.min_stock_alert || 10} {item.unit}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isOut
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isOut ? 'Habis' : isLow ? 'Menipis' : 'Aman'}
                        </span>
                      </div>

                      {/* Stock Counts */}
                      <div className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase block">Stok Siap Jual</span>
                          <span
                            className={`text-lg font-black font-mono ${
                              isOut ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            {item.current_stock}{' '}
                            <span className="text-xs font-semibold text-gray-600">{item.unit}</span>
                          </span>
                        </div>

                        {item.canvas_allocated_stock > 0 && (
                          <div className="text-right">
                            <span className="text-[9px] font-bold text-blue-800 uppercase block">Di Kurir Canvas</span>
                            <span className="font-mono font-bold text-xs text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded-md">
                              {item.canvas_allocated_stock} {item.unit}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Financial info: HPP & Price */}
                      <div className="flex items-center justify-between text-xs text-gray-600 pt-0.5 px-0.5">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-medium">Modal (HPP):</span>
                          <span className="font-mono font-bold text-gray-800">{formatRupiah(cost)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 block font-medium">Harga Acuan:</span>
                          <span className="font-mono font-black text-emerald-700">{formatRupiah(price)}</span>
                        </div>
                      </div>

                      {/* Quick action footer */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedStockForAdjust(item)}
                          className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                          title="Penyesuaian stok opname fisik"
                        >
                          <Scale className="w-3.5 h-3.5 text-amber-700" />
                          <span>Opname</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStockForEdit(item);
                            setIsFruitModalOpen(true);
                          }}
                          className="py-1.5 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          title="Edit nama, modal, harga jual"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteFruitConfirmItem(item)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Hapus dari katalog"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* MODERN TABLE VIEW */
              <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3">Komoditas &amp; Satuan</th>
                      <th className="py-2.5 px-3 text-center">Stok Gudang</th>
                      <th className="py-2.5 px-3 text-center">Di Canvas</th>
                      <th className="py-2.5 px-3 text-right">Modal (HPP)</th>
                      <th className="py-2.5 px-3 text-right">Harga Jual</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredStocks.map((item) => {
                      const isLow = item.current_stock <= (item.min_stock_alert || 10) && item.current_stock > 0;
                      const isOut = item.current_stock <= 0;

                      return (
                        <tr key={item.id} className="hover:bg-gray-50/70 transition">
                          <td className="py-2.5 px-3 font-semibold text-gray-900 flex items-center gap-2">
                            <span>{item.emoji || '🍎'}</span>
                            <span>{item.fruit_name}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-sm">
                            <span className={isOut ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-emerald-700'}>
                              {item.current_stock}
                            </span>{' '}
                            <span className="text-gray-400 font-normal text-[11px]">{item.unit}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-gray-600">
                            {item.canvas_allocated_stock > 0 ? (
                              <span className="font-bold text-blue-700">{item.canvas_allocated_stock} {item.unit}</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-gray-600">
                            {formatRupiah(item.avg_cost_price || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            {formatRupiah(item.latest_selling_price || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isOut
                                  ? 'bg-rose-100 text-rose-800'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isOut ? 'Habis' : isLow ? 'Menipis' : 'Aman'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedStockForAdjust(item)}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold"
                              >
                                Opname
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStockForEdit(item);
                                  setIsFruitModalOpen(true);
                                }}
                                className="p-1 text-gray-400 hover:text-blue-600 rounded-lg"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteFruitConfirmItem(item)}
                                className="p-1 text-gray-400 hover:text-rose-600 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Belanja Supplier (Inbound) */}
        {activeTab === 'inbounds' && (
          <div className="p-3.5 sm:p-4 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Riwayat Belanja Buah dari Supplier</h3>
                <p className="text-xs text-gray-500">Mencatat pembelian, timbangan susut/rusak saat sortir, dan net masuk stok</p>
              </div>
              <button
                type="button"
                onClick={() => setIsInboundModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat Belanja Baru</span>
              </button>
            </div>

            {inbounds.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 space-y-1">
                <p className="font-semibold text-gray-600">Belum ada riwayat belanja supplier tercatat.</p>
                <p>Klik tombol di atas untuk mencatat pembelian buah dan sortir gudang.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal &amp; Supplier</th>
                      <th className="py-2.5 px-3">Buah</th>
                      <th className="py-2.5 px-3 text-right">Timbang Beli</th>
                      <th className="py-2.5 px-3 text-right">Susut/Sortir</th>
                      <th className="py-2.5 px-3 text-right">Net Masuk Stok</th>
                      <th className="py-2.5 px-3 text-right">Total Biaya</th>
                      <th className="py-2.5 px-3 text-right">HPP Bersih</th>
                      <th className="py-2.5 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {inbounds.map((inb) => (
                      <tr key={inb.id} className="hover:bg-gray-50/70">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-gray-900">{inb.purchase_date}</div>
                          <div className="text-[11px] text-gray-500">{inb.supplier_name || 'Pasar Induk'}</div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-gray-900">{inb.fruit_name}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{inb.gross_purchase_qty} kg</td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                          {inb.shrinkage_qty > 0 ? `-${inb.shrinkage_qty} kg` : '0 kg'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          +{inb.net_stocked_qty} kg
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                          {formatRupiah(inb.total_purchase_amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-600">
                          {formatRupiah(inb.net_stocked_qty > 0 ? Math.round(inb.total_purchase_amount / inb.net_stocked_qty) : inb.purchase_price_per_unit)}/kg
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setDeleteInboundConfirmItem(inb)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                            title="Hapus riwayat belanja"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Canvas Kurir */}
        {activeTab === 'canvas' && (
          <div className="p-3.5 sm:p-4 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Canvas Kurir Keliling &amp; Rekonsiliasi Buah</h3>
                <p className="text-xs text-gray-500">Alokasikan stok buah yang dibawa keliling, pantau laku terjual, dan terima sisa buah ke gudang</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCanvasModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 transition"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>+ Berangkatkan Canvas</span>
                </button>
              </div>
            </div>

            {/* Canvas Financial & Qty Quick Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-blue-50/50 p-2.5 rounded-xl border border-blue-200/80 text-xs">
              <div>
                <span className="text-[10px] text-blue-700 font-medium block">Total Armada Canvas</span>
                <span className="font-bold text-blue-950 font-mono">{canvasTrips.length} trip ({activeCanvasTrips} aktif)</span>
              </div>
              <div>
                <span className="text-[10px] text-blue-700 font-medium block">Stok Sedang Dibawa</span>
                <span className="font-bold text-blue-950 font-mono">{totalCanvasKg.toFixed(1)} kg</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] text-emerald-700 font-bold block">Total Uang Penjualan Canvas</span>
                <span className="font-extrabold text-emerald-900 font-mono">
                  {formatRupiah(
                    canvasTrips
                      .filter((t) => t.status === 'Selesai & Rekonsiliasi')
                      .reduce((sum, t) => sum + (Number(t.actual_cash_submitted || t.total_expected_cash) || 0), 0)
                  )}
                </span>
              </div>
            </div>

            {canvasTrips.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 space-y-1">
                <p className="font-semibold text-gray-600">Belum ada kurir canvas yang ditugaskan.</p>
                <p>Klik tombol di atas untuk mengalokasikan stok buah yang dibawa armada keliling.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {canvasTrips.map((trip) => {
                  const isCompleted = trip.status === 'Selesai & Rekonsiliasi';
                  const totalBawa = trip.items.reduce((sum, it) => sum + it.brought_qty, 0);
                  const totalLaku = trip.items.reduce((sum, it) => sum + it.sold_qty, 0);
                  const totalSisa = trip.items.reduce((sum, it) => sum + it.returned_qty, 0);

                  return (
                    <div
                      key={trip.id}
                      className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 shadow-2xs hover:shadow-xs transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 text-sm">{trip.courier_name}</h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {trip.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Rute: {trip.notes || 'Armada Canvas Keliling'} &bull; {trip.trip_date}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setDeleteCanvasConfirmItem(trip)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                          title="Hapus Trip Canvas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Summary pills */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs bg-gray-50 p-2 rounded-xl">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-medium">Bawa</span>
                          <span className="font-mono font-bold text-gray-800">{totalBawa} kg</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block font-medium">Laku</span>
                          <span className="font-mono font-bold text-emerald-700">{totalLaku} kg</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block font-medium">Sisa Gudang</span>
                          <span className="font-mono font-bold text-blue-700">{totalSisa} kg</span>
                        </div>
                      </div>

                      {/* Items breakdown */}
                      <div className="space-y-1 text-xs">
                        {trip.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between py-0.5 border-b border-gray-50">
                            <span className="font-medium text-gray-700">{it.fruit_name}</span>
                            <span className="font-mono text-gray-500 text-[11px]">
                              Bawa: {it.brought_qty}kg &bull; Laku: {it.sold_qty}kg &bull; Sisa: {it.returned_qty}kg
                            </span>
                          </div>
                        ))}
                      </div>

                      {!isCompleted ? (
                        <button
                          type="button"
                          onClick={() => setSelectedCanvasForReconcile(trip)}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          Rekonsiliasi Sisa Buah &amp; Uang
                        </button>
                      ) : (
                        <div className="p-2 text-center text-xs bg-emerald-50 rounded-xl border border-emerald-200 space-y-0.5">
                          <div className="font-bold text-emerald-800">
                            ✓ Sisa buah telah dikembalikan ke stok gudang
                          </div>
                          {(trip.actual_cash_submitted > 0 || trip.total_expected_cash > 0) && (
                            <div className="text-[11px] text-emerald-700 font-semibold font-mono">
                              Uang Penjualan Diterima: {formatRupiah(trip.actual_cash_submitted || trip.total_expected_cash)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Buku Mutasi Audit */}
        {activeTab === 'logs' && (
          <div className="p-3.5 sm:p-4 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Buku Besar Mutasi Stok &amp; Riwayat Audit</h3>
                <p className="text-xs text-gray-500">Setiap keluar masuk barang, susut, order, dan canvas tercatat detail tanpa data hilang</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={fruitFilter}
                  onChange={(e) => setFruitFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-hidden"
                >
                  <option value="">Semua Komoditas Buah</option>
                  {stockItems.map((s) => (
                    <option key={s.id} value={s.fruit_name}>
                      {s.fruit_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                Belum ada catatan mutasi stok untuk filter ini.
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3">Waktu</th>
                      <th className="py-2.5 px-3">Komoditas Buah</th>
                      <th className="py-2.5 px-3 text-center">Tipe Mutasi</th>
                      <th className="py-2.5 px-3 text-right">Perubahan</th>
                      <th className="py-2.5 px-3 text-right">Stok Akhir</th>
                      <th className="py-2.5 px-3">Keterangan / Referensi</th>
                      <th className="py-2.5 px-3">Petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredLogs.slice(0, 100).map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/70">
                        <td className="py-2 px-3 text-gray-500 text-[11px] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2 px-3 font-semibold text-gray-900">{log.fruit_name}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getMovementBadge(log.type)}`}>
                            {log.type}
                          </span>
                        </td>
                        <td className={`py-2 px-3 text-right font-mono font-bold ${log.qty_change >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {log.qty_change > 0 ? `+${log.qty_change}` : log.qty_change} {log.unit}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                          {log.stock_after} {log.unit}
                        </td>
                        <td className="py-2 px-3 text-gray-600 max-w-xs truncate">{log.reference_note || '-'}</td>
                        <td className="py-2 px-3 text-gray-500 text-[11px]">{log.operator_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <StockInboundModal
        isOpen={isInboundModalOpen}
        onClose={() => setIsInboundModalOpen(false)}
        onSaved={loadAllData}
        fruits={quickFruits}
        profiles={profiles}
      />

      <CanvasTripModal
        isOpen={isCanvasModalOpen}
        onClose={() => setIsCanvasModalOpen(false)}
        onSaved={loadAllData}
        couriers={couriers}
        stockItems={stockItems}
      />

      <CanvasReconciliationModal
        isOpen={!!selectedCanvasForReconcile}
        onClose={() => setSelectedCanvasForReconcile(null)}
        trip={selectedCanvasForReconcile}
        onReconciled={loadAllData}
      />

      <StockAdjustmentModal
        isOpen={!!selectedStockForAdjust}
        onClose={() => setSelectedStockForAdjust(null)}
        stockItem={selectedStockForAdjust}
        onAdjusted={loadAllData}
      />

      <FruitMasterModal
        isOpen={isFruitModalOpen}
        onClose={() => {
          setIsFruitModalOpen(false);
          setSelectedStockForEdit(null);
        }}
        onSuccess={loadAllData}
        editItem={selectedStockForEdit}
      />

      {/* Delete Fruit Confirmation Modal */}
      {deleteFruitConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Hapus Buah dari Master?</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Yakin ingin menghapus komoditas <strong>{deleteFruitConfirmItem.fruit_name}</strong> ({deleteFruitConfirmItem.emoji}) dari katalog master data dan stok gudang?
                </p>
                <p className="text-[11px] text-amber-700 font-medium mt-1">
                  Stok saat ini: {deleteFruitConfirmItem.current_stock} {deleteFruitConfirmItem.unit}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteFruitConfirmItem(null)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFruit(deleteFruitConfirmItem)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                Ya, Hapus Buah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Inbound Confirmation Modal */}
      {deleteInboundConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Hapus Riwayat Belanja?</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Hapus transaksi kulakan <strong>{deleteInboundConfirmItem.fruit_name}</strong> dari <strong>{deleteInboundConfirmItem.supplier_name || 'Supplier'}</strong> ({deleteInboundConfirmItem.gross_purchase_qty} kg)?
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Catatan: Stok gudang saat ini tidak akan otomatis terpotong.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteInboundConfirmItem(null)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteInbound(deleteInboundConfirmItem)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                Ya, Hapus Belanja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Canvas Confirmation Modal */}
      {deleteCanvasConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Hapus Riwayat Canvas?</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Hapus riwayat penugasan canvas armada kurir <strong>{deleteCanvasConfirmItem.courier_name}</strong> tanggal {deleteCanvasConfirmItem.trip_date}?
                </p>
                <p className="text-[11px] text-amber-700 font-medium mt-1">
                  Status: {deleteCanvasConfirmItem.status}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteCanvasConfirmItem(null)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCanvas(deleteCanvasConfirmItem)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                Ya, Hapus Canvas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Fruit Confirmation Modal */}
      {isClearMasterConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Kosongkan Master Buah?</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Aksi ini akan menghapus seluruh daftar buah bawaan sistem, sehingga Anda dapat memasukkan nama-nama komoditas buah toko Anda sendiri dari awal (nol).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsClearMasterConfirmOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClearAllFruits}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                Kosongkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Default Fruit Confirmation Modal */}
      {isResetMasterConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Reset ke Buah Standar?</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Memuat kembali daftar komoditas buah acuan standar ke dalam master katalog.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsResetMasterConfirmOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetDefaultFruits}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
              >
                Ya, Muat Standar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
