# Chutti.com — AI Budget Trip Planner

**You give the budget. We plan the entire journey.**

Full-stack travel planning web app featuring an Apple-inspired crystal **Liquid Glass** UI (Light + Dark mode), **30 curated Indian destinations** with category filters, **CodeFusionAI** trip generation, **Google + Email/Password authentication**, saved trips, profile management, and bookings — powered by **Python FastAPI** + **SQLite**.

---

## Features
- **Apple Liquid Glass UI**: Transparent frosted glass cards, floating capsule navigation, floating search pill, 3-column Bento showcase, and Light/Dark theme toggle.
- **30 Curated Destinations**: Manali, Shimla, Ladakh, Mathura, Goa, Kashmir, Rishikesh, Darjeeling, Uttarakhand, Jaipur, Udaipur, Kerala, Varanasi, Agra, Spiti Valley, Andaman, Coorg, Ooty, Munnar, Gangtok, Meghalaya, Jaisalmer, Jodhpur, Hampi, Pondicherry, Amritsar, Kedarnath, Nainital, Mussoorie, and Kodaikanal — with search, category filters, sights, local food, tips, and AI Q&A.
- **CodeFusionAI Trip Planning**: Generates complete day-by-day itineraries, transport/hotel/food/activity budget breakdowns, natural-language plan modifications, and multi-turn destination Q&A (with automatic offline smart estimator fallback).
- **Full Authentication & Account Sync**: Email/Password registration & login (PBKDF2-SHA256 + JWT + HttpOnly cookie), Google Login (`Continue with Google`), Edit Profile, Saved Trips, and Confirmed Bookings.
- **Production Hardened**: GZip compression, security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`), rate limiting, SEO `robots.txt` & `sitemap.xml`, Open Graph social preview tags, Docker, and Render/Railway deployment configs.

---

## Quick Launch (Local)

```bash
chmod +x start.sh
./start.sh
```

Or directly:
```bash
.venv/bin/python server.py
```

Open **http://localhost:8000** in your browser.

---

## Deploy to Production

### Option 1: Render (1-Click Blueprint)
1. Push this folder to GitHub (`.env` and `data/` are excluded by `.gitignore`).
2. In [Render](https://render.com), click **New → Blueprint** and select your repo (`render.yaml` is preconfigured).
3. Add your `GEMINI_API_KEY` (and optional `GOOGLE_CLIENT_ID`) in the Render Environment tab and deploy.

### Option 2: Railway / Fly.io
- `Procfile` and `Dockerfile` are both ready out of the box.
- Set environment variables: `GEMINI_API_KEY`, `JWT_SECRET`, `COOKIE_SECURE=true`, and optional `GOOGLE_CLIENT_ID`.

### Option 3: Docker
```bash
docker build -t chutti-com .
docker run -p 8000:8000 --env-file .env -e COOKIE_SECURE=false chutti-com
```

---

## Run Tests

```bash
.venv/bin/python -m unittest test_api.py -v
```
