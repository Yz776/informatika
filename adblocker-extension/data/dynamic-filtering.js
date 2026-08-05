/* =====================================================================
 * NovaShield v3.6 - Dynamic Filtering Rules (uBlock-inspired)
 * ---------------------------------------------------------------------
 * Adapted from uBlock Origin's dyna-rules.js
 *
 * Allows per-site blocking rules:
 *   - Block all 3rd-party scripts on example.com
 *   - Allow ads on specific domain (allowlist)
 *   - Block specific request type per domain
 *
 * Rule format: hostname type action
 *   hostname: domain.com or * (any)
 *   type: script, image, frame, 3p, etc.
 *   action: block, allow, noop
 *
 * Stored in chrome.storage.local, evaluated at request time
 * ===================================================================== */

const NovaShieldDynamicFiltering = (() => {

  const DEFAULT_RULES = [
    // Block 3rd-party scripts by default on all sites (security)
    // (can be overridden per-site)
    // Format: [hostname, type, action]
    // type: "*" (all), "script", "image", "3p" (third-party), "frame"
    // action: "block", "allow", "noop"
  ];

  // Rule storage
  let rules = [];
  let enabled = true;

  // Load rules from storage
  async function load() {
    return new Promise((resolve) => {
      chrome.storage.local.get({ dynamicRules: DEFAULT_RULES, dynamicFilteringEnabled: true }, (data) => {
        rules = data.dynamicRules || [];
        enabled = data.dynamicFilteringEnabled !== false;
        resolve({ rules, enabled });
      });
    });
  }

  // Save rules to storage
  async function save() {
    return new Promise((resolve) => {
      chrome.storage.local.set({ dynamicRules: rules }, () => resolve());
    });
  }

  // Add a dynamic rule
  async function addRule(hostname, type, action) {
    // Remove existing rule for same hostname+type
    rules = rules.filter((r) => !(r[0] === hostname && r[1] === type));
    rules.push([hostname, type, action]);
    await save();
    return rules;
  }

  // Remove a dynamic rule
  async function removeRule(hostname, type) {
    rules = rules.filter((r) => !(r[0] === hostname && r[1] === type));
    await save();
    return rules;
  }

  // Toggle: noop -> block -> allow -> noop
  async function toggle(hostname, type) {
    const existing = rules.find((r) => r[0] === hostname && r[1] === type);
    let nextAction;
    if (!existing) {
      nextAction = "block";
    } else if (existing[2] === "block") {
      nextAction = "allow";
    } else if (existing[2] === "allow") {
      nextAction = "noop";
    } else {
      nextAction = "block";
    }

    if (nextAction === "noop") {
      return await removeRule(hostname, type);
    }
    return await addRule(hostname, type, nextAction);
  }

  // Evaluate rules for a request
  // Returns: "block", "allow", or null (no rule)
  function evaluate(requestHostname, requestType, isThirdParty) {
    if (!enabled) return null;

    // Sort rules by specificity (most specific first)
    // * hostname match > wildcard
    // * type match > wildcard
    const sorted = [...rules].sort((a, b) => {
      const aSpec = (a[0] === "*" ? 0 : 1) + (a[1] === "*" ? 0 : 1);
      const bSpec = (b[0] === "*" ? 0 : 1) + (b[1] === "*" ? 0 : 1);
      return bSpec - aSpec;
    });

    for (const [hostname, type, action] of sorted) {
      // Check hostname match
      if (hostname !== "*" && hostname !== requestHostname &&
          !requestHostname.endsWith("." + hostname)) {
        continue;
      }
      // Check type match
      if (type !== "*" && type !== requestType) {
        // Special case: "3p" matches third-party requests
        if (type === "3p" && !isThirdParty) continue;
        continue;
      }
      return action;
    }
    return null;
  }

  // Get all rules for a hostname (for UI display)
  function getRulesForHost(hostname) {
    return rules.filter((r) => r[0] === hostname || r[0] === "*");
  }

  // Get rule for specific hostname+type
  function getRule(hostname, type) {
    return rules.find((r) => r[0] === hostname && r[1] === type);
  }

  // Export rules as text (uBlock format)
  function exportRules() {
    return rules.map((r) => `${r[0]} ${r[1]} ${r[2]}`).join("\n");
  }

  // Import rules from text
  function importRules(text) {
    const lines = text.split("\n");
    const newRules = [];
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length === 3) {
        newRules.push([parts[0], parts[1], parts[2]]);
      }
    }
    rules = newRules;
    return save();
  }

  // Convert dynamic rules to DNR session rules
  function toDNRRules() {
    const dnrRules = [];
    let ruleId = 950000; // Start high to avoid collision

    for (const [hostname, type, action] of rules) {
      if (action === "noop") continue;

      const dnrAction = action === "block" ? { type: "block" } : { type: "allow" };
      const condition = {};

      if (hostname !== "*") {
        condition.initiatorDomains = [hostname];
      }
      if (type !== "*" && type !== "3p") {
        condition.resourceTypes = [type];
      }
      if (type === "3p") {
        condition.domainType = "thirdParty";
      }

      dnrRules.push({
        id: ruleId++,
        priority: 100,
        action: dnrAction,
        condition,
      });
    }

    return dnrRules;
  }

  return {
    load,
    save,
    addRule,
    removeRule,
    toggle,
    evaluate,
    getRulesForHost,
    getRule,
    exportRules,
    importRules,
    toDNRRules,
    get rules() { return rules; },
    get enabled() { return enabled; },
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = NovaShieldDynamicFiltering;
}
if (typeof self !== "undefined") {
  self.NovaShieldDynamicFiltering = NovaShieldDynamicFiltering;
}
