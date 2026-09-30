import React, { useState, useEffect } from 'react';
import {
  Prospect,
  BusinessType,
  Zone,
  Profile,
  ProspectPhoto,
  ProspectStatus,
} from '../types';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import {
  X,
  Phone,
  MessageSquare,
  MapPin,
  Calendar,
  Clock,
  User,
  Edit2,
  Trash2,
  ExternalLink,
  Camera,
  CheckCircle2,
  Upload,
  AlertTriangle,
} from 'lucide-react';
import { MapView } from './MapView';

interface ProspectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: Prospect | null;
  onEdit: (prospect: Prospect) => void;
  onDeleteSuccess: () => void;
  onStatusChanged: () => void;
  businessTypes: BusinessType[];
  zones: Zone[];
  profiles: Profile[];
}

export const ProspectDetailModal: React.FC<ProspectDetailModalProps> = ({
  isOpen,
  onClose,
  prospect,
  onEdit,
  onDeleteSuccess,
  onStatusChanged,
  businessTypes,
  zones,
  profiles,
}) => {
  const { currentUser, isOwner, isManager } = useAuth();
  const { success, error: toastError } = useToast();

  const [photos, setPhotos] = useState<ProspectPhoto[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentProspect, setCurrentProspect] = useState<Prospect | null>(prospect);

  useEffect(() => {
    setCurrentProspect(prospect);
    if (prospect) {
      loadPhotos(prospect.id);
    }
  }, [prospect]);

  const loadPhotos = async (prospectId: string) => {
    try {
      const p = await db.getProspectPhotos(prospectId);
      setPhotos(p);
    } catch (err) {
      console.error('Failed to load photos:', err);
    }
  };

  if (!isOpen || !currentProspect) return null;

  const businessType = businessTypes.find((t) => t.id === currentProspect.business_type_id)?.name || 'Lainnya';
  const zone = zones.find((z) => z.id === currentProspect.zone_id)?.name || 'Belum diassign ke Zone';
  const sales = profiles.find((p) => p.id === currentProspect.sales_id)?.name || 'Belum diassign';
  const creator = profiles.find((p) => p.id === currentProspect.created_by)?.name || 'Sistem';

  // Format WhatsApp Link (convert 08xx to 628xx)
  let waNumber = currentProspect.phone.replace(/\D/g, '');
  if (waNumber.startsWith('0')) {
    waNumber = '62' + waNumber.substring(1);
  }
  const waUrl = `https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(
    currentProspect.pic_name
  )}%20dari%20${encodeURIComponent(currentProspect.business_name)},%20kami%20dari%20tim%20PesanBuah.id`;

  // Status Change Handler
  const handleStatusChange = async (newStatus: ProspectStatus) => {
    if (!currentUser) return;
    try {
      const updated = await db.updateProspectStatus(currentProspect.id, newStatus, currentUser);
      setCurrentProspect(updated);
      success(`Status berhasil diubah menjadi: ${newStatus}`);
      onStatusChanged();
    } catch (err: any) {
      toastError(err.message || 'Gagal mengubah status');
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!currentUser) return;
    setIsDeleting(true);
    try {
      await db.deleteProspect(currentProspect.id, currentUser);
      success('Calon customer berhasil dihapus.');
      setShowDeleteConfirm(false);
      onDeleteSuccess();
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Gagal menghapus prospect.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Photo Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingPhoto(true);
      try {
        await db.uploadPhoto(currentProspect.id, file);
        await loadPhotos(currentProspect.id);
        success('Foto usaha berhasil diunggah!');
      } catch (err: any) {
        toastError(err.message || 'Gagal mengunggah foto.');
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  // Photo Delete Handler
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Hapus foto ini?')) return;
    try {
      await db.deletePhoto(photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      success('Foto berhasil dihapus.');
    } catch (err: any) {
      toastError(err.message || 'Gagal menghapus foto.');
    }
  };

  const getStatusBadge = (status: ProspectStatus) => {
    switch (status) {
      case 'Customer':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Follow Up':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Tidak Jadi':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  // Check if current user can edit: Owner, Manager, or assigned/creator Sales
  const canEdit =
    isOwner ||
    isManager ||
    (currentUser && (currentProspect.sales_id === currentUser.id || currentProspect.created_by === currentUser.id));

  // Check if current user can delete: Owner or Manager only
  const canDelete = isOwner || isManager;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="pr-4">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-xl leading-tight">{currentProspect.business_name}</h3>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-white/20 text-white backdrop-blur-xs`}
              >
                {currentProspect.status}
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-1 flex items-center gap-2">
              <span>{businessType}</span> &bull; <span>PIC: {currentProspect.pic_name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Quick Status Bar (Interactive Status Change) */}
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Ubah Status Cepat:
              </span>
              <div className="grid grid-cols-2 sm:flex items-center gap-1.5">
                {(['Prospect', 'Follow Up', 'Customer', 'Tidak Jadi'] as ProspectStatus[]).map(
                  (st) => {
                    const isActive = currentProspect.status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        {st}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* Grid Contact & Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone & WhatsApp Link */}
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                No. HP / WhatsApp PIC
              </span>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-900 font-mono">
                  {currentProspect.phone}
                </span>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chat WhatsApp
                </a>
              </div>
            </div>

            {/* Zone & Sales */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-semibold">Zone Usaha:</span>
                <span className="font-bold text-gray-800">{zone}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-gray-200">
                <span className="text-gray-500 font-semibold">Sales PIC:</span>
                <span className="font-bold text-emerald-700">{sales}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-gray-200">
                <span className="text-gray-500 font-semibold">Dibuat Oleh:</span>
                <span className="text-gray-600">{creator}</span>
              </div>
            </div>
          </div>

          {/* Alamat Usaha */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Alamat Usaha
            </span>
            <p className="text-sm text-gray-800 bg-gray-50 p-3.5 rounded-xl border border-gray-200 leading-relaxed">
              {currentProspect.address}
            </p>
          </div>

          {/* Interactive Map & GPS Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Lokasi GPS & Peta Interaktif
              </span>
              {currentProspect.latitude != null && currentProspect.longitude != null && (
                <span className="text-[11px] text-gray-500 font-mono">
                  Waktu GPS:{' '}
                  {currentProspect.gps_captured_at
                    ? new Date(currentProspect.gps_captured_at).toLocaleString('id-ID')
                    : '-'}
                </span>
              )}
            </div>

            <MapView
              latitude={currentProspect.latitude}
              longitude={currentProspect.longitude}
              businessName={currentProspect.business_name}
              address={currentProspect.address}
              heightClass="h-56"
              interactive={true}
            />
          </div>

          {/* Catatan (Optional) */}
          {currentProspect.notes && (
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Catatan Sales
              </span>
              <p className="text-xs text-gray-700 bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 leading-relaxed whitespace-pre-wrap">
                {currentProspect.notes}
              </p>
            </div>
          )}

          {/* Foto Usaha Gallery (Section 12) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-gray-600" />
                Foto Usaha ({photos.length})
              </span>
              <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                {isUploadingPhoto ? 'Mengunggah...' : 'Tambah Foto'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
              </label>
            </div>

            {photos.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                Belum ada foto usaha diunggah.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((ph) => (
                  <div key={ph.id} className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-2xs">
                    <img
                      src={ph.file_url}
                      alt="Foto Usaha"
                      className="w-full h-32 object-cover transition-transform group-hover:scale-105 duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a
                        href={ph.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-white/90 rounded-lg text-gray-800 text-xs mr-2 hover:bg-white transition"
                        title="Lihat ukuran penuh"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeletePhoto(ph.id)}
                        className="p-1.5 bg-rose-600 rounded-lg text-white text-xs hover:bg-rose-700 transition"
                        title="Hapus foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timestamps Info */}
          <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between text-[11px] text-gray-400 font-mono gap-1">
            <span>
              Dibuat: {new Date(currentProspect.created_at).toLocaleString('id-ID')}
            </span>
            <span>
              Diperbarui: {new Date(currentProspect.updated_at).toLocaleString('id-ID')}
            </span>
          </div>

          {/* Delete Confirmation Box */}
          {showDeleteConfirm && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-rose-900 text-sm">
                    Konfirmasi Hapus Calon Customer
                  </h5>
                  <p className="text-xs text-rose-700 mt-0.5">
                    Apakah Anda yakin ingin menghapus data calon customer "{currentProspect.business_name}"? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div>
            {canDelete && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-100/70 text-xs font-bold rounded-xl transition"
              >
                <Trash2 className="w-4 h-4" />
                Hapus
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded-xl transition"
            >
              Tutup
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  onEdit(currentProspect);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
