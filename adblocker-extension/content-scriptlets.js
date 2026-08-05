/* =====================================================================
 * NovaShield v3.6 - Scriptlet Injection Engine (MAIN world)
 * ---------------------------------------------------------------------
 * Adapted from uBlock Origin's scriptlet-filtering architecture.
 *
 * Scriptlets are small JS functions injected into page MAIN world
 * to neutralize ad scripts at runtime. This is uBlock's most powerful
 * feature - it can override window properties, block eval, prevent
 * fetch/XHR, spoof constants, etc.
 *
 * Supported scriptlets (adapted from uBO):
 *   - set-constant: Override any window property value
 *   - abort-on-property-read: Crash script that reads blocked property
 *   - abort-on-property-write: Crash script that writes blocked property
 *   - prevent-addEventListener: Block event listener registration
 *   - prevent-fetch: Intercept fetch() calls
 *   - prevent-xhr: Intercept XMLHttpRequest
 *   - prevent-setTimeout: Block setTimeout for ad patterns
 *   - prevent-setInterval: Block setInterval for ad patterns
 *   - prevent-evil: Block eval()
 *   - noeval-if: Block eval if matches pattern
 *   - remove-attr: Remove HTML attributes
 *   - set-cookie: Override document.cookie
 *   - nowebrtc: Block WebRTC entirely
 *   - window.open-defuser: Block window.open
 *   - json-prune: Remove keys from JSON responses
 * ===================================================================== */

(() => {
  if (window.__novashieldScriptlets) return;
  window.__novashieldScriptlets = true;

  const activated = true; // v4.0: always activated

  window.addEventListener("__novashield_activation_changed", (e) => {
    activated = !!(e.detail && e.detail.activated);
    if (activated) applyAll();
  });
  window.dispatchEvent(new CustomEvent("__novashield_state_request"));

  // Helper: safe self (adapted from uBO safe-self.js)
  const safe = {
    Object: Object,
    Object_defineProperty: Object.defineProperty,
    Object_getOwnPropertyDescriptor: Object.getOwnPropertyDescriptor,
    log: console.log.bind(console),
    err: console.error.bind(console),
    JSON_parse: JSON.parse,
    JSON_stringify: JSON.stringify,
    makeLogPrefix(...args) {
      return "[NovaShield][Scriptlet] " + args.join(" ");
    },
    uboLog(prefix, msg) {
      try { this.log(prefix, msg); } catch (e) {}
    },
    uboErr(prefix, err) {
      try { this.err(prefix, err); } catch (e) {}
    },
    getExtraArgs(args, offset = 0) {
      const extra = {};
      for (let i = offset; i < args.length; i += 2) {
        if (typeof args[i] !== "string") break;
        extra[args[i]] = args[i + 1];
      }
      return extra;
    },
  };

  /* ================================================================== *
   * 1. set-constant: Override window property
   *    e.g., set-constant, canRunAds, true
   * ================================================================== */
  function validateConstant(raw) {
    if (raw === "undefined") return undefined;
    if (raw === "false") return false;
    if (raw === "true") return true;
    if (raw === "null") return null;
    if (raw === "''" || raw === "") return "";
    if (raw === "[]") return [];
    if (raw === "{}") return {};
    if (raw === "noopFunc") return function () {};
    if (raw === "trueFunc") return function () { return true; };
    if (raw === "falseFunc") return function () { return false; };
    if (raw === "throwFunc") return function () { throw ""; };
    if (/^-?\d+$/.test(raw)) return parseInt(raw, 10);
    return raw;
  }

  function setConstant(chain, rawValue) {
    if (!chain) return;
    const logPrefix = safe.makeLogPrefix("set-constant", chain, rawValue);
    const normalValue = validateConstant(rawValue);
    const parts = chain.split(".");
    const trappedProp = parts[parts.length - 1];

    function trapChain(owner, idx) {
      if (idx === parts.length - 1) {
        try {
          safe.Object_defineProperty(owner, trappedProp, {
            get: () => normalValue,
            set: () => {},
            configurable: true,
          });
          safe.uboLog(logPrefix, "Trap installed");
        } catch (ex) {
          safe.uboErr(logPrefix, ex);
        }
        return;
      }
      const prop = parts[idx];
      let v = owner[prop];
      if (v == null || typeof v !== "object") {
        try {
          safe.Object_defineProperty(owner, prop, {
            get: () => v,
            set: (a) => {
              v = a;
              if (a && typeof a === "object") trapChain(a, idx + 1);
            },
            configurable: true,
          });
        } catch (ex) {}
      } else {
        trapChain(v, idx + 1);
      }
    }
    trapChain(window, 0);
  }

  /* ================================================================== *
   * 2. abort-on-property-read: Throw when script reads property
   * ================================================================== */
  function abortOnPropertyRead(chain) {
    if (!chain) return;
    const logPrefix = safe.makeLogPrefix("abort-on-property-read", chain);
    const parts = chain.split(".");
    function trapChain(owner, idx) {
      if (idx === parts.length - 1) {
        const prop = parts[idx];
        const desc = safe.Object_getOwnPropertyDescriptor(owner, prop);
        try {
          safe.Object_defineProperty(owner, prop, {
            get: () => {
              safe.uboLog(logPrefix, "Aborted");
              throw new ReferenceError(chain + " is not defined");
            },
            set: (a) => {
              try { safe.Object_defineProperty(owner, prop, { value: a, writable: true, configurable: true, enumerable: true }); } catch (e) {}
            },
            configurable: true,
          });
        } catch (ex) {}
        return;
      }
      const prop = parts[idx];
      const v = owner[prop];
      if (v && typeof v === "object") trapChain(v, idx + 1);
    }
    trapChain(window, 0);
  }

  /* ================================================================== *
   * 3. abort-on-property-write: Throw when script writes property
   * ================================================================== */
  function abortOnPropertyWrite(chain) {
    if (!chain) return;
    const logPrefix = safe.makeLogPrefix("abort-on-property-write", chain);
    try {
      safe.Object_defineProperty(window, chain, {
        set: () => {
          safe.uboLog(logPrefix, "Aborted");
          throw new TypeError("Cannot assign to read only property '" + chain + "'");
        },
        get: () => undefined,
        configurable: true,
      });
    } catch (ex) {}
  }

  /* ================================================================== *
   * 4. prevent-addEventListener: Block event listener for specific patterns
   * ================================================================== */
  function preventAddEventListener(target, pattern) {
    const logPrefix = safe.makeLogPrefix("prevent-addEventListener", target, pattern);
    const orig = EventTarget.prototype.addEventListener;
    const re = pattern ? new RegExp(pattern) : null;
    EventTarget.prototype.addEventListener = function (type, listener, opts) {
      if (type === target || (re && re.test(type))) {
        safe.uboLog(logPrefix, "Blocked: " + type);
        return;
      }
      return orig.call(this, type, listener, opts);
    };
  }

  /* ================================================================== *
   * 5. prevent-fetch: Intercept fetch() with pattern matching
   * ================================================================== */
  function preventFetch(pattern, responseType) {
    const logPrefix = safe.makeLogPrefix("prevent-fetch", pattern);
    const orig = window.fetch;
    const re = pattern ? new RegExp(pattern) : null;
    window.fetch = function (input, init) {
      const url = typeof input === "string" ? input : (input && input.url) || String(input);
      if (!re || re.test(url)) {
        safe.uboLog(logPrefix, "Blocked: " + url.substring(0, 100));
        // Notify counter
        try {
          window.dispatchEvent(new CustomEvent("__novashield_blocked_request", {
            detail: { type: "scriptlet-fetch", url }
          }));
        } catch (e) {}
        return Promise.resolve(new Response("", {
          status: 200,
          statusText: "OK",
          headers: { "Content-Type": responseType || "application/octet-stream" }
        }));
      }
      return orig.apply(this, arguments);
    };
  }

  /* ================================================================== *
   * 6. prevent-xhr: Intercept XMLHttpRequest
   * ================================================================== */
  function preventXhr(pattern) {
    const logPrefix = safe.makeLogPrefix("prevent-xhr", pattern);
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    const re = pattern ? new RegExp(pattern) : null;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      this.__ns_xhr_url = url;
      this.__ns_xhr_blocked = re && re.test(url);
      return origOpen.call(this, method, url, ...rest);
    };
    XMLHttpRequest.prototype.send = function (body) {
      if (this.__ns_xhr_blocked) {
        safe.uboLog(logPrefix, "Blocked: " + String(this.__ns_xhr_url).substring(0, 100));
        try {
          Object.defineProperty(this, "readyState", { value: 4, configurable: true });
          Object.defineProperty(this, "status", { value: 200, configurable: true });
          Object.defineProperty(this, "responseText", { value: "", configurable: true });
          Object.defineProperty(this, "response", { value: "", configurable: true });
        } catch (e) {}
        setTimeout(() => {
          try { if (this.onreadystatechange) this.onreadystatechange(); } catch (e) {}
          try { if (this.onload) this.onload(); } catch (e) {}
          try { this.dispatchEvent(new Event("load")); this.dispatchEvent(new Event("loadend")); } catch (e) {}
        }, 5);
        return;
      }
      return origSend.call(this, body);
    };
  }

  /* ================================================================== *
   * 7. prevent-setTimeout: Block setTimeout matching pattern
   * ================================================================== */
  function preventSetTimeout(pattern) {
    const logPrefix = safe.makeLogPrefix("prevent-setTimeout", pattern);
    const orig = window.setTimeout;
    const re = pattern ? new RegExp(pattern) : null;
    window.setTimeout = function (cb, delay, ...args) {
      const cbStr = typeof cb === "function" ? cb.toString() : String(cb);
      if (re && re.test(cbStr)) {
        safe.uboLog(logPrefix, "Blocked");
        return 0;
      }
      return orig.call(this, cb, delay, ...args);
    };
  }

  /* ================================================================== *
   * 8. prevent-setInterval: Block setInterval matching pattern
   * ================================================================== */
  function preventSetInterval(pattern) {
    const logPrefix = safe.makeLogPrefix("prevent-setInterval", pattern);
    const orig = window.setInterval;
    const re = pattern ? new RegExp(pattern) : null;
    window.setInterval = function (cb, delay, ...args) {
      const cbStr = typeof cb === "function" ? cb.toString() : String(cb);
      if (re && re.test(cbStr)) {
        safe.uboLog(logPrefix, "Blocked");
        return 0;
      }
      return orig.call(this, cb, delay, ...args);
    };
  }

  /* ================================================================== *
   * 9. noeval / prevent-eval: Block eval entirely
   * ================================================================== */
  function preventEval() {
    const logPrefix = safe.makeLogPrefix("noeval");
    window.eval = function (code) {
      safe.uboLog(logPrefix, "Blocked eval");
      return undefined;
    };
  }

  function noevalIf(pattern) {
    const logPrefix = safe.makeLogPrefix("noeval-if", pattern);
    const orig = window.eval;
    const re = pattern ? new RegExp(pattern) : null;
    window.eval = function (code) {
      const codeStr = String(code);
      if (!re || re.test(codeStr)) {
        safe.uboLog(logPrefix, "Blocked");
        return undefined;
      }
      return orig.call(this, code);
    };
  }

  /* ================================================================== *
   * 10. remove-attr: Remove HTML attributes from elements
   * ================================================================== */
  function removeAttr(attr, selector = "*") {
    const logPrefix = safe.makeLogPrefix("remove-attr", attr, selector);
    const remove = () => {
      try {
        document.querySelectorAll(selector).forEach((el) => {
          if (el.hasAttribute(attr)) {
            el.removeAttribute(attr);
            safe.uboLog(logPrefix, "Removed " + attr);
          }
        });
      } catch (e) {}
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", remove);
    } else {
      remove();
    }
    // Re-run for dynamically added elements
    const obs = new MutationObserver(() => remove());
    if (document.documentElement) {
      try { obs.observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
    }
  }

  /* ================================================================== *
   * 11. nowebrtc: Block WebRTC entirely
   * ================================================================== */
  function noWebRTC() {
    const logPrefix = safe.makeLogPrefix("nowebrtc");
    try {
      window.RTCPeerConnection = undefined;
      window.webkitRTCPeerConnection = undefined;
      window.mozRTCPeerConnection = undefined;
      safe.uboLog(logPrefix, "WebRTC blocked");
    } catch (e) {}
  }

  /* ================================================================== *
   * 12. window.open-defuser: Block window.open
   * ================================================================== */
  function windowOpenDefuser(pattern) {
    const logPrefix = safe.makeLogPrefix("window.open-defuser", pattern);
    const orig = window.open;
    const re = pattern ? new RegExp(pattern) : null;
    window.open = function (url, target, features) {
      if (!re || re.test(String(url))) {
        safe.uboLog(logPrefix, "Blocked: " + String(url).substring(0, 100));
        return null;
      }
      return orig.call(this, url, target, features);
    };
  }

  /* ================================================================== *
   * 13. json-prune: Remove keys from JSON (for fetch/XHR responses)
   * ================================================================== */
  function jsonPrune(responsePattern, pruneKeys) {
    const logPrefix = safe.makeLogPrefix("json-prune", responsePattern, pruneKeys);
    const keys = pruneKeys.split(",").map((k) => k.trim());
    const origParse = JSON.parse;
    JSON.parse = function (text, reviver) {
      const result = origParse.call(this, text, reviver);
      if (result && typeof result === "object") {
        let modified = false;
        for (const key of keys) {
          if (result[key] !== undefined) {
            delete result[key];
            modified = true;
          }
        }
        if (modified) safe.uboLog(logPrefix, "Pruned keys");
      }
      return result;
    };
  }

  /* ================================================================== *
   * 14. spoof-css: Override getComputedStyle for specific elements
   * ================================================================== */
  function spoofCSS(selector, prop, value) {
    const logPrefix = safe.makeLogPrefix("spoof-css", selector, prop, value);
    const orig = window.getComputedStyle;
    window.getComputedStyle = function (elt, pseudoElt) {
      const cs = orig.call(this, elt, pseudoElt);
      try {
        if (elt && elt.matches && elt.matches(selector)) {
          return new Proxy(cs, {
            get(target, p) {
              if (p === prop) return value;
              if (p in target) return target[p];
              return undefined;
            },
          });
        }
      } catch (e) {}
      return cs;
    };
  }

  /* ================================================================== *
   * REGISTRY: Map scriptlet names to functions
   * ================================================================== */
  const scriptletRegistry = {
    "set-constant": setConstant,
    "set.js": setConstant,
    "abort-on-property-read": abortOnPropertyRead,
    "abort-on-property-write": abortOnPropertyWrite,
    "prevent-addEventListener": preventAddEventListener,
    "addEventListener-defuser": preventAddEventListener,
    "prevent-fetch": preventFetch,
    "fetch-defuser": preventFetch,
    "prevent-xhr": preventXhr,
    "xhr-defuser": preventXhr,
    "prevent-setTimeout": preventSetTimeout,
    "setTimeout-defuser": preventSetTimeout,
    "prevent-setInterval": preventSetInterval,
    "setInterval-defuser": preventSetInterval,
    "noeval": preventEval,
    "prevent-eval": preventEval,
    "noeval-if": noevalIf,
    "remove-attr": removeAttr,
    "nowebrtc": noWebRTC,
    "window.open-defuser": windowOpenDefuser,
    "window.open-defuser.js": windowOpenDefuser,
    "json-prune": jsonPrune,
    "spoof-css": spoofCSS,
  };

  // Expose registry for external invocation
  window.__novashieldRunScriptlet = (name, ...args) => {
    const fn = scriptletRegistry[name];
    if (fn) {
      try {
        fn(...args);
        safe.uboLog("Executed scriptlet: " + name);
      } catch (e) {
        safe.uboErr("Scriptlet error: " + name, e);
      }
    } else {
      safe.uboErr("Unknown scriptlet: " + name);
    }
  };

  /* ================================================================== *
   * AUTO-INJECT: Common adblock bypass scriptlets (always on when activated)
   * These are equivalent to uBO's default scriptlet injection
   * ================================================================== */
  function applyAll() {
    // v4.0: always run

    // 1. Spoof common adblock detector constants
    setConstant("canRunAds", true);
    setConstant("isAdsDisplayed", true);
    setConstant("adblock", false);
    setConstant("adBlock", false);
    setConstant("adblockDetected", false);
    setConstant("adBlockDetected", false);
    setConstant("BlockAdBlock", function () { return { on: () => {}, onDetected: () => {}, onNotDetected: () => {}, check: () => {}, emitEvent: () => {} }; });
    setConstant("blockAdBlock", function () { return { on: () => {}, onDetected: () => {}, onNotDetected: () => {}, check: () => {}, emitEvent: () => {} }; });
    setConstant("fuckAdBlock", function () { return { on: () => {}, onDetected: () => {}, onNotDetected: () => {}, check: () => {} }; });
    setConstant("bab", null);
    setConstant("sniffAdBlock", null);
    setConstant("google_ad_block", 0);

    // 2. Abort on common adblock detection properties
    try {
      abortOnPropertyRead("adsBlocked");
      abortOnPropertyRead("__adblock_active");
    } catch (e) {}

    // 3. Prevent common ad scripts from running via eval
    noevalIf(/adsbygoogle|googlesyndication|doubleclick|adsystem/i);

    console.info("[NovaShield][Scriptlets] Engine aktif - 14 scriptlets registered");
  }

  applyAll();
})();
