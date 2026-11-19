"""End-to-end API tests for the Chutti.com Python FastAPI backend."""
import os
import tempfile
import unittest
from unittest.mock import patch

# Use an isolated temporary SQLite DB for tests so user data is untouched
_tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp_db.close()

import database as db  # noqa: E402

db.DB_PATH = _tmp_db.name
db.init_db()

from fastapi.testclient import TestClient  # noqa: E402
import server  # noqa: E402


class ChuttiBackendTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(server.app)

    @classmethod
    def tearDownClass(cls):
        try:
            os.unlink(_tmp_db.name)
        except OSError:
            pass

    def test_health_and_static_pages(self):
        r = self.client.get("/api/health")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertTrue(data["ok"])
        self.assertEqual(data["backend"], "python-fastapi")
        self.assertEqual(data["model"], "gemini-3.8-flash")

        home = self.client.get("/")
        self.assertEqual(home.status_code, 200)
        self.assertIn("Chutti.com", home.text)
        self.assertEqual(home.headers.get("x-content-type-options"), "nosniff")
        self.assertEqual(home.headers.get("x-frame-options"), "SAMEORIGIN")

        robots = self.client.get("/robots.txt")
        self.assertEqual(robots.status_code, 200)
        self.assertIn("Sitemap:", robots.text)

        sitemap = self.client.get("/sitemap.xml")
        self.assertEqual(sitemap.status_code, 200)
        self.assertIn("/#/destination/udaipur", sitemap.text)

        hero = self.client.get("/img/hero")
        self.assertEqual(hero.status_code, 200)

        cfg = self.client.get("/api/auth/config")
        self.assertEqual(cfg.status_code, 200)
        self.assertIn("googleClientId", cfg.json())

    def test_destinations_and_estimate(self):
        r = self.client.get("/api/destinations")
        self.assertEqual(r.status_code, 200)
        dests = r.json()["destinations"]
        self.assertGreaterEqual(len(dests), 30)
        slugs = {d["slug"] for d in dests}
        for expected in ("manali", "udaipur", "kerala", "varanasi", "andaman", "spiti", "kodaikanal"):
            self.assertIn(expected, slugs)
            img_r = self.client.get(f"/img/dest/{expected}")
            self.assertEqual(img_r.status_code, 200)

        est = self.client.get("/api/estimate?destination=Manali&budget=15000")
        self.assertEqual(est.status_code, 200)
        e = est.json()
        self.assertEqual(e["destination"], "Manali")
        self.assertTrue(e["withinBudget"])

        est2 = self.client.get("/api/estimate?destination=Udaipur&budget=12000")
        self.assertEqual(est2.status_code, 200)
        self.assertEqual(est2.json()["destination"], "Udaipur")

    def test_auth_trips_bookings_and_contact(self):
        # Unauthenticated trips rejected
        unauth = self.client.get("/api/trips")
        self.assertEqual(unauth.status_code, 401)

        # Register
        reg = self.client.post(
            "/api/auth/register",
            json={"name": "Anmol Test", "email": "anmol@example.com", "password": "secret123", "homeCity": "Delhi"},
        )
        self.assertEqual(reg.status_code, 200)
        token = reg.json()["token"]
        self.assertEqual(reg.json()["user"]["email"], "anmol@example.com")

        # Duplicate register returns 409
        dup = self.client.post(
            "/api/auth/register",
            json={"name": "Anmol Test", "email": "anmol@example.com", "password": "secret123"},
        )
        self.assertEqual(dup.status_code, 409)

        # Bad login returns 401
        bad = self.client.post("/api/auth/login", json={"email": "anmol@example.com", "password": "wrong"})
        self.assertEqual(bad.status_code, 401)

        # Good login
        login = self.client.post("/api/auth/login", json={"email": "anmol@example.com", "password": "secret123"})
        self.assertEqual(login.status_code, 200)
        headers = {"Authorization": f"Bearer {token}"}

        # Save trip
        plan_res = self.client.post("/api/plan", json={"destination": "Manali", "budget": 15000})
        self.assertEqual(plan_res.status_code, 200)
        plan = plan_res.json()["plan"]

        save_r = self.client.post("/api/trips", json={"plan": plan, "when": "Winter (Oct-Feb)"}, headers=headers)
        self.assertEqual(save_r.status_code, 200)
        trip_id = save_r.json()["trip"]["id"]

        list_r = self.client.get("/api/trips", headers=headers)
        self.assertEqual(list_r.status_code, 200)
        self.assertEqual(len(list_r.json()["trips"]), 1)

        # Book trip
        book_r = self.client.post(
            "/api/bookings",
            json={"plan": plan, "travelDate": "2026-12-20", "contactPhone": "9876543210", "notes": "Window seat"},
            headers=headers,
        )
        self.assertEqual(book_r.status_code, 200)
        self.assertTrue(book_r.json()["booking"]["booking_ref"].startswith("CH-"))

        books = self.client.get("/api/bookings", headers=headers)
        self.assertEqual(len(books.json()["bookings"]), 1)

        # Update profile
        upd = self.client.put("/api/auth/me", json={"name": "Anmol Explorer", "homeCity": "Mumbai"}, headers=headers)
        self.assertEqual(upd.status_code, 200)
        self.assertEqual(upd.json()["user"]["name"], "Anmol Explorer")
        self.assertEqual(upd.json()["user"]["home_city"], "Mumbai")

        # Delete trip
        del_r = self.client.delete(f"/api/trips/{trip_id}", headers=headers)
        self.assertEqual(del_r.status_code, 200)

        # Google login
        g_res = self.client.post(
            "/api/auth/google",
            json={"email": "googleuser@gmail.com", "name": "Google User", "picture": "https://lh3.googleusercontent.com/a/test"},
        )
        self.assertEqual(g_res.status_code, 200)
        self.assertEqual(g_res.json()["user"]["email"], "googleuser@gmail.com")
        self.assertEqual(g_res.json()["user"]["auth_provider"], "google")

        # Contact message
        contact_r = self.client.post(
            "/api/contact",
            json={"name": "Anmol", "email": "anmol@example.com", "message": "Great trip planner!"},
        )
        self.assertEqual(contact_r.status_code, 200)

    def test_gemini_plan_normalization_mocked(self):
        fake_llm_plan = {
            "title": "Manali Snow Escape",
            "tagline": "Mountains within budget",
            "summary": "A crisp 4-day Manali getaway from Delhi.",
            "days": 4,
            "budgetTooLow": False,
            "breakdown": [
                {"key": "hotel", "amount": 4200, "note": "3 nights homestay"},
                {"key": "food", "amount": 2000, "note": "Cafes & dhabas"},
                {"key": "travel", "amount": 3200, "note": "Volvo + local bus"},
                {"key": "activities", "amount": 2500, "note": "Solang + temple"},
            ],
            "transport": [
                {"mode": "bus", "title": "Delhi -> Manali (Volvo AC)", "duration": "12 hrs", "cost": 1200, "note": "Overnight", "recommended": True}
            ],
            "hotels": [{"name": "Snow Crest Homestay", "area": "Old Manali", "type": "homestay", "pricePerNight": 1400, "note": "Cozy rooms"}],
            "food": [{"name": "Siddu", "what": "Steamed Himalayan bun", "cost": 150}],
            "itinerary": [
                {"day": 1, "title": "Reach Manali", "items": [{"time": "Morning", "title": "Check-in", "detail": "Rest and walk Mall Road", "cost": 0}]}
            ],
            "tips": ["Carry warm jacket"],
            "packing": ["Thermals"],
            "bestTime": "Oct-Jun",
        }
        with patch("gemini_service.is_configured", return_value=True), patch(
            "gemini_service._call_interactions_json", return_value=(fake_llm_plan, "gemini-3.8-flash")
        ):
            r = self.client.post("/api/plan", json={"destination": "Manali", "budget": 14000, "when": "Winter"})
            self.assertEqual(r.status_code, 200)
            p = r.json()["plan"]
            self.assertEqual(p["source"], "gemini")
            self.assertEqual(p["total"], 11900)
            self.assertTrue(p["withinBudget"])
            self.assertEqual(len(p["itinerary"]), 4)

    def test_images_and_static_assets(self):
        # Hero images (both with and without extension)
        r_hero = self.client.get("/img/hero")
        self.assertEqual(r_hero.status_code, 200)
        self.assertEqual(r_hero.headers.get("content-type"), "image/jpeg")

        r_hero_jpg = self.client.get("/img/hero.jpg")
        self.assertEqual(r_hero_jpg.status_code, 200)
        self.assertEqual(r_hero_jpg.headers.get("content-type"), "image/jpeg")

        # Destination images
        r_dest = self.client.get("/img/dest/manali.jpg")
        self.assertEqual(r_dest.status_code, 200)
        self.assertEqual(r_dest.headers.get("content-type"), "image/jpeg")

        r_dest_noext = self.client.get("/img/dest/manali")
        self.assertEqual(r_dest_noext.status_code, 200)
        self.assertEqual(r_dest_noext.headers.get("content-type"), "image/jpeg")

        r_gen = self.client.get("/img/dest/generic.jpg")
        self.assertEqual(r_gen.status_code, 200)
        self.assertEqual(r_gen.headers.get("content-type"), "image/jpeg")

        # Static JSON
        r_json = self.client.get("/destinations.json")
        self.assertEqual(r_json.status_code, 200)
        self.assertEqual(len(r_json.json()["destinations"]), 30)


if __name__ == "__main__":
    unittest.main()

