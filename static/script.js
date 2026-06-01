
let name = "";

let coins = 0;
let power = 1;

let skin = "#3b82f6";
let owned = ["blue"];

let coinsEl;
let powerEl;

// ---------------- INIT (safe DOM load) ----------------
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


// ---------------- SKIN SYSTEM ----------------
function applySkin(value) {

    const click = document.getElementById("click");

    if (!click) return;

    click.style.background = "";
    click.style.backgroundImage = "";

    // IMAGE SKINS
    if (value && value.endsWith(".png")) {

        click.style.backgroundImage = `url('/static/${value}')`;
        click.style.backgroundSize = "cover";
        click.style.backgroundPosition = "center";

    } 
    // COLOR SKINS
    else {
        click.style.background = value;
    }

    if (coinsEl) {
        coinsEl.style.color = value;
        coinsEl.style.textShadow = `0 0 20px ${value}`;
    }
}


// ---------------- START GAME ----------------
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
            document.getElementById("ui").classList.remove("hidden");
            document.getElementById("game").classList.remove("hidden");

            applySkin(skin);
            update();
        })
        .catch(() => {

            document.getElementById("nameScreen").style.display = "none";
            document.getElementById("ui").classList.remove("hidden");
            document.getElementById("game").classList.remove("hidden");

            applySkin(skin);
            update();
        });
}


// ---------------- UPDATE ----------------
function update() {

    if (coinsEl) coinsEl.innerText = coins;
    if (powerEl) powerEl.innerText = "⚡ " + power + " pro Klick";

    updateUpgradePrices();
}


// ---------------- MENU ----------------
function show(id) {

    document.querySelectorAll(".menu")
        .forEach(e => e.classList.add("hidden"));

    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");

    if (id === "leaderboard") loadLB();
}


// ---------------- SKINS ----------------
function selectSkin(value, id) {

    skin = value;

    document.querySelectorAll("#shop .card")
        .forEach(c => c.classList.remove("selected"));

    const el = document.getElementById(id);
    if (el) el.classList.add("selected");

    applySkin(value);
    save();
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


// ---------------- PRICE UI ----------------
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

    const code = input.value;

    const res = await fetch("/redeem", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            code: code,
            name: name
        })
    });

    const data = await res.json();

    if (data.ok) {
        coins += data.reward;
        alert("🎉 +" + data.reward + " Coins!");
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


// ---------------- LEADERBOARD ----------------
function loadLB() {

    fetch("/leaderboard")
        .then(r => r.json())
        .then(data => {

            const list = document.getElementById("list");
            if (!list) return;

            list.innerHTML = "";

            data.forEach(p => {

                const li = document.createElement("li");
                li.innerText = p[0] + " - " + p[1];

                list.appendChild(li);
            });
        });
}
