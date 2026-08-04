/* NovaShield v2.1 - Annoyance Blocker (cookie, notif, autoplay, dll) */
(() => {
  const API = (typeof browser !== "undefined") ? browser : chrome;
  let state = {
    activated: true, enabled: true, cookieBlock: true, notifBlock: true,
    autoplayBlock: true, exitConfirmBlock: true, stickyHeaderBlock: true,
    socialWidgetsBlock: false, newsletterPopupBlock: true,
  };

  API.storage.local.get(state, (data) => {
    state = { ...state, ...data };
    runAll();
  });

  API.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== "STATE_CHANGED") return;
    Object.keys(state).forEach((k) => {
      if (typeof msg[k] === "boolean") state[k] = msg[k];
    });
    runAll();
  });

  const COOKIE_SELECTORS = [
    "#onetrust-banner-sdk", "#onetrust-consent-sdk", "#consent-banner",
    "#cookie-banner", "#cookieBanner", "#cookies-banner", "#cookie-notice",
    "#cookieNotice", "#cookieConsent", "#cookie-consent", "#gdpr-banner",
    "#gdpr-consent", ".cookie-banner", ".cookie-consent", ".cookie-notice",
    ".cookie-popup", ".cookies-banner", ".cookies-consent", ".cookies-notice",
    ".cookies-popup", ".gdpr-banner", ".gdpr-consent", ".privacy-banner",
    ".privacy-notice", ".cmp-banner", ".consent-banner", ".cc-banner",
    ".cc-window", "#cmp-banner", "[id^='sp_message_container']",
    "[id*='truste']", "[id*='consent']", "[class*='cookie-banner']",
    "[class*='CookieBanner']", "[class*='gdpr']", "[class*='GDPR']",
    "#didomi-host", "#didomi-notice", "[id*='didomi']", ".tcm-v2",
    "#truste-consent-track", "#consent_blackbar", "#cysoCookieBar",
    ".cmp-popup", ".consent-popup", ".cookies-prompt", ".cookie-prompt",
    ".cookie-wrapper", ".cookie-bar", ".cookie-container",
    "[data-testid='cookie-policy-banner']", "[data-testid='cookieConsent']",
    "[data-testid='cookie-banner']",
  ];

  const COOKIE_REJECT_SELECTORS = [
    "#onetrust-reject-all-handler", ".ot-pc-refuse-all-handler",
    "#reject-all", ".reject-all", "[id*='reject']", "[id*='Refuse']",
    "[class*='reject-all']", "[class*='RefuseAll']", "[class*='refuse-all']",
    "button[data-testid='reject-all']", "button[data-testid='decline-all']",
    "button[aria-label*='Reject']", "button[aria-label*='Decline']",
    "button[aria-label*='reject']", "button[aria-label*='decline']",
    "button[aria-label*='Hanya perlu']", "button[aria-label*='Tolak']",
    "#didomi-notice-disagree-button", "button.didomi-continue-without-agreeing",
    ".qc-cmp2-summary-buttons button[mode='primary']:last-child",
    ".qc-cmp2-buttons-desktop button:last-child",
    "button[value='reject']", "button[value='decline']",
  ];

  const COOKIE_TEXT_PATTERNS = [
    /^(reject|decline|refuse|tolak|tidak setuju|hanya perlu|necessary only|essential only)/i,
    /^(reject all|decline all|refuse all|tolak semua|abaikan semua)/i,
    /^(continue without|lanjut tanpa|tetap tanpa)/i,
  ];

  function rejectCookieBanner() {
    if (!state.activated || !state.enabled || !state.cookieBlock) return;
    for (const sel of COOKIE_REJECT_SELECTORS) {
      const btn = document.querySelector(sel);
      if (btn && btn.offsetWidth > 0) { try { btn.click(); } catch (e) {} }
    }
    document.querySelectorAll("button, a").forEach((btn) => {
      const text = (btn.textContent || "").trim();
      if (text.length > 30) return;
      for (const pat of COOKIE_TEXT_PATTERNS) {
        if (pat.test(text)) { try { btn.click(); } catch (e) {} break; }
      }
    });
    setTimeout(() => {
      for (const sel of COOKIE_SELECTORS) {
        document.querySelectorAll(sel).forEach((el) => {
          try { el.style.setProperty("display", "none", "important"); } catch (e) {}
        });
      }
      const body = document.body;
      if (body) {
        const cs = window.getComputedStyle(body);
        if (cs.overflowY === "hidden") body.style.setProperty("overflow", "auto", "important");
        if (cs.position === "fixed") {
          body.style.setProperty("position", "static", "important");
          body.style.setProperty("top", "0", "important");
        }
      }
    }, 500);
  }

  if (state.activated && state.enabled && state.notifBlock) {
    try {
      Object.defineProperty(window.Notification, "permission", {
        get: () => "denied", configurable: true,
      });
    } catch (e) {}
    try {
      window.Notification.requestPermission = function () { return Promise.resolve("denied"); };
    } catch (e) {}
    if (navigator.permissions && navigator.permissions.query) {
      const origQuery = navigator.permissions.query.bind(navigator.permissions);
      navigator.permissions.query = function (desc) {
        if (desc && desc.name === "notifications") {
          return Promise.resolve({ state: "denied", onchange: null });
        }
        return origQuery(desc);
      };
    }
  }

  function blockAutoplay() {
    if (!state.activated || !state.enabled || !state.autoplayBlock) return;
    document.querySelectorAll("video[autoplay], video[playsinline][muted]").forEach((v) => {
      try { v.pause(); v.removeAttribute("autoplay"); v.muted = false; } catch (e) {}
    });
    const origPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (state.autoplayBlock && (this.muted || this.volume === 0)) {
        return new Promise((resolve, reject) => {
          reject(new DOMException("blocked by NovaShield", "AbortError"));
        });
      }
      return origPlay.apply(this, arguments);
    };
  }

  function blockExitConfirm() {
    if (!state.activated || !state.enabled || !state.exitConfirmBlock) return;
    try {
      Object.defineProperty(window, "onbeforeunload", {
        get: () => null, set: () => null, configurable: true,
      });
    } catch (e) {}
    const orig = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, opts) {
      if (type === "beforeunload" && state.exitConfirmBlock) return;
      return orig.call(this, type, listener, opts);
    };
  }

  function blockStickyHeaders() {
    if (!state.activated || !state.enabled || !state.stickyHeaderBlock) return;
    const host = location.hostname;
    if (["youtube.com", "github.com", "google.com"].some(h => host.includes(h))) return;
    const stickySelectors = [
      "header[style*='position: sticky']", "header[style*='position:sticky']",
      "header.sticky", "nav.sticky", "nav[style*='position: sticky']",
      "nav[style*='position:sticky']", "div.sticky-header",
      "[class*='sticky-header']", "[class*='StickyHeader']",
    ];
    stickySelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        try { el.style.setProperty("position", "static", "important"); } catch (e) {}
      });
    });
  }

  function blockSocialWidgets() {
    if (!state.activated || !state.enabled || !state.socialWidgetsBlock) return;
    const socialSelectors = [
      "iframe[src*='facebook.com/plugins/']", "iframe[src*='platform.twitter.com']",
      "iframe[src*='twitter.com/widgets']", ".fb-like", ".fb-comments",
      ".fb-page", ".fb-post", ".twitter-tweet", ".twitter-share-button",
      ".tweet-embed", ".instagram-embed", ".linkedin-embed",
      "[class*='social-share']", "[class*='SocialShare']", ".share-buttons",
      ".social-share-buttons", "iframe[src*='linkedin.com/embed']",
      "iframe[src*='instagram.com/p/']", "iframe[src*='tiktok.com/embed']",
    ];
    socialSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        try { el.style.setProperty("display", "none", "important"); } catch (e) {}
      });
    });
  }

  const NEWSLETTER_SELECTORS = [
    "[class*='newsletter-popup']", "[class*='NewsletterPopup']",
    "[id*='newsletter-popup']", "[class*='subscribe-popup']",
    "[class*='SubscribePopup']", "[class*='email-popup']",
    "[class*='mailchimp-popup']", "[class*='exit-intent']",
    "[class*='ExitIntent']", "[class*='exit-popup']", "[class*='ExitPopup']",
    ".popup-newsletter", ".popup-subscribe", "#newsletter-modal",
    "#subscribe-modal", "[data-testid='newsletter-signup-modal']",
    "[data-testid='newsletter-popup']",
  ];

  function blockNewsletterPopups() {
    if (!state.activated || !state.enabled || !state.newsletterPopupBlock) return;
    NEWSLETTER_SELECTORS.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        try { el.style.setProperty("display", "none", "important"); } catch (e) {}
      });
    });
    document.addEventListener("mouseleave", (e) => {
      if (e.clientY < 5) {
        setTimeout(blockNewsletterPopups, 50);
        setTimeout(blockNewsletterPopups, 300);
      }
    }, true);
  }

  function runAll() {
    if (!state.activated || !state.enabled) return;
    rejectCookieBanner();
    blockAutoplay();
    blockExitConfirm();
    blockStickyHeaders();
    blockSocialWidgets();
    blockNewsletterPopups();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runAll);
  } else { runAll(); }
  setInterval(runAll, 1500);
  const obs = new MutationObserver(() => { if (state.activated && state.enabled) runAll(); });
  function attach() {
    if (!document.body) { setTimeout(attach, 50); return; }
    try { obs.observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  }
  attach();
})();
