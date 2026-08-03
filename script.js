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
    suffix: 'ID',
    siteName: 'ahsangresik.me',
    homeTitle: 'Mohammad Ahsan Al Ghoni — Backend Developer & Network Engineer dari Gresik',
    projectTitle: 'Proyek Mohammad Ahsan Al Ghoni — Catur Online, Al-Quran Digital, WotAnime, TTT',
    certTitle: 'Sertifikat Mohammad Ahsan Al Ghoni — Dicoding, IDN, Digitalent',
    desc: 'Portofolio Mohammad Ahsan Al Ghoni: backend, networking, game realtime (Catur Online, TTT), aplikasi edukasi (Al-Quran Digital), platform streaming WotAnime, dan layanan web publik yang bisa dicoba langsung.',
    hero: 'Membangun sistem nyata',
    lead: 'pelajar dari Gresik yang suka membangun sistem fungsional: backend yang stabil, game realtime seperti Catur Online dan TTT, aplikasi edukasi seperti Al-Quran Digital, sampai platform streaming anime. Fokus saya sederhana — cepat, rapi, dan benar-benar bisa dipakai.',
    terminal: '<span class="t-prompt">$</span> <span class="t-cmd">curl -s https://ahsangresik.me</span><br><span class="t-out">→ status: <em>200 OK</em> · uptime: <em>99.9%</em> · region: <em>id-jt</em></span>'
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
      ['Siapa Mohammad Ahsan Al Ghoni?', 'Pelajar dari Gresik yang membangun project nyata seperti Catur Online, Al-Quran Digital, TTT Online, WotAnime, dan YouTube Tanpa Iklan. Fokus di backend, networking, dan layanan web publik.'],
      ['Apa project utamanya?', 'Catur Online (game realtime), Al-Quran Digital (edukasi), TTT Online (multiplayer), WotAnime (streaming anime), dan YouTube Tanpa Iklan.'],
      ['Apakah project bisa dicoba?', 'Sebagian besar project memiliki link publik sehingga bisa dibuka langsung dari halaman proyek. WotAnime juga menyediakan download APK.'],
      ['Di mana Ahsan belajar?', 'Ahsan menyelesaikan 16 sertifikat dari Dicoding, ID-Networkers, dan Digitalent Kominfo mencakup AI, JavaScript, cloud, networking, security, dan IoT.']
    ];
    const graph = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person',
          '@id': `${publicOrigin}/#person`,
          name: 'Mohammad Ahsan Al Ghoni',
          alternateName: ['Ahsan', 'Ahsan Gresik', 'AhsanID'],
          url: publicOrigin,
          image: `${publicOrigin}/tes.jpg`,
          jobTitle: 'Backend Developer & Network Engineer',
          address: { '@type': 'PostalAddress', addressLocality: 'Gresik', addressRegion: 'Jawa Timur', addressCountry: 'ID' },
          sameAs: ['https://ahsangresik.me', 'https://alquran.kangwifi.eu.org', 'https://wa.me/6285168601283', 'https://www.instagram.com/ahsanazmibp', 'https://id.linkedin.com/in/mohammad-ah-san-al-ghoni-1b053a29b', 'https://github.com/Yz776'],
          knowsAbout: ['Backend', 'Network Engineering', 'Cloud Computing', 'WhatsApp Bot', 'Linux', 'Cyber Security', 'Internet of Things', 'Game Development', 'Mikrotik', 'Cisco']
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
          inLanguage: 'id-ID',
          lastReviewed: '2026-08-03'
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
    const heroTitle = $('.hero h1'); if (heroTitle && pageName === 'home') heroTitle.innerHTML = `<span class="grad">${variant.hero}</span> — bukan sekadar tampilan.`;
    const lead = $('.hero .lead'); if (lead && pageName === 'home') lead.innerHTML = `<strong>Mohammad Ahsan Al Ghoni</strong>, ${variant.lead}`;
    const terminal = $('.terminal'); if (terminal) terminal.innerHTML = variant.terminal;
    injectStructuredData(canonical, title);
  }

  function initSpotlight() {
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    $$('.cardx,.project-card,.cert-card,.glass,.hero-card,.tech-cat,.contact-item').forEach((el) => {
      el.addEventListener('pointermove', (event) => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        el.style.setProperty('--my', `${event.clientY - rect.top}px`);
        el.classList.add('is-lit');
      });
      el.addEventListener('pointerleave', () => el.classList.remove('is-lit'));
    });
  }

  function initMobileNav() {
    const btn = $('.menu-btn'); const links = $('.nav-links');
    if (!btn || !links) return;
    btn.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        links.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initNavScroll() {
    const nav = $('.topnav');
    if (!nav) return;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (window.scrollY > 24) nav.classList.add('scrolled');
          else nav.classList.remove('scrolled');
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initReveal() {
    const items = $$('[data-reveal]');
    if (!items.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 45, 260)}ms`;
      io.observe(item);
    });
  }

  function initCertFilters() {
    const buttons = $$('.filter-btn'); const items = $$('.cert-item');
    if (!buttons.length || !items.length) return;
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter || 'all';
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        items.forEach((item) => {
          const show = filter === 'all' || item.dataset.category === filter;
          item.style.display = show ? '' : 'none';
        });
      });
    });
  }

  function initCertModal() {
    const modal = $('#certModal');
    const modalImg = $('#certModalImg');
    const modalTitle = $('#certModalTitle');
    const close = $('#certModalClose');
    if (!modal || !modalImg || !modalTitle) return;
    const open = (card) => {
      modalImg.src = card.dataset.img || '';
      modalImg.alt = card.dataset.title || 'Preview sertifikat';
      modalTitle.textContent = card.dataset.title || 'Preview Sertifikat';
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
      close?.focus();
    };
    const hide = () => {
      modal.classList.remove('show');
      document.body.style.overflow = '';
      modalImg.src = '';
    };
    $$('.cert-card').forEach((card) => {
      card.addEventListener('click', () => open(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); }
      });
    });
    close?.addEventListener('click', hide);
    modal.addEventListener('click', (e) => { if (e.target === modal) hide(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  }

  function initBackTop() {
    const btn = $('#backTop');
    if (!btn) return;
    const toggle = () => {
      if (window.scrollY > 600) btn.classList.add('show');
      else btn.classList.remove('show');
    };
    window.addEventListener('scroll', toggle, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    toggle();
  }

  function initReadProgress() {
    const bar = $('#readProgress');
    if (!bar) return;
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = h > 0 ? (window.scrollY / h) * 100 : 0;
      bar.style.width = `${Math.min(pct, 100)}%`;
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  function initSmoothAnchor() {
    // Smooth scroll untuk anchor link di halaman yang sama (fallback bila CSS smooth dinonaktifkan)
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
        // Tutup menu mobile kalau terbuka
        const navLinks = $('.nav-links');
        const menuBtn = $('.menu-btn');
        if (navLinks && navLinks.classList.contains('open')) {
          navLinks.classList.remove('open');
          menuBtn?.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureVariantStylesheet();
    setDynamicDomainMeta();
    initSpotlight();
    initMobileNav();
    initNavScroll();
    initReveal();
    initCertFilters();
    initCertModal();
    initBackTop();
    initReadProgress();
    initSmoothAnchor();
  });
})();
