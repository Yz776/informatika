# FAQ - NovaShield

## Umum

### Apa itu NovaShield?
NovaShield adalah extension browser (Chrome & Firefox) yang berfungsi sebagai pemblokir iklan modern. Extension ini memblokir iklan, tracker, pop-up, malware, dan menyediakan berbagai fitur privacy protection.

### Apakah NovaShield gratis?
Ya, 100% gratis dan open source (MIT License). Tidak ada premium version, tidak ada iklan, tidak ada tracking.

### Apakah NovaShield mengumpulkan data saya?
**TIDAK.** NovaShield tidak mengumpulkan data browsing apapun. Semua data (whitelist, settings, statistik) disimpan lokal di browser Anda. Extension hanya fetch data dari:
- `easylist.to` (untuk download filter list)
- `sponsor.ajay.app` (untuk SponsorBlock API)

### Kenapa harus aktivasi?
Sistem aktivasi ada untuk:
1. Memastikan user benar-benar mengunjungi website resmi (ahsangresik.me)
2. Mencegah distribusi tidak resmi yang mungkin dimodifikasi jadi malware
3. Sebagai mekanisme "check-in" user ke author

### Apakah aktivasi butuh internet?
Ya, karena extension harus fetch halaman ahsangresik.me. Setelah aktivasi, extension bekerja offline (kecuali refresh EasyList tiap 72 jam).

---

## YouTube

### Kenapa iklan YouTube masih muncul sebentar?
YouTube menyajikan iklan dari domain yang sama dengan video (googlevideo.com), jadi network blocking saja tidak cukup. NovaShield pakai 4 strategi:
1. Network blocking (58 aturan)
2. Auto-click tombol "Lewati iklan" (cek setiap 100ms)
3. Speed-up video 16x + mute
4. SponsorBlock untuk skip segmen sponsor

Kombinasi ini bikin iklan YouTube selesai dalam 1-3 detik. Tidak ada extension MV3 yang bisa 100% block YouTube ads tanpa iklan muncul sebentar.

### SponsorBlock data kok tidak ada untuk video tertentu?
SponsorBlock adalah database komunitas. Jika video belum di-segment oleh kontributor, tidak ada data. Anda bisa kontribusi di [sponsor.ajay.app](https://sponsor.ajay.app).

### Bisa matikan SponsorBlock?
Ya, popup → tab "YouTube" → toggle "SponsorBlock" OFF.

---

## Counter & Statistik

### Kenapa counter masih 0?
Kemungkinan penyebab:
1. **Extension belum aktivasi** → badge `!` merah. Klik tombol "Aktivasi Sekarang" di popup.
2. **Firefox** → `onRuleMatchedDebug` tidak tersedia, pakai content-counter.js fallback. Pastikan halaman yang dibuka punya iklan dari domain yang diblok.
3. **Situs tidak punya iklan** → coba buka situs berita (detik.com, kompas.com) yang pasti ada iklan.
4. **EasyList belum ter-fetch** → popup → "Update Filter".

### Kenapa counter di Firefox berbeda dengan Chrome?
Chrome pakai `onRuleMatchedDebug` (real-time, akurat). Firefox pakai content-counter.js yang detect failed resource loads. Bisa missed beberapa kasus tapi tetap akurat untuk mayoritas iklan.

### Statistik per-domain kok hilang setelah restart?
Tidak hilang, tersimpan di `chrome.storage.local`. Cek Settings → Statistik → "Top 10 Situs".

---

## Privacy

### Apakah WebRTC protection break video call?
Bisa, jika situs video call butuh akses IP lokal via WebRTC. Matikan "WebRTC IP Leak Protect" di popup → Privacy. Untuk Google Meet, Zoom web, Discord web — seharusnya tetap berfungsi karena mereka pakai TURN relay.

### Apakah Canvas protection break gambar?
Tidak. Noise yang di-inject sangat kecil (1 pixel, opacity 0.01), tidak terlihat mata. Hanya affect fingerprinting canvas yang dipakai tracker.

### Hardware spoof apa aman?
Ya. `hardwareConcurrency = 4` dan `deviceMemory = 4` hanya spoof nilai yang dilaporkan ke JavaScript. Browser tetap pakai resource asli. Battery API di-block total karena hanya dipakai tracking.

---

## Kompatibilitas

### Browser apa saja yang didukung?
- Chrome 88+ (MV3)
- Edge 88+ (MV3)
- Brave (MV3)
- Firefox 115+ (MV3)
- Opera (MV3)
- Vivaldi (MV3)

Tidak didukung:
- Safari (pakai extension API berbeda)
- Internet Explorer
- Browser lama (< 88)

### Apakah NovaShield konflik dengan extension lain?
Konflik potensial dengan extension adblocker lain (uBlock Origin, AdBlock Plus, AdGuard). Disarankan uninstall dulu sebelum pakai NovaShield.

Extension privacy lain (Privacy Badger, Ghostery) bisa共存, tapi mungkin redundan.

### Apakah NovaShield bisa dipakai di mobile?
- **Chrome Android**: Tidak, Chrome mobile tidak dukung extension.
- **Firefox Android**: Ya, install via `about:addons` → "Browse all addons" → search "NovaShield" (jika sudah di-submit ke AMO).
- **Kiwi Browser** (Android, Chromium-based): Ya, install dari Chrome Web Store.

---

## Troubleshooting

### Extension tidak bisa di-load di Chrome
Pastikan:
1. Developer mode aktif di `chrome://extensions`
2. Folder yang dipilih berisi `manifest.json` di root
3. Tidak ada error syntax di manifest (cek dengan `npx web-ext lint`)

### Popup tidak muncul
1. Klik ikon NovaShield di toolbar
2. Jika tidak ada, klik puzzle piece → pin NovaShield
3. Restart browser

### Situs error setelah install
Kemungkinan situs tersebut butuh iklan untuk berfungsi (jarang). Solusi:
1. Popup → "Whitelist situs ini"
2. Atau "Jeda 1 jam" untuk pause temporary
3. Atau matikan toggle "Cosmetic Filter" / "Anti-Adblock Bypass" untuk situs itu

### Badge tidak update
1. Refresh halaman (F5)
2. Klik ikon NovaShield → lihat popup
3. Restart browser

### Aktivasi gagal terus
1. Pastikan internet stabil
2. Buka langsung `https://www.ahsangresik.me#aktifasi`
3. Atau klik kanan halaman → "Buka halaman aktivasi"
4. Cek console (F12) untuk error

---

## Pengembangan

### Bisa kontribusi?
Ya! Repo: [github.com/Yz776/informatika](https://github.com/Yz776/informatika) → folder `adblocker-extension/`

### Bisa request fitur?
Kirim email ke kontak@ahsangresik.me atau buka issue di GitHub.

### Bisa modify dan redistribute?
Ya, lisensi MIT. Tapi harap jaga attribution ke author asli.

---

## Lain-lain

### Berapa ukuran extension?
Hanya ~67 KB (zip). Sangat ringan, tidak signifikan memory usage.

### Apakah ada versi Chrome Web Store?
Belum. Saat ini hanya distribusi via download langsung dari ahsangresik.me. Rencana submit ke Chrome Web Store dan Firefox AMO di masa depan.

### Bagaimana cara cek versi terbaru?
Cek [github.com/Yz776/informatika/releases](https://github.com/Yz776/informatika/releases) atau [ahsangresik.me/download](https://www.ahsangresik.me/download.html).

### Extension butuh update manual?
Untuk sekarang ya. Setelah submit ke Chrome Web Store / AMO, akan auto-update.
