/* =====================================================================
 * NovaShield v3.6 - Redirect Engine (uBlock-style)
 * ---------------------------------------------------------------------
 * Inspired by uBlock Origin's redirect-engine.js
 *
 * Redirects blocked resources to neutered versions:
 *   - 1x1.gif: transparent 1px image (for ad images)
 *   - empty.js: empty JS file (for ad scripts)
 *   - empty: empty response (for fetch/XHR)
 *   - noop.js: function that does nothing
 *   - click2load.html: placeholder for iframes
 *
 * This makes scripts that expect ad resources to load not crash,
 * preventing anti-adblock detection.
 * ===================================================================== */

// Data URLs for neutered resources (no network request needed)
const REDIRECT_RESOURCES = {
  // Transparent 1x1 GIF
  "1x1.gif": "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
  // 1x1 transparent PNG
  "1x1-transparent.gif": "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  // 2x2 transparent PNG
  "2x2.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
  // 32x32 transparent PNG
  "32x32.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0Q2FwAADT589rDgAAABBJREFUeNrtky0NAAAEgwF0f7sJUgAAAABJRU5ErkJggg==",
  // Empty JS (returns undefined)
  "empty.js": "data:application/javascript;base64,",
  // Noop JS (function that does nothing)
  "noop.js": "data:application/javascript;base64,KCk9Pnt9",
  // Empty HTML
  "empty": "data:text/html;base64,",
  // Empty text
  "empty.txt": "data:text/plain;base64,",
  // Noop function for ad slots
  "adsbygoogle.js": "data:application/javascript;base64,KHRoaXMpLmFkc2J5Z29vZ2xlPSh0aGlzKS5hZHNieWdvb2dsZXx8W107KHdpbmRvdykuYWRzYnlnb29nbGU9KHdpbmRvdykuYWRzYnlnb29nbGV8fFtdOyh0aGlzKS5hZHNieWdvb2dsZS5wdXNoPWZ1bmN0aW9uKCl7fTs=",
  // DoubleClick noop
  "doubleclick_instream_ad_status.js": "data:application/javascript;base64,d2luZG93Lnl0dGJhY2tJbnN0cmVhbUFkU3RhdHVzPWZ1bmN0aW9uKCl7cmV0dXJuIGZhbHNlfTs=",
  // Chartbeat noop
  "chartbeat.js": "data:application/javascript;base64,d2luZG93Ll9zcF9wYWdlPSJub3NoZWxwZXIiO3dpbmRvdy5jaGFydGJlYXQ9e3N0YXJ0OmZ1bmN0aW9uKCl7fSx0aW1lb3V0OmZ1bmN0aW9uKCl7fSx0cmFja0V2ZW50OmZ1bmN0aW9uKCl7fX07",
  // Amazon ads noop
  "amazon_ads.js": "data:application/javascript;base64,d2luZG93LmFtYXpvbi5hZHM9e3JlYWR5OmZ1bmN0aW9uKCl7fSxwdXNoOmZ1bmN0aW9uKCl7fSxyZWZyZXNoOmZ1bmN0aW9uKCl7fX07",
};

// Aliases (uBlock compatibility)
const REDIRECT_ALIASES = {
  "1x1-transparent.gif": "1x1.gif",
  "1x1": "1x1.gif",
  "noopjs": "noop.js",
  "empty-js": "empty.js",
  "adsbygoogle": "adsbygoogle.js",
  "chartbeat": "chartbeat.js",
  "amazon-adsystem": "amazon_ads.js",
};

// Map of URL patterns to redirect resources
// When these URLs are blocked, redirect to neutered resource instead
const REDIRECT_RULES = [
  // Google AdSense scripts -> adsbygoogle.js noop
  { pattern: /googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/i, resource: "adsbygoogle.js" },
  { pattern: /googlesyndication\.com\/pagead\/js\/show_ads\.js/i, resource: "noop.js" },
  { pattern: /pagead2\.googlesyndication\.com\/pagead\/js\/.*\.js/i, resource: "noop.js" },
  // DoubleClick
  { pattern: /doubleclick\.net\/.*\.js/i, resource: "noop.js" },
  { pattern: /doubleclick\.net\/instream\/ad_status\.js/i, resource: "doubleclick_instream_ad_status.js" },
  { pattern: /doubleclick\.net\/.*\/(image|adview)/i, resource: "1x1.gif" },
  // Chartbeat
  { pattern: /chartbeat\.js|chartbeat_video\.js/i, resource: "chartbeat.js" },
  // Amazon ads
  { pattern: /amazon-adsystem\.com\/.*\.js/i, resource: "amazon_ads.js" },
  // Ad images -> 1x1 transparent gif
  { pattern: /googlesyndication\.com\/.*\.(gif|jpg|png)/i, resource: "1x1.gif" },
  { pattern: /doubleclick\.net\/.*\.(gif|jpg|png)/i, resource: "1x1.gif" },
  { pattern: /adsystem\.com\/.*\.(gif|jpg|png)/i, resource: "1x1.gif" },
  // Empty for iframes
  { pattern: /googlesyndication\.com\/.*\/iframe/i, resource: "empty" },
];

// Export for use in background/content scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = { REDIRECT_RESOURCES, REDIRECT_ALIASES, REDIRECT_RULES };
}

// Also expose globally for content scripts
if (typeof window !== "undefined") {
  window.__novashieldRedirectResources = REDIRECT_RESOURCES;
  window.__novashieldRedirectAliases = REDIRECT_ALIASES;
  window.__novashieldRedirectRules = REDIRECT_RULES;
}
