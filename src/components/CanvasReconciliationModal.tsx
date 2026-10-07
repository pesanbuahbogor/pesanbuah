import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  DollarSign,
  User,
  Calendar,
  Truck,
  Scale,
  FileCheck,
} from 'lucide-react';
import { CanvasTrip, CanvasTripItem } from '../types';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { formatRupiah } from '../lib/orderScheduleUtils';

interface CanvasReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: CanvasTrip | null;
  onReconciled: () => void;
}

export const CanvasReconciliationModal: React.FC<CanvasReconciliationModalProps> = ({
  isOpen,
  onClose,
  trip,
  onReconciled,
}) => {
  const { currentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [items, setItems] = useState<CanvasTripItem[]>([]);
  const [actualCash, setActualCash] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (trip) {
      setItems(
        trip.items.map((i) => ({
          ...i,
          sold_qty: i.sold_qty || 0,
          returned_qty: i.returned_qty !== undefined ? i.returned_qty : i.brought_qty,
          shrinkage_qty: i.shrinkage_qty || 0,
        }))
      );
      setActualCash(trip.actual_cash_submitted || 0);
      setNotes(trip.notes || '');
    }
  }, [trip]);

  if (!isOpen || !trip) return null;

  const handleItemNumberChange = (
    idx: number,
    field: 'sold_qty' | 'returned_qty' | 'shrinkage_qty',
    val: number
  ) => {
    setItems((prev) => {
      const next = [...prev];
      const target = { ...next[idx], [field]: Math.max(0, val) };
      // auto adjust returned if sold changed
      if (field === 'sold_qty') {
        const remaining = Math.max(0, target.brought_qty - target.sold_qty - target.shrinkage_qty);
        target.returned_qty = Number(remaining.toFixed(2));
      }
      next[idx] = target;
      return next;
    });
  };

  const totalExpectedCash = items.reduce(
    (sum, i) => sum + (Number(i.sold_qty) || 0) * (Number(i.selling_price) || 0),
    0
  );
  const actualCashNum = Math.max(0, Number(actualCash) || 0);
  const cashDifference = actualCashNum - totalExpectedCash;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validate balance for each item: sold + returned + shrinkage must equal brought
    for (const item of items) {
      const totalAccounted = Number(
        (Number(item.sold_qty) + Number(item.returned_qty) + Number(item.shrinkage_qty)).toFixed(2)
      );
      if (Math.abs(totalAccounted - item.brought_qty) > 0.05) {
        toastError(
          `Untuk "${item.fruit_name}": Bawa awal (${item.brought_qty} ${item.unit}) harus sama dengan Terjual (${item.sold_qty}) + Kembali (${item.returned_qty}) + Susut (${item.shrinkage_qty}). Selisih: ${Number((totalAccounted - item.brought_qty).toFixed(2))} ${item.unit}.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await db.reconcileCanvasTrip(
        trip.id,
        {
          items,
          actual_cash_submitted: actualCashNum,
          notes: notes.trim() || undefined,
          verified_by_name: currentUser.name,
        },
        currentUser
      );

      success(
        `Rekonsiliasi canvas kurir ${trip.courier_name} selesai! Sisa buah berhasil masuk kembali ke stok gudang.`
      );
      onReconciled();
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Gagal menyimpan rekonsiliasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-emerald-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Rekonsiliasi Serah Terima Pulang Canvas
              </h2>
              <p className="text-xs text-emerald-100">
                Pemeriksaan sisa buah kembali ke gudang &amp; setoran uang penjualan kurir
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Trip Summary Info */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-700" />
              <span>
                Kurir Canvas: <strong>{trip.courier_name}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>
                Tanggal: <strong>{trip.trip_date}</strong>
              </span>
            </div>
            <div className="text-[11px] font-bold text-gray-500">
              Pemeriksa Gudang: {currentUser?.name || 'Petugas Gudang'}
            </div>
          </div>

          {/* Breakdown Items Return & Sold */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-gray-800 uppercase flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
              <Scale className="w-4 h-4 text-emerald-600" />
              Hitung Fisik Barang Kembali &amp; Laku Terjual
            </div>

            {items.map((item, idx) => {
              const totalAccounted = Number(
                (Number(item.sold_qty) + Number(item.returned_qty) + Number(item.shrinkage_qty)).toFixed(2)
              );
              const isMatched = Math.abs(totalAccounted - item.brought_qty) <= 0.05;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border space-y-2.5 transition ${
                    isMatched ? 'bg-white border-gray-200 shadow-2xs' : 'bg-rose-50/50 border-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="font-extrabold text-sm text-gray-900">
                      {item.fruit_name}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                      Bawa Awal: {item.brought_qty} {item.unit} (@ {formatRupiah(item.selling_price)})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* 1. Laku Terjual */}
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                        Laku Terjual ({item.unit}) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={item.brought_qty}
                        step="any"
                        required
                        value={item.sold_qty}
                        onChange={(e) =>
                          handleItemNumberChange(idx, 'sold_qty', Number(e.target.value))
                        }
                        className="w-full h-10 px-3 bg-white border border-emerald-300 text-emerald-950 font-black text-sm text-center rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      />
                    </div>

                    {/* 2. Kembali Utuh ke Gudang */}
                    <div>
                      <label className="block text-[11px] font-bold text-blue-800 mb-1">
                        Sisa Kembali ke Gudang ({item.unit}) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={item.brought_qty}
                        step="any"
                        required
                        value={item.returned_qty}
                        onChange={(e) =>
                          handleItemNumberChange(idx, 'returned_qty', Number(e.target.value))
                        }
                        className="w-full h-10 px-3 bg-white border border-blue-300 text-blue-950 font-black text-sm text-center rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
                      />
                    </div>

                    {/* 3. Susut / Rusak di Jalan */}
                    <div>
                      <label className="block text-[11px] font-bold text-rose-800 mb-1">
                        Susut / Rusak di Jalan ({item.unit})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={item.brought_qty}
                        step="any"
                        value={item.shrinkage_qty}
                        onChange={(e) =>
                          handleItemNumberChange(idx, 'shrinkage_qty', Number(e.target.value))
                        }
                        placeholder="0"
                        className="w-full h-10 px-3 bg-white border border-rose-300 text-rose-950 font-black text-sm text-center rounded-xl focus:ring-2 focus:ring-rose-500 outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Balance Check Indicator */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 flex-wrap gap-1">
                    <span className="text-gray-500">
                      Total Cek Fisik: {totalAccounted} / {item.brought_qty} {item.unit}
                    </span>
                    {isMatched ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Timbangan Cocok Pas
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Selisih {Number((item.brought_qty - totalAccounted).toFixed(2))} {item.unit}!
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section: Uang Setoran Penjualan */}
          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-300 space-y-3">
            <div className="text-xs font-bold text-emerald-950 uppercase flex items-center gap-1.5 border-b border-emerald-200 pb-1.5">
              <DollarSign className="w-4 h-4 text-emerald-700" />
              Rekonsiliasi Uang Setoran Penjualan
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <span className="text-xs font-bold text-gray-600 block">
                  Total Uang Penjualan yang Harus Disetor:
                </span>
                <span className="text-lg sm:text-xl font-black font-mono text-emerald-900">
                  {formatRupiah(totalExpectedCash)}
                </span>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  *Dihitung dari total laku terjual x harga jual satuan
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 mb-1">
                  Uang Fisik / QRIS yang Disetor Kurir (Rp) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={actualCash === '' ? '' : actualCash}
                  onChange={(e) =>
                    setActualCash(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="0"
                  className="w-full h-11 px-3 bg-white border border-emerald-400 rounded-xl text-base font-mono font-black text-right text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-hidden shadow-2xs"
                />
              </div>
            </div>

            {/* Difference Badge */}
            <div className="p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold">
              <span>Status Selisih Setoran Kasir/Gudang:</span>
              {cashDifference === 0 ? (
                <span className="text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-lg flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Uang Setoran PAS Sempurna
                </span>
              ) : cashDifference < 0 ? (
                <span className="text-rose-800 bg-rose-100 border border-rose-300 px-3 py-1 rounded-lg flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                  Kurang Setor: {formatRupiah(Math.abs(cashDifference))}
                </span>
              ) : (
                <span className="text-blue-800 bg-blue-100 border border-blue-300 px-3 py-1 rounded-lg flex items-center gap-1">
                  Lebih Setor: +{formatRupiah(cashDifference)}
                </span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Catatan Rekonsiliasi &amp; Serah Terima
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Uang setoran tunai pas diterima di meja kasir oleh Hendra."
              className="w-full h-10 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : 'Selesaikan & Kembalikan Sisa Buah ke Stok Gudang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
