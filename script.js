(() => {
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];

  const currentHost = location.hostname.replace(/^www\./, '');
  const allowedHosts = ['ahsangresik.me', 'ahsanid.dev'];
  const isPublicDomain = allowedHosts.includes(currentHost);
  const publicHost = isPublicDomain ? currentHost : 'ahsangresik.me';
  const publicOrigin = isPublicDomain ? `${location.protocol}//${location.hostname}` : 'https://ahsangresik.me';

  document.documentElement.dataset.domain = publicHost;

  function setMeta(selector, attr, value) {
    const el = $(selector);
    if (el) el.setAttribute(attr, value);
  }

  function setDynamicDomainMeta() {
    const path = location.pathname.endsWith('/') ? '/' : location.pathname;
    const canonical = `${publicOrigin}${path}`;
    const canonicalEl = $('link[rel="canonical"]');
    if (canonicalEl) canonicalEl.href = canonical;
    setMeta('meta[property="og:url"]', 'content', canonical);
    setMeta('meta[property="og:image"]', 'content', `${publicOrigin}/tes.jpg`);
    setMeta('meta[name="twitter:image"]', 'content', `${publicOrigin}/tes.jpg`);
    $$('.js-domain').forEach((el) => { el.textContent = publicHost; });
    $$('.js-domain-home').forEach((el) => { el.href = publicOrigin; });
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
