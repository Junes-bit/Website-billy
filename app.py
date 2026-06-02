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

    c.execute("""
    CREATE TABLE IF NOT EXISTS friendships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user1 TEXT NOT NULL,
        user2 TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        requested_by TEXT NOT NULL,
        UNIQUE(user1, user2),
        FOREIGN KEY(user1) REFERENCES players(name),
        FOREIGN KEY(user2) REFERENCES players(name)
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS rounds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        clicks INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(name) REFERENCES players(name)
    )
    """)

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

# ---------------- LEADERBOARD ----------------
@app.route("/leaderboard")
def leaderboard():

    conn = sqlite3.connect("game.db")
    c = conn.cursor()

    c.execute("""
    SELECT name, coins
    FROM players
    ORDER BY coins DESC
    LIMIT 10
    """)

    data = c.fetchall()
    conn.close()

    return jsonify(data)

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
        conn.close()
        return jsonify({"ok": False, "msg": "Ungültiger Code"})

    reward, used = row

    if used == 1:
        conn.close()
        return jsonify({"ok": False, "msg": "Schon benutzt"})

    c.execute("SELECT coins FROM players WHERE name=?", (name,))
    player = c.fetchone()

    if not player:
        conn.close()
        return jsonify({"ok": False, "msg": "Spieler nicht gefunden"})

    new_coins = player[0] + reward

    c.execute("UPDATE players SET coins=? WHERE name=?", (new_coins, name))
    c.execute("UPDATE codes SET used=1 WHERE code=?", (code,))

    conn.commit()
    conn.close()

    return jsonify({"ok": True, "reward": reward})

# ============= FRIENDS SYSTEM =============

@app.route("/add-friend", methods=["POST"])
def add_friend():
    data = request.json
    my_name = data.get("myName")
    friend_name = data.get("friendName")

    if my_name == friend_name:
        return jsonify({"ok": False, "msg": "Du kannst dich nicht selbst hinzufügen!"})

    conn = sqlite3.connect("game.db")
    c = conn.cursor()

    c.execute("SELECT name FROM players WHERE name=?", (friend_name,))
    if not c.fetchone():
        conn.close()
        return jsonify({"ok": False, "msg": "Spieler nicht gefunden"})

    c.execute("""
    SELECT status FROM friendships 
    WHERE (user1=? AND user2=?) OR (user1=? AND user2=?)
    """, (my_name, friend_name, friend_name, my_name))
    
    if c.fetchone():
        conn.close()
        return jsonify({"ok": False, "msg": "Anfrage bereits existiert"})

    c.execute("""
    INSERT INTO friendships (user1, user2, status, requested_by)
    VALUES (?, ?, 'pending', ?)
    """, (my_name, friend_name, my_name))

    conn.commit()
    conn.close()

    return jsonify({"ok": True, "msg": "Anfrage gesendet!"})


@app.route("/get-friends/<name>")
def get_friends(name):
    conn = sqlite3.connect("game.db")
    c = conn.cursor()

    c.execute("""
    SELECT CASE 
        WHEN user1=? THEN user2 
        ELSE user1 
    END as friend_name
    FROM friendships 
    WHERE (user1=? OR user2=?) AND status='accepted'
    """, (name, name, name))
    
    friends = [row[0] for row in c.fetchall()]

    c.execute("""
    SELECT user2 FROM friendships 
    WHERE user1=? AND status='pending'
    """, (name,))
    
    pending_sent = [row[0] for row in c.fetchall()]

    c.execute("""
    SELECT user1 FROM friendships 
    WHERE user2=? AND status='pending'
    """, (name,))
    
    pending_received = [row[0] for row in c.fetchall()]

    conn.close()

    return jsonify({
        "friends": friends,
        "pendingSent": pending_sent,
        "pendingReceived": pending_received
    })


@app.route("/accept-friend", methods=["POST"])
def accept_friend():
    data = request.json
    my_name = data.get("myName")
    from_name = data.get("fromName")

    conn = sqlite3.connect("game.db")
    c = conn.cursor()

    c.execute("""
    UPDATE friendships 
    SET status='accepted'
    WHERE user1=? AND user2=? AND status='pending'
    """, (from_name, my_name))

    conn.commit()
    conn.close()

    return jsonify({"ok": True})


@app.route("/decline-friend", methods=["POST"])
def decline_friend():
    data = request.json
    my_name = data.get("myName")
    from_name = data.get("fromName")

    conn = sqlite3.connect("game.db")
    c = conn.cursor()

    c.execute("""
    DELETE FROM friendships 
    WHERE user1=? AND user2=? AND status='pending'
    """, (from_name, my_name))

    conn.commit()
    conn.close()

    return jsonify({"ok": True})


@app.route("/friend-profile/<name>")
def friend_profile(name):
    conn = sqlite3.connect("game.db")
    c = conn.cursor()

    c.execute("SELECT name, coins, power, skin FROM players WHERE name=?", (name,))
    row = c.fetchone()
    conn.close()

    if row:
        return jsonify({
            "name": row[0],
            "coins": row[1],
            "power": row[2],
            "skin": row[3]
        })

    return jsonify({"ok": False, "msg": "Spieler nicht gefunden"})


@app.route("/remove-friend", methods=["POST"])
def remove_friend():
    data = request.json
    my_name = data.get("myName")
    friend_name = data.get("friendName")

    conn = sqlite3.connect("game.db")
    c = conn.cursor()

    c.execute("""
    DELETE FROM friendships 
    WHERE (user1=? AND user2=?) OR (user1=? AND user2=?)
    """, (my_name, friend_name, friend_name, my_name))

    conn.commit()
    conn.close()

    return jsonify({"ok": True})

# ============= RUNDEN SYSTEM =============

@app.route("/save-round", methods=["POST"])
def save_round():
    data = request.json
    player_name = data.get("name")
    difficulty = data.get("difficulty")
    clicks = data.get("clicks")

    conn = sqlite3.connect("game.db")
    c = conn.cursor()

    c.execute("""
    INSERT INTO rounds (name, difficulty, clicks)
    VALUES (?, ?, ?)
    """, (player_name, difficulty, clicks))

    conn.commit()
    conn.close()

    return jsonify({"ok": True})


@app.route("/round-leaderboard/<difficulty>")
def round_leaderboard(difficulty):
    conn = sqlite3.connect("game.db")
    c = conn.cursor()

    c.execute("""
    SELECT name, clicks
    FROM rounds
    WHERE difficulty=?
    ORDER BY clicks DESC
    LIMIT 10
    """, (difficulty,))

    data = c.fetchall()
    conn.close()

    return jsonify(data)


# ============= RUN =============
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 500))
    app.run(host="0.0.0.0", port=port)
