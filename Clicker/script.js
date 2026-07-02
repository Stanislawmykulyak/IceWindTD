const accRock = document.getElementById('entire-rock')
const gemCounter = document.querySelector('.gem-counter')


const playlist = [
        'media/BG-Music-DeusLover.mp3',
        'media/BG-Music-DeusLover-2.mp3',
        'media/BG-Music-DeusLover-3.mp3',
        'media/BG-Music-DeusLover-4.mp3',
        'media/BG-Music-DeusLover-5.mp3'
]
let currentTrackIndex = 0;
const bgMusic = new Audio(playlist[currentTrackIndex]);
bgMusic.volume = 1;

let isMuted = false;
const audioBtn = document.getElementById('audio-toggle');

function playNextTrack() {
        currentTrackIndex++;
        

        if (currentTrackIndex >= playlist.length) {
                currentTrackIndex = 0;
        }
        

        bgMusic.src = playlist[currentTrackIndex];
        

        if (!isMuted) {
                bgMusic.play().catch(err => console.log("Autoplay block na kolejnym utworze:", err));
        }
}

bgMusic.onended = playNextTrack;


function tryAutoplay() {
        if (isMuted) return;
        bgMusic.play().then(() => {
                window.removeEventListener('click', tryAutoplay);
        }).catch(() => {
                console.log("browser is blocking autoplay, you need to click");
        });
}


window.addEventListener('click', tryAutoplay);

audioBtn.onclick = function(e) {
        e.stopPropagation();
        
        if (bgMusic.paused) {
                bgMusic.play();
                audioBtn.innerHTML = "🔊 Muzyka: ON";
                audioBtn.style.borderColor = "#475569";
                isMuted = false;
        } else {
                bgMusic.pause();
                audioBtn.innerHTML = "🔇 Muzyka: OFF";
                audioBtn.style.borderColor = "#991b1b";
                isMuted = true;
        }
};

function formatNumber(num) {
        return new Intl.NumberFormat('en-US', {
                notation: 'compact',
                compactDisplay: 'short',
                maximumFractionDigits: 2
        }).format(num);
}

let gems = 0;

function updateGems() {
        gemCounter.innerHTML = `Gems : ${formatNumber(gems)}$`
}

let gem_per_click = 1;
let lucky_gem_percentage = 3



const rockImg = document.querySelector('.GemRock img');

accRock.addEventListener('click', function (e) {

        rockImg.classList.remove('rock-pop');
        void rockImg.offsetWidth;
        rockImg.classList.add('rock-pop');


        if ((Math.random() * 100) < lucky_gem_percentage) {
                gems += gem_per_click * 7;
                console.log("Lucky gem");
        } else {
                gems += gem_per_click;
                console.log("Kliknięcie w kamyczek");
        }
})


const upgrades = {
        miner: {
                baseCost: 10,
                cost: 10,
                efficiency: 0.1,
                level: 0,
                maxLevel: 100,
                milestones: { 10: 2, 20: 2, 50: 2, 100: 10 }
        },
        archer: {
                baseCost: 150,
                cost: 150,
                efficiency: 3,
                level: 0,
                maxLevel: 100,
                milestones: { 10: 2, 20: 1.5, 50: 2, 100: 5 }
        },
        knight: {
                baseCost: 1100,
                cost: 1100,
                efficiency: 25,
                level: 0,
                maxLevel: 100,
                milestones: { 10: 2.5, 20: 1.6, 50: 2, 100: 5 }
        }
};

function updateUpgradesUI() {
        Object.keys(upgrades).forEach(key => {
                const up = upgrades[key];


                const lvlEl = document.querySelector(`.${key}-lvl`);
                const priceEl = document.querySelector(`.${key}-price`);

                if (lvlEl && priceEl) {
                        if (up.level === up.maxLevel) {
                                lvlEl.innerHTML = `MAX LVL`;
                        } else {
                                lvlEl.innerHTML = `Lvl: ${up.level + 1}`;
                        }


                        priceEl.innerHTML = `Price: ${formatNumber(up.cost)}$`;
                }
        });
}


function buyUpgrade(upgradeKey) {
        const up = upgrades[upgradeKey];
        if (gems >= up.cost && up.level < up.maxLevel) {
                gems -= up.cost;
                up.level++;

                if (up.milestones[up.level]) {
                        up.efficiency *= up.milestones[up.level];
                }

                up.cost = Math.floor(up.baseCost * Math.pow(1.15, up.level));
        } else if (up.level >= up.maxLevel) {
                console.log("You cant Upgrade , Max level reached");
        }
}

Object.keys(upgrades).forEach(key => {
        const container = document.querySelector(`.${key}-upgrades`);
        if (container) {
                container.onclick = () => buyUpgrade(key);
        }
});

function saveGameToFile() {
        const dataToSave = {
                gems: gems,
                upgrades: {}
        };


        Object.keys(upgrades).forEach(key => {
                dataToSave.upgrades[key] = {
                        level: upgrades[key].level,
                        cost: upgrades[key].cost,
                        efficiency: upgrades[key].efficiency
                };
        });


        const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "medieval_clicker_save.json";
        a.click();


        URL.revokeObjectURL(url);
        console.log("Zwój zapisu został wygenerowany!");
}


function loadGameFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
                try {
                        const loadedData = JSON.parse(e.target.result);


                        if (typeof loadedData.gems === "number") {
                                gems = loadedData.gems;
                        }

                        if (loadedData.upgrades) {
                                Object.keys(loadedData.upgrades).forEach(key => {
                                        if (upgrades[key]) {
                                                upgrades[key].level = loadedData.upgrades[key].level;
                                                upgrades[key].cost = loadedData.upgrades[key].cost;
                                                upgrades[key].efficiency = loadedData.upgrades[key].efficiency;
                                        }
                                });
                        }

                        console.log("Zwój odczytany pomyślnie! Stan gry zaktualizowany.");

                        updateGems();
                        updateUpgradesUI();

                } catch (err) {
                        console.error("Magia zawiodła! Plik zapisu jest uszkodzony.", err);
                        alert("Ten zwój jest skażony! Nie można go odczytać.");
                }
        };
        reader.readAsText(file);
}

document.getElementById('save-btn').onclick = saveGameToFile;

const fileInput = document.getElementById('file-input');
document.getElementById('load-btn').onclick = () => fileInput.click();
fileInput.onchange = loadGameFromFile;


let lastTime = 0;
let accumulatedTime = 0;

function gameLoop(timestamp) {

        if (!lastTime) lastTime = timestamp;


        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        accumulatedTime += deltaTime;


        while (accumulatedTime >= 1000) {
                if(upgrades.archer.level < 10){
                      Miner_Income_multiplier_chance = 0  
                }
                if(upgrades.archer.level > 10){
                      Miner_Income_multiplier_chance = 5  
                }
                if(upgrades.archer.level > 20){
                      Miner_Income_multiplier_chance = 10  
                }
                if(upgrades.archer.level > 50){
                      Miner_Income_multiplier_chance = 20  
                }
                if(upgrades.archer.level == 100){
                      Miner_Income_multiplier_chance = 50
                }
                let globalMinerMultiplier = 1;
                if (upgrades.archer.level >= 10 && Math.random()*100 < Miner_Income_multiplier_chance) {
                        globalMinerMultiplier = 2;
                        console.log("Lucky Mine , All miner income x2");
                }


                Object.keys(upgrades).forEach(key => {
                        const up = upgrades[key];
                        let income = up.level * up.efficiency;


                        if (key === 'miner') {
                                income *= globalMinerMultiplier;
                        }

                        gems += income;
                });

                accumulatedTime -= 1000;
        }

        requestAnimationFrame(gameLoop);
        updateGems();
        updateUpgradesUI();
}


requestAnimationFrame(gameLoop);