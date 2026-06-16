(() => {
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];

  const rawHost = location.hostname.toLowerCase();
  const currentHost = rawHost.replace(/^www\./, '');
  const publicOrigin = currentHost === 'www.ahsangresik.me' ? `${location.protocol}//${location.hostname}` : 'https://ahsangresik.me';
  const pageName = location.pathname.includes('project') ? 'project' : location.pathname.includes('sertifikat') ? 'sertifikat' : 'home';
  const pathMap = { home: '/', project: '/project.html', sertifikat: '/sertifikat.html' };
  const pagePath = pathMap[pageName] || '/';

  const variant = {
    key: 'gresik',
    label: rawHost.startsWith('www.') ? 'www.ahsangresik.me' : 'ahsangresik.me',
    suffix: 'Gresik',
    siteName: 'ahsangresik.me',
    homeTitle: 'Mohammad Ahsan Al Ghoni — Backend, Cloud, dan WhatsApp KFAI',
    projectTitle: 'Project Mohammad Ahsan Al Ghoni — KFAI, Cloud, WhatsApp Bot',
    certTitle: 'Sertifikat Mohammad Ahsan Al Ghoni — Dicoding, IDN, Digitalent',
    desc: 'Halaman karya saya: backend, KFAI, WhatsApp KFAI, Cloud Object, Al-Quran Digital, sertifikat IT, dan project web yang bisa dicoba langsung.',
    hero: 'Saya membangun web, layanan cloud, dan WhatsApp bot yang bisa dipakai langsung.',
    lead: 'Saya pelajar dari Gresik yang suka membangun project nyata: backend, WhatsApp KFAI, cloud object, game realtime, aplikasi edukasi, dan otomasi. Fokus saya sederhana: cepat, rapi, responsif, dan benar-benar bisa dipakai.',
    terminal: '$ curl https://ai.kangwifi.eu.org<br>response: layanan aktif · kfai online'
  };

  document.documentElement.dataset.domain = 'ahsangresik.me';
  document.documentElement.dataset.variant = variant.key;
  document.documentElement.dataset.www = String(rawHost.startsWith('www.'));

  function setMeta(selector, attr, value) { const el = $(selector); if (el) el.setAttribute(attr, value); }
  function pageTitle() { return pageName === 'project' ? variant.projectTitle : pageName === 'sertifikat' ? variant.certTitle : variant.homeTitle; }

  function upsertLink(rel, href, attrs = {}) {
    const selector = attrs.hreflang ? `link[rel="${rel}"][hreflang="${attrs.hreflang}"]` : attrs.id ? `link#${attrs.id}` : `link[rel="${rel}"][data-dynamic="true"]`;
    let el = $(selector);
    if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); el.dataset.dynamic = 'true'; document.head.appendChild(el); }
    el.href = href;
    Object.entries(attrs).forEach(([k, v]) => { if (k !== 'id') el.setAttribute(k, v); else el.id = v; });
    return el;
  }

  function ensureVariantStylesheet() {
    if (!$('link[href="domain-variants.css"], link[href="/domain-variants.css"]')) upsertLink('stylesheet', '/domain-variants.css', { id: 'domain-variant-css' });
  }

  function injectStructuredData(canonical, title) {
    const breadcrumbName = pageName === 'home' ? 'Beranda' : pageName === 'project' ? 'Proyek' : 'Sertifikat';
    const faq = [
      ['Apa isi halaman ini?', 'Halaman ini berisi karya, project, sertifikat, dan catatan teknis yang saya bangun atau pelajari.'],
      ['Apa project utamanya?', 'Fokus project saya ada di backend, KFAI, WhatsApp bot, Cloud Object, Al-Quran Digital, dan beberapa eksperimen web publik.'],
      ['Apakah project bisa dicoba?', 'Sebagian project memiliki link publik sehingga bisa dibuka langsung dari halaman proyek.']
    ];
    const graph = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person',
          '@id': `${publicOrigin}/#person`,
          name: 'Mohammad Ahsan Al Ghoni',
          alternateName: ['Ahsan', 'Ahsan Gresik'],
          url: publicOrigin,
          image: `${publicOrigin}/tes.jpg`,
          jobTitle: 'Backend Developer & Network Engineer',
          address: { '@type': 'PostalAddress', addressLocality: 'Gresik', addressRegion: 'Jawa Timur', addressCountry: 'ID' },
          sameAs: ['https://ahsangresik.me', 'https://alquran.kangwifi.eu.org', 'https://wa.me/6285168601458', 'https://www.instagram.com/ahsanazmibp', 'https://id.linkedin.com/in/mohammad-ah-san-al-ghoni-1b053a29b'],
          knowsAbout: ['Backend', 'KFAI', 'WhatsApp Bot', 'Cloud Computing', 'Networking', 'Linux', 'Cyber Security', 'Internet of Things']
        },
        {
          '@type': 'WebSite',
          '@id': `${publicOrigin}/#website`,
          name: variant.siteName,
          url: publicOrigin,
          inLanguage: 'id-ID',
          about: { '@id': `${publicOrigin}/#person` }
        },
        {
          '@type': pageName === 'home' ? 'ProfilePage' : 'CollectionPage',
          '@id': `${canonical}#webpage`,
          name: title,
          description: variant.desc,
          url: canonical,
          isPartOf: { '@id': `${publicOrigin}/#website` },
          about: { '@id': `${publicOrigin}/#person` },
          inLanguage: 'id-ID'
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${canonical}#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Beranda', item: `${publicOrigin}/` },
            { '@type': 'ListItem', position: 2, name: breadcrumbName, item: canonical }
          ]
        },
        {
          '@type': 'FAQPage',
          '@id': `${canonical}#faq`,
          mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
        }
      ]
    };
    let script = $('#dynamic-schema');
    if (!script) { script = document.createElement('script'); script.id = 'dynamic-schema'; script.type = 'application/ld+json'; document.head.appendChild(script); }
    script.textContent = JSON.stringify(graph);
  }

  function setDynamicDomainMeta() {
    const canonical = `${publicOrigin}${pagePath}`;
    const title = pageTitle();
    document.title = title;
    const canonicalEl = $('link[rel="canonical"]'); if (canonicalEl) canonicalEl.href = canonical;
    upsertLink('alternate', `https://ahsangresik.me${pagePath}`, { hreflang: 'id-ID' });
    upsertLink('alternate', `https://ahsangresik.me${pagePath}`, { hreflang: 'x-default' });
    setMeta('meta[name="description"]', 'content', variant.desc);
    setMeta('meta[name="robots"]', 'content', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    setMeta('meta[property="og:url"]', 'content', canonical);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', variant.desc);
    setMeta('meta[property="og:image"]', 'content', `${publicOrigin}/tes.jpg`);
    setMeta('meta[property="og:site_name"]', 'content', variant.siteName);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', variant.desc);
    setMeta('meta[name="twitter:image"]', 'content', `${publicOrigin}/tes.jpg`);
    $$('.js-domain').forEach((el) => { el.textContent = variant.label; });
    $$('.js-domain-home').forEach((el) => { el.href = publicOrigin; });
    $$('.brand .grad').forEach((el) => { el.textContent = variant.suffix; });
    const heroTitle = $('.hero h1'); if (heroTitle && pageName === 'home') heroTitle.innerHTML = `<span class="grad">${variant.hero}</span>`;
    const lead = $('.hero .lead'); if (lead && pageName === 'home') lead.innerHTML = variant.lead;
    const terminal = $('.terminal'); if (terminal) terminal.innerHTML = variant.terminal;
    injectStructuredData(canonical, title);
  }

  function initSeoMiniLinks() {
    const feature = $('.feature-band .glass');
    if (!feature || $('.seo-mini')) return;
    const box = document.createElement('div');
    box.className = 'seo-mini';
    box.innerHTML = `<a href="project.html">Lihat project<span>karya saya →</span></a><a href="/sitemap.xml">Sitemap<span>SEO map →</span></a>`;
    feature.appendChild(box);
  }

  function initSeoPanel() {
    if ($('.seo-panel')) return;
    const target = $('.hero') || $('.page-hero');
    if (!target) return;
    const panel = document.createElement('section');
    panel.className = 'seo-panel';
    panel.innerHTML = `<div class="containerx seo-panel-inner"><article><span>Fokus</span><b>Backend, cloud, automation</b><p>Saya mengerjakan project yang bisa dicoba langsung, bukan hanya tampilan.</p></article><article><span>Stack</span><b>Go, Node.js, Linux</b><p>Dipakai untuk WhatsApp bot, dashboard, dan layanan web ringan.</p></article><article><span>Catatan</span><b>16 sertifikat IT</b><p>Materi AI, cloud, security, IoT, networking, dan JavaScript saya pakai untuk project.</p></article></div>`;
    target.insertAdjacentElement('afterend', panel);
  }

  function initSpotlight() {
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    $$('.cardx,.project-card,.cert-card,.glass,.hero-card,.seo-panel article').forEach((el) => {
      el.addEventListener('pointermove', (event) => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        el.style.setProperty('--my', `${event.clientY - rect.top}px`);
        el.classList.add('is-lit');
      });
      el.addEventListener('pointerleave', () => el.classList.remove('is-lit'));
    });
  }

  function initMobileNav() { const btn = $('.menu-btn'); const links = $('.nav-links'); if (!btn || !links) return; btn.addEventListener('click', () => { const open = links.classList.toggle('open'); btn.setAttribute('aria-expanded', String(open)); }); links.addEventListener('click', (e) => { if (e.target.closest('a')) { links.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } }); }
  function initReveal() { const items = $$('[data-reveal], .seo-panel article'); if (!items.length) return; const io = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); io.unobserve(entry.target); } }); }, { threshold: 0.12 }); items.forEach((item, index) => { item.style.transitionDelay = `${Math.min(index * 45, 260)}ms`; io.observe(item); }); }
  function initCertFilters() { const buttons = $$('.filter-btn'); const items = $$('.cert-item'); if (!buttons.length || !items.length) return; buttons.forEach((btn) => { btn.addEventListener('click', () => { const filter = btn.dataset.filter || 'all'; buttons.forEach((b) => b.classList.remove('active')); btn.classList.add('active'); items.forEach((item) => { const show = filter === 'all' || item.dataset.category === filter; item.style.display = show ? '' : 'none'; }); }); }); }
  function initCertModal() { const modal = $('#certModal'); const modalImg = $('#certModalImg'); const modalTitle = $('#certModalTitle'); const close = $('#certModalClose'); if (!modal || !modalImg || !modalTitle) return; const open = (card) => { modalImg.src = card.dataset.img || ''; modalImg.alt = card.dataset.title || 'Preview sertifikat'; modalTitle.textContent = card.dataset.title || 'Preview Sertifikat'; modal.classList.add('show'); document.body.style.overflow = 'hidden'; close?.focus(); }; const hide = () => { modal.classList.remove('show'); document.body.style.overflow = ''; modalImg.src = ''; }; $$('.cert-card').forEach((card) => { card.addEventListener('click', () => open(card)); card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); } }); }); close?.addEventListener('click', hide); modal.addEventListener('click', (e) => { if (e.target === modal) hide(); }); document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); }); }

  document.addEventListener('DOMContentLoaded', () => {
    ensureVariantStylesheet();
    setDynamicDomainMeta();
    initSeoMiniLinks();
    initSeoPanel();
    initSpotlight();
    initMobileNav();
    initReveal();
    initCertFilters();
    initCertModal();
  });
})();
