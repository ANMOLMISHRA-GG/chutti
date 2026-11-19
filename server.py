"""Chutti.com Python FastAPI Backend — Trip Planner, Gemini 3.8 Flash AI, Auth & Bookings."""
import os
import re
import secrets
import time
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from pydantic import BaseModel, Field

load_dotenv()

import auth  # noqa: E402
import database as db  # noqa: E402
import gemini_service as gemini  # noqa: E402
from destinations_data import DESTINATIONS  # noqa: E402
from estimator import build_fallback_plan, estimate, find_dest  # noqa: E402
from scenes import hero_svg, scene_svg  # noqa: E402

BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"
PORT = int(os.getenv("PORT", "8000"))
RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_MIN", "15"))
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").strip().lower() in ("1", "true", "yes")

app = FastAPI(title="Chutti.com API", version="2.0.0")
app.add_middleware(GZipMiddleware, minimum_size=500)


@app.middleware("http")
async def _security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    return response


db.init_db()

# ---------- Rate Limiter & Plan Cache ----------
_rate_hits: dict[str, list[float]] = {}
_plan_cache: dict[str, tuple[float, dict]] = {}
CACHE_TTL_SEC = 3600


def _check_rate_limit(req: Request) -> None:
    ip = req.client.host if req.client else "local"
    now = time.time()
    recent = [t for t in _rate_hits.get(ip, []) if now - t < 60.0]
    recent.append(now)
    _rate_hits[ip] = recent
    if len(_rate_hits) > 5000:
        _rate_hits.clear()
    if len(recent) > RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Too many AI requests. Please wait a minute and try again.")


def _cache_get(key: str) -> dict | None:
    entry = _plan_cache.get(key)
    if entry and (time.time() - entry[0]) < CACHE_TTL_SEC:
        return entry[1]
    _plan_cache.pop(key, None)
    return None


def _cache_set(key: str, value: dict) -> None:
    if len(_plan_cache) > 300:
        oldest = next(iter(_plan_cache))
        _plan_cache.pop(oldest, None)
    _plan_cache[key] = (time.time(), value)


def _clean_text(s: Any, max_len: int = 120) -> str:
    txt = re.sub(r"[\x00-\x1f\x7f<>{}`]", " ", str(s if s is not None else ""))
    return re.sub(r"\s+", " ", txt).strip()[:max_len]


def _public_dest(d: dict) -> dict:
    return {
        "slug": d["slug"],
        "name": d["name"],
        "state": d["state"],
        "category": d.get("category", "Explore"),
        "tagline": d["tagline"],
        "blurb": d["blurb"],
        "bestTime": d["bestTime"],
        "ideal": d["ideal"],
        "dailyCost": d["cost"]["hotel"] + d["cost"]["food"] + d["cost"]["local"] + d["cost"]["act"],
        "reach": d["cost"]["reach"],
        "reachMode": d["reachMode"],
        "reachDuration": d["reachDuration"],
        "places": d["places"],
        "foods": d["foods"],
        "tips": d["tips"],
    }


def _parse_plan_params(destination: Any, budget: Any, days: Any = 0, travelers: Any = 1, origin: Any = "Delhi", style: Any = "auto", when: Any = "Anytime") -> dict:
    dest = _clean_text(destination, 60)
    if not dest:
        raise HTTPException(status_code=400, detail="Please enter a destination.")
    try:
        b_num = round(float(re.sub(r"[^0-9.]", "", str(budget or 0)) or 0))
    except ValueError:
        b_num = 0
    if b_num < 1000:
        raise HTTPException(status_code=400, detail="Budget must be at least ₹1,000.")
    if b_num > 10_000_000:
        raise HTTPException(status_code=400, detail="Budget is too large.")
    d_num = 0
    if days not in (None, "", 0, "0"):
        try:
            d_num = round(float(days))
        except ValueError:
            raise HTTPException(status_code=400, detail="Days must be a valid number.")
        if d_num < 1 or d_num > 14:
            raise HTTPException(status_code=400, detail="Days must be between 1 and 14.")
    try:
        t_num = round(float(travelers or 1))
    except ValueError:
        t_num = 1
    if t_num < 1 or t_num > 10:
        raise HTTPException(status_code=400, detail="Travellers must be between 1 and 10.")
    st = style if style in ("budget", "comfort", "auto") else "auto"
    return {
        "destination": dest,
        "budget": b_num,
        "days": d_num,
        "travelers": t_num,
        "origin": _clean_text(origin, 40) or "Delhi",
        "style": st,
        "when": _clean_text(when, 40) or "Anytime",
    }


# ---------- Request Models ----------
class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(min_length=4, max_length=120)
    password: str = Field(min_length=6, max_length=128)
    homeCity: str = Field(default="Delhi", max_length=40)


class LoginIn(BaseModel):
    email: str
    password: str


class GoogleLoginIn(BaseModel):
    credential: str | None = None
    email: str | None = None
    name: str | None = None
    picture: str | None = None
    homeCity: str | None = "Delhi"


class ProfileUpdateIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    homeCity: str = Field(default="Delhi", max_length=40)


class PlanRequestIn(BaseModel):
    destination: str
    budget: Any
    days: Any = 0
    travelers: Any = 1
    origin: str = "Delhi"
    style: str = "auto"
    when: str = "Anytime"


class ModifyPlanIn(BaseModel):
    plan: dict
    instruction: str = Field(min_length=3, max_length=300)


class AskIn(BaseModel):
    destination: str
    question: str
    previousInteractionId: str | None = None


class SaveTripIn(BaseModel):
    plan: dict
    when: str = "Anytime"


class BookingIn(BaseModel):
    plan: dict
    travelDate: str = Field(min_length=4, max_length=30)
    contactPhone: str = Field(default="", max_length=20)
    notes: str = Field(default="", max_length=400)


class ContactIn(BaseModel):
    name: str
    email: str
    message: str


# ---------- Auth Routes ----------
def _set_auth_cookie(resp: Response, token: str) -> None:
    resp.set_cookie(
        key="chutti_token",
        value=token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/",
    )


@app.post("/api/auth/register")
def api_register(body: RegisterIn, response: Response):
    name = _clean_text(body.name, 80)
    email = body.email.strip().lower()
    if not name or not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise HTTPException(status_code=400, detail="Please enter a valid name and email address.")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if db.get_user_by_email(email):
        raise HTTPException(status_code=409, detail="An account with this email already exists. Please log in.")
    user = db.create_user(name, email, auth.hash_password(body.password), _clean_text(body.homeCity, 40) or "Delhi")
    token = auth.create_access_token(user)
    _set_auth_cookie(response, token)
    return {"user": user, "token": token}


@app.post("/api/auth/login")
def api_login(body: LoginIn, response: Response):
    email = body.email.strip().lower()
    user_row = db.get_user_by_email(email)
    if not user_row or not auth.verify_password(body.password, user_row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    user = {
        "id": user_row["id"],
        "name": user_row["name"],
        "email": user_row["email"],
        "home_city": user_row["home_city"],
        "auth_provider": user_row["auth_provider"] if "auth_provider" in user_row.keys() else "local",
        "picture_url": user_row["picture_url"] if "picture_url" in user_row.keys() else "",
        "created_at": user_row["created_at"],
    }
    token = auth.create_access_token(user)
    _set_auth_cookie(response, token)
    return {"user": user, "token": token}


@app.get("/api/auth/config")
def api_auth_config():
    return {
        "googleClientId": os.getenv("GOOGLE_CLIENT_ID", "").strip(),
    }


@app.post("/api/auth/google")
def api_google_login(body: GoogleLoginIn, response: Response):
    email = None
    name = None
    picture = ""
    google_id = ""

    # 1. If Google ID token credential provided, verify it
    if body.credential:
        credential = body.credential.strip()
        client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip() or None
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                audience=client_id,
            )
            email = idinfo.get("email")
            name = idinfo.get("name") or idinfo.get("given_name")
            picture = idinfo.get("picture", "")
            google_id = idinfo.get("sub", "")
        except Exception:
            try:
                import httpx
                resp = httpx.get(
                    f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}",
                    timeout=6.0,
                )
                if resp.status_code == 200:
                    info = resp.json()
                    email = info.get("email")
                    name = info.get("name") or info.get("given_name")
                    picture = info.get("picture", "")
                    google_id = info.get("sub", "")
            except Exception:
                pass

        if not email and not body.email:
            raise HTTPException(status_code=401, detail="Google verification failed or token expired.")

    # 2. Direct details (for dev / demo / 1-click Google sign in)
    if not email and body.email:
        email = body.email.strip().lower()
        name = (body.name or email.split("@")[0].title()).strip()
        picture = body.picture or ""

    if not email or not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise HTTPException(status_code=400, detail="Invalid Google account email address.")

    user = db.get_or_create_google_user(
        email=email,
        name=name or email.split("@")[0].title(),
        picture_url=picture,
        google_id=google_id,
        home_city=_clean_text(body.homeCity, 40) or "Delhi",
    )
    token = auth.create_access_token(user)
    _set_auth_cookie(response, token)
    return {"user": user, "token": token}


@app.post("/api/auth/logout")
def api_logout(response: Response):
    response.delete_cookie("chutti_token", path="/")
    return {"ok": True}


@app.get("/api/auth/me")
def api_me(user: dict | None = Depends(auth.get_optional_user)):
    return {"user": user}


@app.put("/api/auth/me")
def api_update_me(body: ProfileUpdateIn, user: dict = Depends(auth.get_current_user)):
    updated = db.update_user_profile(user["id"], _clean_text(body.name, 80), _clean_text(body.homeCity, 40) or "Delhi")
    return {"user": updated}


# ---------- Core Travel & Gemini AI Routes ----------
@app.get("/api/health")
def api_health():
    return {
        "ok": True,
        "backend": "python-fastapi",
        "ai": gemini.is_configured(),
        "model": gemini.current_model(),
    }


@app.get("/api/destinations")
def api_destinations():
    return {"destinations": [_public_dest(d) for d in DESTINATIONS]}


@app.get("/api/estimate")
def api_estimate(destination: str = "", budget: str = "", days: str = "", travelers: str = "1"):
    params = _parse_plan_params(destination, budget, days=days, travelers=travelers)
    return estimate(params)


@app.post("/api/plan")
def api_plan(body: PlanRequestIn, req: Request):
    params = _parse_plan_params(
        body.destination, body.budget, body.days, body.travelers, body.origin, body.style, body.when
    )
    cache_key = repr(sorted(params.items())).lower()
    cached = _cache_get(cache_key)
    if cached:
        return {"plan": cached, "cached": True}

    if not gemini.is_configured():
        fallback = build_fallback_plan(
            params,
            "CodeFusionAI is in offline estimate mode because GEMINI_API_KEY is not configured in .env yet.",
        )
        fallback["when"] = params["when"]
        return {"plan": fallback}

    _check_rate_limit(req)
    try:
        plan = gemini.generate_plan(params)
        _cache_set(cache_key, plan)
        return {"plan": plan}
    except Exception as exc:
        msg = str(exc)
        hint = "CodeFusionAI is temporarily unavailable."
        if "API_KEY" in msg.upper() or "403" in msg or "401" in msg:
            hint = "The CodeFusionAI API key looks invalid or unauthorized."
        elif "429" in msg or "QUOTA" in msg.upper():
            hint = "CodeFusionAI API quota is currently exhausted."
        fallback = build_fallback_plan(params, f"{hint} Showing a smart budget estimate instead.")
        fallback["when"] = params["when"]
        return {"plan": fallback}


@app.post("/api/plan/modify")
def api_modify_plan(body: ModifyPlanIn, req: Request):
    instruction = _clean_text(body.instruction, 300)
    if len(instruction) < 3:
        raise HTTPException(status_code=400, detail="Describe what you want to change in your trip plan.")
    if not gemini.is_configured():
        raise HTTPException(status_code=503, detail="Add GEMINI_API_KEY in .env to modify plans with CodeFusionAI.")
    _check_rate_limit(req)
    try:
        updated = gemini.modify_plan(body.plan, instruction)
        return {"plan": updated}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"CodeFusionAI could not modify the plan: {exc}")


@app.post("/api/ask")
def api_ask(body: AskIn, req: Request):
    dest = _clean_text(body.destination, 60)
    q = _clean_text(body.question, 300)
    if not dest or not q:
        raise HTTPException(status_code=400, detail="Ask a question about a destination.")
    if not gemini.is_configured():
        raise HTTPException(status_code=503, detail="AI is not switched on yet. Add GEMINI_API_KEY to .env.")
    _check_rate_limit(req)
    try:
        return gemini.ask_destination(dest, q, body.previousInteractionId)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"CodeFusionAI could not answer right now: {exc}")


# ---------- Saved Trips & Bookings (Authenticated, SQLite) ----------
@app.get("/api/trips")
def api_list_trips(user: dict = Depends(auth.get_current_user)):
    return {"trips": db.list_trips(user["id"])}


@app.post("/api/trips")
def api_save_trip(body: SaveTripIn, user: dict = Depends(auth.get_current_user)):
    if not isinstance(body.plan, dict) or not body.plan.get("destination"):
        raise HTTPException(status_code=400, detail="Invalid trip plan payload.")
    saved = db.save_trip(user["id"], body.plan, _clean_text(body.when, 40) or "Anytime")
    return {"trip": saved}


@app.delete("/api/trips/{trip_id}")
def api_delete_trip(trip_id: int, user: dict = Depends(auth.get_current_user)):
    ok = db.delete_trip(user["id"], trip_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Trip not found.")
    return {"ok": True}


@app.get("/api/bookings")
def api_list_bookings(user: dict = Depends(auth.get_current_user)):
    return {"bookings": db.list_bookings(user["id"])}


@app.post("/api/bookings")
def api_create_booking(body: BookingIn, user: dict = Depends(auth.get_current_user)):
    if not isinstance(body.plan, dict) or not body.plan.get("destination"):
        raise HTTPException(status_code=400, detail="Invalid trip plan.")
    ref = "CH-" + secrets.token_hex(3).upper()
    booking = db.create_booking(
        user_id=user["id"],
        booking_ref=ref,
        plan=body.plan,
        travel_date=_clean_text(body.travelDate, 30),
        contact_phone=_clean_text(body.contactPhone, 20),
        notes=_clean_text(body.notes, 400),
    )
    return {"booking": booking}


@app.post("/api/contact")
def api_contact(body: ContactIn, user: dict | None = Depends(auth.get_optional_user)):
    name = _clean_text(body.name, 80)
    email = body.email.strip()
    message = _clean_text(body.message, 1500)
    if not name or not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email) or len(message) < 5:
        raise HTTPException(status_code=400, detail="Fill in name, a valid email, and a message.")
    db.save_contact_message(name, email, message, user["id"] if user else None)
    return {"ok": True}


# ---------- Images & Static Frontend ----------
def _serve_image(base_path: Path, svg_fallback) -> Response:
    for ext, mime in ((".jpg", "image/jpeg"), (".jpeg", "image/jpeg"), (".png", "image/png"), (".webp", "image/webp")):
        candidate = Path(str(base_path) + ext)
        if candidate.is_file():
            return FileResponse(candidate, media_type=mime, headers={"Cache-Control": "public, max-age=300, must-revalidate"})
    return Response(content=svg_fallback(), media_type="image/svg+xml", headers={"Cache-Control": "no-store"})


@app.get("/img/hero")
def serve_hero():
    return _serve_image(PUBLIC_DIR / "img" / "hero", hero_svg)


@app.get("/img/dest/{slug}")
def serve_dest_img(slug: str):
    clean_slug = re.sub(r"\.(jpg|jpeg|png|webp)$", "", slug.lower())
    if not re.match(r"^[a-z0-9-]+$", clean_slug):
        raise HTTPException(status_code=404, detail="Not found")
    d = find_dest(clean_slug) or find_dest(clean_slug.replace("-", " "))
    resolved = d["slug"] if d else clean_slug
    return _serve_image(PUBLIC_DIR / "img" / "dest" / resolved, lambda: scene_svg(resolved))


@app.get("/robots.txt", response_class=PlainTextResponse)
def serve_robots(request: Request):
    base = str(request.base_url).rstrip("/")
    return f"User-agent: *\nAllow: /\nSitemap: {base}/sitemap.xml\n"


@app.get("/sitemap.xml")
def serve_sitemap(request: Request):
    base = str(request.base_url).rstrip("/")
    urls = [f"{base}/", f"{base}/#/destinations", f"{base}/#/about", f"{base}/#/contact"]
    urls.extend(f"{base}/#/destination/{d['slug']}" for d in DESTINATIONS)
    items = "".join(f"<url><loc>{u}</loc></url>" for u in urls)
    xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{items}</urlset>'
    return Response(content=xml, media_type="application/xml", headers={"Cache-Control": "public, max-age=3600"})


@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    if full_path.startswith("api/"):
        return JSONResponse({"detail": "Not found"}, status_code=404)
    rel = full_path.strip("/") or "index.html"
    target = (PUBLIC_DIR / rel).resolve()
    if not str(target).startswith(str(PUBLIC_DIR.resolve())):
        raise HTTPException(status_code=403, detail="Forbidden")
    if target.is_file():
        return FileResponse(target, headers={"Cache-Control": "no-cache"})
    if "." not in Path(rel).name:
        return FileResponse(PUBLIC_DIR / "index.html", headers={"Cache-Control": "no-cache"})
    raise HTTPException(status_code=404, detail="Not found")


if __name__ == "__main__":
    import uvicorn

    print(f"chutti.com Python FastAPI server starting on http://localhost:{PORT}")
    print(
        f"Gemini AI: ON ({gemini.current_model()})"
        if gemini.is_configured()
        else "Gemini AI: OFF (add GEMINI_API_KEY to .env for live AI plans; smart estimator active)"
    )
    uvicorn.run("server:app", host="0.0.0.0", port=PORT, reload=False)

