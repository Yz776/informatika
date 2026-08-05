/* =====================================================================
 * NovaShield v3.8.2 - Google Search Auto-Redirect (BULLETPROOF)
 * ---------------------------------------------------------------------
 * FIXES:
 *   - Match ALL Google domains (not just .com and .co.id)
 *   - Run at document_start (not document_idle)
 *   - Use location.href instead of link.click() (Google blocks clicks)
 *   - Better selector coverage (Google 2025)
 *   - Retry with exponential backoff
 * ===================================================================== */

(() => {
  // Match ALL Google search domains
  if (!location.hostname.match(/google\.[a-z.]{2,}$/i)) return;
  if (!location.pathname.startsWith("/search")) return;

  // Check if this is the activation search
  const params = new URLSearchParams(location.search);
  const query = params.get("q") || "";
  if (!query.toLowerCase().includes("mohammad ahsan al ghoni")) return;

  console.log("[NovaShield][Google] Activation search detected on:", location.hostname);

  const OFFICIAL_DOMAINS = [
    "ahsangresik.me",
    "erd7.eu.org",
    "ahsann.is-a.dev",
  ];

  function isOfficialDomain(url) {
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase().replace(/^www\./, "");
      return OFFICIAL_DOMAINS.includes(host);
    } catch (e) {
      return false;
    }
  }

  function extractUrl(href) {
    if (!href) return null;
    // Handle Google redirect links (/url?q=...)
    if (href.startsWith("/url?q=") || href.includes("/url?q=")) {
      const match = href.match(/[?&]q=([^&]+)/);
      if (match) return decodeURIComponent(match[1]);
    }
    if (href.startsWith("http")) return href;
    return null;
  }

  function findBestResult() {
    // Comprehensive selectors (Google 2025 layout)
    const selectors = [
      "#search .g h3 a",
      "#search h3 a",
      "#rso .g h3 a",
      "div.g h3 a",
      ".yuRUbf h3 a",
      ".yuRUbf a",
      "#search a h3",
      "h3 a[href^='http']",
      "a[data-jsarwt='1']",
      "a[href^='/url?q=']",
      "div[data-ved] a h3",
      "//a[contains(@href,'ahsangresik')]",
    ];

    const allResults = [];
    const seen = new Set();

    for (const sel of selectors) {
      try {
        const links = document.querySelectorAll(sel);
        for (const link of links) {
          const rawHref = link.href || link.getAttribute("href") || "";
          const url = extractUrl(rawHref);
          if (!url || seen.has(url)) continue;
          // Skip google internal
          if (url.includes("google.") && !url.includes("ahsangresik")) continue;
          seen.add(url);
          allResults.push({ link, url, element: link });
        }
      } catch (e) {}
    }

    if (allResults.length === 0) return null;

    // Priority 1: Official domains
    for (const result of allResults) {
      if (isOfficialDomain(result.url)) {
        console.log("[NovaShield][Google] Found official domain:", result.url);
        return result;
      }
    }

    // Priority 2: URL contains ahsan/gresik/erd7
    for (const result of allResults) {
      const lower = result.url.toLowerCase();
      if (lower.includes("ahsan") || lower.includes("gresik") || lower.includes("erd7")) {
        console.log("[NovaShield][Google] Found related domain:", result.url);
        return result;
      }
    }

    // Priority 3: First result
    console.log("[NovaShield][Google] Fallback to first result:", allResults[0].url);
    return allResults[0];
  }

  function navigateToResult() {
    const result = findBestResult();
    if (!result) return false;

    console.log("[NovaShield][Google] Navigating to:", result.url);

    // Method 1: location.href (most reliable, bypasses Google's click interception)
    try {
      window.location.href = result.url;
      return true;
    } catch (e) {}

    // Method 2: location.assign
    try {
      window.location.assign(result.url);
      return true;
    } catch (e) {}

    // Method 3: location.replace (no history entry)
    try {
      window.location.replace(result.url);
      return true;
    } catch (e) {}

    // Method 4: Fallback to click (may not work due to Google CSP)
    try {
      result.element.click();
      return true;
    } catch (e) {}

    // Method 5: Open in same tab via window.open
    try {
      window.open(result.url, "_self");
      return true;
    } catch (e) {}

    return false;
  }

  // Retry with exponential backoff
  // Google renders results via JS, so we need to wait
  let attempts = 0;
  const maxAttempts = 25;
  const delays = [100, 300, 500, 800, 1200, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];

  function tryNavigate() {
    if (attempts >= maxAttempts) {
      console.log("[NovaShield][Google] Max attempts reached, giving up");
      return;
    }
    attempts++;
    console.log(`[NovaShield][Google] Attempt ${attempts}/${maxAttempts}`);

    if (navigateToResult()) {
      console.log("[NovaShield][Google] Navigation triggered");
      return;
    }

    // Schedule next attempt
    const delay = delays[Math.min(attempts - 1, delays.length - 1)];
    setTimeout(tryNavigate, delay);
  }

  // Start immediately
  tryNavigate();
})();
