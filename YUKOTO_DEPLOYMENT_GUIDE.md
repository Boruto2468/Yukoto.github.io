# Yukoto — Accounts, progress, AI & billing deployment

This is an integration into the existing v3.0.1 app, not a redesign. It retains HSK, Japanese, My Path, Rhiye, local study history and Gemini Live. **Nothing has been deployed.** The frontend is free to host on Cloudflare Pages within its limits; database, Auth, Gemini and billing each have separate limits/terms. Use test billing until end-to-end payment and renewal testing succeeds.

## 0. Local prerequisites

- Node 20+ and npm; a GitHub repository containing this updated source.
- Run from the project root: `npm ci`, `npm run dev`. No new frontend npm dependencies were added.
- The `backend/` directory is a **separate Cloudflare Worker**, NOT part of `src/`.
- Never upload `.env.local`, `.dev.vars`, private keys or Paystack/Gemini secrets to GitHub.

## 1. Cloudflare Pages hosting (manual)

1. In Cloudflare Dashboard > Workers & Pages > Create application > Pages > Connect to Git, select the Yukoto GitHub repository.
2. Set production branch to `main`, framework preset `Vite` (if offered), root directory `/`, build command `npm run build`, output directory `dist`, and Node version >=20.
3. Add *public* build variables `VITE_YUKOTO_API_URL`, `VITE_FIREBASE_API_KEY`, `VITE_GOOGLE_CLIENT_ID` when known; see steps 2 and 3. The first deploy can run without them, but sign-in and cloud AI will be disabled.
4. Cloudflare supplies a free `https://YOUR-PROJECT.pages.dev` site. For a custom domain, use Pages > Custom domains; purchase/own the domain separately. Add the new HTTPS origin (scheme+hostname, no path) to Worker `ALLOWED_ORIGINS` and Google OAuth authorized JavaScript origins.
5. The old `.github/workflows/static.yml` remains to preserve the previous GitHub Pages fallback. Disable it later if you only want Cloudflare Pages deployments.

## 2. Google accounts / Firebase (manual)

1. Create a Firebase project in https://console.firebase.google.com/ and register a Web app; get its **Web API Key** and **Project ID**.
2. Firebase Console > Authentication > Sign-in method > enable **Google**.
3. In that project's Google Cloud Console > APIs & Services > Credentials, create a **Web application OAuth client ID**. Authorize exact origins `http://localhost:5173`, `https://YOUR-PROJECT.pages.dev`, and any custom domain. Ensure the OAuth client is permitted by your Firebase Google provider configuration.
4. In the project root, copy `.env.example` to `.env.local` and fill in the **public** Vite variables. Add the same values as build-time environment variables in Cloudflare Pages, then redeploy.
5. Set `FIREBASE_PROJECT_ID` in `backend/wrangler.jsonc`. Do not confuse project ID with Google client ID.
6. Test `/ #account` (without the space) or the My Profile navbar button. If you get an authorized origin error, fix Google OAuth JS origins, not Firebase security rules.
7. Google profile email and user ID are linked to progress. Firebase ID token signatures and claims are verified server-side; browser-supplied UIDs are ignored.

## 3. Cloudflare D1 + Worker (manual)

From a second terminal:

```bash
cd backend
npm install
npx wrangler login
npx wrangler d1 create yukoto-students
```

Copy the **database_id** displayed by Wrangler into `backend/wrangler.jsonc` (replace placeholder). Also set:

- `ALLOWED_ORIGINS`: comma-separated origin(s), e.g. `http://localhost:5173,https://YOUR-PROJECT.pages.dev`.
- `FIREBASE_PROJECT_ID`: from Firebase (step 2).
- `ADMIN_EMAILS`: your *verified* Google email, to unlock private admin stats. Never use a wildcard.

Run:

```bash
npm run db:remote
npx wrangler secret put GEMINI_API_KEY
npm run deploy
```

The secret prompt must receive a Gemini API key from Google AI Studio. Cloudflare will show a URL like `https://yukoto-live-token.YOUR-SUBDOMAIN.workers.dev`.

Set this **exact Worker base URL** as `VITE_YUKOTO_API_URL` in Cloudflare Pages. Redeploy the frontend. `/api/health` is publicly readable only from an allowed browser origin, which is intentional. The Worker uses a verified account to permit `/api/progress`, `/api/ai/token`, `/api/events`, `/api/admin/stats`, and checkout.

**Important:** if you already deployed an older `yukoto-live-token` Worker, this project extends that Worker and will replace its code on deployment. Export/backup any existing custom changes before deploying. The old `VITE_YUKOTO_TOKEN_URL` setting is superseded by `VITE_YUKOTO_API_URL`.

## 4. AI cost control

- Google sign-in required to start voice sessions.
- Free: 2 session tokens/day, each expires after approximately **3 minutes**.
- Plus: 20/day, approximately **8 minutes** each.
- Usage is metered atomically per verified Firebase user in D1. A failed Gemini token issue releases that reservation.
- The browser also stops its audio session on the returned time limit. Don't sell "unlimited AI"; provider quotas and prices may change.
- Existing AI Mandarin system instruction remains. The paid *personalized correction history* feature is a future enhancement; this release only enforces extended AI voice entitlements.

## 5. Paystack Plus — TEST MODE first (manual)

1. Register/verify a Paystack merchant account (merchant eligibility depends on jurisdiction).
2. In **Paystack Test Mode**, create a monthly recurring subscription plan in NGN (choose actual price) and optionally an annual plan. Copy **plan codes**.
3. Set `PAYSTACK_MONTHLY_PLAN` and optionally `PAYSTACK_YEARLY_PLAN` in `backend/wrangler.jsonc`. These are not secret.
4. Run `cd backend && npx wrangler secret put PAYSTACK_SECRET_KEY`, and enter your **test** secret key (`sk_test_...`). Never use Paystack's public key as a secret.
5. Set the Paystack webhook URL to `https://YOUR-WORKER.workers.dev/api/billing/webhook` and redeploy the Worker.
6. Test: Google login -> free AI limit -> Plus checkout -> Paystack test payment -> webhook -> `/api/me` reports `plus` -> Plus AI limit -> duplicate webhook -> renewal event -> cancellation/expiry. Check Paystack dashboard and D1 records. **Do not go live without testing renewals and cancellation flows.**
7. Only after validation replace the secret and plan codes with LIVE merchant values, redeploy, and perform an inexpensive production verification.

The webhook checks Paystack's HMAC-SHA512 signature over the raw request body, independently verifies payment with Paystack, checks expected plan value/currency, and only then activates Plus. The checkout URL is returned by the Worker. Never store Paystack keys in `VITE_` variables.

**Caution:** cancelling from Paystack's customer/merchant billing controls is distinct from deleting Yukoto cloud learning records. The student UI does not currently implement a self-service subscription cancellation portal. Provide a documented cancellation contact/process before commercial launch.

## 6. Owner analytics and privacy

Open My Profile and click **Open private dashboard** while signed in as an email listed in `ADMIN_EMAILS`. Current dashboard reports registered learners, paid learners, signed-in active learners, completed lessons and AI sessions. Raw AI transcripts/audio are not stored. It does NOT track individual anonymous visitors: add **Cloudflare Web Analytics** separately through its dashboard to count visits/page views, and show learners a privacy disclosure consistent with the analytics and data-processing policy you choose.

Cloud progress is in the existing local `yukoto.hybrid.v1` format and merges both `ja` and `zh`. On a second device, sign in, use My Profile > Sync my progress and reopen My Path after sync to view the latest history. We deliberately retain browser-local learning when account/API is unavailable; occasional sync conflicts retry on the next interval. You should take a D1 backup before introducing major changes to the progress schema.

## 7. Tests and release checks

Run in the root after `npm ci`:

```bash
npm run test:guided
npm run test
npm run build
```

And separately:

```bash
cd backend
npm install
npm test
npx wrangler d1 migrations apply yukoto-students --local
npm run dev
```

Manually test two browsers, account switching, Japanese and Chinese progress, offline study, AI caps, signed-out endpoints, cross-origin denial, and Paystack test webhooks. **Live integrations cannot be verified without your accounts, keys and deployed URLs.**
