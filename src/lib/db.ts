import {
  Profile,
  Zone,
  ZoneMember,
  BusinessType,
  Prospect,
  ProspectPhoto,
  DuplicateWarningInfo,
  UserRole,
  ProspectStatus,
} from '../types';
import { getSupabase } from './supabase';

const STORAGE_PROFILES = 'pesanbuah_db_profiles_v1';
const STORAGE_ZONES = 'pesanbuah_db_zones_v1';
const STORAGE_ZONE_MEMBERS = 'pesanbuah_db_zone_members_v1';
const STORAGE_BUSINESS_TYPES = 'pesanbuah_db_business_types_v1';
const STORAGE_PROSPECTS = 'pesanbuah_db_prospects_v1';
const STORAGE_PHOTOS = 'pesanbuah_db_photos_v1';

// Default initial master data (used for offline fallback and for initial Supabase seeding if tables are empty)
export const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'usr-owner-001',
    name: 'Budi Santoso',
    email: 'owner@pesanbuah.id',
    phone: '081234567890',
    role: 'Owner',
    active: true,
    created_at: '2026-01-10T08:00:00Z',
    password: 'password123',
  },
  {
    id: 'usr-manager-002',
    name: 'Hendra Wijaya',
    email: 'manager@pesanbuah.id',
    phone: '081298765432',
    role: 'Manager',
    active: true,
    created_at: '2026-01-12T09:00:00Z',
    password: 'password123',
  },
  {
    id: 'usr-sales-003',
    name: 'Rian Saputra',
    email: 'rian@pesanbuah.id',
    phone: '081311223344',
    role: 'Sales',
    active: true,
    created_at: '2026-01-15T10:00:00Z',
    password: 'password123',
  },
  {
    id: 'usr-sales-004',
    name: 'Siti Aisyah',
    email: 'siti@pesanbuah.id',
    phone: '081399887766',
    role: 'Sales',
    active: true,
    created_at: '2026-01-20T11:00:00Z',
    password: 'password123',
  },
];

export const DEFAULT_ZONES: Zone[] = [
  { id: 'zone-001', name: 'Zone 1 - Bogor Tengah & Pajajaran', active: true, created_at: '2026-01-10T08:00:00Z' },
  { id: 'zone-002', name: 'Zone 2 - Bogor Timur & Baranangsiang', active: true, created_at: '2026-01-10T08:00:00Z' },
  { id: 'zone-003', name: 'Zone 3 - Sentul & Babakan Madang', active: true, created_at: '2026-01-10T08:00:00Z' },
  { id: 'zone-004', name: 'Zone 4 - Cibinong & Depok Selatan', active: true, created_at: '2026-01-10T08:00:00Z' },
];

export const DEFAULT_ZONE_MEMBERS: ZoneMember[] = [
  { id: 'zm-001', zone_id: 'zone-001', user_id: 'usr-sales-003' },
  { id: 'zm-002', zone_id: 'zone-002', user_id: 'usr-sales-003' },
  { id: 'zm-003', zone_id: 'zone-003', user_id: 'usr-sales-004' },
  { id: 'zm-004', zone_id: 'zone-004', user_id: 'usr-sales-004' },
];

export const DEFAULT_BUSINESS_TYPES: BusinessType[] = [
  { id: 'bt-001', name: 'Cafe & Coffee Shop', active: true, created_at: '2026-01-10T08:00:00Z' },
  { id: 'bt-002', name: 'Restoran', active: true, created_at: '2026-01-10T08:00:00Z' },
  { id: 'bt-003', name: 'Hotel & Resort', active: true, created_at: '2026-01-10T08:00:00Z' },
  { id: 'bt-004', name: 'Juice Bar & Healthy Drink', active: true, created_at: '2026-01-10T08:00:00Z' },
  { id: 'bt-005', name: 'Bakery & Pastry', active: true, created_at: '2026-01-10T08:00:00Z' },
  { id: 'bt-006', name: 'Catering', active: true, created_at: '2026-01-10T08:00:00Z' },
  { id: 'bt-007', name: 'Toko Buah / Retail', active: true, created_at: '2026-01-10T08:00:00Z' },
  { id: 'bt-008', name: 'Lainnya', active: true, created_at: '2026-01-10T08:00:00Z' },
];

// Helper to seed localStorage ONLY if Supabase is not connected
function initializeLocalStorageSeed() {
  if (!localStorage.getItem(STORAGE_PROFILES)) {
    localStorage.setItem(STORAGE_PROFILES, JSON.stringify(DEFAULT_PROFILES));
  }
  if (!localStorage.getItem(STORAGE_ZONES)) {
    localStorage.setItem(STORAGE_ZONES, JSON.stringify(DEFAULT_ZONES));
  }
  if (!localStorage.getItem(STORAGE_ZONE_MEMBERS)) {
    localStorage.setItem(STORAGE_ZONE_MEMBERS, JSON.stringify(DEFAULT_ZONE_MEMBERS));
  }
  if (!localStorage.getItem(STORAGE_BUSINESS_TYPES)) {
    localStorage.setItem(STORAGE_BUSINESS_TYPES, JSON.stringify(DEFAULT_BUSINESS_TYPES));
  }
  if (!localStorage.getItem(STORAGE_PROSPECTS)) {
    localStorage.setItem(STORAGE_PROSPECTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_PHOTOS)) {
    localStorage.setItem(STORAGE_PHOTOS, JSON.stringify([]));
  }
}

// Generate universally safe unique ID (works for both UUID and TEXT PostgreSQL columns)
function generateUniqueId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Distance helper
function calculateGpsDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

// ============================================================================
// PERMISSION DENIED LISTENER & HELPERS
// ============================================================================

type PermissionListener = (tableName: string) => void;
const permissionListeners: Set<PermissionListener> = new Set();
let lastPermissionDeniedTable: string | null = null;

export function isPermissionDenied(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  return (
    err.code === '42501' ||
    msg.includes('permission denied') ||
    msg.includes('row-level security') ||
    msg.includes('violates row-level security')
  );
}

export function notifyPermissionDenied(tableName: string) {
  lastPermissionDeniedTable = tableName;
  permissionListeners.forEach((fn) => {
    try {
      fn(tableName);
    } catch (e) {
      console.error(e);
    }
  });
}

export function subscribeToPermissionDenied(listener: PermissionListener): () => void {
  permissionListeners.add(listener);
  if (lastPermissionDeniedTable) {
    listener(lastPermissionDeniedTable);
  }
  return () => {
    permissionListeners.delete(listener);
  };
}

export function getPermissionDeniedTable(): string | null {
  return lastPermissionDeniedTable;
}

export function clearPermissionDenied() {
  lastPermissionDeniedTable = null;
}

// ============================================================================
// DIRECT DATABASE SERVICE (NO LOCAL CACHE WHEN SUPABASE IS CONNECTED)
// ============================================================================

export const db = {
  /**
   * Automatically initializes essential master tables (profiles, zones, business types, zone members)
   * in Supabase Cloud if the database tables are newly created and empty.
   * Does NOT seed mock prospects - prospects are purely real field data.
   */
  async ensureAutoSyncedWithSupabase(): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) {
      initializeLocalStorageSeed();
      return;
    }

    try {
      // 1. Check Profiles table in Supabase
      const { data: remoteProfiles, error: pErr } = await supabase.from('profiles').select('id').limit(1);
      if (pErr) {
        if (isPermissionDenied(pErr)) {
          notifyPermissionDenied('profiles');
        }
      } else if (!remoteProfiles || remoteProfiles.length === 0) {
        await supabase.from('profiles').upsert(DEFAULT_PROFILES, { onConflict: 'id' });
      }

      // 2. Check Zones table in Supabase
      const { data: remoteZones, error: zErr } = await supabase.from('zones').select('id').limit(1);
      if (zErr) {
        if (isPermissionDenied(zErr)) {
          notifyPermissionDenied('zones');
        }
      } else if (!remoteZones || remoteZones.length === 0) {
        await supabase.from('zones').upsert(DEFAULT_ZONES, { onConflict: 'id' });
      }

      // 3. Check Business Types in Supabase
      const { data: remoteTypes, error: btErr } = await supabase.from('business_types').select('id').limit(1);
      if (btErr) {
        if (isPermissionDenied(btErr)) {
          notifyPermissionDenied('business_types');
        }
      } else if (!remoteTypes || remoteTypes.length === 0) {
        await supabase.from('business_types').upsert(DEFAULT_BUSINESS_TYPES, { onConflict: 'id' });
      }

      // 4. Check Zone Members in Supabase
      const { data: remoteMembers, error: zmErr } = await supabase.from('zone_members').select('id').limit(1);
      if (zmErr) {
        if (isPermissionDenied(zmErr)) {
          notifyPermissionDenied('zone_members');
        }
      } else if (!remoteMembers || remoteMembers.length === 0) {
        await supabase.from('zone_members').upsert(DEFAULT_ZONE_MEMBERS, { onConflict: 'id' });
      }
    } catch (err) {
      console.warn('Initial Supabase master data check error:', err);
    }
  },

  // --------------------------------------------------------------------------
  // PROFILES / USER MANAGEMENT (OWNER ONLY)
  // --------------------------------------------------------------------------
  async getProfiles(): Promise<Profile[]> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (isPermissionDenied(error)) {
          notifyPermissionDenied('profiles');
          console.warn('Supabase profiles permission denied. Using master fallback profiles:', error.message);
          return DEFAULT_PROFILES;
        }
        throw new Error(`Database Supabase Error [profiles]: ${error.message}`);
      }
      return (data || []) as Profile[];
    }

    initializeLocalStorageSeed();
    const raw = localStorage.getItem(STORAGE_PROFILES);
    return raw ? JSON.parse(raw) : [];
  },

  async getProfileById(id: string): Promise<Profile | null> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        if (isPermissionDenied(error)) {
          notifyPermissionDenied('profiles');
          return DEFAULT_PROFILES.find((p) => p.id === id) || null;
        }
        throw new Error(`Database Supabase Error [profiles]: ${error.message}`);
      }
      return (data as Profile) || null;
    }

    const profiles = await this.getProfiles();
    return profiles.find((p) => p.id === id) || null;
  },

  async createProfile(
    profileData: Omit<Profile, 'id' | 'created_at'>,
    actorRole: UserRole
  ): Promise<Profile> {
    if (actorRole !== 'Owner') {
      throw new Error('Akses Ditolak: Hanya role Owner yang memiliki izin menambah data user.');
    }

    const newProfile: Profile = {
      id: generateUniqueId('usr'),
      name: profileData.name.trim(),
      email: profileData.email.trim().toLowerCase(),
      phone: profileData.phone.trim(),
      role: profileData.role,
      active: profileData.active ?? true,
      created_at: new Date().toISOString(),
      password: profileData.password || 'password123',
    };

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('profiles').insert([newProfile]).select().single();
      if (error) {
        throw new Error(`Gagal menyimpan Profil ke Supabase: ${error.message}`);
      }
      return data as Profile;
    }

    const profiles = await this.getProfiles();
    if (profiles.some((p) => p.email.toLowerCase() === newProfile.email.toLowerCase())) {
      throw new Error(`Email "${newProfile.email}" sudah digunakan oleh user lain.`);
    }

    profiles.push(newProfile);
    localStorage.setItem(STORAGE_PROFILES, JSON.stringify(profiles));
    return newProfile;
  },

  async updateProfile(
    id: string,
    updates: Partial<Omit<Profile, 'id' | 'created_at'>>,
    actorRole: UserRole
  ): Promise<Profile> {
    if (actorRole !== 'Owner') {
      throw new Error('Akses Ditolak: Hanya role Owner yang memiliki izin mengubah data user.');
    }

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Gagal mengubah Profil di Supabase: ${error.message}`);
      }
      return data as Profile;
    }

    const profiles = await this.getProfiles();
    const index = profiles.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('User tidak ditemukan.');
    }

    if (updates.email) {
      const emailConflict = profiles.some(
        (p) => p.id !== id && p.email.toLowerCase() === updates.email!.toLowerCase()
      );
      if (emailConflict) {
        throw new Error(`Email ${updates.email} sudah digunakan oleh user lain.`);
      }
    }

    profiles[index] = {
      ...profiles[index],
      ...updates,
      email: updates.email ? updates.email.trim().toLowerCase() : profiles[index].email,
      name: updates.name ? updates.name.trim() : profiles[index].name,
      phone: updates.phone ? updates.phone.trim() : profiles[index].phone,
    };

    localStorage.setItem(STORAGE_PROFILES, JSON.stringify(profiles));
    return profiles[index];
  },

  async toggleProfileActive(id: string, actorRole: UserRole): Promise<Profile> {
    if (actorRole !== 'Owner') {
      throw new Error('Akses Ditolak: Hanya role Owner yang dapat mengaktifkan / menonaktifkan user.');
    }
    const profile = await this.getProfileById(id);
    if (!profile) throw new Error('User tidak ditemukan.');
    return this.updateProfile(id, { active: !profile.active }, actorRole);
  },

  async deleteProfile(id: string, actorRole: UserRole): Promise<boolean> {
    if (actorRole !== 'Owner') {
      throw new Error('Akses Ditolak: Hanya role Owner yang memiliki izin menghapus user.');
    }

    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) {
        throw new Error(`Gagal menghapus user di Supabase: ${error.message}`);
      }
      return true;
    }

    let profiles = await this.getProfiles();
    profiles = profiles.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_PROFILES, JSON.stringify(profiles));
    return true;
  },

  // --------------------------------------------------------------------------
  // ZONES / WILAYAH OPERASIONAL (OWNER & MANAGER)
  // --------------------------------------------------------------------------
  async getZones(): Promise<Zone[]> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('zones')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        if (isPermissionDenied(error)) {
          notifyPermissionDenied('zones');
          console.warn('Supabase zones permission denied. Returning default zones.');
          return DEFAULT_ZONES;
        }
        throw new Error(`Database Supabase Error [zones]: ${error.message}`);
      }
      return (data || []) as Zone[];
    }

    initializeLocalStorageSeed();
    const raw = localStorage.getItem(STORAGE_ZONES);
    return raw ? JSON.parse(raw) : [];
  },

  async createZone(name: string, actorRole: UserRole): Promise<Zone> {
    if (actorRole !== 'Owner' && actorRole !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat menambah Zone.');
    }
    const cleanName = name.trim();
    if (!cleanName) throw new Error('Nama Zone tidak boleh kosong.');

    const newZone: Zone = {
      id: generateUniqueId('zone'),
      name: cleanName,
      active: true,
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('zones').insert([newZone]).select().single();
      if (error) {
        throw new Error(`Gagal menyimpan Zone ke Supabase: ${error.message}`);
      }
      return data as Zone;
    }

    const zones = await this.getZones();
    if (zones.some((z) => z.name.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error(`Zone dengan nama "${cleanName}" sudah ada.`);
    }

    zones.push(newZone);
    localStorage.setItem(STORAGE_ZONES, JSON.stringify(zones));
    return newZone;
  },

  async updateZone(
    id: string,
    updates: Partial<Omit<Zone, 'id' | 'created_at'>>,
    actorRole: UserRole
  ): Promise<Zone> {
    if (actorRole !== 'Owner' && actorRole !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat mengubah Zone.');
    }

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('zones').update(updates).eq('id', id).select().single();
      if (error) {
        throw new Error(`Gagal mengubah Zone di Supabase: ${error.message}`);
      }
      return data as Zone;
    }

    const zones = await this.getZones();
    const idx = zones.findIndex((z) => z.id === id);
    if (idx === -1) throw new Error('Zone tidak ditemukan.');

    if (updates.name) {
      const nameConflict = zones.some(
        (z) => z.id !== id && z.name.toLowerCase() === updates.name!.trim().toLowerCase()
      );
      if (nameConflict) throw new Error(`Zone dengan nama "${updates.name}" sudah ada.`);
    }

    zones[idx] = {
      ...zones[idx],
      ...updates,
      name: updates.name ? updates.name.trim() : zones[idx].name,
    };
    localStorage.setItem(STORAGE_ZONES, JSON.stringify(zones));
    return zones[idx];
  },

  async deleteZone(id: string, actorRole: UserRole): Promise<boolean> {
    if (actorRole !== 'Owner' && actorRole !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat menghapus Zone.');
    }

    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('zones').delete().eq('id', id);
      if (error) {
        throw new Error(`Gagal menghapus Zone di Supabase: ${error.message}`);
      }
      await supabase.from('zone_members').delete().eq('zone_id', id);
      return true;
    }

    let zones = await this.getZones();
    zones = zones.filter((z) => z.id !== id);
    localStorage.setItem(STORAGE_ZONES, JSON.stringify(zones));

    let members: ZoneMember[] = JSON.parse(localStorage.getItem(STORAGE_ZONE_MEMBERS) || '[]');
    members = members.filter((m) => m.zone_id !== id);
    localStorage.setItem(STORAGE_ZONE_MEMBERS, JSON.stringify(members));

    return true;
  },

  // --------------------------------------------------------------------------
  // ZONE MEMBERS (ASSIGN SALES TO ZONE)
  // --------------------------------------------------------------------------
  async getZoneMembers(): Promise<ZoneMember[]> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('zone_members').select('*');
      if (error) {
        if (isPermissionDenied(error)) {
          notifyPermissionDenied('zone_members');
          return DEFAULT_ZONE_MEMBERS;
        }
        throw new Error(`Database Supabase Error [zone_members]: ${error.message}`);
      }
      return (data || []) as ZoneMember[];
    }

    initializeLocalStorageSeed();
    const raw = localStorage.getItem(STORAGE_ZONE_MEMBERS);
    return raw ? JSON.parse(raw) : [];
  },

  async setZoneSales(zoneId: string, salesUserIds: string[], actorRole: UserRole): Promise<void> {
    if (actorRole !== 'Owner' && actorRole !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat mengassign Sales ke Zone.');
    }

    const supabase = getSupabase();
    if (supabase) {
      const { error: delErr } = await supabase.from('zone_members').delete().eq('zone_id', zoneId);
      if (delErr) {
        throw new Error(`Gagal update penugasan sales di Supabase: ${delErr.message}`);
      }

      if (salesUserIds.length > 0) {
        const rows = salesUserIds.map((userId) => ({
          id: generateUniqueId('zm'),
          zone_id: zoneId,
          user_id: userId,
        }));
        const { error: insErr } = await supabase.from('zone_members').insert(rows);
        if (insErr) {
          throw new Error(`Gagal menyimpan penugasan sales ke Supabase: ${insErr.message}`);
        }
      }
      return;
    }

    let allMembers = await this.getZoneMembers();
    allMembers = allMembers.filter((m) => m.zone_id !== zoneId);

    salesUserIds.forEach((uid) => {
      allMembers.push({
        id: generateUniqueId('zm'),
        zone_id: zoneId,
        user_id: uid,
      });
    });

    localStorage.setItem(STORAGE_ZONE_MEMBERS, JSON.stringify(allMembers));
  },

  // --------------------------------------------------------------------------
  // BUSINESS TYPES / JENIS USAHA (OWNER & MANAGER)
  // --------------------------------------------------------------------------
  async getBusinessTypes(): Promise<BusinessType[]> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('business_types')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        if (isPermissionDenied(error)) {
          notifyPermissionDenied('business_types');
          return DEFAULT_BUSINESS_TYPES;
        }
        throw new Error(`Database Supabase Error [business_types]: ${error.message}`);
      }
      return (data || []) as BusinessType[];
    }

    initializeLocalStorageSeed();
    const raw = localStorage.getItem(STORAGE_BUSINESS_TYPES);
    return raw ? JSON.parse(raw) : [];
  },

  async createBusinessType(name: string, actorRole: UserRole): Promise<BusinessType> {
    if (actorRole !== 'Owner' && actorRole !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat menambah Jenis Usaha.');
    }
    const cleanName = name.trim();
    if (!cleanName) throw new Error('Nama Jenis Usaha tidak boleh kosong.');

    const newType: BusinessType = {
      id: generateUniqueId('bt'),
      name: cleanName,
      active: true,
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('business_types').insert([newType]).select().single();
      if (error) {
        throw new Error(`Gagal menyimpan Jenis Usaha ke Supabase: ${error.message}`);
      }
      return data as BusinessType;
    }

    const types = await this.getBusinessTypes();
    if (types.some((t) => t.name.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error(`Jenis Usaha "${cleanName}" sudah ada.`);
    }

    types.push(newType);
    localStorage.setItem(STORAGE_BUSINESS_TYPES, JSON.stringify(types));
    return newType;
  },

  async updateBusinessType(
    id: string,
    updates: Partial<Omit<BusinessType, 'id' | 'created_at'>>,
    actorRole: UserRole
  ): Promise<BusinessType> {
    if (actorRole !== 'Owner' && actorRole !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat mengubah Jenis Usaha.');
    }

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('business_types').update(updates).eq('id', id).select().single();
      if (error) {
        throw new Error(`Gagal mengubah Jenis Usaha di Supabase: ${error.message}`);
      }
      return data as BusinessType;
    }

    const types = await this.getBusinessTypes();
    const idx = types.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Jenis Usaha tidak ditemukan.');

    if (updates.name) {
      const nameConflict = types.some(
        (t) => t.id !== id && t.name.toLowerCase() === updates.name!.trim().toLowerCase()
      );
      if (nameConflict) throw new Error(`Jenis Usaha "${updates.name}" sudah ada.`);
    }

    types[idx] = {
      ...types[idx],
      ...updates,
      name: updates.name ? updates.name.trim() : types[idx].name,
    };
    localStorage.setItem(STORAGE_BUSINESS_TYPES, JSON.stringify(types));
    return types[idx];
  },

  async deleteBusinessType(id: string, actorRole: UserRole): Promise<boolean> {
    if (actorRole !== 'Owner' && actorRole !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat menghapus Jenis Usaha.');
    }

    const prospects = await this.getProspects();
    if (prospects.some((p) => p.business_type_id === id)) {
      throw new Error('Jenis Usaha tidak dapat dihapus karena masih digunakan oleh data Calon Customer (Prospect). Anda dapat menonaktifkannya.');
    }

    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('business_types').delete().eq('id', id);
      if (error) {
        throw new Error(`Gagal menghapus Jenis Usaha di Supabase: ${error.message}`);
      }
      return true;
    }

    let types = await this.getBusinessTypes();
    types = types.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_BUSINESS_TYPES, JSON.stringify(types));
    return true;
  },

  // --------------------------------------------------------------------------
  // PROSPECTS / DATABASE CALON CUSTOMER (SEMUA LEVEL ROLE)
  // --------------------------------------------------------------------------
  async getProspects(currentUser?: Profile | null): Promise<Prospect[]> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (isPermissionDenied(error)) {
          notifyPermissionDenied('prospects');
          throw new Error('Database Supabase Error: Izin akses tabel ditolak (permission denied for table prospects). Silakan jalankan script SQL GRANT di Supabase SQL Editor.');
        }
        console.error('Supabase getProspects error:', error);
        throw new Error(`Database Supabase Error: ${error.message} (Kode: ${error.code || 'UNKNOWN'})`);
      }

      let list = (data || []) as Prospect[];
      // Sales only sees their own assigned or created prospects
      if (currentUser && currentUser.role === 'Sales') {
        list = list.filter(
          (p) => p.sales_id === currentUser.id || p.created_by === currentUser.id
        );
      }
      return list;
    }

    // Only if Supabase is not configured (offline mode)
    initializeLocalStorageSeed();
    const raw = localStorage.getItem(STORAGE_PROSPECTS);
    let list: Prospect[] = raw ? JSON.parse(raw) : [];

    if (currentUser && currentUser.role === 'Sales') {
      list = list.filter(
        (p) => p.sales_id === currentUser.id || p.created_by === currentUser.id
      );
    }
    return list;
  },

  async getProspectById(id: string): Promise<Prospect | null> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new Error(`Database Supabase Error [prospect]: ${error.message}`);
      }
      return (data as Prospect) || null;
    }

    const list = await this.getProspects();
    return list.find((p) => p.id === id) || null;
  },

  async checkDuplicate(params: {
    phone?: string;
    business_name?: string;
    latitude?: number | null;
    longitude?: number | null;
    excludeId?: string;
  }): Promise<DuplicateWarningInfo> {
    const allProspects = await this.getProspects();
    const allProfiles = await this.getProfiles();
    const profileMap = new Map(allProfiles.map((p) => [p.id, p.name]));

    const targetPhoneNorm = params.phone ? normalizePhoneNumber(params.phone) : '';
    const targetNameNorm = params.business_name?.trim().toLowerCase() || '';

    let matchByPhone = false;
    let matchByName = false;
    let matchByGps = false;

    const matchedList: {
      id: string;
      business_name: string;
      pic_name: string;
      phone: string;
      sales_name?: string;
    }[] = [];

    for (const p of allProspects) {
      if (params.excludeId && p.id === params.excludeId) continue;

      let isMatch = false;

      // 1. Phone match
      if (targetPhoneNorm && targetPhoneNorm.length >= 6) {
        const pNorm = normalizePhoneNumber(p.phone);
        if (pNorm === targetPhoneNorm) {
          matchByPhone = true;
          isMatch = true;
        }
      }

      // 2. Business name match
      if (targetNameNorm && p.business_name.trim().toLowerCase() === targetNameNorm) {
        matchByName = true;
        isMatch = true;
      }

      // 3. GPS proximity match (within 100 meters)
      if (
        params.latitude != null &&
        params.longitude != null &&
        p.latitude != null &&
        p.longitude != null
      ) {
        const dist = calculateGpsDistanceMeters(
          params.latitude,
          params.longitude,
          p.latitude,
          p.longitude
        );
        if (dist <= 100) {
          matchByGps = true;
          isMatch = true;
        }
      }

      if (isMatch) {
        matchedList.push({
          id: p.id,
          business_name: p.business_name,
          pic_name: p.pic_name,
          phone: p.phone,
          sales_name: p.sales_id ? profileMap.get(p.sales_id) : 'Belum diassign',
        });
      }
    }

    return {
      matchByPhone,
      matchByName,
      matchByGps,
      matchedProspects: matchedList,
    };
  },

  async createProspect(
    data: {
      business_name: string;
      pic_name: string;
      phone: string;
      business_type_id: string;
      address: string;
      latitude?: number | null;
      longitude?: number | null;
      gps_captured_at?: string | null;
      zone_id?: string | null;
      sales_id?: string | null;
      status?: ProspectStatus;
      notes?: string | null;
    },
    currentUser: Profile
  ): Promise<Prospect> {
    if (!data.business_name?.trim()) throw new Error('Nama Usaha wajib diisi.');
    if (!data.pic_name?.trim()) throw new Error('Nama Pemilik / PIC wajib diisi.');
    if (!data.phone?.trim()) throw new Error('No. HP / WhatsApp wajib diisi.');
    if (!data.business_type_id?.trim()) throw new Error('Jenis Usaha wajib dipilih.');
    if (!data.address?.trim()) throw new Error('Alamat Usaha wajib diisi.');

    let assignedSalesId = data.sales_id || null;
    if (currentUser.role === 'Sales') {
      assignedSalesId = currentUser.id;
    }

    const now = new Date().toISOString();
    const newProspect: Prospect = {
      id: generateUniqueId('prsp'),
      business_name: data.business_name.trim(),
      pic_name: data.pic_name.trim(),
      phone: data.phone.trim(),
      business_type_id: data.business_type_id,
      address: data.address.trim(),
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      gps_captured_at: data.gps_captured_at ?? null,
      zone_id: data.zone_id ?? null,
      sales_id: assignedSalesId,
      status: data.status || 'Prospect',
      notes: data.notes?.trim() || null,
      created_by: currentUser.id,
      created_at: now,
      updated_at: now,
    };

    const supabase = getSupabase();
    if (supabase) {
      const { data: inserted, error } = await supabase
        .from('prospects')
        .insert([newProspect])
        .select()
        .single();

      if (error) {
        if (isPermissionDenied(error)) {
          notifyPermissionDenied('prospects');
          throw new Error('Database Supabase Error: Izin akses tabel ditolak (permission denied). Silakan jalankan script SQL GRANT di Supabase SQL Editor.');
        }
        console.error('Supabase createProspect error:', error);
        throw new Error(
          `Gagal menyimpan ke database Supabase: ${error.message} (Kode: ${error.code || 'RLS'}). Pastikan skrip SQL di tab Supabase telah dijalankan.`
        );
      }
      return inserted as Prospect;
    }

    // Offline mode only
    const raw = localStorage.getItem(STORAGE_PROSPECTS);
    const prospects: Prospect[] = raw ? JSON.parse(raw) : [];
    prospects.unshift(newProspect);
    localStorage.setItem(STORAGE_PROSPECTS, JSON.stringify(prospects));
    return newProspect;
  },

  async updateProspect(
    id: string,
    data: Partial<Omit<Prospect, 'id' | 'created_by' | 'created_at'>>,
    currentUser: Profile
  ): Promise<Prospect> {
    const existing = await this.getProspectById(id);
    if (!existing) throw new Error('Data Prospect tidak ditemukan.');

    if (currentUser.role === 'Sales' && existing.sales_id !== currentUser.id && existing.created_by !== currentUser.id) {
      throw new Error('Akses Ditolak: Anda hanya dapat mengubah data prospect yang menjadi tanggung jawab Anda.');
    }

    const now = new Date().toISOString();
    const updates = {
      ...data,
      updated_at: now,
    };

    const supabase = getSupabase();
    if (supabase) {
      const { data: updated, error } = await supabase
        .from('prospects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase updateProspect error:', error);
        throw new Error(`Gagal mengubah data di Supabase: ${error.message}`);
      }
      return updated as Prospect;
    }

    const raw = localStorage.getItem(STORAGE_PROSPECTS);
    const prospects: Prospect[] = raw ? JSON.parse(raw) : [];
    const idx = prospects.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Data Prospect tidak ditemukan.');

    prospects[idx] = {
      ...prospects[idx],
      ...updates,
      business_name: updates.business_name ? updates.business_name.trim() : prospects[idx].business_name,
      pic_name: updates.pic_name ? updates.pic_name.trim() : prospects[idx].pic_name,
      phone: updates.phone ? updates.phone.trim() : prospects[idx].phone,
      address: updates.address ? updates.address.trim() : prospects[idx].address,
    };

    localStorage.setItem(STORAGE_PROSPECTS, JSON.stringify(prospects));
    return prospects[idx];
  },

  async updateProspectStatus(id: string, status: ProspectStatus, currentUser: Profile): Promise<Prospect> {
    return this.updateProspect(id, { status }, currentUser);
  },

  async deleteProspect(id: string, currentUser: Profile): Promise<boolean> {
    const existing = await this.getProspectById(id);
    if (!existing) throw new Error('Data Prospect tidak ditemukan.');

    if (currentUser.role === 'Sales') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat menghapus data Prospect.');
    }

    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('prospects').delete().eq('id', id);
      if (error) {
        console.error('Supabase deleteProspect error:', error);
        throw new Error(`Gagal menghapus dari Supabase: ${error.message}`);
      }
      await supabase.from('prospect_photos').delete().eq('prospect_id', id);
      return true;
    }

    const raw = localStorage.getItem(STORAGE_PROSPECTS);
    let prospects: Prospect[] = raw ? JSON.parse(raw) : [];
    prospects = prospects.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_PROSPECTS, JSON.stringify(prospects));

    const rawPhotos = localStorage.getItem(STORAGE_PHOTOS);
    let photos: ProspectPhoto[] = rawPhotos ? JSON.parse(rawPhotos) : [];
    photos = photos.filter((p) => p.prospect_id !== id);
    localStorage.setItem(STORAGE_PHOTOS, JSON.stringify(photos));

    return true;
  },

  // --------------------------------------------------------------------------
  // PROSPECT PHOTOS (DIRECT SUPABASE / BASE64 STORAGE)
  // --------------------------------------------------------------------------
  async getProspectPhotos(prospectId: string): Promise<ProspectPhoto[]> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('prospect_photos')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Database Supabase Error [photos]: ${error.message}`);
      }
      return (data || []) as ProspectPhoto[];
    }

    initializeLocalStorageSeed();
    const raw = localStorage.getItem(STORAGE_PHOTOS);
    const photos: ProspectPhoto[] = raw ? JSON.parse(raw) : [];
    return photos.filter((p) => p.prospect_id === prospectId);
  },

  async uploadPhoto(prospectId: string, file: File): Promise<ProspectPhoto> {
    const supabase = getSupabase();
    let fileUrl = '';

    if (supabase) {
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${prospectId}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('prospect-photos')
          .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('prospect-photos')
            .getPublicUrl(filePath);
          fileUrl = publicUrlData.publicUrl;
        }
      } catch (err) {
        console.warn('Storage bucket upload caught error, fallback to data url:', err);
      }
    }

    if (!fileUrl) {
      fileUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    const newPhoto: ProspectPhoto = {
      id: generateUniqueId('photo'),
      prospect_id: prospectId,
      file_url: fileUrl,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('prospect_photos')
        .insert([newPhoto])
        .select()
        .single();

      if (error) {
        throw new Error(`Gagal menyimpan foto ke database Supabase: ${error.message}`);
      }
      return data as ProspectPhoto;
    }

    const raw = localStorage.getItem(STORAGE_PHOTOS);
    const photos: ProspectPhoto[] = raw ? JSON.parse(raw) : [];
    photos.push(newPhoto);
    localStorage.setItem(STORAGE_PHOTOS, JSON.stringify(photos));
    return newPhoto;
  },

  async deletePhoto(photoId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('prospect_photos').delete().eq('id', photoId);
      if (error) {
        throw new Error(`Gagal menghapus foto di Supabase: ${error.message}`);
      }
      return true;
    }

    const raw = localStorage.getItem(STORAGE_PHOTOS);
    let photos: ProspectPhoto[] = raw ? JSON.parse(raw) : [];
    photos = photos.filter((p) => p.id !== photoId);
    localStorage.setItem(STORAGE_PHOTOS, JSON.stringify(photos));
    return true;
  },

  // Reset database back to default seed for testing in offline mode
  resetToInitialSeed() {
    localStorage.removeItem(STORAGE_PROFILES);
    localStorage.removeItem(STORAGE_ZONES);
    localStorage.removeItem(STORAGE_ZONE_MEMBERS);
    localStorage.removeItem(STORAGE_BUSINESS_TYPES);
    localStorage.removeItem(STORAGE_PROSPECTS);
    localStorage.removeItem(STORAGE_PHOTOS);
    initializeLocalStorageSeed();
  },
};
