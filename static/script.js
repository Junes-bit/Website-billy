let coins = 0;
let clickPower = 1;
let playerName = "";

const coinsText = document.getElementById("coins");
const clickButton = document.getElementById("clickButton");

function startGame(){

    playerName =
    document.getElementById("nameInput").value;

    if(!playerName) return;

    document.getElementById("nameScreen").style.display = "none";
    document.getElementById("gameUI").classList.remove("hidden");
    document.getElementById("gameMenu").classList.remove("hidden");

    loadLeaderboard();
}

clickButton.addEventListener("click", () => {

    coins += clickPower;
    coinsText.innerText = coins;

    fetch("/save_score", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
            name: playerName,
            score: coins
        })
    });

});

function showMenu(menu){

    document.getElementById("gameMenu").classList.add("hidden");
    document.getElementById("shopMenu").classList.add("hidden");
    document.getElementById("leaderboardMenu").classList.add("hidden");

    document.getElementById(menu + "Menu").classList.remove("hidden");

    if(menu === "leaderboard"){
        loadLeaderboard();
    }
}

function buyUpgrade(price, power){

    if(coins >= price){
        coins -= price;
        clickPower += power;
        coinsText.innerText = coins;
    }
}

async function loadLeaderboard(){

    const res = await fetch("/leaderboard");
    const data = await res.json();

    const list = document.getElementById("leaderboardList");

    list.innerHTML = "";

    data.forEach(p => {

        const li = document.createElement("li");

        li.innerText = p[0] + " - " + p[1];

        list.appendChild(li);
    });
}
