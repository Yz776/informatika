/* =====================================================================
 * NovaShield v3.3 - Content Filter (ISOLATED world)
 * ---------------------------------------------------------------------
 * Block iklan dengan kata perjudian/porno/scam.
 *
 * USER INTENT DETECTION:
 *   - Jika user navigasi langsung (typed URL, clicked bookmark) → ALLOW
 *   - Jika redirect/popup dari situs lain → BLOCK jika content match
 *   - Check: performance.navigation.type, document.referrer, history.length
 * ===================================================================== */

(() => {
  const API = (typeof browser !== "undefined") ? browser : chrome;

  let activated = false;
  let enabled = true;
  let contentFilter = true;

  try { activated = localStorage.getItem("__novashield_activated") === "1"; } catch (e) {}

  API.storage.local.get({
    activated: false, enabled: true, contentFilter: true,
  }, (data) => {
    activated = !!data.activated;
    enabled = !!data.enabled;
    contentFilter = !!data.contentFilter;
    try { localStorage.setItem("__novashield_activated", activated ? "1" : "0"); } catch (e) {}
    if (activated && enabled && contentFilter) initFilter();
  });

  API.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== "STATE_CHANGED") return;
    if (typeof msg.activated === "boolean") {
      activated = msg.activated;
      try { localStorage.setItem("__novashield_activated", activated ? "1" : "0"); } catch (e) {}
    }
    if (typeof msg.enabled === "boolean") enabled = msg.enabled;
    if (typeof msg.contentFilter === "boolean") contentFilter = msg.contentFilter;
  });

  /* ================================================================== *
   * USER INTENT DETECTION
   * ================================================================== */
  function isUserInitiatedNavigation() {
    // performance.getEntriesByType("navigation") - modern API
    if (performance && performance.getEntriesByType) {
      const entries = performance.getEntriesByType("navigation");
      if (entries.length > 0) {
        const nav = entries[0];
        // type: "navigate" (user click/typed), "reload", "back_forward"
        if (nav.type === "navigate" || nav.type === "reload") {
          // Check if referrer is empty (user typed URL directly)
          if (!document.referrer) return true;
          // Check if referrer is same origin
          try {
            const referrerHost = new URL(document.referrer).hostname;
            if (referrerHost === window.location.hostname) return true;
          } catch (e) {}
        }
      }
    }
    // Legacy: performance.navigation.type
    if (performance && performance.navigation) {
      // 0 = TYPE_NAVIGATE (user click/typed), 1 = TYPE_RELOAD, 2 = TYPE_BACK_FORWARD
      if (performance.navigation.type === 0) {
        if (!document.referrer) return true;
        try {
          const referrerHost = new URL(document.referrer).hostname;
          if (referrerHost === window.location.hostname) return true;
        } catch (e) {}
      }
    }
    // Check history.length - if 1, user opened in new tab
    if (history.length === 1) return true;
    return false;
  }

  // Cache user intent on page load (performance entries change over time)
  let userIntentCache = null;
  function getUserIntent() {
    if (userIntentCache !== null) return userIntentCache;
    userIntentCache = isUserInitiatedNavigation();
    return userIntentCache;
  }

  /* ================================================================== *
   * KEYWORD LISTS
   * ================================================================== */
  const GAMBLING_KEYWORDS = [
    // Indonesian
    "judi", "bandar", "togel", "slot gacor", "maxwin", "pragmatic play",
    "pg soft", "sbobet", "agen bola", "taruhan", "jackpot", "rtp live",
    "deposit pulsa", "situs judi", "bandar togel", "agen casino", "poker online",
    "ceme", "domino qiu qiu", "capsa susun", "bandar q", "aduq", "sakong",
    "judi online", "judi slot", "judi bola", "judi casino", "judi poker",
    "link alternatif", "daftar judi", "login judi", "rtp slot", "pola gacor",
    "akun pro", "akun jp", "scatter hitam", "maxwin hari ini",
    // English
    "online casino", "online gambling", "sports betting", "poker site",
    "casino bonus", "free spins", "no deposit bonus", "welcome bonus",
    "bet now", "place your bet", "gambling site", "slot machine",
  ];

  const ADULT_KEYWORDS = [
    // Indonesian
    "bokep", "video bokep", "bokep indonesia", "streaming bokep",
    "download bokep", "bokep terbaru", "bokep hd", "nonton bokep",
    "film bokep", "bokep barat", "bokep jepang", "bokep korea",
    "memek", "kontol", "ngentot", "bugil", "telanjang",
    "cerita sex", "cerita dewasa", "video dewasa",
    "live sex", "cam sex", "video sex",
    // English
    "porn", "pornhub", "xvideos", "xnxx", "redtube",
    "xxx video", "sex video", "adult video", "nude pic",
    "naked girls", "hot milfs", "teen porn", "amateur porn",
    "lesbian porn", "gay porn", "hentai", "anime sex",
    "cam girls", "live cam", "sex chat", "adult chat",
  ];

  const SCAM_KEYWORDS = [
    // Scam
    "you won", "congratulations you won", "you are the winner",
    "claim your prize", "claim now", "free gift card",
    "free iphone", "free bitcoin", "free btc giveaway",
    "crypto airdrop", "double your bitcoin",
    "your pc is infected", "your computer has been locked",
    "call microsoft now", "call apple support",
    "virus detected", "malware detected",
    "your account has been suspended", "verify your account",
    "norton secure", "mcafee secure", "kaspersky alert",
    // Phishing
    "paypal secure update", "apple id locked", "icloud locked",
    "microsoft account verify", "google account alert",
    "amazon security update", "facebook secure login",
    // Tech support scam
    "windows security alert", "microsoft support alert",
    "blue screen error", "critical error",
    // Dating scam
    "local singles", "meet single women", "hot singles near you",
    "dating near you", "find your match",
    // Pharmacy
    "buy viagra", "buy cialis", "weight loss pill", "diet pill",
    "cheap medication", "no prescription needed",
  ];

  const ALL_BLOCKED_KEYWORDS = [
    ...GAMBLING_KEYWORDS,
    ...ADULT_KEYWORDS,
    ...SCAM_KEYWORDS,
  ];

  function containsBlockedKeyword(text) {
    if (!text || typeof text !== "string") return null;
    const lower = text.toLowerCase();
    for (const kw of ALL_BLOCKED_KEYWORDS) {
      if (lower.includes(kw)) return kw;
    }
    return null;
  }

  /* ================================================================== *
   * FILTER: scan ad elements for blocked keywords
   * ================================================================== */
  function isAdElement(el) {
    if (!el || !el.tagName) return false;
    // Check if this looks like an ad container
    const cls = (el.className && typeof el.className === "string") ? el.className.toLowerCase() : "";
    const id = (el.id || "").toLowerCase();
    const test = cls + " " + id;

    const adPatterns = [
      "ad-", "ad_", "ads-", "ads_", "adsbygoogle", "advert", "banner-ad",
      "google_ads", "div-gpt-ad", "ad-container", "ad-wrapper", "ad-zone",
      "ad-slot", "ad-banner", "ad-leaderboard", "ad-rectangle", "sponsored",
      "promo-box", "promoted", "outbrain", "taboola", "rev-content", "mgid",
      "adsterra", "popup-ad", "overlay-ad", "interstitial-ad",
      "ad-placeholder", "ad-empty", "ad-fallback",
    ];
    for (const p of adPatterns) {
      if (test.includes(p)) return true;
    }
    // Check data attributes
    if (el.hasAttribute && (el.hasAttribute("data-ad") ||
        el.hasAttribute("data-ad-slot") || el.hasAttribute("data-ad-client") ||
        el.hasAttribute("data-adsbygoogle-status") || el.hasAttribute("data-sponsored") ||
        el.hasAttribute("data-promoted"))) {
      return true;
    }
    return false;
  }

  function filterAdContent() {
    if (!activated || !enabled || !contentFilter) return;
    // If user navigated intentionally, don't filter (they want to see it)
    if (getUserIntent()) return;

    // Find all elements that look like ads
    const adElements = document.querySelectorAll(
      "[class*='ad-'], [class*='ad_'], [class*='ads-'], [class*='ads_'], " +
      "[class*='adsbygoogle'], [class*='advert'], [class*='banner-ad'], " +
      "[class*='sponsored'], [class*='promo-box'], [class*='promoted'], " +
      "[class*='outbrain'], [class*='taboola'], [class*='mgid'], " +
      "[class*='adsterra'], [class*='popup-ad'], [class*='overlay-ad'], " +
      "[id*='ad-'], [id*='ad_'], [id*='ads-'], [id*='ads_'], " +
      "[id*='google_ads'], [id*='div-gpt-ad'], [id*='sponsored'], " +
      "[data-ad], [data-ad-slot], [data-ad-client], [data-adsbygoogle-status], " +
      "[data-sponsored], [data-promoted], " +
      "ins.adsbygoogle, iframe[src*='doubleclick'], iframe[src*='googlesyndication'], " +
      "iframe[src*='amazon-adsystem'], iframe[src*='adnxs']"
    );

    adElements.forEach((el) => {
      if (el.__novashieldFiltered) return;
      const text = (el.textContent || "").trim();
      if (text.length < 3 || text.length > 1000) return;

      const keyword = containsBlockedKeyword(text);
      if (keyword) {
        console.log(`[NovaShield][Filter] Ad with blocked keyword "${keyword}" hidden`);
        el.__novashieldFiltered = true;
        try {
          el.style.setProperty("display", "none", "important");
          el.style.setProperty("visibility", "hidden", "important");
          el.style.setProperty("opacity", "0", "important");
          el.style.setProperty("height", "0", "important");
          el.style.setProperty("width", "0", "important");
          el.style.setProperty("max-height", "0", "important");
          el.style.setProperty("max-width", "0", "important");
          el.style.setProperty("overflow", "hidden", "important");
          el.style.setProperty("position", "absolute", "important");
          el.style.setProperty("left", "-9999px", "important");
          el.style.setProperty("top", "-9999px", "important");
        } catch (e) {}
        // Notify counter
        try {
          window.dispatchEvent(new CustomEvent("__novashield_blocked_request", {
            detail: { type: "content_filter", url: `keyword:${keyword}` }
          }));
        } catch (e) {}
      }
    });
  }

  /* ================================================================== *
   * POPUP/REDIRECT CONTENT CHECK
   * If popup window or redirect contains blocked keywords → block entirely
   * ================================================================== */
  function checkPopupContent() {
    if (!activated || !enabled || !contentFilter) return;
    if (getUserIntent()) return;

    // Check page title and meta description
    const title = document.title || "";
    const metaDesc = document.querySelector("meta[name='description']");
    const desc = metaDesc ? (metaDesc.getAttribute("content") || "") : "";

    const fullText = title + " " + desc;
    const keyword = containsBlockedKeyword(fullText);

    if (keyword) {
      // This page is a gambling/porn/scam site opened via redirect/popup
      console.log(`[NovaShield][Filter] Page content matches blocked keyword "${keyword}"`);
      // If history length > 1 (came from redirect), block the page
      if (history.length > 1 && !getUserIntent()) {
        // Replace page with warning
        document.documentElement.innerHTML = `
          <body style="margin:0;padding:0;background:#0a0817;color:#e8e6f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;">
            <div style="max-width:500px;padding:40px;">
              <div style="width:80px;height:80px;margin:0 auto 24px;background:linear-gradient(135deg,#ff5470,#b388ff);border-radius:50%;display:flex;align-items:center;justify-content:center;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                  <path d="M12 2L3 5v6c0 5 4 9 9 11 5-2 9-6 9-11V5l-9-3z"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h1 style="font-size:24px;margin:0 0 12px;color:#ff5470;">Halaman Diblokir</h1>
              <p style="color:#8a85a8;font-size:15px;line-height:1.6;margin:0 0 24px;">
                NovaShield telah memblokir halaman ini karena terdeteksi mengandung konten
                <strong style="color:#ff5470;">${keyword}</strong>
                yang dibuka melalui redirect/popup tanpa izin Anda.
              </p>
              <p style="color:#5a547a;font-size:13px;margin:0 0 24px;">
                Jika ini adalah kesalahan, atau Anda sengaja ingin mengakses halaman ini,
                Anda bisa menonaktifkan "Content Filter" di popup NovaShield.
              </p>
              <button onclick="history.back()" style="background:linear-gradient(135deg,#00e5ff,#b388ff);color:#0a0817;border:none;padding:12px 28px;border-radius:999px;font-weight:700;font-size:14px;cursor:pointer;">
                Kembali
              </button>
            </div>
          </body>
        `;
        try {
          window.dispatchEvent(new CustomEvent("__novashield_blocked_request", {
            detail: { type: "page_block", url: window.location.href }
          }));
        } catch (e) {}
      }
    }
  }

  function initFilter() {
    // Run on DOM ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        filterAdContent();
        checkPopupContent();
      });
    } else {
      filterAdContent();
      checkPopupContent();
    }

    // Re-scan periodically for late-loaded ads
    setInterval(filterAdContent, 2000);

    // MutationObserver for new ad elements
    const obs = new MutationObserver(() => {
      if (activated && enabled && contentFilter) filterAdContent();
    });
    if (document.body) {
      try {
        obs.observe(document.body, { childList: true, subtree: true });
      } catch (e) {}
    } else {
      setTimeout(() => {
        if (document.body) {
          try {
            obs.observe(document.body, { childList: true, subtree: true });
          } catch (e) {}
        }
      }, 500);
    }
  }

  console.info("[NovaShield][Filter] Content filter aktif (user intent:", getUserIntent(), ")");
})();
