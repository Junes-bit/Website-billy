from flask import Flask, render_template, request, jsonify
import sqlite3
import os

app = Flask(__name__)

# ---------------- DATABASE ----------------
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
        data["power"],
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

    c.execute(
        "SELECT * FROM players WHERE name=?",
        (name,)
    )

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
    SELECT name, CAST(coins AS INTEGER)
    FROM players
    ORDER BY CAST(coins AS INTEGER) DESC
    LIMIT 10
    """)

    data = c.fetchall()

    conn.close()

    return jsonify(data)

# ---------------- RUN ----------------
if __name__ == "__main__":

    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port
    )
