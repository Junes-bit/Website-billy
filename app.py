from flask import Flask, render_template, request, jsonify
import os
import json

app = Flask(__name__)

DATA_FILE = "data.json"


# -------- LOAD FROM FILE --------
def load_data():
    if not os.path.exists(DATA_FILE):
        return {}
    with open(DATA_FILE, "r") as f:
        return json.load(f)


# -------- SAVE TO FILE --------
def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f)


# -------- HOME --------
@app.route("/")
def home():
    return render_template("index.html")


# -------- SAVE GAME --------
@app.route("/save", methods=["POST"])
def save():

    data = load_data()
    req = request.json

    name = req["name"]

    data[name] = {
        "coins": req["coins"],
        "power": req["power"],
        "skin": req["skin"],
        "owned": req["owned"]
    }

    save_data(data)

    return jsonify({"ok": True})


# -------- LOAD GAME --------
@app.route("/load/<name>")
def load(name):

    data = load_data()

    return jsonify(data.get(name, {
        "coins": 0,
        "power": 1,
        "skin": "#3b82f6",
        "owned": ["blue"]
    }))


# -------- LEADERBOARD --------
@app.route("/leaderboard")
def leaderboard():

    data = load_data()

    sorted_players = sorted(
        data.items(),
        key=lambda x: x[1]["coins"],
        reverse=True
    )

    return jsonify([
        [name, info["coins"]] for name, info in sorted_players[:10]
    ])


# -------- START SERVER --------
if __name__ == "__main__":

    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
