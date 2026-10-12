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
  Order,
  OrderStatus,
  OrderItem,
  QuickFruitItem,
  StockItem,
  StockInbound,
  CanvasTrip,
  CanvasTripItem,
  StockMovementLog,
  MovementType,
  DeliverySlot,
  PaymentMethod,
  PaymentStatus,
} from '../types';
import { getSupabase } from './supabase';

const STORAGE_PROFILES = 'pesanbuah_db_profiles_v1';
const STORAGE_ZONES = 'pesanbuah_db_zones_v1';
const STORAGE_ZONE_MEMBERS = 'pesanbuah_db_zone_members_v1';
const STORAGE_BUSINESS_TYPES = 'pesanbuah_db_business_types_v1';
const STORAGE_PROSPECTS = 'pesanbuah_db_prospects_v1';
const STORAGE_PHOTOS = 'pesanbuah_db_photos_v1';
const STORAGE_ORDERS = 'pesanbuah_db_orders_v1';
const STORAGE_REMITTANCE_MAP = 'pesanbuah_db_remittance_map_v1';
const STORAGE_QUICK_FRUITS = 'pesanbuah_db_quick_fruits_v1';
const STORAGE_STOCK_ITEMS = 'pesanbuah_db_stock_items_v1';
const STORAGE_STOCK_INBOUNDS = 'pesanbuah_db_stock_inbounds_v1';
const STORAGE_CANVAS_TRIPS = 'pesanbuah_db_canvas_trips_v1';
const STORAGE_STOCK_LOGS = 'pesanbuah_db_stock_logs_v1';
const STORAGE_DELETED_FRUITS = 'pesanbuah_db_deleted_fruits_v1';

export const DEFAULT_QUICK_FRUITS: QuickFruitItem[] = [
  { id: 'qf-1', name: 'Jeruk Medan Manis', unit: 'kg', price: 28000, emoji: '🍊', is_active: true },
  { id: 'qf-2', name: 'Jeruk Peras Segar', unit: 'kg', price: 18000, emoji: '🍊', is_active: true },
  { id: 'qf-3', name: 'Pisang Cavendish Super', unit: 'dus', price: 185000, emoji: '🍌', is_active: true },
  { id: 'qf-4', name: 'Lemon California Segar', unit: 'kg', price: 25000, emoji: '🍋', is_active: true },
  { id: 'qf-5', name: 'Semangka Non Biji Merah', unit: 'kg', price: 9500, emoji: '🍉', is_active: true },
  { id: 'qf-6', name: 'Melon Sky Rocket', unit: 'kg', price: 14000, emoji: '🍈', is_active: true },
  { id: 'qf-7', name: 'Alpukat Mentega Super', unit: 'kg', price: 28000, emoji: '🥑', is_active: true },
  { id: 'qf-8', name: 'Apel Fuji Segar', unit: 'kg', price: 35000, emoji: '🍎', is_active: true },
];

export const DEFAULT_STOCK_ITEMS: StockItem[] = [
  {
    id: 'stk-1',
    fruit_name: 'Jeruk Medan Manis',
    unit: 'kg',
    current_stock: 120.0,
    canvas_allocated_stock: 0,
    min_stock_alert: 20,
    avg_cost_price: 22000,
    latest_selling_price: 28000,
    updated_at: '2026-10-04T08:00:00Z',
  },
  {
    id: 'stk-2',
    fruit_name: 'Jeruk Peras Segar',
    unit: 'kg',
    current_stock: 85.0,
    canvas_allocated_stock: 0,
    min_stock_alert: 15,
    avg_cost_price: 14000,
    latest_selling_price: 18000,
    updated_at: '2026-10-04T08:00:00Z',
  },
  {
    id: 'stk-3',
    fruit_name: 'Pisang Cavendish Super',
    unit: 'dus',
    current_stock: 25.0,
    canvas_allocated_stock: 0,
    min_stock_alert: 5,
    avg_cost_price: 150000,
    latest_selling_price: 185000,
    updated_at: '2026-10-04T08:00:00Z',
  },
  {
    id: 'stk-4',
    fruit_name: 'Lemon California Segar',
    unit: 'kg',
    current_stock: 45.0,
    canvas_allocated_stock: 0,
    min_stock_alert: 10,
    avg_cost_price: 19000,
    latest_selling_price: 25000,
    updated_at: '2026-10-04T08:00:00Z',
  },
  {
    id: 'stk-5',
    fruit_name: 'Semangka Non Biji Merah',
    unit: 'kg',
    current_stock: 180.0,
    canvas_allocated_stock: 0,
    min_stock_alert: 30,
    avg_cost_price: 7000,
    latest_selling_price: 9500,
    updated_at: '2026-10-04T08:00:00Z',
  },
  {
    id: 'stk-6',
    fruit_name: 'Melon Sky Rocket',
    unit: 'kg',
    current_stock: 90.0,
    canvas_allocated_stock: 0,
    min_stock_alert: 15,
    avg_cost_price: 10500,
    latest_selling_price: 14000,
    updated_at: '2026-10-04T08:00:00Z',
  },
  {
    id: 'stk-7',
    fruit_name: 'Alpukat Mentega Super',
    unit: 'kg',
    current_stock: 60.0,
    canvas_allocated_stock: 0,
    min_stock_alert: 10,
    avg_cost_price: 21000,
    latest_selling_price: 28000,
    updated_at: '2026-10-04T08:00:00Z',
  },
  {
    id: 'stk-8',
    fruit_name: 'Apel Fuji Segar',
    unit: 'kg',
    current_stock: 40.0,
    canvas_allocated_stock: 0,
    min_stock_alert: 10,
    avg_cost_price: 28000,
    latest_selling_price: 35000,
    updated_at: '2026-10-04T08:00:00Z',
  },
];

export const DEFAULT_STOCK_INBOUNDS: StockInbound[] = [
  {
    id: 'inb-001',
    purchase_date: '2026-10-04',
    fruit_name: 'Jeruk Medan Manis',
    supplier_name: 'Pasar Induk Kramat Jati (Pak Haji Maman)',
    buyer_id: 'usr-owner-001',
    buyer_name: 'Budi Santoso',
    gross_purchase_qty: 50.0,
    purchase_price_per_unit: 22000,
    total_purchase_amount: 1100000,
    payment_method: 'Tunai',
    payment_status: 'Lunas',
    invoice_no: 'INV-KMJ-9921',
    sorting_checked: true,
    checked_by_id: 'usr-manager-002',
    checked_by_name: 'Hendra Wijaya',
    shrinkage_qty: 2.0,
    surplus_qty: 0,
    net_stocked_qty: 48.0,
    quality_notes: 'Kondisi manis segar, 2 kg susut akibat busuk dan memar di dasar peti.',
    created_at: '2026-10-04T06:30:00Z',
    created_by: 'usr-owner-001',
  },
];

export const DEFAULT_CANVAS_TRIPS: CanvasTrip[] = [
  {
    id: 'cnv-001',
    trip_date: '2026-10-04',
    courier_id: 'usr-courier-005',
    courier_name: 'Dimas Kurniawan',
    status: 'Selesai & Rekonsiliasi',
    items: [
      {
        fruit_name: 'Jeruk Medan Manis',
        unit: 'kg',
        brought_qty: 10.0,
        selling_price: 28000,
        sold_qty: 2.0,
        expected_cash: 56000,
        returned_qty: 8.0,
        shrinkage_qty: 0,
      },
    ],
    total_expected_cash: 56000,
    actual_cash_submitted: 56000,
    cash_difference: 0,
    notes: 'Keliling area Pajajaran & Baranangsiang. Laku 2 kg di Toko Roti, sisa 8 kg kembali utuh ke gudang.',
    departed_at: '2026-10-04T08:00:00Z',
    returned_at: '2026-10-04T12:30:00Z',
    verified_by_name: 'Hendra Wijaya',
    created_at: '2026-10-04T08:00:00Z',
  },
];

export const DEFAULT_STOCK_LOGS: StockMovementLog[] = [
  {
    id: 'log-001',
    timestamp: '2026-10-04T06:30:00Z',
    fruit_name: 'Jeruk Medan Manis',
    unit: 'kg',
    type: 'KULAKAN_MASUK',
    qty_change: 48.0,
    stock_after: 120.0,
    reference_id: 'inb-001',
    reference_note: 'Kulakan Pasar Induk Kramat Jati (Beli 50kg, susut 2kg, bersih masuk 48kg)',
    operator_name: 'Hendra Wijaya',
  },
  {
    id: 'log-002',
    timestamp: '2026-10-04T08:00:00Z',
    fruit_name: 'Jeruk Medan Manis',
    unit: 'kg',
    type: 'CANVAS_BAWA',
    qty_change: -10.0,
    stock_after: 110.0,
    reference_id: 'cnv-001',
    reference_note: 'Dibawa kurir Dimas Kurniawan canvas keliling',
    operator_name: 'Hendra Wijaya',
  },
  {
    id: 'log-003',
    timestamp: '2026-10-04T12:30:00Z',
    fruit_name: 'Jeruk Medan Manis',
    unit: 'kg',
    type: 'CANVAS_RETURN',
    qty_change: 8.0,
    stock_after: 118.0,
    reference_id: 'cnv-001',
    reference_note: 'Sisa canvas Dimas Kurniawan kembali ke gudang (laku 2kg, kembali 8kg)',
    operator_name: 'Hendra Wijaya',
  },
];

// Default initial master data (used for offline fallback and for initial Supabase seeding if tables are empty)
export const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'usr-owner-000',
    name: 'Owner PesanBuah',
    email: 'pesanbuahbogor@gmail.com',
    phone: '081234567890',
    role: 'Owner',
    is_courier: true,
    active: true,
    created_at: '2026-01-01T08:00:00Z',
    password: 'password123',
  },
  {
    id: 'usr-owner-001',
    name: 'Budi Santoso (Owner)',
    email: 'owner@pesanbuah.id',
    phone: '081234567890',
    role: 'Owner',
    is_courier: true, // Can act as courier
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
    is_courier: true, // Can act as courier
    active: true,
    created_at: '2026-01-12T09:00:00Z',
    password: 'password123',
  },
  {
    id: 'usr-sales-003',
    name: 'Qinoi',
    email: 'qinoi@pesanbuah.id',
    phone: '081311223344',
    role: 'Sales',
    is_courier: true, // Dual role: Sales & Kurir pengantaran
    active: true,
    created_at: '2026-01-15T10:00:00Z',
    password: 'password123',
  },
  {
    id: 'usr-sales-004',
    name: 'Fajri',
    email: 'fajri@pesanbuah.id',
    phone: '081399887766',
    role: 'Sales',
    is_courier: true, // Dual role: Sales & Kurir pengantaran
    active: true,
    created_at: '2026-01-20T11:00:00Z',
    password: 'password123',
  },
  {
    id: 'usr-kurir-005',
    name: 'Dimas (Kurir Khusus)',
    email: 'kurir@pesanbuah.id',
    phone: '081255667788',
    role: 'Kurir',
    is_courier: true,
    active: true,
    created_at: '2026-02-01T08:00:00Z',
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
  const existingProfilesRaw = localStorage.getItem(STORAGE_PROFILES);
  if (!existingProfilesRaw) {
    localStorage.setItem(STORAGE_PROFILES, JSON.stringify(DEFAULT_PROFILES));
  } else {
    // Merge any missing default profiles (e.g. pesanbuahbogor@gmail.com, Dimas kurir, Qinoi, Fajri)
    try {
      const existing: Profile[] = JSON.parse(existingProfilesRaw);
      const existingEmails = new Set(existing.map((p) => p.email.toLowerCase()));
      let updated = false;
      for (const def of DEFAULT_PROFILES) {
        if (!existingEmails.has(def.email.toLowerCase())) {
          existing.push(def);
          updated = true;
        }
      }
      if (updated) {
        localStorage.setItem(STORAGE_PROFILES, JSON.stringify(existing));
      }
    } catch {
      localStorage.setItem(STORAGE_PROFILES, JSON.stringify(DEFAULT_PROFILES));
    }
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
  if (!localStorage.getItem(STORAGE_QUICK_FRUITS)) {
    localStorage.setItem(STORAGE_QUICK_FRUITS, JSON.stringify(DEFAULT_QUICK_FRUITS));
  }
  if (!localStorage.getItem(STORAGE_STOCK_ITEMS)) {
    localStorage.setItem(STORAGE_STOCK_ITEMS, JSON.stringify(DEFAULT_STOCK_ITEMS));
  }
  if (!localStorage.getItem(STORAGE_STOCK_INBOUNDS)) {
    localStorage.setItem(STORAGE_STOCK_INBOUNDS, JSON.stringify(DEFAULT_STOCK_INBOUNDS));
  }
  if (!localStorage.getItem(STORAGE_CANVAS_TRIPS)) {
    localStorage.setItem(STORAGE_CANVAS_TRIPS, JSON.stringify(DEFAULT_CANVAS_TRIPS));
  }
  if (!localStorage.getItem(STORAGE_STOCK_LOGS)) {
    localStorage.setItem(STORAGE_STOCK_LOGS, JSON.stringify(DEFAULT_STOCK_LOGS));
  }
  if (!localStorage.getItem(STORAGE_ORDERS)) {
    const today = new Date().toISOString().slice(0, 10);
    const demoOrders: Order[] = [
      {
        id: 'ord-001',
        order_number: 'PB-20261002-101',
        customer_name: 'Kopi Kenanga Pajajaran',
        customer_phone: '081234567890',
        delivery_address: 'Jl. Pajajaran No. 45, Bogor Tengah',
        zone_id: 'zone-001',
        latitude: -6.595038,
        longitude: 106.807719,
        order_items: [
          { id: 'i1', item_name: 'Pisang Cavendish Super', quantity: 2, unit: 'dus', price: 185000, subtotal: 370000 },
          { id: 'i2', item_name: 'Lemon California Segar', quantity: 5, unit: 'kg', price: 25000, subtotal: 125000 },
        ],
        items_summary: 'Pisang Cavendish Super (2 dus), Lemon California Segar (5 kg)',
        total_amount: 495000,
        payment_method: 'Tunai',
        payment_status: 'Belum Lunas',
        status: 'Disiapkan',
        delivery_slot: '14:00 - 16:00',
        delivery_date: today,
        courier_id: 'usr-sales-003', // Assigned to Qinoi
        courier_name: 'Qinoi',
        customer_notes: 'Titipkan di kasir Mas Ari, mohon buah diperiksa kematangannya.',
        created_by: 'usr-owner-001',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'ord-002',
        order_number: 'PB-20261002-102',
        customer_name: 'Resto Sunda Baranangsiang',
        customer_phone: '081388776655',
        delivery_address: 'Jl. Riau No. 12, Bogor Timur',
        zone_id: 'zone-002',
        latitude: -6.606240,
        longitude: 106.814230,
        order_items: [
          { id: 'i3', item_name: 'Semangka Non Biji Merah', quantity: 30, unit: 'kg', price: 9500, subtotal: 285000 },
          { id: 'i4', item_name: 'Melon Sky Rocket', quantity: 20, unit: 'kg', price: 14000, subtotal: 280000 },
        ],
        items_summary: 'Semangka Non Biji Merah (30 kg), Melon Sky Rocket (20 kg)',
        total_amount: 565000,
        payment_method: 'QRIS',
        payment_status: 'Lunas',
        status: 'Sedang Diantar',
        delivery_slot: '14:00 - 16:00',
        delivery_date: today,
        courier_id: 'usr-sales-004', // Assigned to Fajri
        courier_name: 'Fajri',
        customer_notes: 'Masuk lewat pintu samping dapur penerimaan barang.',
        created_by: 'usr-manager-002',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'ord-003',
        order_number: 'PB-20261002-099',
        customer_name: 'Juice Bar Sentul City',
        customer_phone: '081911224455',
        delivery_address: 'Ruko Sentul Niaga Blok B-5, Babakan Madang',
        zone_id: 'zone-003',
        latitude: -6.558312,
        longitude: 106.862415,
        order_items: [
          { id: 'i5', item_name: 'Alpukat Mentega Super', quantity: 15, unit: 'kg', price: 28000, subtotal: 420000 },
          { id: 'i6', item_name: 'Buah Naga Merah', quantity: 10, unit: 'kg', price: 18000, subtotal: 180000 },
        ],
        items_summary: 'Alpukat Mentega Super (15 kg), Buah Naga Merah (10 kg)',
        total_amount: 600000,
        payment_method: 'Tunai',
        payment_status: 'Lunas',
        status: 'Selesai',
        delivery_slot: '08:00 - 10:00',
        delivery_date: today,
        courier_id: 'usr-kurir-005', // Assigned to Dimas
        courier_name: 'Dimas (Kurir Khusus)',
        customer_notes: 'Uang pas sudah diterima kasir.',
        delivery_notes: 'Diterima oleh Mbak Maya, uang tunai Rp 600.000 sudah diserahkan.',
        delivered_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        created_by: 'usr-owner-001',
        created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_ORDERS, JSON.stringify(demoOrders));
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

      // 5. Check Quick Fruits Catalog in Supabase
      const { data: remoteFruits, error: qfErr } = await supabase.from('quick_fruits').select('id').limit(1);
      if (!qfErr && (!remoteFruits || remoteFruits.length === 0)) {
        await supabase.from('quick_fruits').upsert(DEFAULT_QUICK_FRUITS, { onConflict: 'id' });
      }

      // 6. Check Stock Items in Supabase
      const { data: remoteStocks, error: stkErr } = await supabase.from('stock_items').select('id').limit(1);
      if (!stkErr && (!remoteStocks || remoteStocks.length === 0)) {
        await supabase.from('stock_items').upsert(DEFAULT_STOCK_ITEMS, { onConflict: 'id' });
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
      potential_needs?: string | null;
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
      potential_needs: data.potential_needs?.trim() || null,
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

  /**
   * Bulk import / restore prospects from CSV.
   * Performs UPSERT so that existing IDs or phone numbers get updated,
   * while new ones get inserted without duplication.
   */
  async importProspectsBatch(
    items: {
      id?: string;
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
      potential_needs?: string | null;
    }[],
    currentUser: Profile
  ): Promise<{ inserted: number; updated: number }> {
    if (currentUser.role === 'Sales') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang berhak mengimpor data.');
    }

    if (!items.length) {
      return { inserted: 0, updated: 0 };
    }

    const now = new Date().toISOString();
    const supabase = getSupabase();

    if (supabase) {
      // 1. Fetch existing prospects to identify whether each row is insert vs update
      const { data: existingRows, error: fetchErr } = await supabase
        .from('prospects')
        .select('id, phone');

      if (fetchErr) {
        throw new Error(`Gagal membaca data dari Supabase: ${fetchErr.message}`);
      }

      const existingPhoneMap = new Map<string, string>();
      const existingIdSet = new Set<string>();

      (existingRows || []).forEach((row: any) => {
        existingIdSet.add(row.id);
        const norm = normalizePhoneNumber(row.phone);
        if (norm) existingPhoneMap.set(norm, row.id);
      });

      let insertedCount = 0;
      let updatedCount = 0;

      const preparedList: Prospect[] = items.map((item) => {
        const normPhone = normalizePhoneNumber(item.phone);
        let targetId = item.id;

        // If ID matches existing or Phone matches existing, update that ID
        if (!targetId || !existingIdSet.has(targetId)) {
          if (normPhone && existingPhoneMap.has(normPhone)) {
            targetId = existingPhoneMap.get(normPhone)!;
            updatedCount++;
          } else {
            targetId = targetId || generateUniqueId('prsp');
            insertedCount++;
          }
        } else {
          updatedCount++;
        }

        return {
          id: targetId,
          business_name: item.business_name.trim(),
          pic_name: item.pic_name.trim() || item.business_name.trim(),
          phone: item.phone.trim(),
          business_type_id: item.business_type_id,
          address: item.address.trim() || 'Bogor',
          latitude: item.latitude ?? null,
          longitude: item.longitude ?? null,
          gps_captured_at: item.gps_captured_at ?? null,
          zone_id: item.zone_id || null,
          sales_id: item.sales_id || null,
          status: item.status || 'Prospect',
          notes: item.notes?.trim() || null,
          potential_needs: item.potential_needs?.trim() || null,
          created_by: currentUser.id,
          created_at: now,
          updated_at: now,
        };
      });

      // Upsert in batches of 50 for safety
      const batchSize = 50;
      for (let i = 0; i < preparedList.length; i += batchSize) {
        const chunk = preparedList.slice(i, i + batchSize);
        const { error: upsertErr } = await supabase
          .from('prospects')
          .upsert(chunk, { onConflict: 'id' });

        if (upsertErr) {
          console.error('Supabase bulk upsert error:', upsertErr);
          throw new Error(
            `Gagal import ke Supabase pada baris ${i + 1}-${i + chunk.length}: ${upsertErr.message}. Pastikan script SQL sudah dijalankan.`
          );
        }
      }

      return { inserted: insertedCount, updated: updatedCount };
    }

    // Local Storage Fallback
    const raw = localStorage.getItem(STORAGE_PROSPECTS);
    const prospects: Prospect[] = raw ? JSON.parse(raw) : [];

    const existingPhoneMap = new Map<string, number>();
    const existingIdMap = new Map<string, number>();

    prospects.forEach((p, idx) => {
      existingIdMap.set(p.id, idx);
      const norm = normalizePhoneNumber(p.phone);
      if (norm) existingPhoneMap.set(norm, idx);
    });

    let insertedCount = 0;
    let updatedCount = 0;

    items.forEach((item) => {
      const normPhone = normalizePhoneNumber(item.phone);
      let matchIdx = item.id ? existingIdMap.get(item.id) : undefined;
      if (matchIdx === undefined && normPhone) {
        matchIdx = existingPhoneMap.get(normPhone);
      }

      if (matchIdx !== undefined) {
        // Update
        prospects[matchIdx] = {
          ...prospects[matchIdx],
          business_name: item.business_name.trim(),
          pic_name: item.pic_name.trim() || prospects[matchIdx].pic_name,
          phone: item.phone.trim(),
          business_type_id: item.business_type_id || prospects[matchIdx].business_type_id,
          address: item.address.trim() || prospects[matchIdx].address,
          latitude: item.latitude !== undefined ? item.latitude : prospects[matchIdx].latitude,
          longitude: item.longitude !== undefined ? item.longitude : prospects[matchIdx].longitude,
          gps_captured_at: item.gps_captured_at !== undefined ? item.gps_captured_at : prospects[matchIdx].gps_captured_at,
          zone_id: item.zone_id !== undefined ? item.zone_id : prospects[matchIdx].zone_id,
          sales_id: item.sales_id !== undefined ? item.sales_id : prospects[matchIdx].sales_id,
          status: item.status || prospects[matchIdx].status,
          notes: item.notes !== undefined ? item.notes : prospects[matchIdx].notes,
          potential_needs: item.potential_needs !== undefined ? item.potential_needs : prospects[matchIdx].potential_needs,
          updated_at: now,
        };
        updatedCount++;
      } else {
        // Insert
        const newRecord: Prospect = {
          id: item.id || generateUniqueId('prsp'),
          business_name: item.business_name.trim(),
          pic_name: item.pic_name.trim() || item.business_name.trim(),
          phone: item.phone.trim(),
          business_type_id: item.business_type_id,
          address: item.address.trim() || 'Bogor',
          latitude: item.latitude ?? null,
          longitude: item.longitude ?? null,
          gps_captured_at: item.gps_captured_at ?? null,
          zone_id: item.zone_id || null,
          sales_id: item.sales_id || null,
          status: item.status || 'Prospect',
          notes: item.notes?.trim() || null,
          potential_needs: item.potential_needs?.trim() || null,
          created_by: currentUser.id,
          created_at: now,
          updated_at: now,
        };
        prospects.push(newRecord);
        existingIdMap.set(newRecord.id, prospects.length - 1);
        if (normPhone) existingPhoneMap.set(normPhone, prospects.length - 1);
        insertedCount++;
      }
    });

    localStorage.setItem(STORAGE_PROSPECTS, JSON.stringify(prospects));
    return { inserted: insertedCount, updated: updatedCount };
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

  // --------------------------------------------------------------------------
  // COURIER REMITTANCE HELPER & STATE CACHE
  // --------------------------------------------------------------------------
  getRemittanceMap(): Record<string, { status: 'Belum Disetor (Ada di Kurir)' | 'Sudah Disetor ke Kas'; remitted_at?: string | null; remitted_by_name?: string | null }> {
    try {
      const raw = localStorage.getItem(STORAGE_REMITTANCE_MAP);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  setRemittanceRecord(
    orderId: string,
    status: 'Belum Disetor (Ada di Kurir)' | 'Sudah Disetor ke Kas',
    remitted_at?: string | null,
    remitted_by_name?: string | null
  ) {
    try {
      const map = this.getRemittanceMap();
      map[orderId] = {
        status,
        remitted_at: remitted_at || null,
        remitted_by_name: remitted_by_name || null,
      };
      localStorage.setItem(STORAGE_REMITTANCE_MAP, JSON.stringify(map));
    } catch (e) {
      console.warn('Failed to save remittance record to local cache:', e);
    }
  },

  // --------------------------------------------------------------------------
  // ORDER & DELIVERY MANAGEMENT
  // --------------------------------------------------------------------------
  async getOrders(currentUser?: Profile | null, filterCourierId?: string): Promise<Order[]> {
    const rawLocal = localStorage.getItem(STORAGE_ORDERS);
    let localList: Order[] = rawLocal ? JSON.parse(rawLocal) : [];
    if (localList.length === 0) {
      localList = this.getLocalOrders();
    }
    const remittanceMap = this.getRemittanceMap();

    const supabase = getSupabase();
    if (supabase) {
      try {
        let query = supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (currentUser?.role === 'Sales') {
          query = query.eq('created_by', currentUser.id);
        } else if (filterCourierId) {
          query = query.eq('courier_id', filterCourierId);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          // If Supabase has zero orders, seed existing local orders into Supabase
          if (data.length === 0 && localList.length > 0) {
            for (const ord of localList) {
              const cleanOrd = this.cleanOrderPayloadForSupabase(ord);
              supabase.from('orders').upsert([cleanOrd], { onConflict: 'id' }).then(() => {}, () => {});
            }
          }

          // Merge Supabase orders with local orders by id so no orders or edits are lost!
          const supaMapById = new Map<string, any>(data.map((d: any) => [d.id, d]));
          const localMapById = new Map<string, Order>(localList.map((o) => [o.id, o]));

          const allIds = Array.from(new Set([...Array.from(supaMapById.keys()), ...Array.from(localMapById.keys())]));
          const mergedList: Order[] = [];

          for (const id of allIds) {
            const supaItem = supaMapById.get(id);
            const localItem = localMapById.get(id);

            let chosen: any = supaItem || localItem;
            // If local has newer timestamp, choose local and sync to Supabase
            if (supaItem && localItem && localItem.updated_at && supaItem.updated_at) {
              if (new Date(localItem.updated_at).getTime() > new Date(supaItem.updated_at).getTime()) {
                chosen = localItem;
                supabase.from('orders').upsert([this.cleanOrderPayloadForSupabase(localItem)], { onConflict: 'id' }).then(() => {}, () => {});
              }
            } else if (!supaItem && localItem) {
              supabase.from('orders').upsert([this.cleanOrderPayloadForSupabase(localItem)], { onConflict: 'id' }).then(() => {}, () => {});
            }

            const cached = remittanceMap[chosen.id];
            let remStatus = chosen.courier_remittance_status || cached?.status;
            if (!remStatus) {
              remStatus = (chosen.payment_method === 'Tunai' && chosen.status === 'Selesai')
                ? 'Belum Disetor (Ada di Kurir)'
                : 'Sudah Disetor ke Kas';
            }

            mergedList.push({
              ...chosen,
              courier_remittance_status: remStatus,
              courier_remitted_at: chosen.courier_remitted_at || cached?.remitted_at || null,
              courier_remitted_by_name: chosen.courier_remitted_by_name || cached?.remitted_by_name || null,
            } as Order);
          }

          // Synchronize merged list back to local storage cache if Owner or Manager
          if (!currentUser || currentUser.role === 'Owner' || currentUser.role === 'Manager') {
            try {
              localStorage.setItem(STORAGE_ORDERS, JSON.stringify(mergedList));
            } catch {}
          }

          return this.applyRoleFilterToOrders(mergedList, currentUser, filterCourierId);
        }
      } catch (err) {
        console.warn('Supabase getOrders error, using local orders:', err);
      }
    }

    return this.getLocalOrders(currentUser, filterCourierId);
  },

  applyRoleFilterToOrders(orders: Order[], currentUser?: Profile | null, filterCourierId?: string): Order[] {
    let resultOrders = orders;
    if (currentUser?.role === 'Kurir') {
      resultOrders = resultOrders.filter((o) => {
        const isMyDelivery =
          o.courier_id === currentUser.id ||
          (o.courier_name && currentUser.name && o.courier_name.trim().toLowerCase() === currentUser.name.trim().toLowerCase());
        if (isMyDelivery) return true;
        // Kurir can also view all active orders waiting to be prepared, delivered, or taken
        const isAvailableToHandle = o.status === 'Diterima' || o.status === 'Disiapkan' || o.status === 'Sedang Diantar';
        return isAvailableToHandle;
      });
    } else if (currentUser?.role === 'Sales') {
      resultOrders = resultOrders.filter(
        (o) =>
          o.created_by === currentUser.id ||
          (o.sales_rep && currentUser.name && o.sales_rep.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
      );
    } else if (filterCourierId) {
      resultOrders = resultOrders.filter((o) => o.courier_id === filterCourierId);
    }

    return resultOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getLocalOrders(currentUser?: Profile | null, filterCourierId?: string): Order[] {
    const raw = localStorage.getItem(STORAGE_ORDERS);
    let list: Order[] = raw ? JSON.parse(raw) : [];
    const remittanceMap = this.getRemittanceMap();

    // Auto-heal orders missing GPS coordinates from prospects or known coordinates
    let hasHealed = false;
    const rawProspects = localStorage.getItem(STORAGE_PROSPECTS);
    let prospectsList: Prospect[] = [];
    if (rawProspects) {
      try {
        prospectsList = JSON.parse(rawProspects);
      } catch {}
    }

    list = list.map((o) => {
      const cached = remittanceMap[o.id];
      let remStatus = o.courier_remittance_status || cached?.status;
      if (!remStatus) {
        remStatus = (o.payment_method === 'Tunai' && o.status === 'Selesai')
          ? 'Belum Disetor (Ada di Kurir)'
          : 'Sudah Disetor ke Kas';
      }

      let lat = o.latitude;
      let lng = o.longitude;

      if ((!lat || !lng) && lat !== 0) {
        // Try known demo coordinates first
        if (o.id === 'ord-001' || o.order_number?.includes('101')) {
          hasHealed = true;
          lat = -6.595038;
          lng = 106.807719;
        } else if (o.id === 'ord-002' || o.order_number?.includes('102')) {
          hasHealed = true;
          lat = -6.606240;
          lng = 106.814230;
        } else if (o.id === 'ord-003' || o.order_number?.includes('099')) {
          hasHealed = true;
          lat = -6.558312;
          lng = 106.862415;
        } else {
          // Try matching linked prospect
          const matched = prospectsList.find(
            (p) =>
              (o.prospect_id && p.id === o.prospect_id) ||
              (p.phone && o.customer_phone && p.phone.replace(/[^0-9]/g, '') === o.customer_phone.replace(/[^0-9]/g, '')) ||
              p.business_name.toLowerCase().trim() === o.customer_name.toLowerCase().trim()
          );
          if (matched?.latitude && matched?.longitude) {
            hasHealed = true;
            lat = matched.latitude;
            lng = matched.longitude;
          }
        }
      }

      return {
        ...o,
        latitude: lat,
        longitude: lng,
        courier_remittance_status: remStatus,
        courier_remitted_at: cached?.remitted_at || o.courier_remitted_at || null,
        courier_remitted_by_name: cached?.remitted_by_name || o.courier_remitted_by_name || null,
      };
    });

    if (hasHealed && (!currentUser || currentUser.role === 'Owner' || currentUser.role === 'Manager')) {
      localStorage.setItem(STORAGE_ORDERS, JSON.stringify(list));
    }

    if (currentUser?.role === 'Kurir') {
      list = list.filter((o) => {
        const isMyDelivery =
          o.courier_id === currentUser.id ||
          (o.courier_name && currentUser.name && o.courier_name.trim().toLowerCase() === currentUser.name.trim().toLowerCase());
        if (isMyDelivery) return true;
        // Kurir can also view all active orders waiting to be prepared or delivered
        const isAvailableToHandle = o.status === 'Diterima' || o.status === 'Disiapkan';
        return isAvailableToHandle;
      });
    } else if (currentUser?.role === 'Sales') {
      list = list.filter(
        (o) =>
          o.created_by === currentUser.id ||
          (o.sales_rep && currentUser.name && o.sales_rep.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
      );
    } else if (filterCourierId) {
      list = list.filter((o) => o.courier_id === filterCourierId);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getOrderById(id: string): Promise<Order | null> {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        const cached = this.getRemittanceMap()[id];
        const remStatus = cached?.status || (data as any).courier_remittance_status || ((data as any).payment_method === 'Tunai' && (data as any).status === 'Selesai' ? 'Belum Disetor (Ada di Kurir)' : 'Sudah Disetor ke Kas');
        return {
          ...data,
          courier_remittance_status: remStatus,
          courier_remitted_at: cached?.remitted_at || (data as any).courier_remitted_at || null,
          courier_remitted_by_name: cached?.remitted_by_name || (data as any).courier_remitted_by_name || null,
        } as Order;
      }
    }
    const raw = localStorage.getItem(STORAGE_ORDERS);
    const list: Order[] = raw ? JSON.parse(raw) : [];
    const found = list.find((o) => o.id === id);
    if (found) {
      const cached = this.getRemittanceMap()[id];
      const remStatus = cached?.status || found.courier_remittance_status || (found.payment_method === 'Tunai' && found.status === 'Selesai' ? 'Belum Disetor (Ada di Kurir)' : 'Sudah Disetor ke Kas');
      return {
        ...found,
        courier_remittance_status: remStatus,
        courier_remitted_at: cached?.remitted_at || found.courier_remitted_at || null,
        courier_remitted_by_name: cached?.remitted_by_name || found.courier_remitted_by_name || null,
      };
    }
    return null;
  },

  async createOrder(
    data: {
      prospect_id?: string | null;
      customer_name: string;
      customer_phone: string;
      delivery_address: string;
      zone_id?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      order_items: OrderItem[];
      items_summary?: string;
      total_amount: number;
      payment_method: PaymentMethod;
      payment_status?: PaymentStatus;
      status?: OrderStatus;
      delivery_slot: DeliverySlot;
      delivery_date: string;
      courier_id?: string | null;
      courier_name?: string | null;
      customer_notes?: string | null;
    },
    currentUser: Profile
  ): Promise<Order> {
    if (!data.customer_name?.trim()) throw new Error('Nama customer / usaha wajib diisi.');
    if (!data.customer_phone?.trim()) throw new Error('Nomor HP / WhatsApp pemesan wajib diisi.');
    if (!data.delivery_address?.trim()) throw new Error('Alamat pengantaran wajib diisi.');

    const now = new Date();
    const dateCode = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderNumber = `PB-${dateCode}-${randomSuffix}`;

    const itemsSummary =
      data.items_summary?.trim() ||
      (data.order_items && data.order_items.length > 0
        ? data.order_items.map((i) => `${i.item_name} (${i.quantity} ${i.unit})`).join(', ')
        : 'Pesanan Aneka Buah & Sayur');

    let finalLat = data.latitude ?? null;
    let finalLng = data.longitude ?? null;

    if (finalLat === null || finalLng === null) {
      if (data.prospect_id) {
        const prospect = await this.getProspectById(data.prospect_id);
        if (prospect?.latitude && prospect?.longitude) {
          finalLat = prospect.latitude;
          finalLng = prospect.longitude;
        }
      }
      if (finalLat === null || finalLng === null) {
        const rawProspects = localStorage.getItem(STORAGE_PROSPECTS);
        if (rawProspects) {
          try {
            const plist: Prospect[] = JSON.parse(rawProspects);
            const cleanPhone = data.customer_phone.replace(/[^0-9]/g, '');
            const matched = plist.find(
              (p) =>
                (cleanPhone && p.phone && p.phone.replace(/[^0-9]/g, '') === cleanPhone) ||
                p.business_name.toLowerCase().trim() === data.customer_name.toLowerCase().trim()
            );
            if (matched?.latitude && matched?.longitude) {
              finalLat = matched.latitude;
              finalLng = matched.longitude;
            }
          } catch {}
        }
      }
    }

    // Strict pre-flight validation against available warehouse stock
    if (data.order_items && data.order_items.length > 0) {
      const stockList = await this.getStockItems();
      for (const item of data.order_items) {
        if (!item.item_name) continue;
        const targetName = item.item_name.toLowerCase().trim();
        const qty = Number(item.quantity) || 0;
        if (qty <= 0) {
          throw new Error(`Jumlah pesanan untuk "${item.item_name}" harus lebih dari 0.`);
        }
        const matched = stockList.find(
          (s) =>
            s.fruit_name.toLowerCase().trim() === targetName ||
            targetName.includes(s.fruit_name.toLowerCase().trim()) ||
            s.fruit_name.toLowerCase().trim().includes(targetName)
        );
        if (matched) {
          if (matched.current_stock <= 0) {
            throw new Error(`Stok buah "${matched.fruit_name}" di gudang sudah habis (0 ${matched.unit}). Pesanan tidak dapat dibuat.`);
          }
          if (qty > matched.current_stock) {
            throw new Error(
              `Stok buah "${matched.fruit_name}" di gudang hanya tersisa ${matched.current_stock} ${matched.unit}. Anda tidak dapat memesan ${qty} ${matched.unit}.`
            );
          }
        }
      }
    }

    const newOrder: Order = {
      id: generateUniqueId('ord'),
      order_number: orderNumber,
      prospect_id: data.prospect_id || null,
      customer_name: data.customer_name.trim(),
      customer_phone: data.customer_phone.trim(),
      delivery_address: data.delivery_address.trim(),
      zone_id: data.zone_id || null,
      latitude: finalLat,
      longitude: finalLng,
      order_items: data.order_items || [],
      items_summary: itemsSummary,
      total_amount: Number(data.total_amount) || 0,
      payment_method: data.payment_method || 'Tunai',
      payment_status: data.payment_status || 'Belum Lunas',
      status: data.status || 'Diterima',
      delivery_slot: data.delivery_slot,
      delivery_date: data.delivery_date,
      courier_id: data.courier_id || null,
      courier_name: data.courier_name || null,
      customer_notes: data.customer_notes?.trim() || null,
      delivery_notes: null,
      delivered_at: null,
      proof_photo_url: null,
      created_by: currentUser.id,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const supabase = getSupabase();
    let finalOrder: Order = newOrder;

    if (supabase) {
      try {
        const payload = this.cleanOrderPayloadForSupabase(newOrder);
        const { data: inserted, error } = await supabase
          .from('orders')
          .insert([payload])
          .select()
          .single();

        if (error) {
          console.warn('Supabase createOrder error, storing locally:', error);
        } else if (inserted) {
          finalOrder = { ...newOrder, ...(inserted as Order) };
        }
      } catch (err) {
        console.warn('Supabase createOrder caught error:', err);
      }
    }

    // Local Storage
    const raw = localStorage.getItem(STORAGE_ORDERS);
    const list: Order[] = raw ? JSON.parse(raw) : [];
    list.unshift(finalOrder);
    localStorage.setItem(STORAGE_ORDERS, JSON.stringify(list));

    // Deduct warehouse stock automatically from order items (both in LocalStorage & Supabase!)
    await this.deductStockForOrder(finalOrder, currentUser);
    finalOrder.stock_deducted = true;

    // Update stock_deducted flag in local storage
    const updatedList = list.map((o) => (o.id === finalOrder.id ? { ...o, stock_deducted: true } : o));
    localStorage.setItem(STORAGE_ORDERS, JSON.stringify(updatedList));

    return finalOrder;
  },

  cleanOrderPayloadForSupabase(record: Partial<Order>): Record<string, any> {
    const knownColumns = new Set([
      'id',
      'order_number',
      'prospect_id',
      'customer_name',
      'customer_phone',
      'delivery_address',
      'zone_id',
      'latitude',
      'longitude',
      'order_items',
      'items_summary',
      'total_amount',
      'payment_method',
      'payment_status',
      'status',
      'delivery_slot',
      'delivery_date',
      'courier_id',
      'courier_name',
      'customer_notes',
      'delivery_notes',
      'delivered_at',
      'proof_photo_url',
      'created_by',
      'created_at',
      'updated_at',
      'courier_remittance_status',
      'courier_remitted_at',
      'courier_remitted_by_name',
    ]);
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(record)) {
      if (knownColumns.has(key)) {
        clean[key] = val;
      }
    }
    // Satisfy PostgreSQL NOT NULL constraints
    if (!clean.delivery_slot) clean.delivery_slot = '08:00 - 10:00';
    if (!clean.delivery_date) clean.delivery_date = new Date().toISOString().slice(0, 10);
    if (!clean.customer_phone) clean.customer_phone = '-';
    if (!clean.delivery_address) clean.delivery_address = '-';
    if (!clean.items_summary) clean.items_summary = 'Pesanan Buah';
    if (clean.total_amount === undefined || clean.total_amount === null) clean.total_amount = 0;
    if (!clean.payment_method) clean.payment_method = 'Tunai';
    if (!clean.payment_status) clean.payment_status = 'Belum Lunas';
    if (!clean.status) clean.status = 'Diterima';
    if (!clean.created_by) clean.created_by = 'usr-owner-001';
    return clean;
  },

  cleanStockItemPayloadForSupabase(record: Partial<StockItem>): Record<string, any> {
    const knownColumns = new Set([
      'id',
      'fruit_name',
      'unit',
      'current_stock',
      'canvas_allocated_stock',
      'min_stock_alert',
      'avg_cost_price',
      'notes',
      'updated_at',
    ]);
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(record)) {
      if (knownColumns.has(key)) {
        clean[key] = val;
      }
    }
    return clean;
  },

  async updateOrder(
    id: string,
    updates: Partial<Order>,
    currentUser: Profile
  ): Promise<Order> {
    const existing = await this.getOrderById(id);
    if (!existing) throw new Error('Data order tidak ditemukan.');

    // Strict access control: Sales is NOT allowed to edit completed or cancelled orders
    if (currentUser.role === 'Sales') {
      if (existing.status === 'Selesai' || existing.status === 'Dibatalkan') {
        throw new Error('Akses Ditolak: Transaksi yang sudah selesai terkunci dan tidak dapat diubah oleh Sales.');
      }
    }

    const now = new Date().toISOString();
    const updatedRecord: Order = {
      ...existing,
      ...updates,
      updated_at: now,
    };

    // If status changed to 'Selesai', record delivered_at if not set
    if (updates.status === 'Selesai' && !updatedRecord.delivered_at) {
      updatedRecord.delivered_at = now;
    }

    // Stock accounting: Stock was already deducted at creation time for active orders.
    // 1. If order is being CANCELLED and was active, restore stock back to warehouse!
    if (updates.status === 'Dibatalkan' && existing.status !== 'Dibatalkan') {
      await this.restoreStockForCancelledOrder(existing, currentUser);
      updatedRecord.stock_deducted = false;
    }
    // 2. If order was CANCELLED and is being REOPENED (e.g. back to Diterima/Disiapkan), re-deduct stock!
    else if (existing.status === 'Dibatalkan' && updates.status && updates.status !== 'Dibatalkan') {
      await this.deductStockForOrder(updatedRecord, currentUser);
      updatedRecord.stock_deducted = true;
    }
    // 3. For all other active status transitions (Diterima -> Disiapkan -> Sedang Diantar -> Selesai),
    // stock is already safely deducted; maintain flag without double deducting!
    else {
      updatedRecord.stock_deducted = existing.status !== 'Dibatalkan';
    }

    // Persist remittance cache state if remittance field changed
    if (updates.courier_remittance_status) {
      this.setRemittanceRecord(
        id,
        updates.courier_remittance_status,
        updatedRecord.courier_remitted_at,
        updatedRecord.courier_remitted_by_name
      );
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const payload = this.cleanOrderPayloadForSupabase(updatedRecord);
        const { data, error } = await supabase
          .from('orders')
          .upsert(payload, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (error) {
          console.warn('Supabase updateOrder error, attempting fallback upsert without unmigrated columns:', error.message || error);
          const { courier_remittance_status, courier_remitted_at, courier_remitted_by_name, ...baseOrder } = payload;
          const retryRes = await supabase
            .from('orders')
            .upsert(baseOrder, { onConflict: 'id' })
            .select()
            .maybeSingle();
          if (retryRes.data) {
            const raw = localStorage.getItem(STORAGE_ORDERS);
            let list: Order[] = raw ? JSON.parse(raw) : [];
            const merged = { ...updatedRecord, ...(retryRes.data as Order), stock_deducted: updatedRecord.stock_deducted };
            list = list.map((o) => (o.id === id ? merged : o));
            localStorage.setItem(STORAGE_ORDERS, JSON.stringify(list));
            return merged;
          }
        } else if (data) {
          const raw = localStorage.getItem(STORAGE_ORDERS);
          let list: Order[] = raw ? JSON.parse(raw) : [];
          const merged = { ...updatedRecord, ...(data as Order), stock_deducted: updatedRecord.stock_deducted };
          list = list.map((o) => (o.id === id ? merged : o));
          localStorage.setItem(STORAGE_ORDERS, JSON.stringify(list));
          return merged;
        }
      } catch (err) {
        console.warn('Supabase updateOrder caught error:', err);
      }
    }

    const raw = localStorage.getItem(STORAGE_ORDERS);
    let list: Order[] = raw ? JSON.parse(raw) : [];
    list = list.map((o) => (o.id === id ? updatedRecord : o));
    localStorage.setItem(STORAGE_ORDERS, JSON.stringify(list));
    return updatedRecord;
  },

  async assignCourier(
    orderId: string,
    courierId: string | null,
    courierName: string | null,
    currentUser: Profile
  ): Promise<Order> {
    return this.updateOrder(
      orderId,
      {
        courier_id: courierId,
        courier_name: courierName,
        status: courierId ? 'Disiapkan' : 'Diterima',
      },
      currentUser
    );
  },

  async reportDeliveryCompletion(
    orderId: string,
    data: {
      delivery_notes?: string;
      payment_status?: PaymentStatus;
      proof_photo_url?: string;
    },
    currentUser: Profile
  ): Promise<Order> {
    const existing = await this.getOrderById(orderId);
    const isCash = existing?.payment_method === 'Tunai' || !existing?.payment_method;
    const now = new Date().toISOString();
    const remittanceStatus = isCash ? 'Belum Disetor (Ada di Kurir)' : 'Sudah Disetor ke Kas';

    this.setRemittanceRecord(
      orderId,
      remittanceStatus,
      isCash ? null : now,
      isCash ? null : 'Sistem (Non-Tunai)'
    );

    return this.updateOrder(
      orderId,
      {
        status: 'Selesai',
        delivered_at: now,
        delivery_notes: data.delivery_notes || null,
        payment_status: data.payment_status || 'Lunas',
        proof_photo_url: data.proof_photo_url || null,
        courier_remittance_status: remittanceStatus,
        courier_remitted_at: isCash ? null : now,
        courier_remitted_by_name: isCash ? null : 'Sistem (Non-Tunai)',
      },
      currentUser
    );
  },

  async remitOrderPayment(
    orderId: string,
    currentUser: Profile
  ): Promise<Order> {
    if (currentUser.role !== 'Owner' && currentUser.role !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang berhak menerima uang setoran kurir ke kas perusahaan.');
    }
    const now = new Date().toISOString();
    this.setRemittanceRecord(orderId, 'Sudah Disetor ke Kas', now, currentUser.name);

    return this.updateOrder(
      orderId,
      {
        courier_remittance_status: 'Sudah Disetor ke Kas',
        courier_remitted_at: now,
        courier_remitted_by_name: currentUser.name,
      },
      currentUser
    );
  },

  async unremitOrderPayment(
    orderId: string,
    currentUser: Profile
  ): Promise<Order> {
    if (currentUser.role !== 'Owner' && currentUser.role !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang berhak membatalkan status uang setoran kas.');
    }
    this.setRemittanceRecord(orderId, 'Belum Disetor (Ada di Kurir)', null, null);

    return this.updateOrder(
      orderId,
      {
        courier_remittance_status: 'Belum Disetor (Ada di Kurir)',
        courier_remitted_at: null,
        courier_remitted_by_name: null,
      },
      currentUser
    );
  },

  async remitCanvasTrip(
    tripId: string,
    currentUser: Profile
  ): Promise<CanvasTrip> {
    if (currentUser.role !== 'Owner' && currentUser.role !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang berhak menerima setoran kas canvas.');
    }
    const rawTrips = localStorage.getItem(STORAGE_CANVAS_TRIPS);
    let trips: CanvasTrip[] = rawTrips ? JSON.parse(rawTrips) : [...DEFAULT_CANVAS_TRIPS];
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) throw new Error('Data canvas keliling tidak ditemukan.');

    const now = new Date().toISOString();
    trip.remittance_status = 'Sudah Disetor ke Kas';
    trip.remitted_at = now;
    trip.remitted_by_name = currentUser.name;

    localStorage.setItem(STORAGE_CANVAS_TRIPS, JSON.stringify(trips));
    return trip;
  },

  async remitAllCourierCash(
    courierId: string,
    currentUser: Profile,
    courierName?: string
  ): Promise<{ ordersCount: number; canvasCount: number; totalAmount: number }> {
    if (currentUser.role !== 'Owner' && currentUser.role !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang berhak menerima seluruh setoran kas kurir.');
    }
    const now = new Date().toISOString();
    let totalAmount = 0;
    let ordersCount = 0;
    let canvasCount = 0;
    const targetOrderIds: string[] = [];

    // Remit orders
    const rawOrders = localStorage.getItem(STORAGE_ORDERS);
    let orders: Order[] = rawOrders ? JSON.parse(rawOrders) : [];
    orders = orders.map((o) => {
      const matchCourier =
        o.courier_id === courierId ||
        (courierName && o.courier_name && o.courier_name.trim().toLowerCase() === courierName.trim().toLowerCase());
      if (
        matchCourier &&
        o.status === 'Selesai' &&
        o.payment_method === 'Tunai' &&
        o.courier_remittance_status !== 'Sudah Disetor ke Kas'
      ) {
        totalAmount += Number(o.total_amount) || 0;
        ordersCount += 1;
        targetOrderIds.push(o.id);
        this.setRemittanceRecord(o.id, 'Sudah Disetor ke Kas', now, currentUser.name);
        return {
          ...o,
          courier_remittance_status: 'Sudah Disetor ke Kas' as const,
          courier_remitted_at: now,
          courier_remitted_by_name: currentUser.name,
          updated_at: now,
        };
      }
      return o;
    });
    localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));

    // Also update in Supabase if configured
    const supabase = getSupabase();
    if (supabase && targetOrderIds.length > 0) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({
            courier_remittance_status: 'Sudah Disetor ke Kas',
            courier_remitted_at: now,
            courier_remitted_by_name: currentUser.name,
            updated_at: now,
          })
          .in('id', targetOrderIds);
        if (error) {
          console.warn('Supabase batch remittance update error (handled via local map):', error.message || error);
        }
      } catch (err) {
        console.warn('Supabase batch remittance caught error:', err);
      }
    }

    // Remit canvas trips
    const rawTrips = localStorage.getItem(STORAGE_CANVAS_TRIPS);
    let trips: CanvasTrip[] = rawTrips ? JSON.parse(rawTrips) : [...DEFAULT_CANVAS_TRIPS];
    trips = trips.map((t) => {
      const matchCourier =
        t.courier_id === courierId ||
        (courierName && t.courier_name && t.courier_name.trim().toLowerCase() === courierName.trim().toLowerCase());
      if (
        matchCourier &&
        t.status === 'Selesai & Rekonsiliasi' &&
        t.actual_cash_submitted > 0 &&
        t.remittance_status !== 'Sudah Disetor ke Kas'
      ) {
        totalAmount += Number(t.actual_cash_submitted) || 0;
        canvasCount += 1;
        return {
          ...t,
          remittance_status: 'Sudah Disetor ke Kas' as const,
          remitted_at: now,
          remitted_by_name: currentUser.name,
        };
      }
      return t;
    });
    localStorage.setItem(STORAGE_CANVAS_TRIPS, JSON.stringify(trips));

    return { ordersCount, canvasCount, totalAmount };
  },

  async deleteOrder(id: string, currentUser: Profile): Promise<boolean> {
    if (currentUser.role === 'Kurir') {
      throw new Error('Akses Ditolak: Kurir tidak memiliki izin untuk menghapus order.');
    }
    const existing = await this.getOrderById(id);
    if (existing?.stock_deducted) {
      await this.restoreStockForCancelledOrder(existing, currentUser);
    }
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('orders').delete().eq('id', id);
    }
    const raw = localStorage.getItem(STORAGE_ORDERS);
    let list: Order[] = raw ? JSON.parse(raw) : [];
    list = list.filter((o) => o.id !== id);
    localStorage.setItem(STORAGE_ORDERS, JSON.stringify(list));
    return true;
  },

  getDeletedFruitNames(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_DELETED_FRUITS);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr.map((s: string) => String(s).toLowerCase().trim()) : []);
    } catch {
      return new Set();
    }
  },

  recordDeletedFruit(name: string): void {
    if (!name || !name.trim()) return;
    try {
      const set = this.getDeletedFruitNames();
      set.add(name.toLowerCase().trim());
      localStorage.setItem(STORAGE_DELETED_FRUITS, JSON.stringify(Array.from(set)));
    } catch {}
  },

  removeDeletedFruitRecord(name: string): void {
    if (!name || !name.trim()) return;
    try {
      const set = this.getDeletedFruitNames();
      set.delete(name.toLowerCase().trim());
      localStorage.setItem(STORAGE_DELETED_FRUITS, JSON.stringify(Array.from(set)));
    } catch {}
  },

  // ==========================================
  // QUICK FRUITS / PRODUK CEPAT MASTER DATA
  // ==========================================
  async getQuickFruits(): Promise<QuickFruitItem[]> {
    const deletedNames = this.getDeletedFruitNames();
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('quick_fruits')
          .select('*')
          .order('name');
        if (!error && Array.isArray(data) && data.length > 0) {
          const rawLocal = localStorage.getItem(STORAGE_QUICK_FRUITS);
          const localList: QuickFruitItem[] = rawLocal ? JSON.parse(rawLocal) : [];
          const localMapByName = new Map<string, QuickFruitItem>(localList.map((q) => [q.name.toLowerCase().trim(), q]));
          const supaNames = new Set(data.map((d: any) => d.name.toLowerCase().trim()));

          const combined = data
            .filter((d: any) => !deletedNames.has(String(d.name || '').toLowerCase().trim()))
            .map((d: any) => {
              const loc = localMapByName.get(d.name.toLowerCase().trim());
              if (loc && loc.updated_at && (!d.updated_at || new Date(loc.updated_at).getTime() > new Date(d.updated_at).getTime())) {
                return loc;
              }
              return d as QuickFruitItem;
            });

          for (const loc of localList) {
            if (!deletedNames.has(loc.name.toLowerCase().trim()) && !supaNames.has(loc.name.toLowerCase().trim())) {
              combined.push(loc);
              supabase.from('quick_fruits').upsert([loc], { onConflict: 'name' }).then(() => {}, () => {});
            }
          }

          try {
            localStorage.setItem(STORAGE_QUICK_FRUITS, JSON.stringify(combined));
          } catch {}
          return combined;
        }
      } catch {
        // Fallback to local storage
      }
    }
    const raw = localStorage.getItem(STORAGE_QUICK_FRUITS);
    if (!raw) {
      const defaults = DEFAULT_QUICK_FRUITS.filter((f) => !deletedNames.has(f.name.toLowerCase().trim()));
      localStorage.setItem(STORAGE_QUICK_FRUITS, JSON.stringify(defaults));
      return defaults;
    }
    try {
      const parsed: QuickFruitItem[] = JSON.parse(raw);
      return parsed.filter((f) => !deletedNames.has(f.name.toLowerCase().trim()));
    } catch {
      return DEFAULT_QUICK_FRUITS.filter((f) => !deletedNames.has(f.name.toLowerCase().trim()));
    }
  },

  async createQuickFruit(
    data: { name: string; unit: string; price: number; emoji?: string; is_active?: boolean },
    currentUser: Profile
  ): Promise<QuickFruitItem> {
    if (currentUser.role !== 'Owner' && currentUser.role !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat menambah daftar produk buah.');
    }
    const now = new Date().toISOString();
    const newItem: QuickFruitItem = {
      id: `qf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: data.name.trim(),
      unit: data.unit ? data.unit.trim() : 'kg',
      price: Math.max(0, Number(data.price) || 0),
      emoji: data.emoji || '🍊',
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: now,
      updated_at: now,
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: inserted } = await supabase
          .from('quick_fruits')
          .upsert([newItem], { onConflict: 'name' })
          .select()
          .single();
        if (inserted) {
          newItem.id = inserted.id;
        }
      } catch {
        // Fallback to local storage
      }
    }

    const raw = localStorage.getItem(STORAGE_QUICK_FRUITS);
    const list: QuickFruitItem[] = raw ? JSON.parse(raw) : [...DEFAULT_QUICK_FRUITS];
    list.push(newItem);
    localStorage.setItem(STORAGE_QUICK_FRUITS, JSON.stringify(list));

    // Also auto-sync/create in stock_items warehouse master!
    try {
      const stockRaw = localStorage.getItem(STORAGE_STOCK_ITEMS);
      let stockList: StockItem[] = stockRaw ? JSON.parse(stockRaw) : [...DEFAULT_STOCK_ITEMS];
      const matchIndex = stockList.findIndex(
        (s) => s.fruit_name.toLowerCase().trim() === data.name.toLowerCase().trim()
      );
      if (matchIndex === -1) {
        const newStockItem: StockItem = {
          id: generateUniqueId('stk'),
          fruit_name: data.name.trim(),
          unit: data.unit ? data.unit.trim() : 'kg',
          current_stock: 0,
          canvas_allocated_stock: 0,
          min_stock_alert: 10,
          avg_cost_price: 0,
          latest_selling_price: Math.max(0, Number(data.price) || 0),
          emoji: data.emoji || '🍊',
          updated_at: now,
        };
        stockList.unshift(newStockItem);
        localStorage.setItem(STORAGE_STOCK_ITEMS, JSON.stringify(stockList));
        if (supabase) {
          supabase.from('stock_items').upsert([newStockItem], { onConflict: 'fruit_name' }).then(() => {}, () => {});
        }
      }
    } catch {}

    return newItem;
  },

  async updateQuickFruit(
    id: string,
    updates: Partial<QuickFruitItem>,
    currentUser: Profile
  ): Promise<QuickFruitItem> {
    if (currentUser.role !== 'Owner' && currentUser.role !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat mengubah daftar produk buah.');
    }
    const now = new Date().toISOString();
    const raw = localStorage.getItem(STORAGE_QUICK_FRUITS);
    let list: QuickFruitItem[] = raw ? JSON.parse(raw) : [...DEFAULT_QUICK_FRUITS];
    const existing = list.find((item) => item.id === id || item.name.toLowerCase().trim() === id.toLowerCase().trim());
    if (!existing) throw new Error('Data buah tidak ditemukan.');

    const updatedItem: QuickFruitItem = {
      ...existing,
      ...updates,
      updated_at: now,
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: updatedRows } = await supabase
          .from('quick_fruits')
          .update(updatedItem)
          .eq('id', existing.id)
          .select();
        if (updatedRows && updatedRows.length > 0) {
          list = list.map((item) => (item.id === id ? (updatedRows[0] as QuickFruitItem) : item));
          localStorage.setItem(STORAGE_QUICK_FRUITS, JSON.stringify(list));
        } else {
          await supabase.from('quick_fruits').update(updatedItem).ilike('name', existing.name);
        }
      } catch {
        try {
          await supabase.from('quick_fruits').update(updatedItem).ilike('name', existing.name);
        } catch {}
      }
    }

    list = list.map((item) => (item.id === id ? updatedItem : item));
    localStorage.setItem(STORAGE_QUICK_FRUITS, JSON.stringify(list));

    // Also auto-sync changes to stock_items master!
    try {
      const stockRaw = localStorage.getItem(STORAGE_STOCK_ITEMS);
      if (stockRaw) {
        let stockList: StockItem[] = JSON.parse(stockRaw);
        let stockUpdated = false;
        stockList = stockList.map((s) => {
          if (
            s.fruit_name.toLowerCase().trim() === existing.name.toLowerCase().trim() ||
            s.fruit_name.toLowerCase().trim() === (updatedItem.name || '').toLowerCase().trim()
          ) {
            stockUpdated = true;
            return {
              ...s,
              fruit_name: updatedItem.name,
              unit: updatedItem.unit,
              latest_selling_price: updatedItem.price,
              emoji: updatedItem.emoji || s.emoji,
              updated_at: now,
            };
          }
          return s;
        });
        if (stockUpdated) {
          localStorage.setItem(STORAGE_STOCK_ITEMS, JSON.stringify(stockList));
          if (supabase) {
            supabase
              .from('stock_items')
              .update({
                fruit_name: updatedItem.name,
                unit: updatedItem.unit,
                latest_selling_price: updatedItem.price,
                emoji: updatedItem.emoji,
                updated_at: now,
              })
              .ilike('fruit_name', existing.name)
              .then(() => {}, () => {});
          }
        }
      }
    } catch {}

    return updatedItem;
  },

  async deleteQuickFruit(id: string, currentUser?: Profile): Promise<boolean> {
    if (currentUser && currentUser.role === 'Kurir') {
      throw new Error('Akses Ditolak: Kurir tidak dapat menghapus item buah.');
    }
    const raw = localStorage.getItem(STORAGE_QUICK_FRUITS);
    let list: QuickFruitItem[] = raw ? JSON.parse(raw) : [...DEFAULT_QUICK_FRUITS];
    let target = list.find((item) => item.id === id || item.name.toLowerCase().trim() === id.toLowerCase().trim());

    if (!target) {
      target = DEFAULT_QUICK_FRUITS.find((item) => item.id === id || item.name.toLowerCase().trim() === id.toLowerCase().trim());
    }

    const fruitNameKey = target?.name || id;
    if (fruitNameKey) {
      this.recordDeletedFruit(fruitNameKey);
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        if (!target) {
          const { data: qfData } = await supabase.from('quick_fruits').select('*').eq('id', id).maybeSingle();
          if (qfData) {
            target = qfData as QuickFruitItem;
            this.recordDeletedFruit(target.name);
          }
        }

        await supabase.from('quick_fruits').delete().eq('id', id);
        if (target?.name) {
          await supabase.from('quick_fruits').delete().ilike('name', target.name);
          await supabase.from('stock_items').delete().ilike('fruit_name', target.name);
        } else if (id) {
          await supabase.from('stock_items').delete().eq('id', id);
          await supabase.from('stock_items').delete().ilike('fruit_name', id);
        }
      } catch (err) {
        console.warn('Supabase deleteQuickFruit error:', err);
      }
    }

    list = list.filter((item) => item.id !== id && (!target || item.name.toLowerCase().trim() !== target.name.toLowerCase().trim()));
    localStorage.setItem(STORAGE_QUICK_FRUITS, JSON.stringify(list));

    if (target?.name || id) {
      const nameToFilter = (target?.name || id).toLowerCase().trim();
      try {
        const sRaw = localStorage.getItem(STORAGE_STOCK_ITEMS);
        if (sRaw) {
          let sList: StockItem[] = JSON.parse(sRaw);
          sList = sList.filter((s) => s.fruit_name.toLowerCase().trim() !== nameToFilter && s.id !== id);
          localStorage.setItem(STORAGE_STOCK_ITEMS, JSON.stringify(sList));
        }
      } catch {}
    }

    return true;
  },

  async resetQuickFruitsToDefault(currentUser: Profile): Promise<QuickFruitItem[]> {
    if (currentUser.role !== 'Owner') {
      throw new Error('Akses Ditolak: Hanya Owner yang dapat mereset daftar buah ke bawaan.');
    }
    localStorage.setItem(STORAGE_QUICK_FRUITS, JSON.stringify(DEFAULT_QUICK_FRUITS));
    return DEFAULT_QUICK_FRUITS;
  },

  // ==========================================
  // INVENTORY, SORTIR KULAKAN & CANVAS KURIR
  // ==========================================
  recordStockMovementInternal(movement: Omit<StockMovementLog, 'id' | 'timestamp'>): void {
    try {
      const now = new Date().toISOString();
      const newLog: StockMovementLog = {
        ...movement,
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: now,
      };
      const raw = localStorage.getItem(STORAGE_STOCK_LOGS);
      const list: StockMovementLog[] = raw ? JSON.parse(raw) : [...DEFAULT_STOCK_LOGS];
      list.unshift(newLog);
      localStorage.setItem(STORAGE_STOCK_LOGS, JSON.stringify(list));

      const supabase = getSupabase();
      if (supabase) {
        supabase.from('stock_movement_logs').insert([newLog]).then(() => {}, () => {});
      }
    } catch (err) {
      console.warn('recordStockMovementInternal error:', err);
    }
  },

  async deductStockForOrder(order: Order, currentUser: Profile): Promise<boolean> {
    if (!order.order_items || order.order_items.length === 0) return false;
    try {
      const list = await this.getStockItems();
      let updated = false;
      const updatedStockItems: StockItem[] = [];

      for (const item of order.order_items) {
        if (!item.item_name || !item.quantity) continue;
        const targetName = item.item_name.toLowerCase().trim();
        const matched = list.find(
          (s) =>
            s.fruit_name.toLowerCase().trim() === targetName ||
            targetName.includes(s.fruit_name.toLowerCase().trim()) ||
            s.fruit_name.toLowerCase().trim().includes(targetName)
        );

        if (matched) {
          const qty = Number(item.quantity) || 0;
          matched.current_stock = Math.max(0, Number((matched.current_stock - qty).toFixed(2)));
          matched.updated_at = new Date().toISOString();
          updated = true;
          updatedStockItems.push(matched);

          this.recordStockMovementInternal({
            fruit_name: matched.fruit_name,
            unit: matched.unit,
            type: 'ORDER_KELUAR',
            qty_change: -qty,
            stock_after: matched.current_stock,
            reference_id: order.id,
            reference_note: `Penjualan Order #${order.order_number} (${order.customer_name})`,
            operator_name: currentUser.name,
          });
        }
      }

      if (updated) {
        localStorage.setItem(STORAGE_STOCK_ITEMS, JSON.stringify(list));

        // CRITICAL: Update Supabase stock_items table so stock decreases immediately and permanently!
        const supabase = getSupabase();
        if (supabase) {
          for (const s of updatedStockItems) {
            try {
              const cleanS = this.cleanStockItemPayloadForSupabase(s);
              await supabase.from('stock_items').upsert([cleanS], { onConflict: 'fruit_name' });
            } catch (err) {
              console.warn('Supabase deduct stock error:', err);
            }
          }
        }
      }
      return true;
    } catch (err) {
      console.warn('deductStockForOrder error:', err);
      return false;
    }
  },

  async restoreStockForCancelledOrder(order: Order, currentUser: Profile): Promise<boolean> {
    if (!order.order_items || order.order_items.length === 0) return false;
    try {
      const list = await this.getStockItems();
      let updated = false;
      const updatedStockItems: StockItem[] = [];

      for (const item of order.order_items) {
        if (!item.item_name || !item.quantity) continue;
        const targetName = item.item_name.toLowerCase().trim();
        const matched = list.find(
          (s) =>
            s.fruit_name.toLowerCase().trim() === targetName ||
            targetName.includes(s.fruit_name.toLowerCase().trim()) ||
            s.fruit_name.toLowerCase().trim().includes(targetName)
        );

        if (matched) {
          const qty = Number(item.quantity) || 0;
          matched.current_stock = Number((matched.current_stock + qty).toFixed(2));
          matched.updated_at = new Date().toISOString();
          updated = true;
          updatedStockItems.push(matched);

          this.recordStockMovementInternal({
            fruit_name: matched.fruit_name,
            unit: matched.unit,
            type: 'PENYESUAIAN',
            qty_change: qty,
            stock_after: matched.current_stock,
            reference_id: order.id,
            reference_note: `Pembatalan Order #${order.order_number} (${order.customer_name}) - Stok dikembalikan ke gudang`,
            operator_name: currentUser.name,
          });
        }
      }

      if (updated) {
        localStorage.setItem(STORAGE_STOCK_ITEMS, JSON.stringify(list));
        const supabase = getSupabase();
        if (supabase) {
          for (const s of updatedStockItems) {
            try {
              const cleanS = this.cleanStockItemPayloadForSupabase(s);
              await supabase.from('stock_items').upsert([cleanS], { onConflict: 'fruit_name' });
            } catch (err) {
              console.warn('Supabase restore stock error:', err);
            }
          }
        }
      }
      return true;
    } catch (err) {
      console.warn('restoreStockForCancelledOrder error:', err);
      return false;
    }
  },

  async getStockItems(): Promise<StockItem[]> {
    const rawLocal = localStorage.getItem(STORAGE_STOCK_ITEMS);
    let localList: StockItem[] = rawLocal ? JSON.parse(rawLocal) : [...DEFAULT_STOCK_ITEMS];

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('stock_items').select('*').order('fruit_name');
        if (!error && Array.isArray(data)) {
          const localMapById = new Map<string, StockItem>(localList.map((s) => [s.id, s]));
          const localMapByName = new Map<string, StockItem>(
            localList.map((s) => [s.fruit_name.toLowerCase().trim(), s])
          );

          const combined = data.map((d: any) => {
            const loc =
              localMapById.get(d.id) || localMapByName.get(d.fruit_name.toLowerCase().trim());
            // If local item has a more recent updated_at timestamp, use local item and sync to Supabase
            if (
              loc &&
              loc.updated_at &&
              (!d.updated_at || new Date(loc.updated_at).getTime() > new Date(d.updated_at).getTime())
            ) {
              const cleanLoc = this.cleanStockItemPayloadForSupabase(loc);
              supabase
                .from('stock_items')
                .update(cleanLoc)
                .eq('id', d.id)
                .then(() => {}, () => {});
              return { ...loc, current_stock: loc.current_stock };
            }
            // Preserve rich client properties like emoji and latest_selling_price if present in local
            return {
              ...d,
              current_stock: Number(d.current_stock) || 0,
              canvas_allocated_stock: Number(d.canvas_allocated_stock) || 0,
              min_stock_alert: Number(d.min_stock_alert) || 10,
              avg_cost_price: Number(d.avg_cost_price) || 0,
              emoji: loc?.emoji || d.emoji || '🍊',
              latest_selling_price: loc?.latest_selling_price || d.latest_selling_price || 0,
            } as StockItem;
          });

          const supaIds = new Set(data.map((d: any) => d.id));
          const supaNames = new Set(data.map((d: any) => d.fruit_name.toLowerCase().trim()));

          for (const loc of localList) {
            if (!supaIds.has(loc.id) && !supaNames.has(loc.fruit_name.toLowerCase().trim())) {
              combined.push(loc);
              const cleanLoc = this.cleanStockItemPayloadForSupabase(loc);
              supabase
                .from('stock_items')
                .upsert([cleanLoc], { onConflict: 'fruit_name' })
                .then(() => {}, () => {});
            }
          }

          try {
            localStorage.setItem(STORAGE_STOCK_ITEMS, JSON.stringify(combined));
          } catch {}
          return combined as StockItem[];
        }
      } catch (err) {
        console.warn('Supabase getStockItems error, falling back to local storage:', err);
      }
    }
    if (rawLocal === null) {
      localStorage.setItem(STORAGE_STOCK_ITEMS, JSON.stringify(DEFAULT_STOCK_ITEMS));
      return DEFAULT_STOCK_ITEMS;
    }
    try {
      return JSON.parse(rawLocal);
    } catch {
      return DEFAULT_STOCK_ITEMS;
    }
  },

  async createStockItem(
    data: {
      fruit_name: string;
      unit: string;
      current_stock: number;
      min_stock_alert?: number;
      avg_cost_price?: number;
      latest_selling_price?: number;
      emoji?: string;
    },
    currentUser: Profile
  ): Promise<StockItem> {
    if (currentUser.role !== 'Owner' && currentUser.role !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat menambah jenis buah baru.');
    }
    if (!data.fruit_name?.trim()) {
      throw new Error('Nama buah wajib diisi.');
    }
    const raw = localStorage.getItem(STORAGE_STOCK_ITEMS);
    let list: StockItem[] = raw ? JSON.parse(raw) : [...DEFAULT_STOCK_ITEMS];

    const exists = list.some(
      (s) => s.fruit_name.toLowerCase().trim() === data.fruit_name.toLowerCase().trim()
    );
    if (exists) {
      throw new Error(`Buah "${data.fruit_name}" sudah ada dalam master stok.`);
    }

    const newItem: StockItem = {
      id: generateUniqueId('stk'),
      fruit_name: data.fruit_name.trim(),
      unit: data.unit?.trim() || 'kg',
      current_stock: Math.max(0, Number(data.current_stock) || 0),
      canvas_allocated_stock: 0,
      min_stock_alert: Number(data.min_stock_alert) || 10,
      avg_cost_price: Number(data.avg_cost_price) || 0,
      latest_selling_price: Number(data.latest_selling_price) || 0,
      emoji: data.emoji || '🍊',
      updated_at: new Date().toISOString(),
    };

    list.unshift(newItem);
    localStorage.setItem(STORAGE_STOCK_ITEMS, JSON.stringify(list));

    const supabase = getSupabase();
    if (supabase) {
      try {
        const cleanItem = this.cleanStockItemPayloadForSupabase(newItem);
        await supabase.from('stock_items').upsert([cleanItem], { onConflict: 'fruit_name' });
      } catch (err) {
        console.warn('Supabase createStockItem error:', err);
      }
    }

    if (newItem.current_stock > 0) {
      this.recordStockMovementInternal({
        fruit_name: newItem.fruit_name,
        unit: newItem.unit,
        type: 'PENYESUAIAN',
        qty_change: newItem.current_stock,
        stock_after: newItem.current_stock,
        reference_id: newItem.id,
        reference_note: `Penambahan Master Buah Baru (Stok Awal: ${newItem.current_stock} ${newItem.unit})`,
        operator_name: currentUser.name,
      });
    }

    // Also auto-sync into quick fruits master so it is available for orders immediately
    try {
      const qfRaw = localStorage.getItem(STORAGE_QUICK_FRUITS);
      let qfList: QuickFruitItem[] = qfRaw ? JSON.parse(qfRaw) : [...DEFAULT_QUICK_FRUITS];
      if (!qfList.some((q) => q.name.toLowerCase().trim() === newItem.fruit_name.toLowerCase().trim())) {
        const newQf: QuickFruitItem = {
          id: generateUniqueId('qf'),
          name: newItem.fruit_name,
          unit: newItem.unit,
          price: newItem.latest_selling_price,
          emoji: newItem.emoji,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        qfList.push(newQf);
        localStorage.setItem(STORAGE_QUICK_FRUITS, JSON.stringify(qfList));
        if (supabase) {
          supabase.from('quick_fruits').upsert([newQf]).then(() => {}, () => {});
        }
      }
    } catch {}

    return newItem;
  },

  async deleteStockItem(id: string, currentUser: Profile): Promise<boolean> {
    if (currentUser.role !== 'Owner' && currentUser.role !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat menghapus data buah.');
    }
    const raw = localStorage.getItem(STORAGE_STOCK_ITEMS);
    let list: StockItem[] = raw ? JSON.parse(raw) : [...DEFAULT_STOCK_ITEMS];
    let target = list.find((s) => s.id === id || s.fruit_name.toLowerCase().trim() === id.toLowerCase().trim());

    const supabase = getSupabase();
    if (supabase) {
      try {
        if (!target) {
          const { data: supaItem } = await supabase.from('stock_items').select('*').eq('id', id).maybeSingle();
          if (supaItem) target = supaItem as StockItem;
        }

        await supabase.from('stock_items').delete().eq('id', id);

        if (target?.fruit_name) {
          this.recordDeletedFruit(target.fruit_name);
          await supabase.from('stock_items').delete().ilike('fruit_name', target.fruit_name);
          await supabase.from('quick_fruits').delete().ilike('name', target.fruit_name);
        }
      } catch (err) {
        console.warn('Supabase deleteStockItem error:', err);
      }
    }

    list = list.filter((s) => s.id !== id && (!target || s.fruit_name.toLowerCase().trim() !== target.fruit_name.toLowerCase().trim()));
    localStorage.setItem(STORAGE_STOCK_ITEMS, JSON.stringify(list));

    // Also sync deletion to quick fruits
    if (target?.fruit_name) {
      try {
        const qfRaw = localStorage.getItem(STORAGE_QUICK_FRUITS);
        if (qfRaw) {
          let qfList: QuickFruitItem[] = JSON.parse(qfRaw);
          qfList = qfList.filter(
            (q) => q.name.toLowerCase().trim() !== target!.fruit_name.toLowerCase().trim()
          );
          localStorage.setItem(STORAGE_QUICK_FRUITS, JSON.stringify(qfList));
        }
      } catch {}

      this.recordStockMovementInternal({
        fruit_name: target.fruit_name,
        unit: target.unit || 'kg',
        type: 'PENYESUAIAN',
        qty_change: -(target.current_stock || 0),
        stock_after: 0,
        reference_id: target.id || id,
        reference_note: `Penghapusan Master Buah "${target.fruit_name}" oleh ${currentUser.name}`,
        operator_name: currentUser.name,
      });
    }

    return true;
  },

  async updateStockItem(
    id: string,
    updates: Partial<StockItem>,
    currentUser: Profile
  ): Promise<StockItem> {
    if (currentUser.role !== 'Owner' && currentUser.role !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat mengubah data stok.');
    }
    const raw = localStorage.getItem(STORAGE_STOCK_ITEMS);
    let list: StockItem[] = raw ? JSON.parse(raw) : [...DEFAULT_STOCK_ITEMS];

    let index = list.findIndex(
      (s) => s.id === id || s.fruit_name.toLowerCase().trim() === id.toLowerCase().trim()
    );

    // If not found in list, attempt fetch from Supabase
    if (index === -1) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data } = await supabase.from('stock_items').select('*').or(`id.eq.${id},fruit_name.ilike.${id}`).maybeSingle();
          if (data) {
            list.push(data as StockItem);
            index = list.length - 1;
          }
        } catch {}
      }
    }

    if (index === -1) throw new Error('Data stok buah tidak ditemukan.');
    const existing = list[index];

    const updatedItem: StockItem = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.current_stock !== undefined && Number(updates.current_stock) !== Number(existing.current_stock)) {
      const diff = Number((Number(updates.current_stock) - Number(existing.current_stock)).toFixed(2));
      this.recordStockMovementInternal({
        fruit_name: updatedItem.fruit_name,
        unit: updatedItem.unit,
        type: 'PENYESUAIAN',
        qty_change: diff,
        stock_after: updatedItem.current_stock,
        reference_id: updatedItem.id,
        reference_note: `Penyesuaian Stok dari ${existing.current_stock} menjadi ${updatedItem.current_stock} ${updatedItem.unit}`,
        operator_name: currentUser.name,
      });
    }

    list[index] = updatedItem;
    localStorage.setItem(STORAGE_STOCK_ITEMS, JSON.stringify(list));

    const supabase = getSupabase();
    if (supabase) {
      try {
        const cleanPayload = this.cleanStockItemPayloadForSupabase(updatedItem);
        const { data: upById } = await supabase.from('stock_items').update(cleanPayload).eq('id', existing.id).select('id');
        if (!upById || upById.length === 0) {
          await supabase.from('stock_items').upsert([cleanPayload], { onConflict: 'fruit_name' });
        }
      } catch (err) {
        console.warn('Supabase updateStockItem error:', err);
      }
    }

    // Also sync update to quick fruits (both in LocalStorage & Supabase!)
    try {
      const qfRaw = localStorage.getItem(STORAGE_QUICK_FRUITS);
      if (qfRaw) {
        let qfList: QuickFruitItem[] = JSON.parse(qfRaw);
        let found = false;
        qfList = qfList.map((q) => {
          if (
            q.name.toLowerCase().trim() === existing.fruit_name.toLowerCase().trim() ||
            q.name.toLowerCase().trim() === (updatedItem.fruit_name || '').toLowerCase().trim()
          ) {
            found = true;
            return {
              ...q,
              name: updatedItem.fruit_name,
              unit: updatedItem.unit,
              price: updatedItem.latest_selling_price || q.price,
              emoji: updatedItem.emoji || q.emoji,
              updated_at: new Date().toISOString(),
            };
          }
          return q;
        });
        if (!found) {
          qfList.push({
            id: generateUniqueId('qf'),
            name: updatedItem.fruit_name,
            unit: updatedItem.unit,
            price: updatedItem.latest_selling_price || 0,
            emoji: updatedItem.emoji || '🍊',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        localStorage.setItem(STORAGE_QUICK_FRUITS, JSON.stringify(qfList));

        if (supabase) {
          supabase
            .from('quick_fruits')
            .update({
              name: updatedItem.fruit_name,
              unit: updatedItem.unit,
              price: updatedItem.latest_selling_price,
              emoji: updatedItem.emoji,
              updated_at: new Date().toISOString(),
            })
            .ilike('name', existing.fruit_name)
            .then(() => {}, () => {});
        }
      }
    } catch {}

    return updatedItem;
  },

  async clearAllFruitMaster(currentUser: Profile): Promise<boolean> {
    if (currentUser.role !== 'Owner' && currentUser.role !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat mengosongkan master buah.');
    }
    localStorage.setItem(STORAGE_STOCK_ITEMS, JSON.stringify([]));
    localStorage.setItem(STORAGE_QUICK_FRUITS, JSON.stringify([]));

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('stock_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('quick_fruits').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.warn('Supabase clearAllFruitMaster error:', err);
      }
    }
    return true;
  },

  async resetStockItemsToDefault(currentUser: Profile): Promise<StockItem[]> {
    if (currentUser.role !== 'Owner' && currentUser.role !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat mereset master buah.');
    }
    localStorage.setItem(STORAGE_STOCK_ITEMS, JSON.stringify(DEFAULT_STOCK_ITEMS));
    localStorage.setItem(STORAGE_QUICK_FRUITS, JSON.stringify(DEFAULT_QUICK_FRUITS));

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('stock_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('stock_items').upsert(DEFAULT_STOCK_ITEMS, { onConflict: 'fruit_name' });
      } catch (err) {
        console.warn('Supabase resetStockItemsToDefault error:', err);
      }
    }
    return DEFAULT_STOCK_ITEMS;
  },

  async adjustStockManually(
    id: string,
    newStock: number,
    reason: string,
    currentUser: Profile
  ): Promise<StockItem> {
    if (currentUser.role !== 'Owner' && currentUser.role !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat melakukan penyesuaian stok manual.');
    }
    const raw = localStorage.getItem(STORAGE_STOCK_ITEMS);
    let list: StockItem[] = raw ? JSON.parse(raw) : [...DEFAULT_STOCK_ITEMS];
    const existing = list.find((s) => s.id === id);
    if (!existing) throw new Error('Data stok tidak ditemukan.');

    const oldStock = existing.current_stock;
    const diff = Number((newStock - oldStock).toFixed(2));
    existing.current_stock = Math.max(0, newStock);
    existing.updated_at = new Date().toISOString();

    localStorage.setItem(STORAGE_STOCK_ITEMS, JSON.stringify(list));

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('stock_items').update({
          current_stock: existing.current_stock,
          updated_at: existing.updated_at,
        }).eq('id', id);
      } catch (err) {
        console.warn('Supabase adjustStockManually error:', err);
      }
    }

    this.recordStockMovementInternal({
      fruit_name: existing.fruit_name,
      unit: existing.unit,
      type: 'PENYESUAIAN',
      qty_change: diff,
      stock_after: existing.current_stock,
      reference_id: id,
      reference_note: `Penyesuaian Manual / Opname: ${reason.trim()} (Sebelum: ${oldStock}, Sesudah: ${newStock})`,
      operator_name: currentUser.name,
    });

    return existing;
  },

  async getStockMovementLogs(fruitName?: string): Promise<StockMovementLog[]> {
    const raw = localStorage.getItem(STORAGE_STOCK_LOGS);
    let list: StockMovementLog[] = raw ? JSON.parse(raw) : [...DEFAULT_STOCK_LOGS];
    if (fruitName && fruitName.trim()) {
      const q = fruitName.toLowerCase().trim();
      list = list.filter((l) => l.fruit_name.toLowerCase().includes(q));
    }
    return list;
  },

  // ------------------------------------------
  // KULAKAN / BELANJA & SORTIR MASUK GUDANG
  // ------------------------------------------
  async getStockInbounds(): Promise<StockInbound[]> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('stock_inbounds').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          const mapped: StockInbound[] = data.map((d: any) => ({
            id: d.id,
            purchase_date: d.purchase_date || (d.received_date ? String(d.received_date).slice(0, 10) : new Date().toISOString().slice(0, 10)),
            fruit_name: d.fruit_name,
            supplier_name: d.supplier_name || 'Pasar Induk',
            buyer_id: d.buyer_id || 'usr-admin',
            buyer_name: d.buyer_name || d.recorded_by_name || 'Admin',
            gross_purchase_qty: Number(d.gross_purchase_qty || d.quantity || 0),
            purchase_price_per_unit: Number(d.purchase_price_per_unit || d.cost_price || 0),
            total_purchase_amount: Number(d.total_purchase_amount || d.total_cost || 0),
            payment_method: d.payment_method || 'Tunai',
            payment_status: d.payment_status || 'Lunas',
            invoice_no: d.invoice_no || '',
            sorting_checked: d.sorting_checked ?? true,
            shrinkage_qty: Number(d.shrinkage_qty || 0),
            surplus_qty: Number(d.surplus_qty || 0),
            net_stocked_qty: Number(d.net_stocked_qty || d.quantity || 0),
            quality_notes: d.quality_notes || d.notes || '',
            created_at: d.created_at || new Date().toISOString(),
            created_by: d.created_by || d.recorded_by_name || 'Admin',
          }));
          try {
            localStorage.setItem(STORAGE_STOCK_INBOUNDS, JSON.stringify(mapped));
          } catch {}
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getStockInbounds error, falling back to local storage:', err);
      }
    }
    const raw = localStorage.getItem(STORAGE_STOCK_INBOUNDS);
    if (raw === null) {
      localStorage.setItem(STORAGE_STOCK_INBOUNDS, JSON.stringify(DEFAULT_STOCK_INBOUNDS));
      return DEFAULT_STOCK_INBOUNDS;
    }
    try {
      const list: StockInbound[] = JSON.parse(raw);
      return list.sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime());
    } catch {
      return DEFAULT_STOCK_INBOUNDS;
    }
  },

  async createStockInbound(
    data: Omit<StockInbound, 'id' | 'created_at' | 'created_by' | 'net_stocked_qty'>,
    currentUser: Profile
  ): Promise<StockInbound> {
    if (currentUser.role !== 'Owner' && currentUser.role !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang memiliki hak akses mencatat belanja/kulakan gudang.');
    }

    const now = new Date().toISOString();
    const gross = Math.max(0, Number(data.gross_purchase_qty) || 0);
    const shrinkage = Math.max(0, Number(data.shrinkage_qty) || 0);
    const surplus = Math.max(0, Number(data.surplus_qty) || 0);
    const net = Math.max(0, Number((gross - shrinkage + surplus).toFixed(2)));

    const pricePerUnit = Math.max(0, Number(data.purchase_price_per_unit) || 0);
    const totalAmount = data.total_purchase_amount ? Number(data.total_purchase_amount) : gross * pricePerUnit;

    const newInbound: StockInbound = {
      ...data,
      id: `inb-${Date.now().toString().slice(-6)}`,
      gross_purchase_qty: gross,
      shrinkage_qty: shrinkage,
      surplus_qty: surplus,
      net_stocked_qty: net,
      purchase_price_per_unit: pricePerUnit,
      total_purchase_amount: totalAmount,
      created_by: currentUser.id,
      created_at: now,
    };

    // Save inbound record
    const rawInbounds = localStorage.getItem(STORAGE_STOCK_INBOUNDS);
    const inbounds: StockInbound[] = rawInbounds ? JSON.parse(rawInbounds) : [...DEFAULT_STOCK_INBOUNDS];
    inbounds.unshift(newInbound);
    localStorage.setItem(STORAGE_STOCK_INBOUNDS, JSON.stringify(inbounds));

    // Increase current stock in warehouse and update avg cost price
    const rawStock = localStorage.getItem(STORAGE_STOCK_ITEMS);
    let stockList: StockItem[] = rawStock ? JSON.parse(rawStock) : [...DEFAULT_STOCK_ITEMS];
    const targetName = data.fruit_name.toLowerCase().trim();
    let stockItem = stockList.find((s) => s.fruit_name.toLowerCase().trim() === targetName);

    if (!stockItem) {
      stockItem = {
        id: `stk-${Date.now()}`,
        fruit_name: data.fruit_name.trim(),
        unit: 'kg',
        current_stock: net,
        canvas_allocated_stock: 0,
        min_stock_alert: 10,
        avg_cost_price: pricePerUnit,
        latest_selling_price: Math.round(pricePerUnit * 1.3),
        updated_at: now,
      };
      stockList.push(stockItem);
    } else {
      const oldStock = stockItem.current_stock;
      const oldCost = stockItem.avg_cost_price || pricePerUnit;
      // Weighted average cost price
      const totalUnits = oldStock + net;
      if (totalUnits > 0 && pricePerUnit > 0) {
        stockItem.avg_cost_price = Math.round((oldStock * oldCost + net * pricePerUnit) / totalUnits);
      }
      stockItem.current_stock = Number((oldStock + net).toFixed(2));
      stockItem.updated_at = now;
    }

    localStorage.setItem(STORAGE_STOCK_ITEMS, JSON.stringify(stockList));

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('stock_inbounds').insert([{
          id: newInbound.id,
          fruit_name: newInbound.fruit_name,
          unit: stockItem ? stockItem.unit : 'kg',
          quantity: newInbound.net_stocked_qty,
          cost_price: newInbound.purchase_price_per_unit,
          total_cost: newInbound.total_purchase_amount,
          supplier_name: newInbound.supplier_name,
          notes: newInbound.quality_notes || '',
          received_date: newInbound.purchase_date,
          recorded_by_name: currentUser.name,
        }]);
        await supabase.from('stock_items').update({
          current_stock: stockItem.current_stock,
          avg_cost_price: stockItem.avg_cost_price,
          updated_at: now,
        }).ilike('fruit_name', stockItem.fruit_name);
      } catch (err) {
        console.warn('Supabase createStockInbound error:', err);
      }
    }

    // Audit log
    const notesSummary = shrinkage > 0 ? ` (Susut/Rusak: ${shrinkage}kg)` : '';
    const surplusSummary = surplus > 0 ? ` (Lebih: +${surplus}kg)` : '';
    this.recordStockMovementInternal({
      fruit_name: stockItem.fruit_name,
      unit: stockItem.unit,
      type: 'KULAKAN_MASUK',
      qty_change: net,
      stock_after: stockItem.current_stock,
      reference_id: newInbound.id,
      reference_note: `Kulakan ${data.supplier_name} (Beli: ${gross}kg${notesSummary}${surplusSummary} -> Bersih Masuk: ${net}kg)`,
      operator_name: data.buyer_name || currentUser.name,
    });

    return newInbound;
  },

  async deleteStockInbound(id: string, currentUser: Profile): Promise<boolean> {
    if (currentUser.role !== 'Owner' && currentUser.role !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat menghapus data belanja.');
    }
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('stock_inbounds').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteStockInbound error:', err);
      }
    }
    const raw = localStorage.getItem(STORAGE_STOCK_INBOUNDS);
    let list: StockInbound[] = raw ? JSON.parse(raw) : [];
    list = list.filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_STOCK_INBOUNDS, JSON.stringify(list));
    return true;
  },

  // ------------------------------------------
  // ALUR KURIR CANVAS KELILING & REKONSILIASI
  // ------------------------------------------
  async getCanvasTrips(currentUser?: Profile | null): Promise<CanvasTrip[]> {
    const filterByRole = (trips: CanvasTrip[]) => {
      if (currentUser?.role === 'Kurir') {
        return trips.filter(
          (t) =>
            t.courier_id === currentUser.id ||
            (t.courier_name && currentUser.name && t.courier_name.toLowerCase().trim() === currentUser.name.toLowerCase().trim())
        );
      }
      if (currentUser?.role === 'Sales') {
        // Sales does not do canvas deliveries; keep confidential
        return trips.filter(
          (t) =>
            t.courier_id === currentUser.id ||
            (t.courier_name && currentUser.name && t.courier_name.toLowerCase().trim() === currentUser.name.toLowerCase().trim())
        );
      }
      return trips;
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('canvas_trips').select('*').order('trip_date', { ascending: false });
        if (!error && Array.isArray(data)) {
          const rawLocal = localStorage.getItem(STORAGE_CANVAS_TRIPS);
          const localList: CanvasTrip[] = rawLocal ? JSON.parse(rawLocal) : [];
          const localMap = new Map(localList.map((t) => [t.id, t]));

          const merged = data.map((st: any) => {
            const loc = localMap.get(st.id);
            // If local trip was marked Selesai & Rekonsiliasi, preserve it and re-sync to Supabase
            if (loc && loc.status === 'Selesai & Rekonsiliasi' && st.status !== 'Selesai & Rekonsiliasi') {
              supabase.from('canvas_trips').update({
                status: loc.status,
                items: loc.items,
                total_expected_cash: loc.total_expected_cash,
                actual_cash_submitted: loc.actual_cash_submitted,
                cash_difference: loc.cash_difference,
                remittance_status: loc.remittance_status,
              }).eq('id', loc.id).then(() => {}, () => {});
              return loc;
            }
            return st as CanvasTrip;
          });

          // Also include any local trips not yet in Supabase
          const supaIds = new Set(data.map((d: any) => d.id));
          for (const loc of localList) {
            if (!supaIds.has(loc.id)) {
              merged.push(loc);
              supabase.from('canvas_trips').insert([loc]).then(() => {}, () => {});
            }
          }

          if (!currentUser || currentUser.role === 'Owner' || currentUser.role === 'Manager') {
            try {
              localStorage.setItem(STORAGE_CANVAS_TRIPS, JSON.stringify(merged));
            } catch {}
          }
          const sorted = merged.sort((a, b) => new Date(b.trip_date).getTime() - new Date(a.trip_date).getTime());
          return filterByRole(sorted);
        }
      } catch (err) {
        console.warn('Supabase getCanvasTrips error, falling back to local storage:', err);
      }
    }
    const raw = localStorage.getItem(STORAGE_CANVAS_TRIPS);
    if (raw === null) {
      localStorage.setItem(STORAGE_CANVAS_TRIPS, JSON.stringify(DEFAULT_CANVAS_TRIPS));
      return filterByRole(DEFAULT_CANVAS_TRIPS);
    }
    try {
      const list: CanvasTrip[] = JSON.parse(raw);
      const sorted = list.sort((a, b) => new Date(b.trip_date).getTime() - new Date(a.trip_date).getTime());
      return filterByRole(sorted);
    } catch {
      return filterByRole(DEFAULT_CANVAS_TRIPS);
    }
  },

  async createCanvasTrip(
    data: {
      trip_date: string;
      courier_id: string;
      courier_name: string;
      items: { fruit_name: string; unit: string; brought_qty: number; selling_price: number }[];
      notes?: string;
    },
    currentUser: Profile
  ): Promise<CanvasTrip> {
    if (currentUser.role !== 'Owner' && currentUser.role !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat menugaskan kurir canvas.');
    }
    const now = new Date().toISOString();
    const tripItems: CanvasTripItem[] = data.items.map((i) => ({
      fruit_name: i.fruit_name,
      unit: i.unit || 'kg',
      brought_qty: Math.max(0, Number(i.brought_qty) || 0),
      selling_price: Math.max(0, Number(i.selling_price) || 0),
      sold_qty: 0,
      expected_cash: 0,
      returned_qty: 0,
      shrinkage_qty: 0,
    }));

    // Pre-flight check available warehouse stock before bringing items for canvas
    const stockList = await this.getStockItems();

    for (const item of tripItems) {
      const targetName = item.fruit_name.toLowerCase().trim();
      const stock = stockList.find(
        (s) =>
          s.fruit_name.toLowerCase().trim() === targetName ||
          targetName.includes(s.fruit_name.toLowerCase().trim()) ||
          s.fruit_name.toLowerCase().trim().includes(targetName)
      );
      if (stock) {
        if (stock.current_stock <= 0) {
          throw new Error(`Stok buah "${stock.fruit_name}" di gudang habis (0 ${stock.unit}). Tidak dapat dibawa canvas keliling.`);
        }
        if (item.brought_qty <= 0) {
          throw new Error(`Jumlah bawa untuk buah "${stock.fruit_name}" harus lebih dari 0.`);
        }
        if (item.brought_qty > stock.current_stock) {
          throw new Error(
            `Stok buah "${stock.fruit_name}" di gudang hanya tersisa ${stock.current_stock} ${stock.unit}. Anda tidak dapat membawa ${item.brought_qty} ${stock.unit} untuk canvas.`
          );
        }
      } else {
        throw new Error(`Buah "${item.fruit_name}" tidak ditemukan dalam data stok gudang.`);
      }
    }

    const newTrip: CanvasTrip = {
      id: `cnv-${Date.now().toString().slice(-6)}`,
      trip_date: data.trip_date,
      courier_id: data.courier_id,
      courier_name: data.courier_name,
      status: 'Sedang Keliling',
      items: tripItems,
      total_expected_cash: 0,
      actual_cash_submitted: 0,
      cash_difference: 0,
      notes: data.notes || '',
      departed_at: now,
      created_at: now,
    };

    // Save trip
    const rawTrips = localStorage.getItem(STORAGE_CANVAS_TRIPS);
    const trips: CanvasTrip[] = rawTrips ? JSON.parse(rawTrips) : [...DEFAULT_CANVAS_TRIPS];
    trips.unshift(newTrip);
    localStorage.setItem(STORAGE_CANVAS_TRIPS, JSON.stringify(trips));

    // Allocate stock: deduct from current_stock, add to canvas_allocated_stock
    for (const item of tripItems) {
      const targetName = item.fruit_name.toLowerCase().trim();
      const stock = stockList.find(
        (s) =>
          s.fruit_name.toLowerCase().trim() === targetName ||
          targetName.includes(s.fruit_name.toLowerCase().trim()) ||
          s.fruit_name.toLowerCase().trim().includes(targetName)
      );
      if (stock) {
        stock.current_stock = Math.max(0, Number((stock.current_stock - item.brought_qty).toFixed(2)));
        stock.canvas_allocated_stock = Number((stock.canvas_allocated_stock + item.brought_qty).toFixed(2));
        stock.updated_at = now;

        this.recordStockMovementInternal({
          fruit_name: stock.fruit_name,
          unit: stock.unit,
          type: 'CANVAS_BAWA',
          qty_change: -item.brought_qty,
          stock_after: stock.current_stock,
          reference_id: newTrip.id,
          reference_note: `Dibawa Kurir ${data.courier_name} canvas keliling lapangan`,
          operator_name: currentUser.name,
        });
      }
    }

    localStorage.setItem(STORAGE_STOCK_ITEMS, JSON.stringify(stockList));

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('canvas_trips').upsert([newTrip], { onConflict: 'id' });
        for (const item of tripItems) {
          const targetName = item.fruit_name.toLowerCase().trim();
          const s = stockList.find(
            (x) =>
              x.fruit_name.toLowerCase().trim() === targetName ||
              targetName.includes(x.fruit_name.toLowerCase().trim()) ||
              x.fruit_name.toLowerCase().trim().includes(targetName)
          );
          if (s) {
            s.updated_at = now;
            const cleanS = this.cleanStockItemPayloadForSupabase(s);
            await supabase.from('stock_items').upsert([cleanS], { onConflict: 'fruit_name' });
          }
        }
      } catch (err) {
        console.warn('Supabase createCanvasTrip error:', err);
      }
    }

    return newTrip;
  },

  async reconcileCanvasTrip(
    id: string,
    reconciliationData: {
      items: CanvasTripItem[];
      actual_cash_submitted: number;
      notes?: string;
      verified_by_name?: string;
    },
    currentUser: Profile
  ): Promise<CanvasTrip> {
    if (currentUser.role !== 'Owner' && currentUser.role !== 'Manager' && currentUser.role !== 'Kurir') {
      throw new Error('Akses Ditolak: Anda tidak memiliki hak akses melakukan rekonsiliasi canvas.');
    }
    const rawTrips = localStorage.getItem(STORAGE_CANVAS_TRIPS);
    let trips: CanvasTrip[] = rawTrips ? JSON.parse(rawTrips) : [...DEFAULT_CANVAS_TRIPS];
    const trip = trips.find((t) => t.id === id);
    if (!trip) throw new Error('Data canvas keliling tidak ditemukan.');

    const now = new Date().toISOString();
    let totalExpectedCash = 0;

    const reconciledItems: CanvasTripItem[] = reconciliationData.items.map((i) => {
      const sold = Math.max(0, Number(i.sold_qty) || 0);
      const returned = Math.max(0, Number(i.returned_qty) || 0);
      const shrinkage = Math.max(0, Number(i.shrinkage_qty) || 0);
      const expected = sold * i.selling_price;
      totalExpectedCash += expected;

      return {
        ...i,
        sold_qty: sold,
        returned_qty: returned,
        shrinkage_qty: shrinkage,
        expected_cash: expected,
      };
    });

    const actualCash = Math.max(0, Number(reconciliationData.actual_cash_submitted) || 0);
    const cashDiff = actualCash - totalExpectedCash;

    trip.status = 'Selesai & Rekonsiliasi';
    trip.items = reconciledItems;
    trip.total_expected_cash = totalExpectedCash;
    trip.actual_cash_submitted = actualCash;
    trip.cash_difference = cashDiff;
    trip.returned_at = now;
    trip.verified_by_name = reconciliationData.verified_by_name || currentUser.name;
    trip.remittance_status = 'Sudah Disetor ke Kas';
    trip.remitted_at = now;
    trip.remitted_by_name = trip.verified_by_name || currentUser.name;
    if (reconciliationData.notes) trip.notes = reconciliationData.notes;

    localStorage.setItem(STORAGE_CANVAS_TRIPS, JSON.stringify(trips));

    // Return stock back to warehouse: current_stock increases by returned_qty, canvas_allocated_stock decreases by brought_qty
    const stockList = await this.getStockItems();

    for (const item of reconciledItems) {
      const targetName = item.fruit_name.toLowerCase().trim();
      const stock = stockList.find(
        (s) =>
          s.fruit_name.toLowerCase().trim() === targetName ||
          targetName.includes(s.fruit_name.toLowerCase().trim()) ||
          s.fruit_name.toLowerCase().trim().includes(targetName)
      );
      if (stock) {
        // Return unsold items back to available stock
        stock.current_stock = Number((stock.current_stock + item.returned_qty).toFixed(2));
        stock.canvas_allocated_stock = Math.max(0, Number((stock.canvas_allocated_stock - item.brought_qty).toFixed(2)));
        stock.updated_at = now;

        const shrinkNote = item.shrinkage_qty > 0 ? `, Rusak/Susut jalan: ${item.shrinkage_qty} ${item.unit}` : '';
        this.recordStockMovementInternal({
          fruit_name: stock.fruit_name,
          unit: stock.unit,
          type: 'CANVAS_RETURN',
          qty_change: item.returned_qty,
          stock_after: stock.current_stock,
          reference_id: trip.id,
          reference_note: `Sisa Canvas Kurir ${trip.courier_name} kembali ke gudang (Bawa: ${item.brought_qty}, Terjual: ${item.sold_qty}, Kembali: ${item.returned_qty}${shrinkNote})`,
          operator_name: trip.verified_by_name || currentUser.name,
        });
      }
    }

    localStorage.setItem(STORAGE_STOCK_ITEMS, JSON.stringify(stockList));

    const supabase = getSupabase();
    if (supabase) {
      try {
        const supaTripUpdate = {
          status: 'Selesai & Rekonsiliasi',
          items: reconciledItems,
          total_expected_cash: totalExpectedCash,
          actual_cash_submitted: actualCash,
          cash_difference: cashDiff,
          notes: trip.notes || '',
          verified_by_name: trip.verified_by_name || currentUser.name,
          remittance_status: trip.remittance_status,
          remitted_at: trip.remitted_at,
          remitted_by_name: trip.remitted_by_name,
        };
        const { error: tripErr } = await supabase.from('canvas_trips').update(supaTripUpdate).eq('id', trip.id);
        if (tripErr) {
          // If optional columns fail, update base columns
          await supabase.from('canvas_trips').update({
            status: 'Selesai & Rekonsiliasi',
            items: reconciledItems,
            total_expected_cash: totalExpectedCash,
            actual_cash_submitted: actualCash,
            cash_difference: cashDiff,
          }).eq('id', trip.id);
        }

        for (const item of reconciledItems) {
          const targetName = item.fruit_name.toLowerCase().trim();
          const s = stockList.find(
            (x) =>
              x.fruit_name.toLowerCase().trim() === targetName ||
              targetName.includes(x.fruit_name.toLowerCase().trim()) ||
              x.fruit_name.toLowerCase().trim().includes(targetName)
          );
          if (s) {
            s.updated_at = now;
            const cleanS = this.cleanStockItemPayloadForSupabase(s);
            await supabase.from('stock_items').upsert([cleanS], { onConflict: 'fruit_name' });
          }
        }
      } catch (err) {
        console.warn('Supabase reconcileCanvasTrip error:', err);
      }
    }

    return trip;
  },

  async deleteCanvasTrip(id: string, currentUser: Profile): Promise<boolean> {
    if (currentUser.role !== 'Owner' && currentUser.role !== 'Manager') {
      throw new Error('Akses Ditolak: Hanya Owner dan Manager yang dapat menghapus riwayat canvas.');
    }
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('canvas_trips').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteCanvasTrip error:', err);
      }
    }
    const raw = localStorage.getItem(STORAGE_CANVAS_TRIPS);
    let list: CanvasTrip[] = raw ? JSON.parse(raw) : [];
    list = list.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_CANVAS_TRIPS, JSON.stringify(list));
    return true;
  },

  // Safe Reset: Only clears transactions, canvas, logs, and resets stock numbers to 0
  // NEVER touches profiles (users), prospects (customers), zones, or business types
  async resetTransactionAndStockData(currentUser: Profile): Promise<boolean> {
    if (currentUser.role !== 'Owner' && currentUser.role !== 'Manager') {
      throw new Error('Hanya Owner dan Manager yang berhak mengosongkan data transaksi dan me-reset stok.');
    }

    const client = getSupabase();
    if (client) {
      try {
        // Delete all orders
        await client.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (e) {
        console.warn('Supabase reset orders warn:', e);
      }

      try {
        // Delete canvas trips
        await client.from('canvas_trips').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (e) {
        console.warn('Supabase reset canvas_trips warn:', e);
      }

      try {
        // Delete stock inbounds
        await client.from('stock_inbounds').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (e) {
        console.warn('Supabase reset stock_inbounds warn:', e);
      }

      try {
        // Delete stock logs
        await client.from('stock_movement_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (e) {
        console.warn('Supabase reset stock_movement_logs warn:', e);
      }

      try {
        // Reset stock items quantity to 0
        await client.from('stock_items').update({ current_stock: 0, canvas_allocated_stock: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (e) {
        console.warn('Supabase reset stock_items warn:', e);
      }
    }

    // Always clear localStorage for transactions & reset stocks
    localStorage.removeItem(STORAGE_ORDERS);
    localStorage.removeItem(STORAGE_REMITTANCE_MAP);
    localStorage.removeItem(STORAGE_CANVAS_TRIPS);
    localStorage.removeItem(STORAGE_STOCK_INBOUNDS);
    localStorage.removeItem(STORAGE_STOCK_LOGS);

    // Reset stock items to 0 kg in localStorage
    const rawStock = localStorage.getItem(STORAGE_STOCK_ITEMS);
    if (rawStock) {
      try {
        const items: StockItem[] = JSON.parse(rawStock);
        const resetItems = items.map((it) => ({
          ...it,
          current_stock: 0,
          canvas_allocated_stock: 0,
        }));
        localStorage.setItem(STORAGE_STOCK_ITEMS, JSON.stringify(resetItems));
      } catch {
        localStorage.removeItem(STORAGE_STOCK_ITEMS);
      }
    } else {
      const resetItems = DEFAULT_STOCK_ITEMS.map((it) => ({
        ...it,
        current_stock: 0,
        canvas_allocated_stock: 0,
      }));
      localStorage.setItem(STORAGE_STOCK_ITEMS, JSON.stringify(resetItems));
    }

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
    localStorage.removeItem(STORAGE_ORDERS);
    localStorage.removeItem(STORAGE_QUICK_FRUITS);
    localStorage.removeItem(STORAGE_STOCK_ITEMS);
    localStorage.removeItem(STORAGE_STOCK_INBOUNDS);
    localStorage.removeItem(STORAGE_CANVAS_TRIPS);
    localStorage.removeItem(STORAGE_STOCK_LOGS);
    initializeLocalStorageSeed();
  },
};
