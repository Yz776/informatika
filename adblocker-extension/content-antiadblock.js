/* =====================================================================
 * NovaShield v3.1 - Anti-Adblock Bypass (MAIN world) - STRENGTHENED
 * ===================================================================== */

(() => {
  if (window.__novashieldBypassInstalled) return;
  window.__novashieldBypassInstalled = true;

  let activated = false;
  try { activated = localStorage.getItem("__novashield_activated") === "1"; } catch (e) {}

  window.addEventListener("__novashield_activation_changed", (e) => {
    activated = !!(e.detail && e.detail.activated);
    if (activated) applyAll();
  });

  if (!activated) {
    console.info("[NovaShield] Anti-adblock standby (not activated)");
    return;
  }

  function applyAll() {
    /* 1. Spoof detector globals */
    const spoofFlags = {
      canRunAds: true, isAdsDisplayed: true, adblock: false, adBlock: false,
      AdBlock: false, ADBlock: false, adb: false, adblockDetector: false,
      blockAdBlock: false, BlockAdBlock: false, bab: false, bab_provider: null,
      adsAreShown: true, adsLoaded: true, __adblock_active: false,
      adblock_active: false, adBlockDetected: false, adblockDetected: false,
      // Additional spoofs for v3.1
      isAdBlockActive: false, hasAdBlock: false, adblockEnabled: false,
      __hasAdBlocker: false, adBlockerDetected: false, ABDetected: false,
      adBlockCheck: false, adblockCheck: false, adblocker: false, adblockerActive: false,
    };
    for (const [key, value] of Object.entries(spoofFlags)) {
      try {
        Object.defineProperty(window, key, {
          get: () => value, set: () => {}, configurable: true,
        });
      } catch (e) {}
    }
    try {
      Object.defineProperty(window, "google_ad_block", {
        get: () => 0, set: () => {}, configurable: true,
      });
    } catch (e) {}

    /* 2. Intercept fetch for ad probe URLs */
    const ORIGINAL_FETCH = window.fetch.bind(window);
    const PROBE_PATTERNS = [
      /\/ads\//i, /\/advert/i, /\/banner/i, /\/pagead\//i,
      /adsense/i, /doubleclick/i, /googlesyndication/i,
      /googleadservices/i, /amazon-adsystem/i, /adsystem/i,
      /\/adserver\//i, /adsterra/i, /adservice/i, /\/ad-/i,
      /adbanner/i, /advertisement/i, /\.ads\./i, /baits/i,
      /\/detect-adblock/i, /adblock-detect/i, /adblockdetect/i,
      /adblock-test/i, /ads-detect/i, /adsbanner/i, /show_ads/i,
      // Additional probe patterns v3.1
      /\/adblock\b/i, /\/adb-detector/i, /\/block-adblock/i,
      /fuckadblock/i, /blockadblock/i, /anti-adblock/i,
      /\/ad-test/i, /\/adcheck/i, /\/ads-check/i,
      /\/yie\/ysm/i, /\.adserver\./i, /\/adframe/i,
      /\/banner_ad/i, /\/adimage/i, /\/adview/i,
      /\/popunder/i, /\/popup-ad/i, /\/redirect-ad/i,
    ];

    function isProbeUrl(urlStr) {
      if (!urlStr) return false;
      try {
        const u = new URL(urlStr, window.location.href);
        for (const p of PROBE_PATTERNS) {
          if (p.test(u.href)) return true;
        }
        // Also check pathname for bait patterns
        const path = u.pathname.toLowerCase();
        if (/\/ads\/banner/i.test(path) || /\/ad\/detect/i.test(path)) return true;
        return false;
      } catch (e) { return false; }
    }

    window.fetch = function (input, init) {
      try {
        const url = (typeof input === "string") ? input :
                    (input && input.url) ? input.url : String(input);
        if (isProbeUrl(url)) {
          // Notify counter
          try {
            window.dispatchEvent(new CustomEvent("__novashield_blocked_request", {
              detail: { type: "fetch", url }
            }));
          } catch (e) {}
          return Promise.resolve(new Response("", {
            status: 200, statusText: "OK",
            headers: { "Content-Type": "application/octet-stream" }
          }));
        }
      } catch (e) {}
      return ORIGINAL_FETCH.apply(this, arguments);
    };

    /* 3. Intercept XHR */
    const ORIGINAL_XHR_OPEN = XMLHttpRequest.prototype.open;
    const ORIGINAL_XHR_SEND = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      this.__novashieldUrl = url;
      this.__novashieldIsProbe = isProbeUrl(url);
      return ORIGINAL_XHR_OPEN.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function (body) {
      if (this.__novashieldIsProbe) {
        Object.defineProperty(this, "readyState", { value: 4, configurable: true });
        Object.defineProperty(this, "status", { value: 200, configurable: true });
        Object.defineProperty(this, "statusText", { value: "OK", configurable: true });
        Object.defineProperty(this, "responseText", { value: "", configurable: true });
        Object.defineProperty(this, "response", { value: "", configurable: true });
        // Notify counter
        try {
          window.dispatchEvent(new CustomEvent("__novashield_blocked_request", {
            detail: { type: "xhr", url: this.__novashieldUrl }
          }));
        } catch (e) {}
        setTimeout(() => {
          try { if (typeof this.onreadystatechange === "function") this.onreadystatechange(); } catch (e) {}
          try { if (typeof this.onload === "function") this.onload(); } catch (e) {}
          try { this.dispatchEvent(new Event("load")); this.dispatchEvent(new Event("loadend")); } catch (e) {}
        }, 5);
        return;
      }
      return ORIGINAL_XHR_SEND.call(this, body);
    };

    /* 4. document.write defang */
    const ORIGINAL_DOC_WRITE = document.write.bind(document);
    document.write = function (markup) {
      if (typeof markup === "string" &&
          /adsbygoogle|googlesyndication|doubleclick|pagead|adsystem|adserver/i.test(markup)) return;
      return ORIGINAL_DOC_WRITE.apply(document, arguments);
    };

    const ORIGINAL_DOC_WRITELN = document.writeln.bind(document);
    document.writeln = function (markup) {
      if (typeof markup === "string" &&
          /adsbygoogle|googlesyndication|doubleclick|pagead|adsystem|adserver/i.test(markup)) return;
      return ORIGINAL_DOC_WRITELN.apply(document, arguments);
    };

    /* 5. Bait element offsetHeight spoof */
    const BAIT_FRAGMENTS = [
      "ad-banner", "ad_banner", "adsbox", "ad-container", "ad_box",
      "adbox", "adsense", "advert", "banner_ad", "banner-ad",
      "ad-placement", "adplacement", "pub_300x250", "pub_728x90",
      "text-ad", "text-ad-region", "textAd",
      // Additional v3.1
      "ad-slot", "ad_frame", "adframe", "adimage", "adimg",
      "ad_inner", "ad-outer", "ad-banner-1", "ad-banner-2",
      "google-ad", "googlead", "dfp-ad", "dfpad",
      "sponsored", "promo-box", "promoted",
    ];

    function isBaitElement(el) {
      if (!el || el.nodeType !== 1) return false;
      const cls = (el.className && typeof el.className === "string") ? el.className : "";
      const id = el.id || "";
      const test = (cls + " " + id).toLowerCase();
      for (const frag of BAIT_FRAGMENTS) if (test.includes(frag)) return true;
      return false;
    }

    const ORIGINAL_GETBOUNDS = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      const real = ORIGINAL_GETBOUNDS.apply(this, arguments);
      if (isBaitElement(this)) {
        return {
          ...real,
          width: real.width > 0 ? real.width : 1,
          height: real.height > 0 ? real.height : 1,
          right: (real.right || real.left + 1),
          bottom: (real.bottom || real.top + 1),
          x: real.x !== undefined ? real.x : real.left,
          y: real.y !== undefined ? real.y : real.top,
          toJSON: real.toJSON,
        };
      }
      return real;
    };

    const OFFSET_DESC = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
    const OFFSET_W_DESC = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
    const OFFSET_PARENT_DESC = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetParent");

    if (OFFSET_DESC && OFFSET_DESC.get) {
      try {
        Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
          get() {
            const real = OFFSET_DESC.get.call(this);
            if (isBaitElement(this) && real === 0) return 1;
            return real;
          }, configurable: true,
        });
      } catch (e) {}
    }
    if (OFFSET_W_DESC && OFFSET_W_DESC.get) {
      try {
        Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
          get() {
            const real = OFFSET_W_DESC.get.call(this);
            if (isBaitElement(this) && real === 0) return 1;
            return real;
          }, configurable: true,
        });
      } catch (e) {}
    }
    if (OFFSET_PARENT_DESC && OFFSET_PARENT_DESC.get) {
      try {
        Object.defineProperty(HTMLElement.prototype, "offsetParent", {
          get() {
            const real = OFFSET_PARENT_DESC.get.call(this);
            // For bait elements, return body as parent (non-null) to bypass checks
            if (isBaitElement(this) && !real) return document.body;
            return real;
          }, configurable: true,
        });
      } catch (e) {}
    }

    // Also override clientHeight/clientWidth (some detectors use these)
    const CLIENT_H_DESC = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
    const CLIENT_W_DESC = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
    if (CLIENT_H_DESC && CLIENT_H_DESC.get) {
      try {
        Object.defineProperty(HTMLElement.prototype, "clientHeight", {
          get() {
            const real = CLIENT_H_DESC.get.call(this);
            if (isBaitElement(this) && real === 0) return 1;
            return real;
          }, configurable: true,
        });
      } catch (e) {}
    }
    if (CLIENT_W_DESC && CLIENT_W_DESC.get) {
      try {
        Object.defineProperty(HTMLElement.prototype, "clientWidth", {
          get() {
            const real = CLIENT_W_DESC.get.call(this);
            if (isBaitElement(this) && real === 0) return 1;
            return real;
          }, configurable: true,
        });
      } catch (e) {}
    }

    /* 6. Defuse BlockAdBlock + fuckAdBlock + new libs */
    const noop = function () { return noop; };
    noop.prototype.on = noop; noop.prototype.onDetected = noop;
    noop.prototype.onNotDetected = noop; noop.prototype.clearEvent = noop;
    noop.prototype.check = noop; noop.prototype.emitEvent = noop;
    noop.prototype.addEvent = noop; noop.prototype.addEventCallback = noop;
    noop.prototype.getBait = noop; noop.prototype.getOption = noop;
    noop.prototype.setOption = noop; noop.prototype.stopLoop = noop;
    noop.prototype.kill = noop; noop.prototype.restart = noop;
    noop.prototype.destroy = noop;

    const defuseNames = [
      "blockAdBlock", "BlockAdBlock", "bab", "adblockDetector",
      "adblockDetect", "AdBlockDetector", "AdblockDetector",
      "adBlockDetector", "adsbygoogle",
      // v3.1 additions
      "fuckAdBlock", "FuckAdBlock", "fuckadblock",
      "adblockCheck", "AdblockCheck", "adBlockCheck",
      "antiAdBlock", "AntiAdBlock", "antiAdblock",
      "adblockerDetector", "AdblockerDetector",
      "adBlockerDetector", "AdBlockerDetector",
      "blockAdblock", "BlockAdblock",
      "sniffAdBlock", "SniffAdBlock",
      "adblockBait", "AdblockBait",
      "adblockTest", "AdblockTest",
      "detectAdblock", "DetectAdblock",
      "adblockRipper", "AdblockRipper",
    ];
    for (const n of defuseNames) {
      try {
        Object.defineProperty(window, n, {
          get: () => noop, set: () => {}, configurable: true,
        });
      } catch (e) {}
    }

    /* 7. document.hidden / visibilityState spoof (NEW v3.1) */
    // Some detectors check if document is hidden (assumes adblock hid something)
    try {
      Object.defineProperty(document, "hidden", {
        get: () => false, configurable: true,
      });
    } catch (e) {}
    try {
      Object.defineProperty(document, "webkitHidden", {
        get: () => false, configurable: true,
      });
    } catch (e) {}
    try {
      Object.defineProperty(document, "visibilityState", {
        get: () => "visible", configurable: true,
      });
    } catch (e) {}
    try {
      Object.defineProperty(document, "webkitVisibilityState", {
        get: () => "visible", configurable: true,
      });
    } catch (e) {}
    // Block visibilitychange events from triggering adblock logic
    const origAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, opts) {
      if (type === "visibilitychange") {
        // Wrap listener to ignore
        const wrapped = function (e) {
          // Only fire if actually visible
          if (document.visibilityState === "visible" || document.visibilityState === "unloaded") {
            try { listener.call(this, e); } catch (err) {}
          }
        };
        return origAddEventListener.call(this, type, wrapped, opts);
      }
      return origAddEventListener.call(this, type, listener, opts);
    };

    /* 8. IntersectionObserver spoof (NEW v3.1) */
    // Some detectors use IntersectionObserver to check if ad is visible
    if (window.IntersectionObserver) {
      const OrigIO = window.IntersectionObserver;
      function PatchedIO(callback, options) {
        const io = new OrigIO((entries, observer) => {
          // Spoof: report all bait elements as intersecting
          const spoofed = entries.map((entry) => {
            if (isBaitElement(entry.target)) {
              return {
                ...entry,
                isIntersecting: true,
                intersectionRatio: 1,
                isVisible: true,
              };
            }
            return entry;
          });
          callback(spoofed, observer);
        });
        return io;
      }
      PatchedIO.prototype = OrigIO.prototype;
      try { window.IntersectionObserver = PatchedIO; } catch (e) {}
    }

    /* 9. window.matchMedia spoof (NEW v3.1) */
    // Some detectors check for adblock via media queries
    if (window.matchMedia) {
      const origMatch = window.matchMedia.bind(window);
      window.matchMedia = function (query) {
        const result = origMatch(query);
        // If query looks adblock-related, force match
        if (/adblock|advertisement|ads/i.test(query)) {
          return {
            ...result,
            matches: false,
            media: query,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
            onchange: null,
          };
        }
        return result;
      };
    }

    /* 10. getComputedStyle spoof for ad elements (NEW v3.1) */
    const origGetComputedStyle = window.getComputedStyle.bind(window);
    window.getComputedStyle = function (elt, pseudoElt) {
      const cs = origGetComputedStyle(elt, pseudoElt);
      if (isBaitElement(elt)) {
        // Return a spoofed style that says element is visible
        return new Proxy(cs, {
          get(target, prop) {
            if (prop === "display") return "block";
            if (prop === "visibility") return "visible";
            if (prop === "opacity") return "1";
            if (prop === "height") return "1px";
            if (prop === "width") return "1px";
            return target[prop];
          }
        });
      }
      return cs;
    };

    /* 11. Block MutationObserver on ad containers (NEW v3.1) */
    // Some detectors observe their own ad elements to detect removal
    const OrigMO = window.MutationObserver;
    function PatchedMO(callback) {
      const mo = new OrigMO((mutations, observer) => {
        // Filter out mutations that are just our cosmetic hiding
        const filtered = mutations.filter((m) => {
          if (m.type === "attributes" && m.attributeName === "style") {
            // Check if the style change is just our display:none
            const target = m.target;
            if (target && target.style && target.style.display === "none") {
              // Could be our cosmetic filter, skip notification
              return false;
            }
          }
          return true;
        });
        if (filtered.length > 0) callback(filtered, observer);
      });
      return mo;
    }
    PatchedMO.prototype = OrigMO.prototype;
    try { window.MutationObserver = PatchedMO; } catch (e) {}

    /* 12. Remove body locks periodically */
    function removeBodyLocks() {
      try {
        [document.documentElement, document.body].forEach((el) => {
          if (!el) return;
          const st = el.style;
          if (st.overflowY === "hidden") {
            const hasOverlay = document.querySelector(
              ".novashield-overlay, .adblock-overlay, .adblock-modal, .adblock-warning, " +
              "[class*='adblock-'], .detect-adblock"
            );
            if (hasOverlay) {
              st.setProperty("overflow", "auto", "important");
              st.setProperty("position", "static", "important");
              st.setProperty("height", "auto", "important");
            }
          }
          if (st.pointerEvents === "none") {
            st.setProperty("pointer-events", "auto", "important");
          }
        });
      } catch (e) {}
    }
    setInterval(removeBodyLocks, 500);

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", removeBodyLocks);
    }
    window.addEventListener("load", removeBodyLocks);

    /* 13. Override document.createElement to tag ad elements (NEW v3.1) */
    // Some detectors create elements with specific classes and check if they exist later
    const origCreate = document.createElement.bind(document);
    document.createElement = function (tagName) {
      const el = origCreate(tagName);
      // Add a marker so we can detect bait elements even without explicit class
      try {
        Object.defineProperty(el, "__novashieldTracked", {
          value: true, configurable: false, writable: false, enumerable: false,
        });
      } catch (e) {}
      return el;
    };

    /* 14. setTimeout/setInterval interception (NEW v3.1) */
    // Some detectors use timers that re-check ad presence
    // We let them run, but our spoofing will keep reporting "ads visible"
    // No need to block - just log for debugging

    console.info("[NovaShield] Anti-adblock bypass v3.1 aktif di", window.location.hostname);
  }

  applyAll();
})();
