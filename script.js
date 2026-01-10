// =======================
// AUDIO KACA PECAH (SAFE MOBILE)
// =======================
const glassSound = document.getElementById("glassSound");
let audioUnlocked = false;
let imageAnimated = false;

function playGlassSound() {
    if (!audioUnlocked) return;
    glassSound.currentTime = 0;
    glassSound.volume = 0.7;
    glassSound.play().catch(() => {});
}

function unlockAudio() {
    if (audioUnlocked) return;

    glassSound.play().then(() => {
        glassSound.pause();
        glassSound.currentTime = 0;
        audioUnlocked = true;

        // Kalau animasi image sudah terjadi → bunyikan sekarang
        if (imageAnimated) {
            playGlassSound();
        }
    }).catch(() => {});
}

document.addEventListener("click", unlockAudio, { once: true });
document.addEventListener("touchstart", unlockAudio, { once: true });


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

    // FOTO PROFIL + SUARA
    .add({
        targets: ".kartu-profil img",
        scale: [0.6, 1],
        rotate: [-12, 0],
        opacity: [0, 1],
        duration: 900,
        easing: "easeOutElastic(1, .6)",
        begin: () => {
            imageAnimated = true;
            playGlassSound();

            // efek shake kaca
            anime({
                targets: ".kartu-profil img",
                keyframes: [
                    { rotate: -8 },
                    { rotate: 8 },
                    { rotate: -4 },
                    { rotate: 0 }
                ],
                duration: 350,
                easing: "easeOutSine"
            });
        }
    }, "-=400")

    // NAMA
    .add({
        targets: ".kartu-profil h1",
        opacity: [0, 1],
        translateY: [30, 0]
    }, "-=300")

    // DESKRIPSI
    .add({
        targets: ".kartu-profil p",
        opacity: [0, 1],
        filter: ["blur(6px)", "blur(0px)"],
        duration: 700
    })

    // SOSIAL LINK
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

    // KARYA 1 (KANAN → TENGAH)
    .add({
        targets: ".anim-1",
        translateX: [150, 0],
        opacity: [0, 1],
        duration: 800
    })

    // KARYA 2 (KIRI → TENGAH)
    .add({
        targets: ".anim-2",
        translateX: [-150, 0],
        opacity: [0, 1],
        duration: 800
    }, "+=200")

    // KARYA 3 (BAWAH → ATAS) — FIX ILANG
    .add({
        targets: ".anim-3",
        translateY: [150, 0],
        opacity: [0, 1],
        duration: 800
    }, "+=200");
});


// =======================
// TOGGLE IFRAME (1 SAJA AKTIF)
// =======================
let activeLink = null;

document.querySelectorAll(".karya-link").forEach(link => {

    const originalText = link.innerHTML;
    const container = link.nextElementSibling;

    link.addEventListener("click", () => {

        // TUTUP JIKA SAMA
        if (activeLink === link) {
            container.innerHTML = "";
            link.innerHTML = originalText;
            link.classList.remove("active");
            activeLink = null;
            return;
        }

        // RESET SEMUA
        document.querySelectorAll(".iframe-container").forEach(c => c.innerHTML = "");
        document.querySelectorAll(".karya-link").forEach(l => {
            l.classList.remove("active");
            l.innerHTML = l.dataset.original || l.innerHTML;
        });

        link.dataset.original = originalText;
        link.innerHTML = "❌ Tutup";
        link.classList.add("active");
        activeLink = link;

        // LOADING
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
                scale: [0.95, 1],
                duration: 600,
                easing: "easeOutExpo"
            });
        };

        container.appendChild(iframe);

        container.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
});
