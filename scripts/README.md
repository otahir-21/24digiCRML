# MongoDB → Firebase Migration

Migrates data from MongoDB Atlas to Firebase Firestore.

## Image URLs

**No action needed.** Your product images stay on AWS S3. The script only copies the image URL strings to Firestore. Images will continue to load from your existing URLs.

## Setup

1. Get your **MongoDB connection string** from Atlas:
   - Atlas → Connect → Connect your application → Copy URI
   - Example: `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/24digi`

2. Ensure your **Firebase service account** file exists:
   - `kivi-d10da-firebase-adminsdk-fbsvc-73cb3f831a.json` (in project root)

## Run

```bash
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/24digi" npm run migrate:mongo
```

Or with custom service account path:

```bash
MONGODB_URI="mongodb+srv://..." FIREBASE_SERVICE_ACCOUNT=/path/to/serviceAccount.json npm run migrate:mongo
```

## Collections Migrated

| MongoDB | Firebase |
|---------|----------|
| products | 24diet_products |
| productaddons | 24diet_productaddons |
| productcategories | 24diet_productcategories |
| ingredients | 24diet_ingredients |
| mealcomponenttemplates | 24diet_mealcomponenttemplates |

## Add to CRM

After migration, add these collections to `src/constants.js` in `DIET_COLLECTIONS` to show them in the CRM:

```js
'24diet_products',
'24diet_productaddons',
// etc.
```
