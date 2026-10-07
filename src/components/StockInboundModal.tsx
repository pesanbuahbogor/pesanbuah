import React, { useState } from 'react';
import {
  X,
  Plus,
  ShoppingBag,
  DollarSign,
  Scale,
  Calendar,
  User,
  Store,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Profile, QuickFruitItem, StockInbound } from '../types';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { formatRupiah, formatDateIso } from '../lib/orderScheduleUtils';

interface StockInboundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  profiles: Profile[];
  fruits: QuickFruitItem[];
}

export const StockInboundModal: React.FC<StockInboundModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  profiles,
  fruits,
}) => {
  const { currentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [purchaseDate, setPurchaseDate] = useState(formatDateIso(new Date()));
  const [fruitName, setFruitName] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [buyerId, setBuyerId] = useState(currentUser?.id || '');
  const [grossPurchaseQty, setGrossPurchaseQty] = useState<number | ''>(50);
  const [purchasePricePerUnit, setPurchasePricePerUnit] = useState<number | ''>(22000);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer Bank' | 'Hutang / Tempo'>('Tunai');
  const [paymentStatus, setPaymentStatus] = useState<'Lunas' | 'Belum Lunas'>('Lunas');
  const [invoiceNo, setInvoiceNo] = useState('');

  // QC / Sortir Timbang Masuk Gudang
  const [sortingChecked, setSortingChecked] = useState(true);
  const [shrinkageQty, setShrinkageQty] = useState<number | ''>(0); // Susut / rusak / busuk
  const [surplusQty, setSurplusQty] = useState<number | ''>(0); // Lebih timbang / bonus
  const [qualityNotes, setQualityNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (fruits.length > 0 && !fruitName) {
        setFruitName(fruits[0].name);
      }
      if (currentUser && !buyerId) {
        setBuyerId(currentUser.id);
      }
    }
  }, [isOpen, fruits, currentUser]);

  if (!isOpen) return null;

  const grossNum = Math.max(0, Number(grossPurchaseQty) || 0);
  const shrinkNum = Math.max(0, Number(shrinkageQty) || 0);
  const surplusNum = Math.max(0, Number(surplusQty) || 0);
  const netStockedQty = Math.max(0, Number((grossNum - shrinkNum + surplusNum).toFixed(2)));

  const priceNum = Math.max(0, Number(purchasePricePerUnit) || 0);
  const totalPurchaseAmount = grossNum * priceNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!fruitName.trim()) {
      toastError('Nama buah wajib diisi.');
      return;
    }
    if (!supplierName.trim()) {
      toastError('Nama supplier / sumber belanja wajib diisi.');
      return;
    }
    if (grossNum <= 0) {
      toastError('Timbangan beli harus lebih dari 0 kg.');
      return;
    }

    const buyer = profiles.find((p) => p.id === buyerId) || currentUser;

    setIsSubmitting(true);
    try {
      await db.createStockInbound(
        {
          purchase_date: purchaseDate,
          fruit_name: fruitName.trim(),
          supplier_name: supplierName.trim(),
          buyer_id: buyer.id,
          buyer_name: buyer.name,
          gross_purchase_qty: grossNum,
          purchase_price_per_unit: priceNum,
          total_purchase_amount: totalPurchaseAmount,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          invoice_no: invoiceNo.trim() || undefined,
          sorting_checked: sortingChecked,
          checked_by_id: currentUser.id,
          checked_by_name: currentUser.name,
          shrinkage_qty: shrinkNum,
          surplus_qty: surplusNum,
          quality_notes: qualityNotes.trim() || undefined,
        },
        currentUser
      );

      success(`Belanja buah "${fruitName}" berhasil dicatat & ${netStockedQty} kg masuk ke stok gudang!`);
      onSaved();
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Gagal menyimpan data belanja.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-emerald-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Catat Belanja / Kulakan & Sortir Masuk Gudang
              </h2>
              <p className="text-xs text-emerald-100">
                Data pembelian dari supplier, cek sortir, susut/rusak, dan net stok siap jual
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
          {/* Section 1: Data Kulakan / Belanja */}
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
            <div className="text-xs font-bold text-gray-800 uppercase flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              1. Informasi Pembelian &amp; Supplier
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tanggal Belanja *
                </label>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Petugas / Yang Belanja *
                </label>
                <select
                  value={buyerId}
                  onChange={(e) => setBuyerId(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Supplier / Pasar / Petani *
                </label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Misal: Pasar Induk Kramat Jati, Petani Ciwidey, Pak Haji Maman"
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  No. Nota / Faktur Supplier (Opsional)
                </label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="Contoh: INV-9921 / Nota #12"
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>

            {/* Buah yang Dibelanja */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Pilih Buah yang Dibeli *
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {fruits.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFruitName(f.name)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 border ${
                      fruitName.toLowerCase() === f.name.toLowerCase()
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-emerald-50'
                    }`}
                  >
                    <span>{f.emoji || '🍊'}</span>
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>
              <input
                type="text"
                required
                value={fruitName}
                onChange={(e) => setFruitName(e.target.value)}
                placeholder="Atau ketik nama buah baru (misal: Jeruk Siam Madu)"
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            {/* Timbangan Awal & Harga Beli */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Timbangan Beli di Supplier (Gross kg) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={grossPurchaseQty === '' ? '' : grossPurchaseQty}
                    onChange={(e) =>
                      setGrossPurchaseQty(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Contoh: 50"
                    className="w-full h-10 pl-3 pr-10 bg-white border border-gray-300 rounded-xl text-sm font-extrabold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-500">
                    kg
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Harga Beli Modal per kg (Rp) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={purchasePricePerUnit === '' ? '' : purchasePricePerUnit}
                  onChange={(e) =>
                    setPurchasePricePerUnit(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="Contoh: 22000"
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-xl text-sm font-mono font-extrabold text-right text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>

            {/* Total Bayar & Cara Bayar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white rounded-xl border border-gray-200">
              <div className="sm:col-span-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase block">
                  Total Bayar Belanja:
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-emerald-800">
                  {formatRupiah(totalPurchaseAmount)}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Metode Bayar
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-hidden"
                >
                  <option value="Tunai">Tunai / Cash</option>
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="Hutang / Tempo">Hutang / Tempo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Status Pembayaran
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className={`w-full px-2.5 py-1.5 border rounded-lg text-xs font-bold outline-hidden ${
                    paymentStatus === 'Lunas'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-900 border-amber-300'
                  }`}
                >
                  <option value="Lunas">Lunas</option>
                  <option value="Belum Lunas">Belum Lunas (Tempo)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: QC Sortir & Timbang Masuk Gudang */}
          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
              <span className="text-xs font-bold text-amber-950 uppercase flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-700" />
                2. Pemeriksaan Sortir &amp; Timbang Masuk Gudang (Inbound QC)
              </span>
              <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                Pemeriksa: {currentUser?.name || 'Petugas Gudang'}
              </span>
            </div>

            <p className="text-[11px] text-amber-900 leading-relaxed">
              Saat buah tiba di dark store, buah ditimbang dan dicek sortir. Masukkan jika ada <strong>susut/rusak/busuk</strong> yang dibuang, atau <strong>lebih timbang</strong>, agar stok dan uang tercatat akurat tanpa selisih.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Susut / Rusak */}
              <div>
                <label className="block text-xs font-bold text-rose-800 mb-1">
                  Susut / Busuk / Rusak (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={shrinkageQty === '' ? '' : shrinkageQty}
                    onChange={(e) =>
                      setShrinkageQty(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="0"
                    className="w-full h-10 pl-3 pr-10 bg-white border border-rose-300 text-rose-900 rounded-xl text-sm font-extrabold focus:ring-2 focus:ring-rose-500 outline-hidden"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-rose-500">
                    kg
                  </span>
                </div>
              </div>

              {/* Lebih Timbang */}
              <div>
                <label className="block text-xs font-bold text-emerald-800 mb-1">
                  Lebih Timbang / Bonus (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={surplusQty === '' ? '' : surplusQty}
                    onChange={(e) =>
                      setSurplusQty(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="0"
                    className="w-full h-10 pl-3 pr-10 bg-white border border-emerald-300 text-emerald-900 rounded-xl text-sm font-extrabold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-emerald-500">
                    kg
                  </span>
                </div>
              </div>

              {/* Net Stok Masuk */}
              <div>
                <label className="block text-xs font-bold text-emerald-950 mb-1">
                  Bersih Masuk Stok Gudang
                </label>
                <div className="w-full h-10 px-3 bg-emerald-100 border border-emerald-400 rounded-xl flex items-center justify-between text-emerald-950 font-mono font-black text-base shadow-2xs">
                  <span>{netStockedQty}</span>
                  <span className="text-xs font-bold text-emerald-800">kg bersih</span>
                </div>
              </div>
            </div>

            {/* Formula explanation preview */}
            <div className="p-2.5 bg-white/90 rounded-xl border border-amber-200 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-1">
              <span>
                Rumus: Beli ({grossNum} kg) - Susut ({shrinkNum} kg) + Lebih ({surplusNum} kg)
              </span>
              <strong className="text-emerald-800 font-bold">
                = {netStockedQty} kg Siap Dijual
              </strong>
            </div>

            {/* Quality Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Catatan Kondisi / Kualitas Buah
              </label>
              <textarea
                rows={2}
                value={qualityNotes}
                onChange={(e) => setQualityNotes(e.target.value)}
                placeholder="Misal: Kematangan pas 80%, manis, ada 2 kg busuk/penyok di bagian bawah keranjang."
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {/* Action Buttons */}
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
              {isSubmitting ? 'Menyimpan...' : 'Simpan & Masukkan ke Stok Gudang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
