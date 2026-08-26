// ==========================================
// 1. SILNIK SEKWENCJI I PODCZAS WALKI
// ==========================================

const CutsceneRunner = {
    async run(sequence) {
        if (typeof gameState !== 'undefined') gameState.inputLocked = true;

        for (const action of sequence) {
            await this.executeAction(action);
        }
    },

    executeAction(action) {
        return new Promise((resolve) => {
            switch (action.type) {
                case 'panCamera':
                    if (typeof camera !== 'undefined') camera.panTo(action.target, action.duration || 1000, resolve);
                    else resolve();
                    break;

                case 'resetCamera':
                    if (typeof camera !== 'undefined') camera.setTarget(player);
                    resolve();
                    break;

                case 'dialog':
                    if (typeof showSubtitle === 'function') {
                        showSubtitle(action.speaker, action.text, action.duration, () => {
                            if (typeof hideSubtitles === 'function') hideSubtitles();
                            resolve();
                        });
                    } else resolve();
                    break;

                case 'spawn':
                    if (typeof spawnEnemy === 'function') {
                        action.entities.forEach(e => spawnEnemy(e.type, e.x, e.y, e.id));
                    }
                    resolve();
                    break;

                case 'setEnemyState':
                    action.enemyIds.forEach(id => {
                        const enemy = typeof getEnemyById === 'function' ? getEnemyById(id) : null;
                        if (enemy) {
                            if (action.status) enemy.status = action.status;
                            if (action.isAggressive !== undefined) enemy.isAggressive = action.isAggressive;
                        }
                    });
                    resolve();
                    break;

                case 'moveAndDespawn':
                    const enemy = typeof getEnemyById === 'function' ? getEnemyById(action.enemyId) : null;
                    moveNpcToAndDespawn(enemy, action.target, resolve);
                    break;

                case 'completeObjective':
                    if (typeof questManager !== 'undefined') {
                        questManager.completeObjective(action.questId, action.stepIndex);
                    }
                    resolve();
                    break;

                case 'unlockInput':
                    if (typeof gameState !== 'undefined') gameState.inputLocked = false;
                    resolve();
                    break;

                case 'wait':
                    setTimeout(resolve, action.duration);
                    break;

                default:
                    resolve();
            }
        });
    }
};

const encounterManager = {
    activeEncounters: [],

    registerEncounter(enemyIds, onVictorySequence) {
        this.activeEncounters.push({ enemyIds, onVictorySequence });
    },

    update() {
        for (let i = this.activeEncounters.length - 1; i >= 0; i--) {
            const enc = this.activeEncounters[i];
            
            const isDefeated = enc.enemyIds.every(id => {
                const enemy = typeof getEnemyById === 'function' ? getEnemyById(id) : null;
                return enemy && (enemy.status === 'unconscious' || enemy.isDead);
            });

            if (isDefeated) {
                const sequence = enc.onVictorySequence;
                this.activeEncounters.splice(i, 1);
                CutsceneRunner.run(sequence);
            }
        }
    }
};

// ==========================================
// 2. FUNKCJE POMOCNICZE
// ==========================================

function moveNpcToAndDespawn(npc, target, callback) {
    if (!npc) {
        if (callback) callback();
        return;
    }

    const speed = npc.speed || 1.5;
    
    function animate() {
        const dx = target.x - npc.x;
        const dy = target.y - npc.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 5) {
            npc.isDead = true; // Usunięcie NPC z mapy po dojściu do celu
            if (callback) callback();
        } else {
            npc.x += (dx / dist) * speed;
            npc.y += (dy / dist) * speed;
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

// ==========================================
// 3. DEFINICJE CUTSCENEK DLA QUESTÓW
// ==========================================

function triggerCellarEncounter() {
    const introCutscene = [
        { type: 'spawn', entities: [{ type: 'z1', id: 'z1_q1', x: 380, y: 150 }, { type: 'z2', id: 'z2_q1', x: 420, y: 150 }] },
        { type: 'panCamera', target: { x: 400, y: 150 }, duration: 1500 },
        { type: 'dialog', speaker: 'Z1', text: 'Szybciej! Szukaj w podwójnym dnie!', duration: 3000 },
        { type: 'dialog', speaker: 'Z2', text: 'Czekaj... Ktoś tu wlazł! Patrz na niego!', duration: 3000 },
        { type: 'resetCamera' },
        { type: 'setEnemyState', enemyIds: ['z1_q1', 'z2_q1'], isAggressive: true },
        { type: 'completeObjective', questId: 'Q1', stepIndex: 4 },
        { type: 'unlockInput' }
    ];

    const victoryCutscene = [
        { type: 'setEnemyState', enemyIds: ['z1_q1', 'z2_q1'], status: 'idle' },
        { type: 'dialog', speaker: 'Z1', text: 'Dobra, dobra! Czekaj, nie bij!', duration: 3000 },
        { type: 'dialog', speaker: 'Z2', text: 'To nie nasza sprawa, Nicolas i tak ma przesrane...', duration: 3000 },
        { type: 'moveAndDespawn', enemyId: 'z1_q1', target: { x: 400, y: 580 } },
        { type: 'moveAndDespawn', enemyId: 'z2_q1', target: { x: 400, y: 580 } },
        { type: 'completeObjective', questId: 'Q1', stepIndex: 5 },
        { type: 'unlockInput' }
    ];

    CutsceneRunner.run(introCutscene);
    encounterManager.registerEncounter(['z1_q1', 'z2_q1'], victoryCutscene);
}

function onCellarClear() {
    questSystem.completeQuest('q1_mlyn');
    uiSystem.showEndScreen({
        title: "DEMO UKOŃCZONE",
        message: "Uratowałeś Nicolasa i odparłeś atak zbirów Ludolfa.",
        buttonText: "Graj dalej (Eksploracja)"
    });
}