let name = "";

let coins = 0;
let power = 1;

let skin = "#3b82f6";
let owned = ["blue"];

const coinsEl = document.getElementById("coins");
const powerEl = document.getElementById("power");
const click = document.getElementById("click");

function startGame(){

    const input = document.getElementById("nameInput");
    const pass = prompt("🔐 Passwort setzen oder eingeben:");

    if(!input.value || !pass) return;

    name = input.value;

    const savedPass = localStorage.getItem("pass_" + name);

    // neues Konto
    if(!savedPass){
        localStorage.setItem("pass_" + name, pass);
    }

    // falsches Passwort
    if(savedPass && savedPass !== pass){
        alert("Falsches Passwort!");
        return;
    }

    // 🔒 PRO GERÄT LOCK
    const deviceUser = localStorage.getItem("activeUser");

    if(deviceUser && deviceUser !== name){
        alert("❌ Dieses Gerät hat schon einen Account!");
        return;
    }

    localStorage.setItem("activeUser", name);

    // LOAD GAME
    fetch("/load/" + name)
    .then(r => r.json())
    .then(data => {

        coins = data.coins;
        power = data.power;
        skin = data.skin;
        owned = data.owned;

        document.getElementById("nameScreen").style.display = "none";
        document.getElementById("ui").classList.remove("hidden");
        document.getElementById("game").classList.remove("hidden");

        update();
    });
}
click.addEventListener("click", () => {

    coins += power;
    update();
    save();
});

function update(){

    coinsEl.innerText = coins;
    powerEl.innerText = "⚡ " + power + " pro Klick";
}

function show(id){

    document.querySelectorAll(".menu")
    .forEach(e => e.classList.add("hidden"));

    document.getElementById(id).classList.remove("hidden");

    if(id === "leaderboard") loadLB();
}

function selectSkin(color, id, nameText){

    skin = color;

    document.querySelectorAll(".card")
    .forEach(c => {
        c.classList.remove("selected");
        const t = c.querySelector(".status");
        if(t) t.innerText = "";
    });

    const el = document.getElementById(id);
    el.classList.add("selected");

    el.style.setProperty("--glow", color);

    click.style.background = color;

    coinsEl.style.color = color;
    coinsEl.style.textShadow = `0 0 20px ${color}`;

    // 👇 TEXT UNTER SKIN
    const status = el.querySelector(".status");
    if(status){
        status.innerText = "✓ Ausgewählt";
        status.style.color = color;
    }

    save();
}

function buySkin(id, price, color){

    const el = document.getElementById(id);

    if(owned.includes(id)){
        selectSkin(color, id);
        return;
    }

    if(coins >= price){

        coins -= price;
        owned.push(id);

        el.innerHTML = "🎨 Auswählen";

        selectSkin(color, id);

        update();
        save();

    } else {
        alert("Nicht genug Coins");
    }
}

function buyUpgrade(price, add){

    if(coins >= price){

        coins -= price;
        power += add;

        update();
        save();

        // 💥 VISUAL FEEDBACK
        powerEl.innerText = "⚡ +" + add + " Upgrade gekauft!";

        powerEl.style.transform = "scale(1.2)";
        powerEl.style.color = "#38bdf8";

        setTimeout(() => {

            powerEl.style.transform = "scale(1)";
            update();

        }, 800);

    } else {
        alert("Zu wenig Coins");
    }
}
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
