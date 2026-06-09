let name = "";
let coins = 0;
let power = 1;
let skin = "#3b82f6";
let owned = ["blueSkin"];
let favoriteSkin = "#3b82f6";
let playtimeSeconds = 0;

let coinsEl;
let powerEl;

let friendsData = {
    friends: [],
    pendingSent: [],
    pendingReceived: []
};

let currentFriendsTab = "friends";

let wheelSpinning = false;
let wheelRewards = [1000, 2000, 3000, 4000, 5000];

// ============= INIT ================
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

    setTimeout(() => {
        const app = document.getElementById("app");
        const nameScreen = document.getElementById("nameScreen");
        
        if (app && nameScreen && nameScreen.style.display === "none") {
            const activeUser = localStorage.getItem("activeUser");
            if (activeUser) {
                autoLoadGame(activeUser);
            }
        }
    }, 100);

    updateWheelCooldown();
    setInterval(updateWheelCooldown, 1000);
});

// ============= AUTO-LOAD ================
function autoLoadGame(playerName) {
    name = playerName;
    
    fetch("/load/" + playerName)
        .then(r => r.json())
        .then(data => {
            coins = data.coins || 0;
            power = data.power || 1;
            skin = data.skin || "#3b82f6";
            owned = data.owned || ["blueSkin"];
            favoriteSkin = data.favoriteSkin || skin;
            playtimeSeconds = data.playtime || 0;

            applySkin(skin);
            show("menu");
            update();
            updateProfile();
        })
        .catch(err => {
            console.error("Fehler beim Laden:", err);
            alert("Fehler beim Laden des Spielstands");
        });
}

// ============= AUTO-SAVE ================
setInterval(() => {
    if (name) {
        save();
    }
}, 10000);

// ============= SKIN ================
function applySkin(value) {
    const click = document.getElementById("click");
    if (!click) return;

    click.style.background = value;
    if (coinsEl) {
        coinsEl.style.color = value;
        coinsEl.style.textShadow = `0 0 30px ${value}`;
    }
}

// ============= START GAME ================
function startGame() {
    const input = document.getElementById("nameInput");
    if (!input || !input.value) return;

    const newName = input.value.trim();

    // ✅ BUG FIX 1: Nur 1x pro Name
    const allPlayers = localStorage.getItem("allPlayers") ? JSON.parse(localStorage.getItem("allPlayers")) : [];
    
    if (allPlayers.includes(newName)) {
        // Account existiert bereits
        const pass = prompt("🔐 Passwort eingeben:");
        const savedPass = localStorage.getItem("pass_" + newName);
        
        if (pass !== savedPass) {
            alert("❌ Falsches Passwort!");
            return;
        }
    } else {
        // Neuer Account
        const pass = prompt("🔐 Neues Passwort setzen:");
        if (!pass) return;
        localStorage.setItem("pass_" + newName, pass);
        allPlayers.push(newName);
        localStorage.setItem("allPlayers", JSON.stringify(allPlayers));
    }

    name = newName;
    const deviceUser = localStorage.getItem("activeUser");
    if (deviceUser && deviceUser !== name) {
        if (!confirm(`Zu Account "${name}" wechseln?`)) {
            return;
        }
    }

    localStorage.setItem("activeUser", name);

    fetch("/load/" + name)
        .then(r => r.json())
        .then(data => {
            coins = data.coins || 0;
            power = data.power || 1;
            skin = data.skin || "#3b82f6";
            owned = data.owned || ["blueSkin"];
            favoriteSkin = data.favoriteSkin || skin;
            playtimeSeconds = data.playtime || 0;

            document.getElementById("nameScreen").style.display = "none";
            document.getElementById("app").classList.remove("hidden");

            applySkin(skin);
            show("menu");
            update();
            updateProfile();
        })
        .catch(err => {
            console.error("Login Error:", err);
            alert("Fehler beim Login!");
            localStorage.removeItem("activeUser");
        });
}

// ============= UPDATE ================
function update() {
    if (coinsEl) coinsEl.innerText = coins;
    if (powerEl) powerEl.innerText = "⚡ " + power + " pro Klick";
    updateUpgradePrices();
    updateProfile();
    renderWheelSkins();
}

// ============= PAGE NAVIGATION ================
function show(id) {
    document.querySelectorAll(".page").forEach(e => e.classList.remove("active"));
    const el = document.getElementById(id);
    if (el) el.classList.add("active");

    if (id === "friends") {
        Friends();
    }
    if (id === "profileEdit") {
        renderFavoriteSkinGrid();
    }
    if (id === "leaderboard") {
        loadLB();
    }
}

// ============= PLAYTIME FORMAT ================
function formatPlaytime(seconds) {
    const days = Math.floor(seconds / (24 * 3600));
    const remaining = seconds % (24 * 3600);
    const hours = Math.floor(remaining / 3600);
    const remaining2 = remaining % 3600;
    const minutes = Math.floor(remaining2 / 60);
    
    return `${days}T ${hours}H ${minutes}min`;
}

// ============= PROFILE UPDATE ================
function updateProfile() {
    const profileName = document.getElementById("profileName");
    const profileCoins = document.getElementById("profileCoins");
    const profilePower = document.getElementById("profilePower");
    const profileSkin = document.getElementById("profileSkin");
    const profilePlaytime = document.getElementById("profilePlaytime");
    const favoriteSkinOrb = document.getElementById("favoriteSkinOrb");
    const favoriteSkinName = document.getElementById("favoriteSkinName");

    if (profileName) profileName.innerText = name;
    if (profileCoins) profileCoins.innerText = coins;
    if (profilePower) profilePower.innerText = power;
    if (profilePlaytime) profilePlaytime.innerText = formatPlaytime(playtimeSeconds);
    
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

    if (favoriteSkinOrb) {
        favoriteSkinOrb.style.background = favoriteSkin;
        favoriteSkinOrb.style.width = "100px";
        favoriteSkinOrb.style.height = "100px";
        favoriteSkinOrb.style.borderRadius = "50%";
        favoriteSkinOrb.style.margin = "20px auto";
        favoriteSkinOrb.style.boxShadow = `0 0 40px ${favoriteSkin}`;
    }

    if (favoriteSkinName) {
        favoriteSkinName.innerText = skinNames[favoriteSkin] || "Unbekannt";
    }
}

// ============= FAVORITE SKIN GRID ================
function renderFavoriteSkinGrid() {
    const grid = document.getElementById("favoriteSkinGrid");
    if (!grid) return;

    grid.innerHTML = "";

    const skins = [
        { name: "Blau", color: "#3b82f6", id: "blueSkin" },
        { name: "Rot", color: "#ef4444", id: "redSkin" },
        { name: "Hellgrün", color: "#22c55e", id: "greenSkin" },
        { name: "Orange", color: "#f97316", id: "orangeSkin" },
        { name: "Gold", color: "gold", id: "goldSkin" },
        { name: "Diamant", color: "#38bdf8", id: "diamondSkin" },
        { name: "Lava", color: "#ff3b30", id: "lavaSkin" },
        { name: "Ice", color: "#7dd3fc", id: "iceSkin" },
        { name: "Toxic", color: "#84cc16", id: "toxicSkin" },
        { name: "Pink", color: "#ff4d9d", id: "pinkSkin" },
        { name: "Void", color: "#111827", id: "voidSkin" }
    ];

    if (!owned || owned.length === 0) {
        owned = ["blueSkin"];
    }

    skins.forEach(skin => {
        if (!owned.includes(skin.id)) return;

        const div = document.createElement("div");
        div.className = "favoriteSkinCard";
        if (favoriteSkin === skin.color) {
            div.classList.add("selected");
        }

        div.style.cssText = `
            width: 80px;
            height: 80px;
            background: ${skin.color};
            border-radius: 50%;
            cursor: pointer;
            border: 3px solid transparent;
            transition: all 0.3s;
            box-shadow: 0 0 20px ${skin.color};
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            color: white;
        `;

        div.onclick = () => selectFavoriteSkin(skin.color);
        div.innerText = skin.name.charAt(0);

        grid.appendChild(div);
    });
}

function selectFavoriteSkin(color) {
    favoriteSkin = color;
    renderFavoriteSkinGrid();
    save();
    updateProfile();
}

// ============= RENDER WHEEL SKINS ================
function renderWheelSkins() {
    const wheelSkinList = [
        { id: "lavaSkin", name: "Lava", color: "#ff3b30" },
        { id: "iceSkin", name: "Ice", color: "#7dd3fc" },
        { id: "toxicSkin", name: "Toxic", color: "#84cc16" },
        { id: "pinkSkin", name: "Pink", color: "#ff4d9d" },
        { id: "voidSkin", name: "Void", color: "#111827" }
    ];
    
    wheelSkinList.forEach(skin => {
        const container = document.getElementById(skin.id + "Card");
        if (!container) return;
        
        if (owned.includes(skin.id)) {
            container.innerHTML = `
                <div class="card" id="${skin.id}" onclick="selectSkin('${skin.color}', '${skin.id}')">
                    <div style="width: 60px; height: 60px; border-radius: 50%; background: ${skin.color};"></div>
                    <span class="name">${skin.name}</span>
                    <span class="price">🎡 Glücksrad</span>
                </div>
            `;
        } else {
            container.innerHTML = "";
        }
    });
}

// ============= SKINS ================
function selectSkin(value, id) {
    skin = value;
    document.querySelectorAll("#skinsGrid .card").forEach(c => c.classList.remove("selected"));
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
        
        // ✅ BUG FIX 2: Speichern SOFORT nach Kauf
        const el = document.getElementById(id);
        if (el) {
            const priceTag = el.querySelector(".price");
            if (priceTag) priceTag.remove();
        }
        selectSkin(value, id);
        update();
        save();
    } else {
        alert("Nicht genug Coins");
    }
}

// ============= UPGRADES ================
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

function updateUpgradePrices() {
    const u1 = document.getElementById("u1");
    const u2 = document.getElementById("u2");
    const u3 = document.getElementById("u3");

    if (u1) u1.innerText = getUpgradePrice(50) + " Coins";
    if (u2) u2.innerText = getUpgradePrice(150) + " Coins";
    if (u3) u3.innerText = getUpgradePrice(500) + " Coins";
}

// ============= CODE SYSTEM ================
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

// ============= SAVE ================
function save() {
    fetch("/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name,
            coins,
            power,
            skin,
            owned,
            favoriteSkin
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.ok) {
            console.log("✅ Spielstand gespeichert!");
        }
    })
    .catch(err => console.error("Speicherfehler:", err));
}

// ============= LOGOUT ================
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
    document.querySelectorAll(".friendsTab").forEach(t => t.classList.remove("active"));
    document.querySelector(`.friendsTab[onclick="switchFriendsTab('${tab}')"]`)?.classList.add("active");
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
        body: JSON.stringify({ myName: name, friendName: friendName })
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
        body: JSON.stringify({ myName: name, fromName: fromName })
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
        body: JSON.stringify({ myName: name, fromName: friendName })
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
        body: JSON.stringify({ myName: name, friendName: friendName })
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
                "#3b82f6": "Blau", "#ef4444": "Rot", "#22c55e": "Hellgrün",
                "#f97316": "Orange", "gold": "Gold", "#38bdf8": "Diamant",
                "#ff3b30": "Lava", "#7dd3fc": "Ice", "#84cc16": "Toxic",
                "#ff4d9d": "Pink", "#111827": "Void"
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

// ============= LEADERBOARD ================
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
        .catch(() => console.log("Leaderboard error"));
}

// ============= RUNDEN SYSTEM =============
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
            setTimeout(() => startGameNow(seconds), 700);
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
        
        clicksEl.style.transform = "scale(1.5)";
        clicksEl.style.textShadow = `0 0 30px #3b82f6, 0 0 60px #3b82f6`;
        clicksEl.style.color = "#3b82f6";
        clicksEl.style.fontSize = "80px";

        setTimeout(() => {
            clicksEl.style.transform = "scale(1.2)";
            clicksEl.style.textShadow = `0 0 20px #3b82f6`;
        }, 150);
    };

    let time = seconds;
    roundTimer = setInterval(() => {
        time--;
        timerEl.innerText = time;

        timerEl.style.transform = "scale(1.3)";
        timerEl.style.textShadow = `0 0 30px #ef4444, 0 0 60px #ef4444`;
        timerEl.style.color = "#ef4444";
        timerEl.style.fontSize = "70px";

        setTimeout(() => {
            timerEl.style.transform = "scale(1)";
            timerEl.style.textShadow = `0 0 20px #ef4444`;
        }, 300);

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

    const resultClicks = document.getElementById("resultClicks");
    if (resultClicks) {
        resultClicks.innerText = roundClicks;
    }

    loadRoundLB(currentRoundMode);

    fetch("/save-round", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ name, difficulty: currentRoundMode, clicks: roundClicks })
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
                li.innerText = `${i + 1}. ${p.name} - ${p.clicks}`;
                list.appendChild(li);
            });
        })
        .catch(err => console.log("Round LB error:", err));
}

// ============= GLÜCKSRAD (WHEEL REWARDS) =============
function spinWheel() {
    if (wheelSpinning) return;

    const lastSpin = localStorage.getItem("lastSpin_" + name);
    const now = Date.now();

    if (lastSpin) {
        const timePassed = now - parseInt(lastSpin);
        const oneDay = 24 * 60 * 60 * 1000;
        if (timePassed < oneDay) {
            alert("⏳ Komm in 24h wieder!");
            return;
        }
    }

    wheelSpinning = true;
    const wheel = document.getElementById("fortuneWheel");
    const resultPopup = document.getElementById("wheelResult");

    if (!wheel) return;

    const randomIndex = Math.floor(Math.random() * 5);
    const finalAngle = 360 * 5 + (360 - (270 + randomIndex * 72 + 36));

    wheel.style.transform = `rotate(${finalAngle}deg)`;

    setTimeout(() => {
        // 🎡 Sende zum Server
        fetch("/spin-wheel", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                name,
                rewardIndex: randomIndex
            })
        })
        .then(r => r.json())
        .then(data => {
            if (data.ok) {
                coins += data.coinsReward;
                owned = data.newOwned;
                
                const skinNames = {
                    "lavaSkin": "Lava",
                    "iceSkin": "Ice",
                    "toxicSkin": "Toxic",
                    "pinkSkin": "Pink",
                    "voidSkin": "Void"
                };
                
                if (resultPopup) {
                    resultPopup.innerHTML = `
                        <div class="wheelResultBox">
                            <h2>🎉 GEWONNEN!</h2>
                            <p class="wheelRewardAmount">+${data.coinsReward} Coins</p>
                            <p style="color: #06b6d4; font-size: 24px; font-weight: 800;">
                                🎨 Neuer Skin: ${skinNames[data.skinReward]}
                            </p>
                            <button onclick="document.getElementById('wheelResult').classList.add('hidden')">Schließen</button>
                        </div>
                    `;
                    resultPopup.classList.remove("hidden");
                }
                
                update();
                save();
                localStorage.setItem("lastSpin_" + name, now.toString());
                wheelSpinning = false;
                updateWheelCooldown();
            }
        });
    }, 3000);
}

function updateWheelCooldown() {
    const lastSpin = localStorage.getItem("lastSpin_" + name);
    const btn = document.getElementById("spinBtn");
    const timer = document.getElementById("wheelTimer");

    if (!btn || !timer) return;

    if (!lastSpin) {
        btn.disabled = false;
        btn.style.opacity = "1";
        timer.innerHTML = "🎉 Dreh jetzt!";
        return;
    }

    const now = Date.now();
    const timePassed = now - parseInt(lastSpin);
    const oneDay = 24 * 60 * 60 * 1000;
    const timeLeft = oneDay - timePassed;

    if (timeLeft <= 0) {
        btn.disabled = false;
        btn.style.opacity = "1";
        timer.innerHTML = "🎉 Dreh jetzt!";
    } else {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
        timer.innerHTML = `⏳ ${hours}h ${minutes}m ${seconds}s`;
    }
}
