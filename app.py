from flask import Flask, request, jsonify, render_template
import json, time, random

app = Flask(__name__)

# ================= DATA =================
def load():
    try:
        with open("data.json", "r") as f:
            return json.load(f)
    except:
        return {}

def save(data):
    with open("data.json", "w") as f:
        json.dump(data, f, indent=4)

data = load()

def user(uid):
    if uid not in data:
        data[uid] = {
            "name": None,
            "age": None,
            "coins": 100,
            "inventory": {},
            "xp": 0,
            "level": 1,
            "last_daily": 0,
            "streak": 0,
            "bank": 0
        }
    return data[uid]

def registered(u):
    return u["name"] is not None

# ================= FRONTEND =================
@app.route("/")
def home():
    return render_template("index.html")

# ================= REGISTER =================
@app.route("/register", methods=["POST"])
def register():
    uid = request.json["user"]
    name = request.json["name"]
    age = request.json["age"]

    u = user(uid)

    if u["name"]:
        return jsonify("Schon registriert")

    u["name"] = name
    u["age"] = age
    save(data)

    return jsonify("Registriert!")

# ================= ME =================
@app.route("/me")
def me():
    uid = request.args.get("user")
    u = user(uid)

    if not registered(u):
        return jsonify("Nicht registriert")

    return jsonify(u)

# ================= MINE =================
@app.route("/mine")
def mine():
    uid = request.args.get("user")
    u = user(uid)

    if not registered(u):
        return jsonify("Register zuerst")

    ore = random.choice(["kupfer","eisen","gold","diamant"])
    u["inventory"][ore] = u["inventory"].get(ore,0)+1

    gain = random.randint(5,15)
    u["xp"] += gain

    u["coins"] -= 10

    if u["xp"] >= u["level"] * 100:
        u["xp"] = 0
        u["level"] += 1

    save(data)

    return jsonify(f"⛏️ {ore} +{gain} XP")

# ================= FISH =================
@app.route("/fish")
def fish():
    uid = request.args.get("user")
    u = user(uid)

    if not registered(u):
        return jsonify("Register zuerst")

    fish = random.choice(["🐟","🐠","🦈","🐋"])
    u["inventory"][fish] = u["inventory"].get(fish,0)+1

    save(data)
    return jsonify(f"🎣 {fish}")

# ================= DAILY =================
@app.route("/daily")
def daily():
    uid = request.args.get("user")
    u = user(uid)

    now = time.time()

    if now - u["last_daily"] < 86400:
        return jsonify("Schon benutzt")

    if now - u["last_daily"] > 172800:
        u["streak"] = 0

    u["streak"] += 1

    reward = u["streak"] * 10
    u["coins"] += reward
    u["last_daily"] = now

    save(data)

    return jsonify(f"+{reward} Coins")

# ================= COINFLIP =================
@app.route("/coinflip")
def coinflip():
    uid = request.args.get("user")
    bet = int(request.args.get("bet"))
    choice = request.args.get("choice")

    u = user(uid)

    result = random.choice(["kopf","zahl"])

    if choice == result:
        u["coins"] += bet
        msg = "Gewonnen"
    else:
        u["coins"] -= bet
        msg = "Verloren"

    save(data)
    return jsonify(msg)

# ================= BATTLE =================
@app.route("/battle", methods=["POST"])
def battle():
    a = user(request.json["user"])
    b = user(request.json["target"])
    bet = int(request.json["bet"])

    dmg1 = random.randint(20,60)
    dmg2 = random.randint(20,60)

    if dmg1 > dmg2:
        a["coins"] += bet
        b["coins"] -= bet
        win = a["name"]
    else:
        a["coins"] -= bet
        b["coins"] += bet
        win = b["name"]

    save(data)
    return jsonify({"winner": win})

# ================= BANK =================
@app.route("/bank", methods=["GET","POST"])
def bank():
    uid = request.args.get("user")
    u = user(uid)

    if request.method == "POST":
        amount = int(request.json["amount"])

        if request.json["type"] == "in":
            u["coins"] -= amount
            u["bank"] += amount
        else:
            u["coins"] += amount
            u["bank"] -= amount

        save(data)

        return jsonify("OK")

    return jsonify({"bank": u["bank"]})

# ================= LEADERBOARD =================
@app.route("/leaderboard")
def lb():
    top = sorted(data.items(), key=lambda x: x[1]["coins"], reverse=True)[:10]
    return jsonify(top)

# ================= COMMAND SYSTEM =================
@app.route("/command", methods=["POST"])
def command():
    text = request.json["text"]
    uid = request.json["user"]

    if text.startswith("/mine"):
        return mine()

    if text.startswith("/fish"):
        return fish()

    if text.startswith("/daily"):
        return daily()

    if text.startswith("/coinflip"):
        parts = text.split()
        return coinflip()

    return jsonify("Unknown command")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)