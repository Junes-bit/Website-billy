from flask import Flask, render_template, request, jsonify
import os

app = Flask(__name__)

players = {}  # {name: score}

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/save_score", methods=["POST"])
def save_score():

    data = request.json
    name = data["name"]
    score = data["score"]

    players[name] = max(players.get(name, 0), score)

    return jsonify({"success": True})


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
