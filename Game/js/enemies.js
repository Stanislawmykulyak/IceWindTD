class EnemyManager {
    constructor(game) {
        this.game = game;
        this.enemies = [];
        this.maxAttackTokens = 2;
        this.activeTokenHolders = new Set();
    }

    requestAttackToken(enemy, distToTarget) {
        enemy.targetDist = distToTarget;
        if (this.activeTokenHolders.has(enemy)) return true;

        // 1. Dostępne wolne sloty
        if (this.activeTokenHolders.size < this.maxAttackTokens) {
            this.activeTokenHolders.add(enemy);
            enemy.tokenTimer = 0;
            return true;
        }

        // 2. KRADZIEŻ: Jeśli wróg jest tuż przy graczu, zabiera token komuś z daleka
        if (distToTarget <= enemy.attackRadius + 10) {
            for (let holder of this.activeTokenHolders) {
                // Naprawiono odczyt dystansu trzymającego token
                const holderDist = holder.targetDist || 999;
                if (holderDist > 90) {
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

    spawnForestPackAroundPlayer(playerX, playerY) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 800 + Math.random() * 300;
        const packX = playerX + Math.cos(angle) * distance;
        const packY = playerY + Math.sin(angle) * distance;
        const packSize = Math.floor(Math.random() * 3) + 4;

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
        if (!player.isAttacking || player.hasDealtDamage) return;
        const playerDmg = player.getDamage ? player.getDamage() : player.baseDamage;
        const facing = player.facingAngle !== undefined ? player.facingAngle : player.angle;

        const candidates = [];

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

        candidates.sort((a, b) => a.dist - b.dist);
        const targets = candidates.slice(0, 2);

        targets.forEach(item => {
            const critStats = player.getCritStats ? player.getCritStats() : { chance: 0, multiplier: 1 };
            const isCrit = Math.random() < critStats.chance;
            const finalDmg = Math.round(playerDmg * (isCrit ? critStats.multiplier : 1.0));

            item.enemy.takeDamage(finalDmg, player.x, player.y);
        });
        if (targets.length > 0) {
            player.hasDealtDamage = true; // Oznacz jako wykonany atak
        }
    }

    update(deltaTime, player) {
        this.activeTokenHolders.forEach(enemy => {
            enemy.tokenTimer = (enemy.tokenTimer || 0) + deltaTime;

            if (enemy.tokenTimer > 1.8 || !enemy.isAlive || enemy.state === 'IDLE' || enemy.state === 'RETURNING') {
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
                const minDist = (e1.radius + e2.radius) * 1.3;

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

        this.enemies.forEach(enemy => {
            enemy.update(deltaTime, player, activePack, this.allies || [], this);
        });

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
        const baseConfig = (typeof ENEMY_CONFIG !== 'undefined' && ENEMY_CONFIG[type]) ? ENEMY_CONFIG[type] : {};
        this.baseConfig = baseConfig;
        this.weaponId = baseConfig.weaponId || config.weaponId || 'simple_sword';
        this.equipment = baseConfig.equipment ? { ...baseConfig.equipment } : (config.equipment || {});
        this.weaponDropChance = baseConfig.weaponDropChance || 0.15; // 15% szans na drop broni domyslnie
        this.armorDropChance = baseConfig.armorDropChance || 0.10;
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.type = type;
        this.name = config.name || baseConfig.name || 'Przeciwnik';
        this.lootTable = (typeof LOOT_TABLES !== 'undefined' && LOOT_TABLES[type]) ? LOOT_TABLES[type] : [];

        this.orbitDir = Math.random() < 0.5 ? 1 : -1; // Losowy kierunek krążenia (lewo/prawo)
        this.windupTimer = 0;
        this.retreatTimer = 0;
        this.maxHp = baseConfig.maxHp || 100;
        this.hp = this.maxHp;
        this.speed = baseConfig.speed || 1.1;
        this.baseDamage = baseConfig.damage || 10;
        this.radius = baseConfig.radius || 14;
        this.color = baseConfig.color || '#e74c3c';
        this.attackWindup = 0;
        this.hasDealtDamage = false;
        this.isBoss = !!baseConfig.isBoss || type === 'ruin_guardian';
        this.battleActive = false;
        this.pursuitTimer = 0;
        this.respawnTimer = 0;
        this.shieldTimer = 0;
        this.lastBossAction = 0;

        this.aggroRadius = config.aggroRadius || 250;
        this.deaggroRadius = config.deaggroRadius || 450;
        this.attackRadius = baseConfig.attackRange || 40;
        this.attackCooldown = 0;
        this.targetDist = 999;

        this.homeX = config.homeX || this.x;
        this.homeY = config.homeY || this.y;
        this.state = 'IDLE';
        this.isAlive = true;
        this.hitStun = 0;
        this.isKnockedDown = false;
        this.knockDownTimer = 0;
    }
    getDamage() {
        // Pobieramy dane broni z ITEMS_DB lub start_items
        const weaponTpl = (typeof ITEMS_DB !== 'undefined' && ITEMS_DB[this.weaponId])
            ? ITEMS_DB[this.weaponId]
            : ((typeof start_items !== 'undefined' && start_items[this.weaponId]) ? start_items[this.weaponId] : null);

        const weaponDmg = weaponTpl ? (weaponTpl.damage || 0) : 0;

        // Obrażenia = bazowa siła wroga + obrażenia trzymanej broni
        return this.baseDamage + weaponDmg;
    }
    getArmor() {
        let totalArmor = this.baseConfig.armor || 0;
        if (this.equipment) {
            Object.values(this.equipment).forEach(itemId => {
                if (!itemId) return;
                const itemTpl = (typeof ITEMS_DB !== 'undefined' && ITEMS_DB[itemId])
                    ? ITEMS_DB[itemId]
                    : ((typeof start_items !== 'undefined' && start_items[itemId]) ? start_items[itemId] : null);

                if (itemTpl && itemTpl.armor) {
                    totalArmor += itemTpl.armor;
                }
            });
        }
        return totalArmor;
    }
    updateBossAI(dt, player, manager = null) {
        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
        this.targetDist = distToPlayer;

        if (this.shieldTimer > 0) this.shieldTimer -= dt;
        if (this.shieldTimer <= 0) this.shielding = false;

        if (distToPlayer <= 420) {
            this.battleActive = true;
            this.pursuitTimer = 0;
        }

        if (!this.battleActive) {
            this.state = 'IDLE';
            return;
        }

        if (distToPlayer > 500) {
            this.pursuitTimer += dt;
            if (this.pursuitTimer >= 5) {
                this.state = 'RETURNING';
                this.battleActive = false;
                this.shieldTimer = 0;
                this.shielding = false;
                return;
            }
        } else {
            this.pursuitTimer = 0;
        }

        if (this.state === 'RETURNING') {
            const backAngle = Math.atan2(this.homeY - this.y, this.homeX - this.x);
            const speed = this.speed * 0.9;
            const moveX = Math.cos(backAngle) * speed * dt;
            const moveY = Math.sin(backAngle) * speed * dt;
            if (typeof gameMap !== 'undefined' && gameMap.checkCollision) {
                if (!gameMap.checkCollision(this.x + moveX, this.y, this.radius)) this.x += moveX;
                if (!gameMap.checkCollision(this.x, this.y + moveY, this.radius)) this.y += moveY;
            } else {
                this.x += moveX;
                this.y += moveY;
            }

            if (Math.hypot(this.homeX - this.x, this.homeY - this.y) < 18) {
                this.state = 'IDLE';
                this.battleActive = false;
                this.pursuitTimer = 0;
                this.respawnTimer = 20;
                this.hp = this.maxHp;
                if (typeof showToast === 'function') showToast('Widmo wróciło do ruin i odpoczywa.');
            }
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        const playerAngle = Math.atan2(player.y - this.y, player.x - this.x);
        const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
        const strikeDist = Math.hypot(player.x - this.x, player.y - this.y);

        if (strikeDist <= this.attackRadius + 18 && this.attackCooldown <= 0) {
            const actionRoll = Math.random();
            this.attackCooldown = 1.5;

            if (actionRoll < 0.5) {
                this.state = 'RUNE_PULSE';
                this.windupTimer = 0.8;
                this.lastBossAction = 1;
                if (typeof showToast === 'function') showToast('Widmo rozpościera runiczny krąg!');
            } else if (actionRoll < 0.8) {
                this.state = 'SHIELD';
                this.shieldTimer = 1.15;
                this.shielding = true;
                this.lastBossAction = 2;
                if (typeof showToast === 'function') showToast('Widmo podnosi tarczę!');
            } else {
                this.state = 'RAZOR_CLEAVE';
                this.windupTimer = 0.7;
                this.lastBossAction = 3;
                if (typeof showToast === 'function') showToast('Widmo rozcina powietrze!');
            }
        }

        if (this.state === 'RUNE_PULSE') {
            this.windupTimer -= dt;
            if (this.windupTimer <= 0) {
                const dist = Math.hypot(player.x - this.x, player.y - this.y);
                if (dist <= 130) {
                    const pulseDamage = this.getDamage() + 18;
                    if (typeof player.takeDamage === 'function') player.takeDamage(pulseDamage);
                    else if (typeof player.hit === 'function') player.hit(pulseDamage);
                    const angle = Math.atan2(player.y - this.y, player.x - this.x);
                    player.x += Math.cos(angle) * 20;
                    player.y += Math.sin(angle) * 20;
                }
                this.state = 'CHASE';
                this.attackCooldown = 1.3;
            }
            return;
        }

        if (this.state === 'SHIELD') {
            this.shieldTimer -= dt;
            if (this.shieldTimer <= 0) {
                this.shielding = false;
                this.state = 'CHASE';
            }
            return;
        }

        if (this.state === 'RAZOR_CLEAVE') {
            this.windupTimer -= dt;
            if (this.windupTimer <= 0) {
                const dist = Math.hypot(player.x - this.x, player.y - this.y);
                if (dist <= 92) {
                    const cleaveDmg = this.getDamage() + 36;
                    if (typeof player.takeDamage === 'function') player.takeDamage(cleaveDmg);
                    else if (typeof player.hit === 'function') player.hit(cleaveDmg);
                }
                this.state = 'CHASE';
                this.attackCooldown = 1.6;
            }
            return;
        }

        const stepAngle = Math.atan2(player.y - this.y, player.x - this.x);
        const baseMoveX = Math.cos(stepAngle) * this.speed * dt * (strikeDist > this.attackRadius + 18 ? 1 : 0.5);
        const baseMoveY = Math.sin(stepAngle) * this.speed * dt * (strikeDist > this.attackRadius + 18 ? 1 : 0.5);

        let moved = false;
        if (typeof gameMap !== 'undefined' && gameMap.checkCollision) {
            const angles = [stepAngle, stepAngle + 0.7, stepAngle - 0.7, stepAngle + 1.3, stepAngle - 1.3];
            for (const angle of angles) {
                const attemptX = Math.cos(angle) * this.speed * dt * (strikeDist > this.attackRadius + 18 ? 1 : 0.5);
                const attemptY = Math.sin(angle) * this.speed * dt * (strikeDist > this.attackRadius + 18 ? 1 : 0.5);
                const xOk = !gameMap.checkCollision(this.x + attemptX, this.y, this.radius);
                const yOk = !gameMap.checkCollision(this.x, this.y + attemptY, this.radius);

                if (xOk && yOk) {
                    this.x += attemptX;
                    this.y += attemptY;
                    moved = true;
                    break;
                }

                if (xOk) {
                    this.x += attemptX;
                    moved = true;
                    break;
                }

                if (yOk) {
                    this.y += attemptY;
                    moved = true;
                    break;
                }
            }

            if (!moved && gameMap.checkCollision(this.x, this.y, this.radius)) {
                const fallbackX = this.homeX + (Math.random() - 0.5) * 40;
                const fallbackY = this.homeY + (Math.random() - 0.5) * 40;
                if (!gameMap.checkCollision(fallbackX, fallbackY, this.radius)) {
                    this.x = fallbackX;
                    this.y = fallbackY;
                }
            }
        } else {
            this.x += baseMoveX;
            this.y += baseMoveY;
        }

        if (distToPlayer <= 330 && this.attackCooldown <= 0) {
            this.attackCooldown = 1.2;
        }
    }

    update(dt, player, activePack, allies = [], manager = null) {
        if (this.isUnconscious || this.hp <= 0 || !this.isAlive) return;

        if (this.hitStun > 0) this.hitStun -= dt;

        if (this.type === 'ruin_guardian') {
            this.updateBossAI(dt, player, manager);
            return;
        }

        // Płynne odliczanie hitStun nawet podczas powalenia
        if (this.hitStun > 0) this.hitStun -= dt;

        // Powalony przeciwnik nie wykonuje ruchu ani ataku
        if (this.isKnockedDown) {
            this.knockDownTimer -= dt;
            if (this.knockDownTimer <= 0) {
                this.isKnockedDown = false;
            } else {
                return;
            }
        }

        const em = manager || (typeof enemyManager !== 'undefined' ? enemyManager : null);
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
        if (!this.isChargingHeavy && this.stamina < this.maxStamina) {
            this.stamina = Math.min(this.maxStamina, this.stamina + (this.staminaRegen * dt));
        }
        // Kluczowa zmiana: ZAWSZE aktualizujemy dystans do celu
        this.targetDist = distToTarget;

        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.hitStun > 0) {
            this.hitStun -= dt;
            return;
        }

        switch (this.state) {
            case 'IDLE':
                if (distToTarget <= this.aggroRadius) this.state = 'CHASE';
                break;

            case 'CHASE':
                if (distToTarget > this.deaggroRadius) {
                    if (em) em.releaseAttackToken(this);
                    this.state = 'RETURNING';
                    break;
                }
                // Jeśli wróg dojedzie blisko gracza, przechodzi w krążenie (orbitę)
                if (distToTarget <= this.attackRadius + 40) {
                    this.state = 'CIRCLE';
                } else {
                    this.moveTowards(target.x, target.y, dt, 1.0);
                }
                break;

            case 'CIRCLE':
                if (distToTarget > this.deaggroRadius) {
                    if (em) em.releaseAttackToken(this);
                    this.state = 'RETURNING';
                    break;
                }
                
                // --- 1. RUCH PO ORBICIE (Prostopadły wektor ruchu) ---
                const angle = Math.atan2(this.y - target.y, this.x - target.x);
                // Wróg wchodzi w Twój osobisty zasięg, idealnie pod swój atak:
                const idealDist = this.attackRadius - 5;

                const tangentX = -Math.sin(angle) * this.orbitDir;
                const tangentY = Math.cos(angle) * this.orbitDir;

                const distDiff = distToTarget - idealDist;
                const radialX = (target.x - this.x) / (distToTarget || 1);
                const radialY = (target.y - this.y) / (distToTarget || 1);

                const speed = this.speed * 0.75;
                const moveX = (tangentX * 0.75 + radialX * (distDiff * 0.02)) * speed * dt;
                const moveY = (tangentY * 0.75 + radialY * (distDiff * 0.02)) * speed * dt;

                // Sprawdzanie kolizji z ścianami podczas krążenia
                if (typeof gameMap !== 'undefined' && gameMap.checkCollision) {
                    if (!gameMap.checkCollision(this.x + moveX, this.y, this.radius)) this.x += moveX;
                    if (!gameMap.checkCollision(this.x, this.y + moveY, this.radius)) this.y += moveY;
                } else {
                    this.x += moveX;
                    this.y += moveY;
                }

                // Losowa zmiana kierunku okrążania
                if (Math.random() < 0.005) this.orbitDir *= -1;

                // --- 2. ATRAKCYJNOŚĆ / PROŚBA O TOKEN ATRAKCJI ---
                if (this.attackCooldown <= 0 && distToTarget <= this.attackRadius + 5) {
                    const hasToken = em ? em.requestAttackToken(this, distToTarget) : true;
                    if (hasToken) {
                        this.state = 'WINDUP';
                        this.windupTimer = 0.35;
                    }
                }
                break;

            case 'WINDUP':
                // Ładowanie ciosu – wróg staje w miejscu i telegrafuje atak
                this.windupTimer -= dt;
                if (this.windupTimer <= 0) {
                    const isTargetDodging = target.isInvulnerable || target.isDodging;
                    // Zwiększona tolerancja na trafienie, żeby ataki "nie uciekały"
                    if (distToTarget <= this.attackRadius + 15 && !isTargetDodging) {
                        if (typeof target.takeDamage === 'function') {
                            target.takeDamage(this.getDamage());
                        }
                    }
                    
                    // NATYCHMIASTOWE ZWOLNIENIE TOKENA! Gdy ten wróg zaczyna odskok, 
                    // inny już może ładować swój atak. To wymusza ciągłą rotację.
                    if (em) em.releaseAttackToken(this);

                    // Po wykonaniu ciosu przechodzi w odskok
                    this.state = 'RETREAT';
                    this.retreatTimer = 0.4; // 400ms odskoku
                }
                break;

            case 'RETREAT':
                // Szybki krok w tył po ataku – oddalenie od gracza
                const retreatAngle = Math.atan2(this.y - target.y, this.x - target.x);
                const retreatSpeed = this.speed * 1.1;
                const rx = Math.cos(retreatAngle) * retreatSpeed * dt;
                const ry = Math.sin(retreatAngle) * retreatSpeed * dt;

                if (typeof gameMap !== 'undefined' && gameMap.checkCollision) {
                    if (!gameMap.checkCollision(this.x + rx, this.y, this.radius)) this.x += rx;
                    if (!gameMap.checkCollision(this.x, this.y + ry, this.radius)) this.y += ry;
                } else {
                    this.x += rx;
                    this.y += ry;
                }

                this.retreatTimer -= dt;
                if (this.retreatTimer <= 0) {
                    this.attackCooldown = 1.2 + Math.random() * 0.7; // Czas do kolejnego ataku
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
        if (!this.isAlive) return;
        // Ignorujemy hitStun dla powalonych wrogów, żeby zawsze przyjmowali ciosy
        if (this.hitStun > 0 && !this.isKnockedDown) return;

        // Otrzymanie obrażeń wyrywa wroga z ataku
        if (this.state === 'ATTACK' || this.state === 'WINDUP' || this.state === 'RETREAT') {
            if (typeof enemyManager !== 'undefined') enemyManager.releaseAttackToken(this);
            this.windupTimer = 0;
            this.retreatTimer = 0;
            this.attackCooldown = 0.8;
        }

        this.hp -= amount;
        this.hitStun = 0.15;
        this.state = 'CHASE';

        const angle = Math.atan2(this.y - sourceY, this.x - sourceX);
        const knockbackDistance = 8;
        this.x += Math.cos(angle) * knockbackDistance;
        this.y += Math.sin(angle) * knockbackDistance;

        if (this.hp <= 1 && this.nonLethal) {
            this.hp = 1;
            this.canAttack = false;
            this.isUnconscious = true;
            this.isHostile = false;
            this.color = '#7f8c8d';

            if (typeof showToast === 'function') showToast(`${this.name} został powalony!`);
            if (typeof cutsceneManager !== 'undefined') cutsceneManager.checkBasementFightEnd();
            return;
        }

        if (this.type === 'ruin_guardian' && this.hp <= 0) {
            this.isAlive = false;
            this.state = 'DEFEATED';
            this.battleActive = false;
            this.dropLoot();
            if (typeof showToast === 'function') showToast('Widmo rycerza zostało pokonane!');
            return;
        }

        if (this.hp <= 0 && !this.nonLethal) {
            this.isAlive = false;
            this.onDeath();
        }
        if (this.hp <= 1 && this.nonLethal) {
            this.hp = 1;
            this.canAttack = false;
            this.isUnconscious = true;
            this.isHostile = false;
            this.color = '#7f8c8d';

            // DODAJ TE 4 LINII: Wyrzucenie sakwy przy powaleniu (tylko raz)
            if (!this.hasDroppedLoot) {
                this.hasDroppedLoot = true;
                this.dropLoot();
            }

            if (typeof showToast === 'function') showToast(`${this.name} został powalony!`);
            if (typeof cutsceneManager !== 'undefined') cutsceneManager.checkBasementFightEnd();
            return;
        }
    }

    onDeath() {
        this.dropLoot();
    }

    dropLoot() {
        const bagItems = [];
        let bagGold = 0;

        // 1. Drop ze stałej tabeli (surowce, alchemia, złoto)
        if (this.lootTable) {
            this.lootTable.forEach(drop => {
                if (Math.random() <= drop.chance) {
                    const count = Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min;
                    // Czyszczenie "monet" jako przedmiotu – złoto trafia wyłącznie do czystej puli bagGold
                    if (drop.id === 'gold_coins' || drop.id === 'gold' || drop.id === 'monety') {
                        bagGold += count;
                    } else {
                        const tpl = (typeof ITEMS_DB !== 'undefined' && ITEMS_DB[drop.id]) ? ITEMS_DB[drop.id] : null;
                        if (tpl) bagItems.push({ ...tpl, id: drop.id, count });
                    }
                }
            });
        }

        // 2. Rzut na drop używanej BRONI (realny przedmiot z ITEMS_DB)
        if (this.weaponId && Math.random() <= this.weaponDropChance) {
            const weaponTpl = (typeof ITEMS_DB !== 'undefined' && ITEMS_DB[this.weaponId]) ? ITEMS_DB[this.weaponId] : null;
            if (weaponTpl) {
                bagItems.push({ ...weaponTpl, id: this.weaponId, count: 1 });
            }
        }

        // 3. Rzut na drop używanego PANCERZA (realny przedmiot z ITEMS_DB)
        if (this.equipment) {
            Object.values(this.equipment).forEach(armorId => {
                if (armorId && Math.random() <= this.armorDropChance) {
                    const armorTpl = (typeof ITEMS_DB !== 'undefined' && ITEMS_DB[armorId])
                        ? ITEMS_DB[armorId]
                        : ((typeof start_items !== 'undefined' && start_items[armorId]) ? start_items[armorId] : null);
                    if (armorTpl) {
                        bagItems.push({ ...armorTpl, id: armorId, count: 1 });
                    }
                }
            });
        }

        // Tworzenie sakwy tylko jeśli coś wypadło
        if (bagItems.length > 0 || bagGold > 0) {
            LootManager.spawnBag(this.x, this.y, bagItems, bagGold);
        }
    }

    draw(ctx) {
        if (!this.isAlive) return;

        if (this.type === 'ruin_guardian' && (this.state === 'RUNE_PULSE' || this.state === 'RAZOR_CLEAVE')) {
            const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
            const arcAngle = this.state === 'RUNE_PULSE' ? Math.PI * 1.45 : Math.PI / 1.8;
            const radius = this.state === 'RUNE_PULSE' ? 170 : 120;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.arc(this.x, this.y, radius, angleToPlayer - arcAngle / 2, angleToPlayer + arcAngle / 2);
            ctx.closePath();
            ctx.fillStyle = this.state === 'RUNE_PULSE' ? 'rgba(143, 157, 255, 0.25)' : 'rgba(255, 120, 80, 0.30)';
            ctx.strokeStyle = this.state === 'RUNE_PULSE' ? '#8f9dff' : '#ff8a5b';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        if (this.state === 'WINDUP' || this.state === 'ATTACK') {
            const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
            const arcAngle = Math.PI / 2.2;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.arc(this.x, this.y, this.attackRadius, angleToPlayer - arcAngle / 2, angleToPlayer + arcAngle / 2);
            ctx.closePath();
            ctx.fillStyle = 'rgba(231, 76, 60, 0.40)';
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
        ctx.fillStyle = this.hitStun > 0 ? '#ffffff' : (this.type === 'wolf' ? '#7f8c8d' : this.color);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        let nameOffsetY = 12;

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

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.ceil(this.hp)} / ${this.maxHp}`, this.x, barY - 3);

            nameOffsetY = 28;
        }

        if (this.name) {
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 3;
            ctx.fillText(this.name, this.x, this.y - this.radius - nameOffsetY);
            ctx.restore();
        }
        if (this.isKnockedDown) {
            ctx.save();
            ctx.fillStyle = '#e67e22';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('💫 POWALONY', this.x, this.y + this.radius + 14);
            ctx.restore();
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

function startBattle(config) {
    gameState = 'COMBAT';

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

    if (enemyManager.allEnemiesDead()) {
        gameState = 'EXPLORATION';
        if (typeof uiManager !== 'undefined' && uiManager.hideCombatUI) uiManager.hideCombatUI();
        if (typeof showToast === 'function') showToast("Zwycięstwo!");
        if (typeof questManager !== 'undefined') questManager.updateQuest('kill_bandits');
    }
}

function updateQuickSlotsHUD() {
    for (let i = 0; i < 3; i++) {
        const itemId = player.quickSlots[i];

        // Elementy HUD (w grze)
        const hudIcon = document.getElementById(`qs-icon-${i}`);
        const hudName = document.getElementById(`qs-name-${i}`);
        const hudCount = document.getElementById(`qs-count-${i}`);

        // Elementy Ekwipunku (w okienku)
        const eqIcon = document.getElementById(`eq-qs-icon-${i}`);
        const eqName = document.getElementById(`eq-qs-name-${i}`);

        if (!itemId) {
            if (hudIcon) hudIcon.innerText = '➖';
            if (hudName) hudName.innerText = 'Puste';
            if (hudCount) hudCount.innerText = '';

            if (eqIcon) eqIcon.innerText = '➖';
            if (eqName) eqName.innerText = 'Puste';
            continue;
        }

        const item = player.inventory.find(it => it && it.id === itemId);
        if (item) {
            const iconText = item.icon || '📦';
            const countText = item.count ? `x${item.count}` : '';

            if (hudIcon) hudIcon.innerText = iconText;
            if (hudName) hudName.innerText = item.name;
            if (hudCount) hudCount.innerText = countText;

            if (eqIcon) eqIcon.innerText = iconText;
            if (eqName) eqName.innerText = `${item.name} ${countText}`;
        } else {
            // Przedmiot został całkowicie zużyty
            player.quickSlots[i] = null;
            if (hudIcon) hudIcon.innerText = '➖';
            if (hudName) hudName.innerText = 'Puste';
            if (hudCount) hudCount.innerText = '';

            if (eqIcon) eqIcon.innerText = '➖';
            if (eqName) eqName.innerText = 'Puste';
        }
    }
}

function assignSelectedToQuickSlot(slotIndex) {
    if (player.selectedItemIndex === null || player.selectedItemIndex === undefined) {
        if (typeof showToast === 'function') showToast("Wybierz najpierw przedmiot z ekwipunku!");
        return;
    }

    const item = player.inventory[player.selectedItemIndex];
    if (!item) return;

    // Jeśli ten sam przedmiot jest w innym slocie - czyścimy go tam
    player.quickSlots = player.quickSlots.map(id => id === item.id ? null : id);

    // Przypisujemy do wybranego slotu
    player.quickSlots[slotIndex] = item.id;
    if (typeof updateQuickSlotsHUD === 'function') updateQuickSlotsHUD();
    if (typeof showToast === 'function') showToast(`Przypisano ${item.name} do Slotu [${slotIndex + 1}]`);

    updateQuickSlotsHUD();
}