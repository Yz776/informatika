/* NovaShield v3.1 - Bridge (ISOLATED -> MAIN state sync) + Element Zapper */
(() => {
  const API = (typeof browser !== "undefined") ? browser : chrome;

  // Push full state to MAIN world (privacy, popup, redirect, anti-adblock, etc.)
  function sendPrivacyState() {
    API.storage.local.get({
      activated: false, enabled: true,
      webrtcProtect: true, canvasProtect: true, audioProtect: true, fontProtect: true,
      popupBlock: true, redirectBlock: true, antiAdblockEnabled: true,
      mlEnabled: true, contentFilter: true, strictRedirect: true,
    }, (data) => {
      const evt = new CustomEvent("__novashield_privacy_state", {
        detail: {
          activated: !!data.activated,
          enabled: !!data.enabled,
          webrtc: !!data.webrtcProtect,
          canvas: !!data.canvasProtect,
          audio: !!data.audioProtect,
          font: !!data.fontProtect,
        }
      });
      window.dispatchEvent(evt);
      // Also broadcast activation to anti-adblock MAIN script
      window.dispatchEvent(new CustomEvent("__novashield_activation_changed", {
        detail: { activated: !!data.activated }
      }));
      // v3.1: broadcast full state to popup blocker & anti-adblock scripts
      // v3.3: add mlEnabled, contentFilter, strictRedirect
      window.dispatchEvent(new CustomEvent("__novashield_state", {
        detail: {
          activated: !!data.activated,
          enabled: !!data.enabled,
          popupBlock: !!data.popupBlock,
          redirectBlock: !!data.redirectBlock,
          antiAdblock: !!data.antiAdblockEnabled,
          mlEnabled: !!data.mlEnabled,
          contentFilter: !!data.contentFilter,
          strictRedirect: !!data.strictRedirect,
        }
      }));
    });
  }
  window.addEventListener("__novashield_privacy_request_state", sendPrivacyState);
  window.addEventListener("__novashield_state_request", sendPrivacyState);
  setTimeout(sendPrivacyState, 100);
  API.storage.onChanged.addListener((changes, area) => {
    if (area === "local") sendPrivacyState();
  });

  // Element Zapper
  let zapperActive = false;
  let lastHovered = null;
  let zapperOverlay = null;

  function createZapperStyle() {
    if (document.getElementById("__novashield_zapper_style")) return;
    const style = document.createElement("style");
    style.id = "__novashield_zapper_style";
    style.textContent = `
      .__novashield_zapper_highlight {
        outline: 2px solid #00e5ff !important;
        outline-offset: -2px !important;
        background-color: rgba(0, 229, 255, 0.15) !important;
        cursor: crosshair !important;
      }
      .__novashield_zapper_bar {
        position: fixed !important; top: 12px !important;
        left: 50% !important; transform: translateX(-50%) !important;
        background: linear-gradient(135deg, #00e5ff, #b388ff) !important;
        color: #0a0817 !important; padding: 8px 16px !important;
        border-radius: 999px !important;
        font: 600 12px/1.4 "Inter", sans-serif !important;
        z-index: 2147483647 !important;
        box-shadow: 0 4px 16px rgba(0, 229, 255, 0.5) !important;
        pointer-events: none !important;
      }
      .__novashield_zapper_hidden {
        display: none !important; visibility: hidden !important;
        width: 0 !important; height: 0 !important; opacity: 0 !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function startZapper() {
    if (zapperActive) return;
    createZapperStyle();
    zapperActive = true;
    zapperOverlay = document.createElement("div");
    zapperOverlay.className = "__novashield_zapper_bar";
    zapperOverlay.textContent = "Klik elemen untuk zap • ESC batal";
    document.body.appendChild(zapperOverlay);
    document.addEventListener("mousemove", onZapperMove, true);
    document.addEventListener("click", onZapperClick, true);
    document.addEventListener("keydown", onZapperKey, true);
  }

  function stopZapper() {
    if (!zapperActive) return;
    zapperActive = false;
    if (lastHovered) lastHovered.classList.remove("__novashield_zapper_highlight");
    if (zapperOverlay) zapperOverlay.remove();
    zapperOverlay = null;
    document.removeEventListener("mousemove", onZapperMove, true);
    document.removeEventListener("click", onZapperClick, true);
    document.removeEventListener("keydown", onZapperKey, true);
  }

  function onZapperMove(e) {
    if (lastHovered) lastHovered.classList.remove("__novashield_zapper_highlight");
    lastHovered = e.target;
    if (lastHovered && lastHovered !== zapperOverlay) {
      lastHovered.classList.add("__novashield_zapper_highlight");
    }
  }

  function onZapperClick(e) {
    if (!zapperActive) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (e.target && e.target !== zapperOverlay) {
      const el = e.target;
      const selector = generateSelector(el);
      el.classList.add("__novashield_zapper_hidden");
      saveCustomHideRule(window.location.hostname, selector);
    }
    stopZapper();
  }

  function onZapperKey(e) { if (e.key === "Escape") stopZapper(); }

  function generateSelector(el) {
    if (el.id) return `#${el.id}`;
    const path = [];
    while (el && el.nodeType === 1 && el !== document.documentElement) {
      let sel = el.tagName.toLowerCase();
      if (el.className && typeof el.className === "string") {
        const cls = el.className.trim().split(/\s+/).slice(0, 2).join(".");
        if (cls) sel += `.${cls}`;
      }
      if (el.parentElement) {
        const siblings = Array.from(el.parentElement.children).filter(n => n.tagName === el.tagName);
        if (siblings.length > 1) sel += `:nth-of-type(${siblings.indexOf(el) + 1})`;
      }
      path.unshift(sel);
      el = el.parentElement;
      if (path.length >= 4) break;
    }
    return path.join(" > ");
  }

  async function saveCustomHideRule(hostname, selector) {
    return new Promise((resolve) => {
      API.storage.local.get({ customHideRules: {} }, (data) => {
        const rules = { ...(data.customHideRules || {}) };
        if (!rules[hostname]) rules[hostname] = [];
        if (!rules[hostname].includes(selector)) rules[hostname].push(selector);
        API.storage.local.set({ customHideRules: rules }, () => resolve());
      });
    });
  }

  API.runtime.onMessage.addListener((msg) => {
    if (!msg) return;
    if (msg.type === "START_ZAPPER") startZapper();
    else if (msg.type === "STOP_ZAPPER") stopZapper();
  });

  function applyCustomHideRules() {
    API.storage.local.get({ customHideRules: {} }, (data) => {
      const hostRules = (data.customHideRules || {})[window.location.hostname] || [];
      hostRules.forEach((sel) => {
        try {
          document.querySelectorAll(sel).forEach((el) => el.classList.add("__novashield_zapper_hidden"));
        } catch (e) {}
      });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyCustomHideRules);
  } else { applyCustomHideRules(); }
  setInterval(applyCustomHideRules, 2000);
})();
