import React, { useState, useEffect, useMemo } from 'react';
import {
  Prospect,
  BusinessType,
  Zone,
  Profile,
  ProspectStatus,
} from '../types';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { getSupabase, subscribeToRealtime } from '../lib/supabase';
import {
  Search,
  Filter,
  UserPlus,
  RotateCcw,
  MapPin,
  Phone,
  MessageSquare,
  Building,
  CheckCircle2,
  Clock,
  Briefcase,
  XCircle,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  ExternalLink,
  Radio,
  AlertCircle,
  ShoppingBag,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { ProspectFormModal } from '../components/ProspectFormModal';
import { ProspectDetailModal } from '../components/ProspectDetailModal';
import { ProspectImportModal } from '../components/ProspectImportModal';
import { exportProspectsToCsv, exportProspectsToXls } from '../lib/exportUtils';

interface ProspectsPageProps {
  initialStatusFilter?: ProspectStatus;
  isCreateOpenInitially?: boolean;
}

export const ProspectsPage: React.FC<ProspectsPageProps> = ({
  initialStatusFilter,
  isCreateOpenInitially = false,
}) => {
  const { currentUser, isOwner, isManager, isSales } = useAuth();
  const { success, error: toastError } = useToast();

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterSales, setFilterSales] = useState('');
  const [filterBusinessType, setFilterBusinessType] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>(initialStatusFilter || '');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(isCreateOpenInitially);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [selectedProspectDetail, setSelectedProspectDetail] = useState<Prospect | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deleteConfirmProspect, setDeleteConfirmProspect] = useState<Prospect | null>(null);
  const [isDeletingDirect, setIsDeletingDirect] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const loadAllData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [prospectsData, typesData, zonesData, profilesData] = await Promise.all([
        db.getProspects(currentUser),
        db.getBusinessTypes(),
        db.getZones(),
        db.getProfiles(),
      ]);
      setProspects(prospectsData);
      setBusinessTypes(typesData);
      setZones(zonesData);
      setProfiles(profilesData);
    } catch (err: any) {
      const errMsg = err?.message || 'Gagal memuat data dari database.';
      setLoadError(errMsg);
      toastError(errMsg);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [currentUser]);

  // Real-time synchronization: update list instantly whenever any field team changes prospects
  useEffect(() => {
    const unsubProspects = subscribeToRealtime('prospects', () => {
      loadAllData();
    });
    const unsubZones = subscribeToRealtime('zones', () => {
      loadAllData();
    });
    const unsubTypes = subscribeToRealtime('business_types', () => {
      loadAllData();
    });

    return () => {
      unsubProspects();
      unsubZones();
      unsubTypes();
    };
  }, []);

  // Maps for quick lookup
  const businessTypeMap = useMemo(() => new Map(businessTypes.map((t) => [t.id, t.name])), [businessTypes]);
  const zoneMap = useMemo(() => new Map(zones.map((z) => [z.id, z.name])), [zones]);
  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.id, p.name])), [profiles]);

  // Filtered prospects based on search & filters (Section 11)
  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      // 1. Search filter: Nama Usaha, Nama PIC, No HP/WA, Alamat, Potensial Kebutuhan
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = p.business_name.toLowerCase().includes(query);
        const matchPic = p.pic_name.toLowerCase().includes(query);
        const matchPhone = p.phone.toLowerCase().includes(query);
        const matchAddress = p.address.toLowerCase().includes(query);
        const matchPotential = p.potential_needs ? p.potential_needs.toLowerCase().includes(query) : false;

        if (!matchName && !matchPic && !matchPhone && !matchAddress && !matchPotential) {
          return false;
        }
      }

      // 2. Zone Filter
      if (filterZone && p.zone_id !== filterZone) {
        return false;
      }

      // 3. Sales Filter
      if (filterSales && p.sales_id !== filterSales) {
        return false;
      }

      // 4. Business Type Filter
      if (filterBusinessType && p.business_type_id !== filterBusinessType) {
        return false;
      }

      // 5. Status Filter
      if (filterStatus && p.status !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [prospects, searchQuery, filterZone, filterSales, filterBusinessType, filterStatus]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterZone('');
    setFilterSales('');
    setFilterBusinessType('');
    setFilterStatus('');
  };

  const hasActiveFilters = !!(
    searchQuery ||
    filterZone ||
    filterSales ||
    filterBusinessType ||
    filterStatus
  );

  const getStatusBadge = (st: ProspectStatus) => {
    switch (st) {
      case 'Customer':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Follow Up':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Tidak Jadi':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  // Permissions: Only Owner and Manager can delete prospect
  const canDeleteProspect = isOwner || isManager;

  const handleOpenDetail = (p: Prospect) => {
    setSelectedProspectDetail(p);
    setIsDetailModalOpen(true);
  };

  const handleOpenEdit = (p: Prospect) => {
    setEditingProspect(p);
    setIsDetailModalOpen(false);
    setIsFormModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingProspect(null);
    setIsFormModalOpen(true);
  };

  const handleDeleteDirect = async () => {
    if (!deleteConfirmProspect || !currentUser) return;
    if (!canDeleteProspect) {
      toastError('Akses Ditolak: Hanya Manager dan Owner yang berhak menghapus data.');
      return;
    }

    setIsDeletingDirect(true);
    try {
      await db.deleteProspect(deleteConfirmProspect.id, currentUser);
      success(`Calon customer "${deleteConfirmProspect.business_name}" berhasil dihapus.`);
      setDeleteConfirmProspect(null);
      loadAllData();
    } catch (err: any) {
      toastError(err?.message || 'Gagal menghapus data calon customer.');
    } finally {
      setIsDeletingDirect(false);
    }
  };

  const handleExportCsv = (filteredOnly = false) => {
    const dataToExport = filteredOnly ? filteredProspects : prospects;
    if (dataToExport.length === 0) {
      toastError('Tidak ada data calon customer untuk diekspor.');
      return;
    }
    exportProspectsToCsv(dataToExport, {
      businessTypeMap,
      zoneMap,
      profileMap,
    });
    success(`Berhasil mengunduh ${dataToExport.length} data dalam format CSV.`);
    setIsExportMenuOpen(false);
  };

  const handleExportXls = (filteredOnly = false) => {
    const dataToExport = filteredOnly ? filteredProspects : prospects;
    if (dataToExport.length === 0) {
      toastError('Tidak ada data calon customer untuk diekspor.');
      return;
    }
    exportProspectsToXls(dataToExport, {
      businessTypeMap,
      zoneMap,
      profileMap,
    });
    success(`Berhasil mengunduh ${dataToExport.length} data dalam format XLS (Excel).`);
    setIsExportMenuOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-3">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Database Calon Customer (Prospect)
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              {filteredProspects.length} Data
            </span>
            {getSupabase() ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <Radio className="w-2.5 h-2.5 text-emerald-600" />
                Realtime Cloud
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                Penyimpanan Lokal
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Mencatat, mengelola, mencari, dan memantau calon customer PesanBuah.id secara akurat.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Import CSV Button - Available to Owner and Manager for backup/restore & server migration */}
          {canDeleteProspect && (
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              title="Import Data Calon Customer dari File CSV (Restore / Migrasi Server)"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Import CSV</span>
            </button>
          )}

          {/* Export Data Button - Exclusively for Owner (and Manager if needed) */}
          {isOwner && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                title="Ekspor Data Calon Customer (CSV / Excel XLS)"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Data</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {isExportMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsExportMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95">
                    <div className="px-2.5 py-1.5 border-b border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Pilihan Format Export (Owner)
                      </p>
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        {hasActiveFilters ? (
                          <span>
                            Menyaring <strong>{filteredProspects.length}</strong> dari {prospects.length} data
                          </span>
                        ) : (
                          <span>Total <strong>{prospects.length}</strong> data tersimpan</span>
                        )}
                      </p>
                    </div>

                    {/* XLS (Excel) Option */}
                    <button
                      type="button"
                      onClick={() => handleExportXls(hasActiveFilters)}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-emerald-50 text-gray-800 hover:text-emerald-900 transition flex items-start gap-2.5 cursor-pointer group"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200 shrink-0 mt-0.5">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold flex items-center gap-1">
                          <span>Export Excel (.XLS)</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                            Rekomendasi
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Format tabel rapi, warna status, siap dibuka di Microsoft Excel / LibreOffice
                        </p>
                      </div>
                    </button>

                    {/* CSV Option */}
                    <button
                      type="button"
                      onClick={() => handleExportCsv(hasActiveFilters)}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-blue-50 text-gray-800 hover:text-blue-900 transition flex items-start gap-2.5 cursor-pointer group"
                    >
                      <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-200 shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold">Export CSV (.CSV)</div>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Format teks UTF-8 murni, cocok untuk import sistem lain atau spreadsheet
                        </p>
                      </div>
                    </button>

                    {hasActiveFilters && (
                      <div className="pt-1.5 border-t border-gray-100 px-2 flex flex-col gap-1">
                        <p className="text-[9px] text-gray-400">Atau ekspor seluruh database:</p>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleExportXls(false)}
                            className="flex-1 py-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition text-center cursor-pointer"
                          >
                            Semua XLS ({prospects.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExportCsv(false)}
                            className="flex-1 py-1 text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition text-center cursor-pointer"
                          >
                            Semua CSV ({prospects.length})
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Tambah Calon Customer
          </button>
        </div>
      </div>

      {/* Database Error Banner if Supabase query fails */}
      {loadError && (
        <div className="p-3 sm:p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-bold">Gagal Mengakses Database Supabase</p>
            <p className="text-[11px] text-rose-800">{loadError}</p>
            <p className="text-[10px] text-rose-600">
              Tips: Jika tabel belum dibuat di Supabase, silakan buka menu <strong>Supabase Connected</strong> (Owner) &gt; tab <strong>Skrip SQL Schema &amp; RLS</strong>, salin kodenya, dan jalankan di Supabase SQL Editor.
            </p>
          </div>
          <button
            onClick={() => loadAllData()}
            className="px-2.5 py-1 bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg shrink-0 transition"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* SEARCH & FILTERS BOX (Section 11) */}
      <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-2.5">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Nama Usaha, PIC, No. HP, Alamat, atau Kebutuhan (sawi, toge, mie, santan)..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Status Filter */}
          <div>
            <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
              Filter Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
            >
              <option value="">Semua Status</option>
              <option value="Prospect">Prospect</option>
              <option value="Follow Up">Follow Up</option>
              <option value="Customer">Customer</option>
              <option value="Tidak Jadi">Tidak Jadi</option>
            </select>
          </div>

          {/* Zone Filter */}
          <div>
            <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
              Filter Zone
            </label>
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
            >
              <option value="">Semua Zone</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sales Filter (Only for Owner/Manager or seeing options) */}
          <div>
            <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
              Filter Sales
            </label>
            <select
              value={filterSales}
              onChange={(e) => setFilterSales(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
            >
              <option value="">Semua Sales</option>
              {profiles
                .filter((p) => p.role === 'Sales')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Business Type Filter */}
          <div>
            <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
              Filter Jenis Usaha
            </label>
            <select
              value={filterBusinessType}
              onChange={(e) => setFilterBusinessType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
            >
              <option value="">Semua Jenis Usaha</option>
              {businessTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <div className="flex justify-end pt-0.5">
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 font-semibold rounded-md transition"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* PROSPECT LIST */}
      {isLoading ? (
        <div className="p-8 text-center text-gray-400">
          <div className="inline-block animate-spin text-emerald-600 mb-2">⟳</div>
          <p className="text-xs">Memuat data calon customer dari database...</p>
        </div>
      ) : filteredProspects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-2.5">
          <Briefcase className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-800 text-sm">Tidak Ada Data Calon Customer</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {hasActiveFilters
              ? 'Tidak ada hasil yang sesuai dengan kata kunci pencarian atau filter yang dipilih.'
              : 'Belum ada data calon customer tersimpan di sistem. Tambahkan data pertama sekarang!'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition cursor-pointer"
            >
              Reset Filter
            </button>
          ) : (
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
            >
              + Tambah Calon Customer
            </button>
          )}
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW (Visible on tablet & desktop) */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Nama Usaha / PIC</th>
                    <th className="py-2.5 px-3">Jenis Usaha</th>
                    <th className="py-2.5 px-3">Kontak (HP/WA)</th>
                    <th className="py-2.5 px-3">Zone</th>
                    <th className="py-2.5 px-3">Sales PIC</th>
                    <th className="py-2.5 px-3">GPS</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProspects.map((p) => {
                    const hasGps = p.latitude != null && p.longitude != null;
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-gray-50/80 transition group cursor-pointer"
                        onClick={() => handleOpenDetail(p)}
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-gray-900 text-xs">{p.business_name}</div>
                          <div className="text-[11px] text-gray-500">PIC: {p.pic_name}</div>
                          {p.potential_needs && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-800 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 max-w-[200px] truncate" title={`Potensial Kebutuhan: ${p.potential_needs}`}>
                              <ShoppingBag className="w-2.5 h-2.5 shrink-0 text-emerald-600" />
                              <span className="truncate">{p.potential_needs}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-xs font-medium text-gray-700">
                          {businessTypeMap.get(p.business_type_id) || 'Lainnya'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-xs text-gray-900 font-semibold">
                            {p.phone}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-600">
                          {p.zone_id ? zoneMap.get(p.zone_id) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-xs font-medium text-emerald-800">
                          {p.sales_id ? profileMap.get(p.sales_id) : 'Belum diassign'}
                        </td>
                        <td className="py-2.5 px-3">
                          {hasGps ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <MapPin className="w-2.5 h-2.5" /> Ada GPS
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                              p.status
                            )}`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenDetail(p)}
                              title="Lihat Detail"
                              className="p-1 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              title="Edit"
                              className="p-1 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {canDeleteProspect && (
                              <button
                                onClick={() => setDeleteConfirmProspect(p)}
                                title="Hapus Data (Khusus Manager/Owner)"
                                className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS VIEW (Optimized for Smartphone in the field!) */}
          <div className="grid grid-cols-1 gap-2.5 md:hidden">
            {filteredProspects.map((p) => {
              const hasGps = p.latitude != null && p.longitude != null;
              return (
                <div
                  key={p.id}
                  onClick={() => handleOpenDetail(p)}
                  className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs hover:border-emerald-300 transition space-y-2 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight">
                        {p.business_name}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        PIC: <span className="font-semibold text-gray-700">{p.pic_name}</span> &bull;{' '}
                        {businessTypeMap.get(p.business_type_id) || 'Lainnya'}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${getStatusBadge(
                        p.status
                      )}`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-600 space-y-1 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="font-mono font-bold text-gray-900">{p.phone}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-gray-500">
                      <Building className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{p.address}</span>
                    </div>
                    {p.potential_needs && (
                      <div className="flex items-start gap-1.5 text-emerald-800 pt-1 border-t border-gray-200/60 font-medium">
                        <ShoppingBag className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1 text-[10px]">
                          <strong>Potensi:</strong> {p.potential_needs}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[11px] text-gray-500">
                    <span className="truncate max-w-[150px]">
                      Zone: {p.zone_id ? zoneMap.get(p.zone_id) : '-'}
                    </span>
                    <div className="flex items-center gap-2">
                      {hasGps && (
                        <span className="inline-flex items-center gap-1 text-[9px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md">
                          <MapPin className="w-2.5 h-2.5" /> GPS
                        </span>
                      )}
                      {canDeleteProspect && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmProspect(p);
                          }}
                          title="Hapus Calon Customer"
                          className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="text-emerald-700 font-bold flex items-center gap-0.5 text-xs">
                        Detail <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Form Modal (Add / Edit) */}
      <ProspectFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={loadAllData}
        editProspect={editingProspect}
        businessTypes={businessTypes}
        zones={zones}
        salesList={profiles.filter((p) => p.role === 'Sales')}
      />

      {/* Detail Modal */}
      <ProspectDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        prospect={selectedProspectDetail}
        onEdit={handleOpenEdit}
        onDeleteSuccess={loadAllData}
        onStatusChanged={loadAllData}
        businessTypes={businessTypes}
        zones={zones}
        profiles={profiles}
      />

      {/* Import Modal */}
      <ProspectImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false);
          loadAllData();
        }}
        businessTypes={businessTypes}
        zones={zones}
        profiles={profiles}
        existingProspects={prospects}
      />

      {/* Direct Delete Confirmation Modal (Manager/Owner Only) */}
      {deleteConfirmProspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-gray-900 text-sm">Hapus Data Calon Customer?</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Apakah Anda yakin ingin menghapus data usaha{' '}
                  <strong className="text-gray-900 font-bold">
                    "{deleteConfirmProspect.business_name}"
                  </strong>{' '}
                  (PIC: {deleteConfirmProspect.pic_name})?
                </p>
                <p className="text-[11px] text-rose-600 font-medium mt-1">
                  Tindakan ini permanen dan hanya dapat dilakukan oleh Manager / Owner.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmProspect(null)}
                disabled={isDeletingDirect}
                className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteDirect}
                disabled={isDeletingDirect}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeletingDirect ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
