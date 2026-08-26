class EnemyManager {
    constructor(game) {
        this.game = game;
        this.enemies = [];
        this.maxAttackTokens = 2;
        this.activeTokenHolders = new Set();
    }
    requestAttackToken(enemy) {
        if (this.activeTokenHolders.size < this.maxAttackTokens) {
            this.activeTokenHolders.add(enemy);
            return true;
        }
        return this.activeTokenHolders.has(enemy);
    }

    releaseAttackToken(enemy) {
        this.activeTokenHolders.delete(enemy);
    }
    // Uniwersalna metoda do spawnowania wrogów (questy, zdarzenia, obozy)
    spawnGroup({ type, count, centerX, centerY, spawnRadius = 150, aggroRadius = 300 }) {
        const spawnedEnemies = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * spawnRadius;
            const x = centerX + Math.cos(angle) * dist;
            const y = centerY + Math.sin(angle) * dist;

            const enemy = new Enemy({
                id: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                type: type,
                x: x,
                y: y,
                aggroRadius: aggroRadius,
                homeX: x,
                homeY: y
            });

            this.enemies.push(enemy);
            spawnedEnemies.push(enemy);
        }
        return spawnedEnemies;
    }

    // Generowanie watahy wilków w lesie w przedziale 800-1100px od gracza
    spawnForestPackAroundPlayer(playerX, playerY) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 800 + Math.random() * 300; // 800px - 1100px
        const packX = playerX + Math.cos(angle) * distance;
        const packY = playerY + Math.sin(angle) * distance;
        const packSize = Math.floor(Math.random() * 3) + 4; // Losowo 4, 5 lub 6

        return this.spawnGroup({
            type: 'wolf',
            count: packSize,
            centerX: packX,
            centerY: packY,
            spawnRadius: 180,
            aggroRadius: 320
        });
    }
    checkPlayerAttack(player) {
        if (!player.isAttacking) return;

        const playerDmg = player.getDamage ? player.getDamage() : player.baseDamage;
        const facing = player.facingAngle !== undefined ? player.facingAngle : player.angle;

        const candidates = [];

        // 1. Szukamy wszystkich w zasięgu ciosu
        this.enemies.forEach(enemy => {
            if (!enemy.isAlive) return;

            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.hypot(dx, dy);

            let angleDiff = Math.atan2(dy, dx) - facing;
            angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

            if (dist <= 75 && Math.abs(angleDiff) <= Math.PI / 3) {
                candidates.push({ enemy, dist });
            }
        });

        // 2. Sortujemy od najbliższego i wycinamy MAX 2 osoby!
        candidates.sort((a, b) => a.dist - b.dist);
        const targets = candidates.slice(0, 2);

        targets.forEach(item => {
            item.enemy.takeDamage(playerDmg, player.x, player.y);
        });
    }
    update(deltaTime, player) {
        // 1. Fizyka separacji – wrogowie odpychają się od siebie i nie nakładają
        for (let i = 0; i < this.enemies.length; i++) {
            for (let j = i + 1; j < this.enemies.length; j++) {
                const e1 = this.enemies[i];
                const e2 = this.enemies[j];
                if (!e1.isAlive || !e2.isAlive) continue;

                const dx = e2.x - e1.x;
                const dy = e2.y - e1.y;
                const dist = Math.hypot(dx, dy);
                const minDist = (e1.radius + e2.radius) * 1.3; // Dystans bezpieczny

                if (dist < minDist && dist > 0) {
                    const overlap = (minDist - dist) / 2;
                    const pushX = (dx / dist) * overlap;
                    const pushY = (dy / dist) * overlap;
                    e1.x -= pushX;
                    e1.y -= pushY;
                    e2.x += pushX;
                    e2.y += pushY;
                }
            }
        }

        const activePack = this.enemies.filter(e => e.state === 'CHASE' || e.state === 'ATTACK' || e.state === 'CIRCLE');

        // --- PRZYWRÓCONA LOGIKA AI DLA KAŻDEGO WROGA ---
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime, player, activePack, this.allies); // przekazujesz tablicę sojuszników
        });

        // Despawn martwych lub zignorowanych wrogów (dystans > 1800px)
        this.enemies = this.enemies.filter(enemy => {
            const distToPlayer = Math.hypot(enemy.x - player.x, enemy.y - player.y);
            return enemy.isAlive && distToPlayer < 1800;
        });
    }
    draw(ctx) {
        this.enemies.forEach(enemy => enemy.draw(ctx));
    }

}
class Enemy {
    constructor(config = {}) {
        const type = config.type || 'zbir_lekki';
        const baseConfig = ENEMY_CONFIG[type] || ENEMY_CONFIG.zbir_lekki;
        this.baseConfig = baseConfig;

        this.id = config.id || `enemy_${Date.now()}`;
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.type = type;
        this.name = baseConfig.name;

        // Statystyki z ENEMY_CONFIG
        this.maxHp = baseConfig.maxHp || 100;
        this.hp = this.maxHp;
        this.speed = baseConfig.speed || 1.0;
        this.damage = baseConfig.damage || 10;
        this.radius = baseConfig.radius || 14;
        this.color = baseConfig.color || '#e74c3c';
        this.attackWindup = 0;
        // Zasięgi zachowania AI
        this.aggroRadius = config.aggroRadius || 250;
        this.deaggroRadius = config.deaggroRadius || 450;
        this.attackRadius = baseConfig.attackRange || 40;
        this.attackCooldown = 0;

        // Stan i pozycje domowe
        this.homeX = config.homeX || this.x;
        this.homeY = config.homeY || this.y;
        this.state = 'IDLE';
        this.isAlive = true;
        this.hitStun = 0;
    }

    // Podmień całą metodę update() w klasie Enemy:
update(dt, player, activePack, allies = [], manager = null) {
    if (!this.isAlive) return;

    // Pobieramy instancję EnemyManager (z argumentu lub z zakresu globalnego)
    const em = manager || (typeof enemyManager !== 'undefined' ? enemyManager : null);

    // 1. Szukamy najbliższego celu (gracz lub sojusznik)
    const validTargets = [player, ...allies.filter(a => a && a.isAlive)];
    let target = player;
    let distToTarget = Infinity;

    validTargets.forEach(t => {
        const d = Math.hypot(t.x - this.x, t.y - this.y);
        if (d < distToTarget) {
            distToTarget = d;
            target = t;
        }
    });

    // 2. Obsługa timerów
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.hitStun > 0) this.hitStun -= dt;

    // 3. Maszyna stanów AI
    switch (this.state) {
        case 'IDLE':
            if (distToTarget <= this.aggroRadius) {
                this.state = 'CHASE';
            }
            break;

        case 'CHASE':
            if (distToTarget > this.deaggroRadius) {
                if (em) em.releaseAttackToken(this);
                this.state = 'RETURNING';
                break;
            }

            // Gdy wróg dopadnie cel, sprawdza czy ma token na cios
            if (distToTarget <= this.attackRadius) {
                const hasToken = em ? em.requestAttackToken(this) : true;

                if (hasToken && this.attackCooldown <= 0) {
                    this.state = 'ATTACK';
                    this.attackWindup = 0;
                } else {
                    // Brak tokena lub cooldown -> przechodzi w krążenie
                    this.state = 'CIRCLE';
                }
            } else {
                this.moveTowards(target.x, target.y, dt, 1.0); // Pełna prędkość dobiegu
            }
            break;

        case 'CIRCLE':
            if (distToTarget > this.deaggroRadius) {
                if (em) em.releaseAttackToken(this);
                this.state = 'RETURNING';
                break;
            }

            // Utrzymywanie bezpiecznego dystansu ~140px i krążenie
            const preferredDist = Math.max(130, this.attackRadius + 70);
            const angle = Math.atan2(this.y - target.y, this.x - target.x);
            let targetX, targetY;

            if (distToTarget < preferredDist - 20) {
                // Za blisko gracza -> powolny odskok w tył
                targetX = target.x + Math.cos(angle) * preferredDist;
                targetY = target.y + Math.sin(angle) * preferredDist;
            } else {
                // Płynne krążenie wokół celu (kąt + offset)
                const orbitAngle = angle + 0.5;
                targetX = target.x + Math.cos(orbitAngle) * preferredDist;
                targetY = target.y + Math.sin(orbitAngle) * preferredDist;
            }

            // Ruch z prędkością zredukowaną do 65% (pasywny tryb)
            this.moveTowards(targetX, targetY, dt, 0.65);

            // Jeśli minął cooldown i zwolnił się token -> ruszaj do ataku!
            if (this.attackCooldown <= 0 && em && em.requestAttackToken(this)) {
                this.state = 'CHASE';
            }
            break;

        case 'ATTACK':
            this.attackWindup += dt;

            if (this.attackWindup >= 0.4) {
                const isTargetDodging = target.isInvulnerable || target.isDodging;
                if (distToTarget <= this.attackRadius + 15 && !isTargetDodging) {
                    if (typeof target.takeDamage === 'function') {
                        target.takeDamage(this.damage);
                    }
                }
                this.attackCooldown = this.baseConfig?.attackCooldown || 3.0;
                this.attackWindup = 0;

                // PO ATAKU: Koniecznie oddaj token i przejdź w krążenie!
                if (em) em.releaseAttackToken(this);
                this.state = 'CIRCLE';
            }
            break;

        case 'RETURNING':
            if (em) em.releaseAttackToken(this);
            this.moveTowards(this.homeX, this.homeY, dt, 1.0);
            if (Math.hypot(this.homeX - this.x, this.homeY - this.y) < 15) {
                this.state = 'IDLE';
            }
            break;
    }
}

// Zaktualizuj też metodę moveTowards w klasie Enemy (dopisany parametr speedMultiplier):
moveTowards(tx, ty, dt, speedMultiplier = 1.0) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
        const currentSpeed = this.speed * speedMultiplier;
        this.x += (dx / dist) * currentSpeed * dt;
        this.y += (dy / dist) * currentSpeed * dt;
    }
}
    takeDamage(amount, sourceX, sourceY) {
        if (!this.isAlive || this.hitStun > 0) return;

        this.hp -= amount;
        this.hitStun = 0.2;
        this.state = 'CHASE';

        const angle = Math.atan2(this.y - sourceY, this.x - sourceX);
        const knockbackDistance = 8;
        this.x += Math.cos(angle) * knockbackDistance;
        this.y += Math.sin(angle) * knockbackDistance;

        if (this.hp <= 0) {
            this.hp = 0;
            this.isAlive = false;
            this.onDeath();
        }
    }
    onDeath(lootManager) {
        const lootTable = {
            wolf: [
                { id: 'wolf_pelt', name: 'Skóra wilka', value: 15, chance: 0.8 },
                { id: 'wolf_tooth', name: 'Kieł wilka', value: 8, chance: 0.5 }
            ],
            bandit: [
                { id: 'gold_coins', name: 'Mieszko monet', value: 25, chance: 0.9 },
                { id: 'bread', name: 'Chleb', value: 5, chance: 0.4 }
            ]
        };

        const possibleLoot = lootTable[this.type] || [];
        possibleLoot.forEach(drop => {
            if (Math.random() <= drop.chance) {
                lootManager.spawnLoot(this.x, this.y, drop);
            }
        });
    }
    draw(ctx) {
        if (!this.isAlive) return;

        if (this.state === 'ATTACK') {
            const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
            const arcAngle = Math.PI / 2.2;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.arc(
                this.x,
                this.y,
                this.attackRadius,
                angleToPlayer - arcAngle / 2,
                angleToPlayer + arcAngle / 2
            );
            ctx.closePath();

            ctx.fillStyle = 'rgba(231, 76, 60, 0.40)';
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        // 2. Ciało wroga (białe błyśnięcie przy otrzymaniu obrażeń)
        ctx.fillStyle = this.hitStun > 0 ? '#ffffff' : (this.type === 'wolf' ? '#7f8c8d' : this.color);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 3. Pasek HP (widoczny w walce lub gdy wróg jest ranny)
        if (this.hp < this.maxHp || this.state !== 'IDLE') {
            const barWidth = 46;
            const barHeight = 6;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.radius - 14;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            const hpRatio = Math.max(0, this.hp / this.maxHp);
            ctx.fillStyle = hpRatio > 0.3 ? '#2ecc71' : '#e74c3c';
            ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(barX, barY, barWidth, barHeight);

            // Wyświetlanie dokładnej liczby HP
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.ceil(this.hp)} / ${this.maxHp}`, this.x, barY - 3);
        }
    }

}
// ==========================================
// SYSTEM LOOTU (LootItem + LootManager)
// ==========================================
class LootItem {
    constructor(x, y, itemData) {
        // Losowy niewielki rozrzut przedmiotu przy upuszczeniu
        this.x = x + (Math.random() * 20 - 10);
        this.y = y + (Math.random() * 20 - 10);
        this.item = itemData;
        this.pickupRadius = 35;
        this.isPickedUp = false;
    }

    update(player) {
        if (this.isPickedUp) return;

        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist <= this.pickupRadius) {
            // Naprawiony wydatek: używamy metody player.addItem zamiast nieistniejącej player.inventory.addItem
            const added = player.addItem(
                this.item.id,
                this.item.name,
                this.item.icon || '📦',
                this.item.type || 'misc',
                this.item.weight || 0.1,
                this.item.stats || '',
                1,
                this.item.damage || 0,
                this.item.armor || 0
            );

            if (added) {
                this.isPickedUp = true;
            }
        }
    }

    draw(ctx) {
        if (this.isPickedUp) return;

        // Lekka poświata na ziemi
        ctx.fillStyle = 'rgba(241, 196, 15, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Punkt/Ikona podniesienia
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

class LootManager {
    constructor() {
        this.items = [];
    }

    spawnLoot(x, y, itemData) {
        this.items.push(new LootItem(x, y, itemData));
    }

    update(player) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const loot = this.items[i];
            loot.update(player);
            if (loot.isPickedUp) {
                this.items.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        this.items.forEach(loot => loot.draw(ctx));
    }
}

//Zaczecie walki
function startBattle(config) {
    gameState = 'COMBAT';

    // Spawnowanie wrogów wokół aktualnej pozycji gracza
    enemyManager.spawnGroup({
        type: config.type || 'zbir_lekki',
        count: config.count || 3,
        centerX: player.x,
        centerY: player.y,
        spawnRadius: 150,
        aggroRadius: 400
    });

    if (typeof uiManager !== 'undefined' && uiManager.showCombatUI) {
        uiManager.showCombatUI();
    }
}

function updateCombat() {
    if (gameState !== 'COMBAT') return;

    // Sprawdzamy czy wszyscy wrogowie leżą
    if (enemyManager.allEnemiesDead()) {
        gameState = 'EXPLORATION';      // Wracamy do normalnej gry
        uiManager.hideCombatUI();
        showToast("Zwycięstwo!");
        questManager.updateQuest('kill_bandits'); // Przy okazji zaliczamy questa!
    }
}
