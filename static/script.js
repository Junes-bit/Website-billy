let name = "";

let coins = 0;
let power = 1;

let skin = "#3b82f6";
let owned = ["blueSkin"];

let coinsEl;
let powerEl;

// Current friends data
let friendsData = {
    friends: [],
    pendingSent: [],
    pendingReceived: []
};

let currentFriendsTab = "friends";

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

    if (id === "friends") {
        Friends();
    }
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

    document.querySelectorAll("#skinsGrid .card")
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


// ============= FRIENDS SYSTEM =============

function Friends() {
    fetch("/get-friends/" + name)
        .then(r => r.json())
        .then(data => {
            friendsData = data;
            renderFriendsTab(currentFriendsTab);
        });
}

function switchFriendsTab(tab) {
    currentFriendsTab = tab;
    
    document.querySelectorAll(".friendsTab")
        .forEach(t => t.classList.remove("active"));
    
    document.querySelector(`.friendsTab[onclick="switchFriendsTab('${tab}')"]`)
        ?.classList.add("active");
    
    renderFriendsTab(tab);
}

function renderFriendsTab(tab) {
    const container = document.getElementById("friendsList");
    if (!container) return;

    container.innerHTML = "";

    if (tab === "friends") {
        if (friendsData.friends.length === 0) {
            container.innerHTML = "<div class='emptyMessage'>Noch keine Freunde</div>";
            return;
        }

        friendsData.friends.forEach(friend => {
            const item = document.createElement("div");
            item.className = "friendItem";
            item.innerHTML = `
                <div class="friendName">👤 ${friend}</div>
                <div class="friendActions">
                    <button class="profileBtn" onclick="showFriendProfile('${friend}')">Profil</button>
                    <button class="removeBtn" onclick="removeFriend('${friend}')">Entfernen</button>
                </div>
            `;
            container.appendChild(item);
        });
    }
    
    else if (tab === "sent") {
        if (friendsData.pendingSent.length === 0) {
            container.innerHTML = "<div class='emptyMessage'>Keine ausstehenden Anfragen</div>";
            return;
        }

        friendsData.pendingSent.forEach(friend => {
            const item = document.createElement("div");
            item.className = "friendItem";
            item.innerHTML = `
                <div class="friendName">⏳ Anfrage an ${friend}</div>
                <div class="friendActions">
                    <button class="declineBtn" onclick="declineFriendRequest('${friend}', 'sent')">Stornieren</button>
                </div>
            `;
            container.appendChild(item);
        });
    }
    
    else if (tab === "received") {
        if (friendsData.pendingReceived.length === 0) {
            container.innerHTML = "<div class='emptyMessage'>Keine eingegangenen Anfragen</div>";
            return;
        }

        friendsData.pendingReceived.forEach(friend => {
            const item = document.createElement("div");
            item.className = "friendItem";
            item.innerHTML = `
                <div class="friendName">✉️ Anfrage von ${friend}</div>
                <div class="friendActions">
                    <button class="acceptBtn" onclick="acceptFriendRequest('${friend}')">Akzeptieren</button>
                    <button class="declineBtn" onclick="declineFriendRequest('${friend}', 'received')">Ablehnen</button>
                </div>
            `;
            container.appendChild(item);
        });
    }
}

function addFriend() {
    const input = document.getElementById("friendInput");
    if (!input || !input.value.trim()) {
        alert("Name eingeben!");
        return;
    }

    const friendName = input.value.trim();

    fetch("/add-friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            myName: name,
            friendName: friendName
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.ok) {
            alert("✅ Anfrage gesendet!");
            input.value = "";
            Friends();
        } else {
            alert("❌ " + data.msg);
        }
    });
}

function acceptFriendRequest(fromName) {
    fetch("/accept-friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            myName: name,
            fromName: fromName
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.ok) {
            alert("✅ Freund akzeptiert!");
            Friends();
        }
    });
}

function declineFriendRequest(friendName, type) {
    fetch("/decline-friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            myName: name,
            fromName: friendName
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.ok) {
            alert("✅ Abgelehnt");
            Friends();
        }
    });
}

function removeFriend(friendName) {
    if (!confirm(`${friendName} wirklich entfernen?`)) return;

    fetch("/remove-friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            myName: name,
            friendName: friendName
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.ok) {
            alert("✅ Freund entfernt");
            Friends();
        }
    });
}

function showFriendProfile(friendName) {
    fetch("/friend-profile/" + friendName)
        .then(r => r.json())
        .then(data => {
            if (data.ok === false) {
                alert("Profil nicht gefunden");
                return;
            }

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

            const popup = document.createElement("div");
            popup.className = "friendProfilePopup";
            popup.innerHTML = `
                <div class="friendProfileBox">
                    <h2>👤 ${data.name}</h2>
                    <p>💰 Coins: <span>${data.coins}</span></p>
                    <p>⚡ Power: <span>${data.power}</span></p>
                    <p>🎨 Skin: <span>${skinNames[data.skin] || "Unbekannt"}</span></p>
                    <button onclick="this.parentElement.parentElement.remove()">Schließen</button>
                </div>
            `;
            document.body.appendChild(popup);
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

document.addEventListener("DOMContentLoaded", () => {
    const leaderboardBtn = document.querySelector('[onclick="show(\'leaderboard\')"]');
    if (leaderboardBtn) {
        leaderboardBtn.addEventListener("click", loadLB);
    }
});

let roundClicks = 0;
let roundSeconds = 0;
let roundTimer = null;
let currentRoundMode = "";

function startRunden(mode, seconds) {

    roundClicks = 0;
    roundSeconds = seconds;
    currentRoundMode = mode;

    document.getElementById("rundenSelect").classList.add("hidden");
    document.getElementById("rundenResults").classList.add("hidden");

    const countdown = document.getElementById("rundenCountdown");
    const display = document.getElementById("countdownDisplay");

    countdown.classList.add("active");

   let c = 3;
display.innerText = c;
display.style.color = "#3b82f6";
display.style.fontSize = "120px";
display.style.fontWeight = "800";

const interval = setInterval(() => {
    c--;

    // Animation bei jedem Step - GRÖSSER + BLAU + GLOW
    display.style.transform = "scale(1.5)";
    display.style.opacity = "1";
    display.style.textShadow = `0 0 30px #3b82f6, 0 0 60px #3b82f6`;

    setTimeout(() => {
        display.style.transform = "scale(1.2)";
        display.style.textShadow = `0 0 20px #3b82f6`;
    }, 150);

    if (c > 0) {
        display.innerText = c;
    } else {
        clearInterval(interval);

               display.innerText = "GO!";

        display.style.transform = "scale(2)";
        display.style.color = "#22c55e";
        display.style.textShadow = `0 0 40px #22c55e, 0 0 80px #22c55e`;

        setTimeout(() => {
            startGameNow(seconds);
        }, 700);
    }
}, 1000);

}    
function startGameNow(seconds) {

    document.getElementById("rundenCountdown").classList.remove("active");
    document.getElementById("rundenGame").classList.add("active");

    const clicksEl = document.getElementById("rundenClicks");
    const timerEl = document.getElementById("rundenTimer");
    const btn = document.getElementById("rundenClick");

    roundClicks = 0;

    clicksEl.innerText = 0;
    timerEl.innerText = seconds;

    btn.onclick = () => {
        roundClicks++;
        clicksEl.innerText = roundClicks;
    };

    let time = seconds;

    roundTimer = setInterval(() => {
        time--;
        timerEl.innerText = time;

        if (time <= 0) {
            clearInterval(roundTimer);
            endRunden();
        }
    }, 1000);
}

function endRunden() {

    document.getElementById("rundenGame").classList.remove("active");
    document.getElementById("rundenResults").classList.remove("hidden");
    document.getElementById("rundenResults").classList.add("active");

    document.getElementById("resultClicks").innerText = roundClicks;

    // Leaderboard laden für aktuellen Modus
    loadRoundLB(currentRoundMode);

    // Save
    fetch("/save-round", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
            name,
            difficulty: currentRoundMode,
            clicks: roundClicks
        })
    });
}

function restartRunden() {
    startRunden(currentRoundMode, roundSeconds);
}

function exitRunden() {
    document.getElementById("rundenSelect").classList.remove("hidden");
    document.getElementById("rundenResults").classList.add("hidden");
    document.getElementById("rundenCountdown").classList.remove("active");
    document.getElementById("rundenGame").classList.remove("active");
}

function loadRoundLB(mode) {
    fetch("/round-leaderboard/" + mode)
        .then(r => r.json())
        .then(data => {
            const list = document.getElementById("roundLB");
            if (!list) return;

            list.innerHTML = "";

            data.forEach((p, i) => {
                const li = document.createElement("li");
                li.innerText = `${i+1}. ${p.name} - ${p.clicks}`;
                list.appendChild(li);
            });
        })
        .catch(err => {
            console.log("Round LB error:", err);
        });
}
