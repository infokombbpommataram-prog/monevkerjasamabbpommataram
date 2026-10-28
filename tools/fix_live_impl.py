"""Bersihkan tanggal implementasi rusak di Sheet live via API.
Hapus semua baris tanggal non-ISO, lalu impor ulang dari import CSV.
Jalankan: python tools/fix_live_impl.py
ponytail: sekali pakai; hapus when live bersih."""
import csv, json, urllib.request

BASE = 'https://script.google.com/macros/s/AKfycbzaC9pXqmaUot3YkyY6802rp9py77CNwuPrHaIVGYMYYlxHhu7SAVYd_RR6decdLg4k/exec'
import re
ISO = re.compile(r'^\d{4}-\d{2}-\d{2}$')

def post(d):
    r = urllib.request.Request(BASE, data=json.dumps(d).encode(), headers={'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(r, timeout=90))

tok = post({'action': 'login', 'username': 'admin', 'password': 'admin123'})['token']
cur = post({'action': 'list_implementasi', 'token': tok})['data']
print('live impl:', len(cur))
rusak = [x for x in cur if not ISO.match(x.get('tanggal') or '')]
print('rusak:', len(rusak))
for x in rusak:
    r = post({'action': 'del_implementasi', 'token': tok, 'id': x['id']})
    assert r.get('ok'), r
print('hapus rusak ok')

baru = [r for r in csv.DictReader(open('import/import_implementasi.csv', encoding='utf-8-sig')) if r['kerjasama_id'] and ISO.match(r['tanggal'])]
print('CSV valid:', len(baru))
masuk = post({'action': 'bulk_import', 'token': tok, 'implementasi': baru})['imported']
print('hasil impor:', masuk)
print('dash:', post({'action': 'dashboard', 'token': tok})['data'])
