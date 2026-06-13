(() => {
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];
  const cert15Image = 'data:image/webp;base64,UklGRlgEAABXRUJQVlA4IEwEAADQFwCdASp4AFQAPtFcp06oJSOiKrEMAQAaCUWmJTWN04AgHBAuWkMTxXGBOU/IB6ottJz//n3en/6O+pC/5HJj2Zf4iRSblyxFQpb+NJsA9pH9a3enr2zPcdz0oY0kK5Q92lIZC+3MgwJ+zuNG3rgTtG44ASB9XRwIe53s1wmD9W1yONyL1g2rQpfCJC/dMigESbHhb9tAwhY6LkYchIHsquCNH701evMrJdYxzM7pwoFj18nrYPTV24keMjarMD/ESloqWogAAP7QIsZMgn/IcTeXvs17fF2T1Nw4ytRdKI84gDn+CtASV3us874w5Se/Wu7uQVlh/vxT/ejKMDVtSEtfzSLZa9GHzVom6+k9kEdt0aM4aVhuw0KbQpC6zLcU6HlbqBfBDbMkCeVsU7+Dec6f+RC2WW4zDZQahehdF5jwwjwrR7XY62ZiqE7cBeMjKNSrXIbIdCoDxv7A5FKYo8sDj7SbEqW05TzJoDBJDdnClqdSgqW8ytPv1KLn8xh55cq34sWMTVBjVmOIqE9PUcjpXfJVrK0UDCSYvhAQxNhShYDKFnyOEcQDVvjqaqjPVaIi86Gm//TIoigubOT2JTNbzScyv2Mmu2X8Qi1X/GctQhXTTYeQDXcrjrvUUGVaAci1ew0+0ctRcRRvZ6Q/CsAzwCENz34OqSQlN5cPFLFtiZuBP2n/94f7kz0p65jfp/OvrR4z7adinLOvhst6IHAVOQAX38v4/f8RuYDZvOZKmAgwoae8xiPSk3Ll+rSE9Q/8nsH4Fl79YB/k/pEpSFm7YdGcTVO8CtupG6BJKMG6BmGrkc4w7nLIVQtEynDEe2NgXb4NE4JNdzoHCD5dZ8/T/YDAVFYX4vgBWGAFP+gFiOoUCvtQ3suegsdrWPBWmySPdHMjs0f7dIBu6nXKPRl67DhcPpk30Iz0aoRtcYxoLoGXduO/ydjGdCQ3IkD5KeB56+el5ogbq+p9sIhl4zqaZ4nd5Vk+dy0g5f2+9tLBFZHTmawgI4vBtAKWzr7E3zD8O48KKfptzrEA5DAOK5TlmefXcs4bUp9Dnf9gmIT2k9drNxBkYiu6H8jIF6QPCY10E/mM4uCGG8DzcT0r9HAHzpbYUGa9kO7DAsW+jsRLU18wC62ACuEbXmSnQju3s/7BRAkCN2aLBNVgsJhkxZBIj6ZDK90wyn0SKNAqAtXzqvuYuoMDTFxswmckVfTpUcZH5b09imluZa+bzgzHdERwdx6LGE5VKXVEobHlibcfctqRVWZX9sBFEsq9ZYByHTsEiRPN/+7NZqxSFUfYll8VPvSCMvMMqetjH2iz8wAA5WjM+Azdk3wEG7Riqa46VnnM6nmeP7GCqitw1HFjJzn/Ylg23S4+eKmDgW50QfcxkuC29nYUtab9kLB33C5VdtoYxFHCKZpb8PIYcjezO0UfJ9RxA+MGheQXywOq1MOQIKHSa5j1wAAAAA==';
  const rawHost = location.hostname.toLowerCase();
  const currentHost = rawHost.replace(/^www\./, '');
  const isWWW = rawHost.startsWith('www.');
  const publicHost = ['ahsangresik.me', 'ahsanid.dev'].includes(currentHost) ? currentHost : 'ahsangresik.me';
  const publicOrigin = ['ahsangresik.me', 'ahsanid.dev'].includes(currentHost) ? `${location.protocol}//${location.hostname}` : 'https://ahsangresik.me';
  const pageName = location.pathname.includes('project') ? 'project' : location.pathname.includes('sertifikat') ? 'sertifikat' : 'home';
  const variants = {
    'ahsangresik.me': {key:'gresik', label:isWWW?'www.ahsangresik.me':'ahsangresik.me', suffix:'Gresik', homeTitle:'Ahsan Gresik — Backend, API, dan WhatsApp KFAI', projectTitle:'Project Ahsan Gresik — API, KFAI, WhatsApp, Cloud', certTitle:'Sertifikat Ahsan Gresik — Dicoding, IDN, Digitalent', desc:'Portfolio pribadi Ahsan dari Gresik: backend, API Kangwifi, KFAI, WhatsApp KFAI, Cloud Object, dan project web publik.', hero:'Saya bikin web, API, dan bot yang bisa dipakai langsung.', lead:'Mohammad Ahsan Al Ghoni, pelajar dari Gresik yang suka membangun sistem nyata: backend, REST API, WhatsApp KFAI, cloud object, game realtime, sampai aplikasi edukasi. Fokus saya sederhana: cepat, rapi, dan benar-benar jalan.', terminal:'$ curl https://api.kangwifi.eu.org<br>response: gresik portfolio · api online'},
    'ahsanid.dev': {key:'dev', label:isWWW?'www.ahsanid.dev':'ahsanid.dev', suffix:'Dev', homeTitle:'AhsanID Dev — Backend API, KFAI, dan Automation', projectTitle:'AhsanID Dev Projects — API, KFAI, WhatsApp Bot', certTitle:'AhsanID Dev Certificates — Learning & Shipping', desc:'Developer profile AhsanID: backend API, KFAI, WhatsApp automation, Cloud Object, Al-Quran Digital, dan project web publik.', hero:'Backend, API, dan automation yang saya bangun bertahap.', lead:'Saya Ahsan, developer muda yang fokus membangun layanan backend, API publik, WhatsApp automation, dan project web yang benar-benar bisa dicoba. Domain ini saya pakai sebagai profil developer yang lebih teknis.', terminal:'$ node services/kfai.js<br>status: dev profile · automation ready'}
  };
  const variant = variants[publicHost] || variants['ahsangresik.me'];
  document.documentElement.dataset.domain = publicHost;
  document.documentElement.dataset.variant = variant.key;
  document.documentElement.dataset.www = String(isWWW);
  function setMeta(selector, attr, value){ const el=$(selector); if(el) el.setAttribute(attr,value); }
  function pageTitle(){ return pageName==='project'?variant.projectTitle:pageName==='sertifikat'?variant.certTitle:variant.homeTitle; }
  function setDynamicDomainMeta(){
    const path = location.pathname.endsWith('/') ? '/' : location.pathname;
    const canonical = `${publicOrigin}${path}`;
    const title = pageTitle();
    document.title = title;
    const canonicalEl = $('link[rel="canonical"]'); if (canonicalEl) canonicalEl.href = canonical;
    setMeta('meta[name="description"]','content',variant.desc);
    setMeta('meta[property="og:url"]','content',canonical);
    setMeta('meta[property="og:title"]','content',title);
    setMeta('meta[property="og:description"]','content',variant.desc);
    setMeta('meta[property="og:image"]','content',`${publicOrigin}/tes.jpg`);
    setMeta('meta[name="twitter:title"]','content',title);
    setMeta('meta[name="twitter:description"]','content',variant.desc);
    setMeta('meta[name="twitter:image"]','content',`${publicOrigin}/tes.jpg`);
    $$('.js-domain').forEach(el => { el.textContent = variant.label; });
    $$('.js-domain-home').forEach(el => { el.href = publicOrigin; });
    $$('.brand .grad').forEach(el => { el.textContent = variant.suffix; });
    const heroTitle = $('.hero h1'); if(heroTitle && pageName === 'home') heroTitle.innerHTML = `<span class="grad">${variant.hero}</span>`;
    const lead = $('.hero .lead'); if(lead && pageName === 'home') lead.innerHTML = variant.lead.replace('Mohammad Ahsan Al Ghoni','<strong>Mohammad Ahsan Al Ghoni</strong>');
    const terminal = $('.terminal'); if(terminal) terminal.innerHTML = variant.terminal;
  }
  function initInlineCertificateImages(){
    $$('.cert-card').forEach(card => { if(card.dataset.img === 'sertifikat-15.svg') card.dataset.img = cert15Image; });
    $$('img[src="sertifikat-15.svg"]').forEach(img => { img.src = cert15Image; });
    $$('.mini-stat').forEach(stat => { const label=stat.querySelector('span'); const value=stat.querySelector('b'); if(label && value && label.textContent.trim().toLowerCase()==='sertifikat') value.textContent='15'; });
  }
  function initMobileNav(){ const btn=$('.menu-btn'); const links=$('.nav-links'); if(!btn||!links)return; btn.addEventListener('click',()=>{const open=links.classList.toggle('open'); btn.setAttribute('aria-expanded',String(open));}); links.addEventListener('click',e=>{if(e.target.closest('a')){links.classList.remove('open'); btn.setAttribute('aria-expanded','false');}}); }
  function initReveal(){ const items=$$('[data-reveal]'); if(!items.length)return; const io=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible'); io.unobserve(entry.target);}});},{threshold:.12}); items.forEach((item,index)=>{item.style.transitionDelay=`${Math.min(index*45,260)}ms`; io.observe(item);}); }
  function initCertFilters(){ const buttons=$$('.filter-btn'); const items=$$('.cert-item'); if(!buttons.length||!items.length)return; buttons.forEach(btn=>{btn.addEventListener('click',()=>{const filter=btn.dataset.filter||'all'; buttons.forEach(b=>b.classList.remove('active')); btn.classList.add('active'); items.forEach(item=>{const show=filter==='all'||item.dataset.category===filter; item.style.display=show?'':'none';});});}); }
  function initCertModal(){ const modal=$('#certModal'); const modalImg=$('#certModalImg'); const modalTitle=$('#certModalTitle'); const close=$('#certModalClose'); if(!modal||!modalImg||!modalTitle)return; const open=card=>{modalImg.src=card.dataset.img||''; modalImg.alt=card.dataset.title||'Preview sertifikat'; modalTitle.textContent=card.dataset.title||'Preview Sertifikat'; modal.classList.add('show'); document.body.style.overflow='hidden'; close?.focus();}; const hide=()=>{modal.classList.remove('show'); document.body.style.overflow=''; modalImg.src='';}; $$('.cert-card').forEach(card=>{card.addEventListener('click',()=>open(card)); card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault(); open(card);}});}); close?.addEventListener('click',hide); modal.addEventListener('click',e=>{if(e.target===modal) hide();}); document.addEventListener('keydown',e=>{if(e.key==='Escape') hide();}); }
  document.addEventListener('DOMContentLoaded',()=>{setDynamicDomainMeta(); initInlineCertificateImages(); initMobileNav(); initReveal(); initCertFilters(); initCertModal();});
})();
