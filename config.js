/**
 * PENGATURAN APLIKASI PEMILIHAN PRATAMA PRAMUKA
 * - MODE: "tiruan" (atau "demo") untuk pengujian mandiri tanpa koneksi luar, atau "asli" untuk Supabase.
 * - PIN_ADMIN: PIN / Kata Sandi pengaman akses panel panitia (bawaan: 123456).
 * - SUPABASE_URL & SUPABASE_KEY: isi hanya kunci publik (anon / publishable).
 */
window.CONFIG = {
  SUPABASE_URL: "https://uisftrwpoecvvtmatvzm.supabase.co",
  SUPABASE_KEY: "sb_publishable_1zRcA9kP705HePPfPg2xnQ_YNSpoZG8",
  MODE: "tiruan", // "tiruan" (atau "demo") | "asli"
  PIN_ADMIN: "123456", // PIN pengaman panel panitia
  NAMA_ACARA: "Pemilihan Pratama Pramuka",
  NAMA_GUDEP: "Gugus Depan SMP Negeri 1 Bojongsari",
  ALAMAT_WEB: typeof window !== 'undefined' ? window.location.origin : ""
};
