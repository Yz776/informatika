/* NovaShield v2.1 - Privacy Protection (MAIN world) */
(() => {
  if (window.__adbgPrivacyInstalled) return;
  window.__adbgPrivacyInstalled = true;

  let enabled = true, webrtcProtect = true, canvasProtect = true,
      audioProtect = true, fontProtect = true, activated = false;

  /* activation removed in v4.0 */

  window.addEventListener("__novashield_privacy_state", (e) => {
    if (e.detail) {
      if (typeof e.detail.activated !== "undefined") activated = !!e.detail.activated;
      if (typeof e.detail.enabled !== "undefined") enabled = !!e.detail.enabled;
      if (typeof e.detail.webrtc !== "undefined") webrtcProtect = !!e.detail.webrtc;
      if (typeof e.detail.canvas !== "undefined") canvasProtect = !!e.detail.canvas;
      if (typeof e.detail.audio !== "undefined") audioProtect = !!e.detail.audio;
      if (typeof e.detail.font !== "undefined") fontProtect = !!e.detail.font;
      if (enabled) applyAll();
    }
  });
  window.dispatchEvent(new CustomEvent("__novashield_privacy_request_state"));

  function applyAll() {
    if (!enabled) return;
    protectWebRTC();
    protectCanvas();
    protectAudio();
    spoofNavigator();
  }

  function protectWebRTC() {
    if (!webrtcProtect) return;
    const origRTC = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    if (!origRTC) return;
    function PatchedRTC(config, constraints) {
      const pc = new origRTC(config, constraints);
      const origAddIceCandidate = pc.addIceCandidate.bind(pc);
      pc.addIceCandidate = function (candidate) {
        if (candidate && candidate.candidate && /typ host/.test(candidate.candidate)) {
          return Promise.resolve();
        }
        return origAddIceCandidate(candidate);
      };
      const origDesc = Object.getOwnPropertyDescriptor(pc, "onicecandidate");
      if (origDesc && origDesc.set) {
        Object.defineProperty(pc, "onicecandidate", {
          get: origDesc.get,
          set: function (fn) {
            origDesc.set.call(this, function (event) {
              if (event && event.candidate && event.candidate.candidate &&
                  /typ host/.test(event.candidate.candidate)) return;
              if (fn) fn.call(this, event);
            });
          }, configurable: true,
        });
      }
      return pc;
    }
    PatchedRTC.prototype = origRTC.prototype;
    if (window.RTCPeerConnection) window.RTCPeerConnection = PatchedRTC;
    if (window.webkitRTCPeerConnection) window.webkitRTCPeerConnection = PatchedRTC;
    if (window.mozRTCPeerConnection) window.mozRTCPeerConnection = PatchedRTC;
  }

  function protectCanvas() {
    if (!canvasProtect) return;
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (...args) {
      try {
        if (this.width >= 16 && this.height >= 16) {
          const ctx = this.getContext("2d");
          if (ctx) { ctx.fillStyle = "rgba(0,0,0,0.01)"; ctx.fillRect(0, 0, 1, 1); }
        }
      } catch (e) {}
      return origToDataURL.apply(this, args);
    };
    const origToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
      try {
        if (this.width >= 16 && this.height >= 16) {
          const ctx = this.getContext("2d");
          if (ctx) { ctx.fillStyle = "rgba(255,255,255,0.01)"; ctx.fillRect(0, 0, 1, 1); }
        }
      } catch (e) {}
      return origToBlob.call(this, callback, ...args);
    };
    const origGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function (...args) {
      const data = origGetImageData.apply(this, args);
      try {
        if (data.data && data.data.length >= 4) data.data[0] = (data.data[0] + 1) & 0xff;
      } catch (e) {}
      return data;
    };
  }

  function protectAudio() {
    if (!audioProtect) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC && AC.prototype.createAnalyser) {
      const orig = AC.prototype.createAnalyser;
      AC.prototype.createAnalyser = function () {
        const analyser = orig.call(this);
        const origGetFloat = analyser.getFloatFrequencyData.bind(analyser);
        analyser.getFloatFrequencyData = function (array) {
          origGetFloat(array);
          if (array && array.length > 0) array[0] += (Math.random() - 0.5) * 0.001;
        };
        return analyser;
      };
    }
  }

  function spoofNavigator() {
    if (!fontProtect) return;
    try {
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency > 4) {
        Object.defineProperty(navigator, "hardwareConcurrency", {
          get: () => 4, configurable: true,
        });
      }
      if ("deviceMemory" in navigator) {
        try {
          Object.defineProperty(navigator, "deviceMemory", {
            get: () => 4, configurable: true,
          });
        } catch (e) {}
      }
      if (navigator.getBattery) {
        navigator.getBattery = () => Promise.reject(new Error("Battery API blocked"));
      }
      try {
        Object.defineProperty(navigator, "plugins", { get: () => [], configurable: true });
      } catch (e) {}
      try {
        Object.defineProperty(navigator, "mimeTypes", { get: () => [], configurable: true });
      } catch (e) {}
    } catch (e) {}
  }

  applyAll();
  console.info("[NovaShield] Privacy protection aktif di", location.hostname);
})();
