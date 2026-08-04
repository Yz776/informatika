# SEO Strategy — Multi-Domain Cross-Linking

> **Author:** Mohammad Ahsan Al Ghoni
> **Last Updated:** 2026-08-04
> **Domains:**
> - `ahsangresik.me` (canonical — primary)
> - `erd7.eu.org` (mirror — secondary)
> - `ahsann.is-a.dev` (mirror — tertiary)

---

## 🎯 Strategi Utama

### 1. Canonical Domain Strategy
- **Primary domain:** `ahsangresik.me` (canonical)
- **Mirror domains:** `erd7.eu.org` dan `ahsann.is-a.dev`
- Setiap halaman HTML punya `<link rel="canonical">` ke `ahsangresik.me` untuk:
  - Menghindari duplicate content penalty
  - Mengkonsolidasi SEO ranking ke 1 domain
  - Tetap allow indexing dari 3 domain (lebih banyak entry point)

### 2. Cross-Domain hreflang
Setiap URL di sitemap.xml punya 3 alternate links:
```xml
<xhtml:link rel="alternate" hreflang="id-ID" href="https://ahsangresik.me/" />
<xhtml:link rel="alternate" hreflang="x-default" href="https://ahsangresik.me/" />
<xhtml:link rel="alternate" href="https://erd7.eu.org/" />
<xhtml:link rel="alternate" href="https://ahsann.is-a.dev/" />
```

Ini memberitahu Google bahwa 3 domain adalah versi yang sama, sehingga:
- Backlink dari 3 domain saling membantu
- Tidak ada kompetisi antar domain di SERP
- Domain authority ter-akumulasi

### 3. Sitemap Cross-Reference
File `robots.txt` me-reference sitemap dari 3 domain:
```
Sitemap: https://ahsangresik.me/sitemap.xml
Sitemap: https://erd7.eu.org/sitemap.xml
Sitemap: https://ahsann.is-a.dev/sitemap.xml
Sitemap: https://ahsangresik.me/sitemap-index.xml
```

### 4. Cross-Domain Linking di Footer
Setiap halaman punya link ke 3 domain di footer (file `cross-domain-links.html`):
- Memberi backlink internal antar domain
- User bisa pilih domain yang paling cepat
- Search engine menemukan semua domain

### 5. Structured Data (JSON-LD)
5 schema di `structured-data.html`:
1. **Person** — info Ahsan (name, job, location, skills)
2. **WebSite** — info website dengan search action
3. **Organization** — brand NovaShield
4. **SoftwareApplication** — NovaShield extension
5. **BreadcrumbList** — navigasi

`sameAs` property me-link 3 domain + GitHub untuk entity recognition.

---

## 📁 File Structure

```
informatika/
├── robots.txt                    # Updated: 3 domain sitemap refs
├── sitemap.xml                   # Updated: hreflang cross-domain
├── sitemap-index.xml             # NEW: sitemap index for 3 domains
├── structured-data.html          # NEW: 5 JSON-LD schemas
├── cross-domain-links.html       # NEW: footer component
├── site.webmanifest              # Existing
├── index.html                    # Updated: include structured data + cross links
├── project.html                  # Update needed: same
├── sertifikat.html               # Update needed: same
└── download.html                 # Update needed: same
```

---

## 🚀 Setup Steps (per domain)

### Domain 1: ahsangresik.me (PRIMARY)
1. Deploy repo GitHub Pages atau hosting
2. Submit `https://ahsangresik.me/sitemap.xml` ke Google Search Console
3. Submit ke Bing Webmaster Tools
4. Set preferred domain = `ahsangresik.me`

### Domain 2: erd7.eu.org (MIRROR)
1. Setup DNS A record / CNAME ke server yang sama
2. Atau setup redirect di .htaccess / Cloudflare Workers
3. Submit `https://erd7.eu.org/sitemap.xml` ke Google Search Console
4. Add property di Search Console

### Domain 3: ahsann.is-a.dev (MIRROR)
1. Register di [is-a.dev](https://www.is-a.dev/) (free)
2. Submit PR dengan config pointing ke server
3. Setelah approve, submit sitemap ke Google Search Console

---

## 📊 SEO Boost Estimation

| Metric | Before (1 domain) | After (3 domains) |
|--------|-------------------|-------------------|
| **Indexed pages** | ~5 | ~15 (3x entry points) |
| **Backlinks** | 1 source | 3 sources (cross-link) |
| **Domain Authority** | 1 domain | Consolidated to canonical |
| **Search visibility** | 100% | ~250% (3x discovery) |
| **Redundancy** | Single point of failure | 3 fallback domains |

---

## 🔧 Implementation Checklist

- [x] Update `robots.txt` dengan 3 sitemap references
- [x] Buat `sitemap-index.xml` untuk cross-domain
- [x] Update `sitemap.xml` dengan hreflang cross-domain
- [x] Buat `structured-data.html` (5 JSON-LD schemas)
- [x] Buat `cross-domain-links.html` (footer component)
- [ ] Integrate `structured-data.html` ke `index.html`
- [ ] Integrate `cross-domain-links.html` ke footer semua halaman
- [ ] Update `project.html`, `sertifikat.html`, `download.html` dengan canonical + OG
- [ ] Submit 3 sitemap ke Google Search Console
- [ ] Submit ke Bing Webmaster Tools
- [ ] Setup DNS untuk erd7.eu.org dan ahsann.is-a.dev

---

## 📝 Cara Integrate ke index.html

### 1. Tambah structured data (sebelum `</head>`):
```html
<!-- Include structured data -->
<!-- Paste isi structured-data.html di sini -->
```

### 2. Tambah cross-domain links (sebelum `</footer>`):
```html
<!-- Include cross-domain links -->
<!-- Paste isi cross-domain-links.html di sini -->
```

### 3. Update canonical (sudah ada, verify):
```html
<link rel="canonical" href="https://ahsangresik.me/">
```

### 4. Tambah hreflang (sudah ada, verify):
```html
<link rel="alternate" hreflang="id-ID" href="https://ahsangresik.me/">
<link rel="alternate" hreflang="x-default" href="https://ahsangresik.me/">
```

---

## 🎯 Hasil yang Diharapkan

Setelah 2-4 minggu:
1. **Google indexing**: 3 domain ter-index, canonical ke ahsangresik.me
2. **Search ranking**: Naik karena backlink dari 3 domain
3. **Brand search**: "ahsan gresik", "novashield", "erd7" muncul di SERP
4. **AI search**: ChatGPT, Perplexity, Claude bisa discover website (karena allow AI crawlers)

---

## 🔍 Monitoring

Cek hasil via:
- **Google Search Console**: Performance, Coverage, Sitemaps
- **Bing Webmaster Tools**: SEO reports
- **Google Analytics**: Traffic sources (mana domain paling banyak traffic)
- **Ahrefs / SEMrush**: Backlink profile, domain authority
