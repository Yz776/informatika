# Panduan Install NovaShield

> Browser yang didukung: Chrome 88+, Edge 88+, Brave, Firefox 115+

## Quick Install (3 menit)

### Langkah 1: Download

Pilih browser Anda:
- **Chrome/Edge/Brave**: Download file `.zip` (67 KB)
- **Firefox**: Download file `.xpi` (67 KB)

### Langkah 2: Pasang Extension

#### Chrome / Edge / Brave
1. Extract file `.zip` ke folder mana saja (mis. `Documents/novashield/`)
2. Buka `chrome://extensions` di address bar
3. Aktifkan **Developer mode** (toggle kanan atas)
4. Klik tombol **Load unpacked** (kiri atas)
5. Pilih folder hasil extract (yang berisi `manifest.json`)
6. ✅ Extension muncul di toolbar dengan ikon shield ungu-cyan

#### Firefox
1. Buka `about:debugging#/runtime/this-firefox`
2. Klik **Load Temporary Add-on...**
3. Pilih file `.xpi` yang sudah didownload
4. ✅ Extension muncul di toolbar

> **Catatan Firefox**: Untuk penggunaan permanen, extension harus di-submit dan di-sign oleh Mozilla AMO. Versi temporary aktif sampai Firefox ditutup.

### Langkah 3: Aktivasi (otomatis!)

Setelah extension terpasang, **tab Google otomatis terbuka** dengan pencarian "mohammad ahsan al ghoni".

1. Extension akan **auto-click** hasil pencarian pertama
2. Halaman `ahsangresik.me` terbuka
3. NovaShield **otomatis aktif** saat halaman terbuka (tidak perlu klik apapun!)
4. Badge berubah dari `!` (merah) → angka blokiran (cyan)
5. ✅ Selesai! Iklan mulai diblokir

### Alternatif Aktivasi Manual

Jika flow otomatis tidak jalan:

**Opsi A — Dari popup:**
1. Klik ikon NovaShield di toolbar
2. Klik tombol **"Aktivasi Sekarang"** (gradient ungu-cyan)
3. Tab ahsangresik.me terbuka → auto-aktivasi

**Opsi B — URL hash:**
1. Buka `https://www.ahsangresik.me#aktifasi`
2. NovaShield auto-aktivasi saat halaman load

**Opsi C — Klik kanan:**
1. Klik kanan di halaman web mana saja
2. Pilih **"Buka halaman aktivasi"** (jika tersedia)

## Verifikasi

Setelah aktivasi, cek bahwa NovaShield bekerja:

1. **Badge**: Angka cyan di ikon toolbar menunjukkan jumlah iklan diblokir
2. **Popup**: Klik ikon → lihat statistik real-time
3. **Test YouTube**: Buka video YouTube → iklan selesai dalam 1-3 detik
4. **Test ad site**: Buka situs berita → banner iklan hilang

## Update Extension

### Update manual
1. Download versi baru
2. Extract / replace folder lama
3. Di `chrome://extensions` → klik tombol **Reload** di kartu NovaShield

### Auto-update filter list
- EasyList di-refresh otomatis setiap **72 jam**
- Manual: Popup → "Update Filter" atau Settings → Filter List → "Update Sekarang"

## Uninstall

### Chrome
- `chrome://extensions` → klik **Remove** di kartu NovaShield

### Firefox
- `about:addons` → klik **Remove** di kartu NovaShield

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Tab Google tidak terbuka otomatis | Buka `https://www.google.com/search?q=mohammad+ahsan+al+ghoni` manual |
| Aktivasi gagal | Buka `https://www.ahsangresik.me#aktifasi` langsung |
| Badge masih `!` merah | Klik kanan halaman → "Buka halaman aktivasi" |
| Iklan masih muncul | Pastikan toggle "Aktifkan NovaShield" ON di popup |
| Iklan YouTube masih muncul lama | Aktifkan semua 4 toggle YouTube (Blocking, Auto-Skip, Speed-up, SponsorBlock) |
| Situs error | Whitelist situs tersebut via popup atau pause 1 jam |
| Counter masih 0 | Buka popup → "Update Filter" untuk re-fetch EasyList |

## Butuh bantuan?

- 📧 Email: kontak@ahsangresik.me
- 🌐 Website: [ahsangresik.me](https://www.ahsangresik.me)
- 🐙 GitHub: [Yz776/informatika](https://github.com/Yz776/informatika)
