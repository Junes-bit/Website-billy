let name = "";

let coins = 0;
let power = 1;

let skin = "#3b82f6";
let owned = ["blue"];

let coinsEl;
let powerEl;

// ---------------- INIT ----------------
document.addEventListener("DOMContentLoaded", () => {

    coinsEl = document.getElementById("coins");
    powerEl = document.getElementById("power");

    const clickBtn = document.getElementById("click");

    if (clickBtn) {
        clickBtn.addEventListener("click", () => {
            coins += power;
            update();
            save();
        });
    }
});


// ---------------- SKIN ----------------
function applySkin(value) {

    const click = document.getElementById("click");
    if (!click) return;

    click.style.background = "";
    click.style.backgroundImage = "";

    if (value && value.endsWith(".png")) {
        click.style.backgroundImage = `url('/static/${value}')`;
        click.style.backgroundSize = "cover";
        click.style.backgroundPosition = "center";
    } else {
        click.style.background = value;
    }

    if (coinsEl) {
        coinsEl.style.color = value;
        coinsEl.style.textShadow = `0 0 30px ${value}`;
    }
}


// ---------------- START ----------------
function startGame() {

    const input = document.getElementById("nameInput");
    if (!input || !input.value) return;

    name = input.value;

    const savedPass = localStorage.getItem("pass_" + name);

    let pass = "";

    if (!savedPass) {
        pass = prompt("🔐 Neues Passwort setzen:");
        if (!pass) return;
        localStorage.setItem("pass_" + name, pass);
    } else {
        pass = prompt("🔐 Passwort eingeben:");
        if (pass !== savedPass) {
            alert("❌ Falsches Passwort!");
            return;
        }
    }

    const deviceUser = localStorage.getItem("activeUser");

    if (deviceUser && deviceUser !== name) {
        alert("❌ Dieses Gerät nutzt bereits einen Account!");
        return;
    }

    localStorage.setItem("activeUser", name);

    fetch("/load/" + name)
        .then(r => r.json())
        .then(data => {

            coins = data.coins || 0;
            power = data.power || 1;
            skin = data.skin || "#3b82f6";
            owned = data.owned || ["blue"];

            document.getElementById("nameScreen").style.display = "none";
            document.getElementById("app").classList.remove("hidden");

            applySkin(skin);
            show("menu");
            update();
            updateProfile();
        });
}


// ---------------- UPDATE ----------------
function update() {

    if (coinsEl) coinsEl.innerText = coins;
    if (powerEl) powerEl.innerText = "⚡ " + power + " pro Klick";

    updateUpgradePrices();
    updateProfile();
}


// ---------------- PAGE NAVIGATION ----------------
function show(id) {

    document.querySelectorAll(".page")
        .forEach(e => e.classList.remove("active"));

    const el = document.getElementById(id);
    if (el) el.classList.add("active");
}


// ---------------- PROFILE UPDATE ----------------
function updateProfile() {
    
    const profileName = document.getElementById("profileName");
    const profileCoins = document.getElementById("profileCoins");
    const profilePower = document.getElementById("profilePower");
    const profileSkin = document.getElementById("profileSkin");

    if (profileName) profileName.innerText = name;
    if (profileCoins) profileCoins.innerText = coins;
    if (profilePower) profilePower.innerText = power;
    
    // Get skin name
    const skinNames = {
        "#3b82f6": "Blau",
        "#ef4444": "Rot",
        "#22c55e": "Hellgrün",
        "#f97316": "Orange",
        "gold": "Gold",
        "#38bdf8": "Diamant",
        "#ff3b30": "Lava",
        "#7dd3fc": "Ice",
        "#84cc16": "Toxic",
        "#ff4d9d": "Pink",
        "#111827": "Void"
    };
    
    if (profileSkin) profileSkin.innerText = skinNames[skin] || "Unbekannt";
}


// ---------------- SKINS ----------------
function selectSkin(value, id) {

    skin = value;

    function selectSkin(value, id) {

    skin = value;

    document.querySelectorAll("#skinsGrid .card")  // ← DIESE ZEILE!
        .forEach(c => c.classList.remove("selected"));

    const el = document.getElementById(id);
    if (el) el.classList.add("selected");

    applySkin(value);
    save();
    updateProfile();
}
        .forEach(c => c.classList.remove("selected"));

    const el = document.getElementById(id);
    if (el) el.classList.add("selected");

    applySkin(value);
    save();
    updateProfile();
}

function buySkin(id, price, value) {

    const el = document.getElementById(id);

    if (owned.includes(id)) {
        selectSkin(value, id);
        return;
    }

    if (coins >= price) {

        coins -= price;
        owned.push(id);

        const priceTag = el?.querySelector(".price");
        if (priceTag) priceTag.remove();

        selectSkin(value, id);

        update();
        save();

    } else {
        alert("Nicht genug Coins");
    }
}


// ---------------- UPGRADES ----------------
function getUpgradePrice(base) {
    return Math.floor(base * (1 + power * 0.15));
}

function buyUpgrade(price, add) {

    if (coins >= price) {
        coins -= price;
        power += add;
        update();
        save();
    } else {
        alert("Zu wenig Coins");
    }
}


// ---------------- PRICE ----------------
function updateUpgradePrices() {

    const u1 = document.getElementById("u1");
    const u2 = document.getElementById("u2");
    const u3 = document.getElementById("u3");

    if (u1) u1.innerText = getUpgradePrice(50) + " Coins";
    if (u2) u2.innerText = getUpgradePrice(150) + " Coins";
    if (u3) u3.innerText = getUpgradePrice(500) + " Coins";
}


// ---------------- CODE SYSTEM ----------------
function toggleCodeBox() {

    const popup = document.getElementById("codePopup");
    if (!popup) return;

    popup.classList.toggle("hidden");
}


async function redeemCode() {

    const input = document.getElementById("codeInput");
    if (!input) return;

    const code = input.value.trim();

    if (!code) {
        alert("Code eingeben!");
        return;
    }

    const res = await fetch("/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name })
    });

    const data = await res.json();

    if (data.ok) {
        coins += data.reward;
        alert("🎉 +" + data.reward + " Coins!");
        input.value = "";
        update();
        save();
    } else {
        alert(data.msg);
    }
}


// ---------------- SAVE ----------------
function save() {

    fetch("/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name,
            coins,
            power,
            skin,
            owned
        })
    });
}


// ---------------- LOGOUT ----------------
function logout() {
    
    if (confirm("🚪 Wirklich ausloggen?")) {
        localStorage.removeItem("activeUser");
        location.reload();
    }
}


// ---------------- LEADERBOARD ----------------
function loadLB() {

    fetch("/leaderboard")
        .then(r => r.json())
        .then(data => {

            const list = document.getElementById("list");
            if (!list) return;

            list.innerHTML = "";

            data.forEach((p, index) => {
                const li = document.createElement("li");
                li.innerText = `${index + 1}. ${p[0]} - ${p[1] ?? 0} Coins`;
                list.appendChild(li);
            });
        })
        .catch(() => {
            console.log("Leaderboard error");
        });
}

// Leaderboard laden wenn man auf die Seite klickt
document.addEventListener("DOMContentLoaded", () => {
    const leaderboardBtn = document.querySelector('[onclick="show(\'leaderboard\')"]');
    if (leaderboardBtn) {
        leaderboardBtn.addEventListener("click", loadLB);
    }
});
