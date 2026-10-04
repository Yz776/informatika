/* AhsanID — interaksi inti: nav, reveal, filter sertifikat, modal. */
(() => {
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];

  function initMobileNav() {
    const btn = $('.menu-btn');
    const links = $('.nav-links');
    if (!btn || !links) return;
    btn.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        links.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initNavScroll() {
    const nav = $('.topnav');
    if (!nav) return;
    const update = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function initReveal() {
    const items = $$('[data-reveal]');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    items.forEach((el, i) => {
      // stagger halus antar-elemen yang masuk viewport bersamaan
      el.style.transitionDelay = `${Math.min(i * 40, 240)}ms`;
      io.observe(el);
    });
  }

  function initCertFilters() {
    const buttons = $$('.filter-btn');
    const items = $$('.cert-item');
    if (!buttons.length || !items.length) return;
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter || 'all';
        buttons.forEach((b) => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });
        items.forEach((item) => {
          item.hidden = filter !== 'all' && item.dataset.category !== filter;
        });
      });
    });
  }

  function initCertModal() {
    const modal = $('#certModal');
    const modalImg = $('#certModalImg');
    const modalTitle = $('#certModalTitle');
    const modalCount = $('#certModalCount');
    const prevBtn = $('#certModalPrev');
    const nextBtn = $('#certModalNext');
    const close = $('#certModalClose');
    if (!modal || !modalImg || !modalTitle) return;
    let lastFocus = null;
    let cards = [];
    let idx = 0;

    const visibleCards = () => $$('.cert-item:not([hidden]) .cert-card');

    const show = (i) => {
      cards = visibleCards();
      if (!cards.length) return;
      idx = (i + cards.length) % cards.length;
      const card = cards[idx];
      modalImg.src = card.dataset.img || '';
      modalImg.alt = card.dataset.title || 'Preview sertifikat';
      modalTitle.textContent = card.dataset.title || 'Preview Sertifikat';
      if (modalCount) modalCount.textContent = `${idx + 1} / ${cards.length}`;
    };

    const open = (card) => {
      lastFocus = document.activeElement;
      cards = visibleCards();
      show(Math.max(0, cards.indexOf(card)));
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      close?.focus();
    };
    const hide = () => {
      if (!modal.classList.contains('is-open')) return;
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      modalImg.src = '';
      lastFocus?.focus();
    };

    $$('.cert-card').forEach((card) => {
      card.addEventListener('click', () => open(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); }
      });
    });
    prevBtn?.addEventListener('click', () => show(idx - 1));
    nextBtn?.addEventListener('click', () => show(idx + 1));
    close?.addEventListener('click', hide);
    modal.addEventListener('click', (e) => { if (e.target === modal) hide(); });
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') hide();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  function initSmoothAnchor() {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 76;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /* Identitas per-host: setiap domain mirror (ahsangresik.me, erd7.eu.org,
     ahsann.is-a.dev) berkanonis mandiri supaya tidak dinilai duplikat konten.
     Catatan: rewrite ini berjalan saat render (JS). Untuk sinyal tanpa JS
     (sitemap, robots), tiap host memakai berkas dari branch deploy masing-
     masing, atau sitemap XML diambil oleh crawler tanpa eksekusi JS. */
  function applyHostIdentity() {
    const origin = location.origin;
    const self = `${origin}${location.pathname}`;
    const set = (sel, attr, val) => {
      const el = document.querySelector(sel);
      if (el) el.setAttribute(attr, val);
    };
    set('link[rel="canonical"]', 'href', self);
    set('meta[property="og:url"]', 'content', self);
    $$('link[rel="alternate"][hreflang]').forEach((l) => { l.href = self; });
    $$('script[type="application/ld+json"]').forEach((sc) => {
      sc.textContent = sc.textContent.split('https://ahsangresik.me').join(origin);
    });
  }

  function fillDomainLabels() {
    const host = location.hostname.replace(/^www\./, '');
    $$('.js-domain').forEach((el) => { el.textContent = host || 'ahsangresik.me'; });
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyHostIdentity();
    fillDomainLabels();
    initMobileNav();
    initNavScroll();
    initReveal();
    initCertFilters();
    initCertModal();
    initSmoothAnchor();
  });
})();
