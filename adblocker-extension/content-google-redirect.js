/* =====================================================================
 * NovaShield v3.8 - Google Search Auto-Redirect (FIXED)
 * ---------------------------------------------------------------------
 * Saat new install, extension membuka Google search "mohammad ahsan al ghoni".
 * Script ini auto-click hasil organic pertama yang mengarah ke salah satu
 * domain resmi: ahsangresik.me, erd7.eu.org, atau ahsann.is-a.dev.
 *
 * FIXES v3.8:
 *   - Fix syntax error: "h3 aref^='http']" -> "h3 a[href^='http']"
 *   - Prioritize domain ahsangresik.me/erd7/ahsann dalam hasil pencarian
 *   - Fallback: klik result pertama jika tidak ada domain match
 *   - Better selector coverage (Google 2025 layout)
 * ===================================================================== */

(() => {
  // Only run on Google search results pages
  if (!location.hostname.includes("google.")) return;
  if (!location.pathname.startsWith("/search")) return;

  // Check if this is the activation search
  const params = new URLSearchParams(location.search);
  const query = params.get("q") || "";
  if (!query.toLowerCase().includes("mohammad ahsan al ghoni")) return;

  console.log("[NovaShield] Activation search detected, auto-clicking first result...");

  // Official domains (priority order)
  const OFFICIAL_DOMAINS = [
    "ahsangresik.me",
    "erd7.eu.org",
    "ahsann.is-a.dev",
    "www.ahsangresik.me",
    "www.erd7.eu.org",
    "www.ahsann.is-a.dev",
  ];

  function isOfficialDomain(url) {
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase();
      return OFFICIAL_DOMAINS.some((d) => host === d || host.endsWith("." + d));
    } catch (e) {
      return false;
    }
  }

  function findFirstOrganicResult() {
    // Modern Google selectors (2025)
    const selectors = [
      "#search .g h3 a",
      "#search h3 a",
      "#rso .g h3 a",
      "div.g h3 a",
      ".yuRUbf h3 a",
      ".yuRUbf a",
      "#search a h3",
      "h3 a[href^='http']",  // FIXED: was "h3 aref^='http']"
      "a[data-jsarwt='1']",
      "a[href^='/url?q=']",  // Google redirect links
    ];

    const allResults = [];
    for (const sel of selectors) {
      try {
        const links = document.querySelectorAll(sel);
        for (const link of links) {
          const href = link.href || link.getAttribute("href") || "";
          if (!href) continue;
          // Skip google internal links
          if (href.includes("google.com") || href.includes("google.co.")) continue;
          // Handle Google redirect links (/url?q=...)
          let finalUrl = href;
          if (href.startsWith("/url?q=")) {
            const match = href.match(/[?&]q=([^&]+)/);
            if (match) finalUrl = decodeURIComponent(match[1]);
          }
          if (finalUrl.startsWith("http")) {
            allResults.push({ link, url: finalUrl });
          }
        }
      } catch (e) {}
    }

    if (allResults.length === 0) return null;

    // Priority 1: Find result matching official domains
    for (const result of allResults) {
      if (isOfficialDomain(result.url)) {
        console.log("[NovaShield] Found official domain result:", result.url);
        return result.link;
      }
    }

    // Priority 2: Find result containing "ahsan" or "gresik" in URL
    for (const result of allResults) {
      const lower = result.url.toLowerCase();
      if (lower.includes("ahsan") || lower.includes("gresik") || lower.includes("erd7")) {
        console.log("[NovaShield] Found ahsan-related result:", result.url);
        return result.link;
      }
    }

    // Priority 3: Fallback to first organic result
    console.log("[NovaShield] Fallback to first result:", allResults[0].url);
    return allResults[0].link;
  }

  function attemptClick() {
    const link = findFirstOrganicResult();
    if (link) {
      console.log("[NovaShield] Clicking result:", link.href);
      // Set a flag so content-activation.js on the destination knows this is an activation flow
      try { sessionStorage.setItem("__novashield_activation_flow", "1"); } catch (e) {}
      // Click to navigate
      link.click();
      return true;
    }
    return false;
  }

  // Try multiple times since Google renders dynamically
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (attemptClick() || attempts > 30) {
      clearInterval(interval);
    }
  }, 200);

  // Also try immediately
  setTimeout(attemptClick, 500);
  setTimeout(attemptClick, 1000);
  setTimeout(attemptClick, 2000);
  setTimeout(attemptClick, 3500);
})();
