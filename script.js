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

  const variants = {
    'ahsangresik.me': {
      key: 'gresik',
      label: isWWW ? 'www.ahsangresik.me' : 'ahsangresik.me',
      suffix: 'Gresik',
      homeTitle: 'Ahsan Gresik — Backend, API, dan WhatsApp KFAI',
      projectTitle: 'Project Ahsan Gresik — API, KFAI, WhatsApp, Cloud',
      certTitle: 'Sertifikat Ahsan Gresik — Dicoding, IDN, Digitalent',
      desc: 'Portfolio pribadi Ahsan dari Gresik: backend, API Kangwifi, KFAI, WhatsApp KFAI, Cloud Object, dan project web publik.',
      hero: 'Saya bikin web, API, dan bot yang bisa dipakai langsung.',
      lead: 'Mohammad Ahsan Al Ghoni, pelajar dari Gresik yang suka membangun sistem nyata: backend, REST API, WhatsApp KFAI, cloud object, game realtime, sampai aplikasi edukasi. Fokus saya sederhana: cepat, rapi, dan benar-benar jalan.',
      terminal: '$ curl https://api.kangwifi.eu.org<br>response: gresik portfolio · api online'
    },
    'ahsanid.dev': {
      key: 'dev',
      label: isWWW ? 'www.ahsanid.dev' : 'ahsanid.dev',
      suffix: 'Dev',
      homeTitle: 'AhsanID Dev — Backend API, KFAI, dan Automation',
      projectTitle: 'AhsanID Dev Projects — API, KFAI, WhatsApp Bot',
      certTitle: 'AhsanID Dev Certificates — Learning & Shipping',
      desc: 'Developer profile AhsanID: backend API, KFAI, WhatsApp automation, Cloud Object, Al-Quran Digital, dan project web publik.',
      hero: 'Backend, API, dan automation yang saya bangun bertahap.',
      lead: 'Saya Ahsan, developer muda yang fokus membangun layanan backend, API publik, WhatsApp automation, dan project web yang benar-benar bisa dicoba. Domain ini saya pakai sebagai profil developer yang lebih teknis.',
      terminal: '$ node services/kfai.js<br>status: dev profile · automation ready'
    }
  };

  const variant = variants[publicHost] || variants['ahsangresik.me'];
  document.documentElement.dataset.domain = publicHost;
  document.documentElement.dataset.variant = variant.key;
  document.documentElement.dataset.www = String(isWWW);

  function setMeta(selector, attr, value) {
    const el = $(selector);
    if (el) el.setAttribute(attr, value);
  }

  function pageTitle() {
    if (pageName === 'project') return variant.projectTitle;
    if (pageName === 'sertifikat') return variant.certTitle;
    return variant.homeTitle;
  }

  function setDynamicDomainMeta() {
    const path = location.pathname.endsWith('/') ? '/' : location.pathname;
    const canonical = `${publicOrigin}${path}`;
    const title = pageTitle();
    document.title = title;

    const canonicalEl = $('link[rel="canonical"]');
    if (canonicalEl) canonicalEl.href = canonical;
    setMeta('meta[name="description"]', 'content', variant.desc);
    setMeta('meta[property="og:url"]', 'content', canonical);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', variant.desc);
    setMeta('meta[property="og:image"]', 'content', `${publicOrigin}/tes.jpg`);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', variant.desc);
    setMeta('meta[name="twitter:image"]', 'content', `${publicOrigin}/tes.jpg`);

    $$('.js-domain').forEach((el) => { el.textContent = variant.label; });
    $$('.js-domain-home').forEach((el) => { el.href = publicOrigin; });
    $$('.brand .grad').forEach((el) => { el.textContent = variant.suffix; });

    const heroTitle = $('.hero h1');
    if (heroTitle && pageName === 'home') heroTitle.innerHTML = `<span class="grad">${variant.hero}</span>`;
    const lead = $('.hero .lead');
    if (lead && pageName === 'home') lead.innerHTML = variant.lead.replace('Mohammad Ahsan Al Ghoni', '<strong>Mohammad Ahsan Al Ghoni</strong>');
    const terminal = $('.terminal');
    if (terminal) terminal.innerHTML = variant.terminal;
  }

  function initMobileNav() {
    const btn = $('.menu-btn');
    const links = $('.nav-links');
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
    const buttons = $$('.filter-btn');
    const items = $$('.cert-item');
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
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(card);
        }
      });
    });
    close?.addEventListener('click', hide);
    modal.addEventListener('click', (e) => { if (e.target === modal) hide(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setDynamicDomainMeta();
    initMobileNav();
    initReveal();
    initCertFilters();
    initCertModal();
  });
})();
