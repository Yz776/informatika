/* =====================================================================
 * NovaShield v3.1 - Popup & Redirect Blocker (MAIN world)
 * ---------------------------------------------------------------------
 * - Intercept window.open() to block popup ads
 * - Intercept window.location changes to block redirect ads
 * - Intercept alert/confirm/prompt from ad scripts
 * - Block meta refresh redirects to ad domains
 * - Track blocked popups/redirects for counter
 * ===================================================================== */

(() => {
  if (window.__novashieldPopupBlocker) return;
  window.__novashieldPopupBlocker = true;

  let activated = false;
  let enabled = true;
  let popupBlock = true;
  let redirectBlock = true;

  try { activated = localStorage.getItem("__novashield_activated") === "1"; } catch (e) {}

  // Listen for state updates from bridge
  window.addEventListener("__novashield_state", (e) => {
    if (!e.detail) return;
    if (typeof e.detail.activated !== "undefined") activated = !!e.detail.activated;
    if (typeof e.detail.enabled !== "undefined") enabled = !!e.detail.enabled;
    if (typeof e.detail.popupBlock !== "undefined") popupBlock = !!e.detail.popupBlock;
    if (typeof e.detail.redirectBlock !== "undefined") redirectBlock = !!e.detail.redirectBlock;
  });
  window.dispatchEvent(new CustomEvent("__novashield_state_request"));

  // Popup/ad URL patterns - check if a URL is an ad
  const AD_URL_PATTERNS = [
    /^https?:\/\/([^\/]*\.)?(doubleclick\.net|googlesyndication\.com|googleadservices\.com|googletagservices\.com|google-analytics\.com|googletagmanager\.com|adsense\.com|2mdn\.net)/i,
    /^https?:\/\/([^\/]*\.)?(amazon-adsystem\.com|aax\.amazon-adsystem)/i,
    /^https?:\/\/([^\/]*\.)?(facebook\.net|connect\.facebook\.net|an\.facebook\.com)/i,
    /^https?:\/\/([^\/]*\.)?(adnxs\.com|appnexus\.com|pubmatic\.com|rubiconproject\.com|openx\.net|criteo\.com|criteo\.net)/i,
    /^https?:\/\/([^\/]*\.)?(taboola\.com|outbrain\.com|revcontent\.com|mgid\.com|propellerads\.com)/i,
    /^https?:\/\/([^\/]*\.)?(popads\.net|popcash\.net|adsterra\.com|hilltopads\.net|adcash\.com)/i,
    /^https?:\/\/([^\/]*\.)?(exoclick\.com|exosrv\.com|juicyads\.com|trafficjunky\.net|trafficstars\.com)/i,
    /^https?:\/\/([^\/]*\.)?(adf\.ly|adfly\.com|shorte\.st|linkbucks\.com|popmyads\.com)/i,
    /^https?:\/\/([^\/]*\.)?(adsrvr\.org|thetradedesk\.com|demdex\.net|bluekai\.com|scorecardresearch\.com)/i,
    /^https?:\/\/([^\/]*\.)?(hotjar\.com|mixpanel\.com|segment\.io|amplitude\.com|fullstory\.com|logrocket\.com|clarity\.ms)/i,
    /^https?:\/\/([^\/]*\.)?(quantserve\.com|quantcount\.com|chartbeat\.com|chartbeat\.net)/i,
    /^https?:\/\/([^\/]*\.)?(adsafeprotected\.com|doubleverify\.com|moatads\.com|contextweb\.com)/i,
    /^https?:\/\/([^\/]*\.)?(spotxchange\.com|spotx\.tv|springserve\.com|smartadserver\.com)/i,
    /^https?:\/\/([^\/]*\.)?(coinhive\.com|coin-hive\.com|cryptoloot\.com|deepmine\.io|webmine\.cz)/i,
    /^https?:\/\/([^\/]*\.)?(redirectingat\.com|go\.redirectingat\.com|r\.skimresources\.com|skimresources\.com)/i,
    /^https?:\/\/([^\/]*\.)?(awin1\.com|affiliatewindow\.com|tradedoubler\.com|zanox\.com|linksynergy\.com|clickbank\.net|cj\.com)/i,
    /^https?:\/\/([^\/]*\.)?(bit\.ly|tinyurl\.com|t\.co|is\.gd|buff\.ly|rebrand\.ly)/i,
    /^https?:\/\/([^\/]*\.)?(paypal-secure-update|apple-id-locked|icloud-locked|microsoft-account-verify|google-account-alert|amazon-security-update)/i,
    /^https?:\/\/([^\/]*\.)?(fakeupdate\.net|fakevirus\.com|virus-alert\.com|pc-virus-alert\.com|microsoft-warning\.com)/i,
    /^https?:\/\/([^\/]*\.)?(bitcoin-free-giveaway|crypto-airdrop|metamask-secure|binance-secure-login|coinbase-verify)/i,
    /^https?:\/\/([^\/]*\.)?(microsoft-support-alert|windows-security-alert|apple-security-warning|virus-detected-remove|your-pc-is-infected)/i,
    /^https?:\/\/([^\/]*\.)?(norton-secure-update|mcafee-secure-update|kaspersky-secure-update|avast-secure-update)/i,
    // v3.2: Monetag network (quge*.com pattern + monetag domains)
    /^https?:\/\/quge\d+\.com/i,
    /^https?:\/\/([^\/]*\.)?(monetag\.com|monetag-cdn\.com|monetag\.io)/i,
    /^https?:\/\/([^\/]*\.)?(propellerads\.com|propeller-tracking\.com)/i,
    // v3.2: momrollback and similar
    /^https?:\/\/([^\/]*\.)?(momrollback\.com|momroll\.com|momroll\.net|rolfron\.com|rolback\.com)/i,
    /^https?:\/\/([^\/]*\.)?(clickadu\.com|clickadz\.com|clickfriction\.com|eddomo\.com|popcpm\.com|popmonetizer\.net)/i,
    /^https?:\/\/([^\/]*\.)?(perfectpointers\.com|pushpushgo\.com|pushnado\.com|push\.world|pushda\.com|pushads\.com|pushible\.com)/i,
    /^https?:\/\/([^\/]*\.)?(adultadworld\.com|adultmoda\.com|mobadult\.com|clicksor\.com|clicksor\.net)/i,
    // v3.2: Monetag tag.min.js pattern (NUMBER.com/NUMBER/tag.min.js)
    /^https?:\/\/[^\/]*\/\d+\/tag\.min\.js/i,
    // v3.2: momrollback UUID pattern (/XX/XX/XX/UUID.js)
    /^https?:\/\/[^\/]*\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{32}\.js/i,
    // Indonesian ad networks
    /^https?:\/\/([^\/]*\.)?(adstars\.co\.id|adplus\.id|ads\.tribunnews\.com|ads\.detik\.com|ads\.kompas\.com)/i,
    /^https?:\/\/([^\/]*\.)?(adserving\.id|adserver\.bisnis\.com|ads\.grid\.id|ads\.gridoto\.com|ads\.kontan\.co\.id)/i,
    // Generic /ad/ path patterns
    /\/ads\//i, /\/advert/i, /\/banner/i, /\/pagead\//i, /\/popunder\//i,
    /\/popup\//i, /\/redirect\//i, /\/clk\//i, /\/click\//i,
    // v3.2: adsbygoogle + show_ads
    /\/adsbygoogle\.js/i, /\/show_ads\.js/i, /\/tag\.min\.js/i,
  ];

  function isAdUrl(url) {
    if (!url || typeof url !== "string") return false;
    if (url.startsWith("javascript:") || url.startsWith("#") || url.startsWith("data:")) return false;
    for (const p of AD_URL_PATTERNS) {
      if (p.test(url)) return true;
    }
    return false;
  }

  function notifyBlocked(type, url) {
    try {
      window.dispatchEvent(new CustomEvent("__novashield_blocked_request", {
        detail: { type, url }
      }));
    } catch (e) {}
  }

  /* ================================================================== *
   * 1. window.open() interceptor
   * ================================================================== */
  if (typeof window.open === "function") {
    const originalOpen = window.open;
    window.open = function (url, target, features, replace) {
      // Allow blank opens (some sites use window.open() for blur effects)
      if (!url) return originalOpen.call(this, url, target, features, replace);

      const urlStr = typeof url === "string" ? url : (url && url.url) ? url.url : String(url);

      if (activated && enabled && popupBlock && isAdUrl(urlStr)) {
        console.log("[NovaShield] Blocked popup:", urlStr.substring(0, 100));
        notifyBlocked("popup", urlStr);
        // Return a fake window object so script doesn't crash
        return {
          closed: true,
          close: () => {},
          focus: () => {},
          blur: () => {},
          location: { href: "about:blank", replace: () => {}, assign: () => {} },
          opener: null,
          postMessage: () => {},
        };
      }
      return originalOpen.call(this, url, target, features, replace);
    };
  }

  /* ================================================================== *
   * 2. location.href / location.assign / location.replace interceptor
   * ================================================================== */
  if (window.location) {
    const loc = window.location;

    // Override location.assign
    const origAssign = loc.assign ? loc.assign.bind(loc) : null;
    if (origAssign) {
      loc.assign = function (url) {
        if (activated && enabled && redirectBlock && isAdUrl(url)) {
          console.log("[NovaShield] Blocked redirect (assign):", String(url).substring(0, 100));
          notifyBlocked("redirect", url);
          return;
        }
        return origAssign(url);
      };
    }

    // Override location.replace
    const origReplace = loc.replace ? loc.replace.bind(loc) : null;
    if (origReplace) {
      loc.replace = function (url) {
        if (activated && enabled && redirectBlock && isAdUrl(url)) {
          console.log("[NovaShield] Blocked redirect (replace):", String(url).substring(0, 100));
          notifyBlocked("redirect", url);
          return;
        }
        return origReplace(url);
      };
    }

    // Override location.href setter (this is the tricky one)
    try {
      const origHrefDesc = Object.getOwnPropertyDescriptor(window.Location.prototype, "href");
      if (origHrefDesc && origHrefDesc.set) {
        Object.defineProperty(window.Location.prototype, "href", {
          get: origHrefDesc.get,
          set: function (url) {
            if (activated && enabled && redirectBlock && isAdUrl(url)) {
              console.log("[NovaShield] Blocked redirect (href):", String(url).substring(0, 100));
              notifyBlocked("redirect", url);
              return;
            }
            origHrefDesc.set.call(this, url);
          },
          configurable: true,
        });
      }
    } catch (e) {
      // Some browsers don't allow overriding location.href
    }
  }

  /* ================================================================== *
   * 3. document.location setter (similar to window.location)
   * ================================================================== */
  try {
    const docLocDesc = Object.getOwnPropertyDescriptor(Document.prototype, "location");
    if (docLocDesc && docLocDesc.set) {
      Object.defineProperty(Document.prototype, "location", {
        get: docLocDesc.get,
        set: function (url) {
          if (activated && enabled && redirectBlock && isAdUrl(url)) {
            console.log("[NovaShield] Blocked redirect (document.location):", String(url).substring(0, 100));
            notifyBlocked("redirect", url);
            return;
          }
          docLocDesc.set.call(this, url);
        },
        configurable: true,
      });
    }
  } catch (e) {}

  /* ================================================================== *
   * 4. Meta refresh redirect blocker
   * ================================================================== */
  function blockMetaRefresh() {
    if (!activated || !enabled || !redirectBlock) return;
    document.querySelectorAll("meta[http-equiv='refresh' i]").forEach((meta) => {
      const content = meta.getAttribute("content") || "";
      // Parse: "5;url=https://example.com"
      const match = content.match(/url\s*=\s*['"]?([^'"\s]+)/i);
      if (match && match[1] && isAdUrl(match[1])) {
        console.log("[NovaShield] Blocked meta refresh:", match[1].substring(0, 100));
        meta.remove();
        notifyBlocked("redirect", match[1]);
      }
    });
  }

  // Run on DOM ready + periodically
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", blockMetaRefresh);
  } else {
    blockMetaRefresh();
  }
  setInterval(blockMetaRefresh, 2000);

  // MutationObserver for new meta refresh tags
  const metaObserver = new MutationObserver(() => {
    if (activated && enabled && redirectBlock) blockMetaRefresh();
  });
  if (document.documentElement) {
    try {
      metaObserver.observe(document.documentElement, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ["content", "http-equiv"],
      });
    } catch (e) {}
  }

  /* ================================================================== *
   * 5. alert/confirm/prompt interceptor (block ad-style dialogs)
   * ================================================================== */
  const origAlert = window.alert;
  const origConfirm = window.confirm;
  const origPrompt = window.prompt;

  window.alert = function (msg) {
    if (activated && enabled && popupBlock) {
      const msgStr = String(msg || "");
      // Block common ad-related alerts
      if (/your\ (computer|pc|phone|device)\ (has|is)\ (been\ )?(infected|compromised|locked)/i.test(msgStr) ||
          /call\ (microsoft|apple|windows|support)\ (now|immediately)/i.test(msgStr) ||
          /you\ (have|won|are)\ (won|a winner|the|a prize)/i.test(msgStr) ||
          /congratulations?\!/i.test(msgStr) ||
          /your\ (antivirus|security)\ (has|is)\ (expired|out\ of\ date)/i.test(msgStr) ||
          /(\d+)\s*viruses?\s*(found|detected)/i.test(msgStr) ||
          /iphone\s*13\s*pro/i.test(msgStr) ||
          /you\s*are\s*the\s*(\d+|next)\s*visitor/i.test(msgStr) ||
          /click\s*(ok|continue|allow)\s*to\s*(continue|proceed|verify)/i.test(msgStr)) {
        console.log("[NovaShield] Blocked alert:", msgStr.substring(0, 100));
        notifyBlocked("popup", "alert:" + msgStr.substring(0, 50));
        return;
      }
    }
    return origAlert.call(this, msg);
  };

  window.confirm = function (msg) {
    if (activated && enabled && popupBlock) {
      const msgStr = String(msg || "");
      if (/click\s*(ok|yes|continue)\s*to\s*(continue|proceed|verify|win|claim)/i.test(msgStr) ||
          /are\s*you\s*(sure|18)/i.test(msgStr) ||
          /do\s*you\s*want\s*to\s*(allow|enable|install)/i.test(msgStr) ||
          /congratulations/i.test(msgStr) ||
          /you\s*won/i.test(msgStr)) {
        console.log("[NovaShield] Blocked confirm:", msgStr.substring(0, 100));
        notifyBlocked("popup", "confirm:" + msgStr.substring(0, 50));
        return false;
      }
    }
    return origConfirm.call(this, msg);
  };

  window.prompt = function (msg, defaultValue) {
    if (activated && enabled && popupBlock) {
      const msgStr = String(msg || "");
      if (/enter\s*your\s*(email|phone|number|code|password)/i.test(msgStr) ||
          /you\s*(won|are\s*a\s*winner)/i.test(msgStr) ||
          /congratulations/i.test(msgStr)) {
        console.log("[NovaShield] Blocked prompt:", msgStr.substring(0, 100));
        notifyBlocked("popup", "prompt:" + msgStr.substring(0, 50));
        return null;
      }
    }
    return origPrompt.call(this, msg, defaultValue);
  };

  /* ================================================================== *
   * 6. window.showModalDialog (legacy popup blocker)
   * ================================================================== */
  if (window.showModalDialog) {
    const origShowModal = window.showModalDialog;
    window.showModalDialog = function (url, arg, options) {
      if (activated && enabled && popupBlock && isAdUrl(url)) {
        console.log("[NovaShield] Blocked showModalDialog:", String(url).substring(0, 100));
        notifyBlocked("popup", url);
        return null;
      }
      return origShowModal.call(this, url, arg, options);
    };
  }

  /* ================================================================== *
   * 7. window.openInTab / window.openTab (legacy browser APIs)
   * ================================================================== */
  if (window.openInTab) {
    const origOpenInTab = window.openInTab;
    window.openInTab = function (url, options) {
      if (activated && enabled && popupBlock && isAdUrl(url)) {
        console.log("[NovaShield] Blocked openInTab:", String(url).substring(0, 100));
        notifyBlocked("popup", url);
        return false;
      }
      return origOpenInTab.call(this, url, options);
    };
  }

  /* ================================================================== *
   * 8. Click event interception on ad links
   * ================================================================== */
  document.addEventListener("click", (e) => {
    if (!activated || !enabled || !redirectBlock) return;
    const target = e.target;
    if (!target) return;

    // Find closest anchor
    let anchor = target;
    while (anchor && anchor.tagName !== "A") {
      anchor = anchor.parentElement;
      if (!anchor || anchor === document.body) break;
    }

    if (anchor && anchor.tagName === "A") {
      const href = anchor.href || "";
      if (href && isAdUrl(href)) {
        // Don't block if user explicitly clicked (some legit uses)
        // But block if the link has suspicious attributes
        const target = anchor.target || "";
        if (target === "_blank" || target === "_new") {
          // Check if it's a hidden/forced redirect
          const style = window.getComputedStyle(anchor);
          if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
            console.log("[NovaShield] Blocked hidden ad link click:", href.substring(0, 100));
            e.preventDefault();
            e.stopPropagation();
            notifyBlocked("popup", href);
          }
        }
      }
    }
  }, true);

  console.info("[NovaShield] Popup & Redirect blocker aktif");
})();
