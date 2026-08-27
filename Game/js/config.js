const CONFIG = {
    CANVAS_WIDTH: window.innerWidth,
    CANVAS_HEIGHT: window.innerHeight,
    WORLD_WIDTH: 2400,
    WORLD_HEIGHT: 1600,
    ZOOM: 1.5,
    walk_speed: 1.5,
    run_speed: 2.5,
    horse_speed: 4,
    COLOR_GRASS: '#1b2e1b',
    COLOR_ROAD: '#3a3225',
    COLOR_INTERIOR: '#4a2e18',
    COLOR_CORRIDOR: '#362213',
    COLOR_NIGHT_FILTER: 'rgba(10, 15, 35, 0.60)'
};

let gameState = 'EXPLORATION';

const ENEMY_CONFIG = {
    zbir_lekki: {
        name: 'Zbir',
        maxHp: 120,            // Zmniejszono z 1080 (pada na 3-4 ciosy)
        speed: 45,             // Zmniejszono z 85 px/s (daje czas na odejście/pozyjonowanie)
        damage: 12,
        radius: 12,
        color: '#e74c3c',
        attackRange: 38,
        attackCooldown: 3.0,   // 3 sekundy przerwy po ataku
        rewardGold: 15
    },
    zbir_ciezki: {
        name: 'Osiłek',
        maxHp: 220,            // Zmniejszono z 1780
        speed: 30,             // Zmniejszono z 55 px/s
        damage: 20,
        radius: 16,
        color: '#c0392b',
        attackRange: 45,
        attackCooldown: 4.0,   // 4 sekundy przerwy po ataku
        rewardGold: 35
    },
};

const start_items = {
    'simple_sword': {
        id: 'simple_sword',
        name: 'Prosty Miecz',
        type: 'weapon',
        icon: '⚔️',
        damage: 15,
        weight: 2.5,
        value: 35,
        stats: 'Obrażenia: +15',
        description: 'Zwykły, lekko wyświechtany miecz stalowy.'
    },
    'leather_helmet': {
        id: 'leather_helmet',
        name: 'Skórzany Czepiec',
        type: 'head',
        icon: '🪖',
        armor: 2,
        weight: 1.0,
        value: 15,
        stats: 'Pancerz: +2',
        description: 'Prosta czapka z utwardzanej skóry.'
    },
    'leather_chest': {
        id: 'leather_chest',
        name: 'Skórzana Przeszywanica',
        type: 'chest',
        icon: '🥼',
        armor: 5,
        weight: 3.5,
        value: 50,
        stats: 'Pancerz: +5',
        description: 'Solidna kurtka ze skóry chroniąca klatkę piersiową.'
    },
    'leather_pants': {
        id: 'leather_pants',
        name: 'Skórzane Spodnie',
        type: 'legs',
        icon: '👖',
        armor: 3,
        weight: 2.0,
        value: 30,
        stats: 'Pancerz: +3',
        description: 'Wygodne spodnie z grubej skóry.'
    },
    'leather_boots': {
        id: 'leather_boots',
        name: 'Skórzane Buty',
        type: 'boots',
        icon: '🥾',
        armor: 1,
        weight: 1.2,
        value: 20,
        stats: 'Pancerz: +1',
        description: 'Mocne, skórzane buty do podróży.'
    }
};



function calculateDamage(attackerDmg, defenderArmor, multiplier = 1.0) {
    const armorFactor = 100 / (100 + defenderArmor);
    return Math.max(1, Math.round(attackerDmg * armorFactor * multiplier));
}

function isEntityInArc(attacker, target, range, arcAngle, facingAngle) {
    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    const dist = Math.hypot(dx, dy);

    // 1. Sprawdzamy czy cel jest w zasięgu promienia (uwzględniamy gabaryt celu)
    const targetRadius = target.radius || 10;
    if (dist > range + targetRadius) return false;

    // 2. Kąt od gracza do celu
    const angleToTarget = Math.atan2(dy, dx);

    // 3. Najkrótsza różnica kątowa sprowadzona do zakresu [-PI, PI]
    let angleDiff = angleToTarget - facingAngle;
    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

    // 4. Czy kąt mieści się w połowie szerokości wachlarza?
    return Math.abs(angleDiff) <= (arcAngle / 2);
}
const ITEMS_DB = {
    stary_sztylet: { name: 'Stary Sztylet', icon: '🗡️', type: 'weapon', weight: 1.2, damage: 15, lightDamage: 15, heavyDamage: 28, stats: 'Obrażenia: 15' },
    zelazny_miecz: { name: 'Żelazny Miecz', icon: '⚔️', type: 'weapon', weight: 3.0, damage: 25, lightDamage: 25, heavyDamage: 45, stats: 'Obrażenia: 25' },
    miedziana_moneta: { name: 'Miedziana Moneta', icon: '🪙', type: 'misc', weight: 0.05, stats: 'Warta parę miedziaków' },
    mikstura_zdrowia: { name: 'Mikstura Zdrowia', icon: '🧪', type: 'misc', weight: 0.5, stats: 'Leczy HP' },
    skora_wilka: { name: 'Skóra Wilka', icon: '🐺', type: 'misc', weight: 1.5, stats: 'Trofeum' },
    kiel_wilka: { name: 'Kieł Wilka', icon: '🦷', type: 'misc', weight: 0.2, stats: 'Trofeum' }
};

const LOOT_TABLES = {
    zbir_lekki: [
        { id: 'gold_coins', min: 5, max: 15, chance: 1.0 },
        { id: 'stary_sztylet', min: 1, max: 1, chance: 0.2 }, // 20% szans
        { id: 'miedziana_moneta', min: 1, max: 3, chance: 0.5 }
    ],
    zbir_ciezki: [
        { id: 'gold_coins', min: 20, max: 50, chance: 1.0 },
        { id: 'zelazny_miecz', min: 1, max: 1, chance: 0.15 },
        { id: 'mikstura_zdrowia', min: 1, max: 2, chance: 0.4 }
    ],
    wilk: [
        { id: 'skora_wilka', min: 1, max: 1, chance: 0.8 },
        { id: 'kiel_wilka', min: 1, max: 2, chance: 0.5 }
    ]
};