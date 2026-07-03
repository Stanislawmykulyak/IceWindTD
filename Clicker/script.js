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
                console.log("browser is blocking autoplay, you need to click");
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
                let currentLuckyMultiplier = 5 + (gauntletLvl * 2);

                if ((Math.random() * 100) < currentLuckyChance) {
                        gainedGems = gem_per_click * currentLuckyMultiplier;
                        isLucky = true;
                        console.log("Lucky gem strike!");
                } else {
                        gainedGems = gem_per_click;
                }

                let clickMultiplier = Math.pow(shopUpgrades.sharper_pickaxe.multiplier, shopUpgrades.sharper_pickaxe.level);
                gainedGems *= clickMultiplier;
                gems += gainedGems;

                createFloatingText(e.clientX, e.clientY, gainedGems, isLucky);
        });
}

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
        const upgradeNames = { miner: "Miner", quarry: "Quarry", catapult: "Catapult", iron_hammers: "Iron Hammer Order", mine_inspector: "Mine Inspector", runic_golem: "Runic Golem", alchemic: "Alchemic", earth_mage: "Earth Mage", deep_shaft: "Deep Shaft", gem_tower: "Gem Tower" };

        Object.keys(upgrades).forEach(key => {
                const up = upgrades[key];
                const upgradeContainer = document.querySelector(`.${key}-upgrades`);
                if (!upgradeContainer) return;

                const priceEl = upgradeContainer.querySelector(`.${key}-price`);
                const lvlEl = upgradeContainer.querySelector(`.${key}-lvl`);
                const btnEl = upgradeContainer.querySelector(`.${key}-upgrade`);

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
                        if (priceEl) priceEl.innerHTML = `Price: ${formatNumber(up.cost)}$`;
                } else {
                        upgradeContainer.classList.remove('locked-upgrade');
                        if (btnEl) btnEl.innerHTML = upgradeNames[key];
                        if (priceEl) priceEl.innerHTML = `Price: ${formatNumber(up.cost)}$`;
                        if (lvlEl) lvlEl.innerHTML = up.level === up.maxLevel ? `MAX LVL` : `Lvl: ${up.level}`;
                }

                if (isUnlocked) {
                        if (gems >= up.cost && up.level < up.maxLevel) {
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
        if (upgradeKey === 'iron_hammers' && upgrades.catapult.level < 9) isUnlocked = false;
        if (upgradeKey === 'mine_inspector' && upgrades.iron_hammers.level < 9) isUnlocked = false;
        if (upgradeKey === 'runic_golem' && upgrades.mine_inspector.level < 9) isUnlocked = false;
        if (upgradeKey === 'alchemic' && upgrades.runic_golem.level < 9) isUnlocked = false;
        if (upgradeKey === 'earth_mage' && upgrades.alchemic.level < 9) isUnlocked = false;
        if (upgradeKey === 'deep_shaft' && upgrades.earth_mage.level < 9) isUnlocked = false;
        if (upgradeKey === 'gem_tower' && upgrades.deep_shaft.level < 9) isUnlocked = false;

        if (!isUnlocked) return;

        if (gems >= up.cost && up.level < up.maxLevel) {
                gems -= up.cost;
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
        return Math.floor(baseCrystalCost * Math.pow(costMultiplier, magicalCrystals));
}

function getMaxCrystalsAffordable() {
        let currentGems = gems; let count = 0; let totalCost = 0; let tempCrystals = magicalCrystals;
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
                desc: "Przečeš jaskinie w poszukiwaniu drobnych kryształów porzuconych przez kilofy.",
                baseDuration: 15,
                gemMultiplier: 3,
                rarity: "Normal",
                requirements: { miner: 2 }
        },
        {
                title: "Naprawa Wagoników",
                desc: "Wagoniki transportowe torują drogę. Potrzebna natychmiastowa konserwacja osi.",
                baseDuration: 25,
                gemMultiplier: 5,
                rarity: "Normal",
                requirements: { miner: 5 }
        },
        {
                title: "Oczyszczenie Kopalni",
                desc: "Wypędź potwory z dolnych poziomów, aby górnicy mogli bezpiecznie pracować.",
                baseDuration: 35,
                gemMultiplier: 8,
                rarity: "Normal",
                requirements: { iron_hammers: 3, mine_inspector: 1 }
        },
        {
                title: "Wzmocnienie Stropu",
                desc: "Jeden z korytarzy zaczyna niebezpiecznie trzeszczeć. Wyślij wsparcie inżynieryjne.",
                baseDuration: 45,
                gemMultiplier: 10,
                rarity: "Normal",
                requirements: { miner: 4, quarry: 1 }
        },

        // --- RZADKIE (Kolor Zielony) ---
        {
                title: "Eskorta Karawany",
                desc: "Zabezpiecz transport rzadkich kryształów do królewskiego zamku.",
                baseDuration: 60,
                gemMultiplier: 15,
                rarity: "Rare",
                requirements: { miner: 10, catapult: 2 }
        },
        {
                title: "Odzyskiwanie Zalanego Szybu",
                desc: "Wypompuj toksyczną wodę i uratuj uwięziony ciężki sprzęt.",
                baseDuration: 90,
                gemMultiplier: 30,
                rarity: "Rare",
                requirements: { mine_inspector: 3, quarry: 2 }
        },
        {
                title: "Obrona przed Goblinami",
                desc: "Zielonoskórzy próbują podkopać się pod nasz główny magazyn dynamitu.",
                baseDuration: 100,
                gemMultiplier: 40,
                rarity: "Rare",
                requirements: { catapult: 3, iron_hammers: 2 }
        },
        {
                title: "Inspekcja Tuneli",
                desc: "Główny Inspektor musi przeprowadzić rygorystyczne testy sejsmiczne w starych szybach.",
                baseDuration: 120,
                gemMultiplier: 50,
                rarity: "Rare",
                requirements: { mine_inspector: 2, miner: 15 }
        },

        // --- EPICKIE (Kolor Fioletowy) ---
        {
                title: "Magiczne Przesilenie",
                desc: "Ustaktywuj i zabezpiecz niestabilny energetycznie starożytny rdzeń.",
                baseDuration: 180,
                gemMultiplier: 90,
                rarity: "Epic",
                requirements: { earth_mage: 2, runic_golem: 1 }
        },
        {
                title: "Głębokie Wiercenia Szybu",
                desc: "Przewierć się przez najtwardszą skałę w poszukiwaniu mitycznych czarnych diamentów.",
                baseDuration: 240,
                gemMultiplier: 150,
                rarity: "Epic",
                requirements: { deep_shaft: 1, mine_inspector: 5, iron_hammers: 8 }
        },
        {
                title: "Wydobycie Żyły Mithrilu",
                desc: "Odkryto kieszeń powietrzną pełną czystego Mithrilu. Skała jest niezwykle twarda.",
                baseDuration: 280,
                gemMultiplier: 220,
                rarity: "Epic",
                requirements: { quarry: 8, iron_hammers: 5, runic_golem: 2 }
        },

        // --- MITYCZNE (Kolor Pomarańczowy) ---
        {
                title: "Rytuał Proroka Słońca",
                desc: "Magowie Ziemi muszą okiełznać podziemną magię, aby nasycić wieże nową energią.",
                baseDuration: 350,
                gemMultiplier: 500,
                rarity: "Mythic",
                requirements: { earth_mage: 5, alchemic: 3, gem_tower: 1 }
        },
        {
                title: "Pieczęć Głębin",
                desc: "Pradawne zło próbuje przedostać się przez najniższy szyb. Zabarykaduj przejście.",
                baseDuration: 420,
                gemMultiplier: 750,
                rarity: "Mythic",
                requirements: { deep_shaft: 3, runic_golem: 4, mine_inspector: 10 }
        },

        // --- LEGENDARNE (Kolor Złoty) ---
        {
                title: "Alchemiczna Transmutacja Żyły",
                desc: "Nasyć całą żyłę skały czystą magią, ryzykując potężną eksplozję.",
                baseDuration: 500,
                gemMultiplier: 1100,
                rarity: "Legendary",
                requirements: { alchemic: 2, earth_mage: 3, gem_tower: 1 }
        },
        {
                title: "Polowanie na Czerwonego Smoka",
                desc: "Legenda głosi, że w najgłębszych jaskiniach zalęgła się bestia. Wyślij elitę.",
                baseDuration: 600,
                gemMultiplier: 1500,
                rarity: "Legendary",
                requirements: { runic_golem: 5, iron_hammers: 15, gem_tower: 3 }
        },
        {
                title: "Przebudzenie Tytana Ziemi",
                desc: "Obywatelski obowiązek wzywa. Przebudź i okiełznaj potęgę kolosa, który śpi pod jądrem kopalni.",
                baseDuration: 750,
                gemMultiplier: 2500,
                rarity: "Legendary",
                requirements: { gem_tower: 5, deep_shaft: 5, runic_golem: 10 }
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
        if (amount > 0 && amount <= getFreeUnits(unitKey)) { mission.setupUnits[unitKey] += amount; }
        else if (amount < 0 && mission.setupUnits[unitKey] >= Math.abs(amount)) { mission.setupUnits[unitKey] += amount; }
        renderMissions();
}

function setMissionUnits(missionId, unitKey, value) {
        const mission = missionsState.find(m => m.id === missionId);
        if (!mission || mission.active) return;
        if (!playerOwnsRequirements(mission)) return;

        let parsedValue = Math.max(0, parseInt(value) || 0);
        let currentSetup = mission.setupUnits[unitKey] || 0;
        mission.setupUnits[unitKey] = 0;
        let maxAvailable = currentSetup + getFreeUnits(unitKey);
        mission.setupUnits[unitKey] = Math.min(parsedValue, maxAvailable);
        renderMissions();
}

function rerollMissionsBoard() {
        const rerollCost = 50000;
        if (gems >= rerollCost) {
                const anyActive = missionsState.some(m => m.active);
                if (anyActive) {
                        alert("Nie możesz odświeżyć tablicy, gdy jakaś misja trwa!");
                        return;
                }
                gems -= rerollCost;
                initMissionsBoard();
                updateGems();
                renderMissions();
        } else {
                alert("Nie masz wystarczająco dużo Gems (Wymagane: 50K 💎)!");
        }
}

function startMission(missionId) {
        const mission = missionsState.find(m => m.id === missionId);
        if (!mission || mission.active) return;
        if (!playerOwnsRequirements(mission)) return;
        
        if (!playerAssignedRequirements(mission)) {
                alert("Nie przypisałeś wszystkich wymaganych jednostek do tej misji!");
                return;
        }

        let totalAssigned = Object.values(mission.setupUnits).reduce((a, b) => a + b, 0);
        if (totalAssigned <= 0) return;

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

        let htmlContent = `
        <div class="global-pool-info" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; padding: 15px;">
            <span>📜 Tablica Zleceń Królestwa Krasnoludów</span>
            <button onclick="rerollMissionsBoard()" class="btn-toggle-crew" style="padding: 8px 16px; font-weight: bold; border-color: #ffd700;">
                🔄 Odśwież Tablicę (Koszt: 50K Gems 💎)
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
                                <span class="control-label">${upgradeNames[k]} (Dost: ${free}):</span>
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

                        let btnText = "Uruchom Ekspedycję";
                        if (!ownsAllReqs) btnText = "Brak wymaganych typów jednostek w kopalni";
                        else if (!hasAllAssigned) btnText = "Przypisz brakujące jednostki (kliknij +)";

                        return `
                <div class="mission-card" style="border-left: 5px solid ${rarityColor}">
                    <h3 style="color: ${rarityColor}">${m.title} <span style="font-size:1rem; font-family:'MedievalSharp'; font-weight:normal;">, <b>Rarity</b>: ${m.rarity}</span></h3>
                    <p class="mission-desc">${m.desc}</p>
                    <div class="mission-meta"><span>Czas: ${m.baseDuration}s</span><span>Zysk podstawowy: x${m.gemMultiplier}</span></div>
                    
                    ${requirementsHTML}
                    ${unitSelectorsHTML}
                    
                    <button onclick="startMission(${m.id})" class="btn-launch" ${expectedReward <= 0 || !hasAllAssigned || !ownsAllReqs ? 'disabled' : ''}>
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
                });
        }

        sidebarButtons.forEach(btn => {
                btn.onclick = (e) => {
                        e.stopPropagation();
                        const targetTabId = btn.getAttribute('data-tab');

                        // Sprawdzenie stanu logicznych flag zamiast aktualnego stanu portfela
                        if (targetTabId === 'tavern-tab' && !isTavernUnlocked) return;
                        if (targetTabId === 'altar-tab' && !isAltarUnlocked) return;

                        sidebarButtons.forEach(b => b.classList.remove('active'));
                        tabContents.forEach(tab => tab.classList.add('hidden'));

                        btn.classList.add('active');
                        const targetTab = document.getElementById(targetTabId);
                        if (targetTab) {
                                targetTab.classList.remove('hidden');
                                if (targetTabId === 'tavern-tab') renderMissions();
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

// --- ZAPISY I DIALOGI ---
function saveGameToFile() {
        const dataToSave = {
                gems: gems,
                magicalCrystals: magicalCrystals,
                currentTrackIndex: currentTrackIndex,
                isTutorialPassed: isTutorialPassed,
                isTavernUnlocked: isTavernUnlocked,
                isAltarUnlocked: isAltarUnlocked,
                upgrades: {},
                shopUpgrades: {}
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
                        if (typeof loadedData.gems === "number") gems = loadedData.gems;
                        if (typeof loadedData.magicalCrystals === "number") magicalCrystals = loadedData.magicalCrystals;
                        if (typeof loadedData.isTavernUnlocked === "boolean") isTavernUnlocked = loadedData.isTavernUnlocked;
                        if (typeof loadedData.isAltarUnlocked === "boolean") isAltarUnlocked = loadedData.isAltarUnlocked;
                        if (typeof loadedData.isTutorialPassed === "boolean") {
                                isTutorialPassed = loadedData.isTutorialPassed;
                                if (isTutorialPassed && tutorialOverlay) tutorialOverlay.style.display = 'none';
                        }
                        // (Wczytywanie pozostałych danych bez zmian)
                        location.reload();
                } catch (err) { alert("This scroll is tainted!"); }
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
                currentTrackIndex: currentTrackIndex,
                isTutorialPassed: isTutorialPassed,
                isTavernUnlocked: isTavernUnlocked,
                isAltarUnlocked: isAltarUnlocked,
                upgrades: {},
                shopUpgrades: {}
        };
        Object.keys(upgrades).forEach(key => { dataToSave.upgrades[key] = { level: upgrades[key].level, cost: upgrades[key].cost, efficiency: upgrades[key].efficiency }; });
        Object.keys(shopUpgrades).forEach(key => { dataToSave.shopUpgrades[key] = { level: shopUpgrades[key].level, cost: shopUpgrades[key].cost }; });
        localStorage.setItem('medieval_clicker_autosave', JSON.stringify(dataToSave));
}
setInterval(silentSave, 10000);

function silentLoad() {
        const savedData = localStorage.getItem('medieval_clicker_autosave');
        if (!savedData) return;
        try {
                const parsed = JSON.parse(savedData); gems = parsed.gems;
                if (typeof parsed.magicalCrystals === "number") magicalCrystals = parsed.magicalCrystals;
                if (typeof parsed.isTavernUnlocked === "boolean") isTavernUnlocked = parsed.isTavernUnlocked;
                if (typeof parsed.isAltarUnlocked === "boolean") isAltarUnlocked = parsed.isAltarUnlocked;
                Object.keys(upgrades).forEach(key => { if (parsed.upgrades[key]) { upgrades[key].level = parsed.upgrades[key].level; upgrades[key].cost = parsed.upgrades[key].cost; } });
                Object.keys(shopUpgrades).forEach(key => { if (parsed.shopUpgrades[key]) { shopUpgrades[key].level = parsed.shopUpgrades[key].level; shopUpgrades[key].cost = parsed.shopUpgrades[key].cost; } });
                initMissionsBoard(); // <- DODAJ TO TUTAJ, aby wylosować misje po załadowaniu profilu gracza
                updateGems(); updateUpgradesUI(); updateShopUI(); updateAltarUI(); renderMissions();
        } catch (e) { console.error(e); }
}
silentLoad();
renderMissions();