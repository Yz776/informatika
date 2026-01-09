let activeLink = null; // link yang sedang aktif

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
        if (card.dataset.animated) return;

        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
            card.dataset.animated = "true";
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

// CLICK HANDLER (TOGGLE IFRAME)
document.querySelectorAll(".karya-link").forEach(link => {
    link.addEventListener("click", () => {

        const container = link.nextElementSibling;

        // JIKA LINK YANG SAMA DIKLIK LAGI → TUTUP
        if (activeLink === link) {
            container.innerHTML = "";
            activeLink = null;
            return;
        }

        // HAPUS SEMUA IFRAME LAIN
        document.querySelectorAll(".iframe-container").forEach(c => {
            c.innerHTML = "";
        });

        // BUAT IFRAME BARU
        const iframe = document.createElement("iframe");
        iframe.src = link.dataset.url;

        container.appendChild(iframe);

        anime({
            targets: iframe,
            opacity: [0, 1],
            scale: [0.96, 1],
            duration: 600,
            easing: "easeOutExpo"
        });

        iframe.scrollIntoView({ behavior: "smooth", block: "start" });

        activeLink = link;
    });
});
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
