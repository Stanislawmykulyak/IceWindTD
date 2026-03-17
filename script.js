// Definiujemy jaki jest adres z ktorego bedziemy pobierac kursy walut
// ZMIANA: Dodajemy /last/2/ aby pobrać kurs z dzisiaj i z wczoraj do porównania
const ApiURL = 'https://api.nbp.pl/api/exchangerates/tables/a/last/2/?format=json';

// Definiujemy ktore waluty chcemy widziec
const showedCurrencies = ['USD','EUR']

const symbole_walut = {
    'USD': '$',
    'EUR': '€'
}

async function getExchangeRate(){
    const container = document.getElementById('kursy_walut')
    
    try {
        // Definiujemy czym jest response
        const response = await fetch(ApiURL);

        // w skrocie jesli response.ok czyli response = true , ale ! flipuje wartosci wiec jesli false to :
        if(!response.ok){
            throw new Error(`Błąd łaczenia : ${response.status}`);
        }

        // Pobieramy to co wyslalo nam Api jakby
        const data = await response.json();

        // NBP zwraca teraz dwie tabele: data[1] to dzisiaj, data[0] to wczoraj
        const todayRates = data[1].rates;
        const yesterdayRates = data[0].rates;

        // Clearujemy container zeby miec miejsce gdzie wrzucic kursy walut
        container.innerHTML = ' ';

        // dla kazdego elementu tworzymy
        // ZMIANA: Szukamy waluty w obu tabelach, żeby sprawdzić czy kurs wzrósł
        showedCurrencies.forEach(code => {
            const today = todayRates.find(r => r.code === code);
            const yesterday = yesterdayRates.find(r => r.code === code);

            if (today && yesterday) {
                const symbol = symbole_walut[code] || code;

                // Sprawdzamy trend: jeśli dzisiejszy kurs jest większy lub równy wczorajszemu
                const isUp = today.mid >= yesterday.mid;
                const arrow = isUp ? '▲' : '▼';
                const trendClass = isUp ? 'trend-up' : 'trend-down';

                const currency_container = document.createElement('div');
                currency_container.classList.add('currency-tile');

                currency_container.innerHTML = `
                    <div class="currency-top">
                        <div class="currency-code"><span class="symbol">${symbol}</span> ${today.code} </div> 
                    </div>
                    <div class="currency-rate">
                        ${today.mid.toFixed(2)} PLN <span class="${trendClass}">${arrow}</span>
                    </div>
                `;
                container.appendChild(currency_container);  
            }
        });
    } catch (error) {
        console.error('Wystąpił błąd:', error);
        if (container) {
            container.innerHTML = `<p style="color: red;">Nie udało się pobrać danych.</p>`;
        }
    }
}
document.addEventListener('DOMContentLoaded', getExchangeRate);

// Hamburger menu functionality
const menuButton = document.getElementById('menuButton');
const menuList = document.getElementById('menuList');
const menuClose = document.getElementById('menuClose');

menuButton.addEventListener('click', () => {
    menuList.classList.add('active');
    menuList.style.display = 'flex';
});

menuClose.addEventListener('click', () => {
    menuList.classList.remove('active');
    menuList.style.display = 'none';
});