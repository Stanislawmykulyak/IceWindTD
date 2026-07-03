const accRock = document.getElementById('entire-rock');
const gemCounter = document.querySelector('.gem-counter');

const playlist = [
        'media/Music/BG-Music-DeusLover.mp3',
        'media/Music/BG-Music-DeusLover-2.mp3',
        'media/Music/BG-Music-DeusLover-3.mp3',
        'media/Music/BG-Music-DeusLover-4.mp3',
        'media/Music/BG-Music-DeusLover-5.mp3'
];
let savedSongIndex = localStorage.getItem('clicker_current_song_index');
let currentTrackIndex;

if (savedSongIndex !== null) {
        currentTrackIndex = parseInt(savedSongIndex, 10);
} else {
        currentTrackIndex = Math.floor(Math.random() * playlist.length);
        localStorage.setItem('clicker_current_song_index', currentTrackIndex);
}
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
        localStorage.setItem('clicker_current_song_index', currentTrackIndex);
}

bgMusic.onended = playNextTrack;

function tryAutoplay() {
        if (isMuted) return;
        bgMusic.play().then(() => {
                window.removeEventListener('click', tryAutoplay);
        }).catch(() => {

        });
}

window.addEventListener('click', tryAutoplay);

if (audioBtn) {
        audioBtn.onclick = function (e) {
                e.stopPropagation();
                if (bgMusic.paused) {
                        bgMusic.play();
                        audioBtn.innerHTML = "🔊 Music: ON";
                        audioBtn.style.borderColor = "#475569";
                        isMuted = false;
                } else {
                        bgMusic.pause();
                        audioBtn.innerHTML = "🔇 Music: OFF";
                        audioBtn.style.borderColor = "#991b1b";
                        isMuted = true;
                }
        };
}

let globalMissionCooldownEnd = 0;
let rerollCooldownEnd = 0;


function formatNumber(num) {
        if (num === 0) return "0";
        if (num < 1000) {
                return num % 1 === 0 ? num.toString() : num.toFixed(1);
        }
        const suffixes = ["", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
        const i = Math.floor(Math.log10(num) / 3);
        if (i >= suffixes.length) {
                return num.toExponential(2);
        }
        const formatted = (num / Math.pow(10, i * 3)).toFixed(1);
        return formatted.replace(/\.0$/, '') + suffixes[i];
}

// Zmienne odpowiedzialne za stan waluty i permanentne blokady
let gems = 0;
let isTavernUnlocked = false;
let isAltarUnlocked = false;

let crystals_bought = 0;

let factionMultipliers = {
        miner: 1.0,
        quarry: 1.0,
        catapult: 1.0,
        iron_hammers: 1.0,
        mine_inspector: 1.0,
        runic_golem: 1.0,
        alchemic: 1.0,
        earth_mage: 1.0,
        deep_shaft: 1.0,
        gem_tower: 1.0
};
let activeCrisis = null;
let crisisTimerId = null;
let crisisCheckIntervalId = null;
let hasSeenCrisisTutorial = localStorage.getItem('hasSeenCrisisTutorial') === 'true';

function updateGems() {
        if (gemCounter) gemCounter.innerHTML = `Gems : ${formatNumber(gems)}💎`;
}

let gem_per_click = 1;
let lucky_gem_percentage = 3;

function createFloatingText(x, y, amount, isLucky) {
        const textNode = document.createElement('div');
        textNode.className = 'floating-text';
        if (isLucky) {
                textNode.classList.add('lucky-text');
        }
        textNode.style.left = `${x}px`;
        textNode.style.top = `${y}px`;
        textNode.innerHTML = `+${formatNumber(amount)}`;
        document.body.appendChild(textNode);
        setTimeout(() => { textNode.remove(); }, 700);
}

function getQuarryGPS() {
        let baseProduction = upgrades.quarry.level * 10; // Zmienione z gameState.quarryCount

        if (crystalPerks.quarry[0].unlocked) {
                baseProduction *= 1.25;
        }

        if (crystalPerks.miner[2].unlocked) {
                let bonus = 1 + (upgrades.miner.level * 0.01); // Zmienione z gameState.minerCount
                baseProduction *= bonus;
        }

        return baseProduction;
}
function getMissionDuration(baseDuration) {
        let duration = baseDuration;
        if (crystalPerks.miner[0].unlocked) {
                duration *= 0.90;
        }
        return duration;
}

function getCatapultCost() {
        let baseCost = 50000; // Twój algorytm skalowania kosztu katapulty

        // Perk 3 dla Quarry: -10% kosztu Katapult
        if (crystalPerks.quarry[2].unlocked) {
                baseCost *= 0.90;
        }
        return baseCost;
}

function handleRockClick() {
        let baseCritChance = 0.05; // standardowo 5% szansy

        // Perk 2 dla Minera: +3% szansy na kryta
        if (crystalPerks.miner[1].unlocked) {
                baseCritChance += 0.03;
        }

        // Reszta Twojej logiki kliknięcia losująca kryta...
}

function renderAllPerks() {
        const crystalShopCounter = document.getElementById('crystal-shop-count');
        if (crystalShopCounter) crystalShopCounter.innerText = `Crystals: ${formatWithSuffix(magicalCrystals)} 🔮`;

        const crystalTooltip = document.getElementById('upgrade-tooltip');

        const upgradeIcons = {
                miner: "media/miner-upgrade.png",
                quarry: "media/quarry-upgrade.png",
                catapult: "media/catapult-upgrade.jpg",
                iron_hammer: "media/iron-hammers.png",
                mine_inspector: "media/mine-inspector.png",
                runic_golem: "media/runic-golem.png",
                alchemic: "media/alchemic-upgrade.jpg",
                earth_mage: "media/earth-mage.png",
                deep_shaft: "media/deep-shaft.png",
                gem_tower: "media/gem-tower.png"
        };

        for (let unit in crystalPerks) {
                let container = document.getElementById(`perks-${unit}`);
                if (!container) continue;

                container.innerHTML = ""; // Czyszczenie starego kontenera

                crystalPerks[unit].forEach((perk, index) => {
                        // Tworzenie kwadratowego przycisku perku
                        let btn = document.createElement("button");
                        btn.className = `crystal-perk-card ${perk.unlocked ? 'unlocked' : ''}`;

                        // Wstrzykiwanie obrazka (tymczasowo ikona struktury) oraz wskaźnika poziomu/odblokowania
                        btn.innerHTML = `
                                <img src="${upgradeIcons[unit] || 'media/miner-upgrade.png'}" class="perk-card-img" alt="${perk.name}">
                                <div class="perk-card-status">${perk.unlocked ? "✓" : (index + 1)}</div>
                        `;

                        // Akcja po kliknięciu (zakup perku)
                        if (!perk.unlocked) {
                                btn.onclick = (e) => {
                                        e.stopPropagation();
                                        buyCrystalPerk(unit, index);
                                };
                        }

                        // Obsługa zaawansowanego tooltipu Crystal Shop
                        btn.addEventListener('mouseenter', () => {
                                if (crystalTooltip) {
                                        crystalTooltip.innerHTML = `
                        <div class="tooltip-header">🔮 ${perk.name}</div>
                        <div class="tooltip-body">${perk.desc}</div>
                        <div class="tooltip-footer">
                                <span style="color: #94a3b8;">Status:</span>
                                ${perk.unlocked
                                                        ? '<span class="tooltip-status-unlocked">✨ ODBLOKOWANO</span>'
                                                        : `<span class="tooltip-status-locked">Koszt: ${perk.cost} 🔮</span>`
                                                }
                        </div>
                `;
                                        crystalTooltip.style.display = 'block';
                                }
                        });

                        // ZNAJDŹ I ZAMIEŃ BLOK 'mousemove':
                        btn.addEventListener('mousemove', (e) => {
                                if (!crystalTooltip) return;
                                let left = e.clientX + 15;
                                let top = e.clientY + 15;
                                if (left + crystalTooltip.offsetWidth > window.innerWidth) left = e.clientX - crystalTooltip.offsetWidth - 15;
                                if (top + crystalTooltip.offsetHeight > window.innerHeight) top = e.clientY - crystalTooltip.offsetHeight - 15;
                                crystalTooltip.style.left = left + 'px';
                                crystalTooltip.style.top = top + 'px';
                        });

                        // ZNAJDŹ I ZAMIEŃ BLOK 'mouseleave':
                        btn.addEventListener('mouseleave', () => {
                                if (crystalTooltip) crystalTooltip.style.display = 'none';
                        });

                        container.appendChild(btn);
                });
        }
}

function buyCrystalPerk(unit, index) {
        let perk = crystalPerks[unit][index];

        // FIX: Zamiana undefined gameState na właściwe zmienne globalne i poprawne odświeżanie UI
        if (magicalCrystals >= perk.cost && !perk.unlocked) {
                magicalCrystals -= perk.cost;
                perk.unlocked = true;

                // Odświeżamy widok ołtarza, walut oraz siatki umiejętności
                updateAltarUI();
                renderAllPerks();

                // Aktualizacja tooltipu po zakupie, żeby natychmiast pokazał stan "ODBLOKOWANO"
                const crystalTooltip = document.getElementById('upgrade-tooltip');
                if (crystalTooltip) {
                        crystalTooltip.innerHTML = `
                <div class="tooltip-header">🔮 ${perk.name}</div>
                <div class="tooltip-body">${perk.desc}</div>
                <div class="tooltip-footer">
                        <span style="color: #94a3b8;">Status:</span>
                        <span class="tooltip-status-unlocked">✨ ODBLOKOWANO</span>
                </div>
        `;
                }

        } else if (perk.unlocked) {
                alert("Ten talent jest już odblokowany!");
        } else {
                alert("Nie masz wystarczającej liczby Magicznych Kryształów!");
        }
}

const rockImg = document.querySelector('.GemRock img');

if (accRock) {
        accRock.addEventListener('click', function (e) {
                if (rockImg) {
                        rockImg.classList.remove('rock-pop');
                        void rockImg.offsetWidth;
                        rockImg.classList.add('rock-pop');
                }

                let gainedGems = 0;
                let isLucky = false;
                let gauntletLvl = shopUpgrades.lucky_gauntlet ? shopUpgrades.lucky_gauntlet.level : 0;
                let currentLuckyChance = lucky_gem_percentage + (gauntletLvl * 1);
                if (crystalPerks.miner[1].unlocked) {
                        currentLuckyChance += 3; // +3% szansy na kryta
                }
                let currentLuckyMultiplier = 5 + (gauntletLvl * 2);

                if ((Math.random() * 100) < currentLuckyChance) {
                        gainedGems = gem_per_click * currentLuckyMultiplier;
                        isLucky = true;

                } else {
                        gainedGems = gem_per_click;
                }

                let clickMultiplier = Math.pow(shopUpgrades.sharper_pickaxe.multiplier, shopUpgrades.sharper_pickaxe.level);
                gainedGems *= clickMultiplier;
                gems += gainedGems;

                createFloatingText(e.clientX, e.clientY, gainedGems, isLucky);
        });
}
let crystalPerks = {
        miner: [
                { id: "miner_p1", name: "Szybkie Buty", cost: 3, unlocked: false, desc: "Skraca bazowy czas wszystkich misji w Karczmie o 10%." },
                { id: "miner_p2", name: "Szczęśliwy Kilof", cost: 7, unlocked: false, desc: "Zwiększa szansę na krytyczne kliknięcie o 3%." },
                { id: "miner_p3", name: "Górniczy Sojusz", cost: 15, unlocked: false, desc: "Każdy poziom Minera zwiększa produkcję Quarry o 1%." }
        ],
        quarry: [
                { id: "quarry_p1", name: "Głębokie Odkrywki", cost: 5, unlocked: false, desc: "Zwiększa produkcję Quarry o 25%." },
                { id: "quarry_p2", name: "Kamienny Pancerz", cost: 10, unlocked: false, desc: "Zwiększa zyski Gems z misji typu 'Walka/Obrona' o 20%." },
                { id: "quarry_p3", name: "Optymalizacja Masowa", cost: 20, unlocked: false, desc: "Zmniejsza koszt zakupu Catapult o 10%." }
        ],
        catapult: [
                { id: "catapult_p1", name: "Dłuższy Zasięg", cost: 8, unlocked: false, desc: "Zwiększa produkcję Catapult o 30%." },
                { id: "catapult_p2", name: "Wsparcie Artylerii", cost: 15, unlocked: false, desc: "Misje w Karczmie trwają o 15% krócej, jeśli przypiszesz min. 1 Katapultę." },
                { id: "catapult_p3", name: "Grad Kamieni", cost: 30, unlocked: false, desc: "Odblokowuje aktywną umiejętność (Zrzut głazów raz na 5 min)." }
        ],
        iron_hammer: [
                { id: "iron_hammer_p1", name: "Kowalska Precyzja", cost: 10, unlocked: false, desc: "Zwiększa produkcję Iron Hammer o 25%." },
                { id: "iron_hammer_p2", name: "Zbrojna Eskorta", cost: 18, unlocked: false, desc: "Zmniejsza koszt odświeżenia tablicy misji (Reroll) o 50%." },
                { id: "iron_hammer_p3", name: "Hartowanie Stali", cost: 35, unlocked: false, desc: "Każdy posiadany Iron Hammer zwiększa Twoją siłę kliknięcia o +5 Gems." }
        ],
        mine_inspector: [
                { id: "mine_inspector_p1", name: "Srogie Oko", cost: 15, unlocked: false, desc: "Zwiększa efektywność Minerów i Quarry o dodatkowe 10%." },
                { id: "mine_inspector_p2", name: "Biurokracja", cost: 25, unlocked: false, desc: "Zwiększa nagrody Gems ze wszystkich misji o 20%." },
                { id: "mine_inspector_p3", name: "Audyt Efektywności", cost: 50, unlocked: false, desc: "Zmniejsza bazowy koszt kolejnych poziomów Mine Inspector o 15%." }
        ]
};

let upgrades = {
        miner: { baseCost: 15, cost: 15, efficiency: 0.1, level: 0, maxLevel: 100, milestones: { 10: 2, 25: 2, 50: 2, 100: 5 } },
        quarry: { baseCost: 100, cost: 100, efficiency: 1, level: 0, maxLevel: 100, milestones: { 10: 2, 25: 2, 50: 2, 100: 5 } },
        catapult: { baseCost: 1100, cost: 1100, efficiency: 8, level: 0, maxLevel: 100, milestones: { 10: 2, 25: 2, 50: 2, 100: 5 } },
        iron_hammers: { baseCost: 12000, cost: 12000, efficiency: 47, level: 0, maxLevel: 100, milestones: { 10: 2, 25: 2, 50: 2, 100: 5 } },
        mine_inspector: { baseCost: 130000, cost: 130000, efficiency: 260, level: 0, maxLevel: 100, milestones: { 10: 2, 25: 2, 50: 2, 100: 5 } },
        runic_golem: { baseCost: 1400000, cost: 1400000, efficiency: 1400, level: 0, maxLevel: 100, milestones: { 10: 2, 25: 2, 50: 2, 100: 5 } },
        alchemic: { baseCost: 20000000, cost: 20000000, efficiency: 7800, level: 0, maxLevel: 100, milestones: { 10: 2, 25: 2, 50: 2, 100: 5 } },
        earth_mage: { baseCost: 330000000, cost: 330000000, efficiency: 44000, level: 0, maxLevel: 100, milestones: { 10: 2, 25: 2, 50: 2, 100: 5 } },
        deep_shaft: { baseCost: 5100000000, cost: 5100000000, efficiency: 260000, level: 0, maxLevel: 100, milestones: { 10: 2, 25: 2, 50: 2, 100: 5 } },
        gem_tower: { baseCost: 75000000000, cost: 75000000000, efficiency: 1600000, level: 0, maxLevel: 100, milestones: { 10: 2, 25: 2, 50: 2, 100: 5 } }
};

let shopUpgrades = {
        sharper_pickaxe: { name: "Mithril Pickaxe", desc: "Each level doubles manual click power (x2).", baseCost: 150, cost: 150, level: 0, maxLevel: 10, multiplier: 2, costGrowth: 2.5 },
        miner_gear: { name: "Reinforced Shovels", desc: "Doubles Miner efficiency (x2).", baseCost: 500, cost: 500, level: 0, maxLevel: 10, multiplier: 2, costGrowth: 2.8 },
        quarry_gear: { name: "Black Powder Blasting", desc: "Doubles Quarry yield (x2).", baseCost: 3000, cost: 3000, level: 0, maxLevel: 10, multiplier: 2, costGrowth: 3.0 },
        catapult_gear: { name: "Heavy Steel Winches", desc: "Catapult yield x2.", baseCost: 15000, cost: 15000, level: 0, maxLevel: 10, multiplier: 2, costGrowth: 3.2 },
        iron_hammers_gear: { name: "Hardened Steel Anvils", desc: "Iron Hammer Order yield x2.", baseCost: 85000, cost: 85000, level: 0, maxLevel: 10, multiplier: 2, costGrowth: 3.4 },
        inspector_gear: { name: "Iron Discipline", desc: "Mine Inspector yield x2.", baseCost: 450000, cost: 450000, level: 0, maxLevel: 10, multiplier: 2, costGrowth: 3.5 },
        golem_gear: { name: "Earth-Core Infusion", desc: "Runic Golem yield x2.", baseCost: 2500000, cost: 2500000, level: 0, maxLevel: 10, multiplier: 2, costGrowth: 3.6 },
        alchemic_gear: { name: "Acidic Dissolution", desc: "Alchemic yield x2.", baseCost: 15000000, cost: 15000000, level: 0, maxLevel: 10, multiplier: 2, costGrowth: 3.7 },
        earth_mage_gear: { name: "Resonance Crystals", desc: "Earth Mage yield x2.", baseCost: 90000000, cost: 90000000, level: 0, maxLevel: 10, multiplier: 2, costGrowth: 3.8 },
        deep_shaft_gear: { name: "Reinforced Pulley Cables", desc: "Deep Shaft yield x2.", baseCost: 550000000, cost: 550000000, level: 0, maxLevel: 10, multiplier: 2, costGrowth: 3.9 },
        gem_tower_gear: { name: "Prismatic Lenses", desc: "Gem Tower yield x2.", baseCost: 4000000000, cost: 4000000000, level: 0, maxLevel: 10, multiplier: 2, costGrowth: 4.0 },
        lucky_gauntlet: { name: "Prospector's Charm", desc: "Grants +3% Critical Shard chance and +2x value.", baseCost: 1000, cost: 1000, level: 0, maxLevel: 10, multiplier: 0, costGrowth: 3.5 }
};

function toggleMuteSettings() {
        isMuted = !isMuted;
        bgMusic.muted = isMuted;
        const muteBtn = document.getElementById('settings-mute-btn');
        if (muteBtn) {
                muteBtn.innerText = isMuted ? "Włącz Muzykę 🔊" : "Wycisz Muzykę 🔇";
        }
        localStorage.setItem('clicker_muted', isMuted ? 'true' : 'false');
}

function nextTrackSettings() {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        bgMusic.src = playlist[currentTrackIndex];
        if (!isMuted) bgMusic.play().catch(() => { });
        localStorage.setItem('clicker_current_song_index', currentTrackIndex);
}

function resetProgress() {
        if (confirm("⚠️ CZY NA PEWNO CHCESZ ZRESETOWAĆ POSTĘP?\n\nStracisz wszystko. Tej operacji NIE MOŻNA cofnąć.")) {
                if (confirm("🔥 OSTATECZNE OSTRZEŻENIE 🔥\n\nCzy na pewno kontynuować?")) {
                        localStorage.removeItem('medieval_clicker_autosave');
                        localStorage.removeItem('clicker_tutorial_passed');
                        localStorage.removeItem('clicker_current_song_index');
                        location.reload();
                }
        }
}

function updateUpgradesUI() {
        const upgradeNames = {
                miner: "Miner", quarry: "Quarry", catapult: "Catapult",
                iron_hammers: "Iron Hammer Order", mine_inspector: "Mine Inspector",
                runic_golem: "Runic Golem", alchemic: "Alchemic",
                earth_mage: "Earth Mage", deep_shaft: "Deep Shaft", gem_tower: "Gem Tower"
        };

        // Opisy wyjaśniające, co robi dane ulepszenie
        const upgradeDescriptions = {
                miner: "Workers mining gems from deep underground",
                quarry: "Kamieniołom odkrywkowy zwiększający wydobycie.",
                catapult: "Miotacz głazów kruszący całe sekcje skalne.",
                iron_hammers: "Zakon młotów rozbijający najtwardsze klastry.",
                mine_inspector: "Zwiększa dyscyplinę i optymalizuje normy.",
                runic_golem: "Starożytny strażnik napędzany energią ziemi.",
                alchemic: "Transmutuje pospolity kamień w czyste klejnoty.",
                earth_mage: "Wywołuje rezonans sejsmiczny w głębokich żyłach.",
                deep_shaft: "Gigantyczny pionowy wind-szyb kopalniany.",
                gem_tower: "Wieża pryzmatyczna skupiająca czyste światło krystaliczne."
        };

        Object.keys(upgrades).forEach(key => {
                const up = upgrades[key];
                let calculatedCost = up.cost;

                // Zniżka z perku: -10% kosztu Katapult
                if (key === 'catapult' && crystalPerks.quarry[2].unlocked) {
                        calculatedCost = Math.floor(calculatedCost * 0.90);
                }
                const upgradeContainer = document.querySelector(`.${key}-upgrades`);
                if (!upgradeContainer) return;

                const priceEl = upgradeContainer.querySelector(`.${key}-price`);
                const lvlEl = upgradeContainer.querySelector(`.${key}-lvl`);
                const btnEl = upgradeContainer.querySelector(`.${key}-upgrade`);

                // Dynamiczne tworzenie opisu pod przyciskiem (Układ kolumnowy wewnątrz wiersza)
                // Kalkulacja realnej produkcji pojedynczej jednostki (uwzględnia Sklep i Perki)
                let shopKey = key === 'miner' ? 'miner_gear' : key === 'quarry' ? 'quarry_gear' : key === 'catapult' ? 'catapult_gear' : `${key}_gear`;
                if (key === 'mine_inspector') shopKey = 'inspector_gear';
                if (key === 'iron_hammers') shopKey = 'iron_hammers_gear';
                if (key === 'runic_golem') shopKey = 'golem_gear';

                let perkMultiplier = 1;
                if (key === 'quarry') {
                        if (crystalPerks.quarry[0].unlocked) perkMultiplier *= 1.25;
                        if (crystalPerks.miner[2].unlocked) perkMultiplier *= (1 + upgrades.miner.level * 0.01);
                }
                if (key === 'catapult' && crystalPerks.catapult[0].unlocked) perkMultiplier *= 1.30;
                if (key === 'iron_hammers' && crystalPerks.iron_hammer[0].unlocked) perkMultiplier *= 1.25;
                if (crystalPerks.mine_inspector[0].unlocked && (key === 'miner' || key === 'quarry')) perkMultiplier *= 1.10;

                let shopMultiplier = Math.pow(shopUpgrades[shopKey]?.multiplier || 1, shopUpgrades[shopKey]?.level || 0);
                let currentSingleEfficiency = up.efficiency * shopMultiplier * perkMultiplier;

                let isUnlocked = true;
                if (key === 'quarry' && upgrades.miner.level < 5) isUnlocked = false;
                if (key === 'catapult' && upgrades.miner.level < 5) isUnlocked = false;
                if (key === 'iron_hammers' && upgrades.catapult.level < 9) isUnlocked = false;
                if (key === 'mine_inspector' && upgrades.iron_hammers.level < 9) isUnlocked = false;
                if (key === 'runic_golem' && upgrades.mine_inspector.level < 9) isUnlocked = false;
                if (key === 'alchemic' && upgrades.runic_golem.level < 9) isUnlocked = false;
                if (key === 'earth_mage' && upgrades.alchemic.level < 9) isUnlocked = false;
                if (key === 'deep_shaft' && upgrades.earth_mage.level < 9) isUnlocked = false;
                if (key === 'gem_tower' && upgrades.deep_shaft.level < 9) isUnlocked = false;

                if (!isUnlocked) {
                        upgradeContainer.classList.add('locked-upgrade');
                        if (btnEl) { btnEl.innerHTML = "???"; btnEl.disabled = true; }
                        if (lvlEl) lvlEl.innerHTML = "🔒";
                        if (priceEl) priceEl.innerHTML = `Price: ${formatNumber(calculatedCost)} 💎`;

                } else {
                        upgradeContainer.classList.remove('locked-upgrade');
                        if (btnEl) btnEl.innerHTML = upgradeNames[key];
                        if (priceEl) priceEl.innerHTML = `Price: ${formatNumber(calculatedCost)} 💎`;
                        if (lvlEl) lvlEl.innerHTML = up.level === up.maxLevel ? `MAX LVL` : `Lvl: ${up.level}`;

                }

                if (isUnlocked) {
                        if (gems >= calculatedCost && up.level < up.maxLevel) {
                                upgradeContainer.classList.remove('cant-afford');
                                upgradeContainer.classList.add('can-afford');
                                if (btnEl) btnEl.disabled = false;
                        } else {
                                upgradeContainer.classList.add('cant-afford');
                                upgradeContainer.classList.remove('can-afford');
                                if (btnEl) btnEl.disabled = true;
                        }
                }
        });
}

function buyUpgrade(upgradeKey) {
        const up = upgrades[upgradeKey];
        let isUnlocked = true;
        if (upgradeKey === 'quarry' && upgrades.miner.level < 5) isUnlocked = false;
        if (upgradeKey === 'catapult' && upgrades.miner.level < 5) isUnlocked = false;
        if (upgradeKey === 'iron_hammers' && upgrades.catapult.level < 5) isUnlocked = false;
        if (upgradeKey === 'mine_inspector' && upgrades.iron_hammers.level < 5) isUnlocked = false;
        if (upgradeKey === 'runic_golem' && upgrades.mine_inspector.level < 5) isUnlocked = false;
        if (upgradeKey === 'alchemic' && upgrades.runic_golem.level < 5) isUnlocked = false;
        if (upgradeKey === 'earth_mage' && upgrades.alchemic.level < 5) isUnlocked = false;
        if (upgradeKey === 'deep_shaft' && upgrades.earth_mage.level < 5) isUnlocked = false;
        if (upgradeKey === 'gem_tower' && upgrades.deep_shaft.level < 5) isUnlocked = false;

        if (!isUnlocked) return;

        let currentCost = up.cost;
        if (upgradeKey === 'catapult' && crystalPerks.quarry[2].unlocked) {
                currentCost = Math.floor(currentCost * 0.90);
        }

        if (gems >= currentCost && up.level < up.maxLevel) {
                gems -= currentCost;
                up.level++;
                if (up.milestones[up.level]) up.efficiency *= up.milestones[up.level];
                up.cost = Math.floor(up.baseCost * Math.pow(1.15, up.level));
                updateGems();
                updateUpgradesUI();
                updateShopUI();
        }

}

Object.keys(upgrades).forEach(key => {
        const container = document.querySelector(`.${key}-upgrades`);
        if (container) { container.onclick = () => buyUpgrade(key); }
});

// --- SKLEP I STRUKTURA PRZEDMIOTÓW ---
const storeTooltip = document.getElementById('store-tooltip');
let currentActiveTooltipKey = null;

function updateShopUI() {
        Object.keys(shopUpgrades).forEach(key => {
                const item = shopUpgrades[key];
                const el = document.querySelector(`.store-item[data-upgrade="${key}"]`);
                if (!el) return;
                const lvlEl = el.querySelector('.store-lvl');
                if (lvlEl) lvlEl.innerHTML = item.level === item.maxLevel ? "MAX" : item.level;
                if (gems >= item.cost && item.level < item.maxLevel) {
                        el.classList.remove('cant-afford'); el.classList.add('can-afford');
                } else {
                        el.classList.add('cant-afford'); el.classList.remove('can-afford');
                }
        });
}

function buyShopUpgrade(key) {
        const item = shopUpgrades[key];
        if (gems >= item.cost && item.level < item.maxLevel) {
                gems -= item.cost;
                item.level++;
                item.cost = Math.floor(item.baseCost * Math.pow(item.costGrowth, item.level));
                updateGems();
                updateShopUI();
                updateUpgradesUI();
                if (currentActiveTooltipKey === key) updateTooltipText(key);
        }
}

function updateTooltipText(key) {
        const item = shopUpgrades[key];
        if (!item || !storeTooltip) return;
        storeTooltip.innerHTML = `
        <div class="tooltip-title">${item.name}</div>
        <div class="tooltip-desc">${item.desc}</div>
        <div class="tooltip-cost">${item.level === item.maxLevel ? "MAXIMUM LEVEL" : "Price: " + formatNumber(item.cost) + " 💎"}</div>
    `;
}

document.querySelectorAll('.store-item[data-upgrade]').forEach(el => {
        const key = el.getAttribute('data-upgrade');
        el.addEventListener('click', () => buyShopUpgrade(key));
        el.addEventListener('mouseenter', () => {
                currentActiveTooltipKey = key; updateTooltipText(key);
                if (storeTooltip) storeTooltip.style.display = 'block';
        });
        el.addEventListener('mousemove', (e) => {
                if (!storeTooltip) return;
                let left = e.clientX + 15; let top = e.clientY + 15;
                if (left + storeTooltip.offsetWidth > window.innerWidth) left = e.clientX - storeTooltip.offsetWidth - 15;
                if (top + storeTooltip.offsetHeight > window.innerHeight) top = e.clientY - storeTooltip.offsetHeight - 15;
                storeTooltip.style.left = left + 'px'; storeTooltip.style.top = top + 'px';
        });
        el.addEventListener('mouseleave', () => {
                currentActiveTooltipKey = null; if (storeTooltip) storeTooltip.style.display = 'none';
        });
});

// --- SYSTEM OŁTARZA CRYSZTAŁÓW ---
let magicalCrystals = 0;
const baseCrystalCost = 1000000;
const costMultiplier = 1.5;

const crystalCountEl = document.getElementById('crystal-count');
const altarCore = document.getElementById('altar-core');
const altarOrb = altarCore ? altarCore.querySelector('.altar-orb') : null;
const btnTransmute1 = document.getElementById('btn-transmute-1');
const btnTransmuteAll = document.getElementById('btn-transmute-all');

function formatWithSuffix(value) {
        if (value < 1000) return value.toFixed(0);
        const suffixes = ["", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
        const i = Math.floor(Math.log10(value) / 3);
        return (value / Math.pow(10, i * 3)).toFixed(2) + suffixes[i];
}

function getNextCrystalCost() {
        return Math.floor(baseCrystalCost * Math.pow(costMultiplier, crystals_bought));
}

function getMaxCrystalsAffordable() {
        let currentGems = gems; let count = 0; let totalCost = 0; let tempCrystals = crystals_bought;
        while (true) {
                let nextCost = Math.floor(baseCrystalCost * Math.pow(costMultiplier, tempCrystals));
                if (currentGems >= nextCost) {
                        currentGems -= nextCost; totalCost += nextCost; tempCrystals++; count++;
                } else { break; }
        }
        return { amount: count, cost: totalCost };
}

function updateAltarUI() {
        if (crystalCountEl) crystalCountEl.innerText = formatWithSuffix(magicalCrystals);
        const nextCost = getNextCrystalCost();
        const costDisplayEl = document.getElementById('crystal-cost-display');
        if (costDisplayEl) costDisplayEl.innerText = formatWithSuffix(nextCost);

        if (btnTransmute1) btnTransmute1.disabled = gems < nextCost;
        const maxAffordable = getMaxCrystalsAffordable();
        if (btnTransmuteAll) {
                btnTransmuteAll.disabled = maxAffordable.amount <= 0;
                btnTransmuteAll.innerText = maxAffordable.amount > 0 ? `Transmute ALL (+${maxAffordable.amount})` : `Transmute ALL Possible`;
        }
}

function performRitual(crystalAmount, totalCost) {
        gems -= totalCost;
        magicalCrystals += crystalAmount;
        crystals_bought += crystalAmount;
        updateGems();
        updateAltarUI();

        let originalVolume = bgMusic.volume;
        if (!isMuted) bgMusic.volume = 0.1;

        if (altarCore && altarOrb) {
                altarCore.classList.add('altar-shake');
                altarOrb.classList.add('altar-blast');
        }
        for (let i = 0; i < 30; i++) { createAltarParticle(); }

        setTimeout(() => {
                if (altarCore && altarOrb) {
                        altarCore.classList.remove('altar-shake');
                        altarOrb.classList.remove('altar-blast');
                }
                if (!isMuted) bgMusic.volume = originalVolume;
                spawnCongratsModal(crystalAmount);
        }, 800);
}

const upgradeData = {
        'miner': {
                name: "Wykwalifikowany Górnik",
                desc: "Zatrudnia krasnoludzkiego górnika, który automatycznie wydobywa kryształy co sekundę."
        },
        'archer': {
                name: "Wsparcie Łuczników",
                desc: "Łucznicy ostrzeliwują skałę z dystansu, zwiększając pasywny przychód kryształów."
        },
        // Dodaj tutaj kolejne ulepszenia według schematu klasy (np. 'szaman', 'kilof' itp.)
        'default': {
                name: "Tajemnicze Ulepszenie",
                desc: "Zwiększa Twoją potęgę w magicznej kopalni."
        }
};
document.addEventListener("DOMContentLoaded", () => {
        const tooltip = document.getElementById("upgrade-tooltip");
        const titleEl = document.getElementById("tooltip-title");
        const costEl = document.getElementById("tooltip-cost-value");

        // Nasłuchujemy na kontenerze głównym (upgrades-panel)
        const panel = document.querySelector('.upgrades-panel');

        if (panel) {
                panel.addEventListener("mouseover", (e) => {
                        // Szukamy najbliższego elementu rodzica, który ma w klasie "-upgrades"
                        const target = e.target.closest('[class*="-upgrades"]');

                        if (target) {
                                // Wyciągamy typ (np. 'miner' z 'miner-upgrades')
                                const className = Array.from(target.classList).find(c => c.includes('-upgrades'));
                                const type = className ? className.replace('-upgrades', '') : 'default';

                                // Pobieramy dane
                                const data = upgradeData[type] || upgradeData['default'];
                                const priceText = target.querySelector('[class*="-price"]')?.textContent || "0";

                                // Ustawiamy treść
                                titleEl.textContent = data.name;
                                costEl.textContent = priceText;

                                // Pokazujemy
                                tooltip.style.display = "block";
                        }
                });

                panel.addEventListener("mousemove", (e) => {
                        tooltip.style.left = (e.clientX + 15) + "px";
                        tooltip.style.top = (e.clientY + 15) + "px";
                });

                panel.addEventListener("mouseout", (e) => {
                        if (e.target.closest('[class*="-upgrades"]')) {
                                tooltip.style.display = "none";
                        }
                });
        }
});
function createAltarParticle() {
        if (!altarCore) return;
        const p = document.createElement('div');
        p.style.position = 'fixed'; p.style.pointerEvents = 'none'; p.style.zIndex = '99999';
        const rect = altarCore.getBoundingClientRect();
        p.style.left = (rect.left + rect.width / 2) + 'px'; p.style.top = (rect.top + rect.height / 2) + 'px';
        p.innerText = Math.random() > 0.5 ? '✨' : '🔮';
        p.style.fontSize = (Math.random() * 20 + 10) + 'px';
        p.style.transition = 'all 0.8s cubic-bezier(0.1, 0.8, 0.3, 1)';
        document.body.appendChild(p);
        setTimeout(() => {
                const angle = Math.random() * Math.PI * 2; const dist = Math.random() * 160 + 60;
                p.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0)`;
                p.style.opacity = '0';
        }, 10);
        setTimeout(() => p.remove(), 800);
}

function spawnCongratsModal(amount) {
        const overlay = document.createElement('div');
        overlay.className = 'congrats-overlay';
        overlay.innerHTML = `
        <div class="congrats-banner">
            <h2 class="congrats-title">CONGRATS!</h2>
            <p class="congrats-subtitle">You manufactured <strong>${formatWithSuffix(amount)}</strong> Crystal${amount > 1 ? 's' : ''}! 🔮</p>
            <button class="btn-altar" id="btn-congrats-close">Claim Power</button>
        </div>
    `;
        document.body.appendChild(overlay);
        document.getElementById('btn-congrats-close').onclick = () => overlay.remove();
}

if (btnTransmute1) btnTransmute1.onclick = (e) => { e.stopPropagation(); const cost = getNextCrystalCost(); if (gems >= cost) performRitual(1, cost); };
if (btnTransmuteAll) btnTransmuteAll.onclick = (e) => { e.stopPropagation(); const max = getMaxCrystalsAffordable(); if (max.amount > 0) performRitual(max.amount, max.cost); };

// --- JEDYNY, ZAAWANSOWANY SYSTEM MISJI (Z ROTACJĄ I WYMAGANIAMI) ---

// Rozbudowana baza misji (16 pozycji) – mniejsza szansa na zasypanie tablicy legendami!
const allMissionsPool = [
        // --- ZWYKŁE (Kolor Niebieski) ---
        {
                title: "Zbieranie Odłamków",
                desc: "Przechesh jaskinie w poszukiwaniu drobnych kryształów porzuconych przez kilofy.",
                baseDuration: 45,
                gemMultiplier: 3,
                rarity: "Normal",
                requirements: { miner: 5 },
                maxUnits: 10
        },
        {
                title: "Naprawa Wagoników",
                desc: "Wagoniki transportowe torują drogę. Potrzebna konserwacja osi.",
                baseDuration: 60,
                gemMultiplier: 5,
                rarity: "Normal",
                requirements: { miner: 12 },
                maxUnits: 20
        },
        {
                title: "Oczyszczenie Kopalni",
                desc: "Wypędź potwory z dolnych poziomów, aby górnicy mogli bezpiecznie pracować.",
                baseDuration: 90,
                gemMultiplier: 8,
                rarity: "Normal",
                requirements: { iron_hammers: 4, mine_inspector: 1 },
                maxUnits: 15
        },

        // --- RZADKIE (Kolor Zielony) ---
        {
                title: "Eskorta Karawany",
                desc: "Zabezpiecz transport rzadkich kryształów do królewskiego zamku.",
                baseDuration: 180,
                gemMultiplier: 12,
                rarity: "Rare",
                requirements: { miner: 20, catapult: 3 },
                maxUnits: 30
        },
        {
                title: "Odzyskiwanie Zalanego Szybu",
                desc: "Wypompuj toksyczną wodę i uratuj uwięziony ciężki sprzęt.",
                baseDuration: 240,
                gemMultiplier: 20,
                rarity: "Rare",
                requirements: { mine_inspector: 5, quarry: 4 },
                maxUnits: 25
        },
        {
                title: "Obrona przed Goblinami",
                desc: "Zielonoskórzy próbują podkopać się pod nasz główny magazyn dynamitu.",
                baseDuration: 300,
                gemMultiplier: 35,
                rarity: "Rare",
                requirements: { catapult: 6, iron_hammers: 5 },
                maxUnits: 35
        },

        // --- EPICKIE (Kolor Fioletowy) ---
        {
                title: "Magiczne Przesilenie",
                desc: "Uaktywnuj i zabezpiecz niestabilny energetycznie starożytny rdzeń.",
                baseDuration: 600,
                gemMultiplier: 70,
                rarity: "Epic",
                requirements: { earth_mage: 4, runic_golem: 2 },
                maxUnits: 15
        },
        {
                title: "Wydobycie Żyły Mithrilu",
                desc: "Odkryto kieszeń powietrzną pełną czystego Mithrilu. Skała jest niezwykle twarda.",
                baseDuration: 900,
                gemMultiplier: 140,
                rarity: "Epic",
                requirements: { quarry: 15, iron_hammers: 12, runic_golem: 4 },
                maxUnits: 40
        },

        // --- MITYCZNE (Kolor Pomarańczowy) ---
        {
                title: "Rytuał Proroka Słońca",
                desc: "Magowie Ziemi muszą okiełznać podziemną magię, aby nasycić wieże nową energią.",
                baseDuration: 1800,
                gemMultiplier: 400,
                rarity: "Mythic",
                requirements: { earth_mage: 10, alchemic: 5, gem_tower: 2 },
                maxUnits: 25
        },
        {
                title: "Pieczęć Głębin",
                desc: "Pradawne zło próbuje przedostać się przez najniższy szyb. Zabarykaduj przejście.",
                baseDuration: 2400,
                gemMultiplier: 650,
                rarity: "Mythic",
                requirements: { deep_shaft: 5, runic_golem: 12, mine_inspector: 20 },
                maxUnits: 50
        },

        // --- LEGENDARNE (Kolor Złoty) ---
        {
                title: "Polowanie na Czerwonego Smoka",
                desc: "W najgłębszych jaskiniach zalęgła się bestia. Wyślij elitę militarno-górniczą.",
                baseDuration: 3600,
                gemMultiplier: 1200,
                rarity: "Legendary",
                requirements: { runic_golem: 15, iron_hammers: 35, gem_tower: 5 },
                maxUnits: 60
        },
        {
                title: "Przebudzenie Tytana Ziemi",
                desc: "Przebudź i okiełznaj potęgę kolosa, który śpi pod jądrem kopalni. Ekstremalny limit załogi!",
                baseDuration: 7200,
                gemMultiplier: 2200,
                rarity: "Legendary",
                requirements: { gem_tower: 12, deep_shaft: 10, runic_golem: 25 },
                maxUnits: 75
        },
        {
                title: "Kopanie Nowego Szybu",
                desc: "Rozszerzamy sieć korytarzy w poszukiwaniu świeżych żył mineralnych.",
                baseDuration: 30,
                gemMultiplier: 2,
                rarity: "Normal",
                requirements: { miner: 3 },
                maxUnits: 8
        },
        {
                title: "Sortowanie Środowiskowe",
                desc: "Odsiej pospolity gruz od wartościowych kamieni szlachetnych.",
                baseDuration: 50,
                gemMultiplier: 4,
                rarity: "Normal",
                requirements: { miner: 8 },
                maxUnits: 12
        },
        // --- NOWE MISJE (RZADKIE) ---
        {
                title: "Badanie Starych Wyrobisk",
                desc: "Zbadaj zapomniane, zalane sektory kopalni. Kto wie, co tam zostawiono.",
                baseDuration: 120,
                gemMultiplier: 10,
                rarity: "Rare",
                requirements: { miner: 15, quarry: 2 },
                maxUnits: 20
        },
        {
                title: "Deratyzacja Jaskiń",
                desc: "Plaga zmutowanych szczurów blokuje tory transportowe. Wyślij wsparcie.",
                baseDuration: 150,
                gemMultiplier: 15,
                rarity: "Rare",
                requirements: { iron_hammers: 3, miner: 10 },
                maxUnits: 18
        },
        // --- NOWE MISJE (EPICKIE) ---
        {
                title: "Podziemny Szlak Handlowy",
                desc: "Nawiąż bezpieczny kontakt z kupcami z głębin i zabezpiecz transakcje.",
                baseDuration: 400,
                gemMultiplier: 45,
                rarity: "Epic",
                requirements: { mine_inspector: 4, catapult: 2 },
                maxUnits: 22
        },
        {
                title: "Kryształowe Anomalia",
                desc: "Wykryto nagłe, potężne wyładowania energii krystalicznej. Trzeba je okiełznać.",
                baseDuration: 500,
                gemMultiplier: 55,
                rarity: "Epic",
                requirements: { earth_mage: 2, runic_golem: 1 },
                maxUnits: 12
        },
        // --- NOWE MISJE (MITYCZNE) ---
        {
                title: "Ostrzał Magmowych Pomiotów",
                desc: "Istoty z lawy próbują stopić maszyny oblężnicze. Zmiażdż je z dystansu.",
                baseDuration: 1200,
                gemMultiplier: 250,
                rarity: "Mythic",
                requirements: { catapult: 12, iron_hammers: 15 },
                maxUnits: 30
        },
        {
                title: "Transmutacja Wielkich Złóż",
                desc: "Uruchom masowy proces alchemiczny mający na celu zamianę bazaltu w czysty diament.",
                baseDuration: 1500,
                gemMultiplier: 320,
                rarity: "Mythic",
                requirements: { alchemic: 4, mine_inspector: 10 },
                maxUnits: 20
        },
        // --- NOWE MISJE (LEGENDARNE) ---
        {
                title: "Szturm na Twierdzę Cieni",
                desc: "Odkryto podziemną fortecę wrogiej frakcji. Pełna mobilizacja bojowa!",
                baseDuration: 4500,
                gemMultiplier: 1500,
                rarity: "Legendary",
                requirements: { runic_golem: 20, iron_hammers: 40, gem_tower: 3 },
                maxUnits: 70
        },
        {
                title: "Aktywacja Rdzenia Świata",
                desc: "Wykorzystaj maksymalną moc wież, by połączyć się z najgłębszą magią sejsmiczną.",
                baseDuration: 6000,
                gemMultiplier: 2000,
                rarity: "Legendary",
                requirements: { gem_tower: 10, earth_mage: 20, deep_shaft: 8 },
                maxUnits: 80
        }

];

// Aktywne misje na tablicy (3 sloty)
let missionsState = [];

function generateRandomMission(slotId) {
        const randomIndex = Math.floor(Math.random() * allMissionsPool.length);
        const rawMission = allMissionsPool[randomIndex];

        return {
                id: slotId,
                title: rawMission.title,
                desc: rawMission.desc,
                baseDuration: rawMission.baseDuration,
                gemMultiplier: rawMission.gemMultiplier,
                rarity: rawMission.rarity,
                requirements: { ...rawMission.requirements },
                maxUnits: rawMission.maxUnits, // <-- TA LINIA DODANA
                active: false,
                timeLeft: 0,
                setupUnits: {},
                activeUnits: {}
        };
}
function initMissionsBoard() {
        missionsState = [
                generateRandomMission(1),
                generateRandomMission(2),
                generateRandomMission(3)
        ];
}

function playerOwnsRequirements(mission) {
        if (!mission.requirements) return true;
        for (let unitKey in mission.requirements) {
                if ((upgrades[unitKey]?.level || 0) < mission.requirements[unitKey]) {
                        return false;
                }
        }
        return true;
}

function playerAssignedRequirements(mission) {
        if (!mission.requirements) return true;
        for (let unitKey in mission.requirements) {
                const assigned = mission.setupUnits[unitKey] || 0;
                if (assigned < mission.requirements[unitKey]) {
                        return false;
                }
        }
        return true;
}

function getFreeUnits(unitKey) {
        let busyUnits = 0;
        missionsState.forEach(m => {
                if (m.active && m.activeUnits[unitKey]) busyUnits += m.activeUnits[unitKey];
                if (!m.active && m.setupUnits[unitKey]) busyUnits += m.setupUnits[unitKey];
        });
        return upgrades[unitKey].level - busyUnits;
}

function calculateMissionReward(mission, unitsAllocation) {
        let totalPower = 0;
        Object.keys(unitsAllocation).forEach(key => {
                let count = unitsAllocation[key] || 0;
                if (count <= 0) return;
                let shopKey = key === 'miner' ? 'miner_gear' : key === 'quarry' ? 'quarry_gear' : key === 'catapult' ? 'catapult_gear' : `${key}_gear`;
                if (key === 'mine_inspector') shopKey = 'inspector_gear';
                if (key === 'iron_hammers') shopKey = 'iron_hammers_gear';
                if (key === 'runic_golem') shopKey = 'golem_gear';

                let shopMultiplier = Math.pow(shopUpgrades[shopKey]?.multiplier || 1, shopUpgrades[shopKey]?.level || 0);
                totalPower += count * upgrades[key].efficiency * shopMultiplier;
        });
        return Math.floor(totalPower * mission.baseDuration * mission.gemMultiplier);
}

function changeMissionUnits(missionId, unitKey, amount) {
        const mission = missionsState.find(m => m.id === missionId);
        if (!mission || mission.active) return;
        if (!playerOwnsRequirements(mission)) return;

        if (!mission.setupUnits[unitKey]) mission.setupUnits[unitKey] = 0;

        // Liczymy ile ludzi łącznie już siedzi w tej misji
        let currentTotal = Object.values(mission.setupUnits).reduce((a, b) => a + b, 0);

        if (amount > 0) {
                // Blokada jeśli przekracza limit misji
                if (currentTotal + amount > mission.maxUnits) {
                        alert(`Ta misja pomieści maksymalnie ${mission.maxUnits} jednostek!`);
                        return;
                }
                if (amount <= getFreeUnits(unitKey)) {
                        mission.setupUnits[unitKey] += amount;
                }
        } else if (amount < 0 && mission.setupUnits[unitKey] >= Math.abs(amount)) {
                mission.setupUnits[unitKey] += amount;
        }
        renderMissions();
}

function setMissionUnits(missionId, unitKey, value) {
        const mission = missionsState.find(m => m.id === missionId);
        if (!mission || mission.active) return;
        if (!playerOwnsRequirements(mission)) return;

        let parsedValue = Math.max(0, parseInt(value) || 0);
        let currentSetup = mission.setupUnits[unitKey] || 0;
        
        // Obliczamy ile jednostek zajmują INNE sloty w tej misji
        let otherUnitsTotal = Object.keys(mission.setupUnits)
                .filter(k => k !== unitKey)
                .reduce((sum, k) => sum + (mission.setupUnits[k] || 0), 0);

        let maxAllowedByMissionCap = mission.maxUnits - otherUnitsTotal;
        let maxAvailable = Math.min(currentSetup + getFreeUnits(unitKey), maxAllowedByMissionCap);

        mission.setupUnits[unitKey] = Math.min(parsedValue, maxAvailable);
        renderMissions();
}


function rerollMissionsBoard() {
        const rerollCost = 50000;
        
        // Kontrola cooldownu rerolla
        let now = Date.now();
        if (now < rerollCooldownEnd) {
                let secLeft = Math.ceil((rerollCooldownEnd - now) / 1000);
                alert(`Odświeżanie tablicy jest zablokowane! Odczekaj jeszcze ${secLeft}s.`);
                return;
        }

        if (gems >= rerollCost) {
                const anyActive = missionsState.some(m => m.active);
                if (anyActive) {
                        alert("Nie możesz odświeżyć tablicy, gdy jakaś misja trwa!");
                        return;
                }
                gems -= rerollCost;
                rerollCooldownEnd = Date.now() + 120000; // Ustawienie blokady na 2 minuty
                initMissionsBoard();
                updateGems();
                renderMissions();
        } else {
                alert("Nie masz wystarczająco dużo Gems (Wymagane: 50K 💎)!");
        }
}
const crisisPool = [
        {       
                title: "Wstrząsy w Kuźniach",
                desc: "Ciężkie młoty Zakonu generują wibracje, przez które w kopalniach sypią się stropy. Górnicy żądają ograniczenia pracy kowali.",
                duration: 45,
                requiredFactions: ["miner", "iron_hammers"],
                icons: ["⛏️", "🛡️"],
                choices: [
                        { text: "Zabezpiecz stropy (Górnicy +15%, Młoty -10%)", action: () => { factionMultipliers.miner += 0.15; factionMultipliers.iron_hammers -= 0.10; } },
                        { text: "Broń musi powstawać! (Młoty +15%, Górnicy -15%)", action: () => { factionMultipliers.iron_hammers += 0.15; factionMultipliers.miner -= 0.15; } }
                ]
        },
        {
                title: "Spór o Amunicję",
                desc: "Obsługa katapult masowo podbiera najlepsze bloki skalne z Kamieniołomu, paraliżując transport surowca. Robotnicy blokują wozy.",
                duration: 40,
                requiredFactions: ["quarry", "catapult"],
                icons: ["🪨", "🏹"],
                choices: [
                        { text: "Oddaj skały robotnikom (Kamieniołom +20%, Katapulty -10%)", action: () => { factionMultipliers.quarry += 0.20; factionMultipliers.catapult -= 0.10; } },
                        { text: "Zasilić machiny wojenne (Katapulty +20%, Kamieniołom -15%)", action: () => { factionMultipliers.catapult += 0.20; factionMultipliers.quarry -= 0.15; } }
                ]
        },
        {
                title: "Niespodziewany Audyt",
                desc: "Główny Inspektor Kopalni zarzuca Zakonowi Żelaznych Młotów łamanie królewskich norm wydajności i grozi nałożeniem kar.",
                duration: 35,
                requiredFactions: ["iron_hammers", "mine_inspector"],
                icons: ["🛡️", "📋"],
                choices: [
                        { text: "Poprzyj surowe procedury (Inspektor +15%, Młoty -10%)", action: () => { factionMultipliers.mine_inspector += 0.15; factionMultipliers.iron_hammers -= 0.10; } },
                        { text: "Przymknij oko na biurokrację (Młoty +20%, Inspektor -15%)", action: () => { factionMultipliers.iron_hammers += 0.20; factionMultipliers.mine_inspector -= 0.15; } }
                ]
        },
        {
                title: "Konflikt o Głębokie Szyby",
                desc: "Inspektorzy kopalni chcą zamknąć najbardziej dochodowe sektory z powodu wycieków gazu. Górnicy wolą ryzykować życie dla zysku.",
                duration: 40,
                requiredFactions: ["miner", "mine_inspector"],
                icons: ["⛏️", "📋"],
                choices: [
                        { text: "Zgoda na ryzykowne wydobycie (Górnicy +15%, Inspektor -15%)", action: () => { factionMultipliers.miner += 0.15; factionMultipliers.mine_inspector -= 0.15; } },
                        { text: "Wprowadź natychmiastowy przestój (Inspektor +20%, Górnicy -10%)", action: () => { factionMultipliers.mine_inspector += 0.20; factionMultipliers.miner -= 0.10; } }
                ]
        },
        {       
        title: "Bunt Maszyn",
                desc: "Runiczne Golemy zablokowały wejście do kopalni, twierdząc, że Górnicy przeciążają ich obwody energetyczne.",
                duration: 40,
                requiredFactions: ["runic_golem", "miner"],
                icons: ["🤖", "⛏️"],
                choices: [
                        { text: "Kalibruj golemy (Golemy +15%, Górnicy -10%)", action: () => { factionMultipliers.runic_golem += 0.15; factionMultipliers.miner -= 0.10; } },
                        { text: "Zmuś robotników do bicia kilofem (Górnicy +20%, Golemy -15%)", action: () => { factionMultipliers.miner += 0.20; factionMultipliers.runic_golem -= 0.15; } }
                ]
        },
        {
                title: "Trzęsienie Ziemi",
                desc: "Magowie Ziemi przesadzili z rytuałem przyspieszania wydobycia, przez co w Kamieniołomie osunęła się główna ściana skalna.",
                duration: 45,
                requiredFactions: ["earth_mage", "quarry"],
                icons: ["🔮", "🪨"],
                choices: [
                        { text: "Zleć magom stabilizację (Magowie +15%, Kamieniołom -15%)", action: () => { factionMultipliers.earth_mage += 0.15; factionMultipliers.quarry -= 0.15; } },
                        { text: "Odmul kamieniołom ręcznie (Kamieniołom +20%, Magowie -10%)", action: () => { factionMultipliers.quarry += 0.20; factionMultipliers.earth_mage -= 0.10; } }
                ]
        },
        {
                title: "Zasilanie Wieży",
                desc: "Wieża Klejnotów pobiera kryształy przeznaczone na rdzenie celownicze dla Katapult. Artyleria zostaje bez amunicji.",
                duration: 35,
                requiredFactions: ["gem_tower", "catapult"],
                icons: ["💎", "🏹"],
                choices: [
                        { text: "Skup moc w wieży (Wieża +20%, Katapulty -15%)", action: () => { factionMultipliers.gem_tower += 0.20; factionMultipliers.catapult -= 0.15; } },
                        { text: "Przekaż kryształy wojsku (Katapulty +15%, Wieża -10%)", action: () => { factionMultipliers.catapult += 0.15; factionMultipliers.gem_tower -= 0.10; } }
                ]
        },
        {
                title: "Kwasowy Wyciek",
                desc: "Alchemicy wylewają toksyczne odpady blisko kuźni Żelaznych Młotów, przez co kowale duszą się przy kowadłach.",
                duration: 40,
                requiredFactions: ["alchemic", "iron_hammers"],
                icons: ["🧪", "🛡️"],
                choices: [
                        { text: "Zneutralizuj chemia kuźnię (Alchemicy +15%, Młoty -10%)", action: () => { factionMultipliers.alchemic += 0.15; factionMultipliers.iron_hammers -= 0.10; } },
                        { text: "Przenieś laboratoria dalej (Młoty +20%, Alchemicy -15%)", action: () => { factionMultipliers.iron_hammers += 0.20; factionMultipliers.alchemic -= 0.15; } }
                ]
        },
        {
                title: "Zalanie Głębokiego Szybu",
                desc: "Inspektor Kopalni chce zamknąć Głęboki Szyb z powodu wysokiego poziomu wód gruntowych. Zarząd szybu żąda pompowania.",
                duration: 38,
                requiredFactions: ["mine_inspector", "deep_shaft"],
                icons: ["📋", "🕳️"],
                choices: [
                        { text: "Wprowadź rygor bezpieczeństwa (Inspektor +15%, Szyb -15%)", action: () => { factionMultipliers.mine_inspector += 0.15; factionMultipliers.deep_shaft -= 0.15; } },
                        { text: "Pompuj wodę i pracuj dalej (Szyb +20%, Inspektor -10%)", action: () => { factionMultipliers.deep_shaft += 0.20; factionMultipliers.mine_inspector -= 0.10; } }
                ]
        },
        {
                title: "Erozja Runów",
                desc: "Magowie Ziemi nieświadomie wysysają energię magiczną z Runicznych Golemów, drastycznie spowalniając ich pracę.",
                duration: 42,
                requiredFactions: ["earth_mage", "runic_golem"],
                icons: ["🔮", "🤖"],
                choices: [
                        { text: "Pozwól magom czerpać moc (Magowie +20%, Golemy -15%)", action: () => { factionMultipliers.earth_mage += 0.20; factionMultipliers.runic_golem -= 0.15; } },
                        { text: "Odizoluj golemy barierą (Golemy +15%, Magowie -10%)", action: () => { factionMultipliers.runic_golem += 0.15; factionMultipliers.earth_mage -= 0.10; } }
                ]
        },
        {
                title: "Niestabilne Eliksiry",
                desc: "Alchemicy chcą użyć Wieży Klejnotów jako gigantycznej soczewki do destylacji eliksirów. Wieża ryzykuje przegrzaniem.",
                duration: 35,
                requiredFactions: ["alchemic", "gem_tower"],
                icons: ["🧪", "💎"],
                choices: [
                        { text: "Zaryzykuj destylację (Alchemicy +25%, Wieża -20%)", action: () => { factionMultipliers.alchemic += 0.25; factionMultipliers.gem_tower -= 0.20; } },
                        { text: "Chroń soczewki wieży (Wieża +15%, Alchemicy -10%)", action: () => { factionMultipliers.gem_tower += 0.15; factionMultipliers.alchemist -= 0.10; } }
                ]
        },
        {
                title: "Wentylacja Głębin",
                desc: "Głęboki Szyb generuje potężne ciągi powietrza, które wysysają tlen z wyższych poziomów kopalni Górników.",
                duration: 40,
                requiredFactions: ["deep_shaft", "miner"],
                icons: ["🕳️", "⛏️"],
                choices: [
                        { text: "Zostaw pełną moc na dole (Szyb +15%, Górnicy -10%)", action: () => { factionMultipliers.deep_shaft += 0.15; factionMultipliers.miner -= 0.10; } },
                        { text: "Zbalansuj śluzy powietrzne (Górnicy +15%, Szyb -15%)", action: () => { factionMultipliers.miner += 0.15; factionMultipliers.deep_shaft -= 0.15; } }
                ]
        },
        {
                title: "Wielkie Głazy",
                desc: "Kamieniołom dostarcza zbyt wielkie bloki skalne. Katapulty nie mogą ich załadować bez wcześniejszego łupania.",
                duration: 45,
                requiredFactions: ["quarry", "catapult"],
                icons: ["🪨", "🏹"],
                choices: [
                        { text: "Krusz kamienie na miejscu (Katapulty +20%, Kamieniołom -10%)", action: () => { factionMultipliers.catapult += 0.20; factionMultipliers.quarry -= 0.10; } },
                        { text: "Ładuj mniejsze salwy (Kamieniołom +15%, Katapulty -15%)", action: () => { factionMultipliers.quarry += 0.15; factionMultipliers.catapult -= 0.15; } }
                ]
        },
        {
                title: "Certyfikat Kucia",
                desc: "Inspektor Kopalni blokuje dostawy stali od Żelaznych Młotów, dopóki kowale nie przejdą testów BHP.",
                duration: 35,
                requiredFactions: ["mine_inspector", "iron_hammers"],
                icons: ["📋", "🛡️"],
                choices: [
                        { text: "Wdroż procedury urzędnika (Inspektor +20%, Młoty -15%)", action: () => { factionMultipliers.mine_inspector += 0.20; factionMultipliers.iron_hammers -= 0.15; } },
                        { text: "Przekup inspektora (Młoty +15%, Inspektor -15%)", action: () => { factionMultipliers.iron_hammers += 0.15; factionMultipliers.mine_inspector -= 0.15; } }
                ]
        },
        {
                title: "Stalowe Pancerze Golemów",
                desc: "Żelazne Młoty żądają stopów z Runicznych Golemów do produkcji broni. Golemy odmawiają oddania swoich płyt pancerza.",
                duration: 40,
                requiredFactions: ["iron_hammers", "runic_golem"],
                icons: ["🛡️", "🤖"],
                choices: [
                        { text: "Przetop części golemów (Młoty +20%, Golemy -20%)", action: () => { factionMultipliers.iron_hammers += 0.20; factionMultipliers.runic_golem -= 0.20; } },
                        { text: "Wzmocnij konstrukcję golemów (Golemy +15%, Młoty -10%)", action: () => { factionMultipliers.runic_golem += 0.15; factionMultipliers.iron_hammers -= 0.10; } }
                ]
        },
        {
                title: "Skażenie Magią",
                desc: "Magowie Ziemi wywołują rezonans, który zakłóca pompy i windy w Głębokim Szybie. Wszystko staje w miejscu.",
                duration: 42,
                requiredFactions: ["earth_mage", "deep_shaft"],
                icons: ["🔮", "🕳️"],
                choices: [
                        { text: "Pozwól magom dokończyć czar (Magowie +20%, Szyb -15%)", action: () => { factionMultipliers.earth_mage += 0.20; factionMultipliers.deep_shaft -= 0.15; } },
                        { text: "Uziem magiczne anomalie (Szyb +15%, Magowie -10%)", action: () => { factionMultipliers.deep_shaft += 0.15; factionMultipliers.earth_mage -= 0.10; } }
                ]
        },
        {
                title: "Mikstura Wydajności",
                desc: "Alchemicy testują doping na Górnikach. Robotnicy pracują jak szaleni, ale szybko lądują w lazarecie.",
                duration: 38,
                requiredFactions: ["alchemic", "miner"],
                icons: ["🧪", "⛏️"],
                choices: [
                        { text: "Zwiększ dawkę sterydu (Alchemicy +20%, Górnicy -15%)", action: () => { factionMultipliers.alchemic += 0.20; factionMultipliers.miner -= 0.15; } },
                        { text: "Podawaj tylko mleko (Górnicy +15%, Alchemicy -10%)", action: () => { factionMultipliers.miner += 0.15; factionMultipliers.alchemic -= 0.10; } }
                ]
        },
        {
                title: "Oślepiający Blask",
                desc: "Wieża Klejnotów emituje tak silne światło, że Inspektorzy Kopalni nie są w stanie przeprowadzać kontroli powierzchniowych.",
                duration: 35,
                requiredFactions: ["gem_tower", "mine_inspector"],
                icons: ["💎", "📋"],
                choices: [
                        { text: "Przyćmij moc wieży (Inspektor +15%, Wieża -10%)", action: () => { factionMultipliers.mine_inspector += 0.15; factionMultipliers.gem_tower -= 0.10; } },
                        { text: "Inspektorzy dostaną gogle (Wieża +20%, Inspektor -15%)", action: () => { factionMultipliers.gem_tower += 0.20; factionMultipliers.mine_inspector -= 0.15; } }
                ]
        },
        {
                title: "Kruszenie Granitu",
                desc: "Żelazne Młoty zużywają najlepsze dłuta z Kamieniołomu, nie zostawiając narzędzi dla samych robotników odłamujących bloki.",
                duration: 40,
                requiredFactions: ["iron_hammers", "quarry"],
                icons: ["🛡️", "🪨"],
                choices: [
                        { text: "Zostaw stal dla kowali (Młoty +15%, Kamieniołom -10%)", action: () => { factionMultipliers.iron_hammers += 0.15; factionMultipliers.quarry -= 0.10; } },
                        { text: "Zabezpiecz narzędzia kamieniarzy (Kamieniołom +20%, Młoty -15%)", action: () => { factionMultipliers.quarry += 0.20; factionMultipliers.iron_hammers -= 0.15; } }
                ]
        },
        {
                title: "Mechaniczny Ostrzał",
                desc: "Katapulty uszkodziły systemy sterowania Runicznych Golemów podczas ćwiczeń bojowych na poligonie.",
                duration: 45,
                requiredFactions: ["catapult", "runic_golem"],
                icons: ["🏹", "🤖"],
                choices: [
                        { text: "Kalibruj trajektorię (Katapulty +15%, Golemy -10%)", action: () => { factionMultipliers.catapult += 0.15; factionMultipliers.runic_golem -= 0.10; } },
                        { text: "Napraw podzespoły golemów (Golemy +20%, Katapulty -15%)", action: () => { factionMultipliers.runic_golem += 0.20; factionMultipliers.catapult -= 0.15; } }
                ]
        },
        {
                title: "Alchemia Głębin",
                desc: "Alchemicy wpuszczają żrące kwasy do Głębokiego Szybu, próbując rozpuścić twarde skały. Chodnik grozi zawaleniem.",
                duration: 40,
                requiredFactions: ["alchemic", "deep_shaft"],
                icons: ["🧪", "🕳️"],
                choices: [
                        { text: "Agresywne rozpuszczanie (Alchemicy +20%, Szyb -15%)", action: () => { factionMultipliers.alchemic += 0.20; factionMultipliers.deep_shaft -= 0.15; } },
                        { text: "Zabezpiecz szalunki szybów (Szyb +15%, Alchemicy -10%)", action: () => { factionMultipliers.deep_shaft += 0.15; factionMultipliers.alchemic -= 0.10; } }
                ]
        },
        {
                title: "Magia Kontrolowana",
                desc: "Inspektor Kopalni żąda od Magów Ziemi rejestracji każdego rzuconego czaru pod groźbą zablokowania ich gildii.",
                duration: 35,
                requiredFactions: ["mine_inspector", "earth_mage"],
                icons: ["📋", "🔮"],
                choices: [
                        { text: "Wprowadź księgi zaklęć (Inspektor +20%, Magowie -15%)", action: () => { factionMultipliers.mine_inspector += 0.20; factionMultipliers.earth_mage -= 0.15; } },
                        { text: "Wolność czarowania! (Magowie +15%, Inspektor -10%)", action: () => { factionMultipliers.earth_mage += 0.15; factionMultipliers.mine_inspector -= 0.10; } }
                ]
        },
        {
                title: "Pole Krystaliczne",
                desc: "Wieża Klejnotów rezonuje z kryształami w Kamieniołomie, utwardzając granit tak mocno, że nie da się go odłupać.",
                duration: 42,
                requiredFactions: ["gem_tower", "quarry"],
                icons: ["💎", "🪨"],
                choices: [
                        { text: "Przeciąż emiter wieży (Wieża +20%, Kamieniołom -15%)", action: () => { factionMultipliers.gem_tower += 0.20; factionMultipliers.quarry -= 0.15; } },
                        { text: "Rozładuj pole energetyczne (Kamieniołom +15%, Wieża -10%)", action: () => { factionMultipliers.quarry += 0.15; factionMultipliers.gem_tower -= 0.10; } }
                ]
        },
        {
                title: "Ostrzał Oblężniczy",
                desc: "Dowództwo Katapult chce wyburzyć strefy wejściowe Głębokiego Szybu, by zrobić miejsce na stałe stanowiska bojowe.",
                duration: 40,
                requiredFactions: ["catapult", "deep_shaft"],
                icons: ["🏹", "🕳️"],
                choices: [
                        { text: "Zbuduj stanowiska ogniowe (Katapulty +20%, Szyb -20%)", action: () => { factionMultipliers.catapult += 0.20; factionMultipliers.deep_shaft -= 0.20; } },
                        { text: "Chroń infrastrukturę szybu (Szyb +15%, Katapulty -10%)", action: () => { factionMultipliers.deep_shaft += 0.15; factionMultipliers.catapult -= 0.10; } }
                ]
        }
];
function triggerRandomCrisis() {
        if (activeCrisis) return;

        const randomIndex = Math.floor(Math.random() * crisisPool.length);
        activeCrisis = { ...crisisPool[randomIndex], timeLeft: crisisPool[randomIndex].duration };

        const container = document.getElementById('faction-crisis-container');
        const titleEl = document.getElementById('crisis-title');
        const descEl = document.getElementById('crisis-desc');
        const choicesBox = document.getElementById('crisis-choices');

        if (!container || !titleEl || !descEl || !choicesBox) {
                console.warn("⚠️ Brak struktury UI dla kryzysów w pliku HTML. Blokada crashu.");
                activeCrisis = null;
                return;
        }

        // AKTYWACJA WYKRZYKNIKA W SIDEBARZE
        const alertBadge = document.getElementById('tavern-alert');
        if (alertBadge) {
                alertBadge.classList.remove('hidden');
                alertBadge.style.color = '#ef4444'; // Krwisty czerwony
                alertBadge.style.textShadow = '0 0 10px #ef4444, 0 0 20px #ef4444'; // Efekt świecenia (Glow)
                alertBadge.style.fontWeight = 'bold';
        }

        // OBSŁUGA OKIENKA POPUP W STYLU GROMIRA (TYLKO PIERWSZY RAZ)
        const crisisOverlay = document.getElementById('crisis-overlay');
        const crisisPopupText = document.getElementById('crisis-popup-text');

        if (crisisOverlay && crisisPopupText) {
                if (!hasSeenCrisisTutorial) {
                        // Pokazujemy popup TYLKO za pierwszym razem jako wprowadzenie do mechaniki
                        crisisPopupText.innerHTML = `<b>Bratku, mamy dym w królestwie!</b> Właśnie aktywował się system kryzysów frakcyjnych. Górnicy i Zakon Żelaznych Młotów zaczynają walczyć o wpływy.<br><br>Każda Twoja decyzja zmieni ich wydajność, a zignorowanie czasu pogorszy relacje z obiema stronami!`;
                        localStorage.setItem('hasSeenCrisisTutorial', 'true');
                        hasSeenCrisisTutorial = true;

                        // Pokazanie i obsługa zamknięcia okna tylko dla pierwszego razu
                        crisisOverlay.classList.remove('hidden');
                        crisisOverlay.onclick = () => crisisOverlay.classList.add('hidden');
                }
        }

        container.className = 'rpg-window rpg-box active';
        container.style.display = 'block';

        titleEl.className = 'rpg-title';
        titleEl.innerText = `⚔️ KRYZYS: ${activeCrisis.title}`;

        descEl.className = 'rpg-dialog-text';
        descEl.innerText = activeCrisis.desc;

        choicesBox.innerHTML = "";
        choicesBox.className = 'rpg-choices-container';

        activeCrisis.choices.forEach((choice, idx) => {
                const btn = document.createElement('button');
                btn.className = 'rpg-button';
                btn.innerText = choice.text;
                btn.onclick = () => resolveCrisis(idx);
                choicesBox.appendChild(btn);
        });

        crisisTimerId = setInterval(() => {
                activeCrisis.timeLeft--;
                const timerEl = document.getElementById('crisis-timer');
                if (timerEl) {
                        timerEl.className = 'rpg-timer';
                        timerEl.innerText = `⏳ Czas: ${activeCrisis.timeLeft}s`;
                }

                if (activeCrisis.timeLeft <= 0) {
                        clearInterval(crisisTimerId);
                        // Dynamiczne karanie frakcji biorących udział w konflikcie
                        activeCrisis.requiredFactions.forEach(fac => {
                                if (factionMultipliers[fac] !== undefined) {
                                        factionMultipliers[fac] -= 0.15;
                                }
                        });
                        endCrisisDisplay("⌛ Czas minął! Zaangażowane struktury straciły wydajność przez Twój brak zdecydowania!");
                }
        }, 1000);
}

function resolveCrisis(choiceIndex) {
        clearInterval(crisisTimerId);
        activeCrisis.choices[choiceIndex].action(); // Odpalenie wybranej modyfikacji ekonomii
        endCrisisDisplay("✨ Konflikt zażegnany. Modyfikatory ekonomiczne zostały zaktualizowane!");
}

function endCrisisDisplay(message) {
        alert(message);
        activeCrisis = null;
        const container = document.getElementById('faction-crisis-container');
        if (container) container.style.display = 'none';

        // CZYŚĆ WYKRZYKNIK PO ZAKOŃCZENIU KRYZYSU
        const alertBadge = document.getElementById('tavern-alert');
        if (alertBadge) alertBadge.classList.add('hidden');
}

// System sprawdzający co 30 sekund szansę (np. 30%) na pojawienie się kryzysu
function startCrisisEngine() {
        // Blokada: system rusza dopiero gdy gracz kupi chociaż jeden poziom Iron Hammer Order
        crisisCheckIntervalId = setInterval(() => {
                if (upgrades.iron_hammers.level > 0 && !activeCrisis && Math.random() < 0.3) {
                        triggerRandomCrisis();
                }
        }, 90000);
}
function startMission(missionId) {
        const mission = missionsState.find(m => m.id === missionId);
        if (!mission || mission.active) return;

        // Kontrola cooldownu 2 minut (120000 ms)
        let now = Date.now();
        if (now < globalMissionCooldownEnd) {
                let secLeft = Math.ceil((globalMissionCooldownEnd - now) / 1000);
                alert(`Ekspedycje są na cooldownie! Odczekaj jeszcze ${secLeft}s.`);
                return;
        }

        if (!playerOwnsRequirements(mission)) return;

        globalMissionCooldownEnd = Date.now() + 120000; // Ustawienie blokady na 2 minuty
        mission.active = true;
        mission.activeUnits = { ...mission.setupUnits };
        mission.timeLeft = mission.baseDuration;

        mission.timerId = setInterval(() => {
                mission.timeLeft--;
                if (mission.timeLeft <= 0) {
                        clearInterval(mission.timerId);
                        gems += calculateMissionReward(mission, mission.activeUnits);
                        updateGems();
                        const slotIndex = missionsState.findIndex(m => m.id === missionId);
                        missionsState[slotIndex] = generateRandomMission(missionId);
                }
                renderMissions();
        }, 1000);
        renderMissions();
}

function renderMissions() {
        const container = document.getElementById('missions-container');
        if (!container) return;

        const upgradeNames = { miner: "Miner", quarry: "Quarry", catapult: "Catapult", iron_hammers: "Iron Hammer Order", mine_inspector: "Mine Inspector", runic_golem: "Runic Golem", alchemic: "Alchemic", earth_mage: "Earth Mage", deep_shaft: "Deep Shaft", gem_tower: "Gem Tower" };

        // NOWE KOLORY: Zgodnie z Twoim życzeniem (Zwykła=Niebieska, Rzadka=Zielona, Mityczna=Pomarańczowa, Legendarna=Złota)
        const rarityColors = {
                "Normal": "#3b82f6",
                "Rare": "#22c55e",
                "Epic": "#a855f7",
                "Mythic": "#f97316",
                "Legendary": "#ffd700"
        };

        let now = Date.now();
        let rerollText = "🔄 Odśwież Tablicę (Koszt: 50K Gems 💎)";
        if (now < rerollCooldownEnd) {
                rerollText = `⏳ Cooldown odświeżania: ${Math.ceil((rerollCooldownEnd - now) / 1000)}s`;
        }

        let htmlContent = `
        <div class="global-pool-info" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; padding: 15px;">
            <span>📜 Tablica Zleceń Królestwa Krasnoludów</span>
            <button onclick="rerollMissionsBoard()" id="audio-toggle" ${now < rerollCooldownEnd ? 'disabled' : ''}>
                ${rerollText}
            </button>
        </div>
    `;

        htmlContent += missionsState.map(m => {
                let expectedReward = calculateMissionReward(m, m.active ? m.activeUnits : m.setupUnits);
                let rarityColor = rarityColors[m.rarity] || "#fff";

                if (m.active) {
                        let deployedList = Object.keys(m.activeUnits).filter(k => m.activeUnits[k] > 0).map(k => `${upgradeNames[k]}: ${m.activeUnits[k]}`).join(', ');
                        return `
                        <div class="mission-card active-mission">
                    <div class="mission-timer-ring">${m.timeLeft}s</div>
                    <div class="mission-info">
                        <h3>${m.title} <span style="font-size:0.75rem; color:${rarityColor};">[${m.rarity}]</span></h3>
                        <p><strong>Status:</strong> Górnicy w podziemiach...</p>
                        <p style="font-size:0.85rem; color:#94a3b8;">(${deployedList})</p>
                        <div class="mission-live-reward">Przewidywany Łup: +${formatNumber(expectedReward)} 💎</div>
                    </div>
                </div>`;
                } else {
                        let requirementsHTML = "";
                        let ownsAllReqs = playerOwnsRequirements(m);
                        let hasAllAssigned = playerAssignedRequirements(m);

                        if (m.requirements && Object.keys(m.requirements).length > 0) {
                                requirementsHTML = `
                    <div class="mission-requirements-title">Wymagana załoga na wyprawę:</div>
                    <div class="mission-req-box">
                `;

                                Object.keys(m.requirements).forEach(unitKey => {
                                        const reqAmount = m.requirements[unitKey];
                                        const assignedAmount = m.setupUnits[unitKey] || 0;
                                        const playerTotalOwned = upgrades[unitKey]?.level || 0;
                                        const hasEnoughAssigned = assignedAmount >= reqAmount;

                                        const numColor = hasEnoughAssigned ? "#34d399" : "#ef4444; font-weight: bold;";
                                        const statusClass = hasEnoughAssigned ? "met" : "unmet";

                                        requirementsHTML += `
                        <div class="mission-req-item ${statusClass}">
                            🛠️ ${upgradeNames[unitKey]}: 
                            <span style="color: ${numColor}">${assignedAmount}</span> / ${reqAmount}
                            <span style="color: #64748b; font-size: 0.75rem; margin-left: 5px;">(W kopalni: ${playerTotalOwned})</span>
                        </div>
                    `;
                                });
                                requirementsHTML += `</div>`;
                        }

                        let totalMineIncome = Object.keys(upgrades).reduce((sum, key) => {
                                let shopKey = key === 'miner' ? 'miner_gear' : key === 'quarry' ? 'quarry_gear' : key === 'catapult' ? 'catapult_gear' : `${key}_gear`;
                                if (key === 'mine_inspector') shopKey = 'inspector_gear';
                                if (key === 'iron_hammers') shopKey = 'iron_hammers_gear';
                                if (key === 'runic_golem') shopKey = 'golem_gear';
                                let shopMultiplier = Math.pow(shopUpgrades[shopKey]?.multiplier || 1, shopUpgrades[shopKey]?.level || 0);
                                return sum + (upgrades[key].level * upgrades[key].efficiency * shopMultiplier);
                        }, 0);

                        let unlockedUnits = Object.keys(upgrades).filter(k => upgrades[k].level > 0);

                        let unitSelectorsHTML = "";
                        if (ownsAllReqs) {
                                unitSelectorsHTML = unlockedUnits.map(k => {
                                        let currentSetup = m.setupUnits[k] || 0; let free = getFreeUnits(k);
                                        let shopKey = k === 'miner' ? 'miner_gear' : k === 'quarry' ? 'quarry_gear' : k === 'catapult' ? 'catapult_gear' : `${k}_gear`;
                                        if (k === 'mine_inspector') shopKey = 'inspector_gear';
                                        if (k === 'iron_hammers') shopKey = 'iron_hammers_gear';
                                        if (k === 'runic_golem') shopKey = 'golem_gear';
                                        let shopMultiplier = Math.pow(shopUpgrades[shopKey]?.multiplier || 1, shopUpgrades[shopKey]?.level || 0);

                                        let singleUnitIncome = upgrades[k].efficiency * shopMultiplier;
                                        let sharePercent = totalMineIncome > 0 ? ((upgrades[k].level * singleUnitIncome / totalMineIncome) * 100).toFixed(1) : 0;

                                        return `
                        <div class="mission-control-box">
                            <div class="control-info-wrapper">
                                <span class="control-label">${upgradeNames[k]} (${free}/${upgrades[k].level}):</span>
                                <div class="unit-analytics"><span>1x: +${formatNumber(singleUnitIncome)}/s</span><span class="separator">|</span><span>${sharePercent}%</span></div>
                            </div>
                            <div class="counter-actions">
                                <button onclick="changeMissionUnits(${m.id}, '${k}', -1); event.stopPropagation();" class="btn-ctrl">-</button>
                                <input type="number" value="${currentSetup}" min="0" max="${currentSetup + free}" onclick="event.stopPropagation();" onchange="setMissionUnits(${m.id}, '${k}', this.value)" class="unit-counter-input" />
                                <button onclick="changeMissionUnits(${m.id}, '${k}', 1); event.stopPropagation();" class="btn-ctrl" ${free <= 0 ? 'disabled' : ''}>+</button>
                            </div>
                        </div>`;
                                }).join('');
                        } else {
                                unitSelectorsHTML = `
                    <div style="text-align: center; color: #f87171; padding: 15px; background: rgba(239, 68, 68, 0.05); border: 1px dashed #ef4444; border-radius: 4px; font-size: 0.9rem; margin-bottom: 15px;">
                        🔒 Zlecenie zablokowane. Twój klan nie posiada jednostek wymaganych do przeprowadzenia tej operacji!
                    </div>
                `;
                        }

                        let currentTotal = Object.values(m.setupUnits).reduce((a, b) => a + b, 0);

                let btnText = "Uruchom Ekspedycję";
                let isCooldownActive = now < globalMissionCooldownEnd;
                
                if (isCooldownActive) {
                        btnText = `⏳ Cooldown wypraw: ${Math.ceil((globalMissionCooldownEnd - now) / 1000)}s`;
                } else if (!ownsAllReqs) {
                        btnText = "Brak wymaganych typów jednostek w kopalni";
                } else if (!hasAllAssigned) {
                        btnText = "Przypisz brakujące jednostki (kliknij +)";
                }

                return `
                <div class="mission-card" style="border-left: 5px solid ${rarityColor}">
                    <h3 style="color: ${rarityColor}">${m.title} <span style="font-size:1rem; font-family:'MedievalSharp'; font-weight:normal;"> <b>Rarity</b>: ${m.rarity}</span></h3>
                    <p class="mission-desc">${m.desc}</p>
                    <div class="mission-meta">
                        <span>Czas: ${m.baseDuration}s</span>
                        <span>Zysk podstawowy: x${m.gemMultiplier}</span>
                        <span style="font-weight: bold; color: #cbd5e1;">👥 Załoga: ${currentTotal} / ${m.maxUnits}</span>
                    </div>
                    
                    ${requirementsHTML}
                    ${unitSelectorsHTML}
                    
                    <button onclick="startMission(${m.id})" class="btn-launch" ${expectedReward <= 0 || !hasAllAssigned || !ownsAllReqs || isCooldownActive ? 'disabled' : ''}>
                        ${btnText}
                    </button>
                </div>`;
                }
        }).join('');

        container.innerHTML = htmlContent;
}

// Inicjalizacja tablicy na starcie gry
initMissionsBoard();
function handleSidebarNavigation() {
        const sidebarButtons = document.querySelectorAll('.sidebar-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        function updateSidebarLocks() {
                // Trwałe odblokowanie po przekroczeniu progów
                if (gems >= 1000000) isTavernUnlocked = true;
                if (gems >= 1000000000) isAltarUnlocked = true;

                sidebarButtons.forEach(btn => {
                        const targetTabId = btn.getAttribute('data-tab');
                        const labelSpan = btn.querySelector('span');

                        if (targetTabId === 'tavern-tab') {
                                if (!isTavernUnlocked) {
                                        if (labelSpan) labelSpan.innerText = "???";
                                        btn.classList.add('locked-sidebar-btn');
                                } else {
                                        if (labelSpan) labelSpan.innerText = "Tavern";
                                        btn.classList.remove('locked-sidebar-btn');
                                }
                        }

                        if (targetTabId === 'altar-tab') {
                                if (!isAltarUnlocked) {
                                        if (labelSpan) labelSpan.innerText = "???";
                                        btn.classList.add('locked-sidebar-btn');
                                } else {
                                        if (labelSpan) labelSpan.innerText = "Altar";
                                        btn.classList.remove('locked-sidebar-btn');
                                }
                        }

                        if (targetTabId === 'crystal-shop-tab') {
                                if (!isAltarUnlocked) {
                                        if (labelSpan) labelSpan.innerText = "???";
                                        btn.classList.add('locked-sidebar-btn');
                                } else {
                                        if (labelSpan) labelSpan.innerText = "Crystal Shop";
                                        btn.classList.remove('locked-sidebar-btn');
                                }
                        }
                });
        }

        sidebarButtons.forEach(btn => {
                btn.onclick = (e) => {
                        e.stopPropagation();
                        const targetTabId = btn.getAttribute('data-tab');

                        // Sprawdzenie stanu logicznych flag zamiast aktualnego stanu portfela
                        if (targetTabId === 'tavern-tab' && !isTavernUnlocked) return;
                        if (targetTabId === 'altar-tab' && !isAltarUnlocked) return;
                        if (targetTabId === 'crystal-shop-tab' && !isAltarUnlocked) return;

                        sidebarButtons.forEach(b => b.classList.remove('active'));
                        tabContents.forEach(tab => tab.classList.add('hidden'));

                        btn.classList.add('active');
                        const targetTab = document.getElementById(targetTabId);
                        if (targetTab) {
                                targetTab.classList.remove('hidden');
                                if (targetTabId === 'tavern-tab') renderMissions();
                                if (targetTabId === 'altar-tab' || targetTabId === 'crystal-shop-tab') renderAllPerks();
                        }
                };
        });

        const originalGameLoop = gameLoop;
        gameLoop = function (timestamp) {
                originalGameLoop(timestamp);
                updateSidebarLocks();
                updateAltarUI();
        };
}
handleSidebarNavigation();
// --- BAZA DANYCH PERKÓW (ZDJĘCIE image_f68f8c.png) ---
const perkTooltipStyles = document.createElement('style');
perkTooltipStyles.innerHTML = `
    /* Sprawiamy, że kółka stają się punktem odniesienia dla okienka */
    .miner-upgrades button, .quarry-upgrades button, .catapult-upgrades button, 
    .iron_hammers-upgrades button, .mine_inspector-upgrades button,
    .miner-upgrades div, .quarry-upgrades div, .catapult-upgrades div, 
    .iron_hammers-upgrades div, .mine_inspector-upgrades div {
        position: relative;
    }

    /* Wygląd okienka perków */
    .perk-tooltip-box {
        visibility: hidden;
        opacity: 0;
        position: absolute;
        bottom: 135%;
        left: 50%;
        transform: translateX(-50%);
        width: 250px;
        background: #090d16;
        border: 2px solid #a855f7; /* Fioletowa ramka pasująca do Twojego UI */
        box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
        color: #fff;
        padding: 12px;
        border-radius: 10px;
        z-index: 9999;
        transition: opacity 0.2s ease, visibility 0.2s ease;
        pointer-events: none;
        text-align: left;
        font-family: sans-serif;
    }

    /* Wyświetlanie po najechaniu */
    [data-has-perk-tooltip]:hover .perk-tooltip-box {
        visibility: visible;
        opacity: 1;
    }

    .perk-tooltip-box h5 {
        margin: 0 0 4px 0;
        color: #d8b4fe;
        font-size: 0.95rem;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .perk-tooltip-box p {
        margin: 0 0 8px 0;
        font-size: 0.78rem;
        color: #cbd5e1;
        line-height: 1.3;
    }

    .perk-tooltip-box .perk-cost-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        border-top: 1px solid #3b0764;
        padding-top: 5px;
        color: #a5f3fc;
        font-weight: bold;
    }
`;
document.head.appendChild(perkTooltipStyles);

const crystalPerksData = {
        miner: [
                { name: "Górniczy Pośpiech", desc: "Zwiększa bazową produkcję Górników o +10%.", cost: 1, icon: "⛏️" },
                { name: "Głębokie Wykopaliska", desc: "Każdy kupiony Górnik zwiększa szansę na krytyczne kliknięcie.", cost: 2, icon: "💎" },
                { name: "Synergia Kamieniołomu", desc: "Zwiększa wydajność Kamieniołomów o +1% za każdy poziom Górnika.", cost: 3, icon: "🔗" }
        ],
        quarry: [
                { name: "Technologia Odkrywkowa", desc: "Zwiększa wydajność Kamieniołomów o +25%.", cost: 2, icon: "🪨" },
                { name: "Ciężki Sprzęt", desc: "Zmniejsza koszt zakupu kolejnych Kamieniołomów o 10%.", cost: 3, icon: "⚙️" },
                { name: "Architektura Zniszczenia", desc: "Zmniejsza koszt zakupu Katapult o 10%.", cost: 4, icon: "🏗️" }
        ],
        catapult: [
                { name: "Wzmocnione Cięciwy", desc: "Zwiększa produkcję Katapult o +30%.", cost: 3, icon: "🏹" },
                { name: "Ogniste Pociski", desc: "Katapulty zyskują szansę na podpalenie złoża i darmowe odłamki.", cost: 4, icon: "🔥" },
                { name: "Zasięg Oblężniczy", desc: "Każda katapulta zwiększa ogólny globalny mnożnik CPS o +1%.", cost: 5, icon: "🌍" }
        ],
        iron_hammer: [
                { name: "Runiczne Kowadła", desc: "Zwiększa produkcję Zakonu Młotów o +25%.", cost: 4, icon: "🔨" },
                { name: "Hartowana Stal", desc: "Zwiększa siłę kliknięcia o 5% wartości Twojego całkowitego CPS.", cost: 5, icon: "⚔️" },
                { name: "Błogosławieństwo Stali", desc: "Zmniejsza koszt wszystkich ulepszeń w zwykłym sklepie o 5%.", cost: 6, icon: "✨" }
        ],
        mine_inspector: [
                { name: "Surowy Nadzór", desc: "Zwiększa wydajność Górników i Kamieniołomów o +10%.", cost: 5, icon: "📋" },
                { name: "Optymalizacja Biurokracji", desc: "Zwiększa produkcję Inspektorów o +20%.", cost: 6, icon: "⏳" },
                { name: "Złote Normy", desc: "Zwiększa szansę na znalezienie rzadkich, czystych klejnotów o +15%.", cost: 7, icon: "👑" }
        ]
};
function initPerkTooltips() {
        // Mapowanie kluczy danych na klasy kontenerów w HTML
        const containerClasses = {
                miner: ['miner-upgrades', 'miner_upgrades'],
                quarry: ['quarry-upgrades', 'quarry_upgrades'],
                catapult: ['catapult-upgrades', 'catapult_upgrades'],
                iron_hammer: ['iron_hammers-upgrades', 'iron-hammer-upgrades', 'iron_hammer_upgrades'],
                mine_inspector: ['mine_inspector-upgrades', 'mine-inspector-upgrades', 'mine_inspector_upgrades']
        };

        Object.keys(crystalPerksData).forEach(key => {
                let container = null;

                // Szukamy odpowiedniego kontenera z listy możliwych klas
                for (const className of containerClasses[key]) {
                        container = document.querySelector(`.${className}`);
                        if (container) break;
                }

                if (!container) return; // Jeśli nie znaleziono karty, przejdź do następnej

                // Znajdź przyciski/elementy reprezentujące kółka I, II, III
                const elements = Array.from(container.querySelectorAll('button, div, span, .circle'));
                const perkButtons = elements.filter(el => {
                        const txt = el.textContent.trim();
                        return txt === 'I' || txt === 'II' || txt === 'III';
                });

                // Wstrzykiwanie tooltipów do kółek
                perkButtons.forEach((btn, index) => {
                        const perkInfo = crystalPerksData[key][index];
                        if (!perkInfo) return;

                        // Zabezpieczenie przed wielokrotnym dodawaniem okienka
                        if (btn.hasAttribute('data-has-perk-tooltip')) return;
                        btn.setAttribute('data-has-perk-tooltip', 'true');

                        // Tworzymy strukturę wyskakującego okienka
                        const tooltip = document.createElement('div');
                        tooltip.className = 'perk-tooltip-box';
                        tooltip.innerHTML = `
                <h5>${perkInfo.icon} ${perkInfo.name}</h5>
                <p>${perkInfo.desc}</p>
                <div class="perk-cost-row">
                    <span>Wymaga odblokowania</span>
                    <span>Koszt: ${perkInfo.cost} 🔮</span>
                </div>
            `;

                        btn.appendChild(tooltip);
                });
        });
}

setInterval(() => {
        const tavernTab = document.getElementById('tavern-tab');
        // Odświeżaj widok tylko jeśli gracz ma otwartą zakładkę Karczmy
        if (tavernTab && !tavernTab.classList.contains('hidden')) {
                renderMissions();
        }
}, 1000);

// Uruchomienie inicjalizacji tooltipów chwilę po załadowaniu skryptu
setTimeout(initPerkTooltips, 600);
// --- ZAPISY I DIALOGI ---
function saveGameToFile() {
        const dataToSave = {
                gems: gems,
                magicalCrystals: magicalCrystals,
                crystals_bought: crystals_bought,
                currentTrackIndex: currentTrackIndex,
                isTutorialPassed: isTutorialPassed,
                isTavernUnlocked: isTavernUnlocked,
                isAltarUnlocked: isAltarUnlocked,
                upgrades: {},
                shopUpgrades: {},
                crystalPerksData: Object.keys(crystalPerks).reduce((acc, unit) => {
                        acc[unit] = crystalPerks[unit].map(p => p.unlocked);
                        return acc;
                }, {})
        };
        Object.keys(upgrades).forEach(key => { dataToSave.upgrades[key] = { level: upgrades[key].level, cost: upgrades[key].cost, efficiency: upgrades[key].efficiency }; });
        Object.keys(shopUpgrades).forEach(key => { dataToSave.shopUpgrades[key] = { level: shopUpgrades[key].level, cost: shopUpgrades[key].cost }; });
        const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "medieval_clicker_save.json"; a.click();
        URL.revokeObjectURL(url);
}

function loadGameFromFile(event) {
        const file = event.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
                try {
                        const loadedData = JSON.parse(e.target.result);
                        if (!loadedData || typeof loadedData !== 'object') {
                                alert("Ten zwój zapisu jest pusty lub uszkodzony!");
                                return;
                        }

                        // Zapisujemy wgrany plik bezpośrednio do pamięci autozapisu
                        localStorage.setItem('medieval_clicker_autosave', JSON.stringify(loadedData));

                        // Przeładowujemy stronę - bezpieczna funkcja silentLoad() zajmie się resztą przy starcie
                        location.reload();
                } catch (err) {
                        alert("Nie można odczytać zwoju! Plik nie jest poprawnym plikiem zapisu JSON.");
                        console.error(err);
                }
        };
        reader.readAsText(file);
}

const fileInput = document.getElementById('file-input');
if (document.getElementById('load-btn')) document.getElementById('load-btn').onclick = () => fileInput.click();
if (fileInput) fileInput.onchange = loadGameFromFile;
if (document.getElementById('save-btn')) document.getElementById('save-btn').onclick = saveGameToFile;

let lastTime = 0; let accumulatedTime = 0;
function gameLoop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const deltaTime = timestamp - lastTime; lastTime = timestamp; accumulatedTime += deltaTime;
        while (accumulatedTime >= 1000) {
                let globalMinerMultiplier = 1;
                if (upgrades.quarry.level >= 10 && Math.random() * 100 < (upgrades.quarry.level >= 100 ? 50 : upgrades.quarry.level > 50 ? 20 : 5)) { globalMinerMultiplier = 2; }

                Object.keys(upgrades).forEach(key => {
                        let income = upgrades[key].level * upgrades[key].efficiency;
                        if (key === 'miner') income *= globalMinerMultiplier;

                        // --- INTEGRACJA PERKÓW Z APG DO EKONOMII ---
                        if (key === 'quarry') {
                                if (crystalPerks.quarry[0].unlocked) income *= 1.25;
                                if (crystalPerks.miner[2].unlocked) income *= (1 + upgrades.miner.level * 0.01);
                        }
                        if (key === 'catapult' && crystalPerks.catapult[0].unlocked) {
                                income *= 1.30;
                        }
                        if (key === 'iron_hammers' && crystalPerks.iron_hammer[0].unlocked) {
                                income *= 1.25;
                        }
                        if (crystalPerks.mine_inspector[0].unlocked && (key === 'miner' || key === 'quarry')) {
                                income *= 1.10;
                        }
                        // -------------------------------------------

                        // --- CHIRURGICZNE WPIĘCIE MNOŻNIKÓW FRAKCJI ---
                        if (key === 'miner') income *= factionMultipliers.miner;
                        if (key === 'iron_hammers') income *= factionMultipliers.iron_hammers;
                        // ----------------------------------------------

                        let shopKey = key === 'miner' ? 'miner_gear' : key === 'quarry' ? 'quarry_gear' : key === 'catapult' ? 'catapult_gear' : `${key}_gear`;
                        if (key === 'mine_inspector') shopKey = 'inspector_gear';
                        if (key === 'iron_hammers') shopKey = 'iron_hammers_gear';
                        if (key === 'runic_golem') shopKey = 'golem_gear';
                        if (shopUpgrades[shopKey]) income *= Math.pow(shopUpgrades[shopKey].multiplier, shopUpgrades[shopKey].level);
                        gems += income;
                });
                accumulatedTime -= 1000;
        }
        requestAnimationFrame(gameLoop);
        updateGems(); updateUpgradesUI(); updateShopUI();
}
requestAnimationFrame(gameLoop);

const tutorialSteps = [
        "May the Heavens watch over you, young lord. The King has finally sent a new overseer to these dark, rich lands.",
        "This rock before you is packed with deep-earth energy. CLICK it ruthlessly to break off the first raw gems.",
        "With the gathered wealth, you can expand operations and hire more personnel in the panel on the right.",
        "Once you gather 5 Miners, you will unlock permissions to open a Quarry and build heavy Catapults.",
        "The ground sometimes reacts to your strikes... Hit a weak spot to trigger a Critical Shard and shatter extra loot!",
        "Collect the minerals, build your underground empire, and make sure no one slacksoff down there!"
];
let currentStep = 0;
const tutorialOverlay = document.getElementById('tutorial-overlay');
const tutorialText = document.getElementById('tutorial-text');
let isTutorialPassed = localStorage.getItem('clicker_tutorial_passed') === 'true';

if (tutorialOverlay && tutorialText) {
        if (isTutorialPassed) tutorialOverlay.style.display = 'none';
        tutorialOverlay.addEventListener('click', () => {
                currentStep++;
                if (currentStep < tutorialSteps.length) { tutorialText.innerHTML = tutorialSteps[currentStep]; }
                else {
                        isTutorialPassed = true; localStorage.setItem('clicker_tutorial_passed', 'true');
                        tutorialOverlay.style.opacity = '0'; setTimeout(() => { tutorialOverlay.style.display = 'none'; }, 300);
                }
        });
}

function silentSave() {
        const dataToSave = {
                gems: gems,
                magicalCrystals: magicalCrystals,
                crystals_bought: crystals_bought,
                currentTrackIndex: currentTrackIndex,
                isTutorialPassed: isTutorialPassed,
                isTavernUnlocked: isTavernUnlocked,
                isAltarUnlocked: isAltarUnlocked,
                upgrades: {},
                shopUpgrades: {},
                crystalPerksData: Object.keys(crystalPerks).reduce((acc, unit) => {
                        acc[unit] = crystalPerks[unit].map(p => p.unlocked);
                        return acc;
                }, {})

        };
        Object.keys(upgrades).forEach(key => { dataToSave.upgrades[key] = { level: upgrades[key].level, cost: upgrades[key].cost, efficiency: upgrades[key].efficiency }; });
        Object.keys(shopUpgrades).forEach(key => { dataToSave.shopUpgrades[key] = { level: shopUpgrades[key].level, cost: shopUpgrades[key].cost }; });
        localStorage.setItem('medieval_clicker_autosave', JSON.stringify(dataToSave));
}
setInterval(silentSave, 10000);

function silentLoad() {
        const savedData = localStorage.getItem('medieval_clicker_autosave');
        if (!savedData) {
                initMissionsBoard();
                renderMissions();
                return;
        }
        try {
                const parsed = JSON.parse(savedData);
                if (!parsed) {
                        initMissionsBoard();
                        renderMissions();
                        return;
                }

                if (typeof parsed.gems === "number") gems = parsed.gems;
                if (typeof parsed.magicalCrystals === "number") magicalCrystals = parsed.magicalCrystals;
                if (typeof parsed.crystals_bought === "number") crystals_bought = parsed.crystals_bought;
                if (typeof parsed.currentTrackIndex === "number") currentTrackIndex = parsed.currentTrackIndex;
                if (typeof parsed.isTutorialPassed === "boolean") isTutorialPassed = parsed.isTutorialPassed;
                if (typeof parsed.isTavernUnlocked === "boolean") isTavernUnlocked = parsed.isTavernUnlocked;
                if (typeof parsed.isAltarUnlocked === "boolean") isAltarUnlocked = parsed.isAltarUnlocked;

                if (parsed.upgrades) {
                        Object.keys(parsed.upgrades).forEach(key => {
                                if (upgrades[key]) {
                                        upgrades[key].level = parsed.upgrades[key].level;
                                        upgrades[key].cost = parsed.upgrades[key].cost;
                                        upgrades[key].efficiency = parsed.upgrades[key].efficiency;
                                }
                        });
                }
                if (parsed.shopUpgrades) {
                        Object.keys(parsed.shopUpgrades).forEach(key => {
                                if (shopUpgrades[key]) {
                                        shopUpgrades[key].level = parsed.shopUpgrades[key].level;
                                        shopUpgrades[key].cost = parsed.shopUpgrades[key].cost;
                                }
                        });
                }
                if (parsed.crystalPerksData) {
                        Object.keys(parsed.crystalPerksData).forEach(unit => {
                                if (crystalPerks[unit]) {
                                        parsed.crystalPerksData[unit].forEach((unlocked, index) => {
                                                if (crystalPerks[unit][index]) crystalPerks[unit][index].unlocked = unlocked;
                                        });
                                }
                        });
                }
                initMissionsBoard();
                renderMissions();
        } catch (err) {
                console.error("Błąd wczytywania zapisu:", err);
                initMissionsBoard();
                renderMissions();
        }
}
silentLoad();
renderMissions();
renderAllPerks();
initPerkTooltips();
startCrisisEngine();