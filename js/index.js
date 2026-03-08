const carousel = document.getElementById('heroCarousel');
const slides   = carousel.querySelectorAll('.hero-carousel__slide');
const dots     = carousel.querySelectorAll('.hero-carousel__dot');
const prevBtn  = document.getElementById('heroPrev');
const nextBtn  = document.getElementById('heroNext');

let current  = 0;
let timer    = null;
const DELAY  = 5000;

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

carousel.addEventListener('mouseenter', stopAuto);
carousel.addEventListener('mouseleave', startAuto);

// touch / swipe support
let touchStartX = 0;
carousel.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
carousel.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
    startAuto();
}, { passive: true });

startAuto();
