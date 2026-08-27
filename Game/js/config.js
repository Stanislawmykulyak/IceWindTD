const CONFIG = {
    CANVAS_WIDTH: window.innerWidth,
    CANVAS_HEIGHT: window.innerHeight,
    WORLD_WIDTH: 5000,
    WORLD_HEIGHT: 3000,
    ZOOM: 1.5,
    walk_speed: 1.5,
    run_speed: 3.2,
    horse_speed: 3.5,       // Kłus (jazda standardowa)
    horse_run_speed: 5.0,
    COLOR_GRASS: '#1b2e1b',
    COLOR_ROAD: '#3a3225',
    COLOR_INTERIOR: '#4a2e18',
    COLOR_CORRIDOR: '#362213',
    COLOR_NIGHT_FILTER: 'rgba(10, 15, 35, 0.60)',
    COLOR_WATER: '#2980b9',
    COLOR_FOREST_GRASS: '#142314',
    COLOR_GLADE: '#27ae60',
};

let gameState = 'EXPLORATION';

const start_items = {
    'simple_sword': {
        id: 'simple_sword',
        name: 'Prosty Miecz',
        type: 'weapon',
        icon: '⚔️',
        damage: 75,
        weight: 2.5,
        value: 35,
        stats: 'Obrażenia: 15',
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

const ENEMY_CONFIG = {
    zbir_lekki: {
        name: 'Zbir',
        maxHp: 1150,
        armor: 15,
        speed: 45,
        damage: 12,
        radius: 12,
        color: '#e74c3c',
        attackRange: 38,
        attackCooldown: 3.0,
        rewardGold: 15
    },
    zbir_ciezki: {
        name: 'Osiłek',
        maxHp: 2300,
        armor: 40,
        speed: 30,
        damage: 20,
        radius: 16,
        color: '#c0392b',
        attackRange: 45,
        attackCooldown: 4.0,
        rewardGold: 35
    },
    wilk: {
        name: 'Wilk',
        maxHp: 450,
        speed: 95,
        damage: 14,
        radius: 14,
        color: '#7f8c8d',
        attackRange: 32,
        attackCooldown: 1.5,
        rewardGold: 0
    },
    jelen: {
        name: 'Jeleń',
        maxHp: 40,
        speed: 110,
        damage: 0,
        radius: 16,
        color: '#8e5b23',
        isPassive: true,
        rewardGold: 0
    }
};

const ITEMS_DB = {
    stary_sztylet: { name: 'Stary Sztylet', icon: '🗡️', type: 'weapon', weight: 1.2, damage: 15, lightDamage: 15, heavyDamage: 28, stats: 'Obrażenia: 15' },
    zelazny_miecz: { name: 'Żelazny Miecz', icon: '⚔️', type: 'weapon', weight: 3.0, damage: 25, lightDamage: 25, heavyDamage: 45, stats: 'Obrażenia: 25' },
    miedziana_moneta: { name: 'Miedziana Moneta', icon: '🪙', type: 'misc', weight: 0.05, stats: 'Warta parę miedziaków' },
    mikstura_zdrowia: { name: 'Mikstura Zdrowia', icon: '🧪', type: 'misc', weight: 0.5, stats: 'Leczy HP' },
    skora_wilka: { name: 'Skóra Wilka', icon: '🐺', type: 'misc', weight: 1.5, stats: 'Trofeum' },
    kiel_wilka: { name: 'Kieł Wilka', icon: '🦷', type: 'misc', weight: 0.2, stats: 'Trofeum' },
    lecznicze_ziele: { name: 'Lecznicze Ziele', icon: '🌿', type: 'misc', weight: 0.1, stats: 'Leczy 15 HP' },
    jagody: { name: 'Leśne Jagody', icon: '🫐', type: 'misc', weight: 0.1, stats: 'Leczy 10 HP' },
    surowe_mieso: { name: 'Surowe Mięso', icon: '🥩', type: 'misc', weight: 1.0, stats: 'Jedzenie' },
    ziolo_czerwone: { name: 'Czerwone Zioło', icon: '🌿', type: 'misc', weight: 0.1, value: 4, stats: 'Składnik alchemiczny' },
    woda_butelka: { name: 'Woda w Butelce', icon: '🧴', type: 'misc', weight: 0.5, value: 2, stats: 'Czysta woda' },
    korzen_zycia: { name: 'Korzeń Życia', icon: '🌱', type: 'misc', weight: 0.2, value: 8, stats: 'Rzadki korzeń' },
    potion_hp_small: { name: 'Mała Mikstura Zdrowia', icon: '🍷', type: 'consumable', weight: 0.4, value: 15, stats: '+30 HP' },
    // === MIKSTURY ===
    potion_health: {
        id: 'potion_health',
        name: 'Mikstura Zdrowia',
        icon: '🍷',
        type: 'consumable',
        weight: 0.3,
        stats: 'Przywraca 45 HP w czasie 15s',
        effects: [
            { id: 'heal_potion', name: 'Regeneracja', icon: '💚', type: 'heal', value: 45, duration: 15 }
        ]
    },
    potion_strength: {
        id: 'potion_strength',
        name: 'Mikstura Siły',
        icon: '🧪',
        type: 'consumable',
        weight: 0.4,
        stats: '+30% do Obrażeń na 30s',
        effects: [
            { id: 'buff_strength', name: 'Siła Tytana', icon: '⚔️', type: 'stat_buff', stat: 'damageMultiplier', value: 0.30, duration: 30 }
        ]
    },
    potion_fortification: {
        id: 'potion_fortification',
        name: 'Mikstura Wzmocnienia',
        icon: '🛡️',
        type: 'consumable',
        weight: 0.5,
        stats: '+25 do Pancerza na 45s',
        effects: [
            { id: 'buff_armor', name: 'Żelazna Skóra', icon: '🛡️', type: 'stat_buff', stat: 'armor', value: 25, duration: 45 }
        ]
    },

    // === ZWOJE RECEPTUR (PRZEDMIOTY) ===
    recipe_potion_strength: {
        id: 'recipe_potion_strength',
        name: 'Receptura: Mikstura Siły',
        icon: '📜',
        type: 'document',
        weight: 0.1,
        stats: 'Użyj, aby nauczyć się receptury',
        monologueId: 'read_recipe_str',
        unlocksRecipe: 'potion_strength', // Łącznik z bazą alchemii
        content: '<b>Receptura: Mikstura Siły</b><br><br>Połącz czerwone ziele z ekstraktem kła bestii, aby wyzwolić pierwotną siłę.'
    },
    recipe_potion_fortification: {
        id: 'recipe_potion_fortification',
        name: 'Receptura: Mikstura Wzmocnienia',
        icon: '📜',
        type: 'document',
        weight: 0.1,
        stats: 'Użyj, aby nauczyć się receptury',
        monologueId: 'read_recipe_fort',
        unlocksRecipe: 'potion_fortification',
        content: '<b>Receptura: Mikstura Wzmocnienia</b><br><br>Sproszkowana ruda w połączeniu z niebieskim zielem utwardza skórę na ciosy.'
    }
};

const LOOT_TABLES = {
    zbir_lekki: [
        { id: 'gold_coins', min: 5, max: 15, chance: 1.0 },
        { id: 'stary_sztylet', min: 1, max: 1, chance: 0.2 },
        { id: 'miedziana_moneta', min: 1, max: 3, chance: 0.5 }
    ],
    zbir_ciezki: [
        { id: 'gold_coins', min: 20, max: 50, chance: 1.0 },
        { id: 'zelazny_miecz', min: 1, max: 1, chance: 0.15 },
        { id: 'mikstura_zdrowia', min: 1, max: 2, chance: 0.4 }
    ],
    wilk: [
        { id: 'skora_wilka', min: 1, max: 1, chance: 0.8 },
        { id: 'kiel_wilka', min: 1, max: 2, chance: 0.5 },
        { id: 'surowe_mieso', min: 1, max: 2, chance: 0.7 }
    ],
    jelen: [
        { id: 'surowe_mieso', min: 2, max: 4, chance: 1.0 }
    ]
};

function calculateDamage(attackerDmg, defenderArmor, multiplier = 1.0) {
    const armorFactor = 100 / (100 + defenderArmor);
    return Math.max(1, Math.round(attackerDmg * armorFactor * multiplier));
}

function isEntityInArc(attacker, target, range, arcAngle, facingAngle) {
    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    const dist = Math.hypot(dx, dy);

    const targetRadius = target.radius || 10;
    if (dist > range + targetRadius) return false;

    const angleToTarget = Math.atan2(dy, dx);
    let angleDiff = angleToTarget - facingAngle;
    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

    return Math.abs(angleDiff) <= (arcAngle / 2);
}