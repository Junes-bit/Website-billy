
let name = "";

let coins = 0;
let power = 1;

let skin = "#3b82f6";
let owned = ["blue"];

const coinsEl = document.getElementById("coins");
const powerEl = document.getElementById("power");
const click = document.getElementById("click");

// ---------------- START GAME ----------------
function startGame(){

    const input = document.getElementById("nameInput");
    if(!input || !input.value) return;

    name = input.value;

    const savedPass = localStorage.getItem("pass_" + name);

    let pass = "";

    if(!savedPass){
        pass = prompt("🔐 Neues Passwort setzen:");
        if(!pass) return;

        localStorage.setItem("pass_" + name, pass);
    } else {
        pass = prompt("🔐 Passwort eingeben:");
        if(pass !== savedPass){
            alert("❌ Falsches Passwort!");
            return;
        }
    }

    // 🔒 1 Account pro Gerät
    const deviceUser = localStorage.getItem("activeUser");

    if(deviceUser && deviceUser !== name){
        alert("❌ Dieses Gerät nutzt bereits einen Account!");
        return;
    }

    localStorage.setItem("activeUser", name);

    // LOAD GAME
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

       click.style.background = skin;

// 💎 WICHTIG: UI richtig anwenden
coinsEl.style.color = skin;
coinsEl.style.textShadow = `0 0 20px ${skin}`;

// optional: selected skin visuell markieren
document.querySelectorAll(".card")
.forEach(c => c.classList.remove("selected"));

update();

        coinsEl.style.color = skin;
        coinsEl.style.textShadow = `0 0 20px ${skin}`;

        update();
    })
    .catch(() => {

        document.getElementById("nameScreen").style.display = "none";
        document.getElementById("ui").classList.remove("hidden");
        document.getElementById("game").classList.remove("hidden");

        update();

        setTimeout(() => {

    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {

        const onclick = card.getAttribute("onclick");

        if(onclick && onclick.includes(skin)){
            card.classList.add("selected");
        }
    })

}, 100);
    });
}
// ---------------- CLICK ----------------
click.addEventListener("click", () => {

    coins += power;
    update();
    save();
});

// ---------------- UI UPDATE ----------------
function update(){

    coinsEl.innerText = coins;
    powerEl.innerText = "⚡ " + power + " pro Klick";

    updateUpgradePrices();
}

// ---------------- MENU ----------------
function show(id){

    document.querySelectorAll(".menu")
    .forEach(e => e.classList.add("hidden"));

    document.getElementById(id).classList.remove("hidden");

    if(id === "leaderboard") loadLB();
}


function selectSkin(color, id){

    skin = color;

    document.querySelectorAll(".card")
    .forEach(c => c.classList.remove("selected"));

    const el = document.getElementById(id);

    el.classList.add("selected");

    el.style.setProperty("--glow", color);

    click.style.background = color;

    coinsEl.style.color = color;
    coinsEl.style.textShadow = `0 0 20px ${color}`;

    save();
}

function buySkin(id, price, color){

    const el = document.getElementById(id);

    // schon gekauft
    if(owned.includes(id)){
        selectSkin(color, id);
        return;
    }

    // kaufen
    if(coins >= price){

        coins -= price;

        owned.push(id);

        // Preis entfernen
        const priceTag = el.querySelector(".price");

        if(priceTag){
            priceTag.remove();
        }

        selectSkin(color, id);

        update();
        save();

    } else {
        alert("Nicht genug Coins");
    }
}

// ---------------- UPGRADES ----------------
function getUpgradePrice(base){
    return Math.floor(base * (1 + power * 0.15));
}

function buyUpgrade(price, add){

    if(coins >= price){

        coins -= price;
        power += add;

        update();
        save();

    } else {
        alert("Zu wenig Coins");
    }
}

// ---------------- SHOW PRICE ----------------
function updateUpgradePrices(){

    const u1 = document.getElementById("u1");
    const u2 = document.getElementById("u2");
    const u3 = document.getElementById("u3");

    if(u1) u1.innerText = getUpgradePrice(50) + " Coins";
    if(u2) u2.innerText = getUpgradePrice(150) + " Coins";
    if(u3) u3.innerText = getUpgradePrice(500) + " Coins";
}

// ---------------- SAVE ----------------
function save(){

    fetch("/save",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
            name,
            coins,
            power,
            skin,
            owned
        })
    });
}

// ---------------- LEADERBOARD ----------------
function loadLB(){

    fetch("/leaderboard")
    .then(r => r.json())
    .then(data => {

        const list = document.getElementById("list");
        list.innerHTML = "";

        data.forEach(p => {

            const li = document.createElement("li");
            li.innerText = p[0] + " - " + p[1];

            list.appendChild(li);
        });
    });
}
