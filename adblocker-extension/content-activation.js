/* =====================================================================
 * NovaShield v3.8.2 - Auto Activation (BULLETPROOF)
 * ---------------------------------------------------------------------
 * FIXES:
 *   - Consistent key name: __novashield_activated (was __adbg_activated)
 *   - Match ALL 3 official domains
 *   - Multi-trigger: hostname, hash, meta tag, button, manual
 *   - Aggressive retry (check every 500ms for 30s)
 *   - Broadcast activation to extension via runtime message
 * ===================================================================== */

(() => {
  const API = (typeof browser !== "undefined") ? browser : chrome;

  let isActivated = false;
  // Use CONSISTENT key name
  try { isActivated = localStorage.getItem("__novashield_activated") === "1"; } catch (e) {}

  API.storage.local.get({ activated: false }, (data) => {
    isActivated = !!data.activated;
    try { localStorage.setItem("__novashield_activated", isActivated ? "1" : "0"); } catch (e) {}
    if (!isActivated) tryActivation();
  });

  API.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "STATE_CHANGED" && typeof msg.activated === "boolean") {
      isActivated = msg.activated;
      try { localStorage.setItem("__novashield_activated", isActivated ? "1" : "0"); } catch (e) {}
    }
  });

  function activate(source) {
    if (isActivated) return;
    console.log(`[NovaShield][Activation] Activating via ${source}...`);

    // Set localStorage immediately (for same-origin fast check)
    try { localStorage.setItem("__novashield_activated", "1"); } catch (e) {}
    isActivated = true;

    // Send message to background to persist + apply
    try {
      API.runtime.sendMessage({ type: "ACTIVATE" }, (resp) => {
        if (resp && resp.ok && resp.activated) {
          console.log("[NovaShield][Activation] Background confirmed activation");
          showSuccessToast();
          // Reload page after 2s so NovaShield starts blocking
          setTimeout(() => {
            try { window.location.reload(); } catch (e) {}
          }, 2000);
        } else {
          console.warn("[NovaShield][Activation] Background did not confirm, retrying...");
          // Retry
          setTimeout(() => activate(source + "-retry"), 1000);
        }
      });
    } catch (e) {
      console.warn("[NovaShield][Activation] Message failed:", e);
      // Still show success since localStorage is set
      showSuccessToast();
    }
  }

  function showSuccessToast() {
    let toast = document.getElementById("__novashield_success_toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "__novashield_success_toast";
      toast.style.cssText = `
        position: fixed; top: 20px; left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: linear-gradient(135deg, #4ade80, #00e5ff);
        color: #0a0817; padding: 14px 28px;
        border-radius: 999px;
        font: 700 14px/1.4 "Inter", sans-serif;
        z-index: 2147483647;
        box-shadow: 0 8px 32px rgba(74, 222, 128, 0.5);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap;
        pointer-events: none;
      `;
      document.documentElement.appendChild(toast);
    }
    toast.textContent = "✓ NovaShield berhasil diaktivasi! Halaman akan reload...";
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    });
  }

  function tryActivation() {
    if (isActivated) return;

    const host = location.hostname.toLowerCase().replace(/^www\./, "");
    const hash = location.hash.toLowerCase();

    console.log("[NovaShield][Activation] Checking activation on:", host);

    // Pattern 1: Visit official domains (auto-activate)
    const officialDomains = [
      "ahsangresik.me",
      "erd7.eu.org",
      "ahsann.is-a.dev",
    ];

    const isOfficial = officialDomains.some((d) =>
      host === d || host.endsWith("." + d)
    ) || host.includes("ahsangresik") || host.includes("erd7") ||
      host.includes("is-a.dev") || host.includes("ahsan");

    if (isOfficial) {
      console.log("[NovaShield][Activation] Official domain detected:", host);
      activate("auto-website-visit");
      return;
    }

    // Pattern 2: Hash #aktifasi or #activate
    if (hash.includes("aktifasi") || hash.includes("aktivasi") || hash.includes("activate")) {
      console.log("[NovaShield][Activation] Activation hash detected");
      activate("hash");
      return;
    }

    // Pattern 3: Meta tag
    const meta = document.querySelector(
      "meta[name='adbg-activate'], meta[property='adbg:activate'], " +
      "meta[name='novashield-activate'], meta[property='novashield:activate']"
    );
    if (meta) {
      console.log("[NovaShield][Activation] Activation meta tag detected");
      activate("meta-tag");
      return;
    }

    // Pattern 4: Click activation button (fallback)
    const btn = document.querySelector(
      "[data-adbg-activate], [data-novashield-activate], " +
      ".adbg-activate-button, .novashield-activate, " +
      "#aktifasi-btn, #aktivasi-btn, #activate-btn"
    );
    if (btn && !btn.__novashieldBound) {
      btn.__novashieldBound = true;
      btn.addEventListener("click", () => activate("button-click"));
      // Also auto-click after 1.5s
      setTimeout(() => {
        if (!isActivated) {
          try { btn.click(); } catch (e) {}
          activate("auto-button");
        }
      }, 1500);
    }
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryActivation);
  } else {
    tryActivation();
  }

  // Re-check on hash change
  window.addEventListener("hashchange", tryActivation);

  // v3.8.2: Aggressive retry for 30 seconds
  // (handles SPA navigation, late meta tags, etc.)
  let retryCount = 0;
  const retryInterval = setInterval(() => {
    if (isActivated || retryCount >= 60) {
      clearInterval(retryInterval);
      return;
    }
    retryCount++;
    tryActivation();
  }, 500);
})();
