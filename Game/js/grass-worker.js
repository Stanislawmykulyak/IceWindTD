const BIOME_PALETTES = {
    plains: [
        { r: 59, g: 101, b: 18 },
        { r: 86, g: 131, b: 30 },
        { r: 113, g: 159, b: 50 },
        { r: 137, g: 181, b: 65 },
        { r: 160, g: 203, b: 86 },
        { r: 183, g: 221, b: 106 }
    ],
    forest: [
        { r: 18, g: 55, b: 27 },
        { r: 40, g: 94, b: 46 },
        { r: 62, g: 120, b: 63 },
        { r: 84, g: 142, b: 77 },
        { r: 112, g: 167, b: 96 },
        { r: 154, g: 196, b: 125 }
    ]
};
const PALETTE = BIOME_PALETTES.plains;
const ZOOM_SCALE = 1.5 * 1.15;
const CELL_WIDTH = 160;
const CELL_HEIGHT = 92;

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
    return (a + (b - a) * u) + ((c + (d - c) * u) - (a + (b - a) * u)) * v;
}

function fbm(x, y, octaves) {
    let total = 0;
    let amplitude = 0.5;
    let frequency = 1;
    let normalizer = 0;
    for (let index = 0; index < octaves; index++) {
        total += smoothNoise2D(x * frequency, y * frequency) * amplitude;
        normalizer += amplitude;
        frequency *= 2;
        amplitude *= 0.5;
    }
    return total / normalizer;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function grassBiomemapBlend(x, y, seed) {
    const forestStartX = 2300;
    const forestEndX = 5500;
    const xBand = clamp((x - forestStartX) / (forestEndX - forestStartX), 0, 1);
    const broadForest = xBand * xBand * (3 - 2 * xBand);

    const s1 = fbm(x * 0.0018 + seed * 0.22, y * 0.0017 - seed * 0.18, 3) - 0.5;
    const s2 = fbm(x * 0.0036 - seed * 0.13, y * 0.0031 + seed * 0.17, 2) - 0.5;
    const forestPattern = clamp(0.65 + s1 * 0.55 + s2 * 0.35, 0, 1);

    return clamp(broadForest * 0.8 + forestPattern * 0.2, 0, 1);
}

function grassFieldValue(x, y, seed) {
    const scaledX = x * ZOOM_SCALE;
    const scaledY = (y + Math.sin(x * 0.008 + seed * 0.03) * 4) * ZOOM_SCALE;
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

function biomePaletteFor(x, y, seed) {
    const blend = grassBiomemapBlend(x, y, seed);
    const plains = BIOME_PALETTES.plains;
    const forest = BIOME_PALETTES.forest;
    return plains.map((plainColor, index) => {
        const forestColor = forest[index] || forest[forest.length - 1];
        return {
            r: Math.round(plainColor.r + (forestColor.r - plainColor.r) * blend),
            g: Math.round(plainColor.g + (forestColor.g - plainColor.g) * blend),
            b: Math.round(plainColor.b + (forestColor.b - plainColor.b) * blend)
        };
    });
}

function grassColorIndexAtWorld(x, y, seed) {
    const base = grassFieldValue(x, y, seed);
    const scaledX = x * ZOOM_SCALE;
    const scaledY = y * ZOOM_SCALE;
    const textures = [
        fbm(scaledX * 0.0058 + seed * 1.7, scaledY * 0.014 - seed * 0.9, 3),
        fbm(scaledX * 0.0066 - seed * 1.1, scaledY * 0.016 + seed * 1.4, 3),
        fbm(scaledX * 0.0074 + seed * 0.6, scaledY * 0.018 + seed * 1.9, 3)
    ];
    const phase = base * PALETTE.length;
    const phasePart = phase - Math.floor(phase);
    const edgeDetail = 1 - clamp(Math.min(phasePart, 1 - phasePart) / 0.18, 0, 1);
    let bestIndex = 0;
    let bestScore = -Infinity;
    for (let index = 0; index < textures.length; index++) {
        const center = 0.17 + index * 0.33;
        const baseAffinity = 1 - Math.abs(base - center) * 2.7;
        const textureInfluence = 0.08 + edgeDetail * 0.30;
        const score = baseAffinity * (1 - textureInfluence) + textures[index] * textureInfluence;
        if (score > bestScore) {
            bestScore = score;
            bestIndex = index;
        }
    }
    return bestIndex;
}

function connectedLabelInfo(x, y, seed) {
    const broadWarpX = (smoothNoise2D(x * 0.0125 + seed, y * 0.009 - seed) - 0.5) * 56;
    const broadWarpY = (smoothNoise2D(x * 0.009 - seed, y * 0.0125 + seed) - 0.5) * 52;
    const fineWarpX = (smoothNoise2D(x * 0.055 - seed, y * 0.045 + seed) - 0.5) * 36;
    const fineWarpY = (smoothNoise2D(x * 0.045 + seed, y * 0.055 - seed) - 0.5) * 28;
    const flowWarpX = Math.sin(y * 0.016 + seed) * 9;
    const flowWarpY = Math.sin(x * 0.012 - seed * 0.7) * 6;
    const toothWarpX = (smoothNoise2D(x * 0.56 + seed * 2, y * 0.68 - seed * 2) - 0.5) * 9;
    const toothWarpY = (smoothNoise2D(x * 0.82 - seed * 2, y * 0.50 + seed * 2) - 0.5) * 6;
    const warpedX = x + broadWarpX + fineWarpX + toothWarpX + flowWarpX;
    const warpedY = y + broadWarpY + fineWarpY + toothWarpY + flowWarpY;
    const cellX = Math.floor(warpedX / CELL_WIDTH);
    const cellY = Math.floor(warpedY / CELL_HEIGHT);
    let nearestDistance = Infinity;
    let nearestLabel = 1;
    let secondDistance = Infinity;
    let secondLabel = nearestLabel;
    for (let offsetY = -1; offsetY <= 1; offsetY++) {
        for (let offsetX = -1; offsetX <= 1; offsetX++) {
            const candidateX = cellX + offsetX;
            const candidateY = cellY + offsetY;
            const cellSeed = hash2D(candidateX * 6.3 + seed, candidateY * 9.1 - seed);
            const sizeX = 0.50 + hash2D(candidateX * 3.4 - seed, candidateY * 5.7 + seed) * 0.76;
            const sizeY = 0.58 + hash2D(candidateX * 5.9 + seed, candidateY * 2.4 - seed) * 0.62;
            const jitterX = (hash2D(candidateX + seed * 0.02, candidateY - seed * 0.018) - 0.5) * 1.15;
            const jitterY = (hash2D(candidateX - seed * 0.018, candidateY + seed * 0.02) - 0.5) * 1.05;
            const distanceX = warpedX / CELL_WIDTH - (candidateX + 0.5 + jitterX);
            const distanceY = warpedY / CELL_HEIGHT - (candidateY + 0.5 + jitterY);
            const shear = (hash2D(candidateX * 8.1 + seed, candidateY * 4.7 - seed) - 0.5) * 0.48;
            const shapedDistanceX = distanceX / sizeX + distanceY / sizeY * shear;
            const normalizedY = distanceY / sizeY;
            const localBreakup = smoothNoise2D(x * 0.055 + candidateX * 1.7, y * 0.075 + candidateY * 1.3) - 0.5;
            const distance = shapedDistanceX * shapedDistanceX + normalizedY * normalizedY + localBreakup * 0.18;
            if (distance < nearestDistance) {
                secondDistance = nearestDistance;
                secondLabel = nearestLabel;
                nearestDistance = distance;
                const alternatingLabel = Math.abs(candidateX + candidateY * 2) % 3;
                const highlightBoost = cellSeed > 0.76 && alternatingLabel !== 2 ? 1 : 0;
                const variation = cellSeed > 0.93 ? 1 : 0;
                nearestLabel = (alternatingLabel + highlightBoost + variation) % 3;
            } else if (distance < secondDistance) {
                secondDistance = distance;
                const alternatingLabel = Math.abs(candidateX + candidateY * 2) % 3;
                const highlightBoost = cellSeed > 0.76 && alternatingLabel !== 2 ? 1 : 0;
                const variation = cellSeed > 0.93 ? 1 : 0;
                secondLabel = (alternatingLabel + highlightBoost + variation) % 3;
            }
        }
    }
    return { label: nearestLabel, secondLabel, nearestDistance, secondDistance };
}

function connectedLabel(x, y, seed) {
    return connectedLabelInfo(x, y, seed).label;
}

function basePixelColor(x, y, seed, colorIndex) {
    const palette = biomePaletteFor(x, y, seed);
    const textureScales = [[0.028, 0.072], [0.032, 0.080], [0.036, 0.088], [0.040, 0.094], [0.044, 0.100], [0.048, 0.108], [0.052, 0.112]];
    const texture = smoothNoise2D(x * textureScales[colorIndex][0] + seed * (colorIndex + 1) * 0.37, y * textureScales[colorIndex][1] - seed * (colorIndex + 2) * 0.29);
    const micro = smoothNoise2D(x * 0.045 + seed * 0.7, y * 0.06 - seed * 0.7);
    const bladeStreak = smoothNoise2D(x * 0.032 + y * 0.012 + seed, y * 0.08 - seed);
    const warmAccent = colorIndex >= palette.length - 1 ? 4 : 0;
    const shade = (texture - 0.5) * 3.8 + (micro - 0.5) * 1.2 + (bladeStreak - 0.5) * 1.4 + warmAccent;
    const base = palette[Math.min(colorIndex, palette.length - 1)];
    return [clamp(Math.round(base.r + shade), 0, 255), clamp(Math.round(base.g + shade), 0, 255), clamp(Math.round(base.b + shade), 0, 255)];
}

function pixelColor(x, y, seed) {
    const blend = grassBiomemapBlend(x, y, seed);
    const info = connectedLabelInfo(x, y, seed);
    const primary = basePixelColor(x, y, seed, info.label);
    const forestPattern = fbm(x * 0.006 + seed * 0.25, y * 0.006 - seed * 0.2, 2);
    const forestBias = blend * 0.65;

    const color = [
        primary[0] + (forestPattern - 0.5) * 12 * forestBias,
        primary[1] + (forestPattern - 0.5) * 11 * forestBias,
        primary[2] + (forestPattern - 0.5) * 8 * forestBias
    ];

    if (info.label === info.secondLabel) return color.map(v => clamp(Math.round(v), 0, 255));

    const boundaryWidth = 0.016;
    const edgeAmount = clamp((boundaryWidth - (info.secondDistance - info.nearestDistance)) / boundaryWidth, 0, 1);
    if (edgeAmount <= 0) return color.map(v => clamp(Math.round(v), 0, 255));

    const secondary = basePixelColor(x, y, seed, info.secondLabel);
    const mix = edgeAmount * edgeAmount * (3 - 2 * edgeAmount);
    return [
        Math.round(color[0] + (secondary[0] - color[0]) * mix),
        Math.round(color[1] + (secondary[1] - color[1]) * mix),
        Math.round(color[2] + (secondary[2] - color[2]) * mix)
    ];
}

function contourForThreshold(values, gridW, gridH, worldWidth, worldHeight, threshold, gridStep) {
    const connections = new Map();
    const points = new Map();
    const addSegment = (first, second) => {
        if (!connections.has(first.key)) connections.set(first.key, []);
        if (!connections.has(second.key)) connections.set(second.key, []);
        connections.get(first.key).push(second.key);
        connections.get(second.key).push(first.key);
        points.set(first.key, first.point);
        points.set(second.key, second.point);
    };
    const interpolate = (firstValue, secondValue) => {
        const difference = secondValue - firstValue;
        return Math.abs(difference) < 0.00001 ? 0.5 : clamp((threshold - firstValue) / difference, 0, 1);
    };
    const edgePoint = (x, y, edge, topLeft, topRight, bottomRight, bottomLeft) => {
        let ratio;
        let point;
        let key;
        if (edge === 0) {
            ratio = interpolate(topLeft, topRight);
            point = [(x + ratio) * gridStep, y * gridStep];
            key = `${x},${y},h`;
        } else if (edge === 1) {
            ratio = interpolate(topRight, bottomRight);
            point = [(x + 1) * gridStep, (y + ratio) * gridStep];
            key = `${x + 1},${y},v`;
        } else if (edge === 2) {
            ratio = interpolate(bottomLeft, bottomRight);
            point = [(x + ratio) * gridStep, (y + 1) * gridStep];
            key = `${x},${y + 1},h`;
        } else {
            ratio = interpolate(topLeft, bottomLeft);
            point = [x * gridStep, (y + ratio) * gridStep];
            key = `${x},${y},v`;
        }
        point[0] = clamp(point[0], 0, worldWidth);
        point[1] = clamp(point[1], 0, worldHeight);
        return { key, point };
    };
    const table = [
        [], [3, 0], [0, 1], [3, 1], [1, 2], [3, 2], [0, 2], [3, 2, 0, 1],
        [2, 3], [2, 0], [0, 2, 1, 3], [2, 1], [1, 3], [1, 0], [0, 3], []
    ];

    for (let y = 0; y < gridH - 1; y++) {
        for (let x = 0; x < gridW - 1; x++) {
            const topLeft = values[y * gridW + x];
            const topRight = values[y * gridW + x + 1];
            const bottomLeft = values[(y + 1) * gridW + x];
            const bottomRight = values[(y + 1) * gridW + x + 1];
            const caseIndex = (topLeft >= threshold ? 1 : 0) |
                (topRight >= threshold ? 2 : 0) |
                (bottomRight >= threshold ? 4 : 0) |
                (bottomLeft >= threshold ? 8 : 0);
            const edges = table[caseIndex];
            for (let index = 0; index < edges.length; index += 2) {
                addSegment(
                    edgePoint(x, y, edges[index], topLeft, topRight, bottomRight, bottomLeft),
                    edgePoint(x, y, edges[index + 1], topLeft, topRight, bottomRight, bottomLeft)
                );
            }
        }
    }

    const loops = [];
    const visited = new Set();
    for (const [startKey, neighbors] of connections.entries()) {
        for (const firstNeighbor of neighbors) {
            const firstEdge = `${startKey}|${firstNeighbor}`;
            if (visited.has(firstEdge)) continue;
            const loop = [];
            let previousKey = null;
            let currentKey = startKey;
            let nextKey = firstNeighbor;
            let closed = false;
            while (nextKey && !visited.has(`${currentKey}|${nextKey}`)) {
                visited.add(`${currentKey}|${nextKey}`);
                visited.add(`${nextKey}|${currentKey}`);
                loop.push(points.get(currentKey));
                const nextNeighbors = connections.get(nextKey) || [];
                const candidate = nextNeighbors.find(key => key !== currentKey && key !== previousKey) || (nextKey === startKey ? null : nextNeighbors[0]);
                previousKey = currentKey;
                currentKey = nextKey;
                nextKey = candidate;
                if (currentKey === startKey) {
                    closed = true;
                    break;
                }
            }
            if (closed && loop.length >= 3) loops.push(loop);
        }
    }
    return loops;
}

function generateGrassVectorMap(data) {
    const { key, seed, worldWidth, worldHeight, gridStep } = data;
    const gridW = Math.ceil(worldWidth / gridStep) + 1;
    const gridH = Math.ceil(worldHeight / gridStep) + 1;
    const labels = new Uint8Array(gridW * gridH);
    for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
            const label = connectedLabel(
                Math.min(worldWidth, x * gridStep),
                Math.min(worldHeight, y * gridStep),
                seed
            );
            labels[y * gridW + x] = label;
        }
    }

    const smoothedLabels = new Uint8Array(labels.length);
    for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
            const counts = [0, 0, 0];
            for (let offsetY = 0; offsetY <= 0; offsetY++) {
                for (let offsetX = 0; offsetX <= 0; offsetX++) {
                    const sampleX = clamp(x + offsetX, 0, gridW - 1);
                    const sampleY = clamp(y + offsetY, 0, gridH - 1);
                    counts[labels[sampleY * gridW + sampleX]]++;
                }
            }
            smoothedLabels[y * gridW + x] = counts[1] > counts[0] && counts[1] >= counts[2]
                ? 1
                : counts[2] > counts[0] ? 2 : 0;
        }
    }
    const mediumValues = new Float32Array(labels.length);
    const darkValues = new Float32Array(labels.length);
    for (let index = 0; index < smoothedLabels.length; index++) {
        mediumValues[index] = smoothedLabels[index] === 1 ? 1 : 0;
        darkValues[index] = smoothedLabels[index] === 0 ? 1 : 0;
    }
    self.postMessage({
        mode: 'vector-map',
        key,
        contours: [
            contourForThreshold(mediumValues, gridW, gridH, worldWidth, worldHeight, 0.5, gridStep),
            contourForThreshold(darkValues, gridW, gridH, worldWidth, worldHeight, 0.5, gridStep)
        ]
    });
}

function generateGrassMap(data) {
    const { key, seed, worldWidth, worldHeight, renderScale, gridStep } = data;
    const renderW = Math.ceil(worldWidth / renderScale);
    const renderH = Math.ceil(worldHeight / renderScale);
    const gridW = Math.ceil(worldWidth / gridStep) + 1;
    const gridH = Math.ceil(worldHeight / gridStep) + 1;
    const grid = new Uint8Array(gridW * gridH * 3);

    for (let gridY = 0; gridY < gridH; gridY++) {
        for (let gridX = 0; gridX < gridW; gridX++) {
            const color = pixelColor(
                Math.min(worldWidth, gridX * gridStep),
                Math.min(worldHeight, gridY * gridStep),
                seed
            );
            const index = (gridY * gridW + gridX) * 3;
            grid[index] = color[0];
            grid[index + 1] = color[1];
            grid[index + 2] = color[2];
        }
    }

    const pixels = new Uint8ClampedArray(renderW * renderH * 4);
    for (let y = 0; y < renderH; y++) {
        const worldY = y * renderScale;
        const gridY = Math.min(gridH - 2, Math.floor(worldY / gridStep));
        const yBlend = (worldY - gridY * gridStep) / gridStep;
        for (let x = 0; x < renderW; x++) {
            const worldX = x * renderScale;
            const gridX = Math.min(gridW - 2, Math.floor(worldX / gridStep));
            const xBlend = (worldX - gridX * gridStep) / gridStep;
            const topLeft = (gridY * gridW + gridX) * 3;
            const topRight = topLeft + 3;
            const bottomLeft = topLeft + gridW * 3;
            const bottomRight = bottomLeft + 3;
            const pixelIndex = (y * renderW + x) * 4;
            for (let channel = 0; channel < 3; channel++) {
                const top = grid[topLeft + channel] + (grid[topRight + channel] - grid[topLeft + channel]) * xBlend;
                const bottom = grid[bottomLeft + channel] + (grid[bottomRight + channel] - grid[bottomLeft + channel]) * xBlend;
                pixels[pixelIndex + channel] = Math.round(top + (bottom - top) * yBlend);
            }
            pixels[pixelIndex + 3] = 255;
        }
    }

    let sourcePixels = pixels;
    let targetPixels = new Uint8ClampedArray(pixels.length);
    for (let pass = 0; pass < 2; pass++) {
        targetPixels.set(sourcePixels);
        for (let y = 1; y < renderH - 1; y++) {
            for (let x = 1; x < renderW - 1; x++) {
                const pixelIndex = (y * renderW + x) * 4;
                const left = pixelIndex - 4;
                const right = pixelIndex + 4;
                const top = pixelIndex - renderW * 4;
                const bottom = pixelIndex + renderW * 4;
                const gradient = Math.max(
                    Math.abs(sourcePixels[pixelIndex] - sourcePixels[left]),
                    Math.abs(sourcePixels[pixelIndex] - sourcePixels[right]),
                    Math.abs(sourcePixels[pixelIndex] - sourcePixels[top]),
                    Math.abs(sourcePixels[pixelIndex] - sourcePixels[bottom])
                );
                if (gradient < 5) continue;

                const blend = Math.min(0.9, (gradient - 5) / 35);
                for (let channel = 0; channel < 3; channel++) {
                    const neighborAverage = (
                        sourcePixels[left + channel] + sourcePixels[right + channel] +
                        sourcePixels[top + channel] + sourcePixels[bottom + channel]
                    ) / 4;
                    targetPixels[pixelIndex + channel] = Math.round(
                        sourcePixels[pixelIndex + channel] +
                        (neighborAverage - sourcePixels[pixelIndex + channel]) * blend
                    );
                }
            }
        }
        const previousSource = sourcePixels;
        sourcePixels = targetPixels;
        targetPixels = previousSource;
    }

    self.postMessage({ key, renderW, renderH, pixels: sourcePixels.buffer }, [sourcePixels.buffer]);
}

self.onmessage = ({ data }) => {
    if (data.mode === 'vector-map') {
        generateGrassVectorMap(data);
        return;
    }
    if (data.mode === 'map') {
        generateGrassMap(data);
        return;
    }

    const { key, seed, chunkX, chunkY, chunkSize, renderW, renderH } = data;
    const pixels = new Uint8ClampedArray(renderW * renderH * 4);
    const stepX = chunkSize / renderW;
    const stepY = chunkSize / renderH;
    const startX = chunkX * chunkSize;
    const startY = chunkY * chunkSize;
    for (let y = 0; y < renderH; y++) {
        for (let x = 0; x < renderW; x++) {
            const color = pixelColor(startX + x * stepX, startY + y * stepY, seed);
            const index = (y * renderW + x) * 4;
            pixels[index] = color[0];
            pixels[index + 1] = color[1];
            pixels[index + 2] = color[2];
            pixels[index + 3] = 255;
        }
    }
    self.postMessage({ key, renderW, renderH, pixels: pixels.buffer }, [pixels.buffer]);
};
