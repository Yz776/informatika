/* =====================================================================
 * NovaShield v3.8 - Homepage Logic
 * ===================================================================== */

const API = (typeof browser !== "undefined") ? browser : chrome;

// Default shortcuts (Chrome-like most visited)
const DEFAULT_SHORTCUTS = [
  { name: "YouTube", url: "https://youtube.com", icon: "▶", color: "#ff0000" },
  { name: "Google", url: "https://google.com", icon: "G", color: "#4285F4" },
  { name: "GitHub", url: "https://github.com", icon: "⌥", color: "#ffffff" },
  { name: "Gmail", url: "https://mail.google.com", icon: "✉", color: "#EA4335" },
  { name: "WhatsApp", url: "https://web.whatsapp.com", icon: "✆", color: "#25D366" },
  { name: "Instagram", url: "https://instagram.com", icon: "◎", color: "#E4405F" },
  { name: "Twitter/X", url: "https://twitter.com", icon: "✕", color: "#1DA1F2" },
  { name: "Reddit", url: "https://reddit.com", icon: "R", color: "#FF4500" },
];

// Search engines
const SEARCH_ENGINES = {
  google: "https://www.google.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q=",
  bing: "https://www.bing.com/search?q=",
};

let currentEngine = "google";

/* ================================================================== *
 * Clock + greeting
 * ================================================================== */
function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  document.getElementById("clock").textContent = `${hours}:${minutes}`;

  // Greeting based on time
  const h = now.getHours();
  let greeting;
  if (h < 5) greeting = "Selamat malam";
  else if (h < 11) greeting = "Selamat pagi";
  else if (h < 15) greeting = "Selamat siang";
  else if (h < 18) greeting = "Selamat sore";
  else greeting = "Selamat malam";
  document.getElementById("greeting").textContent = greeting;

  // Date
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  document.getElementById("date").textContent = dateStr;
}

/* ================================================================== *
 * Search
 * ================================================================== */
function setupSearch() {
  // Load saved engine
  try {
    const saved = localStorage.getItem("__novashield_search_engine");
    if (saved && SEARCH_ENGINES[saved]) {
      currentEngine = saved;
      updateEngineUI();
    }
  } catch (e) {}

  // Engine selector
  document.querySelectorAll(".engine-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentEngine = btn.dataset.engine;
      try { localStorage.setItem("__novashield_search_engine", currentEngine); } catch (e) {}
      updateEngineUI();
      document.getElementById("searchInput").focus();
    });
  });

  // Search form
  const form = document.getElementById("searchForm");
  const input = document.getElementById("searchInput");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;
    // Check if it's a URL
    if (/^https?:\/\//i.test(query)) {
      window.location.href = query;
    } else if (/^[\w-]+\.[\w-]+/.test(query) && !query.includes(" ")) {
      // Looks like a domain
      window.location.href = `https://${query}`;
    } else {
      // Search
      window.location.href = SEARCH_ENGINES[currentEngine] + encodeURIComponent(query);
    }
  });

  // Auto-focus
  setTimeout(() => input.focus(), 300);
}

function updateEngineUI() {
  document.querySelectorAll(".engine-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.engine === currentEngine);
  });
  const placeholder = {
    google: "Cari di Google atau ketik URL",
    duckduckgo: "Cari di DuckDuckGo atau ketik URL",
    bing: "Cari di Bing atau ketik URL",
  };
  document.getElementById("searchInput").placeholder = placeholder[currentEngine];
}

/* ================================================================== *
 * Stats from extension storage
 * ================================================================== */
function loadStats() {
  try {
    API.storage.local.get({ statsTotal: 0, easyListRulesCount: 0 }, (data) => {
      const total = data.statsTotal || 0;
      const rules = (data.easyListRulesCount || 0) + 1081; // static + dynamic
      document.getElementById("totalBlocked").textContent = formatNumber(total);
      document.getElementById("rulesCount").textContent = formatNumber(rules) + "+";

      // "Today" - approximate (we don't track per-day, use total / install days)
      const today = Math.floor(total / 7); // rough estimate
      document.getElementById("blockedToday").textContent = formatNumber(today);
    });
  } catch (e) {}
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

/* ================================================================== *
 * Shortcuts
 * ================================================================== */
function loadShortcuts() {
  const grid = document.getElementById("shortcutsGrid");
  let shortcuts = DEFAULT_SHORTCUTS;

  // Load custom shortcuts from storage
  try {
    API.storage.local.get({ homepageShortcuts: null }, (data) => {
      if (data.homepageShortcuts && Array.isArray(data.homepageShortcuts)) {
        shortcuts = data.homepageShortcuts;
      }
      renderShortcuts(shortcuts);
    });
  } catch (e) {
    renderShortcuts(shortcuts);
  }
}

function renderShortcuts(shortcuts) {
  const grid = document.getElementById("shortcutsGrid");
  grid.innerHTML = "";

  shortcuts.forEach((sc) => {
    const card = document.createElement("a");
    card.href = sc.url;
    card.className = "shortcut-card";
    card.target = "_blank";
    card.rel = "noopener";

    // Try to get favicon
    const faviconUrl = getFaviconUrl(sc.url);

    const icon = document.createElement("div");
    icon.className = "shortcut-icon";
    if (faviconUrl) {
      const img = document.createElement("img");
      img.src = faviconUrl;
      img.style.width = "24px";
      img.style.height = "24px";
      img.style.borderRadius = "6px";
      img.onerror = () => {
        icon.textContent = sc.icon || sc.name.charAt(0).toUpperCase();
      };
      icon.appendChild(img);
    } else {
      icon.textContent = sc.icon || sc.name.charAt(0).toUpperCase();
    }

    const name = document.createElement("div");
    name.className = "shortcut-name";
    name.textContent = sc.name;

    card.appendChild(icon);
    card.appendChild(name);
    grid.appendChild(card);
  });
}

function getFaviconUrl(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch (e) {
    return null;
  }
}

/* ================================================================== *
 * Security status
 * ================================================================== */
function checkSecurityStatus() {
  try {
    API.storage.local.get({ activated: false, enabled: true }, (data) => {
      const status = document.getElementById("securityStatus");
      const dot = status.querySelector(".status-dot");
      const text = status.querySelector(".status-text");

      if (!data.activated) {
        // Not activated yet - show red
        dot.style.background = "var(--danger)";
        dot.style.boxShadow = "0 0 8px var(--danger)";
        text.textContent = "Not Activated";
        text.style.color = "var(--danger)";
        status.style.background = "rgba(255, 84, 112, 0.1)";
        status.style.borderColor = "rgba(255, 84, 112, 0.3)";
        // Retry after 3s (activation might be in progress)
        setTimeout(checkSecurityStatus, 3000);
      } else if (!data.enabled) {
        dot.style.background = "var(--warning)";
        dot.style.boxShadow = "0 0 8px var(--warning)";
        text.textContent = "Paused";
        text.style.color = "var(--warning)";
        status.style.background = "rgba(251, 191, 36, 0.1)";
        status.style.borderColor = "rgba(251, 191, 36, 0.3)";
      } else {
        // Activated and enabled - show green
        dot.style.background = "var(--success)";
        dot.style.boxShadow = "0 0 8px var(--success)";
        text.textContent = "Protected";
        text.style.color = "var(--success)";
        status.style.background = "rgba(74, 222, 128, 0.1)";
        status.style.borderColor = "rgba(74, 222, 128, 0.3)";
      }
    });
  } catch (e) {}
}

// v3.8.2: Listen for storage changes (real-time update when activation completes)
try {
  API.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.activated || changes.enabled)) {
      checkSecurityStatus();
    }
  });
} catch (e) {}

/* ================================================================== *
 * Settings button
 * ================================================================== */
function setupSettings() {
  document.getElementById("settingsBtn").addEventListener("click", () => {
    if (API.runtime.openOptionsPage) {
      API.runtime.openOptionsPage();
    } else {
      window.open(API.runtime.getURL("options/options.html"));
    }
  });
}

/* ================================================================== *
 * Init
 * ================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  updateClock();
  setInterval(updateClock, 1000);
  setupSearch();
  loadStats();
  loadShortcuts();
  checkSecurityStatus();
  setupSettings();
});

// Update stats every 5 seconds
setInterval(loadStats, 5000);
