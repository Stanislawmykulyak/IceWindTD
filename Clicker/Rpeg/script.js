// 1. GLOBALNY OBIEKT STANU GRY (Mózg Gry)
const gameState = {
    currentAct: 1, // Akt I: Cień w Elenvair
    resources: {
        gold: 150,
        supplies: 60
    },
    campUpgrades: {
        infirmaryLevel: 1, // Szpital
        smithyLevel: 1      // Kuźnia
    },
    army: [] // Pula spersonalizowanych żołnierzy[cite: 4]
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

const companions = [
    { name: "Eleniel Voidweaver", race: "Elf", role: "Battle-Mage", assignedTo: null },
    { name: "Kaelen Moss-Foot", race: "Faun", role: "Pathfinder", assignedTo: null },
    { name: "Brammer Stoneshield", race: "Dwarf", role: "Tank", assignedTo: null },
    { name: "Vaelra Embersoul", race: "Drakonid", role: "Dragon-Knight", assignedTo: null },
    { name: "Korr Earth-Bound", race: "Goliath", role: "Juggernaut", assignedTo: null },
    { name: "Skrag Short-Fuse", race: "Goblin", role: "Saper", assignedTo: null }
];

let travelState = {
    currentLocation: 'camp',
    unlockedLocations: ['camp', 'forest'] // Na start odblokowany Obóz i Las
};

const mapLocations = [
    { id: 'camp', name: '⛺ Bezpieczna Polana', desc: 'Miejsce wypoczynku Twojej drużyny. Tu regenerujecie siły.', req: null },
    { id: 'forest', name: '🌲 Stary Las', desc: 'Gęste winorośle i grasujące wilki. Dobre miejsce na początek.', req: null },
    { id: 'caves', name: '🪨 Mroczne Jaskinie', desc: 'Kopalnie opanowane przez Gobliny. Wymaga zabezpieczenia Lasu.', req: 'forest' },
    { id: 'castle', name: '🏰 Zamek Zardasa', desc: 'Siedziba czarnoksiężnika. Ostateczne starcie.', req: 'caves' }
];

const travelQuotes = [
    "„Słońce chowało się za horyzontem, gdy drużyna przedzierała się przez gęste zarośla...”",
    "„Kroki ruszających w drogę wojowników zagłuszał jedynie niepokojący szum wiatru...”",
    "„Wędrówka przez te skażone ziemie niosła ze sobą wyraźny zapach krwi i spalenizny...”",
    "„Trzymając dłonie na rękojeściach mieczy, bacznie obserwowaliście korony drzew...”"
];


//System rekrutacji wojownikow 

function generateSoldier(race) {
    const pool = soldierPools[race] || soldierPools.human; // Fallback do ludzi

    // Losowanie tożsamości i wyglądu
    const randomName = pool.names[Math.floor(Math.random() * pool.names.length)];
    const randomSkin = pool.skins[Math.floor(Math.random() * pool.skins.length)];
    const randomEyes = pool.eyes[Math.floor(Math.random() * pool.eyes.length)];
    const randomHair = pool.hair[Math.floor(Math.random() * pool.hair.length)];

    // Zwracamy obiekt żołnierza z pełną strukturą statystyk i ekwipunku
    return {
        id: 'unit_' + Math.random().toString(36).substr(2, 9),
        name: randomName,
        race: race,
        appearance: {
            skinColor: randomSkin,
            eyeColor: randomEyes,
            hairStyle: randomHair
        },
        stats: {
            hp: 100,
            maxHp: 100,
            atk: 10,
            xp: 0,
            level: 1
        },
        equipment: {
            weapon: null, // Slot na broń z Kuźni
            armor: null,  // Slot na pancerz z Kuźni
            trinket: null // Slot na talizman od Skraga/Brammera
        },
        status: "Ready" // Ready / Wounded (Szpital Polowy)
    };
}

// Funkcja rekrutacji dodająca jednostkę do armii gracza
function recruitSoldier(race) {
    if (gameState.resources.gold >= 50) {
        gameState.resources.gold -= 50;
        const newRecruit = generateSoldier(race);
        gameState.army.push(newRecruit);

        updateResourcesUI();
        console.log(`⚔️ Zrekrutowano: ${newRecruit.name} (${race})! Wgląd w konsoli.`);
        return newRecruit;
    } else {
        console.log("❌ Za mało złota na rekrutację!");
        return null;
    }
}

function renderBarracks() {
    const heroesList = document.getElementById('heroes-list');
    const soldiersList = document.getElementById('soldiers-list');

    // Czyszczenie starych widoków
    heroesList.innerHTML = '';
    soldiersList.innerHTML = '';

    // 1. Renderowanie Bohaterów
    companions.forEach(hero => {
        const card = document.createElement('div');
        card.className = 'unit-card';
        card.innerHTML = `
            <div class="unit-info">
                <h4>${hero.name}</h4>
                <p>Race: ${hero.race} | Role: ${hero.role}</p>
                <p><small style="color: #d4af37;">Status: ${hero.assignedTo ? `Commands: ${hero.assignedTo}` : 'Wolny strzelec'}</small></p>
            </div>
            <span class="badge" style="border: 1px solid #d4af37;">Officer</span>
        `;
        heroesList.appendChild(card);
    });

    // 2. Renderowanie Zwerbowanych Żołnierzy
    if (gameState.army.length === 0) {
        soldiersList.innerHTML = '<p style="color: #777; text-align: center; margin-top: 20px;">Brak jednostek. Zwerbuj kogoś powyżej!</p>';
    } else {
        gameState.army.forEach(soldier => {
            const card = document.createElement('div');
            card.className = 'unit-card';
            card.innerHTML = `
                <div class="unit-info">
                    <h4>${soldier.name}</h4>
                    <p>Race: ${soldier.race} | Hp: ${soldier.stats.hp}/${soldier.stats.maxHp}</p>
                    <p><small>Hair: ${soldier.appearance.hairStyle} | Eyes: ${soldier.appearance.eyeColor}</small></p>
                </div>
                <span class="badge">${soldier.status}</span>
            `;
            soldiersList.appendChild(card);
        });
    }
}

// Funkcja pomocnicza dla przycisku w UI koszar
function recruitSoldierTest() {
    // Losujemy rasę dla testu
    const races = ['Human', 'Elf', 'Dwarf'];
    const randomRace = races[Math.floor(Math.random() * races.length)];

    const unit = recruitSoldier(randomRace);
    if (unit) {
        renderBarracks(); // Odśwież widok po rekrutacji
    } else {
        alert("Brak złota, bratku! Zakończ bitwę testową, żeby zarobić.");
    }
}


// 2. SYSTEM PRZEŁĄCZANIA EKRANÓW
function switchScreen(screenId) {
    // Ukryj absolutnie wszystkie ekrany gry
    document.querySelectorAll('.game-screen').forEach(screen => {
        screen.classList.add('hidden');
    });

    // Pokaż żądany ekran usuwając klasę hidden
    const activeScreen = document.getElementById(`screen-${screenId}`);
    if (activeScreen) {
        activeScreen.classList.remove('hidden');
    }

    // Odpal akcje specyficzne dla danego ekranu
    if (screenId === 'camp') {
        updateResourcesUI();
        renderCampCompanions(); // Odświeża postacie przy ognisku
    }
    if (screenId === 'battle') {
        startBattleCanvasLoop();
    }
    if (screenId === 'barracks') {
        renderBarracks();
    }
    if (screenId === 'world-map') {
        renderWorldMap();
    }
}

// 3. AKTUALIZACJA INTERFEJSU
function updateResourcesUI() {
    document.getElementById('res-gold').innerText = gameState.resources.gold;
    document.getElementById('res-supplies').innerText = gameState.resources.supplies;
}

// 4. PROSTY ZALĄŻEK KODU DLA BITWY (CANVAS)
let canvasLoopInterval = null;
function startBattleCanvasLoop() {
    const canvas = document.getElementById('battleCanvas');
    const ctx = canvas.getContext('2d');

    // Prosta pętla czyszcząca i rysująca prowizorycznego Arkelasa (Niebieski kwadrat)[cite: 4]
    if (canvasLoopInterval) clearInterval(canvasLoopInterval);

    canvasLoopInterval = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Rysowanie tła pola bitwy
        ctx.fillStyle = "#2e382e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Arkelas jako testowy kwadrat bojowy[cite: 4]
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(50, 200, 40, 40);
        ctx.fillStyle = "#fff";
        ctx.fillText("Arkelas (MVP)", 45, 190);
    }, 1000 / 30); // 30 FPS
}

// 5. TEST WYJŚCIA Z BITWY DO OBOZU
function finishBattleTest() {
    clearInterval(canvasLoopInterval);
    // Symulacja zużycia zasobów po starciu
    gameState.resources.gold += 50;
    gameState.resources.supplies -= 10;
    switchScreen('camp');
}

// Inicjalizacja gry po naładowaniu skryptu
window.onload = () => {
    switchScreen('main-menu');
};

function renderCampCompanions() {
    const container = document.getElementById('campfire-companions');
    if (!container) return;
    container.innerHTML = '';

    companions.forEach(hero => {
        const token = document.createElement('div');
        token.className = 'camp-companion-token';
        token.innerHTML = `⛺ <b>${hero.name}</b> <br><small style="color:#b0a095">${hero.role}</small>`;
        token.onclick = () => triggerCampDialogue(hero);
        container.appendChild(token);
    });
}

// Odpala okno dialogowe z dopasowanym tekstem pod klasę postaci
function triggerCampDialogue(hero) {
    const bubble = document.getElementById('dialogue-bubble');
    const speaker = document.getElementById('dialogue-speaker');
    const text = document.getElementById('dialogue-text');

    speaker.innerText = hero.name;
    
    // Prosta baza tekstów zależna od roli postaci
    let dialogue = "Witaj Arkelasie. Czekam na Twoje rozkazy przy ognisku.";
    if (hero.role === "Battle-Mage") dialogue = "Uniwersytet Elen-Varski dobrze nas przygotował, Arkelasie. Czuję jednak, że czarna magia Zardasa skaziła te ziemie.";
    if (hero.role === "Tank") dialogue = "Mój młot i runy kowalskie są gotowe, Brachu! Żaden potwór nie przebije się przez moją tarczę.";
    if (hero.role === "Saper") dialogue = "Hehe... mam przygotowane parę wybuchowych niespodzianek na te stwory. Tylko nie pozwól krasnalowi mówić na mnie szkodnik!";

    text.innerText = dialogue;
    bubble.classList.remove('hidden');
}

function closeDialogue() {
    document.getElementById('dialogue-bubble').classList.add('hidden');
}

function renderWorldMap() {
    const container = document.getElementById('map-locations-container');
    if (!container) return;
    container.innerHTML = '';

    mapLocations.forEach(loc => {
        const isCurrent = travelState.currentLocation === loc.id;
        const isUnlocked = loc.req === null || travelState.unlockedLocations.includes(loc.req);
        
        const card = document.createElement('div');
        card.className = `map-node ${isCurrent ? 'active-node' : ''} ${!isUnlocked ? 'locked-node' : ''}`;
        
        // Dynamiczny status na dole karty
        let statusHtml = '';
        if (isCurrent) statusHtml = `<span class="loc-status status-current">📍 Twój Obóz Tu Stoi</span>`;
        else if (!isUnlocked) statusHtml = `<span class="loc-status status-locked">🔒 Zablokowane</span>`;
        else statusHtml = `<span class="loc-status" style="color:#d4af37">🚗 Zwiady / Podróżuj</span>`;

        card.innerHTML = `
            <div>
                <h3>${loc.name}</h3>
                <p style="font-size:0.9rem; color:#b0a095; margin-top:5px;">${loc.desc}</p>
            </div>
            ${statusHtml}
        `;

        // Kliknięcie działa tylko na odblokowane i inne niż obecna lokacja
        if (isUnlocked && !isCurrent) {
            card.onclick = () => moveCamp(loc.id);
        }

        container.appendChild(card);
    });
}

// Funkcja podróży (zmiany lokacji obozu)
function moveCamp(locationId) {
    const targetLoc = mapLocations.find(l => l.id === locationId);
    if (!targetLoc) return;

    // 1. Przygotowanie ekranu podróży
    document.getElementById('travel-title').innerText = `🧭 Podróż do: ${targetLoc.name}`;
    
    // Losowanie klimatycznego opisu drogi
    const randomQuote = travelQuotes[Math.floor(Math.random() * travelQuotes.length)];
    document.getElementById('travel-flavor').innerText = randomQuote;

    // 2. Odpalenie ekranu podróży
    switchScreen('travel');

    // Reset i wymuszenie restartu animacji paska (hack na reflow CSS)
    const fill = document.querySelector('.travel-progress-fill');
    if (fill) {
        fill.style.animation = 'none';
        fill.offsetHeight; // Wyzwolenie przebudowy widoku
        fill.style.animation = null; 
    }

    // 3. Blokada czasowa (2.5 sekundy) imitująca wędrówkę
    setTimeout(() => {
        travelState.currentLocation = locationId;
        
        // Logika progresu i odkrywania mgły wojny
        if (locationId === 'forest' && !travelState.unlockedLocations.includes('caves')) {
            travelState.unlockedLocations.push('caves');
        }
        if (locationId === 'caves' && !travelState.unlockedLocations.includes('castle')) {
            travelState.unlockedLocations.push('castle');
        }

        // Po zakończeniu podróży wracamy na mapę, która zrenderuje się z nową pozycją
        switchScreen('world-map');
    }, 2500);
}