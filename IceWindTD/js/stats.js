let coins = 450;
let hearts = 20;
let currentWave = 1;

const stats = {
    towers: {
        archer: {
            lvl1: {
                name: 'Marksman',
                damage: 28,
                range: 300,
                cooldown: 0.60,
                cost: 90,
            },
            lvl2:{
                name: 'Sharpshooter',
                damage: 48,
                range: 320,
                cooldown: 0.58,
                cost: 150,
            },
            lvl3:{
                name: 'Sniper',
                damage: 68,
                range: 350,
                cooldown: 0.56,
                cost: 230,
            },
        },

        mage: {
            lvl1: {
                name: 'Mage',      
                damage: 48,
                range: 240,
                cooldown: 0.92,
                cost: 120,
            },
            lvl2:{
                name: 'Wizard',      
                damage: 70,
                range: 300,
                cooldown: 0.85,
                cost: 190,
            },
            lvl3:{
                name: 'Sorcerer',
                damage: 100,
                range: 340,
                cooldown: 0.80,
                cost: 270,
            },
        },
        barracks: {
        lvl1: {
            name: 'Militia',
            damage: 15,
            range: 250,
            cooldown: 1.5,
            cost: 90,
            unitHealth:150,
            respawn:10,
        }
    },
    
    },
    enemies: {
        orc: {
            health: 130,
            armor: 2.1,
            speed: 60,
            reward: 10,
            healthCost:2,
            damage:20,
        },
        goblin: {
            health: 90,
            armor: 1.1,
            speed: 80,
            reward: 5,
            healthCost:1,
            damage:10,
        },
        bat: {
            health: 60,
            armor: 0.9,
            speed: 90,
            reward: 9,
            healthCost:1,
            isFlying: true,
            damage:10,
        },
        giantBat: {
            health: 115,
            armor: 1.1,
            speed: 80,
            reward: 13,
            healthCost:2,
            isFlying: true,
            damage:25,
        },
        gobChamp:{
            health:750,
            armor:2.3,
            speed:35,
            reward:250,
            healthCost:15,
            isMiniBoss:true,
            damage:100,
        },
        gobGiant:{
            health:300,
            armor:2.7,
            speed:30,
            reward:100,
            healthCost:10,
            damage:75,
        },
        goblinChief:{
            health:2000,
            armor:3,
            speed:25,
            reward:500,
            healthCost:25,
            isBoss:true,
            damage:250,
        }

    },

    waves:{
        '1': [
            { type: 'goblin', count: 20, track: 1, offset: 180, hold: 0 },
        ],
        
        '2': [
            { type: 'goblin', count: 19, track: 1, offset:160, hold: 0 },
        ],
        '3':[
            { type: 'goblin', count: 24, track: 1,offset:120, hold: 0 },
        ],
        '4': [
            { type: 'orc', count: 7, track: 1 ,offset:150 , hold: 0},
        ],
        '5': [
            { type: 'orc', count: 5, track: 2 ,offset:120 , hold:0},
            { type: 'goblin', count: 15, track: 1 , offset:120, hold:0 },
        ],
        '6':[
            {type: 'orc', count: 5, track: 2 ,offset:120},
            {type: 'orc', count: 7, track: 1 ,offset:120},
        ],
        '7':[
            {type: 'goblin', count: 7, track: 2 , offset:80},
            {type: 'orc', count: 7, track: 1 ,offset:100},
            {type: 'goblin', count: 7, track: 2 , offset:80 },
            {type: 'orc', count: 4, track: 1 ,offset:100},
        ],
        '8':[
            {type:'bat', count:10 , track: 1, offset:180, },
        ],
        '9':[
            {type:'goblin', count:20, track:2, offset:120},
            {type:'orc', count:10, track:2, offset:150},
            {type:'bat', count:10 , track: 1, offset:150, },
        ],
        '10':[
            {type:'goblin', count:25, track:2, offset:100},
            {type:'orc', count:12, track:2, offset:120},
            {type:'giantBat', count:7 , track: 1, offset:120, },
        ],
        '11': [
            {type: 'gobChamp', count: 1, track: 1 ,offset:100, hold: 0 },
            {type:'goblin', count: 8, track: 1 , offset:100, hold: 3},      
            {type:'orc', count:5, track:2, offset:100,hold:2},
            {type:'goblin', count:15, track:1, offset:90, },   
        ],
        '12':[
            {type:'bat', count:20, track: 1, offset:80, },
            {type:'giantBat', count:10 , track: 1, offset:120, },
        ],
        '13':[
            {type:'goblin', count: 15, track: 1 , offset:90},      
            {type:'orc', count:13, track:2, offset:100},
            {type:'goblin', count:15, track:1, offset:80, },
        ],
        '14':[
            {type: 'gobGiant', count: 2, track: 1 ,offset:200, hold: 0},
        ],
        '15':[
            {type: 'gobGiant', count: 1, track: 1 ,offset:200,},
            {type:'goblin', count: 8, track: 1 , offset:80,},
            {type: 'gobGiant', count: 1, track: 2 ,offset:200,},     
            {type:'orc', count:10, track:2, offset:100,},
            {type:'goblin', count:25, track:1, offset:90, },
        ],
        '16':[
            {type: 'gobGiant', count: 1, track: 1 ,offset:200,},
            {type:'goblin', count: 8, track: 1 , offset:100,}, 
            {type:'orc', count:15, track:2, offset:90,},
            {type:'goblin', count:25, track:1, offset:70, },
            {type:'bat', count:20, track: 2, offset:110, },
        ],
        '17':[
            {type:'gobGiant', count: 3, track: 1 ,offset:200,}, 
            {type:'orc', count:7, track:2, offset:100,},
            {type:'gobGiant', count: 2, track: 1 ,offset:200,}, 
            {type:'orc', count:13, track:2, offset:100,},
        ],
        '18':[
            {type: 'gobGiant', count: 1, track: 1 ,offset:200,},
            {type:'bat', count:25, track: 1, offset:125, },
            {type:'giantBat', count:15 , track: 2, offset:100, },
            {type: 'gobGiant', count: 1, track: 2 ,offset:200,},
            {type:'bat', count:15, track: 1, offset:110, },
        ],
        '19':[
            {type:'bat', count:20, track: 2, offset:120, },
            {type: 'gobGiant', count: 5, track: 1 ,offset:100,},
            {type:'goblin', count:18, track: 1 , offset:145,}, 
            {type:'giantBat', count:15 , track: 2, offset:120, },
            {type:'orc', count:10, track:2, offset:120,},
            {type:'goblin', count:25, track:1, offset:150, },
            {type:'bat', count:20, track: 2, offset:120, }
        ],
        '20':[
            {type:'goblinChief',count: 1, track: 1 ,offset:10,},
            {type:'gobGiant', count: 1, track: 1 ,offset:130, hold:10},
            {type:'gobChamp', count: 1, track: 2 ,offset:130,hold:8},
            {type:'gobGiant', count: 2, track: 2 ,offset:130,hold:7},
            {type:'gobChamp', count: 1, track: 1 ,offset:130,hold:5},
        ],

    }
    
}
