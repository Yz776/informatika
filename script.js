// =======================
// GLASS SHATTER SOUND (NO FILE)
// =======================
function playGlassShatter() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();

    // Noise buffer
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter (high freq = kaca)
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 2500;

    // Gain envelope (crack → decay)
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    // Connect
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
}

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
        easing: "easeOutElastic(1, .6)",

    begin: () => {
            if (!soundPlayed) {
                playGlassShatter();
                soundPlayed = true;
            }
        }
    }, "-=400")

    // NAMA (PER KATA)
    .add({
        targets: ".kartu-profil h1",
        opacity: [0, 1],
        translateY: [30, 0]
    }, "-=300")

    // DESKRIPSI + BLUR
    .add({
        targets: ".kartu-profil p",
        opacity: [0, 1],
        filter: ["blur(6px)", "blur(0px)"],
        duration: 700
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
        translateX: [120, 0],
        opacity: [0, 1],
        duration: 800
    })

    // KARYA CARD 2
    .add({
        targets: ".anim-2",
        translateX: [-120, 0],
        opacity: [0, 1],
        duration: 800
    }, "+=200")

    // KARYA CARD 3
    .add({
        targets: ".anim-3",
        translateY: [120, 0],
        opacity: [0, 1],
        duration: 800
    }, "+=200");
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
