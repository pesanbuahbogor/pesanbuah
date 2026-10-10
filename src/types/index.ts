export type UserRole = 'Owner' | 'Manager' | 'Sales' | 'Kurir';

export type ProspectStatus = 'Prospect' | 'Follow Up' | 'Customer' | 'Tidak Jadi';

export type OrderStatus = 'Diterima' | 'Disiapkan' | 'Sedang Diantar' | 'Selesai' | 'Dibatalkan';

export type DeliverySlot =
  | 'Sekarang'
  | 'Sekarang (Langsung / On-the-spot)'
  | '08:00 - 10:00'
  | '14:00 - 16:00'
  | 'Keesokan Harinya (08:00 - 10:00)';

export type PaymentMethod = 'Tunai' | 'QRIS' | 'Transfer Bank';

export type PaymentStatus = 'Belum Lunas' | 'Lunas';

export interface OrderItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string; // kg, ikat, pack, dus, pcs, karung, keranjang
  price: number;
  subtotal: number;
}

export interface QuickFruitItem {
  id: string;
  name: string;
  unit: string; // kg, dus, pack, ikat, pcs, karung, keranjang
  price: number;
  emoji?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type RemittanceStatus = 'Belum Disetor (Ada di Kurir)' | 'Sudah Disetor ke Kas';

export interface StockItem {
  id: string;
  fruit_name: string;
  unit: string;
  current_stock: number; // Stok bersih siap jual di gudang
  canvas_allocated_stock: number; // Stok yang sedang dibawa kurir canvas keliling
  min_stock_alert: number;
  avg_cost_price: number; // Harga modal rata-rata per satuan
  latest_selling_price: number; // Harga jual acuan
  emoji?: string;
  updated_at: string;
}

export interface StockInbound {
  id: string; // e.g. INB-20261004-001
  purchase_date: string; // YYYY-MM-DD
  fruit_name: string;
  supplier_name: string; // e.g. Pasar Induk Kramat Jati, Petani Ciwidey
  buyer_id: string;
  buyer_name: string;
  gross_purchase_qty: number; // Timbangan awal beli (misal 50 kg)
  purchase_price_per_unit: number; // Harga beli per kg
  total_purchase_amount: number; // Total bayar belanja
  payment_method: 'Tunai' | 'Transfer Bank' | 'Hutang / Tempo';
  payment_status: 'Lunas' | 'Belum Lunas';
  invoice_no?: string;
  // QC Sortir & Timbang Masuk Gudang
  sorting_checked: boolean;
  checked_by_id?: string;
  checked_by_name?: string;
  shrinkage_qty: number; // Susut / busuk / rusak (misal 2 kg)
  surplus_qty: number; // Lebih timbang / bonus (misal 0 atau 1 kg)
  net_stocked_qty: number; // Bersih masuk stok (gross - shrinkage + surplus)
  quality_notes?: string; // Catatan sortir (kondisi fisik, kematangan, dll)
  created_at: string;
  created_by: string;
}

export interface CanvasTripItem {
  fruit_name: string;
  unit: string;
  brought_qty: number; // Bawa dari gudang (misal 10 kg)
  selling_price: number; // Harga jual per unit
  sold_qty: number; // Laku terjual (misal 2 kg)
  expected_cash: number; // Uang seharusnya didapat (sold_qty * selling_price)
  returned_qty: number; // Kembali fisik ke gudang (misal 8 kg)
  shrinkage_qty: number; // Susut/rusak di jalan jika ada (misal 0 kg)
}

export interface CanvasTrip {
  id: string; // e.g. CNV-20261004-001
  trip_date: string; // YYYY-MM-DD
  courier_id: string;
  courier_name: string;
  status: 'Sedang Keliling' | 'Selesai & Rekonsiliasi' | 'Dibatalkan';
  items: CanvasTripItem[];
  total_expected_cash: number; // Total omset penjualan yang harus disetor
  actual_cash_submitted: number; // Uang fisik/transfer yang disetor kurir
  cash_difference: number; // Selisih setoran (actual - expected)
  remittance_status?: RemittanceStatus; // 'Belum Disetor (Ada di Kurir)' | 'Sudah Disetor ke Kas'
  remitted_at?: string | null;
  remitted_by_name?: string | null;
  notes?: string;
  departed_at: string;
  returned_at?: string;
  verified_by_name?: string;
  created_at: string;
}

export type MovementType =
  | 'KULAKAN_MASUK' // + stok bersih masuk dari supplier
  | 'SUSUT_SORTIR' // catatan susut/rusak saat sortir
  | 'ORDER_KELUAR' // - stok keluar karena order customer
  | 'CANVAS_BAWA' // - stok gudang dialokasikan dibawa kurir canvas
  | 'CANVAS_RETURN' // + sisa barang canvas kembali masuk ke gudang
  | 'PENYESUAIAN'; // +/- penyesuaian manual opname

export interface StockMovementLog {
  id: string;
  timestamp: string;
  fruit_name: string;
  unit: string;
  type: MovementType;
  qty_change: number; // positif (+) atau negatif (-)
  stock_after: number;
  reference_id?: string;
  reference_note: string;
  operator_name: string;
}

export interface Order {
  id: string;
  order_number: string; // e.g. PB-20261002-001
  prospect_id?: string | null; // linked customer/prospect if registered
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  zone_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  order_items: OrderItem[];
  items_summary: string; // e.g. "Pisang Cavendish 5kg, Sawi 10 ikat"
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: OrderStatus;
  delivery_slot: DeliverySlot;
  delivery_date: string; // YYYY-MM-DD
  courier_id?: string | null; // Assigned courier (can be dedicated courier, or multi-role staff like sales/manager/owner)
  courier_name?: string | null;
  sales_id?: string | null;
  sales_rep?: string | null;
  customer_notes?: string | null;
  delivery_notes?: string | null;
  delivered_at?: string | null;
  proof_photo_url?: string | null; // delivery report photo proof
  courier_remittance_status?: RemittanceStatus; // 'Belum Disetor (Ada di Kurir)' | 'Sudah Disetor ke Kas'
  courier_remitted_at?: string | null;
  courier_remitted_by_name?: string | null;
  stock_deducted?: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  is_courier?: boolean; // Can act as courier (even if role is Sales/Manager/Owner)
  active: boolean;
  created_at: string;
  password?: string; // used for auth verification in mock/local engine
}

export interface Zone {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface ZoneMember {
  id: string;
  zone_id: string;
  user_id: string;
}

export interface BusinessType {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface Prospect {
  id: string;
  business_name: string;
  pic_name: string;
  phone: string;
  business_type_id: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  gps_captured_at: string | null;
  zone_id: string | null;
  sales_id: string | null;
  status: ProspectStatus;
  notes: string | null;
  potential_needs?: string | null; // Potensi kebutuhan tambahan customer (sayur, mie, santan, bumbu, buah dll untuk upselling)
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProspectPhoto {
  id: string;
  prospect_id: string;
  file_url: string;
  created_at: string;
}

export interface DuplicateWarningInfo {
  matchByPhone: boolean;
  matchByName: boolean;
  matchByGps: boolean;
  matchedProspects: {
    id: string;
    business_name: string;
    pic_name: string;
    phone: string;
    sales_name?: string;
  }[];
}
