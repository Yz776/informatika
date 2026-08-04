/* NovaShield v2.1 - Anti-Adblock Bypass (MAIN world) */
(() => {
  if (window.__novaShieldBypassInstalled) return;
  window.__novaShieldBypassInstalled = true;

  // Check activation via localStorage (set by bridge)
  let activated = false;
  try { activated = localStorage.getItem("__novashield_activated") === "1"; } catch (e) {}

  // Listen for activation changes
  window.addEventListener("__novashield_activation_changed", (e) => {
    activated = !!(e.detail && e.detail.activated);
    if (activated) applyAll();
  });

  if (!activated) {
    console.info("[NovaShield] Anti-adblock standby (not activated)");
    return;
  }

  function applyAll() {
    // 1. Spoof detector globals
    const spoofFlags = {
      canRunAds: true, isAdsDisplayed: true, adblock: false, adBlock: false,
      AdBlock: false, ADBlock: false, adb: false, adblockDetector: false,
      blockAdBlock: false, BlockAdBlock: false, bab: false, bab_provider: null,
      adsAreShown: true, adsLoaded: true, __adblock_active: false,
      adblock_active: false, adBlockDetected: false, adblockDetected: false,
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

    // 2. Intercept fetch for ad probe URLs
    const ORIGINAL_FETCH = window.fetch.bind(window);
    const PROBE_PATTERNS = [
      /\/ads\//i, /\/advert/i, /\/banner/i, /\/pagead\//i,
      /adsense/i, /doubleclick/i, /googlesyndication/i,
      /googleadservices/i, /amazon-adsystem/i, /adsystem/i,
      /\/adserver\//i, /adsterra/i, /adservice/i, /\/ad-/i,
      /adbanner/i, /advertisement/i, /\.ads\./i, /baits/i,
      /\/detect-adblock/i, /adblock-detect/i, /adblockdetect/i,
      /adblock-test/i, /ads-detect/i, /adsbanner/i, /show_ads/i,
    ];

    function isProbeUrl(urlStr) {
      if (!urlStr) return false;
      try {
        const u = new URL(urlStr, window.location.href);
        for (const p of PROBE_PATTERNS) if (p.test(u.href)) return true;
        return false;
      } catch (e) { return false; }
    }

    window.fetch = function (input, init) {
      try {
        const url = (typeof input === "string") ? input :
                    (input && input.url) ? input.url : String(input);
        if (isProbeUrl(url)) {
          return Promise.resolve(new Response("", {
            status: 200, statusText: "OK",
            headers: { "Content-Type": "application/octet-stream" }
          }));
        }
      } catch (e) {}
      return ORIGINAL_FETCH.apply(this, arguments);
    };

    // 3. Intercept XHR
    const ORIGINAL_XHR_OPEN = XMLHttpRequest.prototype.open;
    const ORIGINAL_XHR_SEND = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      this.__adbgUrl = url;
      this.__adbgIsProbe = isProbeUrl(url);
      return ORIGINAL_XHR_OPEN.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function (body) {
      if (this.__adbgIsProbe) {
        Object.defineProperty(this, "readyState", { value: 4, configurable: true });
        Object.defineProperty(this, "status", { value: 200, configurable: true });
        Object.defineProperty(this, "statusText", { value: "OK", configurable: true });
        Object.defineProperty(this, "responseText", { value: "", configurable: true });
        Object.defineProperty(this, "response", { value: "", configurable: true });
        setTimeout(() => {
          try { if (typeof this.onreadystatechange === "function") this.onreadystatechange(); } catch (e) {}
          try { if (typeof this.onload === "function") this.onload(); } catch (e) {}
          try { this.dispatchEvent(new Event("load")); this.dispatchEvent(new Event("loadend")); } catch (e) {}
        }, 5);
        return;
      }
      return ORIGINAL_XHR_SEND.call(this, body);
    };

    // 4. document.write defang
    const ORIGINAL_DOC_WRITE = document.write.bind(document);
    document.write = function (markup) {
      if (typeof markup === "string" &&
          /adsbygoogle|googlesyndication|doubleclick|pagead/i.test(markup)) return;
      return ORIGINAL_DOC_WRITE.apply(document, arguments);
    };

    // 5. Bait element offsetHeight spoof
    const BAIT_FRAGMENTS = [
      "ad-banner", "ad_banner", "adsbox", "ad-container", "ad_box",
      "adbox", "adsense", "advert", "banner_ad", "banner-ad",
      "ad-placement", "adplacement", "pub_300x250", "pub_728x90",
      "text-ad", "text-ad-region", "textAd",
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

    // 6. Defuse BlockAdBlock etc.
    const noop = function () { return noop; };
    noop.prototype.on = noop; noop.prototype.onDetected = noop;
    noop.prototype.onNotDetected = noop; noop.prototype.clearEvent = noop;
    noop.prototype.check = noop; noop.prototype.emitEvent = noop;
    const names = ["blockAdBlock", "BlockAdBlock", "bab", "adblockDetector",
                   "adblockDetect", "AdBlockDetector", "AdblockDetector",
                   "adBlockDetector", "adsbygoogle"];
    for (const n of names) {
      try {
        Object.defineProperty(window, n, {
          get: () => noop, set: () => {}, configurable: true,
        });
      } catch (e) {}
    }

    // 7. Remove body locks periodically
    function removeBodyLocks() {
      try {
        [document.documentElement, document.body].forEach((el) => {
          if (!el) return;
          const st = el.style;
          if (st.overflowY === "hidden") {
            const hasOverlay = document.querySelector(
              ".adblock-overlay, .adblock-modal, .adblock-warning, " +
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
    setInterval(removeBodyLocks, 1000);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", removeBodyLocks);
    }
    window.addEventListener("load", removeBodyLocks);

    console.info("[NovaShield] Anti-adblock bypass aktif di", window.location.hostname);
  }

  applyAll();
})();
