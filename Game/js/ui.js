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

        // Włączenie dopuszczania dropu na obszarze plecaka
        grid.setAttribute('ondragover', 'dragDropManager.allowDrop(event)');
        grid.setAttribute('ondrop', 'dragDropManager.onDropToInventory(event)');

        const goldVal = document.getElementById('menu-gold-val');
        if (goldVal) goldVal.innerText = player.gold;

        const weightVal = document.getElementById('menu-weight-val');
        if (weightVal) weightVal.innerText = player.getWeight();

        const maxWeightVal = document.getElementById('menu-max-weight-val');
        if (maxWeightVal) maxWeightVal.innerText = player.maxWeight;

        const totalSlots = Math.max(25, player.inventory.length);
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
                },
                {
                    id: 'ziolo_czerwone',
                    name: 'Czerwone Zioło',
                    icon: '🌿', type: 'misc',
                    weight: 0.1,
                    value: 4,
                    count: 10,
                    restock: true
                },
                { id: 'woda_butelka', name: 'Woda w Butelce', icon: '🧴', type: 'misc', weight: 0.5, value: 2, count: 5, restock: true },
                { id: 'korzen_zycia', name: 'Korzeń Życia', icon: '🌱', type: 'misc', weight: 0.2, value: 8, count: 3, restock: true }
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

function showToast(text) {
    const toast = document.getElementById('toast-message');
    if (!toast) return;
    toast.innerText = text;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
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
