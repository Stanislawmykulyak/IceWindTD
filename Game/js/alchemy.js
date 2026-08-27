const RECIPE_CATEGORIES = {
    heals: { name: "Mikstury Lecznicze", icon: "🍷" },
    combat: { name: "Mikstury Bojowe", icon: "⚔️" },
    utility: { name: "Wywary Wzmocnienia", icon: "🧪" }
};

let worldObjects = [];

const ALCHEMY_RECIPES_DB = {
    potion_health: {
        id: 'potion_health',
        name: 'Mikstura Zdrowia',
        category: 'heals',
        icon: '🍷',
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
    }
};

function getAvailableAlembicRecipes() {
    return Object.values(ALCHEMY_RECIPES_DB).filter(recipe =>
        player.unlockedRecipes.includes(recipe.id)
    );
}

const alchemyUI = {
    isOpen: false, // <-- Dodana flaga stanu
    selectedRecipeId: 'potion_health',
    openCategories: new Set(['heals']),

    open() {
        const modal = document.getElementById('alchemy-modal');
        if (modal) {
            modal.classList.remove('hidden');
            if (typeof this.render === 'function') this.render();
        }
    },
    close() {
        const modal = document.getElementById('alchemy-modal');
        if (modal) modal.classList.add('hidden');
    },

    toggleCategory(catKey) {
        if (this.openCategories.has(catKey)) {
            this.openCategories.delete(catKey);
        } else {
            this.openCategories.add(catKey);
        }
        this.render();
    },

    getPlayerItemCount(itemId) {
        return player.inventory
            .filter(i => i && i.id === itemId)
            .reduce((sum, item) => sum + (item.count || 1), 0);
    },

    canCraft(recipe) {
        return recipe.ingredients.every(ing => this.getPlayerItemCount(ing.id) >= ing.count);
    },

    craft(recipeId) {
        const recipe = ALCHEMY_RECIPES_DB[recipeId];
        if (!recipe || !this.canCraft(recipe)) {
            showToast("Brak wymaganych składników!");
            return;
        }

        // Zabieranie składników z plecaka
        recipe.ingredients.forEach(ing => {
            let needed = ing.count;
            for (let i = player.inventory.length - 1; i >= 0; i--) {
                const item = player.inventory[i];
                if (item && item.id === ing.id) {
                    const itemQty = item.count || 1;
                    if (itemQty > needed) {
                        item.count -= needed;
                        needed = 0;
                    } else {
                        needed -= itemQty;
                        player.inventory.splice(i, 1);
                    }
                    if (needed <= 0) break;
                }
            }
        });

        // Dodanie mikstur do plecaka (uwzględnia yieldCount)
        const amount = recipe.yieldCount || 1;
        player.addItem(recipe.result, recipe.name, recipe.icon, 'consumable', 0.4, recipe.description, amount, 0, 0);

        // Toast z informacją o wyprodukowanej ilości (np. x3)
        // NOWY KOD:
        showToast(`Uwarzono: ${recipe.name}${amount > 1 ? ` x${amount}` : ''}!`);

        // 1. Re-render listy receptur
        this.render();


        // 3. Odświeżenie głównego UI ekwipunku (jeśli masz osobny moduł)
        if (window.inventoryUI && typeof inventoryUI.render === 'function') {
            inventoryUI.render();
        }
    },

    render() {
        const known = player.unlockedRecipes || ['potion_health']; // Domyślnie gracz zna małe leczenie
        const recipeListEl = document.getElementById('alc-recipe-list');
        const detailsEl = document.getElementById('alc-details-panel');

        if (!recipeListEl || !detailsEl) return;

        // 1. BUDOWANIE LEWEGO PASKA Z ZAKŁADKAMI
        recipeListEl.innerHTML = '';

        Object.keys(RECIPE_CATEGORIES).forEach(catKey => {
            const catRecipes = known
                .map(id => ALCHEMY_RECIPES_DB[id])
                .filter(r => r && r.category === catKey);

            // Wyświetlamy zakładkę TYLKO jeśli gracz zna chociaż jedną recepturę z tej kategorii
            if (catRecipes.length > 0) {
                const isOpen = this.openCategories.has(catKey);
                const catHeader = document.createElement('div');
                catHeader.className = 'alc-cat-header';
                catHeader.innerHTML = `<span>${RECIPE_CATEGORIES[catKey].icon} ${RECIPE_CATEGORIES[catKey].name}</span> <span>${isOpen ? '▲' : '▼'}</span>`;
                catHeader.onclick = () => this.toggleCategory(catKey);
                recipeListEl.appendChild(catHeader);

                if (isOpen) {
                    const catList = document.createElement('div');
                    catList.className = 'alc-cat-list';

                    catRecipes.forEach(rec => {
                        const recItem = document.createElement('div');
                        const isSelected = this.selectedRecipeId === rec.id;
                        const readyToCraft = this.canCraft(rec);
                        recItem.className = `alc-recipe-item ${isSelected ? 'selected' : ''}`;
                        recItem.innerHTML = `
                            <span>${rec.icon} ${rec.name}</span>
                            <span class="alc-dot ${readyToCraft ? 'green' : 'red'}">●</span>
                        `;
                        recItem.onclick = () => {
                            this.selectedRecipeId = rec.id;
                            this.render();
                        };
                        catList.appendChild(recItem);
                    });
                    recipeListEl.appendChild(catList);
                }
            }
        });

        // 2. BUDOWANIE ŚRODKOWEGO PANELU SZCZEGÓŁÓW
        const currentRecipe = ALCHEMY_RECIPES_DB[this.selectedRecipeId];
        if (!currentRecipe) {
            detailsEl.innerHTML = `<div class="alc-empty">Wybierz recepturę z listy po lewej.</div>`;
            return;
        }

        const isCraftable = this.canCraft(currentRecipe);
        const resultOwned = this.getPlayerItemCount(currentRecipe.result);

        // Składniki: Ikona + Licznik (w kwadracie) + Nazwa pod spodem
        const ingredientsHtml = currentRecipe.ingredients.map(ing => {
            const owned = this.getPlayerItemCount(ing.id);
            const isEnough = owned >= ing.count;
            return `
                <div class="alc-ing-card">
                    <div class="alc-slot ${isEnough ? 'enough' : 'missing'}" title="${ing.name}">
                        <span class="alc-ing-icon">${ing.icon}</span>
                        <span class="alc-slot-count ${isEnough ? 'text-green' : 'text-red'}">${owned}/${ing.count}</span>
                    </div>
                    <div class="alc-ing-name">${ing.name}</div>
                </div>
            `;
        }).join('');

        detailsEl.innerHTML = `
            <div class="alc-header">
                <div>
                    <h2 class="alc-title">${currentRecipe.name}</h2>
                    <p class="alc-desc">${currentRecipe.description}</p>
                </div>
            </div>

            <div class="alc-effect-badge">
                ✨ <b>Efekt:</b> ${currentRecipe.effect || 'Brak efektu'}
            </div>

            <div class="alc-crafting-row">
                <div class="alc-ing-group">
                    <div class="alc-group-title">Wymagane składniki</div>
                    <div class="alc-ing-grid">${ingredientsHtml}</div>
                </div>

                <div class="alc-arrow">➔</div>

                <div class="alc-result-group">
                    <div class="alc-group-title">Produkt końcowy</div>
                    <div class="alc-slot result-slot">
                        <div class="alc-ing-icon">${currentRecipe.icon}</div>
                    </div>
                    <div class="alc-result-name">${currentRecipe.name}</div>
                    <div class="alc-result-owned">W ekwipunku: <b>${resultOwned} szt.</b></div>
                </div>
            </div>

            <div class="alc-lore-box">
                <div class="alc-lore-title">📜 Historia & Zapiski:</div>
                <div class="alc-lore-text">"${currentRecipe.lore}"</div>
            </div>

            <div class="alc-craft-bar">
                <button class="alc-craft-btn ${isCraftable ? 'active' : 'disabled'}" ${!isCraftable ? 'disabled' : ''} onclick="alchemyUI.craft('${currentRecipe.id}')">
                    🧪 Uwarz Miksturę
                </button>
            </div>
        `;
    }
};

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

        // Podpowiedź nad alembikiem
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

        // [E] Otwarcie alchemii
        if (k === 'e') {
            alchemyUI.open();
            return true;
        }

        // [F] Zbieranie do plecaka
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
                showToast("Zwinięto Alembik do plecaka!");
                return 'REMOVE';
            } else {
                showToast("Brak miejsca w plecaku!");
            }
        }
        return false;
    }
}

// Logika stawiania Alembika z ekwipunku
player.placeAlembic = function () {
    const itemIndex = this.inventory.findIndex(i => i && i.id === 'alembik');
    if (itemIndex === -1) {
        showToast("Nie posiadasz Alembika!");
        return;
    }

    // Stawiamy Alembik tuż przed graczem
    const spawnX = this.x + 30;
    const spawnY = this.y;

    worldObjects.push(new PlacedAlembic(spawnX, spawnY));

    // Usuwamy 1 sztukę z plecaka
    if (this.inventory[itemIndex].count > 1) {
        this.inventory[itemIndex].count--;
    } else {
        this.inventory.splice(itemIndex, 1);
    }

    showToast("Rozstawiono Alembik!");
};