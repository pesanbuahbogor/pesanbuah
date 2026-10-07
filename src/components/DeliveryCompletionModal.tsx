import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Camera,
  Upload,
  Phone,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  Truck,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { Order, PaymentStatus } from '../types';
import { formatRupiah } from '../lib/orderScheduleUtils';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

interface DeliveryCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSubmit: (orderId: string, data: { delivery_notes?: string; payment_status?: PaymentStatus; proof_photo_url?: string }) => Promise<void>;
}

export const DeliveryCompletionModal: React.FC<DeliveryCompletionModalProps> = ({
  isOpen,
  onClose,
  order,
  onSubmit,
}) => {
  const { currentUser } = useAuth();
  const { error: toastError } = useToast();

  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order?.payment_status || 'Lunas');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (order) {
      setPaymentStatus(order.payment_status === 'Lunas' ? 'Lunas' : 'Lunas'); // default to lunas when completing
      setDeliveryNotes(order.delivery_notes || '');
      setPhotoPreview(order.proof_photo_url || null);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(order.id, {
        delivery_notes: deliveryNotes.trim() || undefined,
        payment_status: paymentStatus,
        proof_photo_url: photoPreview || undefined,
      });
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Gagal menyelesaikan pengantaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cleanPhone = order.customer_phone.replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
    `Halo ${order.customer_name}, pesanan PesanBuah.id Anda (#${order.order_number}) telah selesai kami antar. Terima kasih banyak!`
  )}`;
  let effectiveLat = order.latitude ?? null;
  let effectiveLng = order.longitude ?? null;
  if (!effectiveLat || !effectiveLng) {
    try {
      const raw = localStorage.getItem('pesanbuah_prospects');
      if (raw) {
        const plist: any[] = JSON.parse(raw);
        const matched = plist.find(
          (p) =>
            (order.prospect_id && p.id === order.prospect_id) ||
            (p.phone && cleanPhone && p.phone.replace(/[^0-9]/g, '') === cleanPhone) ||
            p.business_name.toLowerCase().trim() === order.customer_name.toLowerCase().trim()
        );
        if (matched?.latitude && matched?.longitude) {
          effectiveLat = matched.latitude;
          effectiveLng = matched.longitude;
        }
      }
    } catch {}
  }
  const hasGps = effectiveLat !== null && effectiveLng !== null;
  const mapsUrl = hasGps
    ? `https://www.google.com/maps/dir/?api=1&destination=${effectiveLat},${effectiveLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-emerald-600 text-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Laporan Pengantaran Selesai</h3>
              <p className="text-xs text-emerald-100">Order #{order.order_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleComplete} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Customer Summary Box */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-bold text-gray-900 text-sm">{order.customer_name}</span>
              <div className="flex items-center gap-2">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700 font-bold hover:underline flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" /> Buka Maps
                </a>
                <span className="text-gray-300">·</span>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" /> Chat WA
                </a>
              </div>
            </div>
            <p className="text-gray-600 flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
              <span>{order.delivery_address}</span>
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-gray-200">
              <span className="text-gray-500">Total Tagihan:</span>
              <span className="font-mono font-bold text-sm text-gray-900">
                {formatRupiah(order.total_amount)}
              </span>
            </div>
          </div>

          {/* Payment Confirmation */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-amber-950 uppercase">
              Status Pembayaran Tagihan ({order.payment_method})
            </label>
            <p className="text-[11px] text-amber-900">
              Apakah pembayaran sejumlah <strong>{formatRupiah(order.total_amount)}</strong> sudah diterima via {order.payment_method}?
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPaymentStatus('Lunas')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  paymentStatus === 'Lunas'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sudah Lunas
              </button>

              <button
                type="button"
                onClick={() => setPaymentStatus('Belum Lunas')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  paymentStatus === 'Belum Lunas'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Belum Lunas / Tertunda
              </button>
            </div>

            {order.payment_method === 'Tunai' && paymentStatus === 'Lunas' && (
              <div className="p-2.5 bg-amber-100/90 border border-amber-300 rounded-lg text-[11px] text-amber-950 leading-relaxed">
                ⚠️ <strong>Perhatian Kurir:</strong> Uang tunai COD sebesar <strong>{formatRupiah(order.total_amount)}</strong> yang Anda terima berstatus <strong>"Masih di Tangan Kurir"</strong> dan <strong>belum masuk ke kas perusahaan</strong>. Anda wajib menyerahkan uang fisik ini ke kasir/kantor setelah selesai rute.
              </div>
            )}
          </div>

          {/* Proof Photo Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              Foto Bukti Pengantaran (Opsional)
            </label>
            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
                <img
                  src={photoPreview}
                  alt="Bukti Pengantaran"
                  className="w-full h-40 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black transition text-xs"
                >
                  Ganti Foto
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-gray-50 hover:bg-emerald-50/50 transition">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Camera className="w-6 h-6 text-gray-400" />
                <span className="text-xs font-semibold text-gray-700">
                  Ambil Foto Penerimaan / Drop Barang
                </span>
                <span className="text-[10px] text-gray-400">
                  Kamera HP atau upload galeri
                </span>
              </label>
            )}
          </div>

          {/* Delivery Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Catatan Laporan Pengantaran
            </label>
            <textarea
              rows={2}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Contoh: Diterima oleh Mas Budi (Kasir), uang pas Rp 185.000, buah diperiksa dalam kondisi bagus."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Selesai Diantar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
