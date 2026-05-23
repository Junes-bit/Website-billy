from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)

LEADERBOARD_FILE = "leaderboard.json"

if not os.path.exists(LEADERBOARD_FILE):
    with open(LEADERBOARD_FILE, "w") as f:
        json.dump([], f)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/save_score", methods=["POST"])
def save_score():
    data = request.json
    name = data["name"]
    score = data["score"]

    with open(LEADERBOARD_FILE, "r") as f:
        leaderboard = json.load(f)

    leaderboard.append({
        "name": name,
        "score": score
    })

    leaderboard = sorted(
        leaderboard,
        key=lambda x: x["score"],
        reverse=True
    )[:10]

    with open(LEADERBOARD_FILE, "w") as f:
        json.dump(leaderboard, f)

    return jsonify({"success": True})


@app.route("/leaderboard")
def leaderboard():
    with open(LEADERBOARD_FILE, "r") as f:
        leaderboard = json.load(f)

    return jsonify(leaderboard)


if __name__ == "__main__":
    app.run(debug=True)
