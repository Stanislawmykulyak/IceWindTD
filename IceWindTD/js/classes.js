class PlacementTile {
  constructor({ position = { x: 0, y: 0 } }) {
    this.position = position;
    this.size = 64;
    this.color = 'rgba(255, 255, 255, 0.25)';
    this.isOccupied = false;
  }

  draw() {
    c.fillStyle = this.color;
    c.fillRect(this.position.x, this.position.y, this.size, this.size);
    c.drawImage(tileImage, this.position.x, this.position.y, this.size, this.size);
  }

  update(mouse) {
    this.draw();

    if (this === selectedTile) {
      this.color = 'rgba(146, 146, 146, 0.55)';
    } else if (
      mouse.x > this.position.x &&
      mouse.x < this.position.x + this.size &&
      mouse.y > this.position.y &&
      mouse.y < this.position.y + this.size
    ) {
      this.color = 'rgba(15, 245, 15, 0.06)';
    } else {
      this.color = 'rgba(255, 255, 255, 0)';
    }
  }
}
class Enemy extends Sprite {
  constructor({ position = { x: 0, y: 0 }, imageSrc, frames = { max: 20 }, waypoints = [], enemyType }) {
    super({ position, imageSrc, frames });
    const enemyStats = stats.enemies[enemyType];
    this.position = position;
    this.width = 40;
    this.height = 55;
    this.waypointIndex = 0;
    this.waypoints = waypoints;
    if (enemyStats.isFlying) {
      this.waypoints = this.waypoints.map(waypoint => ({
        x: waypoint.x,
        y: waypoint.y - 60
      }));
    }
    if (enemyStats.isMiniBoss) {
      this.waypoints = this.waypoints.map(waypoint => ({
        x: waypoint.x,
        y: waypoint.y - 30
      }));
    }
    if (enemyStats.isBoss) {
      this.waypoints = this.waypoints.map(waypoint => ({
        x: waypoint.x,
        y: waypoint.y - 60
      }));
    }

    this.center = {
      x: this.position.x + this.width / 2,
      y: this.position.y + this.height / 2
    };
    this.radius = 30;
    if (currentWave > 5) {
      this.health = ((1 + currentWave * 0.2) * enemyStats.health)
      this.maxHealth = ((1 + currentWave * 0.2) * enemyStats.health)
      if (enemyStats.isBoss) {
        this.health = enemyStats.health
      }
    }
    this.armor = enemyStats.armor;
    this.speed = enemyStats.speed;
    this.reward = enemyStats.reward;
    this.isFlying = enemyStats.isFlying || false;
    this.velocity = {
      x: 0,
      y: 0
    };
    this.blockedBy = null;
    this.meleeCooldown = 0;
    this.meleeDamage = enemyStats.damage;
  }

  draw() {
    const angle = Math.atan2(this.velocity.y, this.velocity.x);
    c.save();
    c.translate(this.center.x, this.center.y);

    if (Math.abs(angle) > Math.PI / 2) {
      c.scale(-1, 1);
      let rotation = Math.PI - angle;
      while (rotation > Math.PI) rotation -= 2 * Math.PI;
      while (rotation < -Math.PI) rotation += 2 * Math.PI;

      if (Math.abs(rotation) > Math.PI / 12) {
        c.rotate(0);
      } else {
        c.rotate(rotation);
      }
    } else {
      if (Math.abs(angle) > Math.PI / 12) {
        c.rotate(0);
      } else {
        c.rotate(angle);
      }
    }

    const cropWidth = this.image.width / this.frames.max;
    const crop = {
      position: {
        x: cropWidth * this.frames.current,
        y: 0
      },
      width: cropWidth,
      height: this.image.height
    };

    c.drawImage(this.image, crop.position.x, crop.position.y, crop.width, crop.height, -this.width / 2 + this.offset.x, -this.height / 2 + this.offset.y, crop.width, crop.height);
    c.restore();


    //health bar
    c.fillStyle = 'red';
    c.fillRect(this.position.x, this.position.y - 15, this.width, 9);

    c.fillStyle = 'rgba(39, 199, 216, 1)';
    c.fillRect(this.position.x, this.position.y - 15, this.width * this.health / this.maxHealth, 9);

  }

  update(dt) {

    super.update(dt);

    if (this.blockedBy && !this.isFlying) {
        this.meleeCooldown -= dt;
        if (this.meleeCooldown <= 0) {
            this.blockedBy.health -= this.meleeDamage;
            this.meleeCooldown = 1.0;
        }
        return; // Stoi i walczy
    }
    if (this.blockedBy) {
      this.meleeCooldown -= dt;
      if (this.meleeCooldown <= 0) {
        this.blockedBy.health -= this.meleeDamage;
        this.meleeCooldown = 1.0; // atakuje co 1 sekundę
      }
      return; // PRZERYWAMY RUCH - wróg stoi i walczy
    }
    const waypoint = this.waypoints[this.waypointIndex];
    const yDistance = waypoint.y - this.center.y;
    const xDistance = waypoint.x - this.center.x;
    const angle = Math.atan2(yDistance, xDistance);

    this.velocity.x = Math.cos(angle) * this.speed;
    this.velocity.y = Math.sin(angle) * this.speed;

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    this.center = {
      x: this.position.x + this.width / 2,
      y: this.position.y + this.height / 2
    };

    if (
      Math.abs(this.center.x - waypoint.x) < Math.abs(this.velocity.x * dt) + 1 &&
      Math.abs(this.center.y - waypoint.y) < Math.abs(this.velocity.y * dt) + 1
    ) {
      this.waypointIndex++;
    }
  }
}
class Bat extends Enemy {
  constructor({ position = { x: 0, y: 0 }, waypoints = [] }) {
    super({
      position,
      imageSrc: 'media/tower-models/enemies/bat.png',
      frames: { max: 18 },
      waypoints,
      enemyType: 'bat'
    });
    const enemyStats = stats.enemies.bat;
    this.width = 50;
    this.height = 30;
    this.radius = 25;
  }
}
class GiantBat extends Enemy {
  constructor({ position = { x: 0, y: 0 }, waypoints = [] }) {
    super({
      position,
      imageSrc: 'media/tower-models/enemies/giant-bat.png',
      frames: { max: 18 },
      waypoints,
      enemyType: 'giantBat'
    });
    const enemyStats = stats.enemies.giantBat;
    this.width = 70;
    this.height = 30;
    this.radius = 25;
    this.health = enemyStats.health;
    this.armor = enemyStats.armor;
    this.speed = enemyStats.speed;
    this.maxHealth = enemyStats.health;
    this.reward = enemyStats.reward;
  }
}
class Orc extends Enemy {
  constructor({ position = { x: 0, y: 0 }, waypoints = [] }) {
    super({
      position,
      imageSrc: 'media/tower-models/enemies/orc.png',
      frames: { max: 20 },
      waypoints,
      enemyType: 'orc'
    });
    const enemyStats = stats.enemies.orc;
    this.width = 50;
    this.height = 70;
    this.radius = 30;
    this.health = enemyStats.health;
    this.armor = enemyStats.armor;
    this.speed = enemyStats.speed;
    this.maxHealth = enemyStats.health;
    this.reward = enemyStats.reward;
  }
}
class GoblinChampion extends Enemy {
  constructor({ position = { x: 0, y: 0 }, waypoints = [] }) {
    super({
      position,
      imageSrc: 'media/tower-models/enemies/goblin-champion.png',
      frames: { max: 20 },
      waypoints,
      enemyType: 'gobChamp'
    });
    const enemyStats = stats.enemies.gobChamp;
    this.width = 95;
    this.height = 150;
    this.health = enemyStats.health;
    this.armor = enemyStats.armor;
    this.speed = enemyStats.speed;
    this.maxHealth = enemyStats.health;
    this.reward = enemyStats.reward;
  }
}
class Goblin extends Enemy {
  constructor({ position = { x: 0, y: 0 }, waypoints = [] }) {
    super({
      position,
      imageSrc: 'media/tower-models/enemies/goblin.png',
      frames: { max: 20 },
      waypoints,
      enemyType: 'goblin'
    });
    const enemyStats = stats.enemies.goblin;
    this.width = 50;
    this.height = 60;
    this.radius = 30;
    this.health = enemyStats.health;
    this.armor = enemyStats.armor;
    this.speed = enemyStats.speed;
    this.maxHealth = enemyStats.health;
    this.reward = enemyStats.reward;
  }
}
class GoblinGiant extends Enemy {
  constructor({ position = { x: 0, y: 0 }, waypoints = [] }) {
    super({
      position,
      imageSrc: 'media/tower-models/enemies/goblin-giant.png',
      frames: { max: 20 },
      waypoints,
      enemyType: 'gobGiant'
    });
    const enemyStats = stats.enemies.gobGiant;
    this.width = 60;
    this.height = 90;
    this.radius = 30;
    this.health = enemyStats.health;
    this.armor = enemyStats.armor;
    this.speed = enemyStats.speed;
    this.maxHealth = enemyStats.health;
    this.reward = enemyStats.reward;
  }
}
class GoblinChief extends Enemy {
  constructor({ position = { x: 0, y: 0 }, waypoints = [] }) {
    super({
      position,
      imageSrc: 'media/tower-models/enemies/goblin-chief.png',
      frames: { max: 20 },
      waypoints,
      enemyType: 'goblinChief'
    });
    const enemyStats = stats.enemies.goblinChief;
    this.width = 150;
    this.height = 190;
    this.radius = 30;
    this.health = enemyStats.health;
    this.armor = enemyStats.armor;
    this.speed = enemyStats.speed;
    this.maxHealth = enemyStats.health;
    this.reward = enemyStats.reward;
  }
}
class Projectile extends Sprite {
  constructor({ position = { x: 0, y: 0 }, enemy, damage, power, imageSrc }) {
    super({ position, })
    this.position = position;
    this.velocity = {
      x: 0,
      y: 0
    };
    this.radius = 10;
    this.enemy = enemy;
    this.damage = damage;
    this.power = power
    this.image.src = imageSrc;

  }

  draw() {
    c.save()
    c.translate(this.position.x, this.position.y);
    c.rotate(this.angle);
    c.drawImage(this.image, -this.image.width / 2, -this.image.height / 2);
    c.restore()
  }

  update(dt) {
    const angle = Math.atan2(
      this.enemy.center.y - this.position.y,
      this.enemy.center.x - this.position.x
    );
    this.angle = angle;
    this.velocity.x = Math.cos(angle) * (this.power * 7);
    this.velocity.y = Math.sin(angle) * (this.power * 7);

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
  }
}
class ArcherProjectile extends Projectile {
  constructor({ position = { x: 0, y: 0 }, enemy, damage }) {
    super({ position, enemy, damage, imageSrc: 'media/tower-models/projectiles/arrow.png', power: 100 });
  }
}

class MageProjectile1 extends Projectile {
  constructor({ position = { x: 0, y: 0 }, enemy, damage }) {
    super({ position, enemy, damage, imageSrc: 'media/tower-models/projectiles/magic_ball.png', power: 50 });
  }

}
class Soldier extends Sprite {
  constructor({ position, rallyPoint, stats, parentBarracks }) {
    // Podpinamy sprite'a z animacją (domyślnie dałem goblina jako placeholeder, zmień ścieżkę na swojego rycerza)
    super({ 
      position, 
      imageSrc: 'media/tower-models/unit/goblin_warrior.png', 
      frames: { max: 20 }, // Upewnij się, że max zgadza się z ilością klatek na Twoim spritesheecie
      offset: { x: 0, y: -10 } 
    }); 
    this.outOfCombatTimer = 0;
    this.rallyPoint = rallyPoint;
    this.parentBarracks = parentBarracks;
    this.width = 40; // Powiększyłem hitboxa, żeby lepiej pasował do sprite'a
    this.height = 50;
    this.center = { x: position.x + this.width / 2, y: position.y + this.height / 2 };
    this.speed = 80;
    this.maxHealth = stats.unitHealth;
    this.health = this.maxHealth;
    this.damage = stats.damage;
    this.cooldown = stats.cooldown;
    this.attackTimer = 0;
    this.target = null;
    this.state = 'moving'; // moving, idle, fighting, dead
    
    // Zmienna potrzebna do określania kierunku obrotu grafiki
    this.velocity = { x: 0, y: 0 };
  }

  draw() {
    if (this.state === 'dead') return;

    // --- LOGIKA RYSOWANIA SPRITE'A Z OBRACANIEM ---
    const angle = Math.atan2(this.velocity.y, this.velocity.x);
    c.save();
    c.translate(this.center.x, this.center.y);

    // Odbicie lustrzane - patrzy tam, gdzie idzie, albo tam, gdzie uderza
    let flipAngle = angle;
    if (this.state === 'fighting' && this.target) {
         flipAngle = Math.atan2(this.target.center.y - this.center.y, this.target.center.x - this.center.x);
    }

    // Jeśli cel jest po lewej, obróć kontekst
    if (Math.abs(flipAngle) > Math.PI / 2) {
      c.scale(-1, 1); 
    }

    // Rysowanie i wycinanie odpowiedniej klatki
    if (this.image.src && this.frames.max) {
        const cropWidth = this.image.width / this.frames.max;
        const crop = {
          position: { x: cropWidth * this.frames.current, y: 0 },
          width: cropWidth,
          height: this.image.height
        };
        
        c.drawImage(
            this.image,
            crop.position.x, crop.position.y, crop.width, crop.height,
            -this.width / 2 + this.offset.x, -this.height / 2 + this.offset.y,
            crop.width, crop.height
        );
    }
    c.restore();

    // --- PASKI ZDROWIA (zachowane i przeskalowane) ---
    c.fillStyle = 'red';
    c.fillRect(this.position.x, this.position.y - 15, this.width, 6);
    c.fillStyle = 'rgba(39, 199, 216, 1)'; // Użyłem tego samego koloru co u wrogów dla spójności UI
    c.fillRect(this.position.x, this.position.y - 15, this.width * (this.health / this.maxHealth), 6);
  }

  update(dt) {
    if (this.state === 'dead') return;

    // Odpala aktualizację klatek animacji TYLKO jak nie stoi w miejscu
    if (this.state !== 'idle') {
        super.update(dt); 
    }

    if (this.health <= 0) {
      this.state = 'dead';
      if (this.target) this.target.blockedBy = null;
      return;
    }
    if (this.state === 'fighting') {
      this.outOfCombatTimer = 0; // Reset licznika, bo walczymy
    } else {
      this.outOfCombatTimer += dt; // Nabijanie czasu poza walką
    }

    // Jeśli minęło 5s i HP jest mniejsze niż max
    if (this.outOfCombatTimer >= 5 && this.health < this.maxHealth) {
      this.health += 10 * dt; // Regeneracja 10 HP na sekundę
      if (this.health > this.maxHealth) this.health = this.maxHealth; // Cap na max HP
    }
    this.center = { x: this.position.x + this.width / 2, y: this.position.y + this.height / 2 };

    if (this.state === 'moving' || !this.target) {
      const dest = this.target ? this.target.center : this.rallyPoint;
      const angle = Math.atan2(dest.y - this.center.y, dest.x - this.center.x);
      const dist = Math.hypot(dest.x - this.center.x, dest.y - this.center.y);

      if (dist > 5) {
        // Zapisujemy velocity, żeby draw() wiedziało w którą stronę się obrócić
        this.velocity.x = Math.cos(angle) * this.speed;
        this.velocity.y = Math.sin(angle) * this.speed;

        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
      } else {
        this.velocity.x = 0;
        this.velocity.y = 0;
        if (this.target) {
          this.state = 'fighting';
          this.target.blockedBy = this;
        } else {
          this.state = 'idle';
        }
      }
    }

    if (this.state === 'fighting' && this.target) {
      this.velocity.x = 0;
      this.velocity.y = 0;
      if (this.target.health <= 0 || this.target.position.x > canvas.width) {
        this.target = null;
        this.state = 'moving';
      } else {
        this.attackTimer += dt;
        if (this.attackTimer >= this.cooldown) {
          this.target.health -= this.damage;
          this.attackTimer = 0;
        }
      }
    }
  }
}

class BarracksLvl1 extends Tower {
  constructor({ position }) {
    super({
      position,
      stats: stats.towers.barracks.lvl1,
      baseTowerType: "barracks",
      level: 1,
      imageSrc: "media/barracks.png", // Podmień jeśli masz lepszy sprite
      frames: { max: 1 },
      offset: { x: 0, y: -20 }
    });
    this.soldiers = [];
    this.respawnTimers = [0, 0, 0];
    this.rallyPoint = this.findNearestPath();
    this.spawnSoldiers();
  }

  findNearestPath() {
    let nearest = { x: this.center.x, y: this.center.y };
    let minDist = Infinity;
    for (let i = 0; i < path.length; i++) {
      if (path[i] === 289) { // 289 to kafelki drogi
        const px = (i % 20) * 64 + 32;
        const py = Math.floor(i / 20) * 64 + 32;
        const dist = Math.hypot(px - this.center.x, py - this.center.y);
        if (dist < minDist && dist <= this.radius) {
          minDist = dist;
          nearest = { x: px, y: py };
        }
      }
    }
    return nearest;
  }

  setRallyPoint(x, y) {
    this.rallyPoint = { x, y };
    const offsets = [{ x: 0, y: -20 }, { x: -20, y: 15 }, { x: 20, y: 15 }];
    this.soldiers.forEach((s, idx) => {
      if (s) {
        s.rallyPoint = { x: this.rallyPoint.x + offsets[idx].x, y: this.rallyPoint.y + offsets[idx].y };
        s.state = 'moving';
        if (s.target) s.target.blockedBy = null;
        s.target = null;
      }
    });
  }

  spawnSoldiers() {
    const offsets = [{ x: 0, y: -20 }, { x: -20, y: 15 }, { x: 20, y: 15 }];
    for (let i = 0; i < 3; i++) {
      this.soldiers[i] = new Soldier({
        position: { x: this.center.x, y: this.center.y },
        rallyPoint: { x: this.rallyPoint.x + offsets[i].x, y: this.rallyPoint.y + offsets[i].y },
        stats: stats.towers.barracks.lvl1,
        parentBarracks: this
      });
    }
  }

  draw() {
    super.draw();
    this.soldiers.forEach(s => s?.draw());
  }

  update(dt) {
    super.update(dt);

    // Respawn i update żołnierzy
    for (let i = 0; i < 3; i++) {
      const s = this.soldiers[i];
      if (!s || s.state === 'dead') {
        this.respawnTimers[i] += dt;
        if (this.respawnTimers[i] >= stats.towers.barracks.lvl1.respawn) {
          const offsets = [{ x: 0, y: -20 }, { x: -20, y: 15 }, { x: 20, y: 15 }];
          this.soldiers[i] = new Soldier({
            position: { x: this.center.x, y: this.center.y },
            rallyPoint: { x: this.rallyPoint.x + offsets[i].x, y: this.rallyPoint.y + offsets[i].y },
            stats: stats.towers.barracks.lvl1,
            parentBarracks: this
          });
          this.respawnTimers[i] = 0;
        }
      } else {
        s.update(dt);
        // System agro - szukaj nieprzyjaciół w pobliżu rally pointu
        if (!s.target && s.state !== 'moving') {
          const validEnemies = enemies.filter(e =>
            !e.blockedBy &&
            e.position.x > 0 &&
            !e.isFlying && // <--- DODAJ TO: Żołnierz ignoruje latające
            Math.hypot(e.center.x - s.rallyPoint.x, e.center.y - s.rallyPoint.y) < 60
          );

          if (validEnemies.length > 0) {
            s.target = validEnemies[0];
            s.target.blockedBy = s;
            s.state = 'moving';
          }
        }
      }
    }
  }
  upgrade() {
    if (coins < stats.towers.barracks.lvl2.cost) return null;
    coins -= stats.towers.barracks.lvl2.cost;
    const upgraded = new BarracksLvl2({ position: this.position });
    // Dziedziczymy punkt zbiórki, żeby gracza nie irytował reset pozycji wojska
    upgraded.setRallyPoint(this.rallyPoint.x, this.rallyPoint.y);
    return upgraded;
  }
}
class BarracksLvl2 extends Tower {
  constructor({ position }) {
    super({
      position,
      stats: stats.towers.barracks.lvl2,
      baseTowerType: "barracks",
      level: 2,
      imageSrc: "media/barracks.png", // TODO: Podmień na asset Lvl2
      frames: { max: 1 },
      offset: { x: 0, y: -20 }
    });
    this.soldiers = [];
    this.respawnTimers = [0, 0, 0, 0];
    // Zmieniona formacja dla 4 jednostek (kwadrat)
    this.offsets = [{ x: -15, y: -15 }, { x: 15, y: -15 }, { x: -15, y: 15 }, { x: 15, y: 15 }];
    this.rallyPoint = this.findNearestPath();
    this.spawnSoldiers();
  }

  findNearestPath() {
    let nearest = { x: this.center.x, y: this.center.y };
    let minDist = Infinity;
    for (let i = 0; i < path.length; i++) {
      if (path[i] === 289) {
        const px = (i % 20) * 64 + 32;
        const py = Math.floor(i / 20) * 64 + 32;
        const dist = Math.hypot(px - this.center.x, py - this.center.y);
        if (dist < minDist && dist <= this.radius) {
          minDist = dist;
          nearest = { x: px, y: py };
        }
      }
    }
    return nearest;
  }

  setRallyPoint(x, y) {
    this.rallyPoint = { x, y };
    this.soldiers.forEach((s, idx) => {
      if (s) {
        s.rallyPoint = { x: this.rallyPoint.x + this.offsets[idx].x, y: this.rallyPoint.y + this.offsets[idx].y };
        s.state = 'moving';
        if (s.target) s.target.blockedBy = null;
        s.target = null;
      }
    });
  }

  spawnSoldiers() {
    for (let i = 0; i < 4; i++) {
      this.soldiers[i] = new Soldier({
        position: { x: this.center.x, y: this.center.y },
        rallyPoint: { x: this.rallyPoint.x + this.offsets[i].x, y: this.rallyPoint.y + this.offsets[i].y },
        stats: stats.towers.barracks.lvl2,
        parentBarracks: this
      });
    }
  }

  draw() {
    super.draw();
    this.soldiers.forEach(s => s?.draw());
  }

  update(dt) {
    super.update(dt);
    for (let i = 0; i < 4; i++) {
      const s = this.soldiers[i];
      if (!s || s.state === 'dead') {
        this.respawnTimers[i] += dt;
        if (this.respawnTimers[i] >= stats.towers.barracks.lvl2.respawn) {
          this.soldiers[i] = new Soldier({
            position: { x: this.center.x, y: this.center.y },
            rallyPoint: { x: this.rallyPoint.x + this.offsets[i].x, y: this.rallyPoint.y + this.offsets[i].y },
            stats: stats.towers.barracks.lvl2,
            parentBarracks: this
          });
          this.respawnTimers[i] = 0;
        }
      } else {
        s.update(dt);
        if (!s.target && s.state !== 'moving') {
          const validEnemies = enemies.filter(e =>
            !e.blockedBy && e.position.x > 0 && !e.isFlying && 
            Math.hypot(e.center.x - s.rallyPoint.x, e.center.y - s.rallyPoint.y) < 60
          );
          if (validEnemies.length > 0) {
            s.target = validEnemies[0];
            s.target.blockedBy = s;
            s.state = 'moving';
          }
        }
      }
    }
  }

  upgrade() {
    if (coins < stats.towers.barracks.lvl3.cost) return null;
    coins -= stats.towers.barracks.lvl3.cost;
    const upgraded = new BarracksLvl3({ position: this.position });
    upgraded.setRallyPoint(this.rallyPoint.x, this.rallyPoint.y);
    return upgraded;
  }
}

class BarracksLvl3 extends Tower {
  constructor({ position }) {
    super({
      position,
      stats: stats.towers.barracks.lvl3,
      baseTowerType: "barracks",
      level: 3,
      imageSrc: "media/barracks.png", // TODO: Podmień na asset Lvl3
      frames: { max: 1 },
      offset: { x: 0, y: -20 }
    });
    this.soldiers = [];
    this.respawnTimers = [0, 0, 0, 0, 0];
    // Zmieniona formacja dla 5 jednostek (krzyż/pięciokąt)
    this.offsets = [{ x: 0, y: -20 }, { x: -20, y: 0 }, { x: 20, y: 0 }, { x: -15, y: 20 }, { x: 15, y: 20 }];
    this.rallyPoint = this.findNearestPath();
    this.spawnSoldiers();
  }

  findNearestPath() {
    let nearest = { x: this.center.x, y: this.center.y };
    let minDist = Infinity;
    for (let i = 0; i < path.length; i++) {
      if (path[i] === 289) {
        const px = (i % 20) * 64 + 32;
        const py = Math.floor(i / 20) * 64 + 32;
        const dist = Math.hypot(px - this.center.x, py - this.center.y);
        if (dist < minDist && dist <= this.radius) {
          minDist = dist;
          nearest = { x: px, y: py };
        }
      }
    }
    return nearest;
  }

  setRallyPoint(x, y) {
    this.rallyPoint = { x, y };
    this.soldiers.forEach((s, idx) => {
      if (s) {
        s.rallyPoint = { x: this.rallyPoint.x + this.offsets[idx].x, y: this.rallyPoint.y + this.offsets[idx].y };
        s.state = 'moving';
        if (s.target) s.target.blockedBy = null;
        s.target = null;
      }
    });
  }

  spawnSoldiers() {
    for (let i = 0; i < 5; i++) {
      this.soldiers[i] = new Soldier({
        position: { x: this.center.x, y: this.center.y },
        rallyPoint: { x: this.rallyPoint.x + this.offsets[i].x, y: this.rallyPoint.y + this.offsets[i].y },
        stats: stats.towers.barracks.lvl3,
        parentBarracks: this
      });
    }
  }

  draw() {
    super.draw();
    this.soldiers.forEach(s => s?.draw());
  }

  update(dt) {
    super.update(dt);
    for (let i = 0; i < 5; i++) {
      const s = this.soldiers[i];
      if (!s || s.state === 'dead') {
        this.respawnTimers[i] += dt;
        if (this.respawnTimers[i] >= stats.towers.barracks.lvl3.respawn) {
          this.soldiers[i] = new Soldier({
            position: { x: this.center.x, y: this.center.y },
            rallyPoint: { x: this.rallyPoint.x + this.offsets[i].x, y: this.rallyPoint.y + this.offsets[i].y },
            stats: stats.towers.barracks.lvl3,
            parentBarracks: this
          });
          this.respawnTimers[i] = 0;
        }
      } else {
        s.update(dt);
        if (!s.target && s.state !== 'moving') {
          const validEnemies = enemies.filter(e =>
            !e.blockedBy && e.position.x > 0 && !e.isFlying &&
            Math.hypot(e.center.x - s.rallyPoint.x, e.center.y - s.rallyPoint.y) < 60
          );
          if (validEnemies.length > 0) {
            s.target = validEnemies[0];
            s.target.blockedBy = s;
            s.state = 'moving';
          }
        }
      }
    }
  }

  upgrade() {
    // Max level, nie robimy nic
    return null;
  }
}