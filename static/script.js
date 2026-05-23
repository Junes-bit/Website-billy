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

    if(!input || !input.value) return;

    name = input.value;

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

        click.style.background = skin;

        update();
    })
    .catch(() => {

        // fallback wenn neuer Spieler
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
