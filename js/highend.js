/* ═══════════════════════════════════════════════════════════
   js/highend.js  —  habbyFootie Premium
   · Navbar scroll shadow
   · Hero carousel (auto-play, arrows, dots, touch swipe)
   · Scroll-reveal IntersectionObserver
   · Best Sellers horizontal carousel
   · Newsletter form handler
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────
   1. NAVBAR — add shadow on scroll
───────────────────────────────────────────── */
(function () {
    const nav = document.getElementById('mainNav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
        nav.classList.toggle('is-scrolled', window.scrollY > 8);
    }, { passive: true });
})();


/* ─────────────────────────────────────────────
   2. HERO CAROUSEL
───────────────────────────────────────────── */
(function () {
    const carousel = document.getElementById('heroCarousel');
    if (!carousel) return;

    const slides   = carousel.querySelectorAll('.hero-carousel__slide');
    const dots     = carousel.querySelectorAll('.hero-carousel__dot');
    const prevBtn  = document.getElementById('heroPrev');
    const nextBtn  = document.getElementById('heroNext');
    const DELAY    = 3500;  // ms between auto-advances

    let current = 0;
    let timer   = null;

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
        clearInterval(timer);
    }

    prevBtn.addEventListener('click', () => { goTo(current - 1); startAuto(); });
    nextBtn.addEventListener('click', () => { goTo(current + 1); startAuto(); });

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            goTo(Number(dot.dataset.index));
            startAuto();
        });
    });

    /* Touch / swipe support */
    let touchStartX = 0;
    carousel.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    carousel.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
            goTo(diff > 0 ? current + 1 : current - 1);
            startAuto();
        }
    }, { passive: true });

    startAuto();
})();


/* ─────────────────────────────────────────────
   3. SCROLL REVEAL
───────────────────────────────────────────── */
(function () {
    const revealEls = document.querySelectorAll('[data-reveal]');
    if (!revealEls.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -32px 0px'
    });

    revealEls.forEach(el => observer.observe(el));
})();


/* ─────────────────────────────────────────────
   4. BEST SELLERS HORIZONTAL CAROUSEL
───────────────────────────────────────────── */
(function () {
    const track   = document.getElementById('bsTrack');
    const prevBtn = document.getElementById('bsPrev');
    const nextBtn = document.getElementById('bsNext');
    if (!track || !prevBtn || !nextBtn) return;

    let offset = 0;

    function getCardWidth() {
        const card = track.querySelector('.bs-card');
        return card ? card.offsetWidth + 20 : 0;  /* 20 = gap */
    }

    function maxOffset() {
        return Math.max(0, track.scrollWidth - track.parentElement.offsetWidth);
    }

    function clamp(val) {
        return Math.min(maxOffset(), Math.max(0, val));
    }

    function applyOffset() {
        track.style.translate = `-${offset}px 0`;
        prevBtn.disabled = offset <= 0;
        nextBtn.disabled = offset >= maxOffset();
    }

    prevBtn.addEventListener('click', () => {
        offset = clamp(offset - getCardWidth());
        applyOffset();
    });

    nextBtn.addEventListener('click', () => {
        offset = clamp(offset + getCardWidth());
        applyOffset();
    });

    /* Recalculate on resize */
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            offset = clamp(offset);
            applyOffset();
        }, 150);
    }, { passive: true });

    applyOffset();
})();


/* ─────────────────────────────────────────────
   5. NEWSLETTER FORM
───────────────────────────────────────────── */
(function () {
    const form    = document.getElementById('newsletterForm');
    const confirm = document.getElementById('newsletterConfirm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input  = form.querySelector('input[type="email"]');
        const button = form.querySelector('button[type="submit"]');

        if (!input || !input.value.trim()) {
            input && input.focus();
            return;
        }

        /* Disable form and show confirmation */
        input.disabled  = true;
        button.disabled = true;
        button.textContent = '✓';

        if (confirm) {
            confirm.style.display = 'block';
        }
    });
})();
