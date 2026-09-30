import React, { useState, useEffect } from 'react';
import { Prospect, BusinessType, Zone, Profile, ProspectStatus, DuplicateWarningInfo } from '../types';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import {
  X,
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Loader2,
  UploadCloud,
  Trash2,
} from 'lucide-react';
import { MapView } from './MapView';

interface ProspectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editProspect?: Prospect | null;
  businessTypes: BusinessType[];
  zones: Zone[];
  salesList: Profile[];
}

export const ProspectFormModal: React.FC<ProspectFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editProspect,
  businessTypes,
  zones,
  salesList,
}) => {
  const { currentUser, isOwner, isManager } = useAuth();
  const { success, error: toastError, warning } = useToast();

  const [businessName, setBusinessName] = useState('');
  const [picName, setPicName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessTypeId, setBusinessTypeId] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsCapturedAt, setGpsCapturedAt] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string>('');
  const [salesId, setSalesId] = useState<string>('');
  const [status, setStatus] = useState<ProspectStatus>('Prospect');
  const [notes, setNotes] = useState('');

  // Photo upload
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarningInfo | null>(null);

  useEffect(() => {
    if (editProspect) {
      setBusinessName(editProspect.business_name);
      setPicName(editProspect.pic_name);
      setPhone(editProspect.phone);
      setBusinessTypeId(editProspect.business_type_id);
      setAddress(editProspect.address);
      setLatitude(editProspect.latitude);
      setLongitude(editProspect.longitude);
      setGpsCapturedAt(editProspect.gps_captured_at);
      setZoneId(editProspect.zone_id || '');
      setSalesId(editProspect.sales_id || '');
      setStatus(editProspect.status);
      setNotes(editProspect.notes || '');
      setPhotoPreviewUrl(null);
      setSelectedPhotoFile(null);
    } else {
      setBusinessName('');
      setPicName('');
      setPhone('');
      setBusinessTypeId(businessTypes[0]?.id || '');
      setAddress('');
      setLatitude(null);
      setLongitude(null);
      setGpsCapturedAt(null);
      setZoneId('');
      setSalesId(currentUser?.role === 'Sales' ? currentUser.id : '');
      setStatus('Prospect');
      setNotes('');
      setPhotoPreviewUrl(null);
      setSelectedPhotoFile(null);
    }
    setFormErrors({});
    setGpsError(null);
    setDuplicateWarning(null);
  }, [editProspect, isOpen, businessTypes, currentUser]);

  // Real-time check for duplicates when user types Phone or Business Name
  useEffect(() => {
    if (editProspect) return; // Don't warn duplicate when editing self unless phone changed

    const timer = setTimeout(async () => {
      if ((phone.trim().length >= 6 || businessName.trim().length >= 3) && isOpen) {
        try {
          const res = await db.checkDuplicate({
            phone,
            business_name: businessName,
            latitude,
            longitude,
            excludeId: undefined,
          });

          if (res.matchByPhone || res.matchByName || res.matchByGps) {
            setDuplicateWarning(res);
          } else {
            setDuplicateWarning(null);
          }
        } catch (err) {
          // ignore duplicate check errors
        }
      } else {
        setDuplicateWarning(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [phone, businessName, latitude, longitude, editProspect, isOpen]);

  if (!isOpen) return null;

  // Handle GPS Capture using browser Geolocation API
  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung pengambilan lokasi GPS.');
      warning('Browser tidak mendukung Geolocation.');
      return;
    }

    setIsCapturingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const now = new Date().toISOString();

        setLatitude(lat);
        setLongitude(lng);
        setGpsCapturedAt(now);
        setIsCapturingGps(false);
        success(`GPS berhasil diambil! (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
      },
      (error) => {
        setIsCapturingGps(false);
        let msg = 'Gagal mengambil GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Izin lokasi GPS ditolak oleh browser/pengguna. Calon customer tetap dapat disimpan menggunakan alamat manual.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Informasi lokasi GPS tidak tersedia pada perangkat saat ini.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Waktu permintaan GPS habis. Silakan coba kembali.';
        }
        setGpsError(msg);
        warning(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoPreviewUrl(url);
    }
  };

  const removeSelectedPhoto = () => {
    setSelectedPhotoFile(null);
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoPreviewUrl(null);
  };

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!businessName.trim()) errors.businessName = 'Nama Usaha wajib diisi.';
    if (!picName.trim()) errors.picName = 'Nama Pemilik / PIC wajib diisi.';
    if (!phone.trim()) errors.phone = 'No. HP / WhatsApp wajib diisi.';
    if (!businessTypeId) errors.businessTypeId = 'Pilih salah satu Jenis Usaha.';
    if (!address.trim()) errors.address = 'Alamat Usaha wajib diisi.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toastError('Mohon lengkapi field wajib yang belum diisi.');
      return;
    }

    if (!currentUser) {
      toastError('Sesi login telah habis.');
      return;
    }

    setIsSubmitting(true);
    try {
      let savedProspect: Prospect;

      if (editProspect) {
        savedProspect = await db.updateProspect(
          editProspect.id,
          {
            business_name: businessName,
            pic_name: picName,
            phone,
            business_type_id: businessTypeId,
            address,
            latitude,
            longitude,
            gps_captured_at: gpsCapturedAt,
            zone_id: zoneId || null,
            sales_id: salesId || null,
            status,
            notes: notes || null,
          },
          currentUser
        );
        success('Data Calon Customer berhasil diperbarui!');
      } else {
        savedProspect = await db.createProspect(
          {
            business_name: businessName,
            pic_name: picName,
            phone,
            business_type_id: businessTypeId,
            address,
            latitude,
            longitude,
            gps_captured_at: gpsCapturedAt,
            zone_id: zoneId || null,
            sales_id: salesId || null,
            status,
            notes: notes || null,
          },
          currentUser
        );
        success('Calon Customer baru berhasil disimpan!');
      }

      // Upload photo if selected
      if (selectedPhotoFile && savedProspect) {
        try {
          await db.uploadPhoto(savedProspect.id, selectedPhotoFile);
        } catch (uploadErr) {
          console.error('Error uploading photo:', uploadErr);
          warning('Data tersimpan, namun foto gagal diunggah.');
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Gagal menyimpan data calon customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-emerald-600 text-white">
          <div>
            <h3 className="font-extrabold text-lg">
              {editProspect ? 'Edit Calon Customer' : 'Tambah Calon Customer Baru'}
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              Form cepat & terstruktur untuk tim sales PesanBuah.id
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* DUPLICATE WARNING ALERT */}
          {duplicateWarning && duplicateWarning.matchedProspects.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Peringatan Kemungkinan Duplikasi:</span>
              </div>
              <p className="text-amber-800">
                Sistem menemukan data yang mirip berdasarkan{' '}
                {duplicateWarning.matchByPhone && 'No. HP / WA, '}
                {duplicateWarning.matchByName && 'Nama Usaha, '}
                {duplicateWarning.matchByGps && 'Koordinat GPS yang berdekatan'}:
              </p>
              <div className="space-y-1 bg-white/70 p-2.5 rounded-xl border border-amber-200">
                {duplicateWarning.matchedProspects.map((dup) => (
                  <div key={dup.id} className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-gray-900">
                      {dup.business_name} ({dup.pic_name})
                    </span>
                    <span className="text-gray-600">
                      WA: {dup.phone} &bull; Sales: {dup.sales_name}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-amber-700 italic">
                * Catatan: Ini adalah peringatan untuk kehati-hatian. Anda tetap diizinkan menyimpan jika data memang berbeda.
              </p>
            </div>
          )}

          {/* Section: Data Wajib */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Data Wajib Calon Customer
            </h4>

            {/* Nama Usaha */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Nama Usaha <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Contoh: Kopi Kenangan Pajajaran, Resto Sunda Gurih"
                className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden ${
                  formErrors.businessName ? 'border-rose-400 bg-rose-50' : 'border-gray-300'
                }`}
              />
              {formErrors.businessName && (
                <p className="text-rose-500 text-xs mt-1">{formErrors.businessName}</p>
              )}
            </div>

            {/* Nama PIC & No HP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nama Pemilik / PIC <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  placeholder="Contoh: Pak Hendra / Bu Dewi"
                  className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden ${
                    formErrors.picName ? 'border-rose-400 bg-rose-50' : 'border-gray-300'
                  }`}
                />
                {formErrors.picName && (
                  <p className="text-rose-500 text-xs mt-1">{formErrors.picName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  No. HP / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden font-mono ${
                    formErrors.phone ? 'border-rose-400 bg-rose-50' : 'border-gray-300'
                  }`}
                />
                {formErrors.phone && (
                  <p className="text-rose-500 text-xs mt-1">{formErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Jenis Usaha */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Jenis Usaha <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={businessTypeId}
                onChange={(e) => setBusinessTypeId(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden ${
                  formErrors.businessTypeId ? 'border-rose-400 bg-rose-50' : 'border-gray-300'
                }`}
              >
                <option value="">-- Pilih Jenis Usaha --</option>
                {businessTypes.map((t) => (
                  <option key={t.id} value={t.id} disabled={!t.active}>
                    {t.name} {!t.active && '(Nonaktif)'}
                  </option>
                ))}
              </select>
              {formErrors.businessTypeId && (
                <p className="text-rose-500 text-xs mt-1">{formErrors.businessTypeId}</p>
              )}
            </div>

            {/* Alamat Usaha (Single field as required) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Alamat Usaha <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Tuliskan alamat lengkap tempat usaha (nama jalan, nomor ruko/patokan)"
                className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden resize-none ${
                  formErrors.address ? 'border-rose-400 bg-rose-50' : 'border-gray-300'
                }`}
              />
              {formErrors.address && (
                <p className="text-rose-500 text-xs mt-1">{formErrors.address}</p>
              )}
            </div>

            {/* LOKASI GPS (Section 8) */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Lokasi GPS Usaha
                  </label>
                  <p className="text-[11px] text-gray-500">
                    Ambil koordinat akurat saat berada di lokasi usaha calon customer.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCaptureGps}
                  disabled={isCapturingGps}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 shrink-0"
                >
                  {isCapturingGps ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sedang Mengambil GPS...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5" /> AMBIL LOKASI GPS
                    </>
                  )}
                </button>
              </div>

              {/* Coordinates display or error */}
              {latitude != null && longitude != null ? (
                <div className="space-y-2">
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center justify-between text-emerald-900">
                    <span className="font-mono">
                      Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
                    </span>
                    <span className="text-[10px] text-emerald-700">
                      Tercatat: {gpsCapturedAt ? new Date(gpsCapturedAt).toLocaleTimeString('id-ID') : 'Baru saja'}
                    </span>
                  </div>
                  {/* Mini Map View */}
                  <MapView
                    latitude={latitude}
                    longitude={longitude}
                    businessName={businessName || 'Lokasi Usaha'}
                    address={address}
                    heightClass="h-44"
                    interactive={false}
                  />
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  Belum ada koordinat GPS. Tekan tombol <b>AMBIL LOKASI GPS</b> jika Anda sedang berada di lokasi, atau lanjutkan simpan dengan alamat manual.
                </p>
              )}

              {gpsError && (
                <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  {gpsError}
                </p>
              )}
            </div>
          </div>

          {/* Section: Data Tambahan & Assignment */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Data Penugasan & Kategori
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Zone (Manual Selection as required in Section 4) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Zone (Pilihan Manual)
                </label>
                <select
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
                >
                  <option value="">-- Pilih Zone --</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id} disabled={!z.active}>
                      {z.name} {!z.active && '(Nonaktif)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sales Assignment */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Sales PIC
                </label>
                <select
                  value={salesId}
                  disabled={!isOwner && !isManager}
                  onChange={(e) => setSalesId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">-- Belum Diassign --</option>
                  {salesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProspectStatus)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden font-semibold"
                >
                  <option value="Prospect">Prospect</option>
                  <option value="Follow Up">Follow Up</option>
                  <option value="Customer">Customer</option>
                  <option value="Tidak Jadi">Tidak Jadi</option>
                </select>
              </div>
            </div>

            {/* Catatan (Opsional) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Catatan (Opsional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Kebutuhan buah 50kg/minggu (jeruk peras, lemon), PIC suka dihubungi sore."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden resize-none"
              />
            </div>

            {/* Foto Usaha (Opsional - Section 12) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-gray-500" />
                Foto Usaha (Opsional)
              </label>

              {photoPreviewUrl ? (
                <div className="relative inline-block mt-1">
                  <img
                    src={photoPreviewUrl}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-2xl border border-gray-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={removeSelectedPhoto}
                    className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl cursor-pointer bg-gray-50 hover:bg-emerald-50/50 transition">
                  <UploadCloud className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs font-semibold text-gray-600">
                    Pilih Foto dari Perangkat / Kamera
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5">JPG, PNG atau WebP</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Simpan Data
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
