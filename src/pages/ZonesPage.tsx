import React, { useState, useEffect } from 'react';
import { Zone, Profile, ZoneMember } from '../types';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { subscribeToRealtime } from '../lib/supabase';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Users,
  ShieldAlert,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

export const ZonesPage: React.FC = () => {
  const { currentUser, isOwner, isManager } = useAuth();
  const { success, error: toastError } = useToast();

  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneMembers, setZoneMembers] = useState<ZoneMember[]>([]);
  const [salesProfiles, setSalesProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedSalesIds, setSelectedSalesIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirm
  const [deleteConfirmZone, setDeleteConfirmZone] = useState<Zone | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [zList, zmList, pList] = await Promise.all([
        db.getZones(),
        db.getZoneMembers(),
        db.getProfiles(),
      ]);
      setZones(zList);
      setZoneMembers(zmList);
      setSalesProfiles(pList.filter((p) => p.role === 'Sales'));
    } catch (err: any) {
      toastError('Gagal memuat data Zone.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToRealtime('zones', () => {
      loadData();
    });
    return () => unsub();
  }, []);

  // Access check: only Owner & Manager
  if (!isOwner && !isManager) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Akses Terbatas</h2>
        <p className="text-sm text-gray-500 mt-2">
          Hanya Owner dan Manager yang memiliki hak akses untuk mengelola data Zone.
        </p>
      </div>
    );
  }

  const handleOpenAdd = () => {
    setEditingZone(null);
    setZoneName('');
    setIsActive(true);
    setSelectedSalesIds([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (zone: Zone) => {
    setEditingZone(zone);
    setZoneName(zone.name);
    setIsActive(zone.active);
    const assigned = zoneMembers
      .filter((zm) => zm.zone_id === zone.id)
      .map((zm) => zm.user_id);
    setSelectedSalesIds(assigned);
    setIsModalOpen(true);
  };

  const handleToggleSalesSelect = (salesId: string) => {
    setSelectedSalesIds((prev) =>
      prev.includes(salesId) ? prev.filter((id) => id !== salesId) : [...prev, salesId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) {
      toastError('Nama Zone tidak boleh kosong.');
      return;
    }

    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      if (editingZone) {
        await db.updateZone(editingZone.id, { name: zoneName, active: isActive }, currentUser.role);
        await db.setZoneSales(editingZone.id, selectedSalesIds, currentUser.role);
        success('Zone berhasil diperbarui.');
      } else {
        const newZ = await db.createZone(zoneName, currentUser.role);
        if (selectedSalesIds.length > 0) {
          await db.setZoneSales(newZ.id, selectedSalesIds, currentUser.role);
        }
        success('Zone baru berhasil ditambahkan.');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Gagal menyimpan Zone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (zone: Zone) => {
    if (!currentUser) return;
    try {
      await db.deleteZone(zone.id, currentUser.role);
      success(`Zone "${zone.name}" berhasil dihapus.`);
      setDeleteConfirmZone(null);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Gagal menghapus Zone.');
    }
  };

  const handleToggleActive = async (zone: Zone) => {
    if (!currentUser) return;
    try {
      await db.updateZone(zone.id, { active: !zone.active }, currentUser.role);
      success(`Status Zone berhasil diubah menjadi: ${!zone.active ? 'Aktif' : 'Nonaktif'}`);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Gagal mengubah status Zone.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Pengelolaan Zone
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              {zones.length} Zone
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Zone wilayah dipilih secara manual oleh Sales/Manager (tidak ditentukan otomatis oleh GPS/radius).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Zone Baru
        </button>
      </div>

      {/* Grid of Zones */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-xs">Memuat daftar zone...</p>
        </div>
      ) : zones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-800 text-base">Belum Ada Zone</h3>
          <p className="text-xs text-gray-500">
            Mulai tambahkan Zone manual seperti "Zone 1 - Bogor Tengah", "Zone 2 - Sentul", dll.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
          >
            + Tambah Zone
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => {
            const assignedMembers = zoneMembers.filter((zm) => zm.zone_id === zone.id);
            const assignedSales = assignedMembers
              .map((zm) => salesProfiles.find((sp) => sp.id === zm.user_id))
              .filter(Boolean) as Profile[];

            return (
              <div
                key={zone.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition flex flex-col justify-between ${
                  zone.active ? 'border-gray-200' : 'border-gray-200 bg-gray-50/70 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-base leading-tight">
                        {zone.name}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleToggleActive(zone)}
                      title="Klik untuk ubah status aktif/nonaktif"
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                        zone.active
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                          : 'bg-gray-200 text-gray-600 border-gray-300 hover:bg-gray-300'
                      }`}
                    >
                      {zone.active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </div>

                  {/* Assigned Sales Chips */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      Sales yang Ditugaskan ({assignedSales.length}):
                    </span>

                    {assignedSales.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Belum ada sales diassign</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {assignedSales.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-200"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(zone)}
                    className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit & Assign Sales
                  </button>

                  <button
                    onClick={() => setDeleteConfirmZone(zone)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Hapus Zone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-emerald-600 text-white">
              <h3 className="font-bold text-lg">
                {editingZone ? 'Edit Zone' : 'Tambah Zone Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nama Zone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="Contoh: Zone 1 - Bogor Tengah & Pajajaran"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
                />
              </div>

              {/* Status Aktif */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-700">Status Zone</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-gray-200 text-gray-700 border-gray-300'
                  }`}
                >
                  {isActive ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>

              {/* Assign Sales to Zone (Multi Select) */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700 uppercase">
                  Assign Sales ke Zone ini:
                </label>
                <p className="text-[11px] text-gray-500">
                  Pilih sales yang beroperasi di wilayah ini.
                </p>

                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-200 rounded-xl p-2.5 bg-gray-50">
                  {salesProfiles.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2 text-center">
                      Belum ada akun sales terdaftar.
                    </p>
                  ) : (
                    salesProfiles.map((s) => {
                      const isSelected = selectedSalesIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleToggleSalesSelect(s.id)}
                          className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition ${
                            isSelected
                              ? 'bg-emerald-100 border border-emerald-300 text-emerald-900 font-semibold'
                              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          <span>{s.name} ({s.phone})</span>
                          {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-gray-900 text-base">Hapus Zone</h3>
              <p className="text-xs text-gray-500 mt-1">
                Apakah Anda yakin ingin menghapus "{deleteConfirmZone.name}"?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmZone(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmZone)}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
