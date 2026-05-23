let score = 0;

const scoreText = document.getElementById("score");
const button = document.getElementById("clickButton");

const clickSound = new Audio("/static/click.mp3");
const buySound = new Audio("/static/buy.mp3");

button.addEventListener("click", () => {

    score++;

    scoreText.innerText = score;

    clickSound.currentTime = 0;
    clickSound.play();

    button.animate([
        { transform: "scale(1)" },
        { transform: "scale(1.1)" },
        { transform: "scale(1)" }
    ], {
        duration: 150
    });
});

function buyColor(color, price) {

    if (score >= price) {

        score -= price;

        scoreText.innerText = score;

        button.style.background = color;

        buySound.currentTime = 0;
        buySound.play();
    }
}

async function loadLeaderboard() {

    const response = await fetch("/leaderboard");

    const data = await response.json();

    const list = document.getElementById("leaderboardList");

    list.innerHTML = "";

    data.forEach(player => {

        const li = document.createElement("li");

        li.innerText =
            player.name + " - " + player.score;

        list.appendChild(li);
    });
}

loadLeaderboard();
