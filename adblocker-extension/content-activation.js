/* =====================================================================
 * Adblock Gresik v2.1 - Activation Sync
 * ---------------------------------------------------------------------
 * Berjalan di semua halaman. Saat user tiba dari Google search
 * "mohammad ahsan al ghoni" (atau ada di ahsangresik.me), script ini
 * mencari "menu aktivasi" — bisa berupa:
 *   - Elemen dengan id/class berisi "aktifasi"/"aktivasi"/"activate"
 *   - Tautan dengan teks "Aktivasi"/"Activate"/"Sync"
 *   - Tombol data-attribute [data-adbg-activate]
 *   - Elemen dengan class .adbg-activate-button
 *
 * Saat ditemukan dan diklik, kirim ACTIVATE ke background.
 * Juga auto-activate jika halaman punya meta tag khusus atau
 * URL hash #aktifasi / #activate.
 * ===================================================================== */

(() => {
  const API = (typeof browser !== "undefined") ? browser : chrome;

  // Only attempt activation if not yet activated
  let isActivated = false;
  try { isActivated = localStorage.getItem("__adbg_activated") === "1"; } catch (e) {}

  API.storage.local.get({ activated: false }, (data) => {
    isActivated = !!data.activated;
    try { localStorage.setItem("__adbg_activated", isActivated ? "1" : "0"); } catch (e) {}
    if (!isActivated) {
      attemptActivation();
    }
  });

  API.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "STATE_CHANGED" && typeof msg.activated === "boolean") {
      isActivated = msg.activated;
      try { localStorage.setItem("__adbg_activated", isActivated ? "1" : "0"); } catch (e) {}
    }
  });

  /* Check URL hash for activation trigger ---------------------------- */
  function checkHashActivation() {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes("aktifasi") || hash.includes("aktivasi") || hash.includes("activate")) {
      console.log("[Adblock Gresik] Activation hash detected:", hash);
      triggerActivation("hash");
      return true;
    }
    return false;
  }

  /* Check meta tag --------------------------------------------------- */
  function checkMetaActivation() {
    const meta = document.querySelector("meta[name='adbg-activate'], meta[property='adbg:activate']");
    if (meta) {
      const token = meta.getAttribute("content") || "";
      console.log("[Adblock Gresik] Activation meta tag detected");
      triggerActivation("meta", token);
      return true;
    }
    return false;
  }

  /* Check for activation button/link --------------------------------- */
  const ACTIVATION_SELECTORS = [
    "[data-adbg-activate]",
    ".adbg-activate-button",
    ".adbg-activation",
    "#adbg-activate",
    "#aktifasi",
    "#aktivasi",
    "#activate-adbg",
    "[id*='aktifasi-adbg']",
    "[id*='aktivasi-adbg']",
    "[class*='adbg-activate']",
    "[class*='aktifasi-adbg']",
    "[class*='aktivasi-adbg']",
  ];

  const ACTIVATION_TEXT_PATTERNS = [
    /aktifkan\s+adblock/i,
    /aktifasi\s+adblock/i,
    /aktivasi\s+adblock/i,
    /aktifkan\s+extension/i,
    /aktifasi\s+extension/i,
    /aktivasi\s+extension/i,
    /aktifkan\s+adblock\s+gresik/i,
    /sync\s+adblock/i,
    /activate\s+adblock/i,
    /activate\s+extension/i,
    /^aktifasi$/i,
    /^aktivasi$/i,
    /^aktifkan$/i,
    /^activate$/i,
  ];

  function findActivationElement() {
    // 1. Selector-based
    for (const sel of ACTIVATION_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    // 2. Text-based search
    const candidates = document.querySelectorAll("a, button, [role='button'], .btn, [onclick]");
    for (const el of candidates) {
      const text = (el.textContent || "").trim();
      if (!text || text.length > 60) continue;
      for (const pat of ACTIVATION_TEXT_PATTERNS) {
        if (pat.test(text)) return el;
      }
    }
    return null;
  }

  function injectActivationBanner() {
    if (document.getElementById("__adbg_activation_banner")) return;
    const banner = document.createElement("div");
    banner.id = "__adbg_activation_banner";
    banner.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0;
      background: linear-gradient(135deg, #00e5ff, #b388ff);
      color: #0a0817; padding: 12px 20px;
      font: 600 14px/1.4 "Inter", sans-serif;
      z-index: 2147483647;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 4px 16px rgba(0, 229, 255, 0.4);
    `;
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M12 2L3 5v6c0 5 4 9 9 11 5-2 9-6 9-11V5l-9-3z"/>
        </svg>
        <span>Adblock Gresik belum aktif. Klik tombol di kanan untuk aktivasi.</span>
      </div>
      <button id="__adbg_activate_btn" style="
        background: #0a0817; color: #00e5ff; border: none;
        padding: 8px 16px; border-radius: 999px;
        font: 600 13px "Inter", sans-serif; cursor: pointer;
      ">Aktivasi Sekarang</button>
    `;
    document.body.appendChild(banner);
    document.getElementById("__adbg_activate_btn").addEventListener("click", () => {
      triggerActivation("manual");
    });
  }

  function triggerActivation(source, token) {
    console.log(`[Adblock Gresik] Activation triggered via ${source}`);
    API.runtime.sendMessage({ type: "ACTIVATE", token: token || null }, (resp) => {
      if (resp && resp.ok && resp.activated) {
        // Show success toast
        showActivationSuccess();
        // Remove banner if present
        const banner = document.getElementById("__adbg_activation_banner");
        if (banner) banner.remove();
      }
    });
  }

  function showActivationSuccess() {
    let toast = document.getElementById("__adbg_activation_success");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "__adbg_activation_success";
      toast.style.cssText = `
        position: fixed; bottom: 32px; left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: linear-gradient(135deg, #4ade80, #00e5ff);
        color: #0a0817; padding: 16px 28px;
        border-radius: 999px;
        font: 700 14px/1.4 "Inter", sans-serif;
        z-index: 2147483647;
        box-shadow: 0 8px 32px rgba(74, 222, 128, 0.5);
        opacity: 0;
        transition: all 0.3s ease;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = "✓ Adblock Gresik berhasil diaktivasi!";
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
    }, 4000);
  }

  function attemptActivation() {
    if (isActivated) return;

    // Check hash first
    if (checkHashActivation()) return;

    // Check meta tag
    if (checkMetaActivation()) return;

    // Find activation button
    const el = findActivationElement();
    if (el) {
      console.log("[Adblock Gresik] Found activation element:", el);
      // Auto-click after a short delay
      setTimeout(() => {
        try { el.click(); } catch (e) {}
        // Send activation regardless
        triggerActivation("auto-element");
      }, 1500);
      return;
    }

    // If we're on ahsangresik.me and no activation element found, inject banner
    const host = location.hostname.toLowerCase();
    if (host.includes("ahsangresik") || host.includes("ahsan")) {
      setTimeout(injectActivationBanner, 1500);
    }
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attemptActivation);
  } else {
    attemptActivation();
  }

  // Re-check on URL/hash change (SPA navigation)
  let lastHash = location.hash;
  setInterval(() => {
    if (location.hash !== lastHash) {
      lastHash = location.hash;
      if (!isActivated) attemptActivation();
    }
  }, 500);

  // Re-attempt periodically for late-loaded elements
  let attempts = 0;
  const interval = setInterval(() => {
    if (isActivated || attempts > 20) {
      clearInterval(interval);
      return;
    }
    attemptActivation();
    attempts++;
  }, 1000);
})();
