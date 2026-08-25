const ENEMY_CONFIG = {
    zbir_lekki: {
        name: 'Zbir',
        maxHp: 50,
        speed: 0.8,          // Zmniejszone z szybkiego biegu na wolniejszy chód (było np. 1.2 - 1.5)
        damage: 10,          // Zmniejszone obrażenia (było wyższe)
        radius: 12,
        color: '#e74c3c',
        attackRange: 35,
        attackCooldown: 1200, // Atakują co 1.2 sekundy zamiast ciągłego spamu
        rewardGold: 10
    },
    zbir_ciezki: {
        name: 'Osiłek',
        maxHp: 90,
        speed: 0.5,          // Bardzo wolny
        damage: 18,
        radius: 15,
        color: '#c0392b',
        attackRange: 40,
        attackCooldown: 1800, // Atakuje co 1.8 sekundy
        rewardGold: 25
    }
};