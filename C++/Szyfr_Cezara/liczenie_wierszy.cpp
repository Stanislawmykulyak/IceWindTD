#include <iostream>
#include <fstream>
#include <string>

using namespace std;
int main(){
    ifstream plik("dane.txt"); //input danych
    string linia; //output danych

    int wiersze = 0;
    int znaki = 0;

    if(plik.is_open()){

        while(getline(plik,linia)){
            wiersze++;
            znaki += linia.length();
        }
        plik.close();

        cout << "W tym pliku znajduje sie " << wiersze << "wierszy"<< endl;
        cout << "W tym pliku znajduje sie " << znaki << "znakow"<< endl;
    }else{
        cout << "Cos sie spieprzylo" << endl;
    }

    return 0;
}