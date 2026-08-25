const ENEMY_CONFIG = {
    zbir_lekki: {
        name: 'Zbir',
        maxHp: 1080,           // Było 50 (teraz wymaga ~6 trafień)
        speed: 1.1,           // Szybsze okrążanie gracza (było 0.8)
        damage: 150,          
        radius: 12,
        color: '#e74c3c',
        attackRange: 38,
        attackCooldown: 1500,  // Częstsza próba ataku (było 1200ms)
        rewardGold: 15
    },
    zbir_ciezki: {
        name: 'Osiłek',
        maxHp: 1780,           // Było 90 (wymagający przeciwnik)
        speed: 0.75,          
        damage: 235,          
        radius: 16,
        color: '#c0392b',
        attackRange: 45,
        attackCooldown: 1800, // Było 1800ms
        rewardGold: 35
    }
};