/**
 * KONFIGURASI DEFAULT SUPABASE PERMANEN (GLOBAL UNTUK SEMUA USER & DEVICE)
 *
 * Kredensial ini ditanam secara global ke dalam aplikasi.
 * Setiap kali aplikasi dibuka oleh user (Sales, Manager, Owner) di browser atau device manapun,
 * aplikasi langsung otomatis terhubung ke Supabase PesanBuah.id tanpa perlu menyetel apa pun!
 */

export const DEFAULT_SUPABASE_CONFIG = {
  url: 'https://eacrmfgwltgwcrvfonuv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhY3JtZmd3bHRnd2NydmZvbnV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MjE5MDMsImV4cCI6MjEwNjI5NzkwM30.JR0HsdA6L95tywL97Fem38npsfOwhiUy9cAhoOA3cxM',
};
