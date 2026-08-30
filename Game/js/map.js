// ==========================================
// MAP.JS - BEZSZWOWA MAPA Z POLANAMI I KLASTRAI ZIÓŁ
// ==========================================
const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;

// Funkcja generująca zioła w naturalnych klastrach (1-3 sztuki w kępie)
function createHerbCluster(clusterId, type, centerX, centerY) {
    const herbs = [];
    const rnd = Math.random();
    let count = 1;
    if (rnd > 0.90) count = 3;       // 10% szans na 3 sztuki
    else if (rnd > 0.65) count = 2;  // 25% szans na 2 sztuki

    for (let i = 0; i < count; i++) {
        const offsetX = (Math.random() - 0.5) * 35;
        const offsetY = (Math.random() - 0.5) * 35;
        herbs.push({
            id: `${clusterId}_${i}`,
            type: type,
            x: centerX + offsetX,
            y: centerY + offsetY,
            picked: false
        });
    }
    return herbs;
}

const camera = {
    x: 0,
    y: 0,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,

    resize() {
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;
    },

    follow(target, mapWidth = gameMap.getCurrentData().width, mapHeight = gameMap.getCurrentData().height) {
        this.resize();
        const zoom = CONFIG.ZOOM || 1;

        const targetX = target.x !== undefined ? target.x : target;
        const targetY = target.y !== undefined ? target.y : 0;

        this.x = targetX - (this.viewportWidth / (2 * zoom));
        this.y = targetY - (this.viewportHeight / (2 * zoom));

        const viewW = this.viewportWidth / zoom;
        const viewH = this.viewportHeight / zoom;

        if (mapWidth > viewW) {
            this.x = Math.max(0, Math.min(this.x, mapWidth - viewW));
        } else {
            this.x = (mapWidth - viewW) / 2;
        }

        if (mapHeight > viewH) {
            this.y = Math.max(0, Math.min(this.y, mapHeight - viewH));
        } else {
            this.y = (mapHeight - viewH) / 2;
        }
    },

    update(targetX, targetY, mapWidth, mapHeight) {
        this.follow({ x: targetX, y: targetY }, mapWidth, mapHeight);
    },

    isVisible(x, y, w = 0, h = 0, margin = 100) {
        const zoom = CONFIG.ZOOM || 1;
        const viewLeft = this.x - margin;
        const viewRight = this.x + (this.viewportWidth / zoom) + margin;
        const viewTop = this.y - margin;
        const viewBottom = this.y + (this.viewportHeight / zoom) + margin;

        return (x + w) >= viewLeft && x <= viewRight && (y + h) >= viewTop && y <= viewBottom;
    }
};

window.addEventListener('resize', () => camera.resize());

const gameMap = {
    currentLocation: 'kruczy_dol',
    nearDoor: null,
    nearNPC: null,
    nearHerb: null,
    nearBed: false,
    lastAreaBanner: null,

    registerEntity(locationId, layerName, entity) {
        const targetLocation = this.locations[locationId] || this.getCurrentData();
        if (!targetLocation.renderLayers) targetLocation.renderLayers = {};
        if (!targetLocation.renderLayers[layerName]) targetLocation.renderLayers[layerName] = [];
        targetLocation.renderLayers[layerName].push(entity);
        return entity;
    },

    renderLayerList(ctx, list, drawer) {
        if (!Array.isArray(list)) return;
        list.forEach((item) => {
            if (!item) return;
            if (typeof drawer === 'function') drawer(item, ctx);
        });
    },

    getRenderLayer(loc, layerName, fallback = []) {
        if (!loc || !loc.renderLayers) return fallback;
        const layer = loc.renderLayers[layerName];
        return Array.isArray(layer) ? layer : fallback;
    },

    ruinZone: {
        x: 2230,
        y: 1075,
        width: 520,
        height: 580,
        bossSpawnX: 2500,
        bossSpawnY: 1375,
        bossName: 'Widmo Rycerza'
    },

    isInRuins(x, y) {
        const z = this.ruinZone;
        return x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height;
    },

    isNearRuins(x, y, margin = 120) {
        const z = this.ruinZone;
        return x >= z.x - margin && x <= z.x + z.width + margin && y >= z.y - margin && y <= z.y + z.height + margin;
    },

    updateRuinsState(player) {
        const inside = this.isInRuins(player.x, player.y);
        const boss = enemyManager && enemyManager.enemies ? enemyManager.enemies.find(e => e && e.type === 'ruin_guardian') : null;

        if (!this.ruinBossDefeated && inside && !boss) {
            const guardian = new Enemy({
                id: 'ruin_guardian_01',
                type: 'ruin_guardian',
                x: this.ruinZone.bossSpawnX,
                y: this.ruinZone.bossSpawnY,
                homeX: this.ruinZone.bossSpawnX,
                homeY: this.ruinZone.bossSpawnY,
                aggroRadius: 420,
                deaggroRadius: 620
            });
            guardian.name = 'Widmo Rycerza';
            guardian.battleActive = true;
            guardian.pursuitTimer = 0;
            guardian.respawnTimer = 0;
            enemyManager.enemies.push(guardian);
            if (typeof showToast === 'function') showToast('Widmo rycerza budzi się w ruinach!');
        }

        if (boss && !inside && boss.state === 'RETURNING') {
            boss.pursuitTimer = (boss.pursuitTimer || 0) + 0.016;
            if ((boss.pursuitTimer || 0) > 20) {
                boss.hp = boss.maxHp;
                boss.isAlive = false;
                boss.state = 'IDLE';
                boss.battleActive = false;
                boss.pursuitTimer = 0;
                this.ruinBossDefeated = false;
            }
        }

        if (boss && !boss.isAlive && !this.ruinBossDefeated) {
            this.ruinBossDefeated = true;
            this.ruinBossRespawnTimer = 20;
            if (typeof showToast === 'function') showToast('Widmo rycerza padło!');
        }

        if (this.ruinBossDefeated) {
            this.ruinBossRespawnTimer = Math.max(0, (this.ruinBossRespawnTimer || 0) - 0.016);
            if (this.ruinBossRespawnTimer <= 0) {
                this.ruinBossDefeated = false;
                if (boss) {
                    boss.hp = boss.maxHp;
                    boss.isAlive = true;
                    boss.state = 'IDLE';
                    boss.battleActive = false;
                }
            }
        }
    },

    locations: {
        kruczy_dol: {
            name: 'Kruczy Dół',
            width: 5500, 
            height: 3500, 
            bgColor: CONFIG.COLOR_GRASS,
            
            // Polany w lesie z jaśniejszym podłożem
            clearings: [
                { x: 3100, y: 900, radius: 240 },
                { x: 4200, y: 1500, radius: 200 }
            ],

            buildings: [
                { id: 'tavern', name: 'Karczma Pod Krukiem', x: 700, y: 400, width: 260, height: 180, color: '#5c3a21' },
                { id: 'herbalist_hut', name: 'Chatka Zielarza', x: 980, y: 310, width: 170, height: 150, color: '#496b42' },
                { id: 'blacksmith', name: 'Kuźnia', x: 1200, y: 700, width: 160, height: 130, color: '#4a4a4a' },
                { id: 'mill', name: 'Młyn', x: 1700, y: 300, width: 140, height: 140, color: '#6e5438' },
                { id: 'nicolas_house', name: 'Chata Nicolasa', x: 1900, y: 480, width: 120, height: 100, color: '#4d3319' },
                { id: 'ruin_wall_left', x: 2320, y: 1120, width: 30, height: 290, color: '#655c57' },
                { id: 'ruin_wall_back', x: 2320, y: 1120, width: 250, height: 30, color: '#655c57' },
                { id: 'ruin_wall_right', x: 2660, y: 1200, width: 30, height: 210, color: '#655c57' },
                { id: 'ruin_wall_bottom', x: 2360, y: 1540, width: 260, height: 26, color: '#655c57' },
            ],

            doors: [
                { x: 810, y: 580, width: 40, height: 20, targetLocation: 'karczma_wnetrze', spawnX: 400, spawnY: 480, label: 'Wejdź [E]' },
                { x: 1040, y: 455, width: 40, height: 20, targetLocation: 'chatka_zielarza', spawnX: 260, spawnY: 420, label: 'Wejdź do chatki [E]' },
                { x: 1290, y: 820, width: 40, height: 20, targetLocation: 'kuznia_wnetrze', spawnX: 250, spawnY: 440, label: 'Wejdź do kuźni [E]' },
                { x: 1940, y: 580, width: 40, height: 20, targetLocation: 'nicolas_wnetrze', spawnX: 400, spawnY: 480, label: 'Wejdź [E]' },
                { x: 1750, y: 440, width: 40, height: 20, targetLocation: 'mlyn_wnetrze', spawnX: 1220, spawnY: 1900, label: 'Stary Młyn [E]' }
            ],

            chests: [{
                id: 'ruins_chest',
                x: 2408,
                y: 1198,
                width: 68,
                height: 36,
                opened: false,
                label: 'Skrzynia z ruin [E]',
                items: [
                    { id: 'miecz_rozpadlina', name: 'Miecz Rozpadlina', icon: '🗡️', type: 'weapon', weight: 5.2, damage: 165, critChance: 0.14, footprint: { width: 1, height: 2 }, stats: 'Obrażenia: 165', count: 1 },
                    { id: 'ruin_steel', name: 'Ruina Stal', icon: '🪓', type: 'material', weight: 1.4, count: 3 },
                    { id: 'moonsteel_scrap', name: 'Odcinek Księżycowej Stali', icon: '🌙', type: 'material', weight: 1.1, count: 2 },
                    { id: 'sun_amber', name: 'Słoneczny Bursztyn', icon: '🌞', type: 'material', weight: 0.3, count: 2 },
                    { id: 'runic_clay', name: 'Runiczna Glina', icon: '🟫', type: 'material', weight: 0.7, count: 2 }
                ]
            }],

            // Zioła generowane blisko obrzeża lasu oraz na polanach w pęczkach 1-3 szt.
            herbs: [
                ...createHerbCluster('c1', 'lecznicze_ziele', 2500, 550),
                ...createHerbCluster('c2', 'jagody', 2650, 1100),
                ...createHerbCluster('c3', 'lecznicze_ziele', 3100, 900),  // Polana 1
                ...createHerbCluster('c4', 'jagody', 3150, 880),   // Polana 1
                ...createHerbCluster('c5', 'jagody', 3600, 600),
                ...createHerbCluster('c6', 'lecznicze_ziele', 4200, 1500), // Polana 2
                ...createHerbCluster('c7', 'lecznicze_ziele', 4700, 800)
            ],
            npcs: []
        },
        chatka_zielarza: {
            name: 'Chatka Zielarza',
            width: 600, height: 500, bgColor: CONFIG.COLOR_INTERIOR,
            buildings: [
                { id: 'zielarz_stol', name: 'Stół Zielarza', x: 180, y: 120, width: 160, height: 100, color: '#483521' },
                { id: 'zielarz_polka', name: 'Półki z ziołami', x: 380, y: 140, width: 120, height: 120, color: '#3b5b2d' }
            ],
            doors: [
                { x: 260, y: 470, width: 80, height: 20, targetLocation: 'kruczy_dol', spawnX: 1020, spawnY: 520, label: 'Wyjdź z chatki [E]' }
            ],
            npcs: [{
                id: 'zielarka',
                name: 'Mira Zielarka',
                x: 320,
                y: 240,
                radius: 14,
                color: '#16a085',
                dialogueId: 'zielarz_intro',
                talkRadius: 110
            }]
        },
        kuznia_wnetrze: {
            name: 'Kuźnia',
            width: 700, height: 520, bgColor: CONFIG.COLOR_INTERIOR,
            buildings: [
                { id: 'forge', name: 'Piec kuźni', x: 120, y: 120, width: 180, height: 140, color: '#3f3a3a' },
                { id: 'anvil', name: 'Kowadło', x: 390, y: 160, width: 110, height: 90, color: '#6c5c4a' }
            ],
            doors: [
                { x: 290, y: 480, width: 90, height: 20, targetLocation: 'kruczy_dol', spawnX: 1290, spawnY: 845, label: 'Wyjdź z kuźni [E]' }
            ],
            npcs: [{
                id: 'kowal',
                name: 'Tomasz Kowal',
                x: 430,
                y: 300,
                radius: 14,
                color: '#7f8c8d',
                dialogueId: 'kowal_intro',
                talkRadius: 120
            }]
        },
        karczma_wnetrze: {
            name: 'Karczma Pod Krukiem',
            width: 800, height: 600, bgColor: CONFIG.COLOR_INTERIOR,
            buildings: [
                { id: 'bar', name: 'Lada Karczmarza', x: 300, y: 150, width: 200, height: 50, color: '#2b170a' }
            ],
            doors: [
                { x: 380, y: 520, width: 40, height: 20, targetLocation: 'kruczy_dol', spawnX: 830, spawnY: 620, label: 'Wyjdź [E]' },
                { x: 710, y: 100, width: 50, height: 70, targetLocation: 'karczma_pietro', spawnX: 85, spawnY: 310, isStair: true, dir: 'w' ,label: 'Wejdż po schodach [E]'}
            ],
            npcs: [{
                id: 'innkeeper', name: 'Karczmarz Barnaba', x: 400, y: 115,
                radius: 14, color: '#e74c3c', dialogueId: 'karczmarz_intro', talkRadius: 110
            }]
        },
        karczma_pietro: {
            name: 'Piętro Karczmy',
            width: 1000, height: 400, bgColor: CONFIG.COLOR_CORRIDOR,
            buildings: [
                { id: 'wall_top', name: '', x: 0, y: 0, width: 1000, height: 120, color: '#23150b' }
            ],
            doors: [
                { x: 60, y: 220, width: 50, height: 70, targetLocation: 'karczma_wnetrze', spawnX: 735, spawnY: 190, isStair: true, dir: 's',label: 'Zejdż po schodach [E]' },
                { x: 250, y: 110, width: 40, height: 20, keyRequired: 'room_1', label: 'Pokój #1 [E]', message: 'Pokój #1: Zamknięte.' },
                { x: 420, y: 110, width: 40, height: 20, keyRequired: 'room_2', label: 'Pokój #2 [E]', message: 'Pokój #2: Słychać chrapanie...' },
                { x: 590, y: 110, width: 40, height: 20, keyRequired: 'room_3', label: 'Pokój #3 [E]', message: 'Pokój #3: Zamknięte.' },
                { x: 780, y: 110, width: 40, height: 20, keyRequired: 'room_key', targetLocation: 'pokoj_gracza', spawnX: 300, spawnY: 420, label: 'Pokój #4 [E]', message: 'Pokój #4 jest zamknięty na klucz!' }
            ],
            npcs: []
        },
        pokoj_gracza: {
            name: 'Pokój Gracza',
            width: 600, height: 500, bgColor: CONFIG.COLOR_INTERIOR,
            buildings: [
                { id: 'bed', name: 'Wygodne Łóżko', x: 100, y: 100, width: 100, height: 160, color: '#8e44ad' }
            ],
            doors: [
                { x: 280, y: 440, width: 40, height: 20, targetLocation: 'karczma_pietro', spawnX: 780, spawnY: 150, label: 'Wyjdź na korytarz [E]' }
            ],
            npcs: []
        },
        mlyn_wnetrze: {
            name: 'Wnętrze Młyna',
            width: 1200, height: 900, bgColor: '#3a271d',
            buildings: [
                { id: 'mlyn_mecz', name: 'Mechanizm Młyński', x: 150, y: 100, width: 220, height: 220, color: '#271911' },
                { id: 'worki_maka', name: 'Stos worków z mąką', x: 850, y: 120, width: 180, height: 100, color: '#8a7967' },
                { id: 'stol_mlynarza', name: 'Stół Stolarski', x: 880, y: 600, width: 160, height: 90, color: '#573d2a' }
            ],
            doors: [
                { x: 580, y: 870, width: 80, height: 20, targetLocation: 'wioska_mlyn', spawnX: 1250, spawnY: 1880, label: 'Wyjście na zewnątrz [E]' },
                { x: 100, y: 400, width: 50, height: 30, targetLocation: 'mlyn_piwnica', spawnX: 150, spawnY: 700, label: 'Zejście do Piwnicy [E]' }
            ]
        },
        mlyn_piwnica: {
            name: 'Piwnica Młyna',
            width: 1000, height: 800, bgColor: '#120d0a',
            buildings: [
                { id: 'stare_skrzynie', name: 'Rupiecie i Skrzynie', x: 700, y: 150, width: 180, height: 120, color: '#2b1f17' }
            ],
            doors: [
                { x: 130, y: 750, width: 60, height: 20, targetLocation: 'mlyn_wnetrze', spawnX: 120, spawnY: 460, label: 'Wyjście na górę [E]' }
            ],
            chests: [{
                id: 'mlyn_hidden_chest',
                x: 340,
                y: 610,
                width: 62,
                height: 42,
                opened: false,
                label: 'Skrzynia [E]',
                items: [
                    { id: 'iron_ore', name: 'Ruda Żelaza', icon: '⛏️', type: 'material', weight: 1.5, count: 2 },
                    { id: 'herb_green', name: 'Zielone Zioło', icon: '🌱', type: 'misc', weight: 0.2, count: 2 },
                    { id: 'woda_butelka', name: 'Woda w Butelce', icon: '🧴', type: 'misc', weight: 0.5, count: 1 }
                ]
            }],
            paperLoot: {
                id: 'mlyn_list',
                x: 640,
                y: 420,
                radius: 18,
                collected: false,
                itemId: 'mlyn_secret_letter',
                label: 'Zagubiony list [E]',
                item: {
                    id: 'mlyn_secret_letter',
                    name: 'List z Młyna',
                    icon: '📜',
                    type: 'document',
                    weight: 0.1,
                    stats: 'Zmęczony, zmięty list znaleziony w piwnicy',
                    content: "<b>Do Arkelasa</b><br><br>Jeśli czytasz ten list, to znaczy, że ktoś już odnalazł to miejsce. Młyn nie był martwy przez przypadek. W podziemiach kryje się nie tylko zboże, ale i tajemne zapiski. Po południu przychodzą zbiry, bo ktoś z miasta lub z zamku chce zakryć ślady. Nie ufaj nikomu, kto mówi, że to tylko przypadek. Jeśli wyjdziesz żywy, zanieś ten list do karczmy albo do Nicolasa. <br><br>— Zapiski z młyna",
                    monologueId: 'read_mill_list',
                    questTrigger: { questId: 'Q1', step: 7 }
                }
            },
            onEnter() {
                const z1 = new Enemy({ id: 'z1', type: 'z1', x: 500, y: 350 });
                Object.assign(z1, {
                    nonLethal: true, isBasementThug: true, isHostile: false
                });

                const z2 = new Enemy({ id: 'z2', type: 'z2', x: 580, y: 350, name: 'Zbir Ciężki' });
                Object.assign(z2, {
                    nonLethal: true, isBasementThug: true, isHostile: false
                });

                enemyManager.enemies = [z1, z2];
                cutsceneManager.startBasementIntro();
            }
        }
    },

    getCurrentData() { 
        return this.locations[this.currentLocation] || this.locations['kruczy_dol']; 
    },

    getLocationBannerArt(locationName) {
        const artMap = {
            'Kruczy Dół': 'media/banners/kruczy-dol.png',
            'Ruiny': 'media/banners/ruiny.png',
            'Chatka Zielarza': 'media/banners/chatka-zielarza.png',
            'Kuźnia': 'media/banners/kuznia.png',
            'Karczma Pod Krukiem': 'media/banners/karczma.png',
            'Młyn': 'media/banners/mlyn.png'
        };
        return artMap[locationName] || null;
    },

    setLocation(locationId, options = {}) {
        if (!this.locations[locationId]) return false;
        this.currentLocation = locationId;
        if (options.showBanner && typeof showLocationBanner === 'function') {
            const label = this.getCurrentData()?.name || locationId;
            this.lastAreaBanner = label;
            showLocationBanner(label, { art: this.getLocationBannerArt(label) });
        }
        return true;
    },

    updateAreaBanner(player) {
        if (!player) return;

        let bannerText = this.getCurrentData()?.name || this.currentLocation;
        if (this.currentLocation === 'kruczy_dol' && (this.isInRuins(player.x, player.y) || this.isNearRuins(player.x, player.y))) {
            bannerText = 'Ruiny';
        }

        if (this.lastAreaBanner !== bannerText && typeof showLocationBanner === 'function') {
            this.lastAreaBanner = bannerText;
            showLocationBanner(bannerText, { art: this.getLocationBannerArt(bannerText) });
        }
    },

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

    spawnForestEnemies() {
        if (typeof enemyManager === 'undefined') return;
        const wildEnemies = [];

        // Wilki i jelenie rozmieszczone bliżej w lesie
        for (let i = 0; i < 3; i++) {
            wildEnemies.push(new Enemy({
                id: 'wolf_s_' + i, type: 'wilk',
                x: 3500 + Math.random() * 120, y: 1600 + Math.random() * 120
            }));
        }
        for (let i = 0; i < 3; i++) {
            wildEnemies.push(new Enemy({
                id: 'deer_' + i, type: 'jelen',
                x: 3000 + Math.random() * 200, y: 800 + Math.random() * 200
            }));
        }

        enemyManager.enemies = wildEnemies;
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

        const drawTerrain = () => {
            ctx.fillStyle = loc.bgColor;
            ctx.fillRect(0, 0, loc.width, loc.height);

            if (this.currentLocation === 'kruczy_dol') {
                ctx.fillStyle = '#111e11';
                ctx.beginPath();
                ctx.moveTo(2300, 0);

                for (let y = 0; y <= loc.height; y += 80) {
                    const waveX = 2300 + Math.sin(y * 0.008) * 110 + (y % 160 === 0 ? 40 : -40);
                    ctx.lineTo(waveX, y);
                }
                ctx.lineTo(loc.width, loc.height);
                ctx.lineTo(loc.width, 0);
                ctx.closePath();
                ctx.fill();

                if (loc.clearings) {
                    loc.clearings.forEach(c => {
                        if (!camera.isVisible(c.x - c.radius, c.y - c.radius, c.radius * 2, c.radius * 2)) return;
                        const grad = ctx.createRadialGradient(c.x, c.y, 20, c.x, c.y, c.radius);
                        grad.addColorStop(0, '#1d331d');
                        grad.addColorStop(1, '#111e11');
                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
                        ctx.fill();
                    });
                }

                if (camera.isVisible(0, 500, 2300, 100)) {
                    ctx.fillStyle = CONFIG.COLOR_ROAD;
                    ctx.fillRect(0, 500, 2300, 100);
                }
                if (camera.isVisible(800, 580, 60, 200)) {
                    ctx.fillStyle = CONFIG.COLOR_ROAD;
                    ctx.fillRect(800, 580, 60, 200);
                }
                if (camera.isVisible(1930, 580, 60, 200)) {
                    ctx.fillStyle = CONFIG.COLOR_ROAD;
                    ctx.fillRect(1930, 580, 60, 200);
                }
            }
        };

        const drawStructures = () => {
            loc.buildings.forEach(b => {
                if (!camera.isVisible(b.x, b.y, b.width, b.height)) return;

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
        };

        const drawHerbs = () => {
            this.nearHerb = null;
            if (!loc.herbs) return;

            loc.herbs.forEach(herb => {
                if (herb.picked) return;
                if (!camera.isVisible(herb.x - 10, herb.y - 10, 20, 20)) return;

                ctx.fillStyle = herb.type === 'lecznicze_ziele' ? '#2ecc71' : '#9b59b6';
                ctx.beginPath();
                ctx.arc(herb.x, herb.y, 6, 0, Math.PI * 2);
                ctx.fill();

                const dist = Math.hypot(player.x - herb.x, player.y - herb.y);
                if (dist < 40) {
                    this.nearHerb = herb;
                    ctx.fillStyle = '#f1c40f';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText('Zabierz [E]', herb.x - 25, herb.y - 12);
                }
            });
        };

        const drawBed = () => {
            this.nearBed = false;
            if (this.currentLocation !== 'pokoj_gracza') return;

            const bed = loc.buildings.find(b => b.id === 'bed');
            if (!bed) return;

            const dist = Math.hypot(player.x - (bed.x + bed.width / 2), player.y - (bed.y + bed.height / 2));
            if (dist < 80) {
                this.nearBed = true;
                ctx.fillStyle = '#f1c40f';
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText('Połóż się spać [E]', bed.x, bed.y - 12);
            }
        };

        const drawChests = () => {
            if (!loc.chests) return;
            loc.chests.forEach(chest => {
                if (chest.opened) return;
                const chestX = chest.x + chest.width / 2;
                const chestY = chest.y + chest.height / 2;
                if (!camera.isVisible(chest.x, chest.y, chest.width, chest.height)) return;

                ctx.fillStyle = '#5b3a1d';
                ctx.fillRect(chest.x, chest.y, chest.width, chest.height);
                ctx.fillStyle = '#8b5e34';
                ctx.fillRect(chest.x + 6, chest.y + 6, chest.width - 12, chest.height - 12);
                ctx.fillStyle = '#26170d';
                ctx.fillRect(chest.x + chest.width / 2 - 5, chest.y + 6, 10, 12);

                const dist = Math.hypot(player.x - chestX, player.y - chestY);
                if (dist < 55) {
                    ctx.fillStyle = '#f1c40f';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText(chest.label || 'Skrzynia [E]', chest.x - 18, chest.y - 12);
                }
            });
        };

        const drawNPCs = () => {
            this.nearNPC = null;
            if (!loc.npcs) return;

            loc.npcs.forEach(npc => {
                if (!camera.isVisible(npc.x - npc.radius, npc.y - npc.radius, npc.radius * 2, npc.radius * 2)) return;

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
        };

        const drawDoors = () => {
            this.nearDoor = null;
            if (!loc.doors) return;

            loc.doors.forEach(d => {
                if (!camera.isVisible(d.x, d.y, d.width, d.height)) return;

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
                    if (d.label) {
                        ctx.fillStyle = '#f1c40f';
                        ctx.font = 'bold 12px sans-serif';
                        ctx.fillText(d.label, d.x - 15, d.y - 8);
                    }
                }
            });
        };

        const renderOrder = [
            drawTerrain,
            () => this.renderLayerList(ctx, this.getRenderLayer(loc, 'backdrop'), (item) => item.draw && item.draw(ctx, this, player)),
            drawStructures,
            () => this.renderLayerList(ctx, this.getRenderLayer(loc, 'flora'), (item) => item.draw && item.draw(ctx, this, player)),
            drawHerbs,
            drawBed,
            drawChests,
            drawNPCs,
            drawDoors,
            () => this.renderLayerList(ctx, this.getRenderLayer(loc, 'front'), (item) => item.draw && item.draw(ctx, this, player)),
        ];

        renderOrder.forEach(layerDraw => layerDraw());

        if (this.currentLocation === 'kruczy_dol' && player.x > 2300) {
            ctx.fillStyle = 'rgba(5, 15, 5, 0.22)';
            ctx.fillRect(camera.x, camera.y, camera.viewportWidth, camera.viewportHeight);
        }
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
            minimapCtx.fillStyle = '#111e11';
            minimapCtx.fillRect(2300, 0, loc.width - 2300, loc.height);

            minimapCtx.fillStyle = CONFIG.COLOR_ROAD;
            minimapCtx.fillRect(0, 500, 2300, 100);
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
    const candidates = [];

    if (this.locations[this.currentLocation].herbs) {
        this.locations[this.currentLocation].herbs.forEach(herb => {
            if (!herb.picked) {
                const dist = Math.hypot(player.x - herb.x, player.y - herb.y);
                if (dist < 40) {
                    candidates.push({ type: 'herb', dist: dist, obj: herb });
                }
            }
        });
    }

    if (this.locations[this.currentLocation].npcs) {
        this.locations[this.currentLocation].npcs.forEach(npc => {
            const dist = Math.hypot(player.x - npc.x, player.y - npc.y);
            const talkRange = npc.talkRadius || 50;
            if (dist < talkRange && npc.dialogueId) {
                candidates.push({ type: 'npc', dist: dist, obj: npc });
            }
        });
    }

    const loc = this.getCurrentData();
    if (loc.chests) {
        loc.chests.forEach(chest => {
            if (chest.opened) return;
            const chestCenterX = chest.x + chest.width / 2;
            const chestCenterY = chest.y + chest.height / 2;
            const dist = Math.hypot(player.x - chestCenterX, player.y - chestCenterY);
            if (dist < 55) candidates.push({ type: 'chest', dist, obj: chest });
        });
    }
    if (loc.paperLoot && !loc.paperLoot.collected) {
        const noteDist = Math.hypot(player.x - loc.paperLoot.x, player.y - loc.paperLoot.y);
        if (noteDist < 36) {
            candidates.push({ type: 'paper', dist: noteDist, obj: loc.paperLoot });
        }
    }

    loc.doors.forEach(d => {
        const doorCenterX = d.x + d.width / 2;
        const doorCenterY = d.y + d.height / 2;
        const dist = Math.hypot(player.x - doorCenterX, player.y - doorCenterY);
        if (dist < 45) {
            candidates.push({ type: 'door', dist: dist, obj: d });
        }
    });

    if (this.currentLocation === 'pokoj_gracza') {
        const bed = loc.buildings.find(b => b.id === 'bed');
        if (bed) {
            const dist = Math.hypot(player.x - (bed.x + bed.width / 2), player.y - (bed.y + bed.height / 2));
            if (dist < 80) {
                candidates.push({ type: 'bed', dist: dist, obj: bed });
            }
        }
    }

    if (this.currentLocation === 'kruczy_dol' && !player.isMounted && player.horse) {
        const dist = Math.hypot(player.x - player.horse.x, player.y - player.horse.y);
        if (dist < 60) {
            candidates.push({ type: 'horse', dist: dist, obj: player.horse });
        }
    }

    if (candidates.length === 0) return false;

    candidates.sort((a, b) => a.dist - b.dist);
    const closest = candidates[0];

    switch (closest.type) {
        case 'herb':
            const itemData = ITEMS_DB[closest.obj.type];
            if (player.addItem(closest.obj.type, itemData.name, itemData.icon, itemData.type, itemData.weight, itemData.stats)) {
                closest.obj.picked = true;
                return true;
            }
            return false;

        case 'paper': {
            const paper = closest.obj;
            const item = paper.item || {
                id: 'mlyn_secret_letter',
                name: 'List z Młyna',
                icon: '📜',
                type: 'document',
                content: 'Zagubiony list z młyna.'
            };
            if (player.addItem(item.id, item.name, item.icon, item.type, item.weight || 0.1, item.stats || '', 1)) {
                paper.collected = true;
                questManager.completeObjective('Q1', 6);
                documentViewer.open(item.name, item.content, item.monologueId || null, item.questTrigger || { questId: 'Q1', step: 7 });
                showToast('Podnosisz zmięty list z młyna!');
                return true;
            }
            return false;
        }

        case 'chest': {
            const chest = closest.obj;
            if (!chest) return false;
            chest.opened = true;
            if (typeof chestSystem !== 'undefined') {
                chestSystem.open(chest);
            }
            return true;
        }

        case 'npc':
            dialogueManager.start(closest.obj.dialogueId);
            return true;

        case 'horse':
            player.isMounted = true;
            player.horse.isMounted = true;
            showToast('Wsiadłeś na konia!');
            return true;

        case 'bed':
            player.startSleep();
            return true;

        case 'door':
            const door = closest.obj;
            if (door.keyRequired) {
                if (player.hasItem(door.keyRequired)) {
                    this.setLocation(door.targetLocation, { showBanner: true });
                    player.x = door.spawnX;
                    player.y = door.spawnY;
                    if (door.targetLocation === 'mlyn_wnetrze' && typeof questManager !== 'undefined') {
                        questManager.completeObjective('Q1', 4);
                    }
                    showToast('Otworzyłeś drzwi!');
                } else {
                    showToast(door.message || 'Zamknięte!');
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
                this.setLocation(door.targetLocation, { showBanner: true });
                player.x = door.spawnX;
                player.y = door.spawnY;

                if (door.targetLocation === 'mlyn_wnetrze' && typeof questManager !== 'undefined') {
                    questManager.completeObjective('Q1', 4);
                }

                const targetData = this.getCurrentData();
                if (typeof targetData.onEnter === 'function') {
                    targetData.onEnter();
                }

                return true;
            }
            return false;
    }
    return false;
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