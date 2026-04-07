import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const SECONDARY_APP_NAME = 'EmployeeCreator';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
};

function validateFirebaseConfig(config) {
  const missing = [];

  if (!config.apiKey) missing.push('VITE_FIREBASE_API_KEY');
  if (!config.authDomain) missing.push('VITE_FIREBASE_AUTH_DOMAIN');
  if (!config.projectId) missing.push('VITE_FIREBASE_PROJECT_ID');
  if (!config.storageBucket) missing.push('VITE_FIREBASE_STORAGE_BUCKET');
  if (!config.messagingSenderId) missing.push('VITE_FIREBASE_MESSAGING_SENDER_ID');
  if (!config.appId) missing.push('VITE_FIREBASE_APP_ID');

  if (missing.length > 0) {
    // Clear, explicit error to make S3/production issues obvious
    // eslint-disable-next-line no-console
    console.error(
      'Firebase: Missing required environment variables:',
      missing.join(', '),
      '. Make sure they are set in your .env (for local) and in GitHub Secrets (for CI).',
    );
  }
}

validateFirebaseConfig(firebaseConfig);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

/** Secondary Firebase app for createUserWithout signing out the admin (same project config). */
function getSecondaryApp() {
  if (!getApps().some((a) => a.name === SECONDARY_APP_NAME)) {
    return initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  }
  return getApp(SECONDARY_APP_NAME);
}

export function getSecondaryAuth() {
  return getAuth(getSecondaryApp());
}
