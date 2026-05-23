let coins = 0;

const coinsText =
    document.getElementById("coins");

const clickButton =
    document.getElementById("clickButton");

clickButton.addEventListener("click", () => {

    coins++;

    coinsText.innerText = coins;

    clickButton.animate([
        { transform:"scale(1)" },
        { transform:"scale(1.1)" },
        { transform:"scale(1)" }
    ],{
        duration:100
    });

});

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

function buySkin(color, price, id){

    if(coins >= price){

        coins -= price;

        coinsText.innerText = coins;

        clickButton.style.background = color;

        document
            .getElementById(id)
            .innerText = "✅ Gekauft";

    }else{

        alert("Nicht genug Coins!");
    }
}
