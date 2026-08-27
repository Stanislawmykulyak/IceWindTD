const cutsceneManager = {
    active: false,
    cameraTarget: null,

    startBasementIntro() {
        this.active = true;
        player.canMove = false;

        // Skierowanie kamery na zbirów w piwnicy
        this.cameraTarget = { x: 400, y: 200 };

        // Bezpiecznik: jeśli napisy się zawieszą, odblokuj gracza max po 4 sekundach
        const safetyTimeout = setTimeout(() => {
            if (this.active) {
                this.cameraTarget = null;
                player.canMove = true;
                this.active = false;
            }
        }, 4000);

        subtitleManager.play('zbiry_piwnica_intro', () => {
            clearTimeout(safetyTimeout);
            this.cameraTarget = null;
            player.canMove = true;
            this.active = false;

            // Aktywacja wrogości zbirów
            if (typeof enemyManager !== 'undefined' && enemyManager.enemies) {
                enemyManager.enemies.forEach(e => {
                    if (e.isBasementThug || e.id === 'z1' || e.id === 'z2') {
                        e.isHostile = true;
                        e.state = 'CHASE';
                    }
                });
            }
        });
    },

    checkBasementFightEnd() {
        if (typeof enemyManager === 'undefined' || !enemyManager.enemies) return;

        // Wyszukiwanie po fladze LUB po identyfikatorach z1 / z2
        const thugs = enemyManager.enemies.filter(e => e.isBasementThug || e.id === 'z1' || e.id === 'z2');
        if (thugs.length === 0) return;

        const allDefeated = thugs.every(e => e.isUnconscious || e.hp <= 1 || !e.isAlive);

        if (allDefeated) {
            this.startBasementOutro(thugs);
        }
    },

    startBasementOutro(thugs) {
        this.active = true;
        player.canMove = false;

        // Przejście zbirów w stan poddania
        thugs.forEach(t => {
            t.isHostile = false;
            t.state = 'surrendered';
            t.canAttack = false;
        });

        // Funkcja natychmiastowo czyszcząca wrogów z gry
        const cleanupThugs = () => {
            // 1. Usuń z EnemyManager
            if (typeof enemyManager !== 'undefined' && enemyManager.enemies) {
                enemyManager.enemies = enemyManager.enemies.filter(e => !e.isBasementThug && e.id !== 'z1' && e.id !== 'z2');
            }
            // 2. Usuń z globalnej tablicy enemies (jeśli istnieje)
            if (typeof enemies !== 'undefined') {
                enemies = enemies.filter(e => e.id !== 'z1' && e.id !== 'z2' && !e.isBasementThug);
            }
            // 3. Usuń z mapy gameMap (jeśli istnieje)
            if (typeof gameMap !== 'undefined' && gameMap.currentEnemies) {
                gameMap.currentEnemies = gameMap.currentEnemies.filter(e => e.id !== 'z1' && e.id !== 'z2' && !e.isBasementThug);
            }

            // Odblokuj gracza i zaktualizuj cele
            player.canMove = true;
            this.active = false;

            if (typeof questManager !== 'undefined') {
                questManager.completeObjective('Q1', 4);
                questManager.completeObjective('Q1', 5);
            }

            showToast("Zbiry uciekły w popłochu!");
        };

        subtitleManager.play('zbiry_piwnica_outro', () => {
            let elapsedTime = 0;

            const exitInterval = setInterval(() => {
                elapsedTime += 16;
                let reachedDoor = 0;

                thugs.forEach(t => {
                    const dx = 200 - t.x;
                    const dy = 0 - t.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist > 15) {
                        t.x += (dx / dist) * 4; // Szybszy chód do wyjścia
                        t.y += (dy / dist) * 4;
                    } else {
                        reachedDoor++;
                    }
                });

                // Jeśli dotarli do drzwi LUB minęły 2 sekundy (zabezpieczenie na utknięcie w ścianie)
                if (reachedDoor >= thugs.length || elapsedTime > 2000) {
                    clearInterval(exitInterval);
                    cleanupThugs();
                }
            }, 16);
        });
    }
};