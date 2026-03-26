const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 1280;
canvas.height = 768;

c.fillStyle = 'white';
c.fillRect(0, 0, canvas.width, canvas.height);

const placementTilesData2D = [];

const waveDisplay = document.querySelector('.wave-display');
function WaveUpdate() {
  waveDisplay.textContent = `Waves: ${currentWave} / ${waves}`;
}

for (let i = 0; i < placementTilesData.length; i += 20) {
  placementTilesData2D.push(placementTilesData.slice(i, i + 20));
}

const fullscreenBtn = document.getElementById('fullscreen-btn');
const gameContainer = document.getElementById('game-container');

fullscreenBtn.addEventListener('click', () => {
    // Sprawdzamy, czy gra NIE jest na pełnym ekranie
    if (!document.fullscreenElement) {
        // Wchodzimy we fullscreen
        gameContainer.requestFullscreen().catch(err => {
            console.log(`Błąd: Nie można włączyć pełnego ekranu: ${err.message}`);
        });
    } else {
        // Wychodzimy z fullscreena
        document.exitFullscreen();
    }
});

const tileImage = new Image();
tileImage.src = 'media/Free-Spot.png';
const placementTiles = [];

placementTilesData2D.forEach((row, y) => {
  row.forEach((symbol, x) => {
    if (symbol === 288) {
      placementTiles.push(
        new PlacementTile({
          position: {
            x: x * 64,
            y: y * 64
          }
        })
      );
    }
  });
});

const image = new Image();
const play = document.querySelector('.play');
const switcher = document.querySelector('.off')

play.addEventListener('click', () => {
  switcher.classList.toggle('off')
  if (!switcher.classList.contains('off')) {
    spawnEnemies(currentWave);

    play.style.display = 'none'
  }
})
image.onload = () => {
  animate();
};



image.src = 'media/map.png';



const enemies = [];
const enemyClasses = {
  goblin: Goblin,
  orc: Orc,
  bat: Bat,
  giantBat: GiantBat,
  gobChamp: GoblinChampion,
  gobGiant: GoblinGiant,
  goblinChief: GoblinChief,
}

const tracks = {
  1: waypoints,
  2: waypoints2
};


function spawnEnemies(waveNumber) {
  const wave = stats.waves[String(waveNumber)];
  if (!wave) return;

  // Śledzimy dystans (offset) niezależnie dla każdej ścieżki
  let trackOffsets = { 1: 0, 2: 0 }; 

  wave.forEach((enemyGroup) => {
    const { type, count, track, offset, hold } = enemyGroup;
    const EnemyClass = enemyClasses[type];
    const waypoints = tracks[track];
    const enemyStats = stats.enemies[type];

    if (EnemyClass && waypoints && enemyStats) {
      const spacing = hold ? hold * enemyStats.speed : offset;
      
      for (let i = 0; i < count; i++) {
        trackOffsets[track] += spacing; 
        
        const enemy = new EnemyClass({
          position: { x: waypoints[0].x - trackOffsets[track], y: waypoints[0].y },
          waypoints: waypoints,
          enemyType: type
        });
        
        // Dynamiczne skalowanie HP: +15% co każdą falę
        const hpMultiplier = Math.pow(1.10, waveNumber - 1);
        enemy.health = enemyStats.health * hpMultiplier;  
        enemy.maxHealth = enemy.health; // Przyda się do paska życia

        enemy.healthCost = enemyStats.healthCost;
        enemies.push(enemy);
      }
    }
  });
}

const buildings = [];
let activeTile = undefined;
let waveCount = 1;
let waves = 20
let selectedTile = null;

function updateCoins() {
  document.querySelector('.gold').innerHTML = coins + '<img src="media/resources/gold.png" class="rss-img" style="margin-top:3px;">';
}
function updateHearts() {
  document.querySelector('.hearts').innerHTML = hearts + '<img src="media/resources/hearts.png" class="rss-img" style="margin-top:3px;">';
} let lastTime = 0;

function animate(timestamp = 0) {
  const animationID = requestAnimationFrame(animate);

  const deltaTime = (timestamp - lastTime) / 1000;
  lastTime = timestamp;


  const dt = Math.min(deltaTime, 0.1);

  console.log(`Frame: enemies=${enemies.length}, projectiles=${buildings.reduce((acc, b) => acc + b.projectiles.length, 0)}`);

  // Update dynamic state passing 'dt'
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    enemy.update(dt);
    if (enemy.health <= 0) {
      coins += enemy.reward;
      updateCoins();
      enemies.splice(i, 1);
      continue; // Zabity, więc pomijamy resztę logiki dla niego
    }
    if (enemy.position.x > canvas.width) {
      hearts -= enemy.healthCost;
      enemies.splice(i, 1);
      if (hearts <= 0) {
        cancelAnimationFrame(animationID);
        document.querySelector('.game-over').style.display = 'flex';
      }
    }
  }

  if (!switcher.classList.contains('off')) {
    if (enemies.length === 0) {
      currentWave += 1;


      spawnEnemies(currentWave);
      updateCoins();
    }
  }
  if (currentWave === (waves + 1)) {
    cancelAnimationFrame(animationID);
    document.querySelector('.win').style.display = 'flex';
  }



  placementTiles.forEach((tile) => tile.update(mouse));

  buildings.forEach((building) => {
    building.update(dt);
    building.target = null;
    const validEnemies = enemies.filter(enemy => {
      const xDifference = enemy.center.x - building.center.x;
      const yDifference = enemy.center.y - building.center.y;
      const distance = Math.hypot(xDifference, yDifference);
      return distance < enemy.radius + building.radius;
    });
    building.target = validEnemies[0];

    for (let i = building.projectiles.length - 1; i >= 0; i--) {
      const projectile = building.projectiles[i];

      // If enemy is gone, remove projectile
      if (!projectile.enemy || enemies.indexOf(projectile.enemy) === -1) {
        building.projectiles.splice(i, 1);
        continue;
      }

      projectile.update(dt);
      const xDifference = projectile.enemy.center.x - projectile.position.x;
      const yDifference = projectile.enemy.center.y - projectile.position.y;
      const distance = Math.hypot(xDifference, yDifference);

      if (distance < projectile.enemy.radius + projectile.radius) {
        let damageDealt = projectile.damage;
        if (currentWave > 10) {
          if (Math.random() > 0.95) {
            damageDealt = 0;
            console.log("blocked hit");
          }
        }

        if (damageDealt > 0) {
          projectile.enemy.health -= damageDealt;
        }

        if (projectile.enemy.health <= 0) {
          const enemyIndex = enemies.findIndex(enemy => projectile.enemy === enemy);
          if (enemyIndex > -1) {
            coins += projectile.enemy.reward;
            updateCoins();
            enemies.splice(enemyIndex, 1);
          }
        }

        building.projectiles.splice(i, 1);
      }
    }
  });

  // Draw Map
  c.drawImage(image, 0, 0);

  // Sort and Draw
  const drawableObjects = [...placementTiles, ...buildings, ...enemies];
  buildings.forEach(b => drawableObjects.push(...b.projectiles));
  drawableObjects.sort((a, b) => {
    let aY = a.position.y;
    let bY = b.position.y;

    if (a instanceof Enemy) aY += a.height;
    if (b instanceof Enemy) bY += b.height;

    if (a instanceof Tower) aY += 32;
    if (b instanceof Tower) bY += 32;

    return aY - bY;
  });
  drawableObjects.forEach(obj => obj.draw());

  if (enemies.length === 1) {
    console.log("Ghost enemy?", enemies[0]);
  }
  if (isSettingRally && selectedBuilding) {
    // Podświetl drogę w zasięgu
    c.fillStyle = 'rgba(255, 255, 0, 0.3)';
    path.forEach((tile, i) => {
      if (tile === 289) {
        const px = (i % 20) * 64;
        const py = Math.floor(i / 20) * 64;
        const dist = Math.hypot(px + 32 - selectedBuilding.center.x, py + 32 - selectedBuilding.center.y);
        if (dist <= selectedBuilding.radius) {
          c.fillRect(px, py, 64, 64);
        }
      }
    });

    // Okrąg zasięgu z koszar
    c.beginPath();
    c.arc(selectedBuilding.center.x, selectedBuilding.center.y, selectedBuilding.radius, 0, Math.PI * 2);
    c.strokeStyle = 'white';
    c.stroke();
  }
  updateCoins();
  WaveUpdate();
  updateHearts();
}

const mouse = {
  x: undefined,
  y: undefined
};

let selectedBuilding = null;
let isSettingRally = false;
const upgradeMenu = document.getElementById("tower-upgrade-menu");
const towerNameLevel = document.getElementById("tower-name-level");
const towerDamage = document.getElementById("tower-damage");
const towerRange = document.getElementById("tower-range");
const towerCooldown = document.getElementById("tower-cooldown");
const upgradeButton = document.getElementById("upgrade-button");
const sellButton = document.getElementById("sell-button");
const closeUpgradeMenuBtn = document.getElementById("close-upgrade-menu");

function updateUpgradeMenu() {
  if (!selectedBuilding) {
    upgradeMenu.style.display = "none";
    return;
  }

  const baseTowerStats = stats.towers[selectedBuilding.baseTowerType.toLowerCase()];
  const nextLevel = selectedBuilding.level + 1;
  const upgradeStats = baseTowerStats?.[`lvl${nextLevel}`];

  towerNameLevel.textContent = `${selectedBuilding.name} `;
  towerDamage.textContent = selectedBuilding.damage + 'HP';
  towerRange.textContent = selectedBuilding.radius / 10 + 'm';
  towerCooldown.textContent = selectedBuilding.cooldown + 's';

  if (upgradeStats) {
    upgradeButton.textContent = `Upgrade (${upgradeStats.cost}g)`;
    upgradeButton.disabled = coins < upgradeStats.cost;
  } else {
    upgradeButton.textContent = "Max Level";
    upgradeButton.disabled = true;
  }

  let totalCost = 0;
  for (let i = 1; i <= selectedBuilding.level; i++) {
    totalCost += baseTowerStats[`lvl${i}`].cost;
  }
  sellButton.textContent = `Sell (${Math.round(totalCost * 0.7)}g)`;

  const rect = canvas.getBoundingClientRect();
  upgradeMenu.style.left = `${rect.left + selectedBuilding.position.x + 32}px`;
  upgradeMenu.style.top = `${rect.top + selectedBuilding.position.y - 64}px`;
  upgradeMenu.style.display = "block";
  const rallyBtn = document.getElementById("rally-button");
  if (selectedBuilding.baseTowerType === 'barracks') {
    rallyBtn.style.display = "block";
  } else {
    rallyBtn.style.display = "none";
  }
}

canvas.addEventListener("click", (event) => {
  const menu = document.getElementById("tower-menu");
  const mouseX = event.offsetX;
  const mouseY = event.offsetY;

  if (isSettingRally && selectedBuilding && selectedBuilding.baseTowerType === 'barracks') {
    const tileX = Math.floor(mouseX / 64);
    const tileY = Math.floor(mouseY / 64);
    const pathIndex = tileY * 20 + tileX;

    if (path[pathIndex] === 289) {
      const centerX = tileX * 64 + 32;
      const centerY = tileY * 64 + 32;
      const dist = Math.hypot(centerX - selectedBuilding.center.x, centerY - selectedBuilding.center.y);

      if (dist <= selectedBuilding.radius) {
        selectedBuilding.setRallyPoint(centerX, centerY);
        isSettingRally = false;
        canvas.style.cursor = 'default';
      }
    }
    return; // Blokuje resztę kliknięć
  }
  // Check if a building was clicked
  let clickedBuilding = null;
  for (const building of buildings) {
    if (
      mouseX >= building.position.x && mouseX <= building.position.x + building.width &&
      mouseY >= building.position.y && mouseY <= building.position.y + building.height
    ) {
      clickedBuilding = building;
      break;
    }
  }

  if (clickedBuilding) {
    selectedBuilding = clickedBuilding;
    selectedTile = null; // Deselect any placement tile
    menu.style.display = "none";
    updateUpgradeMenu();
    upgradeMenu.style.display = "block";

    let upTop = clickedTower.position.y;
    const upHeight = upgradeMenu.offsetHeight;

    if (upTop + upHeight > canvas.height) {
        upTop = canvas.height - upHeight - 10;
    }

    upgradeMenu.style.top = `${upTop}px`;
    upgradeMenu.style.left = `${clickedTower.position.x}px`;
  } else {
    // If no building was clicked, check for an empty placement tile
    let clickedTile = null;
    for (const tile of placementTiles) {
      if (
        mouseX >= tile.position.x && mouseX <= tile.position.x + tile.size &&
        mouseY >= tile.position.y && mouseY <= tile.position.y + tile.size &&
        !tile.isOccupied
      ) {
        clickedTile = tile;
        break;
      }
    }

    if (activeTile && !activeTile.isOccupied) {
    selectedTile = activeTile;
    const menu = document.getElementById("tower-menu");
    menu.style.display = "flex";

    // Środek kafelka w układzie gry
    let tileCenterX = activeTile.position.x + (activeTile.size / 2);
    let tileCenterY = activeTile.position.y + (activeTile.size / 2);

    const menuHalfSize = 125; // Połowa wymiaru #tower-menu (250px / 2)
    const safeMargin = 15; // Bezpieczny odstęp od krawędzi

    // 1. Blokada wyjazdu dołem
    const bottomEdge = tileCenterY + menuHalfSize;
    if (bottomEdge > canvas.height) {
        tileCenterY -= (bottomEdge - canvas.height + safeMargin); 
    }

    // 2. Blokada wyjazdu lewą stroną
    const leftEdge = tileCenterX - menuHalfSize;
    if (leftEdge < 0) {
        tileCenterX += (Math.abs(leftEdge) + safeMargin);
    }

    // Przeliczamy pozycję na PROCENTY względem wymiarów canvasa
    const leftPercent = (tileCenterX / 1280) * 100; 
    const topPercent = (tileCenterY / 768) * 100;

    // Ustawiamy pozycję w procentach
    menu.style.left = `${leftPercent}%`;
    menu.style.top = `${topPercent}%`;
    
    // Centrujemy samo menu względem tego punktu
    menu.style.transform = "translate(-50%, -50%)";

    arrangeButtonsInCircle();
}else {
      // Clicked outside of any building or empty tile
      menu.style.display = "none";
      selectedTile = null;
      upgradeMenu.style.display = "none";
      selectedBuilding = null;
    }
  }
});

closeUpgradeMenuBtn.onclick = () => {
  upgradeMenu.style.display = "none";
  selectedBuilding = null;
};

upgradeButton.onclick = () => {
  if (selectedBuilding) {
    const buildingIndex = buildings.findIndex(b => b === selectedBuilding);
    const upgraded = selectedBuilding.upgrade();
    if (upgraded) {
      buildings[buildingIndex] = upgraded;
      selectedBuilding = upgraded;
    }
    upgradeMenu.style.display = "none";
    selectedBuilding = null;
  }
};
document.getElementById("rally-button").onclick = () => {
  isSettingRally = true;
  upgradeMenu.style.display = "none";
  canvas.style.cursor = 'crosshair'; // Wskaźnik myszy daje znać, że celujemy
};
sellButton.onclick = () => {
  if (selectedBuilding) {
    const buildingIndex = buildings.findIndex(b => b === selectedBuilding);
    if (buildingIndex > -1) {
      const baseTowerStats = stats.towers[selectedBuilding.baseTowerType.toLowerCase()];
      let totalCost = 0;
      for (let i = 1; i <= selectedBuilding.level; i++) {
        totalCost += baseTowerStats[`lvl${i}`].cost;
      }
      coins += Math.round(totalCost * 0.8);
      updateCoins();

      // Find the placement tile and mark it as not occupied
      for (const tile of placementTiles) {
        if (tile.position.x === selectedBuilding.position.x && tile.position.y === selectedBuilding.position.y) {
          tile.isOccupied = false;
          break;
        }
      }

      buildings.splice(buildingIndex, 1);
    }
    upgradeMenu.style.display = "none";
    selectedBuilding = null;
  }
};

const closeTowerMenuBtn = document.getElementById("close-tower-menu");
if (closeTowerMenuBtn) {
  closeTowerMenuBtn.onclick = () => {
    document.getElementById("tower-menu").style.display = "none";
    selectedTile = null;
  };
}

document.getElementById("barracks").onclick = (e) => {
  e.stopPropagation();
  if (!selectedTile) return;
  if (coins - stats.towers.barracks.lvl1.cost < 0) return;
  coins -= stats.towers.barracks.lvl1.cost;
  buildings.push(new BarracksLvl1({ position: selectedTile.position }));
  selectedTile.isOccupied = true;
  document.getElementById("tower-menu").style.display = "none";
  selectedTile = null;
};

document.getElementById("archer-tower").onclick = (e) => {
  e.stopPropagation();
  if (!selectedTile) return;
  if (coins - stats.towers.archer.lvl1.cost < 0) return;
  coins -= stats.towers.archer.lvl1.cost;
  buildings.push(new ArcherTowerLvl1({ position: selectedTile.position }));
  selectedTile.isOccupied = true;
  document.getElementById("tower-menu").style.display = "none";
  selectedTile = null
};


document.getElementById("mage-tower").onclick = (e) => {
  e.stopPropagation();
  if (!selectedTile) return;
  if (coins - stats.towers.mage.lvl1.cost < 0) return;
  coins -= stats.towers.mage.lvl1.cost;
  buildings.push(new MageTowerLvl1({ position: selectedTile.position }));
  selectedTile.isOccupied = true;
  document.getElementById("tower-menu").style.display = "none";
  selectedTile = null
};



window.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    
    // Obliczamy skalę - to zadziała zawsze, nawet jak okno przeglądarki jest pomniejszone
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Zawsze używamy skalowania względem rect, to najbardziej odporna metoda
    mouse.x = (event.clientX - rect.left) * scaleX;
    mouse.y = (event.clientY - rect.top) * scaleY;

    activeTile = null;
    for (let i = 0; i < placementTiles.length; i++) {
        const tile = placementTiles[i];
        if (
            mouse.x > tile.position.x && mouse.x < tile.position.x + tile.size &&
            mouse.y > tile.position.y && mouse.y < tile.position.y + tile.size
        ) {
            activeTile = tile;
            break;
        }
    }
});

function arrangeButtonsInCircle() {
  const menu = document.getElementById("tower-menu");
  const buttons = menu.querySelectorAll(".tower-options");
  const count = buttons.length;
  const menuRadius = 80;
  const buttonSize = 80;
  const buttonHalfSize = buttonSize / 2;
  const outerRadius = menuRadius + buttonHalfSize;
  const centerX = 125;
  const centerY = 125;

  buttons.forEach((btn, i) => {
    const angle = (i / count) * (2 * Math.PI) - Math.PI / 2;
    const buttonCenterX = centerX + Math.cos(angle) * outerRadius;
    const buttonCenterY = centerY + Math.sin(angle) * outerRadius;
    const x = buttonCenterX - buttonHalfSize;
    const y = buttonCenterY - buttonHalfSize;
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
  });
}