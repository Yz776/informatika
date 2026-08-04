# Changelog NovaShield

## v3.0.0 (2026-08-04)

### 🎨 Rebranding
- **BREAKING**: Ganti nama dari "Adblock Gresik" → **"NovaShield"**
- Logo baru: huruf "N" geometric di shield dengan gradient ungu-cyan
- Ikon baru di semua ukuran (16, 32, 48, 64, 128 px + varian disabled)

### ✨ Sistem Aktivasi Simplified
- **Auto-aktivasi saat visit ahsangresik.me** (tidak perlu klik tombol!)
- 1-click activate button di popup → langsung buka ahsangresik.me
- Multi-trigger: hostname match, URL hash `#aktifasi`, meta tag, button click
- Auto-reload page setelah aktivasi sukses

### 📊 Counter Akurat (fix "0 terus")
- Tambah `content-counter.js` untuk fallback counting
- Detect failed resource loads via:
  - `error` event pada script/img/iframe/link/video/audio
  - `PerformanceObserver` untuk failed resource entries
  - Bridge event dari MAIN world fetch/XHR intercept
- Works di Firefox (sebelumnya counter tidak berfungsi)
- Debounced flush (200ms) untuk performance

### 📚 Dokumentasi Lengkap
- Tambah folder `docs/` dengan:
  - `INSTALL.md` — panduan install step-by-step
  - `FEATURES.md` — daftar fitur lengkap
  - `FAQ.md` — pertanyaan umum
  - `CHANGELOG.md` — riwayat versi
- Landing page `download.html` di repo

### 🛠️ Improvement Lainnya
- Background.js: handle `INCREMENT_TAB_COUNT` message dari content-counter
- Background.js: simplify context menu (remove duplicate "reactivate")
- Popup: redesign activation banner dengan 1-click button
- Popup: pakai ikon PNG dari extension (bukan SVG inline)
- Content scripts: rename semua `__adbg_` → `__novashield_`

---

## v2.1.0 (2026-08-04)

### ✨ Sistem Aktivasi
- Install flow: Google search "mohammad ahsan al ghoni" → auto-click first result
- content-google-redirect.js: auto-click hasil pencarian Google pertama
- content-activation.js: cari menu aktivasi di halaman tujuan
- Activation gate: DNR rulesets disabled sampai `activated: true`

### 🎬 YouTube Ad Blocker Advanced
- MutationObserver untuk deteksi ad-state (lebih cepat dari setInterval)
- 8 selector fallback untuk tombol skip
- Override `playbackRate` setter (anti-reset)
- Force seek to end untuk video iklan

### 📦 Push ke GitHub
- Extension di-push ke repo `Yz776/informatika`
- Website index.html diupdate dengan section aktivasi

---

## v2.0.0 (2026-08-03)

### 🎬 YouTube Ad Blocker
- Auto-skip iklan
- Speed-up 16x + mute
- SponsorBlock integration
- 61 aturan network blocking YouTube

### 🔒 Privacy Protection
- WebRTC IP leak protection
- Canvas fingerprint protection
- Audio fingerprint protection
- Hardware spoof (CPU, RAM, Battery API)

### 🍪 Annoyance Blocker
- Cookie consent auto-reject
- Notification blocker
- Autoplay blocker
- Exit confirmation blocker
- Sticky header blocker
- Newsletter popup blocker
- Social widgets blocker (opsional)

### 🛠️ Fitur UX
- Element zapper (click-to-hide)
- Pause per-site (1 jam / 1 hari)
- Backup/restore settings JSON
- Per-domain blocking stats
- Top 10 situs dengan blokiran terbanyak

### 🔐 Security
- 130+ malware/phishing domain blocklist
- HTTPS upgrade (auto redirect HTTP → HTTPS)

---

## v1.0.0 (2026-08-03)

### 🎉 Initial Release
- Cross-browser MV3 (Chrome + Firefox)
- Network blocking via declarativeNetRequest
- Static rules: 188 ad + 201 tracker = 389 aturan
- EasyList dynamic (maks. 4500 aturan)
- Cosmetic filtering (CSS + DOM sweep)
- Anti-adblock bypass (MAIN world)
- Popup dark modern UI (Bahasa Indonesia)
- Halaman pengaturan dengan sidebar
- Whitelist situs
- Install redirect ke ahsangresik.me
- Context menu (whitelist, zap, pause)
- Badge counter per-tab
