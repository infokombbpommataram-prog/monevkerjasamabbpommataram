"""Scan folder existing/KERJA SAMA -> CSV siap impor ke sheet MONEV.
Keluar: import_instansi.csv, import_kerjasama.csv, import_ruanglingkup.csv,
        import_implementasi.csv, import_filemap.csv
Logika tanggal: tebak dari KETERANGAN + nama file (tgl TTD, masa berlaku N tahun).
ponytail: stdlib saja; upgrade when format Excel berubah."""
import csv, os, re, glob
import openpyxl

BASE = r'D:\Antigravity\Monev Kerjasama\existing\KERJA SAMA'
OUT = r'D:\Antigravity\Monev Kerjasama\import'
os.makedirs(OUT, exist_ok=True)

BULAN = {'januari':'01','jan':'01','februari':'02','feb':'02','maret':'03','mar':'03',
 'april':'04','apr':'04','mei':'05','juni':'06','jun':'06','juli':'07','jul':'07',
 'agustus':'08','agu':'08','agt':'08','september':'09','sep':'09','sept':'09',
 'oktober':'10','okt':'10','november':'11','nov':'11','desember':'12','des':'12'}

def semua_tgl(s):
    if not s: return []
    s = str(s).lower()
    out = []
    for m in re.finditer(r'(\d{1,2})\s+([a-z]+)\s+(\d{4})', s):
        if m.group(2) in BULAN:
            out.append('%s-%s-%02d' % (m.group(3), BULAN[m.group(2)], int(m.group(1))))
    return out

def parse_tgl(s):
    t = semua_tgl(s)
    return t[0] if t else ''

def masa_tahun(s):
    """'masa berlaku 5 tahun' / 'berlaku 3 (tiga) tahun' -> 5 / 3."""
    if not s: return 0
    m = re.search(r'berlaku\s+(?:\d+\s*\([^)]*\)\s*|(\d+)\s*)?tahun', str(s).lower())
    if m: return int(m.group(1)) if m.group(1) else 3
    m = re.search(r'(\d+)\s*tahun', str(s).lower())
    return int(m.group(1)) if m else 0

def tambah_tahun(tgl, n):
    y, m, d = map(int, tgl.split('-'))
    return '%04d-%02d-%02d' % (y + n, m, d)

def bersih(s):
    return re.sub(r'\s+', ' ', str(s or '')).strip()

# --- 1. Daftar Kerjasama (induk + ruang lingkup anak) ---
daftar = sorted(glob.glob(BASE + r'\Monev 2025\Daftar Kerjasama*.xlsx'))
instansi, kerjasama, rl = {}, [], []
kid = [0]
def get_ins(nama):
    nama = bersih(nama)
    if nama.lower().startswith('target ') or not nama: return None
    if nama not in instansi:
        instansi[nama] = 'INS-%03d' % (len(instansi) + 1)
    return instansi[nama]

cur_ks = None
for f in daftar:
    wb = openpyxl.load_workbook(f, data_only=True)
    for sn in wb.sheetnames:
        ws = wb[sn]
        for r in ws.iter_rows(min_row=4, values_only=True):
            if not r or len(r) < 8: continue
            no, mitra, tentang = bersih(r[0]), bersih(r[1]), bersih(r[2])
            ruang, rencana, indik, target, ket = (bersih(r[i]) for i in (3, 4, 5, 6, 7))
            if no and mitra and not mitra.lower().startswith('target'):
                kid[0] += 1
                iid = get_ins(mitra)
                ttd = parse_tgl(ket)
                tanpa = 'tanpa batas' in ket.lower()
                thn = masa_tahun(ket)
                tg = semua_tgl(ket)
                if len(tg) >= 2:
                    mulai, selesai = tg[0], tg[1]
                elif ttd and thn:
                    mulai, selesai = ttd, tambah_tahun(ttd, thn)
                else:
                    mulai, selesai = ttd, ''
                cur_ks = {'id': 'KS-%03d' % kid[0], 'nomor': 'KS-%03d' % kid[0],
                          'judul': tentang, 'jenis': 'MoU', 'instansi_id': iid,
                          'tgl_ttd': ttd, 'tgl_mulai': mulai, 'tgl_selesai': selesai,
                          'tanpa_batas': 'YA' if tanpa else '', 'pic': '', 'sumber': sn}
                kerjasama.append(cur_ks)
            if cur_ks and ruang:
                rl.append({'id': '', 'kerjasama_id': cur_ks['id'],
                           'ruang_lingkup': ruang, 'rencana_kegiatan': rencana,
                           'indikator': indik, 'target_outcome': target,
                           'kunci': (cur_ks['instansi_id'], cur_ks['judul'][:40])})

# --- 1b. Gabung duplikat (2026 menang), id ulang ---
best = {}
for k in kerjasama:
    key = (k['instansi_id'], k['judul'][:40])
    if key not in best or k['sumber'] == 'KS Mataram 2026':
        best[key] = k
kerjasama = list(best.values())
for i, k in enumerate(kerjasama, 1):
    k['id'] = 'KS-%03d' % i
    k['nomor'] = k['id']
peta = {key: k['id'] for key, k in best.items()}
rl2 = []
for i, r in enumerate(rl, 1):
    nid = peta.get(r.pop('kunci'))
    if not nid: continue
    r['id'] = 'RL-%04d' % i
    r['kerjasama_id'] = nid
    rl2.append(r)
rl = rl2

# --- 2. Capaian Outcome TW (jadi implementasi) ---
impl = []
for f in sorted(glob.glob(BASE + r'\Monev 2025\Matriks Monev*.xlsx')):
    tw = re.search(r'tw(\d)', f.lower())
    tri = tw.group(1) if tw else '4'
    try: wb = openpyxl.load_workbook(f, data_only=True)
    except Exception: continue
    for sn in wb.sheetnames:
        if 'outcome' not in sn.lower(): continue
        ws = wb[sn]
        for r in ws.iter_rows(min_row=6, values_only=True):
            if not r or len(r) < 9: continue
            mitra, judul, keg = bersih(r[1]), bersih(r[2]), bersih(r[4])
            target, real = bersih(r[6]), bersih(r[7])
            if not keg or keg.lower().startswith('kegiatan'): continue
            ks = next((k for k in kerjasama if bersih(judul)[:20] and k['judul'][:20] == bersih(judul)[:20]), None)
            kunci = (ks['id'] if ks else '', keg[:60])
            if any(x.get('kunci') == kunci for x in impl): continue
            impl.append({'id': 'IM-%04d' % (len(impl) + 1),
                         'kerjasama_id': ks['id'] if ks else '',
                         'kegiatan': '%s [TW%s]' % (keg, tri),
                         'tanggal': '2025-%02d-01' % (int(tri) * 3),
                         'lokasi': '', 'hasil': 'Mitra: %s' % mitra,
                         'realisasi': real, 'mitra_teks': mitra, 'kunci': kunci})

# --- 3. Peta file naskah TTD (pdf/docx terbesar per folder mitra) ---
fmap = []
for root, dirs, files in os.walk(BASE):
    rel = os.path.relpath(root, BASE)
    cands = [f for f in files if f.lower().endswith(('.pdf', '.docx', '.doc'))
             and not f.startswith('~$') and not f.lower().endswith('.tmp')]
    ttd = [f for f in cands if re.search(r'ttd|materai|final|bersih', f.lower())]
    pool = ttd or cands
    if pool and os.sep in rel:
        pool.sort(key=lambda x: os.path.getsize(os.path.join(root, x)), reverse=True)
        fmap.append({'folder': rel, 'file_ttd': pool[0],
                     'jml_file': len(cands),
                     'lainnya': '; '.join(pool[1:4])})

def tulis(nama, rows, cols):
    with open(os.path.join(OUT, nama), 'w', newline='', encoding='utf-8-sig') as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction='ignore')
        w.writeheader(); w.writerows(rows)

tulis('import_instansi.csv', [{'id': v, 'nama': k} for k, v in instansi.items()], ['id', 'nama'])
tulis('import_kerjasama.csv', kerjasama, ['id', 'nomor', 'judul', 'jenis', 'instansi_id', 'tgl_ttd', 'tgl_mulai', 'tgl_selesai', 'tanpa_batas', 'pic', 'sumber'])
tulis('import_ruanglingkup.csv', rl, ['id', 'kerjasama_id', 'ruang_lingkup', 'rencana_kegiatan', 'indikator', 'target_outcome'])
tulis('import_implementasi.csv', [{k: v for k, v in r.items() if k != 'kunci'} for r in impl], ['id', 'kerjasama_id', 'kegiatan', 'tanggal', 'lokasi', 'hasil', 'realisasi', 'mitra_teks'])
tulis('import_filemap.csv', fmap, ['folder', 'file_ttd', 'jml_file', 'lainnya'])

print('instansi:', len(instansi), '| kerjasama:', len(kerjasama), '| ruanglingkup:', len(rl),
      '| implementasi:', len(impl), '| folder:', len(fmap))
print('tanpa tanggal:', sum(1 for k in kerjasama if not k['tgl_ttd']), '| tanpa batas:', sum(1 for k in kerjasama if k['tanpa_batas']))
