# habbyFootie — Firebase Product API Implementation Plan

## Overview

| Layer | Tool |
|---|---|
| Frontend | Vanilla JS (ES modules) |
| Database | Firestore |
| Image Storage | Firebase Storage |
| Auth | Firebase Auth |
| Webhooks / Order logic | Firebase Cloud Functions (Node.js) |
| Payments | Paystack |

---

## PHASE 1 — Firebase Project Setup
**Goal:** Create your Firebase project and get credentials.

### Step 1.1 — Create the Firebase Project
1. Go to https://console.firebase.google.com
2. Click **Add project** → Name it `welted`
3. Disable Google Analytics for now (enable later)
4. Click **Create project**

### Step 1.2 — Register your Web App
1. Inside the project → Click **</>** (Web app icon)
2. App nickname: `Welted Web`
3. Do **not** enable Firebase Hosting yet
4. Copy the `firebaseConfig` object shown
5. Paste it into `js/firebase.js` replacing all `YOUR_*` placeholders

### Step 1.3 — Enable Services
In the Firebase Console left sidebar:
- **Firestore Database** → Create database → **Production mode** → Choose region: `europe-west1` (closest to Nigeria)
- **Storage** → Get started → Production mode → Same region
- **Authentication** → Get started → Enable **Email/Password** provider

---

## PHASE 2 — Firestore Schema Setup
**Goal:** Create your collections and define document structure.

### Step 2.1 — Collection: `products`
Each document ID = a short readable slug e.g. `cap-toe-oxford-black`

```
/products/{productId}
  name:          string    "Cap Toe Oxford — Black"
  category:      string    "oxfords-derbys"
  subcategory:   string    "cap-toe"
  price:         number    55000               ← in Naira (kobo for Paystack later)
  priceKobo:     number    5500000             ← price × 100 for Paystack
  description:   string    "Hand-finished full-grain..."
  images:        array     ["image_1.jpg", "image_2.jpg"]  ← filenames only
  sizes:         array     [39, 40, 41, 42, 43, 44, 45]
  badge:         string    "New" | "Sale" | null
  popular:       number    0                   ← increment on each view/purchase
  inStock:       boolean   true
  stockCount:    number    10
  createdAt:     timestamp serverTimestamp()
  updatedAt:     timestamp serverTimestamp()
```

### Step 2.2 — Collection: `orders`
```
/orders/{orderId}
  userId:         string
  reference:      string    ← Paystack transaction reference
  items:          array     [{ productId, name, price, size, qty, image }]
  total:          number    ← in Naira
  totalKobo:      number    ← total × 100
  delivery:       object    { name, email, phone, address, city, state }
  status:         string    "pending" | "paid" | "fulfilled" | "cancelled"
  paystackStatus: string    ← raw Paystack response status
  createdAt:      timestamp
  updatedAt:      timestamp
```

### Step 2.3 — Collection: `users`
```
/users/{userId}            ← same ID as Firebase Auth UID
  email:      string
  name:       string
  phone:      string
  address:    string
  role:       string    "customer" | "admin"
  createdAt:  timestamp
```

### Step 2.4 — Collection: `carts`
```
/carts/{userId}
  items: {
    [productId_size]: { productId, name, price, image, size, quantity }
  }
  updatedAt: timestamp
```

---

## PHASE 3 — Firestore Security Rules
**Goal:** Lock down who can read/write what.

### Step 3.1 — Apply these rules
In Firebase Console → Firestore → Rules tab, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Products: anyone can read, only admin can write
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null
                   && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Orders: only the owner can read, Cloud Function writes (admin SDK bypasses rules)
    match /orders/{orderId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow write: if false;   // Cloud Function handles all order writes
    }

    // Users: authenticated user can read/write their own profile only
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Carts: authenticated user can read/write their own cart only
    match /carts/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 3.2 — Storage Security Rules
In Firebase Console → Storage → Rules tab, paste:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Product images: anyone can read, only admin can upload
    match /products/{productId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## PHASE 4 — Image Organisation & Upload
**Goal:** Upload your 100 product images to Firebase Storage.

### Step 4.1 — Organise images locally before upload
Rename your 100 images following this convention:
```
images/products/
  cap-toe-oxford-black/
    image_1.jpg    ← main display image
    image_2.jpg    ← side angle
    image_3.jpg    ← sole/detail
  chelsea-boot-black/
    image_1.jpg
    image_2.jpg
  ...
```
One folder per product. Folder name = productId.

### Step 4.2 — Install the upload script dependencies
Create a folder `scripts/` in your project root:
```
mkdir scripts
cd scripts
npm init -y
npm install firebase-admin
```

### Step 4.3 — Get your Service Account Key
1. Firebase Console → Project Settings → Service accounts
2. Click **Generate new private key**
3. Save as `scripts/serviceAccountKey.json`
4. **This file is in .gitignore — NEVER commit it**

### Step 4.4 — Create the upload script `scripts/uploadProducts.js`
This Node.js script will:
- Read each product folder from a local CSV/JSON catalogue
- Upload images to Firebase Storage
- Create/update Firestore product documents with image filenames + metadata

```javascript
// scripts/uploadProducts.js  — run once: node uploadProducts.js
const admin   = require('firebase-admin');
const fs      = require('fs');
const path    = require('path');
const service = require('./serviceAccountKey.json');

admin.initializeApp({
    credential:    admin.credential.cert(service),
    storageBucket: 'welted-fa60b.firebasestorage.app',
});

const db      = admin.firestore();
const bucket  = admin.storage().bucket();

// Load your product catalogue (see Step 4.5)
const products = require('./products-catalogue.json');

async function uploadProduct(product) {
    const folder    = `../images/products/${product.id}`;
    const imageFiles = fs.readdirSync(folder);
    const uploadedNames = [];

    for (const filename of imageFiles) {
        const localPath   = path.join(folder, filename);
        const storagePath = `products/${product.id}/${filename}`;

        await bucket.upload(localPath, {
            destination: storagePath,
            metadata: {
                contentType: 'image/jpeg',
                cacheControl: 'public, max-age=31536000',
            },
        });
        uploadedNames.push(filename);
        console.log(`  ✓ Uploaded ${storagePath}`);
    }

    // Write Firestore document
    await db.collection('products').doc(product.id).set({
        ...product,
        images:    uploadedNames,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`  ✓ Firestore doc created: ${product.id}`);
}

(async () => {
    for (const product of products) {
        console.log(`\nUploading: ${product.id}`);
        await uploadProduct(product);
    }
    console.log('\n✅ All products uploaded.');
    process.exit(0);
})();
```

### Step 4.5 — Create `scripts/products-catalogue.json`
One entry per product. Images filenames are set automatically by the script:

```json
[
  {
    "id":          "cap-toe-oxford-black",
    "name":        "Cap Toe Oxford — Black",
    "category":    "oxfords-derbys",
    "subcategory": "cap-toe",
    "price":       55000,
    "priceKobo":   5500000,
    "description": "Hand-finished full-grain calf leather with a clean cap toe line. Built on a Goodyear welt for longevity.",
    "sizes":       [39, 40, 41, 42, 43, 44, 45],
    "badge":       "New",
    "popular":     0,
    "inStock":     true,
    "stockCount":  15
  }
]
```

### Step 4.6 — Run the upload
```bash
cd scripts
node uploadProducts.js
```

---

## PHASE 5 — Frontend Integration
**Goal:** Replace static PRODUCTS array in `collection.js` with live Firestore reads.

### Step 5.1 — Update `collection.js` to use Firebase
Replace the `PRODUCTS` array and the `refresh()` call with:

```javascript
// At top of collection.js
import { fetchProducts } from './firebase.js';

// Replace refresh() initial call with:
async function loadAndRender() {
    showSkeletons();
    const { products, lastDoc } = await fetchProducts({
        category:    state.activeCategory !== 'all' ? state.activeCategory : null,
        subcategory: state.activeSubcategory,
        sort:        state.sort,
        pageSize:    PAGE_SIZE,
    });
    state.results  = products;
    state.lastDoc  = lastDoc;
    renderGrid();
}

loadAndRender();
```

### Step 5.2 — Get image download URLs
In `renderCard()` replace `product.image` with a helper:

```javascript
// firebase.js already exports this:
// getProductImageURL(productId, filename) → download URL

// In renderCard, use the first image:
const imageURL = await getProductImageURL(product.id, product.images[0]);
```

Or store full download URLs in Firestore on upload (simpler option — the upload script can store the full URL directly).

---

## PHASE 6 — Cloud Functions (Paystack Webhook)
**Goal:** Handle Paystack payment confirmation server-side.

### Step 6.1 — Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
firebase init functions    # choose JavaScript, enable ESLint
```

### Step 6.2 — Create the Paystack webhook function
`functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const crypto    = require('crypto');

admin.initializeApp();

exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
    // 1. Verify signature
    const secret    = functions.config().paystack.secret;
    const hash      = crypto.createHmac('sha512', secret)
                            .update(JSON.stringify(req.body))
                            .digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
        return res.status(400).send('Invalid signature');
    }

    // 2. Only handle successful charges
    if (req.body.event !== 'charge.success') return res.sendStatus(200);

    const data = req.body.data;

    // 3. Find the pending order by Paystack reference
    const snap = await admin.firestore()
        .collection('orders')
        .where('reference', '==', data.reference)
        .limit(1)
        .get();

    if (snap.empty) return res.status(404).send('Order not found');

    // 4. Update order status to paid
    await snap.docs[0].ref.update({
        status:         'paid',
        paystackStatus: data.status,
        updatedAt:      admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.sendStatus(200);
});
```

### Step 6.3 — Set Paystack secret key in Firebase config
```bash
firebase functions:config:set paystack.secret="YOUR_PAYSTACK_SECRET_KEY"
```

### Step 6.4 — Deploy Cloud Functions
```bash
firebase deploy --only functions
```

### Step 6.5 — Register the webhook URL with Paystack
1. Paystack Dashboard → Settings → API Keys & Webhooks
2. Paste your Cloud Function URL:
   `https://REGION-PROJECT_ID.cloudfunctions.net/paystackWebhook`

---

## PHASE 7 — Go Production Checklist

- [ ] Firebase config keys are **NOT** in any public GitHub repo
- [ ] Firestore Security Rules deployed and tested
- [ ] Storage Security Rules deployed and tested
- [ ] All 100 product images uploaded and verified in Storage
- [ ] All Firestore product documents verified with correct fields
- [ ] `collection.js` reads from Firestore (not local array)
- [ ] `product.html` fetches single product from Firestore
- [ ] Cart reads/writes to Firestore `/carts/{userId}`
- [ ] Paystack webhook URL registered and verified
- [ ] Cloud Function `paystackWebhook` deployed
- [ ] Firestore indexes created for category + sort field queries
- [ ] Firebase App Check enabled (blocks API abuse)
- [ ] Custom domain connected (if applicable)
- [ ] Google Analytics / Firebase Analytics enabled

---

## Firestore Index Requirements
Firestore requires composite indexes for multi-field queries.
Create these in Firebase Console → Firestore → Indexes:

| Collection | Field 1 | Field 2 | Order |
|---|---|---|---|
| products | category (ASC) | createdAt (DESC) | — |
| products | category (ASC) | popular (DESC) | — |
| products | category (ASC) | price (ASC) | — |
| products | subcategory (ASC) | createdAt (DESC) | — |
| orders | userId (ASC) | createdAt (DESC) | — |

---

## Estimated Timeline

| Phase | Estimated Time |
|---|---|
| Phase 1 — Firebase setup | 30 mins |
| Phase 2–3 — Schema + Rules | 1 hour |
| Phase 4 — Image upload (100 images) | 2–3 hours (prep + run) |
| Phase 5 — Frontend integration | 2–3 hours |
| Phase 6 — Cloud Functions | 2 hours |
| Phase 7 — Testing + checklist | 1–2 hours |
| **Total** | **~1–1.5 working days** |
