/* =====================================================================
 * NovaShield v3.4 - Unified Scanner (RAM-optimized)
 * ---------------------------------------------------------------------
 * Konsolidasi 3 scripts (content-ml.js + content-filter.js + content-counter.js)
 * jadi 1 script untuk minim overhead.
 *
 * RAM OPTIMIZATION:
 *   1. Adaptive polling: 1s aktif → 5s saat idle (tab hidden)
 *   2. Single MutationObserver (bukan 3 terpisah)
 *   3. Throttled DOM queries (debounce 500ms)
 *   4. Compile regex sekali (module-level constants)
 *   5. Pause scanning saat tab hidden (visibilitychange)
 *   6. Cache user intent (computed once)
 *   7. Limit element scan count (max 200 elements per scan)
 * ===================================================================== */

(() => {
  const API = (typeof browser !== "undefined") ? browser : chrome;

  // State (cached, updated via storage events)
  let state = {
    activated: true,
    enabled: true,
    mlEnabled: true,
    contentFilter: true,
    popupBlock: true,
    redirectBlock: true,
  };

  // User intent (computed ONCE at page load)
  let userIntentCache = null;
  function getUserIntent() {
    if (userIntentCache !== null) return userIntentCache;
    try {
      if (performance && performance.getEntriesByType) {
        const entries = performance.getEntriesByType("navigation");
        if (entries.length > 0 && entries[0].type === "navigate") {
          if (!document.referrer) { userIntentCache = true; return true; }
          try {
            if (new URL(document.referrer).hostname === window.location.hostname) {
              userIntentCache = true; return true;
            }
          } catch (e) {}
        }
      }
      if (history.length === 1) { userIntentCache = true; return true; }
    } catch (e) {}
    userIntentCache = false;
    return false;
  }

  // Try to read activation from localStorage (sync, fast)
  /* v4.0: always activated */

  API.storage.local.get(state, (data) => {
    state = { ...state, ...data };
    /* v4.0: always activated */
    init();
  });

  API.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== "STATE_CHANGED") return;
    Object.keys(state).forEach((k) => {
      if (typeof msg[k] === "boolean") state[k] = msg[k];
    });
  });

  API.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    Object.keys(changes).forEach((k) => {
      if (state[k] !== undefined && changes[k].newValue !== undefined) {
        state[k] = changes[k].newValue;
      }
    });
  });

  /* ================================================================== *
   * COMPILED PATTERNS (module-level, sekali compile)
   * ================================================================== */
  // Ad URL patterns (combined ML + counter + filter)
  const AD_URL_REGEX = [
    /doubleclick\.net|googlesyndication\.com|googleadservices\.com|googletag/i,
    /amazon-adsystem|adsense\.com|2mdn\.net/i,
    /quge\d+\.com|monetag|propellerads|momrollback/i,
    /popads|popcash|adsterra|hilltopads|adcash/i,
    /exoclick|exosrv|juicyads|trafficjunky/i,
    /adf\.ly|adfly|shorte\.st|linkbucks/i,
    /google-analytics|googletagmanager|hotjar|mixpanel|clarity\.ms/i,
    /facebook\.net|connect\.facebook\.net|facebook\.com\/tr/i,
    /taboola|outbrain|revcontent|mgid/i,
    /adnxs|appnexus|pubmatic|rubiconproject|openx|criteo/i,
    /adsrvr|thetradedesk|demdex|bluekai|scorecardresearch|quantserve/i,
    /coinhive|coin-hive|cryptoloot/i,
    /\/ads\/|\/advert|\/pagead\/|\/popunder\/|\/popup\//i,
    /\/adsbygoogle\.js|\/show_ads\.js|\/tag\.min\.js/i,
    /\/\d+\/tag\.min\.js/i,
    /\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{32}\.js/i,
    /adstars\.co\.id|adplus\.id|ads\.kompas|ads\.tribunnews|ads\.detik/i,
  ];

  // Blocked content keywords (gambling + adult + scam)
  const BLOCKED_KEYWORDS_REGEX = /\b(judi|casino|slot\s*gacor|maxwin|pragmatic|sbobet|agen\s*bola|taruhan|jackpot|togel|bokep|xxx|porn|sex\s*video|hentai|you\s*won|congratulations|claim\s*your\s*prize|free\s*bitcoin|your\s*(pc|computer)\s*(has|is)\s*(infected|locked)|call\s*(microsoft|apple)|virus\s*detected|local\s*singles|meet\s*single|buy\s*viagra|cialis)\b/i;

  // Ad element selectors (cached string)
  const AD_ELEMENT_SELECTOR = [
    "[class*='ad-']", "[class*='ad_']", "[class*='ads-']", "[class*='ads_']",
    "[class*='adsbygoogle']", "[class*='advert']", "[class*='banner-ad']",
    "[class*='sponsored']", "[class*='promo-box']", "[class*='promoted']",
    "[class*='outbrain']", "[class*='taboola']", "[class*='mgid']",
    "[class*='adsterra']", "[class*='popup-ad']", "[class*='overlay-ad']",
    "[id*='ad-']", "[id*='ad_']", "[id*='ads-']", "[id*='ads_']",
    "[id*='google_ads']", "[id*='div-gpt-ad']", "[id*='sponsored']",
    "[data-ad]", "[data-ad-slot]", "[data-ad-client]", "[data-adsbygoogle-status]",
    "[data-sponsored]", "[data-promoted]",
    "ins.adsbygoogle",
  ].join(",");

  // ML scoring: ad URL regex (high confidence)
  function scoreURL(url) {
    if (!url) return 0;
    for (let i = 0; i < AD_URL_REGEX.length; i++) {
      if (AD_URL_REGEX[i].test(url)) return 40;
    }
    return 0;
  }

  function isAdUrl(url) {
    return scoreURL(url) > 0;
  }

  /* ================================================================== *
   * COUNTER (debounced, batched)
   * ================================================================== */
  let pendingCount = 0;
  let flushScheduled = false;

  function flushCount() {
    flushScheduled = false;
    if (pendingCount === 0) return;
    const n = pendingCount;
    pendingCount = 0;
    try {
      API.runtime.sendMessage({ type: "INCREMENT_TAB_COUNT", count: n }, () => {
        void API.runtime.lastError;
      });
    } catch (e) {}
  }

  function scheduleFlush() {
    if (flushScheduled) return;
    flushScheduled = true;
    setTimeout(flushCount, 300); // debounce 300ms
  }

  function incrementCounter() {
    pendingCount++;
    scheduleFlush();
  }

  // Listen for blocked events from MAIN world (popup/redirect/antiadblock)
  window.addEventListener("__novashield_blocked_request", () => {
    incrementCounter();
  });

  // Resource error detection (failed ad loads)
  document.addEventListener("error", (e) => {
    if (!state.enabled) return;
    const target = e.target;
    if (!target || !target.tagName) return;
    const tag = target.tagName.toLowerCase();
    if (!["script", "img", "iframe", "link", "video", "audio", "object", "embed", "source"].includes(tag)) return;
    const url = target.src || target.href || "";
    if (!url || url === window.location.href) return;
    if (isAdUrl(url)) {
      incrementCounter();
    }
  }, true);

  /* ================================================================== *
   * ML SCANNER (throttled, limited element count)
   * ================================================================== */
  const MAX_ELEMENTS_PER_SCAN = 200; // RAM: limit to 200 elements per scan
  let scannedElements = new WeakSet(); // track already-scanned

  function scanElementForML(el) {
    if (!state.enabled || !state.mlEnabled) return;
    if (!el || !el.tagName || scannedElements.has(el)) return;
    scannedElements.add(el);

    const url = el.src || el.href || "";
    const text = (el.textContent || "").trim().substring(0, 100);

    let score = 0;
    if (url) score += scoreURL(url);

    // Quick class/id check
    const cls = (el.className && typeof el.className === "string") ? el.className.toLowerCase() : "";
    const id = (el.id || "").toLowerCase();
    const test = cls + " " + id;
    if (/adsbygoogle|ad-container|ad-slot|ad-banner|sponsored|outbrain|taboola|div-gpt-ad|google_ads/i.test(test)) {
      score += 25;
    }
    if (el.tagName === "INS") score += 20;

    // Content keywords
    if (text.length > 3 && text.length < 200 && BLOCKED_KEYWORDS_REGEX.test(text)) {
      score += 25;
    }

    if (score >= 60) {
      try {
        el.style.setProperty("display", "none", "important");
        incrementCounter();
      } catch (e) {}
    }
  }

  function scanAll() {
    if (!state.enabled) return;
    // Limit query: only scan ad-like elements (not all divs)
    const elements = document.querySelectorAll(AD_ELEMENT_SELECTOR);
    let count = 0;
    elements.forEach((el) => {
      if (count >= MAX_ELEMENTS_PER_SCAN) return;
      scanElementForML(el);
      count++;
    });
  }

  /* ================================================================== *
   * CONTENT FILTER (gambling/porn/scam in ad elements)
   * ================================================================== */
  function filterAdContent() {
    if (!state.enabled || !state.contentFilter) return;
    if (getUserIntent()) return; // User navigated directly, allow

    const adElements = document.querySelectorAll(AD_ELEMENT_SELECTOR);
    let count = 0;
    adElements.forEach((el) => {
      if (count >= MAX_ELEMENTS_PER_SCAN) return;
      if (el.__novashieldFiltered) return;
      count++;
      const text = (el.textContent || "").trim();
      if (text.length < 3 || text.length > 500) return;
      if (BLOCKED_KEYWORDS_REGEX.test(text)) {
        el.__novashieldFiltered = true;
        try {
          el.style.setProperty("display", "none", "important");
          incrementCounter();
        } catch (e) {}
      }
    });
  }

  /* ================================================================== *
   * ADAPTIVE POLLING (1s active, 5s idle when tab hidden)
   * ================================================================== */
  let isTabVisible = !document.hidden;
  let pollTimeout = null;

  function getPollInterval() {
    return isTabVisible ? 2000 : 8000; // 2s active, 8s hidden
  }

  function adaptivePoll() {
    if (!state.enabled) {
      pollTimeout = setTimeout(adaptivePoll, 5000);
      return;
    }
    if (isTabVisible) {
      scanAll();
      filterAdContent();
    }
    pollTimeout = setTimeout(adaptivePoll, getPollInterval());
  }

  // Visibility change listener (pause scanning when hidden)
  document.addEventListener("visibilitychange", () => {
    isTabVisible = !document.hidden;
  });

  /* ================================================================== *
   * SINGLE MUTATION OBSERVER (throttled)
   * ================================================================== */
  let mutationPending = false;
  function onMutation() {
    if (mutationPending) return;
    mutationPending = true;
    setTimeout(() => {
      mutationPending = false;
      if (state.enabled && isTabVisible) {
        scanAll();
        filterAdContent();
      }
    }, 500); // throttle 500ms
  }

  function init() {
    if (!state.enabled) return;

    // Initial scan
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => { scanAll(); filterAdContent(); }, 500);
      });
    } else {
      setTimeout(() => { scanAll(); filterAdContent(); }, 500);
    }

    // Start adaptive polling
    adaptivePoll();

    // Single MutationObserver (replaces 3 separate observers)
    const obs = new MutationObserver(onMutation);
    if (document.documentElement) {
      try {
        obs.observe(document.documentElement, {
          childList: true,
          subtree: true,
          attributes: false, // Don't watch attributes (saves CPU)
        });
      } catch (e) {}
    }

    console.info("[NovaShield][Scanner] Unified scanner aktif (RAM-optimized)");
  }
})();
