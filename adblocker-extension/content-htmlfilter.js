/* =====================================================================
 * NovaShield v3.6 - HTML Filtering Engine (uBlock-inspired)
 * ---------------------------------------------------------------------
 * Adapted from uBlock Origin's html-filtering.js
 *
 * Filters HTML elements BEFORE they're added to DOM by intercepting
 * document.write, innerHTML, and MutationObserver.
 *
 * Supports uBlock HTML filter syntax:
 *   example.com##^script[src*="ads"]
 *   example.com##^div.ad-container
 *   example.com##^iframe[id^="ad-"]
 *
 * The ##^ syntax means "remove this element from HTML before render"
 * ===================================================================== */

(() => {
  if (window.__novashieldHTMLFilter) return;
  window.__novashieldHTMLFilter = true;

  let activated = false;
  try { activated = localStorage.getItem("__novashield_activated") === "1"; } catch (e) {}

  window.addEventListener("__novashield_activation_changed", (e) => {
    activated = !!(e.detail && e.detail.activated);
    if (activated) startHTMLFiltering();
  });

  // HTML filter rules (domain -> array of selectors)
  // These are loaded from filter lists
  const htmlFilters = new Map();

  // Default HTML filters (always active)
  const DEFAULT_HTML_FILTERS = [
    // Block ad scripts in HTML
    'script[src*="doubleclick.net"]',
    'script[src*="googlesyndication.com"]',
    'script[src*="googleadservices.com"]',
    'script[src*="amazon-adsystem.com"]',
    'script[src*="adsystem.com"]',
    'script[src*="adsrvr.org"]',
    'script[src*="adnxs.com"]',
    'script[src*="criteo.com"]',
    'script[src*="taboola.com"]',
    'script[src*="outbrain.com"]',
    'script[src*="popads.net"]',
    'script[src*="popcash.net"]',
    'script[src*="adsterra.com"]',
    'script[src*="hilltopads.net"]',
    'script[src*="adcash.com"]',
    'script[src*="exoclick.com"]',
    'script[src*="juicyads.com"]',
    'script[src*="quge5.com"]',
    'script[src*="monetag.com"]',
    'script[src*="momrollback.com"]',
    'script[src*="propellerads.com"]',
    // Block ad iframes
    'iframe[src*="doubleclick.net"]',
    'iframe[src*="googlesyndication.com"]',
    'iframe[src*="amazon-adsystem.com"]',
    'iframe[src*="adnxs.com"]',
    // Block ad images
    'img[src*="doubleclick.net/adj/"]',
    'img[src*="googlesyndication.com/simgad/"]',
    // Block Monetag pattern
    'script[src*="/tag.min.js"]',
  ];

  function getCurrentHostname() {
    try { return window.location.hostname.replace(/^www\./, ""); }
    catch (e) { return ""; }
  }

  function getFiltersForHost(hostname) {
    const filters = [...DEFAULT_HTML_FILTERS];
    // Add domain-specific filters from map
    if (htmlFilters.has(hostname)) {
      filters.push(...htmlFilters.get(hostname));
    }
    return filters;
  }

  /* ================================================================== *
   * Remove HTML elements matching selectors BEFORE they execute
   * ================================================================== */
  function removeAdElements(root) {
    if (!activated) return;
    const hostname = getCurrentHostname();
    if (!hostname) return;

    const filters = getFiltersForHost(hostname);
    if (filters.length === 0) return;

    const selector = filters.join(",");
    try {
      const elements = (root || document).querySelectorAll(selector);
      let removed = 0;
      elements.forEach((el) => {
        try {
          // For scripts, check if it already executed (can't prevent)
          if (el.tagName === "SCRIPT" && el.src) {
            // Just remove - may have already run but prevents re-execution
          }
          el.remove();
          removed++;
        } catch (e) {}
      });
      if (removed > 0) {
        console.log(`[NovaShield][HTML] Removed ${removed} ad elements`);
        // Notify counter
        try {
          window.dispatchEvent(new CustomEvent("__novashield_blocked_request", {
            detail: { type: "html_filter", count: removed }
          }));
        } catch (e) {}
      }
    } catch (e) {}
  }

  /* ================================================================== *
   * Intercept document.write (legacy ad script injection)
   * ================================================================== */
  function interceptDocumentWrite() {
    const origWrite = document.write.bind(document);
    const origWriteln = document.writeln.bind(document);

    function filterAndWrite(text) {
      if (!activated) return origWrite(text);
      // Check if the markup contains ad scripts
      if (typeof text === "string") {
        const hasAd = /adsbygoogle|googlesyndication|doubleclick|pagead|adsystem/i.test(text);
        if (hasAd) {
          console.log("[NovaShield][HTML] Blocked document.write with ad script");
          return; // Skip writing
        }
      }
      return origWrite(text);
    }

    document.write = filterAndWrite;
    document.writeln = function (text) {
      if (!activated) return origWriteln(text);
      if (typeof text === "string") {
        const hasAd = /adsbygoogle|googlesyndication|doubleclick|pagead|adsystem/i.test(text);
        if (hasAd) {
          console.log("[NovaShield][HTML] Blocked document.writeln with ad script");
          return;
        }
      }
      return origWriteln(text);
    };
  }

  /* ================================================================== *
   * Intercept Element.innerHTML setter (dynamic ad injection)
   * ================================================================== */
  function interceptInnerHTML() {
    const origDesc = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
    if (!origDesc || !origDesc.set) return;

    Object.defineProperty(Element.prototype, "innerHTML", {
      get: origDesc.get,
      set: function (value) {
        if (activated && typeof value === "string") {
          // Quick check for ad patterns
          if (/adsbygoogle\.push|googlesyndication\.com\/pagead/i.test(value)) {
            console.log("[NovaShield][HTML] Blocked innerHTML with ad script");
            return;
          }
        }
        origDesc.set.call(this, value);
      },
      configurable: true,
    });
  }

  /* ================================================================== *
   * MutationObserver: remove ad elements added dynamically
   * ================================================================== */
  let mutationThrottle = false;
  function setupMutationObserver() {
    const obs = new MutationObserver((mutations) => {
      if (mutationThrottle || !activated) return;
      let hasNew = false;
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length > 0) {
          hasNew = true;
          break;
        }
      }
      if (!hasNew) return;

      mutationThrottle = true;
      setTimeout(() => {
        mutationThrottle = false;
        removeAdElements(document);
      }, 100);
    });

    if (document.documentElement) {
      try {
        obs.observe(document.documentElement, {
          childList: true,
          subtree: true,
        });
      } catch (e) {}
    }
  }

  /* ================================================================== *
   * Start HTML filtering
   * ================================================================== */
  function startHTMLFiltering() {
    if (!activated) return;

    // Intercept document.write immediately (before any script runs)
    interceptDocumentWrite();

    // Intercept innerHTML
    try { interceptInnerHTML(); } catch (e) {}

    // Initial scan
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        removeAdElements(document);
        setupMutationObserver();
      });
    } else {
      removeAdElements(document);
      setupMutationObserver();
    }

    // Also scan on head/body parse
    const scanHead = () => {
      if (document.head) {
        removeAdElements(document.head);
      } else {
        setTimeout(scanHead, 10);
      }
    };
    scanHead();

    console.info("[NovaShield][HTML] Filtering engine aktif");
  }

  // Listen for filter list updates from background
  window.addEventListener("__novashield_html_filters", (e) => {
    if (e.detail && e.detail.filters) {
      const hostname = e.detail.hostname || getCurrentHostname();
      htmlFilters.set(hostname, e.detail.filters);
    }
  });

  // Auto-start if activated
  if (activated) {
    startHTMLFiltering();
  }
})();
