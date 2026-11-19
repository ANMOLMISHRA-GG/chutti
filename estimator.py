"""Offline cost estimator & fallback plan builder.
Ported from lib/estimator.js — same logic, same numbers.
"""
import math
from destinations_data import DESTINATIONS

GENERIC = {
    "slug": None, "name": "", "state": "", "scene": "generic",
    "tagline": "", "aliases": [], "bestTime": "Check the season before you go",
    "ideal": 4,
    "cost": {"hotel": 1500, "food": 450, "local": 400, "act": 500, "reach": 1500},
    "reachMode": "Train / Bus", "reachDuration": "varies",
    "places": [], "foods": [], "tips": [],
}

STYLE_MULT = {
    "budget": {"hotel": 1, "food": 1},
    "comfort": {"hotel": 1.6, "food": 1.3},
}


def round10(n):
    return round(n / 10) * 10


def clamp(n, a, b):
    return min(b, max(a, n))


def find_dest(name):
    n = str(name or "").strip().lower()
    if not n:
        return None
    for d in DESTINATIONS:
        if d["slug"] == n or d["name"].lower() == n:
            return d
    for d in DESTINATIONS:
        if n in d["aliases"]:
            return d
    for d in DESTINATIONS:
        if n in d["name"].lower() or any(n in a for a in d["aliases"]):
            return d
    return None


def profile_for(name):
    d = find_dest(name)
    if d:
        return d
    return {**GENERIC, "name": str(name or "").strip()}


def cost_for(p, days, travelers, style):
    s = STYLE_MULT.get(style, STYLE_MULT["budget"])
    nights = max(days - 1, 0)
    rooms = math.ceil(travelers / 2)
    hotel = round10(nights * p["cost"]["hotel"] * rooms * s["hotel"])
    food = round10(days * p["cost"]["food"] * travelers * s["food"])
    reach = round10(travelers * p["cost"]["reach"] * 2)
    local = round10(days * p["cost"]["local"] * rooms)
    activities = round10(days * p["cost"]["act"] * travelers)
    total = hotel + food + reach + local + activities
    return {
        "hotel": hotel, "food": food, "travel": reach + local,
        "reach": reach, "local": local, "activities": activities,
        "total": total,
    }


def fit(p, budget, travelers, wanted_days, wanted_style):
    max_days = max(p["ideal"], 3)
    style = "comfort" if wanted_style == "comfort" else "budget"

    if wanted_days:
        days = clamp(round(wanted_days), 1, 14)
    else:
        days = 2
        for d in range(max_days, 1, -1):
            if cost_for(p, d, travelers, "budget")["total"] <= budget * 0.97:
                days = d
                break

    if wanted_style == "auto" or not wanted_style:
        c = cost_for(p, days, travelers, "comfort")
        style = "comfort" if c["total"] <= budget * 0.97 and days >= min(p["ideal"], 3) else "budget"

    return {"days": days, "style": style}


def minimum_budget(p, travelers):
    return cost_for(p, 2, travelers, "budget")["total"]


def estimate(params):
    p = profile_for(params["destination"])
    travelers = clamp(int(params.get("travelers") or 1), 1, 10)
    budget = params["budget"]
    wanted_days = int(params["days"]) if params.get("days") else 0
    f = fit(p, budget, travelers, wanted_days, params.get("style"))
    days = f["days"]
    style = f["style"]
    c = cost_for(p, days, travelers, style)

    return {
        "destination": p["name"] or params["destination"],
        "slug": p["slug"],
        "known": bool(p["slug"]),
        "days": days,
        "nights": max(days - 1, 0),
        "travelers": travelers,
        "style": style,
        "breakdown": {
            "hotel": c["hotel"], "food": c["food"],
            "travel": c["travel"], "activities": c["activities"],
        },
        "parts": {"reach": c["reach"], "local": c["local"]},
        "total": c["total"],
        "leftover": max(budget - c["total"], 0),
        "withinBudget": c["total"] <= budget,
        "minimumBudget": minimum_budget(p, travelers),
        "mainTransport": p["reachMode"],
        "reachDuration": p["reachDuration"],
    }


def build_itinerary(p, days, dest):
    places = p["places"] if p["places"] else []
    out = []
    pi = [0]  # mutable counter

    def next_place():
        if not places:
            return None
        r = places[pi[0] % len(places)]
        pi[0] += 1
        return r

    for d in range(1, days + 1):
        items = []
        if d == 1:
            items.append({
                "time": "Morning",
                "title": f"Travel to {dest}",
                "detail": f"{p['reachMode'] or 'Train / Bus'}, about {p['reachDuration'] or 'check timings'}. Then check in and rest.",
                "cost": 0,
            })
            a = next_place()
            items.append({
                "time": "Evening",
                "title": a["name"] if a else f"Explore {dest}",
                "detail": a["desc"] if a else "Short walk around your hotel and a local dinner.",
                "cost": 0,
            })
        elif d == days and days > 1:
            a = next_place()
            items.append({
                "time": "Morning",
                "title": a["name"] if a else f"Last look at {dest}",
                "detail": a["desc"] if a else "Local breakfast and some shopping.",
                "cost": 0,
            })
            items.append({
                "time": "Afternoon",
                "title": "Check out and return journey",
                "detail": f"Head back by {p['reachMode'] or 'train / bus'}.",
                "cost": 0,
            })
        else:
            a = next_place()
            b = next_place()
            items.append({
                "time": "Morning",
                "title": a["name"] if a else f"Explore {dest}",
                "detail": a["desc"] if a else "Visit the main sights with a local guide or auto.",
                "cost": 0,
            })
            items.append({
                "time": "Afternoon",
                "title": b["name"] if b else "Local food walk",
                "detail": b["desc"] if b else "Lunch at a well-reviewed local place.",
                "cost": 0,
            })
            items.append({
                "time": "Evening",
                "title": "Free time",
                "detail": "Local market and dinner.",
                "cost": 0,
            })

        title = "Arrival" if d == 1 else ("Return" if d == days and days > 1 else f"Explore {dest}")
        out.append({"day": d, "title": title, "items": items})

    return out


def _guess_mode(s):
    s = str(s or "").lower()
    if "flight" in s:
        return "flight"
    if "train" in s:
        return "train"
    if "bus" in s:
        return "bus"
    return "cab"


def build_fallback_plan(params, notice=None):
    p = profile_for(params["destination"])
    e = estimate(params)
    dest = e["destination"] or params["destination"]
    hotel_night = round(p["cost"]["hotel"] * (STYLE_MULT["comfort"]["hotel"] if e["style"] == "comfort" else 1) / 10) * 10

    plan = {
        "source": "estimate",
        "destination": dest, "slug": e["slug"],
        "title": f"{dest} Trip",
        "tagline": p["tagline"] or "",
        "summary": f"A {e['days']}-day {dest} trip for {e['travelers']} {'people' if e['travelers'] > 1 else 'person'} using typical prices. This is a basic estimate, not a full AI plan.",
        "days": e["days"], "nights": e["nights"], "travelers": e["travelers"],
        "origin": params.get("origin") or "Delhi", "budget": params["budget"], "style": e["style"],
        "breakdown": [
            {"key": "hotel", "label": f"Hotel ({e['nights']} {'Night' if e['nights'] == 1 else 'Nights'})", "amount": e["breakdown"]["hotel"], "note": f"About ₹{hotel_night:,} per room per night"},
            {"key": "food", "label": "Food", "amount": e["breakdown"]["food"], "note": "Local meals and cafes"},
            {"key": "travel", "label": f"Travel ({e['mainTransport']})", "amount": e["breakdown"]["travel"], "note": "Round trip + local transport"},
            {"key": "activities", "label": "Activities", "amount": e["breakdown"]["activities"], "note": "Entry fees and adventure"},
        ],
        "total": e["total"], "leftover": e["leftover"],
        "withinBudget": e["withinBudget"], "minimumBudget": e["minimumBudget"],
        "transport": [{
            "mode": _guess_mode(e["mainTransport"]),
            "title": f"{params.get('origin') or 'Delhi'} → {dest}",
            "duration": p["reachDuration"],
            "cost": p["cost"]["reach"],
            "note": "One way, per person. Prices change. Check live fares.",
            "recommended": True,
        }],
        "hotels": [{
            "name": f"Budget stay in {dest}",
            "area": "Near the main market",
            "type": "3-star" if e["style"] == "comfort" else "Hostel / homestay",
            "pricePerNight": hotel_night,
            "note": "Per room per night",
        }],
        "food": [{"name": f, "what": "Local favourite", "cost": round(p["cost"]["food"] / 3 / 10) * 10} for f in (p.get("foods") or [])[:4]],
        "itinerary": build_itinerary(p, e["days"], dest),
        "tips": p.get("tips") or [],
        "packing": [],
        "bestTime": p["bestTime"],
        "warnings": [],
    }

    if not e["withinBudget"]:
        plan["warnings"].append(f"This budget is too low. A basic 2-day trip needs about ₹{e['minimumBudget']:,}.")
    if not e["known"]:
        plan["warnings"].append("This place is not in our built-in list, so these numbers are generic guesses.")
    if notice:
        plan["notice"] = notice

    return plan
