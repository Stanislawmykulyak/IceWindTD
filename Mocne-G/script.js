// ==========================================
// 1. GLOBALNY OBIEKT STANU GRY (Mózg Gry)
// ==========================================
const gameState = {
    currentAct: 1,
    resources: {
        gold: 500,
        iron: 50,          // Baza do Kuźni
        starEssence: 0,    // Baza do Wieży Magicznej
        supply: 150,       // Zaopatrzenie (żywność)
        commanderCoins: 1,
        herbs: 5
    },
    battleMages: 0,
    currentDay: 1,
    supplyConsumptionPerDay: 10, // Tyle jedzenia schodzi każdego dnia

    campBuildings: {
        barracks: 1,
        blacksmith: 1,
        tavern: 1,
        hospital: 1,
        magicTower: 0 // 0 = Nie wybudowana, 1 = Wybudowana
    },
    campUpgrades: {
        infirmaryLevel: 1,
        smithyLevel: 1
    },
    inventory: {
        swords: 0,
        armors: 0,
        hornOfCourage: 0
    },
    isExpeditionRunning: false, // Blokada spamu zwiadu
    army: [],
    goldBonusPerBattle: 0,
    currentLocation: 'camp',
    constructionQueue: {
        barracks: 0,
        blacksmith: 0,
        tavern: 0,
        hospital: 0,
        magicTower: 0
    },
    // Zintegrowane dane kopalni w głównym stanie
    mine: {
        level: 0,
        income: 0,
        upgradeCost: 50
    }
};

// Deklaracje UI
const goldDisplay = document.getElementById('val-gold');
const mineLvlDisplay = document.getElementById('mine-lvl');
const mineIncomeDisplay = document.getElementById('mine-income');
const btnRaid = document.getElementById('btn-raid');
const btnUpgrade = document.getElementById('btn-upgrade-mine');

let canvasLoopInterval = null;
let selectedUnit = null; // Globalna zmienna trzymająca wybraną jednostkę na canvasie
let selectedAlly = null;

// Baza danych przeciwników tekstowych (zapobiega błędom w startBattle)
const enemies = [
    { id: "zardas_minion", name: "Sługa Zardasa", hp: 120, attacks: [{ name: "Mroczny Pocisk", damage: 15 }, { name: "Uderzenie Kosturem", damage: 8 }] },
    { id: "corrupted_wolf", name: "Skażony Wilk", hp: 90, attacks: [{ name: "Głębokie Ugryzienie", damage: 18 }] }
];

const arkelasState = {
    name: "Arkelas Maine",
    race: "Human",
    role: "Strateg / Dowódca",
    hp: 150,
    maxHp: 150,
    currentHp: 150, // Dodane dla poprawnego startu walki tekstowej
    atk: 18,
    ability: {
        id: "horn_of_courage",
        name: "📯 Róg Odwagi",
        description: "Zdejmuje negatywne statusy (strach, ogłuszenie) i drastycznie zwiększa siłę ataku wojsk. W walce tekstowej leczy o 25 HP.",
        cooldown: 0,
        damage: 0,
        heal: 25
    }
};

const soldierPools = {
    human: {
        names: ["Edric", "Garrick", "Rowena", "Aldus", "Valen", "Kaelen"],
        skins: ["Light", "Tan", "Dark"],
        eyes: ["Blue", "Green", "Brown"],
        hair: ["Blond", "Brown", "Black", "Grey"]
    },
    elf: {
        names: ["Galon", "Thranil", "Lirael", "Aelith", "Finarfin", "Eldrin"],
        skins: ["Pale", "Fair"],
        eyes: ["Gold", "Silver", "Emerald"],
        hair: ["Silver", "Golden", "White", "Midnight Black"]
    },
    dwarf: {
        names: ["Thorin", "Broggan", "Dain", "Hilda", "Gimli", "Marni"],
        skins: ["Ruddy", "Weathered"],
        eyes: ["Dark Brown", "Grey"],
        hair: ["Red", "Brown", "Black", "Grey Broard"]
    }
};

const unitClasses = {
    warrior: { className: "Wojownik", hp: 120, atk: 12, range: 35, color: "#3366ff" },
    mage: { className: "Mag Bitewny", hp: 75, atk: 22, range: 110, color: "#a855f7" },
    archer: { className: "Łucznik", hp: 90, atk: 16, range: 85, color: "#22c55e" }
};

const companions = [
    {
        name: "Eleniel Voidweaver", race: "Elf", role: "Battle-Mage", assignedTo: null,
        hp: 75, maxHp: 75, atk: 22,
        ability: { id: "star_magic", name: "✨ Magia Gwiazd", description: "Niszczy przywołańce Zardasa obszarowym czarem AoE za 45 pkt.", cooldown: 3, damage: 45, heal: 0 }
    },
    {
        name: "Kaelen Moss-Foot", race: "Faun", role: "Pathfinder", assignedTo: null,
        hp: 90, maxHp: 90, atk: 16,
        ability: { id: "rooting_arrows", name: "🏹 Strzały Unieruchamiające", description: "Zadaje obrażenia i nakłada status unieruchomienia.", cooldown: 2, damage: 50, heal: 0 }
    },
    {
        name: "Brammer Stoneshield", race: "Dwarf", role: "Tank", assignedTo: null,
        hp: 200, maxHp: 200, atk: 10,
        ability: { id: "runic_shield", name: "🛡️ Tarcza Runiczna", description: "Absorbuje uderzenia potworów i przywraca 60 HP.", cooldown: 4, damage: 0, heal: 60 }
    },
    {
        name: "Vaelra Embersoul", race: "Drakonid", role: "Dragon-Knight", assignedTo: null,
        hp: 160, maxHp: 160, atk: 20,
        ability: { id: "dragon_fire", name: "🔥 Ogień Smoków", description: "Wypala ziemię przed maszerującą armią i podpala cele.", cooldown: 3, damage: 35, heal: 0 }
    },
    {
        name: "Korr Earth-Bound", race: "Goliath", role: "Juggernaut", assignedTo: null,
        hp: 250, maxHp: 250, atk: 14,
        ability: { id: "ground_slam", name: "🪨 Uderzenie Ziemi", description: "Ogłusza grupy mniejszych przeciwników obszarowym uderzeniem.", cooldown: 5, damage: 25, heal: 0 }
    },
    {
        name: "Skrag Short-Fuse", race: "Goblin", role: "Saper", assignedTo: null,
        hp: 80, maxHp: 80, atk: 12,
        ability: { id: "explosive_charge", name: "💣 Ładunek Wybuchowy", description: "Zapewnia brudną taktykę i rozbraja pułapki.", cooldown: 2, damage: 40, heal: 0 }
    }
];

let travelState = {
    currentLocation: 'inn',
    unlockedLocations: ['inn', 'mine']
};

let preBattleSetup = {
    selectedCommander: "Arkelas Maine",
    selectedCompanions: [],
    selectedUnits: [],
    currentTargetLocationId: null,
    selectedEnemy: "zardas_minion"
};

let battleState = {
    allies: [],
    enemies: [],
    isRunning: false,
    combatLog: []
};

const worldLocations = {
    inn: {
        id: "inn",
        name: "Zajazd pod Złotym Gryfem",
        description: "Twoja baza wypadowa. Bezpieczne miejsce, gdzie możesz zrekrutować pierwszych wojowników.",
        mapX: 950,
        mapY: 1050,
        unlocked: true,
        travelTime: 0
    },
    mine: {
        id: "mine",
        name: "Zapomniana Kopalnia Krasnoludów",
        description: "Opuszczone tunele opanowane przez dzikie bestie. Idealne źródło Żelaza i Złota.",
        mapX: 1200,
        mapY: 900,
        unlocked: true,
        travelTime: 2,
        rewards: { gold: 300, iron: 50 }
    },
    thicket: {
        id: "thicket",
        name: "Prastara Gęstwina",
        description: "Mroczny, gęsty las skrywający sekrety i potężne zagrożenia. Tu znajdziesz Esencję Gwiazd.",
        mapX: 1450,
        mapY: 750,
        unlocked: false,
        travelTime: 3,
        rewards: { gold: 200, starEssence: 20 }
    }
};

const mapLocations = Object.values(worldLocations);

const travelQuotes = [
    "„Słońce chowało się za horyzontem, gdy drużyna przedzierała się przez gęste zarośla...”",
    "„Kroki ruszających w drogę wojowników zagłuszał jedynie niepokojący szum wiatru...”",
    "„Wędrówka przez te skażone ziemie niosła ze sobą wyraźny zapach krwi i spalenizny...”",
    "„Trzymając dłonie na rękojeściach mieczy, bacznie obserwowaliście korony drzew...”"
];

const HEALING_COSTS = {
    herbs: 5,
    gold: 10
};

// ==========================================
// 2. SYSTEM PODRÓŻY I MAPY ŚWIATA
// ==========================================
function initiateTravel(targetLocationKey) {
    const location = worldLocations[targetLocationKey];
    if (!location) return;

    if (gameState.currentLocation === targetLocationKey) {
        showNotification("Już znajdujesz się w tej lokacji!", "info");
        return;
    }

    const daysCost = location.travelTime;
    const foodCost = daysCost * gameState.supplyConsumptionPerDay;

    if (gameState.resources.supply < foodCost) {
        alert(`🚨 Za mało Zaopatrzenia! Podróż trwa ${daysCost} dni i wymaga ${foodCost} 📦 żywności. Masz tylko ${gameState.resources.supply}. Wyślij patrol w tawernie!`);
        return;
    }

    preBattleSetup.currentTargetLocationId = targetLocationKey;

    const titleEl = document.getElementById('travel-title');
    const quoteEl = document.getElementById('travel-quote');
    if (titleEl) titleEl.innerText = `🧭 Marsz ku: ${location.name}`;

    if (quoteEl) {
        const quotesPool = location.quotes || travelQuotes;
        const randomQuote = quotesPool[Math.floor(Math.random() * quotesPool.length)];
        quoteEl.innerText = randomQuote;
    }

    switchScreen('travel');

    let timeLeft = 3.0;
    const progressBar = document.getElementById('travel-progress-bar');
    const timerText = document.getElementById('travel-timer');

    if (progressBar) progressBar.style.width = '0%';

    const interval = setInterval(() => {
        timeLeft -= 0.1;
        const progress = ((3.0 - timeLeft) / 3.0) * 100;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (timerText) timerText.innerText = `Pozostało: ${Math.ceil(timeLeft)}s`;

        if (timeLeft <= 0) {
            clearInterval(interval);
            executeArrival(targetLocationKey);
        }
    }, 100);
}

function advanceCampaignDays(daysCount) {
    for (let i = 0; i < daysCount; i++) {
        gameState.currentDay++;
        if (gameState.resources.supply >= gameState.supplyConsumptionPerDay) {
            gameState.resources.supply -= gameState.supplyConsumptionPerDay;
        } else {
            gameState.resources.supply = 0;
            triggerStarvationWarning();
        }
        processConstructionQueue();
    }
    updateResourcesUI();
}

function processConstructionQueue() {
    for (let building in gameState.constructionQueue) {
        if (gameState.constructionQueue[building] > 0) {
            gameState.constructionQueue[building]--;
            if (gameState.constructionQueue[building] === 0) {
                gameState.campBuildings[building]++;
                showNotification(`Sukces! Budynek [${building}] został ulepszony do poziomu ${gameState.campBuildings[building]}!`, "success");
            }
        }
    }
}

function startBuildingUpgrade(buildingName, daysRequired) {
    if (gameState.constructionQueue[buildingName] > 0) {
        alert("Ten budynek jest już w trakcie ulepszania!");
        return;
    }
    gameState.constructionQueue[buildingName] = daysRequired;
    showNotification(`Rozpoczęto prace nad: ${buildingName}. Potrzebne dni: ${daysRequired}.`, "info");
}

function triggerStarvationWarning() {
    console.warn("BRAK ZAOPATRZENIA! Twoja armia głoduje. Statystyki w bitwie zostaną obniżone!");
}

// =========================================================================
// ZINTEGROWANA FUNKCJA: OBSŁUGUJE ZARÓWNO KANVAS RTS JAK I TRYB TEKSTOWY
// =========================================================================
function executeHeroAbility(abilityId, isCommander) {
    // --- 1. OBSŁUGA BITWY W LOGACH / TEKSTOWEJ (Jeśli wróg tekstowy jest aktywny i nie działa pętla Canvasu) ---
    if (window.activeEnemyState && !battleState.isRunning) {
        if (arkelasState.currentHp <= 0 || window.activeEnemyState.hp <= 0) return;

        let dmg = 0;
        let heal = 0;
        let abilityName = "";

        if (isCommander) {
            if (arkelasState.ability && arkelasState.ability.id === abilityId) {
                dmg = arkelasState.ability.damage || 0;
                heal = arkelasState.ability.heal || 0;
                abilityName = arkelasState.ability.name;
            }
        } else {
            companions.forEach(c => {
                if (c.ability && c.ability.id === abilityId) {
                    dmg = c.ability.damage || 0;
                    heal = c.ability.heal || 0;
                    abilityName = c.ability.name;
                }
            });
        }

        const logContainer = document.getElementById('battle-log');

        if (dmg > 0) {
            window.activeEnemyState.hp = Math.max(0, window.activeEnemyState.hp - dmg);
            if (logContainer) logContainer.innerHTML += `<div class="log-entry log-player">💥 Użyto <strong>${abilityName}</strong>! Zadajesz <strong>${dmg}</strong> obrażeń wrogowi.</div>`;
        }
        if (heal > 0) {
            arkelasState.currentHp = Math.min(arkelasState.maxHp, arkelasState.currentHp + heal);
            if (logContainer) logContainer.innerHTML += `<div class="log-entry log-heal">💚 Użyto <strong>${abilityName}</strong>! Przywracasz sobie <strong>${heal}</strong> HP.</div>`;
        }

        updateBattleUI();
        if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;

        if (window.activeEnemyState.hp <= 0) {
            if (logContainer) logContainer.innerHTML += `<div class="log-entry log-victory" style="color: #22c55e; font-weight: bold; font-size: 1.1rem; margin-top: 10px;">🏆 ZWYCIĘSTWO! Wróg został zgładzony!</div>`;
            return;
        }

        setTimeout(enemyTurn, 800);
        return;
    }

    // --- 2. OBSŁUGA BITWY KANVASOWEJ RTS (Gdy działa pętla gry) ---
    if (isCommander) {
        console.log(`✨ Arkelas używa Boskiej Interwencji na mapie taktycznej: ${abilityId}`);
        if (abilityId === 'horn_of_courage' || abilityId === 'heal_all') {
            battleState.allies.forEach(ally => {
                if (ally.stats) {
                    ally.stats.hp = Math.min(ally.stats.maxHp, ally.stats.hp + 20);
                }
            });
            showNotification("Arkelas uleczył armię na polu walki o 20 HP!", "success");
        }
    } else {
        console.log(`⚔️ Towarzysz odpala skill na mapie taktycznej: ${abilityId}`);
        switch (abilityId) {
            case "star_magic":
                battleState.enemies.forEach(enemy => {
                    if (enemy.stats && enemy.stats.hp > 0) enemy.stats.hp -= 45;
                });
                showNotification("💥 Magia Gwiazd sieka całą falę wroga na canvasie za 45 HP!", "info");
                break;
            case "runic_shield":
                const tank = battleState.allies.find(a => a.className === 'Tank' || (a.ability && a.ability.id === 'runic_shield'));
                if (tank && tank.stats) {
                    tank.stats.hp = Math.min(tank.stats.maxHp, tank.stats.hp + 60);
                    showNotification("🛡️ Tarcza Runiczna leczy Tanka o 60 HP!", "info");
                }
                break;
            case "rooting_arrows":
                let target = battleState.enemies.find(e => e.stats && e.stats.hp > 0);
                if (target) {
                    target.stats.hp -= 50;
                    showNotification(`🏹 Strzała unieruchamia i rani ${target.name}!`, "info");
                }
                break;
            default:
                battleState.enemies.forEach(enemy => {
                    if (enemy.stats && enemy.stats.hp > 0) enemy.stats.hp -= 20;
                });
                break;
        }
    }
}

function executeArrival(targetLocationKey) {
    const location = worldLocations[targetLocationKey];
    if (!location) return;

    advanceCampaignDays(location.travelTime);
    gameState.currentLocation = targetLocationKey;

    if (targetLocationKey === 'mine' && !travelState.unlockedLocations.includes('thicket')) {
        travelState.unlockedLocations.push('thicket');
        showNotification("🗺️ Odkryto nową lokację: Prastara Gęstwina!", "success");
    }

    if (location.rewards) {
        if (location.rewards.gold) gameState.resources.gold += location.rewards.gold;
        if (location.rewards.iron) gameState.resources.iron += location.rewards.iron;
        if (location.rewards.starEssence) gameState.resources.starEssence += location.rewards.starEssence;

        showNotification(`Zabezpieczono lokację! Zdobyto surowce.`, "success");
        delete location.rewards;
    }

    if (targetLocationKey !== 'inn') {
        launchMission(targetLocationKey);
    } else {
        switchScreen('camp');
    }
}

// Inicjalizacja Canvas Mousedown Listenera
const canvas = document.getElementById('battleCanvas');
if (canvas) {
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const clickedAlly = battleState.allies.find(ally => {
            const dist = Math.hypot(ally.x - mouseX, ally.y - mouseY);
            return dist < 15;
        });

        if (clickedAlly) {
            selectedUnit = clickedAlly;
            showNotification(`Wybrano: ${selectedUnit.name || selectedUnit.className}`, "info");
            return;
        }

        if (selectedUnit) {
            selectedUnit.manualX = mouseX - 15;
            selectedUnit.manualY = mouseY - 15;
            showNotification("Wydano rozkaz ruchu", "success");
        }
    });
}

function launchMission(locationId) {
    console.log(`⚔️ Przygotowanie narady wojennej dla lokacji: ${locationId}`);
    preBattleSetup.currentTargetLocationId = locationId;

    preBattleSetup.selectedCommander = "Arkelas Maine"; 
    preBattleSetup.selectedCompanions = [];
    preBattleSetup.selectedUnits = [];

    const location = worldLocations[locationId];
    const infoEl = document.getElementById('pre-battle-info');
    const objectivesList = document.getElementById('pre-battle-objectives-list');

    if (infoEl) infoEl.innerText = `Wybrany cel: ${location.name}. ${location.description}`;
    if (objectivesList) {
        objectivesList.innerHTML = `
            <li>Wyeliminuj awangardę sił maga Zardasa.</li>
            <li>Przeżyj starcie i zabezpiecz cenne surowce strategiczne.</li>
        `;
    }

    renderPreBattleMenu();
    switchScreen('pre-battle');
}

function renderPreBattleMenu() {
    const commandersDiv = document.getElementById('pre-battle-commanders');
    const companionsDiv = document.getElementById('pre-battle-companions');
    const unitsDiv = document.getElementById('pre-battle-units');
    const counterSpan = document.getElementById('companion-counter');
    const startBtn = document.getElementById('btn-start-combat');

    if (commandersDiv) {
        commandersDiv.innerHTML = `
            <div style="background: #251d18; border: 1px solid #d4af37; padding: 10px; margin-top: 10px; text-align: center; color: #d4af37;">
                🛡️ <b>Arkelas Maine</b> <br> <span style="font-size: 0.8rem; color: #aaa;">Status: Gotowy</span>
            </div>
        `;
    }

    if (companionsDiv) {
        companionsDiv.innerHTML = '';
        companions.forEach((hero) => {
            const isSelected = preBattleSetup.selectedCompanions.includes(hero.name);
            const btn = document.createElement('button');
            btn.className = isSelected ? 'btn-selected' : 'btn-unselected';
            btn.style.width = "100%";
            btn.style.textAlign = "left";
            btn.style.padding = "8px";
            btn.style.background = isSelected ? "#15803d" : "#221c18";
            btn.style.border = isSelected ? "1px solid #22c55e" : "1px solid #554337";
            btn.style.color = "#fff";
            btn.style.cursor = "pointer";

            btn.innerHTML = `${isSelected ? '✅' : '➕'} <b>${hero.name}</b> <br><span style="font-size: 0.75rem; color: #b0a095;">${hero.role} (${hero.race})</span>`;
            btn.onclick = () => togglePreBattleCompanion(hero.name);
            companionsDiv.appendChild(btn);
        });
    }

    if (counterSpan) counterSpan.innerText = preBattleSetup.selectedCompanions.length;

    if (unitsDiv) {
        unitsDiv.innerHTML = '';
        const readyUnits = gameState.army.filter(u => u.status === "Ready");

        if (readyUnits.length === 0) {
            unitsDiv.innerHTML = '<p style="color: #777; font-size: 0.85rem; text-align: center;">Brak wolnych żołnierzy w koszarach! Zwerbuj ich w Obozie.</p>';
        } else {
            readyUnits.forEach(unit => {
                const isSelected = preBattleSetup.selectedUnits.includes(unit.id);
                const item = document.createElement('div');
                item.style.display = "flex";
                item.style.justifyContent = "space-between";
                item.style.alignItems = "center";
                item.style.background = isSelected ? "#1e3a8a" : "#221c18";
                item.style.border = isSelected ? "1px solid #3b82f6" : "1px solid #554337";
                item.style.padding = "6px 10px";
                item.style.borderRadius = "3px";

                const weaponIcon = unit.equipment.weapon ? "⚔️" : "🗡️";
                const armorIcon = unit.equipment.armor ? "🛡️" : "🦺";

                item.innerHTML = `
                    <div style="font-size: 0.85rem; color: #fff;">
                        <b>${unit.name}</b> (${unit.className}) <br>
                        <span style="font-size: 0.75rem; color: #a5948a;">HP: ${unit.stats.hp} | ATK: ${unit.stats.atk} | ${weaponIcon}${armorIcon}</span>
                    </div>
                    <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="togglePreBattleUnit('${unit.id}')" style="transform: scale(1.2); cursor: pointer;">
                `;
                unitsDiv.appendChild(item);
            });
        }
    }

    if (startBtn) {
        const hasForces = preBattleSetup.selectedCompanions.length > 0 || preBattleSetup.selectedUnits.length > 0;
        startBtn.disabled = !hasForces;
        startBtn.style.opacity = hasForces ? "1" : "0.5";
    }
}

function togglePreBattleCompanion(heroName) {
    const index = preBattleSetup.selectedCompanions.indexOf(heroName);
    if (index > -1) {
        preBattleSetup.selectedCompanions.splice(index, 1);
    } else {
        if (preBattleSetup.selectedCompanions.length >= 3) {
            alert("Możesz zabrać maksymalnie 3 towarzyszy na tę misję taktyczną!");
            return;
        }
        preBattleSetup.selectedCompanions.push(heroName);
    }
    renderPreBattleMenu();
}

function togglePreBattleUnit(unitId) {
    const index = preBattleSetup.selectedUnits.indexOf(unitId);
    if (index > -1) {
        preBattleSetup.selectedUnits.splice(index, 1);
    } else {
        preBattleSetup.selectedUnits.push(unitId);
    }
    renderPreBattleMenu();
}

function findNearestTarget(unit, enemiesPool) {
    let nearestEnemy = null;
    let shortestDistance = Infinity;

    enemiesPool.forEach(enemy => {
        if (enemy.stats && enemy.stats.hp <= 0) return; 
        
        const dist = Math.hypot(enemy.x - unit.x, enemy.y - unit.y);
        if (dist < shortestDistance) {
            shortestDistance = dist;
            nearestEnemy = enemy;
        }
    });
    return nearestEnemy;
}

// Bitwa tekstowa turn-based
function startBattle() {
    const logContainer = document.getElementById('battle-log');
    if (logContainer) logContainer.innerHTML = `<div class="log-entry">Bitwa rozpoczęta! Przygotuj się...</div>`;

    if (arkelasState) arkelasState.currentHp = arkelasState.maxHp;

    const currentBossId = preBattleSetup.selectedEnemy;
    const bossData = enemies.find(e => e.id === currentBossId) || enemies[0];
    
    window.activeEnemyState = {
        name: bossData.name,
        hp: bossData.hp,
        maxHp: bossData.hp,
        attacks: bossData.attacks
    };

    const nameEl = document.getElementById('battle-enemy-name');
    if (nameEl) nameEl.innerText = activeEnemyState.name;
    
    renderHeroAbilitiesPanel();
    updateBattleUI();
    switchScreen('battle');
}

// Bitwa RTS Canvas
function confirmAndStartCombat() {
    console.log("🚀 Narada zakończona. Sformowane oddziały ruszają do boju na Canvasie!");

    battleState.allies = [];
    battleState.enemies = [];
    battleState.combatLog = [];

    battleState.allies.push({
        id: 'hero_arkelas',
        name: 'Arkelas Maine',
        className: 'Strateg / Dowódca',
        x: 50,
        y: 150,
        speed: 2.0,
        target: null,
        stats: { hp: 300, maxHp: 300, atk: 25, attackRange: 40, color: "#eab308" }
    });

    preBattleSetup.selectedCompanions.forEach((heroName, idx) => {
        const foundData = companions.find(c => c.name === heroName);
        if (foundData) {
            battleState.allies.push({
                id: `battle_companion_${idx}`,
                name: heroName,
                className: foundData.role,
                ability: foundData.ability,
                x: 50,
                y: 200 + (idx * 55),
                speed: 1.5,
                target: null,
                stats: {
                    hp: foundData.role === 'Tank' ? 250 : 150,
                    maxHp: foundData.role === 'Tank' ? 250 : 150,
                    atk: foundData.role === 'Battle-Mage' ? 30 : 18,
                    attackRange: foundData.role === 'Battle-Mage' ? 100 : 45,
                    color: "#22c55e"
                }
            });
        }
    });

    preBattleSetup.selectedUnits.forEach((unitId, idx) => {
        const actualSoldier = gameState.army.find(u => u.id === unitId);
        if (actualSoldier) {
            battleState.allies.push({
                id: actualSoldier.id,
                name: actualSoldier.name,
                className: actualSoldier.className,
                x: 90,
                y: 100 + (idx * 50),
                speed: 1.5,
                target: null,
                stats: actualSoldier.stats 
            });
        }
    });

    const canvas = document.getElementById('battleCanvas');
    const canvasWidth = canvas ? canvas.width : 800;
    generateEnemiesForBattle(canvasWidth);

    switchScreen('battle');
    renderHeroAbilitiesPanel();
    battleState.isRunning = true;
}

// ==========================================
// 3. GENERATOR I REKRUTACJA JEDNOSTEK
// ==========================================
function generateSoldier(race) {
    const pool = soldierPools[race] || soldierPools.human;
    const classKeys = Object.keys(unitClasses);
    const randomClassKey = classKeys[Math.floor(Math.random() * classKeys.length)];
    const selectedClass = unitClasses[randomClassKey];

    const randomName = pool.names[Math.floor(Math.random() * pool.names.length)];
    const randomSkin = pool.skins[Math.floor(Math.random() * pool.skins.length)];
    const randomEyes = pool.eyes[Math.floor(Math.random() * pool.eyes.length)];
    const randomHair = pool.hair[Math.floor(Math.random() * pool.hair.length)];

    return {
        id: 'unit_' + Math.random().toString(36).substr(2, 9),
        name: randomName,
        race: race,
        classType: randomClassKey,
        className: selectedClass.className,
        appearance: { skinColor: randomSkin, eyeColor: randomEyes, hairStyle: randomHair },
        stats: {
            hp: selectedClass.hp,
            maxHp: selectedClass.hp,
            atk: selectedClass.atk,
            attackRange: selectedClass.range,
            color: selectedClass.color,
            xp: 0,
            level: 1
        },
        equipment: { weapon: null, armor: null, trinket: null },
        status: "Ready"
    };
}

function recruitSoldier(race) {
    if (gameState.resources.gold >= 50) {
        gameState.resources.gold -= 50;
        const newRecruit = generateSoldier(race);
        gameState.army.push(newRecruit);
        updateResourcesUI();
        console.log(`⚔️ Zrekrutowano: ${newRecruit.name} (${race})!`);
        return newRecruit;
    } else {
        console.log("❌ Za mało złota na rekrutację!");
        return null;
    }
}

function recruitSoldierTest() {
    const newUnit = recruitSoldier('human'); 
    if (newUnit) {
        renderBarracks(); 
        showNotification(`Zrekrutowano wojownika: ${newUnit.name}!`, "success");
    }
}

// ==========================================
// 4. KOSZARY I ZARZĄDZANIE EKWIPUNKIEM
// ==========================================
function renderBarracks() {
    const heroesList = document.getElementById('heroes-list');
    const soldiersList = document.getElementById('soldiers-list');

    if (heroesList) heroesList.innerHTML = '';
    if (soldiersList) soldiersList.innerHTML = '';

    const createSlotsHtml = (unitId, isHero, eq) => {
        const weaponText = eq.weapon ? `⚔️ ${eq.weapon}` : '🗡️ Pusty Slot';
        const armorText = eq.armor ? `🛡️ ${eq.armor}` : '🦺 Pusty Slot';
        return `
            <div class="unit-equipment" style="display: flex; gap: 8px; margin-top: 8px;">
                <button onclick="equipItem('${unitId}', ${isHero}, 'weapon')" class="equip-btn-action" style="font-size: 0.75rem; padding: 4px 8px;">${weaponText}</button>
                <button onclick="equipItem('${unitId}', ${isHero}, 'armor')" class="equip-btn-action" style="font-size: 0.75rem; padding: 4px 8px;">${armorText}</button>
            </div>
        `;
    };

    companions.forEach((hero, index) => {
        if (!hero.equipment) hero.equipment = { weapon: null, armor: null, trinket: null };
        const heroId = `hero_${index}`;
        const card = document.createElement('div');
        card.className = 'unit-card';
        card.innerHTML = `
            <div class="unit-info">
                <h4>${hero.name}</h4>
                <p>Rasa: ${hero.race} | Rola: ${hero.role}</p>
                ${createSlotsHtml(heroId, true, hero.equipment)}
            </div>
            <span class="badge" style="border: 1px solid #d4af37; color: #d4af37;">Oficer</span>
        `;
        if (heroesList) heroesList.appendChild(card);
    });

    if (gameState.army.length === 0) {
        if (soldiersList) soldiersList.innerHTML = '<p style="color: #777; text-align: center; margin-top: 20px;">Brak jednostek. Zwerbuj kogoś powyżej!</p>';
    } else {
        gameState.army.forEach(soldier => {
            const card = document.createElement('div');
            card.className = 'unit-card';
            card.innerHTML = `
                <div class="unit-info">
                    <h4>${soldier.name}</h4>
                    <p>Klasa: <b>${soldier.className || 'Wojownik'}</b> | Rasa: ${soldier.race} | HP: ${soldier.stats.hp}/${soldier.stats.maxHp} | Lvl: ${soldier.stats.level}</p>
                    ${createSlotsHtml(soldier.id, false, soldier.equipment)}
                </div>
                <span class="badge">${soldier.status}</span>
            `;
            if (soldiersList) soldiersList.appendChild(card);
        });
    }
}

function equipItem(unitId, isHero, slotType) {
    let unit = null;
    if (isHero) {
        const index = parseInt(unitId.split('_')[1]);
        unit = companions[index];
    } else {
        unit = gameState.army.find(s => s.id === unitId);
    }
    if (!unit) return;

    if (unit.equipment[slotType]) {
        const oldItem = unit.equipment[slotType];
        if (slotType === 'weapon') gameState.inventory.swords++;
        if (slotType === 'armor') gameState.inventory.armors++;
        unit.equipment[slotType] = null;
        if (!isHero && unit.stats) {
            if (slotType === 'weapon') unit.stats.atk -= 10;
            if (slotType === 'armor') {
                unit.stats.maxHp -= 50;
                unit.stats.hp = Math.min(unit.stats.hp, unit.stats.maxHp);
            }
        }
        showNotification(`Zdemontowano: ${oldItem}`, 'info');
        renderBarracks();
        return;
    }

    if (slotType === 'weapon') {
        if (gameState.inventory.swords > 0) {
            gameState.inventory.swords--;
            unit.equipment.weapon = "Miecz ze Stali Elfów";
            if (!isHero) unit.stats.atk += 10;
            showNotification("Wyposażono w broń!", "success");
        } else {
            alert("Brak wolnych mieczy w kuźni obozowej!");
        }
    } else if (slotType === 'armor') {
        if (gameState.inventory.armors > 0) {
            gameState.inventory.armors--;
            unit.equipment.armor = "Żelazny Pancerz";
            if (!isHero) {
                unit.stats.maxHp += 50;
                unit.stats.hp += 50;
            }
            showNotification("Wyposażono w pancerz!", "success");
        } else {
            alert("Brak wolnych pancerzy w kuźni obozowej!");
        }
    }
    renderBarracks();
}

// ==========================================
// 5. TAKTYKA I PODSTAWOWA WALKA CANVAS RTS
// ==========================================
function findClosestTarget(unit, targetsCollection) {
    if (unit.target && unit.target.stats && unit.target.stats.hp > 0) return unit.target;
    let closest = null;
    let minDistance = Infinity;
    const aliveTargets = targetsCollection.filter(t => t.stats && t.stats.hp > 0);
    for (let target of aliveTargets) {
        let dx = target.x - unit.x;
        let dy = target.y - unit.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) {
            minDistance = distance;
            closest = target;
        }
    }
    return closest;
}

function setupBattle() {
    const canvas = document.getElementById('battleCanvas');
    if (!canvas) return;
    selectedAlly = null;

    canvas.onclick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const clickedAlly = battleState.allies.find(ally =>
            ally.stats && ally.stats.hp > 0 &&
            mouseX >= ally.x && mouseX <= ally.x + 30 &&
            mouseY >= ally.y && mouseY <= ally.y + 30
        );
        if (clickedAlly) {
            selectedAlly = clickedAlly;
            showNotification(`Wybrano: ${selectedAlly.name}`, 'info');
        } else if (selectedAlly) {
            selectedAlly.manualX = mouseX - 15;
            selectedAlly.manualY = mouseY - 15;
            selectedAlly.target = null;
        }
    };

    if (battleState.allies && battleState.allies.length > 0) {
        if (battleState.enemies.length === 0) {
            generateEnemiesForBattle(canvas.width);
        }
        return;
    }

    battleState.allies = [];
    battleState.enemies = [];
    battleState.isRunning = true;

    const readyUnits = gameState.army.filter(s => s.status === "Ready");
    readyUnits.forEach((soldier, index) => {
        battleState.allies.push({
            ...soldier,
            x: 50,
            y: 100 + (index * 50),
            speed: 1.5,
            target: null
        });
    });

    if (battleState.allies.length === 0) {
        battleState.allies.push({
            id: 'arkelas_mvp',
            name: 'Arkelas (Dowódca)',
            stats: { hp: 250, maxHp: 250, atk: 25, attackRange: 35, color: '#00ffcc' },
            x: 50,
            y: 200,
            speed: 2,
            target: null
        });
    }
    generateEnemiesForBattle(canvas.width);
}

function generateEnemiesForBattle(canvasWidth) {
    let enemyCount = 3 + gameState.currentAct;
    for (let i = 0; i < enemyCount; i++) {
        battleState.enemies.push({
            id: 'enemy_' + i,
            name: preBattleSetup.currentTargetLocationId === 'thicket' ? 'Skażony Wilk' : 'Sługa Zardasa',
            stats: { hp: 80, maxHp: 80, atk: 8, attackRange: 35, color: '#ef4444' },
            x: canvasWidth - 80,
            y: 80 + (i * 60),
            speed: 1.2,
            target: null
        });
    }
}

function updateBattleUI() {
    if (!arkelasState || !window.activeEnemyState) return;

    const pBar = document.getElementById('player-hp-bar');
    const pText = document.getElementById('player-hp-text');
    const eBar = document.getElementById('enemy-hp-bar');
    const eText = document.getElementById('enemy-hp-text');

    const playerHpPct = Math.max(0, (arkelasState.currentHp / arkelasState.maxHp) * 100);
    if (pBar) pBar.style.width = `${playerHpPct}%`;
    if (pText) pText.innerText = `${arkelasState.currentHp} / ${arkelasState.maxHp} HP`;

    const enemyHpPct = Math.max(0, (window.activeEnemyState.hp / window.activeEnemyState.maxHp) * 100);
    if (eBar) eBar.style.width = `${enemyHpPct}%`;
    if (eText) eText.innerText = `${window.activeEnemyState.hp} / ${window.activeEnemyState.maxHp} HP`;
}

function startBattleCanvasLoop() {
    setupBattle();
    const canvas = document.getElementById('battleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (canvasLoopInterval) clearInterval(canvasLoopInterval);

    canvasLoopInterval = setInterval(() => {
        if (!battleState.isRunning) return;

        battleState.allies.forEach(ally => {
            if (ally.stats.hp <= 0) return;

            if (ally.manualX !== undefined && ally.manualY !== undefined) {
                const distX = ally.manualX - ally.x;
                const distY = ally.manualY - ally.y;
                const dist = Math.sqrt(distX * distX + distY * distY);
                if (dist > 4) {
                    ally.x += (distX / dist) * ally.speed;
                    ally.y += (distY / dist) * ally.speed;
                    return;
                } else {
                    delete ally.manualX;
                    delete ally.manualY;
                }
            }

            const aliveEnemies = battleState.enemies.filter(e => e.stats.hp > 0);
            if (aliveEnemies.length > 0) {
                let closest = findClosestTarget(ally, battleState.enemies);
                ally.target = closest;
                const dynamicRange = ally.stats.attackRange || 35;

                if (ally.x < closest.x - dynamicRange) {
                    ally.x += ally.speed;
                } else if (Math.abs(ally.y - closest.y) > 5) {
                    ally.y += ally.y < closest.y ? ally.speed : -ally.speed;
                } else {
                    closest.stats.hp -= ally.stats.atk * 0.05;
                }
            }
        });

        battleState.enemies.forEach(enemy => {
            if (enemy.stats.hp <= 0) return;
            const aliveAllies = battleState.allies.filter(a => a.stats.hp > 0);
            if (aliveAllies.length > 0) {
                let closest = findClosestTarget(enemy, battleState.allies);
                enemy.target = closest;
                const enemyRange = enemy.stats.attackRange || 35;

                if (enemy.x > closest.x + enemyRange) {
                    enemy.x -= enemy.speed;
                } else if (Math.abs(enemy.y - closest.y) > 5) {
                    enemy.y += enemy.y < closest.y ? enemy.speed : -enemy.speed;
                } else {
                    closest.stats.hp -= enemy.stats.atk * 0.05;
                }
            }
        });

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#1e231e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        battleState.allies.forEach(ally => {
            if (ally.stats.hp <= 0) return;
            ctx.fillStyle = ally.stats.color || "#3b82f6";
            ctx.fillRect(ally.x, ally.y, 30, 30);
            ctx.fillStyle = "red";
            ctx.fillRect(ally.x, ally.y - 10, 30, 4);
            ctx.fillStyle = "#22c55e";
            ctx.fillRect(ally.x, ally.y - 10, 30 * (ally.stats.hp / ally.stats.maxHp), 4);
        });

        battleState.enemies.forEach(enemy => {
            if (enemy.stats.hp <= 0) return;
            ctx.fillStyle = enemy.stats.color || "#ef4444";
            ctx.fillRect(enemy.x, enemy.y, 30, 30);
            ctx.fillStyle = "red";
            ctx.fillRect(enemy.x, enemy.y - 10, 30, 4);
            ctx.fillStyle = "#22c55e";
            ctx.fillRect(enemy.x, enemy.y - 10, 30 * (enemy.stats.hp / enemy.stats.maxHp), 4);
        });

        const totalAlliesAlive = battleState.allies.filter(a => a.stats.hp > 0).length;
        const totalEnemiesAlive = battleState.enemies.filter(e => e.stats.hp > 0).length;

        if (totalEnemiesAlive === 0) endBattleResolution(true);
        else if (totalAlliesAlive === 0) endBattleResolution(false);

    }, 1000 / 30);
}

function endBattleResolution(isVictory) {
    battleState.isRunning = false;
    clearInterval(canvasLoopInterval);

    if (isVictory) {
        let baseGold = 100;
        if (preBattleSetup.currentTargetLocationId === 'mine') baseGold += 200;
        gameState.resources.gold += baseGold;
        alert(`🎉 Zwycięstwo! Odepchnięto siły wroga. Zdobyto: ${baseGold} Złota!`);
    } else {
        gameState.resources.supply = Math.max(0, gameState.resources.supply - 15);
        alert(`💀 Porażka! Twoje wojska zostały rozbite. Stracono zaopatrzenie.`);
    }

    battleState.allies.forEach(battleUnit => {
        if (battleUnit.id === 'arkelas_mvp' || battleUnit.id === 'hero_arkelas') return;
        let realSoldier = gameState.army.find(s => s.id === battleUnit.id);
        if (realSoldier) {
            if (battleUnit.stats.hp <= 0) {
                realSoldier.status = "Wounded";
                realSoldier.stats.hp = 1;
            } else {
                realSoldier.stats.hp = Math.floor(battleUnit.stats.hp);
                realSoldier.stats.xp += 25;
            }
        }
    });

    gameState.resources.herbs += Math.floor(Math.random() * 5) + 1;
    switchScreen('camp');
}

// ==========================================
// 6. OBOZOWISKO: DIALOGI I INTERFEJS
// ==========================================
function renderCampCompanions() {
    const container = document.getElementById('campfire-companions');
    if (!container) return;
    container.innerHTML = '';
    
    companions.forEach(hero => {
        const token = document.createElement('div');
        token.className = 'companion-card';
        token.style.cssText = "padding: 10px; background: #2a2019; border: 1px solid #554337; text-align: center; border-radius: 4px; cursor: pointer;";
        token.innerHTML = `
            <strong style="color: #d4af37;">${hero.name}</strong>
            <p style="margin: 5px 0 0 0; font-size: 0.8rem; color: #a5948a;">${hero.role} (${hero.race})</p>
        `;
        token.onclick = () => triggerCampDialogue(hero);
        container.appendChild(token);
    });
}

function triggerCampDialogue(hero) {
    const bubble = document.getElementById('dialogue-bubble');
    const speaker = document.getElementById('dialogue-speaker');
    const text = document.getElementById('dialogue-text');
    if (speaker) speaker.innerText = hero.name;

    let dialogue = "Witaj Arkelasie. Czekam na Twoje rozkazy przy ognisku.";
    if (hero.role === "Battle-Mage") dialogue = "Uniwersytet Elen-Varski dobrze nas przygotował, Arkelasie. Czuję czarną magię.";
    if (hero.role === "Tank") dialogue = "Mój młot i runy kowalskie są gotowe, Brachu!";
    if (hero.role === "Saper") dialogue = "Hehe... mam przygotowane parę wybuchowych niespodzianek.";

    if (text) text.innerText = dialogue;
    if (bubble) bubble.classList.remove('hidden');
}

function closeDialogue() {
    const bubble = document.getElementById('dialogue-bubble');
    if (bubble) bubble.classList.add('hidden');
}

// ==========================================
// 7. STRUKTURA DYNAMICZNEJ MAPY ŚWIATA
// ==========================================
let mapZoom = 1;
let mapX = 0;
let mapY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_SPEED = 0.04;

function initMapControls() {
    const viewport = document.querySelector('.map-viewport');
    const mapContainer = document.getElementById('map-locations-container');
    if (!viewport || !mapContainer) return;

    const mapWidth = 2400;
    const mapHeight = 1800;

    if (mapX === 0 && mapY === 0) {
        mapX = (viewport.clientWidth / 2) - ((mapWidth * mapZoom) / 2);
        mapY = (viewport.clientHeight / 2) - ((mapHeight * mapZoom) / 2);
    }

    function updateMapTransform() {
        mapContainer.style.transform = `translate(${mapX}px, ${mapY}px) scale(${mapZoom})`;
    }
    updateMapTransform();

    viewport.onwheel = (e) => {
        e.preventDefault();
        const rect = viewport.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const mapMouseX = (mouseX - mapX) / mapZoom;
        const mapMouseY = (mouseY - mapY) / mapZoom;

        if (e.deltaY > 0) mapZoom = Math.max(MIN_ZOOM, mapZoom - ZOOM_SPEED);
        else mapZoom = Math.min(MAX_ZOOM, mapZoom + ZOOM_SPEED);

        mapX = mouseX - mapMouseX * mapZoom;
        mapY = mouseY - mapMouseY * mapZoom;
        updateMapTransform();
    };

    viewport.onmousedown = (e) => {
        isDragging = true;
        startX = e.clientX - mapX;
        startY = e.clientY - mapY;
        viewport.style.cursor = 'grabbing';
    };

    window.onmouseup = () => {
        isDragging = false;
        if (viewport) viewport.style.cursor = 'grab';
    };

    viewport.onmousemove = (e) => {
        if (!isDragging) return;
        mapX = e.clientX - startX;
        mapY = e.clientY - startY;
        updateMapTransform();
    };
}

function renderWorldMap() {
    const container = document.getElementById('map-locations-container');
    if (!container) return;
    container.innerHTML = '';

    Object.values(worldLocations).forEach(loc => {
        const isUnlocked = travelState.unlockedLocations.includes(loc.id);
        const nodeEl = document.createElement('div');
        nodeEl.className = `map-location-node ${isUnlocked ? 'unlocked' : 'locked'}`;
        nodeEl.style.left = `${loc.mapX}px`;
        nodeEl.style.top = `${loc.mapY}px`;

        let icon = '⚔️';
        if (loc.id === 'inn') icon = '🍺';

        nodeEl.innerHTML = `
            <div class="node-icon">${icon}</div>
            <div class="node-name">
                ${loc.name}<br>
                <small style="color: #d4af37; font-weight: normal;">${loc.travelTime * gameState.supplyConsumptionPerDay} 📦</small>
            </div>
        `;
        if (isUnlocked) {
            nodeEl.onclick = () => initiateTravel(loc.id);
        }
        container.appendChild(nodeEl);
    });
    initMapControls();
}

// ==========================================
// 8. RZEMIOSŁO W KUŹNI (SMITHY)
// ==========================================
function updateSmithyUI() {
    const swordsEl = document.getElementById('inv-swords');
    const armorsEl = document.getElementById('inv-armors');
    const hornEl = document.getElementById('inv-horn');
    if (swordsEl) swordsEl.innerText = gameState.inventory.swords;
    if (armorsEl) armorsEl.innerText = gameState.inventory.armors;
    if (hornEl) hornEl.innerText = gameState.inventory.hornOfCourage;
}

function craftItem(itemKey, goldCost, coinCost) {
    if (gameState.resources.gold < goldCost || gameState.resources.commanderCoins < coinCost) {
        alert("Brak wystarczających surowców w kuźni!");
        return;
    }
    gameState.resources.gold -= goldCost;
    gameState.resources.commanderCoins -= coinCost;

    if (itemKey === 'swords') gameState.inventory.swords++;
    if (itemKey === 'armors') gameState.inventory.armors++;
    if (itemKey === 'horn') gameState.inventory.hornOfCourage++;

    updateResourcesUI();
    updateSmithyUI();
    console.log(`⚒️ Brammer wykuł przedmiot: ${itemKey}!`);
}

// ==========================================
// 9. TAWERNA: PATROLE LOGISTYCZNE
// ==========================================
function startCampExpedition() {
    if (gameState.isExpeditionRunning) return;
    if (gameState.resources.supply < 15) {
        alert("Brak 15 jednostek Zaopatrzenia na wyprawę!");
        return;
    }

    gameState.resources.supply -= 15;
    gameState.isExpeditionRunning = true;
    updateResourcesUI();

    const btnExp = document.getElementById('btn-expedition');
    if (btnExp) btnExp.disabled = true;

    const progressContainer = document.getElementById('expedition-progress-container');
    const progressFill = document.getElementById('expedition-progress-fill');
    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressFill) progressFill.style.width = '0%';

    let width = 0;
    const interval = setInterval(() => {
        if (width >= 100) clearInterval(interval);
        else {
            width += 5;
            if (progressFill) progressFill.style.width = width + '%';
        }
    }, 150);

    setTimeout(() => {
        const earnedGold = Math.floor(Math.random() * 41) + 80;
        gameState.resources.gold += earnedGold;
        gameState.isExpeditionRunning = false;
        if (btnExp) btnExp.disabled = false;
        if (progressContainer) progressContainer.classList.add('hidden');

        updateResourcesUI();
        alert(`💰 Patrol wrócił! Zabezpieczono łupy: +${earnedGold} Złota.`);
    }, 3000);
}

// ==========================================
// 10. SZPITAL POLOWY (INFIRMARY)
// ==========================================
function renderInfirmary() {
    const goldEl = document.getElementById('infirmary-gold');
    const herbsEl = document.getElementById('infirmary-herbs');
    if (goldEl) goldEl.textContent = gameState.resources.gold;
    if (herbsEl) herbsEl.textContent = gameState.resources.herbs;

    const woundedListContainer = document.getElementById('wounded-list');
    if (!woundedListContainer) return;
    woundedListContainer.innerHTML = '';

    const woundedSoldiers = gameState.army.filter(soldier => soldier.status === 'Wounded');
    const countEl = document.getElementById('wounded-count');
    if (countEl) countEl.textContent = woundedSoldiers.length;

    if (woundedSoldiers.length === 0) {
        woundedListContainer.innerHTML = `<p style="color: #777; text-align: center;">🎉 Wszyscy żołnierze są zdrowi!</p>`;
        return;
    }

    woundedSoldiers.forEach(soldier => {
        const card = document.createElement('div');
        const canAfford = gameState.resources.gold >= HEALING_COSTS.gold &&
            gameState.resources.herbs >= HEALING_COSTS.herbs;

        card.innerHTML = `
            <div style="padding: 10px; background: #251d18; margin-bottom: 5px; border: 1px solid #554337;">
                <h4>${soldier.name} (Lvl ${soldier.stats.level})</h4>
                <p style="color: #ef4444;">HP: ${soldier.stats.hp} / ${soldier.stats.maxHp}</p>
                <button class="btn" onclick="healSoldier('${soldier.id}')" ${!canAfford ? 'disabled' : ''}>🩹 Ulecz (💰${HEALING_COSTS.gold} 🌿${HEALING_COSTS.herbs})</button>
            </div>
        `;
        woundedListContainer.appendChild(card);
    });
}

function healSoldier(soldierId) {
    const soldier = gameState.army.find(s => s.id === soldierId);
    if (!soldier || gameState.resources.gold < HEALING_COSTS.gold || gameState.resources.herbs < HEALING_COSTS.herbs) return;

    gameState.resources.gold -= HEALING_COSTS.gold;
    gameState.resources.herbs -= HEALING_COSTS.herbs;
    soldier.status = 'Ready';
    soldier.stats.hp = soldier.stats.maxHp;

    showNotification(`Uleczono żołnierza: ${soldier.name}`, "success");
    renderInfirmary();
    updateResourcesUI();
}

// ==========================================
// 11. KONTROLA EKRANÓW INTERFEJSU
// ==========================================
function switchScreen(screenId) {
    document.querySelectorAll('.game-screen').forEach(screen => screen.classList.add('hidden'));
    const activeScreen = document.getElementById(`screen-${screenId}`);
    if (activeScreen) activeScreen.classList.remove('hidden');

    updateResourcesUI();
    if (screenId === 'camp') renderCampCompanions();
    if (screenId === 'battle') startBattleCanvasLoop();
    if (screenId === 'barracks') renderBarracks();
    if (screenId === 'world-map') renderWorldMap();
    if (screenId === 'smithy') updateSmithyUI();
    if (screenId === 'infirmary') renderInfirmary();
}

function updateResourcesUI() {
    const elements = {
        'val-gold': gameState.resources.gold,
        'val-supply': gameState.resources.supply,
        'val-herbs': gameState.resources.herbs,
        'val-tokens': gameState.resources.commanderCoins,
        'val-essence': gameState.resources.starEssence,

        'res-gold': gameState.resources.gold,
        'res-supplies': gameState.resources.supply,
        'map-supplies-display': gameState.resources.supply,
        'smithy-res-gold': gameState.resources.gold,
        'smithy-res-coins': gameState.resources.commanderCoins,
        'res-coins': gameState.resources.commanderCoins
    };
    
    for (let id in elements) {
        const el = document.getElementById(id);
        if (el) el.innerText = elements[id];
    }
    
    if (mineLvlDisplay) mineLvlDisplay.innerText = gameState.mine.level;
    if (mineIncomeDisplay) mineIncomeDisplay.innerText = gameState.mine.income;
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

window.onload = () => {
    switchScreen('menu');
    
    // Zabezpieczenie listenerów dla Kopalni po załadowaniu drzewa DOM
    if (btnRaid) {
        btnRaid.onclick = () => {
            gameState.resources.gold += 10;
            updateResourcesUI();
            showNotification("Szybki łup zabezpieczony! +10 Złota", "success");
        };
    }

    if (btnUpgrade) {
        btnUpgrade.onclick = () => {
            if (gameState.resources.gold >= gameState.mine.upgradeCost) {
                gameState.resources.gold -= gameState.mine.upgradeCost;
                gameState.mine.level++;
                gameState.mine.income += 2; 
                gameState.mine.upgradeCost = Math.floor(gameState.mine.upgradeCost * 1.5);
                
                btnUpgrade.innerText = `Rozbuduj kopalnię (Koszt: ${gameState.mine.upgradeCost} Złota)`;
                updateResourcesUI();
                showNotification(`Kopalnia ulepszona do poziomu ${gameState.mine.level}!`, "success");
            } else {
                alert(`Bratku, brakuje Ci złota! Potrzebujesz ${gameState.mine.upgradeCost} monet.`);
            }
        };
    }

    const recruitMageBtn = document.getElementById('btn-recruit-mage');
    if (recruitMageBtn) {
        recruitMageBtn.addEventListener('click', recruitBattleMage);
    }
};

// ==========================================
// 12. OBSŁUGA ZDOLNOŚCI I SIDEBARU BITWY
// ==========================================
function renderBattleAbilitiesPanel() {
    const panel = document.getElementById('hero-abilities-panel');
    if (!panel) return;
    panel.innerHTML = ""; 

    if (arkelasState && arkelasState.ability) {
        createAbilityButton(arkelasState.ability, "Dowódca (TY)", panel, true);
    }
    
    preBattleSetup.selectedCompanions.forEach(compName => {
        const companion = companions.find(c => c.name === compName);
        if (companion && companion.ability) {
            createAbilityButton(companion.ability, companion.name, panel, false);
        }
    });
}

function createAbilityButton(ability, ownerName, parentElement, isCommander) {
    const abilityBtn = document.createElement('button');
    abilityBtn.className = 'ability-btn';
    
    const borderColor = isCommander ? '#d4af37' : '#554337';
    const bgGradient = isCommander ? 'linear-gradient(135deg, #2f2219, #1a120c)' : '#251d18';

    abilityBtn.style.cssText = `
        padding: 10px;
        background: ${bgGradient};
        color: #d4af37;
        border: 1px solid ${borderColor};
        border-radius: 4px;
        cursor: pointer;
        text-align: left;
        font-size: 0.8rem;
        margin-bottom: 8px;
        display: block;
        width: 100%;
        box-shadow: ${isCommander ? '0 0 5px rgba(212, 175, 55, 0.2)' : 'none'};
    `;
    
    abilityBtn.innerHTML = `
        <div style="font-size: 0.65rem; color: ${isCommander ? '#d4af37' : '#8a7a71'}; text-transform: uppercase; font-weight: bold;">
            ${ownerName}
        </div>
        <div style="font-weight: bold; color: #fff; margin-top: 2px;">${ability.name}</div>
        <div style="font-size: 0.7rem; color: #a5948a; margin-top: 3px; line-height: 1.2;">${ability.description}</div>
    `;

    abilityBtn.onclick = () => {
        executeHeroAbility(ability.id, isCommander);
    };
    parentElement.appendChild(abilityBtn);
}

function useBattleAbility(allyId) {
    if (!battleState.isRunning) return;

    const ally = battleState.allies.find(a => a.id === allyId);
    if (!ally || !ally.ability) return;

    showNotification(`✨ Aktywowano: ${ally.ability.name}!`, "success");

    switch (ally.ability.id) {
        case "star_magic":
            battleState.enemies.forEach(enemy => {
                if (enemy.stats.hp > 0) enemy.stats.hp -= 45;
            });
            showNotification("💥 Magia Gwiazd sieka całą falę wroga za 45 HP!", "info");
            break;
        case "runic_shield":
            ally.stats.hp = Math.min(ally.stats.maxHp, ally.stats.hp + 60);
            showNotification("🛡️ Tarcza Runiczna leczy Tanka o 60 HP!", "info");
            break;
        case "rooting_arrows":
            let target = battleState.enemies.find(e => e.stats.hp > 0);
            if (target) {
                target.stats.hp -= 50;
                showNotification(`🏹 Strzała unieruchamia i rani ${target.name}!`, "info");
            }
            break;
        default:
            battleState.enemies.forEach(enemy => {
                if (enemy.stats.hp > 0) enemy.stats.hp -= 20;
            });
            break;
    }

    const btn = document.getElementById(`btn-ability-${allyId}`);
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = "0.4";
        btn.style.cursor = "not-allowed";
    }
}

function renderBattleAbilities() {
    const panel = document.getElementById('hero-abilities-panel');
    if (!panel) return;

    let html = `
        <button onclick="executeHeroAbility('${arkelasState.ability.id}', true)" style="padding: 8px; background: #854d0e; color: white; border: 1px solid #a16207; text-align: left; cursor: pointer; border-radius: 3px;">
            <strong>${arkelasState.ability.name}</strong><br>
            <span style="font-size: 0.7rem; color: #eab308;">${arkelasState.ability.description}</span>
        </button>
    `;

    preBattleSetup.selectedCompanions.forEach(compName => {
        const comp = companions.find(c => c.name === compName);
        if (comp) {
            html += `
                <button onclick="executeHeroAbility('${comp.ability.id}', false)" style="padding: 8px; background: #251d18; color: #ccc; border: 1px solid #554337; text-align: left; cursor: pointer; margin-top: 4px; border-radius: 3px;">
                    <strong>${comp.ability.name}</strong> <small>(${comp.name})</small><br>
                    <span style="font-size: 0.7rem; color: #a5948a;">${comp.ability.description}</span>
                </button>
            `;
        }
    });
    panel.innerHTML = html;
}

function renderHeroAbilitiesPanel() {
    const panel = document.getElementById('hero-abilities-panel');
    if (!panel) return;
    panel.innerHTML = ""; 

    if (arkelasState && arkelasState.ability) {
        const commBtn = document.createElement('button');
        commBtn.style.cssText = "padding: 10px; background: #854d0e; color: #fff; border: 1px solid #d4af37; border-radius: 4px; cursor: pointer; text-align: left; font-size: 0.8rem; margin-bottom: 8px; width: 100%;";
        commBtn.innerHTML = `
            <div style="font-size: 0.65rem; color: #d4af37; text-transform: uppercase; font-weight: bold;">Dowódca (TY)</div>
            <div style="font-weight: bold; color: #fff; margin-top: 2px;">${arkelasState.ability.name}</div>
            <div style="font-size: 0.7rem; color: #ffeb3b; margin-top: 3px; line-height: 1.2;">${arkelasState.ability.description}</div>
        `;
        commBtn.onclick = () => executeHeroAbility(arkelasState.ability.id, true);
        panel.appendChild(commBtn);
    }

    preBattleSetup.selectedCompanions.forEach(compName => {
        const companion = companions.find(c => c.name === compName);
        if (!companion || !companion.ability) return;

        const btn = document.createElement('button');
        btn.style.cssText = "padding: 10px; background: #251d18; color: #ccc; border: 1px solid #554337; border-radius: 4px; cursor: pointer; text-align: left; font-size: 0.8rem; margin-bottom: 8px; width: 100%;";
        btn.innerHTML = `
            <div style="font-size: 0.65rem; color: #8a7a71; text-transform: uppercase; font-weight: bold;">${companion.name}</div>
            <div style="font-weight: bold; color: #fff; margin-top: 2px;">${companion.ability.name}</div>
            <div style="font-size: 0.7rem; color: #a5948a; margin-top: 3px; line-height: 1.2;">${companion.ability.description}</div>
        `;
        btn.onclick = () => executeHeroAbility(companion.ability.id, false);
        panel.appendChild(btn);
    });
}

// ==========================================
// 13. WIEŻA MAGII I PASYWNE GENEROWANIE
// ==========================================
function recruitBattleMage() {
    const MAGE_COST = 10;
    if (gameState.resources.starEssence >= MAGE_COST) {
        gameState.resources.starEssence -= MAGE_COST;
        gameState.battleMages += 1;
        updateMagicTowerUI();
        alert("Zrekrutowano Maga Bitewnego! Nowa siła w armii!");
    } else {
        alert("Masz za mało Esencji Gwiazd, bratku! Ruszaj do Prastarej Gęstwiny.");
    }
}

function updateMagicTowerUI() {
    const uiEssence = document.getElementById('ui-star-essence');
    const uiMages = document.getElementById('ui-mage-count');
    if (uiEssence) uiEssence.innerText = gameState.resources.starEssence;
    if (uiMages) uiMages.innerText = gameState.battleMages;
}

// Pętla pasywnego przychodu kopalni (co 1 sekunda)
setInterval(() => {
    if (gameState.mine && gameState.mine.income > 0) {
        gameState.resources.gold += gameState.mine.income;
        updateResourcesUI();
    }
}, 1000);

// Odpowiedź wroga w bitwie tekstowej
function enemyTurn() {
    if (!window.activeEnemyState || arkelasState.currentHp <= 0 || window.activeEnemyState.hp <= 0) return;

    const logContainer = document.getElementById('battle-log');
    const attacks = window.activeEnemyState.attacks;
    const randomAttack = attacks[Math.floor(Math.random() * attacks.length)];
    
    arkelasState.currentHp = Math.max(0, arkelasState.currentHp - randomAttack.damage);
    
    if (logContainer) {
        logContainer.innerHTML += `<div class="log-entry log-enemy" style="color: #ef4444;">👹 <strong>${window.activeEnemyState.name}</strong> używa <em>${randomAttack.name}</em> i zadaje Ci <strong>${randomAttack.damage}</strong> obrażeń!</div>`;
    }
    
    updateBattleUI();
    if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;

    if (arkelasState.currentHp <= 0) {
        if (logContainer) logContainer.innerHTML += `<div class="log-entry log-defeat" style="color: #b91c1c; font-weight: bold; font-size: 1.1rem; margin-top: 10px;">💀 PORAŻKA... Arkelas poległ w walce.</div>`;
    }
}