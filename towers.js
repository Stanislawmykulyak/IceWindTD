class Tower {
    constructor({ position = { x: 0, y: 0 }, stats, baseTowerType, imageSrc, frames, offset, level = 1 }) {
        this.position = position;
        this.width = 64 * 2;
        this.height = 64 + 30;
        this.center = {
            x: this.position.x + this.width / 2,
            y: this.position.y + this.height / 2
        };
        this.projectiles = [];
        this.target = null;
        this.elapsedSpawnCooldown = 0;
        this.level = level;

        this.baseTowerType = baseTowerType;
        this.updateStats(stats);


        if (imageSrc) {
            this.sprite = new Sprite({ position: this.position, imageSrc, frames, offset });
        }
    }

    updateStats(stats) {
        this.name = stats.name;
        this.cost = stats.cost;
        this.damage = stats.damage;
        this.radius = stats.range;
        this.cooldown = stats.cooldown;
    }
    
    upgrade() {
        //Kazda Klasa ma wlasny update :)
    }

    draw() {
        if (this.sprite) {
            this.sprite.position = this.position;
            this.sprite.draw();
        }
    }
    update(dt) {
        if (this.target && this.sprite) {
            this.sprite.update(dt); 
        } else if (this.sprite) {
            this.sprite.frames.current = 0;
        }
    }
}
//Archer Tower lvl 1//
class ArcherTower extends Tower {
    constructor({ position, level = 1 }) {
        const towerStats = stats.towers.archer[`lvl${level}`];
        super({ 
            position,
            stats: towerStats,
            baseTowerType: 'archer',
            level: level,
            imageSrc: `media/tower-models/towers/archer-tower-lvl${level}.png`,
            frames: {
                max: 19
            },
            offset: {
                x: -10,
                y:-80,
            }
        });
    }
    
    draw() {
       super.draw();
    }
    update(dt) {
    if (this.target) {
        this.elapsedSpawnCooldown += dt;
        if (this.damage > 0 && this.elapsedSpawnCooldown >= this.cooldown) {
            this.projectiles.push(
                new ArcherProjectile(this.level)({
                    position: {
                        x: this.center.x - 30,
                        y: this.center.y - 115,
                    },
                    enemy: this.target,
                    damage: this.damage / this.target.armor
                })
            );
            this.elapsedSpawnCooldown = 0;
        }
    }
    super.update(dt);
    }
    
    upgrade() {
        const nextLevel = this.level + 1;
        const upgradeStats = stats.towers.archer[`lvl${nextLevel}`];
        if (!upgradeStats || coins < upgradeStats.cost) return;

        coins -= upgradeStats.cost;
        this.level = nextLevel;
        this.updateStats(upgradeStats);
        this.sprite.image.src = `media/tower-models/towers/archer-tower-lvl${this.level}.png`;
    }
}
//Mage Tower lvl 1 //
class MageTower extends Tower {
    constructor({ position, level = 1 }) {
        const towerStats = stats.towers.mage[`lvl${level}`];
        super({ 
            position,
            stats: towerStats,
            baseTowerType: 'mage',
            level: level,
            imageSrc: `media/tower-models/towers/mage-tower-lvl${level}.png`,
            frames: {
                max: 19
            },
            offset: {
                x: -12,
                y:-110,
            }
        });
    }
    
    draw() {
       super.draw();
    }
    update(dt) {
    if (this.target) {
        this.elapsedSpawnCooldown += dt;
        if (this.damage > 0 && this.elapsedSpawnCooldown >= this.cooldown) {
            this.projectiles.push(
                new MageProjectile(this.level, {
                    position: {
                        x: this.center.x - 30,
                        y: this.center.y - 135,
                    },
                    enemy: this.target,
                    damage: this.damage / this.target.armor
                })
            );
            this.elapsedSpawnCooldown = 0;
        }
    }
    super.update(dt);
    }
    
    upgrade() {
        const nextLevel = this.level + 1;
        const upgradeStats = stats.towers.mage[`lvl${nextLevel}`];
        if (!upgradeStats || coins < upgradeStats.cost) return;

        coins -= upgradeStats.cost;
        this.level = nextLevel;
        this.updateStats(upgradeStats);
        // Assumes you have a mage-tower-lvl2.png, etc.
        this.sprite.image.src = `media/tower-models/towers/mage-tower-lvl${this.level}.png`;
    }
}