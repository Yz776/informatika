/* =====================================================================
 * NovaShield v3.1 - YouTube Ad Blocker (Advanced)
 * ===================================================================== */

(() => {
  const API = (typeof browser !== "undefined") ? browser : chrome;
  let activated = false;
  let features = {
    enabled: true, ytBlockEnabled: true, ytAutoSkip: true,
    ytSpeedUp: true, sponsorBlockEnabled: true,
  };

  try { activated = localStorage.getItem("__novashield_activated") === "1"; } catch (e) {}

  API.storage.local.get({
    activated: false, enabled: true, ytBlockEnabled: true, ytAutoSkip: true,
    ytSpeedUp: true, sponsorBlockEnabled: true,
  }, (data) => {
    activated = !!data.activated;
    features = {
      enabled: !!data.enabled, ytBlockEnabled: !!data.ytBlockEnabled,
      ytAutoSkip: !!data.ytAutoSkip, ytSpeedUp: !!data.ytSpeedUp,
      sponsorBlockEnabled: !!data.sponsorBlockEnabled,
    };
    try { localStorage.setItem("__novashield_activated", activated ? "1" : "0"); } catch (e) {}
    if (activated && features.enabled) boot();
  });

  API.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== "STATE_CHANGED") return;
    if (typeof msg.activated === "boolean") {
      activated = msg.activated;
      try { localStorage.setItem("__novashield_activated", activated ? "1" : "0"); } catch (e) {}
      if (activated && features.enabled) boot();
    }
    if (typeof msg.enabled === "boolean") features.enabled = msg.enabled;
    if (typeof msg.ytBlockEnabled === "boolean") features.ytBlockEnabled = msg.ytBlockEnabled;
    if (typeof msg.ytAutoSkip === "boolean") features.ytAutoSkip = msg.ytAutoSkip;
    if (typeof msg.ytSpeedUp === "boolean") features.ytSpeedUp = msg.ytSpeedUp;
    if (typeof msg.sponsorBlockEnabled === "boolean") features.sponsorBlockEnabled = msg.sponsorBlockEnabled;
  });

  let booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    injectCSS();
    interceptYtInitialData();
    setupAdStateObserver();
    setupVideoTorture();
    setupSkipButtonWatcher();
    setupSponsorBlock();
    attachYtNavigateListener();
    console.info("[NovaShield][YT] v3.1 aktif");
  }

  if (!activated) return;

  /* ================================================================== *
   * NEW v3.1: Intercept ytInitialPlayerResponse to strip ad data
   * ================================================================== */
  function interceptYtInitialData() {
    // Override ytInitialPlayerResponse getter/setter
    // YouTube stores player response in this global variable
    try {
      let cached = window.ytInitialPlayerResponse;
      Object.defineProperty(window, "ytInitialPlayerResponse", {
        get() { return cached; },
        set(value) {
          cached = stripAdsFromPlayerResponse(value);
          console.log("[NovaShield][YT] ytInitialPlayerResponse intercepted, ads stripped");
        },
        configurable: true,
      });
      // If already set, strip it
      if (cached) {
        cached = stripAdsFromPlayerResponse(cached);
      }
    } catch (e) {}

    // Also override ytcfg.set to intercept ad configs
    if (window.ytcfg && window.ytcfg.set) {
      const origYtcfgSet = window.ytcfg.set.bind(window.ytcfg);
      window.ytcfg.set = function (key, value) {
        // Strip ad-related configs
        if (key === "ADBLOCK_SIGNAL" || key === "ADOPT_SCREEN_DATA" ||
            key === "PLAYER_VARS" && value && value.ad_tag) {
          try {
            if (value && typeof value === "object") {
              delete value.ad_tag;
              delete value.ad_flags;
              delete value.ad3_module;
            }
          } catch (e) {}
        }
        return origYtcfgSet(key, value);
      };
    }
  }

  function stripAdsFromPlayerResponse(response) {
    if (!response || typeof response !== "object") return response;
    try {
      // Strip ads from response
      if (response.adPlacements) {
        response.adPlacements = [];
        console.log("[NovaShield][YT] Stripped adPlacements");
      }
      if (response.adSlots) {
        response.adSlots = [];
        console.log("[NovaShield][YT] Stripped adSlots");
      }
      if (response.playerAds) {
        response.playerAds = [];
        console.log("[NovaShield][YT] Stripped playerAds");
      }
      if (response.auxiliaryUi && response.auxiliaryUi.messageRenderers) {
        response.auxiliaryUi.messageRenderers = {};
      }
      // Deep strip
      if (response.streamingData && response.streamingData.adaptiveFormats) {
        // Keep video formats, but remove ad-related
      }
    } catch (e) {}
    return response;
  }

  /* ================================================================== *
   * CSS injection
   * ================================================================== */
  const css = `
    .ytp-ad-overlay-container, .ytp-ad-module, .ytp-ad-player-overlay,
    .ytp-ad-player-overlay-flyout-cta, .ytp-ad-image-overlay,
    .ytp-ad-progress-bar, .ytp-ad-survey, .ytp-ad-overlay-close-container,
    .ytp-ad-overlay-ad-info, .ytp-ad-text-overlay, .video-ads:empty,
    ytd-ad-slot-renderer, ytd-promoted-video-renderer,
    ytd-promoted-sparkles-web-renderer, ytd-action-companion-ad-renderer,
    ytd-companion-slot-renderer, ytd-compact-promoted-video-renderer,
    ytd-display-ad-renderer, ytd-game-card-renderer[is-ad],
    ytd-in-feed-ad-layout-renderer, ytd-promoted-sparkles-text-tv-renderer,
    ytd-search-pyv-renderer, ytd-merch-shelf-renderer, ytd-mealbar-promo-renderer,
    ytd-primetime-promo-renderer, ytd-promo-video-renderer,
    ytd-banner-promo-renderer, #masthead-ad, #feedmodule-ads,
    ytd-thumbnail-overlay-time-status-renderer[overlay-style="DEFAULT"],
    ytd-player-legacy-desktop-watch-attr-renderer {
      display: none !important; visibility: hidden !important;
      opacity: 0 !important; pointer-events: none !important;
      height: 0 !important; width: 0 !important;
      max-height: 0 !important; max-width: 0 !important;
      overflow: hidden !important; position: absolute !important;
      top: -9999px !important; left: -9999px !important;
    }
    .ytp-ad-skip-button-container:not(:empty), .ytp-ad-skip-button,
    .ytp-ad-skip-button-modern, .ytp-skip-ad-button {
      display: block !important; visibility: visible !important;
      opacity: 1 !important; pointer-events: auto !important;
      position: static !important; z-index: 99999 !important;
      height: auto !important; width: auto !important;
    }
    /* v3.1: Hide ad-based prompts and surveys */
    ytd-popup-container tp-yt-paper-dialog,
    ytd-enagement-message-section-renderer,
    yt-mealbar-promo-renderer {
      display: none !important;
    }
  `;

  function injectCSS() {
    if (document.getElementById("__novashield_yt_css_v3")) return;
    const s = document.createElement("style");
    s.id = "__novashield_yt_css_v3";
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  let isCurrentlyAd = false;

  function getPlayer() {
    return document.querySelector("#movie_player") || document.querySelector(".html5-video-player");
  }
  function getVideo() {
    return document.querySelector("video.html5-main-video, video#movie_player video, video");
  }

  function detectAdState() {
    const player = getPlayer();
    if (!player) return false;
    return (
      player.classList.contains("ad-showing") ||
      player.classList.contains("ad-interrupting") ||
      player.hasAttribute("data-ad-playing") ||
      !!player.querySelector(".ytp-ad-player-overlay:not([style*='display: none']):not([style*='display:none'])") ||
      !!player.querySelector(".ytp-ad-image-overlay:not([style*='display: none']):not([style*='display:none'])") ||
      !!document.querySelector(".video-ads:not(:empty) .ytp-ad-player-overlay")
    );
  }

  function setupAdStateObserver() {
    function attach() {
      const player = getPlayer();
      if (!player) { setTimeout(attach, 200); return; }
      if (player.__novashieldObserved) return;
      player.__novashieldObserved = true;
      const obs = new MutationObserver(() => {
        const isAd = detectAdState();
        if (isAd !== isCurrentlyAd) {
          isCurrentlyAd = isAd;
          if (isAd) onAdStart(); else onAdEnd();
        }
      });
      obs.observe(player, {
        attributes: true, attributeFilter: ["class", "data-ad-playing"],
        childList: true, subtree: true,
      });
      const adsContainer = document.querySelector(".video-ads");
      if (adsContainer) {
        const obs2 = new MutationObserver(() => {
          const isAd = detectAdState();
          if (isAd !== isCurrentlyAd) {
            isCurrentlyAd = isAd;
            if (isAd) onAdStart(); else onAdEnd();
          }
        });
        obs2.observe(adsContainer, { childList: true, subtree: true });
      }
    }
    attach();
    setInterval(attach, 2000);
  }

  function onAdStart() {
    console.log("[NovaShield][YT] Ad detected");
    if (features.ytSpeedUp) tortureVideo();
    if (features.ytAutoSkip) tryClickSkip();
    forceSeekToEnd();
    // Notify counter
    try {
      window.dispatchEvent(new CustomEvent("__novashield_blocked_request", {
        detail: { type: "youtube_ad", url: "youtube_ad_segment" }
      }));
    } catch (e) {}
  }

  function onAdEnd() {
    console.log("[NovaShield][YT] Ad ended");
    restoreVideo();
  }

  let tortureInterval = null;

  function tortureVideo() {
    if (tortureInterval) clearInterval(tortureInterval);
    tortureInterval = setInterval(() => {
      if (!isCurrentlyAd) {
        clearInterval(tortureInterval);
        tortureInterval = null;
        return;
      }
      const video = getVideo();
      if (!video) return;
      try {
        video.muted = true;
        if (video.playbackRate !== 16) video.playbackRate = 16;
        if (video.duration && isFinite(video.duration) && video.duration > 0) {
          const target = video.duration - 0.05;
          if (video.currentTime < target - 0.3) {
            try { video.currentTime = target; } catch (e) {}
          }
        }
      } catch (e) {}
    }, 50);
  }

  function forceSeekToEnd() {
    const video = getVideo();
    if (!video) return;
    try {
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
        video.currentTime = video.duration - 0.05;
      }
    } catch (e) {}
  }

  function restoreVideo() {
    if (tortureInterval) { clearInterval(tortureInterval); tortureInterval = null; }
    const video = getVideo();
    if (!video) return;
    try {
      if (video.playbackRate > 4) video.playbackRate = 1;
      video.muted = false;
    } catch (e) {}
  }

  function setupVideoTorture() {
    const video = getVideo();
    if (!video || video.__novashieldRatePatched) return;
    video.__novashieldRatePatched = true;
    const desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "playbackRate");
    if (desc && desc.set) {
      Object.defineProperty(video, "playbackRate", {
        get: desc.get,
        set: function (v) {
          if (isCurrentlyAd && features.ytSpeedUp && v < 16) desc.set.call(this, 16);
          else desc.set.call(this, v);
        },
        configurable: true,
      });
    }
    video.addEventListener("ratechange", () => {
      if (isCurrentlyAd && features.ytSpeedUp && video.playbackRate < 16) {
        try { video.playbackRate = 16; } catch (e) {}
      }
    });
  }

  function tryClickSkip() {
    const candidates = [
      ".ytp-ad-skip-button-modern", ".ytp-ad-skip-button", ".ytp-skip-ad-button",
      "button.ytp-skip-ad-button", ".ytp-ad-skip-button-container button",
      "[id^='skip-button']", "button[aria-label*='Skip']", "button[aria-label*='Lewati']",
      // v3.1: additional skip button selectors
      ".ytp-skip-ad__skip-button", "button[data-tooltip='Skip Ads']",
      ".ytp-ad-skip-button-icon", ".ytp-ad-skip-button-text",
    ];
    for (const sel of candidates) {
      const btn = document.querySelector(sel);
      if (btn) {
        try { btn.click(); return true; } catch (e) {}
      }
    }
    return false;
  }

  function setupSkipButtonWatcher() {
    function attach() {
      const player = getPlayer();
      if (!player) { setTimeout(attach, 500); return; }
      if (player.__novashieldSkipObserved) return;
      player.__novashieldSkipObserved = true;
      const obs = new MutationObserver(() => {
        if (isCurrentlyAd && features.ytAutoSkip) tryClickSkip();
      });
      obs.observe(player, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
      setInterval(() => {
        if (isCurrentlyAd && features.ytAutoSkip) tryClickSkip();
      }, 100); // v3.1: faster polling (100ms vs 200ms)
    }
    attach();
    setInterval(attach, 2000);
  }

  let currentVideoId = null;
  let sponsorSegments = [];

  function getVideoId() {
    try {
      const u = new URL(window.location.href);
      if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
      if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    } catch (e) {}
    return null;
  }

  async function fetchSponsorSegments(videoId) {
    try {
      const resp = await fetch(
        `https://sponsor.ajay.app/api/skipSegments?videoID=${encodeURIComponent(videoId)}&categories=["sponsor","intro","outro","selfpromo","interaction","preview","music_offtopic","filler"]`,
        { cache: "no-store" }
      );
      if (!resp.ok) return [];
      const data = await resp.json();
      return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
  }

  async function checkVideoChange() {
    const vid = getVideoId();
    if (vid === currentVideoId) return;
    currentVideoId = vid;
    sponsorSegments = [];
    if (!vid || !features.sponsorBlockEnabled) return;
    sponsorSegments = await fetchSponsorSegments(vid);
    if (sponsorSegments.length > 0) {
      console.log(`[NovaShield][YT] SponsorBlock: ${sponsorSegments.length} segments`);
    }
  }

  function skipSponsorSegments() {
    if (!features.sponsorBlockEnabled || !currentVideoId) return;
    if (!sponsorSegments || sponsorSegments.length === 0) return;
    const video = getVideo();
    if (!video) return;
    const t = video.currentTime;
    for (const seg of sponsorSegments) {
      const start = seg.segment && seg.segment[0];
      const end = seg.segment && seg.segment[1];
      if (typeof start !== "number" || typeof end !== "number") continue;
      if (t >= start && t < end - 0.2) {
        try {
          video.currentTime = end;
          showSponsorToast(seg.category || "sponsor", Math.round(end - start));
        } catch (e) {}
        break;
      }
    }
  }

  function showSponsorToast(category, seconds) {
    let toast = document.getElementById("__novashield_sponsor_toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "__novashield_sponsor_toast";
      toast.style.cssText = `
        position: fixed; bottom: 80px; left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #00e5ff, #b388ff);
        color: #0a0817; padding: 8px 16px;
        border-radius: 999px;
        font: 600 12px/1.4 "Inter", sans-serif;
        z-index: 999999;
        box-shadow: 0 4px 16px rgba(0, 229, 255, 0.4);
        pointer-events: none; transition: opacity 0.3s;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = `Segment "${category}" dilewati (${seconds}s)`;
    toast.style.opacity = "1";
    clearTimeout(toast.__timeout);
    toast.__timeout = setTimeout(() => { toast.style.opacity = "0"; }, 2500);
  }

  function setupSponsorBlock() {
    // v3.4: Adaptive polling (1s active, 5s hidden) instead of fixed 500ms/100ms
    let isTabVisible = !document.hidden;
    document.addEventListener("visibilitychange", () => { isTabVisible = !document.hidden; });

    function pollSponsorCheck() {
      if (isTabVisible) checkVideoChange();
      setTimeout(pollSponsorCheck, isTabVisible ? 1000 : 5000);
    }
    pollSponsorCheck();

    function pollSponsorSkip() {
      if (isTabVisible) skipSponsorSegments();
      setTimeout(pollSponsorSkip, isTabVisible ? 200 : 2000); // 200ms active (was 100)
    }
    pollSponsorSkip();
  }

  function attachYtNavigateListener() {
    document.addEventListener("yt-navigate-finish", () => {
      setTimeout(() => {
        currentVideoId = null;
        setupAdStateObserver();
        setupVideoTorture();
        setupSkipButtonWatcher();
        // v3.1: re-intercept ytInitialPlayerResponse on navigation
        interceptYtInitialData();
      }, 300);
    });
    document.addEventListener("yt-page-data-updated", () => {
      setTimeout(() => { currentVideoId = null; }, 300);
    });
  }
})();
