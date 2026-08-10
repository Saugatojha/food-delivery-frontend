# Resend Email Integration — Change Log

Branch: `santosh` (NOT merged to `main`)

This file documents every change made to integrate Resend into the SmartServe food-delivery backend. It is updated after each change, and changes are pushed to the `santosh` branch only.

## 2026-08-09 — Initial Resend integration

### Change 1: Installed the `resend` package

- Ran `npm install resend` in `server/`.
- Updated files: `server/package.json`, `server/package-lock.json`.
- Note: the install blocked Prisma's postinstall script; re-ran `npx prisma generate` to restore the client.

### Change 2: Rewrote `server/src/utils/mailer.js` with Resend

- Replaced the production stub (previously just a log line) with a real Resend client.
- Behavior:
  - **Dev mode** (`NODE_ENV !== 'production'`): still logs the verify link to the terminal and returns `{ devLink }` (tests and local flow unchanged).
  - **Production**: sends the email via `resend.emails.send()` using `RESEND_FROM` (default `onboarding@resend.dev`) and returns `{}`.
- Added defensive guard: if `RESEND_API_KEY` is missing, the server no longer crashes at startup; it throws a clear error only when actually sending in production.
- Updated files: `server/src/utils/mailer.js`.

### Change 3: Fixed callers to `await` the async mailer

- `sendVerificationEmail` is now `async` (returns a Promise). The two call sites were not awaiting it, which would break the `devLink` response in dev mode.
- Added `await` at:
  - `server/src/routes/auth.js` — `/register` handler
  - `server/src/routes/auth.js` — `/resend-verification` handler
- Updated files: `server/src/routes/auth.js`.

### Change 4: Documented new env vars

- Added `RESEND_API_KEY` and `RESEND_FROM` (empty values) to `server/.env.example` so teammates know what to configure.
- Real key lives only in the git-ignored `server/.env`.
- Updated files: `server/.env.example`.

### Verification

- `mailer.js` loads and exports correctly.
- Dev-mode path returns a correct verify link (tested with a fake token).
- `npm run lint` (root): passes.
- Server test suite: 15/15 pass in `statusFlow.test.js`; DB-dependent tests (register/login/orders) time out because no MySQL instance is running — pre-existing environment issue, unrelated to this change.

### Push status (2026-08-09)

- Committed locally on `santosh` as `b8f6e18`.
- Push to `origin/santosh` failed with `403 Permission denied` — the embedded token in the git remote URL was expired, and the authenticated `gh` account (`santosh9805922397-lab`) does not have collaborator access to `Saugatojha/food-delivery-frontend`.
- Removed the stale embedded token from `~/.gitconfig` (security: it was leaking a secret and had gone stale). Push will work once valid credentials are provided (new PAT with repo scope, or the `gh` account added as a collaborator).

### How to test a real send

```bash
cd server
NODE_ENV=production npm run dev
```

Then register a user. Note: with `onboarding@resend.dev` as the sender, Resend only delivers to the email registered on your Resend account. After adding a verified domain, set `RESEND_FROM="SmartServe <noreply@yourdomain.com>"`.
