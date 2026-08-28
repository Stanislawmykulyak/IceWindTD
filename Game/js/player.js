const player = {
    // 1. Pozycja i podstawowe statystyki
    x: 100,
    y: 550,
    radius: 12,
    gold: 100,
    color: '#3498db',
    canMove: true,
    angle: 0,
    iFrames: false,
    isMounted: false,
    isSleeping: false,

    // Ekwipunek i Efekty
    maxWeight: 100.0,
    selectedItemIndex: null,
    activeEffects: [], // Jednolity system dla WSZYSTKICH efektów

    inventory: [
        {
            id: 'list_nicolas',
            name: 'List od Nicolasa',
            icon: '📜',
            type: 'quest',
            weight: 0.2,
            monologueId: 'read_nicolas_letter',
            questTrigger: { questId: 'Q1', step: 0 },
            stats: 'Kliknij Dwukrotnie aby przeczytać',
            content: "Arkelasie , mój Drogi przyjacielu Mam nadzieję ,że przeczytasz ten list a życie mija ci spokojnie, jak pewnie wiesz osiedliłem się miasteczku Kruczy Dół , ze względu na jego położenie na szlaku handlowym między Valengardem a Rendią jak i ze względu na powierzone mi zadanie . Niestety ostatnio zauważam coraz to bardziej niepokojące rzeczy , wczoraj zauważyłem dwóch ludzi obserwujących mnie ,których nigdy wcześniej nie widziałem a kilka dni temu ktoś włamał mi się do domu . Potrzebuję twojej pomocy Arkelasie bo czuje ,że wpadłem w niezłe gówno. Spotkajmy się tam gdzie czarodziejki chodzą z patelnią <br> Z poważaniem ,Nicolas "
        }
    ],
    equipment: {
        weapon: null,
        head: null,
        chest: null,
        legs: null,
        boots: null
    },
    stamina: 100,
    maxStamina: 100,
    staminaRegen: 10,
    hp: 1250,
    maxHp: 1250,
    damageMultiplier: 1.0,
    isParrying: false,
    isDodging: false,
    canAttack: true,
    attackCooldown: false,
    parryWindow: false,

    baseDamage: 40,
    baseArmor: 0,
    equippedWeapon: null,
    equippedArmor: null,

    // === SYSTEM WALKI I WACHLARZA ===
    isAttacking: false,
    attackStartTime: 0,
    attackDuration: 180,
    attackAngle: 0,
    lastAttackTime: 0,

    maxLightTargets: 2,
    maxHeavySlashTargets: 2,

    lastLightAttackTime: 0,
    lastHeavyAttackTime: 0,
    critChance: 0.05, // 15% podstawowej szansy na kryta
    critMultiplier: 1.5,
    lightAttackCooldown: 700,
    heavyAttackCooldown: 1300,
    combatStance: '1H', // Domyślnie chwyt jednoręczny
    quickSlots: [null, null, null],
    unlockedRecipes: ['potion_health'], // Domyślnie gracz zna tylko podstawową miksturę
    updateHPUI() {
        const fill = document.getElementById('hp-bar-fill');
        const text = document.getElementById('hp-text');
        if (fill) fill.style.width = `${Math.max(0, (this.hp / this.maxHp) * 100)}%`;
        if (text) text.innerText = `${Math.max(0, Math.ceil(this.hp))} / ${this.maxHp}`;
    },
    updateStaminaUI() {
        const fill = document.getElementById('stamina-bar-fill');
        const text = document.getElementById('stamina-text');
        if (fill) fill.style.width = `${Math.max(0, (this.stamina / this.maxStamina) * 100)}%`;
        if (text) text.innerText = `${Math.max(0, Math.ceil(this.stamina))} / ${this.maxStamina}`;
    },
    // ==========================================
    // UNIWERSALNY SYSTEM EFEKTÓW (BUFFY / DEBUFFY / HOT / DOT)
    // ==========================================
    addEffect(effectConfig) {
        // Przedłużenie efektu, jeśli unikalne id już istnieje
        if (effectConfig.id) {
            const existing = this.activeEffects.find(e => e.id === effectConfig.id);
            if (existing) {
                existing.remainingTime = effectConfig.duration;
                showToast(`Odświeżono efekt: ${existing.name}`);
                return;
            }
        }

        const newEffect = {
            id: effectConfig.id || `effect_${Date.now()}_${Math.random()}`,
            name: effectConfig.name || 'Efekt',
            icon: effectConfig.icon || '✨',
            type: effectConfig.type, // 'heal', 'damage_over_time', 'stat_buff'
            stat: effectConfig.stat || null, // 'damageMultiplier', 'armor', 'speed', 'baseDamage'
            value: effectConfig.value || 0,
            duration: effectConfig.duration || 1,
            remainingTime: effectConfig.duration || 1,
            ratePerSecond: (effectConfig.value || 0) / (effectConfig.duration || 1)
        };

        this.activeEffects.push(newEffect);
        showToast(`${newEffect.icon} Nałożono: ${newEffect.name}`);
    },

    toggleStance() {
        this.combatStance = this.combatStance === '1H' ? '2H' : '1H';
        showToast(`Zmieniono chwyt na: ${this.combatStance === '1H' ? 'Jednoręczny' : 'Dwuręczny'}`);
    },
    getCritStats() {
        let bonusChance = 0;
        let bonusMult = 0;

        // Statystyki z broni i pancerza
        if (this.weapon && this.weapon.critChance) bonusChance += this.weapon.critChance;
        if (this.armor && this.armor.critChance) bonusChance += this.armor.critChance;

        // Buffowanie ze skilli/efektów
        if (this.activeEffects) {
            this.activeEffects.forEach(eff => {
                if (eff.type === 'stat_buff') {
                    if (eff.stat === 'critChance') bonusChance += eff.value;
                    if (eff.stat === 'critMultiplier') bonusMult += eff.value;
                }
            });
        }

        return {
            chance: (this.critChance || 0.05) + bonusChance,
            multiplier: (this.critMultiplier || 1.5) + bonusMult
        };
    },
    useQuickSlot(slotIndex) {
        const itemId = this.quickSlots[slotIndex];
        if (!itemId) {
            if (typeof showToast === 'function') showToast("Slot jest pusty!");
            return;
        }

        const itemIndex = this.inventory.findIndex(i => i && i.id === itemId);
        if (itemIndex === -1) {
            if (typeof showToast === 'function') showToast("Brak przedmiotu w ekwipunku!");
            return;
        }

        const item = this.inventory[itemIndex];
        let used = false;

        if (item.type === 'potion' || item.type === 'food' || item.id.startsWith('potion_')) {
            const healAmount = item.heal || 30;
            if (this.hp >= (this.maxHp || 100)) {
                if (typeof showToast === 'function') showToast("Masz już pełne zdrowie!");
                return;
            }
            this.hp = Math.min(this.maxHp || 100, this.hp + healAmount);
            if (typeof showToast === 'function') showToast(`Użyto: ${item.name} (+${healAmount} HP)`);
            used = true;
        } else {
            if (typeof showToast === 'function') showToast(`Użyto: ${item.name}`);
            used = true;
        }

        if (used) {
            if (item.count && item.count > 1) {
                item.count--;
            } else {
                this.inventory.splice(itemIndex, 1);
            }
            if (typeof updateQuickSlotsHUD === 'function') updateQuickSlotsHUD();
            if (typeof updateHUD === 'function') updateHUD();
        }
    },
    unlockRecipe(recipeId) {
        if (!this.unlockedRecipes.includes(recipeId)) {
            this.unlockedRecipes.push(recipeId);
            showToast(`📜 Odblokowano nową recepturę!`);
        } else {
            showToast(`Znasz już tę recepturę.`);
        }
    },
    updateEffects(dt) {
        if (this.activeEffects.length === 0) return;

        this.activeEffects = this.activeEffects.filter(effect => {
            effect.remainingTime -= dt;

            // 1. Leczenie w czasie (HoT)
            if (effect.type === 'heal') {
                const healThisFrame = effect.ratePerSecond * dt;
                this.hp = Math.min(this.maxHp, this.hp + healThisFrame);
                this.updateHPUI();
            }
            // 2. Obrażenia w czasie (DoT - krwawienie/trucizna)
            else if (effect.type === 'damage_over_time') {
                const dmgThisFrame = effect.ratePerSecond * dt;
                this.hp = Math.max(0, this.hp - dmgThisFrame);
                this.updateHPUI();
                if (this.hp <= 0) this.handleDeath();
            }

            return effect.remainingTime > 0;
        });
    },

    // Dynamiczny odczyt obrażeń z uwzględnieniem aktywnych buffów
    getDamage(isHeavy = false) {
        // 1. Bazowe obrażenia + broń
        const weapon = this.equipment?.weapon;
        const weaponDmg = weapon ? (weapon.damage || 0) : 0;
        let totalDmg = (this.baseDamage || 30) + (weaponDmg * 1.4);

        // 2. SKALOWANIE Z POZIOMEM (np. +8% do całkowitych DMG za każdy level powyżej 1)
        const levelMultiplier = 1 + ((this.level || 1) - 1) * 0.08;
        totalDmg *= levelMultiplier;

        // 3. Mnożnik ciężkiego ataku (2H)
        if (isHeavy || this.combatStance === '2H') {
            totalDmg *= 1.8;
        }

        // 4. Efekty z potek / buffów
        let bonusMultiplier = 0;
        let bonusFlatDamage = 0;
        if (this.activeEffects) {
            this.activeEffects.forEach(eff => {
                if (eff.type === 'stat_buff') {
                    if (eff.stat === 'damageMultiplier') bonusMultiplier += eff.value;
                    if (eff.stat === 'baseDamage') bonusFlatDamage += eff.value;
                }
            });
        }

        const finalMultiplier = (this.damageMultiplier || 1.0) + bonusMultiplier;

        // 5. Rozrzut ±10%
        const variance = 0.9 + Math.random() * 0.2;

        return Math.round((totalDmg + bonusFlatDamage) * finalMultiplier * variance);
    },
    // Dynamiczny odczyt pancerza z uwzględnieniem aktywnych buffów
    getArmor() {
        let gearArmor = 0;
        if (this.equipment) {
            Object.values(this.equipment).forEach(item => {
                if (item && item.armor) gearArmor += item.armor;
            });
        }
        const levelArmor = ((this.level || 1) - 1) * 12;
        return (this.baseArmor || 0) + gearArmor + levelArmor;
    },

    getCombatStats() {
        return {
            weaponDmg: this.getDamage(false),
            totalArmor: this.getArmor()
        };
    },

    useConsumable(index) {
        const item = this.inventory[index];
        if (!item) return;

        if (item.type === 'consumable') {
            // Wsparcie dla nowych przedmiotów mających tablicę `effects`
            if (item.effects && Array.isArray(item.effects)) {
                item.effects.forEach(eff => this.addEffect(eff));
            }
            // Awaryjne wsparcie dla starszych przedmiotów (kompatybilność wsteczna)
            else {
                const recipeStats = ALCHEMY_RECIPES_DB[item.id] || {};
                const healAmount = item.heal || recipeStats.heal || 45;
                const duration = item.duration || recipeStats.duration || 15;

                this.addEffect({
                    id: item.id || 'heal_potion',
                    name: item.name || 'Mikstura Zdrowia',
                    icon: item.icon || '🍷',
                    type: 'heal',
                    value: healAmount,
                    duration: duration
                });
            }

            if (item.count && item.count > 1) {
                item.count--;
            } else {
                this.inventory.splice(index, 1);
            }

            if (typeof menuSystem !== 'undefined' && menuSystem.isOpen) {
                menuSystem.renderInventoryTab();
            }
        }
    },

    collectLoot(itemId, amount = 1) {
        if (itemId === 'gold_coins') {
            this.gold += amount;
            showToast(`+${amount} Złota`);
            return true;
        }
        const tpl = ITEMS_DB[itemId] || { name: itemId, icon: '📦', type: 'misc', weight: 1.0, stats: '' };
        return this.addItem(itemId, tpl.name, tpl.icon, tpl.type, tpl.weight, tpl.stats, amount, tpl.damage || 0, tpl.armor || 0);
    },

    attack() {
        const isHeavy = this.combatStance === '2H';
        const HEAVY_STAMINA_COST = 37; // Koszt staminy dla mocnego ciosu

        // 1. Sprawdzenie staminy wyłącznie dla ciężkiego ataku
        if (isHeavy && this.stamina < HEAVY_STAMINA_COST) {
            if (typeof showToast === 'function') showToast("Brak staminy na mocny cios!");
            return;
        }

        // 2. Cooldowny dla lekkich i ciężkich ataków
        const now = Date.now();
        if (isHeavy) {
            if (now - this.lastHeavyAttackTime < this.heavyAttackCooldown) return;
        } else {
            if (now - this.lastLightAttackTime < this.lightAttackCooldown) return;
        }

        // 3. Sprawdzenie statusu gracza i UI
        if (!this.canAttack || this.isAttacking || this.isSleeping || menuSystem.isOpen || dialogueManager.isActive) return;

        // 4. Pobieramy staminę TYLKO jeśli to heavy attack i przechodzimy do ciosu
        if (isHeavy) {
            this.stamina -= HEAVY_STAMINA_COST;
            this.lastHeavyAttackTime = now;
        } else {
            this.lastLightAttackTime = now;
        }

        // 5. Inicjalizacja ataku i animacji
        this.isAttacking = true;
        this.canAttack = false;
        this.isHeavyAttack = isHeavy;
        this.attackProgress = 0;
        this.attackStartTime = Date.now();

        const cd = isHeavy ? this.attackCooldown * 1.6 : this.attackCooldown;
        this.attackDuration = isHeavy ? 260 : 180;

        const startTime = performance.now();
        this.checkHitbox(isHeavy);

        const animInterval = requestAnimationFrame(function animate(now) {
            const elapsed = now - startTime;
            player.attackProgress = Math.min(1.0, elapsed / player.attackDuration);

            if (player.attackProgress < 1.0) {
                requestAnimationFrame(animate);
            } else {
                player.isAttacking = false;
            }
        });

        setTimeout(() => { player.canAttack = true; }, cd);
    },

    takeDamage(rawDamage) {
        const armor = typeof this.getArmor === 'function' ? this.getArmor() : (this.armor || 0);

        const reductionRatio = armor / (armor + 300);
        let finalDamage = Math.round(rawDamage * (1 - reductionRatio));

        const minDamage = Math.max(1, Math.round(rawDamage * 0.05));
        finalDamage = Math.max(minDamage, finalDamage);

        this.hp -= finalDamage;
        if (this.hp < 0) this.hp = 0;

        this.updateHPUI(); // <-- TU BYŁ BŁĄD! Teraz pasek HP od razu odpada po dostaniu strzała

        return finalDamage;
    },

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        this.updateHPUI();
        showToast(`Odzyskano +${amount} HP`);
    },

    parry() {
        if (this.isParrying) return;
        this.isParrying = true;
        this.parryWindow = true;

        setTimeout(() => { this.parryWindow = false; }, 300);
        setTimeout(() => { this.isParrying = false; }, 800);
    },

    checkHitbox(isHeavy = false) {
        const facing = this.facingAngle !== undefined ? this.facingAngle : this.angle;
        const potentialEnemies = [];

        if (typeof enemyManager !== 'undefined' && enemyManager.enemies) {
            enemyManager.enemies.forEach(enemy => {
                if (!enemy.isAlive) return;
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist <= 110) potentialEnemies.push(enemy);
            });
        }

        let attackType = 'LIGHT_SLASH';
        let attackRange = 75;
        let arcAngle = Math.PI / 1.8;
        let dmgMultiplier = 1.0;
        let maxTargets = this.maxLightTargets;
        let dmgColor = '#e74c3c';

        if (isHeavy) {
            const enemiesInZone = potentialEnemies.filter(e => isEntityInArc(this, e, 85, Math.PI / 1.8, facing));

            if (enemiesInZone.length <= 1) {
                attackType = 'THRUST';
                attackRange = 100;
                arcAngle = Math.PI / 6;
                dmgMultiplier = 1.4;
                maxTargets = 1;
                dmgColor = '#f1c40f';
            } else {
                attackType = 'SLASH';
                attackRange = 85;
                arcAngle = Math.PI / 1.4;
                dmgMultiplier = 1.15;
                maxTargets = this.maxHeavySlashTargets;
                dmgColor = '#e67e22';
            }
        }

        const hitTargets = potentialEnemies
            .filter(enemy => isEntityInArc(this, enemy, attackRange, arcAngle, facing))
            .sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y))
            .slice(0, maxTargets);

        const rawDamage = this.getDamage(false);
        hitTargets.forEach(enemy => {
            const critStats = this.getCritStats();

            // 1. Sprawdzenie 100% krytyka na powalonym przeciwniku przy użyciu Heavy Attack
            let isCrit = Math.random() < critStats.chance;
            if (isHeavy && enemy.isKnockedDown) {
                isCrit = true; // Gwarantowany krytyk na powalonym, ale wróg leży dalej aż wygaśnie timer!
            }

            const critMult = isCrit ? critStats.multiplier : 1.0;
            const enemyArmor = enemy.armor || 0;
            const baseDmg = calculateDamage(rawDamage, enemyArmor, dmgMultiplier);
            const finalDmg = Math.round(baseDmg * critMult);

            enemy.takeDamage(finalDmg, this.x, this.y);

            // 2. 10% szansy na powalenie celów przy ataku Heavy (jeśli cel jeszcze nie jest powalony)
            if (isHeavy && !enemy.isKnockedDown && Math.random() < 0.10) {
                enemy.isKnockedDown = true;
                enemy.knockDownTimer = 2.5; // Czas trwania powalenia w sekundach
                if (typeof damageNumbers !== 'undefined') {
                    damageNumbers.add(enemy.x, enemy.y - 35, '💫 POWALENIE!', '#e67e22');
                }
            }

            const prefix = isCrit ? '💥 CRIT ' : (attackType === 'THRUST' ? '🎯 ' : '');
            const color = isCrit ? '#f1c40f' : dmgColor;

            if (typeof damageNumbers !== 'undefined') {
                damageNumbers.add(enemy.x, enemy.y - 20, `${prefix}-${finalDmg}`, color);
            }
        });

        const loc = gameMap.getCurrentData();
        if (loc && loc.npcs) {
            loc.npcs.forEach(npc => {
                if (isEntityInArc(this, npc, attackRange, arcAngle, facing)) {
                    const finalDmg = calculateDamage(rawDamage, 0, dmgMultiplier);
                    damageNumbers.add(npc.x, npc.y - 15, `-${finalDmg}`, dmgColor);

                    const pushAngle = Math.atan2(npc.y - this.y, npc.x - this.x);
                    const pushForce = isHeavy ? 20 : 10;
                    npc.x += Math.cos(pushAngle) * pushForce;
                    npc.y += Math.sin(pushAngle) * pushForce;
                }
            });
        }
    },

    dodge() {
        if (this.isDodging || this.dodgeCooldown) return;

        this.isDodging = true;
        this.dodgeCooldown = true;

        const dashSpeed = 10;
        const facing = this.facingAngle !== undefined ? this.facingAngle : this.angle;

        const dashTimer = setInterval(() => {
            const nextX = this.x + Math.cos(facing) * dashSpeed;
            const nextY = this.y + Math.sin(facing) * dashSpeed;
            if (!gameMap.checkCollision(nextX, this.y, this.radius)) this.x = nextX;
            if (!gameMap.checkCollision(this.x, nextY, this.radius)) this.y = nextY;
        }, 16);

        setTimeout(() => {
            clearInterval(dashTimer);
            this.isDodging = false;
        }, 200);

        setTimeout(() => { this.dodgeCooldown = false; }, 800);
        showToast("⚡ Unik!");
    },

    handleDeath() {
        showToast("Zginąłeś! Budzisz się z połową złota...");
        this.gold = Math.floor(this.gold / 2);
        this.hp = this.maxHp;
        this.activeEffects = [];
        this.updateHPUI();

        if (typeof enemyManager !== 'undefined') enemyManager.enemies = [];
        if (typeof gameState !== 'undefined') gameState = 'EXPLORATION';

        gameMap.currentLocation = 'pokoj_gracza';
        this.x = 250;
        this.y = 180;
    },

    horse: { x: 100, y: 550, radius: 15, color: '#8e44ad', isMounted: false },

    getWeight() {
        const invWeight = this.inventory.reduce((sum, item) => sum + (item.weight || 0), 0);
        const eqWeight = Object.values(this.equipment).reduce((sum, item) => sum + (item ? item.weight || 0 : 0), 0);
        return parseFloat((invWeight + eqWeight).toFixed(1));
    },

    addItem(id, name, icon = '📦', type = 'misc', weight = 1.0, stats = '', count = 1, damage = 0, armor = 0, effects = null) {
        if (this.getWeight() + (weight * count) > this.maxWeight) {
            showToast("Jesteś zbyt obciążony!");
            return false;
        }

        const existingItem = this.inventory.find(item => item.id === id);
        if (existingItem && type === 'misc') {
            existingItem.count = (existingItem.count || 1) + count;
        } else {
            this.inventory.push({ id, name, icon, type, weight, stats, count, damage, armor, effects });
        }

        showToast(`Otrzymano: ${name} ${count > 1 ? `x${count}` : ''}`);
        return true;
    },

    hasItem(id) {
        return this.inventory.some(item => item.id === id) ||
            Object.values(this.equipment).some(item => item && item.id === id);
    },

    equipItem(itemIndex) {
        const item = this.inventory[itemIndex];
        if (!item) return;

        if (item.type === 'consumable') {
            this.useConsumable(itemIndex);
            return;
        }
        if (item.id === 'alembik') {
            this.placeAlembic(itemIndex);
            return;
        }

        if (item.type === 'quest' || item.type === 'document' || item.content) {
            // Jeśli przedmiot jest recepturą, odblokuj ją automatycznie po przeczytaniu
            if (item.unlocksRecipe) {
                this.unlockRecipe(item.unlocksRecipe);
            }
            documentViewer.open(item.name, item.content, item.monologueId, item.questTrigger);
            return;
        }

        if (!['weapon', 'head', 'chest', 'legs', 'boots'].includes(item.type)) {
            showToast("Tego przedmiotu nie można założyć.");
            return;
        }
        const slot = item.type;

        if (this.equipment[slot]) this.unequipItem(slot);

        this.equipment[slot] = item;
        this.inventory.splice(itemIndex, 1);
        showToast(`Założono: ${item.name}`);
    },

    unequipItem(slot) {
        const item = this.equipment[slot];
        if (!item) return;

        this.inventory.push(item);
        this.equipment[slot] = null;
        showToast(`Zdjęto: ${item.name}`);
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
            showToast("Zesiadłeś z konia");
        } else {
            const dx = this.x - this.horse.x;
            const dy = this.y - this.horse.y;
            if (Math.hypot(dx, dy) < 40) {
                this.isMounted = true;
                this.horse.isMounted = true;
                showToast("Dosiadłeś konia! [Shift] = Galop, [E] = Zsiądź");
            }
        }
    },
    updateControlsHint() {
        if (typeof setControlsHint !== 'function') return;

        const hints = [];
        const inCombat = typeof gameState !== 'undefined' && gameState === 'COMBAT';

        // Poruszanie
        hints.push({ action: 'Ruch', key: 'W A S D' });

        // Sterowanie koniem / Unik
        if (this.isMounted) {
            hints.push({ action: 'Galop', key: 'Shift' });
            hints.push({ action: 'Zsiądź z konia', key: 'E' });
        } else {
            hints.push({ action: 'Bieg', key: 'Shift' });

            if (inCombat) {
                // W walce zamiast konia pokazywany jest Unik
                hints.push({ action: 'Unik', key: 'Spacja' });
            } else if (typeof gameMap !== 'undefined' && gameMap.currentLocation === 'kruczy_dol' && this.horse && !this.horse.isMounted) {
                const distToHorse = Math.hypot(this.x - this.horse.x, this.y - this.horse.y);
                if (distToHorse < 40) {
                    hints.push({ action: 'Dosiądź konia', key: 'E' });
                } else {
                    hints.push({ action: 'Zawołaj konia', key: 'H' });
                }
            }
        }

        // Walka i interfejs
        hints.push({ action: 'Atak', key: 'LPM' });
        hints.push({ action: 'Zmiana chwytu', key: 'Ctrl' });

        // W walce zamiast ekwipunku pokazywane jest Parowanie
        if (inCombat) {
            hints.push({ action: 'Paruj', key: 'PPM' });
        } else {
            hints.push({ action: 'Ekwipunek', key: 'I' });
        }

        // Kesowanie przerysu w DOM
        const hintString = JSON.stringify(hints);
        if (this._lastHintCache !== hintString) {
            this._lastHintCache = hintString;
            setControlsHint(hints);
        }
    },

    // Aktualizacja z uwzględnieniem buffów prędkości oraz deltaTime (dt)
    update(keys, stateTextUI, dt = 0.016) {
        if (this.isSleeping || !this.canMove) return;

        let moveX = 0, moveY = 0;
        if (keys['w'] || keys['arrowup']) moveY -= 1;
        if (keys['s'] || keys['arrowdown']) moveY += 1;
        if (keys['a'] || keys['arrowleft']) moveX -= 1;
        if (keys['d'] || keys['arrowright']) moveX += 1;

        let currentSpeed = CONFIG.walk_speed;

        if (this.isMounted) {
            if (keys['shift']) {
                currentSpeed = CONFIG.horse_run_speed || (CONFIG.horse_speed * 1.55);
                if (stateTextUI) {
                    stateTextUI.innerText = "Na koniu (Galop [Shift])";
                    stateTextUI.style.color = "#e74c3c";
                }
            } else {
                currentSpeed = CONFIG.horse_speed;
                if (stateTextUI) {
                    stateTextUI.innerText = "Na koniu (Kłus)";
                    stateTextUI.style.color = "#9b59b6";
                }
            }
        } else if (keys['shift']) {
            currentSpeed = CONFIG.run_speed;
            if (stateTextUI) { stateTextUI.innerText = "Pieszo (Bieg)"; stateTextUI.style.color = "#e67e22"; }
        } else {
            if (stateTextUI) { stateTextUI.innerText = "Pieszo (Chód)"; stateTextUI.style.color = "#4cd137"; }
        }

        // Dodanie premii do prędkości z aktywnych efektów
        let speedMultiplier = 1.0;
        this.activeEffects.forEach(eff => {
            if (eff.type === 'stat_buff' && eff.stat === 'speed') {
                speedMultiplier += eff.value;
            }
        });
        currentSpeed *= speedMultiplier;

        if (player.horse && player.horse.isMovingToPlayer && !player.isMounted) {
            const targetX = player.x + 35;
            const targetY = player.y + 35;
            const dx = targetX - player.horse.x;
            const dy = targetY - player.horse.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 30) {
                const speed = 1.5;
                const nextX = player.horse.x + (dx / dist) * speed;
                const nextY = player.horse.y + (dy / dist) * speed;

                if (!gameMap.checkCollision(nextX, nextY, 15)) {
                    player.horse.x = nextX;
                    player.horse.y = nextY;
                } else {
                    player.horse.isMovingToPlayer = false;
                }
            } else {
                player.horse.isMovingToPlayer = false;
            }
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
        if (this.stamina < this.maxStamina) {
            this.stamina = Math.min(this.maxStamina, this.stamina + (this.staminaRegen * dt));
            this.updateStaminaUI();
        }
        // Aktualizacja stanu czasowego wszystkich efektów (dt w sekundach)
        this.updateEffects(dt);

        // Odświeżanie podpowiedzi sterowania w UI
        this.updateControlsHint();
    },
    placeAlembic(invIndex) {
        worldObjects.push(new PlacedAlembic(this.x, this.y));

        const item = this.inventory[invIndex];
        if (item.count && item.count > 1) {
            item.count--;
        } else {
            this.inventory.splice(invIndex, 1);
        }

        if (typeof menuSystem !== 'undefined' && menuSystem.isOpen) {
            menuSystem.renderInventoryTab();
        }
        showToast("Rozstawiono Alembik!");
    },

    draw(ctx) {
        if (gameMap.currentLocation === 'kruczy_dol' && !this.horse.isMounted) {
            ctx.beginPath();
            ctx.arc(this.horse.x, this.horse.y, this.horse.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.horse.color;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            const distToHorse = Math.hypot(this.x - this.horse.x, this.y - this.horse.y);
            ctx.save();
            ctx.fillStyle = distToHorse < 40 ? '#f1c40f' : '#ffffff';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(distToHorse < 40 ? 'Dosiądź konia [E]' : 'Koń', this.horse.x, this.horse.y - 22);
            ctx.restore();
        }

        if (this.isAttacking) {
            const elapsed = Date.now() - this.attackStartTime;

            if (elapsed < this.attackDuration) {
                const progress = elapsed / this.attackDuration;
                const fov = Math.PI / 1.8;
                const attackRange = this.isHeavyAttack ? 70 : 55;

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);

                const startAngle = this.attackAngle - fov / 2;
                const endAngle = this.attackAngle + fov / 2;

                ctx.arc(this.x, this.y, attackRange, startAngle, endAngle);
                ctx.closePath();

                const alpha = (1 - progress) * 0.65;
                ctx.fillStyle = this.isHeavyAttack
                    ? `rgba(230, 126, 34, ${alpha})`
                    : `rgba(241, 196, 15, ${alpha})`;
                ctx.fill();

                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha + 0.25})`;
                ctx.lineWidth = this.isHeavyAttack ? 3 : 2;
                ctx.stroke();

                ctx.restore();
            } else {
                this.isAttacking = false;
            }
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isMounted ? '#9b59b6' : this.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
};
function giveStartingEquipment(playerObj) {
    const startingItems = [
        start_items['simple_sword'],
        start_items['leather_helmet'],
        start_items['leather_chest'],
        start_items['leather_pants'],
        start_items['leather_boots']
    ];

    startingItems.forEach(item => {
        if (!item) return;

        const itemCopy = { ...item };
        const slot = itemCopy.type; // 'weapon', 'head', 'chest', 'legs', 'boots'

        // Założenie przedmiotu na odpowiedni slot gracza
        if (playerObj.equipment && slot in playerObj.equipment) {
            playerObj.equipment[slot] = itemCopy;
        }
    });
}


// Funkcja pomocnicza sumująca pancerz i obrażenia z założonych przedmiotów
function recalculatePlayerStats(player) {
    let totalArmor = 0;
    let bonusDamage = 0;

    if (player.equipment) {
        Object.values(player.equipment).forEach(item => {
            if (item) {
                if (item.armor) totalArmor += item.armor;
                if (item.damage) bonusDamage += item.damage;
            }
        });
    }

    // Przypisanie obliczonych statystyk
    player.armor = totalArmor;
    player.attackDamage = (player.baseDamage || 5) + bonusDamage;
}


function callHorse() {
    // Przywoływanie działa tylko na zewnątrz
    if (gameMap.currentLocation !== 'kruczy_dol') {
        showToast("Twój koń nie wejdzie do budynku!");
        return;
    }

    if (player.isMounted) {
        showToast("Już jedziesz na koniu!");
        return;
    }

    showToast("Gwizdasz na konia");

    // Szukamy bezpiecznego miejsca na spawn poza ekranem
    const spawnDistance = 100; // Odległość poza widokiem kamery
    let validSpawnFound = false;
    let spawnX = player.x;
    let spawnY = player.y;

    // Próbujemy do 20 losowych kątów, aż znajdziemy punkt bez kolizji
    for (let attempts = 0; attempts < 20; attempts++) {
        const randomAngle = Math.random() * Math.PI * 2;
        const testX = player.x + Math.cos(randomAngle) * spawnDistance;
        const testY = player.y + Math.sin(randomAngle) * spawnDistance;

        // Sprawdzamy czy punkt mieści się na mapie i nie koliduje z budynkami
        if (!gameMap.checkCollision(testX, testY, 15)) {
            spawnX = testX;
            spawnY = testY;
            validSpawnFound = true;
            break;
        }
    }

    // Jeśli z jakiegoś powodu całe otoczenie było zablokowane, bierzemy pozycję gracza jako awaryjną
    if (validSpawnFound) {
        player.horse.x = spawnX;
        player.horse.y = spawnY;
    }

    // Ustawiamy flagę biegu w stronę gracza
    player.horse.isMovingToPlayer = true;
}

giveStartingEquipment(player);