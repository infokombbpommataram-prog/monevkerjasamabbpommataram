# DESIGN.md — Monev Kerja Sama BBPOM Mataram (GovTech Enterprise)

Identitas: Portal Dinas Resmi Berstandar GovTech / Enterprise Modern.
Karakter: Bersih, Rapi, Terstruktur, Kontras Tinggi, dan Berfokus Penuh pada Produktivitas Data Operasional.

---

## 1. Filosofi & Dial

- **ENERGY**: 2 (Tenang, bersih, latar slate terang `#f8fafc` dengan kartu putih murni `#ffffff`).
- **RHYTHM**: 4 (Grid teratur, hierarki sidebar vertikal 260px, topbar 64px, jarak padding konsisten 16px/24px/28px).
- **MOTION**: 1 (Transisi fungsional halus 0.18s ease pada hover tombol, modal transform Y 16px).

---

## 2. Identitas Visual & Palet Warna

- **Logo Resmi**:
  - `BPOM_Outline Putih.png` (tersemat mandiri dalam format Base64 data URI).
  - Ditampilkan di Sidebar header dan Login card dengan badge berwibawa.
- **Nama Portal**: **Monev Kerja Sama** &bull; Balai Besar POM di Mataram.
- **Latar Aplikasi (`--bg-app`)**: `#f8fafc` (Slate-50 cerah, ramah mata).
- **Latar Kartu (`--bg-card`)**: `#ffffff` (Putih solid dengan border `#e2e8f0` dan bayangan lembut).
- **Sidebar (`--bg-sidebar`)**: `#0f172a` (Slate-900 / Navy gelap otoritas kedinasan).
- **Warna Tinta / Tipografi**:
  - Tinta Utama: `#0f172a` (Slate-900 / kontras tinggi).
  - Tinta Sekunder: `#475569` (Slate-600).
  - Tinta Muted / Label: `#64748b` (Slate-500).
- **Aksen Kedinasan & Status**:
  - Hijau BPOM Sehat (`--brand-emerald`): `#059669` (hover `#047857`, bg `#ecfdf5`).
  - Navy Otoritas (`--brand-navy`): `#0f2a43` / `#1e3a5f`.
  - H-90 Peringatan / Kritis (`--warn-amber`): `#d97706` (bg `#fffbeb`, border `#fde68a`).
  - Kedaluwarsa (`--danger-rose`): `#dc2626` (bg `#fef2f2`, border `#fecaca`).
  - Tanpa Batas / Mitra (`--info-blue`): `#0284c7` (bg `#f0f9ff`, border `#bae6fd`).

---

## 3. Komponen Antarmuka Utama

1. **Sidebar Kiri Responsif (260px)**:
   - Header: Lambang resmi BPOM Outline Putih + Judul "Monev Kerja Sama".
   - **Menu Utama**: Dashboard, MoU & PKS, Implementasi, Instansi Mitra, Dokumen Bukti.
   - **Menu Administrasi**: Pengguna dan Impor CSV Massal. **KHUSUS ROLE ADMIN** (otomatis disembunyikan secara ketat untuk peran `ketua`, `petugas`, dan `user`).
   - Footer: Kartu akun pengguna dengan avatar inisial, nama lengkap, role badge, dan tombol logout.
2. **Dashboard & Grafik Tren Realisasi**:
   - Grafik distribusi per instansi dihapus sesuai instruksi untuk fokus pada capaian kinerja.
   - **Tren Implementasi Kegiatan per Bulan**: Menggunakan kartu tunggal luas (*prominent card*) yang dilengkapi **Year Selector** dinamis (contoh: Tahun 2026, 2025, 2024).
   - Menampilkan sebaran 12 bulan (Jan - Des) untuk tahun yang dipilih dengan garis halus, kurva bezier, titik data, dan total kegiatan tahunan.
3. **Enterprise Action Icon Pack**:
   - Tombol-tombol tabel lama diganti dengan **Icon Pack SVG** modern yang seragam:
     - **Ubah / Edit**: Icon pensil slate (`.btn-edit`)
     - **WA PIC**: Icon resmi WhatsApp hijau emerald (`.btn-wa`)
     - **Unduh**: Icon panah tray unduhan biru info (`.btn-dl`)
     - **Hapus**: Icon tempat sampah merah bahaya (`.btn-del`) dengan konfirmasi proteksi data.
4. **Formulir Input (Modal Card Dialog)**:
   - Form input MoU/PKS, Implementasi, Instansi, Dokumen, dan Pengguna ditempatkan dalam **Modal Dialog Card**.
   - Layar tabel tetap 100% fokus menampilkan baris data.
5. **Toast Notification**:
   - Notifikasi mengambang gelap elegan di pojok kanan bawah, menggantikan `alert()` browser.
