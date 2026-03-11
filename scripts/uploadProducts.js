/**
 * scripts/uploadProducts.js
 * ─────────────────────────────────────────────────────────────
 * Run once to upload all product images + create Firestore docs.
 *
 * BEFORE RUNNING:
 *   1. Place serviceAccountKey.json in this scripts/ folder
 *   2. Organise images at:  ../images/products/{productId}/image_1.jpg
 *   3. Run from this folder:
 *        cd scripts
 *        npm init -y
 *        npm install firebase-admin
 *        node uploadProducts.js
 * ─────────────────────────────────────────────────────────────
 */

const admin    = require('firebase-admin');
const fs       = require('fs');
const path     = require('path');
const service  = require('./serviceAccountKey.json');

// ─── INIT ────────────────────────────────────────────────────
admin.initializeApp({
    credential:    admin.credential.cert(service),
    storageBucket: 'welted-fa60b.firebasestorage.app',
});

const db     = admin.firestore();
const bucket = admin.storage().bucket();

// ─── LOAD CATALOGUE ──────────────────────────────────────────
const products = require('./products-catalogue.json');

// ─── HELPERS ─────────────────────────────────────────────────

/**
 * Get the public download URL for a just-uploaded file.
 */
async function getPublicURL(storagePath) {
    const file = bucket.file(storagePath);
    const [url] = await file.getSignedUrl({
        action:  'read',
        expires: '03-01-2030',   // long-lived URL — change if needed
    });
    return url;
}

/**
 * Upload all images for one product and return their public URLs.
 */
async function uploadImages(productId) {
    const folder = path.join(__dirname, '..', 'images', 'products', productId);

    if (!fs.existsSync(folder)) {
        console.warn(`  ⚠️  No image folder found at: ${folder} — skipping images`);
        return { names: [], urls: [] };
    }

    const files  = fs.readdirSync(folder).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    const names  = [];
    const urls   = [];

    for (const filename of files) {
        const localPath   = path.join(folder, filename);
        const storagePath = `products/${productId}/${filename}`;

        await bucket.upload(localPath, {
            destination: storagePath,
            metadata: {
                contentType:  'image/jpeg',
                cacheControl: 'public, max-age=31536000',
            },
        });

        const url = await getPublicURL(storagePath);
        names.push(filename);
        urls.push(url);
        console.log(`    ✓ ${filename}`);
    }

    return { names, urls };
}

/**
 * Create or overwrite a Firestore document for one product.
 */
async function writeFirestoreDoc(product, imageNames, imageURLs) {
    await db.collection('products').doc(product.id).set({
        name:         product.name,
        category:     product.category,
        subcategory:  product.subcategory,
        price:        product.price,
        priceKobo:    product.priceKobo,
        description:  product.description,
        sizes:        product.sizes,
        badge:        product.badge   ?? null,
        popular:      product.popular ?? 0,
        inStock:      product.inStock ?? true,
        stockCount:   product.stockCount ?? 0,
        images:       imageNames,      // filenames array
        imageURLs:    imageURLs,       // public download URLs array
        createdAt:    admin.firestore.FieldValue.serverTimestamp(),
        updatedAt:    admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`    ✓ Firestore doc written`);
}

// ─── MAIN ────────────────────────────────────────────────────
(async () => {
    console.log(`\n🚀 Starting upload — ${products.length} products\n`);

    let success = 0;
    let failed  = 0;

    for (const product of products) {
        console.log(`\n[${success + failed + 1}/${products.length}] ${product.id}`);
        try {
            const { names, urls } = await uploadImages(product.id);
            await writeFirestoreDoc(product, names, urls);
            success++;
        } catch (err) {
            console.error(`  ✗ Error: ${err.message}`);
            failed++;
        }
    }

    console.log(`\n─────────────────────────────────────`);
    console.log(`✅ Done — ${success} uploaded, ${failed} failed`);
    console.log(`─────────────────────────────────────\n`);
    process.exit(0);
})();
