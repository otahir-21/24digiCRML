# Fitness API (Flutter backend)

Separate from **RecoveryAI**. FastAPI service: Firebase ID token auth, Firestore for profile/goals, OpenAI for coaching (same prompts as the Streamlit `fitness agent`).

## Run locally

```bash
cd AiModels/FitnessApi
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill OPENAI_API_KEY + FIREBASE_CREDENTIALS_JSON
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

- Health: `GET http://localhost:8001/health`
- Protected routes: `Authorization: Bearer <Firebase ID token>`

### Postman / test without Firebase (optional)

Set env **`FITNESS_API_TEST_BEARER`** to a long random string (e.g. `openssl rand -hex 32`). Then send:

`Authorization: Bearer <that exact string>`

The API treats you as user uid **`FITNESS_API_TEST_UID`** (default `postman_test_user`). `GET /health` includes **`test_bearer_auth_enabled`** when this is on.

**Production:** set **`FITNESS_API_ENV=production`** on App Runner. Test bearer is **disabled** even if `FITNESS_API_TEST_BEARER` is still set. Prefer **deleting** `FITNESS_API_TEST_BEARER` and `FITNESS_API_TEST_UID` in production.

## Production checklist (App Runner + Flutter)

1. **App Runner → Configuration → Environment variables**
   - **`FITNESS_API_ENV`** = `production`
   - **Remove** `FITNESS_API_TEST_BEARER` and `FITNESS_API_TEST_UID` (or leave them; production mode ignores test auth).
   - Keep **`OPENAI_API_KEY`**, **`FIREBASE_CREDENTIALS_JSON`**, optional **`OPENAI_MODEL`**.
2. **Secrets:** Prefer **AWS Secrets Manager** or **SSM Parameter Store** for keys (reference from App Runner + instance role) instead of plain text when your org requires it.
3. **`GET /health`** should show `"environment": "production"` and **`test_bearer_auth_enabled`: false**.
4. **Flutter:** base URL = production App Runner URL; every API call: `Authorization: Bearer` + `FirebaseAuth.instance.currentUser!.getIdToken()` (refresh when expired).
5. **Firebase:** same project as the app; Firestore rules should restrict user data as needed (backend uses Admin SDK and bypasses client rules — design paths so only that service account is trusted).
6. **Optional:** custom domain + HTTPS on App Runner, **WAF**, **Observability** (CloudWatch), auto scaling min/max, **CORS** hardening (currently `*` — tighten to your app origins if you expose a web client).

## Firestore

Documents: `fitness_backend/{firebase_uid}` with fields `profile`, `goals`, `updated_at`.

Enable Firestore in the same Firebase project as the app; the service account needs Firestore read/write.

## Deploy (AWS App Runner + ECR)

1. Create ECR repository e.g. `fitness-ai-backend`.
2. Add GitHub secret `FITNESSAI_ECR_REPOSITORY` (repository name only).
3. Push to `main` — workflow `.github/workflows/deploy-fitnessai.yml` builds from `AiModels/FitnessApi` and pushes `:SHA`.
4. New App Runner service: image from that ECR repo, port **8000**, health check path **`/health`**.
5. Environment variables: `OPENAI_API_KEY`, `FIREBASE_CREDENTIALS_JSON`, **`FITNESS_API_ENV=production`** when live. Optional: `FITNESS_API_TEST_BEARER` for staging/Postman only.

Flutter: base URL = App Runner URL, send `Authorization: Bearer` from `getIdToken()`.
