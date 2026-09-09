# PRD — NEXUSGAME ID (Marketplace Akun & Jasa Game)

## Problem Statement Asli
"Buatkan saya website untuk saya menjual akun game dan jasa game saya buat seperti Igitem.com"

## Keputusan Pengguna
- Fitur: Katalog produk + tombol Beli Sekarang (tanpa keranjang)
- Pembayaran: Stripe (aktif, mode test) + gateway lokal Indonesia (diminta, menunggu API key user)
- Tanpa login pengguna (guest checkout)
- Desain: tema gelap gaming bold & modern, diserahkan ke AI
- Konten: data contoh (Mobile Legends, PUBG, Genshin, Valorant, Free Fire, Honkai Star Rail)
- Admin dapat mengubah semua info game/jasa via panel admin

## Arsitektur
- Backend: FastAPI (`/app/backend/server.py`), MongoDB (koleksi `products`, `payment_transactions`)
- Frontend: React + Tailwind + framer-motion + Lenis smooth scroll, font Unbounded + Space Mono
- Pembayaran: Stripe via emergentintegrations (Flow B, key test `sk_test_emergent`), mata uang IDR
  - Checkout: `POST /api/payments/checkout` → redirect ke Stripe Checkout
  - Status: `GET /api/payments/status/{session_id}` (polling + fallback cek Stripe langsung)
  - Webhook: `POST /api/webhook/stripe` (idempotent, update stok/sold saat paid)
- Admin: proteksi kunci via header `x-admin-key` (env `ADMIN_KEY`), CRUD produk + reset seed + daftar pesanan

## Persona
- Pembeli: gamer Indonesia yang ingin beli akun / joki / top up dengan cepat & aman
- Pemilik (admin): mengelola katalog & memantau pesanan masuk

## Yang Sudah Diimplementasikan (9 Sep 2026)
- Hero kinetik (reveal baris-per-baris), kartu unggulan parallax 3D tilt, marquee editorial
- Katalog: 12 produk contoh, filter game/kategori, pencarian, sorting
- Modal detail produk + Beli Sekarang → Stripe Checkout (IDR), terverifikasi end-to-end
- Halaman sukses (polling status) & batal pembayaran
- Panel admin `/admin`: tambah/edit/hapus produk, reset data contoh, tabel pesanan
- Footer + tombol WhatsApp CS (nomor placeholder 6281234567890 — MASIH PLACEHOLDER)

## Kredensial
- Admin Key: `NEXUS-ADMIN-8888` (lihat /app/memory/test_credentials.md)
- Stripe test card: 4242 4242 4242 4242

## Backlog Prioritas
- P0: Gateway pembayaran lokal (Midtrans/Xendit — QRIS, VA, e-wallet) — menunggu API key user
- P0: Ganti nomor WhatsApp placeholder dengan nomor asli
- P1: Notifikasi pesanan ke WhatsApp/email pemilik saat pembayaran sukses
- P1: Upload gambar produk dari admin (object storage) alih-alih URL
- P2: Halaman testimoni pembeli, badge "Trusted Seller", statistik real
- P2: Mode gelap/terang toggle, PWA

## Tugas Berikutnya
1. Minta API key Midtrans/Xendit dari user, integrasikan QRIS/VA
2. Konfirmasi nomor WhatsApp asli pemilik
3. Klaim/setup akun Stripe live sebelum deploy produksi (saat ini sandbox test)
