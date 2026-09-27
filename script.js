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
    items.forEach((el) => io.observe(el));
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
    const close = $('#certModalClose');
    if (!modal || !modalImg || !modalTitle) return;
    let lastFocus = null;

    const open = (card) => {
      lastFocus = document.activeElement;
      modalImg.src = card.dataset.img || '';
      modalImg.alt = card.dataset.title || 'Preview sertifikat';
      modalTitle.textContent = card.dataset.title || 'Preview Sertifikat';
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
    close?.addEventListener('click', hide);
    modal.addEventListener('click', (e) => { if (e.target === modal) hide(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
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

  function fillDomainLabels() {
    const host = location.hostname.replace(/^www\./, '');
    $$('.js-domain').forEach((el) => { el.textContent = host || 'ahsangresik.me'; });
  }

  document.addEventListener('DOMContentLoaded', () => {
    fillDomainLabels();
    initMobileNav();
    initNavScroll();
    initReveal();
    initCertFilters();
    initCertModal();
    initSmoothAnchor();
  });
})();
