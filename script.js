// =======================
// AUDIO KACA PECAH (AUTOPLAY ATTEMPT)
// =======================
const glassSound = document.getElementById("glassSound");

function playGlassSound() {
    if (!glassSound) return;
    glassSound.currentTime = 0;
    glassSound.volume = 0.1;
    glassSound.play().catch(() => {
        // Browser block autoplay → DIAM (tidak error)
        console.warn("Audio autoplay diblokir browser");
    });
    // 📳 GETAR HP
    if (navigator.vibrate) {
        navigator.vibrate([40, 30, 40]);
    }
}


// =======================
// LOADING + ANIMASI OTOMATIS
// =======================
window.addEventListener("load", () => {
    
    // JEDA LOADING
    setTimeout(() => {

        // ANIMASI PECAH LOADING
        anime({
            targets: ".loading-glass",
            scale: [1, 2.8],
            rotate: [0, 45],
            opacity: [1, 0],
            duration: 700,
            easing: "easeInExpo",
            complete: () => {
                const loading = document.getElementById("loading-screen");
                if (loading) loading.remove();
                startLandingAnimation();
                playGlassSound();
            }
        });

    }, 900); // durasi loading
});


// =======================
// LANDING PAGE ANIMATION
// =======================
function startLandingAnimation() {

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

    // FOTO PROFIL (EFEK KACA)
    .add({
        targets: ".kartu-profil img",
        scale: [0.6, 1],
        rotate: [-12, 0],
        opacity: [0, 1],
        duration: 900,
        easing: "easeOutElastic(1, .6)",
        begin: () => {
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

    // SOSIAL
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

    // KARYA 1
    .add({
        targets: ".anim-1",
        translateX: [150, 0],
        opacity: [0, 1]
    })

    // KARYA 2
    .add({
        targets: ".anim-2",
        translateX: [-150, 0],
        opacity: [0, 1]
    }, "+=200")

    // KARYA 3
    .add({
        targets: ".anim-3",
        translateY: [150, 0],
        opacity: [0, 1]
    }, "+=200")



// sertifikat
    .add({
        targets: ".anime-0",
        translateX: [150, 0],
        opacity: [0, 1]
    })

    .add({
        targets: ".anime-1",
        translateX: [-150, 0],
        opacity: [0, 1]
    }, "+=200")
        
   .add({
        targets: ".anime-2",
        translateY: [150, 0],
        opacity: [0, 1]
    }, "+=200")

    .add({
        targets: ".anime-3",
        translateY: [150, 0],
        opacity: [0, 1]
    }); 
    
}
// =======================
// TOGGLE IFRAME (OTOMATIS, TANPA SOUND)
// =======================
let activeLink = null;

document.querySelectorAll(".karya-link").forEach(link => {

    const originalText = link.innerHTML;
    const container = link.nextElementSibling;

    link.addEventListener("click", () => {
        playGlassSound();
        if (activeLink === link) {
            container.innerHTML = "";
            link.innerHTML = originalText;
            link.classList.remove("active");
            activeLink = null;
            return;
        }

        document.querySelectorAll(".iframe-container").forEach(c => c.innerHTML = "");
        document.querySelectorAll(".karya-link").forEach(l => {
            l.classList.remove("active");
            l.innerHTML = l.dataset.original || l.innerHTML;
        });

        link.dataset.original = originalText;
        link.innerHTML = "❌ Tutup";
        link.classList.add("active");
        activeLink = link;

        const loader = document.createElement("div");
        loader.className = "loader";
        container.appendChild(loader);

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
        container.scrollIntoView({ behavior: "smooth" });
    });
});
new Typed("#typed", {
    strings: [
      "Backend WebDev",
      "AI Engineer",
      "Network Administrator",
      "Cloud Engineer"
    ],
    typeSpeed: 60,
    backSpeed: 40,
    backDelay: 1200,
    loop: true
  });
