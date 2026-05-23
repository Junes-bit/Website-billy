from flask import Flask, render_template, request, jsonify
import os

app = Flask(__name__)

players = {}
user_data = {}

@app.route("/")
def home():
    return render_template("index.html")

# -------- SAVE GAME --------
@app.route("/save", methods=["POST"])
def save():

    data = request.json
    name = data["name"]

    user_data[name] = {
        "coins": data["coins"],
        "power": data["power"],
        "skin": data["skin"],
        "owned": data["owned"]
    }

    players[name] = data["coins"]

    return jsonify({"ok": True})

# -------- LOAD GAME --------
@app.route("/load/<name>")
def load(name):

    return jsonify(user_data.get(name, {
        "coins": 0,
        "power": 1,
        "skin": "#3b82f6",
        "owned": ["blue"]
    }))

# -------- LEADERBOARD --------
@app.route("/leaderboard")
def leaderboard():

    sorted_players = sorted(
        players.items(),
        key=lambda x: x[1],
        reverse=True
    )

    return jsonify(sorted_players[:10])

if __name__ == "__main__":

    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
