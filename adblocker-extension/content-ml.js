/* =====================================================================
 * NovaShield v3.3 - ML Heuristic Ad Classifier (MAIN world)
 * ---------------------------------------------------------------------
 * Lightweight ML-like scoring system untuk detect iklan berdasarkan:
 *   1. URL features (pattern, domain, TLD, path)
 *   2. Element features (size, position, class/id, behavior)
 *   3. Content features (text analysis, keywords)
 *   4. Behavioral features (popup, redirect, autoplay)
 *
 * Scoring: 0-100, if score > 60 → block as ad
 * ===================================================================== */

(() => {
  if (window.__novashieldML) return;
  window.__novashieldML = true;

  let activated = false;
  let enabled = true;
  let mlEnabled = true;

  try { activated = localStorage.getItem("__novashield_activated") === "1"; } catch (e) {}

  window.addEventListener("__novashield_state", (e) => {
    if (!e.detail) return;
    if (typeof e.detail.activated !== "undefined") activated = !!e.detail.activated;
    if (typeof e.detail.enabled !== "undefined") enabled = !!e.detail.enabled;
    if (typeof e.detail.mlEnabled !== "undefined") mlEnabled = !!e.detail.mlEnabled;
  });
  window.dispatchEvent(new CustomEvent("__novashield_state_request"));

  /* ================================================================== *
   * FEATURE 1: URL Scoring (0-40 points)
   * ================================================================== */
  const URL_AD_PATTERNS = [
    // High confidence (40 pts)
    { pattern: /doubleclick\.net/i, score: 40 },
    { pattern: /googlesyndication\.com/i, score: 40 },
    { pattern: /googleadservices\.com/i, score: 40 },
    { pattern: /googletagservices\.com/i, score: 40 },
    { pattern: /amazon-adsystem\.com/i, score: 40 },
    { pattern: /adsystem\.com/i, score: 35 },
    { pattern: /adsense\.com/i, score: 40 },
    { pattern: /2mdn\.net/i, score: 35 },
    { pattern: /pubads\.g\.doubleclick/i, score: 40 },
    { pattern: /securepubads\.g\.doubleclick/i, score: 40 },
    // Monetag network
    { pattern: /quge\d+\.com/i, score: 40 },
    { pattern: /monetag\.com/i, score: 40 },
    { pattern: /monetag-cdn\.com/i, score: 40 },
    { pattern: /propellerads\.com/i, score: 40 },
    { pattern: /propeller-tracking\.com/i, score: 40 },
    { pattern: /momrollback\.com/i, score: 40 },
    { pattern: /momroll\.com/i, score: 35 },
    { pattern: /rolfron\.com/i, score: 35 },
    { pattern: /clickadu\.com/i, score: 35 },
    // Popunder/popup
    { pattern: /popads\.net/i, score: 40 },
    { pattern: /popcash\.net/i, score: 40 },
    { pattern: /adsterra\.com/i, score: 40 },
    { pattern: /hilltopads\.net/i, score: 35 },
    { pattern: /adcash\.com/i, score: 35 },
    { pattern: /popmyads\.com/i, score: 35 },
    // Adult ads
    { pattern: /exoclick\.com/i, score: 40 },
    { pattern: /exosrv\.com/i, score: 40 },
    { pattern: /juicyads\.com/i, score: 40 },
    { pattern: /trafficjunky/i, score: 35 },
    { pattern: /ero-advertising/i, score: 35 },
    // URL shorteners with ads
    { pattern: /adf\.ly/i, score: 30 },
    { pattern: /adfly\.com/i, score: 30 },
    { pattern: /shorte\.st/i, score: 30 },
    { pattern: /linkbucks\.com/i, score: 30 },
    // Tracker
    { pattern: /google-analytics\.com/i, score: 35 },
    { pattern: /googletagmanager\.com/i, score: 30 },
    { pattern: /facebook\.net/i, score: 30 },
    { pattern: /connect\.facebook\.net/i, score: 30 },
    { pattern: /facebook\.com\/tr/i, score: 30 },
    { pattern: /hotjar\.com/i, score: 30 },
    { pattern: /mixpanel\.com/i, score: 30 },
    { pattern: /clarity\.ms/i, score: 30 },
    { pattern: /scorecardresearch\.com/i, score: 30 },
    { pattern: /quantserve\.com/i, score: 30 },
    // Ad networks
    { pattern: /adnxs\.com/i, score: 40 },
    { pattern: /appnexus\.com/i, score: 40 },
    { pattern: /pubmatic\.com/i, score: 40 },
    { pattern: /rubiconproject\.com/i, score: 40 },
    { pattern: /openx\.net/i, score: 40 },
    { pattern: /criteo\.com/i, score: 40 },
    { pattern: /criteo\.net/i, score: 40 },
    { pattern: /taboola\.com/i, score: 40 },
    { pattern: /outbrain\.com/i, score: 40 },
    { pattern: /revcontent\.com/i, score: 35 },
    { pattern: /mgid\.com/i, score: 35 },
    { pattern: /adsrvr\.org/i, score: 35 },
    // Crypto miners
    { pattern: /coinhive\.com/i, score: 40 },
    { pattern: /coin-hive\.com/i, score: 40 },
    { pattern: /cryptoloot\.com/i, score: 40 },
    // Indonesian ad networks
    { pattern: /adstars\.co\.id/i, score: 35 },
    { pattern: /adplus\.id/i, score: 35 },
    { pattern: /ads\.kompas\.com/i, score: 35 },
    { pattern: /ads\.tribunnews\.com/i, score: 35 },
    { pattern: /ads\.detik\.com/i, score: 35 },
  ];

  // Medium confidence patterns (15-25 pts)
  const URL_MEDIUM_PATTERNS = [
    { pattern: /\/ads\//i, score: 20 },
    { pattern: /\/advert/i, score: 20 },
    { pattern: /\/banner/i, score: 15 },
    { pattern: /\/pagead\//i, score: 25 },
    { pattern: /\/popunder\//i, score: 25 },
    { pattern: /\/popup\//i, score: 20 },
    { pattern: /\/adserver\//i, score: 20 },
    { pattern: /\/adimage/i, score: 15 },
    { pattern: /\/adview/i, score: 15 },
    { pattern: /\/adframe/i, score: 20 },
    { pattern: /\/adsbygoogle\.js/i, score: 30 },
    { pattern: /\/show_ads\.js/i, score: 30 },
    { pattern: /\/tag\.min\.js/i, score: 25 },
    { pattern: /\/\d+\/tag\.min\.js/i, score: 35 },
    { pattern: /\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{32}\.js/i, score: 30 },
    { pattern: /\.ads\./i, score: 15 },
    { pattern: /-ads-/i, score: 10 },
    { pattern: /_ads_/i, score: 10 },
    { pattern: /ad-\d+x\d+/i, score: 20 }, // ad-300x250
    { pattern: /\d+x\d+\.gif/i, score: 15 }, // 300x250.gif
  ];

  // TLD reputation (suspicious TLDs)
  const SUSPICIOUS_TLDS = [
    /\.tk$/i, /\.ml$/i, /\.ga$/i, /\.cf$/i, /\.gq$/i,
    /\.top$/i, /\.click$/i, /\.loan$/i, /\.work$/i,
    /\.men$/i, /\.date$/i, /\.review$/i, /\.party$/i,
    /\.download$/i, /\.stream$/i, /\.science$/i,
  ];

  function scoreURL(url) {
    if (!url || typeof url !== "string") return 0;
    if (url.startsWith("javascript:") || url.startsWith("#") || url.startsWith("data:")) return 0;

    let score = 0;
    // High confidence patterns
    for (const { pattern, score: s } of URL_AD_PATTERNS) {
      if (pattern.test(url)) {
        score = Math.max(score, s);
        break; // Take highest
      }
    }
    // Medium confidence (additive, but cap at 40)
    if (score < 40) {
      for (const { pattern, score: s } of URL_MEDIUM_PATTERNS) {
        if (pattern.test(url)) {
          score += s;
          if (score > 40) score = 40;
        }
      }
    }
    // Suspicious TLD bonus
    try {
      const u = new URL(url, window.location.href);
      for (const tld of SUSPICIOUS_TLDS) {
        if (tld.test(u.hostname)) {
          score += 10;
          break;
        }
      }
      // Subdomain pattern: ad.domain.com, ads.domain.com
      if (/^ads?\./i.test(u.hostname) || /\.ads?\./i.test(u.hostname)) {
        score += 15;
      }
    } catch (e) {}
    return Math.min(score, 50);
  }

  /* ================================================================== *
   * FEATURE 2: Element Scoring (0-30 points)
   * ================================================================== */
  const ELEMENT_AD_INDICATORS = [
    { pattern: /^ad-/i, score: 20 },
    { pattern: /^ad_/i, score: 20 },
    { pattern: /^ads-/i, score: 20 },
    { pattern: /^ads_/i, score: 20 },
    { pattern: /^adsense/i, score: 25 },
    { pattern: /^adspot/i, score: 20 },
    { pattern: /^advert/i, score: 25 },
    { pattern: /^banner-ad/i, score: 20 },
    { pattern: /^google_ads/i, score: 25 },
    { pattern: /^div-gpt-ad/i, score: 25 },
    { pattern: /adsbygoogle/i, score: 25 },
    { pattern: /ad-container/i, score: 15 },
    { pattern: /ad-wrapper/i, score: 15 },
    { pattern: /ad-zone/i, score: 15 },
    { pattern: /ad-slot/i, score: 20 },
    { pattern: /ad-banner/i, score: 20 },
    { pattern: /ad-leaderboard/i, score: 20 },
    { pattern: /ad-rectangle/i, score: 20 },
    { pattern: /ad-skyscraper/i, score: 20 },
    { pattern: /sponsored/i, score: 20 },
    { pattern: /promo-box/i, score: 15 },
    { pattern: /promoted/i, score: 15 },
    { pattern: /outbrain/i, score: 25 },
    { pattern: /taboola/i, score: 25 },
    { pattern: /rev-content/i, score: 20 },
    { pattern: /mgid/i, score: 20 },
    { pattern: /adsterra/i, score: 25 },
    { pattern: /-ad$/i, score: 15 },
    { pattern: /_ad$/i, score: 15 },
    { pattern: /-ads$/i, score: 15 },
    { pattern: /_ads$/i, score: 15 },
    { pattern: /data-ad/i, score: 20 },
    { pattern: /data-ad-slot/i, score: 25 },
    { pattern: /data-ad-client/i, score: 25 },
    { pattern: /data-adsbygoogle/i, score: 25 },
    { pattern: /data-sponsored/i, score: 20 },
    { pattern: /data-promoted/i, score: 15 },
  ];

  function scoreElement(el) {
    if (!el || !el.tagName) return 0;
    let score = 0;
    const cls = (el.className && typeof el.className === "string") ? el.className : "";
    const id = el.id || "";
    const test = (cls + " " + id).toLowerCase();

    for (const { pattern, score: s } of ELEMENT_AD_INDICATORS) {
      if (pattern.test(test)) {
        score = Math.max(score, s);
      }
    }

    // Ad sizes (300x250, 728x90, 160x600, 970x250)
    const style = window.getComputedStyle(el);
    const w = parseInt(style.width, 10);
    const h = parseInt(style.height, 10);
    if (w && h) {
      const adSizes = [
        [300, 250], [728, 90], [160, 600], [970, 250], [970, 90],
        [300, 600], [320, 50], [320, 100], [336, 280], [234, 60],
      ];
      for (const [aw, ah] of adSizes) {
        if (Math.abs(w - aw) <= 5 && Math.abs(h - ah) <= 5) {
          score += 15;
          break;
        }
      }
    }

    // Iframe with ad-like src
    if (el.tagName === "IFRAME") {
      const src = el.src || "";
      if (src) {
        const urlScore = scoreURL(src) * 0.5; // weight 50%
        score += urlScore;
      }
    }

    // Script with ad-like src
    if (el.tagName === "SCRIPT") {
      const src = el.src || "";
      if (src) {
        const urlScore = scoreURL(src) * 0.6;
        score += urlScore;
      }
    }

    // Ins element (AdSense)
    if (el.tagName === "INS") {
      score += 20;
    }

    return Math.min(score, 30);
  }

  /* ================================================================== *
   * FEATURE 3: Content/Text Scoring (0-30 points)
   * ================================================================== */
  const CONTENT_AD_KEYWORDS = [
    // Gambling (Indonesian + English)
    { pattern: /\b(judi|casino|slot|togel|poker|bandar|maxwin|gacor|pragmatic|pg\s*soft|sbobet|imaxwin|situs\s*judi)\b/i, score: 25 },
    { pattern: /\b(agen\s*bola|taruhan|betting|jackpot|deposit\s*pulsa|rtp\s*live)\b/i, score: 20 },
    // Adult
    { pattern: /\b(bokep|xxx|porn|sex|adult|nude|naked|hentai|milf|teen\s*porn)\b/i, score: 25 },
    { pattern: /\b(bokep\s*indonesia|video\s*bokep|streaming\s*bokep)\b/i, score: 25 },
    // Scam
    { pattern: /\b(you\s*won|congratulations|you\s*are\s*the\s*\d+\s*visitor|claim\s*your\s*prize)\b/i, score: 20 },
    { pattern: /\b(your\s*(pc|phone|computer)\s*(has|is)\s*(been\s*)?(infected|compromised|locked))\b/i, score: 25 },
    { pattern: /\b(call\s*(microsoft|apple|windows|support)\s*(now|immediately))\b/i, score: 25 },
    { pattern: /\b(free\s*(bitcoin|btc|crypto|giveaway|airdrop))\b/i, score: 20 },
    { pattern: /\b(\d+\s*viruses?\s*(found|detected))\b/i, score: 25 },
    // Ad call-to-action
    { pattern: /\b(click\s*here|klik\s*disini|klik\s*sekarang|download\s*now|get\s*it\s*now)\b/i, score: 8 },
    { pattern: /\b(buy\s*now|shop\s*now|order\s*now|sign\s*up\s*free)\b/i, score: 8 },
    { pattern: /\b(sponsored|advertisement|iklan|promoted)\b/i, score: 15 },
    // Dating
    { pattern: /\b(local\s*singles|meet\s*single\s*women|dating\s*near\s*you|hot\s*singles)\b/i, score: 20 },
    // Pharmacy
    { pattern: /\b(buy\s*viagra|cialis|weight\s*loss\s*pill|diet\s*pill)\b/i, score: 20 },
  ];

  function scoreContent(text) {
    if (!text || typeof text !== "string") return 0;
    if (text.length < 3 || text.length > 500) return 0;
    let score = 0;
    for (const { pattern, score: s } of CONTENT_AD_KEYWORDS) {
      if (pattern.test(text)) {
        score = Math.max(score, s);
      }
    }
    return Math.min(score, 30);
  }

  /* ================================================================== *
   * COMBINED SCORING: classify element/URL as ad
   * ================================================================== */
  function classifyAd(url, el, text) {
    if (!activated || !enabled || !mlEnabled) return { isAd: false, score: 0 };

    let totalScore = 0;
    const reasons = [];

    // URL features
    if (url) {
      const urlScore = scoreURL(url);
      totalScore += urlScore;
      if (urlScore > 20) reasons.push(`url:${urlScore}`);
    }

    // Element features
    if (el) {
      const elScore = scoreElement(el);
      totalScore += elScore;
      if (elScore > 10) reasons.push(`element:${elScore}`);
    }

    // Content features
    if (text) {
      const contentScore = scoreContent(text);
      totalScore += contentScore;
      if (contentScore > 10) reasons.push(`content:${contentScore}`);
    }

    // Threshold: 60+ = ad
    const isAd = totalScore >= 60;
    return { isAd, score: totalScore, reasons };
  }

  /* ================================================================== *
   * EXPORT: expose classifier for other scripts
   * ================================================================== */
  window.__novashieldClassify = classifyAd;
  window.__novashieldScoreURL = scoreURL;
  window.__novashieldScoreElement = scoreElement;
  window.__novashieldScoreContent = scoreContent;

  /* ================================================================== *
   * AUTO-SCAN: scan new elements added to DOM
   * ================================================================== */
  function scanElement(el) {
    if (!activated || !enabled || !mlEnabled) return;
    if (!el || !el.tagName) return;

    // Get URL from element
    const url = el.src || el.href || "";
    const text = (el.textContent || "").trim().substring(0, 200);

    const result = classifyAd(url, el, text);
    if (result.isAd) {
      console.log(`[NovaShield][ML] Ad detected (score: ${result.score}, ${result.reasons.join(",")})`);
      // Hide element
      try {
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        el.style.setProperty("opacity", "0", "important");
      } catch (e) {}
      // Notify counter
      try {
        window.dispatchEvent(new CustomEvent("__novashield_blocked_request", {
          detail: { type: "ml_ad", url: url || "element", score: result.score }
        }));
      } catch (e) {}
    }
  }

  // Scan on DOM ready
  function scanAll() {
    if (!activated || !enabled || !mlEnabled) return;
    const candidates = document.querySelectorAll(
      "div, iframe, ins, script, img, a, span, p"
    );
    candidates.forEach((el) => {
      // Skip if too small or too large
      const text = (el.textContent || "").trim();
      if (text.length > 500) return;
      scanElement(el);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(scanAll, 500);
    });
  } else {
    setTimeout(scanAll, 500);
  }

  // MutationObserver for new elements
  const obs = new MutationObserver((mutations) => {
    if (!activated || !enabled || !mlEnabled) return;
    for (const m of mutations) {
      if (m.addedNodes) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            scanElement(node);
            // Also scan children
            if (node.querySelectorAll) {
              node.querySelectorAll("div, iframe, ins, script, img, a").forEach(scanElement);
            }
          }
        });
      }
    }
  });

  if (document.documentElement) {
    try {
      obs.observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
  }

  console.info("[NovaShield][ML] Heuristic classifier aktif");
})();
