/* Adblock Gresik - Cosmetic Filtering + DOM Sweep */
(() => {
  const API = (typeof browser !== "undefined") ? browser : chrome;
  let enabled = true, cosmeticEnabled = true, activated = false;
  try { activated = localStorage.getItem("__adbg_activated") === "1"; } catch (e) {}

  API.storage.local.get({ enabled: true, cosmeticEnabled: true, activated: false }, (data) => {
    enabled = !!data.enabled;
    cosmeticEnabled = !!data.cosmeticEnabled;
    activated = !!data.activated;
    try { localStorage.setItem("__adbg_activated", activated ? "1" : "0"); } catch (e) {}
    if (activated && enabled && cosmeticEnabled) runCosmeticSweep();
  });

  API.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== "STATE_CHANGED") return;
    if (typeof msg.activated === "boolean") {
      activated = msg.activated;
      try { localStorage.setItem("__adbg_activated", activated ? "1" : "0"); } catch (e) {}
    }
    if (typeof msg.enabled === "boolean") enabled = msg.enabled;
    if (typeof msg.cosmetic === "boolean") cosmeticEnabled = msg.cosmetic;
    if (activated && enabled && cosmeticEnabled) runCosmeticSweep();
  });

  const EMPTY_AD_SELECTORS = [
    "ins.adsbygoogle:empty",
    "iframe[src='']:not([data-adblock-keep])",
    "div[id^='google_ads_iframe']:empty",
    "div[id^='div-gpt-ad']:empty",
    "div[class*='ad-']:empty",
    "div[class*='ads-']:empty",
    "ins[data-ad-client]:empty",
    "div[data-ad-slot]:empty",
  ].join(",");

  function runCosmeticSweep() {
    if (!activated || !enabled || !cosmeticEnabled) return;
    try {
      document.querySelectorAll(EMPTY_AD_SELECTORS).forEach((n) => { try { n.remove(); } catch (e) {} });
      document.querySelectorAll(
        "div:has(iframe[src*='doubleclick.net']), " +
        "div:has(iframe[src*='googlesyndication.com']), " +
        "div:has(iframe[src*='amazon-adsystem.com'])"
      ).forEach((n) => {
        try {
          const text = (n.textContent || "").trim();
          if (text.length < 30) n.style.setProperty("display", "none", "important");
        } catch (e) {}
      });
    } catch (e) {}
  }

  let sweepScheduled = false;
  function scheduleSweep() {
    if (sweepScheduled) return;
    sweepScheduled = true;
    setTimeout(() => { sweepScheduled = false; runCosmeticSweep(); }, 250);
  }

  function attachObserver() {
    if (!document.body) { setTimeout(attachObserver, 50); return; }
    const obs = new MutationObserver((mutations) => {
      if (!activated || !enabled || !cosmeticEnabled) return;
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length > 0) { scheduleSweep(); break; }
      }
    });
    try { obs.observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
  }
  attachObserver();

  // Anti-adblock DOM cleanup
  const ANTI_ADBLOCK_SELECTORS = [
    "[class*='adblock-warning']", "[class*='adblock-detected']",
    "[class*='adblock-message']", "[class*='adblock-notice']",
    "[class*='adblock-nag']", "[class*='adblock-modal']",
    "[class*='adblock-overlay']", "[class*='adblock-screen']",
    "[class*='adblock-fog']", "[class*='adblock-blur']",
    "[class*='please-disable']", "[class*='disable-adblock']",
    "[class*='ad-notice']",
    "[id*='adblock-warning']", "[id*='adblock-detected']",
    "[id*='adblock-message']", "[id*='adblock-notice']",
    "[id*='adblock-modal']", "[id*='adblock-overlay']",
    "[id*='adblock-screen']",
    ".detect-adblock", ".detected-adblock",
    ".abp-notice", ".abp-modal", ".abp-warning",
    ".ab-overlay", ".ab-fog", ".ab-blur",
  ].join(",");

  function runAntiAdblockCleanup() {
    if (!activated || !enabled) return;
    try {
      document.querySelectorAll(ANTI_ADBLOCK_SELECTORS).forEach((n) => { try { n.remove(); } catch (e) {} });
      [document.documentElement, document.body].forEach((el) => {
        if (!el) return;
        const cs = window.getComputedStyle(el);
        if (cs.overflowY === "hidden" || cs.position === "fixed") {
          el.style.setProperty("overflow", "auto", "important");
          el.style.setProperty("position", "static", "important");
          el.style.setProperty("height", "auto", "important");
          el.style.setProperty("max-height", "none", "important");
          el.classList.add("adblock-lock");
        }
        if (cs.pointerEvents === "none") el.style.setProperty("pointer-events", "auto", "important");
      });
    } catch (e) {}
  }

  let cleanupScheduled = false;
  function scheduleCleanup() {
    if (cleanupScheduled) return;
    cleanupScheduled = true;
    setTimeout(() => { cleanupScheduled = false; runAntiAdblockCleanup(); }, 350);
  }

  function attachAntiAdblockObserver() {
    if (!document.body) { setTimeout(attachAntiAdblockObserver, 50); return; }
    const obs = new MutationObserver((mutations) => {
      if (!activated || !enabled) return;
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length > 0) { scheduleCleanup(); break; }
      }
    });
    try { obs.observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
    runAntiAdblockCleanup();
    setTimeout(runAntiAdblockCleanup, 1000);
    setTimeout(runAntiAdblockCleanup, 3000);
    setTimeout(runAntiAdblockCleanup, 7000);
  }
  attachAntiAdblockObserver();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { runCosmeticSweep(); runAntiAdblockCleanup(); });
  } else { runCosmeticSweep(); runAntiAdblockCleanup(); }
  window.addEventListener("load", () => { runCosmeticSweep(); runAntiAdblockCleanup(); });
})();
