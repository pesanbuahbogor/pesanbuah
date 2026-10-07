import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  ShoppingBag,
  DollarSign,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { QuickFruitItem } from '../types';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { formatRupiah } from '../lib/orderScheduleUtils';

interface ManageFruitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFruitsUpdated?: () => void;
}

const COMMON_EMOJIS = ['🍊', '🍌', '🍋', '🍉', '🍈', '🥑', '🍎', '🥭', '🍇', '🍍', '🍓', '🥥', '🥝', '🍐', '🍑', '🍒'];
const COMMON_UNITS = ['kg', 'dus', 'pack', 'ikat', 'pcs', 'karung', 'keranjang'];

export const ManageFruitsModal: React.FC<ManageFruitsModalProps> = ({
  isOpen,
  onClose,
  onFruitsUpdated,
}) => {
  const { currentUser, isOwner, isManager } = useAuth();
  const { success, error: toastError } = useToast();

  const [fruits, setFruits] = useState<QuickFruitItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states (Add / Edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [price, setPrice] = useState<number | ''>(0);
  const [emoji, setEmoji] = useState('🍊');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadFruits = async () => {
    setIsLoading(true);
    try {
      const data = await db.getQuickFruits();
      setFruits(data);
    } catch (err: any) {
      toastError(err.message || 'Gagal memuat daftar buah.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFruits();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setUnit('kg');
    setPrice('');
    setEmoji('🍊');
    setIsActive(true);
  };

  const handleStartEdit = (item: QuickFruitItem) => {
    setEditingId(item.id);
    setName(item.name);
    setUnit(item.unit);
    setPrice(item.price);
    setEmoji(item.emoji || '🍊');
    setIsActive(item.is_active !== false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!name.trim()) {
      toastError('Nama buah wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await db.updateQuickFruit(
          editingId,
          {
            name: name.trim(),
            unit: unit.trim(),
            price: Number(price) || 0,
            emoji: emoji || '🍊',
            is_active: isActive,
          },
          currentUser
        );
        success(`Item buah "${name}" berhasil diperbarui.`);
      } else {
        await db.createQuickFruit(
          {
            name: name.trim(),
            unit: unit.trim(),
            price: Number(price) || 0,
            emoji: emoji || '🍊',
            is_active: isActive,
          },
          currentUser
        );
        success(`Buah baru "${name}" berhasil ditambahkan ke katalog.`);
      }

      resetForm();
      await loadFruits();
      if (onFruitsUpdated) onFruitsUpdated();
    } catch (err: any) {
      toastError(err.message || 'Gagal menyimpan item buah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) return;
    try {
      await db.deleteQuickFruit(id, currentUser);
      success('Item buah berhasil dihapus dari katalog.');
      setDeleteConfirmId(null);
      await loadFruits();
      if (onFruitsUpdated) onFruitsUpdated();
    } catch (err: any) {
      toastError(err.message || 'Gagal menghapus buah.');
    }
  };

  const handleResetToDefault = async () => {
    if (!currentUser || !isOwner) return;
    if (!window.confirm('Kembalikan katalog buah cepat ke daftar bawaan sistem?')) return;
    try {
      await db.resetQuickFruitsToDefault(currentUser);
      success('Daftar buah berhasil direset ke bawaan.');
      await loadFruits();
      if (onFruitsUpdated) onFruitsUpdated();
    } catch (err: any) {
      toastError(err.message || 'Gagal mereset.');
    }
  };

  const handleToggleActive = async (item: QuickFruitItem) => {
    if (!currentUser) return;
    try {
      const updated = !item.is_active;
      await db.updateQuickFruit(item.id, { is_active: updated }, currentUser);
      setFruits((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, is_active: updated } : f))
      );
      if (onFruitsUpdated) onFruitsUpdated();
    } catch (err: any) {
      toastError('Gagal mengubah status aktif.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Kelola Katalog & Pilih Cepat Buah
              </h2>
              <p className="text-xs text-emerald-100">
                Atur sendiri produk buah, satuan, dan harga acuan yang Anda jual di PesanBuah.id
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Form Tambah / Edit */}
          <form
            onSubmit={handleSave}
            className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase flex items-center gap-1.5">
                {editingId ? (
                  <>
                    <Edit2 className="w-3.5 h-3.5 text-emerald-700" />
                    Edit Item Buah
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 text-emerald-700" />
                    Tambah Buah Baru ke Katalog Saya
                  </>
                )}
              </span>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-gray-500 hover:text-gray-700 underline cursor-pointer"
                >
                  Batal Edit
                </button>
              )}
            </div>

            {/* Emoji Selector Chips */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Ikon / Emoji Buah:
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {COMMON_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm transition cursor-pointer shrink-0 ${
                      emoji === e
                        ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400'
                        : 'bg-white hover:bg-emerald-100 border border-gray-200'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs: Nama, Satuan, Harga */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Nama Buah / Produk *
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-sm select-none">
                    {emoji}
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Jeruk Siam Madu"
                    className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Satuan Jual
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                >
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Harga Satuan Acuan (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={price === '' ? '' : price}
                  onChange={(e) =>
                    setPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="Contoh: 28000"
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden text-right"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                Tampilkan di tombol pilih cepat order
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {editingId ? 'Simpan Perubahan' : 'Tambahkan ke Katalog'}
              </button>
            </div>
          </form>

          {/* List Buah Saat Ini */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 uppercase flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                Daftar Buah Saya ({fruits.length} item)
              </span>
              {isOwner && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-amber-700 transition cursor-pointer"
                  title="Kembalikan ke daftar bawaan"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset ke Bawaan
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-gray-400">
                Memuat katalog buah...
              </div>
            ) : fruits.length === 0 ? (
              <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-500 space-y-1">
                <p>Belum ada produk buah yang didaftarkan.</p>
                <p className="text-[11px] text-gray-400">
                  Gunakan formulir di atas untuk menambahkan buah yang Anda jual.
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white">
                {fruits.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2.5 sm:px-3 sm:py-2.5 flex items-center justify-between gap-2 transition hover:bg-gray-50 ${
                      !item.is_active ? 'opacity-50 bg-gray-50/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-xl shrink-0 select-none">
                        {item.emoji || '🍊'}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-gray-900 truncate">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded">
                            /{item.unit}
                          </span>
                          {!item.is_active && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded">
                              Non-aktif
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-emerald-700 font-bold mt-0.5">
                          {formatRupiah(item.price)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg transition cursor-pointer border ${
                          item.is_active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                        }`}
                        title={item.is_active ? 'Klik untuk sembunyikan' : 'Klik untuk tampilkan'}
                      >
                        {item.is_active ? 'Aktif' : 'Disembunyikan'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                        title="Edit Buah Ini"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {deleteConfirmId === item.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg border border-rose-200">
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-bold px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            Ya
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-[10px] text-gray-500 hover:text-gray-800 px-1 py-0.5 cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Buah Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Perubahan langsung tersimpan ke sistem order & muter lapangan.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
