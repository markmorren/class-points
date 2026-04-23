# Class Points — Setup Guide

Follow these steps once to go from this repo to a live deployment at `points.morren.uk`.

---

## 1. Push to GitHub

```
cd ~/Developer/class-points
git init
git add .
git commit -m "Initial build"
```

Create a new private GitHub repo (e.g. `class-points`) and push:

```
git remote add origin git@github.com:<your-username>/class-points.git
git push -u origin main
```

---

## 2. Create the D1 database

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **D1**
2. Click **Create database**
3. Name: `class-points-db`
4. **Jurisdiction: EU** ← important for GDPR / school IT compliance
5. Click **Create**
6. Copy the **Database ID** (looks like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
7. Open `wrangler.toml` and replace `REPLACE_WITH_DATABASE_ID` with the copied ID

---

## 3. Apply the schema

1. In the Cloudflare dashboard, click on `class-points-db` → **Console**
2. Open `schema.sql` from this repo, copy all its contents
3. Paste into the console and click **Execute**
4. You should see a green success message

---

## 4. Create a Cloudflare Pages project

1. Go to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select your `class-points` GitHub repo
3. Build settings:
   - Framework preset: **None**
   - Build command: *(leave blank)*
   - Build output directory: `/` (or leave blank)
4. Click **Save and Deploy**

---

## 5. Add environment variables

In your Pages project → **Settings** → **Environment variables** → **Production**, add:

| Variable | Value |
|---|---|
| `APP_URL` | `https://points.morren.uk` |
| `BREVO_API_KEY` | *(from your Brevo dashboard — see step 7)* |

---

## 6. Bind D1 to your Pages project

1. Pages project → **Settings** → **Functions** → **D1 database bindings**
2. Add binding:
   - Variable name: `DB`
   - D1 database: `class-points-db`
3. Save

Trigger a new deployment (push a commit or click **Retry deployment**) so the binding takes effect.

---

## 7. Set up Brevo (email)

1. Sign up at [brevo.com](https://www.brevo.com) — free tier is 300 emails/day, no card needed
2. Go to **Senders & IPs** → **Senders** → add `noreply@points.morren.uk` as a sender
3. Verify the sender (Brevo will send a verification email)
4. Go to **SMTP & API** → **API Keys** → create a key named `class-points`
5. Copy the key and add it as `BREVO_API_KEY` in Pages environment variables (step 5)

---

## 8. Add the custom domain

1. Pages project → **Custom domains** → **Set up a custom domain**
2. Enter `points.morren.uk`
3. Cloudflare will auto-add the DNS record (since the domain is already on Cloudflare)

---

## 9. Test end-to-end

1. Open `https://points.morren.uk`
2. Enter your email → check for the sign-in link email
3. Click the link → you should land on the Classes screen
4. Create a class, add pupils, award a point, verify the leaderboard updates
5. Click the board icon → `board.html` should open on a second tab and show the leaderboard

---

## Environment variables summary

| Variable | Required | Description |
|---|---|---|
| `APP_URL` | Yes | Full URL with no trailing slash, e.g. `https://points.morren.uk` |
| `BREVO_API_KEY` | Yes | From Brevo dashboard |

---

## GDPR note

Pupil data is stored in D1 with EU jurisdiction (set in step 2). See `gdpr-brief.md` in the iCloud project folder for the full brief, including what to share with school IT and the parent information paragraph.
