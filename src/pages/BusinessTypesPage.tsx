import React, { useState, useEffect } from 'react';
import { BusinessType } from '../types';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { subscribeToRealtime } from '../lib/supabase';
import { Tag, Plus, Edit2, Trash2, X, ShieldAlert, Loader2, AlertTriangle } from 'lucide-react';

export const BusinessTypesPage: React.FC = () => {
  const { currentUser, isOwner, isManager } = useAuth();
  const { success, error: toastError } = useToast();

  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<BusinessType | null>(null);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal
  const [deleteConfirmType, setDeleteConfirmType] = useState<BusinessType | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const types = await db.getBusinessTypes();
      setBusinessTypes(types);
    } catch (err) {
      toastError('Gagal memuat daftar jenis usaha.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToRealtime('business_types', () => {
      loadData();
    });
    return () => unsub();
  }, []);

  // Access control
  if (!isOwner && !isManager) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Akses Terbatas</h2>
        <p className="text-sm text-gray-500 mt-2">
          Hanya Owner dan Manager yang memiliki hak akses untuk mengelola data Jenis Usaha.
        </p>
      </div>
    );
  }

  const handleOpenAdd = () => {
    setEditingType(null);
    setName('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (type: BusinessType) => {
    setEditingType(type);
    setName(type.name);
    setIsActive(type.active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError('Nama Jenis Usaha tidak boleh kosong.');
      return;
    }
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      if (editingType) {
        await db.updateBusinessType(editingType.id, { name, active: isActive }, currentUser.role);
        success('Jenis Usaha berhasil diperbarui.');
      } else {
        await db.createBusinessType(name, currentUser.role);
        success('Jenis Usaha baru berhasil ditambahkan.');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Gagal menyimpan Jenis Usaha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (type: BusinessType) => {
    if (!currentUser) return;
    try {
      await db.deleteBusinessType(type.id, currentUser.role);
      success(`Jenis Usaha "${type.name}" berhasil dihapus.`);
      setDeleteConfirmType(null);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Gagal menghapus Jenis Usaha.');
    }
  };

  const handleToggleActive = async (type: BusinessType) => {
    if (!currentUser) return;
    try {
      await db.updateBusinessType(type.id, { active: !type.active }, currentUser.role);
      success(`Status Jenis Usaha berhasil diubah menjadi: ${!type.active ? 'Aktif' : 'Nonaktif'}`);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Gagal mengubah status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Pengelolaan Jenis Usaha
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              {businessTypes.length} Jenis Usaha
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Kategori target pasar calon customer (Cafe, Restoran, Hotel, Juice Bar, Bakery, dll).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Jenis Usaha
        </button>
      </div>

      {/* Grid of Business Types */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-xs">Memuat jenis usaha...</p>
        </div>
      ) : businessTypes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
          <Tag className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-800 text-base">Belum Ada Jenis Usaha</h3>
          <p className="text-xs text-gray-500">Mulai tambahkan jenis usaha untuk klasifikasi calon customer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {businessTypes.map((type) => (
            <div
              key={type.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs transition flex flex-col justify-between ${
                type.active ? 'border-gray-200' : 'border-gray-200 bg-gray-50/70 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                      type.active
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-gray-200 text-gray-600 border-gray-300'
                    }`}
                    onClick={() => handleToggleActive(type)}
                    title="Klik untuk ubah aktif/nonaktif"
                  >
                    {type.active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                  {type.name}
                </h3>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-1">
                <button
                  onClick={() => handleOpenEdit(type)}
                  className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  title="Edit Jenis Usaha"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => setDeleteConfirmType(type)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Hapus Jenis Usaha"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-emerald-600 text-white">
              <h3 className="font-bold text-base">
                {editingType ? 'Edit Jenis Usaha' : 'Tambah Jenis Usaha'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nama Jenis Usaha <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Bakery, Catering, Cafe"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-700">Status</span>
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

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
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
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-gray-900 text-base">Hapus Jenis Usaha</h3>
              <p className="text-xs text-gray-500 mt-1">
                Apakah Anda yakin ingin menghapus "{deleteConfirmType.name}"?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmType(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmType)}
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
