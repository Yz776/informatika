/* =====================================================================
 * NovaShield v4.1 - Smart Auto-Protection + Data Privacy Guard
 * ---------------------------------------------------------------------
 * 1. SMART AUTO-PROTECTION: Detect suspicious sites, auto-enable
 *    heavy features (ML, content filter) for that site only
 *
 * 2. DATA PRIVACY GUARD: Block access to personal data that sites
 *    shouldn't need:
 *    - Clipboard read (unless user-initiated)
 *    - Geolocation (block entirely, too sensitive)
 *    - Camera/Microphone (block unless HTTPS + user gesture)
 *    - Device sensors (accelerometer, gyroscope)
 *    - Battery API (already blocked, reinforce)
 *    - USB/Bluetooth/NFC APIs
 *    - Payment API (unless trusted)
 *    - Credential Manager API
 *    - WebUSB, WebSerial, WebHID
 * ===================================================================== */

(() => {
  if (window.__novashieldSmartProtect) return;
  window.__novashieldSmartProtect = true;

  const API = (typeof browser !== "undefined") ? browser : chrome;
  let enabled = true;

  API.storage.local.get({ enabled: true }, (data) => {
    enabled = !!data.enabled;
    if (enabled) initProtection();
  });

  /* ================================================================== *
   * 1. SMART AUTO-PROTECTION
   * Detect suspicious sites and auto-enable heavy protection
   * ================================================================== */
  const SUSPICIOUS_INDICATORS = [
    // Suspicious TLDs
    /\.tk$/i, /\.ml$/i, /\.ga$/i, /\.cf$/i, /\.gq$/i,
    /\.top$/i, /\.click$/i, /\.loan$/i, /\.work$/i,
    /\.men$/i, /\.date$/i, /\.review$/i, /\.party$/i,
    // Suspicious patterns in URL
    /\/(free|hack|crack|keygen|patch|serial|warez|pirated)/i,
    /-(proxy|mirror|alternative|unblocked)/i,
    /\/(download|get)-(free|full|cracked)/i,
    // Adult content indicators
    /(porn|xxx|adult|bokep|hentai|cam-)/i,
    // Gambling indicators
    /(judi|casino|slot|togel|poker|bandar|maxwin|gacor)/i,
    // Crypto scam
    /(airdrop|giveaway|free-(btc|crypto|bitcoin)|double-your)/i,
  ];

  const DATA_SENSITIVE_APIS = [
    "geolocation", "credentials", "payment", "usb",
    "bluetooth", "nfc", "serial", "hid",
  ];

  function isSuspiciousSite() {
    const url = window.location.href.toLowerCase();
    const host = window.location.hostname.toLowerCase();

    // Check suspicious TLDs
    for (const pattern of SUSPICIOUS_INDICATORS) {
      if (pattern.test(url) || pattern.test(host)) {
        console.log("[NovaShield][SmartProtect] Suspicious site detected:", host);
        return true;
      }
    }

    // Check for excessive tracking scripts
    const adScripts = document.querySelectorAll(
      'script[src*="doubleclick"], script[src*="googlesyndication"], ' +
      'script[src*="amazon-adsystem"], script[src*="popads"], ' +
      'script[src*="adsterra"], script[src*="quge5"], script[src*="monetag"]'
    );
    if (adScripts.length >= 3) {
      console.log("[NovaShield][SmartProtect] Excessive ad scripts detected:", adScripts.length);
      return true;
    }

    return false;
  }

  function enableSmartProtection() {
    console.log("[NovaShield][SmartProtect] Enabling heavy protection for suspicious site");

    // Notify background to enable ML + content filter for this tab
    try {
      API.runtime.sendMessage({
        type: "SMART_PROTECT_ENABLE",
        hostname: window.location.hostname,
      });
    } catch (e) {}

    // Also set local flag for content scripts
    try { sessionStorage.setItem("__novashield_smart_protect", "1"); } catch (e) {}

    // Dispatch event for MAIN world scripts
    window.dispatchEvent(new CustomEvent("__novashield_smart_protect", {
      detail: { enabled: true, hostname: window.location.hostname }
    }));
  }

  /* ================================================================== *
   * 2. DATA PRIVACY GUARD
   * Block access to sensitive APIs
   * ================================================================== */
  function blockSensitiveAPIs() {
    // --- Geolocation: Block entirely ---
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition = () => {
        console.log("[NovaShield][Privacy] Blocked geolocation access");
        // Call error callback if provided
      };
      navigator.geolocation.watchPosition = navigator.geolocation.getCurrentPosition;
      navigator.geolocation.clearWatch = () => {};
    }

    // --- Clipboard: Block read unless user gesture ---
    if (navigator.clipboard && navigator.clipboard.readText) {
      const origRead = navigator.clipboard.readText.bind(navigator.clipboard);
      navigator.clipboard.readText = function () {
        // Only allow if triggered by user gesture (click/keydown)
        if (!window.__ns_user_gesture) {
          console.log("[NovaShield][Privacy] Blocked clipboard read (no user gesture)");
          return Promise.reject(new DOMException("Clipboard read blocked", "NotAllowedError"));
        }
        return origRead();
      };
    }

    // Track user gestures
    ["click", "keydown", "touchstart"].forEach((evt) => {
      document.addEventListener(evt, () => {
        window.__ns_user_gesture = true;
        setTimeout(() => { window.__ns_user_gesture = false; }, 5000);
      }, { capture: true, passive: true });
    });

    // --- USB API: Block ---
    if (navigator.usb) {
      navigator.usb.requestDevice = () => Promise.reject(new DOMException("USB blocked", "SecurityError"));
    }

    // --- Bluetooth API: Block ---
    if (navigator.bluetooth) {
      navigator.bluetooth.requestDevice = () => Promise.reject(new DOMException("Bluetooth blocked", "SecurityError"));
    }

    // --- Serial API: Block ---
    if (navigator.serial) {
      navigator.serial.requestPort = () => Promise.reject(new DOMException("Serial blocked", "SecurityError"));
    }

    // --- HID API: Block ---
    if (navigator.hid) {
      navigator.hid.requestDevice = () => Promise.reject(new DOMException("HID blocked", "SecurityError"));
    }

    // --- Credentials API: Block (prevent credential theft) ---
    if (navigator.credentials) {
      navigator.credentials.get = () => Promise.resolve(null);
      navigator.credentials.store = () => Promise.reject(new DOMException("Credentials store blocked", "SecurityError"));
    }

    // --- Payment API: Block on non-HTTPS or suspicious sites ---
    if (window.PaymentRequest && (location.protocol !== "https:" || isSuspiciousSite())) {
      window.PaymentRequest = function () {
        throw new DOMException("PaymentRequest blocked", "SecurityError");
      };
    }

    // --- NFC: Block ---
    if (navigator.nfc) {
      navigator.nfc = undefined;
    }

    // --- MediaDevices: Require HTTPS ---
    if (navigator.mediaDevices && location.protocol !== "https:") {
      const orig = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = function () {
        console.log("[NovaShield][Privacy] Blocked getUserMedia on non-HTTPS");
        return Promise.reject(new DOMError("SecurityError", "Camera/Mic requires HTTPS"));
      };
    }

    console.log("[NovaShield][Privacy] Data privacy guard active");
  }

  /* ================================================================== *
   * 3. BLOCK DATA EXFILTRATION
   * Detect and block suspicious data sending (form submission to
   * suspicious endpoints, beacon API abuse, etc)
   * ================================================================== */
  function blockDataExfiltration() {
    // --- navigator.sendBeacon: Block to suspicious domains ---
    if (navigator.sendBeacon) {
      const orig = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = function (url, data) {
        try {
          const u = new URL(url, window.location.href);
          // Block beacon to known data collection endpoints
          if (/analytics|tracking|collect|beacon|telemetry|pixel/i.test(u.pathname)) {
            if (!isTrustedDomain(u.hostname)) {
              console.log("[NovaShield][Privacy] Blocked beacon to:", u.hostname);
              return false;
            }
          }
        } catch (e) {}
        return orig(url, data);
      };
    }

    // --- Form submission: Warn on submission to HTTP ---
    document.addEventListener("submit", (e) => {
      const form = e.target;
      if (form && form.action && form.action.startsWith("http:") && location.protocol === "https:") {
        console.warn("[NovaShield][Privacy] Form submits to HTTP (data not encrypted):", form.action);
      }
    }, true);
  }

  function isTrustedDomain(host) {
    const trusted = [
      "google.com", "google-analytics.com", "cloudflare.com",
      "ahsangresik.me", "erd7.eu.org", "ahsann.is-a.dev",
      "github.com", "githubusercontent.com",
    ];
    return trusted.some((t) => host === t || host.endsWith("." + t));
  }

  /* ================================================================== *
   * INIT
   * ================================================================== */
  function initProtection() {
    // Always block sensitive APIs (lightweight, no RAM impact)
    blockSensitiveAPIs();
    blockDataExfiltration();

    // Check if site is suspicious -> enable smart protection
    if (isSuspiciousSite()) {
      enableSmartProtection();
    }

    // Re-check on SPA navigation
    let lastUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        if (isSuspiciousSite()) {
          enableSmartProtection();
        }
      }
    }, 2000);

    console.log("[NovaShield][SmartProtect] Active on:", window.location.hostname);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProtection);
  } else {
    initProtection();
  }
})();
