class EnemyManager {
    constructor(game) {
        this.game = game;
        this.enemies = [];
        this.maxAttackTokens = 2;
        this.activeTokenHolders = new Set();
    }
    requestAttackToken(enemy, distToTarget) {
        if (this.activeTokenHolders.has(enemy)) return true;

        // 1. Dostępne wolne sloty
        if (this.activeTokenHolders.size < this.maxAttackTokens) {
            this.activeTokenHolders.add(enemy);
            enemy.tokenTimer = 0;
            return true;
        }

        // 2. KRADZIEŻ: Jeśli wróg jest tuż przy graczu, zabiera token komuś z daleka
        if (distToTarget <= enemy.attackRadius) {
            for (let holder of this.activeTokenHolders) {
                const holderDist = Math.hypot(holder.targetDist || 999);
                // Jeśli trzymający token jest dalej niż 100px, trać token na rzecz bliższego!
                if (holderDist > 100) {
                    this.activeTokenHolders.delete(holder);
                    this.activeTokenHolders.add(enemy);
                    enemy.tokenTimer = 0;
                    return true;
                }
            }
        }

        return false;
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
        this.activeTokenHolders.forEach(enemy => {
            enemy.tokenTimer = (enemy.tokenTimer || 0) + deltaTime;

            // Wygaśnięcie tokena po 1.5s lub gdy wróg stracił cel / zginął
            if (enemy.tokenTimer > 1.5 || !enemy.isAlive || enemy.state === 'IDLE' || enemy.state === 'RETURNING') {
                this.activeTokenHolders.delete(enemy);
            }
        });
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
            enemy.update(deltaTime, player, activePack, this.allies || [], this); // przekazujesz tablicę sojuszników
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
        this.lootTable = LOOT_TABLES[type] || [];

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
                    this.targetDist = distToTarget; // Zapisujemy aktualny dystans
                    const hasToken = em ? em.requestAttackToken(this, distToTarget) : true;

                    if (hasToken && this.attackCooldown <= 0) {
                        this.state = 'ATTACK';
                        this.attackWindup = 0;
                    } else {
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

                // Pierścień oczekiwania: bezpieczna strefa 100px - 140px
                const minDist = 100;
                const maxDist = 140;

                if (distToTarget < minDist) {
                    // Za blisko gracza -> powolny krok w tył
                    const angle = Math.atan2(this.y - target.y, this.x - target.x);
                    const targetX = target.x + Math.cos(angle) * minDist;
                    const targetY = target.y + Math.sin(angle) * minDist;
                    this.moveTowards(targetX, targetY, dt, 0.4);
                } else if (distToTarget > maxDist) {
                    // Za daleko od pierścienia -> podbiegnij bliżej
                    this.moveTowards(target.x, target.y, dt, 0.7);
                }
                // Jeśli jest w przedziale 100-140px -> stoi w miejscu i czeka (fizyka sama go rozstawi)

                // Cooldown minął -> wraca do szarży po token
                if (this.attackCooldown <= 0) {
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
        if (this.hp - damageAmount <= 0 && this.config.nonLethal) {
            this.hp = 1;
            this.status = 'unconscious';
            this.isAggressive = false;
            this.canAttack = false;
        } else {
            this.hp -= damageAmount;
            if (this.hp <= 0) this.isDead = true;
        }
    }
    onDeath(lootManager) {
        this.dropLoot();
    }
    dropLoot() {
        if (!this.lootTable) return;
        const bagItems = [];
        let bagGold = 0;

        this.lootTable.forEach(drop => {
            if (Math.random() <= drop.chance) {
                const count = Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min;
                if (drop.id === 'gold_coins') {
                    bagGold += count;
                } else {
                    const tpl = ITEMS_DB[drop.id] || { name: drop.id, icon: '📦', type: 'misc', weight: 1.0, stats: '' };
                    bagItems.push({ ...tpl, id: drop.id, count });
                }
            }
        });

        if (bagItems.length > 0 || bagGold > 0) {
            LootManager.spawnBag(this.x, this.y, bagItems, bagGold);
        }
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
class LootBag {
    constructor(id, x, y, items = [], gold = 0) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.items = items;
        this.gold = gold;
    }

    isEmpty() {
        return this.items.length === 0 && this.gold <= 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#8b5a2b';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎒', this.x, this.y);

        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist < 45) {
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('Przeszukaj sakwę [E]', this.x, this.y - 16);
        }
        ctx.restore();
    }
}

class LootManager {
    static bags = [];

    static spawnBag(x, y, items, gold) {
        const id = `bag_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const offset = { x: (Math.random() - 0.5) * 15, y: (Math.random() - 0.5) * 15 };
        this.bags.push(new LootBag(id, x + offset.x, y + offset.y, items, gold));
    }

    static draw(ctx) {
        this.bags.forEach(bag => bag.draw(ctx));
    }

    static getNearBag(player) {
        return this.bags.find(bag => Math.hypot(player.x - bag.x, player.y - bag.y) < 45);
    }

    static removeBag(bag) {
        this.bags = this.bags.filter(b => b !== bag);
    }

    static update(player, keys) {
        this.bags = this.bags.filter(bag => !bag.isEmpty());
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
