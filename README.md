## 24digi CRM – Production Architecture

React-based CRM that talks directly to Firebase (Auth + Firestore). In production it is a **frontend-only** app deployed to **AWS S3 + CloudFront**. No custom backend, Elastic Beanstalk environment, MongoDB, or RecoveryAI is required for the current CRM features.

### Production architecture

- **Hosting**: Static build (`dist/`) deployed to **AWS S3** and served via **CloudFront**.
- **Routing**: React Router (BrowserRouter) with S3/CloudFront configured to fall back to `index.html` for SPA routes.
- **Data & Auth**: All authentication and data access go **directly to Firebase** from the browser:
  - Firebase Authentication (Email/Password).
  - Firestore (read/write collections for CRM data).
- **No backend dependency**:
  - The Node/Elastic Beanstalk backend and MongoDB are **not used** by the live CRM UI.
  - RecoveryAI integration is present in the repo but **not yet called** from the current frontend.

### Frontend-only features

- **Login / Logout**
  - Implemented via Firebase Auth using the config in `src/firebase/config.js`.
- **Dashboard & CRM views**
  - Reads/writes Firestore collections (e.g. users, products, challenge collections) directly from the browser.
- **Products & 24diet module**
  - Product catalog and related views powered by Firestore collections.
- **Challenge / 24 Challenge**
  - Lists challenge-related Firestore collections directly (no backend).
- **Edit image, Excel upload, Add document**
  - All implemented by calling Firestore from the frontend; no custom API.

### Backend-dependent features (future)

The repository contains a Node backend (`server/`) and RecoveryAI integration, but:

- The React frontend **does not currently call**:
  - Any `/recovery/*` or other Node routes.
  - Any RecoveryAI FastAPI endpoints.
- You can deploy and evolve the backend independently; it is **not required** for the existing CRM screens to function in production.

### Firebase configuration (local & production)

The frontend uses Vite env variables, read via `import.meta.env` in `src/firebase/config.js`:

```js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
```

**Required environment variables (local and CI/CD):**

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

For **local development** (`npm run dev`):

- Create a `.env` file in the repo root based on `.env.example` and fill in the above values from your Firebase project.

For **GitHub Actions / production builds**:

- Define the same keys as **GitHub Actions repository secrets**.
- The workflow `.github/workflows/deploy.yml` passes them into `npm run build` as:

```yaml
env:
  VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
  VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
  VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
  VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
  VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
  VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
```

### Local development

```bash
npm install
npm run dev
```

Make sure:

1. `.env` contains the Firebase variables above.
2. Firebase Authentication (Email/Password) is enabled in the Firebase Console.

### Firestore security rules (example)

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### AWS S3 + CloudFront deployment

1. **Build the app:**

   ```bash
   npm install
   npm run build
   ```

2. **Upload to S3 (manually or via CI/CD):**

   ```bash
   aws s3 sync dist/ s3://<your-s3-bucket-name> --delete
   ```

3. **Configure S3 static website hosting:**
   - Index document: `index.html`
   - Error document: `index.html` (so SPA routes fall back to the app).

4. **Configure CloudFront:**
   - Origin: your S3 website endpoint.
   - Default behavior: cache and serve the SPA.
   - Optional: custom error responses mapping 403/404 to `/index.html` to support deep links.

5. **Automated deploys (GitHub Actions):**
   - The workflow `.github/workflows/deploy.yml`:
     - Installs dependencies.
     - Runs `npm run build`.
     - Syncs `dist/` to the S3 bucket using `aws s3 sync`.
     - Optionally invalidates CloudFront if `CLOUDFRONT_DISTRIBUTION_ID` is set.

### Optional: Mongo migration and backend

The repo includes:

- A MongoDB → Firestore migration script (`scripts/migrate-mongo-to-firebase.js`) that uses `MONGODB_URI`.
- A Node backend under `server/` with RecoveryAI integration.

These are **not required** for the live CRM frontend deployed to S3 + CloudFront, but are available if you later choose to add custom APIs or background services.
