from flask import Flask, render_template, request, jsonify
import sqlite3
import os
from datetime import datetime
import base64

app = Flask(__name__)

# ============= CACHE DISABLE =============
@app.after_request
def disable_cache(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# ============= UPLOADS FOLDER =============
UPLOAD_FOLDER = 'static/uploads/profiles'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# ✅ NEUE INIT_DB FUNKTION
def init_db():
    """Erstellt nur die Tabellen, wenn sie noch nicht existieren"""
    conn = sqlite3.connect("game.db")
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS players (
        name TEXT PRIMARY KEY,
        coins INTEGER,
        power INTEGER,
        skin TEXT,
        owned TEXT,
        favoriteSkin TEXT,
        playtimeSeconds INTEGER DEFAULT 0,
        lastSaveTime DATETIME DEFAULT CURRENT_TIMESTAMP
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

    # ✅ Codes nur einmal einfügen, nicht jedesmal
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

# ============= PLAYTIME CALCULATION =============
def calculate_playtime(seconds):
    """Konvertiert Sekunden in Tage, Stunden, Minuten Format"""
    days = seconds // (24 * 3600)
    remaining = seconds % (24 * 3600)
    hours = remaining // 3600
    remaining = remaining % 3600
    minutes = remaining // 60
    
    return {
        "days": days,
        "hours": hours,
        "minutes": minutes,
        "formatted": f"{days}T {hours}H {minutes}min"
    }

# ============= SAVE ================
@app.route("/save", methods=["POST"])
def save():
    data = request.json

    conn = sqlite3.connect("game.db")
    c = conn.cursor()

    # Hole alte Daten für Playtime-Berechnung
    c.execute("SELECT playtimeSeconds, lastSaveTime FROM players WHERE name=?", (data["name"],))
    row = c.fetchone()
    
    playtime = 0
    if row:
        old_playtime = row[0] or 0
        last_save = datetime.fromisoformat(row[1]) if row[1] else datetime.now()
        time_diff = (datetime.now() - last_save).total_seconds()
        playtime = old_playtime + int(time_diff)
    else:
        playtime = 0

    c.execute("""
    INSERT OR REPLACE INTO players
    (name, coins, power, skin, owned, favoriteSkin, playtimeSeconds, lastSaveTime)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data["name"],
        int(data["coins"]),
        int(data["power"]),
        data["skin"],
        ",".join(data["owned"]),
        data.get("favoriteSkin", data["skin"]),
        playtime,
        datetime.now().isoformat()
    ))

    conn.commit()
    conn.close()

    return jsonify({"ok": True})

# ============= LOAD ================
@app.route("/load/<name>")
def load(name):

    conn = sqlite3.connect("game.db")
    c = conn.cursor()

    c.execute("SELECT * FROM players WHERE name=?", (name,))
    row = c.fetchone()

    conn.close()

    if row:
        playtime_info = calculate_playtime(row[6] or 0)
        # ✅ FIX: owned zu Array konvertieren mit "blueSkin"
        owned_list = row[4].split(",") if row[4] else ["blueSkin"]
        
        return jsonify({
            "coins": row[1],
            "power": row[2],
            "skin": row[3],
            "owned": owned_list,
            "favoriteSkin": row[5] or row[3],
            "playtime": row[6] or 0,
            "playtimeFormatted": playtime_info["formatted"]
        })

    return jsonify({
        "coins": 0,
        "power": 1,
        "skin": "#3b82f6",
        "owned": ["blueSkin"],
        "favoriteSkin": "#3b82f6",
        "playtime": 0,
        "playtimeFormatted": "0T 0H 0min"
    })

# ============= UPDATE FAVORITE SKIN ================
@app.route("/update-favorite-skin", methods=["POST"])
def update_favorite_skin():
    data = request.json
    player_name = data.get("name")
    favorite_skin = data.get("favoriteSkin")
    
    conn = sqlite3.connect("game.db")
    c = conn.cursor()
    c.execute("UPDATE players SET favoriteSkin=? WHERE name=?", 
              (favorite_skin, player_name))
    conn.commit()
    conn.close()
    
    return jsonify({"ok": True})

# ============= LEADERBOARD ================
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

# ============= REDEEM ================
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

    c.execute("SELECT name, coins, power, skin, favoriteSkin FROM players WHERE name=?", (name,))
    row = c.fetchone()
    conn.close()

    if row:
        return jsonify({
            "name": row[0],
            "coins": row[1],
            "power": row[2],
            "skin": row[3],
            "favoriteSkin": row[4] or row[3]
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
    SELECT clicks FROM rounds
    WHERE name=? AND difficulty=?
    ORDER BY clicks DESC
    LIMIT 1
    """, (player_name, difficulty))
    
    existing = c.fetchone()

    if existing and existing[0] >= clicks:
        conn.close()
        return jsonify({"ok": True, "msg": "Alter Score war besser"})

    c.execute("""
    DELETE FROM rounds
    WHERE name=? AND difficulty=?
    """, (player_name, difficulty))

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

    rows = c.fetchall()
    conn.close()

    data = [{"name": row[0], "clicks": row[1]} for row in rows]
    
    return jsonify(data)

# ============= GLÜCKSRAD REWARD SYSTEM =============
@app.route("/spin-wheel", methods=["POST"])
def spin_wheel():
    data = request.json
    player_name = data.get("name")
    reward_index = data.get("rewardIndex")
    
    conn = sqlite3.connect("game.db")
    c = conn.cursor()
    
    # Hole den Skin basierend auf Index
    skins_by_index = {
        0: "lavaSkin",
        1: "iceSkin", 
        2: "toxicSkin",
        3: "pinkSkin",
        4: "voidSkin"
    }
    
    skin_id = skins_by_index.get(reward_index)
    coins_reward = [1000, 2000, 3000, 4000, 5000][reward_index]
    
    # Hole aktuellen owned Status
    c.execute("SELECT owned FROM players WHERE name=?", (player_name,))
    row = c.fetchone()
    owned_list = row[0].split(",") if row and row[0] else ["blueSkin"]
    
    # Füge Skin hinzu wenn nicht vorhanden
    if skin_id not in owned_list:
        owned_list.append(skin_id)
    
    # Update
    c.execute("""
    UPDATE players 
    SET coins = coins + ?, owned = ?
    WHERE name=?
    """, (coins_reward, ",".join(owned_list), player_name))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        "ok": True, 
        "coinsReward": coins_reward,
        "skinReward": skin_id,
        "newOwned": owned_list
    })

# ============= RUN =============
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 500))
    app.run(host="0.0.0.0", port=port)
