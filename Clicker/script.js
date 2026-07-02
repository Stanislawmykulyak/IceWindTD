const accRock = document.getElementById('entire-rock')
const gemCounter = document.querySelector('.gem-counter')


const playlist = [
        'media/BG-Music-DeusLover.mp3',
        'media/BG-Music-DeusLover-2.mp3',
        'media/BG-Music-DeusLover-3.mp3',
        'media/BG-Music-DeusLover-4.mp3',
        'media/BG-Music-DeusLover-5.mp3'
]
let savedSongIndex = localStorage.getItem('clicker_current_song_index');
let currentTrackIndex;

if (savedSongIndex !== null) {
        // Jeśli jest zapis – wczytujemy go
        currentTrackIndex = parseInt(savedSongIndex, 10);
} else {
        // Jeśli to nowe uruchomienie – LOSUJEMY piosenkę z Twojej tablicy (np. songs)
        // Zabezpieczenie: upewnij się, że Twoja tablica nazywa się 'songs'
        currentTrackIndex = Math.floor(Math.random() * playlist.length);
        localStorage.setItem('clicker_current_song_index', currentTrackIndex);
}
const bgMusic = new Audio(playlist[currentTrackIndex]);
bgMusic.volume = 1;

let isMuted = false;
const audioBtn = document.getElementById('audio-toggle');

function playNextTrack() {
        currentTrackIndex++;

        // Jeśli dojdziemy do końca tablicy, resetujemy do 0
        if (currentTrackIndex >= playlist.length) {
                currentTrackIndex = 0;
        }

        // Ładujemy nowy plik do odtwarzacza
        bgMusic.src = playlist[currentTrackIndex];

        // Jeśli gracz nie wyciszył muzyki, odpalamy kolejny utwór
        if (!isMuted) {
                bgMusic.play().catch(err => console.log("Autoplay block na kolejnym utworze:", err));
        }

        // NAPRAWIONO: Zmiana z nieistniejącego currentSongIndex na prawidłowy currentTrackIndex
        localStorage.setItem('clicker_current_song_index', currentTrackIndex);
}

bgMusic.onended = playNextTrack;

// Funkcja próbująca odpalić muzykę domyślnie
function tryAutoplay() {
        if (isMuted) return;
        bgMusic.play().then(() => {
                window.removeEventListener('click', tryAutoplay);
        }).catch(() => {
                console.log("browser is blocking autoplay, you need to click");
        });
}

// Próba odpalenia od razu + zabezpieczenie na pierwszy klik w dowolne miejsce na stronie
window.addEventListener('click', tryAutoplay);

audioBtn.onclick = function (e) {
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
                maximumFractionDigits: 1// Maksymalnie jedna cyfra po przecinku (np. 1.5K zamiast 1.53K)
        }).format(num);
}

let gems = 0;

function updateGems() {
        gemCounter.innerHTML = `Gems : ${formatNumber(gems)}💎`

}

let gem_per_click = 1;
let lucky_gem_percentage = 3

function createFloatingText(x, y, amount, isLucky) {
        const textNode = document.createElement('div');

        // Przypisujemy odpowiednie klasy
        textNode.className = 'floating-text';
        if (isLucky) {
                textNode.classList.add('lucky-text');
        }

        // Ustalamy pozycję startową w miejscu kliknięcia myszy
        textNode.style.left = `${x}px`;
        textNode.style.top = `${y}px`;

        // Generujemy tekst (np. +1 lub +7)
        textNode.innerHTML = `+${formatNumber(amount)}`;

        // Wrzucamy do drzewa DOM gry
        document.body.appendChild(textNode);

        // Sanity Check: Usuwamy element po zakończeniu animacji, żeby nie zapchać RAMu
        setTimeout(() => {
                textNode.remove();
        }, 700);
}

const rockImg = document.querySelector('.GemRock img');

accRock.addEventListener('click', function (e) {
        // Force reflow trick for rock animation
        rockImg.classList.remove('rock-pop');
        void rockImg.offsetWidth;
        rockImg.classList.add('rock-pop');

        let gainedGems = 0;
        let isLucky = false;

        // NOWOŚĆ: Dynamiczne wyliczanie szansy i mnożnika na podstawie poziomu Rękawicy
        let gauntletLvl = shopUpgrades.lucky_gauntlet ? shopUpgrades.lucky_gauntlet.level : 0;

        let currentLuckyChance = lucky_gem_percentage + (gauntletLvl * 1);   // Bazowo 3% + 3% za każdy poziom
        let currentLuckyMultiplier = 5 + (gauntletLvl * 2);                 // Bazowo 7x + 2x za każdy poziom

        // Obliczanie nagrody i sprawdzanie trafienia krytycznego
        if ((Math.random() * 100) < currentLuckyChance) {
                gainedGems = gem_per_click * currentLuckyMultiplier;
                isLucky = true;
                console.log("Lucky gem strike!");
        } else {
                gainedGems = gem_per_click;
                console.log("Rock clicked");
        }

        // Apply global shop multiplier (Sharper Pickaxe)
        let clickMultiplier = Math.pow(shopUpgrades.sharper_pickaxe.multiplier, shopUpgrades.sharper_pickaxe.level);
        gainedGems *= clickMultiplier;

        gems += gainedGems;

        // Trigger FX effect
        createFloatingText(e.clientX, e.clientY, gainedGems, isLucky);
});


// Miner Upgrade
let upgrades = {
        miner: {
                baseCost: 15,
                cost: 15,
                efficiency: 0.1,
                level: 0,
                maxLevel: 100,
                milestones: { 10: 2, 25: 2, 50: 2, 100: 5 }
        },
        archer: {
                baseCost: 120,
                cost: 120,
                efficiency: 1.2,
                level: 0,
                maxLevel: 100,
                milestones: { 10: 2, 25: 2, 50: 2, 100: 5 }
        },
        knight: {
                baseCost: 1200,
                cost: 1200,
                efficiency: 14,
                level: 0,
                maxLevel: 100,
                milestones: { 10: 2, 25: 2, 50: 2, 100: 5 }
        },
        wizard: {
                baseCost: 15000,
                cost: 15000,
                efficiency: 180,
                level: 0,
                maxLevel: 100,
                milestones: { 10: 2, 25: 2, 50: 2, 100: 5 }
        },
        golem: {
                baseCost: 200000,
                cost: 200000,
                efficiency: 2600,
                level: 0,
                maxLevel: 100,
                milestones: { 10: 2, 25: 2, 50: 2, 100: 5 }
        },
        commander: {
                baseCost: 3000000,
                cost: 3000000,
                efficiency: 42000,
                level: 0,
                maxLevel: 100,
                milestones: { 10: 2, 25: 2, 50: 2, 100: 5 }
        },
};

// Generyczna funkcja aktualizująca UI dowolnego ulepszenia
function updateUpgradesUI() {
        // Słownik z oryginalnymi nazwami, które przywrócimy po odblokowaniu kafelka
        const upgradeNames = {
                miner: "Gem Miner ",
                archer: "Archidon ",
                knight: "Knight ",
                wizard: "Wizard Adept",
                golem: "Earth Golem",
                commander: "Lord Commander"
        };

        Object.keys(upgrades).forEach(key => {
                const up = upgrades[key];
                const upgradeContainer = document.querySelector(`.${key}-upgrades`);

                if (!upgradeContainer) return;

                const priceEl = upgradeContainer.querySelector(`.${key}-price`);
                const lvlEl = upgradeContainer.querySelector(`.${key}-lvl`);
                const btnEl = upgradeContainer.querySelector(`.${key}-upgrade`);

                // 1. Definiujemy twarde progi odblokowania
                let isUnlocked = true;
                if (key === 'archer' && upgrades.miner.level < 4) isUnlocked = false;
                if (key === 'knight' && (upgrades.miner.level < 4 || upgrades.archer.level < 9)) isUnlocked = false;
                if (key === 'wizard' && (upgrades.archer.level < 9 || upgrades.knight.level < 9)) isUnlocked = false;
                if (key === 'golem' && (upgrades.knight.level < 9 || upgrades.wizard.level < 9)) isUnlocked = false;
                if (key === 'commander' && (upgrades.wizard.level < 9 || upgrades.golem.level < 9)) isUnlocked = false;

                // 2. Egzekwujemy blokadę lub renderujemy pełne statystyki
                if (!isUnlocked) {
                        upgradeContainer.classList.add('locked-upgrade');
                        if (btnEl) {
                                btnEl.innerHTML = "???"; // Ukrywamy nazwę ulepszenia
                                btnEl.disabled = true;
                        }
                        if (lvlEl) lvlEl.innerHTML = "🔒"; // Sama czysta kłódka
                        if (priceEl) priceEl.innerHTML = `Price: ${formatNumber(up.cost)}$`; // Zostawiamy samą cenę
                } else {
                        upgradeContainer.classList.remove('locked-upgrade');
                        if (btnEl) btnEl.innerHTML = upgradeNames[key];

                        if (priceEl) priceEl.innerHTML = `Price: ${formatNumber(up.cost)}$`;

                        if (lvlEl) {
                                if (up.level === up.maxLevel) {
                                        lvlEl.innerHTML = `MAX LVL`;
                                } else {
                                        // POPRAWIONO: Zmieniono z up.level + 1 na up.level
                                        lvlEl.innerHTML = `Lvl: ${up.level}`;
                                }
                        }
                }

                // 3. Sprawdzanie czy gracza stać (tylko dla już odblokowanych ulepszeń)
                if (isUnlocked) {
                        if (gems >= up.cost && up.level < up.maxLevel) {
                                upgradeContainer.classList.remove('cant-afford');
                                upgradeContainer.classList.add('can-afford'); // NOWOŚĆ: Efekt dostępności
                                if (btnEl) btnEl.disabled = false;
                        } else {
                                upgradeContainer.classList.add('cant-afford');
                                upgradeContainer.classList.remove('can-afford');
                                if (btnEl) btnEl.disabled = true;
                        }
                } else {
                        // Dla zablokowanych usuwamy obie klasy
                        upgradeContainer.classList.remove('cant-afford');
                        upgradeContainer.classList.remove('can-afford');
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

                // NOWOŚĆ: Natychmiastowe odświeżenie całego interfejsu po zakupie jednostki
                updateGems();
                updateUpgradesUI();
                updateShopUI();
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

let shopUpgrades = {
        sharper_pickaxe: {
                name: "Sharper Pickaxe",
                desc: "Forges your pickaxes into devastating tools. Each level increases manual click gains by x2.",
                baseCost: 500,
                cost: 500,
                level: 0,
                maxLevel: 10,
                multiplier: 2,
                costGrowth: 3.0
        },
        miner_gear: {
                name: "Reinforced Drills",
                desc: "Equips your Miners with heavy-duty mining gear. Increases all Miner income by x2 per level.",
                baseCost: 800,
                cost: 800,
                level: 0,
                maxLevel: 10,
                multiplier: 2,
                costGrowth: 3.5
        },
        archer_training: {
                name: "Archer Training",
                desc: "Intensive tactical maneuvers. Increases the base income of all Archers by x2 per level.",
                baseCost: 4000,
                cost: 4000,
                level: 0,
                maxLevel: 10,
                multiplier: 2,
                costGrowth: 3.5
        },
        knight_armory: {
                name: "Valyrian Steel Forging",
                desc: "Blesses your Knights with legendary weaponry. Increases all Knight income by x2 per level.",
                baseCost: 45000,
                cost: 45000,
                level: 0,
                maxLevel: 10,
                multiplier: 2,
                costGrowth: 3.5
        },
        wizard_grimoire: {
                name: "Forbidden Grimoire",
                desc: "Unlocks ancient leyline magic spells. Increases all Wizard income by x2 per level.",
                baseCost: 550000,
                cost: 550000,
                level: 0,
                maxLevel: 10,
                multiplier: 2,
                costGrowth: 3.6
        },
        golem_core: {
                name: "Anima Cores",
                desc: "Overcharges Earth Golems with pure celestial energy. Increases Golem income by x2 per level.",
                baseCost: 7500000,
                cost: 7500000,
                level: 0,
                maxLevel: 10,
                multiplier: 2,
                costGrowth: 3.8
        },
        commander_tactic: {
                name: "Imperial Sovereignty",
                desc: "Absolute tactical command over the realm. Increases Lord Commander income by x2 per level.",
                baseCost: 110000000,
                cost: 110000000,
                level: 0,
                maxLevel: 10,
                multiplier: 2,
                costGrowth: 4.0
        },
        lucky_gauntlet: {
                name: "Gauntlet of Destiny",
                desc: "Infuses your clicks with fate. Each level increases Lucky Gem chance by +3% and raises its payout multiplier by +2x.",
                baseCost: 2500,
                cost: 2500,
                level: 0,
                maxLevel: 10,
                multiplier: 0,
                costGrowth: 3.8
        },
};
const storeTooltip = document.getElementById('store-tooltip');
let currentActiveTooltipKey = null;

function updateShopUI() {
        Object.keys(shopUpgrades).forEach(key => {
                const item = shopUpgrades[key];
                const el = document.querySelector(`.store-item[data-upgrade="${key}"]`);
                if (!el) return;

                const lvlEl = el.querySelector('.store-lvl');
                if (lvlEl) {
                        lvlEl.innerHTML = item.level === item.maxLevel ? "MAX" : item.level;
                }

                // Zarządzanie wizualnym stanem zamożności
                if (gems >= item.cost && item.level < item.maxLevel) {
                        el.classList.remove('cant-afford');
                        el.classList.add('can-afford'); // NOWOŚĆ: Efekt dostępności w sklepie
                } else {
                        el.classList.add('cant-afford');
                        el.classList.remove('can-afford');
                }
        });
}

function buyShopUpgrade(key) {
        const item = shopUpgrades[key];
        if (gems >= item.cost && item.level < item.maxLevel) {
                gems -= item.cost;
                item.level++;

                // Dynamiczne i zbalansowane skalowanie kosztu bazowane na parametrze costGrowth
                item.cost = Math.floor(item.baseCost * Math.pow(item.costGrowth, item.level));

                // NOWOŚĆ: Dodano updateUpgradesUI(), aby zsynchronizować oba panele w tym samym momencie
                updateGems();
                updateShopUI();
                updateUpgradesUI();

                if (currentActiveTooltipKey === key) updateTooltipText(key);
        }
}

function updateTooltipText(key) {
        const item = shopUpgrades[key];
        if (!item) return;

        storeTooltip.innerHTML = `
        <div class="tooltip-title">${item.name}</div>
        <div class="tooltip-desc">${item.desc}</div>
        <div class="tooltip-cost">${item.level === item.maxLevel ? "MAXIMUM LEVEL" : "Price: " + formatNumber(item.cost) + " 💎"}</div>
    `;
}

// Podpięcie detektorów ruchu myszy dla siatki sklepu
document.querySelectorAll('.store-item[data-upgrade]').forEach(el => {
        const key = el.getAttribute('data-upgrade');

        el.addEventListener('click', () => buyShopUpgrade(key));

        el.addEventListener('mouseenter', () => {
                currentActiveTooltipKey = key;
                updateTooltipText(key);
                storeTooltip.style.display = 'block';
        });

        el.addEventListener('mousemove', (e) => {
                // Pobieramy aktualne wymiary okienka tooltipu
                const tooltipWidth = storeTooltip.offsetWidth;
                const tooltipHeight = storeTooltip.offsetHeight;

                // Domyślna pozycja: na prawo i w dół od kursora
                let left = e.clientX + 15;
                let top = e.clientY + 15;

                // Inteligentna korekta PRAWEJ krawędzi ekranu
                if (left + tooltipWidth > window.innerWidth) {
                        left = e.clientX - tooltipWidth - 15; // przerzuć na lewą stronę kursora
                }

                // Inteligentna korekta DOLNEJ krawędzi ekranu
                if (top + tooltipHeight > window.innerHeight) {
                        top = e.clientY - tooltipHeight - 15; // przerzuć powyżej kursora
                }

                // Dodatkowe zabezpieczenie skrajnych przypadków (żeby nie uciekło w lewo/górę)
                if (left < 0) left = 10;
                if (top < 0) top = 10;

                // Aplikujemy wyliczone, bezpieczne współrzędne
                storeTooltip.style.left = left + 'px';
                storeTooltip.style.top = top + 'px';
        });

        el.addEventListener('mouseleave', () => {
                currentActiveTooltipKey = null;
                storeTooltip.style.display = 'none';
        });
});

function saveGameToFile() {
        const dataToSave = {
                gems: gems,
                currentTrackIndex: currentTrackIndex,
                isTutorialPassed: isTutorialPassed,
                upgrades: {},
                shopUpgrades: {}
        };

        Object.keys(upgrades).forEach(key => {
                dataToSave.upgrades[key] = {
                        level: upgrades[key].level,
                        cost: upgrades[key].cost,
                        efficiency: upgrades[key].efficiency
                };
        });

        Object.keys(shopUpgrades).forEach(key => {
                dataToSave.shopUpgrades[key] = {
                        level: shopUpgrades[key].level,
                        cost: shopUpgrades[key].cost
                };
        });

        const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "medieval_clicker_save.json";
        a.click();

        URL.revokeObjectURL(url);
        console.log("Save scroll has been generated!");
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
                        if (typeof loadedData.isTutorialPassed === "boolean") {
                                isTutorialPassed = loadedData.isTutorialPassed;
                                if (isTutorialPassed && tutorialOverlay) {
                                        tutorialOverlay.style.display = 'none';
                                        localStorage.setItem('clicker_tutorial_passed', 'true');
                                }
                        }
                        if (typeof loadedData.currentTrackIndex === "number") {
                                currentTrackIndex = loadedData.currentTrackIndex;
                                localStorage.setItem('clicker_current_song_index', currentTrackIndex);
                                if (typeof playTrack === "function") {
                                        playSong(currentTrackIndex);
                                }
                        }

                        // Słownik domyślnych wydajności dla resetowanych jednostek
                        const defaultEfficiencies = { miner: 0.1, archer: 1.2, knight: 14, wizard: 180, golem: 2600, commander: 42000 };

                        // POPRAWKA BOHATERÓW: Iterujemy po konfiguracji gry, a nie po pliku
                        Object.keys(upgrades).forEach(key => {
                                if (loadedData.upgrades && loadedData.upgrades[key] !== undefined) {
                                        // Istnieje w zapisie – wczytujemy standardowo
                                        upgrades[key].level = loadedData.upgrades[key].level;
                                        upgrades[key].cost = loadedData.upgrades[key].cost;
                                        upgrades[key].efficiency = loadedData.upgrades[key].efficiency !== undefined ? loadedData.upgrades[key].efficiency : defaultEfficiencies[key];
                                } else {
                                        // BRAK W STARYM ZAPISIE – bezwzględny reset do zera!
                                        upgrades[key].level = 0;
                                        upgrades[key].cost = upgrades[key].baseCost;
                                        upgrades[key].efficiency = defaultEfficiencies[key];
                                        console.log(`[Kompatybilność] Wykryto stary zapis. Zresetowano bohatera: ${key} do poziomu 0.`);
                                }
                        });

                        // POPRAWKA SKLEPU: Iterujemy po przedmiotach w grze
                        Object.keys(shopUpgrades).forEach(key => {
                                if (loadedData.shopUpgrades && loadedData.shopUpgrades[key] !== undefined) {
                                        // Istnieje w zapisie – wczytujemy
                                        shopUpgrades[key].level = loadedData.shopUpgrades[key].level;
                                        shopUpgrades[key].cost = loadedData.shopUpgrades[key].cost;
                                } else {
                                        // BRAK W STARYM ZAPISIE (np. nowa Rękawica lub Magowie) – ustawiamy na 0
                                        shopUpgrades[key].level = 0;
                                        shopUpgrades[key].cost = shopUpgrades[key].baseCost;
                                        console.log(`[Kompatybilność] Wykryto stary zapis. Zresetowano przedmiot sklepu: ${key} do poziomu 0.`);
                                }
                        });

                        console.log("Scroll read successfully! Game state updated.");

                        updateGems();
                        updateUpgradesUI();
                        updateShopUI();

                } catch (err) {
                        console.error("Magic failed! Save file is corrupted.", err);
                        alert("This scroll is tainted! It cannot be read.");
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
                let Miner_Income_multiplier_chance = 0;
                if (upgrades.archer.level >= 100) Miner_Income_multiplier_chance = 50;
                else if (upgrades.archer.level > 50) Miner_Income_multiplier_chance = 20;
                else if (upgrades.archer.level > 20) Miner_Income_multiplier_chance = 10;
                else if (upgrades.archer.level > 10) Miner_Income_multiplier_chance = 5;

                let globalMinerMultiplier = 1;
                if (upgrades.archer.level >= 10 && Math.random() * 100 < Miner_Income_multiplier_chance) {
                        globalMinerMultiplier = 2;
                        console.log("Lucky Mine! All miner income x2");
                }

                // Process income for all units
                Object.keys(upgrades).forEach(key => {
                        const up = upgrades[key];
                        let income = up.level * up.efficiency;

                        // Apply the special Archer event multiplier to Miners
                        if (key === 'miner') {
                                income *= globalMinerMultiplier;
                        }

                        // Map standard upgrades to their corresponding shop item key
                        let shopKey = null;
                        if (key === 'miner') shopKey = 'miner_gear';
                        else if (key === 'archer') shopKey = 'archer_training';
                        else if (key === 'knight') shopKey = 'knight_armory';
                        else if (key === 'wizard') shopKey = 'wizard_grimoire';
                        else if (key === 'golem') shopKey = 'golem_core';
                        else if (key === 'commander') shopKey = 'commander_tactic';

                        // Calculate and inject the shop item's exponential scaling multiplier factor
                        if (shopKey && shopUpgrades[shopKey]) {
                                let shopMultiplier = Math.pow(shopUpgrades[shopKey].multiplier, shopUpgrades[shopKey].level);
                                income *= shopMultiplier;
                        }

                        gems += income;
                });

                accumulatedTime -= 1000;
        }

        requestAnimationFrame(gameLoop);
        updateGems();
        updateUpgradesUI();
        updateShopUI();
}

// Pierwsze odpalenie pętli
requestAnimationFrame(gameLoop);



const tutorialSteps = [
        "Sigh... Well, someone finally showed up. Listen closely, lad, because I won't repeat myself.",
        "This massive rock before you hides Magic Gems. Try to CLICK it to chip off your first piece!",
        "With the gems you earn, you can hire helpers in the panel on the right. See those hidden scrolls with question marks ???",
        "Once your first Miner reaches level 5, you will unlock the next heroes: the Archer and the Knight.",
        "Strange things happen in this mine too... Sometimes a strike triggers a lucky find, granting you a big bonus!",
        "Alright, time to get to work. Click the rock and rebuild the glory of our kingdom!"
];

let currentStep = 0;
const tutorialOverlay = document.getElementById('tutorial-overlay');
const tutorialText = document.getElementById('tutorial-text');

// Sanity check pamięci podręcznej przy starcie strony
let isTutorialPassed = localStorage.getItem('clicker_tutorial_passed') === 'true';

if (tutorialOverlay && tutorialText) {
        // Jeśli gracz już przeszedł tutorial wcześniej, ukrywamy okno natychmiast
        if (isTutorialPassed) {
                tutorialOverlay.style.display = 'none';
        }

        tutorialOverlay.addEventListener('click', () => {
                currentStep++;

                if (currentStep < tutorialSteps.length) {
                        tutorialText.innerHTML = tutorialSteps[currentStep];
                } else {
                        // Koniec dialogów - ustawiamy flagi zapisu
                        isTutorialPassed = true;
                        localStorage.setItem('clicker_tutorial_passed', 'true');

                        tutorialOverlay.style.opacity = '0';
                        setTimeout(() => {
                                tutorialOverlay.style.display = 'none';
                        }, 300);
                }
        });
}

function silentSave() {
        const dataToSave = {
                gems: gems,
                currentTrackIndex: currentTrackIndex,
                isTutorialPassed: isTutorialPassed,
                upgrades: {},
                shopUpgrades: {}
        };

        Object.keys(upgrades).forEach(key => {
                dataToSave.upgrades[key] = {
                        level: upgrades[key].level,
                        cost: upgrades[key].cost,
                        efficiency: upgrades[key].efficiency
                };
        });

        Object.keys(shopUpgrades).forEach(key => {
                dataToSave.shopUpgrades[key] = {
                        level: shopUpgrades[key].level,
                        cost: shopUpgrades[key].cost
                };
        });

        localStorage.setItem('medieval_clicker_autosave', JSON.stringify(dataToSave));
        console.log("🛡️ Autosave completed successfully.");
}

setInterval(silentSave, 10000);

function silentLoad() {
        const savedData = localStorage.getItem('medieval_clicker_autosave');
        if (savedData) {
                try {
                        const parsed = JSON.parse(savedData);
                        gems = parsed.gems;

                        const defaultEfficiencies = { miner: 0.1, archer: 1.2, knight: 14, wizard: 180, golem: 2600, commander: 42000 };

                        // Wymuszenie czyszczenia struktur bohaterów na podstawie konfiguracji gry
                        Object.keys(upgrades).forEach(key => {
                                if (parsed.upgrades && parsed.upgrades[key] !== undefined) {
                                        upgrades[key].level = parsed.upgrades[key].level;
                                        upgrades[key].cost = parsed.upgrades[key].cost;
                                        upgrades[key].efficiency = parsed.upgrades[key].efficiency !== undefined ? parsed.upgrades[key].efficiency : defaultEfficiencies[key];
                                } else {
                                        upgrades[key].level = 0;
                                        upgrades[key].cost = upgrades[key].baseCost;
                                        upgrades[key].efficiency = defaultEfficiencies[key];
                                }
                        });

                        // Wymuszenie czyszczenia struktur sklepu na podstawie konfiguracji gry
                        Object.keys(shopUpgrades).forEach(key => {
                                if (parsed.shopUpgrades && parsed.shopUpgrades[key] !== undefined) {
                                        shopUpgrades[key].level = parsed.shopUpgrades[key].level;
                                        shopUpgrades[key].cost = parsed.shopUpgrades[key].cost;
                                } else {
                                        shopUpgrades[key].level = 0;
                                        shopUpgrades[key].cost = shopUpgrades[key].baseCost;
                                }
                        });
                        if (upgrades.miner.level < 4) { upgrades.archer.level = 0; upgrades.archer.cost = upgrades.archer.baseCost; }
                        if (upgrades.archer.level < 9) { upgrades.knight.level = 0; upgrades.knight.cost = upgrades.knight.baseCost; }
                        if (upgrades.knight.level < 9) { upgrades.wizard.level = 0; upgrades.wizard.cost = upgrades.wizard.baseCost; }
                        if (upgrades.wizard.level < 9) { upgrades.golem.level = 0; upgrades.golem.cost = upgrades.golem.baseCost; }
                        if (upgrades.golem.level < 9) { upgrades.commander.level = 0; upgrades.commander.cost = upgrades.commander.baseCost; }
                        
                        if (typeof updateGems === 'function') updateGems();
                        if (typeof updateUpgradesUI === 'function') updateUpgradesUI();
                        if (typeof updateShopUI === 'function') updateShopUI();

                        console.log("Backup Loaded Successfully.");
                } catch (e) {
                        console.error("Backup loading failed", e);
                }
        }
}

silentLoad();