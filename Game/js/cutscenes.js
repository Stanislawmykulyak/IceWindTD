const cutsceneManager = {
    active: false,
    cameraTarget: null,

    startBasementIntro() {
        this.active = true;
        player.canMove = false;
        
        // Skierowanie kamery na zbirów w piwnicy
        this.cameraTarget = { x: 400, y: 200 };

        subtitleManager.play('zbiry_piwnica_intro', () => {
            this.cameraTarget = null;
            player.canMove = true;
            this.active = false;
            
            // Aktywacja wrogości zbirów
            if (enemyManager.enemies) {
                enemyManager.enemies.forEach(e => {
                    if (e.isBasementThug) e.isHostile = true;
                });
            }
        });
    },

    checkBasementFightEnd() {
        const thugs = enemyManager.enemies.filter(e => e.isBasementThug);
        const allDefeated = thugs.every(e => e.isUnconscious || e.hp <= 1);

        if (allDefeated && thugs.length > 0) {
            this.startBasementOutro(thugs);
        }
    },

    startBasementOutro(thugs) {
        this.active = true;
        player.canMove = false;

        // Przejście zbirów w stan przeprosin/wstawania
        thugs.forEach(t => {
            t.isHostile = false;
            t.state = 'surrendered';
        });

        subtitleManager.play('zbiry_piwnica_outro', () => {
            // Animacja wycofywania się do wyjścia (x: 200, y: 450)
            const exitInterval = setInterval(() => {
                let reachedDoor = 0;
                thugs.forEach(t => {
                    const dx = 200 - t.x;
                    const dy = 450 - t.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist > 10) {
                        t.x += (dx / dist) * 2;
                        t.y += (dy / dist) * 2;
                    } else {
                        reachedDoor++;
                    }
                });

                if (reachedDoor >= thugs.length) {
                    clearInterval(exitInterval);
                    // Despawn zbirów
                    enemyManager.enemies = enemyManager.enemies.filter(e => !e.isBasementThug);
                    player.canMove = true;
                    this.active = false;
                    
                    // Zaliczenie celu questa
                    questManager.completeObjective('Q1', 4);
                }
            }, 16);
        });
    }
};