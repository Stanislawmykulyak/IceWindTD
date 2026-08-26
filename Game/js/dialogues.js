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
                        { text: "Szukam pewnej osoby nazywa się Nicolas i podobno tutaj mieszka ", next: "nicolas_info" },
                        { text: "[Zamknij rozmowę]", next: "exit" },

                        { text: "Czy znajduje się tutaj jakiś młyn ?", next: "mlyn" }
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