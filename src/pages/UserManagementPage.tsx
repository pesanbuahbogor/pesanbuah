import React, { useState, useEffect } from 'react';
import { Profile, UserRole } from '../types';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import {
  ShieldCheck,
  UserPlus,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  ShieldAlert,
  Loader2,
  Lock,
  UserX,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const { currentUser, isOwner, refreshCurrentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('Sales');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal
  const [deleteConfirmProfile, setDeleteConfirmProfile] = useState<Profile | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await db.getProfiles();
      setProfiles(data);
    } catch (err: any) {
      toastError('Gagal memuat data pengguna.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // STRICT ACCESS CONTROL: Only Owner can access this page!
  // Manager and Sales are strictly blocked.
  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Akses Ditolak: Khusus Owner</h2>
        <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
          Menu dan pengelolaan data pengguna (User Management) hanya dapat diakses dan dikelola oleh{' '}
          <b>Owner</b>. Role Manager dan Sales tidak memiliki izin akses ke modul ini sesuai ketentuan hak akses aplikasi PesanBuah.id.
        </p>
      </div>
    );
  }

  const handleOpenAdd = () => {
    setEditingProfile(null);
    setName('');
    setEmail('');
    setPhone('');
    setRole('Sales');
    setPassword('password123');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Profile) => {
    setEditingProfile(p);
    setName(p.name);
    setEmail(p.email);
    setPhone(p.phone);
    setRole(p.role);
    setPassword('');
    setIsActive(p.active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toastError('Nama wajib diisi.');
    if (!email.trim()) return toastError('Email wajib diisi.');
    if (!phone.trim()) return toastError('Nomor HP wajib diisi.');
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      if (editingProfile) {
        await db.updateProfile(
          editingProfile.id,
          {
            name,
            email,
            phone,
            role,
            active: isActive,
            ...(password ? { password } : {}),
          },
          currentUser.role
        );
        success('Data pengguna berhasil diperbarui.');
      } else {
        await db.createProfile(
          {
            name,
            email,
            phone,
            role,
            active: isActive,
            password: password || 'password123',
          },
          currentUser.role
        );
        success('Pengguna baru berhasil ditambahkan.');
      }
      setIsModalOpen(false);
      loadData();
      refreshCurrentUser();
    } catch (err: any) {
      toastError(err.message || 'Gagal menyimpan user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (p: Profile) => {
    if (!currentUser) return;
    if (p.id === currentUser.id) {
      return toastError('Anda tidak dapat menonaktifkan akun Anda sendiri.');
    }
    try {
      await db.toggleProfileActive(p.id, currentUser.role);
      success(`Status akun ${p.name} berhasil diubah menjadi: ${!p.active ? 'Aktif' : 'Nonaktif'}`);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Gagal mengubah status aktif user.');
    }
  };

  const handleDelete = async (p: Profile) => {
    if (!currentUser) return;
    if (p.id === currentUser.id) {
      return toastError('Anda tidak dapat menghapus akun Anda sendiri.');
    }
    try {
      await db.deleteProfile(p.id, currentUser.role);
      success(`User "${p.name}" berhasil dihapus.`);
      setDeleteConfirmProfile(null);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Gagal menghapus user.');
    }
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'Owner':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Manager':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Sales':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              User Management (Khusus Owner)
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              {profiles.length} Akun
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Tambah, edit data, ubah role (Owner, Manager, Sales), aktifkan atau nonaktifkan akun pengguna internal.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Tambah User Baru
        </button>
      </div>

      {/* User List Table */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-xs">Memuat daftar user internal...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Pengguna</th>
                  <th className="py-3 px-4">Email / Login</th>
                  <th className="py-3 px-4">No. HP / WhatsApp</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status Akun</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map((p) => {
                  const isCurrent = currentUser?.id === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                          {p.name}
                          {isCurrent && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                              Anda
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-700">{p.email}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-700">{p.phone}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadge(
                            p.role
                          )}`}
                        >
                          {p.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActive(p)}
                          disabled={isCurrent}
                          title={isCurrent ? 'Akun sendiri tidak dapat dinonaktifkan' : 'Ubah status akun'}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer disabled:cursor-not-allowed ${
                            p.active
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                          }`}
                        >
                          {p.active ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit User"
                            className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => setDeleteConfirmProfile(p)}
                              title="Hapus User"
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-emerald-600 text-white">
              <h3 className="font-bold text-lg">
                {editingProfile ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Siti Aisyah"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Email / Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="siti@pesanbuah.id"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nomor HP / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081399887766"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Role Akses <span className="text-rose-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden font-semibold"
                >
                  <option value="Sales">Sales (Melihat prospect miliknya & input prospect)</option>
                  <option value="Manager">Manager (Mengelola Prospect, Zone, Jenis Usaha)</option>
                  <option value="Owner">Owner (Akses Penuh termasuk User Management)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  {editingProfile ? 'Kata Sandi Baru (Opsional)' : 'Kata Sandi'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingProfile ? 'Kosongkan jika tidak diubah' : 'password123'}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden"
                />
              </div>

              {/* Status Akun */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-700">Status Akun Aktif</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
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
                  {isSubmitting ? 'Menyimpan...' : 'Simpan User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirm Modal */}
      {deleteConfirmProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-gray-900 text-base">Hapus Pengguna</h3>
              <p className="text-xs text-gray-500 mt-1">
                Apakah Anda yakin ingin menghapus user "{deleteConfirmProfile.name}" ({deleteConfirmProfile.email})?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmProfile(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmProfile)}
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
