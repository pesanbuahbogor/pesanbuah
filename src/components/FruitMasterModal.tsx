import React, { useState, useEffect } from 'react';
import { X, Check, Boxes, Sparkles, Trash2 } from 'lucide-react';
import { StockItem } from '../types';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

interface FruitMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem?: StockItem | null;
}

const COMMON_FRUIT_EMOJIS = ['🍊', '🍎', '🍌', '🍉', '🥑', '🍇', '🍋', '🥭', '🍍', '🍓', '🍈', '🍑', '🥥', '🥝', '🍏', '🍐'];
const UNIT_OPTIONS = ['kg', 'dus', 'ikat', 'pack', 'pcs', 'karung', 'keranjang'];

export const FruitMasterModal: React.FC<FruitMasterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editItem,
}) => {
  const { currentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [fruitName, setFruitName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [initialStock, setInitialStock] = useState<number>(0);
  const [avgCostPrice, setAvgCostPrice] = useState<number>(0);
  const [latestSellingPrice, setLatestSellingPrice] = useState<number>(0);
  const [minStockAlert, setMinStockAlert] = useState<number>(10);
  const [emoji, setEmoji] = useState('🍊');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteThisFruit = async () => {
    if (!editItem || !currentUser) return;
    setIsDeleting(true);
    try {
      await db.deleteStockItem(editItem.id, currentUser);
      success(`Buah "${editItem.fruit_name}" berhasil dihapus dari master katalog.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Gagal menghapus buah.');
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setConfirmDelete(false);
      if (editItem) {
        setFruitName(editItem.fruit_name);
        setUnit(editItem.unit);
        setInitialStock(editItem.current_stock);
        setAvgCostPrice(editItem.avg_cost_price || 0);
        setLatestSellingPrice(editItem.latest_selling_price || 0);
        setMinStockAlert(editItem.min_stock_alert || 10);
        setEmoji(editItem.emoji || '🍊');
      } else {
        setFruitName('');
        setUnit('kg');
        setInitialStock(0);
        setAvgCostPrice(0);
        setLatestSellingPrice(0);
        setMinStockAlert(10);
        setEmoji('🍊');
      }
    }
  }, [isOpen, editItem]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fruitName.trim()) {
      toastError('Nama buah wajib diisi.');
      return;
    }
    if (!currentUser) {
      toastError('Sesi pengguna tidak aktif. Silakan pilih profil login terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editItem) {
        await db.updateStockItem(
          editItem.id,
          {
            fruit_name: fruitName.trim(),
            unit: unit.trim(),
            current_stock: Math.max(0, Number(initialStock) || 0),
            avg_cost_price: Number(avgCostPrice) || 0,
            latest_selling_price: Number(latestSellingPrice) || 0,
            min_stock_alert: Number(minStockAlert) || 0,
            emoji,
          },
          currentUser
        );
        success(`Data buah "${fruitName}" berhasil diperbarui!`);
      } else {
        await db.createStockItem(
          {
            fruit_name: fruitName.trim(),
            unit: unit.trim(),
            current_stock: Math.max(0, Number(initialStock) || 0),
            avg_cost_price: Number(avgCostPrice) || 0,
            latest_selling_price: Number(latestSellingPrice) || 0,
            min_stock_alert: Number(minStockAlert) || 10,
            emoji,
          },
          currentUser
        );
        success(`Buah "${fruitName}" berhasil ditambahkan ke stok gudang!`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Gagal menyimpan data buah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-emerald-700 text-white">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-200" />
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                {editItem ? 'Edit Master Buah' : 'Tambah Buah Baru ke Gudang'}
              </h3>
              <p className="text-[11px] text-emerald-200">
                {editItem ? 'Perbarui nama, satuan, dan patokan harga' : 'Daftarkan jenis komoditas buah baru ke katalog stok'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Emoji Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
              Pilih Ikon / Emoji Buah
            </label>
            <div className="flex items-center gap-1.5 flex-wrap p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
              {COMMON_FRUIT_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition cursor-pointer ${
                    emoji === em
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-500 shadow-xs scale-105'
                      : 'hover:bg-white hover:shadow-2xs'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Nama Buah & Satuan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Nama Buah / Komoditas <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-base">{emoji}</span>
                <input
                  type="text"
                  required
                  value={fruitName}
                  onChange={(e) => setFruitName(e.target.value)}
                  placeholder="Contoh: Semangka Non Biji Merah"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Satuan <span className="text-rose-500">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stok Fisik Gudang */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
            <label className="block text-xs font-bold text-emerald-900 uppercase">
              {editItem ? `Stok Fisik di Gudang Utama (${unit})` : `Stok Awal Fisik di Gudang (${unit})`}
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={initialStock}
              onChange={(e) => setInitialStock(Number(e.target.value))}
              placeholder="0"
              className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-mono font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
            <p className="text-[11px] text-emerald-700">
              {editItem
                ? 'Ubah angka stok fisik ini langsung jika ada koreksi atau selisih fisik gudang.'
                : 'Stok awal akan dicatat ke buku mutasi audit secara otomatis.'}
            </p>
          </div>

          {/* Harga Modal & Harga Jual Acuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Harga Modal Rata-rata (HPP / {unit})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={avgCostPrice || ''}
                  onChange={(e) => setAvgCostPrice(Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Harga Jual Acuan (per {unit})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-emerald-600">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={latestSellingPrice || ''}
                  onChange={(e) => setLatestSellingPrice(Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Batas Minimal Alert Stok */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Batas Alert Stok Menipis ({unit})
            </label>
            <input
              type="number"
              min="1"
              value={minStockAlert}
              onChange={(e) => setMinStockAlert(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Sistem akan menampilkan indikator peringatan kuning jika stok di gudang berada pada atau di bawah angka ini.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
            <div>
              {editItem && (
                confirmDelete ? (
                  <div className="flex items-center gap-1.5 bg-rose-50 p-1 rounded-xl border border-rose-200">
                    <span className="text-[11px] font-bold text-rose-800 px-1">Yakin hapus?</span>
                    <button
                      type="button"
                      onClick={handleDeleteThisFruit}
                      disabled={isDeleting}
                      className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={isDeleting}
                      className="px-2 py-1 text-gray-600 hover:text-gray-900 text-xs font-medium cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-rose-200"
                    title="Hapus komoditas buah ini dari master katalog"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Buah</span>
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : editItem ? 'Simpan Perubahan' : 'Tambah Buah'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
