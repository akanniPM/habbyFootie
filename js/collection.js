/* ═══════════════════════════════════════════════════════════
   js/collection.js  —  habbyFootie Collection Page
   ─────────────────────────────────────────────────────────
   Architecture note (Firebase-ready):
   · PRODUCTS array mirrors Firestore document schema exactly.
   · When Firebase is wired, replace loadProducts() with a
     Firestore query — all render/filter/sort code stays the same.
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────
   1. CATEGORY & SUBCATEGORY DEFINITIONS
───────────────────────────────────────────── */
const CATEGORIES = [
    { id: 'all', label: 'All', subcategories: [] },
    {
        id: 'oxfords-derbys',
        label: 'Oxfords & Derbys',
        subcategories: [
            { id: 'cap-toe',          label: 'Cap Toe' },
            { id: 'plain-toe-oxford', label: 'Plain Toe Oxford' },
            { id: 'wingtip-oxford',   label: 'Wingtip Oxford' },
            { id: 'wholecut',         label: 'Wholecut' },
            { id: 'patent',           label: 'Patent Leather' },
            { id: 'spectator-oxford', label: 'Spectator' },
            { id: 'plain-toe-derby',  label: 'Plain Toe Derby' },
            { id: 'apron-toe',        label: 'Apron Toe' },
            { id: 'suede-derby',      label: 'Suede Derby' },
            { id: 'split-toe-derby',  label: 'Split Toe Derby' },
        ],
    },
    {
        id: 'loafers',
        label: 'Loafers',
        subcategories: [
            { id: 'penny',      label: 'Penny Loafer' },
            { id: 'tassel',     label: 'Tassel Loafer' },
            { id: 'horsebit',   label: 'Horsebit Loafer' },
            { id: 'belgian',    label: 'Belgian Loafer' },
            { id: 'kiltie',     label: 'Kiltie Loafer' },
            { id: 'venetian',   label: 'Venetian Loafer' },
            { id: 'driving-moc',label: 'Driving Moccasin' },
        ],
    },
    {
        id: 'brogues',
        label: 'Brogues',
        subcategories: [
            { id: 'full-brogue',      label: 'Full Brogue' },
            { id: 'semi-brogue',      label: 'Semi Brogue' },
            { id: 'quarter-brogue',   label: 'Quarter Brogue' },
            { id: 'longwing-brogue',  label: 'Longwing Brogue' },
            { id: 'spectator-brogue', label: 'Spectator Brogue' },
        ],
    },
    {
        id: 'monk-straps',
        label: 'Monk Straps',
        subcategories: [
            { id: 'single-monk', label: 'Single Monk Strap' },
            { id: 'double-monk', label: 'Double Monk Strap' },
            { id: 'triple-monk', label: 'Triple Monk Strap' },
            { id: 'suede-monk',  label: 'Suede Monk Strap' },
        ],
    },
    {
        id: 'boots',
        label: 'Boots',
        subcategories: [
            { id: 'chelsea',     label: 'Chelsea Boots' },
            { id: 'chukka',      label: 'Chukka Boots' },
            { id: 'desert',      label: 'Desert Boots' },
            { id: 'work',        label: 'Work Boots' },
            { id: 'combat',      label: 'Combat Boots' },
            { id: 'engineer',    label: 'Engineer Boots' },
            { id: 'jodhpur',     label: 'Jodhpur Boots' },
            { id: 'dress-boot',  label: 'Dress Boots' },
            { id: 'winter',      label: 'Winter Boots' },
        ],
    },
    {
        id: 'sneakers',
        label: 'Sneakers',
        subcategories: [
            { id: 'minimalist-trainer', label: 'Minimalist Trainer' },
            { id: 'retro-running',      label: 'Retro Running' },
            { id: 'high-top',           label: 'High-Top' },
            { id: 'low-top-court',      label: 'Low-Top Court' },
            { id: 'slip-on-sneaker',    label: 'Slip-On' },
            { id: 'platform-sneaker',   label: 'Platform' },
            { id: 'luxury-designer',    label: 'Luxury Designer' },
            { id: 'vegan-leather',      label: 'Vegan Leather' },
        ],
    },
    {
        id: 'casual-sandals',
        label: 'Casual & Sandals',
        subcategories: [
            { id: 'classic-moccasin',  label: 'Classic Moccasin' },
            { id: 'boat-shoe',         label: 'Boat Shoes' },
            { id: 'driving-shoe',      label: 'Driving Shoe' },
            { id: 'leather-slide',     label: 'Leather Slides' },
            { id: 'gladiator',         label: 'Gladiator Sandals' },
            { id: 'fisherman',         label: 'Fisherman Sandals' },
            { id: 'espadrille',        label: 'Espadrilles' },
            { id: 'palm-slipper',      label: 'Palm Slippers' },
            { id: 'half-shoe',         label: 'Half Shoes' },
        ],
    },
];

/* ─────────────────────────────────────────────
   2. PRODUCT DATA  (Firebase-ready schema)
   ─────────────────────────────────────────────
   When Firebase is wired:
     const snap = await getDocs(collection(db, 'products'));
     PRODUCTS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
   Everything below stays the same.
───────────────────────────────────────────── */
const IMG = {
    oxford1: 'https://cdn.pixabay.com/photo/2021/03/08/12/06/oxford-shoes-6078951_1280.jpg',
    oxford2: '../images/aria-johnson-CR1Wo3lTdWY-unsplash.jpg',
    brogue1: 'https://cdn.pixabay.com/photo/2021/02/05/08/31/brogue-shoes-5983822_1280.jpg',
    brogue2: '../images/clay-banks-gDMD50gEibI-unsplash.jpg',
    loafer1: 'https://cdn.pixabay.com/photo/2020/07/30/11/39/shoe-5449711_1280.jpg',
    sneaker1:'https://cdn.pixabay.com/photo/2019/07/28/02/55/shoes-4367529_640.jpg',
    boot1:   'https://cdn.pixabay.com/photo/2017/08/06/20/53/boots-2598697_640.jpg',
};

const PRODUCTS = [
    // ── OXFORDS & DERBYS ──────────────────────────
    {
        id: 'prod_001',
        name: 'Cap Toe Oxford — Black',
        category: 'oxfords-derbys',
        subcategory: 'cap-toe',
        price: 55000,
        image: IMG.oxford1,
        badge: 'New',
        popular: 88,
        inStock: true,
        createdAt: '2026-03-01',
    },
    {
        id: 'prod_002',
        name: 'Wingtip Oxford — Dark Brown',
        category: 'oxfords-derbys',
        subcategory: 'wingtip-oxford',
        price: 52000,
        image: IMG.oxford2,
        badge: null,
        popular: 75,
        inStock: true,
        createdAt: '2026-02-20',
    },
    {
        id: 'prod_003',
        name: 'Wholecut Oxford — Burgundy',
        category: 'oxfords-derbys',
        subcategory: 'wholecut',
        price: 68000,
        image: IMG.oxford1,
        badge: 'New',
        popular: 82,
        inStock: true,
        createdAt: '2026-03-05',
    },
    {
        id: 'prod_004',
        name: 'Patent Leather Oxford — Black',
        category: 'oxfords-derbys',
        subcategory: 'patent',
        price: 72000,
        image: IMG.oxford2,
        badge: null,
        popular: 60,
        inStock: true,
        createdAt: '2026-01-15',
    },
    {
        id: 'prod_005',
        name: 'Plain Toe Derby — Tan',
        category: 'oxfords-derbys',
        subcategory: 'plain-toe-derby',
        price: 45000,
        image: IMG.brogue2,
        badge: null,
        popular: 70,
        inStock: true,
        createdAt: '2026-01-28',
    },
    {
        id: 'prod_006',
        name: 'Suede Derby — Chocolate',
        category: 'oxfords-derbys',
        subcategory: 'suede-derby',
        price: 48000,
        image: IMG.brogue1,
        badge: null,
        popular: 65,
        inStock: false,
        createdAt: '2026-02-10',
    },
    // ── LOAFERS ───────────────────────────────────
    {
        id: 'prod_007',
        name: 'Penny Loafer — Cognac',
        category: 'loafers',
        subcategory: 'penny',
        price: 49000,
        image: IMG.loafer1,
        badge: null,
        popular: 90,
        inStock: true,
        createdAt: '2026-02-05',
    },
    {
        id: 'prod_008',
        name: 'Tassel Loafer — Black',
        category: 'loafers',
        subcategory: 'tassel',
        price: 53000,
        image: IMG.loafer1,
        badge: 'New',
        popular: 78,
        inStock: true,
        createdAt: '2026-03-08',
    },
    {
        id: 'prod_009',
        name: 'Horsebit Loafer — Dark Brown',
        category: 'loafers',
        subcategory: 'horsebit',
        price: 78000,
        image: IMG.loafer1,
        badge: null,
        popular: 85,
        inStock: true,
        createdAt: '2026-01-20',
    },
    {
        id: 'prod_010',
        name: 'Venetian Loafer — Tan',
        category: 'loafers',
        subcategory: 'venetian',
        price: 44000,
        image: IMG.loafer1,
        badge: null,
        popular: 55,
        inStock: true,
        createdAt: '2026-01-10',
    },
    // ── BROGUES ───────────────────────────────────
    {
        id: 'prod_011',
        name: 'Full Brogue Wingtip — Black',
        category: 'brogues',
        subcategory: 'full-brogue',
        price: 57000,
        image: IMG.brogue1,
        badge: null,
        popular: 80,
        inStock: true,
        createdAt: '2026-02-14',
    },
    {
        id: 'prod_012',
        name: 'Semi Brogue — Brown',
        category: 'brogues',
        subcategory: 'semi-brogue',
        price: 51000,
        image: IMG.brogue2,
        badge: 'New',
        popular: 72,
        inStock: true,
        createdAt: '2026-03-02',
    },
    {
        id: 'prod_013',
        name: 'Quarter Brogue — Tan',
        category: 'brogues',
        subcategory: 'quarter-brogue',
        price: 47000,
        image: IMG.brogue1,
        badge: null,
        popular: 58,
        inStock: true,
        createdAt: '2026-01-25',
    },
    // ── MONK STRAPS ───────────────────────────────
    {
        id: 'prod_014',
        name: 'Single Monk Strap — Black',
        category: 'monk-straps',
        subcategory: 'single-monk',
        price: 58000,
        image: IMG.oxford1,
        badge: null,
        popular: 73,
        inStock: true,
        createdAt: '2026-02-01',
    },
    {
        id: 'prod_015',
        name: 'Double Monk Strap — Cognac',
        category: 'monk-straps',
        subcategory: 'double-monk',
        price: 63000,
        image: IMG.oxford2,
        badge: 'New',
        popular: 88,
        inStock: true,
        createdAt: '2026-03-07',
    },
    {
        id: 'prod_016',
        name: 'Suede Monk Strap — Charcoal',
        category: 'monk-straps',
        subcategory: 'suede-monk',
        price: 55000,
        image: IMG.brogue2,
        badge: null,
        popular: 62,
        inStock: true,
        createdAt: '2026-02-18',
    },
    // ── BOOTS ─────────────────────────────────────
    {
        id: 'prod_017',
        name: 'Chelsea Boot — Black',
        category: 'boots',
        subcategory: 'chelsea',
        price: 62000,
        image: IMG.boot1,
        badge: null,
        popular: 95,
        inStock: true,
        createdAt: '2026-01-05',
    },
    {
        id: 'prod_018',
        name: 'Chukka Boot — Sand Suede',
        category: 'boots',
        subcategory: 'chukka',
        price: 54000,
        image: IMG.boot1,
        badge: 'New',
        popular: 80,
        inStock: true,
        createdAt: '2026-03-04',
    },
    {
        id: 'prod_019',
        name: 'Dress Boot — Dark Brown',
        category: 'boots',
        subcategory: 'dress-boot',
        price: 68000,
        image: IMG.boot1,
        badge: null,
        popular: 77,
        inStock: true,
        createdAt: '2026-02-22',
    },
    {
        id: 'prod_020',
        name: 'Combat Boot — Black',
        category: 'boots',
        subcategory: 'combat',
        price: 71000,
        image: IMG.boot1,
        badge: null,
        popular: 69,
        inStock: true,
        createdAt: '2026-01-30',
    },
    // ── SNEAKERS ──────────────────────────────────
    {
        id: 'prod_021',
        name: 'Minimalist Leather Trainer — White',
        category: 'sneakers',
        subcategory: 'minimalist-trainer',
        price: 48000,
        image: IMG.sneaker1,
        badge: 'New',
        popular: 92,
        inStock: true,
        createdAt: '2026-03-09',
    },
    {
        id: 'prod_022',
        name: 'Retro Runner — Navy / White',
        category: 'sneakers',
        subcategory: 'retro-running',
        price: 52000,
        image: IMG.sneaker1,
        badge: null,
        popular: 84,
        inStock: true,
        createdAt: '2026-02-28',
    },
    {
        id: 'prod_023',
        name: 'High-Top Leather — Black',
        category: 'sneakers',
        subcategory: 'high-top',
        price: 56000,
        image: IMG.sneaker1,
        badge: null,
        popular: 76,
        inStock: true,
        createdAt: '2026-02-12',
    },
    // ── CASUAL & SANDALS ──────────────────────────
    {
        id: 'prod_024',
        name: 'Italian Driving Shoe — Cognac',
        category: 'casual-sandals',
        subcategory: 'driving-shoe',
        price: 41000,
        image: IMG.loafer1,
        badge: 'New',
        popular: 66,
        inStock: true,
        createdAt: '2026-03-06',
    },
];

/* ─────────────────────────────────────────────
   3. PAGINATION CONFIG
───────────────────────────────────────────── */
const PAGE_SIZE = 12;

/* ─────────────────────────────────────────────
   4. STATE
───────────────────────────────────────────── */
const state = {
    activeCategory:    'all',
    activeSubcategory: null,
    sort:              'new',
    page:              1,
    /** Filtered + sorted results */
    results:           [],
};

/* ─────────────────────────────────────────────
   5. DOM REFS
───────────────────────────────────────────── */
const $grid          = document.getElementById('productGrid');
const $count         = document.getElementById('productCount');
const $catTabs       = document.getElementById('catTabs');
const $subchipsWrap  = document.getElementById('subchipsWrap');
const $subchips      = document.getElementById('subchips');
const $sortSelect    = document.getElementById('sortSelect');
const $activeFilters = document.getElementById('activeFilters');
const $filterPills   = document.getElementById('filterPills');
const $clearAll      = document.getElementById('clearAll');
const $emptyState    = document.getElementById('emptyState');
const $emptyReset    = document.getElementById('emptyReset');
const $loadMoreWrap  = document.getElementById('loadMoreWrap');
const $loadMoreBtn   = document.getElementById('loadMoreBtn');
const $loadMoreMeta  = document.getElementById('loadMoreMeta');

/* ─────────────────────────────────────────────
   6. HELPERS
───────────────────────────────────────────── */
function formatPrice(n) {
    return '\u20a6' + n.toLocaleString('en-NG');
}

function getCategoryDef(id) {
    return CATEGORIES.find(c => c.id === id) || CATEGORIES[0];
}

/* ─────────────────────────────────────────────
   7. FILTER & SORT
───────────────────────────────────────────── */
function filterAndSort() {
    let list = [...PRODUCTS];

    // Category filter
    if (state.activeCategory !== 'all') {
        list = list.filter(p => p.category === state.activeCategory);
    }

    // Subcategory filter
    if (state.activeSubcategory) {
        list = list.filter(p => p.subcategory === state.activeSubcategory);
    }

    // Sort
    switch (state.sort) {
        case 'new':
            list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            break;
        case 'popular':
            list.sort((a, b) => b.popular - a.popular);
            break;
        case 'price-asc':
            list.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            list.sort((a, b) => b.price - a.price);
            break;
    }

    state.results = list;
    state.page    = 1;
}

/* ─────────────────────────────────────────────
   8. RENDER PRODUCT CARD
───────────────────────────────────────────── */
function renderCard(product) {
    const outOfStock = !product.inStock;
    const badge      = product.badge
        ? `<span class="product-card__badge">${product.badge}</span>`
        : '';
    const oosOverlay = outOfStock
        ? `<div style="position:absolute;inset:0;background:rgba(10,10,10,0.55);display:grid;place-items:center;border-radius:4px;">
               <span style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.55);">Sold Out</span>
           </div>`
        : '';
    const quickAdd = outOfStock
        ? ''
        : `<div class="product-card__overlay">
               <button class="product-card__quick-add" type="button"
                   data-id="${product.id}"
                   aria-label="Quick add ${product.name} to cart">+ Quick Add</button>
           </div>`;

    return `
    <article class="product-card product-card--dark" role="listitem" data-id="${product.id}">
        <div class="product-card__img-wrap" style="cursor:pointer;" onclick="goToProduct('${product.id}')">
            <img
                src="${product.image}"
                alt="${product.name}"
                loading="lazy"
            />
            ${quickAdd}
            ${badge}
            ${oosOverlay}
        </div>
        <div class="product-card__info product-card__info--dark" style="cursor:pointer;" onclick="goToProduct('${product.id}')">
            <span class="product-card__category">${getCategoryDef(product.category).label}</span>
            <h3 class="product-card__name">${product.name}</h3>
            <p class="product-card__price">${formatPrice(product.price)}</p>
        </div>
    </article>`;
}

/* ─────────────────────────────────────────────
   9. RENDER GRID
───────────────────────────────────────────── */
function renderGrid(append = false) {
    const start   = (state.page - 1) * PAGE_SIZE;
    const end     = state.page * PAGE_SIZE;
    const visible = state.results.slice(0, end);
    const total   = state.results.length;

    // Show empty state
    const isEmpty = total === 0;
    $emptyState.hidden  = !isEmpty;
    $grid.hidden        = isEmpty;
    $loadMoreWrap.hidden = isEmpty || total <= PAGE_SIZE;

    if (isEmpty) {
        $count.textContent = 'No products found';
        return;
    }

    // Render cards
    if (!append) {
        $grid.innerHTML = visible.map(renderCard).join('');
    } else {
        const fragment = document.createDocumentFragment();
        const tmp = document.createElement('div');
        tmp.innerHTML = state.results.slice(start, end).map(renderCard).join('');
        while (tmp.firstChild) fragment.appendChild(tmp.firstChild);
        $grid.appendChild(fragment);
    }

    // Count
    $count.textContent = `Showing ${Math.min(end, total)} of ${total} product${total !== 1 ? 's' : ''}`;

    // Load more
    if (total > PAGE_SIZE) {
        const remaining = total - end;
        $loadMoreWrap.hidden = end >= total;
        $loadMoreMeta.textContent = end < total
            ? `${remaining} more product${remaining !== 1 ? 's' : ''} to load`
            : '';
    }
}

/* ─────────────────────────────────────────────
   10. RENDER SUBCATEGORY CHIPS
───────────────────────────────────────────── */
function renderSubchips() {
    const catDef = getCategoryDef(state.activeCategory);
    const subs   = catDef.subcategories;

    if (!subs.length || state.activeCategory === 'all') {
        $subchipsWrap.hidden = true;
        return;
    }

    $subchipsWrap.hidden = false;
    $subchips.innerHTML = subs.map(sub => `
        <button class="subchip${state.activeSubcategory === sub.id ? ' is-active' : ''}"
            data-sub="${sub.id}"
            type="button"
            aria-pressed="${state.activeSubcategory === sub.id}">
            ${sub.label}
        </button>
    `).join('');
}

/* ─────────────────────────────────────────────
   11. RENDER ACTIVE FILTER PILLS
───────────────────────────────────────────── */
function renderFilterPills() {
    const catDef = getCategoryDef(state.activeCategory);
    const pills  = [];

    if (state.activeCategory !== 'all') {
        pills.push({ id: 'cat', label: catDef.label });
    }
    if (state.activeSubcategory) {
        const subDef = catDef.subcategories.find(s => s.id === state.activeSubcategory);
        if (subDef) pills.push({ id: 'sub', label: subDef.label });
    }

    $activeFilters.hidden = pills.length === 0;

    $filterPills.innerHTML = pills.map(p => `
        <span class="filter-pill">
            ${p.label}
            <span class="material-symbols-outlined" data-remove="${p.id}"
                role="button" tabindex="0" aria-label="Remove ${p.label} filter">close</span>
        </span>
    `).join('');
}

/* ─────────────────────────────────────────────
   12. FULL REFRESH
───────────────────────────────────────────── */
function refresh() {
    filterAndSort();
    renderSubchips();
    renderFilterPills();
    renderGrid();
}

/* ─────────────────────────────────────────────
   13. NAVBAR SCROLL SHADOW
───────────────────────────────────────────── */
(function () {
    const nav = document.getElementById('mainNav');
    const bar = document.getElementById('filterBar');
    if (!nav) return;

    window.addEventListener('scroll', () => {
        nav.classList.toggle('is-scrolled', window.scrollY > 8);
        if (bar) {
            const stuck = window.scrollY > (document.querySelector('.col-hero').offsetHeight + 40);
            bar.classList.toggle('is-stuck', stuck);
        }
    }, { passive: true });
})();

/* ─────────────────────────────────────────────
   14. EVENT LISTENERS
───────────────────────────────────────────── */

// Category tab clicks
$catTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.cat-tab');
    if (!tab) return;

    $catTabs.querySelectorAll('.cat-tab').forEach(t => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('is-active');
    tab.setAttribute('aria-selected', 'true');

    state.activeCategory    = tab.dataset.category;
    state.activeSubcategory = null;

    refresh();
});

// Subcategory chip clicks (delegated — chips are dynamically rendered)
$subchips.addEventListener('click', (e) => {
    const chip = e.target.closest('.subchip');
    if (!chip) return;

    const subId = chip.dataset.sub;
    // Toggle: clicking active chip clears the subcategory filter
    state.activeSubcategory = state.activeSubcategory === subId ? null : subId;

    refresh();
});

// Sort change
$sortSelect.addEventListener('change', () => {
    state.sort = $sortSelect.value;
    refresh();
});

// Remove individual filter pill
$filterPills.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('[data-remove]');
    if (!removeBtn) return;

    const which = removeBtn.dataset.remove;
    if (which === 'cat') {
        state.activeCategory    = 'all';
        state.activeSubcategory = null;
        $catTabs.querySelectorAll('.cat-tab').forEach(t => {
            t.classList.toggle('is-active', t.dataset.category === 'all');
            t.setAttribute('aria-selected', t.dataset.category === 'all' ? 'true' : 'false');
        });
    } else if (which === 'sub') {
        state.activeSubcategory = null;
    }
    refresh();
});

// Clear all filters
$clearAll.addEventListener('click', () => {
    state.activeCategory    = 'all';
    state.activeSubcategory = null;
    $catTabs.querySelectorAll('.cat-tab').forEach(t => {
        t.classList.toggle('is-active', t.dataset.category === 'all');
        t.setAttribute('aria-selected', t.dataset.category === 'all' ? 'true' : 'false');
    });
    refresh();
});

// Empty state reset
$emptyReset.addEventListener('click', () => {
    state.activeCategory    = 'all';
    state.activeSubcategory = null;
    $catTabs.querySelectorAll('.cat-tab').forEach(t => {
        t.classList.toggle('is-active', t.dataset.category === 'all');
        t.setAttribute('aria-selected', t.dataset.category === 'all' ? 'true' : 'false');
    });
    refresh();
});

// Load More
$loadMoreBtn.addEventListener('click', () => {
    state.page += 1;
    renderGrid(true);
});

// Quick Add button handler (delegated)
$grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.product-card__quick-add');
    if (!btn) return;

    const productId = btn.dataset.id;
    addToCart(productId);
});

/* ─────────────────────────────────────────────
   15. NAVIGATION
───────────────────────────────────────────── */

/**
 * Navigate to product detail page.
 * TODO: replace with router / Firebase product fetch when wired.
 */
function goToProduct(productId) {
    // Future: window.location.href = `product.html?id=${productId}`;
    console.log('[habbyFootie] Navigate to product:', productId);
}

/* ─────────────────────────────────────────────
   16. CART (stub — wire to Firebase later)
───────────────────────────────────────────── */
function addToCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product || !product.inStock) return;

    const countEl = document.getElementById('cartCount');
    if (countEl) {
        const current = parseInt(countEl.textContent, 10) || 0;
        countEl.textContent = current + 1;
    }

    // TODO: persist to localStorage / Firestore cart collection
    console.log('[habbyFootie] Added to cart:', product.name);
}

/* ─────────────────────────────────────────────
   17. INIT
───────────────────────────────────────────── */
refresh();
