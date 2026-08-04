/* =====================================================================
 * NovaShield v3.0 - Content Counter (accurate blocked request counting)
 * ---------------------------------------------------------------------
 * FIXES: "counter always 0" issue.
 *
 * The declarativeNetRequest.onRuleMatchedDebug API only works in Chrome
 * AND requires declarativeNetRequestFeedback permission AND only fires
 * for rules that match. In Firefox it's unavailable entirely.
 *
 * This script provides an accurate fallback counter by detecting
 * blocked resources via:
 *   1. error events on <script>, <img>, <iframe>, <link>, <video>, <audio>
 *   2. fetch() failures in MAIN world (via bridge)
 *   3. XHR failures in MAIN world (via bridge)
 *
 * When a resource fails to load AND its URL matches our ad/tracker
 * pattern list, we increment the counter via background message.
 * ===================================================================== */

(() => {
  const API = (typeof browser !== "undefined") ? browser : chrome;

  // Only run if activated
  let activated = false;
  let enabled = true;
  try { activated = localStorage.getItem("__novashield_activated") === "1"; } catch (e) {}

  API.storage.local.get({ activated: false, enabled: true }, (data) => {
    activated = !!data.activated;
    enabled = !!data.enabled;
    try { localStorage.setItem("__novashield_activated", activated ? "1" : "0"); } catch (e) {}
    if (activated && enabled) startCounting();
  });

  API.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== "STATE_CHANGED") return;
    if (typeof msg.activated === "boolean") {
      activated = msg.activated;
      try { localStorage.setItem("__novashield_activated", activated ? "1" : "0"); } catch (e) {}
    }
    if (typeof msg.enabled === "boolean") enabled = msg.enabled;
    if (activated && enabled) startCounting();
  });

  // Ad/tracker URL patterns - matches our DNR static rules
  const AD_PATTERNS = [
    /doubleclick\.net/i, /googlesyndication\.com/i, /googleadservices\.com/i,
    /googletagservices\.com/i, /google-analytics\.com/i, /googletagmanager\.com/i,
    /adsense\.com/i, /2mdn\.net/i, /amazon-adsystem\.com/i, /aax\.amazon-adsystem/i,
    /advertising\.com/i, /adtech\.com/i, /adnxs\.com/i, /appnexus\.com/i,
    /pubmatic\.com/i, /rubiconproject\.com/i, /openx\.net/i, /criteo\.com/i,
    /criteo\.net/i, /taboola\.com/i, /outbrain\.com/i, /revcontent\.com/i,
    /mgid\.com/i, /propellerads\.com/i, /adsrvr\.org/i, /thetradedesk\.com/i,
    /demdex\.net/i, /bluekai\.com/i, /scorecardresearch\.com/i, /quantserve\.com/i,
    /chartbeat\.com/i, /chartbeat\.net/i, /hotjar\.com/i, /mixpanel\.com/i,
    /segment\.io/i, /amplitude\.com/i, /fullstory\.com/i, /logrocket\.com/i,
    /clarity\.ms/i, /facebook\.net/i, /connect\.facebook\.net/i,
    /facebook\.com\/tr/i, /an\.facebook\.com/i, /twitter\.com\/i\/adsct/i,
    /analytics\.twitter\.com/i, /ads\.twitter\.com/i, /linkedin\.com\/li\/track/i,
    /px\.ads\.linkedin\.com/i, /snap\.licdn\.com/i, /ads\.tiktok\.com/i,
    /analytics\.tiktok\.com/i, /pixel\.tiktok\.com/i, /bat\.bing\.com/i,
    /adservice\.google\.com/i, /adservice\.google\.co\.id/i,
    /adsafeprotected\.com/i, /doubleverify\.com/i, /moatads\.com/i,
    /nielsen\.com/i, /imrworldwide\.com/i, /cdn-gl\.imrworldwide/i,
    /s0\.2mdn\.net/i, /s1\.2mdn\.net/i, /tpc\.googlesyndication/i,
    /pubads\.g\.doubleclick/i, /securepubads\.g\.doubleclick/i,
    /s\.youtube\.com\/api\/stats\/ads/i, /youtube\.com\/api\/stats\/ads/i,
    /youtube\.com\/pagead/i, /googlevideo\.com\/pagead/i,
    /popads\.net/i, /popcash\.net/i, /adsterra\.com/i, /hilltopads\.net/i,
    /adcash\.com/i, /adf\.ly/i, /adfly\.com/i, /shorte\.st/i,
    /exoclick\.com/i, /exosrv\.com/i, /juicyads\.com/i, /trafficjunky/i,
    /coinhive\.com/i, /coin-hive\.com/i, /cryptoloot\.com/i,
    /adplus\.id/i, /ads\.kompas\.com/i, /ads\.tribunnews\.com/i, /ads\.detik\.com/i,
    /spotxchange\.com/i, /smartadserver\.com/i, /springserve\.com/i,
    /appsflyer\.com/i, /branch\.io/i, /onesignal\.com/i,
    // v3.2: Monetag network
    /quge\d+\.com/i, /monetag\.com/i, /monetag-cdn\.com/i, /monetag\.io/i,
    /propeller-tracking\.com/i,
    // v3.2: momrollback + similar
    /momrollback\.com/i, /momroll\.com/i, /momroll\.net/i,
    /rolfron\.com/i, /rolback\.com/i,
    /clickadu\.com/i, /clickadz\.com/i, /clickfriction\.com/i, /eddomo\.com/i,
    /popcpm\.com/i, /popmonetizer\.net/i,
    /perfectpointers\.com/i, /pushpushgo\.com/i, /pushnado\.com/i,
    /pushda\.com/i, /pushads\.com/i, /pushible\.com/i,
    /adultadworld\.com/i, /adultmoda\.com/i, /mobadult\.com/i,
    /clicksor\.com/i, /clicksor\.net/i,
    // v3.2: Monetag tag.min.js pattern
    /\/\d+\/tag\.min\.js/i,
    // v3.2: momrollback UUID pattern
    /\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{32}\.js/i,
    // v3.2: adsbygoogle + show_ads script
    /\/adsbygoogle\.js/i, /\/show_ads\.js/i, /\/tag\.min\.js/i,
  ];

  function isAdUrl(url) {
    if (!url) return false;
    try {
      const u = new URL(url, window.location.href);
      const full = u.href;
      for (const p of AD_PATTERNS) {
        if (p.test(full)) return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // Debounced counter increment
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
    setTimeout(flushCount, 200);
  }

  function incrementCounter() {
    pendingCount++;
    scheduleFlush();
  }

  // Pattern 1: Listen for error events on resource elements (capture phase)
  // These fire when DNR blocks a resource load.
  function startCounting() {
    if (window.__novashieldCounterActive) return;
    window.__novashieldCounterActive = true;

    const resourceSelectors = "script, img, iframe, link, video, audio, object, embed, source";

    document.addEventListener("error", (e) => {
      const target = e.target;
      if (!target || !target.tagName) return;
      const tag = target.tagName.toLowerCase();
      if (!["script", "img", "iframe", "link", "video", "audio", "object", "embed", "source"].includes(tag)) return;

      const url = target.src || target.href || "";
      if (!url || url === window.location.href) return;

      if (isAdUrl(url)) {
        console.log("[NovaShield] Blocked resource detected:", url.substring(0, 80));
        incrementCounter();
      }
    }, true); // capture phase required for error events

    // Pattern 2: Listen for window error events (catches some blocked scripts)
    window.addEventListener("error", (e) => {
      if (e.target && e.target.tagName) return; // already handled above
      const file = e.filename || "";
      const msg = e.message || "";
      if (isAdUrl(file) || /adsbygoogle|googlesyndication|doubleclick/i.test(msg)) {
        incrementCounter();
      }
    }, true);

    // Pattern 3: PerformanceObserver for failed resource loads
    if (window.PerformanceObserver) {
      try {
        const obs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // Check transferSize === 0 for failed loads
            if (entry.transferSize === 0 && entry.duration > 0) {
              if (isAdUrl(entry.name)) {
                incrementCounter();
              }
            }
          }
        });
        obs.observe({ entryTypes: ["resource"] });
      } catch (e) {}
    }

    // Pattern 4: Listen for messages from MAIN world (fetch/XHR intercepts)
    window.addEventListener("__novashield_blocked_request", (e) => {
      if (e.detail && e.detail.url && isAdUrl(e.detail.url)) {
        incrementCounter();
      }
    });

    // Pattern 5: Check existing resource elements that already failed
    setTimeout(() => {
      document.querySelectorAll(resourceSelectors).forEach((el) => {
        const url = el.src || el.href || "";
        if (!url || url === window.location.href) return;
        // Check if the resource actually loaded
        if (el.tagName === "IMG" && el.naturalWidth === 0 && el.complete) {
          if (isAdUrl(url)) incrementCounter();
        } else if (el.tagName === "IFRAME" || el.tagName === "SCRIPT") {
          // Can't easily check, but if it's an ad URL, count it as likely blocked
          // (only if it appears to have failed - check via timing later)
        }
      });
    }, 2000);
  }
})();
