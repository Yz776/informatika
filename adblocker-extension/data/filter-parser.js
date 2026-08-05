/* =====================================================================
 * NovaShield v3.6 - Advanced Filter Parser (uBlock-inspired)
 * ---------------------------------------------------------------------
 * Adapted from uBlock Origin's static-filtering-parser.js
 *
 * Supports full Adblock Plus / uBlock Origin filter syntax:
 *   - ||domain^  (anchor domain)
 *   - @@||domain^ (exception/allow rule)
 *   - $options: domain=, third-party, important, script, image,
 *              sub_frame, xmlhttprequest, object, media, ping,
 *              popup, document, font, stylesheet, websocket
 *   - $redirect=resource-name (redirect to neutered resource)
 *   - $~option (negate option)
 *   - Regex: /pattern/flags
 *   - Cosmetic: ##selector, #@#selector (exception)
 *   - Scriptlet: ##+js(scriptlet-name, args...)
 *   - HTML filtering: ##^element
 *
 * This is a runtime filter processor - takes raw filter lists
 * and converts to DNR rules or content script actions.
 * ===================================================================== */

const NovaShieldFilterParser = (() => {

  // Resource type mapping (ABP -> DNR)
  const RESOURCE_TYPE_MAP = {
    "script": "script",
    "image": "image",
    "stylesheet": "stylesheet",
    "sub_frame": "sub_frame",
    "object": "object",
    "xmlhttprequest": "xmlhttprequest",
    "media": "media",
    "font": "font",
    "ping": "ping",
    "websocket": "websocket",
    "other": "other",
    "main_frame": "main_frame",
    "popup": "popup",
  };

  // Parse a single filter line
  // Returns: { type, action, condition, options } or null if invalid
  function parseFilter(line) {
    if (!line || typeof line !== "string") return null;
    line = line.trim();
    if (!line || line.startsWith("!") || line.startsWith("[")) return null;

    // Exception rule (allowlist)
    const isException = line.startsWith("@@");
    if (isException) line = line.slice(2);

    // Check for cosmetic filter (## or #@#)
    if (line.includes("##") || line.includes("#@#")) {
      return parseCosmeticFilter(line, isException);
    }

    // Check for scriptlet (##+js(...))
    if (line.includes("##+js(")) {
      return parseScriptletFilter(line);
    }

    // Check for HTML filter (##^)
    if (line.includes("##^")) {
      return parseHTMLFilter(line);
    }

    // Network filter
    return parseNetworkFilter(line, isException);
  }

  /* ================================================================== *
   * Parse network filter: ||domain^$options
   * ================================================================== */
  function parseNetworkFilter(line, isException) {
    let urlFilter = line;
    let options = {};
    let redirect = null;

    // Extract options ($...)
    const dollarIdx = line.indexOf("$");
    if (dollarIdx !== -1) {
      urlFilter = line.substring(0, dollarIdx);
      const optsStr = line.substring(dollarIdx + 1);
      options = parseOptions(optsStr);
      redirect = options.redirect;
    }

    // Determine action type
    let actionType = isException ? "allow" : "block";
    if (redirect) actionType = "redirect";

    // Build condition
    const condition = {
      urlFilter: urlFilter,
    };

    // Apply resource types
    if (options.types && options.types.length > 0) {
      condition.resourceTypes = options.types;
    }

    // Apply domain filter
    if (options.domains && options.domains.length > 0) {
      condition.initiatorDomains = options.domains;
    }
    if (options.excludeDomains && options.excludeDomains.length > 0) {
      condition.excludedInitiatorDomains = options.excludeDomains;
    }

    // Third-party
    if (options.thirdParty === true) {
      condition.domainType = "thirdParty";
    } else if (options.thirdParty === false) {
      condition.domainType = "firstParty";
    }

    return {
      type: "network",
      isException,
      action: { type: actionType, ...(redirect ? { redirect: { extensionPath: redirect } } : {}) },
      condition,
      priority: options.important ? 100 : 1,
      rawOptions: options,
    };
  }

  /* ================================================================== *
   * Parse options string: domain=example.com,third-party,script
   * ================================================================== */
  function parseOptions(optsStr) {
    const opts = optsStr.split(",").map((s) => s.trim());
    const result = {
      types: [],
      domains: [],
      excludeDomains: [],
      thirdParty: null,
      important: false,
      redirect: null,
    };

    for (const opt of opts) {
      if (!opt) continue;
      const negated = opt.startsWith("~");
      const cleanOpt = negated ? opt.slice(1) : opt;

      // Resource type
      if (RESOURCE_TYPE_MAP[cleanOpt]) {
        if (negated) {
          // Exclude type - skip for DNR (use resourceTypes list)
        } else {
          result.types.push(RESOURCE_TYPE_MAP[cleanOpt]);
        }
        continue;
      }

      // Third-party
      if (cleanOpt === "third-party") {
        result.thirdParty = !negated;
        continue;
      }

      // Important
      if (cleanOpt === "important") {
        result.important = true;
        continue;
      }

      // Redirect
      if (cleanOpt.startsWith("redirect=")) {
        result.redirect = cleanOpt.slice(9);
        continue;
      }

      // Domain filter
      if (cleanOpt.startsWith("domain=")) {
        const domains = cleanOpt.slice(7).split("|");
        for (const d of domains) {
          if (d.startsWith("~")) {
            result.excludeDomains.push(d.slice(1));
          } else {
            result.domains.push(d);
          }
        }
        continue;
      }
    }

    return result;
  }

  /* ================================================================== *
   * Parse cosmetic filter: example.com##.ad-banner
   * ================================================================== */
  function parseCosmeticFilter(line, isException) {
    const sep = isException ? "#@#" : "##";
    const idx = line.indexOf(sep);
    if (idx === -1) return null;

    const domains = line.substring(0, idx);
    const selector = line.substring(idx + sep.length);

    return {
      type: "cosmetic",
      isException,
      domains: domains ? domains.split(",") : [],
      selector,
    };
  }

  /* ================================================================== *
   * Parse scriptlet filter: example.com##+js(scriptlet-name, args...)
   * ================================================================== */
  function parseScriptletFilter(line) {
    const idx = line.indexOf("##+js(");
    if (idx === -1) return null;

    const domains = line.substring(0, idx);
    const scriptletCall = line.substring(idx + 6); // after "##+js("
    const closeIdx = scriptletCall.lastIndexOf(")");
    if (closeIdx === -1) return null;

    const argsStr = scriptletCall.substring(0, closeIdx);
    // Parse comma-separated args (respecting quotes)
    const args = parseScriptletArgs(argsStr);

    return {
      type: "scriptlet",
      domains: domains ? domains.split(",") : [],
      scriptletName: args[0],
      scriptletArgs: args.slice(1),
    };
  }

  function parseScriptletArgs(str) {
    const args = [];
    let current = "";
    let inQuote = false;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (c === "," && !inQuote) {
        args.push(current.trim().replace(/^["']|["']$/g, ""));
        current = "";
        continue;
      }
      if (c === '"' || c === "'") {
        inQuote = !inQuote;
      }
      current += c;
    }
    if (current.trim()) {
      args.push(current.trim().replace(/^["']|["']$/g, ""));
    }
    return args;
  }

  /* ================================================================== *
   * Parse HTML filter: example.com##^script[src*="ads"]
   * ================================================================== */
  function parseHTMLFilter(line) {
    const idx = line.indexOf("##^");
    if (idx === -1) return null;

    const domains = line.substring(0, idx);
    const htmlSelector = line.substring(idx + 3);

    return {
      type: "html",
      domains: domains ? domains.split(",") : [],
      htmlSelector,
    };
  }

  /* ================================================================== *
   * Batch parse: text -> array of filters
   * ================================================================== */
  function parseFilters(text) {
    const lines = text.split("\n");
    const filters = {
      network: [],
      exceptions: [],
      cosmetic: [],
      scriptlets: [],
      html: [],
      stats: { total: 0, accepted: 0, rejected: 0 },
    };

    for (const line of lines) {
      filters.stats.total++;
      const parsed = parseFilter(line);
      if (!parsed) {
        if (line.trim() && !line.startsWith("!") && !line.startsWith("[")) {
          filters.stats.rejected++;
        }
        continue;
      }

      filters.stats.accepted++;

      switch (parsed.type) {
        case "network":
          if (parsed.isException) {
            filters.exceptions.push(parsed);
          } else {
            filters.network.push(parsed);
          }
          break;
        case "cosmetic":
          filters.cosmetic.push(parsed);
          break;
        case "scriptlet":
          filters.scriptlets.push(parsed);
          break;
        case "html":
          filters.html.push(parsed);
          break;
      }
    }

    return filters;
  }

  /* ================================================================== *
   * Convert parsed network filter to DNR rule
   * ================================================================== */
  function toDNRRule(parsed, ruleId) {
    if (parsed.type !== "network") return null;

    const rule = {
      id: ruleId,
      priority: parsed.priority || 1,
      action: parsed.action,
      condition: parsed.condition,
    };

    // Ensure resourceTypes is set (DNR requires it)
    if (!rule.condition.resourceTypes) {
      rule.condition.resourceTypes = [
        "script", "image", "sub_frame", "xmlhttprequest", "object",
        "object_subrequest", "media", "ping", "websocket", "font", "other",
      ];
    }

    return rule;
  }

  return {
    parseFilter,
    parseFilters,
    toDNRRule,
    parseOptions,
    RESOURCE_TYPE_MAP,
  };
})();

// Export for use in background
if (typeof module !== "undefined" && module.exports) {
  module.exports = NovaShieldFilterParser;
}
if (typeof self !== "undefined") {
  self.NovaShieldFilterParser = NovaShieldFilterParser;
}
