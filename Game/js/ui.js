function getItemFootprint(item) {
    if (!item) return { width: 1, height: 1 };
    const footprint = item.footprint || item.grid || { width: item.gridWidth || 1, height: item.gridHeight || 1 };
    const width = Number(footprint.width || footprint.w || item.gridWidth || 1);
    const height = Number(footprint.height || footprint.h || item.gridHeight || 1);
    return {
        width: Math.max(1, width),
        height: Math.max(1, height)
    };
}

function applyItemFootprint(slot, item) {
    const footprint = getItemFootprint(item);
    const isLarge = footprint.width > 1 || footprint.height > 1;
    slot.style.gridColumn = `span ${footprint.width}`;
    slot.style.gridRow = `span ${footprint.height}`;
    slot.style.width = isLarge ? `${56 * footprint.width}px` : '56px';
    slot.style.height = isLarge ? `${56 * footprint.height}px` : '56px';
    if (isLarge) slot.classList.add('item-large');
}

const menuSystem = {
    isOpen: false,
    activeTab: 'quests',
    hoveredSlot: null,
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

        // Włączenie dopuszczania dropu na obszarze plecaka
        grid.setAttribute('ondragover', 'dragDropManager.allowDrop(event)');
        grid.setAttribute('ondrop', 'dragDropManager.onDropToInventory(event)');

        const goldVal = document.getElementById('menu-gold-val');
        if (goldVal) goldVal.innerText = player.gold;

        const weightVal = document.getElementById('menu-weight-val');
        if (weightVal) weightVal.innerText = player.getWeight();

        const maxWeightVal = document.getElementById('menu-max-weight-val');
        if (maxWeightVal) maxWeightVal.innerText = player.maxWeight;

        const totalSlots = Math.max(70, player.inventory.length);
        for (let i = 0; i < totalSlots; i++) {
            const slot = document.createElement('div');
            const item = player.inventory[i];

            if (item) {
                slot.className = `grid-slot ${player.selectedItemIndex === i ? 'selected' : ''}`;
                slot.setAttribute('draggable', 'true');
                slot.ondragstart = (e) => dragDropManager.onDragStart(e, 'inventory', i);

                const countBadge = (item.count && item.count > 1) ? `<span class="slot-count">${item.count}</span>` : '';
                slot.innerHTML = `${item.icon || '📦'}${countBadge}`;
                slot.onmouseenter = (e) => showTooltip(item, e);
                slot.onmouseleave = () => showTooltip(null);
                applyItemFootprint(slot, item);

                slot.onclick = () => {
                    player.selectedItemIndex = i;
                    menuSystem.renderInventoryTab();
                };

                slot.ondblclick = () => {
                    showTooltip(null);
                    player.equipItem(i);
                };
            } else {
                slot.className = 'grid-slot empty';
            }
            grid.appendChild(slot);
        }

        // KONFIGURACJA SLOTÓW RYNSZTUNKU (GŁOWA, TUŁÓW, NOGI, STOPY, MIECZ)
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
            elem.onclick = () => {
                showTooltip(null);
                player.unequipItem(cfg.key);
                menuSystem.renderInventoryTab(); // POPRAWKA: przerysuj po kliknięciu
            };
            // Ustawienie zdarzeń Drag & Drop na każdym slocie uzbrojenia
            elem.setAttribute('ondragover', 'dragDropManager.allowDrop(event)');
            elem.setAttribute('ondrop', `dragDropManager.onDropToEquipment(event, '${cfg.key}')`);
            elem.onmouseenter = (e) => { menuSystem.hoveredSlot = { type: 'equipment', key: cfg.key }; showTooltip(item, e); };
            elem.onmouseleave = () => { menuSystem.hoveredSlot = null; showTooltip(null); };
            if (item) {
                elem.className = 'eq-slot equipped';
                elem.setAttribute('draggable', 'true');
                elem.ondragstart = (e) => dragDropManager.onDragStart(e, 'equipment', cfg.key);
                elem.innerHTML = `<span class="slot-icon">${item.icon}</span>`;

                elem.onmouseenter = (e) => showTooltip(item, e);
                elem.onmouseleave = () => showTooltip(null);

                // Kliknięcie / Podwójne kliknięcie ściąga pancerz
                elem.onclick = () => {
                    showTooltip(null);
                    player.unequipItem(cfg.key);
                };
            } else {
                elem.className = 'eq-slot';
                elem.removeAttribute('draggable');
                elem.ondragstart = null;
                elem.innerHTML = `<span class="slot-icon">${cfg.defaultIcon}</span><span class="slot-label">${cfg.label}</span>`;
                elem.onmouseenter = null;
                elem.onmouseleave = null;
                elem.onclick = null;
            }

        })
        if (typeof updateQuickSlotsHUD === 'function') updateQuickSlotsHUD()
    },
    handleQuickAction() {
        if (this.activeTab !== 'inventory') return;

        // 1. Priorytet ma slot pod kursorem, a jeśli brak - kliknięty/zaznaczony slot
        let target = this.hoveredSlot;
        if (!target && player.selectedItemIndex !== null && player.selectedItemIndex !== undefined) {
            target = { type: 'inventory', index: player.selectedItemIndex };
        }
        if (!target) return;

        if (target.type === 'inventory') {
            const item = player.inventory[target.index];
            if (!item) return;

            // A. Zakładanie uzbrojenia i broni
            if (['armor', 'weapon', 'head', 'chest', 'legs', 'boots', 'shield'].includes(item.type)) {
                showTooltip(null);
                player.equipItem(target.index);
            }
            else if (['book', 'readable', 'letter', 'note', 'document', 'paper'].includes(item.type) || item.text || item.content || item.description) {
                if (typeof documentViewer !== 'undefined') {
                    showTooltip(null);
                    const dbItem = (typeof ITEMS_DB !== 'undefined' && ITEMS_DB[item.id]) ? ITEMS_DB[item.id] : {};
                    const title = item.name || dbItem.name || 'Dokument';
                    const content = item.content || item.text || item.description || dbItem.content || "<i>(Brak treści w liście)</i>";
                    const monologueId = item.monologueId || dbItem.monologueId || null;
                    const questTrigger = item.questTrigger || dbItem.questTrigger || null;

                    documentViewer.open(title, content, monologueId, questTrigger);
                }
            }
            // C. Używanie przedmiotów użytkowych / konsumpcyjnych
            else if (['consumable', 'potion', 'food', 'misc', 'tool'].includes(item.type)) {
                player.useConsumable(target.index);
            }
        } else if (target.type === 'equipment') {
            // D. Ściąganie założonego pancerza z rynsztunku do plecaka
            const item = player.equipment[target.key];
            if (item) {
                showTooltip(null);
                player.unequipItem(target.key);
            }
        }

        this.renderInventoryTab();
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

function updateCombatUI() {
    const hud = document.getElementById('combat-hud');
    if (!hud) return;

    // HUD Quick Slotów jest widoczny ZAWSZE, chyba że otwarte jest menu
    if (typeof menuSystem !== 'undefined' && menuSystem.isOpen) {
        hud.classList.add('combat-hidden');
    } else {
        hud.classList.remove('combat-hidden');
    }
}

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
                {
                    id: 'sztylet',
                    name: 'Zardzewiały Sztylet',
                    icon: '🗡️',
                    type: 'weapon',
                    weight: 1.5,
                    value: 25,
                    lightDamage: 20,
                    heavyDamage: 38,
                    stats: 'Lekki: 20 | Ciężki: 38',
                    count: 1,
                    maxCount: 1,
                    restock: false
                },
                {
                    id: 'alembik',
                    name: 'Miedziany Alembik',
                    icon: '⚗️',
                    type: 'tool',
                    weight: 3.5,
                    value: 10,
                    description: 'Przenośna aparatura alchemiczna. Postaw na ziemi, by warzyć mikstury.',
                    stats: 'Używane do warzenia mikstur'
                },
                {
                    id: 'skora_pancerz',
                    name: 'Skórzana Kurtka',
                    icon: '🛡️',
                    type: 'chest',
                    weight: 4.0,
                    value: 50,
                    armor: 23,
                    stats: 'Pancerz: 23',
                    count: 1,
                    maxCount: 1,
                    restock: false
                },
                {
                    id: 'skora_helm',
                    name: 'Skórzany Hełm',
                    icon: '🪖',
                    type: 'head',
                    weight: 1.5,
                    value: 35,
                    armor: 2,
                    stats: 'Pancerz: +2',
                    count: 1
                },
                {
                    id: 'skora_spodnie',
                    name: 'Skórzane Spodnie',
                    icon: '👖',
                    type: 'legs',
                    weight: 3.0,
                    value: 50,
                    armor: 3,
                    stats: 'Pancerz: 3',
                    count: 1
                },
                {
                    id: 'skora_buty',
                    name: 'Skórzane Buty',
                    icon: '🥾',
                    type: 'boots',
                    weight: 1.2,
                    value: 25,
                    armor: 1,
                    stats: 'Pancerz: 1',
                    count: 1
                }
            ]
        },
        zielarz_shop: {
            name: "Mira Zielarka",
            gold: 400,
            items: [
                { id: 'ziolo_czerwone', name: 'Czerwone Zioło', icon: '🌿', type: 'misc', weight: 0.1, value: 4, count: 12, restock: true },
                { id: 'herb_green', name: 'Zielone Zioło', icon: '🌱', type: 'misc', weight: 0.2, value: 5, count: 10, restock: true },
                { id: 'herb_blue', name: 'Niebieskie Zioło', icon: '🍃', type: 'misc', weight: 0.2, value: 6, count: 8, restock: true },
                { id: 'moon_lichen', name: 'Porost Księżycowy', icon: '🌙', type: 'material', weight: 0.2, value: 8, count: 6, restock: true },
                { id: 'crimson_pollen', name: 'Szkarłatny Pyłek', icon: '✨', type: 'material', weight: 0.1, value: 7, count: 6, restock: true },
                { id: 'ashwood_bark', name: 'Kora Jesionu', icon: '🌳', type: 'material', weight: 0.4, value: 6, count: 5, restock: true },
                { id: 'woda_butelka', name: 'Woda w Butelce', icon: '🧴', type: 'misc', weight: 0.5, value: 2, count: 8, restock: true },
                { id: 'korzen_zycia', name: 'Korzeń Życia', icon: '🌱', type: 'misc', weight: 0.2, value: 8, count: 5, restock: true },
                { id: 'potion_health', name: 'Mikstura Zdrowia', icon:'<img src="img/health_potion.png" alt="Mikstura Życia">', type: 'consumable', weight: 0.3, value: 18, count: 3, restock: true },
                { id: 'recipe_potion_guard', name: 'Receptura: Mikstura Ochronna', icon: '📜', type: 'document', weight: 0.1, value: 24, count: 1, restock: false, unlocksRecipe: 'potion_guard' },
                { id: 'recipe_potion_swiftness', name: 'Receptura: Mikstura Szybkości', icon: '📜', type: 'document', weight: 0.1, value: 26, count: 1, restock: false, unlocksRecipe: 'potion_swiftness' }
            ]
        },
        kowal_shop: {
            name: "Tomasz Kowal",
            gold: 600,
            items: [
                { id: 'iron_ore', name: 'Ruda Żelaza', icon: '⛏️', type: 'material', weight: 1.5, value: 12, count: 10, restock: true },
                { id: 'iron_ingot', name: 'Sztabka Żelaza', icon: '⛓️', type: 'material', weight: 1.2, value: 20, count: 8, restock: true },
                { id: 'iron_sand', name: 'Piasek Żelazny', icon: '🪨', type: 'material', weight: 0.9, value: 9, count: 6, restock: true },
                { id: 'ember_amber', name: 'Żarliwy Bursztyn', icon: '🟠', type: 'material', weight: 0.3, value: 11, count: 5, restock: true },
                { id: 'wood_handle', name: 'Drewniana Rękojeść', icon: '🪵', type: 'material', weight: 0.4, value: 10, count: 8, restock: true },
                { id: 'leather_strips', name: 'Skórzane Pasma', icon: '🧵', type: 'material', weight: 0.3, value: 9, count: 6, restock: true },
                { id: 'iron_knife', name: 'Żelazny Nóż', icon: '🗡️', type: 'weapon', weight: 1.8, value: 42, damage: 18, stats: 'Obrażenia: 18', count: 2, restock: true },
                { id: 'recipe_hunter_axe', name: 'Receptura: Topór Myśliwski', icon: '📜', type: 'document', weight: 0.1, value: 32, count: 1, restock: false, unlocksRecipe: 'hunter_axe' },
                { id: 'recipe_steel_spear', name: 'Receptura: Włócznia Żelazna', icon: '📜', type: 'document', weight: 0.1, value: 36, count: 1, restock: false, unlocksRecipe: 'steel_spear' }
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

        // Wyciągnięcie obrażeń i pancerza z definicji przedmiotu sklepowego
        const itemDamage = item.damage || item.lightDamage || 0;
        const itemArmor = item.armor || 0;

        // POPRAWKA: Przekazanie 8 i 9 argumentu (damage oraz armor)
        player.addItem(
            item.id,
            item.name,
            item.icon,
            item.type,
            item.weight,
            item.stats,
            1,          // count
            itemDamage, // damage
            itemArmor   // armor
        );

        if (item.unlocksRecipe) {
            player.unlockRecipe(item.unlocksRecipe);
            player.lastUnlockedRecipe = item.unlocksRecipe;
        }

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
                    applyItemFootprint(slot, item);

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
                    applyItemFootprint(slot, item);

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

function showToast(text) {
    const toast = document.getElementById('toast-message');
    if (!toast) return;
    toast.innerText = text;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
}

function showLocationBanner(text, options = {}) {
    const banner = document.getElementById('area-banner');
    if (!banner) return;

    const artSrc = options.art || null;
    const label = text || 'Nowe miejsce';

    if (artSrc) {
        banner.innerHTML = `
            <div class="area-banner-content">
                <img class="area-banner-art" src="${artSrc}" alt="${label}" />
            </div>
        `;
    } else {
        banner.innerHTML = `<span class="area-banner-text">${label}</span>`;
    }

    banner.classList.remove('hidden');
    clearTimeout(showLocationBanner._timer);
    showLocationBanner._timer = setTimeout(() => banner.classList.add('hidden'), 2200);
}


const lootBagSystem = {
    currentBag: null,

    initUI() {
        if (document.getElementById('loot-bag-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'loot-bag-modal';
        modal.className = 'hidden';
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(20, 15, 10, 0.95); border: 2px solid #8c6d3f; border-radius: 8px;
            padding: 16px; color: #fff; z-index: 1000; width: 300px; box-shadow: 0 0 20px #000;
            font-family: sans-serif;
        `;
        modal.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px; border-bottom: 1px solid #8c6d3f; padding-bottom: 6px;">
                <h3 style="margin:0; color:#f1c40f; font-size:15px;">🎒 Porzucona Sakwa</h3>
                <button id="close-loot-btn" style="background:none; border:none; color:#aaa; font-weight:bold; cursor:pointer; font-size:16px;">✕</button>
            </div>
            <div id="loot-bag-gold" style="color:#f1c40f; font-weight:bold; margin-bottom:8px; font-size:13px;"></div>
            <div id="loot-bag-items" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:6px; max-height: 180px; overflow-y:auto; margin-bottom:12px;"></div>
            <button id="loot-take-all-btn" style="width:100%; padding:8px; background:#8c6d3f; border:none; color:#fff; font-weight:bold; cursor:pointer; border-radius:4px;">Weź wszystko</button>
        `;
        document.body.appendChild(modal);

        document.getElementById('close-loot-btn').onclick = () => this.close();
        document.getElementById('loot-take-all-btn').onclick = () => this.takeAll();
    },

    open(bag) {
        this.initUI();
        this.currentBag = bag;
        const modal = document.getElementById('loot-bag-modal');
        if (modal) modal.classList.remove('hidden');
        this.render();
    },

    close() {
        this.currentBag = null;
        const modal = document.getElementById('loot-bag-modal');
        if (modal) modal.classList.add('hidden');
    },

    render() {
        if (!this.currentBag || this.currentBag.isEmpty()) {
            this.close();
            return;
        }

        const goldElem = document.getElementById('loot-bag-gold');
        if (goldElem) {
            goldElem.innerText = this.currentBag.gold > 0 ? `🪙 Złoto: ${this.currentBag.gold}` : '';
        }

        const itemsGrid = document.getElementById('loot-bag-items');
        if (!itemsGrid) return;
        itemsGrid.innerHTML = '';

        this.currentBag.items.forEach((item, index) => {
            const slot = document.createElement('div');
            slot.style.cssText = `
                background: #2b1d11; border: 1px solid #5a3d24; border-radius: 4px;
                height: 48px; display:flex; align-items:center; justify-content:center;
                position:relative; cursor:pointer; font-size:20px;
            `;
            const countBadge = item.count > 1 ? `<span style="position:absolute; bottom:2px; right:4px; font-size:10px; color:#fff; font-weight:bold;">${item.count}</span>` : '';
            slot.innerHTML = `${item.icon || '📦'}${countBadge}`;

            slot.onclick = () => this.takeItem(index);
            itemsGrid.appendChild(slot);
        });
    },

    takeItem(index) {
        if (!this.currentBag) return;
        const item = this.currentBag.items[index];
        if (!item) return;

        const success = player.addItem(
            item.id, item.name, item.icon, item.type,
            item.weight, item.stats, item.count || 1,
            item.damage || 0, item.armor || 0
        );

        if (success) {
            this.currentBag.items.splice(index, 1);
            if (this.currentBag.isEmpty()) {
                LootManager.removeBag(this.currentBag);
                this.close();
            } else {
                this.render();
            }
        }
    },

    takeAll() {
        if (!this.currentBag) return;

        if (this.currentBag.gold > 0) {
            player.gold += this.currentBag.gold;
            showToast(`+${this.currentBag.gold} Złota`);
            this.currentBag.gold = 0;
        }

        for (let i = this.currentBag.items.length - 1; i >= 0; i--) {
            const item = this.currentBag.items[i];
            const success = player.addItem(
                item.id, item.name, item.icon, item.type,
                item.weight, item.stats, item.count || 1,
                item.damage || 0, item.armor || 0
            );

            if (success) {
                this.currentBag.items.splice(i, 1);
            }
        }

        if (this.currentBag.isEmpty()) {
            LootManager.removeBag(this.currentBag);
            this.close();
        } else {
            this.render();
        }
    }
};



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

function drawCombatHUD(ctx) {
    ctx.save();

    const startX = 40;
    const canvasEl = ctx.canvas || document.getElementById('gameCanvas');
    const startY = canvasEl.height - 180;

    // Cień pod tekstem
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.font = 'bold 22px "Georgia", serif';

    // --- QUICK SLOTY 1, 2, 3 (WIDOCZNE ZAWSZE) ---
    for (let i = 0; i < 3; i++) {
        const itemId = player.quickSlots[i];
        const item = itemId ? (player.inventory.find(inv => inv.id === itemId) || (typeof ITEMS_DB !== 'undefined' ? ITEMS_DB[itemId] : null)) : null;
        const countText = (item && item.count && item.count > 1) ? ` (x${item.count})` : '';
        const itemText = item ? `${item.icon || ''} ${item.name}${countText}`.trim() : '';
        const lineY = startY + (i * 36);

        // Numeracja slotu
        ctx.fillStyle = '#b8975a';
        ctx.fillText(`${i + 1}.`, startX, lineY);

        // Nazwa przedmiotu (tylko jak coś w nim jest)
        if (itemText) {
            ctx.fillStyle = '#e6dfd3';
            ctx.fillText(itemText, startX + 30, lineY);
        }

    }

    // --- STYL BRONI (WIDOCZNY TYLKO W WALCE) ---
    if (typeof gameState !== 'undefined' && gameState === 'COMBAT') {
        const stanceY = startY + (3 * 36) + 8;

        ctx.fillStyle = '#b8975a';
        ctx.fillText('STYL:', startX, stanceY);

        ctx.fillStyle = '#e6dfd3';
        const stanceText = player.combatStance === '1H' ? 'Jednoręczny' : 'Dwuręczny';
        ctx.fillText(stanceText, startX + 90, stanceY);
    }
    // --- PASEK COOLDOWNU ATAKU ---
    if (typeof gameState !== 'undefined' && gameState === 'COMBAT' && player) {
        const barY = startY + (3 * 36) + 25;
        const barWidth = 140;
        const barHeight = 10;

        // Domyślny czas dla chwytu, jeśli brak ustawionego w obiekcie
        const maxCd = player.attackCooldown || (player.combatStance === '1H' ? 0.6 : 1.2);
        const currentTimer = Math.max(0, player.attackTimer || 0);

        // Obliczenie płynnego postępu od 0 (tuż po ataku) do 1 (gotowy)
        const progress = maxCd > 0 ? Math.min(1, Math.max(0, 1 - (currentTimer / maxCd))) : 1;
        const isReady = progress >= 1;

        // 1. Tło (ciemna baza)
        ctx.fillStyle = 'rgba(20, 20, 20, 0.85)';
        ctx.fillRect(startX, barY, barWidth, barHeight);

        // 2. Pasek postępu (ładuje się na pomarańczowo, po pełnym naładowaniu staje się szary)
        ctx.fillStyle = isReady ? '#5a6578' : '#d35400';
        ctx.fillRect(startX, barY, barWidth * progress, barHeight);

        // 3. Ramka
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(startX, barY, barWidth, barHeight);
    }
}

function drawActiveEffectsHUD(ctx) {
    // 1. Sprawdzamy, czy gracz ma jakiekolwiek aktywne buffy/mikstury
    if (!player || !player.activeEffects || player.activeEffects.length === 0) return;

    ctx.save();

    // 2. Pozycjonowanie w prawym górnym rogu (tuż pod minimapą)
    const boxWidth = 160;
    const boxHeight = 32;
    const canvasEl = ctx.canvas || document.getElementById('gameCanvas');
    const startX = canvasEl.width - boxWidth - 15;// 15px od prawej krawędzi
    let startY = 275; // Wysokość pod minimapą (dopasuj według potrzeb)

    player.activeEffects.forEach((effect, index) => {
        const y = startY + (index * (boxHeight + 6)); // Odstęp między efektami

        // Tło ramki efektu
        ctx.fillStyle = 'rgba(20, 15, 10, 0.75)';
        ctx.fillRect(startX, y, boxWidth, boxHeight);
        ctx.strokeStyle = '#8c6d3f';
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, y, boxWidth, boxHeight);

        // Ikona oraz Nazwa efektu
        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${effect.icon} ${effect.name}`, startX + 8, y + (boxHeight / 2));

        // Pozostały czas trwania (np. 12s)
        const timeLeft = Math.ceil(effect.remainingTime);
        ctx.fillStyle = '#f1c40f';
        ctx.textAlign = 'right';
        ctx.fillText(`${timeLeft}s`, startX + boxWidth - 8, y + (boxHeight / 2));
    });

    ctx.restore();
}

const chestSystem = {
    currentChest: null,
    draggedData: null,

    onDragStart(event, source, index) {
        this.draggedData = { source, index };
        event.dataTransfer.setData('text/plain', JSON.stringify(this.draggedData));
    },

    allowDrop(event) {
        event.preventDefault();
    },

    onDropToPlayer(event) {
        event.preventDefault();
        if (!this.currentChest) return;
        const data = this.draggedData || (() => {
            try { return JSON.parse(event.dataTransfer.getData('text/plain')); } catch (e) { return null; }
        })();
        if (!data) return;

        if (data.source === 'chest') {
            const item = this.currentChest.items[data.index];
            if (!item) return;
            if (player.getWeight() + (item.weight || 0) > player.maxWeight) {
                showToast('Brak miejsca w plecaku!');
                this.draggedData = null;
                return;
            }
            this.currentChest.items.splice(data.index, 1);
            player.addItem(item.id, item.name, item.icon, item.type, item.weight || 0.1, item.stats || '', item.count || 1, item.damage || 0, item.armor || 0);
            this.render();
        }
        this.draggedData = null;
    },

    onDropToChest(event) {
        event.preventDefault();
        if (!this.currentChest) return;
        const data = this.draggedData || (() => {
            try { return JSON.parse(event.dataTransfer.getData('text/plain')); } catch (e) { return null; }
        })();
        if (!data) return;

        if (data.source === 'player') {
            const item = player.inventory[data.index];
            if (!item) return;
            player.inventory.splice(data.index, 1);
            this.currentChest.items.push({ ...item });
            this.render();
        }
        this.draggedData = null;
    },

    transferToPlayer(index) {
        if (!this.currentChest || !this.currentChest.items[index]) return;
        const item = this.currentChest.items[index];
        if (player.getWeight() + (item.weight || 0) > player.maxWeight) {
            showToast('Brak miejsca w plecaku!');
            return;
        }
        this.currentChest.items.splice(index, 1);
        player.addItem(item.id, item.name, item.icon, item.type, item.weight || 0.1, item.stats || '', item.count || 1, item.damage || 0, item.armor || 0);
        this.render();
    },

    transferToChest(index) {
        if (!this.currentChest) return;
        const item = player.inventory[index];
        if (!item) return;
        player.inventory.splice(index, 1);
        this.currentChest.items.push({ ...item });
        this.render();
    },

    open(chest) {
        this.currentChest = chest;
        const modal = document.getElementById('chest-modal');
        if (modal) modal.classList.remove('hidden');
        this.render();
    },

    close() {
        this.currentChest = null;
        const modal = document.getElementById('chest-modal');
        if (modal) modal.classList.add('hidden');
    },

    render() {
        if (!this.currentChest) return;

        const playerGrid = document.getElementById('chest-player-grid');
        const chestGrid = document.getElementById('chest-grid');
        if (!playerGrid || !chestGrid) return;

        playerGrid.innerHTML = '';
        chestGrid.innerHTML = '';

        const renderSlotGrid = (grid, source, items, onAction) => {
            const totalSlots = Math.max(24, Math.ceil((items.length || 1) / 6) * 6);
            for (let i = 0; i < totalSlots; i++) {
                const slot = document.createElement('div');
                const item = items[i];
                if (item) {
                    const countBadge = (item.count && item.count > 1) ? `<span class="slot-count">${item.count}</span>` : '';
                    slot.className = 'grid-slot occupied';
                    slot.setAttribute('draggable', 'true');
                    slot.innerHTML = `${item.icon || '📦'}${countBadge}`;
                    slot.ondragstart = (e) => this.onDragStart(e, source, i);
                    slot.onclick = (e) => {
                        if (e.shiftKey) {
                            onAction(i);
                            return;
                        }
                        if (source === 'player') {
                            const target = player.inventory[i];
                            if (target) player.selectedItemIndex = i;
                        }
                    };
                    slot.ondblclick = () => onAction(i);
                    slot.onmouseenter = (e) => showTooltip(item, e);
                    slot.onmouseleave = () => showTooltip(null);
                } else {
                    slot.className = 'grid-slot empty';
                }
                grid.appendChild(slot);
            }
        };

        renderSlotGrid(playerGrid, 'player', player.inventory, (i) => this.transferToChest(i));
        renderSlotGrid(chestGrid, 'chest', this.currentChest.items, (i) => this.transferToPlayer(i));
    }
};

const dragDropManager = {
    draggedData: null,

    onDragStart(event, type, indexOrSlot) {
        this.draggedData = { type, id: indexOrSlot };
        event.dataTransfer.setData('text/plain', JSON.stringify(this.draggedData));
    },

    allowDrop(event) {
        event.preventDefault();
    },

    onDropToEquipment(event, slotType) {
        event.preventDefault();
        if (!this.draggedData) return;

        if (this.draggedData.type === 'inventory') {
            const item = player.inventory[this.draggedData.id];
            if (item && item.type === slotType) {
                player.equipItem(this.draggedData.id);
                menuSystem.renderInventoryTab(); // POPRAWKA: natychmiastowe przerysowanie EQ
            } else {
                showToast("Ten przedmiot nie pasuje do tego slotu!");
            }
        }
        this.draggedData = null;
    },
    onDropToQuickSlot(event, slotIndex) {
        event.preventDefault();
        if (!this.draggedData) return;

        if (this.draggedData.type === 'inventory') {
            // Pobieramy przedmiot po indeksie z tablicy lub po ID
            const item = player.inventory[this.draggedData.id] || player.inventory.find(i => i && i.id === this.draggedData.id);

            if (item) {
                // Zapisujemy unikalny ID przedmiotu lub jego nazwę/indeks
                const targetId = item.id || item.name;
                player.quickSlots[slotIndex] = targetId;

                showToast(`Przypisano do slotu ${slotIndex + 1}: ${item.name}`);

                // Odświeżamy i HUD, i zakładkę ekwipunku
                if (typeof updateQuickSlotsHUD === 'function') updateQuickSlotsHUD();
                if (typeof menuSystem !== 'undefined' && menuSystem.isOpen) {
                    menuSystem.renderInventoryTab();
                }
            }
        }
        this.draggedData = null;
    },
    onDropToInventory(event) {
        event.preventDefault();
        if (!this.draggedData) return;

        if (this.draggedData.type === 'equipment') {
            player.unequipItem(this.draggedData.id);
            menuSystem.renderInventoryTab(); // POPRAWKA: natychmiastowe przerysowanie EQ
        }
        this.draggedData = null;
    }
};
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

    // Dynamiczne generowanie tekstu statystyk
    let statsText = item.stats || '';
    if (item.damage) statsText = `⚔️ Obrażenia: +${item.damage}`;
    if (item.armor) statsText = `🛡️ Pancerz: +${item.armor}`;

    document.getElementById('tooltip-stats').innerText = statsText || 'Brak dodatkowych właściwości.';

    if (event) {
        tooltip.style.left = `${event.clientX + 15}px`;
        tooltip.style.top = `${event.clientY + 15}px`;
    }

    tooltip.classList.remove('hidden');
}

function setControlsHint(hints = []) {
    const container = document.getElementById('controls-hint');
    if (!container) return;

    if (hints.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = hints.map(h => `
        <div class="hint-row">
            <span class="hint-action">${h.action}</span>
            ${h.mode ? `<span class="hint-mode">[${h.mode}]</span>` : ''}
            <span class="hint-key">${h.key}</span>
        </div>
    `).join('');
}