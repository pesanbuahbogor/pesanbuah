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
} from 'lucide-react';
import { ProspectFormModal } from '../components/ProspectFormModal';
import { ProspectDetailModal } from '../components/ProspectDetailModal';

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

  const loadAllData = async () => {
    setIsLoading(true);
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
      toastError('Gagal memuat data calon customer.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [currentUser]);

  // Maps for quick lookup
  const businessTypeMap = useMemo(() => new Map(businessTypes.map((t) => [t.id, t.name])), [businessTypes]);
  const zoneMap = useMemo(() => new Map(zones.map((z) => [z.id, z.name])), [zones]);
  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.id, p.name])), [profiles]);

  // Filtered prospects based on search & filters (Section 11)
  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      // 1. Search filter: Nama Usaha, Nama PIC, No HP/WA, Alamat
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = p.business_name.toLowerCase().includes(query);
        const matchPic = p.pic_name.toLowerCase().includes(query);
        const matchPhone = p.phone.toLowerCase().includes(query);
        const matchAddress = p.address.toLowerCase().includes(query);

        if (!matchName && !matchPic && !matchPhone && !matchAddress) {
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

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-3">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Database Calon Customer (Prospect)
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              {filteredProspects.length} Data
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Mencatat, mengelola, mencari, dan memantau calon customer PesanBuah.id secara akurat.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Tambah Calon Customer
        </button>
      </div>

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
            placeholder="Cari Nama Usaha, PIC, No. HP / WA, atau Alamat..."
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
                              className="p-1 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              title="Edit"
                              className="p-1 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
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
    </div>
  );
};
