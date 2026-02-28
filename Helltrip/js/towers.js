class Sprite {
    constructor({ position = { x: 0, y: 0 }, imageSrc, frames = { max: 1 }, offset = { x: 0, y: 0 } }) {
        this.position = position;
        this.image = new Image();
        if (imageSrc) {
            this.image.src = imageSrc;
        }
        this.frames = {
            max: frames.max,
            current: 0,
            elapsed: 0,
            hold: 0.07,
        };
        this.offset = offset;
    }

    draw() {
        if (!this.image.src) return;
        const cropWidth = this.image.width / this.frames.max;
        const crop = {
            position: { x: cropWidth * this.frames.current, y: 0 },
            width: cropWidth,
            height: this.image.height
        };
        c.drawImage(
            this.image,
            crop.position.x, crop.position.y, crop.width, crop.height,
            this.position.x + this.offset.x, this.position.y + this.offset.y,
            crop.width, crop.height
        );
    }

    update(dt) {
        this.frames.elapsed += dt;
        if (this.frames.elapsed >= this.frames.hold) {
            this.frames.elapsed = 0;
            this.frames.current++;
            if (this.frames.current >= this.frames.max) {
                this.frames.current = 0;
            }
        }
    }
}
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
        // will be implemented in subclasses
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

// Archer Tower Level 1
class ArcherTowerLvl1 extends Tower {
    constructor({ position }) {
        super({
            position,
            stats: stats.towers.archer["lvl1"],
            baseTowerType: "archer",
            level: 1,
            imageSrc: "media/tower-models/towers/archer-tower-lvl1.png",
            frames: { max: 19 },
            offset: { x: -10, y: -80 }
        });
    }
    update(dt) {
        if (this.target) {
            this.elapsedSpawnCooldown += dt;
            if (this.damage > 0 && this.elapsedSpawnCooldown >= this.cooldown) {
                this.projectiles.push(
                    new ArcherProjectile({
                        position: { x: this.center.x - 30, y: this.center.y - 115 },
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
        if (coins < stats.towers.archer["lvl2"].cost) return;
        coins -= stats.towers.archer["lvl2"].cost;
        // Zamiana instancji na wyższy poziom
        return new ArcherTowerLvl2({ position: this.position });
    }
}

// Archer Tower Level 2
class ArcherTowerLvl2 extends Tower {
    constructor({ position }) {
        super({
            position,
            stats: stats.towers.archer["lvl2"],
            baseTowerType: "archer",
            level: 2,
            imageSrc: "media/tower-models/towers/archer-tower-lvl2.png",
            frames: { max: 19 },
            offset: { x: -15, y: -85 }
        });
    }
    update(dt) {
        if (this.target) {
            this.elapsedSpawnCooldown += dt;
            if (this.damage > 0 && this.elapsedSpawnCooldown >= this.cooldown) {
                this.projectiles.push(
                    new ArcherProjectile({
                        position: { x: this.center.x - 35, y: this.center.y - 120 },
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
        if (coins < stats.towers.archer["lvl3"].cost) return;
        coins -= stats.towers.archer["lvl3"].cost;
        return new ArcherTowerLvl3({ position: this.position });
    }
}

// Archer Tower Level 3
class ArcherTowerLvl3 extends Tower {
    constructor({ position }) {
        super({
            position,
            stats: stats.towers.archer["lvl3"],
            baseTowerType: "archer",
            level: 3,
            imageSrc: "media/tower-models/towers/archer-tower-lvl3.png",
            frames: { max: 19 },
            offset: { x: -20, y: -90 }
        });
    }
    update(dt) {
        if (this.target) {
            this.elapsedSpawnCooldown += dt;
            if (this.damage > 0 && this.elapsedSpawnCooldown >= this.cooldown) {
                this.projectiles.push(
                    new ArcherProjectile({
                        position: { x: this.center.x - 40, y: this.center.y - 125 },
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
        // Brak wyższego poziomu
        return null;
    }
}

// Mage Tower Level 1
class MageTowerLvl1 extends Tower {
    constructor({ position }) {
        super({
            position,
            stats: stats.towers.mage["lvl1"],
            baseTowerType: "mage",
            level: 1,
            imageSrc: "media/tower-models/towers/mage-tower-lvl1.png",
            frames: { max: 19 },
            offset: { x: -12, y: -110 }
        });
    }
    update(dt) {
        if (this.target) {
            this.elapsedSpawnCooldown += dt;
            if (this.damage > 0 && this.elapsedSpawnCooldown >= this.cooldown) {
                this.projectiles.push(
                    new MageProjectile1({
                        position: { x: this.center.x - 30, y: this.center.y - 135 },
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
        if (coins < stats.towers.mage["lvl2"].cost) return;
        coins -= stats.towers.mage["lvl2"].cost;
        return new MageTowerLvl2({ position: this.position });
    }
}

// Mage Tower Level 2
class MageTowerLvl2 extends Tower {
    constructor({ position }) {
        super({
            position,
            stats: stats.towers.mage["lvl2"],
            baseTowerType: "mage",
            level: 2,
            imageSrc: "media/tower-models/towers/mage-tower-lvl2.png",
            frames: { max: 19 },
            offset: { x: -12, y: -100 }
        });
    }
    update(dt) {
        if (this.target) {
            this.elapsedSpawnCooldown += dt;
            if (this.damage > 0 && this.elapsedSpawnCooldown >= this.cooldown) {
                this.projectiles.push(
                    new MageProjectile1({
                        position: { x: this.center.x - 35, y: this.center.y - 140 },
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
        if (coins < stats.towers.mage["lvl3"].cost) return;
        coins -= stats.towers.mage["lvl3"].cost;
        return new MageTowerLvl3({ position: this.position });
    }
}

// Mage Tower Level 3
class MageTowerLvl3 extends Tower {
    constructor({ position }) {
        super({
            position,
            stats: stats.towers.mage["lvl3"],
            baseTowerType: "mage",
            level: 3,
            imageSrc: "media/tower-models/towers/mage-tower-lvl3.png",
            frames: { max: 19 },
            offset: { x: -12, y: -100 }
        });
    }
    update(dt) {
        if (this.target) {
            this.elapsedSpawnCooldown += dt;
            if (this.damage > 0 && this.elapsedSpawnCooldown >= this.cooldown) {
                this.projectiles.push(
                    new MageProjectile1({
                        position: { x: this.center.x - 40, y: this.center.y - 145 },
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
        // Brak wyższego poziomu
        return null;
    }
}
