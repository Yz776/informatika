// ===================================
// HACKER MODE MODULE (NO MATRIX)
// Aktif saat judul "💼 Karya Ahsan" diklik
// ===================================

let hackerModeActive = false;

// =======================
// INJECT STYLE
// =======================
const hackerStyle = document.createElement("style");
hackerStyle.innerHTML = `
body.hacker {
    background: #000;
    color: #00ff9c;
    font-family: "Courier New", monospace;
}

body.hacker a {
    color: #00ff9c;
}

body.hacker .kartu-profil,
body.hacker .karya-card {
    background: rgba(0,0,0,0.9);
    border: 1px solid #00ff9c;
    box-shadow: 0 0 20px rgba(0,255,156,0.5);
}

body.hacker .karya-link {
    border: 1px solid #00ff9c;
    background: transparent;
    text-shadow: 0 0 6px rgba(0,255,156,0.8);
}

body.hacker h1,
body.hacker h2,
body.hacker p {
    text-shadow: 0 0 10px rgba(0,255,156,0.7);
}

/* GLITCH EFFECT */
@keyframes glitch {
    0% { text-shadow: 2px 0 red; }
    20% { text-shadow: -2px 0 cyan; }
    40% { text-shadow: 2px 0 lime; }
    60% { text-shadow: -2px 0 magenta; }
    80% { text-shadow: 2px 0 yellow; }
    100% { text-shadow: none; }
}

body.hacker .kartu-profil h1 {
    animation: glitch 1.4s infinite;
}
`;
document.head.appendChild(hackerStyle);

// =======================
// ACCESS GRANTED OVERLAY
// =======================
function showAccessGranted() {
    const overlay = document.createElement("div");
    overlay.textContent = "ACCESS GRANTED";

    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        letter-spacing: 6px;
        color: #00ff9c;
        font-family: monospace;
        z-index: 9999;
        background: rgba(0,0,0,0.92);
        text-shadow: 0 0 20px #00ff9c;
    `;

    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.remove();
    }, 1600);
}

// =======================
// ENABLE HACKER MODE
// =======================
function enableHackerMode() {
    if (hackerModeActive) return;
    hackerModeActive = true;

    document.body.classList.add("hacker");

    const nameEl = document.querySelector(".kartu-profil h1");
    const descEl = document.querySelector(".kartu-profil p");
    const socialEl = document.querySelector(".link-sosial");
    const karyaTitle = document.querySelector(".karya h2");

    if (nameEl) nameEl.textContent = "Mohammad Ahsan Al Ghoni";
    if (descEl) descEl.textContent = "Saya adalah seorang pentester dan attacker.";
    if (socialEl) socialEl.remove();
    if (karyaTitle) karyaTitle.textContent = "💼 Karya Ahsan";

    // getar HP
    if (navigator.vibrate) {
        navigator.vibrate([120, 60, 120]);
    }

    showAccessGranted();

    console.log("Hacker mode enabled (no matrix)");
}

// =======================
// TRIGGER VIA JUDUL KARYA
// =======================
window.addEventListener("load", () => {
    const karyaTitle = document.querySelector(".karya h2");
    if (!karyaTitle) return;

    karyaTitle.style.cursor = "pointer";
    karyaTitle.addEventListener("click", enableHackerMode);
});
