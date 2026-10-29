# DESIGN.md — Monev Kerja Sama BBPOM Mataram (GovTech Enterprise)

Identitas: Portal Dinas Resmi Berstandar GovTech / Enterprise Modern.
Karakter: Bersih, Rapi, Terstruktur, Kontras Tinggi, dan Berfokus Penuh pada Produktivitas Data Operasional.

---

## 1. Filosofi & Dial

- **ENERGY**: 2 (Tenang, bersih, latar slate terang `#f8fafc` dengan kartu putih murni `#ffffff`).
- **RHYTHM**: 4 (Grid teratur, hierarki sidebar vertikal 260px, topbar 64px, jarak padding konsisten 16px/24px/28px).
- **MOTION**: 1 (Transisi fungsional halus 0.18s ease pada hover tombol, drawer/modal transform Y 16px, tanpa gerak mengambang yang berlebihan).

---

## 2. Palet Warna & Semantic Tokens

- **Latar Aplikasi (`--bg-app`)**: `#f8fafc` (Slate-50 cerah, ramah mata untuk kerja berjam-jam).
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
   - Header: Lambang POM dengan gradasi emerald + nama instansi.
   - Menu dikelompokkan menjadi **Menu Utama** dan **Administrasi** (hanya terlihat oleh role `admin`).
   - Indikator menu aktif dengan pill emerald dan ikon SVG inline.
   - Footer: Kartu akun pengguna dengan inisial avatar, nama lengkap, role badge, dan tombol logout.
   - Responsif: Berubah menjadi drawer geser dengan tombol hamburger di layar tablet/mobile (< 960px).
2. **Topbar Bersih (64px)**:
   - Breadcrumb penunjuk halaman aktif (*Portal Monev &rsaquo; Halaman*).
   - Indikator koneksi server real-time (*Google Apps Script Live*).
3. **Kartu Metrik KPI (Enterprise Boxes)**:
   - Kotak putih dengan sudut 14px, angka tebal 28px, dan ikon SVG dengan latar belakang warna pastel.
4. **Formulir Input (Modal Card Dialog)**:
   - Form input MoU/PKS, Implementasi, Instansi, Dokumen, dan Pengguna ditempatkan dalam **Modal Dialog Card** yang rapi.
   - Layar tabel tetap 100% fokus menampilkan baris data.
5. **Tabel Data Enterprise**:
   - Header slate-50 dengan label semi-bold uppercase 11.5px.
   - Bilah pencarian instan dan tombol filter status pill di bagian atas tabel.
   - Tombol **WA PIC** langsung membuka obrolan WhatsApp dengan nomor kontak PIC dan pesan otomatis.
6. **Toast Notification**:
   - Notifikasi mengambang gelap elegan di pojok kanan bawah, menggantikan `alert()` browser.
