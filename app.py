from flask import Flask, render_template, request, jsonify
import sqlite3
import os

app = Flask(__name__)

# ---------------- INIT DB ----------------
def init_db():
    conn = sqlite3.connect("game.db")
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS players (
        name TEXT PRIMARY KEY,
        coins INTEGER,
        power INTEGER,
        skin TEXT,
        owned TEXT
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS codes (
        code TEXT PRIMARY KEY,
        reward INTEGER,
        used INTEGER DEFAULT 0
    )
    """)

    # 👉 Codes nur einmal einfügen
    codes = {
        "B4N3R": 1000,
        "R3M5F": 2500,
        "G7Z4N": 3000,
        "G0ZFR": 5000,
        "D1M3S": 10000
    }

    for code, reward in codes.items():
        c.execute("""
        INSERT OR IGNORE INTO codes (code, reward, used)
        VALUES (?, ?, 0)
        """, (code, reward))

    conn.commit()
    conn.close()

init_db()

# ---------------- HOME ----------------
@app.route("/")
def home():
    return render_template("index.html")

# ---------------- SAVE ----------------
@app.route("/save", methods=["POST"])
def save():
    data = request.json

    conn = sqlite3.connect("game.db")
    c = conn.cursor()

    c.execute("""
    INSERT OR REPLACE INTO players
    (name, coins, power, skin, owned)
    VALUES (?, ?, ?, ?, ?)
    """, (
        data["name"],
        int(data["coins"]),
        int(data["power"]),
        data["skin"],
        ",".join(data["owned"])
    ))

    conn.commit()
    conn.close()

    return jsonify({"ok": True})

# ---------------- LOAD ----------------
@app.route("/load/<name>")
def load(name):

    conn = sqlite3.connect("game.db")
    c = conn.cursor()

    c.execute("SELECT * FROM players WHERE name=?", (name,))
    row = c.fetchone()

    conn.close()

    if row:
        return jsonify({
            "coins": row[1],
            "power": row[2],
            "skin": row[3],
            "owned": row[4].split(",") if row[4] else ["blue"]
        })

    return jsonify({
        "coins": 0,
        "power": 1,
        "skin": "#3b82f6",
        "owned": ["blue"]
    })

# ---------------- REDEEM ----------------
@app.route("/redeem", methods=["POST"])
def redeem():

    data = request.json
    code = data.get("code")
    name = data.get("name")

    conn = sqlite3.connect("game.db")
    c = conn.cursor()

    c.execute("SELECT reward, used FROM codes WHERE code=?", (code,))
    row = c.fetchone()

    if not row:
        return jsonify({"ok": False, "msg": "Ungültiger Code"})

    reward, used = row

    if used == 1:
        return jsonify({"ok": False, "msg": "Schon benutzt"})

    c.execute("SELECT coins FROM players WHERE name=?", (name,))
    player = c.fetchone()

    if not player:
        return jsonify({"ok": False, "msg": "Spieler nicht gefunden"})

    new_coins = player[0] + reward

    c.execute("UPDATE players SET coins=? WHERE name=?", (new_coins, name))
    c.execute("UPDATE codes SET used=1 WHERE code=?", (code,))

    conn.commit()
    conn.close()

    return jsonify({"ok": True, "reward": reward})

# ---------------- RUN ----------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 500))
    app.run(host="0.0.0.0", port=port)
