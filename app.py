from flask import Flask, render_template, request, jsonify
import sqlite3
import os

app = Flask(__name__)

DB = "game.db"


# ---------------- DB ----------------
def connect():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


def setup():

    conn = connect()

    conn.execute("""
    CREATE TABLE IF NOT EXISTS players(
        name TEXT PRIMARY KEY,
        coins INTEGER,
        power INTEGER,
        skin TEXT,
        owned TEXT
    )
    """)

    conn.commit()
    conn.close()


setup()


# ---------------- HOME ----------------
@app.route("/")
def home():
    return render_template("index.html")


# ---------------- SAVE ----------------
@app.route("/save", methods=["POST"])
def save():

    data = request.json

    conn = connect()

    conn.execute("""
    INSERT OR REPLACE INTO players
    (name, coins, power, skin, owned)
    VALUES (?, ?, ?, ?, ?)
    """, (
        data["name"],
        data["coins"],
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

    conn = connect()

    player = conn.execute("""
    SELECT * FROM players WHERE name=?
    """, (name,)).fetchone()

    conn.close()

    if player:

        return jsonify({
            "coins": player["coins"],
            "power": player["power"],
            "skin": player["skin"],
            "owned": player["owned"].split(",")
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

    conn = connect()

    players = conn.execute("""
    SELECT name, coins
    FROM players
    ORDER BY coins DESC
    LIMIT 10
    """).fetchall()

    conn.close()

    return jsonify([
        [p["name"], p["coins"]]
        for p in players
    ])


# ---------------- RUN ----------------
if __name__ == "__main__":

    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port
    )
