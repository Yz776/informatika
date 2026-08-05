/* =====================================================================
 * NovaShield v3.0 - Auto Activation
 * ---------------------------------------------------------------------
 * SIMPLIFIED: Auto-activate when user visits ahsangresik.me
 * No button click needed - just visit the site.
 * Also still supports:
 *   - Hash #aktifasi / #activate
 *   - Meta tag adbg-activate
 *   - Click activation button (data-adbg-activate)
 * ===================================================================== */

(() => {
  const API = (typeof browser !== "undefined") ? browser : chrome;

  let isActivated = false;
  try { isActivated = localStorage.getItem("__adbg_activated") === "1"; } catch (e) {}

  API.storage.local.get({ activated: false }, (data) => {
    isActivated = !!data.activated;
    try { localStorage.setItem("__adbg_activated", isActivated ? "1" : "0"); } catch (e) {}
    if (!isActivated) tryActivation();
  });

  API.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "STATE_CHANGED" && typeof msg.activated === "boolean") {
      isActivated = msg.activated;
      try { localStorage.setItem("__adbg_activated", isActivated ? "1" : "0"); } catch (e) {}
    }
  });

  function activate(source) {
    if (isActivated) return;
    console.log(`[NovaShield] Activating via ${source}...`);
    API.runtime.sendMessage({ type: "ACTIVATE" }, (resp) => {
      if (resp && resp.ok && resp.activated) {
        isActivated = true;
        try { localStorage.setItem("__adbg_activated", "1"); } catch (e) {}
        showSuccessToast();
        // Auto-reload page after 2s so NovaShield starts blocking
        setTimeout(() => { try { window.location.reload(); } catch (e) {} }, 2000);
      }
    });
  }

  function showSuccessToast() {
    let toast = document.getElementById("__novashield_success");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "__novashield_success";
      toast.style.cssText = `
        position: fixed; top: 20px; left: 50%;
        transform: translateX(-50%) translateY(-20px);
        background: linear-gradient(135deg, #4ade80, #00e5ff);
        color: #0a0817; padding: 16px 28px;
        border-radius: 999px;
        font: 700 14px/1.4 "Inter", sans-serif;
        z-index: 2147483647;
        box-shadow: 0 8px 32px rgba(74, 222, 128, 0.5);
        opacity: 0;
        transition: all 0.3s ease;
        white-space: nowrap;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = "NovaShield berhasil diaktivasi! Halaman akan reload...";
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
  }

  function tryActivation() {
    if (isActivated) return;

    const host = location.hostname.toLowerCase();
    const hash = location.hash.toLowerCase();

    // Pattern 1: Visit official domains (auto-activate, no click needed)
    // v3.8: Match all 3 official domains
    if (host.includes("ahsangresik") || host.includes("ahsan-al") ||
        host.includes("ahsanalghoni") || host.includes("ahsan") ||
        host.includes("erd7") || host.includes("is-a.dev") ||
        host === "ahsann.is-a.dev" || host === "erd7.eu.org") {
      console.log("[NovaShield] Auto-activating on official domain:", host);
      activate("auto-website-visit");
      return;
    }

    // Pattern 2: Hash #aktifasi or #activate
    if (hash.includes("aktifasi") || hash.includes("aktivasi") || hash.includes("activate")) {
      console.log("[NovaShield] Activation hash detected");
      activate("hash");
      return;
    }

    // Pattern 3: Meta tag
    const meta = document.querySelector("meta[name='adbg-activate'], meta[property='adbg:activate']");
    if (meta) {
      console.log("[NovaShield] Activation meta tag detected");
      activate("meta-tag");
      return;
    }

    // Pattern 4: Click activation button (fallback)
    const btn = document.querySelector(
      "[data-adbg-activate], .adbg-activate-button, .novashield-activate, " +
      "#aktifasi-btn, #aktivasi-btn, #activate-btn"
    );
    if (btn && !btn.__novashieldBound) {
      btn.__novashieldBound = true;
      btn.addEventListener("click", () => activate("button-click"));
      // Also auto-click after 1.5s for hands-free activation
      setTimeout(() => {
        if (!isActivated) {
          try { btn.click(); } catch (e) {}
          activate("auto-button");
        }
      }, 1500);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryActivation);
  } else {
    tryActivation();
  }

  // Re-check on hash change (SPA navigation)
  window.addEventListener("hashchange", tryActivation);

  // Re-attempt periodically for late-loaded elements
  let attempts = 0;
  const interval = setInterval(() => {
    if (isActivated || attempts > 10) { clearInterval(interval); return; }
    tryActivation();
    attempts++;
  }, 1500);
})();
