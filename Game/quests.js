const QUEST_DATABASE = {
    Q1: {
        id: "Q1",
        title: "Q1: List Od Przyjaciela",
        category: "Główne",
        completed: false,
        currentStep: 0,
        description: "Dotarłeś do wioski Kruczy Dół. Poszukaj schronienia i dowiedz się czegoś o okolicy.",
        objectives: [
            { 
                text: "Przeczytaj list", 
                done: false, 
            },
            { 
                text: "Przespij sie w karczmie", 
                done: false, 
                target: { location: 'pokoj_gracza', x: 150, y: 180, name: 'Łóżko' } 
            },
            { 
                text: "Zapytaj się o Nicolasa oraz młyn ", 
                done: false, 
                target: { location: 'karczma_wnetrze', x: 400, y: 115, name: 'Karczmarz Barnaba' } 
            }
        ]
    }
};