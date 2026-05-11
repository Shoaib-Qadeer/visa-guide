# Visa Guide

A Next.js 14 app (App Router) that will guide users step-by-step through their visa process. Built to deploy on a **DigitalOcean droplet** (Ubuntu + Node.js + PM2 + Nginx), with **Google Auth** and **Supabase** (free tier) for auth + database.

This is the foundation: **Google sign-in**, a **dashboard layout**, a **live countdown timer** to **Aug 15** (per-user expiry stored in Supabase). The visa-walkthrough features will be layered on top.

---

## Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- Supabase (`@supabase/ssr` + `@supabase/supabase-js`) — auth + Postgres
- Hosted on a DigitalOcean droplet (Ubuntu 22.04 LTS) behind Nginx, managed by PM2

---

## 1. Install

```bash
npm install
```

## 2. Set up Supabase (free tier)

1. Go to https://app.supabase.com → **New project** (free tier is fine).
2. Once provisioned, open **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**.
   - This creates a `profiles` table, RLS policies, and a trigger that auto-creates a profile row with `access_expires_at = 2026-08-15T23:59:59Z` whenever a new user signs up.

## 3. Enable Google OAuth in Supabase

1. In Supabase: **Authentication → Providers → Google → Enable**.
2. You'll need a Google OAuth Client ID + Secret. Get them from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - **Create credentials → OAuth client ID → Web application**.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://YOUR-VERCEL-DOMAIN.vercel.app`
   - **Authorized redirect URIs** — paste the **Callback URL (for OAuth)** that Supabase shows on the Google provider page (it looks like `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`).
3. Paste the Client ID + Secret back into Supabase → Save.
4. In Supabase: **Authentication → URL Configuration**, set:
   - **Site URL**: `http://localhost:3000` (dev) or your Vercel URL (prod).
   - **Redirect URLs**: add both `http://localhost:3000/auth/callback` and `https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback`.

## 4. Local env

Copy the example and fill in the values from step 2:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ACCESS_EXPIRES_AT=2026-08-15T23:59:59Z
```

## 5. Run

```bash
npm run dev
```

Open http://localhost:3000 → click **Continue with Google**.

---

## Deploy to a DigitalOcean droplet

Target: a fresh **Ubuntu 22.04 LTS** droplet with a domain pointing to it (A record → droplet IP). The flow below puts the app behind **Nginx** with a free **Let's Encrypt** cert, kept alive by **PM2**.

### A. One-time droplet setup (as `root` or a sudo user)

```bash
# 1. Update + install basics
sudo apt update && sudo apt -y upgrade
sudo apt -y install curl git ufw nginx

# 2. Node.js 22 LTS (NodeSource) + PM2
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt -y install nodejs
sudo npm i -g pm2

# 3. Firewall: allow SSH + HTTP + HTTPS only
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 4. Create an app user (optional but recommended)
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG sudo deploy
sudo mkdir -p /var/www/visa-guide
sudo chown -R deploy:deploy /var/www/visa-guide
```

### B. Get the code onto the server

As the `deploy` user:

```bash
cd /var/www
git clone https://github.com/YOUR-ORG/visa-guide.git
cd visa-guide
cp .env.example .env.local      # then edit it with real Supabase values + your domain
npm ci
npm run build
```

`.env.local` on the server should look like:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
NEXT_PUBLIC_SITE_URL=https://visa-guide.example.com
NEXT_PUBLIC_ACCESS_EXPIRES_AT=2026-08-15T23:59:59Z
PORT=3000
```

### C. Run with PM2

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup        # run the command it prints (so PM2 restarts on reboot)
```

Verify locally on the droplet:

```bash
curl -I http://127.0.0.1:3000   # should return HTTP/1.1 200 or 307
```

### D. Put Nginx in front

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/visa-guide
sudo sed -i 's/visa-guide.example.com/YOUR-REAL-DOMAIN/g' /etc/nginx/sites-available/visa-guide
sudo ln -s /etc/nginx/sites-available/visa-guide /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### E. SSL with Let's Encrypt

```bash
sudo apt -y install certbot python3-certbot-nginx
sudo certbot --nginx -d visa-guide.example.com
```

Certbot rewrites the Nginx file to add HTTPS + an HTTP→HTTPS redirect, and sets up auto-renewal (`systemctl status certbot.timer`).

### F. Wire the production URL into Supabase + Google

Once HTTPS is live at `https://visa-guide.example.com`:

1. **Supabase → Authentication → URL Configuration**
   - Site URL: `https://visa-guide.example.com`
   - Redirect URLs: add `https://visa-guide.example.com/auth/callback`
2. **Google Cloud Console → OAuth client**
   - Authorized JavaScript origins: add `https://visa-guide.example.com`
   - Authorized redirect URIs: confirm the Supabase callback `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback` is still listed.

### G. Future deploys

After the first setup, deploys are just:

```bash
cd /var/www/visa-guide
./deploy/deploy.sh
```

That script `git pull`s, `npm ci`s, builds, and reloads PM2 with zero-downtime.

### Alt path: Docker

A `Dockerfile` is included if you'd rather run it as a container (e.g. with `docker compose` behind the same Nginx). Build with:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  --build-arg NEXT_PUBLIC_SITE_URL=https://visa-guide.example.com \
  --build-arg NEXT_PUBLIC_ACCESS_EXPIRES_AT=2026-08-15T23:59:59Z \
  -t visa-guide .

docker run -d --restart unless-stopped -p 3000:3000 --name visa-guide visa-guide
```

---

## How the access expiry works

- Default expiry is **Aug 15, 2026 23:59:59 UTC**, configurable via `NEXT_PUBLIC_ACCESS_EXPIRES_AT`.
- On signup, a Postgres trigger (`handle_new_user`) writes the same expiry into `profiles.access_expires_at` for that user.
- The dashboard prefers the per-user value from the DB and falls back to the env config — so we can later let users have different expiries.
- The countdown component (`src/components/dashboard/countdown-timer.tsx`) ticks every second on the client.

> Currently the timer is **display-only** — it does not lock users out. To enforce the expiry on the server, gate `dashboard/*` in `src/middleware.ts` or `src/app/dashboard/layout.tsx` by comparing `profiles.access_expires_at` to `now()`. Easy to add when you want it.

---

## Project structure

```
src/
  app/
    auth/
      callback/route.ts        OAuth code exchange
      signout/route.ts         POST -> sign out
    dashboard/
      layout.tsx               Sidebar + topbar shell (auth-guarded)
      page.tsx                 Overview + countdown
      steps/, documents/, timeline/, settings/
    login/
      page.tsx                 Marketing-style login
      login-card.tsx           Google sign-in button (client)
    layout.tsx
    page.tsx                   Redirects -> /dashboard or /login
    globals.css
  components/dashboard/
    sidebar.tsx
    topbar.tsx
    countdown-timer.tsx
    placeholder.tsx
  lib/
    config.ts                  ACCESS_EXPIRES_AT, getSiteUrl()
    supabase/
      client.ts                Browser client
      server.ts                Server client
      middleware.ts            Session refresh
  middleware.ts
supabase/
  schema.sql                   Run this in Supabase SQL editor
deploy/
  nginx.conf.example           Nginx site config for the droplet
  deploy.sh                    Pull -> build -> reload PM2
ecosystem.config.cjs           PM2 process definition
Dockerfile                     Optional containerized build
```
