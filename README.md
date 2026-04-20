# HackMate — Complete Setup Guide
### Hackathon Team Finder for Indian Students

---

## What's included

| Feature | Status |
|---|---|
| Landing page | ✅ |
| Email signup / login | ✅ |
| Google OAuth login | ✅ |
| 4-step profile setup | ✅ |
| Browse & filter teammates | ✅ |
| Send / receive invites | ✅ |
| Accept / reject invites | ✅ |
| Full profile page | ✅ |
| Dashboard with stats | ✅ |
| Hackathon listings | ✅ |
| Edit profile | ✅ |
| Mobile responsive | ✅ |
| Dark theme | ✅ |

---

## STEP 1 — Create a Supabase project (free, no credit card)

1. Go to **https://supabase.com** → Sign up (free)
2. Click **"New project"**
3. Give it a name: `hackmate`
4. Set a strong database password (save it somewhere)
5. Choose region: **Southeast Asia (Singapore)** — fastest for India
6. Wait ~2 minutes for it to provision

---

## STEP 2 — Run the database schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file `supabase_schema.sql` from this project
4. Copy the entire contents and paste into the SQL editor
5. Click **"Run"** (green button)
6. You should see "Success. No rows returned"

This creates all tables, security rules, triggers, and sample hackathon data.

---

## STEP 3 — Enable Google OAuth (optional but recommended)

1. In Supabase → go to **Authentication → Providers**
2. Find **Google** → toggle it ON
3. Go to **https://console.cloud.google.com**
4. Create a new project → go to **APIs & Services → Credentials**
5. Click **"Create Credentials" → OAuth 2.0 Client ID**
6. Application type: **Web application**
7. Add Authorized redirect URI:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
   (get this URL from Supabase → Auth → Providers → Google)
8. Copy the **Client ID** and **Client Secret** into Supabase → Google provider settings
9. Save

---

## STEP 4 — Get your Supabase keys

1. In Supabase → go to **Settings → API**
2. Copy:
   - **Project URL** → looks like `https://abcxyz.supabase.co`
   - **anon public key** → long string starting with `eyJ...`

---

## STEP 5 — Set up the project locally

```bash
# 1. Install Node.js (if not installed)
# Download from: https://nodejs.org (LTS version)

# 2. Go into the project folder
cd hackmate

# 3. Install dependencies
npm install

# 4. Create your .env file
cp .env.example .env
```

Now open `.env` and fill in your keys:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

```bash
# 5. Run locally
npm run dev
```

Open **http://localhost:5173** — your app is running! 🎉

---

## STEP 6 — Deploy to Vercel (free, forever)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel (creates free account if needed)
vercel login

# 3. Deploy!
vercel

# Answer the prompts:
# - Set up and deploy? → Y
# - Which scope? → your username
# - Link to existing project? → N
# - Project name? → hackmate
# - Directory? → ./ (press Enter)
# - Override build settings? → N

# 4. Add your environment variables on Vercel:
vercel env add VITE_SUPABASE_URL
# (paste your Supabase URL, press Enter)

vercel env add VITE_SUPABASE_ANON_KEY
# (paste your anon key, press Enter)

# 5. Deploy to production
vercel --prod
```

Your app is now live at something like: **https://hackmate-yourname.vercel.app** 🚀

---

## STEP 7 — Update Google OAuth redirect URL (if using Google login)

After deploying, go back to:
1. Supabase → Auth → Providers → Google
2. Add your Vercel URL to **"Site URL"**: `https://hackmate-yourname.vercel.app`
3. Google Cloud Console → OAuth credentials → Add to Authorized redirect URIs:
   ```
   https://hackmate-yourname.vercel.app
   ```

---

## Common errors & fixes

| Error | Fix |
|---|---|
| "Missing Supabase environment variables" | Check your `.env` file — no spaces around `=` |
| "Invalid API key" | Double-check you copied the `anon public` key, not the service key |
| Google login not working | Make sure redirect URIs are added in both Supabase and Google Console |
| Blank page after deploy | Make sure Vercel env vars are set and you ran `vercel --prod` again after adding them |
| "relation does not exist" | You forgot to run `supabase_schema.sql` in the SQL editor |

---

## Project structure

```
hackmate/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx         ← Top navigation
│   │   └── StudentCard.jsx    ← Reusable student card + invite modal
│   ├── hooks/
│   │   └── useAuth.jsx        ← Auth context (user + profile state)
│   ├── lib/
│   │   └── supabase.js        ← Supabase client
│   ├── pages/
│   │   ├── Landing.jsx        ← Home page (not logged in)
│   │   ├── Login.jsx          ← Email + Google login
│   │   ├── Register.jsx       ← Signup page
│   │   ├── SetupProfile.jsx   ← 4-step onboarding
│   │   ├── Dashboard.jsx      ← Home after login
│   │   ├── Browse.jsx         ← Browse + filter students
│   │   ├── Profile.jsx        ← View any profile
│   │   ├── Invites.jsx        ← Sent/received invites
│   │   ├── Hackathons.jsx     ← Hackathon listings
│   │   └── EditProfile.jsx    ← Edit your profile
│   ├── App.jsx                ← Routes + auth guards
│   ├── main.jsx               ← Entry point
│   └── index.css              ← Global design system
├── supabase_schema.sql        ← Run this in Supabase SQL Editor
├── vercel.json                ← Vercel routing config
├── .env.example               ← Copy to .env and fill in keys
└── package.json
```

---

## Adding more hackathons

In Supabase → go to **Table Editor → hackathons** → Insert row.
Fill in: name, organizer, dates, mode, prize_pool, tags, website_url.

---

## Built with

- **React 18** + **Vite** — frontend
- **Supabase** — database, auth, real-time
- **React Router v6** — routing
- **react-hot-toast** — notifications
- **Vercel** — hosting (free tier)
