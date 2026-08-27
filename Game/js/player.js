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
            stats: 'Kliknij 2krotnie aby przeczytać',
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
    hp: 100,
    maxHp: 100,
    damageMultiplier: 1.0,
    isParrying: false,
    isDodging: false,
    canAttack: true,
    attackCooldown: false,
    parryWindow: false,


    baseDamage: 10,
    baseArmor: 0,
    equippedWeapon: null, // Założona broń
    equippedArmor: null,
    // === SYSTEM WALKI I WACHLARZA ===
    isAttacking: false,
    attackStartTime: 0,
    attackDuration: 180, // czas trwania animacji wachlarza w ms
    attackAngle: 0,
    attackCooldown: 500, // cooldown między atakami w ms
    lastAttackTime: 0,    // Cooldown między atakami (ms)

    maxLightTargets: 2,
    maxHeavySlashTargets: 2,

    lastLightAttackTime: 0,
    lastHeavyAttackTime: 0,

    lightAttackCooldown: 400,   // Cooldown szybkiego ataku w ms (np. 0.4 s)
    heavyAttackCooldown: 2000,
    updateHPUI() {
        const fill = document.getElementById('hp-bar-fill');
        const text = document.getElementById('hp-text');
        if (fill) fill.style.width = `${Math.max(0, (this.hp / this.maxHp) * 100)}%`;
        if (text) text.innerText = `${Math.max(0, this.hp)} / ${this.maxHp}`;
    },

    // Dynamiczny odczyt pancerza i ataku
    getCombatStats() {
        let weaponDmg = 5; // Domyślne obrażenia bez broni
        let totalArmor = 0;

        if (this.equipment?.weapon?.damage) {
            weaponDmg = this.equipment.weapon.damage;
        }

        if (this.equipment) {
            Object.values(this.equipment).forEach(item => {
                if (item && item.armor) totalArmor += item.armor;
            });
        }

        return { weaponDmg, totalArmor };
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
    getDamage(isHeavy = false) {
        const weapon = this.equipment.weapon;
        if (!weapon) {
            return isHeavy ? Math.round(this.baseDamage * 1.8) : this.baseDamage;
        }

        const weaponDmg = isHeavy
            ? (weapon.heavyDamage || Math.round((weapon.damage || 0) * 1.6))
            : (weapon.lightDamage || weapon.damage || 0);

        return this.baseDamage + weaponDmg;
    },
    getArmor() {
        let totalArmor = this.baseArmor;
        const slots = ['head', 'chest', 'legs', 'boots'];
        slots.forEach(slot => {
            if (this.equipment[slot] && this.equipment[slot].armor) {
                totalArmor += this.equipment[slot].armor;
            }
        });
        return totalArmor;
    },
    // Wyprowadzenie ataku
    attack(isHeavy) {
        const now = Date.now();

        // 1. Sprawdzamy cooldown odpowiedniego ataku
        if (isHeavy) {
            if (now - this.lastHeavyAttackTime < this.heavyAttackCooldown) {
                console.log("Ciężki atak jeszcze się odnawia!");
                return;
            }
            this.lastHeavyAttackTime = now;
        } else {
            if (now - this.lastLightAttackTime < this.lightAttackCooldown) {
                console.log("Szybki atak jeszcze się odnawia!");
                return;
            }
            this.lastLightAttackTime = now;
        }

        // 2. Sprawdzamy czy gracz może zaatakować
        if (!this.canAttack || this.isAttacking || this.isSleeping || menuSystem.isOpen || dialogueManager.isActive) {
            return;
        }

        // 3. Wspólna logika uruchamiająca atak dla OBU typów (lekkiego i ciężkiego)
        this.isAttacking = true;
        this.canAttack = false;
        this.isHeavyAttack = isHeavy;
        this.attackProgress = 0;
        this.attackStartTime = Date.now();

        const cd = isHeavy ? this.attackCooldown * 1.6 : this.attackCooldown;
        this.attackDuration = isHeavy ? 260 : 180;

        const startTime = performance.now();

        // Sprawdzenie trafień
        this.checkHitbox(isHeavy);

        // Animacja zamachu
        const animInterval = requestAnimationFrame(function animate(now) {
            const elapsed = now - startTime;
            player.attackProgress = Math.min(1.0, elapsed / player.attackDuration);

            if (player.attackProgress < 1.0) {
                requestAnimationFrame(animate);
            } else {
                player.isAttacking = false;
            }
        });

        setTimeout(() => {
            player.canAttack = true;
        }, cd);
    },
    takeDamage(amount) {
        if (this.isDodging) return; // Niewrażliwość w trakcie dasha/uniku

        if (this.isParrying && this.parryWindow) {
            showToast("⚔️ Sparowano atak!");
            return;
        }

        // Skalowalne obliczenie obrażeń z uwzględnieniem założonego pancerza
        const playerArmor = this.getArmor();
        const actualDamage = calculateDamage(amount, playerArmor, 1.0);

        this.hp = Math.max(0, this.hp - actualDamage);
        showToast(`Otrzymałeś -${actualDamage} HP!`);
        this.updateHPUI();

        if (this.hp <= 0) {
            this.handleDeath();
        }
    },

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        this.updateHPUI();
        showToast(`Odzyskano +${amount} HP`);
    },
    // Parowanie (PPM)
    parry() {
        if (this.isParrying) return;
        this.isParrying = true;
        this.parryWindow = true;

        // Okienko sparowania trwa 300ms
        setTimeout(() => { this.parryWindow = false; }, 300);
        setTimeout(() => { this.isParrying = false; }, 800);
    },
    checkHitbox(isHeavy = false) {
        const facing = this.facingAngle !== undefined ? this.facingAngle : this.angle;
        const potentialEnemies = [];

        // 1. Zbiór żywych wrogów w obszarze bliskim gracza
        if (typeof enemyManager !== 'undefined' && enemyManager.enemies) {
            enemyManager.enemies.forEach(enemy => {
                if (!enemy.isAlive) return;
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist <= 110) potentialEnemies.push(enemy);
            });
        }

        let attackType = 'LIGHT_SLASH';
        let attackRange = 75;
        let arcAngle = Math.PI / 1.8; // ~100 stopni
        let dmgMultiplier = 1.0;
        let maxTargets = this.maxLightTargets;
        let dmgColor = '#e74c3c';

        if (isHeavy) {
            const enemiesInZone = potentialEnemies.filter(e =>
                isEntityInArc(this, e, 85, Math.PI / 1.8, facing)
            );

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

        // 2. Filtrowanie trafionych celów i sortowanie od najbliższego
        const hitTargets = potentialEnemies
            .filter(enemy => isEntityInArc(this, enemy, attackRange, arcAngle, facing))
            .sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y))
            .slice(0, maxTargets); // Twardy limit trafień

        // 3. Zadawanie skalowalnych obrażeń z uwzględnieniem Pancerza celu
        const rawDamage = this.getDamage(false);
        hitTargets.forEach(enemy => {
            const enemyArmor = enemy.armor || 0;
            const finalDmg = calculateDamage(rawDamage, enemyArmor, dmgMultiplier);

            enemy.takeDamage(finalDmg, this.x, this.y);

            const prefix = attackType === 'THRUST' ? '🎯 ' : (attackType === 'SLASH' ? '💥 ' : '');
            damageNumbers.add(enemy.x, enemy.y - 15, `${prefix}-${finalDmg}`, dmgColor);
        });

        // 4. Obsługa NPC (opcjonalna neutralna walka)
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
    // Unik (Alt) - I-frame niewrażliwości
    dodge() {
        if (this.isDodging || this.dodgeCooldown) return;

        this.isDodging = true;
        this.dodgeCooldown = true;

        // Impuls w stronę, w którą patrzy gracz
        const dashSpeed = 10;
        const facing = this.facingAngle !== undefined ? this.facingAngle : this.angle;

        const dashTimer = setInterval(() => {
            const nextX = this.x + Math.cos(facing) * dashSpeed;
            const nextY = this.y + Math.sin(facing) * dashSpeed;
            if (!gameMap.checkCollision(nextX, this.y, this.radius)) this.x = nextX;
            if (!gameMap.checkCollision(this.x, nextY, this.radius)) this.y = nextY;
        }, 16);

        // Koniec niewrażliwości i dasha po 200ms
        setTimeout(() => {
            clearInterval(dashTimer);
            this.isDodging = false;
        }, 200);

        // Cooldown na ponowny unik (800ms)
        setTimeout(() => {
            this.dodgeCooldown = false;
        }, 800);

        showToast("⚡ Unik!");
    },
    handleDeath() {
        showToast("Zginąłeś! Budzisz się z połową złota...");
        this.gold = Math.floor(this.gold / 2);
        this.hp = this.maxHp;
        this.updateHPUI();

        // Czyszczenie wrogów po śmierci
        if (typeof enemyManager !== 'undefined') enemyManager.enemies = [];
        if (typeof gameState !== 'undefined') gameState = 'EXPLORATION';

        // Przeniesienie do karczmy
        gameMap.currentLocation = 'pokoj_gracza'; // Nazwa lokacji/mapy
        this.x = 250; // Pozycja X
        this.y = 180;
    },
    horse: { x: 100, y: 550, radius: 15, color: '#8e44ad', isMounted: false },

    getWeight() {
        const invWeight = this.inventory.reduce((sum, item) => sum + (item.weight || 0), 0);
        const eqWeight = Object.values(this.equipment).reduce((sum, item) => sum + (item ? item.weight || 0 : 0), 0);
        return parseFloat((invWeight + eqWeight).toFixed(1));
    },

    addItem(id, name, icon = '📦', type = 'misc', weight = 1.0, stats = '', count = 1, damage = 0, armor = 0) {
        if (this.getWeight() + (weight * count) > this.maxWeight) {
            showToast("Jesteś zbyt obciążony!");
            return false;
        }

        const existingItem = this.inventory.find(item => item.id === id);
        if (existingItem && type === 'misc') {
            existingItem.count = (existingItem.count || 1) + count;
        } else {
            this.inventory.push({ id, name, icon, type, weight, stats, count, damage, armor });
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

        if (item.type === 'quest' || item.type === 'document' || item.content) {
            documentViewer.open(item.name, item.content, item.monologueId, item.questTrigger);
            return;
        }
        // Sprawdzamy, czy przedmiot można założyć
        if (!item || !['weapon', 'head', 'chest', 'legs', 'boots'].includes(item.type)) {
            showToast("Tego przedmiotu nie można założyć.");
            return;
        }

        const slot = item.type;

        // Jeśli slot jest zajęty, zamień przedmioty
        if (this.equipment[slot]) {
            this.unequipItem(slot);
        }

        // Przenieś z plecaka do slotu sprzętu
        this.equipment[slot] = item;
        this.inventory.splice(itemIndex, 1);

        showToast(`Założono: ${item.name}`);
    },

    unequipItem(slot) {
        const item = this.equipment[slot];
        if (!item) return;

        // Dodanie do ekwipunku
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
        if (this.isSleeping || !this.canMove) return;

        let moveX = 0, moveY = 0;
        if (keys['w'] || keys['arrowup']) moveY -= 1;
        if (keys['s'] || keys['arrowdown']) moveY += 1;
        if (keys['a'] || keys['arrowleft']) moveX -= 1;
        if (keys['d'] || keys['arrowright']) moveX += 1;

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
        // Rysowanie konia (gdy gracz nie jedzie)
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

        // --- WACHLARZ ATAKU (POJAWIA SIĘ TYLKO PODCZAS KLIKNIĘCIA LPM) ---
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

        // Rysowanie postaci gracza
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isMounted ? '#9b59b6' : this.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}