import 'dotenv/config';
import { readFileSync } from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!SERVICE_ACCOUNT_PATH) {
  console.error('Missing FIREBASE_SERVICE_ACCOUNT in .env');
  process.exit(1);
}

const FEATURE_DESCRIPTIONS = {
  ENTER_GAME_ZONE: 'Access game zone and join public challenges automatically.',
  GAME_ZONE_ENTRY: 'Access game zone and join public challenges automatically.',
  PRIVATE_CHALLENGE_CREATE: 'Create a private challenge in game zone.',
  PRIVATE_CHALLENGE_JOIN: 'Join an existing private challenge room.',
  PUBLIC_COMPETITION: 'Enable competition participation in game zone.',
  PRIVATE_COMPETITION: 'Create private room by adding invite-only requirements.',
  GOLD_MEDAL: 'Highest reward medal.',
  SILVER_MEDAL: 'Medium reward medal.',
  BRONZE_MEDAL: 'Basic reward medal.',
};

const DEFAULT_FEATURES = [
  { id: 'GAME_ZONE_ENTRY', category: 'ENTRY', cost: 100, usage: 0, requirements: [] },
  { id: 'PRIVATE_CHALLENGE_CREATE', category: 'PRIVATE CHALLENGE', cost: 450, usage: 0, requirements: ['none'] },
  { id: 'PRIVATE_CHALLENGE_JOIN', category: 'PRIVATE CHALLENGE', cost: 200, usage: 0, requirements: ['none'] },
  { id: 'PUBLIC_COMPETITION', category: 'COMPETITION', cost: 0, usage: 0, requirements: ['none'] },
  { id: 'PRIVATE_COMPETITION', category: 'COMPETITION', cost: 175, usage: 0, requirements: ['GOLD_MEDAL', 'SILVER_MEDAL'] },
  { id: 'GOLD_MEDAL', category: 'MEDAL', cost: 100, usage: 0, requirements: ['none'] },
  { id: 'SILVER_MEDAL', category: 'MEDAL', cost: 50, usage: 0, requirements: ['none'] },
  { id: 'BRONZE_MEDAL', category: 'MEDAL', cost: 25, usage: 0, requirements: ['none'] },
];

function initFirebaseAdmin() {
  if (getApps().length > 0) return;
  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  initializeApp({ credential: cert(serviceAccount) });
}

async function run() {
  initFirebaseAdmin();
  const db = getFirestore();
  const snap = await db.collection('game_features').get();

  if (snap.empty) {
    console.log('No game_features docs found. Creating defaults...');
    for (const f of DEFAULT_FEATURES) {
      await db.collection('game_features').doc(f.id).set({
        feature_id: f.id,
        name: f.id.replace(/_/g, ' ').trim(),
        category: f.category,
        cost: f.cost,
        usage: f.usage,
        requirements: f.requirements,
        active: true,
        description: FEATURE_DESCRIPTIONS[f.id] || '',
      }, { merge: true });
      console.log(`Created ${f.id}`);
    }
    console.log(`Done. Created ${DEFAULT_FEATURES.length} default features with descriptions.`);
    return;
  }

  let updated = 0;
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const key = data.feature_id || docSnap.id;
    const description = FEATURE_DESCRIPTIONS[key];
    if (!description) continue;

    await docSnap.ref.set({ description }, { merge: true });
    updated += 1;
    console.log(`Updated ${docSnap.id}`);
  }

  console.log(`Done. Updated ${updated} feature descriptions.`);
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
