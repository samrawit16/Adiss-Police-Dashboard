# Adiss Road Police Dashboard

Next.js dashboard for police operators. It reads everything from `Adiss_road_backend`
(reports and events sent by the mobile app).

## Run

```bash
npm install
npm run dev          # http://localhost:3100  (backend expected at http://127.0.0.1:8001)
```

Set `BACKEND_URL` if the backend runs elsewhere.

## Signing in

- Only admin accounts can sign in (`DEFAULT_ADMIN_EMAIL` / `ADMIN_EMAILS` in the backend `.env`).
- The session is kept in memory only. Opening the link, reloading, typing the address again
  or opening a new tab always asks for the email and password. It also signs out after
  30 minutes without activity.

## Real data, not mock data

- The dashboard shows what citizens submit from the app: reports (with photo and road/place),
  and speed events.
- The backend only adds fictional sample data if `SEED_DEMO_DATA=true`. It is off by default.
  If sample rows exist, a yellow banner explains it, rows are tagged SAMPLE, and
  "Remove sample data" deletes only those rows (real reports are never touched).
