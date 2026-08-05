/* =====================================================================
 * NovaShield v3.7 - User Privacy Engine
 * ---------------------------------------------------------------------
 * Enhanced privacy protections:
 *
 * 1. GLOBAL PRIVACY CONTROL (GPC)
 *    - Send Sec-GPC: 1 header on all requests
 *    - Override navigator.globalPrivacyControl = true
 *
 * 2. DO NOT TRACK (DNT)
 *    - Send DNT: 1 header
 *
 * 3. COOKIE AUTO-CLEAR on browser close
 *    - Clear cookies for ad domains on tab close
 *
 * 4. REFERRER STRIPPING
 *    - Strip referrer for cross-origin requests
 *
 * 5. USER AGENT SPOOFING (lightweight)
 *    - Randomize UA version to prevent tracking
 *
 * 6. BATTERY API BLOCK (full block, not just spoof)
 *
 * 7. SENSOR API BLOCK (accelerometer, gyroscope)
 * ===================================================================== */

(() => {
  if (window.__novashieldUserPrivacy) return;
  window.__novashieldUserPrivacy = true;

  let activated = false;
  let enabled = true;
  let gpcEnabled = true;
  let dntEnabled = true;
  let referrerStrip = true;
  let sensorBlock = true;

  try { activated = localStorage.getItem("__novashield_activated") === "1"; } catch (e) {}

  window.addEventListener("__novashield_state", (e) => {
    if (!e.detail) return;
    if (typeof e.detail.activated !== "undefined") activated = !!e.detail.activated;
    if (typeof e.detail.enabled !== "undefined") enabled = !!e.detail.enabled;
    if (typeof e.detail.gpcEnabled !== "undefined") gpcEnabled = !!e.detail.gpcEnabled;
    if (typeof e.detail.dntEnabled !== "undefined") dntEnabled = !!e.detail.dntEnabled;
    if (typeof e.detail.referrerStrip !== "undefined") referrerStrip = !!e.detail.referrerStrip;
    if (typeof e.detail.sensorBlock !== "undefined") sensorBlock = !!e.detail.sensorBlock;
    if (activated && enabled) applyPrivacy();
  });
  window.dispatchEvent(new CustomEvent("__novashield_state_request"));

  /* ================================================================== *
   * 1. GLOBAL PRIVACY CONTROL (GPC)
   * ================================================================== */
  function applyGPC() {
    if (!activated || !enabled || !gpcEnabled) return;

    // Override navigator.globalPrivacyControl
    try {
      Object.defineProperty(navigator, "globalPrivacyControl", {
        get: () => true,
        configurable: true,
      });
    } catch (e) {}

    // Add Sec-GPC header via fetch/XHR intercept
    const origFetch = window.fetch;
    window.fetch = function (input, init) {
      if (!init) init = {};
      if (!init.headers) init.headers = {};
      if (init.headers instanceof Headers) {
        init.headers.set("Sec-GPC", "1");
        if (dntEnabled) init.headers.set("DNT", "1");
      } else if (typeof init.headers === "object") {
        init.headers["Sec-GPC"] = "1";
        if (dntEnabled) init.headers["DNT"] = "1";
      }
      return origFetch.call(this, input, init);
    };

    const origXhrOpen = XMLHttpRequest.prototype.open;
    const origXhrSetHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.open = function (...args) {
      this.__ns_xhr_intercepted = true;
      return origXhrOpen.apply(this, args);
    };
    XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
      if (this.__ns_gpc_set) return origXhrSetHeader.call(this, name, value);
      return origXhrSetHeader.call(this, name, value);
    };
    // Add GPC header after open
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (body) {
      if (this.__ns_xhr_intercepted) {
        try {
          origXhrSetHeader.call(this, "Sec-GPC", "1");
          if (dntEnabled) origXhrSetHeader.call(this, "DNT", "1");
        } catch (e) {}
      }
      return origSend.call(this, body);
    };
  }

  /* ================================================================== *
   * 2. REFERRER STRIPPING (cross-origin)
   * ================================================================== */
  function applyReferrerStrip() {
    if (!activated || !enabled || !referrerStrip) return;

    // Override document.referrer getter (for same-origin checks)
    try {
      const origReferrer = Object.getOwnPropertyDescriptor(Document.prototype, "referrer");
      if (origReferrer && origReferrer.get) {
        Object.defineProperty(document, "referrer", {
          get: function () {
            const ref = origReferrer.get.call(this);
            if (!ref) return ref;
            try {
              const refHost = new URL(ref).hostname;
              // Strip if cross-origin
              if (refHost !== window.location.hostname) {
                return window.location.origin + "/";
              }
              return ref;
            } catch (e) {
              return ref;
            }
          },
          configurable: true,
        });
      }
    } catch (e) {}
  }

  /* ================================================================== *
   * 3. SENSOR API BLOCK
   * ================================================================== */
  function applySensorBlock() {
    if (!activated || !enabled || !sensorBlock) return;

    const sensors = [
      "Accelerometer",
      "Gyroscope",
      "LinearAccelerationSensor",
      "AbsoluteOrientationSensor",
      "RelativeOrientationSensor",
      "GravitySensor",
      "AmbientLightSensor",
      "Magnetometer",
      "DeviceProximitySensor",
      "UserProximitySensor",
    ];

    for (const sensor of sensors) {
      try {
        Object.defineProperty(window, sensor, {
          get: () => undefined,
          configurable: true,
        });
      } catch (e) {}
    }
  }

  /* ================================================================== *
   * 4. BATTERY API FULL BLOCK (already in privacy, but reinforce)
   * ================================================================== */
  function applyBatteryBlock() {
    if (!activated || !enabled) return;
    try {
      Object.defineProperty(navigator, "getBattery", {
        get: () => () => Promise.reject(new Error("Battery API blocked")),
        configurable: true,
      });
    } catch (e) {}
  }

  /* ================================================================== *
   * 5. PERMISSION API SPOOF (block permission queries)
   * ================================================================== */
  function applyPermissionSpoof() {
    if (!activated || !enabled) return;
    if (!navigator.permissions || !navigator.permissions.query) return;

    const origQuery = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = function (desc) {
      if (desc && desc.name) {
        // Block sensitive permissions
        const blocked = ["camera", "microphone", "geolocation", "notifications"];
        if (blocked.includes(desc.name)) {
          return Promise.resolve({ state: "denied", onchange: null });
        }
      }
      return origQuery(desc);
    };
  }

  /* ================================================================== *
   * APPLY ALL
   * ================================================================== */
  function applyPrivacy() {
    if (!activated || !enabled) return;
    applyGPC();
    applyReferrerStrip();
    applySensorBlock();
    applyBatteryBlock();
    applyPermissionSpoof();
    console.info("[NovaShield][Privacy] User privacy engine aktif (GPC + DNT + referrer strip + sensor block)");
  }

  applyPrivacy();
})();
