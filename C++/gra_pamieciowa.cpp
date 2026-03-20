#include <iostream>
#include <vector>
#include <ctime>
#include <thread>
#include <chrono>
#include <string>

using namespace std;

int main() {
    srand(time(0));
    int n;

    cout << "Podaj liczbe rund n: ";
    cin >> n;

    int wszystkie_poprawne = 0;
    int suma_wszystkich_liczb = 0;

    for (int r = 1; r <= n; r++) {
        vector<int> wylosowane; // to samo co tablica tylko niue ma ustalonego rozmiar
        system("cls");
        cout << "Runda " << r << ". Zapamietaj liczby: " << endl;

        for (int i = 0; i < r; i++) {
            int liczba = rand() % 9 + 1;
            wylosowane.push_back(liczba);
            cout << liczba << " ";
        }
        cout << endl;

        this_thread::sleep_for(chrono::seconds(1 + r));
        system("cls");

        cout << "Podaj zapamietane liczby po kolei: (1 na raz) " << endl;
        int runda_poprawne = 0;
        for (int i = 0; i < r; i++) {
            int odp;
            cin >> odp;
            if (odp == wylosowane[i]) {
                runda_poprawne++;
            }
        }

        float procent_rundy = (float)runda_poprawne / r * 100;
        wszystkie_poprawne += runda_poprawne;
        suma_wszystkich_liczb += r;

        cout << "Wynik w tej rundzie: " << procent_rundy << "%" << endl;
        this_thread::sleep_for(chrono::seconds(2));
    }


    system("cls");
    float wynik_koncowy = (float)wszystkie_poprawne / suma_wszystkich_liczb * 100;
    cout << "--- KONIEC GRY ---" << endl;
    cout << "Twoj ogolny wynik z calej gry to: " << wynik_koncowy << "%" << endl;

    return 0;
}