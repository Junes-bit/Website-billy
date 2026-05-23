let coins = 0;

let clickPower = 1;

let ownedSkins = [
    "#3b82f6"
];

const coinsText =
document.getElementById("coins");

const powerText =
document.getElementById("powerText");

const clickButton =
document.getElementById("clickButton");

clickButton.addEventListener("click", () => {

    coins += clickPower;

    updateUI();

    clickButton.animate([

        {
            transform:"scale(1)"
        },

        {
            transform:"scale(1.08)"
        },

        {
            transform:"scale(1)"
        }

    ],{

        duration:80
    });

});

function updateUI(){

    coinsText.innerText = coins;

    powerText.innerText =
    "⚡ Pro Klick: " + clickPower;
}

function showMenu(menu){

    document
    .getElementById("gameMenu")
    .classList.add("hidden");

    document
    .getElementById("shopMenu")
    .classList.add("hidden");

    document
    .getElementById("leaderboardMenu")
    .classList.add("hidden");

    if(menu === "game"){

        document
        .getElementById("gameMenu")
        .classList.remove("hidden");
    }

    if(menu === "shop"){

        document
        .getElementById("shopMenu")
        .classList.remove("hidden");
    }

    if(menu === "leaderboard"){

        document
        .getElementById("leaderboardMenu")
        .classList.remove("hidden");
    }
}

function buySkin(
color,
price,
id
){

    if(
    ownedSkins.includes(color)
    ){

        selectSkin(color);

        return;
    }

    if(coins >= price){

        coins -= price;

        ownedSkins.push(color);

        document
        .getElementById(id)
        .innerText =
        "✅ Auswählen";

        selectSkin(color);

        updateUI();

    }else{

        alert(
        "Nicht genug Coins!"
        );
    }
}

function selectSkin(color){

    clickButton.style.background =
    color;
}

function buyUpgrade(
price,
power
){

    if(coins >= price){

        coins -= price;

        clickPower += power;

        updateUI();

    }else{

        alert(
        "Nicht genug Coins!"
        );
    }
}

updateUI();
