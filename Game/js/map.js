// ==========================================
// MAP.JS - BEZSZWOWA MAPA Z POLANAMI I KLASTRAI ZIÓŁ
// ==========================================

// Grass accent variants for each color (preload all images)
const GRASS_VARIANTS = {
    0: [], // Dark green variants
    1: [], // Medium green variants
    2: []  // Light green variants
};

// Initialize grass images with proper biome variants. The old version loaded
// every shade from the light folder, which is why the forest region never
// visually stood out and all patches looked like the same stale grass.
function initGrassVariants() {
    const variantPaths = {
        0: 'img/textures/grass/dark-variant',
        1: 'img/textures/grass/mid-variant',
        2: 'img/textures/grass/light-variant'
    };

    Object.keys(variantPaths).forEach((key) => {
        const index = Number(key);
        const basePath = variantPaths[index];
        const files = Array.from({ length: 10 }, (_, i) => `${basePath}/grass${i + 1}.png`);

        GRASS_VARIANTS[index] = files.map((src) => {
            const image = loadGrassImage(src);
            const fallback = loadGrassImage('img/textures/grass/light-variant/grass1.png');
            return image && image.naturalWidth > 0 ? image : fallback;
        });
    });
}

function loadGrassImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

const FLOOR_TEXTURES = {
    wood: new Image(),
    stone: new Image()
};

FLOOR_TEXTURES.wood.src = 'img/textures/floors/wooden-floor.jpg';
FLOOR_TEXTURES.stone.src = 'img/textures/floors/cracked-stone-floor.jpg';

function drawTexturedFloor(ctx, x, y, width, height, texture, tileSize = 64, alpha = 1) {
    if (!texture || !texture.complete || texture.naturalWidth === 0) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    const pattern = ctx.createPattern(texture, 'repeat');
    if (!pattern) {
        ctx.restore();
        return;
    }

    pattern.setTransform(new DOMMatrix().scale(0.75, 0.75));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = pattern;
    ctx.fillRect(x, y, width, height);
    ctx.restore();
}

function drawRuinsGroundPatch(ctx, x, y, width, height) {
    const stoneBase = '#6b6b6b';
    const stoneDark = '#545454';
    const stoneLight = '#8a8a8a';

    ctx.fillStyle = stoneBase;
    ctx.fillRect(x, y, width, height);

    const cell = 14;
    for (let row = 0; row < height; row += cell) {
        for (let col = 0; col < width; col += cell) {
            const blockX = x + col + ((row / cell) % 2) * 4;
            const blockY = y + row + ((col / cell) % 3) * 3;
            const blockW = cell - 2 + ((row + col) % 3);
            const blockH = cell - 2 + ((row * 2 + col) % 3);
            ctx.fillStyle = (row + col) % 2 === 0 ? stoneDark : stoneLight;
            ctx.fillRect(blockX, blockY, blockW, blockH);
        }
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
        const px = x + ((i * 37) % width);
        const py = y + ((i * 43) % height);
        ctx.strokeRect(px, py, 8, 8);
    }

}

class GrassAccent {
    constructor(x, y, colorIndex, variantIndex) {
        this.x = x;
        this.y = y;
        this.colorIndex = colorIndex;
        this.variantIndex = variantIndex;
        
        // Scale: więcej na jasnych terenach, mniej na ciemnych
        const baseScale = 0.7 + (colorIndex * 0.15); // 0.7-1.0 base
        this.scale = baseScale + Math.random() * 0.7; // 0.7-1.7
        
        this.flipX = Math.random() < 0.6 ? -1 : 1; // 60% szansy na lustrzane odbicie
        this.offsetY = Math.random() * 3; // 0-3 piksele w dół
        this.width = 18;
        this.height = 18;
    }

    draw(ctx, bounds) {
        if (this.x < bounds.left || this.x > bounds.right ||
            this.y < bounds.top || this.y > bounds.bottom) return;

        const image = GRASS_VARIANTS[this.colorIndex][this.variantIndex];
        if (!image || !image.complete || image.naturalWidth === 0) return;

        const scaledW = this.width * this.scale;
        const scaledH = this.height * this.scale;
        const halfW = scaledW / 2;
        const halfH = scaledH / 2;

        ctx.save();
        ctx.translate(this.x, this.y + this.offsetY);
        ctx.scale(this.flipX, 1);
        ctx.drawImage(image, -halfW, -halfH, scaledW, scaledH);
        ctx.restore();
    }
}

const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;

// Funkcja generująca zioła w naturalnych klastrach (1-3 sztuki w kępie)
function createHerbCluster(clusterId, type, centerX, centerY) {
    const herbs = [];
    const rnd = Math.random();
    let count = 1;
    if (rnd > 0.90) count = 3;       // 10% szans na 3 sztuki
    else if (rnd > 0.65) count = 2;  // 25% szans na 2 sztuki

    for (let i = 0; i < count; i++) {
        const offsetX = (Math.random() - 0.5) * 35;
        const offsetY = (Math.random() - 0.5) * 35;
        herbs.push({
            id: `${clusterId}_${i}`,
            type: type,
            x: centerX + offsetX,
            y: centerY + offsetY,
            picked: false
        });
    }
    return herbs;
}

function findBladeSplitIndex(arr, targetY) {
    let low = 0, high = arr.length;
    while (low < high) {
        const mid = (low + high) >>> 1;
        if (arr[mid].y <= targetY) low = mid + 1;
        else high = mid;
    }
    return low;
}

const GRASS_BIOME_PALETTES = {
    plains: [
        '#3b6514',
        '#4d7f1d',
        '#6a982d',
        '#82b63d',
        '#9ccf5a',
        '#b7df7f'
    ],
    forest: [
        '#143d24',
        '#285d36',
        '#3d7b4a',
        '#5e9a5d',
        '#7eb36f',
        '#9cc98a'
    ]
};
const GRASS_PALETTE = GRASS_BIOME_PALETTES.plains;
const GRASS_RGB = GRASS_PALETTE.map(hexToRgb);

function grassBiomeMask(x, y, seed) {
    const forestStartX = 2300;
    const forestEndX = 5500;
    const xBand = clamp((x - forestStartX) / (forestEndX - forestStartX), 0, 1);
    const broadForest = xBand * xBand * (3 - 2 * xBand);

    const s1 = fbm(x * 0.0018 + seed * 0.22, y * 0.0017 - seed * 0.18, 3) - 0.5;
    const s2 = fbm(x * 0.0036 - seed * 0.13, y * 0.0031 + seed * 0.17, 2) - 0.5;
    const forestPattern = clamp(0.65 + s1 * 0.55 + s2 * 0.35, 0, 1);

    return clamp(broadForest * 0.8 + forestPattern * 0.2, 0, 1);
}

function grassBiomeBlend(x, y, seed) {
    return grassBiomeMask(x, y, seed);
}

function grassColorFromValue(value, biomeBlend = 0) {
    const plains = GRASS_BIOME_PALETTES.plains.map(hexToRgb);
    const forest = GRASS_BIOME_PALETTES.forest.map(hexToRgb);
    const band = Math.min(plains.length - 1, Math.floor(value * plains.length));
    const plainColor = plains[band];
    const forestColor = forest[band] || forest[forest.length - 1];

    return {
        r: Math.round(plainColor.r + (forestColor.r - plainColor.r) * biomeBlend),
        g: Math.round(plainColor.g + (forestColor.g - plainColor.g) * biomeBlend),
        b: Math.round(plainColor.b + (forestColor.b - plainColor.b) * biomeBlend)
    };
}
const GRASS_TILE_SIZE = 192;
const GRASS_TILE_CACHE_LIMIT = 256;
const grassTileCache = new Map();
const grassViewportCache = new Map();
const grassChunkGenerationQueue = new Map();
const grassChunkPending = new Set();
const grassVectorMapCache = new Map();
let grassChunkProcessingTimer = null;
const GRASS_ZOOM_SCALE = (CONFIG.ZOOM || 1) * 1.15;
const GRASS_RENDER_SCALE = 1;
const GRASS_MAX_QUEUE = 24;
let grassGenerationWorker = null;
let grassWorkerBusy = false;
let grassMapReadyKey = null;
let grassMapReadyPromise = null;
let grassMapReadyResolve = null;

try {
    grassGenerationWorker = new Worker('js/grass-worker.js');
} catch (error) {
    grassGenerationWorker = null;
}

function queueGrassChunk(seed, chunkX, chunkY) {
    const key = `${seed}:${chunkX}:${chunkY}`;
    if (grassTileCache.has(key) || grassChunkGenerationQueue.has(key) || grassChunkPending.has(key)) return;
    if (grassChunkGenerationQueue.size >= GRASS_MAX_QUEUE) return;
    grassChunkGenerationQueue.set(key, { seed, chunkX, chunkY });
}

function processGrassChunkQueue(limit = 6, timeBudgetMs = 8) {
    if (grassChunkGenerationQueue.size === 0) return 0;
    if (grassGenerationWorker && grassWorkerBusy) return 0;

    const startTime = performance.now();
    const cameraCenterX = camera.x + (camera.viewportWidth / (CONFIG.ZOOM || 1)) / 2;
    const cameraCenterY = camera.y + (camera.viewportHeight / (CONFIG.ZOOM || 1)) / 2;
    let generated = 0;

    while (generated < limit && grassChunkGenerationQueue.size > 0) {
        if (generated >= limit) break;
        if (performance.now() - startTime > timeBudgetMs) break;

        let nearestKey = null;
        let nearestEntry = null;
        let nearestDistance = Infinity;

        for (const [key, entry] of grassChunkGenerationQueue.entries()) {
            const chunkCenterX = (entry.chunkX + 0.5) * GRASS_CHUNK_SIZE;
            const chunkCenterY = (entry.chunkY + 0.5) * GRASS_CHUNK_SIZE;
            const distance = Math.hypot(chunkCenterX - cameraCenterX, chunkCenterY - cameraCenterY);
            if (distance < nearestDistance) {
                nearestKey = key;
                nearestEntry = entry;
                nearestDistance = distance;
            }
        }

        grassChunkGenerationQueue.delete(nearestKey);
        getGrassChunkCanvas(nearestEntry.seed, nearestEntry.chunkX, nearestEntry.chunkY);
        generated++;
        if (grassGenerationWorker) break;
    }

    return generated;
}

function scheduleGrassChunkProcessing() {
    if (grassChunkGenerationQueue.size === 0) return;
    if (grassChunkProcessingTimer !== null) return;

    grassChunkProcessingTimer = setTimeout(() => {
        grassChunkProcessingTimer = null;
        processGrassChunkQueue(6, 8);

        if (grassChunkGenerationQueue.size > 0) {
            scheduleGrassChunkProcessing();
        }
    }, 16);
}

function hash2D(x, y) {
    const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return value - Math.floor(value);
}

function smoothNoise2D(x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const xf = x - x0;
    const yf = y - y0;

    const a = hash2D(x0, y0);
    const b = hash2D(x0 + 1, y0);
    const c = hash2D(x0, y0 + 1);
    const d = hash2D(x0 + 1, y0 + 1);

    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const ab = a + (b - a) * u;
    const cd = c + (d - c) * u;
    return ab + (cd - ab) * v;
}

function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const full = clean.length === 3
        ? clean.split('').map(ch => ch + ch).join('')
        : clean;
    const num = parseInt(full, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

function fbm(x, y, octaves = 4) {
    let total = 0;
    let amp = 0.5;
    let freq = 1;
    let norm = 0;

    for (let i = 0; i < octaves; i++) {
        total += smoothNoise2D(x * freq, y * freq) * amp;
        norm += amp;
        freq *= 2;
        amp *= 0.5;
    }

    return total / norm;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0, edge1, value) {
    const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

function grassFieldValue(x, y, seed) {
    const scaledX = x * GRASS_ZOOM_SCALE;
    const scaledY = (y + Math.sin(x * 0.008 + seed * 0.03) * 4) * GRASS_ZOOM_SCALE;
    const warpX = (smoothNoise2D(scaledX * 0.0018 + seed, scaledY * 0.0016 - seed) - 0.5) * 130;
    const warpY = (smoothNoise2D(scaledX * 0.0016 - seed, scaledY * 0.0021 + seed) - 0.5) * 82;
    const edgeWarpX = (smoothNoise2D(scaledX * 0.085 + seed * 2, scaledY * 0.085 - seed * 2) - 0.5) * 15;
    const edgeWarpY = (smoothNoise2D(scaledX * 0.11 - seed * 2, scaledY * 0.11 + seed * 2) - 0.5) * 10;
    const clumpNoise = smoothNoise2D(scaledX * 0.040 + seed * 3, scaledY * 0.040 - seed * 3) - 0.5;
    const warpedX = scaledX + warpX + edgeWarpX;
    const warpedY = scaledY + warpY + edgeWarpY;

    const broad = fbm(warpedX * 0.0080 + seed * 0.11, warpedY * 0.0086 - seed * 0.08, 4);
    const medium = fbm(warpedX * 0.0100 - seed * 0.17, warpedY * 0.013 + seed * 0.13, 3);
    const raw = broad * 0.72 + medium * 0.20 + (clumpNoise + 0.5) * 0.08;
    return clamp((raw - 0.28) * 2.17, 0, 1);
}

function colorFromBand(value, biomeBlend = 0) {
    return grassColorFromValue(value, biomeBlend);
}

function grassColorIndexAtWorld(x, y, seed) {
    const base = grassFieldValue(x, y, seed);
    const scaledX = x * GRASS_ZOOM_SCALE;
    const scaledY = y * GRASS_ZOOM_SCALE;
    const colorTextures = [
        fbm(scaledX * 0.0058 + seed * 1.7, scaledY * 0.014 - seed * 0.9, 3),
        fbm(scaledX * 0.0066 - seed * 1.1, scaledY * 0.016 + seed * 1.4, 3),
        fbm(scaledX * 0.0074 + seed * 0.6, scaledY * 0.018 + seed * 1.9, 3)
    ];
    const phase = base * GRASS_RGB.length;
    const phasePart = phase - Math.floor(phase);
    const edgeDetail = 1 - clamp(Math.min(phasePart, 1 - phasePart) / 0.18, 0, 1);
    let bestIndex = 0;
    let bestScore = -Infinity;

    for (let index = 0; index < colorTextures.length; index++) {
        const texture = colorTextures[index];
        const center = 0.17 + index * 0.33;
        const baseAffinity = 1 - Math.abs(base - center) * 2.7;
        const textureInfluence = 0.08 + edgeDetail * 0.30;
        const highlightPenalty = 0;
        const score = baseAffinity * (1 - textureInfluence) + texture * textureInfluence - highlightPenalty;
        if (score > bestScore) {
            bestScore = score;
            bestIndex = index;
        }
    }

    return bestIndex;
}

const GRASS_CHUNK_SIZE = 1024; // Rozmiar pojedynczego fragmentu w świecie gry

function storeGrassChunkCanvas(key, canvas) {
    if (grassTileCache.size > GRASS_TILE_CACHE_LIMIT) {
        const firstKey = grassTileCache.keys().next().value;
        grassTileCache.delete(firstKey);
    }
    grassTileCache.set(key, canvas);
}

if (grassGenerationWorker) {
    grassGenerationWorker.onmessage = ({ data }) => {
        const { key, renderW, renderH, pixels } = data;
        if (data.mode === 'vector-map') {
            const makePath = (loop) => {
                const path = new Path2D();
                if (!loop || loop.length < 3) return path;
                const first = loop[0];
                const last = loop[loop.length - 1];
                path.moveTo((last[0] + first[0]) / 2, (last[1] + first[1]) / 2);
                for (let index = 0; index < loop.length; index++) {
                    const point = loop[index];
                    const next = loop[(index + 1) % loop.length];
                    path.quadraticCurveTo(
                        point[0],
                        point[1],
                        (point[0] + next[0]) / 2,
                        (point[1] + next[1]) / 2
                    );
                }
                path.closePath();
                return path;
            };
            grassVectorMapCache.set(key, data.contours.map(contour => contour.map(makePath)));
            grassChunkPending.delete(key);
            grassWorkerBusy = false;
            if (key === grassMapReadyKey && grassMapReadyResolve) {
                grassMapReadyResolve(grassVectorMapCache.get(key));
                grassMapReadyResolve = null;
            }
            return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = renderW;
        canvas.height = renderH;
        const context = canvas.getContext('2d', { alpha: false });
        context.putImageData(new ImageData(new Uint8ClampedArray(pixels), renderW, renderH), 0, 0);
        storeGrassChunkCanvas(key, canvas);
        grassChunkPending.delete(key);
        grassWorkerBusy = false;
        if (key === grassMapReadyKey && grassMapReadyResolve) {
            grassMapReadyResolve(canvas);
            grassMapReadyResolve = null;
        }
    };

    grassGenerationWorker.onerror = () => {
        grassChunkPending.clear();
        grassGenerationWorker.terminate();
        grassGenerationWorker = null;
    };
}

function generateGrassChunkOnMainThread(seed, chunkX, chunkY) {
    const key = `${seed}:${chunkX}:${chunkY}`;
    if (grassTileCache.has(key)) {
        return grassTileCache.get(key);
    }

    const canvas = document.createElement('canvas');
    const renderW = Math.ceil(GRASS_CHUNK_SIZE / GRASS_RENDER_SCALE);
    const renderH = Math.ceil(GRASS_CHUNK_SIZE / GRASS_RENDER_SCALE);
    canvas.width = renderW;
    canvas.height = renderH;

    const stepX = GRASS_CHUNK_SIZE / renderW;
    const stepY = GRASS_CHUNK_SIZE / renderH;

    const context = canvas.getContext('2d', { alpha: false });
    const image = context.createImageData(renderW, renderH);
    const data = image.data;

    const startX = chunkX * GRASS_CHUNK_SIZE;
    const startY = chunkY * GRASS_CHUNK_SIZE;

    for (let y = 0; y < renderH; y++) {
        const worldY = startY + y * stepY;
        for (let x = 0; x < renderW; x++) {
            const worldX = startX + x * stepX;
            const rgb = getGrassPixelColorAtWorld(worldX, worldY, seed);
            const index = (y * renderW + x) * 4;
            data[index] = rgb.r;
            data[index + 1] = rgb.g;
            data[index + 2] = rgb.b;
            data[index + 3] = 255;
        }
    }

    context.putImageData(image, 0, 0);

    // Zarządzanie pamięcią bufora
    storeGrassChunkCanvas(key, canvas);
    return canvas;
}

function getGrassChunkCanvas(seed, chunkX, chunkY) {
    const key = `${seed}:${chunkX}:${chunkY}`;
    if (grassTileCache.has(key) || grassChunkPending.has(key)) {
        return grassTileCache.get(key) || null;
    }

    const renderW = Math.ceil(GRASS_CHUNK_SIZE / GRASS_RENDER_SCALE);
    const renderH = Math.ceil(GRASS_CHUNK_SIZE / GRASS_RENDER_SCALE);
    if (!grassGenerationWorker) {
        return generateGrassChunkOnMainThread(seed, chunkX, chunkY);
    }

    grassChunkPending.add(key);
    grassWorkerBusy = true;
    grassGenerationWorker.postMessage({
        key,
        seed,
        chunkX,
        chunkY,
        chunkSize: GRASS_CHUNK_SIZE,
        renderW,
        renderH
    });
    return null;
}

const GRASS_MAP_RENDER_SCALE = 1;
const GRASS_MAP_GRID_STEP = 3;

function getGrassMapCanvas(seed, loc) {
    const key = `grass-map:${seed}:${loc.width}:${loc.height}`;
    if (grassTileCache.has(key) || grassChunkPending.has(key)) {
        return grassTileCache.get(key) || null;
    }
    if (!grassGenerationWorker) return null;

    grassChunkPending.add(key);
    grassWorkerBusy = true;
    grassMapReadyKey = key;
    grassMapReadyPromise = new Promise(resolve => {
        grassMapReadyResolve = resolve;
    });
    grassGenerationWorker.postMessage({
        mode: 'map',
        key,
        seed,
        worldWidth: loc.width,
        worldHeight: loc.height,
        renderScale: GRASS_MAP_RENDER_SCALE,
        gridStep: GRASS_MAP_GRID_STEP
    });
    return null;
}

function getGrassVectorMap(seed, loc) {
    const key = `grass-vector-map:${seed}:${loc.width}:${loc.height}`;
    if (grassVectorMapCache.has(key) || grassChunkPending.has(key)) {
        return grassVectorMapCache.get(key) || null;
    }
    if (!grassGenerationWorker) return null;

    grassChunkPending.add(key);
    grassWorkerBusy = true;
    grassMapReadyKey = key;
    grassMapReadyPromise = new Promise(resolve => {
        grassMapReadyResolve = resolve;
    });
    grassGenerationWorker.postMessage({
        mode: 'vector-map',
        key,
        seed,
        worldWidth: loc.width,
        worldHeight: loc.height,
        gridStep: 4
    });
    return null;
}

function drawGrassTexture(ctx, loc) {
    const texture = makeGrassTextureForLocation(loc);
    if (!texture) return;

    const previousSmoothing = ctx.imageSmoothingEnabled;
    const previousSmoothingQuality = ctx.imageSmoothingQuality;
    const previousShadowBlur = ctx.shadowBlur;
    const previousShadowColor = ctx.shadowColor;
    const previousFilter = ctx.filter;
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'low';
    ctx.filter = 'none';
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    const mapCanvas = getGrassMapCanvas(texture.seed, loc);
    if (mapCanvas) ctx.drawImage(mapCanvas, 0, 0, loc.width, loc.height);

    ctx.imageSmoothingEnabled = previousSmoothing;
    ctx.imageSmoothingQuality = previousSmoothingQuality;
    ctx.filter = previousFilter;
    ctx.shadowBlur = previousShadowBlur;
    ctx.shadowColor = previousShadowColor;
}

function getGrassColorIndexAtWorld(worldX, worldY, seed) {
    return getConnectedGrassLabelAtWorld(worldX, worldY, seed);
}

function getGrassColorAtWorld(worldX, worldY, seed) {
    const biomeBlend = grassBiomeBlend(worldX, worldY, seed);
    return colorFromBand(grassFieldValue(worldX, worldY, seed), biomeBlend);
}

function getGrassPixelColorAtWorld(worldX, worldY, seed) {
    const biomeBlend = grassBiomeBlend(worldX, worldY, seed);
    const colorIndex = getGrassColorIndexAtWorld(worldX, worldY, seed);
    const biomePalette = GRASS_BIOME_PALETTES.plains.map(hexToRgb).map((color, index) => {
        const forestColor = GRASS_BIOME_PALETTES.forest.map(hexToRgb)[index] || GRASS_BIOME_PALETTES.forest.map(hexToRgb)[GRASS_BIOME_PALETTES.forest.length - 1];
        return {
            r: Math.round(color.r + (forestColor.r - color.r) * biomeBlend),
            g: Math.round(color.g + (forestColor.g - color.g) * biomeBlend),
            b: Math.round(color.b + (forestColor.b - color.b) * biomeBlend)
        };
    });

    const textureScales = [[0.016, 0.038], [0.02, 0.046], [0.024, 0.054]];
    const [scaleX, scaleY] = textureScales[colorIndex];
    const texture = smoothNoise2D(
        worldX * scaleX + seed * (colorIndex + 1) * 0.18,
        worldY * scaleY - seed * (colorIndex + 2) * 0.14
    );
    const forestPattern = fbm(worldX * 0.006 + seed * 0.25, worldY * 0.006 - seed * 0.2, 2);
    const micro = smoothNoise2D(worldX * 0.06 + seed * 0.3, worldY * 0.06 - seed * 0.3);
    const bladeStreak = smoothNoise2D(worldX * 0.02 + worldY * 0.008 + seed, worldY * 0.04 - seed);

    const forestBias = biomeBlend * 0.65;
    const shade = (texture - 0.5) * 2.8 + (micro - 0.5) * 1.3 + (bladeStreak - 0.5) * 1.5 + (forestPattern - 0.5) * 8 * forestBias;
    const base = biomePalette[colorIndex];

    return {
        r: clamp(Math.round(base.r + shade), 0, 255),
        g: clamp(Math.round(base.g + shade), 0, 255),
        b: clamp(Math.round(base.b + shade), 0, 255)
    };
}

const GRASS_CELL_WIDTH = 160;
const GRASS_CELL_HEIGHT = 92;

function getConnectedGrassLabelAtWorld(worldX, worldY, seed) {
    const broadWarpX = (smoothNoise2D(worldX * 0.0125 + seed, worldY * 0.009 - seed) - 0.5) * 56;
    const broadWarpY = (smoothNoise2D(worldX * 0.009 - seed, worldY * 0.0125 + seed) - 0.5) * 52;
    const fineWarpX = (smoothNoise2D(worldX * 0.055 - seed, worldY * 0.045 + seed) - 0.5) * 36;
    const fineWarpY = (smoothNoise2D(worldX * 0.045 + seed, worldY * 0.055 - seed) - 0.5) * 28;
    const flowWarpX = Math.sin(worldY * 0.016 + seed) * 9;
    const flowWarpY = Math.sin(worldX * 0.012 - seed * 0.7) * 6;
    const toothWarpX = (smoothNoise2D(worldX * 0.56 + seed * 2, worldY * 0.68 - seed * 2) - 0.5) * 9;
    const toothWarpY = (smoothNoise2D(worldX * 0.82 - seed * 2, worldY * 0.50 + seed * 2) - 0.5) * 6;
    const warpX = broadWarpX + fineWarpX + toothWarpX + flowWarpX;
    const warpY = broadWarpY + fineWarpY + toothWarpY + flowWarpY;
    const cellX = Math.floor((worldX + warpX) / GRASS_CELL_WIDTH);
    const cellY = Math.floor((worldY + warpY) / GRASS_CELL_HEIGHT);
    let nearestDistance = Infinity;
    let nearestLabel = 1;

    for (let offsetY = -1; offsetY <= 1; offsetY++) {
        for (let offsetX = -1; offsetX <= 1; offsetX++) {
            const candidateX = cellX + offsetX;
            const candidateY = cellY + offsetY;
            const cellSeed = hash2D(candidateX * 6.3 + seed, candidateY * 9.1 - seed);
            const sizeX = 0.50 + hash2D(candidateX * 3.4 - seed, candidateY * 5.7 + seed) * 0.76;
            const sizeY = 0.58 + hash2D(candidateX * 5.9 + seed, candidateY * 2.4 - seed) * 0.62;
            const jitterX = (hash2D(candidateX + seed * 0.02, candidateY - seed * 0.018) - 0.5) * 1.15;
            const jitterY = (hash2D(candidateX - seed * 0.018, candidateY + seed * 0.02) - 0.5) * 1.05;
            const centerX = candidateX + 0.5 + jitterX;
            const centerY = candidateY + 0.5 + jitterY;
            const distanceX = ((worldX + warpX) / GRASS_CELL_WIDTH - centerX) / sizeX;
            const distanceY = ((worldY + warpY) / GRASS_CELL_HEIGHT - centerY) / sizeY;
            const shear = (hash2D(candidateX * 8.1 + seed, candidateY * 4.7 - seed) - 0.5) * 0.48;
            const shapedDistanceX = distanceX + distanceY * shear;
            const localBreakup = smoothNoise2D(
                worldX * 0.055 + candidateX * 1.7,
                worldY * 0.075 + candidateY * 1.3
            ) - 0.5;
            const distance = shapedDistanceX * shapedDistanceX + distanceY * distanceY + localBreakup * 0.18;

            if (distance < nearestDistance) {
                nearestDistance = distance;
                const alternatingLabel = Math.abs(candidateX + candidateY * 2) % 3;
                const highlightBoost = cellSeed > 0.76 && alternatingLabel !== 2 ? 1 : 0;
                const variation = cellSeed > 0.93 ? 1 : 0;
                nearestLabel = (alternatingLabel + highlightBoost + variation) % 3;
            }
        }
    }

    return nearestLabel;
}

function makeGrassTextureForLocation(loc) {
    if (!loc) return null;
    const seed = 1300 + Math.floor(loc.width * 0.13) + Math.floor(loc.height * 0.09);
    return { seed, tileCache: grassTileCache };
}

const camera = {
    x: 0,
    y: 0,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,

    resize() {
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;
    },

    follow(target, mapWidth = gameMap.getCurrentData().width, mapHeight = gameMap.getCurrentData().height) {
        this.resize();
        const zoom = CONFIG.ZOOM || 1;

        const targetX = target.x !== undefined ? target.x : target;
        const targetY = target.y !== undefined ? target.y : 0;

        this.x = targetX - (this.viewportWidth / (2 * zoom));
        this.y = targetY - (this.viewportHeight / (2 * zoom));

        const viewW = this.viewportWidth / zoom;
        const viewH = this.viewportHeight / zoom;

        if (mapWidth > viewW) {
            this.x = Math.max(0, Math.min(this.x, mapWidth - viewW));
        } else {
            this.x = (mapWidth - viewW) / 2;
        }

        if (mapHeight > viewH) {
            this.y = Math.max(0, Math.min(this.y, mapHeight - viewH));
        } else {
            this.y = (mapHeight - viewH) / 2;
        }
    },

    update(targetX, targetY, mapWidth, mapHeight) {
        this.follow({ x: targetX, y: targetY }, mapWidth, mapHeight);
    },

    isVisible(x, y, w = 0, h = 0, margin = 100) {
        const zoom = CONFIG.ZOOM || 1;
        const viewLeft = this.x - margin;
        const viewRight = this.x + (this.viewportWidth / zoom) + margin;
        const viewTop = this.y - margin;
        const viewBottom = this.y + (this.viewportHeight / zoom) + margin;

        return (x + w) >= viewLeft && x <= viewRight && (y + h) >= viewTop && y <= viewBottom;
    }
};

window.addEventListener('resize', () => camera.resize());

const gameMap = {
    currentLocation: 'kruczy_dol',
    nearDoor: null,
    nearNPC: null,
    nearHerb: null,
    nearBed: false,
    lastAreaBanner: null,

    registerEntity(locationId, layerName, entity) {
        const targetLocation = this.locations[locationId] || this.getCurrentData();
        if (!targetLocation.renderLayers) targetLocation.renderLayers = {};
        if (!targetLocation.renderLayers[layerName]) targetLocation.renderLayers[layerName] = [];
        targetLocation.renderLayers[layerName].push(entity);
        return entity;
    },

    renderLayerList(ctx, list, drawer) {
        if (!Array.isArray(list)) return;
        list.forEach((item) => {
            if (!item) return;
            if (typeof drawer === 'function') drawer(item, ctx);
        });
    },

    getRenderLayer(loc, layerName, fallback = []) {
        if (!loc || !loc.renderLayers) return fallback;
        const layer = loc.renderLayers[layerName];
        return Array.isArray(layer) ? layer : fallback;
    },

    ruinZone: {
        x: 2230,
        y: 1075,
        width: 520,
        height: 580,
        bossSpawnX: 2500,
        bossSpawnY: 1375,
        bossName: 'Widmo Rycerza'
    },

    isInRuins(x, y) {
        const z = this.ruinZone;
        return x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height;
    },

    isNearRuins(x, y, margin = 120) {
        const z = this.ruinZone;
        return x >= z.x - margin && x <= z.x + z.width + margin && y >= z.y - margin && y <= z.y + z.height + margin;
    },

    updateRuinsState(player) {
        const inside = this.isInRuins(player.x, player.y);
        const boss = enemyManager && enemyManager.enemies ? enemyManager.enemies.find(e => e && e.type === 'ruin_guardian') : null;

        if (!this.ruinBossDefeated && inside && !boss) {
            const guardian = new Enemy({
                id: 'ruin_guardian_01',
                type: 'ruin_guardian',
                x: this.ruinZone.bossSpawnX,
                y: this.ruinZone.bossSpawnY,
                homeX: this.ruinZone.bossSpawnX,
                homeY: this.ruinZone.bossSpawnY,
                aggroRadius: 420,
                deaggroRadius: 620
            });
            guardian.name = 'Widmo Rycerza';
            guardian.battleActive = true;
            guardian.pursuitTimer = 0;
            guardian.respawnTimer = 0;
            enemyManager.enemies.push(guardian);
            if (typeof showToast === 'function') showToast('Widmo rycerza budzi się w ruinach!');
        }

        if (boss && !inside && boss.state === 'RETURNING') {
            boss.pursuitTimer = (boss.pursuitTimer || 0) + 0.016;
            if ((boss.pursuitTimer || 0) > 20) {
                boss.hp = boss.maxHp;
                boss.isAlive = false;
                boss.state = 'IDLE';
                boss.battleActive = false;
                boss.pursuitTimer = 0;
                this.ruinBossDefeated = false;
            }
        }

        if (boss && !boss.isAlive && !this.ruinBossDefeated) {
            this.ruinBossDefeated = true;
            this.ruinBossRespawnTimer = 20;
            if (typeof showToast === 'function') showToast('Widmo rycerza padło!');
        }

        if (this.ruinBossDefeated) {
            this.ruinBossRespawnTimer = Math.max(0, (this.ruinBossRespawnTimer || 0) - 0.016);
            if (this.ruinBossRespawnTimer <= 0) {
                this.ruinBossDefeated = false;
                if (boss) {
                    boss.hp = boss.maxHp;
                    boss.isAlive = true;
                    boss.state = 'IDLE';
                    boss.battleActive = false;
                }
            }
        }
    },

    locations: {
        kruczy_dol: {
            name: 'Kruczy Dół',
            width: 5500,
            height: 3500,
            bgColor: CONFIG.COLOR_GRASS,

            clearings: [
                { x: 3100, y: 900, radius: 240 },
                { x: 4200, y: 1500, radius: 200 }
            ],

            buildings: [
                { id: 'tavern', name: 'Karczma Pod Krukiem', x: 700, y: 400, width: 260, height: 180, color: '#5c3a21' },
                { id: 'herbalist_hut', name: 'Chatka Zielarza', x: 980, y: 310, width: 170, height: 150, color: '#496b42' },
                { id: 'blacksmith', name: 'Kuźnia', x: 1200, y: 700, width: 160, height: 130, color: '#4a4a4a' },
                { id: 'mill', name: 'Młyn', x: 1700, y: 300, width: 140, height: 140, color: '#6e5438' },
                { id: 'nicolas_house', name: 'Chata Nicolasa', x: 1900, y: 480, width: 120, height: 100, color: '#4d3319' },
                { id: 'ruin_wall_left', x: 2320, y: 1120, width: 30, height: 290, color: '#655c57' },
                { id: 'ruin_wall_back', x: 2320, y: 1120, width: 250, height: 30, color: '#655c57' },
                { id: 'ruin_wall_right', x: 2660, y: 1200, width: 30, height: 210, color: '#655c57' },
                { id: 'ruin_wall_bottom', x: 2360, y: 1540, width: 260, height: 26, color: '#655c57' },
            ],

            doors: [
                { x: 810, y: 580, width: 40, height: 20, targetLocation: 'karczma_wnetrze', spawnX: 400, spawnY: 480, label: 'Wejdź [E]' },
                { x: 1040, y: 455, width: 40, height: 20, targetLocation: 'chatka_zielarza', spawnX: 260, spawnY: 420, label: 'Wejdź do chatki [E]' },
                { x: 1290, y: 820, width: 40, height: 20, targetLocation: 'kuznia_wnetrze', spawnX: 250, spawnY: 440, label: 'Wejdź do kuźni [E]' },
                { x: 1940, y: 580, width: 40, height: 20, targetLocation: 'nicolas_wnetrze', spawnX: 400, spawnY: 480, label: 'Wejdź [E]' },
                { x: 1750, y: 440, width: 40, height: 20, targetLocation: 'mlyn_wnetrze', spawnX: 1220, spawnY: 1900, label: 'Stary Młyn [E]' }
            ],

            chests: [{
                id: 'ruins_chest',
                x: 2408,
                y: 1198,
                width: 68,
                height: 36,
                opened: false,
                label: 'Skrzynia z ruin [E]',
                items: [
                    { id: 'miecz_rozpadlina', name: 'Miecz Rozpadlina', icon: '🗡️', type: 'weapon', weight: 5.2, damage: 165, critChance: 0.14, footprint: { width: 1, height: 2 }, stats: 'Obrażenia: 165', count: 1 },
                    { id: 'ruin_steel', name: 'Ruina Stal', icon: '🪓', type: 'material', weight: 1.4, count: 3 },
                    { id: 'moonsteel_scrap', name: 'Odcinek Księżycowej Stali', icon: '🌙', type: 'material', weight: 1.1, count: 2 },
                    { id: 'sun_amber', name: 'Słoneczny Bursztyn', icon: '🌞', type: 'material', weight: 0.3, count: 2 },
                    { id: 'runic_clay', name: 'Runiczna Glina', icon: '🟫', type: 'material', weight: 0.7, count: 2 }
                ]
            }],

            herbs: [
                ...createHerbCluster('c1', 'lecznicze_ziele', 2500, 550),
                ...createHerbCluster('c2', 'jagody', 2650, 1100),
                ...createHerbCluster('c3', 'lecznicze_ziele', 3100, 900),  // Polana 1
                ...createHerbCluster('c4', 'jagody', 3150, 880),   // Polana 1
                ...createHerbCluster('c5', 'jagody', 3600, 600),
                ...createHerbCluster('c6', 'lecznicze_ziele', 4200, 1500), // Polana 2
                ...createHerbCluster('c7', 'lecznicze_ziele', 4700, 800)
            ],
            npcs: []
        },
        chatka_zielarza: {
            name: 'Chatka Zielarza',
            width: 600, height: 500, bgColor: CONFIG.COLOR_INTERIOR,
            buildings: [
                { id: 'zielarz_stol', name: 'Stół Zielarza', x: 180, y: 120, width: 160, height: 100, color: '#483521' },
                { id: 'zielarz_polka', name: 'Półki z ziołami', x: 380, y: 140, width: 120, height: 120, color: '#3b5b2d' }
            ],
            doors: [
                { x: 260, y: 470, width: 80, height: 20, targetLocation: 'kruczy_dol', spawnX: 1020, spawnY: 520, label: 'Wyjdź z chatki [E]' }
            ],
            npcs: [{
                id: 'zielarka',
                name: 'Mira Zielarka',
                x: 320,
                y: 240,
                radius: 14,
                color: '#16a085',
                dialogueId: 'zielarz_intro',
                talkRadius: 110
            }]
        },
        kuznia_wnetrze: {
            name: 'Kuźnia',
            width: 700, height: 520, bgColor: CONFIG.COLOR_INTERIOR,
            buildings: [
                { id: 'forge', name: 'Piec kuźni', x: 120, y: 120, width: 180, height: 140, color: '#3f3a3a' },
                { id: 'anvil', name: 'Kowadło', x: 390, y: 160, width: 110, height: 90, color: '#6c5c4a' }
            ],
            doors: [
                { x: 290, y: 480, width: 90, height: 20, targetLocation: 'kruczy_dol', spawnX: 1290, spawnY: 845, label: 'Wyjdź z kuźni [E]' }
            ],
            npcs: [{
                id: 'kowal',
                name: 'Tomasz Kowal',
                x: 430,
                y: 300,
                radius: 14,
                color: '#7f8c8d',
                dialogueId: 'kowal_intro',
                talkRadius: 120
            }]
        },
        karczma_wnetrze: {
            name: 'Karczma Pod Krukiem',
            width: 800, height: 600, bgColor: CONFIG.COLOR_INTERIOR,
            buildings: [
                { id: 'bar', name: 'Lada Karczmarza', x: 300, y: 150, width: 200, height: 50, color: '#2b170a' }
            ],
            doors: [
                { x: 380, y: 520, width: 40, height: 20, targetLocation: 'kruczy_dol', spawnX: 830, spawnY: 620, label: 'Wyjdź [E]' },
                { x: 710, y: 100, width: 50, height: 70, targetLocation: 'karczma_pietro', spawnX: 85, spawnY: 310, isStair: true, dir: 'w', label: 'Wejdż po schodach [E]' }
            ],
            npcs: [{
                id: 'innkeeper', name: 'Karczmarz Barnaba', x: 400, y: 115,
                radius: 14, color: '#e74c3c', dialogueId: 'karczmarz_intro', talkRadius: 110
            }]
        },
        karczma_pietro: {
            name: 'Piętro Karczmy',
            width: 1000, height: 400, bgColor: CONFIG.COLOR_CORRIDOR,
            buildings: [
                { id: 'wall_top', name: '', x: 0, y: 0, width: 1000, height: 120, color: '#23150b' }
            ],
            doors: [
                { x: 60, y: 220, width: 50, height: 70, targetLocation: 'karczma_wnetrze', spawnX: 735, spawnY: 190, isStair: true, dir: 's', label: 'Zejdż po schodach [E]' },
                { x: 250, y: 110, width: 40, height: 20, keyRequired: 'room_1', label: 'Pokój #1 [E]', message: 'Pokój #1: Zamknięte.' },
                { x: 420, y: 110, width: 40, height: 20, keyRequired: 'room_2', label: 'Pokój #2 [E]', message: 'Pokój #2: Słychać chrapanie...' },
                { x: 590, y: 110, width: 40, height: 20, keyRequired: 'room_3', label: 'Pokój #3 [E]', message: 'Pokój #3: Zamknięte.' },
                { x: 780, y: 110, width: 40, height: 20, keyRequired: 'room_key', targetLocation: 'pokoj_gracza', spawnX: 300, spawnY: 420, label: 'Pokój #4 [E]', message: 'Pokój #4 jest zamknięty na klucz!' }
            ],
            npcs: []
        },
        pokoj_gracza: {
            name: 'Pokój Gracza',
            width: 600, height: 500, bgColor: CONFIG.COLOR_INTERIOR,
            buildings: [
                { id: 'bed', name: 'Wygodne Łóżko', x: 100, y: 100, width: 100, height: 160, color: '#8e44ad' }
            ],
            doors: [
                { x: 280, y: 440, width: 40, height: 20, targetLocation: 'karczma_pietro', spawnX: 780, spawnY: 150, label: 'Wyjdź na korytarz [E]' }
            ],
            npcs: []
        },
        mlyn_wnetrze: {
            name: 'Wnętrze Młyna',
            width: 1200, height: 900, bgColor: '#3a271d',
            buildings: [
                { id: 'mlyn_mecz', name: 'Mechanizm Młyński', x: 150, y: 100, width: 220, height: 220, color: '#271911' },
                { id: 'worki_maka', name: 'Stos worków z mąką', x: 850, y: 120, width: 180, height: 100, color: '#8a7967' },
                { id: 'stol_mlynarza', name: 'Stół Stolarski', x: 880, y: 600, width: 160, height: 90, color: '#573d2a' }
            ],
            doors: [
                { x: 580, y: 870, width: 80, height: 20, targetLocation: 'wioska_mlyn', spawnX: 1250, spawnY: 1880, label: 'Wyjście na zewnątrz [E]' },
                { x: 100, y: 400, width: 50, height: 30, targetLocation: 'mlyn_piwnica', spawnX: 150, spawnY: 700, label: 'Zejście do Piwnicy [E]' }
            ]
        },
        mlyn_piwnica: {
            name: 'Piwnica Młyna',
            width: 1000, height: 800, bgColor: '#120d0a',
            buildings: [
                { id: 'stare_skrzynie', name: 'Rupiecie i Skrzynie', x: 700, y: 150, width: 180, height: 120, color: '#2b1f17' }
            ],
            doors: [
                { x: 130, y: 750, width: 60, height: 20, targetLocation: 'mlyn_wnetrze', spawnX: 120, spawnY: 460, label: 'Wyjście na górę [E]' }
            ],
            chests: [{
                id: 'mlyn_hidden_chest',
                x: 340,
                y: 610,
                width: 62,
                height: 42,
                opened: false,
                label: 'Skrzynia [E]',
                items: [
                    { id: 'iron_ore', name: 'Ruda Żelaza', icon: '⛏️', type: 'material', weight: 1.5, count: 2 },
                    { id: 'herb_green', name: 'Zielone Zioło', icon: '🌱', type: 'misc', weight: 0.2, count: 2 },
                    { id: 'woda_butelka', name: 'Woda w Butelce', icon: '🧴', type: 'misc', weight: 0.5, count: 1 }
                ]
            }],
            paperLoot: {
                id: 'mlyn_list',
                x: 640,
                y: 420,
                radius: 18,
                collected: false,
                itemId: 'mlyn_secret_letter',
                label: 'Zagubiony list [E]',
                item: {
                    id: 'mlyn_secret_letter',
                    name: 'List z Młyna',
                    icon: '📜',
                    type: 'document',
                    weight: 0.1,
                    stats: 'Zmęczony, zmięty list znaleziony w piwnicy',
                    content: "<b>Do Arkelasa</b><br><br>Jeśli czytasz ten list, to znaczy, że ktoś już odnalazł to miejsce. Młyn nie był martwy przez przypadek. W podziemiach kryje się nie tylko zboże, ale i tajemne zapiski. Po południu przychodzą zbiry, bo ktoś z miasta lub z zamku chce zakryć ślady. Nie ufaj nikomu, kto mówi, że to tylko przypadek. Jeśli wyjdziesz żywy, zanieś ten list do karczmy albo do Nicolasa. <br><br>— Zapiski z młyna",
                    monologueId: 'read_mill_list',
                    questTrigger: { questId: 'Q1', step: 7 }
                }
            },
            onEnter() {
                const z1 = new Enemy({ id: 'z1', type: 'z1', x: 500, y: 350 });
                Object.assign(z1, {
                    nonLethal: true, isBasementThug: true, isHostile: false
                });

                const z2 = new Enemy({ id: 'z2', type: 'z2', x: 580, y: 350, name: 'Zbir Ciężki' });
                Object.assign(z2, {
                    nonLethal: true, isBasementThug: true, isHostile: false
                });

                enemyManager.enemies = [z1, z2];
                cutsceneManager.startBasementIntro();
            }
        }
    },

    initializeWorldGrass() {
        initGrassVariants();

        const loc = this.getCurrentData();
        if (!loc || !loc.width || !loc.height) return;

        makeGrassTextureForLocation(loc);
        if (!loc.renderLayers || !loc.renderLayers.flora || !loc.renderLayers.flora.length) {
            this.generateGrassBlades(loc);
        }

        this.preloadVisibleChunks();
    },

    getRenderingContextData() {
        const zoom = CONFIG.ZOOM || 1;
        const margin = 100;
        return {
            windTime: Date.now() * 0.0025,
            bounds: {
                left: camera.x - margin,
                right: camera.x + (camera.viewportWidth / zoom) + margin,
                top: camera.y - margin,
                bottom: camera.y + (camera.viewportHeight / zoom) + margin
            }
        };
    },
    preloadVisibleChunks() {
        const loc = this.getCurrentData();
        const seed = 1300 + Math.floor(loc.width * 0.13) + Math.floor(loc.height * 0.09);
        getGrassMapCanvas(seed, loc);
    },
    waitForGrassMap() {
        const loc = this.getCurrentData();
        if (!loc || !loc.width || !loc.height) return Promise.resolve(null);

        const seed = 1300 + Math.floor(loc.width * 0.13) + Math.floor(loc.height * 0.09);
        const mapCanvas = getGrassMapCanvas(seed, loc);
        if (mapCanvas) return Promise.resolve(mapCanvas);
        if (!grassGenerationWorker) return Promise.resolve(null);
        if (grassMapReadyPromise) return grassMapReadyPromise;
        const pendingCanvas = getGrassMapCanvas(seed, loc);
        return pendingCanvas ? Promise.resolve(pendingCanvas) : (grassMapReadyPromise || Promise.resolve(null));
    },
    getCurrentData() {
        return this.locations[this.currentLocation] || this.locations['kruczy_dol'];
    },

    getLocationBannerArt(locationName) {
        const artMap = {
            'Kruczy Dół': 'media/banners/kruczy-dol.png',
            'Ruiny': 'media/banners/ruiny.png',
            'Chatka Zielarza': 'media/banners/chatka-zielarza.png',
            'Kuźnia': 'media/banners/kuznia.png',
            'Karczma Pod Krukiem': 'media/banners/karczma.png',
            'Młyn': 'media/banners/mlyn.png'
        };
        return artMap[locationName] || null;
    },

    generateGrassBlades(loc) {
        const seed = 1300 + Math.floor(loc.width * 0.13) + Math.floor(loc.height * 0.09);
        const step = 80; // Trawy bardziej oddalone od siebie
        const grassList = [];

        const isBlockedByRoadOrBuilding = (x, y, margin = 18) => {
            if (loc.buildings) {
                for (const b of loc.buildings) {
                    const safeX = b.x - margin;
                    const safeY = b.y - margin;
                    const safeW = b.width + margin * 2;
                    const safeH = b.height + margin * 2;
                    if (x >= safeX && x <= safeX + safeW && y >= safeY && y <= safeY + safeH) {
                        return true;
                    }
                }
            }

            if (loc === this.locations.kruczy_dol) {
                const roadRects = [
                    { x: -20, y: 500, w: 2320, h: 120 },
                    { x: 780, y: 560, w: 100, h: 240 },
                    { x: 1910, y: 560, w: 100, h: 240 }
                ];

                for (const road of roadRects) {
                    if (x >= road.x && x <= road.x + road.w && y >= road.y && y <= road.y + road.h) {
                        return true;
                    }
                }

                const ruinFloor = {
                    x: 2340,
                    y: 1140,
                    w: 300,
                    h: 390
                };

                if (x >= ruinFloor.x && x <= ruinFloor.x + ruinFloor.w && y >= ruinFloor.y && y <= ruinFloor.y + ruinFloor.h) {
                    return true;
                }
            }

            return false;
        };

        // Generate grass accents for all colors
        for (let y = 20; y < loc.height - 20; y += step) {
            for (let x = 20; x < loc.width - 20; x += step) {
                if (isBlockedByRoadOrBuilding(x, y)) continue;

                const colorIndex = getGrassColorIndexAtWorld(x, y, seed);
                
                // Spawn grass accents - częściej niż wcześniej
                // colorIndex 0 (ciemna) = 40%, colorIndex 1 (średnia) = 48%, colorIndex 2 (jasna) = 56%
                const spawnChance = 0.15 + (colorIndex * 0.08);
                if (Math.random() < spawnChance) {
                    // Zawsze tylko 1 trawa - bez kepek
                    const variantIndex = Math.floor(Math.random() * 6); // 0-5 (6 wariantów)
                    
                    const jitterX = (Math.random() - 0.5) * 70; // Większy jitter
                    const jitterY = (Math.random() - 0.5) * 50; // Większy jitter
                    const finalX = x + jitterX;
                    const finalY = y + jitterY;

                    if (!isBlockedByRoadOrBuilding(finalX, finalY)) {
                        const accent = new GrassAccent(finalX, finalY, colorIndex, variantIndex);
                        grassList.push(accent);
                    }
                }
            }
        }

        grassList.sort((a, b) => a.y - b.y);

        if (!loc.renderLayers) loc.renderLayers = {};
        loc.renderLayers['flora'] = grassList;
    },

    setLocation(locationId, options = {}) {
        if (!this.locations[locationId]) return false;
        this.currentLocation = locationId;

        // Generuj chunki w tle od razu po zmianie mapy
        this.preloadVisibleChunks();

        if (options.showBanner && typeof showLocationBanner === 'function') {
            const label = this.getCurrentData()?.name || locationId;
            this.lastAreaBanner = label;
            showLocationBanner(label, { art: this.getLocationBannerArt(label) });
        }
        return true;
    },

    updateAreaBanner(player) {
        if (!player) return;

        let bannerText = this.getCurrentData()?.name || this.currentLocation;
        if (this.currentLocation === 'kruczy_dol' && (this.isInRuins(player.x, player.y) || this.isNearRuins(player.x, player.y))) {
            bannerText = 'Ruiny';
        }

        if (this.lastAreaBanner !== bannerText && typeof showLocationBanner === 'function') {
            this.lastAreaBanner = bannerText;
            showLocationBanner(bannerText, { art: this.getLocationBannerArt(bannerText) });
        }
    },

    spawnVillageNPCs() {
        const count = timeSystem.isNight ? 2 : 7;
        const names = ["Wieśniak", "Mieszczanka", "Podróżny", "Górnik", "Handlarz"];
        const colors = ['#e67e22', '#16a085', '#f39c12', '#9b59b6', '#7f8c8d'];

        const villageNPCs = [];
        for (let i = 0; i < count; i++) {
            let spawnX, spawnY;
            do {
                spawnX = 300 + Math.random() * 1600;
                spawnY = 520 + (Math.random() * 150 - 75);
            } while (this.checkCollision(spawnX, spawnY, 12));

            villageNPCs.push({
                id: 'citizen_' + i, name: names[i % names.length],
                x: spawnX, y: spawnY, targetX: null, targetY: null,
                radius: 12, color: colors[i % colors.length]
            });
        }
        this.locations.kruczy_dol.npcs = villageNPCs;
    },

    spawnForestEnemies() {
        if (typeof enemyManager === 'undefined') return;
        const wildEnemies = [];

        for (let i = 0; i < 3; i++) {
            wildEnemies.push(new Enemy({
                id: 'wolf_s_' + i, type: 'wilk',
                x: 3500 + Math.random() * 120, y: 1600 + Math.random() * 120
            }));
        }
        for (let i = 0; i < 3; i++) {
            wildEnemies.push(new Enemy({
                id: 'deer_' + i, type: 'jelen',
                x: 3000 + Math.random() * 200, y: 800 + Math.random() * 200
            }));
        }

        enemyManager.enemies = wildEnemies;
    },

    updateNPCs() {
        const loc = this.getCurrentData();
        if (!loc.npcs) return;

        loc.npcs.forEach(npc => {
            if (npc.targetX !== undefined) {
                if (!npc.targetX || Math.hypot(npc.targetX - npc.x, npc.targetY - npc.y) < 15) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 50 + Math.random() * 100;
                    npc.targetX = npc.x + Math.cos(angle) * dist;
                    npc.targetY = npc.y + Math.sin(angle) * dist;
                }

                const angle = Math.atan2(npc.targetY - npc.y, npc.targetX - npc.x);
                const speed = 0.6;
                const nextX = npc.x + Math.cos(angle) * speed;
                const nextY = npc.y + Math.sin(angle) * speed;

                if (!this.checkCollision(nextX, nextY, npc.radius)) {
                    npc.x = nextX; npc.y = nextY;
                } else {
                    npc.targetX = null;
                }
            }
        });
    },

    draw(ctx) {
        const loc = this.getCurrentData();
        const renderCtx = this.getRenderingContextData();
        const drawTerrain = () => {
            ctx.fillStyle = loc.bgColor;
            ctx.fillRect(0, 0, loc.width, loc.height);

            if (this.currentLocation === 'kruczy_dol') {
                drawGrassTexture(ctx, loc);

                const ruinZone = this.ruinZone;
                const ruinFloorX = 2340;
                const ruinFloorY = 1140;
                const ruinFloorW = 300;
                const ruinFloorH = 390;
                drawRuinsGroundPatch(ctx, ruinFloorX, ruinFloorY, ruinFloorW, ruinFloorH);

                if (camera.isVisible(0, 500, 2300, 100)) {
                    ctx.fillStyle = CONFIG.COLOR_ROAD;
                    ctx.fillRect(0, 500, 2300, 100);
                }
                if (camera.isVisible(800, 580, 60, 200)) {
                    ctx.fillStyle = CONFIG.COLOR_ROAD;
                    ctx.fillRect(800, 580, 60, 200);
                }
                if (camera.isVisible(1930, 580, 60, 200)) {
                    ctx.fillStyle = CONFIG.COLOR_ROAD;
                    ctx.fillRect(1930, 580, 60, 200);
                }
            } else if (['karczma_wnetrze', 'chatka_zielarza', 'kuznia_wnetrze', 'karczma_pietro', 'pokoj_gracza', 'mlyn_wnetrze'].includes(this.currentLocation)) {
                drawTexturedFloor(ctx, 0, 0, loc.width, loc.height, FLOOR_TEXTURES.wood, 64, 1);
            } else {
                drawGrassTexture(ctx, loc);
            }

        };
        const drawStructures = () => {
            loc.buildings.forEach(b => {
                if (!camera.isVisible(b.x, b.y, b.width, b.height)) return;

                ctx.fillStyle = b.color;
                ctx.fillRect(b.x, b.y, b.width, b.height);
                ctx.strokeStyle = '#1a1008';
                ctx.lineWidth = 3;
                ctx.strokeRect(b.x, b.y, b.width, b.height);

                if (b.name) {
                    ctx.fillStyle = '#e0e0e0';
                    ctx.font = '12px sans-serif';
                    ctx.fillText(b.name, b.x + 10, b.y - 8);
                }
            });
        };
        const getRenderingContextData = () => {
            const zoom = CONFIG.ZOOM || 1;
            const margin = 100;
            return {
                windTime: Date.now() * 0.0025,
                bounds: {
                    left: camera.x - margin,
                    right: camera.x + (camera.viewportWidth / zoom) + margin,
                    top: camera.y - margin,
                    bottom: camera.y + (camera.viewportHeight / zoom) + margin
                }
            };
        };
        const drawFloraBack = () => {
            const flora = this.getRenderLayer(this.getCurrentData(), 'flora');
            if (!Array.isArray(flora) || flora.length === 0) return;

            const playerY = (typeof player !== 'undefined' && player) ? player.y : Infinity;
            const splitIndex = findBladeSplitIndex(flora, playerY);

            // Rysuj tylko elementy od 0 do splitIndex (ZA graczem)
            for (let i = 0; i < splitIndex; i++) {
                flora[i].draw(ctx, renderCtx.bounds);
            }
        };

        const drawFloraFront = () => {
            if (typeof player === 'undefined' || !player) return;
            const flora = this.getRenderLayer(this.getCurrentData(), 'flora');
            if (!Array.isArray(flora) || flora.length === 0) return;

            const splitIndex = findBladeSplitIndex(flora, player.y);

            // Rysuj tylko elementy od splitIndex do końca (PRZED graczem)
            for (let i = splitIndex; i < flora.length; i++) {
                flora[i].draw(ctx, renderCtx.bounds);
            }
        };

        const drawHerbs = () => {
            this.nearHerb = null;
            if (!loc.herbs) return;

            loc.herbs.forEach(herb => {
                if (herb.picked) return;
                if (!camera.isVisible(herb.x - 10, herb.y - 10, 20, 20)) return;

                ctx.fillStyle = herb.type === 'lecznicze_ziele' ? '#2ecc71' : '#9b59b6';
                ctx.beginPath();
                ctx.arc(herb.x, herb.y, 6, 0, Math.PI * 2);
                ctx.fill();

                const dist = Math.hypot(player.x - herb.x, player.y - herb.y);
                if (dist < 40) {
                    this.nearHerb = herb;
                    ctx.fillStyle = '#f1c40f';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText('Zabierz [E]', herb.x - 25, herb.y - 12);
                }
            });
        };

        const drawBed = () => {
            this.nearBed = false;
            if (this.currentLocation !== 'pokoj_gracza') return;

            const bed = loc.buildings.find(b => b.id === 'bed');
            if (!bed) return;

            const dist = Math.hypot(player.x - (bed.x + bed.width / 2), player.y - (bed.y + bed.height / 2));
            if (dist < 80) {
                this.nearBed = true;
                ctx.fillStyle = '#f1c40f';
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText('Połóż się spać [E]', bed.x, bed.y - 12);
            }
        };

        const drawChests = () => {
            if (!loc.chests) return;
            loc.chests.forEach(chest => {
                if (chest.opened) return;
                const chestX = chest.x + chest.width / 2;
                const chestY = chest.y + chest.height / 2;
                if (!camera.isVisible(chest.x, chest.y, chest.width, chest.height)) return;

                ctx.fillStyle = '#5b3a1d';
                ctx.fillRect(chest.x, chest.y, chest.width, chest.height);
                ctx.fillStyle = '#8b5e34';
                ctx.fillRect(chest.x + 6, chest.y + 6, chest.width - 12, chest.height - 12);
                ctx.fillStyle = '#26170d';
                ctx.fillRect(chest.x + chest.width / 2 - 5, chest.y + 6, 10, 12);

                const dist = Math.hypot(player.x - chestX, player.y - chestY);
                if (dist < 55) {
                    ctx.fillStyle = '#f1c40f';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText(chest.label || 'Skrzynia [E]', chest.x - 18, chest.y - 12);
                }
            });
        };

        const drawNPCs = () => {
            this.nearNPC = null;
            if (!loc.npcs) return;

            loc.npcs.forEach(npc => {
                if (!camera.isVisible(npc.x - npc.radius, npc.y - npc.radius, npc.radius * 2, npc.radius * 2)) return;

                ctx.beginPath();
                ctx.arc(npc.x, npc.y, npc.radius, 0, Math.PI * 2);
                ctx.fillStyle = npc.color;
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = '11px sans-serif';
                ctx.fillText(npc.name, npc.x - 20, npc.y - 18);

                const dx = player.x - npc.x;
                const dy = player.y - npc.y;
                const talkRange = npc.talkRadius || 50;

                if (Math.hypot(dx, dy) < talkRange && npc.dialogueId) {
                    this.nearNPC = npc;
                    ctx.fillStyle = '#f1c40f';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText('Rozmawiaj [E]', npc.x - 28, npc.y + 28);
                }
            });
        };

        const drawDoors = () => {
            this.nearDoor = null;
            if (!loc.doors) return;

            loc.doors.forEach(d => {
                if (!camera.isVisible(d.x, d.y, d.width, d.height)) return;

                if (d.isStair) {
                    ctx.fillStyle = '#221208';
                    ctx.fillRect(d.x, d.y, d.width, d.height);

                    const stepCount = 6;
                    const stepHeight = d.height / stepCount;
                    for (let i = 0; i < stepCount; i++) {
                        ctx.fillStyle = i % 2 === 0 ? '#5c3517' : '#472811';
                        ctx.fillRect(d.x + 3, d.y + (i * stepHeight), d.width - 6, stepHeight - 1);
                    }

                    ctx.fillStyle = '#1a0d05';
                    ctx.fillRect(d.x, d.y, 3, d.height);
                    ctx.fillRect(d.x + d.width - 3, d.y, 3, d.height);
                } else {
                    ctx.fillStyle = '#120904';
                    ctx.fillRect(d.x - 2, d.y - 2, d.width + 4, d.height + 4);

                    ctx.fillStyle = '#7a4a21';
                    ctx.fillRect(d.x, d.y, d.width, d.height);

                    ctx.fillStyle = '#f1c40f';
                    ctx.beginPath();
                    ctx.arc(d.x + d.width - 6, d.y + d.height / 2, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }

                const dx = player.x - (d.x + d.width / 2);
                const dy = player.y - (d.y + d.height / 2);
                if (Math.hypot(dx, dy) < 45) {
                    this.nearDoor = d;
                    if (d.label) {
                        ctx.fillStyle = '#f1c40f';
                        ctx.font = 'bold 12px sans-serif';
                        ctx.fillText(d.label, d.x - 15, d.y - 8);
                    }
                }
            });
        };
        const renderOrder = [
            drawTerrain,
            drawStructures,
            drawFloraBack,
            drawHerbs,
            drawBed,
            drawChests,
            drawNPCs,
            drawDoors,
            drawFloraFront
        ];
        renderOrder.forEach(layerDraw => layerDraw());

        if (this.currentLocation === 'kruczy_dol' && player.x > 2300) {
            ctx.fillStyle = 'rgba(5, 15, 5, 0.10)';
            ctx.fillRect(camera.x, camera.y, camera.viewportWidth, camera.viewportHeight);
        }
    },

    drawMinimap() {
        if (!minimapCtx) return;
        const loc = this.getCurrentData();
        const mw = minimapCanvas.width;
        const mh = minimapCanvas.height;

        minimapCtx.clearRect(0, 0, mw, mh);

        const miniZoom = 0.25;

        minimapCtx.save();
        minimapCtx.translate(mw / 2, mh / 2);
        minimapCtx.scale(miniZoom, miniZoom);
        minimapCtx.translate(-player.x, -player.y);

        minimapCtx.fillStyle = loc.bgColor;
        minimapCtx.fillRect(0, 0, loc.width, loc.height);

        if (this.currentLocation === 'kruczy_dol') {
            minimapCtx.fillStyle = '#111e11';
            minimapCtx.fillRect(2300, 0, loc.width - 2300, loc.height);

            minimapCtx.fillStyle = CONFIG.COLOR_ROAD;
            minimapCtx.fillRect(0, 500, 2300, 100);
            minimapCtx.fillRect(800, 580, 60, 200);
            minimapCtx.fillRect(1930, 580, 60, 200);
        }

        loc.buildings.forEach(b => {
            minimapCtx.fillStyle = '#8e44ad';
            minimapCtx.fillRect(b.x, b.y, b.width, b.height);
        });

        if (loc.npcs) {
            loc.npcs.forEach(npc => {
                minimapCtx.fillStyle = '#f1c40f';
                minimapCtx.beginPath();
                minimapCtx.arc(npc.x, npc.y, 10, 0, Math.PI * 2);
                minimapCtx.fill();
            });
        }

        if (questManager.target && questManager.target.location === this.currentLocation) {
            minimapCtx.fillStyle = '#e74c3c';
            minimapCtx.beginPath();
            minimapCtx.arc(questManager.target.x, questManager.target.y, 14, 0, Math.PI * 2);
            minimapCtx.fill();
        }

        if (this.currentLocation === 'kruczy_dol' && !player.isMounted) {
            minimapCtx.fillStyle = player.horse.color;
            minimapCtx.beginPath();
            minimapCtx.arc(player.horse.x, player.horse.y, 12, 0, Math.PI * 2);
            minimapCtx.fill();
        }

        minimapCtx.restore();

        minimapCtx.fillStyle = '#2ecc71';
        minimapCtx.strokeStyle = '#ffffff';
        minimapCtx.lineWidth = 2;
        minimapCtx.beginPath();
        minimapCtx.arc(mw / 2, mh / 2, 4, 0, Math.PI * 2);
        minimapCtx.fill();
        minimapCtx.stroke();
    },

    drawFullMap() {
        const fullmapCanvas = document.getElementById('fullmapCanvas');
        if (!fullmapCanvas) return;
        const fCtx = fullmapCanvas.getContext('2d');
        const loc = this.getCurrentData();

        fCtx.clearRect(0, 0, fullmapCanvas.width, fullmapCanvas.height);

        const scale = Math.min(fullmapCanvas.width / loc.width, fullmapCanvas.height / loc.height) * 0.9;
        const offsetX = (fullmapCanvas.width - loc.width * scale) / 2;
        const offsetY = (fullmapCanvas.height - loc.height * scale) / 2;

        fCtx.fillStyle = '#120f17';
        fCtx.fillRect(0, 0, fullmapCanvas.width, fullmapCanvas.height);

        fCtx.fillStyle = '#1c1724';
        fCtx.fillRect(offsetX, offsetY, loc.width * scale, loc.height * scale);
        fCtx.strokeStyle = '#5a4529';
        fCtx.lineWidth = 2;
        fCtx.strokeRect(offsetX, offsetY, loc.width * scale, loc.height * scale);

        loc.buildings.forEach(b => {
            fCtx.fillStyle = '#2d2236';
            fCtx.fillRect(offsetX + b.x * scale, offsetY + b.y * scale, b.width * scale, b.height * scale);
            fCtx.strokeStyle = '#8c6d3f';
            fCtx.lineWidth = 1.5;
            fCtx.strokeRect(offsetX + b.x * scale, offsetY + b.y * scale, b.width * scale, b.height * scale);

            if (b.name) {
                fCtx.fillStyle = '#c5b396';
                fCtx.font = '12px Georgia';
                fCtx.fillText(b.name, offsetX + b.x * scale, offsetY + Math.max(12, b.y * scale - 6));
            }
        });

        const px = offsetX + player.x * scale;
        const py = offsetY + player.y * scale;

        fCtx.fillStyle = '#3498db';
        fCtx.beginPath();
        fCtx.arc(px, py, 7, 0, Math.PI * 2);
        fCtx.fill();
        fCtx.strokeStyle = '#ffffff';
        fCtx.lineWidth = 2;
        fCtx.stroke();

        if (questManager.target && questManager.target.location === this.currentLocation) {
            const tx = offsetX + questManager.target.x * scale;
            const ty = offsetY + questManager.target.y * scale;

            fCtx.fillStyle = '#f1c40f';
            fCtx.beginPath();
            fCtx.arc(tx, ty, 8, 0, Math.PI * 2);
            fCtx.fill();

            fCtx.fillStyle = '#ffffff';
            fCtx.font = 'bold 13px sans-serif';
            fCtx.fillText("★ CEL Zadania", tx + 14, ty + 4);
        }
    },

    checkCollision(x, y, radius) {
        const loc = this.getCurrentData();
        if (x - radius < 0 || x + radius > loc.width || y - radius < 0 || y + radius > loc.height) return true;

        for (let b of loc.buildings) {
            if (x + radius > b.x && x - radius < b.x + b.width && y + radius > b.y && y - radius < b.y + b.height) {
                return true;
            }
        }
        return false;
    },

    tryInteract() {
        const candidates = [];
        const loc = this.getCurrentData();
        if (this.locations[this.currentLocation].herbs) {
            this.locations[this.currentLocation].herbs.forEach(herb => {
                if (!herb.picked) {
                    const dist = Math.hypot(player.x - herb.x, player.y - herb.y);
                    if (dist < 40) {
                        candidates.push({ type: 'herb', dist: dist, obj: herb });
                    }
                }
            });
        }

        if (this.locations[this.currentLocation].npcs) {
            this.locations[this.currentLocation].npcs.forEach(npc => {
                const dist = Math.hypot(player.x - npc.x, player.y - npc.y);
                const talkRange = npc.talkRadius || 50;
                if (dist < talkRange && npc.dialogueId) {
                    candidates.push({ type: 'npc', dist: dist, obj: npc });
                }
            });
        }
        if (loc.chests) {
            loc.chests.forEach(chest => {
                if (chest.opened) return;
                const chestCenterX = chest.x + chest.width / 2;
                const chestCenterY = chest.y + chest.height / 2;
                const dist = Math.hypot(player.x - chestCenterX, player.y - chestCenterY);
                if (dist < 55) candidates.push({ type: 'chest', dist, obj: chest });
            });
        }
        if (loc.paperLoot && !loc.paperLoot.collected) {
            const noteDist = Math.hypot(player.x - loc.paperLoot.x, player.y - loc.paperLoot.y);
            if (noteDist < 36) {
                candidates.push({ type: 'paper', dist: noteDist, obj: loc.paperLoot });
            }
        }

        loc.doors.forEach(d => {
            const doorCenterX = d.x + d.width / 2;
            const doorCenterY = d.y + d.height / 2;
            const dist = Math.hypot(player.x - doorCenterX, player.y - doorCenterY);
            if (dist < 45) {
                candidates.push({ type: 'door', dist: dist, obj: d });
            }
        });

        if (this.currentLocation === 'pokoj_gracza') {
            const bed = loc.buildings.find(b => b.id === 'bed');
            if (bed) {
                const dist = Math.hypot(player.x - (bed.x + bed.width / 2), player.y - (bed.y + bed.height / 2));
                if (dist < 80) {
                    candidates.push({ type: 'bed', dist: dist, obj: bed });
                }
            }
        }

        if (this.currentLocation === 'kruczy_dol' && !player.isMounted && player.horse) {
            const dist = Math.hypot(player.x - player.horse.x, player.y - player.horse.y);
            if (dist < 60) {
                candidates.push({ type: 'horse', dist: dist, obj: player.horse });
            }
        }

        if (candidates.length === 0) return false;

        candidates.sort((a, b) => a.dist - b.dist);
        const closest = candidates[0];

        switch (closest.type) {
            case 'herb':
                const itemData = ITEMS_DB[closest.obj.type];
                if (player.addItem(closest.obj.type, itemData.name, itemData.icon, itemData.type, itemData.weight, itemData.stats)) {
                    closest.obj.picked = true;
                    return true;
                }
                return false;

            case 'paper': {
                const paper = closest.obj;
                const item = paper.item || {
                    id: 'mlyn_secret_letter',
                    name: 'List z Młyna',
                    icon: '📜',
                    type: 'document',
                    content: 'Zagubiony list z młyna.'
                };
                if (player.addItem(item.id, item.name, item.icon, item.type, item.weight || 0.1, item.stats || '', 1)) {
                    paper.collected = true;
                    questManager.completeObjective('Q1', 6);
                    documentViewer.open(item.name, item.content, item.monologueId || null, item.questTrigger || { questId: 'Q1', step: 7 });
                    showToast('Podnosisz zmięty list z młyna!');
                    return true;
                }
                return false;
            }

            case 'chest': {
                const chest = closest.obj;
                if (!chest) return false;
                chest.opened = true;
                if (typeof chestSystem !== 'undefined') {
                    chestSystem.open(chest);
                }
                return true;
            }

            case 'npc':
                dialogueManager.start(closest.obj.dialogueId);
                return true;

            case 'horse':
                player.isMounted = true;
                player.horse.isMounted = true;
                showToast('Wsiadłeś na konia!');
                return true;

            case 'bed':
                player.startSleep();
                return true;

            case 'door':
                const door = closest.obj;
                if (door.keyRequired) {
                    if (player.hasItem(door.keyRequired)) {
                        this.setLocation(door.targetLocation, { showBanner: true });
                        player.x = door.spawnX;
                        player.y = door.spawnY;
                        if (door.targetLocation === 'mlyn_wnetrze' && typeof questManager !== 'undefined') {
                            questManager.completeObjective('Q1', 4);
                        }
                        showToast('Otworzyłeś drzwi!');
                    } else {
                        showToast(door.message || 'Zamknięte!');
                    }
                    return true;
                }
                if (door.targetLocation) {
                    if (player.isMounted) {
                        player.isMounted = false;
                        player.horse.isMounted = false;
                        player.horse.x = player.x;
                        player.horse.y = player.y;
                    }
                    this.setLocation(door.targetLocation, { showBanner: true });
                    player.x = door.spawnX;
                    player.y = door.spawnY;

                    if (door.targetLocation === 'mlyn_wnetrze' && typeof questManager !== 'undefined') {
                        questManager.completeObjective('Q1', 4);
                    }

                    const targetData = this.getCurrentData();
                    if (typeof targetData.onEnter === 'function') {
                        targetData.onEnter();
                    }

                    return true;
                }
                return false;
        }
        return false;
    }
};

const timeSystem = {
    isNight: true,
    setDay() {
        this.isNight = false;
        const timeElem = document.getElementById('time-display');
        if (timeElem) {
            timeElem.innerText = "Dzień ☀️";
            timeElem.style.color = "#f39c12";
        }
        gameMap.spawnVillageNPCs();
    },
    setNight() {
        this.isNight = true;
        const timeElem = document.getElementById('time-display');
        if (timeElem) {
            timeElem.innerText = "Noc 🌙";
            timeElem.style.color = "#3498db";
        }
        gameMap.spawnVillageNPCs();
    }
};