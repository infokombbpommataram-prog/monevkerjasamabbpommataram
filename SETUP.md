# Deploy Monev Kerja Sama BBPOM Mataram

## 1. Sheet + Drive (akun kantor)

1. Buat Google Sheet baru nama `MONEV_Kerjasama`.
2. Buat folder Drive baru nama `MONEV_Bukti`, catat ID dari URL (`.../folders/ID`).
3. Di Sheet: Extensions > Apps Script. Hapus isi editor, paste seluruh `Code.gs`, Save.
4. Project Settings (ikon gerigi) > Script Properties > Add: `DRIVE_FOLDER_ID` = ID folder tadi.
5. Jalankan sekali fungsi `setup_` via dropdown Run (setuju izin). Cek 7 tab terbentuk.
6. Deploy > New deployment > Web app: Execute as Me, Who has access Anyone. Copy URL `/exec`.

## 2. FE Cloudflare Pages

1. Edit `index.html`: ganti `PASTE_URL_WEBAPP_DISINI` dengan URL Web app.
2. Cloudflare Dashboard > Pages > Create > Upload assets. Upload `index.html` saja.
3. Buka URL Pages. Login akun contoh, ganti password via menu Pengguna.

## 3. Uji peran

- admin: semua menu, tambah user.
- ketua: lihat semua, tambah kerja sama, tanpa hapus implementasi.
- petugas: hanya form implementasi + dokumen.
- user (uin/uin123): hanya data INS-001.

## 4. Reset password

Tombol login arah ke `wa.me/6287871500533` dengan teks username otomatis. Admin reset via menu Pengguna, isi ulang kata sandi.

Batas: file PDF/JPG/PNG maks 10MB. Status H-90 hitung otomatis dari `tgl_selesai`.
