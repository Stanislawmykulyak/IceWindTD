const RECIPE_CATEGORIES = {
    heals: { name: "Mikstury Lecznicze", icon: "🍷" },
    combat: { name: "Mikstury Bojowe", icon: "⚔️" },
    utility: { name: "Wywary Wzmocnienia", icon: "🧪" },
    blades: { name: "Broń Ostrej", icon: "🗡️" },
    armor: { name: "Pancerz i Zbroja", icon: "🛡️" }
};

const CRAFTING_STATIONS = {
    herbalist: { name: 'Zielarz', icon: '🌿', categories: ['heals', 'combat', 'utility'], fee: 8 },
    smith: { name: 'Kowal', icon: '⚒️', categories: ['blades'], fee: 12 }
};

let worldObjects = [];

const ALCHEMY_RECIPES_DB = {
    potion_health: {
        id: 'potion_health',
        name: 'Mikstura Zdrowia',
        category: 'heals',
        station: 'herbalist',
        icon:'<img src="img/health_potion.png" alt="Mikstura Życia">',
        yieldCount: 3,
        description: 'Przywraca punkty życia w czasie.',
        effect: '+45 HP w ciągu 15s',
        lore: 'Podstawowy wywar każdego poszukiwacza przygód.',
        ingredients: [
            { id: 'ziolo_czerwone', name: 'Czerwone Zioło', icon: '🌿', count: 2 },
            { id: 'korzen_zycia', name: 'Korzeń Życia', icon: '🌱', count: 3 },
            { id: 'woda_butelka', name: 'Woda w Butelce', icon: '🧴', count: 1 }
        ],
        result: 'potion_health'
    },
    potion_strength: {
        id: 'potion_strength',
        name: 'Mikstura Siły',
        category: 'combat',
        station: 'herbalist',
        icon: '⚔️',
        yieldCount: 3,
        description: 'Zwiększa zadawane obrażenia.',
        effect: '+20% do Obrażeń',
        lore: 'Smakuje jak płynna miedź i gniew.',
        ingredients: [
            { id: 'ziolo_czerwone', name: 'Czerwone Zioło', icon: '🌿', count: 2 },
            { id: 'korzen_zycia', name: 'Korzeń Życia', icon: '🌱', count: 1 }
        ],
        result: 'potion_strength'
    },
    potion_fortification: {
        id: 'potion_fortification',
        name: 'Mikstura Wzmocnienia',
        category: 'utility',
        station: 'herbalist',
        icon: '🧪',
        yieldCount: 3,
        description: 'Zwiększa pancerz.',
        effect: '+15 Pancerza',
        lore: 'Twarda jak skała, gęsta jak smoła.',
        ingredients: [
            { id: 'herb_blue', name: 'Niebieskie Zioło', icon: '🍃', count: 2 },
            { id: 'iron_ore', name: 'Ruda Żelaza', icon: '⛏️', count: 1 }
        ],
        result: 'potion_fortification'
    },
    potion_guard: {
        id: 'potion_guard',
        name: 'Mikstura Ochronna',
        category: 'utility',
        station: 'herbalist',
        icon: '🛡️',
        yieldCount: 2,
        description: 'Chroni przed ciosem i grożącym urazem.',
        effect: '+18 Pancerza',
        lore: 'Pachnie mchem i chłodem, a dotyk daje poczucie bezpieczeństwa.',
        ingredients: [
            { id: 'moon_lichen', name: 'Porost Księżycowy', icon: '🌙', count: 2 },
            { id: 'crimson_pollen', name: 'Szkarłatny Pyłek', icon: '✨', count: 2 },
            { id: 'woda_butelka', name: 'Woda w Butelce', icon: '🧴', count: 1 }
        ],
        result: 'potion_guard'
    },
    potion_swiftness: {
        id: 'potion_swiftness',
        name: 'Mikstura Szybkości',
        category: 'combat',
        station: 'herbalist',
        icon: '💨',
        yieldCount: 2,
        description: 'Daje lekkość i zwiększa tempo ruchu.',
        effect: '+20% Szybkości',
        lore: 'Mikstura, która naprawdę sprawia, że stopy zapominają o zmęczeniu.',
        ingredients: [
            { id: 'herb_blue', name: 'Niebieskie Zioło', icon: '🍃', count: 2 },
            { id: 'ashwood_bark', name: 'Kora Jesionu', icon: '🌳', count: 2 },
            { id: 'woda_butelka', name: 'Woda w Butelce', icon: '🧴', count: 1 }
        ],
        result: 'potion_swiftness'
    },
    antitoxin_basic: {
        id: 'antitoxin_basic',
        name: 'Podstawowy Antidotum',
        category: 'utility',
        station: 'herbalist',
        icon: '🧴',
        yieldCount: 2,
        description: 'Czysti trucizny i odtruwa organizm.',
        effect: 'Kasuje efekt trucizny',
        lore: 'Taki eliksir uczymy od pierwszego spaceru po borze.',
        ingredients: [
            { id: 'herb_green', name: 'Zielone Zioło', icon: '🌱', count: 2 },
            { id: 'woda_butelka', name: 'Woda w Butelce', icon: '🧴', count: 1 }
        ],
        result: 'antitoxin_basic'
    }
};

const SMITH_RECIPES_DB = {
    iron_knife: {
        id: 'iron_knife',
        name: 'Żelazny Nóż',
        category: 'blades',
        station: 'smith',
        icon: '🗡️',
        yieldCount: 1,
        description: 'Lekka broń do cięcia i szybkich ataków.',
        effect: '+18 dmg',
        lore: 'Prosty, lecz skuteczny nóż z młyna i kuźni.',
        ingredients: [
            { id: 'iron_ingot', name: 'Sztabka Żelaza', icon: '⛓️', count: 2 },
            { id: 'wood_handle', name: 'Drewniana Rękojeść', icon: '🪵', count: 1 }
        ],
        result: 'iron_knife',
        resultItem: {
            id: 'iron_knife',
            name: 'Żelazny Nóż',
            icon: '🗡️',
            type: 'weapon',
            weight: 1.8,
            damage: 18,
            stats: 'Obrażenia: 18',
            description: 'Lekka broń do cięcia i szybkich ataków.'
        }
    },
    iron_sword: {
        id: 'iron_sword',
        name: 'Żelazny Miecz',
        category: 'blades',
        station: 'smith',
        icon: '⚔️',
        yieldCount: 1,
        description: 'Solidna broń dla początkujących wojowników.',
        effect: '+32 dmg',
        lore: 'Miecz, który zwykle wykuwa się z bólu i pośpiechu.',
        ingredients: [
            { id: 'iron_ingot', name: 'Sztabka Żelaza', icon: '⛓️', count: 3 },
            { id: 'wood_handle', name: 'Drewniana Rękojeść', icon: '🪵', count: 1 },
            { id: 'leather_strips', name: 'Skórzane Pasma', icon: '🧵', count: 1 }
        ],
        result: 'iron_sword',
        resultItem: {
            id: 'iron_sword',
            name: 'Żelazny Miecz',
            icon: '⚔️',
            type: 'weapon',
            weight: 3.4,
            damage: 32,
            stats: 'Obrażenia: 32',
            description: 'Solidna broń dla początkujących wojowników.'
        }
    },
    iron_helmet: {
        id: 'iron_helmet',
        name: 'Żelazny Hełm',
        category: 'armor',
        station: 'smith',
        icon: '⛑️',
        yieldCount: 1,
        description: 'Lekki hełm z żelaza.',
        effect: '+4 armor',
        lore: 'Często służył prostym walczącym przy drodze.',
        ingredients: [
            { id: 'iron_ingot', name: 'Sztabka Żelaza', icon: '⛓️', count: 2 },
            { id: 'leather_strips', name: 'Skórzane Pasma', icon: '🧵', count: 1 }
        ],
        result: 'iron_helmet',
        resultItem: {
            id: 'iron_helmet',
            name: 'Żelazny Hełm',
            icon: '⛑️',
            type: 'head',
            weight: 2.2,
            armor: 4,
            stats: 'Pancerz: +4',
            description: 'Lekki hełm z żelaza.'
        }
    },
    hunter_axe: {
        id: 'hunter_axe',
        name: 'Topór Myśliwski',
        category: 'blades',
        station: 'smith',
        icon: '🪓',
        yieldCount: 1,
        description: 'Szybki, ciężki topór do rąbania i cięcia.',
        effect: '+28 dmg',
        lore: 'Wyrób z jasionu i żelaznego pyłu, stworzony dla kogoś, kto lubi ciężki ruch.',
        ingredients: [
            { id: 'iron_ingot', name: 'Sztabka Żelaza', icon: '⛓️', count: 2 },
            { id: 'ashwood_bark', name: 'Kora Jesionu', icon: '🌳', count: 1 },
            { id: 'iron_sand', name: 'Piasek Żelazny', icon: '🪨', count: 1 }
        ],
        result: 'hunter_axe',
        resultItem: {
            id: 'hunter_axe',
            name: 'Topór Myśliwski',
            icon: '🪓',
            type: 'weapon',
            weight: 2.9,
            damage: 28,
            stats: 'Obrażenia: 28',
            description: 'Szybki, ciężki topór do rąbania i cięcia.'
        }
    },
    steel_spear: {
        id: 'steel_spear',
        name: 'Włócznia Żelazna',
        category: 'blades',
        station: 'smith',
        icon: '🗡️',
        yieldCount: 1,
        description: 'Długa, celna broń do szybkich pchnięć.',
        effect: '+36 dmg',
        lore: 'Nowe ostrze z żarliwego bursztynu, trzymane przez mocną rękojeść.',
        ingredients: [
            { id: 'iron_ingot', name: 'Sztabka Żelaza', icon: '⛓️', count: 3 },
            { id: 'ember_amber', name: 'Żarliwy Bursztyn', icon: '🟠', count: 1 },
            { id: 'wood_handle', name: 'Drewniana Rękojeść', icon: '🪵', count: 1 }
        ],
        result: 'steel_spear',
        resultItem: {
            id: 'steel_spear',
            name: 'Włócznia Żelazna',
            icon: '🗡️',
            type: 'weapon',
            weight: 3.1,
            damage: 36,
            stats: 'Obrażenia: 36',
            description: 'Długa, celna broń do szybkich pchnięć.'
        }
    },
    ruinbreaker_blade: {
        id: 'ruinbreaker_blade',
        name: 'Roztrzaskiwacz Ruin',
        category: 'blades',
        station: 'smith',
        icon: '🗡️',
        yieldCount: 1,
        description: 'Ostrze stworzone do rozbijania starożytnych murów i rycerzy.',
        effect: '+82 dmg',
        lore: 'Przeklęte ostrze z ruin, złożone z martwej stali i rozpalonego bursztynu.',
        ingredients: [
            { id: 'iron_ingot', name: 'Sztabka Żelaza', icon: '⛓️', count: 2 },
            { id: 'ruin_steel', name: 'Ruina Stal', icon: '🪓', count: 2 },
            { id: 'moonsteel_scrap', name: 'Odcinek Księżycowej Stali', icon: '🌙', count: 2 },
            { id: 'runic_clay', name: 'Runiczna Glina', icon: '🟫', count: 1 }
        ],
        result: 'ruinbreaker_blade',
        resultItem: {
            id: 'ruinbreaker_blade',
            name: 'Roztrzaskiwacz Ruin',
            icon: '🗡️',
            type: 'weapon',
            weight: 4.1,
            damage: 82,
            critChance: 0.12,
            stats: 'Obrażenia: 82',
            description: 'Ostrze stworzone do rozbijania starożytnych murów i rycerzy.'
        }
    },
    moonfang_axe: {
        id: 'moonfang_axe',
        name: 'Topór Księżycowego Kła',
        category: 'blades',
        station: 'smith',
        icon: '🪓',
        yieldCount: 1,
        description: 'Ciężki topór z runicznym ostrzem i księżycowym rdzeniem.',
        effect: '+76 dmg',
        lore: 'Rzadkie ostrze wrzucone do ognia z księżycową stalą i bursztynem.',
        ingredients: [
            { id: 'iron_ingot', name: 'Sztabka Żelaza', icon: '⛓️', count: 2 },
            { id: 'moonsteel_scrap', name: 'Odcinek Księżycowej Stali', icon: '🌙', count: 2 },
            { id: 'sun_amber', name: 'Słoneczny Bursztyn', icon: '🌞', count: 1 },
            { id: 'wood_handle', name: 'Drewniana Rękojeść', icon: '🪵', count: 1 }
        ],
        result: 'moonfang_axe',
        resultItem: {
            id: 'moonfang_axe',
            name: 'Topór Księżycowego Kła',
            icon: '🪓',
            type: 'weapon',
            weight: 4.6,
            damage: 76,
            critChance: 0.1,
            stats: 'Obrażenia: 76',
            description: 'Ciężki topór z runicznym ostrzem i księżycowym rdzeniem.'
        }
    }
};

function getRecipeCatalog(station = 'herbalist') {
    const recipes = station === 'smith' ? Object.values(SMITH_RECIPES_DB) : Object.values(ALCHEMY_RECIPES_DB);
    return recipes.filter(r => r.station === station);
}

function getAvailableAlembicRecipes() {
    return Object.values(ALCHEMY_RECIPES_DB).filter(recipe =>
        player.unlockedRecipes.includes(recipe.id)
    );
}

function getAvailableSmithRecipes() {
    return Object.values(SMITH_RECIPES_DB).filter(recipe =>
        player.unlockedRecipes.includes(recipe.id)
    );
}

const craftBaseUI = {
    station: 'herbalist',
    selectedRecipeId: null,
    openCategories: new Set(['heals']),
    isOpen: false,

    getRecipeMap() {
        return this.station === 'smith' ? SMITH_RECIPES_DB : ALCHEMY_RECIPES_DB;
    },

    getCategoryMap() {
        return this.station === 'smith' ? RECIPE_CATEGORIES : RECIPE_CATEGORIES;
    },

    getVisibleRecipes() {
        return Object.values(this.getRecipeMap()).filter(recipe => {
            if (recipe.station !== this.station) return false;
            if (this.station === 'smith' && recipe.category !== 'blades') return false;
            return player.unlockedRecipes.includes(recipe.id);
        });
    },

    getPlayerItemCount(itemId) {
        return player.inventory
            .filter(i => i && i.id === itemId)
            .reduce((sum, item) => sum + (item.count || 1), 0);
    },

    canCraft(recipe) {
        if (!recipe || !recipe.ingredients) return false;
        return recipe.ingredients.every(ing => this.getPlayerItemCount(ing.id) >= ing.count);
    },

    getStationShopKey() {
        return this.station === 'smith' ? 'kowal_shop' : 'zielarz_shop';
    },

    getMissingIngredients(recipe) {
        if (!recipe || !recipe.ingredients) return [];
        return recipe.ingredients.filter(ing => this.getPlayerItemCount(ing.id) < ing.count)
            .map(ing => ({
                ...ing,
                owned: this.getPlayerItemCount(ing.id),
                missing: Math.max(0, ing.count - this.getPlayerItemCount(ing.id))
            }));
    },

    getShopIngredient(ingredientId) {
        const shopKey = this.getStationShopKey();
        const shop = shopSystem && shopSystem.shops ? shopSystem.shops[shopKey] : null;
        if (!shop) return null;
        return shop.items.find(item => item && item.id === ingredientId) || null;
    },

    buyIngredient(ingredientId, amount = 1) {
        const shopKey = this.getStationShopKey();
        const shop = shopSystem && shopSystem.shops ? shopSystem.shops[shopKey] : null;
        if (!shop) {
            showToast('Brak dostawcy dla tej profesji.');
            return;
        }

        const item = shop.items.find(i => i && i.id === ingredientId);
        if (!item) {
            showToast('Fachowiec nie ma już tego surowca.');
            return;
        }

        const qty = Math.max(1, Math.min(amount || 1, item.count || 0));
        const cost = qty * (item.value || 2);

        if (player.gold < cost) {
            showToast('Za mało złota na zakup surowca!');
            return;
        }

        player.gold -= cost;
        if (shop.gold !== undefined) shop.gold += cost;

        item.count = Math.max(0, (item.count || 0) - qty);
        if (item.count <= 0 && !item.restock) {
            shop.items = shop.items.filter(i => i && i.id !== ingredientId);
        }

        player.addItem(
            item.id,
            item.name,
            item.icon,
            item.type,
            item.weight,
            item.stats,
            qty,
            item.damage || 0,
            item.armor || 0
        );

        showToast(`Kupiono ${qty}x ${item.name} za ${cost} 🪙`);
        this.render();
        if (typeof menuSystem !== 'undefined' && menuSystem.isOpen) menuSystem.renderInventoryTab();
    },

    craft(recipeId) {
        const recipe = this.getRecipeMap()[recipeId];
        if (!recipe) return;
        if (!this.canCraft(recipe)) {
            showToast('Brak wymaganych składników!');
            return;
        }

        const fee = CRAFTING_STATIONS[this.station]?.fee || 0;
        if (player.gold < fee) {
            showToast('Za mało złota na opłatę fachowca!');
            return;
        }

        player.gold -= fee;
        const shopKey = this.getStationShopKey();
        if (shopSystem && shopSystem.shops && shopSystem.shops[shopKey] && shopSystem.shops[shopKey].gold !== undefined) {
            shopSystem.shops[shopKey].gold += fee;
        }

        recipe.ingredients.forEach(ing => {
            let required = ing.count;
            for (let i = player.inventory.length - 1; i >= 0; i--) {
                const item = player.inventory[i];
                if (!item || item.id !== ing.id) continue;
                const qty = item.count || 1;
                if (qty >= required) {
                    if (qty > required) item.count = qty - required;
                    else player.inventory.splice(i, 1);
                    required = 0;
                } else {
                    required -= qty;
                    player.inventory.splice(i, 1);
                }
                if (required <= 0) break;
            }
        });

        const resultData = recipe.resultItem || (ITEMS_DB && ITEMS_DB[recipe.result]) || {
            id: recipe.result,
            name: recipe.name,
            icon: recipe.icon,
            type: 'misc',
            weight: 1,
            stats: recipe.effect || recipe.description
        };

        const amount = recipe.yieldCount || 1;
        player.addItem(
            resultData.id || recipe.result,
            resultData.name || recipe.name,
            resultData.icon || recipe.icon,
            resultData.type || 'misc',
            resultData.weight || 0.5,
            resultData.stats || recipe.description,
            amount,
            resultData.damage || 0,
            resultData.armor || 0,
            resultData.effects || null
        );

        showToast(`${recipe.name} zostało wykonane! Opłata: ${fee} 🪙`);
        this.render();
        if (typeof menuSystem !== 'undefined' && menuSystem.isOpen) menuSystem.renderInventoryTab();
    },

    open(station = 'herbalist') {
        this.station = station;
        this.selectedRecipeId = this.selectedRecipeId || this.getVisibleRecipes()[0]?.id || null;
        const modal = document.getElementById('alchemy-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.isOpen = true;
            this.render();
        }
    },

    close() {
        const modal = document.getElementById('alchemy-modal');
        if (modal) modal.classList.add('hidden');
        this.isOpen = false;
    },

    toggleCategory(catKey) {
        if (this.openCategories.has(catKey)) this.openCategories.delete(catKey);
        else this.openCategories.add(catKey);
        this.render();
    },

    render() {
        const recipeListEl = document.getElementById('alc-recipe-list');
        const detailsEl = document.getElementById('alc-details-panel');
        if (!recipeListEl || !detailsEl) return;

        const stationName = CRAFTING_STATIONS[this.station]?.name || 'Zielarz';
        const recipes = this.getVisibleRecipes();
        if (!this.selectedRecipeId && recipes[0]) this.selectedRecipeId = recipes[0].id;
        if (!this.selectedRecipeId) {
            detailsEl.innerHTML = '<div class="alc-empty">Brak odblokowanych receptur w tej profesji.</div>';
            recipeListEl.innerHTML = '<div class="alc-empty">Brak receptur.</div>';
            return;
        }

        const currentRecipe = this.getRecipeMap()[this.selectedRecipeId];
        recipeListEl.innerHTML = '';

        Object.keys(RECIPE_CATEGORIES).forEach(catKey => {
            if (!this.getCategoryMap()[catKey] || !CRAFTING_STATIONS[this.station]?.categories.includes(catKey)) return;
            const catRecipes = recipes.filter(r => r.category === catKey);
            if (catRecipes.length === 0) return;
            const isOpen = this.openCategories.has(catKey);
            const catHeader = document.createElement('div');
            catHeader.className = 'alc-cat-header';
            catHeader.innerHTML = `<span>${RECIPE_CATEGORIES[catKey].icon} ${RECIPE_CATEGORIES[catKey].name}</span><span>${isOpen ? '▲' : '▼'}</span>`;
            catHeader.onclick = () => this.toggleCategory(catKey);
            recipeListEl.appendChild(catHeader);

            if (isOpen) {
                const catList = document.createElement('div');
                catList.className = 'alc-cat-list';
                catRecipes.forEach(rec => {
                    const recItem = document.createElement('div');
                    const isSelected = this.selectedRecipeId === rec.id;
                    const ready = this.canCraft(rec);
                    recItem.className = `alc-recipe-item ${isSelected ? 'selected' : ''}`;
                    recItem.innerHTML = `<span>${rec.icon} ${rec.name}</span><span class="alc-dot ${ready ? 'green' : 'red'}">●</span>`;
                    recItem.onclick = () => {
                        this.selectedRecipeId = rec.id;
                        this.render();
                    };
                    catList.appendChild(recItem);
                });
                recipeListEl.appendChild(catList);
            }
        });

        if (!currentRecipe) {
            detailsEl.innerHTML = `<div class="alc-empty">Wybierz recepturę z listy po lewej.</div>`;
            return;
        }

        const isCraftable = this.canCraft(currentRecipe);
        const resultOwned = this.getPlayerItemCount(currentRecipe.resultItem?.id || currentRecipe.result);
        const fee = CRAFTING_STATIONS[this.station]?.fee || 0;
        const missingIngredients = this.getMissingIngredients(currentRecipe);
        const ingredientsHtml = currentRecipe.ingredients.map(ing => {
            const owned = this.getPlayerItemCount(ing.id);
            const enough = owned >= ing.count;
            const shopItem = this.getShopIngredient(ing.id);
            const missingQty = Math.max(0, ing.count - owned);
            const canBuy = !!shopItem && (shopItem.count || 0) > 0 && missingQty > 0;

            return `
                <div class="alc-ing-card">
                    <div class="alc-slot ${enough ? 'enough' : 'missing'}" title="${ing.name}">
                        <span class="alc-ing-icon">${ing.icon}</span>
                        <span class="alc-slot-count ${enough ? 'text-green' : 'text-red'}">${owned}/${ing.count}</span>
                    </div>
                    <div class="alc-ing-name">${ing.name}</div>
                    ${canBuy ? `<button class="alc-buy-btn" onclick="craftingSystem.buyIngredient('${ing.id}', ${missingQty})">Kup ${missingQty}</button>` : ''}
                </div>
            `;
        }).join('');

        detailsEl.innerHTML = `
            <div class="alc-header">
                <div>
                    <h2 class="alc-title">${stationName}: ${currentRecipe.name}</h2>
                    <p class="alc-desc">${currentRecipe.description}</p>
                </div>
            </div>
            <div class="alc-effect-badge">✨ <b>Efekt:</b> ${currentRecipe.effect || 'Brak efektu'}</div>
            <div class="alc-service-fee">💰 <b>Opłata fachowca:</b> ${fee} 🪙</div>
            <div class="alc-crafting-row">
                <div class="alc-ing-group">
                    <div class="alc-group-title">Wymagane składniki</div>
                    <div class="alc-ing-grid">${ingredientsHtml}</div>
                </div>
                <div class="alc-arrow">➔</div>
                <div class="alc-result-group">
                    <div class="alc-group-title">Produkt końcowy</div>
                    <div class="alc-slot result-slot"><div class="alc-ing-icon">${currentRecipe.icon}</div></div>
                    <div class="alc-result-name">${currentRecipe.name}</div>
                    <div class="alc-result-owned">W ekwipunku: <b>${resultOwned} szt.</b></div>
                </div>
            </div>
            ${missingIngredients.length ? `<div class="alc-missing-box">⚠️ Brakuje: ${missingIngredients.map(m => `${m.name} (${m.missing})`).join(', ')}</div>` : ''}
            <div class="alc-lore-box"><div class="alc-lore-title">📜 Historia & Zapiski:</div><div class="alc-lore-text">"${currentRecipe.lore}"</div></div>
            <div class="alc-craft-bar">
                <button class="alc-craft-btn ${isCraftable ? 'active' : 'disabled'}" ${!isCraftable ? 'disabled' : ''} onclick="craftingSystem.craft('${currentRecipe.id}')">
                    ${this.station === 'smith' ? '⚒️' : '🧪'} Wytwórz
                </button>
            </div>
        `;
    }
};

const craftingSystem = Object.assign({}, craftBaseUI);
const alchemyUI = Object.assign({}, craftBaseUI, {
    station: 'herbalist',
    selectedRecipeId: 'potion_health',
    open() { this.station = 'herbalist'; return craftBaseUI.open.call(this, 'herbalist'); },
    render() { return craftBaseUI.render.call(this); },
    craft(recipeId) { return craftBaseUI.craft.call(this, recipeId); },
    canCraft(recipe) { return craftBaseUI.canCraft.call(this, recipe); }
});

const smithUI = Object.assign({}, craftBaseUI, {
    station: 'smith',
    selectedRecipeId: 'iron_knife',
    open() { this.station = 'smith'; return craftBaseUI.open.call(this, 'smith'); },
    render() { return craftBaseUI.render.call(this); },
    craft(recipeId) { return craftBaseUI.craft.call(this, recipeId); },
    canCraft(recipe) { return craftBaseUI.canCraft.call(this, recipe); }
});

function openHerbalistCrafting() {
    if (typeof alchemyUI !== 'undefined') alchemyUI.open();
}

function openSmithCrafting() {
    if (typeof smithUI !== 'undefined') smithUI.open();
}

window.openHerbalistCrafting = openHerbalistCrafting;
window.openSmithCrafting = openSmithCrafting;

// Klasa obiekty stojącego na mapie
class PlacedAlembic {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    draw(ctx) {
        ctx.save();
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚗️', this.x, this.y);

        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist < 50) {
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('[E] Użyj   [F] Zwiń', this.x, this.y - 25);
        }

        ctx.restore();
    }

    handleInteraction(key) {
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist >= 50) return false;

        const k = key.toLowerCase();
        if (k === 'e') {
            openHerbalistCrafting();
            return true;
        }

        if (k === 'f') {
            const added = player.addItem(
                'alembik',
                'Miedziany Alembik',
                '⚗️',
                'tool',
                3.5,
                'Przenośna aparatura alchemiczna.',
                1, 0, 0
            );

            if (added !== false) {
                showToast('Zwinięto Alembik do plecaka!');
                return 'REMOVE';
            }
            showToast('Brak miejsca w plecaku!');
        }
        return false;
    }
}

player.placeAlembic = function () {
    const itemIndex = this.inventory.findIndex(i => i && i.id === 'alembik');
    if (itemIndex === -1) {
        showToast('Nie posiadasz Alembika!');
        return;
    }

    const spawnX = this.x + 30;
    const spawnY = this.y;
    worldObjects.push(new PlacedAlembic(spawnX, spawnY));

    if (this.inventory[itemIndex].count > 1) {
        this.inventory[itemIndex].count--;
    } else {
        this.inventory.splice(itemIndex, 1);
    }

    showToast('Rozstawiono Alembik!');
};