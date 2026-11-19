"""SQLite database layer for Chutti.com (users, saved trips, bookings, contact messages)."""
import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if os.environ.get("VERCEL"):
    DATA_DIR = "/tmp/data"
    DB_PATH = "/tmp/data/chutti.db"
else:
    DATA_DIR = os.environ.get("CHUTTI_DATA_DIR") or os.path.join(BASE_DIR, "data")
    DB_PATH = os.environ.get("CHUTTI_DB_PATH") or os.path.join(DATA_DIR, "chutti.db")


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def get_conn():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                home_city TEXT NOT NULL DEFAULT 'Delhi',
                auth_provider TEXT NOT NULL DEFAULT 'local',
                picture_url TEXT NOT NULL DEFAULT '',
                google_id TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS saved_trips (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                destination TEXT NOT NULL,
                slug TEXT,
                title TEXT NOT NULL,
                days INTEGER NOT NULL,
                budget INTEGER NOT NULL,
                total INTEGER NOT NULL,
                within_budget INTEGER NOT NULL DEFAULT 1,
                origin TEXT NOT NULL DEFAULT 'Delhi',
                travelers INTEGER NOT NULL DEFAULT 1,
                style TEXT NOT NULL DEFAULT 'auto',
                when_label TEXT NOT NULL DEFAULT 'Anytime',
                plan_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                booking_ref TEXT NOT NULL UNIQUE,
                user_id INTEGER NOT NULL,
                destination TEXT NOT NULL,
                title TEXT NOT NULL,
                travelers INTEGER NOT NULL DEFAULT 1,
                total_cost INTEGER NOT NULL,
                travel_date TEXT NOT NULL,
                contact_phone TEXT NOT NULL DEFAULT '',
                notes TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'Confirmed',
                plan_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS contact_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
            """
        )
        # Ensure migration columns exist on existing users table
        cols = [c["name"] for c in conn.execute("PRAGMA table_info(users)").fetchall()]
        if "auth_provider" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'local'")
        if "picture_url" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN picture_url TEXT NOT NULL DEFAULT ''")
        if "google_id" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN google_id TEXT NOT NULL DEFAULT ''")


def _format_user(row) -> dict:
    d = dict(row)
    d.pop("password_hash", None)
    d.setdefault("auth_provider", "local")
    d.setdefault("picture_url", "")
    d.setdefault("google_id", "")
    return d


def create_user(
    name: str,
    email: str,
    password_hash: str,
    home_city: str = "Delhi",
    auth_provider: str = "local",
    picture_url: str = "",
    google_id: str = "",
) -> dict:
    now = _utc_now()
    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO users (name, email, password_hash, home_city, auth_provider, picture_url, google_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (name, email.lower().strip(), password_hash, home_city or "Delhi", auth_provider, picture_url or "", google_id or "", now),
        )
        uid = cur.lastrowid
        row = conn.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
    return _format_user(row)


def get_or_create_google_user(
    email: str, 
    name: str,
    picture_url: str = "",
    google_id: str = "",
    home_city: str = "Delhi",
) -> dict:
    now = _utc_now()
    email_clean = email.lower().strip()
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email_clean,)).fetchone()
        if row:
            uid = row["id"]
            updates = []
            vals = []
            if picture_url and not row["picture_url"]:
                updates.append("picture_url = ?")
                vals.append(picture_url)
            if google_id and not row["google_id"]:
                updates.append("google_id = ?")
                vals.append(google_id)
            if updates:
                vals.append(uid)
                conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", vals)
            updated_row = conn.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
            return _format_user(updated_row)

        cur = conn.execute(
            """
            INSERT INTO users (name, email, password_hash, home_city, auth_provider, picture_url, google_id, created_at)
            VALUES (?, ?, ?, ?, 'google', ?, ?, ?)
            """,
            (
                name or email_clean.split("@")[0].title(),
                email_clean,
                "oauth_google_verified",
                home_city or "Delhi",
                picture_url or "",
                google_id or "",
                now,
            ),
        )
        uid = cur.lastrowid
        new_row = conn.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
        return _format_user(new_row)


def get_user_by_email(email: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE email = ?", (email.lower().strip(),)
        ).fetchone()
    return dict(row) if row else None


def get_user_by_id(user_id: int) -> dict | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE id = ?", (user_id,)
        ).fetchone()
    return _format_user(row) if row else None


def update_user_profile(user_id: int, name: str, home_city: str) -> dict | None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE users SET name = ?, home_city = ? WHERE id = ?",
            (name, home_city or "Delhi", user_id),
        )
        row = conn.execute(
            "SELECT * FROM users WHERE id = ?", (user_id,)
        ).fetchone()
    return _format_user(row) if row else None


def save_trip(user_id: int, plan: dict, when_label: str = "Anytime") -> dict:
    now = _utc_now()
    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO saved_trips (
                user_id, destination, slug, title, days, budget, total,
                within_budget, origin, travelers, style, when_label, plan_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                str(plan.get("destination") or ""),
                plan.get("slug"),
                str(plan.get("title") or "Trip Plan"),
                int(plan.get("days") or 3),
                int(plan.get("budget") or 0),
                int(plan.get("total") or 0),
                1 if plan.get("withinBudget", True) else 0,
                str(plan.get("origin") or "Delhi"),
                int(plan.get("travelers") or 1),
                str(plan.get("style") or "auto"),
                str(when_label or "Anytime"),
                json.dumps(plan),
                now,
            ),
        )
        tid = cur.lastrowid
        row = conn.execute("SELECT * FROM saved_trips WHERE id = ?", (tid,)).fetchone()
    return _format_trip(row)


def list_trips(user_id: int) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM saved_trips WHERE user_id = ? ORDER BY id DESC LIMIT 50",
            (user_id,),
        ).fetchall()
    return [_format_trip(r) for r in rows]


def delete_trip(user_id: int, trip_id: int) -> bool:
    with get_conn() as conn:
        cur = conn.execute(
            "DELETE FROM saved_trips WHERE id = ? AND user_id = ?",
            (trip_id, user_id),
        )
        return cur.rowcount > 0


def _format_trip(row) -> dict:
    d = dict(row)
    plan = json.loads(d.pop("plan_json"))
    d["withinBudget"] = bool(d.pop("within_budget"))
    d["when"] = d.pop("when_label", "Anytime")
    d["plan"] = plan
    return d


def create_booking(
    user_id: int,
    booking_ref: str,
    plan: dict,
    travel_date: str,
    contact_phone: str = "",
    notes: str = "",
) -> dict:
    now = _utc_now()
    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO bookings (
                booking_ref, user_id, destination, title, travelers,
                total_cost, travel_date, contact_phone, notes, status, plan_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?, ?)
            """,
            (
                booking_ref,
                user_id,
                str(plan.get("destination") or ""),
                str(plan.get("title") or "Trip Booking"),
                int(plan.get("travelers") or 1),
                int(plan.get("total") or 0),
                travel_date,
                contact_phone,
                notes,
                json.dumps(plan),
                now,
            ),
        )
        bid = cur.lastrowid
        row = conn.execute("SELECT * FROM bookings WHERE id = ?", (bid,)).fetchone()
    return _format_booking(row)


def list_bookings(user_id: int) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM bookings WHERE user_id = ? ORDER BY id DESC LIMIT 50",
            (user_id,),
        ).fetchall()
    return [_format_booking(r) for r in rows]


def _format_booking(row) -> dict:
    d = dict(row)
    d["plan"] = json.loads(d.pop("plan_json"))
    return d


def save_contact_message(name: str, email: str, message: str, user_id: int | None = None) -> int:
    now = _utc_now()
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO contact_messages (user_id, name, email, message, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, name, email, message, now),
        )
        return cur.lastrowid

