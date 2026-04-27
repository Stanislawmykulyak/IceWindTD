#include <iostream>
#include <string>
#include <cctype>
#include <vector>

using namespace std;

string caesarCipher(string text, int key, char direction) {
    string result = "";
    
    key = key % 26;
    
    if (direction == 'L' || direction == 'l') {
        key = 26 - key;
    }

    for (int i = 0; i < text.length(); i++) {
        char c = text[i];
        
        if (isupper(c)) {
            result += char(int(c + key - 65) % 26 + 65);
        } 
        else if (islower(c)) {
            result += char(int(c + key - 97) % 26 + 97);
        } 
        else {
            // Spacje i znaki specjalne zostają bez zmian
            result += c; 
        }
    }
    return result;
}

int main() {
    int key;
    char direction;
    string text;
    vector<string> zapisaneWiadomosci;

    cout << "Podaj klucz (liczba): ";
    cin >> key;

    cout << "Kierunek przesuniecia (P - w prawo, L - w lewo): ";
    cin >> direction;

    cout << "Wpisz tekst: ";
    cin.ignore();
    getline(cin, text);

    string final_text = caesarCipher(text, key, direction);
    cout << "\nWynik: " << final_text << "\n";


    zapisaneWiadomosci.push_back(final_text);


    cout << "\n--- HISTORIA ZAPISANYCH W TABLICY ---\n";
    for(int i = 0; i < zapisaneWiadomosci.size(); i++) {
        cout << "Indeks [" << i << "]: " << zapisaneWiadomosci[i] << "\n";
    }
    return 0;
}