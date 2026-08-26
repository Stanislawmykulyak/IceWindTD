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
                    damage: 27,
                    stats: 'Obrażenia: 27',
                    count: 1,
                    maxCount: 1,
                    restock: false
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