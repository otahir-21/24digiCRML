/**
 * Migrate MongoDB data to Firebase Firestore
 * 
 * Usage:
 *   1. Paste MONGODB_URI in .env file, then: npm run migrate:mongo
 *   2. Or: MONGODB_URI="mongodb+srv://..." npm run migrate:mongo
 * 
 * Image URLs: Stored as-is. Images stay on AWS S3 - no need to copy files.
 */

import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Config
const MONGODB_URI = process.env.MONGODB_URI;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT 
  || join(__dirname, '..', 'kivi-d10da-firebase-adminsdk-fbsvc-73cb3f831a.json');

// Collections to migrate: MongoDB collection -> Firestore collection
const COLLECTIONS_TO_MIGRATE = [
  { mongo: 'products', firestore: '24diet_products' },
  { mongo: 'productaddons', firestore: '24diet_productaddons' },
  { mongo: 'productcategories', firestore: '24diet_productcategories' },
  { mongo: 'ingredients', firestore: '24diet_ingredients' },
  { mongo: 'mealcomponenttemplates', firestore: '24diet_mealcomponenttemplates' },
];

function convertForFirestore(doc) {
  const converted = { ...doc };
  
  // Remove MongoDB-specific fields
  delete converted.__v;
  
  // Convert _id to string (Firestore doc ID)
  if (converted._id) {
    converted._id = converted._id.toString();
  }
  
  // Convert MongoDB Date to ISO string (Firestore accepts strings)
  if (converted.createdAt instanceof Date) {
    converted.createdAt = converted.createdAt.toISOString();
  }
  if (converted.updatedAt instanceof Date) {
    converted.updatedAt = converted.updatedAt.toISOString();
  }
  
  // Image URL stays as string - no change needed
  // Arrays and objects are supported by Firestore
  
  return converted;
}

async function migrateCollection(mongoDb, firestore, { mongo: mongoCol, firestore: firestoreCol }) {
  const mongoCollection = mongoDb.collection(mongoCol);
  const count = await mongoCollection.countDocuments();
  
  if (count === 0) {
    console.log(`  ⏭️  ${mongoCol}: empty, skipping`);
    return 0;
  }

  const docs = await mongoCollection.find({}).toArray();
  const firestoreRef = firestore.collection(firestoreCol);
  
  const batchSize = 400;
  let migrated = 0;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = firestore.batch();
    const chunk = docs.slice(i, i + batchSize);

    for (const doc of chunk) {
      const converted = convertForFirestore(doc);
      // Use productId for products (meaningful ID), else _id. Firestore IDs must be strings.
      const docId = String(converted.productId || converted._id || doc._id?.toString() || `doc_${migrated}`);
      delete converted._id;
      const docRef = firestoreRef.doc(docId);
      batch.set(docRef, converted);
      migrated++;
    }

    await batch.commit();
    console.log(`  📤 ${mongoCol} → ${firestoreCol}: ${migrated}/${docs.length}`);
  }

  return migrated;
}

async function main() {
  if (!MONGODB_URI || MONGODB_URI.includes('cluster.mongodb.net')) {
    console.error('❌ Invalid or placeholder MONGODB_URI in .env');
    console.error('');
    console.error('   Get your real connection string from MongoDB Atlas:');
    console.error('   1. Atlas → Connect → Connect your application');
    console.error('   2. Copy the URI (it looks like: mongodb+srv://user:pass@cluster0.XXXXX.mongodb.net/24digi)');
    console.error('   3. Replace user/password with your DB user credentials');
    console.error('   4. Paste in .env as: MONGODB_URI=mongodb+srv://...');
    process.exit(1);
  }

  console.log('🔄 MongoDB → Firebase Migration\n');

  // Init Firebase
  const serviceAccount = JSON.parse(readFileSync(FIREBASE_SERVICE_ACCOUNT, 'utf8'));
  initializeApp({ credential: cert(serviceAccount) });
  const firestore = getFirestore();

  // Connect MongoDB
  const mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  const mongoDb = mongoClient.db();

  try {
    let total = 0;
    for (const mapping of COLLECTIONS_TO_MIGRATE) {
      try {
        const count = await migrateCollection(mongoDb, firestore, mapping);
        total += count;
      } catch (err) {
        console.error(`  ❌ ${mapping.mongo}: ${err.message}`);
      }
    }
    console.log(`\n✅ Done! Migrated ${total} documents.`);
  } finally {
    await mongoClient.close();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  if (err.code === 'ENOTFOUND') {
    console.error('\n   DNS lookup failed. Check:');
    console.error('   - Your connection string has the correct cluster host (e.g. cluster0.xxxxx.mongodb.net)');
    console.error('   - You have internet access');
    console.error('   - Try the standard format: mongodb://host1:27017,host2:27017/24digi');
  }
  process.exit(1);
});
