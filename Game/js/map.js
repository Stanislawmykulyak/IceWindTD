const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;

const gameMap = {
    currentLocation: 'kruczy_dol',
    nearDoor: null,
    nearNPC: null,
    nearBed: false,

    locations: {
        kruczy_dol: {
            width: CONFIG.WORLD_WIDTH, height: CONFIG.WORLD_HEIGHT, bgColor: CONFIG.COLOR_GRASS,
            buildings: [
                { id: 'tavern', name: 'Karczma Pod Krukiem', x: 700, y: 400, width: 260, height: 180, color: '#5c3a21' },
                { id: 'blacksmith', name: 'Kuźnia', x: 1200, y: 700, width: 160, height: 130, color: '#4a4a4a' },
                { id: 'mill', name: 'Młyn', x: 1700, y: 300, width: 140, height: 140, color: '#6e5438' },
                { id: 'nicolas_house', name: 'Chata Nicolasa', x: 1900, y: 480, width: 120, height: 100, color: '#4d3319' }
            ],
            doors: [
                { x: 810, y: 580, width: 40, height: 20, targetLocation: 'karczma_wnetrze', spawnX: 400, spawnY: 480, label: 'Wejdź [E]' },
                { x: 1940, y: 580, width: 40, height: 20, targetLocation: 'nicolas_wnetrze', spawnX: 400, spawnY: 480, label: 'Wejdź [E]' },
                // NOWE DRZWI: Przejście z wioski do obszaru Młyna
                { x: 1750, y: 440, width: 40, height: 20, targetLocation: 'wioska_mlyn', spawnX: 1220, spawnY: 1900, label: 'Stary Młyn [E]' }
            ],
            npcs: []
        },
        karczma_wnetrze: {
            width: 800, height: 600, bgColor: CONFIG.COLOR_INTERIOR,
            buildings: [
                { id: 'bar', name: 'Lada Karczmarza', x: 300, y: 150, width: 200, height: 50, color: '#2b170a' }
            ],
            doors: [
                { x: 380, y: 520, width: 40, height: 20, targetLocation: 'kruczy_dol', spawnX: 830, spawnY: 620, label: 'Wyjdź [E]' },
                {
                    x: 710, y: 100, width: 50, height: 70,
                    targetLocation: 'karczma_pietro', spawnX: 85, spawnY: 310,
                    isStair: true, dir: 'w'
                }
            ],
            npcs: [{
                id: 'innkeeper', name: 'Karczmarz Barnaba', x: 400, y: 115,
                radius: 14, color: '#e74c3c', dialogueId: 'karczmarz_intro', talkRadius: 110
            }]
        },
        karczma_pietro: {
            width: 1000, height: 400, bgColor: CONFIG.COLOR_CORRIDOR,
            buildings: [
                { id: 'wall_top', name: '', x: 0, y: 0, width: 1000, height: 120, color: '#23150b' }
            ],
            doors: [
                {
                    x: 60, y: 220, width: 50, height: 70,
                    targetLocation: 'karczma_wnetrze', spawnX: 735, spawnY: 190,
                    isStair: true, dir: 's'
                },
                { x: 250, y: 110, width: 40, height: 20, keyRequired: 'room_1', label: 'Pokój #1 [E]', message: 'Pokój #1: Zamknięte.' },
                { x: 420, y: 110, width: 40, height: 20, keyRequired: 'room_2', label: 'Pokój #2 [E]', message: 'Pokój #2: Słychać chrapanie...' },
                { x: 590, y: 110, width: 40, height: 20, keyRequired: 'room_3', label: 'Pokój #3 [E]', message: 'Pokój #3: Zamknięte.' },
                {
                    x: 780, y: 110, width: 40, height: 20,
                    keyRequired: 'room_key',
                    targetLocation: 'pokoj_gracza',
                    spawnX: 300, spawnY: 420,
                    label: 'Pokój #4 [E]',
                    message: 'Pokój #4 jest zamknięty na klucz!'
                }
            ],
            npcs: []
        },
        pokoj_gracza: {
            width: 600, height: 500, bgColor: CONFIG.COLOR_INTERIOR,
            buildings: [
                { id: 'bed', name: 'Wygodne Łóżko', x: 100, y: 100, width: 100, height: 160, color: '#8e44ad' }
            ],
            doors: [
                { x: 280, y: 440, width: 40, height: 20, targetLocation: 'karczma_pietro', spawnX: 780, spawnY: 150, label: 'Wyjdź na korytarz [E]' }
            ],
            npcs: []
        },
        wioska_mlyn: {
            width: 2400,
            height: 2400,
            name: "Obszar Starego Młyna",
            bgColor: '#2e3d29',
            buildings: [
                { id: 'mlyn_bldg', name: 'Młyn', x: 1100, y: 1600, width: 300, height: 240, color: '#4a3525' }
            ],
            doors: [
                // Wejście do wnętrza Młyna
                {
                    x: 1230, y: 1840, width: 40, height: 20,
                    targetLocation: 'mlyn_wnetrze', spawnX: 600, spawnY: 820,
                    label: 'Wejdź do Młyna [E]'
                },
                // Powrót do wioski Kruczy Dół
                {
                    x: 1230, y: 1980, width: 40, height: 20,
                    targetLocation: 'kruczy_dol', spawnX: 1770, spawnY: 480,
                    label: 'Powrót do Wioski [E]'
                }
            ]
        },

        mlyn_wnetrze: {
            width: 1200,
            height: 900,
            name: "Wnętrze Młyna",
            bgColor: '#3a271d',
            buildings: [
                // Elementy wnętrza - koło młyńskie, worki z mąką, stoły warsztatowe
                { id: 'mlyn_mecz', name: 'Mechanizm Młyński', x: 150, y: 100, width: 220, height: 220, color: '#271911' },
                { id: 'worki_maka', name: 'Stos worków z mąką', x: 850, y: 120, width: 180, height: 100, color: '#8a7967' },
                { id: 'stol_mlynarza', name: 'Stół Stolarski', x: 880, y: 600, width: 160, height: 90, color: '#573d2a' }
            ],
            doors: [
                // Wyjście na zewnątrz przed Młyn
                {
                    x: 580, y: 870, width: 80, height: 20,
                    targetLocation: 'wioska_mlyn', spawnX: 1250, spawnY: 1880,
                    label: 'Wyjście na zewnątrz [E]'
                },
                // Zejście do piwnicy Młyna (znajduje się w lewym górnym rogu)
                {
                    x: 100, y: 400, width: 50, height: 30,
                    targetLocation: 'mlyn_piwnica', spawnX: 150, spawnY: 700,
                    label: 'Zejście do Piwnicy [E]'
                }
            ]
        },

        mlyn_piwnica: {
            width: 1000,
            height: 800,
            name: "Piwnica Młyna",
            bgColor: '#120d0a',
            buildings: [
                { id: 'stare_skrzynie', name: 'Rupiecie i Skrzynie', x: 700, y: 150, width: 180, height: 120, color: '#2b1f17' }
            ],
            doors: [
                // Powrót z piwnicy do wnętrza Młyna
                {
                    x: 130, y: 750, width: 60, height: 20,
                    targetLocation: 'mlyn_wnetrze', spawnX: 120, spawnY: 460,
                    label: 'Wyjście na górę [E]'
                }
            ],
            onEnter() {
                const z1 = new Enemy({ id: 'z1', type: 'zbir_lekki', x: 500, y: 350, name: 'Zbir' });
                Object.assign(z1, {
                    hp: 300, maxHp: 300, armor: 2,
                    color: '#e74c3c', nonLethal: true, isBasementThug: true, isHostile: false
                });

                const z2 = new Enemy({ id: 'z2', type: 'zbir_ciezki', x: 580, y: 350, name: 'Zbir Ciężki' });
                Object.assign(z2, {
                    hp: 550, maxHp: 550, armor: 5,
                    color: '#c0392b', nonLethal: true, isBasementThug: true, isHostile: false
                });

                enemyManager.enemies = [z1, z2];
                cutsceneManager.startBasementIntro();
            }
        }
    },

    getCurrentData() { return this.locations[this.currentLocation]; },

    spawnVillageNPCs() {
        const count = timeSystem.isNight ? 2 : 7;
        const names = ["Wieśniak", "Mieszczanka", "Podróżny", "Górnik", "Handlarz"];
        const colors = ['#e67e22', '#16a085', '#f39c12', '#9b59b6', '#7f8c8d'];

        const villageNPCs = [];
        for (let i = 0; i < count; i++) {
            let spawnX, spawnY;
            do {
                spawnX = 300 + Math.random() * 1600;
                spawnY = 520 + (Math.random() * 150 - 75);
            } while (this.checkCollision(spawnX, spawnY, 12));

            villageNPCs.push({
                id: 'citizen_' + i, name: names[i % names.length],
                x: spawnX, y: spawnY, targetX: null, targetY: null,
                radius: 12, color: colors[i % colors.length]
            });
        }
        this.locations.kruczy_dol.npcs = villageNPCs;
    },

    updateNPCs() {
        const loc = this.getCurrentData();
        if (!loc.npcs) return;

        loc.npcs.forEach(npc => {
            if (npc.targetX !== undefined) {
                if (!npc.targetX || Math.hypot(npc.targetX - npc.x, npc.targetY - npc.y) < 15) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 50 + Math.random() * 100;
                    npc.targetX = npc.x + Math.cos(angle) * dist;
                    npc.targetY = npc.y + Math.sin(angle) * dist;
                }

                const angle = Math.atan2(npc.targetY - npc.y, npc.targetX - npc.x);
                const speed = 0.6;
                const nextX = npc.x + Math.cos(angle) * speed;
                const nextY = npc.y + Math.sin(angle) * speed;

                if (!this.checkCollision(nextX, nextY, npc.radius)) {
                    npc.x = nextX; npc.y = nextY;
                } else {
                    npc.targetX = null;
                }
            }
        });
    },

    draw(ctx) {
        const loc = this.getCurrentData();
        ctx.fillStyle = loc.bgColor;
        ctx.fillRect(0, 0, loc.width, loc.height);

        if (this.currentLocation === 'kruczy_dol') {
            ctx.fillStyle = CONFIG.COLOR_ROAD;
            ctx.fillRect(0, 500, loc.width, 100);
            ctx.fillRect(800, 580, 60, 200);
            ctx.fillRect(1930, 580, 60, 200);
        }

        loc.buildings.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.width, b.height);
            ctx.strokeStyle = '#1a1008';
            ctx.lineWidth = 3;
            ctx.strokeRect(b.x, b.y, b.width, b.height);

            if (b.name) {
                ctx.fillStyle = '#e0e0e0';
                ctx.font = '12px sans-serif';
                ctx.fillText(b.name, b.x + 10, b.y - 8);
            }
        });

        this.nearBed = false;
        if (this.currentLocation === 'pokoj_gracza') {
            const bed = loc.buildings.find(b => b.id === 'bed');
            if (bed) {
                const dist = Math.hypot(player.x - (bed.x + bed.width / 2), player.y - (bed.y + bed.height / 2));
                if (dist < 80) {
                    this.nearBed = true;
                    ctx.fillStyle = '#f1c40f';
                    ctx.font = 'bold 13px sans-serif';
                    ctx.fillText('Połóż się spać [E]', bed.x, bed.y - 12);
                }
            }
        }

        this.nearNPC = null;
        if (loc.npcs) {
            loc.npcs.forEach(npc => {
                ctx.beginPath();
                ctx.arc(npc.x, npc.y, npc.radius, 0, Math.PI * 2);
                ctx.fillStyle = npc.color;
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = '11px sans-serif';
                ctx.fillText(npc.name, npc.x - 20, npc.y - 18);

                const dx = player.x - npc.x;
                const dy = player.y - npc.y;
                const talkRange = npc.talkRadius || 50;

                if (Math.hypot(dx, dy) < talkRange && npc.dialogueId) {
                    this.nearNPC = npc;
                    ctx.fillStyle = '#f1c40f';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText('Rozmawiaj [E]', npc.x - 28, npc.y + 28);
                }
            });
        }

        this.nearDoor = null;
        loc.doors.forEach(d => {
            if (d.isStair) {
                ctx.fillStyle = '#221208';
                ctx.fillRect(d.x, d.y, d.width, d.height);

                const stepCount = 6;
                const stepHeight = d.height / stepCount;
                for (let i = 0; i < stepCount; i++) {
                    ctx.fillStyle = i % 2 === 0 ? '#5c3517' : '#472811';
                    ctx.fillRect(d.x + 3, d.y + (i * stepHeight), d.width - 6, stepHeight - 1);
                }

                ctx.fillStyle = '#1a0d05';
                ctx.fillRect(d.x, d.y, 3, d.height);
                ctx.fillRect(d.x + d.width - 3, d.y, 3, d.height);
            } else {
                ctx.fillStyle = '#120904';
                ctx.fillRect(d.x - 2, d.y - 2, d.width + 4, d.height + 4);

                ctx.fillStyle = '#7a4a21';
                ctx.fillRect(d.x, d.y, d.width, d.height);

                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.arc(d.x + d.width - 6, d.y + d.height / 2, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }

            const dx = player.x - (d.x + d.width / 2);
            const dy = player.y - (d.y + d.height / 2);
            if (Math.hypot(dx, dy) < 45) {
                this.nearDoor = d;
                if (!d.isStair) {
                    ctx.fillStyle = '#f1c40f';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText(d.label, d.x - 15, d.y - 8);
                }
            }
        });
    },

    drawMinimap() {
        if (!minimapCtx) return;
        const loc = this.getCurrentData();
        const mw = minimapCanvas.width;
        const mh = minimapCanvas.height;

        minimapCtx.clearRect(0, 0, mw, mh);

        const miniZoom = 0.25;

        minimapCtx.save();
        minimapCtx.translate(mw / 2, mh / 2);
        minimapCtx.scale(miniZoom, miniZoom);
        minimapCtx.translate(-player.x, -player.y);

        minimapCtx.fillStyle = loc.bgColor;
        minimapCtx.fillRect(0, 0, loc.width, loc.height);

        if (this.currentLocation === 'kruczy_dol') {
            minimapCtx.fillStyle = CONFIG.COLOR_ROAD;
            minimapCtx.fillRect(0, 500, loc.width, 100);
            minimapCtx.fillRect(800, 580, 60, 200);
            minimapCtx.fillRect(1930, 580, 60, 200);
        }

        loc.buildings.forEach(b => {
            minimapCtx.fillStyle = '#8e44ad';
            minimapCtx.fillRect(b.x, b.y, b.width, b.height);
        });

        if (loc.npcs) {
            loc.npcs.forEach(npc => {
                minimapCtx.fillStyle = '#f1c40f';
                minimapCtx.beginPath();
                minimapCtx.arc(npc.x, npc.y, 10, 0, Math.PI * 2);
                minimapCtx.fill();
            });
        }

        if (questManager.target && questManager.target.location === this.currentLocation) {
            minimapCtx.fillStyle = '#e74c3c';
            minimapCtx.beginPath();
            minimapCtx.arc(questManager.target.x, questManager.target.y, 14, 0, Math.PI * 2);
            minimapCtx.fill();
        }

        if (this.currentLocation === 'kruczy_dol' && !player.isMounted) {
            minimapCtx.fillStyle = player.horse.color;
            minimapCtx.beginPath();
            minimapCtx.arc(player.horse.x, player.horse.y, 12, 0, Math.PI * 2);
            minimapCtx.fill();
        }

        minimapCtx.restore();

        minimapCtx.fillStyle = '#2ecc71';
        minimapCtx.strokeStyle = '#ffffff';
        minimapCtx.lineWidth = 2;
        minimapCtx.beginPath();
        minimapCtx.arc(mw / 2, mh / 2, 4, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.stroke();
    },

    drawFullMap() {
        const fullmapCanvas = document.getElementById('fullmapCanvas');
        if (!fullmapCanvas) return;
        const fCtx = fullmapCanvas.getContext('2d');
        const loc = this.getCurrentData();

        fCtx.clearRect(0, 0, fullmapCanvas.width, fullmapCanvas.height);

        const scale = Math.min(fullmapCanvas.width / loc.width, fullmapCanvas.height / loc.height) * 0.9;
        const offsetX = (fullmapCanvas.width - loc.width * scale) / 2;
        const offsetY = (fullmapCanvas.height - loc.height * scale) / 2;

        fCtx.fillStyle = '#120f17';
        fCtx.fillRect(0, 0, fullmapCanvas.width, fullmapCanvas.height);

        fCtx.fillStyle = '#1c1724';
        fCtx.fillRect(offsetX, offsetY, loc.width * scale, loc.height * scale);
        fCtx.strokeStyle = '#5a4529';
        fCtx.lineWidth = 2;
        fCtx.strokeRect(offsetX, offsetY, loc.width * scale, loc.height * scale);

        loc.buildings.forEach(b => {
            fCtx.fillStyle = '#2d2236';
            fCtx.fillRect(offsetX + b.x * scale, offsetY + b.y * scale, b.width * scale, b.height * scale);
            fCtx.strokeStyle = '#8c6d3f';
            fCtx.lineWidth = 1.5;
            fCtx.strokeRect(offsetX + b.x * scale, offsetY + b.y * scale, b.width * scale, b.height * scale);

            if (b.name) {
                fCtx.fillStyle = '#c5b396';
                fCtx.font = '12px Georgia';
                fCtx.fillText(b.name, offsetX + b.x * scale, offsetY + Math.max(12, b.y * scale - 6));
            }
        });

        const px = offsetX + player.x * scale;
        const py = offsetY + player.y * scale;

        fCtx.fillStyle = '#3498db';
        fCtx.beginPath();
        fCtx.arc(px, py, 7, 0, Math.PI * 2);
        fCtx.fill();
        fCtx.strokeStyle = '#ffffff';
        fCtx.lineWidth = 2;
        fCtx.stroke();

        if (questManager.target && questManager.target.location === this.currentLocation) {
            const tx = offsetX + questManager.target.x * scale;
            const ty = offsetY + questManager.target.y * scale;

            fCtx.fillStyle = '#f1c40f';
            fCtx.beginPath();
            fCtx.arc(tx, ty, 8, 0, Math.PI * 2);
            fCtx.fill();

            fCtx.fillStyle = '#ffffff';
            fCtx.font = 'bold 13px sans-serif';
            fCtx.fillText("★ CEL Zadania", tx + 14, ty + 4);
        }
    },

    checkCollision(x, y, radius) {
        const loc = this.getCurrentData();
        if (x - radius < 0 || x + radius > loc.width || y - radius < 0 || y + radius > loc.height) return true;

        for (let b of loc.buildings) {
            if (x + radius > b.x && x - radius < b.x + b.width && y + radius > b.y && y - radius < b.y + b.height) {
                return true;
            }
        }
        return false;
    },

    tryInteract() {
        if (this.nearNPC) {
            dialogueManager.start(this.nearNPC.dialogueId);
            return true;
        }
        const nearBag = LootManager.getNearBag(player);
        if (nearBag) {
            lootBagSystem.open(nearBag);
            return true;
        }
        if (this.nearBed) {
            player.startSleep();
            return true;
        }

        if (this.nearDoor) {
            const door = this.nearDoor;

            if (door.keyRequired) {
                if (player.hasItem(door.keyRequired)) {
                    this.currentLocation = door.targetLocation;
                    player.x = door.spawnX;
                    player.y = door.spawnY;
                    showToast("Otworzyłeś drzwi kluczem!");
                } else {
                    showToast(door.message || "Zamknięte!");
                }
                return true;
            }

            if (door.targetLocation) {
                if (player.isMounted) {
                    player.isMounted = false;
                    player.horse.isMounted = false;
                    player.horse.x = player.x;
                    player.horse.y = player.y;
                }
                this.currentLocation = door.targetLocation;
                player.x = door.spawnX;
                player.y = door.spawnY;

                // NAPRAWA: Wywołanie hooka onEnter dla nowej lokacji (aktywacja spawnu i cutscenki)
                const currentData = this.getCurrentData();
                if (currentData && typeof currentData.onEnter === 'function') {
                    currentData.onEnter();
                }
                return true;
            }
        }
        return false;
    }
};
const camera = {
    x: 0,
    y: 0,
    follow(target, mapW, mapH) {
        const viewW = CONFIG.CANVAS_WIDTH / CONFIG.ZOOM;
        const viewH = CONFIG.CANVAS_HEIGHT / CONFIG.ZOOM;

        this.x = Math.max(0, Math.min(target.x - viewW / 2, mapW - viewW));
        this.y = Math.max(0, Math.min(target.y - viewH / 2, mapH - viewH));
    }
};
const timeSystem = {
    isNight: true,
    setDay() {
        this.isNight = false;
        const timeElem = document.getElementById('time-display');
        if (timeElem) {
            timeElem.innerText = "Dzień ☀️";
            timeElem.style.color = "#f39c12";
        }
        gameMap.spawnVillageNPCs();
    },
    setNight() {
        this.isNight = true;
        const timeElem = document.getElementById('time-display');
        if (timeElem) {
            timeElem.innerText = "Noc 🌙";
            timeElem.style.color = "#3498db";
        }
        gameMap.spawnVillageNPCs();
    }
};