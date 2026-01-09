// LOADING PROFIL
window.addEventListener("load", () => {
    anime({
        targets: ".kartu-profil",
        opacity: [0, 1],
        translateY: [-30, 0],
        duration: 900,
        easing: "easeOutExpo"
    });
});

// SCROLL ANIMATION KARYA
const cards = document.querySelectorAll(".karya-card");

window.addEventListener("scroll", () => {
    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100 && card.style.opacity == 0) {
            anime({
                targets: card,
                opacity: [0, 1],
                translateY: [40, 0],
                duration: 700,
                easing: "easeOutQuad"
            });
        }
    });
});

// CLICK → TAMPILKAN IFRAME (HANYA 1)
document.querySelectorAll(".karya-link").forEach(link => {
    link.addEventListener("click", () => {

        // HAPUS SEMUA IFRAME
        document.querySelectorAll(".iframe-container").forEach(c => {
            c.innerHTML = "";
        });

        // BUAT IFRAME BARU
        const iframe = document.createElement("iframe");
        iframe.src = link.dataset.url;

        // TAMBAHKAN KE CARD YANG DIKLIK
        const container = link.nextElementSibling;
        container.appendChild(iframe);

        // ANIMASI IFRAME
        anime({
            targets: iframe,
            opacity: [0, 1],
            scale: [0.96, 1],
            duration: 600,
            easing: "easeOutExpo"
        });

        // AUTO SCROLL
        iframe.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});
