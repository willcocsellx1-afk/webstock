
## 2026-06-10
- Zoom Galeri: ProductModal kini punya lightbox layar penuh (portal ke body) dengan navigasi kiri-kanan (tombol panah, keyboard arrow, swipe di mobile), thumbnail strip, counter, dan tombol tutup.
- Footer: tombol Admin dipindahkan ke area grid footer (di samping tombol Chat WhatsApp CS), sebelumnya tersembunyi di paling bawah.

## 2026-06-10 (batch 2)
- Garansi Custom: field `warranty` per produk, bisa diedit di panel admin, tampil di stat modal produk (default "100%").
- Kirim Info Akun Otomatis: field `delivery_info` per produk (login akun / voucher / link). Di-snapshot ke transaksi saat checkout dan HANYA ditampilkan ke pembeli di halaman sukses setelah pembayaran terkonfirmasi (paid). Mendukung teks multi-baris (tombol Salin) atau link (tombol Buka Link Akun).
- Beli Manual: tombol "Tanya Penjual" di modal produk diubah jadi "Beli Manual" (chat WA dengan pesan beli manual + harga).
- Hero: metrik "Responsif/CS Online" diubah jadi "10.00-22.00 / Jam Operasional".

## 2026-06-10 (batch 3)
- Badge Multiple + Custom: produk kini punya field `badges` (array, maks 3). Admin bisa pilih preset atau ketik badge custom. Ditampilkan bertumpuk di kartu katalog & modal (warna per jenis). `badge` lama tetap didukung sebagai fallback.
- Kondisi Akun: field `condition` per produk (ready/unready/sold + custom via datalist di admin). Tampil sebagai pill di kartu & modal (ready=lime, unready=coral, sold=abu, custom=neon).
- Hapus Stripe: /payments/methods hanya mengembalikan Midtrans; selektor metode & endpoint Stripe dihapus dari UI checkout; teks "& Stripe" dibersihkan dari modal & footer. Endpoint Stripe backend dibiarkan tapi tidak lagi diekspos.
