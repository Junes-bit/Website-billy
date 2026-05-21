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
            "streak": 0
        }
    return data[uid]

def registered(u):
    return u["name"] is not None

# ================= FRONTEND =================
@app.route("/")
def home():
    return render_template("index.html")

# ================= COMMAND SYSTEM =================
@app.route("/command", methods=["POST"])
def command():
    text = request.json["text"].lower()
    uid = request.json["user"]

    u = user(uid)

    # ---------------- REGISTER ----------------
    if text.startswith("/register"):
        if u["name"]:
            return jsonify("❌ Schon registriert")

        parts = text.split()
        if len(parts) < 3:
            return jsonify("❌ /register name age")

        u["name"] = parts[1]
        u["age"] = parts[2]
        save(data)
        return jsonify("✅ Registriert!")

    # ---------------- CHECK REGISTER ----------------
    if not registered(u):
        return jsonify("❌ Erst /register")

    # ---------------- ME ----------------
    if text == "/me":
        return jsonify(u)

    # ---------------- MINE ----------------
    if text == "/mine":
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

    # ---------------- FISH ----------------
    if text == "/fish":
        fish = random.choice(["🐟","🐠","🦈","🐋"])
        u["inventory"][fish] = u["inventory"].get(fish,0)+1
        save(data)
        return jsonify(f"🎣 {fish}")

    # ---------------- DAILY ----------------
    if text == "/daily":
        now = time.time()
        if now - u["last_daily"] < 86400:
            return jsonify("⏰ Schon benutzt")

        if now - u["last_daily"] > 172800:
            u["streak"] = 0

        u["streak"] += 1
        reward = u["streak"] * 10
        u["coins"] += reward
        u["last_daily"] = now
        save(data)

        return jsonify(f"💰 +{reward} Coins")

    # ---------------- COINFLIP ----------------
    if text.startswith("/coinflip"):
        parts = text.split()
        if len(parts) < 3:
            return jsonify("❌ /coinflip bet kopf/zahl")

        bet = int(parts[1])
        choice = parts[2]

        result = random.choice(["kopf","zahl"])

        if choice == result:
            u["coins"] += bet
            return jsonify("🟢 Gewonnen")
        else:
            u["coins"] -= bet
            return jsonify("🔴 Verloren")

    # ---------------- FIGHT ----------------
    if text == "/fight":
        enemy = random.choice(["Goblin","Zombie","Ork"])
        power = 20 + u["level"] * 5

        enemy_power = random.randint(20,80)

        if power > enemy_power:
            reward = random.randint(20,80)
            u["coins"] += reward
            save(data)
            return jsonify(f"🏆 Sieg gegen {enemy} +{reward}")
        else:
            loss = random.randint(5,20)
            u["coins"] -= loss
            save(data)
            return jsonify(f"💀 Verloren gegen {enemy} -{loss}")

    # ---------------- BATTLE ----------------
    if text.startswith("/battle"):
        return jsonify("⚔️ Battle kommt später mit Gegner-System")

    # ---------------- MSG ----------------
    if text.startswith("/msg"):
        return jsonify("📩 Nachricht-System (noch simpel)")

    return jsonify("❓ Unknown command")

# ================= ME ENDPOINT =================
@app.route("/me")
def me():
    uid = request.args.get("user")
    u = user(uid)

    if not registered(u):
        return jsonify("❌ Nicht registriert")

    return jsonify(u)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
