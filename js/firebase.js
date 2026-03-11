/* ═══════════════════════════════════════════════════════════
   js/firebase.js  —  habbyFootie Firebase Initialization
   ─────────────────────────────────────────────────────────
   ⚠️  SECURITY: Never commit real API keys to GitHub.
       Replace the placeholder values below with your actual
       Firebase project credentials from:
       Firebase Console → Project Settings → Your Apps → SDK setup

   HOW TO USE:
   Import this file in any page that needs Firebase:
     <script type="module" src="../js/firebase.js"></script>

   Then import specific services in your page scripts:
     import { db, storage, auth } from '../js/firebase.js';
   ═══════════════════════════════════════════════════════════ */


import { initializeApp }          from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore }            from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getStorage }              from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';
import { getAuth }                 from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getAnalytics }            from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js';

/* ─────────────────────────────────────────────
   FIREBASE CONFIG
   ─────────────────────────────────────────────
   Replace ALL placeholder values below with your
   real credentials from Firebase Console.
   DO NOT push real keys to a public repository.
───────────────────────────────────────────── */
const firebaseConfig = {
  apiKey: "AIzaSyCd0tcx1OgJS2pYY8WKgclZEDYZWcdJsHM",
  authDomain: "welted-fa60b.firebaseapp.com",
  projectId: "welted-fa60b",
  storageBucket: "welted-fa60b.firebasestorage.app",
  messagingSenderId: "68649505005",
  appId: "1:68649505005:web:7027fd16b51d517d7e7ce4"
};

/* ─────────────────────────────────────────────
   INITIALIZE
───────────────────────────────────────────── */
const app       = initializeApp(firebaseConfig);
const db        = getFirestore(app);
const storage   = getStorage(app);
const auth      = getAuth(app);
const analytics = getAnalytics(app);

/* ─────────────────────────────────────────────
   EXPORTS  — import these in page-level scripts
───────────────────────────────────────────── */
export { app, db, storage, auth, analytics };


/* ═══════════════════════════════════════════════════════════
   FIRESTORE COLLECTION REFERENCES
   ─────────────────────────────────────────────────────────
   Import these anywhere you need a collection ref:
     import { productsCol, ordersCol } from '../js/firebase.js';
   ═══════════════════════════════════════════════════════════ */
import { collection } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

export const productsCol = collection(db, 'products');
export const ordersCol   = collection(db, 'orders');
export const usersCol    = collection(db, 'users');
export const cartsCol    = collection(db, 'carts');


/* ═══════════════════════════════════════════════════════════
   PRODUCT HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════ */
import {
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

/**
 * Fetch all products — optionally filtered by category and/or subcategory.
 *
 * When Firebase is wired, replace the local PRODUCTS array in collection.js
 * with a call to this function:
 *
 *   const products = await fetchProducts({ category: 'boots', sort: 'price-asc' });
 *
 * @param {object}  opts
 * @param {string}  [opts.category]      - top-level category slug  e.g. 'boots'
 * @param {string}  [opts.subcategory]   - subcategory slug          e.g. 'chelsea'
 * @param {string}  [opts.sort]          - 'new' | 'popular' | 'price-asc' | 'price-desc'
 * @param {number}  [opts.pageSize]      - number of results per page (default 12)
 * @param {*}       [opts.lastDoc]       - last Firestore doc snapshot for pagination
 * @returns {Promise<{ products: object[], lastDoc: * }>}
 */
export async function fetchProducts({
    category    = null,
    subcategory = null,
    sort        = 'new',
    pageSize    = 12,
    lastDoc     = null,
} = {}) {
    const sortMap = {
        'new':        ['createdAt', 'desc'],
        'popular':    ['popular',   'desc'],
        'price-asc':  ['price',     'asc'],
        'price-desc': ['price',     'desc'],
    };
    const [sortField, sortDir] = sortMap[sort] || ['createdAt', 'desc'];

    const constraints = [orderBy(sortField, sortDir), limit(pageSize)];

    if (category)    constraints.unshift(where('category',    '==', category));
    if (subcategory) constraints.unshift(where('subcategory', '==', subcategory));
    if (lastDoc)     constraints.push(startAfter(lastDoc));

    const q    = query(productsCol, ...constraints);
    const snap = await getDocs(q);

    return {
        products: snap.docs.map(d => ({ id: d.id, ...d.data() })),
        lastDoc:  snap.docs[snap.docs.length - 1] ?? null,
    };
}

/**
 * Fetch a single product by its Firestore document ID.
 * Used on the Product Detail page.
 *
 * @param {string} productId
 * @returns {Promise<object|null>}
 */
export async function fetchProduct(productId) {
    const snap = await getDoc(doc(db, 'products', productId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}


/* ═══════════════════════════════════════════════════════════
   CART HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════ */
import {
    setDoc,
    updateDoc,
    deleteField,
    serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

/**
 * Firestore cart document structure:
 * /carts/{userId} → {
 *   items: {
 *     [productId]: { productId, name, price, image, size, quantity }
 *   },
 *   updatedAt: serverTimestamp()
 * }
 */

/**
 * Add or increment a cart item.
 */
export async function cartAdd(userId, product, size = null, qty = 1) {
    const cartRef  = doc(db, 'carts', userId);
    const key      = size ? `${product.id}_${size}` : product.id;
    return setDoc(cartRef, {
        items: {
            [key]: {
                productId: product.id,
                name:      product.name,
                price:     product.price,
                image:     product.image,
                size,
                quantity:  qty,
            },
        },
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

/**
 * Remove a cart item.
 */
export async function cartRemove(userId, itemKey) {
    const cartRef = doc(db, 'carts', userId);
    return updateDoc(cartRef, {
        [`items.${itemKey}`]: deleteField(),
        updatedAt: serverTimestamp(),
    });
}

/**
 * Get the current user's cart.
 */
export async function cartGet(userId) {
    const snap = await getDoc(doc(db, 'carts', userId));
    return snap.exists() ? snap.data() : { items: {} };
}


/* ═══════════════════════════════════════════════════════════
   AUTH HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════ */
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

export const login    = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const logout   = ()                => signOut(auth);
export const onAuth   = (callback)        => onAuthStateChanged(auth, callback);


/* ═══════════════════════════════════════════════════════════
   STORAGE HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════ */
import {
    ref,
    getDownloadURL,
    uploadBytesResumable,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

/**
 * Get a public download URL for a product image.
 * Storage path convention: products/{productId}/{filename}
 *
 * @param {string} productId
 * @param {string} filename  e.g. 'image_1.jpg'
 * @returns {Promise<string>}
 */
export function getProductImageURL(productId, filename) {
    return getDownloadURL(ref(storage, `products/${productId}/${filename}`));
}

/**
 * Upload a product image (admin use / upload script only).
 * Returns an upload task so you can track progress.
 *
 * @param {string} productId
 * @param {string} filename
 * @param {File|Blob} file
 * @returns {UploadTask}
 */
export function uploadProductImage(productId, filename, file) {
    const storageRef = ref(storage, `products/${productId}/${filename}`);
    return uploadBytesResumable(storageRef, file);
}
