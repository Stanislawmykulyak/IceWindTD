#include <iostream>
#include <cstdlib>
#include <ctime>
#include <windows.h>

using namespace std;

void rysujASCII(int hpG, int hpP) {
    system("cls");
    cout << "   GRACZ [HP: " << hpG << "]          POTWOR [HP: " << hpP << "]" << endl;
    cout << "      O   ^                 /  \\" << endl;
    cout << "     /||\\|                ( o.o )" << endl;
    cout << "     / \\ |                 > ^ <" << endl;
    cout << "------------------------------------------" << endl;
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

        ruchP = opcje[rand() % 3];
        cout << "\nATAK... ";
        Sleep(500); 

        if (ruchG == ruchP) {
            cout << "REMIS! Obaj wybrali: " << ruchG << endl;
        } else if ((ruchG == 'k' && ruchP == 'n') || (ruchG == 'n' && ruchP == 'p') || (ruchG == 'p' && ruchP == 'k')) {
            cout << "TRAFIONY! Potwor dostaje hita." << endl;
            hpPotwora--;
        } else {
            cout << "Ala! Potwor Cie dziabnal." << endl;
            hpGracza--;
        }
        
        Sleep(1500);
    }

    system("cls");
    if (hpGracza <= 0) cout << "GAME OVER. Potwor wygral...";
    else cout << "ZWYCIESTWO! Potwor pokonany.";

    return 0;
}