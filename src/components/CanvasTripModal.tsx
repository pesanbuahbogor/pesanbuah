import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Truck,
  DollarSign,
  Calendar,
  User,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Profile, StockItem } from '../types';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { formatRupiah, formatDateIso } from '../lib/orderScheduleUtils';

interface CanvasTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  couriers: Profile[];
  stockItems: StockItem[];
}

interface CanvasDraftItem {
  fruit_name: string;
  unit: string;
  brought_qty: number;
  selling_price: number;
}

export const CanvasTripModal: React.FC<CanvasTripModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  couriers,
  stockItems,
}) => {
  const { currentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [tripDate, setTripDate] = useState(formatDateIso(new Date()));
  const [courierId, setCourierId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CanvasDraftItem[]>([
    {
      fruit_name: stockItems[0]?.fruit_name || 'Jeruk Medan Manis',
      unit: stockItems[0]?.unit || 'kg',
      brought_qty: 10,
      selling_price: stockItems[0]?.latest_selling_price || 28000,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (couriers.length > 0 && !courierId) {
        setCourierId(couriers[0].id);
      }
      if (stockItems.length > 0 && items.length === 1 && !items[0].fruit_name) {
        setItems([
          {
            fruit_name: stockItems[0].fruit_name,
            unit: stockItems[0].unit,
            brought_qty: 10,
            selling_price: stockItems[0].latest_selling_price || 28000,
          },
        ]);
      }
    }
  }, [isOpen, couriers, stockItems]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const firstAvailable = stockItems[0];
    setItems((prev) => [
      ...prev,
      {
        fruit_name: firstAvailable?.fruit_name || 'Jeruk Peras Segar',
        unit: firstAvailable?.unit || 'kg',
        brought_qty: 5,
        selling_price: firstAvailable?.latest_selling_price || 18000,
      },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) {
      toastError('Minimal harus ada 1 buah yang dibawa.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFruitSelect = (idx: number, fruitName: string) => {
    const matched = stockItems.find((s) => s.fruit_name === fruitName);
    setItems((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        fruit_name: fruitName,
        unit: matched ? matched.unit : 'kg',
        selling_price: matched ? matched.latest_selling_price : next[idx].selling_price,
      };
      return next;
    });
  };

  const handleItemChange = (idx: number, field: keyof CanvasDraftItem, val: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!courierId) {
      toastError('Pilih kurir yang bertugas canvas.');
      return;
    }

    const assignedCourier = couriers.find((c) => c.id === courierId);
    if (!assignedCourier) {
      toastError('Kurir tidak ditemukan.');
      return;
    }

    // Validate quantities against warehouse stock
    for (const item of items) {
      const currentStock = stockItems.find(
        (s) => s.fruit_name.toLowerCase() === item.fruit_name.toLowerCase()
      );
      if (currentStock && item.brought_qty > currentStock.current_stock) {
        toastError(
          `Stok "${item.fruit_name}" di gudang hanya tersisa ${currentStock.current_stock} ${currentStock.unit}, tidak cukup untuk bawa ${item.brought_qty} ${item.unit}.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await db.createCanvasTrip(
        {
          trip_date: tripDate,
          courier_id: assignedCourier.id,
          courier_name: assignedCourier.name,
          items: items.map((i) => ({
            fruit_name: i.fruit_name,
            unit: i.unit,
            brought_qty: Number(i.brought_qty) || 0,
            selling_price: Number(i.selling_price) || 0,
          })),
          notes: notes.trim() || undefined,
        },
        currentUser
      );

      success(`Kurir ${assignedCourier.name} berhasil diberangkatkan canvas keliling!`);
      onSaved();
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Gagal memberangkatkan canvas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-blue-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Berangkatkan Kurir Canvas Keliling
              </h2>
              <p className="text-xs text-blue-100">
                Alokasikan stok gudang untuk dibawa keliling jualan langsung di lapangan
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tanggal Canvas *
              </label>
              <input
                type="date"
                required
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Pilih Kurir Canvas *
              </label>
              <select
                value={courierId}
                onChange={(e) => setCourierId(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-hidden cursor-pointer"
              >
                {couriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items dibawa */}
          <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950 uppercase flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-700" />
                Daftar Buah yang Dibawa dari Gudang
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-white hover:bg-blue-100 rounded-lg transition cursor-pointer border border-blue-300 shadow-2xs"
              >
                <Plus className="w-3 h-3" /> Tambah Buah
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => {
                const stockAvail = stockItems.find(
                  (s) => s.fruit_name.toLowerCase() === item.fruit_name.toLowerCase()
                );

                return (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-gray-200 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Pilih Buah #{idx + 1}
                        </label>
                        <select
                          value={item.fruit_name}
                          onChange={(e) => handleFruitSelect(idx, e.target.value)}
                          className="w-full h-9 px-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs sm:text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-hidden cursor-pointer"
                        >
                          {stockItems.map((s) => (
                            <option key={s.id} value={s.fruit_name}>
                              {s.fruit_name} (Sisa Gudang: {s.current_stock} {s.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer mt-4"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-gray-100">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          Jumlah Bawa ({item.unit})
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              const curr = Number(item.brought_qty) || 1;
                              handleItemChange(idx, 'brought_qty', Math.max(1, curr - 1));
                            }}
                            className="w-8 h-9 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-l-lg font-bold flex items-center justify-center text-sm border border-r-0 border-gray-300 cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            required
                            value={item.brought_qty}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                'brought_qty',
                                Math.max(0.1, Number(e.target.value))
                              )
                            }
                            className="w-full h-9 bg-white border-y border-gray-300 text-center font-black text-sm text-gray-900 outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const curr = Number(item.brought_qty) || 0;
                              handleItemChange(idx, 'brought_qty', curr + 1);
                            }}
                            className="w-8 h-9 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-r-lg font-bold flex items-center justify-center text-sm border border-l-0 border-gray-300 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          Harga Jual Lapangan
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          required
                          value={item.selling_price}
                          onChange={(e) =>
                            handleItemChange(idx, 'selling_price', Number(e.target.value))
                          }
                          className="w-full h-9 px-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-mono font-bold text-right text-gray-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[11px] font-bold text-gray-600 mb-1 text-right sm:text-left">
                          Target Omset Jika Laku
                        </label>
                        <div className="h-9 px-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-end font-mono font-extrabold text-xs sm:text-sm text-blue-900">
                          {formatRupiah(item.brought_qty * item.selling_price)}
                        </div>
                      </div>
                    </div>

                    {stockAvail && (
                      <p className="text-[10px] text-gray-500">
                        *Stok siap di gudang saat ini: <strong>{stockAvail.current_stock} {stockAvail.unit}</strong>. Setelah diberangkatkan akan berkurang {item.brought_qty} {item.unit}.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Catatan Rute / Wilayah Keliling (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Rute keliling Pajajaran, Baranangsiang, Sukasari."
              className="w-full h-10 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-hidden"
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
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Memproses...' : 'Berangkatkan Kurir Canvas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
