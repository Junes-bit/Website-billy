let name = "";

let coins = 0;
let power = 1;

let skin = "#3b82f6";
let owned = ["blue"];

const coinsEl = document.getElementById("coins");
const powerEl = document.getElementById("power");
const click = document.getElementById("click");

function startGame(){

    name = document.getElementById("nameInput").value;

    if(!name) return;

    fetch("/load/" + name)
    .then(r => r.json())
    .then(data => {

        coins = data.coins;
        power = data.power;
        skin = data.skin;
        owned = data.owned;

        click.style.background = skin;

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

function setSkin(c){

    skin = c;
    click.style.background = c;
    save();
}

function buySkin(id, price, color){

    if(owned.includes(id)){

        setSkin(color);
        return;
    }

    if(coins >= price){

        coins -= price;
        owned.push(id);

        setSkin(color);
        update();
        save();

    } else alert("Zu wenig Coins");
}

function buyUpgrade(price, add){

    if(coins >= price){

        coins -= price;
        power += add;

        update();
        save();

    } else alert("Zu wenig Coins");
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

        let list = document.getElementById("list");

        list.innerHTML = "";

        data.forEach(p => {

            let li = document.createElement("li");

            li.innerText = p[0] + " - " + p[1];

            list.appendChild(li);
        });
    });
}
