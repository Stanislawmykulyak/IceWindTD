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
    COLOR_NIGHT_FILTER: 'rgba(16, 23, 51, 0.40)',
    COLOR_WATER: '#2980b9',
    COLOR_FOREST_GRASS: '#0a720a',
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
        critChance: 0.02,
        weight: 2.5,
        value: 35,
        inventoryCategory: 'gear',
        inventorySubcategory: 'weapon',
        stats: 'Obrażenia: 15',
        description: 'Zwykły, lekko wyświechtany miecz stalowy.'
    },
    'leather_helmet': {
        id: 'leather_helmet',
        name: 'Skórzany Czepiec',
        type: 'head',
        icon: '🪖',
        armor: 2,
        critChance: 0,
        weight: 1.0,
        value: 15,
        inventoryCategory: 'gear',
        inventorySubcategory: 'armor',
        stats: 'Pancerz: +2',
        description: 'Prosta czapka z utwardzanej skóry.'
    },
    'leather_chest': {
        id: 'leather_chest',
        name: 'Skórzana Przeszywanica',
        type: 'chest',
        icon: '🥼',
        armor: 5,
        critChance: 0,
        weight: 3.5,
        value: 50,
        inventoryCategory: 'gear',
        inventorySubcategory: 'armor',
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
        critChance: 0,
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
        rewardGold: 15,
        weaponId: 'simple_sword',    // ID broni z ITEMS_DB
        equipment: {
            head: 'leather_helmet',
            chest: 'leather_chest',
            legs: 'leather_pants',
            boots: 'leather_boots'
        },    // ID pancerza z ITEMS_DB
        weaponDropChance: 0.20,      // 20% szans na szpadę
        armorDropChance: 0.10
    },
    z1: {
        name: 'Zbir',
        maxHp: 1150,
        armor: 15,
        speed: 45,
        damage: 12,
        radius: 12,
        color: '#e74c3c',
        attackRange: 38,
        attackCooldown: 3.0,
        rewardGold: 15,
        weaponId: 'miecz_stalowy',    // ID broni z ITEMS_DB
        equipment: {
            head: 'leather_helmet',
            chest: 'leather_chest',
            legs: 'leather_pants',
            boots: 'leather_boots'
        },
        weaponDropChance: 1,      // 20% szans na szpadę
        armorDropChance: 0
    },
    ruin_guardian: {
        name: 'Widmo Rycerza',
        maxHp: 3100,
        armor: 60,
        speed: 78,
        damage: 30,
        radius: 20,
        color: '#8f9dff',
        attackRange: 82,
        attackCooldown: 1.1,
        rewardGold: 120,
        weaponId: 'miecz_rozpadlina',
        armorDropChance: 0,
        weaponDropChance: 1.0,
        isBoss: true
    },
    z2: {
        name: 'Zbir',
        maxHp: 1150,
        armor: 15,
        speed: 45,
        damage: 12,
        radius: 12,
        color: '#e74c3c',
        attackRange: 38,
        attackCooldown: 3.0,
        rewardGold: 15,
        weaponId: 'maczuga_zbira',    // ID broni z ITEMS_DB
        equipment: {
            head: 'leather_helmet',
            chest: 'leather_chest',
            legs: 'leather_pants',
            boots: 'leather_boots'
        },    // ID pancerza z ITEMS_DB
        weaponDropChance: 0,      // 20% szans na szpadę
        armorDropChance: 0
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
        rewardGold: 35,
        weaponId: 'simple_sword',    // ID broni z ITEMS_DB
        equipment: {
            head: 'leather_helmet',
            chest: 'leather_chest',
            legs: 'leather_pants',
            boots: 'leather_boots'
        },    // ID pancerza z ITEMS_DB
        weaponDropChance: 0.20,      // 20% szans na szpadę
        armorDropChance: 0.10
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
    mikstura_zdrowia: { name: 'Mikstura Zdrowia', icon: '🧪', type: 'misc', weight: 0.5, inventoryCategory: 'food', inventorySubcategory: 'potions', stats: 'Leczy HP' },
    skora_wilka: { name: 'Skóra Wilka', icon: '🐺', type: 'misc', weight: 1.5, inventoryCategory: 'misc', inventorySubcategory: 'misc', stats: 'Trofeum' },
    kiel_wilka: { name: 'Kieł Wilka', icon: '🦷', type: 'misc', weight: 0.2, inventoryCategory: 'misc', inventorySubcategory: 'misc', stats: 'Trofeum' },
    lecznicze_ziele: { name: 'Lecznicze Ziele', icon: '🌿', type: 'misc', weight: 0.1, inventoryCategory: 'alchemy', inventorySubcategory: 'ingredients', stats: 'Leczy 15 HP' },
    jagody: { name: 'Leśne Jagody', icon: '🫐', type: 'misc', weight: 0.1, inventoryCategory: 'food', inventorySubcategory: 'food', stats: 'Leczy 10 HP' },
    surowe_mieso: { name: 'Surowe Mięso', icon: '🥩', type: 'misc', weight: 1.0, inventoryCategory: 'food', inventorySubcategory: 'food', stats: 'Jedzenie' },
    ziolo_czerwone: { name: 'Czerwone Zioło', icon: '🌿', type: 'misc', weight: 0.1, value: 4, stats: 'Składnik alchemiczny' },
    herb_blue: { id: 'herb_blue', name: 'Niebieskie Zioło', icon: '🍃', type: 'misc', weight: 0.2, value: 6, stats: 'Składnik alchemiczny' },
    woda_butelka: { name: 'Woda w Butelce', icon: '🧴', type: 'misc', weight: 0.5, value: 2, stats: 'Czysta woda' },
    korzen_zycia: { name: 'Korzeń Życia', icon: '🌱', type: 'misc', weight: 0.2, value: 8, stats: 'Rzadki korzeń' },
    moon_lichen: { id: 'moon_lichen', name: 'Porost Księżycowy', icon: '🌙', type: 'material', weight: 0.2, value: 8, stats: 'Lśniący porost z podziemnych jaskiń' },
    crimson_pollen: { id: 'crimson_pollen', name: 'Szkarłatny Pyłek', icon: '✨', type: 'material', weight: 0.1, value: 7, stats: 'Pyłek z rzadkiej rośliny' },
    ashwood_bark: { id: 'ashwood_bark', name: 'Kora Jesionu', icon: '🌳', type: 'material', weight: 0.4, value: 6, stats: 'Wytrzymała kora do rzemiosła' },
    iron_sand: { id: 'iron_sand', name: 'Piasek Żelazny', icon: '🪨', type: 'material', weight: 0.9, value: 9, stats: 'Drobny żelazny piasek' },
    ember_amber: { id: 'ember_amber', name: 'Żarliwy Bursztyn', icon: '🟠', type: 'material', weight: 0.3, value: 11, stats: 'Płonąca żywica o nieprzewidywalnym smaku' },
    ruined_iron: { id: 'ruined_iron', name: 'Zniszczone Żelazo', icon: '🧱', type: 'material', weight: 1.0, value: 12, stats: 'Wyszczerbione żelazo z dawnej fortyfikacji' },
    ancient_ash: { id: 'ancient_ash', name: 'Pradawne Drewno', icon: '🪵', type: 'material', weight: 0.8, value: 13, stats: 'Twarde drewno z zaginionej ruinowej bramy' },
    storm_glass: { id: 'storm_glass', name: 'Burzowe Szkło', icon: '🔷', type: 'material', weight: 0.5, value: 16, stats: 'Przejrzyste szkło z piorunującej wysepki' },
    sun_amber: { id: 'sun_amber', name: 'Słoneczny Bursztyn', icon: '🌞', type: 'material', weight: 0.3, value: 14, stats: 'Lśniąca żywica z niszczących się ruin' },
    runic_clay: { id: 'runic_clay', name: 'Runiczna Glina', icon: '🟫', type: 'material', weight: 0.7, value: 11, stats: 'Mocno wypalona glina z dawnych znaków' },
    ruin_steel: { id: 'ruin_steel', name: 'Ruina Stal', icon: '🪓', type: 'material', weight: 1.4, value: 18, stats: 'Twarda stal z dawnych murów' },
    moonsteel_scrap: { id: 'moonsteel_scrap', name: 'Odcinek Księżycowej Stali', icon: '🌙', type: 'material', weight: 1.1, value: 20, stats: 'Przebijany blask księżyca i starej obróbki' },
    potion_hp_small: { name: 'Mała Mikstura Zdrowia',icon: '<img src="img/health_potion.png" alt="Mikstura Życia" width="100" height="100">', type: 'consumable', weight: 0.4, value: 15, inventoryCategory: 'food', inventorySubcategory: 'potions', stats: '+30 HP' },
    // === MIKSTURY ===
    potion_health: {
        id: 'potion_health',
        name: 'Mikstura Zdrowia',
        icon:'<img src="img/health_potion.png" alt="Mikstura Życia" width="100" height="100">',
        type: 'consumable',
        weight: 0.3,
        inventoryCategory: 'food',
        inventorySubcategory: 'potions',
        stats: 'Przywraca 45 HP w czasie 15s',
        effects: [
            { id: 'heal_potion', name: 'Regeneracja', icon: '💚', type: 'heal', value: 45, duration: 15 }
        ]
    },
    herb_green: {
        id: 'herb_green',
        name: 'Zielone Zioło',
        icon: '🌱',
        type: 'misc',
        weight: 0.2,
        stats: 'Składnik alchemiczny'
    },
    iron_ore: {
        id: 'iron_ore',
        name: 'Ruda Żelaza',
        icon: '⛏️',
        type: 'material',
        weight: 1.5,
        inventoryCategory: 'crafting',
        inventorySubcategory: 'ingredients',
        stats: 'Surowiec do wytopu i kuźni'
    },
    iron_ingot: {
        id: 'iron_ingot',
        name: 'Sztabka Żelaza',
        icon: '⛓️',
        type: 'material',
        weight: 1.2,
        inventoryCategory: 'crafting',
        inventorySubcategory: 'ingredients',
        stats: 'Podstawowy materiał kowalski'
    },
    wood_handle: {
        id: 'wood_handle',
        name: 'Drewniana Rękojeść',
        icon: '🪵',
        type: 'material',
        weight: 0.4,
        stats: 'Rękojeść do noży i mieczy'
    },
    leather_strips: {
        id: 'leather_strips',
        name: 'Skórzane Pasma',
        icon: '🧵',
        type: 'material',
        weight: 0.3,
        stats: 'Materiały do obramowania zbroi'
    },
    iron_knife: {
        id: 'iron_knife',
        name: 'Żelazny Nóż',
        icon: '🗡️',
        type: 'weapon',
        weight: 1.8,
        damage: 18,
        inventoryCategory: 'gear',
        inventorySubcategory: 'weapon',
        stats: 'Obrażenia: 18'
    },
    iron_sword: {
        id: 'iron_sword',
        name: 'Żelazny Miecz',
        icon: '⚔️',
        type: 'weapon',
        weight: 3.4,
        damage: 32,
        inventoryCategory: 'gear',
        inventorySubcategory: 'weapon',
        stats: 'Obrażenia: 32'
    },
    iron_helmet: {
        id: 'iron_helmet',
        name: 'Żelazny Hełm',
        icon: '⛑️',
        type: 'head',
        weight: 2.2,
        armor: 4,
        inventoryCategory: 'gear',
        inventorySubcategory: 'armor',
        stats: 'Pancerz: +4'
    },
    ruinbreaker_blade: {
        id: 'ruinbreaker_blade',
        name: 'Roztrzaskiwacz Ruin',
        icon: '🗡️',
        type: 'weapon',
        weight: 4.1,
        damage: 82,
        critChance: 0.12,
        stats: 'Obrażenia: 82'
    },
    moonfang_axe: {
        id: 'moonfang_axe',
        name: 'Topór Księżycowego Kła',
        icon: '🪓',
        type: 'weapon',
        weight: 4.6,
        damage: 76,
        critChance: 0.1,
        stats: 'Obrażenia: 76'
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
    potion_guard: {
        id: 'potion_guard',
        name: 'Mikstura Ochronna',
        icon: '🛡️',
        type: 'consumable',
        weight: 0.4,
        stats: '+18 pancerza na 30s',
        effects: [
            { id: 'buff_guard', name: 'Tarcza Roślin', icon: '🛡️', type: 'stat_buff', stat: 'armor', value: 18, duration: 30 }
        ]
    },
    potion_swiftness: {
        id: 'potion_swiftness',
        name: 'Mikstura Szybkości',
        icon: '💨',
        type: 'consumable',
        weight: 0.35,
        stats: '+20% szybkości na 20s',
        effects: [
            { id: 'buff_speed', name: 'Błyskawiczny Krok', icon: '💨', type: 'stat_buff', stat: 'speedMultiplier', value: 0.20, duration: 20 }
        ]
    },
    ruin_steel: { id: 'ruin_steel', name: 'Ruina Stal', icon: '🪓', type: 'material', weight: 1.4, value: 18, stats: 'Twarda stal z dawnych murów' },
    moonsteel_scrap: { id: 'moonsteel_scrap', name: 'Odcinek Księżycowej Stali', icon: '🌙', type: 'material', weight: 1.1, value: 20, stats: 'Przebijany blask księżyca i starej obróbki' },
    sun_amber: { id: 'sun_amber', name: 'Słoneczny Bursztyn', icon: '🌞', type: 'material', weight: 0.3, value: 14, stats: 'Lśniąca żywica z niszczących się ruin' },
    runic_clay: { id: 'runic_clay', name: 'Runiczna Glina', icon: '🟫', type: 'material', weight: 0.7, value: 11, stats: 'Mocno wypalona glina z dawnych znaków' },
    ancient_ash: { id: 'ancient_ash', name: 'Pradawne Drewno', icon: '🪵', type: 'material', weight: 0.8, value: 13, stats: 'Twarde drewno z zaginionej ruinowej bramy' },

    // === ZWOJE RECEPTUR (PRZEDMIOTY) ===
    recipe_potion_strength: {
        id: 'recipe_potion_strength',
        name: 'Receptura: Mikstura Siły',
        icon: '📜',
        type: 'document',
        weight: 0.1,
        inventoryCategory: 'alchemy',
        inventorySubcategory: 'recipes',
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
    },
    recipe_potion_guard: {
        id: 'recipe_potion_guard',
        name: 'Receptura: Mikstura Ochronna',
        icon: '📜',
        type: 'document',
        weight: 0.1,
        stats: 'Użyj, aby nauczyć się receptury',
        monologueId: 'read_recipe_guard',
        unlocksRecipe: 'potion_guard',
        content: '<b>Receptura: Mikstura Ochronna</b><br><br>Porost księżycowy z pyłkiem szkarłatu i wodą z górskiego źródła tworzy tarczę z roślin.'
    },
    recipe_potion_swiftness: {
        id: 'recipe_potion_swiftness',
        name: 'Receptura: Mikstura Szybkości',
        icon: '📜',
        type: 'document',
        weight: 0.1,
        stats: 'Użyj, aby nauczyć się receptury',
        monologueId: 'read_recipe_swiftness',
        unlocksRecipe: 'potion_swiftness',
        content: '<b>Receptura: Mikstura Szybkości</b><br><br>Niebieskie ziele z korą jesionu daje ruchowi lekkość i prędkość.'
    },
    recipe_hunter_axe: {
        id: 'recipe_hunter_axe',
        name: 'Receptura: Topór Myśliwski',
        icon: '📜',
        type: 'document',
        weight: 0.1,
        stats: 'Użyj, aby nauczyć się receptury',
        monologueId: 'read_recipe_axe',
        unlocksRecipe: 'hunter_axe',
        content: '<b>Receptura: Topór Myśliwski</b><br><br>Dwukrotnie przetopiona sztabka żelaza z korą jesionu i piaskiem żelaznym daje ostrze zdolne do szybkiego cięcia.'
    },
    recipe_steel_spear: {
        id: 'recipe_steel_spear',
        name: 'Receptura: Włócznia Żelazna',
        icon: '📜',
        type: 'document',
        weight: 0.1,
        stats: 'Użyj, aby nauczyć się receptury',
        monologueId: 'read_recipe_spear',
        unlocksRecipe: 'steel_spear',
        content: '<b>Receptura: Włócznia Żelazna</b><br><br>Żarliwy bursztyn i drewniana rękojeść rozgrzeją ostrze, a żelazny rdzeń zachowa ostrą głownię.'
    },
    recipe_ruinbreaker_blade: {
        id: 'recipe_ruinbreaker_blade',
        name: 'Receptura: Roztrzaskiwacz Ruin',
        icon: '📜',
        type: 'document',
        weight: 0.1,
        stats: 'Użyj, aby nauczyć się receptury',
        monologueId: 'read_recipe_ruinbreaker',
        unlocksRecipe: 'ruinbreaker_blade',
        content: '<b>Receptura: Roztrzaskiwacz Ruin</b><br><br>Połącz runiczną glinę, odłamki księżycowej stali i rozpalony bursztyn z ostrym rdzeniem żelaza. Gdy wszystko zwiąże się w ogniu, powstaje ostrze zdolne do kruszenia dawnych murów.'
    },
    recipe_moonfang_axe: {
        id: 'recipe_moonfang_axe',
        name: 'Receptura: Topór Księżycowego Kła',
        icon: '📜',
        type: 'document',
        weight: 0.1,
        stats: 'Użyj, aby nauczyć się receptury',
        monologueId: 'read_recipe_moonfang',
        unlocksRecipe: 'moonfang_axe',
        content: '<b>Receptura: Topór Księżycowego Kła</b><br><br>Przerób żelazną rudę z runiczną gliną, a następnie zwiąż ją odłamkami księżycowej stali i niewielkim strumieniem bursztynu, by wykuć broń niosącą nocny rozłam.'
    },
    dlugi_miecz: {
        id: 'dlugi_miecz',
        name: 'Długi Miecz',
        type: 'weapon',
        icon: '🗡️',
        damage: 120,
        critChance: 0.08,
        weight: 4.6,
        value: 180,
        footprint: { width: 1, height: 2 },
        stats: 'Obrażenia: 120',
        description: 'Długa, rozłożysta broń o dużej zasięgu i mocnym cięciu.'
    },
    miecz_rozpadlina: {
        id: 'miecz_rozpadlina',
        name: 'Miecz Rozpadlina',
        type: 'weapon',
        icon: '🗡️',
        damage: 165,
        critChance: 0.14,
        weight: 5.2,
        value: 320,
        footprint: { width: 1, height: 2 },
        stats: 'Obrażenia: 165',
        description: 'Mocny miecz wydobyty z serca ruiny, który rozcina nawet starą żelazną zbroję.'
    },
    miecz_stalowy: {
        id: 'miecz_stalowy',
        name: 'Stalowy Miecz',
        type: 'weapon',
        icon: '⚔️',
        damage: 95,
        critChance: 0.05,
        weight: 3.0,
        value: 70,
        stats: 'Obrażenia: 95',
        description: 'Ciężka, wyśmienicie wyważona broń odebrana zbirowi w piwnicy.'
    },
    maczuga_zbira: {
        id: 'maczuga_zbira',
        name: 'Maczuga Zbira',
        type: 'weapon',
        icon: '🏏',
        damage: 85,
        critChance: 0.1,
        weight: 4.0,
        value: 50,
        stats: 'Obrażenia: 85',
        description: 'Masywna broń drugiego z opryszków.'
    },
    miecz_rozpadlina: {
        id: 'miecz_rozpadlina',
        name: 'Miecz Rozpadlina',
        type: 'weapon',
        icon: '🗡️',
        damage: 165,
        critChance: 0.14,
        weight: 5.2,
        value: 320,
        footprint: { width: 1, height: 2 },
        stats: 'Obrażenia: 165',
        description: 'Mocny miecz wydobyty z serca ruin, rozcinający starą stal i ciemność.'
    },
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
    ],
    ruin_guardian: [
        { id: 'gold_coins', min: 35, max: 70, chance: 1.0 },
        { id: 'moonsteel_scrap', min: 1, max: 2, chance: 0.9 },
        { id: 'ruin_steel', min: 1, max: 3, chance: 0.85 },
        { id: 'sun_amber', min: 1, max: 2, chance: 0.75 },
        { id: 'runic_clay', min: 1, max: 2, chance: 0.8 },
        { id: 'miecz_rozpadlina', min: 1, max: 1, chance: 0.2 }
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