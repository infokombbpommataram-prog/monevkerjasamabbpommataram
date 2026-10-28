/**
 * MONEV Kerjasama BBPOM Mataram — Backend Apps Script.
 * Sheet DB: Users, Instansi, Kerjasama, RuangLingkup, Dokumen, Implementasi, Sessions.
 * Deploy: Execute as Me, akses Anyone. FE panggil via POST JSON {action,...}.
 * ponytail: diff minimal, tanpa lib luar; upgrade when butuh refresh-token/server-cache.
 */

var SHEETS = ['Users','Instansi','Kerjasama','RuangLingkup','Dokumen','Implementasi','Sessions'];
var HEADERS = {
  Users: ['username','pass_hash','role','instansi_id','nama','aktif'],
  Instansi: ['id','nama','jenis','kontak'],
  Kerjasama: ['id','nomor','judul','jenis','instansi_id','tgl_ttd','tgl_mulai','tgl_selesai','tanpa_batas','pic','file_ttd_id','file_ttd_nama'],
  RuangLingkup: ['id','kerjasama_id','ruang_lingkup','rencana_kegiatan','indikator','target_outcome'],
  Dokumen: ['id','kerjasama_id','kategori','nama_file','drive_id','tanggal'],
  Implementasi: ['id','kerjasama_id','kegiatan','tanggal','lokasi','hasil','evaluasi','realisasi','bukti_id','bukti_nama','dibuat_oleh'],
  Sessions: ['token','username','expired_at']
};
var ROLES = ['admin','ketua','petugas','user'];
var KATS = ['draft','reviu','kajian','renaksi','surat','naskah_ttd','laporan_ttd','dokumentasi','monev'];
var MIME_OK = {'application/pdf':1,'image/jpeg':1,'image/png':1,'image/jpg':1};
var MAX_MB = 10;

function setup() { return setup_(); }
function setup_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  SHEETS.forEach(function (n) {
    var sh = ss.getSheetByName(n) || ss.insertSheet(n);
    if (sh.getLastRow() === 0) { sh.appendRow(HEADERS[n]); return; }
    var cur = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    HEADERS[n].forEach(function (h, i) {
      if (cur.indexOf(h) < 0) sh.getRange(1, cur.length + 1).setValue(h);
    });
  });
  seed_(ss);
  return 'ok';
}

function seed_(ss) {
  var sh = ss.getSheetByName('Users');
  if (sh.getLastRow() > 1) return;
  var rows = [
    ['admin', sha_('admin123'), 'admin', '', 'Administrator', 'YA'],
    ['ketua', sha_('ketua123'), 'ketua', '', 'Ketua Tim Kerja Sama', 'YA'],
    ['petugas', sha_('petugas123'), 'petugas', '', 'Petugas Balai', 'YA'],
    ['uin', sha_('uin123'), 'user', 'INS-001', 'User UIN Mataram', 'YA']
  ];
  rows.forEach(function (r) { sh.appendRow(r); });
  var ins = ss.getSheetByName('Instansi');
  if (ins.getLastRow() === 1) ins.appendRow(['INS-001','Universitas Islam Negeri Mataram','Kampus','']);
}

function sha_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s)
    .map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}
function uid_(p) { return p + '-' + Utilities.getUuid().slice(0, 8).toUpperCase(); }
function sh_(n) { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(n); }
function rows_(n) {
  var sh = sh_(n), last = sh.getLastRow();
  if (last < 2) return [];
  var v = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  var h = HEADERS[n], out = [];
  v.forEach(function (r) {
    var o = {}; h.forEach(function (k, i) { o[k] = r[i] === undefined ? '' : r[i]; });
    out.push(o);
  });
  return out;
}
function findRow_(n, key, val) {
  var sh = sh_(n), last = sh.getLastRow(), col = HEADERS[n].indexOf(key) + 1;
  if (last < 2 || col < 1) return -1;
  var v = sh.getRange(2, col, last - 1, 1).getValues();
  for (var i = 0; i < v.length; i++) if (String(v[i][0]) === String(val)) return i + 2;
  return -1;
}
function saveRow_(n, obj, key) {
  var sh = sh_(n), h = HEADERS[n], r = findRow_(n, key, obj[key]);
  var line = h.map(function (k) { return obj[k] === undefined ? '' : obj[k]; });
  if (r < 0) sh.appendRow(line);
  else sh.getRange(r, 1, 1, h.length).setValues([line]);
}
function delRow_(n, key, val) {
  var r = findRow_(n, key, val);
  if (r > 0) sh_(n).deleteRow(r);
  return r > 0;
}
function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() { return out_({ ok: true, app: 'monev-kerjasama', time: new Date() }); }

function doPost(e) {
  try {
    var b = JSON.parse(e.postData.contents);
    if (b.action === 'login') return login_(b);
    if (b.action === 'setup') return out_({ ok: true, msg: setup_() });
    var me = auth_(b.token);
    if (!me) return out_({ ok: false, error: 'Sesi habis. Login ulang.' });
    switch (b.action) {
      case 'me': return out_({ ok: true, me: pub_(me) });
      case 'logout': delRow_('Sessions', 'token', b.token); return out_({ ok: true });
      case 'dashboard': return out_({ ok: true, data: dash_() });
      case 'list_instansi': return out_({ ok: true, data: rows_('Instansi') });
      case 'list_kerjasama': return out_({ ok: true, data: ksList_(me) });
      case 'list_ruanglingkup': return out_({ ok: true, data: rows_('RuangLingkup').filter(function (x) { return !b.kerjasama_id || x.kerjasama_id === b.kerjasama_id; }) });
      case 'list_dokumen': return out_({ ok: true, data: rows_('Dokumen').filter(function (x) { return !b.kerjasama_id || x.kerjasama_id === b.kerjasama_id; }) });
      case 'list_implementasi': return out_({ ok: true, data: implList_(me, b) });
      case 'list_users': need_(me, ['admin']); return out_({ ok: true, data: rows_('Users').map(pub_) });
      case 'save_instansi': need_(me, ['admin','ketua']); return saveInstansi_(b);
      case 'del_instansi': need_(me, ['admin']); return out_({ ok: delRow_('Instansi','id', b.id) });
      case 'save_kerjasama': need_(me, ['admin','ketua']); return saveKs_(b);
      case 'del_kerjasama': need_(me, ['admin']); return out_({ ok: delRow_('Kerjasama','id', b.id) });
      case 'save_ruanglingkup': need_(me, ['admin','ketua']); return saveRl_(b);
      case 'del_ruanglingkup': need_(me, ['admin']); return out_({ ok: delRow_('RuangLingkup','id', b.id) });
      case 'save_dokumen': need_(me, ['admin','ketua']); return saveDok_(me, b);
      case 'del_dokumen': need_(me, ['admin']); return out_({ ok: delRow_('Dokumen','id', b.id) });
      case 'save_implementasi': return saveImpl_(me, b);
      case 'del_implementasi': return delImpl_(me, b);
      case 'save_user': need_(me, ['admin']); return saveUser_(b);
      case 'del_user': need_(me, ['admin']); return out_({ ok: delRow_('Users','username', b.username) });
      case 'bulk_import': need_(me, ['admin']); return bulk_(b);
      case 'upload': return upload_(me, b);
      case 'download': return download_(me, b);
    }
    return out_({ ok: false, error: 'Aksi tak dikenal.' });
  } catch (err) { return out_({ ok: false, error: String(err).slice(0, 300) }); }
}

function pub_(u) { return { username: u.username, role: u.role, instansi_id: u.instansi_id, nama: u.nama }; }

function login_(b) {
  var r = findRow_('Users', 'username', b.username);
  if (r < 0) return out_({ ok: false, error: 'Username salah.' });
  var h = HEADERS.Users, sh = sh_('Users'), v = sh.getRange(r, 1, 1, h.length).getValues()[0];
  var u = {}; h.forEach(function (k, i) { u[k] = v[i]; });
  if (u.aktif !== 'YA' || u.pass_hash !== sha_(b.password || '')) return out_({ ok: false, error: 'Login gagal.' });
  var t = Utilities.getUuid();
  saveRow_('Sessions', { token: t, username: u.username, expired_at: Date.now() + 12 * 3600 * 1000 }, 'token');
  return out_({ ok: true, token: t, me: pub_(u) });
}
function auth_(t) {
  if (!t) return null;
  var r = findRow_('Sessions', 'token', t);
  if (r < 0) return null;
  var s = sh_('Sessions').getRange(r, 1, 1, 3).getValues()[0];
  if (Number(s[2]) < Date.now()) { sh_('Sessions').deleteRow(r); return null; }
  var ur = findRow_('Users', 'username', s[1]);
  if (ur < 0) return null;
  var h = HEADERS.Users, v = sh_('Users').getRange(ur, 1, 1, h.length).getValues()[0];
  var u = {}; h.forEach(function (k, i) { u[k] = v[i]; });
  return (u.aktif === 'YA') ? u : null;
}
function need_(me, roles) { if (roles.indexOf(me.role) < 0) throw new Error('Akses ditolak untuk role ' + me.role); }

function statusKs_(k) {
  if (k.tanpa_batas === 'YA' || k.tanpa_batas === true) return 'tanpa_batas';
  var s = iso_(k.tgl_selesai);
  if (!s) return 'aktif';
  var d = Math.ceil((new Date(s) - new Date()) / 864e5);
  if (d < 0) return 'kedaluwarsa';
  if (d <= 90) return 'hampir_berakhir';
  return 'aktif';
}
function ksList_(me) {
  var ins = {}; rows_('Instansi').forEach(function (x) { ins[x.id] = x.nama; });
  return rows_('Kerjasama')
    .filter(function (k) { return me.role !== 'user' || k.instansi_id === me.instansi_id; })
    .map(function (k) { k.instansi_nama = ins[k.instansi_id] || k.instansi_id; k.tgl_mulai = iso_(k.tgl_mulai); k.tgl_selesai = iso_(k.tgl_selesai); k.tgl_ttd = iso_(k.tgl_ttd); k.status = statusKs_(k); return k; });
}
function implList_(me, b) {
  var ks = {}; rows_('Kerjasama').forEach(function (x) { ks[x.id] = x; });
  return rows_('Implementasi').filter(function (x) {
    var k = ks[x.kerjasama_id];
    if (!k) return false;
    if (b.kerjasama_id && x.kerjasama_id !== b.kerjasama_id) return false;
    if (me.role !== 'user' || k.instansi_id === me.instansi_id) { x.tanggal = iso_(x.tanggal); return true; }
    return false;
  });
}

function iso_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, 'Asia/Makassar', 'yyyy-MM-dd');
  return String(v || '');
}
function dash_() {
  var ks = rows_('Kerjasama');
  var st = { aktif: 0, hampir_berakhir: 0, kedaluwarsa: 0, tanpa_batas: 0 };
  var perIns = {}, perBulan = {};
  ks.forEach(function (k) {
    var s = statusKs_(k); st[s] = (st[s] || 0) + 1;
    perIns[k.instansi_id] = (perIns[k.instansi_id] || 0) + 1;
  });
  rows_('Implementasi').forEach(function (x) {
    var m = iso_(x.tanggal).slice(0, 7);
    if (m) perBulan[m] = (perBulan[m] || 0) + 1;
  });
  return { total_ks: ks.length, total_instansi: rows_('Instansi').length, total_impl: rows_('Implementasi').length, status: st, per_instansi: perIns, per_bulan: perBulan };
}

function saveInstansi_(b) {
  var o = b.data || {};
  if (!o.nama) throw new Error('Nama instansi wajib.');
  o.id = o.id || uid_('INS');
  saveRow_('Instansi', { id: o.id, nama: o.nama, jenis: o.jenis || '', kontak: o.kontak || '' }, 'id');
  return out_({ ok: true, id: o.id });
}
function saveKs_(b) {
  var o = b.data || {};
  if (!o.nomor || !o.judul || !o.instansi_id) throw new Error('Nomor, judul, instansi wajib.');
  o.id = o.id || uid_('KS');
  saveRow_('Kerjasama', {
    id: o.id, nomor: o.nomor, judul: o.judul, jenis: o.jenis || 'MoU', instansi_id: o.instansi_id,
    tgl_ttd: o.tgl_ttd || '', tgl_mulai: o.tgl_mulai || '', tgl_selesai: o.tgl_selesai || '',
    tanpa_batas: o.tanpa_batas ? 'YA' : '', pic: o.pic || '',
    file_ttd_id: o.file_ttd_id || '', file_ttd_nama: o.file_ttd_nama || ''
  }, 'id');
  return out_({ ok: true, id: o.id });
}
function saveRl_(b) {
  var o = b.data || {};
  if (!o.kerjasama_id || !o.ruang_lingkup) throw new Error('Kerjasama + ruang lingkup wajib.');
  o.id = o.id || uid_('RL');
  saveRow_('RuangLingkup', { id: o.id, kerjasama_id: o.kerjasama_id, ruang_lingkup: o.ruang_lingkup, rencana_kegiatan: o.rencana_kegiatan || '', indikator: o.indikator || '', target_outcome: o.target_outcome || '' }, 'id');
  return out_({ ok: true, id: o.id });
}
function saveDok_(me, b) {
  var o = b.data || {};
  if (!o.kerjasama_id || !o.drive_id) throw new Error('Kerjasama + file wajib.');
  if (KATS.indexOf(o.kategori) < 0) o.kategori = 'monev';
  o.id = o.id || uid_('DK');
  if (me.role === 'user') {
    var k = rows_('Kerjasama').filter(function (x) { return x.id === o.kerjasama_id; })[0];
    if (!k || k.instansi_id !== me.instansi_id) throw new Error('Akses ditolak.');
  }
  saveRow_('Dokumen', { id: o.id, kerjasama_id: o.kerjasama_id, kategori: o.kategori, nama_file: o.nama_file || '', drive_id: o.drive_id, tanggal: o.tanggal || new Date().toISOString().slice(0, 10) }, 'id');
  return out_({ ok: true, id: o.id });
}
function saveImpl_(me, b) {
  var o = b.data || {};
  if (!o.kerjasama_id || !o.kegiatan || !o.tanggal) throw new Error('Kerjasama, kegiatan, tanggal wajib.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o.tanggal)) throw new Error('Tanggal format yyyy-mm-dd.');
  var k = rows_('Kerjasama').filter(function (x) { return x.id === o.kerjasama_id; })[0];
  if (!k) throw new Error('Kerjasama tak ditemukan.');
  if (me.role === 'ketua') throw new Error('Ketua hanya pantau.');
  if (me.role === 'user' && k.instansi_id !== me.instansi_id) throw new Error('Hanya instansi asal.');
  o.id = o.id || uid_('IM');
  saveRow_('Implementasi', { id: o.id, kerjasama_id: o.kerjasama_id, kegiatan: o.kegiatan, tanggal: o.tanggal, lokasi: o.lokasi || '', hasil: o.hasil || '', evaluasi: o.evaluasi || '', realisasi: o.realisasi || '', bukti_id: o.bukti_id || '', bukti_nama: o.bukti_nama || '', dibuat_oleh: me.username }, 'id');
  return out_({ ok: true, id: o.id });
}
function delImpl_(me, b) {
  if (me.role === 'ketua') throw new Error('Ketua hanya pantau.');
  if (me.role === 'user') {
    var ks = {}; rows_('Kerjasama').forEach(function (x) { ks[x.id] = x; });
    var cur = rows_('Implementasi').filter(function (x) { return x.id === b.id; })[0];
    if (!cur || !ks[cur.kerjasama_id] || ks[cur.kerjasama_id].instansi_id !== me.instansi_id) throw new Error('Akses ditolak.');
  }
  return out_({ ok: delRow_('Implementasi', 'id', b.id) });
}
function saveUser_(b) {
  var o = b.data || {};
  if (!o.username || !o.role || ROLES.indexOf(o.role) < 0) throw new Error('Username + role valid wajib.');
  var cur = findRow_('Users', 'username', o.username);
  var old = cur > 0 ? sh_('Users').getRange(cur, 1, 1, 6).getValues()[0] : null;
  saveRow_('Users', {
    username: o.username, pass_hash: o.password ? sha_(o.password) : (old ? old[1] : sha_('123456')),
    role: o.role, instansi_id: o.instansi_id || '', nama: o.nama || '', aktif: o.aktif || 'YA'
  }, 'username');
  return out_({ ok: true });
}

function bulk_(b) {
  var n = { instansi: 0, kerjasama: 0, ruanglingkup: 0, implementasi: 0 };
  (b.instansi || []).forEach(function (x) {
    if (!x.nama || findRow_('Instansi', 'id', x.id) > 0) return;
    saveRow_('Instansi', { id: x.id, nama: x.nama, jenis: x.jenis || '', kontak: '' }, 'id');
    n.instansi++;
  });
  (b.kerjasama || []).forEach(function (x) {
    if (!x.judul || !x.instansi_id || findRow_('Kerjasama', 'id', x.id) > 0) return;
    saveRow_('Kerjasama', { id: x.id, nomor: x.nomor || x.id, judul: x.judul, jenis: x.jenis || 'MoU',
      instansi_id: x.instansi_id, tgl_ttd: x.tgl_ttd || '', tgl_mulai: x.tgl_mulai || '',
      tgl_selesai: x.tgl_selesai || '', tanpa_batas: x.tanpa_batas || '', pic: x.pic || '',
      file_ttd_id: '', file_ttd_nama: '' }, 'id');
    n.kerjasama++;
  });
  (b.ruanglingkup || []).forEach(function (x) {
    if (!x.ruang_lingkup || !x.kerjasama_id || findRow_('RuangLingkup', 'id', x.id) > 0) return;
    saveRow_('RuangLingkup', { id: x.id, kerjasama_id: x.kerjasama_id, ruang_lingkup: x.ruang_lingkup,
      rencana_kegiatan: x.rencana_kegiatan || '', indikator: x.indikator || '', target_outcome: x.target_outcome || '' }, 'id');
    n.ruanglingkup++;
  });
  (b.implementasi || []).forEach(function (x) {
    if (!x.kegiatan || !x.kerjasama_id || findRow_('Implementasi', 'id', x.id) > 0) return;
    saveRow_('Implementasi', { id: x.id, kerjasama_id: x.kerjasama_id, kegiatan: x.kegiatan,
      tanggal: x.tanggal || '', lokasi: x.lokasi || '', hasil: x.hasil || '', evaluasi: x.evaluasi || '', realisasi: x.realisasi || '',
      bukti_id: '', bukti_nama: '', dibuat_oleh: 'impor' }, 'id');
    n.implementasi++;
  });
  return out_({ ok: true, imported: n });
}
function rootFolder_() {
  var p = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID');
  if (!p) throw new Error('Set DRIVE_FOLDER_ID di Project Settings > Script Properties.');
  return DriveApp.getFolderById(p);
}
function upload_(me, b) {
  if (me.role === 'ketua') throw new Error('Ketua hanya pantau.');
  var ext = String(b.nama || '').split('.').pop().toLowerCase();
  var mime = (/^(pdf|jpg|jpeg|png)$/.test(ext) && b.mime) || (ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : '');
  if (!MIME_OK[mime]) throw new Error('Hanya PDF/JPG/PNG.');
  var bytes = Utilities.base64Decode(String(b.base64).split(',').pop());
  if (bytes.length > MAX_MB * 1024 * 1024) throw new Error('Maks 10MB.');
  var blob = Utilities.newBlob(bytes, mime, b.nama);
  var f = rootFolder_().createFile(blob);
  f.setDescription('monev-kerjasama|' + me.username);
  return out_({ ok: true, drive_id: f.getId(), nama: b.nama });
}
function download_(me, b) {
  var f = DriveApp.getFileById(b.drive_id);
  var ks = {};
  rows_('Kerjasama').forEach(function (x) { ks[x.file_ttd_id] = x.instansi_id; });
  rows_('Dokumen').forEach(function (x) { ks[x.drive_id] = x.kerjasama_id; });
  rows_('Implementasi').forEach(function (x) { ks[x.bukti_id] = x.kerjasama_id; });
  return out_({ ok: true, nama: f.getName(), mime: f.getMimeType(), base64: Utilities.base64Encode(f.getBlob().getBytes()) });
}
