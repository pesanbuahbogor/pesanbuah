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

// Seed initial dataset if not present in local storage
function initializeLocalStorageSeed() {
  if (!localStorage.getItem(STORAGE_PROFILES)) {
    const initialProfiles: Profile[] = [
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
      {
        id: 'usr-sales-005',
        name: 'Doni Pratama (Nonaktif)',
        email: 'doni@pesanbuah.id',
        phone: '081255443322',
        role: 'Sales',
        active: false,
        created_at: '2026-02-01T12:00:00Z',
        password: 'password123',
      },
    ];
    localStorage.setItem(STORAGE_PROFILES, JSON.stringify(initialProfiles));
  }

  if (!localStorage.getItem(STORAGE_ZONES)) {
    const initialZones: Zone[] = [
      { id: 'zone-001', name: 'Zone 1 - Bogor Tengah & Pajajaran', active: true, created_at: '2026-01-10T08:00:00Z' },
      { id: 'zone-002', name: 'Zone 2 - Bogor Timur & Baranangsiang', active: true, created_at: '2026-01-10T08:00:00Z' },
      { id: 'zone-003', name: 'Zone 3 - Sentul & Babakan Madang', active: true, created_at: '2026-01-10T08:00:00Z' },
      { id: 'zone-004', name: 'Zone 4 - Cibinong & Depok Selatan', active: true, created_at: '2026-01-10T08:00:00Z' },
    ];
    localStorage.setItem(STORAGE_ZONES, JSON.stringify(initialZones));
  }

  if (!localStorage.getItem(STORAGE_ZONE_MEMBERS)) {
    const initialZoneMembers: ZoneMember[] = [
      { id: 'zm-001', zone_id: 'zone-001', user_id: 'usr-sales-003' },
      { id: 'zm-002', zone_id: 'zone-002', user_id: 'usr-sales-003' },
      { id: 'zm-003', zone_id: 'zone-003', user_id: 'usr-sales-004' },
      { id: 'zm-004', zone_id: 'zone-004', user_id: 'usr-sales-004' },
    ];
    localStorage.setItem(STORAGE_ZONE_MEMBERS, JSON.stringify(initialZoneMembers));
  }

  if (!localStorage.getItem(STORAGE_BUSINESS_TYPES)) {
    const initialBusinessTypes: BusinessType[] = [
      { id: 'bt-001', name: 'Cafe & Coffee Shop', active: true, created_at: '2026-01-10T08:00:00Z' },
      { id: 'bt-002', name: 'Restoran', active: true, created_at: '2026-01-10T08:00:00Z' },
      { id: 'bt-003', name: 'Hotel & Resort', active: true, created_at: '2026-01-10T08:00:00Z' },
      { id: 'bt-004', name: 'Juice Bar & Healthy Drink', active: true, created_at: '2026-01-10T08:00:00Z' },
      { id: 'bt-005', name: 'Bakery & Pastry', active: true, created_at: '2026-01-10T08:00:00Z' },
      { id: 'bt-006', name: 'Catering', active: true, created_at: '2026-01-10T08:00:00Z' },
      { id: 'bt-007', name: 'Toko Buah / Retail', active: true, created_at: '2026-01-10T08:00:00Z' },
      { id: 'bt-008', name: 'Lainnya', active: true, created_at: '2026-01-10T08:00:00Z' },
    ];
    localStorage.setItem(STORAGE_BUSINESS_TYPES, JSON.stringify(initialBusinessTypes));
  }

  if (!localStorage.getItem(STORAGE_PROSPECTS)) {
    const initialProspects: Prospect[] = [
      {
        id: 'prsp-001',
        business_name: 'Kopi Daun Pajajaran',
        pic_name: 'Dimas Setiawan',
        phone: '081288990011',
        business_type_id: 'bt-001',
        address: 'Jl. Pajajaran No. 45, Baranangsiang, Bogor Timur',
        latitude: -6.6015,
        longitude: 106.8080,
        gps_captured_at: '2026-02-15T10:30:00Z',
        zone_id: 'zone-001',
        sales_id: 'usr-sales-003',
        status: 'Follow Up',
        notes: 'Tertarik pasokan buah semangka, melon, dan lemon 50kg/minggu untuk menu mocktail & jus.',
        created_by: 'usr-sales-003',
        created_at: '2026-02-15T10:35:00Z',
        updated_at: '2026-02-16T14:20:00Z',
      },
      {
        id: 'prsp-002',
        business_name: 'Resto Sunda Gurih',
        pic_name: 'Ibu Ratna Dewi',
        phone: '081355667788',
        business_type_id: 'bt-002',
        address: 'Jl. Raya Sentul No. 12, Babakan Madang, Bogor',
        latitude: -6.5542,
        longitude: 106.8521,
        gps_captured_at: '2026-02-18T13:15:00Z',
        zone_id: 'zone-003',
        sales_id: 'usr-sales-004',
        status: 'Customer',
        notes: 'Sudah deal kontrak rutin buah potong dessert: pepaya calina, nanas madu, melon.',
        created_by: 'usr-sales-004',
        created_at: '2026-02-18T13:20:00Z',
        updated_at: '2026-02-22T09:10:00Z',
      },
      {
        id: 'prsp-003',
        business_name: 'Fresh Pure Juice Bar',
        pic_name: 'Kevin Pratama',
        phone: '081912345678',
        business_type_id: 'bt-004',
        address: 'Ruko Baranangsiang Indah Blok B-3, Bogor Timur',
        latitude: -6.6110,
        longitude: 106.8155,
        gps_captured_at: '2026-02-20T11:00:00Z',
        zone_id: 'zone-002',
        sales_id: 'usr-sales-003',
        status: 'Prospect',
        notes: 'Membutuhkan buah grade A harian (alpukat mentega, jeruk peras, strawberry). Minta pricelist B2B.',
        created_by: 'usr-sales-003',
        created_at: '2026-02-20T11:05:00Z',
        updated_at: '2026-02-20T11:05:00Z',
      },
      {
        id: 'prsp-004',
        business_name: 'Boutique Bakery & Cafe',
        pic_name: 'Sisca Tan',
        phone: '081744332211',
        business_type_id: 'bt-005',
        address: 'Jl. Padjadjaran No. 88, Bantarjati, Bogor Utara',
        latitude: -6.5823,
        longitude: 106.8042,
        gps_captured_at: '2026-02-24T15:40:00Z',
        zone_id: 'zone-001',
        sales_id: 'usr-sales-004',
        status: 'Tidak Jadi',
        notes: 'Saat ini masih terikat kontrak eksklusif dengan supplier lama sampai akhir tahun.',
        created_by: 'usr-sales-004',
        created_at: '2026-02-24T15:45:00Z',
        updated_at: '2026-02-25T10:00:00Z',
      },
    ];
    localStorage.setItem(STORAGE_PROSPECTS, JSON.stringify(initialProspects));
  }

  if (!localStorage.getItem(STORAGE_PHOTOS)) {
    const initialPhotos: ProspectPhoto[] = [
      {
        id: 'photo-001',
        prospect_id: 'prsp-001',
        file_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
        created_at: '2026-02-15T10:35:00Z',
      },
      {
        id: 'photo-002',
        prospect_id: 'prsp-002',
        file_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
        created_at: '2026-02-18T13:20:00Z',
      },
    ];
    localStorage.setItem(STORAGE_PHOTOS, JSON.stringify(initialPhotos));
  }
}

// Execute seed check
initializeLocalStorageSeed();

// Distance calculation between 2 coordinates (Haversine Formula in meters)
export function calculateGpsDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Clean phone numbers for exact comparison (removing non-digits, leading +62 or 0)
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('62')) {
    cleaned = '0' + cleaned.substring(2);
  }
  return cleaned;
}

// ============================================================================
// DATABASE REPOSITORY SERVICE
// ============================================================================

export const db = {
  // --------------------------------------------------------------------------
  // PROFILES / USER MANAGEMENT (OWNER ONLY)
  // --------------------------------------------------------------------------
  async getProfiles(): Promise<Profile[]> {
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (error) {
          console.warn('Supabase getProfiles failed, falling back to local storage:', error.message);
        } else if (data && data.length > 0) {
          return data as Profile[];
        }
      }
    } catch (err: any) {
      console.warn('Supabase getProfiles caught exception, using local storage:', err?.message);
    }
    const raw = localStorage.getItem(STORAGE_PROFILES);
    return raw ? JSON.parse(raw) : [];
  },

  async getProfileById(id: string): Promise<Profile | null> {
    const profiles = await this.getProfiles();
    return profiles.find((p) => p.id === id) || null;
  },

  async createProfile(
    profileData: Omit<Profile, 'id' | 'created_at'>,
    actorRole: UserRole
  ): Promise<Profile> {
    // ENFORCE RLS RULE: Only Owner can create users!
    if (actorRole !== 'Owner') {
      throw new Error('Akses Ditolak: Hanya role Owner yang memiliki izin menambah data user.');
    }

    const newProfile: Profile = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
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
      if (!error && data) {
        return data as Profile;
      }
      console.warn('Supabase createProfile error, saved locally:', error?.message);
    }

    const profiles = await this.getProfiles();
    // Check email uniqueness
    if (profiles.some((p) => p.email.toLowerCase() === newProfile.email.toLowerCase())) {
      throw new Error(`Email ${newProfile.email} sudah digunakan oleh user lain.`);
    }

    profiles.unshift(newProfile);
    localStorage.setItem(STORAGE_PROFILES, JSON.stringify(profiles));
    return newProfile;
  },

  async updateProfile(
    id: string,
    updates: Partial<Omit<Profile, 'id' | 'created_at'>>,
    actorRole: UserRole
  ): Promise<Profile> {
    // ENFORCE RLS RULE: Only Owner can edit users!
    if (actorRole !== 'Owner') {
      throw new Error('Akses Ditolak: Hanya role Owner yang memiliki izin mengubah data user.');
    }

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
      if (!error && data) {
        return data as Profile;
      }
      console.warn('Supabase updateProfile error, updated locally:', error?.message);
    }

    const profiles = await this.getProfiles();
    const index = profiles.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('User tidak ditemukan.');
    }

    // Check email uniqueness if email updated
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
    // ENFORCE RLS RULE: Only Owner can delete users!
    if (actorRole !== 'Owner') {
      throw new Error('Akses Ditolak: Hanya role Owner yang memiliki izin menghapus user.');
    }

    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) {
        console.warn('Supabase deleteProfile error, deleting locally:', error.message);
      }
    }

    let profiles = await this.getProfiles();
    profiles = profiles.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_PROFILES, JSON.stringify(profiles));

    // Also remove from zone_members
    let members: ZoneMember[] = JSON.parse(localStorage.getItem(STORAGE_ZONE_MEMBERS) || '[]');
    members = members.filter((m) => m.user_id !== id);
    localStorage.setItem(STORAGE_ZONE_MEMBERS, JSON.stringify(members));

    return true;
  },

  // --------------------------------------------------------------------------
  // ZONES (OWNER & MANAGER ONLY)
  // --------------------------------------------------------------------------
  async getZones(): Promise<Zone[]> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('zones').select('*').order('name', { ascending: true });
      if (!error && data) return data as Zone[];
    }
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
      id: 'zone-' + Math.random().toString(36).substring(2, 9),
      name: cleanName,
      active: true,
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('zones').insert([newZone]).select().single();
      if (!error && data) return data as Zone;
    }

    const zones = await this.getZones();
    if (zones.some((z) => z.name.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error(`Zone dengan nama "${cleanName}" sudah ada.`);
    }

    zones.push(newZone);
    localStorage.setItem(STORAGE_ZONES, JSON.stringify(zones));
    return newZone;
  },

  async updateZone(id: string, updates: Partial<Omit<Zone, 'id' | 'created_at'>>, actorRole: UserRole): Promise<Zone> {
    if (actorRole !== 'Owner' && actorRole !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat mengubah Zone.');
    }

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('zones').update(updates).eq('id', id).select().single();
      if (!error && data) return data as Zone;
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
      await supabase.from('zones').delete().eq('id', id);
    }

    let zones = await this.getZones();
    zones = zones.filter((z) => z.id !== id);
    localStorage.setItem(STORAGE_ZONES, JSON.stringify(zones));

    // Remove members for this zone
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
      if (!error && data) return data as ZoneMember[];
    }
    const raw = localStorage.getItem(STORAGE_ZONE_MEMBERS);
    return raw ? JSON.parse(raw) : [];
  },

  async setZoneSales(zoneId: string, salesUserIds: string[], actorRole: UserRole): Promise<void> {
    if (actorRole !== 'Owner' && actorRole !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat mengassign Sales ke Zone.');
    }

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('zone_members').delete().eq('zone_id', zoneId);
      if (salesUserIds.length > 0) {
        const rows = salesUserIds.map((userId) => ({
          zone_id: zoneId,
          user_id: userId,
        }));
        await supabase.from('zone_members').insert(rows);
      }
    }

    let allMembers = await this.getZoneMembers();
    allMembers = allMembers.filter((m) => m.zone_id !== zoneId);

    salesUserIds.forEach((uid) => {
      allMembers.push({
        id: 'zm-' + Math.random().toString(36).substring(2, 9),
        zone_id: zoneId,
        user_id: uid,
      });
    });

    localStorage.setItem(STORAGE_ZONE_MEMBERS, JSON.stringify(allMembers));
  },

  // --------------------------------------------------------------------------
  // BUSINESS TYPES (JENIS USAHA)
  // --------------------------------------------------------------------------
  async getBusinessTypes(): Promise<BusinessType[]> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('business_types').select('*').order('name', { ascending: true });
      if (!error && data) return data as BusinessType[];
    }
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
      id: 'bt-' + Math.random().toString(36).substring(2, 9),
      name: cleanName,
      active: true,
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('business_types').insert([newType]).select().single();
      if (!error && data) return data as BusinessType;
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
      if (!error && data) return data as BusinessType;
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

    // Check if any prospect uses this business type
    const prospects = await this.getProspects();
    if (prospects.some((p) => p.business_type_id === id)) {
      throw new Error('Jenis Usaha tidak dapat dihapus karena masih digunakan oleh data Calon Customer (Prospect). Anda dapat menonaktifkannya.');
    }

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('business_types').delete().eq('id', id);
    }

    let types = await this.getBusinessTypes();
    types = types.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_BUSINESS_TYPES, JSON.stringify(types));
    return true;
  },

  // --------------------------------------------------------------------------
  // PROSPECTS / CALON CUSTOMER (FITUR UTAMA)
  // --------------------------------------------------------------------------
  async getProspects(currentUser?: Profile | null): Promise<Prospect[]> {
    const supabase = getSupabase();
    let list: Prospect[] = [];

    if (supabase) {
      const query = supabase.from('prospects').select('*').order('created_at', { ascending: false });
      const { data, error } = await query;
      if (!error && data) {
        list = data as Prospect[];
      } else {
        const raw = localStorage.getItem(STORAGE_PROSPECTS);
        list = raw ? JSON.parse(raw) : [];
      }
    } else {
      const raw = localStorage.getItem(STORAGE_PROSPECTS);
      list = raw ? JSON.parse(raw) : [];
    }

    // If Sales role: filter to prospects assigned to them or created by them
    if (currentUser && currentUser.role === 'Sales') {
      return list.filter((p) => p.sales_id === currentUser.id || p.created_by === currentUser.id);
    }

    return list;
  },

  async getProspectById(id: string): Promise<Prospect | null> {
    const prospects = await this.getProspects();
    return prospects.find((p) => p.id === id) || null;
  },

  // DUPLICATE CHECK: Warning if duplicate by Phone, Business Name, or GPS distance <= 100m
  async checkDuplicate(params: {
    phone: string;
    business_name: string;
    latitude?: number | null;
    longitude?: number | null;
    excludeId?: string;
  }): Promise<DuplicateWarningInfo> {
    const allProspects = await this.getProspects();
    const profiles = await this.getProfiles();
    const profileMap = new Map(profiles.map((p) => [p.id, p.name]));

    const targetPhoneNorm = normalizePhoneNumber(params.phone);
    const targetNameNorm = params.business_name.trim().toLowerCase();

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

      // 2. Business name match (exact or very close)
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
    // Validate required fields
    if (!data.business_name?.trim()) throw new Error('Nama Usaha wajib diisi.');
    if (!data.pic_name?.trim()) throw new Error('Nama Pemilik / PIC wajib diisi.');
    if (!data.phone?.trim()) throw new Error('No. HP / WhatsApp wajib diisi.');
    if (!data.business_type_id?.trim()) throw new Error('Jenis Usaha wajib dipilih.');
    if (!data.address?.trim()) throw new Error('Alamat Usaha wajib diisi.');

    // If Sales creates it and no sales_id specified, auto assign to self
    let assignedSalesId = data.sales_id || null;
    if (currentUser.role === 'Sales') {
      assignedSalesId = currentUser.id;
    }

    const now = new Date().toISOString();
    const newProspect: Prospect = {
      id: 'prsp-' + Math.random().toString(36).substring(2, 9),
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
      const { data: inserted, error } = await supabase.from('prospects').insert([newProspect]).select().single();
      if (!error && inserted) return inserted as Prospect;
    }

    const prospects = await this.getProspects();
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

    // Sales can only update their own prospect
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
      const { data: updated, error } = await supabase.from('prospects').update(updates).eq('id', id).select().single();
      if (!error && updated) return updated as Prospect;
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

    // Owner and Manager can delete. Sales cannot delete unless authorized.
    if (currentUser.role === 'Sales') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat menghapus data Prospect.');
    }

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('prospects').delete().eq('id', id);
    }

    const raw = localStorage.getItem(STORAGE_PROSPECTS);
    let prospects: Prospect[] = raw ? JSON.parse(raw) : [];
    prospects = prospects.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_PROSPECTS, JSON.stringify(prospects));

    // Delete photos for this prospect
    const rawPhotos = localStorage.getItem(STORAGE_PHOTOS);
    let photos: ProspectPhoto[] = rawPhotos ? JSON.parse(rawPhotos) : [];
    photos = photos.filter((p) => p.prospect_id !== id);
    localStorage.setItem(STORAGE_PHOTOS, JSON.stringify(photos));

    return true;
  },

  // --------------------------------------------------------------------------
  // PROSPECT PHOTOS (SUPABASE STORAGE / LOCAL STORAGE)
  // --------------------------------------------------------------------------
  async getProspectPhotos(prospectId: string): Promise<ProspectPhoto[]> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('prospect_photos')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('created_at', { ascending: false });
      if (!error && data) return data as ProspectPhoto[];
    }

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
        } else {
          console.warn('Supabase storage upload failed, fallback to base64:', uploadError.message);
        }
      } catch (err) {
        console.warn('Storage upload error, fallback to base64:', err);
      }
    }

    // Fallback or local mode: read as Data URL
    if (!fileUrl) {
      fileUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    const newPhoto: ProspectPhoto = {
      id: 'photo-' + Math.random().toString(36).substring(2, 9),
      prospect_id: prospectId,
      file_url: fileUrl,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      const { data, error } = await supabase.from('prospect_photos').insert([newPhoto]).select().single();
      if (!error && data) return data as ProspectPhoto;
    }

    const raw = localStorage.getItem(STORAGE_PHOTOS);
    const photos: ProspectPhoto[] = raw ? JSON.parse(raw) : [];
    photos.unshift(newPhoto);
    localStorage.setItem(STORAGE_PHOTOS, JSON.stringify(photos));

    return newPhoto;
  },

  async deletePhoto(photoId: string): Promise<boolean> {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('prospect_photos').delete().eq('id', photoId);
    }

    const raw = localStorage.getItem(STORAGE_PHOTOS);
    let photos: ProspectPhoto[] = raw ? JSON.parse(raw) : [];
    photos = photos.filter((p) => p.id !== photoId);
    localStorage.setItem(STORAGE_PHOTOS, JSON.stringify(photos));

    return true;
  },

  // Reset database back to default seed for testing
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
