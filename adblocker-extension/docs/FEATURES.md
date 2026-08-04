# NovaShield - Daftar Fitur Lengkap

## 🛡️ Network Blocking (Level 1)

### Static Rules (531 aturan, bundled)
| Ruleset | Aturan | Fungsi |
|---|---|---|
| `main_rules.json` | 157 | Ad servers utama (Google, Amazon, Facebook, Yahoo, dll) |
| `tracker_rules.json` | 193 | Tracker & analytics (GA, FB Pixel, Hotjar, Mixpanel, dll) |
| `youtube_rules.json` | 58 | YouTube ad endpoints (doubleclick, pubads, s.youtube.com) |
| `malware_rules.json` | 122 | Malware/phishing (cracks, keygen, scam, miners) |
| `https_upgrade.json` | 1 | HTTP → HTTPS redirect |

### Dynamic Rules (maks. 4500 aturan)
- EasyList di-fetch dari `easylist.to/easylist/easylist.txt`
- Auto-refresh setiap 72 jam via `alarms` API
- Manual refresh via popup atau settings
- Format parse: `||domain^` dan `||domain/path` patterns

### Custom Filter Lists
- Tambah URL EasyList-compatible di Settings → Filter List
- Format yang didukung: Adblock Plus filter syntax
- Contoh: `https://easylist.to/easylist/abpindo.txt` (Indonesia-specific)

---

## 🎬 YouTube Ad Blocker

| Fitur | Cara Kerja |
|---|---|
| Network blocking | 58 aturan DNR block request ke ad endpoints |
| Auto-skip | MutationObserver + 8 selector fallback untuk tombol "Lewati iklan" |
| Speed-up 16x | Override `playbackRate` setter, anti-reset (YouTube tidak bisa reset ke 1x) |
| Force seek | `video.currentTime = duration - 0.05` untuk skip ke akhir iklan |
| Mute | `video.muted = true` selama iklan |
| SponsorBlock | Fetch segments dari `sponsor.ajay.app` (kategori: sponsor, intro, outro, selfpromo, interaction, preview) |
| Cosmetic hide | CSS inject untuk `.ytp-ad-overlay-container`, `.video-ads`, `ytd-ad-slot-renderer`, dll |
| SPA navigation | Listen `yt-navigate-finish` event untuk re-init observer |

---

## 🚫 Anti-Adblock Bypass (MAIN world)

| Teknik | Detail |
|---|---|
| Global spoofing | `window.canRunAds = true`, `window.adblock = false`, `window.adBlockDetected = false`, dll |
| fetch() intercept | Return 200 OK untuk URL yang match ad pattern |
| XHR intercept | Override `XMLHttpRequest.open/send`, fake 200 response untuk ad probes |
| document.write defang | Skip script injection yang mengandung `adsbygoogle`, `googlesyndication`, `doubleclick` |
| Bait element spoof | `getBoundingClientRect()` dan `offsetHeight` return non-zero untuk elemen dengan class "ad-banner", "adsbox", dll |
| Library defuse | `BlockAdBlock`, `adblockDetector`, `bab` di-replace dengan noop function |
| Body lock removal | Periodic cleanup `overflow: hidden`, `position: fixed`, `pointer-events: none` |
| Notification permission | `Notification.permission = "denied"`, `requestPermission()` return denied |

---

## 🔒 Privacy Protection (MAIN world)

| Fitur | Implementasi |
|---|---|
| WebRTC IP leak | Override `RTCPeerConnection.addIceCandidate` dan `onicecandidate` untuk filter `typ host` candidates |
| Canvas fingerprint | `toDataURL`, `toBlob`, `getImageData` di-inject noise 1 pixel |
| Audio fingerprint | `AnalyserNode.getFloatFrequencyData` di-inject noise ±0.001 |
| Hardware spoof | `hardwareConcurrency = 4`, `deviceMemory = 4`, block Battery API |
| Plugins spoof | `navigator.plugins = []`, `navigator.mimeTypes = []` |
| Google ad block | `window.google_ad_block = 0` |

---

## 🍪 Annoyance Blocker

### Cookie Consent Auto-Reject
- Provider yang didukung: OneTrust, Didomi, Quantcast, TrustArc, Cookiebot, Sourcepoint, custom
- Auto-click tombol "Reject All" / "Decline" / "Tolak" / "Hanya perlu"
- 30+ selector + text pattern matching (Indonesia + English)
- Remove body scroll lock setelah banner di-tolak

### Lainnya
- **Notification blocker**: Override `Notification.permission` dan `requestPermission()`
- **Autoplay blocker**: Block `HTMLMediaElement.play()` untuk video muted
- **Exit confirmation**: Block `beforeunload` event listener dan `onbeforeunload` setter
- **Sticky header**: Reset `position: sticky` → `static` (kecuali YouTube, GitHub, Google)
- **Newsletter popup**: Hide element dengan class "newsletter-popup", "exit-intent", "exit-popup"
- **Social widgets** (opsional, OFF by default): FB Like, Twitter embed, IG embed

---

## 🎨 Cosmetic Filtering

### CSS Injection (335 baris)
- Generic selectors: `[id^="ad-"]`, `[class*="adsbygoogle"]`, `[data-ad-slot]`
- Ad sizes: 300x250, 728x90, 160x600, 970x250
- YouTube: `.ytp-ad-overlay-container`, `ytd-ad-slot-renderer`, dll
- Anti-adblock: `[class*="adblock-warning"]`, `.detect-adblock`
- Newsletter popups: `[class*="newsletter-popup"]`, `[class*="exit-intent"]`

### DOM Sweep (periodik)
- Remove empty ad containers: `ins.adsbygoogle:empty`, `div[data-ad-slot]:empty`
- Collapse containers dengan hanya 1 child iframe ad
- MutationObserver untuk react ke DOM changes

---

## 🛠️ UX Features

### Element Zapper
- Klik kanan halaman → "Zap elemen di halaman ini"
- Atau popup → "Zap elemen"
- Cursor berubah jadi crosshair
- Hover → element di-highlight (outline cyan)
- Click → element di-hide permanen
- Selector disimpan per-hostname di `chrome.storage.local`
- ESC untuk batal

### Pause Per-Site
- Klik kanan → "Jeda NovaShield 1 jam" atau "1 hari"
- Atau popup → "Jeda 1 jam"
- Badge berubah jadi ⏸ (oranye)
- Auto-resume setelah duration habis
- Cleanup expired pauses setiap 60 detik

### Whitelist
- Klik kanan → "Toggle NovaShield di situs ini"
- Atau popup → "Whitelist situs ini"
- AllowAllRequests rule (priority 1000) override static rules
- Whitelist disimpan di `chrome.storage.local`

### Backup & Restore
- Settings → Backup → Export → download JSON
- Settings → Backup → Import → upload JSON
- Settings → Backup → Reset to Default

---

## 📊 Statistik

### Counter (akurat!)
- **DNR onRuleMatchedDebug** (Chrome only): real-time saat rule match
- **Content-counter.js fallback** (all browsers): detect failed resource loads via:
  - `error` event pada `<script>`, `<img>`, `<iframe>`, `<link>`, `<video>`, `<audio>`
  - `PerformanceObserver` untuk failed resource entries
  - Bridge event dari MAIN world fetch/XHR intercept
- Debounced flush (200ms) untuk performance
- Per-tab counter reset on navigation
- Total counter persist di storage

### Top 10 Sites
- `statsPerDomain` object di storage
- Cap 500 domain (FIFO cleanup)
- Display dengan bar chart di Settings → Statistik

---

## 🔐 Sistem Aktivasi

### Flow Otomatis (default)
1. `onInstalled` listener → open Google search "mohammad ahsan al ghoni"
2. `content-google-redirect.js` → auto-click hasil organic pertama
3. `content-activation.js` di ahsangresik.me → detect hostname → auto-activate
4. `ACTIVATE` message ke background → set `activated: true`
5. `applyEnabledState()` → enable all 5 DNR rulesets
6. Broadcast `STATE_CHANGED` ke semua tabs
7. Page auto-reload untuk start blocking

### Activation Triggers
| Trigger | Cara |
|---|---|
| Visit ahsangresik.me | Auto-activate (no click) |
| URL hash `#aktifasi` atau `#activate` | Auto-activate |
| Meta tag `<meta name="adbg-activate">` | Auto-activate |
| Button `[data-adbg-activate]` | Auto-click after 1.5s |
| Popup button "Aktivasi Sekarang" | Open ahsangresik.me |
| Context menu "Buka halaman aktivasi" | Open Google search |

### Activation Gate
- Semua DNR rulesets **disabled** jika `activated === false`
- Semua content scripts cek `activated` flag via localStorage (synchronous) + storage (async)
- Badge menampilkan `!` (merah) jika belum aktivasi

---

## 🌐 Cross-Browser Compatibility

| Fitur | Chrome | Firefox |
|---|---|---|
| Manifest V3 | ✅ | ✅ (115+) |
| declarativeNetRequest | ✅ | ✅ |
| onRuleMatchedDebug | ✅ | ❌ (counter pakai content-counter.js) |
| Service Worker | ✅ | ✅ |
| MAIN world content script | ✅ | ✅ (115+) |
| browser_specific_settings | N/A | ✅ (gecko.id) |

---

## 📦 Permissions yang Dipakai

| Permission | Tujuan |
|---|---|
| `declarativeNetRequest` | Block request iklan/tracker/malware |
| `declarativeNetRequestFeedback` | Counter badge (Chrome only) |
| `storage` | Simpan whitelist, settings, activation, stats |
| `tabs` / `activeTab` | Baca URL tab, reload, buka tab baru |
| `scripting` | Inject content script dynamically |
| `alarms` | Refresh EasyList tiap 72 jam |
| `contextMenus` | Menu klik kanan (whitelist/zap/pause) |
| `downloads` | Export settings JSON |
| `webNavigation` | Track navigasi untuk reset counter |
| `<all_urls>` | Host permission untuk semua content script & DNR |
