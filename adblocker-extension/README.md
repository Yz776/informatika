# Adblock Gresik v2.1 — Pemblokir Iklan (Chrome & Firefox)

> Author: **Ahsan Gresik** — [www.ahsangresik.me](https://www.ahsangresik.me)

Extension MV3 cross-browser dengan **sistem aktivasi**, **YouTube ad blocker advanced**, **SponsorBlock**, **anti-adblock bypass**, **privacy protection**, dan **20+ fitur lainnya**.

---

## Apa yang Baru di v2.1

### Sistem Aktivasi (baru!)
Saat extension baru diinstall:
1. Tab otomatis terbuka ke Google search "mohammad ahsan al ghoni"
2. Content script auto-click hasil pencarian pertama (website ahsangresik.me)
3. Di website, script cari "menu aktivasi" (button/link/text/meta tag)
4. Setelah ditemukan → auto-sync → extension aktif
5. **Extension tidak akan memblokir iklan sebelum diaktivasi**

Cara trigger aktivasi manual:
- Klik kanan halaman → "Buka halaman aktivasi"
- Atau klik banner merah "Belum Aktivasi" di popup
- Atau tambahkan `#aktifasi` / `#activate` di URL ahsangresik.me
- Atau tambahkan meta tag: `<meta name="adbg-activate" content="token-anda">`

### YouTube Ad Blocker (advanced v2.1)
- **MutationObserver** untuk deteksi state iklan (lebih cepat dari setInterval)
- **Auto-skip button** dengan 8 selector fallback
- **Speed-up 16x + mute** dengan override `playbackRate` setter (anti-reset)
- **Force seek to end** untuk video iklan
- **SponsorBlock** integration (skip sponsor segments)
- **CSS injection** untuk hide semua `.ytp-ad-*` overlay
- **58 aturan network blocking** untuk YouTube ad endpoints

### 20+ Fitur Lainnya
- Network blocking: 157 ad + 193 tracker + 58 YouTube + 122 malware = 530+ aturan statis
- EasyList dynamic (maks. 4500 aturan)
- Cosmetic filtering (CSS + DOM sweep)
- Anti-adblock bypass (MAIN world): spoof globals, intercept fetch/XHR, defuse BlockAdBlock
- Cookie consent auto-reject (OneTrust, Didomi, Quantcast)
- Notification & autoplay blocker
- WebRTC IP leak protection + Canvas/Audio fingerprint protection + Hardware spoof
- HTTPS upgrade
- Element zapper (click-to-hide)
- Pause per-site (1 jam / 1 hari)
- Backup/restore settings JSON
- Per-domain blocking stats

---

## Cara Install

### Chrome / Edge / Brave
1. Download & extract `adblock-gresik-v2.1.0.zip`
2. Buka `chrome://extensions` → aktifkan **Developer mode**
3. Klik **Load unpacked** → pilih folder hasil extract
4. Tab otomatis terbuka ke Google search "mohammad ahsan al ghoni"
5. Ikuti flow aktivasi

### Firefox
1. Download `adblock-gresik-v2.1.0.xpi`
2. Buka `about:debugging#/runtime/this-firefox`
3. Klik **Load Temporary Add-on...** → pilih file `.xpi`

---

## Struktur File v2.1

```
adblocker-extension/
├── manifest.json              # MV3 cross-browser (5 rulesets, 8 content scripts)
├── background.js              # Service worker (DNR, activation, badge, message API)
├── activation.html            # Halaman aktivasi manual
├── content.js                 # Cosmetic + DOM sweep (ISOLATED)
├── content-antiadblock.js     # Anti-adblock bypass (MAIN world)
├── content-privacy.js         # WebRTC + Canvas + Audio + Hardware (MAIN world)
├── content-bridge.js          # Bridge MAIN↔ISOLATED + Element zapper
├── content-annoyance.js       # Cookie/Notif/Autoplay/Sticky/Newsletter
├── content-youtube.js         # YouTube ad blocker v2.1 + SponsorBlock
├── content-google-redirect.js # Auto-click hasil Google search pertama
├── content-activation.js      # Cari menu aktivasi + sync token
├── popup/                     # 4 tab UI dark modern
├── options/                   # 9 section settings
├── rules/                     # 531 aturan statis
├── data/                      # cosmetic.css + whitelist.json
├── _locales/id/
└── icons/
```

---

## Permissions

| Permission | Tujuan |
|---|---|
| `declarativeNetRequest` | Memblokir request iklan/tracker/malware |
| `declarativeNetRequestFeedback` | Counter badge (Chrome only) |
| `storage` | Simpan whitelist, settings, activation token |
| `tabs` / `activeTab` | Baca URL tab, reload, buka tab baru |
| `scripting` | Inject content script |
| `alarms` | Refresh EasyList tiap 72 jam |
| `contextMenus` | Menu klik kanan (whitelist/zap/pause/activate) |
| `downloads` | Export settings JSON |
| `webNavigation` | Track navigasi untuk reset counter |
| `<all_urls>` | Host permission |

---

## Privacy

- **TIDAK** mengumpulkan data browsing
- Hanya fetch: `easylist.to` (filter list) + `sponsor.ajay.app` (SponsorBlock)
- Saat install: 1 tab ke Google search "mohammad ahsan al ghoni"
- Setelah aktivasi: 1 tab ke `www.ahsangresik.me`
- Semua data lokal di `chrome.storage.local`

---

## Lisensi

MIT License — bebas digunakan, dimodifikasi, dan didistribusikan.

Author: **Ahsan Gresik** — [www.ahsangresik.me](https://www.ahsangresik.me)
