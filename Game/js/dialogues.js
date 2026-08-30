const dialogueManager = {
    isActive: false,
    currentTree: null,

    trees: {
        karczmarz_intro: {
            speaker: "Karczmarz Barnaba",
            nodes: {
                start: {
                    text: "Witaj w 'Pod Krukiem'. Pokoje czyste, piwo zimne. W czym mogę pomóc?",
                    choices: [
                        {

                            text: "Pokaż mi swoje towary 💰",
                            next: "exit",
                            type: "trade",
                            onSelect: () => shopSystem.openShop('karczmarz_shop')

                        },
                        {
                            text: "Chciałbym wynająć pokój i przespać się do świtu (10 złota).",
                            next: "rent_room",
                            condition: () => !player.hasItem('room_key')
                        },
                        {
                            text: "Mam już klucz do pokoju.",
                            next: "already_have_key",
                            condition: () => player.hasItem('room_key')
                        },
                        

                        { text: "Czy znajduje się tutaj jakiś młyn ?", next: "mlyn" },
                        { text: "[Zamknij rozmowę] ❌", next: "exit" },
                    ]
                },
                already_have_key: {
                    text: "Twój pokój to Pokój #4 na piętrze. Schody po prawej stronie.",
                    choices: [{ text: "Rozumiem, dzięki.", next: "exit" }]
                },
                nicolas_info: {
                    text: "Nicolas? A tak, kojarzę go. Mieszka wzdłuż głównej drogi",
                    choices: [{ text: "Dzięki Wielkie", next: "exit" }],
                },
                mlyn: {

                    text: "Tak, jest na skraju wioski od strony lasu ,ale od wielu lat jest nieczynny",
                    choices: [{ text: "Dzięki Wielkie", next: "exit" }],
                    onSelect: () => {
                        questManager.completeObjective('Q1', 2);
                    },
                },
                rent_room: {
                    text: () => player.gold >= 10
                        ? "Oto twój klucz do Pokoju nr 4. Idź na górę po schodach, twój pokój jest na samym końcu korytarza po prawej."
                        : "Brak ci miedziaków! Pokój kosztuje 10 złota.",
                    choices: [
                        {
                            text: "[Zapłać 10 złota i weź klucz]",
                            next: "give_key_action",
                            condition: () => player.gold >= 10
                        },
                        { text: "Wracam do swoich spraw.", next: "exit" }
                    ]
                },
                give_key_action: {
                    text: "Otrzymałeś Klucz do Pokoju #4. Schody na piętro są po prawej stronie.",
                    onSelect: () => {
                        player.gold -= 10;
                        const goldUi = document.getElementById('player-gold');
                        if (goldUi) goldUi.innerText = player.gold;
                        player.addItem('room_key', '🔑 Klucz do Pokoju #4', '🔑', 'quest', 0.1, 'Klucz do pokoju w karczmie');
                    },
                    choices: [{ text: "Dzięki, idę do pokoju.", next: "exit" }]
                }
            }
        },
        zielarz_intro: {
            speaker: "Mira Zielarka",
            nodes: {
                start: {
                    text: "Witaj, przybyszu. Mogę pomóc przygotować tylko mikstury i wywary z ziół.",
                    choices: [
                        { text: "Pokaż mi towary zielarskie 🌿", next: "exit", type: "trade", onSelect: () => shopSystem.openShop('zielarz_shop') },
                        { text: "Pokaż mi receptury i mikstury 🧪", next: "exit", type: "craft", onSelect: () => openHerbalistCrafting() },
                        { text: "Dzięki, wracam do lasu.", next: "exit" }
                    ]
                }
            }
        },
        kowal_intro: {
            speaker: "Tomasz Kowal",
            nodes: {
                start: {
                    text: "Żelazo nie znosi pośpiechu. W tej kuźni robimy wyłącznie broń i ostrza.",
                    choices: [
                        { text: "Pokaż mi towary kuźni ⚒️", next: "exit", type: "trade", onSelect: () => shopSystem.openShop('kowal_shop') },
                        { text: "Pokaż mi broń i receptury ⚒️", next: "exit", type: "craft", onSelect: () => openSmithCrafting() },
                        { text: "Dobrze, zobaczę się później.", next: "exit" }
                    ]
                }
            }
        }
    },
    getRecipeNoticeChoice() {
        if (!player || !player.lastUnlockedRecipe) return null;

        const recipeId = player.lastUnlockedRecipe;
        const recipeItem = Object.values(ITEMS_DB || {}).find(item => item && item.unlocksRecipe === recipeId);
        const label = recipeId.startsWith('potion') || recipeId.startsWith('antitoxin') ? 'alchemiczną' : 'rzemieślniczą';
        const choice = {
            text: `✨ Odkryłem nową recepturę ${label}: ${recipeItem ? recipeItem.name : recipeId}`,
            type: 'special',
            color: '#ffd76a',
            next: 'exit',
            onSelect: () => {
                if (this.currentTree && this.currentTree.speaker === 'Mira Zielarka') {
                    openHerbalistCrafting();
                }
                if (this.currentTree && this.currentTree.speaker === 'Tomasz Kowal') {
                    openSmithCrafting();
                }
                player.lastUnlockedRecipe = null;
            }
        };
        return choice;
    },

    start(treeId) {
        if (!this.trees[treeId]) return;
        this.isActive = true;
        this.currentTree = this.trees[treeId];
        document.getElementById('dialogue-box').classList.remove('hidden');
        document.getElementById('dialogue-speaker').innerText = this.currentTree.speaker;
        this.showNode('start');
    },

    showNode(nodeId) {
        if (nodeId === 'exit') {
            this.end();
            return;
        }
        const node = this.currentTree.nodes[nodeId];
        if (!node) return;

        if (node.onSelect) node.onSelect();

        const textContent = typeof node.text === 'function' ? node.text() : node.text;
        document.getElementById('dialogue-text').innerText = textContent;
        const optionsDiv = document.getElementById('dialogue-options');
        optionsDiv.innerHTML = '';

        const recipeNotice = this.getRecipeNoticeChoice();
        if (recipeNotice) {
            const noticeBtn = document.createElement('button');
            noticeBtn.className = 'dialogue-btn special';
            noticeBtn.style.color = recipeNotice.color;
            noticeBtn.style.borderColor = recipeNotice.color;
            noticeBtn.style.background = 'rgba(255, 215, 106, 0.1)';
            noticeBtn.innerText = recipeNotice.text;
            noticeBtn.onclick = () => {
                if (recipeNotice.onSelect) recipeNotice.onSelect();
                this.showNode(recipeNotice.next);
            };
            optionsDiv.appendChild(noticeBtn);
        }

        node.choices.forEach(choice => {
            if (choice.condition && !choice.condition()) return;
            const btn = document.createElement('button');

            // Dodaje podstawową klasę i ewentualnie specjalną (np. trade, craft)
            btn.className = `dialogue-btn ${choice.type || ''}`;
            if (choice.color) btn.style.color = choice.color;

            btn.innerText = choice.text;
            btn.onclick = () => {
                if (choice.onSelect) choice.onSelect();
                this.showNode(choice.next);
            };
            optionsDiv.appendChild(btn);
        });
    },

    end() {
        this.isActive = false;
        document.getElementById('dialogue-box').classList.add('hidden');
    }
};