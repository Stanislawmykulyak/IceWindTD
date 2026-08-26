const QUEST_DATABASE = {
    Q1: {
    id: "Q1",
    title: "Q1: List Od Przyjaciela",
    category: "Główne",
    completed: false,
    currentStep: 0,
    description: "Dostałeś od przyjaciela niepokojący list.",
    objectives: [
        { 
            text: "Przeczytaj list", 
            done: false 
        },
        { 
            text: "Przespij sie w karczmie", 
            done: false, 
            target: { location: 'pokoj_gracza', x: 150, y: 180, name: 'Łóżko' } 
        },
        { 
            text: "Zapytaj się o młyn", 
            done: false, 
            target: { location: 'karczma_wnetrze', x: 400, y: 115, name: 'Karczmarz Barnaba' } 
        },
        { 
            text: "Udaj się do starego młyna", 
            done: false, 
            target: { location: 'wioska_mlyn', x: 800, y: 1200, name: 'Stary Młyn' } 
        },
        { 
            text: "Wejdź do piwnicy młyna", 
            done: false, 
            target: { location: 'wioska_mlyn', x: 820, y: 1250, name: 'Drzwi do piwnicy' } 
        },
        { 
            text: "Pokonaj zbirów w piwnicy", 
            done: false 
        }
    ]
}
};

const MONOLOGUE_DATABASE = {
    read_nicolas_letter: [
        { text: "Arkelas: Hmmm... Nicolas znowu wpadł w gówno po same uszy.", duration: 3500 },
        { text: "Arkelas: 'Gdzie czarodziejki chodzą z patelnią'o co mogło mu chodzić ... aa, o to mu chodzi ", duration: 7500 },
        { text: "Arkelas: Prawie zapomnniałem jak nas ta wariatka probowala zabic podczas kampani", duration: 4000 },
        { text: "Arkelas: Tylko gdzie ja tu znajdę młyn ,no trudno trzeba będzie się zapytać w karczmie a na razie przydałoby się przespać po podróży", duration: 7000 },
        
        
    ]
};

const questManager = {
    activeQuestId: "Q1",
    currentObjective: "",
    target: null,
    quests: typeof QUEST_DATABASE !== 'undefined' ? QUEST_DATABASE : {},

    init() {
        const activeQuest = this.quests[this.activeQuestId];
        if (activeQuest && activeQuest.objectives && activeQuest.objectives.length > 0) {
            const currentStep = activeQuest.currentStep || 0;
            const currentObj = activeQuest.objectives[currentStep];
            if (currentObj) {
                this.setObjective(
                    currentObj.text,
                    currentObj.target?.location,
                    currentObj.target?.x,
                    currentObj.target?.y,
                    currentObj.target?.name
                );
            }
        }
    },

    setObjective(text, location, x, y, name) {
        this.currentObjective = text;
        this.target = location ? { location, x, y, name } : null;

        const hudObj = document.getElementById('hud-quest-obj') || document.getElementById('current-objective');
        if (hudObj) hudObj.innerText = `• ${text}`;

        const hudName = document.getElementById('hud-quest-name');
        if (hudName && this.quests[this.activeQuestId]) {
            hudName.innerText = this.quests[this.activeQuestId].title;
        }
    },
    updateUI() {
        this.init(); // Odświeża cel w HUD na ekranie
        if (typeof menuSystem !== 'undefined' && menuSystem.isOpen) {
            menuSystem.renderQuestsTab(); // Odświeża Dziennik w menu
        }
    },

    completeObjective(questId, stepIndex, amount = 1) {
        const quest = this.quests[questId]; // Pobieramy quest po kluczu z obiektu
        if (!quest || !quest.objectives) return;

        const objective = quest.objectives[stepIndex];
        if (!objective || objective.completed || objective.done) return;

        // Cel bez targetu (np. czytanie listu / rozmowa)
        if (objective.target === undefined || objective.target === null) {
            objective.completed = true;
            objective.done = true;
        } else {
            // Cel licznikowy (np. zabij X wrogów)
            objective.current = (objective.current || 0) + amount;
            if (objective.current >= objective.target) {
                objective.completed = true;
                objective.done = true;
            }
        }

        // Jeśli to był bieżący krok, przejdź do następnego celu
        if (quest.currentStep === stepIndex) {
            quest.currentStep = (quest.currentStep || 0) + 1;
        }

        // Sprawdź czy cały quest jest skończony
        const allDone = quest.objectives.every(o => o.completed || o.done);
        if (allDone) {
            quest.completed = true;
            if (typeof showToast === 'function') showToast(`Zadanie ukończone: ${quest.title}`);
        }

        this.updateUI();
    }
};
