const inputState = {
    keys: {},
    mouse: { x: 0, y: 0 }
};

const keys = inputState.keys;
const mouse = inputState.mouse;

function updateMouseState(event) {
    inputState.mouse.x = event.clientX;
    inputState.mouse.y = event.clientY;

    const canvasEl = document.getElementById('gameCanvas');
    if (!canvasEl) return;

    const rect = canvasEl.getBoundingClientRect();
    const mouseCanvasX = event.clientX - rect.left;
    const mouseCanvasY = event.clientY - rect.top;

    if (typeof camera !== 'undefined' && typeof CONFIG !== 'undefined' && typeof player !== 'undefined') {
        const worldMouseX = camera.x + (mouseCanvasX / CONFIG.ZOOM);
        const worldMouseY = camera.y + (mouseCanvasY / CONFIG.ZOOM);
        player.facingAngle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
        player.angle = player.facingAngle;
    }
}

function handleGlobalMouseMove(event) {
    updateMouseState(event);

    const tooltip = document.getElementById('item-tooltip');
    if (tooltip && !tooltip.classList.contains('hidden')) {
        tooltip.style.left = event.clientX + 15 + 'px';
        tooltip.style.top = event.clientY + 15 + 'px';
        tooltip.classList.remove('hidden');
    }
}

function handleGlobalKeyDown(event) {
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

    const key = event.key.toLowerCase();
    keys[key] = true;

    const readingModal = document.getElementById('reading-overlay');
    const isReading = readingModal && !readingModal.classList.contains('hidden');

    if (event.key === 'h' || event.key === 'H') {
        if (typeof callHorse === 'function') callHorse();
    }

    if (event.key === 'Control') {
        if (typeof player !== 'undefined' && typeof player.toggleStance === 'function') {
            player.toggleStance();
        }
    }

    if (['1', '2', '3'].includes(event.key)) {
        if (typeof player !== 'undefined' && typeof player.useQuickSlot === 'function') {
            player.useQuickSlot(parseInt(event.key, 10) - 1);
        }
    }

    if (key === 'm') {
        if (typeof menuSystem !== 'undefined') menuSystem.toggle('map');
    } else if (key === 'i') {
        if (!isReading && typeof menuSystem !== 'undefined') menuSystem.toggle('inventory');
    } else if (key === 'j') {
        if (!isReading && typeof menuSystem !== 'undefined') menuSystem.toggle('quests');
    } else if (key === 'escape' || key === 'esc') {
        if (isReading) {
            if (typeof documentViewer !== 'undefined') documentViewer.close();
            return;
        }
        if (typeof alchemyUI !== 'undefined' && alchemyUI.isOpen) {
            alchemyUI.close();
            return;
        }
        if (typeof menuSystem !== 'undefined' && menuSystem.isOpen) {
            menuSystem.close();
            return;
        }
        if (typeof shopSystem !== 'undefined' && shopSystem.isOpen) {
            shopSystem.close();
            return;
        }
    } else if (key === 'e') {
        if (isReading) {
            if (typeof documentViewer !== 'undefined') documentViewer.close();
            return;
        }

        if (typeof documentViewer !== 'undefined' && documentViewer.isOpen && typeof menuSystem !== 'undefined' && menuSystem.isOpen) {
            return;
        }

        if (typeof alchemyUI !== 'undefined' && alchemyUI.isOpen) {
            alchemyUI.close();
            return;
        }

        if (typeof menuSystem !== 'undefined' && menuSystem.isOpen) {
            menuSystem.handleQuickAction();
            return;
        }

        if (typeof dialogueManager !== 'undefined' && dialogueManager.isActive) return;
        if (typeof player !== 'undefined' && player.isSleeping) return;

        if (typeof LootManager !== 'undefined') {
            const nearBag = LootManager.getNearBag(player);
            if (nearBag) {
                lootBagSystem.open(nearBag);
                return;
            }
        }

        let interacted = false;
        for (let i = worldObjects.length - 1; i >= 0; i--) {
            const res = worldObjects[i].handleInteraction('e');
            if (res === 'REMOVE') worldObjects.splice(i, 1);
            if (res) {
                interacted = true;
                break;
            }
        }

        if (!interacted && typeof gameMap !== 'undefined' && !gameMap.tryInteract()) {
            if (typeof player !== 'undefined') player.toggleHorse();
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

    if (key === 'w') event.preventDefault();
    if (key === 'q') event.preventDefault();

    if (key === 't' && typeof startBattle === 'function') {
        startBattle({ type: 'zbir_lekki', count: 5 });
    }

    if (key === 'alt') {
        event.preventDefault();
        if (typeof player !== 'undefined' && typeof player.dodge === 'function') player.dodge();
    }

    if (readingModal && !readingModal.classList.contains('hidden')) {
        if (key === 'escape' || key === 'esc') {
            if (typeof documentViewer !== 'undefined') documentViewer.close();
            return;
        }
    }
}

function handleGlobalKeyUp(event) {
    const key = event.key.toLowerCase();
    if (keys) keys[key] = false;
}

function handleGlobalMouseDown(event) {
    const readingModal = document.getElementById('reading-overlay');
    const isReading = readingModal && !readingModal.classList.contains('hidden');

    if (typeof menuSystem !== 'undefined' && menuSystem.isOpen) return;
    if (typeof dialogueManager !== 'undefined' && dialogueManager.isActive) return;
    if (typeof player !== 'undefined' && player.isSleeping) return;
    if (isReading) return;

    if (event.button === 0) {
        if (typeof player !== 'undefined') {
            player.attackAngle = typeof getPlayerAimAngle === 'function' ? getPlayerAimAngle() : player.angle;
            player.attack();
        }
    } else if (event.button === 2) {
        if (typeof player !== 'undefined' && typeof player.parry === 'function') player.parry();
    }
}

function bindInputHandlers() {
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('keyup', handleGlobalKeyUp);
    window.addEventListener('mousedown', handleGlobalMouseDown);
    window.addEventListener('contextmenu', e => e.preventDefault());
    const canvasEl = document.getElementById('gameCanvas');
    if (canvasEl) canvasEl.addEventListener('contextmenu', e => e.preventDefault());
}

bindInputHandlers();
