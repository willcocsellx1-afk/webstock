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
- Footer + tombol WhatsApp CS ke nomor asli 6285693161480
- Kunci admin diganti menjadi `Musangpandan`
- Upload foto produk dari komputer via object storage Emergent (maks 5MB, JPG/PNG/WEBP/GIF), gambar disajikan lewat `/api/files/...`, opsi tempel URL tetap ada

## Yang Sudah Diimplementasikan (Sesi 2 — Jun 2026)
- **Midtrans AKTIF (mode PRODUCTION, key asli user, Merchant ID G785573532)** — menggantikan Xendit. `POST /api/payments/midtrans/checkout` → Snap redirect (`app.midtrans.com`), `POST /api/webhook/midtrans` (verifikasi SHA512 signature_key + cek jumlah, idempotent), fallback cek status via `api.midtrans.com/v2/{order}/status` saat polling `/api/payments/status`. Auto-deteksi sandbox jika key berawalan `SB-`. Metode "QRIS / VA / E-Wallet" tampil default di modal, Stripe tetap ada.
  - **PENTING**: set Payment Notification URL di dashboard Midtrans → `https://<domain>/api/webhook/midtrans`
- Testimoni pembeli: koleksi `testimonials`, `GET /api/testimonials`, admin `POST/DELETE /api/admin/testimonials` (nama, game, produk, rating 1-5, ulasan, screenshot chat via upload). Seksi "Bukti Sosial" di beranda (`#testimoni`) + zoom screenshot, link di Navbar/Footer. Tab "Testimoni" di panel admin.
- Kolom "Metode" (provider · payment_type) di tabel pesanan admin. Copy Stripe → Midtrans & Stripe di footer/how-it-works/modal.
- Tambah/hapus produk di admin diverifikasi ulang (testing agent, iteration_1 lulus semua).

## Kredensial
- Admin Key: `Musangpandan` (lihat /app/memory/test_credentials.md)
- Stripe test card: 4242 4242 4242 4242
- Midtrans: PRODUCTION keys di backend/.env (MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY / MIDTRANS_MERCHANT_ID)

## Backlog Prioritas
- P1: Notifikasi pesanan ke WhatsApp/email pemilik saat pembayaran sukses (user pernah skip)
- P1: Edit testimoni (saat ini hanya tambah/hapus)
- P2: Badge "Trusted Seller", statistik real
- P2: Mode gelap/terang toggle, PWA

## Tugas Berikutnya
1. User set Notification URL Midtrans di dashboard → `/api/webhook/midtrans`
2. Klaim/setup akun Stripe live sebelum deploy produksi (saat ini sandbox test)
