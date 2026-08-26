// ==========================================
// 1. KONFIGURACJA I ZMIENNE SYSTEMOWE
// ==========================================
const CONFIG = {
    CANVAS_WIDTH: window.innerWidth,
    CANVAS_HEIGHT: window.innerHeight,
    WORLD_WIDTH: 2400,
    WORLD_HEIGHT: 1600,
    ZOOM: 1.5,
    walk_speed: 1.5,
    run_speed: 2.5,
    horse_speed: 4,
    COLOR_GRASS: '#1b2e1b',
    COLOR_ROAD: '#3a3225',
    COLOR_INTERIOR: '#4a2e18',
    COLOR_CORRIDOR: '#362213',
    COLOR_NIGHT_FILTER: 'rgba(10, 15, 35, 0.60)'
};

const questManager = {
    activeQuestId: "Q1",
    currentObjective: "",
    target: null,
    quests: typeof QUEST_DATABASE !== 'undefined' ? QUEST_DATABASE : {},

    init() {
        const activeQuest = this.quests[this.activeQuestId];
        if (activeQuest && activeQuest.objectives && activeQuest.objectives.length > 0) {
            const currentStep = activeQuest.currentStep || 0;
            const currentObj = activeQuest.objectives[currentStep];
            if (currentObj) {
                this.setObjective(
                    currentObj.text,
                    currentObj.target?.location,
                    currentObj.target?.x,
                    currentObj.target?.y,
                    currentObj.target?.name
                );
            }
        }
    },

    setObjective(text, location, x, y, name) {
        this.currentObjective = text;
        this.target = location ? { location, x, y, name } : null;

        const hudObj = document.getElementById('hud-quest-obj') || document.getElementById('current-objective');
        if (hudObj) hudObj.innerText = `• ${text}`;

        const hudName = document.getElementById('hud-quest-name');
        if (hudName && this.quests[this.activeQuestId]) {
            hudName.innerText = this.quests[this.activeQuestId].title;
        }
    },
    updateUI() {
        this.init(); // Odświeża cel w HUD na ekranie
        if (typeof menuSystem !== 'undefined' && menuSystem.isOpen) {
            menuSystem.renderQuestsTab(); // Odświeża Dziennik w menu
        }
    },

    completeObjective(questId, stepIndex, amount = 1) {
        const quest = this.quests[questId]; // Pobieramy quest po kluczu z obiektu
        if (!quest || !quest.objectives) return;

        const objective = quest.objectives[stepIndex];
        if (!objective || objective.completed || objective.done) return;

        // Cel bez targetu (np. czytanie listu / rozmowa)
        if (objective.target === undefined || objective.target === null) {
            objective.completed = true;
            objective.done = true;
        } else {
            // Cel licznikowy (np. zabij X wrogów)
            objective.current = (objective.current || 0) + amount;
            if (objective.current >= objective.target) {
                objective.completed = true;
                objective.done = true;
            }
        }

        // Jeśli to był bieżący krok, przejdź do następnego celu
        if (quest.currentStep === stepIndex) {
            quest.currentStep = (quest.currentStep || 0) + 1;
        }

        // Sprawdź czy cały quest jest skończony
        const allDone = quest.objectives.every(o => o.completed || o.done);
        if (allDone) {
            quest.completed = true;
            if (typeof showToast === 'function') showToast(`Zadanie ukończone: ${quest.title}`);
        }

        this.updateUI();
    }
};

const timeSystem = {
    isNight: true,
    setDay() {
        this.isNight = false;
        const timeElem = document.getElementById('time-display');
        if (timeElem) {
            timeElem.innerText = "Dzień ☀️";
            timeElem.style.color = "#f39c12";
        }
        gameMap.spawnVillageNPCs();
    },
    setNight() {
        this.isNight = true;
        const timeElem = document.getElementById('time-display');
        if (timeElem) {
            timeElem.innerText = "Noc 🌙";
            timeElem.style.color = "#3498db";
        }
        gameMap.spawnVillageNPCs();
    }
};

function showToast(text) {
    const toast = document.getElementById('toast-message');
    if (!toast) return;
    toast.innerText = text;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
}

// ==========================================
// 2. RESPONSYWNOŚĆ I KAMERA
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    CONFIG.CANVAS_WIDTH = window.innerWidth;
    CONFIG.CANVAS_HEIGHT = window.innerHeight;

    const fullmapCanvas = document.getElementById('fullmapCanvas');
    if (fullmapCanvas) {
        fullmapCanvas.width = fullmapCanvas.clientWidth;
        fullmapCanvas.height = fullmapCanvas.clientHeight;
    }
}
window.addEventListener('resize', resizeCanvas);

const camera = {
    x: 0,
    y: 0,
    follow(target, mapW, mapH) {
        const viewW = CONFIG.CANVAS_WIDTH / CONFIG.ZOOM;
        const viewH = CONFIG.CANVAS_HEIGHT / CONFIG.ZOOM;

        this.x = Math.max(0, Math.min(target.x - viewW / 2, mapW - viewW));
        this.y = Math.max(0, Math.min(target.y - viewH / 2, mapH - viewH));
    }
};

// ==========================================
// 3. DIALOGI
// ==========================================
const dialogueManager = {
    isActive: false,
    currentTree: null,

    trees: {
        karczmarz_intro: {
            speaker: "Karczmarz Barnaba",
            nodes: {
                start: {
                    text: "Witaj w 'Pod Krukiem'. Pokoje czyste, piwo zimne. W czym mogę pomóc?",
                    choices: [
                        {

                            text: "Pokaż mi swoje towary 💰",
                            next: "exit",
                            type: "trade",
                            onSelect: () => shopSystem.openShop('karczmarz_shop')

                        },
                        {
                            text: "Chciałbym wynająć pokój i przespać się do świtu (10 złota).",
                            next: "rent_room",
                            condition: () => !player.hasItem('room_key')
                        },
                        {
                            text: "Mam już klucz do pokoju.",
                            next: "already_have_key",
                            condition: () => player.hasItem('room_key')
                        },
                        { text: "Szukam pewnej osoby nazywa się Nicolas i podobno tutaj mieszka ", next: "nicolas_info" },
                        { text: "[Zamknij rozmowę]", next: "exit" }
                    ]
                },
                already_have_key: {
                    text: "Twój pokój to Pokój #4 na piętrze. Schody po prawej stronie.",
                    choices: [{ text: "Rozumiem, dzięki.", next: "exit" }]
                },
                nicolas_info: {
                    text: "Nicolas? A tak, kojarzę go. Mieszka wzdłuż głównej drogi",

                    choices: [{ text: "A i jeszcze chciałbym się zapytać czy znajduje się tutaj jakiś młyn ?", next: "mlyn" }],
                    choices: [{ text: "Dzięki Wielkie", next: "exit" }],
                },
                mlyn: {

                    text: "Tak, jest na skraju wioski od strony lasu ,ale od wielu lat jest nieczynny",
                    choices: [{ text: "Dzięki Wielkie", next: "exit" }],
                    onSelect: () => {
                        questManager.completeObjective('Q1', 2);
                    },
                },
                rent_room: {
                    text: () => player.gold >= 10
                        ? "Oto twój klucz do Pokoju nr 4. Idź na górę po schodach, twój pokój jest na samym końcu korytarza po prawej."
                        : "Brak ci miedziaków! Pokój kosztuje 10 złota.",
                    choices: [
                        {
                            text: "[Zapłać 10 złota i weź klucz]",
                            next: "give_key_action",
                            condition: () => player.gold >= 10
                        },
                        { text: "Wracam do swoich spraw.", next: "exit" }
                    ]
                },
                give_key_action: {
                    text: "Otrzymałeś Klucz do Pokoju #4. Schody na piętro są po prawej stronie.",
                    onSelect: () => {
                        player.gold -= 10;
                        const goldUi = document.getElementById('player-gold');
                        if (goldUi) goldUi.innerText = player.gold;
                        player.addItem('room_key', '🔑 Klucz do Pokoju #4', '🔑', 'quest', 0.1, 'Klucz do pokoju w karczmie');

                        questManager.completeObjective('Q1', 0);
                    },
                    choices: [{ text: "Dzięki, idę do pokoju.", next: "exit" }]
                }
            }
        },
    },
    start(treeId) {
        if (!this.trees[treeId]) return;
        this.isActive = true;
        this.currentTree = this.trees[treeId];
        document.getElementById('dialogue-box').classList.remove('hidden');
        document.getElementById('dialogue-speaker').innerText = this.currentTree.speaker;
        this.showNode('start');
    },

    showNode(nodeId) {
        if (nodeId === 'exit') {
            this.end();
            return;
        }
        const node = this.currentTree.nodes[nodeId];
        if (!node) return;

        if (node.onSelect) node.onSelect();

        const textContent = typeof node.text === 'function' ? node.text() : node.text;
        document.getElementById('dialogue-text').innerText = textContent;
        const optionsDiv = document.getElementById('dialogue-options');
        optionsDiv.innerHTML = '';

        node.choices.forEach(choice => {
            if (choice.condition && !choice.condition()) return;
            const btn = document.createElement('button');

            // Dodaje podstawową klasę i ewentualnie specjalną (np. trade, craft)
            btn.className = `dialogue-btn ${choice.type || ''}`;
            if (choice.color) btn.style.color = choice.color;

            btn.innerText = choice.text;
            btn.onclick = () => {
                if (choice.onSelect) choice.onSelect();
                this.showNode(choice.next);
            };
            optionsDiv.appendChild(btn);
        });
    },

    end() {
        this.isActive = false;
        document.getElementById('dialogue-box').classList.add('hidden');
    }
};

// ==========================================
// 4. MENU PEŁNOEKRANOWE I PODPOWIEDZI (TOOLTIP)
// ==========================================

function showShopTooltip(item, event, mode = 'buy') {
    const tooltip = document.getElementById('shop-tooltip');
    if (!item || !tooltip) {
        if (tooltip) tooltip.classList.add('hidden');
        return;
    }

    // Wyliczanie ceny w zależności czy kupujesz czy sprzedajesz
    const price = mode === 'sell'
        ? Math.floor((item.value || 2) * 0.6)
        : (item.value || 0);

    const priceLabel = mode === 'sell' ? 'Cena sprzedaży' : 'Cena zakupu';

    document.getElementById('shop-tooltip-icon').textContent = item.icon || '📦';
    document.getElementById('shop-tooltip-name').textContent = item.name || 'Przedmiot';
    document.getElementById('shop-tooltip-type').textContent = item.type || 'Różne';
    document.getElementById('shop-tooltip-price').textContent = `${price} 🪙 (${priceLabel})`;
    document.getElementById('shop-tooltip-stats').textContent = item.stats || '';

    tooltip.style.left = `${event.clientX + 15}px`;
    tooltip.style.top = `${event.clientY + 15}px`;
    tooltip.classList.remove('hidden');
}

function moveShopTooltip(event) {
    const tooltip = document.getElementById('shop-tooltip');
    if (tooltip && !tooltip.classList.contains('hidden')) {
        tooltip.style.left = `${event.clientX + 15}px`;
        tooltip.style.top = `${event.clientY + 15}px`;
    }
}

function hideShopTooltip() {
    const tooltip = document.getElementById('shop-tooltip');
    if (tooltip) tooltip.classList.add('hidden');
}

function showTooltip(item, event) {
    const tooltip = document.getElementById('item-tooltip');
    if (!tooltip) return;

    if (!item) {
        tooltip.classList.add('hidden');
        return;
    }

    const typeNames = {
        weapon: 'Broń Jednoręczna',
        head: 'Pancerz Głowy',
        chest: 'Pancerz Tułowia',
        legs: 'Pancerz Nóg',
        boots: 'Obuwie',
        quest: 'Przedmiot Fabularny',
        misc: 'Różności'
    };

    document.getElementById('tooltip-icon').innerText = item.icon || '📦';
    document.getElementById('tooltip-name').innerText = item.name;
    document.getElementById('tooltip-type').innerText = typeNames[item.type] || 'Przedmiot';
    document.getElementById('tooltip-weight').innerText = `${item.weight || 0.1} kg`;
    document.getElementById('tooltip-value').innerText = `${item.value || 0} 🪙`;
    document.getElementById('tooltip-stats').innerText = item.stats || 'Brak dodatkowych właściwości.';

    if (event) {
        tooltip.style.left = `${event.clientX + 15}px`;
        tooltip.style.top = `${event.clientY + 15}px`;
    }

    tooltip.classList.remove('hidden');
}

window.addEventListener('mousemove', (e) => {
    const tooltip = document.getElementById('item-tooltip');
    if (tooltip && !tooltip.classList.contains('hidden')) {
        tooltip.style.left = e.clientX + 15 + 'px';
        tooltip.style.top = e.clientY + 15 + 'px';
        tooltip.classList.remove('hidden');
    }
});

// ==========================================
// SYSTEM NAPISÓW / MONOLOGÓW
// ==========================================
const subtitleManager = {
    queue: [],
    timer: null,
    onComplete: null,

    play(monologueId, onComplete = null) {
        const db = typeof MONOLOGUE_DATABASE !== 'undefined' ? MONOLOGUE_DATABASE : {};
        const monologue = db[monologueId];

        if (!monologue || monologue.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        this.clear();
        this.queue = [...monologue];
        this.onComplete = onComplete;
        this.next();
    },

    next() {
        if (this.queue.length === 0) {
            this.hide();
            // Odpalenie aktuwalizacji questu po ostatnim napisie
            if (this.onComplete) {
                const cb = this.onComplete;
                this.onComplete = null;
                cb();
            }
            return;
        }

        const current = this.queue.shift();
        const box = document.getElementById('subtitle-box');
        const textEl = document.getElementById('subtitle-text');

        if (box && textEl) {
            textEl.innerText = current.text;
            box.classList.remove('hidden');
        }


        const duration = current.duration || 3000;
        this.timer = setTimeout(() => this.next(), duration);
    },

    clear() {
        if (this.timer) clearTimeout(this.timer);
        this.queue = [];
        this.hide();
    },

    hide() {
        const box = document.getElementById('subtitle-box');
        if (box) box.classList.add('hidden');
    }
};
let draggedItemIndex = null;

const menuSystem = {
    isOpen: false,
    activeTab: 'quests',

    toggle(tabName) {
        if (this.isOpen && this.activeTab === tabName) {
            this.close();
        } else {
            this.open(tabName);
        }
    },

    open(tabName) {
        this.isOpen = true;
        const menuElem = document.getElementById('menu-overlay');
        if (menuElem) menuElem.classList.remove('hidden');

        // Ukryj HUD i dialog na czas otwartego menu
        const hud = document.getElementById('hud-top-right');
        if (hud) hud.classList.add('hidden');
        const dialogue = document.getElementById('dialogue-box');
        if (dialogue) dialogue.classList.add('hidden');

        this.openTab(tabName);
    },

    close() {
        this.isOpen = false;
        const menuElem = document.getElementById('menu-overlay');
        if (menuElem) menuElem.classList.add('hidden');

        // Przywróć HUD i ewentualny dialog po zamknięciu menu
        const hud = document.getElementById('hud-top-right');
        if (hud) hud.classList.remove('hidden');
        if (typeof dialogueManager !== 'undefined' && dialogueManager.isActive) {
            const dialogue = document.getElementById('dialogue-box');
            if (dialogue) dialogue.classList.remove('hidden');
        }
    },
    highlightEquipSlot(itemType) {
        this.clearEquipHighlights();
        const slotElem = document.getElementById(`eq-${itemType}`);
        if (slotElem) {
            slotElem.classList.add('highlight-valid');
        }
    },

    clearEquipHighlights() {
        document.querySelectorAll('.eq-slot').forEach(slot => {
            slot.classList.remove('highlight-valid');
        });
    },
    openTab(tabName) {
        this.activeTab = tabName;

        document.querySelectorAll('.menu-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        const activeContent = document.getElementById(`tab-${tabName}`);
        if (activeContent) activeContent.classList.add('active');

        if (tabName === 'map') {
            resizeCanvas();
            gameMap.drawFullMap();
        } else if (tabName === 'inventory') {
            this.renderInventoryTab();
        } else if (tabName === 'quests') {
            this.renderQuestsTab();
        }
    },

    renderInventoryTab() {
    const grid = document.getElementById('inv-grid-container') || document.getElementById('inventory-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const goldVal = document.getElementById('menu-gold-val');
    if (goldVal) goldVal.innerText = player.gold;

    const weightVal = document.getElementById('menu-weight-val');
    if (weightVal) weightVal.innerText = player.getWeight();

    const maxWeightVal = document.getElementById('menu-max-weight-val');
    if (maxWeightVal) maxWeightVal.innerText = player.maxWeight;

    const totalSlots = Math.max(25, player.inventory.length);

    // --- RENDEROWANIE PLECAKA ---
    for (let i = 0; i < totalSlots; i++) {
        const slot = document.createElement('div');
        const item = player.inventory[i];

        if (item) {
            slot.className = `grid-slot ${player.selectedItemIndex === i ? 'selected' : ''}`;
            const countBadge = (item.count && item.count > 1) ? `<span class="slot-count">${item.count}</span>` : '';
            slot.innerHTML = `${item.icon || '📦'}${countBadge}`;
            
            // Przeciąganie (Drag & Drop)
            slot.draggable = true;
            slot.ondragstart = (e) => {
                draggedItemIndex = i;
                showTooltip(null);
                if (['head', 'chest', 'legs', 'boots', 'weapon'].includes(item.type)) {
                    menuSystem.highlightEquipSlot(item.type);
                }
            };
            slot.ondragend = () => {
                draggedItemIndex = null;
                menuSystem.clearEquipHighlights();
            };

            slot.onmouseenter = (e) => showTooltip(item, e);
            slot.onmouseleave = () => showTooltip(null);

            // Shift-Click oraz zwykłe kliknięcie
            slot.onclick = (e) => {
                if (e.shiftKey) {
                    showTooltip(null);
                    player.equipItem(i);
                } else {
                    player.selectedItemIndex = i;
                    menuSystem.renderInventoryTab();
                }
            };

            // Double Click
            slot.ondblclick = () => {
                showTooltip(null);
                player.equipItem(i);
            };
        } else {
            slot.className = 'grid-slot empty';
            
            // Upuszczanie zdjętego pancerza na pusty slot w plecaku
            slot.ondragover = (e) => e.preventDefault();
            slot.ondrop = (e) => {
                e.preventDefault();
                const data = e.dataTransfer.getData('text/plain');
                if (data) {
                    const parsed = JSON.parse(data);
                    if (parsed.source === 'equipment') {
                        player.unequipItem(parsed.slotType);
                    }
                }
            };
        }
        grid.appendChild(slot);
    }

    // --- RENDEROWANIE SLOTÓW RYNSZTUNKU ---
    const slotsConfig = [
        { id: 'eq-head', key: 'head', defaultIcon: '🪖', label: 'Głowa' },
        { id: 'eq-chest', key: 'chest', defaultIcon: '🛡️', label: 'Tułów' },
        { id: 'eq-legs', key: 'legs', defaultIcon: '👖', label: 'Nogi' },
        { id: 'eq-boots', key: 'boots', defaultIcon: '🥾', label: 'Stopy' },
        { id: 'eq-weapon', key: 'weapon', defaultIcon: '⚔️', label: 'Miecz' }
    ];

    slotsConfig.forEach(cfg => {
        const elem = document.getElementById(cfg.id);
        if (!elem) return;
        const item = player.equipment[cfg.key];

        // Obsługa upuszczania przedmiotu na slot sprzętu
        elem.ondragover = (e) => e.preventDefault();
        elem.ondrop = (e) => {
            e.preventDefault();
            if (draggedItemIndex !== null) {
                const draggedItem = player.inventory[draggedItemIndex];
                if (draggedItem && draggedItem.type === cfg.key) {
                    player.equipItem(draggedItemIndex);
                }
            }
            menuSystem.clearEquipHighlights();
        };

        if (item) {
            elem.className = 'eq-slot equipped';
            elem.innerHTML = `<span class="slot-icon">${item.icon}</span>`;
            elem.draggable = true;
            
            // Możliwość przeciągnięcia z rynsztunku do plecaka
            elem.ondragstart = (e) => {
                showTooltip(null);
                e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'equipment', slotType: cfg.key }));
            };

            elem.onmouseenter = (e) => showTooltip(item, e);
            elem.onmouseleave = () => showTooltip(null);

            // Kliknięcie / Shift-click / Dblclick ściąga pancerz
            elem.onclick = (e) => {
                if (e.shiftKey) {
                    showTooltip(null);
                    player.unequipItem(cfg.key);
                }
            };
            elem.ondblclick = () => {
                showTooltip(null);
                player.unequipItem(cfg.key);
            };
        } else {
            elem.className = 'eq-slot';
            elem.innerHTML = `<span class="slot-icon">${cfg.defaultIcon}</span><span class="slot-label">${cfg.label}</span>`;
            elem.draggable = false;
            elem.onmouseenter = null;
            elem.onmouseleave = null;
            elem.onclick = null;
            elem.ondblclick = null;
        }
    });
},

    renderQuestsTab() {
        const listEl = document.getElementById('journal-quests-list') || document.getElementById('quest-list-container');
        const detailsEl = document.getElementById('journal-quest-details') || document.getElementById('quest-details-content');
        if (!listEl || !detailsEl) return;

        listEl.innerHTML = '';

        const quests = Object.values(questManager.quests || {});

        if (quests.length === 0) {
            listEl.innerHTML = '<div style="color: #66523d; font-style: italic; padding: 10px;">Brak aktywnych zadań.</div>';
            detailsEl.innerHTML = '<div class="quest-placeholder">Brak zadań w dzienniku.</div>';
            return;
        }

        quests.forEach(q => {
            const item = document.createElement('div');
            item.className = `quest-item ${q.id === questManager.activeQuestId ? 'active-selected' : ''} ${q.completed ? 'completed' : ''}`;
            item.innerHTML = `
                <div class="quest-item-title">${q.title}</div>
                <div class="quest-item-type">${q.completed ? '✓ Ukończone' : (q.category || 'Główne')}</div>
            `;
            item.onclick = () => {
                questManager.activeQuestId = q.id;
                this.renderQuestsTab();
            };
            listEl.appendChild(item);
        });

        const currentQuest = questManager.quests[questManager.activeQuestId];
        if (currentQuest) {
            // Pokazuj cele tylko do bieżącego etapu włącznie
            const currentStep = currentQuest.currentStep || 0;
            const visibleObjectives = (currentQuest.objectives || []).filter((obj, index) => index <= currentStep || obj.done);

            const objectivesHtml = visibleObjectives.map(obj => {
                const isCompleted = obj.completed || obj.done;
                const text = obj.text || obj.description || 'Cel zadania';
                const progress = obj.target ? ` (${obj.current || 0}/${obj.target})` : '';

                return `
                    <li class="objective-item ${isCompleted ? 'done' : ''}">
                        <span>${isCompleted ? '✓' : '○'}</span> ${text}${progress}
                    </li>
                `;
            }).join('');

            detailsEl.innerHTML = `
                <div class="quest-details-header">
                    <div class="quest-details-title">${currentQuest.title}</div>
                    <div class="quest-details-status" style="color: ${currentQuest.completed ? '#2ecc71' : '#f39c12'}">
                        ${currentQuest.completed ? '✓ Ukończono' : '🟡 W trakcie'}
                    </div>
                </div>
                <div class="quest-details-desc">${currentQuest.description || 'Brak opisu.'}</div>
                <div class="quest-objectives-title">Cele zadania:</div>
                <ul class="objective-list">${objectivesHtml}</ul>
            `;
        } else {
            detailsEl.innerHTML = `<div class="quest-placeholder">Wybierz zadanie z listy...</div>`;
        }
    }
};

// ==========================================
// 5. MAPA I LOKACJE
// ==========================================
const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;

const gameMap = {
    currentLocation: 'kruczy_dol',
    nearDoor: null,
    nearNPC: null,
    nearBed: false,

    locations: {
        kruczy_dol: {
            width: CONFIG.WORLD_WIDTH, height: CONFIG.WORLD_HEIGHT, bgColor: CONFIG.COLOR_GRASS,
            buildings: [
                { id: 'tavern', name: 'Karczma Pod Krukiem', x: 700, y: 400, width: 260, height: 180, color: '#5c3a21' },
                { id: 'blacksmith', name: 'Kuźnia', x: 1200, y: 700, width: 160, height: 130, color: '#4a4a4a' },
                { id: 'mill', name: 'Młyn', x: 1700, y: 300, width: 140, height: 140, color: '#6e5438' },
                { id: 'nicolas_house', name: 'Chata Nicolasa', x: 1900, y: 480, width: 120, height: 100, color: '#4d3319' }
            ],
            doors: [
                { x: 810, y: 580, width: 40, height: 20, targetLocation: 'karczma_wnetrze', spawnX: 400, spawnY: 480, label: 'Wejdź [E]' },
                { x: 1940, y: 580, width: 40, height: 20, targetLocation: 'nicolas_wnetrze', spawnX: 400, spawnY: 480, label: 'Wejdź [E]' }
            ],
            npcs: []
        },
        karczma_wnetrze: {
            width: 800, height: 600, bgColor: CONFIG.COLOR_INTERIOR,
            buildings: [
                { id: 'bar', name: 'Lada Karczmarza', x: 300, y: 150, width: 200, height: 50, color: '#2b170a' }
            ],
            doors: [
                { x: 380, y: 520, width: 40, height: 20, targetLocation: 'kruczy_dol', spawnX: 830, spawnY: 620, label: 'Wyjdź [E]' },
                {
                    x: 710, y: 100, width: 50, height: 70,
                    targetLocation: 'karczma_pietro', spawnX: 85, spawnY: 310,
                    isStair: true, dir: 'w'
                }
            ],
            npcs: [{
                id: 'innkeeper', name: 'Karczmarz Barnaba', x: 400, y: 115,
                radius: 14, color: '#e74c3c', dialogueId: 'karczmarz_intro', talkRadius: 110
            }]
        },
        karczma_pietro: {
            width: 1000, height: 400, bgColor: CONFIG.COLOR_CORRIDOR,
            buildings: [
                { id: 'wall_top', name: '', x: 0, y: 0, width: 1000, height: 120, color: '#23150b' }
            ],
            doors: [
                {
                    x: 60, y: 220, width: 50, height: 70,
                    targetLocation: 'karczma_wnetrze', spawnX: 735, spawnY: 190,
                    isStair: true, dir: 's'
                },
                { x: 250, y: 110, width: 40, height: 20, keyRequired: 'room_1', label: 'Pokój #1 [E]', message: 'Pokój #1: Zamknięte.' },
                { x: 420, y: 110, width: 40, height: 20, keyRequired: 'room_2', label: 'Pokój #2 [E]', message: 'Pokój #2: Słychać chrapanie...' },
                { x: 590, y: 110, width: 40, height: 20, keyRequired: 'room_3', label: 'Pokój #3 [E]', message: 'Pokój #3: Zamknięte.' },
                {
                    x: 780, y: 110, width: 40, height: 20,
                    keyRequired: 'room_key',
                    targetLocation: 'pokoj_gracza',
                    spawnX: 300, spawnY: 420,
                    label: 'Pokój #4 [E]',
                    message: 'Pokój #4 jest zamknięty na klucz!'
                }
            ],
            npcs: []
        },
        pokoj_gracza: {
            width: 600, height: 500, bgColor: CONFIG.COLOR_INTERIOR,
            buildings: [
                { id: 'bed', name: 'Wygodne Łóżko', x: 100, y: 100, width: 100, height: 160, color: '#8e44ad' }
            ],
            doors: [
                { x: 280, y: 440, width: 40, height: 20, targetLocation: 'karczma_pietro', spawnX: 780, spawnY: 150, label: 'Wyjdź na korytarz [E]' }
            ],
            npcs: []
        },
        nicolas_wnetrze: {
            width: 800, height: 600, bgColor: CONFIG.COLOR_INTERIOR,
            buildings: [{ id: 'table', name: 'Stół z papierami', x: 350, y: 250, width: 100, height: 60, color: '#2b170a' }],
            doors: [{ x: 380, y: 520, width: 40, height: 20, targetLocation: 'kruczy_dol', spawnX: 1960, spawnY: 610, label: 'Wyjdź [E]' }],
            npcs: [{ id: 'nicolas', name: 'Nicolas', x: 400, y: 200, radius: 14, color: '#2ecc71', dialogueId: 'nicolas_intro', talkRadius: 60 }]
        }
    },

    getCurrentData() { return this.locations[this.currentLocation]; },

    spawnVillageNPCs() {
        const count = timeSystem.isNight ? 2 : 7;
        const names = ["Wieśniak", "Mieszczanka", "Podróżny", "Górnik", "Handlarz"];
        const colors = ['#e67e22', '#16a085', '#f39c12', '#9b59b6', '#7f8c8d'];

        const villageNPCs = [];
        for (let i = 0; i < count; i++) {
            let spawnX, spawnY;
            do {
                spawnX = 300 + Math.random() * 1600;
                spawnY = 520 + (Math.random() * 150 - 75);
            } while (this.checkCollision(spawnX, spawnY, 12));

            villageNPCs.push({
                id: 'citizen_' + i, name: names[i % names.length],
                x: spawnX, y: spawnY, targetX: null, targetY: null,
                radius: 12, color: colors[i % colors.length]
            });
        }
        this.locations.kruczy_dol.npcs = villageNPCs;
    },

    updateNPCs() {
        const loc = this.getCurrentData();
        if (!loc.npcs) return;

        loc.npcs.forEach(npc => {
            if (npc.targetX !== undefined) {
                if (!npc.targetX || Math.hypot(npc.targetX - npc.x, npc.targetY - npc.y) < 15) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 50 + Math.random() * 100;
                    npc.targetX = npc.x + Math.cos(angle) * dist;
                    npc.targetY = npc.y + Math.sin(angle) * dist;
                }

                const angle = Math.atan2(npc.targetY - npc.y, npc.targetX - npc.x);
                const speed = 0.6;
                const nextX = npc.x + Math.cos(angle) * speed;
                const nextY = npc.y + Math.sin(angle) * speed;

                if (!this.checkCollision(nextX, nextY, npc.radius)) {
                    npc.x = nextX; npc.y = nextY;
                } else {
                    npc.targetX = null;
                }
            }
        });
    },

    draw(ctx) {
        const loc = this.getCurrentData();
        ctx.fillStyle = loc.bgColor;
        ctx.fillRect(0, 0, loc.width, loc.height);

        if (this.currentLocation === 'kruczy_dol') {
            ctx.fillStyle = CONFIG.COLOR_ROAD;
            ctx.fillRect(0, 500, loc.width, 100);
            ctx.fillRect(800, 580, 60, 200);
            ctx.fillRect(1930, 580, 60, 200);
        }

        loc.buildings.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.width, b.height);
            ctx.strokeStyle = '#1a1008';
            ctx.lineWidth = 3;
            ctx.strokeRect(b.x, b.y, b.width, b.height);

            if (b.name) {
                ctx.fillStyle = '#e0e0e0';
                ctx.font = '12px sans-serif';
                ctx.fillText(b.name, b.x + 10, b.y - 8);
            }
        });

        this.nearBed = false;
        if (this.currentLocation === 'pokoj_gracza') {
            const bed = loc.buildings.find(b => b.id === 'bed');
            if (bed) {
                const dist = Math.hypot(player.x - (bed.x + bed.width / 2), player.y - (bed.y + bed.height / 2));
                if (dist < 80) {
                    this.nearBed = true;
                    ctx.fillStyle = '#f1c40f';
                    ctx.font = 'bold 13px sans-serif';
                    ctx.fillText('Połóż się spać [E]', bed.x, bed.y - 12);
                }
            }
        }

        this.nearNPC = null;
        if (loc.npcs) {
            loc.npcs.forEach(npc => {
                ctx.beginPath();
                ctx.arc(npc.x, npc.y, npc.radius, 0, Math.PI * 2);
                ctx.fillStyle = npc.color;
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = '11px sans-serif';
                ctx.fillText(npc.name, npc.x - 20, npc.y - 18);

                const dx = player.x - npc.x;
                const dy = player.y - npc.y;
                const talkRange = npc.talkRadius || 50;

                if (Math.hypot(dx, dy) < talkRange && npc.dialogueId) {
                    this.nearNPC = npc;
                    ctx.fillStyle = '#f1c40f';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText('Rozmawiaj [E]', npc.x - 28, npc.y + 28);
                }
            });
        }

        this.nearDoor = null;
        loc.doors.forEach(d => {
            if (d.isStair) {
                ctx.fillStyle = '#221208';
                ctx.fillRect(d.x, d.y, d.width, d.height);

                const stepCount = 6;
                const stepHeight = d.height / stepCount;
                for (let i = 0; i < stepCount; i++) {
                    ctx.fillStyle = i % 2 === 0 ? '#5c3517' : '#472811';
                    ctx.fillRect(d.x + 3, d.y + (i * stepHeight), d.width - 6, stepHeight - 1);
                }

                ctx.fillStyle = '#1a0d05';
                ctx.fillRect(d.x, d.y, 3, d.height);
                ctx.fillRect(d.x + d.width - 3, d.y, 3, d.height);
            } else {
                ctx.fillStyle = '#120904';
                ctx.fillRect(d.x - 2, d.y - 2, d.width + 4, d.height + 4);

                ctx.fillStyle = '#7a4a21';
                ctx.fillRect(d.x, d.y, d.width, d.height);

                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.arc(d.x + d.width - 6, d.y + d.height / 2, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }

            const dx = player.x - (d.x + d.width / 2);
            const dy = player.y - (d.y + d.height / 2);
            if (Math.hypot(dx, dy) < 45) {
                this.nearDoor = d;
                if (!d.isStair) {
                    ctx.fillStyle = '#f1c40f';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText(d.label, d.x - 15, d.y - 8);
                }
            }
        });
    },

    drawMinimap() {
        if (!minimapCtx) return;
        const loc = this.getCurrentData();
        const mw = minimapCanvas.width;
        const mh = minimapCanvas.height;

        minimapCtx.clearRect(0, 0, mw, mh);

        const miniZoom = 0.25;

        minimapCtx.save();
        minimapCtx.translate(mw / 2, mh / 2);
        minimapCtx.scale(miniZoom, miniZoom);
        minimapCtx.translate(-player.x, -player.y);

        minimapCtx.fillStyle = loc.bgColor;
        minimapCtx.fillRect(0, 0, loc.width, loc.height);

        if (this.currentLocation === 'kruczy_dol') {
            minimapCtx.fillStyle = CONFIG.COLOR_ROAD;
            minimapCtx.fillRect(0, 500, loc.width, 100);
            minimapCtx.fillRect(800, 580, 60, 200);
            minimapCtx.fillRect(1930, 580, 60, 200);
        }

        loc.buildings.forEach(b => {
            minimapCtx.fillStyle = '#8e44ad';
            minimapCtx.fillRect(b.x, b.y, b.width, b.height);
        });

        if (loc.npcs) {
            loc.npcs.forEach(npc => {
                minimapCtx.fillStyle = '#f1c40f';
                minimapCtx.beginPath();
                minimapCtx.arc(npc.x, npc.y, 10, 0, Math.PI * 2);
                minimapCtx.fill();
            });
        }

        if (questManager.target && questManager.target.location === this.currentLocation) {
            minimapCtx.fillStyle = '#e74c3c';
            minimapCtx.beginPath();
            minimapCtx.arc(questManager.target.x, questManager.target.y, 14, 0, Math.PI * 2);
            minimapCtx.fill();
        }

        if (this.currentLocation === 'kruczy_dol' && !player.isMounted) {
            minimapCtx.fillStyle = player.horse.color;
            minimapCtx.beginPath();
            minimapCtx.arc(player.horse.x, player.horse.y, 12, 0, Math.PI * 2);
            minimapCtx.fill();
        }

        minimapCtx.restore();

        minimapCtx.fillStyle = '#2ecc71';
        minimapCtx.strokeStyle = '#ffffff';
        minimapCtx.lineWidth = 2;
        minimapCtx.beginPath();
        minimapCtx.arc(mw / 2, mh / 2, 4, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.stroke();
    },

    drawFullMap() {
        const fullmapCanvas = document.getElementById('fullmapCanvas');
        if (!fullmapCanvas) return;
        const fCtx = fullmapCanvas.getContext('2d');
        const loc = this.getCurrentData();

        fCtx.clearRect(0, 0, fullmapCanvas.width, fullmapCanvas.height);

        const scale = Math.min(fullmapCanvas.width / loc.width, fullmapCanvas.height / loc.height) * 0.9;
        const offsetX = (fullmapCanvas.width - loc.width * scale) / 2;
        const offsetY = (fullmapCanvas.height - loc.height * scale) / 2;

        fCtx.fillStyle = '#120f17';
        fCtx.fillRect(0, 0, fullmapCanvas.width, fullmapCanvas.height);

        fCtx.fillStyle = '#1c1724';
        fCtx.fillRect(offsetX, offsetY, loc.width * scale, loc.height * scale);
        fCtx.strokeStyle = '#5a4529';
        fCtx.lineWidth = 2;
        fCtx.strokeRect(offsetX, offsetY, loc.width * scale, loc.height * scale);

        loc.buildings.forEach(b => {
            fCtx.fillStyle = '#2d2236';
            fCtx.fillRect(offsetX + b.x * scale, offsetY + b.y * scale, b.width * scale, b.height * scale);
            fCtx.strokeStyle = '#8c6d3f';
            fCtx.lineWidth = 1.5;
            fCtx.strokeRect(offsetX + b.x * scale, offsetY + b.y * scale, b.width * scale, b.height * scale);

            if (b.name) {
                fCtx.fillStyle = '#c5b396';
                fCtx.font = '12px Georgia';
                fCtx.fillText(b.name, offsetX + b.x * scale, offsetY + Math.max(12, b.y * scale - 6));
            }
        });

        const px = offsetX + player.x * scale;
        const py = offsetY + player.y * scale;

        fCtx.fillStyle = '#3498db';
        fCtx.beginPath();
        fCtx.arc(px, py, 7, 0, Math.PI * 2);
        fCtx.fill();
        fCtx.strokeStyle = '#ffffff';
        fCtx.lineWidth = 2;
        fCtx.stroke();

        if (questManager.target && questManager.target.location === this.currentLocation) {
            const tx = offsetX + questManager.target.x * scale;
            const ty = offsetY + questManager.target.y * scale;

            fCtx.fillStyle = '#f1c40f';
            fCtx.beginPath();
            fCtx.arc(tx, ty, 8, 0, Math.PI * 2);
            fCtx.fill();

            fCtx.fillStyle = '#ffffff';
            fCtx.font = 'bold 13px sans-serif';
            fCtx.fillText("★ CEL Zadania", tx + 14, ty + 4);
        }
    },

    checkCollision(x, y, radius) {
        const loc = this.getCurrentData();
        if (x - radius < 0 || x + radius > loc.width || y - radius < 0 || y + radius > loc.height) return true;

        for (let b of loc.buildings) {
            if (x + radius > b.x && x - radius < b.x + b.width && y + radius > b.y && y - radius < b.y + b.height) {
                return true;
            }
        }
        return false;
    },

    tryInteract() {
        if (this.nearNPC) {
            dialogueManager.start(this.nearNPC.dialogueId);
            return true;
        }

        if (this.nearBed) {
            player.startSleep();
            return true;
        }

        if (this.nearDoor) {
            const door = this.nearDoor;

            if (door.keyRequired) {
                if (player.hasItem(door.keyRequired)) {
                    this.currentLocation = door.targetLocation;
                    player.x = door.spawnX;
                    player.y = door.spawnY;
                    showToast("Otworzyłeś drzwi kluczem!");
                } else {
                    showToast(door.message || "Zamknięte!");
                }
                return true;
            }

            if (door.targetLocation) {
                // Odpięcie konia przed zmianą lokacji
                if (player.isMounted) {
                    player.isMounted = false;
                    player.horse.isMounted = false;
                    player.horse.x = player.x;
                    player.horse.y = player.y;
                }
                this.currentLocation = door.targetLocation;
                player.x = door.spawnX;
                player.y = door.spawnY;
                return true;
            }
        }
        return false;
    }
};

const documentViewer = {
    currentMonologueId: null,
    currentQuestTrigger: null,

    open(title, content, monologueId = null, questTrigger = null) {
        const modal = document.getElementById('reading-overlay');
        const titleElem = document.getElementById('reading-title');
        const bodyElem = document.getElementById('reading-text');

        if (titleElem) titleElem.innerText = title || '';
        if (bodyElem) bodyElem.innerHTML = content || '';

        this.currentMonologueId = monologueId;
        this.currentQuestTrigger = questTrigger;

        if (modal) modal.classList.remove('hidden');
    },

    close() {
        const modal = document.getElementById('reading-overlay');
        if (modal) modal.classList.add('hidden');

        const trigger = this.currentQuestTrigger;
        const monologue = this.currentMonologueId;

        this.currentQuestTrigger = null;
        this.currentMonologueId = null;

        if (monologue) {
            subtitleManager.play(monologue, () => {
                if (trigger && typeof questManager !== 'undefined') {
                    questManager.completeObjective(trigger.questId, trigger.step);
                }
            });
        } else if (trigger && typeof questManager !== 'undefined') {
            questManager.completeObjective(trigger.questId, trigger.step);
        }
    }
};
// ==========================================
// 5.5 SYSTEM HANDLU (SKLEP)
// ==========================================
const shopSystem = {
    isOpen: false,
    currentShopId: null,
    get isOpen() { return this.currentShopId !== null; },
    shops: {
        karczmarz_shop: {
            name: "Karczmarz Barnaba",
            gold: 500,
            items: [
                { id: 'chleb', name: 'Świeży Chleb', icon: '🍞', type: 'misc', weight: 0.5, value: 5, stats: '+10 Posiłek', count: 5, maxCount: 5, restock: true },
                { id: 'piwo', name: 'Kufel Piwa', icon: '🍺', type: 'misc', weight: 0.8, value: 3, stats: '+5 Pragnienie', count: 8, maxCount: 8, restock: true },
                { id: 'sztylet', name: 'Zardzewiały Sztylet', icon: '🗡️', type: 'weapon', weight: 1.5, value: 25, stats: 'Obrażenia: 5-8', count: 1, maxCount: 1, restock: false },
                { id: 'skora_pancerz', name: 'Skórzana Kurtka', icon: '🛡️', type: 'chest', weight: 4.0, value: 60, stats: 'Pancerz: +3', count: 1, maxCount: 1, restock: false }
            ]
        }
    },

    openShop(shopId) {
        this.currentShopId = shopId;
        this.isOpen = true;
        const modal = document.getElementById('shop-modal');
        if (modal) modal.classList.remove('hidden');
        this.render();
    },

    closeShop() {
        this.currentShopId = null;
        hideShopTooltip(); // <-- DODAJE TO
        const modal = document.getElementById('shop-modal');
        if (modal) modal.classList.add('hidden');
    },
    close() { this.closeShop(); },
    buyItem(itemIndex) {
        const shop = this.shops[this.currentShopId];
        if (!shop) return;

        const item = shop.items[itemIndex];
        if (!item) return;

        if (item.count <= 0) {
            showToast("Brak towaru na stanie!");
            return;
        }

        if (player.gold < item.value) {
            showToast("Za mało złota!");
            return;
        }

        if (player.getWeight() + item.weight > player.maxWeight) {
            showToast("Brak miejsca w plecaku!");
            return;
        }

        player.gold -= item.value;
        if (shop.gold !== undefined) shop.gold += item.value;
        item.count--;

        player.addItem(item.id, item.name, item.icon, item.type, item.weight, item.stats, 1);

        if (item.count <= 0 && !item.restock) {
            shop.items.splice(itemIndex, 1);
        }

        showToast(`Kupiono: ${item.name} (-${item.value} 🪙)`);
        this.render();
    },

    sellItem(invIndex) {
        const item = player.inventory[invIndex];
        if (!item) return;

        if (item.type === 'quest') {
            showToast("Przedmiot fabularny!");
            return;
        }

        const sellPrice = Math.floor((item.value || 2) * 0.6);
        const shop = this.shops[this.currentShopId];

        player.gold += sellPrice;
        if (shop && shop.gold !== undefined) shop.gold = Math.max(0, shop.gold - sellPrice);

        // Dodanie przedmiotu do listy sklepu
        if (shop) {
            const existingShopItem = shop.items.find(i => i.id === item.id);
            if (existingShopItem) {
                existingShopItem.count = (existingShopItem.count || 1) + 1;
            } else {
                shop.items.push({
                    id: item.id,
                    name: item.name,
                    icon: item.icon,
                    type: item.type,
                    weight: item.weight,
                    value: item.value || 2,
                    stats: item.stats,
                    count: 1,
                    restock: false
                });
            }
        }

        if (item.count && item.count > 1) {
            item.count--;
        } else {
            player.inventory.splice(invIndex, 1);
        }

        showToast(`Sprzedano: ${item.name} (+${sellPrice} 🪙)`);
        this.render();
    },

    onDragStart(event, source, index) {
        event.dataTransfer.setData('text/plain', JSON.stringify({ source, index }));
    },

    onDropToPlayer(event) {
        event.preventDefault();
        try {
            const data = JSON.parse(event.dataTransfer.getData('text/plain'));
            if (data.source === 'shop') this.buyItem(data.index);
        } catch (e) { }
    },

    onDropToMerchant(event) {
        event.preventDefault();
        try {
            const data = JSON.parse(event.dataTransfer.getData('text/plain'));
            if (data.source === 'player') this.sellItem(data.index);
        } catch (e) { }
    },

    onItemClick(event, source, index) {
        if (event.shiftKey) {
            if (source === 'player') this.sellItem(index);
            if (source === 'shop') this.buyItem(index);
        }
    },

    onItemDblClick(source, index) {
        if (source === 'player') this.sellItem(index);
        if (source === 'shop') this.buyItem(index);
    },

    render() {
        const shop = this.shops[this.currentShopId];
        if (!shop) return;

        // Liczniki Złota na górze
        const playerGoldEl = document.getElementById('shop-player-gold');
        if (playerGoldEl) playerGoldEl.innerText = player.gold;

        const merchantGoldEl = document.getElementById('shop-merchant-gold');
        if (merchantGoldEl) merchantGoldEl.innerText = shop.gold !== undefined ? shop.gold : '∞';

        const merchantNameEl = document.getElementById('shop-merchant-name');
        if (merchantNameEl) merchantNameEl.innerText = shop.name || 'Kupiec';

        // 1. EKWIPUNEK GRACZA (LEWA STRONA) - 10 KOLUMN, NIESKOŃCZONOŚĆ (MIN. 60 KRATEK)
        const playerGrid = document.getElementById('shop-player-grid');
        if (playerGrid) {
            playerGrid.innerHTML = '';
            const playerSlotsCount = Math.max(60, Math.ceil((player.inventory.length + 1) / 10) * 10);

            for (let i = 0; i < playerSlotsCount; i++) {
                const item = player.inventory[i];
                const slot = document.createElement('div');

                if (item) {
                    const countBadge = (item.count && item.count > 1) ? `<span class="slot-count">${item.count}</span>` : '';
                    slot.className = 'grid-slot occupied';
                    slot.setAttribute('draggable', 'true');
                    slot.innerHTML = `${item.icon || '📦'}${countBadge}`;

                    slot.ondragstart = (e) => this.onDragStart(e, 'player', i);
                    slot.onclick = (e) => this.onItemClick(e, 'player', i);
                    slot.ondblclick = () => { hideShopTooltip(); this.onItemDblClick('player', i); };
                    slot.onmouseenter = (e) => showShopTooltip(item, e, 'sell');
                    slot.onmousemove = (e) => moveShopTooltip(e);
                    slot.onmouseleave = () => hideShopTooltip();
                } else {
                    slot.className = 'grid-slot empty';
                }
                playerGrid.appendChild(slot);
            }
        }

        // 2. EKWIPUNEK KUPCA (PRAWA STRONA) - 10 KOLUMN (MIN. 60 KRATEK)
        const merchantGrid = document.getElementById('shop-merchant-grid');
        if (merchantGrid) {
            merchantGrid.innerHTML = '';
            const shopSlotsCount = Math.max(60, Math.ceil((shop.items.length + 1) / 10) * 10);

            for (let i = 0; i < shopSlotsCount; i++) {
                const item = shop.items[i];
                const slot = document.createElement('div');

                if (item) {
                    const countBadge = (item.count && item.count > 1) ? `<span class="slot-count">${item.count}</span>` : '';
                    slot.className = 'grid-slot occupied';
                    slot.setAttribute('draggable', 'true');
                    slot.innerHTML = `${item.icon || '📦'}${countBadge}`;

                    slot.ondragstart = (e) => this.onDragStart(e, 'shop', i);
                    slot.onclick = (e) => this.onItemClick(e, 'shop', i);
                    slot.ondblclick = () => { hideShopTooltip(); this.onItemDblClick('shop', i); };
                    slot.onmouseenter = (e) => showShopTooltip(item, e, 'buy');
                    slot.onmousemove = (e) => moveShopTooltip(e);
                    slot.onmouseleave = () => hideShopTooltip()
                } else {
                    slot.className = 'grid-slot empty';
                }
                merchantGrid.appendChild(slot);
            }
        }
    }
};
// ==========================================
// 6. GRACZ
// ==========================================
// Globalne zmienne pozycji myszy na ekranie
let mouseScreenX = 0;
let mouseScreenY = 0;

window.addEventListener('mousemove', (e) => {
    mouseScreenX = e.clientX;
    mouseScreenY = e.clientY;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Pozycja myszy na canvasie w pikselach ekranu
    const mouseCanvasX = (e.clientX - rect.left) * scaleX;
    const mouseCanvasY = (e.clientY - rect.top) * scaleY;

    // Przeliczenie myszy na pozycję w świecie gry (z uwzględnieniem Kamery i ZOOMu)
    const mouseWorldX = (mouseCanvasX / CONFIG.ZOOM) + camera.x;
    const mouseWorldY = (mouseCanvasY / CONFIG.ZOOM) + camera.y;

    // Wyznaczenie kąta od gracza w świecie gry do myszki
    const dx = mouseWorldX - player.x;
    const dy = mouseWorldY - player.y;

    player.angle = Math.atan2(dy, dx);
});

const player = {
    // 1. Pozycja i podstawowe statystyki
    x: 100,
    y: 550,
    radius: 12,
    gold: 100,
    hp: 1150,
    maxHp: 1150,
    color: '#3498db',
    angle: 0,
    iFrames: false,

    // 2. Statusy postaci i Unik (Roll)
    isMounted: false,
    isSleeping: false,
    isParrying: false,
    isRolling: false,
    rollSpeed: 3.5,
    rollDuration: 400, // Czas trwania uniku w ms
    rollCooldown: 1000, // Co ile można robić roll
    lastRollTime: 0,
    rollDirX: 0,
    rollDirY: 0,
    stamina: 100,
    maxStamina: 100,
    staminaRegenRate: 0.2,
    isStaggered: false,

    // 3. Właściwości Systemu Walki
    damage: 155,
    attackRange: 50,
    attackOffset: 25,
    attackCooldown: 750,
    lastAttackTime: 0,
    attackVisualTimer: 0,

    // 4. Ekwipunek i Plecak
    maxWeight: 100.0,
    selectedItemIndex: null,
    inventory: [
        {
            id: 'list_nicolas',
            name: 'List od Nicolasa',
            icon: '📜',
            type: 'quest',
            weight: 0.2,
            monologueId: 'read_nicolas_letter',
            questTrigger: { questId: 'Q1', step: 0 },
            stats: 'Kliknij E aby przeczytać',
            content: "Arkelasie , mój Drogi przyjacielu <br> Mam nadzieję ,że przeczytasz ten list a życie mija ci spokojnie, jak pewnie wiesz osiedliłem się miasteczku Kruczy Dół , ze względu na jego położenie na szlaku handlowym między Valengardem a Rendią jak i ze względu na powierzone mi zadanie . Niestety ostatnio zauważam coraz to bardziej niepokojące rzeczy , wczoraj zauważyłem dwóch ludzi obserwujących mnie ,których nigdy wcześniej nie widziałem a kilka dni temu ktoś włamał mi się do domu . Potrzebuję twojej pomocy Arkelasie bo czuje ,że wpadłem w niezłe gówno. Spotkajmy się tam gdzie chłopi chodzą z patelnią <br> Z poważaniem ,Nicolas "
        }
    ],
    equipment: { head: null, chest: null, legs: null, boots: null, weapon: null },
    horse: { x: 100, y: 550, radius: 15, color: '#8e44ad', isMounted: false },

    getWeight() {
        const invWeight = this.inventory.reduce((sum, item) => sum + (item.weight || 0), 0);
        const eqWeight = Object.values(this.equipment).reduce((sum, item) => sum + (item ? item.weight || 0 : 0), 0);
        return parseFloat((invWeight + eqWeight).toFixed(1));
    },

    addItem(id, name, icon = '📦', type = 'misc', weight = 1.0, stats = '', count = 1) {
        if (this.getWeight() + (weight * count) > this.maxWeight) {
            showToast("Jesteś zbyt obciążony!");
            return false;
        }

        const existingItem = this.inventory.find(item => item.id === id);
        if (existingItem && type === 'misc') {
            existingItem.count = (existingItem.count || 1) + count;
        } else {
            this.inventory.push({ id, name, icon, type, weight, stats, count: count });
        }

        showToast(`Otrzymano: ${name} ${count > 1 ? `x${count}` : ''}`);
        return true;
    },

    hasItem(id) {
        return this.inventory.some(item => item.id === id) ||
            Object.values(this.equipment).some(item => item && item.id === id);
    },

    equipItem(index) {
        const item = this.inventory[index];
        if (!item) return;

        if (item.type === 'quest' && item.content) {
            documentViewer.open(item.name, item.content, item.monologueId, item.questTrigger);
            return;
        }

        if (item.type === 'quest' || item.type === 'misc') return;

        const currentEquipped = this.equipment[item.type];
        this.inventory.splice(index, 1);

        if (currentEquipped) {
            this.inventory.push(currentEquipped);
        }

        this.equipment[item.type] = item;
        showToast(`Założono: ${item.name}`);
        menuSystem.renderInventoryTab();
    },

    unequipItem(slotType) {
        const item = this.equipment[slotType];
        if (!item) return;

        this.equipment[slotType] = null;
        this.inventory.push(item);
        showToast(`Zdjęto: ${item.name}`);
        menuSystem.renderInventoryTab();
    },

    takeDamage(amount, attacker) {
        if (this.iFrames || this.isRolling) return;

        if (this.isParrying && attacker) {
            showToast("PERFECT PARRY! Wróg ogłuszony!");
            attacker.isWindup = false;
            attacker.isStaggered = true;
            setTimeout(() => { attacker.isStaggered = false; }, 2500);
            return;
        }

        const armor = Object.values(this.equipment).reduce((sum, item) => sum + (item && item.armor ? item.armor : 0), 0);
        const finalDamage = Math.max(2, amount - armor);

        this.hp = Math.max(0, this.hp - finalDamage);
        this.updateHpUI();

        this.iFrames = true;
        setTimeout(() => { this.iFrames = false; }, 400);

        if (this.hp === 0) {
            showToast("Zginąłeś! Odradzanie...");
            setTimeout(() => { this.hp = this.maxHp; this.updateHpUI(); }, 2000);
        }
    },

    updateHpUI() {
        const fill = document.getElementById('hp-bar-fill');
        const text = document.getElementById('hp-text');
        if (fill) fill.style.width = `${(this.hp / this.maxHp) * 100}%`;
        if (text) text.innerText = `${this.hp} / ${this.maxHp}`;
    },

    // Wykonanie uniku (roll) – zużywa 25 staminy
    performRoll(moveX, moveY) {
        const now = Date.now();
        if (this.isRolling || this.isMounted || this.stamina < 25 || now - this.lastRollTime < this.rollCooldown) return;

        this.stamina -= 20;
        this.isRolling = true;
        this.iFrames = true;
        this.lastRollTime = now;

        // Jeśli gracz się nie rusza, roll idzie w stronę gdzie patrzy postać
        if (moveX === 0 && moveY === 0) {
            this.rollDirX = Math.cos(this.angle);
            this.rollDirY = Math.sin(this.angle);
        } else {
            const len = Math.hypot(moveX, moveY);
            this.rollDirX = moveX / len;
            this.rollDirY = moveY / len;
        }

        setTimeout(() => {
            this.isRolling = false;
            this.iFrames = false;
        }, this.rollDuration);
    },

    // Atak – BEZ KOSZTU STAMINY (tylko cooldown)
    performAttack(squadManager) {
        if (this.isStaggered || this.isRolling) return;
        const now = Date.now();

        // Weryfikacja staminy i cooldownu
        if (this.stamina < 10 || now - this.lastAttackTime < this.attackCooldown) return;

        this.stamina -= 10; // Atak zużywa staminę
        this.lastAttackTime = now;
        this.attackVisualTimer = 8;

        const hitboxX = this.x + Math.cos(this.angle) * this.attackOffset;
        const hitboxY = this.y + Math.sin(this.angle) * this.attackOffset;
        const totalDamage = this.damage + (this.equipment.weapon ? 12 : 0);

        if (squadManager && squadManager.members) {
            squadManager.members.forEach(enemy => {
                const dx = enemy.x - hitboxX;
                const dy = enemy.y - hitboxY;
                const dist = Math.hypot(dx, dy);

                if (dist < this.attackRange + enemy.radius) {
                    const isCrit = enemy.isStaggered;
                    const dmgDealt = isCrit ? totalDamage * 1.5 : totalDamage;

                    enemy.hp -= dmgDealt;
                    showToast(isCrit ? `KRYTYK! ${dmgDealt} dmg!` : `Trafiono za ${dmgDealt} dmg!`);

                    const kbAngle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                    const kbForce = isCrit ? 22 : 10;
                    enemy.x += Math.cos(kbAngle) * kbForce;
                    enemy.y += Math.sin(kbAngle) * kbForce;
                }
            });
        }
    },

    startSleep() {
        if (this.isSleeping) return;
        this.isSleeping = true;

        const container = document.getElementById('game-container');
        const overlay = document.getElementById('sleep-overlay');

        if (container) container.classList.add('sleeping-filter');
        if (overlay) overlay.classList.remove('hidden');

        setTimeout(() => {
            timeSystem.setDay();
            if (container) container.classList.remove('sleeping-filter');
            if (overlay) overlay.classList.add('hidden');
            this.isSleeping = false;

            questManager.completeObjective('Q1', 1);
            showToast("Wstałeś wypoczęty. Jest świt!");
        }, 3000);
    },

    toggleHorse() {
        if (gameMap.currentLocation !== 'kruczy_dol') return;
        if (this.isMounted) {
            this.isMounted = false;
            this.horse.isMounted = false;
            this.horse.x = this.x + 25;
            this.horse.y = this.y;
        } else {
            const dx = this.x - this.horse.x;
            const dy = this.y - this.horse.y;
            if (Math.hypot(dx, dy) < 40) {
                this.isMounted = true;
                this.horse.isMounted = true;
            }
        }
    },

    update(keys, stateTextUI) {
        if (this.isSleeping) return;

        // Logika Wykonywania Uniku (Roll na Spację)
        let moveX = 0, moveY = 0;
        if (keys['w'] || keys['arrowup']) moveY -= 1;
        if (keys['s'] || keys['arrowdown']) moveY += 1;
        if (keys['a'] || keys['arrowleft']) moveX -= 1;
        if (keys['d'] || keys['arrowright']) moveX += 1;

        if (keys[' '] || keys['space']) {
            this.performRoll(moveX, moveY);
        }

        if (this.isRolling) {
            const nextX = this.x + this.rollDirX * this.rollSpeed;
            const nextY = this.y + this.rollDirY * this.rollSpeed;

            if (!gameMap.checkCollision(nextX, this.y, this.radius)) this.x = nextX;
            if (!gameMap.checkCollision(this.x, nextY, this.radius)) this.y = nextY;

            if (stateTextUI) { stateTextUI.innerText = "Unik (Roll)"; stateTextUI.style.color = "#f1c40f"; }
            return;
        }

        let currentSpeed = CONFIG.walk_speed;

        if (this.isMounted) {
            currentSpeed = CONFIG.horse_speed;
            if (stateTextUI) { stateTextUI.innerText = "Na koniu (Szybko)"; stateTextUI.style.color = "#9b59b6"; }
        } else if (keys['shift']) {
            currentSpeed = CONFIG.run_speed;
            if (stateTextUI) { stateTextUI.innerText = "Pieszo (Bieg)"; stateTextUI.style.color = "#e67e22"; }
        } else {
            if (stateTextUI) { stateTextUI.innerText = "Pieszo (Chód)"; stateTextUI.style.color = "#4cd137"; }
        }

        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.7071;
            moveY *= 0.7071;
        }

        const nextX = this.x + moveX * currentSpeed;
        const nextY = this.y + moveY * currentSpeed;

        if (!gameMap.checkCollision(nextX, this.y, this.radius)) this.x = nextX;
        if (!gameMap.checkCollision(this.x, nextY, this.radius)) this.y = nextY;

        if (this.isMounted) {
            this.horse.x = this.x;
            this.horse.y = this.y;
        }
    },

    draw(ctx) {
        if (gameMap.currentLocation === 'kruczy_dol' && !this.horse.isMounted) {
            ctx.beginPath();
            ctx.arc(this.horse.x, this.horse.y, this.horse.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.horse.color;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = '10px sans-serif';
            ctx.fillText('Koń [E]', this.horse.x - 18, this.horse.y - 20);
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        // Zmiana koloru gracza podczas wykonywania uniku
        if (this.isRolling) ctx.fillStyle = '#f39c12';
        else ctx.fillStyle = this.isMounted ? '#9b59b6' : this.color;

        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (this.attackVisualTimer > 0) {
            this.attackVisualTimer--;
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + this.attackRange, this.angle - Math.PI / 3, this.angle + Math.PI / 3);
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.restore();
        }
    }
};

// ==========================================
// 6.7 SYSTEM WALKI I ZBIOROWE AI SZAJKI
// ==========================================
function updateUI() {
    // Wartości zaokrąglamy w górę (Math.ceil), żeby nie wyświetlać ułamków
    const currentHp = Math.max(0, Math.ceil(player.hp));
    const currentStamina = Math.max(0, Math.ceil(player.stamina));

    // Aktualizacja HP
    const hpBar = document.getElementById('hp-bar');
    const hpText = document.getElementById('hp-text');
    if (hpBar) hpBar.style.width = `${(currentHp / player.maxHp) * 100}%`;
    if (hpText) hpText.textContent = `${currentHp} / ${player.maxHp}`;

    // Aktualizacja Staminy
    const staminaBar = document.getElementById('stamina-bar');
    const staminaText = document.getElementById('stamina-text');
    if (staminaBar) staminaBar.style.width = `${(currentStamina / player.maxStamina) * 100}%`;
    if (staminaText) staminaText.textContent = `${currentStamina} / ${player.maxStamina}`;
}

class HumanEnemy {
    constructor(x, y, type = 'zbir_lekki', squad) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.squad = squad;

        const config = ENEMY_CONFIG[type];
        this.name = config.name;
        this.hp = config.maxHp;
        this.maxHp = config.maxHp;
        this.speed = config.speed;
        this.damage = config.damage;
        this.radius = config.radius;
        this.color = config.color;
        this.attackRange = config.attackRange;
        this.attackCooldown = config.attackCooldown;
        this.rewardGold = config.rewardGold;

        this.lastAttackTime = 0;
        this.slotAngle = 0; // Kąt pozycyjny w szyku wokół gracza
    }

    update(player) {
        // 1. Wyznaczenie docelowej pozycji na okręgu wokół gracza (Zbiorowe AI)
        const surroundRadius = 55; // Odległość okrążania
        const targetX = player.x + Math.cos(this.slotAngle) * surroundRadius;
        const targetY = player.y + Math.sin(this.slotAngle) * surroundRadius;

        const dxToPlayer = player.x - this.x;
        const dyToPlayer = player.y - this.y;
        const distToPlayer = Math.hypot(dxToPlayer, dyToPlayer);
        if (this.isStaggered) {
            return;
        }

        // Sprawdzamy czy ten zbir ma prawo do natarcia (token ataku od szajki)
        const isAttacker = (this.squad.currentAttacker === this);

        if (isAttacker) {
            // Zbir idzie prosto na gracza zadać cios
            if (distToPlayer <= this.attackRange) {
                this.attack(player);
            } else {
                this.moveTowards(player.x, player.y, this.speed * 1.2);
            }
        } else {
            // Pozostali członkowie grupy okrążają i trzymają pozycję (flankowanie)
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const distToSlot = Math.hypot(dx, dy);

            if (distToSlot > 5) {
                this.moveTowards(targetX, targetY, this.speed);
            }
        }

        // Separacja - zbiry nie nakładają się na siebie
        this.applySeparation(this.squad.members);
    }

    moveTowards(tx, ty, moveSpeed) {
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
            this.x += (dx / dist) * moveSpeed;
            this.y += (dy / dist) * moveSpeed;
        }
    }

    applySeparation(allies) {
        allies.forEach(other => {
            if (other === this) return;
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const dist = Math.hypot(dx, dy);
            const minDist = (this.radius + other.radius) + 6;

            if (dist < minDist && dist > 0) {
                const overlap = minDist - dist;
                this.x += (dx / dist) * (overlap * 0.5);
                this.y += (dy / dist) * (overlap * 0.5);
            }
        });
    }

    attack(player) {
        const now = Date.now();
        if (this.isStaggered || this.isWindup) return;
        if (now - this.lastAttackTime < this.attackCooldown) return;

        this.isWindup = true;
        this.windupStart = now;
        this.windupDuration = 650; // Dłuższy czas na reakcję gracza (zamiast 450ms)

        // ZABLOKOWANIE KĄTA: Zapamiętujemy gdzie gracz stoi W MOMENCIE rozpoczęcia zamachu
        this.targetAngleAtWindup = Math.atan2(player.y - this.y, player.x - this.x);

        setTimeout(() => {
            if (!this.isStaggered) {
                // Skok w stronę zapamiętanego kąta – jeśli gracz zrobił krok w bok, wrak uderzy w próżnię
                this.x += Math.cos(this.targetAngleAtWindup) * 30;
                this.y += Math.sin(this.targetAngleAtWindup) * 30;

                const dist = Math.hypot(player.x - this.x, player.y - this.y);
                if (dist <= this.attackRange + 5) {
                    player.takeDamage(this.damage, this);
                }
            }
            this.isWindup = false;
            this.lastAttackTime = Date.now();
            this.squad.releaseAttackToken(this);
        }, this.windupDuration);
    }

    draw(ctx) {
        // Wizualny indykator ataku (strefa zagrożenia na ziemi)
        if (this.isWindup) {
            const progress = Math.min(1, (Date.now() - this.windupStart) / this.windupDuration);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.arc(
                this.x,
                this.y,
                this.attackRange + 15,
                this.targetAngleAtWindup - Math.PI / 3,
                this.targetAngleAtWindup + Math.PI / 3
            );
            ctx.closePath();

            // Czerwone wypełnienie narastające w czasie ładowania
            ctx.fillStyle = `rgba(231, 76, 60, ${0.15 + progress * 0.35})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(231, 76, 60, ${0.5 + progress * 0.5})`;
            ctx.lineWidth = 2 + progress * 2;
            ctx.stroke();
            ctx.restore();
        }

        // Rysowanie ciała wroga
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        if (this.isStaggered) ctx.fillStyle = '#f1c40f';
        else if (this.isWindup) ctx.fillStyle = '#e74c3c';
        else ctx.fillStyle = this.color;

        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Pasek HP nad głową
        const barW = 28;
        const barH = 4;
        const hpPercent = Math.max(0, this.hp / this.maxHp);

        ctx.fillStyle = '#c0392b';
        ctx.fillRect(this.x - barW / 2, this.y - this.radius - 8, barW, barH);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(this.x - barW / 2, this.y - this.radius - 8, barW * hpPercent, barH);
    }
}
// Zarządca Grupowego AI
class SquadManager {
    constructor() {
        this.members = [];
        this.activeAttackers = [];
        this.maxAttackers = 2; // Jednocześnie atakuje do 2 wrogów
        this.baseAngle = 0;
    }

    spawnSquad(centerX, centerY, count = 3) {
        this.members = [];
        this.activeAttackers = [];

        for (let i = 0; i < count; i++) {
            const spawnAngle = (Math.PI * 2 / count) * i;
            const spawnX = centerX + Math.cos(spawnAngle) * 120;
            const spawnY = centerY + Math.sin(spawnAngle) * 120;
            const type = (i === 0) ? 'zbir_ciezki' : 'zbir_lekki';

            this.members.push(new HumanEnemy(spawnX, spawnY, type, this));
        }
        showToast("Zaatakowała cię szajka!");
    }

    update(player) {
        if (this.members.length === 0) return;

        this.baseAngle += 0.015;
        const step = (Math.PI * 2) / this.members.length;
        this.members.forEach((member, idx) => {
            member.slotAngle = this.baseAngle + (idx * step);
        });

        // Przydzielanie żetonów ataku do limitu maxAttackers
        while (this.activeAttackers.length < this.maxAttackers && this.members.length > 0) {
            const available = this.members.filter(m => !this.activeAttackers.includes(m) && !m.isStaggered);
            if (available.length === 0) break;
            const nextAttacker = available[Math.floor(Math.random() * available.length)];
            this.activeAttackers.push(nextAttacker);
        }

        for (let i = this.members.length - 1; i >= 0; i--) {
            const m = this.members[i];

            // Jeżeli jednostka jest zestunowana – całkowity brak ruchu i ataku
            if (m.isStaggered) {
                m.applySeparation(this.members);
                if (m.hp <= 0) {
                    this.releaseAttackToken(m);
                    this.members.splice(i, 1);
                }
                continue; // Przejdź do następnego bez liczenia ruchu
            }

            const isAttacker = this.activeAttackers.includes(m);
            if (isAttacker) {
                const distToPlayer = Math.hypot(player.x - m.x, player.y - m.y);
                if (distToPlayer <= m.attackRange) {
                    m.attack(player);
                } else {
                    m.moveTowards(player.x, player.y, m.speed * 1.25);
                }
            } else {
                const targetX = player.x + Math.cos(m.slotAngle) * 60;
                const targetY = player.y + Math.sin(m.slotAngle) * 60;
                m.moveTowards(targetX, targetY, m.speed);
            }

            m.applySeparation(this.members);

            if (m.hp <= 0) {
                this.releaseAttackToken(m);
                this.members.splice(i, 1);
            }
        }
    }

    releaseAttackToken(attacker) {
        const idx = this.activeAttackers.indexOf(attacker);
        if (idx !== -1) {
            this.activeAttackers.splice(idx, 1);
        }
    }

    draw(ctx) {
        this.members.forEach(m => m.draw(ctx));
    }
}

const squadManager = new SquadManager();

window.addEventListener('mousedown', (e) => {
    if (dialogueManager.isActive || menuSystem.isOpen || player.isSleeping) return;

    if (e.button === 0) {
        player.performAttack(squadManager);
    } else if (e.button === 2) {
        e.preventDefault();
        if (player.stamina >= 12 && !player.isParrying) {
            player.stamina -= 12;
            player.isParrying = true;
            // Okienko na sparowanie trwa teraz 250ms (wymaga wyczucia!)
            setTimeout(() => { player.isParrying = false; }, 250);
        }
    }
});

// Blokada menu kontekstowego na prawym kliku
window.addEventListener('contextmenu', e => e.preventDefault());

// ==========================================
// 7. WEJŚCIE I KONTROLA GRAFIKI
// ==========================================
const stateText = document.getElementById('player-state');
const keys = {};

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;

    // Zamknięcie okna czytania
    const readingModal = document.getElementById('reading-overlay');
    if (readingModal && !readingModal.classList.contains('hidden')) {
        if (key === 'escape' || key === 'esc' || key === 'e') {
            documentViewer.close();
            return;
        }
    }

    if (key === 'm') {
        menuSystem.toggle('map');
    } else if (key === 'i') {
        menuSystem.toggle('inventory');
    } else if (key === 'j') {
        menuSystem.toggle('quests');
    } else if (key === 'escape' || key === 'esc') {
        if (menuSystem.isOpen) {
            menuSystem.close();
        }
        if (shopSystem.isOpen) {
            shopSystem.close();
            return;
        }
    }
    if (key === 't') {
        squadManager.spawnSquad(player.x, player.y, 3);
    }
    if (key === 'e') {
        // Jeśli okno czytania jest otwarte -> zamknij je
        if (readingModal && !readingModal.classList.contains('hidden')) {
            documentViewer.close();
            return;
        }

        // Jeśli ekwipunek jest otwarty i zaznaczono przedmiot -> przeczytaj go
        if (menuSystem.isOpen && menuSystem.activeTab === 'inventory') {
            if (player.selectedItemIndex !== null) {
                const selectedItem = player.inventory[player.selectedItemIndex];
                if (selectedItem && (selectedItem.content || selectedItem.monologueId)) {
                    documentViewer.open(selectedItem.name, selectedItem.content, selectedItem.monologueId, selectedItem.questTrigger);
                }
            }
            return;
        }

        // Interakcja w świecie gry (rozmowa, drzwi, koń)
        if (!dialogueManager.isActive && !player.isSleeping && !menuSystem.isOpen) {
            if (!gameMap.tryInteract()) player.toggleHorse();
        }
    }
});

window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// ==========================================
// 8. START I PĘTLA GRY
// ==========================================
resizeCanvas();
gameMap.spawnVillageNPCs();
questManager.init();

function gameLoop() {
    const currentLoc = gameMap.getCurrentData();

    if (!dialogueManager.isActive && !player.isSleeping && !menuSystem.isOpen) {
        // Poprawna regeneracja staminy w pętli gry
        if (player.stamina < player.maxStamina) {
            player.stamina = Math.min(player.maxStamina, player.stamina + player.staminaRegenRate);
        }
        player.update(keys, stateText);
        gameMap.updateNPCs();
        squadManager.update(player);
    }

    camera.follow(player, currentLoc.width, currentLoc.height);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(CONFIG.ZOOM, CONFIG.ZOOM);
    ctx.translate(-camera.x, -camera.y);

    gameMap.draw(ctx);
    player.draw(ctx);
    squadManager.draw(ctx);

    if (gameMap.currentLocation === 'kruczy_dol' && timeSystem.isNight) {
        ctx.fillStyle = CONFIG.COLOR_NIGHT_FILTER;
        ctx.fillRect(0, 0, currentLoc.width, currentLoc.height);
    }

    ctx.restore();

    gameMap.drawMinimap();

    if (menuSystem.isOpen && menuSystem.activeTab === 'map') {
        gameMap.drawFullMap();
    }
    updateUI();
    requestAnimationFrame(gameLoop);
}
gameLoop();