/* =====================================================================
 * Adblock Gresik v2.1 - Google Search Auto-Redirect
 * ---------------------------------------------------------------------
 * Saat new install, extension membuka Google search "mohammad ahsan al ghoni".
 * Script ini auto-click hasil organic pertama untuk mengarahkan user ke
 * website Ahsan Gresik (yang ada menu aktivasi).
 * ===================================================================== */

(() => {
  // Only run on Google search results pages
  if (!location.hostname.includes("google.")) return;
  if (!location.pathname.startsWith("/search")) return;

  // Check if this is the activation search
  const params = new URLSearchParams(location.search);
  const query = params.get("q") || "";
  if (!query.toLowerCase().includes("mohammad ahsan al ghoni")) return;

  console.log("[Adblock Gresik] Activation search detected, auto-clicking first result...");

  function findFirstOrganicResult() {
    // Modern Google selectors (2024-2025)
    const selectors = [
      // Search results container
      "#search .g h3 a",
      "#search h3 a",
      "#rso .g h3 a",
      "div.g h3 a",
      ".yuRUbf h3 a",
      ".yuRUbf a",
      // Fallbacks
      "#search a h3",
      "h3 a[href^='http']",
    ];

    for (const sel of selectors) {
      const links = document.querySelectorAll(sel);
      for (const link of links) {
        const href = link.href || link.getAttribute("href") || "";
        // Must be a real http link (not google internal)
        if (href.startsWith("http") && !href.includes("google.com") && !href.includes("google.co.")) {
          return link;
        }
      }
    }
    return null;
  }

  function attemptClick() {
    const link = findFirstOrganicResult();
    if (link) {
      console.log("[Adblock Gresik] Found first result:", link.href);
      // Set a flag so content-activation.js on the destination knows this is an activation flow
      try { sessionStorage.setItem("__adbg_activation_flow", "1"); } catch (e) {}
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
  setTimeout(attemptClick, 1500);
  setTimeout(attemptClick, 3000);
})();
