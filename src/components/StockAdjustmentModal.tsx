import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Scale,
  FileText,
} from 'lucide-react';
import { StockItem } from '../types';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItem: StockItem | null;
  onAdjusted: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  stockItem,
  onAdjusted,
}) => {
  const { currentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [newStock, setNewStock] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (stockItem) {
      setNewStock(stockItem.current_stock);
      setReason('');
    }
  }, [stockItem]);

  if (!isOpen || !stockItem) return null;

  const currentStock = stockItem.current_stock;
  const targetStock = Number(newStock) || 0;
  const diff = Number((targetStock - currentStock).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!reason.trim()) {
      toastError('Alasan penyesuaian wajib diisi untuk audit trail.');
      return;
    }

    setIsSubmitting(true);
    try {
      await db.adjustStockManually(stockItem.id, targetStock, reason.trim(), currentUser);
      success(`Stok "${stockItem.fruit_name}" berhasil disesuaikan menjadi ${targetStock} ${stockItem.unit}!`);
      onAdjusted();
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Gagal menyesuaikan stok.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-amber-600 text-white">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold">Penyesuaian / Opname Stok</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <span className="font-bold block text-sm text-amber-950">
              {stockItem.fruit_name}
            </span>
            <p>
              Stok tercatat sistem saat ini: <strong>{currentStock} {stockItem.unit}</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Hasil Timbangan Fisik Gudang yang Baru ({stockItem.unit}) *
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={newStock === '' ? '' : newStock}
              onChange={(e) =>
                setNewStock(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-full h-11 px-3 bg-white border border-gray-300 rounded-xl font-mono font-black text-lg text-gray-900 text-center focus:ring-2 focus:ring-amber-500 outline-hidden"
            />
          </div>

          {/* Difference display */}
          <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-bold">
            <span className="text-gray-600">Selisih Penyesuaian:</span>
            <span
              className={
                diff === 0
                  ? 'text-gray-700'
                  : diff > 0
                  ? 'text-emerald-700'
                  : 'text-rose-700'
              }
            >
              {diff > 0 ? `+${diff}` : diff} {stockItem.unit}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Alasan Penyesuaian (Wajib untuk Riwayat Audit) *
            </label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Stok opname fisik mingguan, ada 1.5 kg susut karena penguapan / busuk."
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : 'Perbarui Stok'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
