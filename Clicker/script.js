const accRock = document.getElementById('entire-rock')
const gemCounter = document.querySelector('.gem-counter')


const playlist = [
        'media/BG-Music-DeusLover.mp3',
        'media/BG-Music-DeusLover-2.mp3',
        'media/BG-Music-DeusLover-3.mp3',
        'media/BG-Music-DeusLover-4.mp3',
        'media/BG-Music-DeusLover-5.mp3'
]
let currentTrackIndex = 0;
const bgMusic = new Audio(playlist[currentTrackIndex]);
bgMusic.volume = 1;

let isMuted = false;
const audioBtn = document.getElementById('audio-toggle');

function playNextTrack() {
        currentTrackIndex++;

        // Jeśli dojdziemy do końca tablicy (indeks wyjdzie poza zakres), resetujemy do 0
        if (currentTrackIndex >= playlist.length) {
                currentTrackIndex = 0;
        }

        // Ładujemy nowy plik do odtwarzacza
        bgMusic.src = playlist[currentTrackIndex];

        // Jeśli gracz nie wyciszył muzyki, odpalamy kolejny utwór
        if (!isMuted) {
                bgMusic.play().catch(err => console.log("Autoplay block na kolejnym utworze:", err));
        }
}

bgMusic.onended = playNextTrack;

// Funkcja próbująca odpalić muzykę domyślnie
function tryAutoplay() {
        if (isMuted) return;
        bgMusic.play().then(() => {
                window.removeEventListener('click', tryAutoplay);
        }).catch(() => {
                console.log("browser is blocking autoplay, you need to click");
        });
}

// Próba odpalenia od razu + zabezpieczenie na pierwszy klik w dowolne miejsce na stronie
window.addEventListener('click', tryAutoplay);

audioBtn.onclick = function (e) {
        e.stopPropagation();

        if (bgMusic.paused) {
                bgMusic.play();
                audioBtn.innerHTML = "🔊 Muzyka: ON";
                audioBtn.style.borderColor = "#475569";
                isMuted = false;
        } else {
                bgMusic.pause();
                audioBtn.innerHTML = "🔇 Muzyka: OFF";
                audioBtn.style.borderColor = "#991b1b";
                isMuted = true;
        }
};

function formatNumber(num) {
        return new Intl.NumberFormat('en-US', {
                notation: 'compact',
                compactDisplay: 'short',
                maximumFractionDigits: 1 // Maksymalnie jedna cyfra po przecinku (np. 1.5K zamiast 1.53K)
        }).format(num);
}

let gems = 0;

function updateGems() {
        gemCounter.innerHTML = `Gems : ${formatNumber(gems)}$`
}

let gem_per_click = 1;
let lucky_gem_percentage = 3

function createFloatingText(x, y, amount, isLucky) {
        const textNode = document.createElement('div');
        
        // Przypisujemy odpowiednie klasy
        textNode.className = 'floating-text';
        if (isLucky) {
                textNode.classList.add('lucky-text');
        }

        // Ustalamy pozycję startową w miejscu kliknięcia myszy
        textNode.style.left = `${x}px`;
        textNode.style.top = `${y}px`;
        
        // Generujemy tekst (np. +1 lub +7)
        textNode.innerHTML = `+${formatNumber(amount)}`;

        // Wrzucamy do drzewa DOM gry
        document.body.appendChild(textNode);

        // Sanity Check: Usuwamy element po zakończeniu animacji, żeby nie zapchać RAMu
        setTimeout(() => {
                textNode.remove();
        }, 700);
}

const rockImg = document.querySelector('.GemRock img');

accRock.addEventListener('click', function (e) {
        // Trik z wymuszeniem reflow dla animacji rocka
        rockImg.classList.remove('rock-pop');
        void rockImg.offsetWidth;
        rockImg.classList.add('rock-pop');

        let gainedGems = 0;
        let isLucky = false;

        // Wyliczamy nagrodę i sprawdzamy kryta
        if ((Math.random() * 100) < lucky_gem_percentage) {
                gainedGems = gem_per_click * 7;
                isLucky = true;
                console.log("Lucky gem");
        } else {
                gainedGems = gem_per_click;
                console.log("Kliknięcie w kamyczek");
        }

        gems += gainedGems;

        // ODPALENIE EFEKTU FX (Przekazujemy pozycję myszy X i Y)
        createFloatingText(e.clientX, e.clientY, gainedGems, isLucky);
});


// Miner Upgrade
let upgrades = {
        miner: {
                baseCost: 10,
                cost: 10,
                efficiency: 0.1,
                level: 0,
                maxLevel: 100,
                milestones: { 10: 5, 20: 2, 50: 2, 100: 10 }
        },
        archer: {
                baseCost: 150,
                cost: 150,
                efficiency: 3,
                level: 0,
                maxLevel: 100,
                milestones: { 10: 3, 20: 2, 50: 2, 100: 5 }
        },
        knight: {
                baseCost: 1100,
                cost: 1100,
                efficiency: 25,
                level: 0,
                maxLevel: 100,
                milestones: { 10: 2.5, 20: 1.6, 50: 2, 100: 5 }
        }
};

// Generyczna funkcja aktualizująca UI dowolnego ulepszenia
function updateUpgradesUI() {
        // Słownik z oryginalnymi nazwami, które przywrócimy po odblokowaniu kafelka
        const upgradeNames = {
                miner: "Miner Upgrade",
                archer: "Archer Upgrade",
                knight: "Knight Upgrade"
        };

        Object.keys(upgrades).forEach(key => {
                const up = upgrades[key];
                const upgradeContainer = document.querySelector(`.${key}-upgrades`);
                
                if (!upgradeContainer) return;

                const priceEl = upgradeContainer.querySelector(`.${key}-price`);
                const lvlEl = upgradeContainer.querySelector(`.${key}-lvl`);
                const btnEl = upgradeContainer.querySelector(`.${key}-upgrade`);

                // 1. Definiujemy twarde progi odblokowania
                let isUnlocked = true;
                if (key === 'archer' && upgrades.miner.level < 4) isUnlocked = false;
                if (key === 'knight' && upgrades.archer.level <= 9) isUnlocked = false;

                // 2. Egzekwujemy blokadę lub renderujemy pełne statystyki
                if (!isUnlocked) {
                        upgradeContainer.classList.add('locked-upgrade');
                        if (btnEl) {
                                btnEl.innerHTML = "???"; // Ukrywamy nazwę ulepszenia
                                btnEl.disabled = true;
                        }
                        if (lvlEl) lvlEl.innerHTML = "🔒"; // Sama czysta kłódka
                        if (priceEl) priceEl.innerHTML = `Price: ${formatNumber(up.cost)}$`; // Zostawiamy samą cenę
                } else {
                        upgradeContainer.classList.remove('locked-upgrade');
                        if (btnEl) btnEl.innerHTML = upgradeNames[key]; // Przywracamy oryginalną nazwę
                        
                        if (priceEl) priceEl.innerHTML = `Price: ${formatNumber(up.cost)}$`;
                        
                        if (lvlEl) {
                                if (up.level === up.maxLevel) {
                                        lvlEl.innerHTML = `MAX LVL`;
                                } else {
                                        lvlEl.innerHTML = `Lvl: ${up.level + 1}`;
                                }
                        }
                }

                // 3. Sprawdzanie czy gracza stać (tylko dla już odblokowanych ulepszeń)
                if (isUnlocked) {
                        if (gems >= up.cost) {
                                upgradeContainer.classList.remove('cant-afford');
                                if (btnEl) btnEl.disabled = false;
                        } else {
                                upgradeContainer.classList.add('cant-afford');
                                if (btnEl) btnEl.disabled = true;
                        }
                } else {
                        // Dla zablokowanych usuwamy klasę cant-afford, żeby nie nakładać dwóch filtrów na raz
                        upgradeContainer.classList.remove('cant-afford');
                }
        });
}

// Generyczna logika zakupu ulepszeń
function buyUpgrade(upgradeKey) {
        const up = upgrades[upgradeKey];
        if (gems >= up.cost && up.level < up.maxLevel) {
                gems -= up.cost;
                up.level++;

                if (up.milestones[up.level]) {
                        up.efficiency *= up.milestones[up.level];
                }

                up.cost = Math.floor(up.baseCost * Math.pow(1.15, up.level));
        } else if (up.level >= up.maxLevel) {
                console.log("You cant Upgrade , Max level reached");
        }
}

// Automatyczne podpięcie zdarzeń click dla wszystkich ulepszeń w obiekcie
Object.keys(upgrades).forEach(key => {
        const container = document.querySelector(`.${key}-upgrades`);
        if (container) {
                container.onclick = () => buyUpgrade(key);
        }
});

function saveGameToFile() {
        const dataToSave = {
                gems: gems,
                upgrades: {}
        };

        // Zapisujemy tylko niezbędne, zmieniające się parametry ulepszeń
        Object.keys(upgrades).forEach(key => {
                dataToSave.upgrades[key] = {
                        level: upgrades[key].level,
                        cost: upgrades[key].cost,
                        efficiency: upgrades[key].efficiency
                };
        });

        // Tworzenie "wirtualnego" pliku JSON w pamięci przeglądarki
        const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        // Automatyczne pobranie pliku przez ukryty link
        const a = document.createElement("a");
        a.href = url;
        a.download = "medieval_clicker_save.json";
        a.click();

        // Czyszczenie pamięci
        URL.revokeObjectURL(url);
        console.log("Zwój zapisu został wygenerowany!");
}

// 2. Funkcja parsująca i wczytująca wybrany plik JSON
function loadGameFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
                try {
                        const loadedData = JSON.parse(e.target.result);

                        // Nadpisujemy gemy, jeśli istnieją w pliku
                        if (typeof loadedData.gems === "number") {
                                gems = loadedData.gems;
                        }

                        // Odtwarzamy stan każdego ulepszenia
                        if (loadedData.upgrades) {
                                Object.keys(loadedData.upgrades).forEach(key => {
                                        if (upgrades[key]) {
                                                upgrades[key].level = loadedData.upgrades[key].level;
                                                upgrades[key].cost = loadedData.upgrades[key].cost;
                                                upgrades[key].efficiency = loadedData.upgrades[key].efficiency;
                                        }
                                });
                        }

                        console.log("Zwój odczytany pomyślnie! Stan gry zaktualizowany.");

                        // Wymuszenie natychmiastowego odświeżenia napisów na ekranie
                        updateGems();
                        updateUpgradesUI();

                } catch (err) {
                        console.error("Magia zawiodła! Plik zapisu jest uszkodzony.", err);
                        alert("Ten zwój jest skażony! Nie można go odczytać.");
                }
        };
        reader.readAsText(file);
}

document.getElementById('save-btn').onclick = saveGameToFile;

const fileInput = document.getElementById('file-input');
document.getElementById('load-btn').onclick = () => fileInput.click();
fileInput.onchange = loadGameFromFile;


let lastTime = 0;
let accumulatedTime = 0;

function gameLoop(timestamp) {
        // 1. Inicjalizacja przy pierwszym uruchomieniu
        if (!lastTime) lastTime = timestamp;

        // 2. Obliczanie Delta Time (czasu między klatkami)
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        accumulatedTime += deltaTime;

        // --- TUTAJ WCHODZI TWOJA LOGIKA ---
        // Na przykład: przesunięcie postaci o (prędkość * deltaTime)
        while (accumulatedTime >= 1000) {
                if (upgrades.archer.level < 10) {
                        Miner_Income_multiplier_chance = 0
                }
                if (upgrades.archer.level > 10) {
                        Miner_Income_multiplier_chance = 5
                }
                if (upgrades.archer.level > 20) {
                        Miner_Income_multiplier_chance = 10
                }
                if (upgrades.archer.level > 50) {
                        Miner_Income_multiplier_chance = 20
                }
                if (upgrades.archer.level == 100) {
                        Miner_Income_multiplier_chance = 50
                }
                let globalMinerMultiplier = 1;
                if (upgrades.archer.level >= 10 && Math.random() * 100 < Miner_Income_multiplier_chance) {
                        globalMinerMultiplier = 2;
                        console.log("Lucky Mine , All miner income x2");
                }

                // 2. Naliczanie przychodu dla wszystkich ulepszeń
                Object.keys(upgrades).forEach(key => {
                        const up = upgrades[key];
                        let income = up.level * up.efficiency;

                        // Jeśli pętla przetwarza minera, aplikujemy wyliczony wyżej bonus
                        if (key === 'miner') {
                                income *= globalMinerMultiplier;
                        }

                        gems += income;
                });

                accumulatedTime -= 1000;
        }
        // ----------------------------------

        // 3. Prośba o kolejną klatkę
        requestAnimationFrame(gameLoop);
        updateGems();
        updateUpgradesUI();
}

// Pierwsze odpalenie pętli
requestAnimationFrame(gameLoop);
