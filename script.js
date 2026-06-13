(() => {
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];

  const rawHost = location.hostname.toLowerCase();
  const currentHost = rawHost.replace(/^www\./, '');
  const isWWW = rawHost.startsWith('www.');
  const allowedHosts = ['ahsangresik.me', 'ahsanid.dev'];
  const isPublicDomain = allowedHosts.includes(currentHost);
  const publicHost = isPublicDomain ? currentHost : 'ahsangresik.me';
  const publicOrigin = isPublicDomain ? `${location.protocol}//${location.hostname}` : 'https://ahsangresik.me';
  const pageName = location.pathname.includes('project') ? 'project' : location.pathname.includes('sertifikat') ? 'sertifikat' : 'home';
  const pathMap = { home: '/', project: '/project.html', sertifikat: '/sertifikat.html' };
  const pagePath = pathMap[pageName] || '/';

  const variants = {
    'ahsangresik.me': {
      key: 'gresik', label: isWWW ? 'www.ahsangresik.me' : 'ahsangresik.me', suffix: 'Gresik', sibling: 'https://ahsanid.dev', siblingLabel: 'AhsanID Dev', siteName: 'Ahsan Gresik Portfolio',
      homeTitle: 'Ahsan Gresik — Portfolio Backend, API, WhatsApp KFAI', projectTitle: 'Project Ahsan Gresik — API Kangwifi, KFAI, WhatsApp Bot', certTitle: 'Sertifikat Ahsan Gresik — Dicoding, IDN, Digitalent Kominfo',
      desc: 'Portfolio utama Mohammad Ahsan Al Ghoni dari Gresik: backend, API Kangwifi, KFAI, WhatsApp KFAI, Cloud Object, Al-Quran Digital, sertifikat IT, dan karya web publik.',
      hero: 'Portfolio utama dari Gresik: web, API, dan WhatsApp KFAI.',
      lead: 'Mohammad Ahsan Al Ghoni, pelajar dari Gresik yang membangun project nyata: backend, REST API, WhatsApp KFAI, cloud object, game realtime, aplikasi edukasi, dan otomasi. Fokus saya: cepat, rapi, responsif, dan benar-benar bisa dipakai.',
      terminal: '$ curl https://api.kangwifi.eu.org<br>response: gresik portfolio · api online', bridge: 'Lihat versi developer'
    },
    'ahsanid.dev': {
      key: 'dev', label: isWWW ? 'www.ahsanid.dev' : 'ahsanid.dev', suffix: 'Dev', sibling: 'https://ahsangresik.me', siblingLabel: 'Ahsan Gresik', siteName: 'AhsanID Developer Profile',
      homeTitle: 'AhsanID Dev — Backend API, Automation, KFAI Developer Profile', projectTitle: 'AhsanID Dev Projects — Backend API, KFAI, WhatsApp Automation', certTitle: 'AhsanID Dev Certificates — AI, Cloud, Security, IoT',
      desc: 'Profil developer AhsanID untuk backend API, automation, KFAI, WhatsApp bot, cloud object, Al-Quran Digital, IoT, security, dan eksperimen web publik.',
      hero: 'Developer profile: backend API, automation, dan layanan KFAI.',
      lead: 'Saya Ahsan, developer muda yang fokus membangun backend API, WhatsApp automation, layanan KFAI, cloud object, dan project web yang bisa dicoba langsung. Domain ini dibuat lebih teknis untuk profil developer dan eksperimen produk.',
      terminal: '$ node services/kfai.js<br>status: dev profile · automation ready', bridge: 'Buka portfolio utama'
    }
  };

  const variant = variants[publicHost] || variants['ahsangresik.me'];
  const siblingUrl = `${variant.sibling}${pagePath}`;
  document.documentElement.dataset.domain = publicHost;
  document.documentElement.dataset.variant = variant.key;
  document.documentElement.dataset.www = String(isWWW);

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
    const graph = {'@context':'https://schema.org','@graph':[
      {'@type':'Person','@id':`${publicOrigin}/#person`,name:'Mohammad Ahsan Al Ghoni',alternateName:['Ahsan Gresik','AhsanID'],url:publicOrigin,image:`${publicOrigin}/tes.jpg`,jobTitle:'Backend Developer & Network Engineer',address:{'@type':'PostalAddress',addressLocality:'Gresik',addressRegion:'Jawa Timur',addressCountry:'ID'},sameAs:['https://ahsangresik.me','https://ahsanid.dev','https://api.kangwifi.eu.org','https://alquran.kangwifi.eu.org','https://wa.me/6285168601458','https://www.instagram.com/ahsanazmibp','https://id.linkedin.com/in/mohammad-ah-san-al-ghoni-1b053a29b'],knowsAbout:['Backend','REST API','KFAI','WhatsApp Bot','Cloud Computing','Networking','Linux','Cyber Security','Internet of Things']},
      {'@type':'WebSite','@id':`${publicOrigin}/#website`,name:variant.siteName,url:publicOrigin,inLanguage:'id-ID',about:{'@id':`${publicOrigin}/#person`},sameAs:[variant.sibling]},
      {'@type':pageName==='home'?'ProfilePage':'CollectionPage','@id':`${canonical}#webpage`,name:title,description:variant.desc,url:canonical,isPartOf:{'@id':`${publicOrigin}/#website`},about:{'@id':`${publicOrigin}/#person`},inLanguage:'id-ID',relatedLink:siblingUrl}
    ]};
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
    upsertLink('alternate', `https://ahsanid.dev${pagePath}`, { hreflang: 'x-default' });
    setMeta('meta[name="description"]', 'content', variant.desc);
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
    const lead = $('.hero .lead'); if (lead && pageName === 'home') lead.innerHTML = variant.lead.replace('Mohammad Ahsan Al Ghoni', '<strong>Mohammad Ahsan Al Ghoni</strong>');
    const terminal = $('.terminal'); if (terminal) terminal.innerHTML = variant.terminal;
    injectStructuredData(canonical, title);
  }

  function initDomainBridge() {
    if ($('.domain-bridge')) return;
    const bridge = document.createElement('nav');
    bridge.className = 'domain-bridge';
    bridge.setAttribute('aria-label', 'Pilih versi domain portfolio');
    bridge.innerHTML = `<small>Domain</small><a class="active" href="${publicOrigin}${pagePath}" aria-current="page">${variant.label}</a><a href="${siblingUrl}" rel="noopener">${variant.bridge}</a>`;
    document.body.appendChild(bridge);
    const footerSocial = $('.footer .social');
    if (footerSocial && !$('.footer-domain-link')) { const a = document.createElement('a'); a.className = 'footer-domain-link'; a.href = siblingUrl; a.textContent = variant.siblingLabel; footerSocial.prepend(a); }
  }

  function initSeoMiniLinks() {
    const feature = $('.feature-band .glass');
    if (!feature || $('.seo-mini')) return;
    const box = document.createElement('div');
    box.className = 'seo-mini';
    box.innerHTML = `<a href="${siblingUrl}">${variant.siblingLabel}<span>domain lain →</span></a><a href="/sitemap.xml">Sitemap<span>SEO map →</span></a>`;
    feature.appendChild(box);
  }

  function initMobileNav() { const btn = $('.menu-btn'); const links = $('.nav-links'); if (!btn || !links) return; btn.addEventListener('click', () => { const open = links.classList.toggle('open'); btn.setAttribute('aria-expanded', String(open)); }); links.addEventListener('click', (e) => { if (e.target.closest('a')) { links.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } }); }
  function initReveal() { const items = $$('[data-reveal]'); if (!items.length) return; const io = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); io.unobserve(entry.target); } }); }, { threshold: 0.12 }); items.forEach((item, index) => { item.style.transitionDelay = `${Math.min(index * 45, 260)}ms`; io.observe(item); }); }
  function initCertFilters() { const buttons = $$('.filter-btn'); const items = $$('.cert-item'); if (!buttons.length || !items.length) return; buttons.forEach((btn) => { btn.addEventListener('click', () => { const filter = btn.dataset.filter || 'all'; buttons.forEach((b) => b.classList.remove('active')); btn.classList.add('active'); items.forEach((item) => { const show = filter === 'all' || item.dataset.category === filter; item.style.display = show ? '' : 'none'; }); }); }); }
  function initCertModal() { const modal = $('#certModal'); const modalImg = $('#certModalImg'); const modalTitle = $('#certModalTitle'); const close = $('#certModalClose'); if (!modal || !modalImg || !modalTitle) return; const open = (card) => { modalImg.src = card.dataset.img || ''; modalImg.alt = card.dataset.title || 'Preview sertifikat'; modalTitle.textContent = card.dataset.title || 'Preview Sertifikat'; modal.classList.add('show'); document.body.style.overflow = 'hidden'; close?.focus(); }; const hide = () => { modal.classList.remove('show'); document.body.style.overflow = ''; modalImg.src = ''; }; $$('.cert-card').forEach((card) => { card.addEventListener('click', () => open(card)); card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); } }); }); close?.addEventListener('click', hide); modal.addEventListener('click', (e) => { if (e.target === modal) hide(); }); document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); }); }

  document.addEventListener('DOMContentLoaded', () => {
    ensureVariantStylesheet();
    setDynamicDomainMeta();
    initDomainBridge();
    initSeoMiniLinks();
    initMobileNav();
    initReveal();
    initCertFilters();
    initCertModal();
  });
})();
