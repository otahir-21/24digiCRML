# 24 Digi CRM / Dashboard (monorepo)

This repository contains the **Next.js admin dashboard** at the repo root (`npm run dev`), plus legacy Firebase/Vite CRM sources under `src/` (Vite entry `src/main.jsx`), backend code under `server/`, and AI services under `AiModels/`.

## Next.js dashboard (primary app at root)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). See [Next.js documentation](https://nextjs.org/docs) for deployment options.

---

## Legacy Vite + Firebase CRM

The following describes the older static SPA that builds to `dist/` for S3 + CloudFront.

### Production architecture (Vite CRM)

- **Hosting**: Static build (`dist/`) deployed to **AWS S3** and served via **CloudFront**.
- **Routing**: React Router (BrowserRouter) with S3/CloudFront configured to fall back to `index.html` for SPA routes.
- **Data & Auth**: Firebase Authentication and Firestore from the browser (`src/firebase/config.js`).

### Firebase configuration (Vite)

The Vite app uses `import.meta.env` variables (see `src/firebase/config.js`):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

For GitHub Actions, configure these as repository secrets. The workflow `.github/workflows/deploy.yml` passes them into the build.

### AWS S3 + CloudFront (Vite build)

1. Build: `npm run build` (when using the Vite setup; outputs `dist/`).
2. Sync: `aws s3 sync dist/ s3://<bucket> --delete`

### Optional: Mongo migration and backend

- Migration script: `npm run migrate:mongo` (requires `scripts/migrate-mongo-to-firebase.js` and env).
- Node API: `server/` (Elastic Beanstalk workflow: `.github/workflows/deploy-api-eb.yml`).

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
