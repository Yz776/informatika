// =======================
// ANIMASI LANDING PAGE
// =======================
window.addEventListener("load", () => {

    const tl = anime.timeline({
        easing: "easeOutExpo",
        duration: 800
    });

    // PROFIL CARD
    tl.add({
        targets: ".kartu-profil",
        opacity: [0, 1],
        translateY: [40, 0]
    })

    // FOTO PROFIL
    .add({
        targets: ".kartu-profil img",
        scale: [0.6, 1],
        rotate: [-10, 0],
        duration: 900,
        easing: "easeOutElastic(1, .6)"
    }, "-=400")

    // NAMA (PER KATA)
    .add({
        targets: ".kartu-profil h1",
        opacity: [0, 1],
        translateY: [30, 0]
    }, "-=300")

    // DESKRIPSI + BLUR
    .add({
        targets: "#typed-text",
        opacity: [0, 1],
        duration: 300,
        complete: () => {
            // TYPED.JS START SETELAH ANIME SELESAI
            new Typed("#typed-text", {
                strings: [
                    "Saya tertarik dengan <b>HTML</b>.",
                    "Saya tertarik dengan <b>Javascript</b>.",
                    "Saya tertarik dengan <b>PHP</b>.",
                    "Saya tertarik dengan <b>TypeScript</b>."
                ],
                typeSpeed: 45,
                backSpeebackSpeed,
                backDelay: 1200,
                loop: true,
                smartBackspace: true,
                showCursor: true
            });
        }
    })

    // SOSIAL BUTTONS
    .add({
        targets: ".link-sosial a",
        opacity: [0, 1],
        scale: [0.8, 1],
        delay: anime.stagger(200),
        easing: "easeOutBack"
    })

    // JUDUL KARYA
    .add({
        targets: ".karya h2",
        opacity: [0, 1],
        translateY: [30, 0]
    })

    // KARYA CARD 1
    .add({
        targets: ".anim-1",
        opacity: [0, 1],
        translateX: [120, 0]
    })

    // KARYA CARD 2
    .add({
        targets: ".anim-2",
        opacity: [0, 1],
        translateX: [-120, 0]
    })

    // KARYA CARD 3
    .add({
        targets: ".anim-3",
        opacity: [0, 1],
        translateY: [120, 0]
    });
});


// =======================
// TOGGLE IFRAME (STABIL)
// =======================
let activeLink = null;

document.querySelectorAll(".karya-link").forEach(link => {
    const originalText = link.innerHTML;

    link.addEventListener("click", () => {
        const container = link.nextElementSibling;

        // TOGGLE OFF
        if (activeLink === link) {
            container.innerHTML = "";
            link.innerHTML = originalText;
            link.classList.remove("active");
            activeLink = null;
            return;
        }

        // RESET
        document.querySelectorAll(".iframe-container").forEach(c => c.innerHTML = "");
        document.querySelectorAll(".karya-link").forEach(l => {
            l.classList.remove("active");
            l.innerHTML = l.dataset.original || l.innerHTML;
        });

        link.dataset.original = originalText;
        link.classList.add("active");
        link.innerHTML = "❌ Tutup";
        activeLink = link;

        // LOADER
        const loader = document.createElement("div");
        loader.className = "loader";
        container.appendChild(loader);

        // IFRAME
        const iframe = document.createElement("iframe");
        iframe.src = link.dataset.url;
        iframe.style.display = "none";

        iframe.onload = () => {
            loader.remove();
            iframe.style.display = "block";

            anime({
                targets: iframe,
                opacity: [0, 1],
                scale: [0.96, 1],
                duration: 600,
                easing: "easeOutExpo"
            });
        };

        container.appendChild(iframe);
        container.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});
