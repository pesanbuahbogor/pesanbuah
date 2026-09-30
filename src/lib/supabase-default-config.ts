/**
 * KONFIGURASI DEFAULT SUPABASE PERMANEN (GLOBAL UNTUK SEMUA USER & DEVICE)
 *
 * Mengapa file ini ada?
 * Sebelumnya, koneksi hanya tersimpan di localStorage browser individual.
 * Akibatnya, setiap ganti browser, ganti HP, laptop, atau saat Sales/Manager lain membuka link,
 * mereka diminta mengisi URL & Anon Key lagi.
 *
 * Dengan file ini, kredensial dimasukkan secara global (atau dibaca dari VITE_SUPABASE_* di Vercel).
 * Seluruh user (Owner, Manager, Sales) di perangkat manapun langsung terhubung otomatis
 * tanpa perlu setting apapun!
 */

export const DEFAULT_SUPABASE_CONFIG = {
  // Ganti atau masukkan URL Supabase Anda di sini jika tidak menggunakan .env Vercel:
  url: '',
  // Ganti atau masukkan Anon Key Supabase Anda di sini jika tidak menggunakan .env Vercel:
  anonKey: '',
};
