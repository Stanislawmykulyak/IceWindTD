const accRock = document.getElementById('entire-rock')
const gemCounter = document.querySelector('.gem-counter')

let gems = 0;

function updateGems() {
        gemCounter.innerHTML = `Gems : ${gems.toFixed(0)}$`
}

let gem_per_click = 1;
let lucky_gem_percentage = 3

const rockImg = document.querySelector('.GemRock img');

accRock.addEventListener('click', function (e) {
        // Trik z wymuszeniem reflow – resetuje animację natychmiast przy ultra szybkim klikaniu
        rockImg.classList.remove('rock-pop');
        void rockImg.offsetWidth; 
        rockImg.classList.add('rock-pop');

        // Reszta Twojego starego kodu kliknięcia bez zmian...
        if ((Math.random() * 100) < lucky_gem_percentage) {
                gems += gem_per_click * 7;
                console.log("Lucky gem");
        } else {
                gems += gem_per_click;
                console.log("Kliknięcie w kamyczek");
        }
})


// Miner Upgrade
const upgrades = {
        miner: {
                baseCost: 10,
                cost: 10,
                efficiency: 0.1,
                level: 0,
                maxLevel: 100,
                milestones: { 10: 2, 20: 2, 50: 2, 100: 10 }
        },
        wizard: {
                baseCost: 150,
                cost: 150,
                efficiency:3,
                level: 0,
                maxLevel: 100,
                milestones: {}
        },
};

// Generyczna funkcja aktualizująca UI dowolnego ulepszenia
function updateUpgradesUI() {
        Object.keys(upgrades).forEach(key => {
                const up = upgrades[key];
                
                // Dynamiczne łapanie elementów z HTML na podstawie klucza (np. .miner-lvl)
                const lvlEl = document.querySelector(`.${key}-lvl`);
                const priceEl = document.querySelector(`.${key}-price`);

                if (lvlEl && priceEl) {
                        if (up.level === up.maxLevel) {
                                lvlEl.innerHTML = `MAX LVL`;
                        } else {
                                lvlEl.innerHTML = `Lvl: ${up.level + 1}`;
                        }
                        priceEl.innerHTML = `Price: ${up.cost.toFixed(0)}$`;
                }
        });
}

// Generyczna logika zakupu ulepszeń
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

// Automatyczne podpięcie zdarzeń click dla wszystkich ulepszeń w obiekcie
Object.keys(upgrades).forEach(key => {
        const container = document.querySelector(`.${key}-upgrades`);
        if (container) {
                container.onclick = () => buyUpgrade(key);
        }
});

let lastTime = 0;
let accumulatedTime = 0;

function gameLoop(timestamp) {
        // 1. Inicjalizacja przy pierwszym uruchomieniu
        if (!lastTime) lastTime = timestamp;

        // 2. Obliczanie Delta Time (czasu między klatkami)
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        accumulatedTime += deltaTime;

        // --- TUTAJ WCHODZI TWOJA LOGIKA ---
        // Na przykład: przesunięcie postaci o (prędkość * deltaTime)
        while (accumulatedTime >= 1000) {

                let globalMinerMultiplier = 1;
                if (upgrades.wizard.level >= 10 && Math.random() < 0.05) {
                        globalMinerMultiplier = 2;
                        console.log("Szczęśliwy traf! Podwójny zysk minerów!");
                }

                // 2. Naliczanie przychodu dla wszystkich ulepszeń
                Object.keys(upgrades).forEach(key => {
                        const up = upgrades[key];
                        let income = up.level * up.efficiency;

                        // Jeśli pętla przetwarza minera, aplikujemy wyliczony wyżej bonus
                        if (key === 'miner') {
                                income *= globalMinerMultiplier;
                        }

                        gems += income;
                });

                accumulatedTime -= 1000;
        }
        // ----------------------------------

        // 3. Prośba o kolejną klatkę
        requestAnimationFrame(gameLoop);
        updateGems();
        updateUpgradesUI();
}

// Pierwsze odpalenie pętli
requestAnimationFrame(gameLoop);