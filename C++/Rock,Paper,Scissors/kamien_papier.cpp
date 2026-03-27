#include <iostream>
#include <cstdlib>
#include <ctime>
#include <windows.h>
#include <string>

using namespace std;

// Funkcja rysująca podstawowy stan gry
void rysujASCII(int hpG, int hpP) {
    system("cls");
    cout << "      GRACZ [HP: " << hpG << "]           POTWOR [HP: " << hpP << "]" << endl;
    cout << "          O   ^                 /  \\" << endl;
    cout << "         /||\\|                ( o.o )" << endl;
    cout << "         / \\ |                 > ^ <" << endl;
    cout << "------------------------------------------" << endl;
}

// Funkcja pokazująca wynik rundy - dynamiczna "klatka" ataku
void pokazAtak(int hpG, int hpP, char wynik, char ruchG, char ruchP) {
    system("cls");
    string rText = (ruchG == 'k' ? "Kamien" : (ruchG == 'n' ? "Nozyce" : "Papier"));
    string pText = (ruchP == 'k' ? "Kamien" : (ruchP == 'n' ? "Nozyce" : "Papier"));

    cout << "      GRACZ [HP: " << hpG << "]           POTWOR [HP: " << hpP << "]" << endl;

    if (wynik == 'W') { // Gracz wygrywa
        cout << "          \\  O   ^           ( \\ / )" << endl;
        cout << "           \\/||\\|           ( x.x )" << endl;
        cout << "            \\|/  |          \\ / / \\" << endl;
        cout << "------------------------------------------" << endl;
        cout << "TRAFIONY! Twoj " << rText << " pokonal " << pText << " potwora." << endl;
    } else if (wynik == 'P') { // Potwor wygrywa
        cout << "       ( X )  ^              /--\\ "<< endl;
        cout << "       /||\\  |           ( > < )" << endl;
        cout << "       / \\   |         >--<" << endl;
        cout << "------------------------------------------" << endl
        ;
        cout << "AUU! Jego " << pText << " pokonal Twoje " << rText << "." << endl;
    } else { // Remis
        cout << "          O   ^      REMIS !  /  \\" << endl;
        cout << "         /||\\|              ( o.o )" << endl;
        cout << "         / \\ |               > ^ <" << endl;
        cout << "------------------------------------------" << endl;
        cout << "REMIS! Obaj wybraliscie: " << rText << "." << endl;
    }
}

int main() {
    srand(time(0));
    int hpGracza = 3, hpPotwora = 3;
    char ruchG, ruchP;
    char opcje[] = {'k', 'n', 'p'};

    while (hpGracza > 0 && hpPotwora > 0) {
        rysujASCII(hpGracza, hpPotwora);
        cout << "Twoj ruch (k-kamien, n-nozyce, p-papier): ";
        cin >> ruchG;

        // Walidacja ruchu gracza
        if (ruchG != 'k' && ruchG != 'n' && ruchG != 'p') {
            cout << "Niepoprawny wybor! Sprobuj ponownie." << endl;
            Sleep(1000);
            continue;
        }

        ruchP = opcje[rand() % 3];

        cout << "\nATAK... ";
        Sleep(1500); // Krotka pauza przed pokazaniem wyniku

        char wynik;
        if (ruchG == ruchP) {
            wynik = 'R'; // Remis
        } else if ((ruchG == 'k' && ruchP == 'n') || (ruchG == 'n' && ruchP == 'p') || (ruchG == 'p' && ruchP == 'k')) {
            wynik = 'W'; // Gracz wygrywa
            hpPotwora--;
        } else {
            wynik = 'P'; // Potwor wygrywa
            hpGracza--;
        }

        // Pokaz dynamiczna klatke ataku
        pokazAtak(hpGracza, hpPotwora, wynik, ruchG, ruchP);
        
        // Zwiekszona pauza, zeby gracz mogl zobaczyc obrazek
        Sleep(3000);
    }

    system("cls");
    if (hpGracza <= 0) {
        cout << "===========================================" << endl;
        cout << "               GAME OVER." << endl;
        cout << "        Potwor pokonal cie. Zostales" << endl;
        cout << "               zjedzony..." << endl;
        cout << "===========================================" << endl;
    } else {
        cout << "===========================================" << endl;
        cout << "               ZWYCIESTWO!" << endl;
        cout << "        Pokonales straszliwego" << endl;
        cout << "               potwora!" << endl;
        cout << "===========================================" << endl;
    }

    return 0;
}