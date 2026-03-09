const carousel = document.getElementById('heroCarousel');
const slides   = carousel.querySelectorAll('.hero-carousel__slide');
const dots     = carousel.querySelectorAll('.hero-carousel__dot');
const prevBtn  = document.getElementById('heroPrev');
const nextBtn  = document.getElementById('heroNext');

let current  = 0;
let timer    = null;
const DELAY  = 3000;

function goTo(index) {
    slides[current].classList.remove('is-active');
    dots[current].classList.remove('is-active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    dots[current].classList.add('is-active');
}

function startAuto() {
    stopAuto();
    timer = setInterval(() => goTo(current + 1), DELAY);
}

function stopAuto() {
    if (timer) clearInterval(timer);
}

prevBtn.addEventListener('click', () => { goTo(current - 1); startAuto(); });
nextBtn.addEventListener('click', () => { goTo(current + 1); startAuto(); });

dots.forEach((dot) => {
    dot.addEventListener('click', () => {
        goTo(Number(dot.dataset.index));
        startAuto();
    });
});

// hover does not pause — carousel keeps moving

// touch / swipe support
let touchStartX = 0;
carousel.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
carousel.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
    startAuto();
}, { passive: true });

startAuto();
// ── Scroll-reveal (IntersectionObserver) ──────────────────────────────
const revealEls = document.querySelectorAll('[data-reveal]');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach((el) => revealObserver.observe(el));

// ── Best Sellers horizontal carousel ─────────────────────────────────
const bsTrack = document.getElementById('bsTrack');
const bsPrev  = document.getElementById('bsPrev');
const bsNext  = document.getElementById('bsNext');

if (bsTrack && bsPrev && bsNext) {
    const getCardWidth = () => {
        const card = bsTrack.querySelector('.bs-card');
        if (!card) return 300;
        return card.getBoundingClientRect().width + 20; // 20 = gap
    };

    let bsOffset = 0;

    const clampOffset = (val) => {
        const maxScroll = bsTrack.scrollWidth - bsTrack.parentElement.offsetWidth;
        return Math.max(0, Math.min(val, maxScroll));
    };

    const applyOffset = () => {
        bsTrack.style.transform = `translateX(-${bsOffset}px)`;
        bsPrev.disabled = bsOffset <= 0;
        bsNext.disabled = bsOffset >= bsTrack.scrollWidth - bsTrack.parentElement.offsetWidth;
    };

    bsNext.addEventListener('click', () => {
        bsOffset = clampOffset(bsOffset + getCardWidth());
        applyOffset();
    });

    bsPrev.addEventListener('click', () => {
        bsOffset = clampOffset(bsOffset - getCardWidth());
        applyOffset();
    });

    applyOffset();
}

// ── Newsletter form ───────────────────────────────────────────────────
const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = newsletterForm.querySelector('input[type="email"]');
        const btn   = newsletterForm.querySelector('button[type="submit"]');
        if (!input.value) return;
        btn.textContent = 'You\'re in!';
        btn.disabled = true;
        input.disabled = true;
        input.value = '';
        input.placeholder = 'Thank you for subscribing ✓';
    });
}