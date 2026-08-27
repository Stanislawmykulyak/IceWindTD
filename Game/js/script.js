const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    CONFIG.CANVAS_WIDTH = window.innerWidth;
    CONFIG.CANVAS_HEIGHT = window.innerHeight;

    const fullmapCanvas = document.getElementById('fullmapCanvas');
    if (fullmapCanvas) {
        fullmapCanvas.width = fullmapCanvas.clientWidth;
        fullmapCanvas.height = fullmapCanvas.clientHeight;
    }
}
window.addEventListener('resize', resizeCanvas);

window.addEventListener('mousemove', (e) => {
    const tooltip = document.getElementById('item-tooltip');
    if (tooltip && !tooltip.classList.contains('hidden')) {
        tooltip.style.left = e.clientX + 15 + 'px';
        tooltip.style.top = e.clientY + 15 + 'px';
        tooltip.classList.remove('hidden');
    }
});


let draggedItemIndex = null;


const documentViewer = {
    isOpen: false,
    currentMonologueId: null,
    currentQuestTrigger: null,

    open(title, content, monologueId = null, questTrigger = null) {
        const modal = document.getElementById('reading-overlay');
        const titleElem = document.getElementById('reading-title');
        const bodyElem = document.getElementById('reading-text');

        if (titleElem) titleElem.innerText = title || '';
        if (bodyElem) bodyElem.innerHTML = content || '';

        this.currentMonologueId = monologueId;
        this.currentQuestTrigger = questTrigger;
        this.isOpen = true;

        if (modal) modal.classList.remove('hidden');
    },

    close() {
        const modal = document.getElementById('reading-overlay');
        if (modal) modal.classList.add('hidden');

        this.isOpen = false;

        const trigger = this.currentQuestTrigger;
        const monologue = this.currentMonologueId;

        this.currentQuestTrigger = null;
        this.currentMonologueId = null;

        if (monologue && typeof subtitleManager !== 'undefined') {
            subtitleManager.play(monologue, () => {
                if (trigger && typeof questManager !== 'undefined') {
                    questManager.completeObjective(trigger.questId, trigger.step);
                }
            });
        } else if (trigger && typeof questManager !== 'undefined') {
            questManager.completeObjective(trigger.questId, trigger.step);
        }
    }
};
// ==========================================
// 5.5 SYSTEM HANDLU (SKLEP)
// ==========================================

// ==========================================
// 6. GRACZ
// ==========================================
// Globalne zmienne pozycji myszy na ekranie
let mouseScreenX = 0;
let mouseScreenY = 0;
//6.7 POtwory








// Instancje menedżerów
const enemyManager = new EnemyManager();


window.addEventListener('mousemove', (e) => {
    mouseScreenX = e.clientX;
    mouseScreenY = e.clientY;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Pozycja myszy na canvasie w pikselach ekranu
    const mouseCanvasX = (e.clientX - rect.left) * scaleX;
    const mouseCanvasY = (e.clientY - rect.top) * scaleY;

    // Przeliczenie myszy na pozycję w świecie gry (z uwzględnieniem Kamery i ZOOMu)
    const mouseWorldX = (mouseCanvasX / CONFIG.ZOOM) + camera.x;
    const mouseWorldY = (mouseCanvasY / CONFIG.ZOOM) + camera.y;

    // Wyznaczenie kąta od gracza w świecie gry do myszki
    const dx = mouseWorldX - player.x;
    const dy = mouseWorldY - player.y;

    player.angle = Math.atan2(dy, dx);
});





function drawAttackArc(ctx, p) {
    const startAngle = p.facingAngle - (p.attackAngle / 2);
    const endAngle = p.facingAngle + (p.attackAngle / 2);

    ctx.save();

    // 1. Podgląd strefy rażenia (półprzezroczysty wachlarz pod kursorem)
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.arc(p.x, p.y, p.attackRange, startAngle, endAngle);
    ctx.closePath();

    if (p.isAttacking) {
        // Efekt podczas zamachu - rozbłysk
        ctx.fillStyle = 'rgba(231, 76, 60, 0.35)';
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
    } else {
        // Spokojny wskaźnik celowania
        ctx.fillStyle = 'rgba(241, 196, 15, 0.08)';
        ctx.strokeStyle = 'rgba(241, 196, 15, 0.3)';
        ctx.lineWidth = 1;
    }
    ctx.fill();
    ctx.stroke();

    // 2. Animowany zamach miecza (smuga ostrza przesuwająca się po wachlarzu)
    if (p.isAttacking) {
        const currentSweepAngle = startAngle + (p.attackAngle * p.attackProgress);

        // Smuga miecza
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(
            p.x + Math.cos(currentSweepAngle) * (p.attackRange + 5),
            p.y + Math.sin(currentSweepAngle) * (p.attackRange + 5)
        );
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#f1c40f';
        ctx.shadowBlur = 12;
        ctx.stroke();
    }

    ctx.restore();
}

const damageNumbers = {
    list: [],
    add(x, y, text, color = '#e74c3c') {
        this.list.push({ x, y, text, color, alpha: 1.0, life: 40 });
    },
    updateAndDraw(ctx) {
        for (let i = this.list.length - 1; i >= 0; i--) {
            const num = this.list[i];
            num.y -= 0.6; // Unoszenie się do góry
            num.alpha -= 0.02; // Znikanie
            num.life--;

            ctx.save();
            ctx.globalAlpha = Math.max(0, num.alpha);
            ctx.fillStyle = num.color;
            ctx.font = 'bold 14px sans-serif';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            ctx.fillText(num.text, num.x - 10, num.y);
            ctx.restore();

            if (num.life <= 0) {
                this.list.splice(i, 1);
            }
        }
    }
};

window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseCanvasX = e.clientX - rect.left;
    const mouseCanvasY = e.clientY - rect.top;

    // Przeliczenie z widoku ekranu na koordynaty świata
    const worldMouseX = camera.x + (mouseCanvasX / CONFIG.ZOOM);
    const worldMouseY = camera.y + (mouseCanvasY / CONFIG.ZOOM);

    // Kąt patrzenia gracza w stronę myszy
    player.facingAngle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
});



// Blokada menu kontekstowego na prawym kliku
window.addEventListener('contextmenu', e => e.preventDefault());

// ==========================================
// 7. WEJŚCIE I KONTROLA GRAFIKI
// ==========================================
const stateText = document.getElementById('player-state');
const keys = {};

window.addEventListener('keydown', (e) => {
    // Ignoruj jak gracz pisze na czacie/w oknie dialogowym
    if (document.activeElement.tagName === 'INPUT') return;

    if (e.key === 'h' || e.key === 'H') {
        callHorse();
    }
});

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;

    const readingModal = document.getElementById('reading-overlay');
    const isReading = readingModal && !readingModal.classList.contains('hidden');

    if (e.key === 'Control') {
        player.toggleStance();
    }
    if (['1', '2', '3'].includes(e.key)) {
        player.useQuickSlot(parseInt(e.key) - 1);
    }
    if (key === 'm') {
        menuSystem.toggle('map');
    } else if (key === 'i') {
        if (!isReading) menuSystem.toggle('inventory');
    } else if (key === 'j') {
        if (!isReading) menuSystem.toggle('quests');
    } else if (key === 'escape' || key === 'esc') {
        if (isReading) {
            documentViewer.close();
            return;
        }
        if (alchemyUI.isOpen) { // <-- DODAJ
            alchemyUI.close();
            return;
        }
        if (menuSystem.isOpen) {
            menuSystem.close();
            return;
        }
        if (shopSystem.isOpen) {
            shopSystem.close();
            return;
        }
    } else if (key === 'e') {
        // 1. Zamknięcie okna czytania listu
        if (isReading) {
            documentViewer.close();
            return;
        }
        if (typeof alchemyUI !== 'undefined' && alchemyUI.isOpen) {
            alchemyUI.close();
            return;
        }
        // 2. Jeśli menu (ekwipunek) jest otwarte -> wykonaj akcję na przedmiocie i ZAKOŃCZ (return)
        if (menuSystem.isOpen) {
            menuSystem.handleQuickAction();
            return;
        }

        // 3. Interakcja w świecie gry (tylko gdy menu i czytnik są zamknięte)
        if (!dialogueManager.isActive && !player.isSleeping) {
            const nearBag = typeof LootManager !== 'undefined' ? LootManager.getNearBag(player) : null;
            if (nearBag) {
                lootBagSystem.open(nearBag);
                return;
            }

            let interacted = false;
            for (let i = worldObjects.length - 1; i >= 0; i--) {
                const res = worldObjects[i].handleInteraction('e');
                if (res === 'REMOVE') worldObjects.splice(i, 1);
                if (res) { interacted = true; break; }
            }
            if (!interacted && !gameMap.tryInteract()) player.toggleHorse();
        }
    } else if (key === 'f') {
        for (let i = worldObjects.length - 1; i >= 0; i--) {
            const res = worldObjects[i].handleInteraction('f');
            if (res === 'REMOVE') {
                worldObjects.splice(i, 1);
                break;
            }
        }
    }
});
window.addEventListener('mousedown', (e) => {
    const readingModal = document.getElementById('reading-overlay');
    const isReading = readingModal && !readingModal.classList.contains('hidden');

    if (menuSystem.isOpen || dialogueManager.isActive || player.isSleeping || isReading) return;

    if (e.button === 0) { // LPM
        player.attackAngle = getPlayerAimAngle();

        // e.ctrlKey zwraca true, jeśli podczas kliknięcia LPM przytrzymujesz Ctrl
        const isHeavy = e.ctrlKey;

        player.attack(isHeavy); // true = ciężki, false = lekki
    } else if (e.button === 2) { // PPM -> Parowanie
        player.parry();
    }
});

// Blokada domyślnego menu pod PPM
canvas.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;


    if (key === 'w') {
        e.preventDefault();
    }
    if (key === 'q') {
        e.preventDefault();
    }

    // --- ZAMIEŃ LUB DODAJ TUTAJ TE LINIE ---
    if (key === 't') {
        startBattle({ type: 'zbir_lekki', count: 5 });
    }
    if (key === 'alt') {
        e.preventDefault();
        player.dodge();
    }
    // --------------------------------------

    // Zamknięcie okna czytania
    const readingModal = document.getElementById('reading-overlay');
    if (readingModal && !readingModal.classList.contains('hidden')) {
        if (key === 'escape' || key === 'esc' || key === 'e') {
            documentViewer.close();
            return;
        }
    }
    // ... reszta Twojego kodu w tym listenerze
});

window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// ==========================================
// 8. START I PĘTLA GRY
// ==========================================
resizeCanvas();
gameMap.spawnVillageNPCs();
questManager.init();

const mouse = { x: 0, y: 0 };

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

function getPlayerAimAngle() {
    // Przeliczenie pozycji myszy na współrzędne świata z uwzględnieniem kamery i zoomu
    const worldMouseX = camera.x + mouse.x / CONFIG.ZOOM;
    const worldMouseY = camera.y + mouse.y / CONFIG.ZOOM;
    return Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
}


let lastFrameTime = performance.now();

function gameLoop() {
    const now = performance.now();
    const dt = Math.min((now - lastFrameTime) / 1000, 0.1);
    lastFrameTime = now;

    // 1. Aktualizacja logiki gry
    if (!dialogueManager.isActive && !player.isSleeping && !menuSystem.isOpen && !alchemyUI.isOpen) {
        player.update(keys, stateText);
        gameMap.updateNPCs();
        enemyManager.update(dt, player);
        LootManager.update(player, keys);
    }

    // 2. Pozycjonowanie kamery
    const currentLoc = gameMap.getCurrentData();
    camera.follow(player, currentLoc.width, currentLoc.height);

    // 3. Czyszczenie ekranu
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 4. RENDEROWANIE ŚWIATA GRY (PODLEGA TRANSFORMATION KAMERY)
    ctx.save();
    ctx.scale(CONFIG.ZOOM, CONFIG.ZOOM);
    ctx.translate(-camera.x, -camera.y);

    gameMap.draw(ctx);
    LootManager.draw(ctx);
    enemyManager.draw(ctx);
    player.draw(ctx);
    worldObjects.forEach(obj => obj.draw(ctx));
    damageNumbers.updateAndDraw(ctx);

    if (typeof encounterManager !== 'undefined') {
        encounterManager.update();
    }

    if (gameMap.currentLocation === 'kruczy_dol' && timeSystem.isNight) {
        ctx.fillStyle = CONFIG.COLOR_NIGHT_FILTER;
        ctx.fillRect(0, 0, currentLoc.width, currentLoc.height);
    }

    ctx.restore(); // <-- KONIEC KAMERY

    // 5. RENDEROWANIE INTERFEJSU NA EKRANIE (STALE WSPÓŁRZĘDNE EKRANU)
    if (typeof menuSystem !== 'undefined' && !menuSystem.isOpen) {
    drawCombatHUD(ctx);
    drawActiveEffectsHUD(ctx);
}

    gameMap.drawMinimap();

    if (menuSystem.isOpen && menuSystem.activeTab === 'map') {
        gameMap.drawFullMap();
    }

    requestAnimationFrame(gameLoop);
}

// Uruchomienie pętli
gameLoop();