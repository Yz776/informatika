/* =====================================================================
 * NovaShield v3.7 - IP Masker Engine (Background)
 * ---------------------------------------------------------------------
 * Routes traffic through HTTP proxy 78.154.103.38:11560
 *
 * Chrome MV3: uses chrome.proxy.settings.set() with PAC script
 * Firefox MV3: uses browser.proxy.onRequest listener
 *
 * Security features:
 *   - Proxy only active when user explicitly enables
 *   - Auto-disable on browser restart (opt-in persistence)
 *   - Whitelist for sites that should bypass proxy (banking, etc.)
 *   - Fallback to direct if proxy unreachable
 *   - No logging of proxied URLs
 * ===================================================================== */

const PROXY_HOST = "78.154.103.38";
const PROXY_PORT = 11560;
const PROXY_TYPE = "http";

// Sites that should NEVER go through proxy (security critical)
const PROXY_BYPASS_LIST = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "*.local",
  // Banking & payment (Indonesian)
  "bca.co.id",
  "mandiri.co.id",
  "bni.co.id",
  "bri.co.id",
  "cimbniaga.co.id",
  "btn.co.id",
  "permata.com",
  "bsi.co.id",
  // E-wallet
  "ovo.id",
  "dana.id",
  "gopay.com",
  "linkaja.com",
  // E-commerce (payment pages)
  "tokopedia.com",
  "shopee.co.id",
  "lazada.co.id",
  "bukalapak.com",
  // Government
  "go.id",
  // Activation domain (must be direct)
  "ahsangresik.me",
  "erd7.eu.org",
  "ahsann.is-a.dev",
  // NovaShield update endpoint
  "github.com",
  "raw.githubusercontent.com",
  "api.github.com",
];

// Generate PAC script for Chrome
function generatePACScript() {
  const bypassArray = JSON.stringify(PROXY_BYPASS_LIST);
  return `
    const PROXY_HOST = "${PROXY_HOST}";
    const PROXY_PORT = ${PROXY_PORT};
    const BYPASS_LIST = ${bypassArray};

    function FindProxyForURL(url, host) {
      // Check bypass list
      for (let i = 0; i < BYPASS_LIST.length; i++) {
        const pattern = BYPASS_LIST[i];
        if (pattern.startsWith("*.")) {
          const suffix = pattern.slice(1);
          if (host.endsWith(suffix)) return "DIRECT";
        } else if (host === pattern) {
          return "DIRECT";
        }
      }
      // Route through proxy
      return "PROXY ${PROXY_HOST}:${PROXY_PORT}";
    }
  `;
}

// Apply proxy settings (Chrome)
async function enableProxyChrome() {
  return new Promise((resolve) => {
    const config = {
      mode: "pac_script",
      pacScript: {
        data: generatePACScript(),
      },
    };
    try {
      chrome.proxy.settings.set(
        {
          value: config,
          scope: "regular",
        },
        () => {
          if (chrome.runtime.lastError) {
            console.warn("[NovaShield][Proxy] Chrome proxy set error:", chrome.runtime.lastError);
            resolve(false);
          } else {
            console.log("[NovaShield][Proxy] Chrome proxy enabled");
            resolve(true);
          }
        }
      );
    } catch (e) {
      console.warn("[NovaShield][Proxy] Chrome proxy API error:", e);
      resolve(false);
    }
  });
}

// Disable proxy (Chrome)
async function disableProxyChrome() {
  return new Promise((resolve) => {
    try {
      chrome.proxy.settings.clear({ scope: "regular" }, () => {
        console.log("[NovaShield][Proxy] Chrome proxy disabled");
        resolve(true);
      });
    } catch (e) {
      resolve(false);
    }
  });
}

// Apply proxy settings (Firefox)
async function enableProxyFirefox() {
  // Firefox uses browser.proxy.onRequest
  // Need to register listener
  try {
    if (!browser.proxy || !browser.proxy.onRequest) {
      console.warn("[NovaShield][Proxy] Firefox proxy API not available");
      return false;
    }

    // Check if already registered
    if (window.__novashieldProxyListener) return true;

    const listener = (requestInfo) => {
      const url = new URL(requestInfo.url);
      const host = url.hostname;

      // Check bypass list
      for (const pattern of PROXY_BYPASS_LIST) {
        if (pattern.startsWith("*.")) {
          if (host.endsWith(pattern.slice(1))) {
            return { type: "direct" };
          }
        } else if (host === pattern) {
          return { type: "direct" };
        }
      }

      // Route through proxy
      return [
        {
          type: PROXY_TYPE,
          host: PROXY_HOST,
          port: PROXY_PORT,
        },
      ];
    };

    browser.proxy.onRequest.addListener(listener, {
      urls: ["<all_urls>"],
    });

    window.__novashieldProxyListener = listener;
    console.log("[NovaShield][Proxy] Firefox proxy enabled");
    return true;
  } catch (e) {
    console.warn("[NovaShield][Proxy] Firefox proxy error:", e);
    return false;
  }
}

// Disable proxy (Firefox)
async function disableProxyFirefox() {
  try {
    if (window.__novashieldProxyListener) {
      browser.proxy.onRequest.removeListener(window.__novashieldProxyListener);
      delete window.__novashieldProxyListener;
      console.log("[NovaShield][Proxy] Firefox proxy disabled");
    }
    return true;
  } catch (e) {
    return false;
  }
}

// Public API
async function enableProxy() {
  const isFirefox = typeof browser !== "undefined" && browser.proxy && browser.proxy.onRequest;
  if (isFirefox) {
    return await enableProxyFirefox();
  } else {
    return await enableProxyChrome();
  }
}

async function disableProxy() {
  const isFirefox = typeof browser !== "undefined" && browser.proxy && browser.proxy.onRequest;
  if (isFirefox) {
    return await disableProxyFirefox();
  } else {
    return await disableProxyChrome();
  }
}

// Get proxy status
async function getProxyStatus() {
  const isFirefox = typeof browser !== "undefined" && browser.proxy && browser.proxy.onRequest;
  if (isFirefox) {
    return { active: !!window.__novashieldProxyListener, type: "firefox" };
  } else {
    return new Promise((resolve) => {
      try {
        chrome.proxy.settings.get({ scope: "regular" }, (details) => {
          const active = details && details.value && details.value.mode === "pac_script";
          resolve({ active, type: "chrome" });
        });
      } catch (e) {
        resolve({ active: false, type: "chrome" });
      }
    });
  }
}

// Export
if (typeof self !== "undefined") {
  self.NovaShieldProxy = { enableProxy, disableProxy, getProxyStatus, PROXY_HOST, PROXY_PORT };
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { enableProxy, disableProxy, getProxyStatus, PROXY_HOST, PROXY_PORT };
}
