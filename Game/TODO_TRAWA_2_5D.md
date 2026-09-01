# TODO: trawa i kierunek 2.5D

## Kierunek artystyczny

Docelowo gra ma przejsc w 2.5D. Dla trawy wybieramy assety w stylu top-down z lekkim profilem, a nie czyste assety izometryczne.

Powod:
- obecna mapa i ruch sa top-down,
- top-down latwiej polaczyc z obecnym world-space noise,
- lekkie pochylenie i cieniowanie assetow da wrazenie 2.5D bez przebudowy calej mapy,
- czyste assety izometryczne wymusilyby zmiane siatki, kolizji, skali i ukladu swiata.

## Assety trawy do przygotowania

- mala kepka trawy: 3-5 zdzbel, przezroczyste PNG,
- srednia kepka: 6-10 zdzbel,
- rzadka kepka suchej trawy,
- niska trawa przy sciezkach,
- kilka wariantow obrotu i odbicia poziomego,
- pojedyncze liscie, mech i male kwiaty jako osobne detale,
- wariant cienia pod kepka, bardzo subtelny,
- sprite sheet lub atlas z przezroczystym tlem.

Assety powinny miec:
- widok top-down z lekkim profilem,
- stonowana zielona palete zgodna z tekstura podloza,
- brak mocnego czarnego obrysu,
- punkt zakotwiczenia przy dolnej czesci kepki,
- kilka rozmiarow, ale bez przesadnej roznicy skali,
- wersje 1x i ewentualnie 2x dla ostrego pixel-artu.

## Kolejnosc prac

1. Dodac kępki zdzbel jako osobna warstwe nad podlozem.
2. Rozmieszczac je deterministycznie z seeda, tylko w widocznym obszarze.
3. Uzyc maski gestosci: wiecej w lesie, mniej przy drodze i budynkach.
4. Dodac warianty obrotu, odbicia i skali.
5. Dodac delikatne spłaszczenie trawy przy sciezkach.
6. Dodac lekki wiatr animujacy tylko zdzbla, nie cale patche.
7. Dodac kwiaty, liscie, mech i suche zdzbla jako rzadkie detale.
8. Dodac odksztalcenie trawy po graczu i koniu.
9. Sprawdzic wydajnosc na desktopie i slabszym sprzecie.
10. Dopiero potem przygotowac przejscie renderera w kierunku 2.5D.

## Zasady obecnego generatora podloza

- trzy glowne kolory bez osobnego tla,
- polaczone patche bez samotnych wysp,
- world-space noise i stabilny seed,
- domain warping dla organicznych krawedzi,
- drobny high-frequency noise na brzegach,
- subtelna tekstura wewnatrz patchy,
- ograniczone rozmiary patchy z kontrolowana wariacja,
- brak widocznych granic kafelkow,
- cache tylko dla widocznego regionu.

## Kierunek techniczny 2.5D

- zachowac top-down wspolrzedne swiata i obecne kolizje,
- sprite trawy rysowac po world Y, aby obiekty zaslanialy sie poprawnie,
- uzywac sortowania po osi Y dla obiektow i roslinnosci,
- trzymac podloze jako proceduralna warstwe bazowa,
- roslinnosc i detale renderowac osobno nad podlozem,
- nie laczyc assetow trawy z logika kolizji,
- dodac warianty biome i gestosci zamiast osobnych generatorow dla kazdej lokacji.

## Cel koncowy

Trawa ma wygladac naturalnie i stylizowanie jak na referencyjnym obrazku: trzy bliskie tonalnie zielenie, organiczne patche, poszarpane krawedzie, subtelna faktura i dodatkowe zdzbla dajace poczucie przestrzeni. Ma pozostac czytelna podczas gry i wydajna przy ruchu kamery.
