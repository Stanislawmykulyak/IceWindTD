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
    }
};

function showToast(text) {
    const toast = document.getElementById('toast-message');
    if (!toast) return;
    toast.innerText = text;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
}

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
