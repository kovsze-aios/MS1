# Arkusz `Morskie Safari` — mapa kolumn i formuły

Arkusz: <https://docs.google.com/spreadsheets/d/1XyubWN8VUSXjE9rxt2OhxjnBM6ifcv3jc9p3dRHLzbw/edit>

Wszystko poniżej wstawia automatycznie funkcja `inicjalizujArkusz()`
z [`../apps-script/Kod.gs`](../apps-script/Kod.gs). Ten dokument istnieje po to,
żeby dało się **zrozumieć i naprawić** arkusz bez uruchamiania skryptu — oraz
żeby ktokolwiek w studiu mógł odtworzyć ten dashboard u kolejnego klienta.

---

## 0. Zanim wkleisz jakąkolwiek formułę — dwie rzeczy, które psują wszystko

### a) Separator argumentów zależy od języka arkusza

| Lokalizacja arkusza | Separator | Zapis |
|---|---|---|
| **Polska** (i większość UE) | średnik | `SUMIFS(A:A; B:B; "x")` |
| Stany Zjednoczone | przecinek | `SUMIFS(A:A, B:B, "x")` |

**Wszystkie formuły w tym pliku używają średnika.** Jeśli po wklejeniu
dostajesz `#ERROR!`, sprawdź *Plik → Ustawienia → Ustawienia regionalne*.

### b) `13:00` to nie zawsze `13:00`

To jest **główna pułapka tego arkusza** i przyczyna 90% przypadków
„SUMIFS pokazuje 0, chociaż rezerwacje są".

Google Sheets automatycznie konwertuje wpisywane wartości:

- `"13:00"` → wartość czasu (liczba `0.5416…`),
- `"2026-08-25"` → wartość daty (liczba `46265`),
- `"0501234567"` → liczba `501234567` — **zjada wiodące zero telefonu**.

Jeśli webhook zapisze tekst `"13:00"`, a w `Grafik_Dnia` ktoś wpisze `13:00`
ręcznie (i Sheets zrobi z tego wartość czasu), to `"13:00" = 0.5416…` jest
**fałszem** i suma wychodzi zero. Dwa niezależne zabezpieczenia:

1. **Format kolumn na `Tekst zwykły`** — `Rezerwacje!B:D`, `Rezerwacje!G:G`
   i `Grafik_Dnia!B:C`. Robi to `inicjalizujArkusz()`; ręcznie:
   zaznacz kolumny → *Format → Liczba → Tekst zwykły*.
2. **Normalizacja `TEXT()` po obu stronach porównania** — każde kryterium
   w formułach niżej jest opakowane w `TEXT(...; "yyyy-mm-dd")` albo
   `TEXT(...; "hh:mm")`. `TEXT()` zwraca wartość niezmienioną, jeśli nie da
   się jej sformatować, więc działa **zarówno** dla tekstu, jak i dla
   prawdziwej daty/godziny. To jest właśnie ten pas bezpieczeństwa, dzięki
   któremu formuła nie pada, gdy ktoś wpisze coś ręcznie.

---

## 1. Zakładka `Rezerwacje` — baza surowa

Jeden wiersz = jedno zgłoszenie. **Nic tu nie liczymy** — to dziennik zdarzeń,
dopisywany wyłącznie przez webhook (albo ręcznie przez załogę dla rezerwacji
telefonicznych).

| Kol. | Nagłówek | Typ | Kto wypełnia | Uwagi |
|:--:|---|---|---|---|
| A | `ID` | tekst | webhook | `MS-260825-1300-RIB-01` — do podyktowania przez telefon |
| B | `DataWpisu` | tekst | webhook | `2026-08-23 14:07` — kiedy przyszło zgłoszenie |
| C | `DataRejsu` | **tekst** | webhook | `2026-08-25` (ISO, sortuje się alfabetycznie = chronologicznie) |
| D | `Godzina` | **tekst** | webhook | `13:00` |
| E | `Jednostka` | tekst | webhook | pełna nazwa, np. `SZYBKA MOTORÓWKA RIB` |
| F | `Imie` | tekst | webhook | imię i nazwisko klienta |
| G | `Telefon` | **tekst** | webhook | 9 cyfr bez spacji, `+48` obcięte |
| H | `Miejsca` | **liczba** | webhook | to jest kolumna sumowana przez SUMIFS |
| I | `Status` | tekst | **załoga** | `NOWA` → `POTWIERDZONA` / `ANULOWANA` / `LISTA_REZERWOWA` |
| J | `Zrodlo` | tekst | webhook | `WWW`, `TELEFON`, `n8n`, `TEST` |

### Słownik statusów

| Status | Kto nadaje | Wliczany do obłożenia? |
|---|---|:--:|
| `NOWA` | webhook | ✅ tak |
| `POTWIERDZONA` | załoga po rozmowie | ✅ tak |
| `LISTA_REZERWOWA` | webhook, gdy rejs jest już pełny | ✅ tak |
| `ANULOWANA` | załoga | ❌ **nie** |

> Kluczowa decyzja projektowa: **niczego nie kasujemy**. Anulowana rezerwacja
> zostaje w arkuszu ze statusem `ANULOWANA` i wypada z sum. Dzięki temu
> historia jest kompletna (kto, kiedy, ile razy odwołał), a skasowany wiersz
> nie zabiera ze sobą dowodu, że w ogóle istniał.

---

## 2. Zakładka `Ustawienia` — jedno źródło prawdy dla floty

Czytają ją **i formuły, i Apps Script** — dzięki temu zmiana pojemności łodzi
w jednym miejscu przelicza cały dashboard i zmienia zachowanie webhooka.

| | A | B | | D | E | | G |
|--:|---|---|---|---|---|---|---|
| **1** | `Jednostka` | `Pojemnosc` | | `Prog startu rejsu` | `8` | | `Godziny` |
| **2** | `SZYBKA MOTORÓWKA RIB` | `12` | | | | | `10:00` |
| **3** | `STATEK WOLNY` | `12` | | | | | `11:30` |
| **4** | | | | | | | `13:00` |
| … | | | | | | | … |

### Zakresy nazwane

*Dane → Zakresy nazwane* — trzy pozycje:

| Nazwa | Zakres | Do czego |
|---|---|---|
| `FLOTA` | `Ustawienia!$A$2:$B$20` | `VLOOKUP` pojemności |
| `PROG_STARTU` | `Ustawienia!$E$1` | próg „płyniemy" w `IFS` |
| `GODZINY` | `Ustawienia!$G$2:$G$20` | generator siatki dnia (sekcja 5) |

Zakres nazwany zamiast `Ustawienia!$E$1` daje dwie rzeczy: formuła się **czyta**
(`$E2 >= PROG_STARTU` mówi, co robi), i **nie psuje się**, gdy ktoś wstawi
wiersz nad komórką E1.

---

## 3. Zakładka `Grafik_Dnia` — dashboard operacyjny

Wiersz = jeden **slot rejsu** (data + godzina + jednostka). Kolumny B, C, D
wypełnia człowiek (albo generator z sekcji 5), **reszta liczy się sama**.

| Kol. | Nagłówek | Źródło |
|:--:|---|---|
| A | `WIDOK GŁÓWNY (STATUS)` | formuła `IFS` |
| B | `Data` | wpis ręczny / generator |
| C | `Godzina` | wpis ręczny / generator |
| D | `Jednostka` | wpis ręczny / generator |
| E | `Zajęte Miejsca` | formuła `SUMIFS` |
| F | `Pojemność` | formuła `VLOOKUP` |
| G | `Wolne` | formuła `MAX` |
| H | `Pasażerowie` | formuła `TEXTJOIN` + `FILTER` |

---

### 3.1 `E2` — obłożenie slotu (SUMIFS)

```excel
=IF($B2="";"";SUMIFS(
  Rezerwacje!$H$2:$H;
  Rezerwacje!$C$2:$C; TEXT($B2;"yyyy-mm-dd");
  Rezerwacje!$D$2:$D; TEXT($C2;"hh:mm");
  Rezerwacje!$E$2:$E; $D2;
  Rezerwacje!$I$2:$I; "<>ANULOWANA"
))
```

Rozbiór argument po argumencie:

| Fragment | Znaczenie |
|---|---|
| `IF($B2="";"";…)` | pusty wiersz zostaje pusty zamiast pokazywać `0` — dashboard nie zaśmieca się zerami do 200. wiersza |
| `Rezerwacje!$H$2:$H` | **zakres sumowania** — kolumna `Miejsca` |
| `$C$2:$C; TEXT($B2;"yyyy-mm-dd")` | warunek 1: data rejsu = data tego wiersza (obie strony sprowadzone do tekstu) |
| `$D$2:$D; TEXT($C2;"hh:mm")` | warunek 2: godzina |
| `$E$2:$E; $D2` | warunek 3: jednostka (porównanie tekstowe, w Sheets **nieczułe na wielkość liter**) |
| `$I$2:$I; "<>ANULOWANA"` | warunek 4: **wykluczenie anulowanych** — operator `<>` w cudzysłowie razem z wartością |
| `$H$2:$H` (a nie `$H:$H`) | start od wiersza 2 pomija nagłówek; przy `H:H` tekst „Miejsca" i tak byłby zignorowany, ale zakres od 2. jest szybszy i czytelniejszy |

**Wszystkie warunki łączy `ORAZ`** — SUMIFS sumuje tylko wiersze spełniające
komplet czterech kryteriów naraz. Nie ma wersji „LUB"; to celowe ograniczenie
funkcji i dokładnie to, czego tu potrzebujemy.

> **Wariant pancerny (gdy ktoś rozwalił formaty kolumn)**
>
> `SUMIFS` porównuje wartość *taką, jaka jest w komórce*. Jeśli część wierszy
> ma godzinę jako tekst, a część jako wartość czasu, część i tak wypadnie.
> `SUMPRODUCT` normalizuje **obie strony** i jest odporny na taki bałagan —
> kosztem wydajności (wymaga zakresów domkniętych, tu do wiersza 5000):
>
> ```excel
> =SUMPRODUCT(
>    (TEXT(Rezerwacje!$C$2:$C$5000;"yyyy-mm-dd") = TEXT($B2;"yyyy-mm-dd")) *
>    (TEXT(Rezerwacje!$D$2:$D$5000;"hh:mm")      = TEXT($C2;"hh:mm"))      *
>    (Rezerwacje!$E$2:$E$5000 = $D2)                                        *
>    (Rezerwacje!$I$2:$I$5000 <> "ANULOWANA")                               *
>    N(Rezerwacje!$H$2:$H$5000)
> )
> ```
>
> Mnożenie warunków logicznych = koniunkcja: `PRAWDA*PRAWDA*PRAWDA*PRAWDA` daje
> `1`, każdy fałsz zeruje iloczyn. `N()` zamienia pustą komórkę i tekst na `0`,
> żeby jeden uszkodzony wpis nie wywalił całej sumy błędem.

---

### 3.2 `F2` — pojemność jednostki (VLOOKUP)

```excel
=IF($D2="";"";IFERROR(VLOOKUP($D2;FLOTA;2;FALSE);12))
```

- `FALSE` na czwartej pozycji = **dopasowanie dokładne**. Domyślne `TRUE`
  zakłada posortowaną tabelę i przy literówce zwraca cichą, błędną wartość —
  najgorszy możliwy rodzaj błędu w arkuszu rezerwacyjnym.
- `IFERROR(…;12)` — jednostka spoza `FLOTA` nie wysypuje wiersza `#N/D`,
  tylko przyjmuje domyślne 12 miejsc. Ta sama wartość awaryjna, co
  `KONFIG.pojemnoscDomyslna` w Apps Script.

### 3.3 `G2` — wolne miejsca

```excel
=IF($F2="";"";MAX(0;$F2-$E2))
```

`MAX(0; …)` gasi ujemne liczby: nadkomplet (13 osób na 12 miejsc) ma pokazać
`0 wolnych`, a nie `-1`.

---

### 3.4 `A2` — status wizualny (IFS)

```excel
=IF($B2="";"";TEXT($B2;"yyyy-mm-dd")&" | "&$D2&" ➜ "&IFS(
  $E2 >= $F2;          "🔴 REJS PEŁNY ("&$E2&"/"&$F2&")";
  $E2 >= PROG_STARTU;  "🟢 PŁYNIEMY ("&$E2&"/"&$F2&")";
  $E2 > 0;             "🟡 SZUKAJ LUDZI ("&$E2&"/"&$F2&") - BRAKUJE "&(PROG_STARTU-$E2)&" DO STARTU";
  TRUE;                "⚪ BRAK ZGŁOSZEŃ (0/"&$F2&")"
))
```

**Jak działa `IFS`:** sprawdza pary `warunek; wynik` **po kolei** i zwraca
wynik **pierwszego** warunku, który jest prawdziwy. Reszty nawet nie oblicza.

Dlatego **kolejność warunków to cała logika tej formuły** i nie wolno jej
przestawiać:

| # | Warunek | Dlaczego akurat tu |
|:-:|---|---|
| 1 | `$E2 >= $F2` | „pełny" musi być pierwszy — 12/12 spełnia też warunek 2 i 3 |
| 2 | `$E2 >= PROG_STARTU` | 8–11 osób: rejs na pewno wypływa |
| 3 | `$E2 > 0` | 1–7 osób: są chętni, ale brakuje do progu — **to jest wiersz, po którym załoga dzwoni** |
| 4 | `TRUE` | odpowiednik `ELSE`. `IFS` bez tego zwraca `#N/D` dla pustego slotu |

`IFS` zamiast zagnieżdżonych `IF`: cztery `IF` jeden w drugim to sześć nawiasów
zamykających na końcu i nieczytelny jednolinijkowiec. `IFS` czyta się jak
tabelę decyzyjną i dopisanie piątego przypadku to dopisanie jednej linii.

Emoji na początku każdego wariantu są **funkcjonalne, nie ozdobne**: załoga
czyta ten arkusz na telefonie w słońcu, na kołyszącym się pomoście. Kolor
rozpoznaje się szybciej niż słowo.

---

### 3.5 `H2` — imienna lista pasażerów (TEXTJOIN + FILTER)

```excel
=IF($B2="";"";IFERROR(TEXTJOIN("  ·  ";TRUE;FILTER(
  Rezerwacje!$F$2:$F&" ["&Rezerwacje!$H$2:$H&" msc] "&Rezerwacje!$G$2:$G&" ("&Rezerwacje!$I$2:$I&")";
  TEXT(Rezerwacje!$C$2:$C;"yyyy-mm-dd") = TEXT($B2;"yyyy-mm-dd");
  TEXT(Rezerwacje!$D$2:$D;"hh:mm")      = TEXT($C2;"hh:mm");
  Rezerwacje!$E$2:$E = $D2;
  Rezerwacje!$I$2:$I <> "ANULOWANA"
));"- brak zgłoszeń -"))
```

To jest kolumna, dla której załoga w ogóle otwiera ten arkusz: **lista do
odczytania na pomoście**, bez przełączania zakładek i filtrowania bazy.

- `FILTER(co_zwrócić; warunek1; warunek2; …)` — zwraca **wiersze**, nie sumę.
  Pierwszy argument to sklejony ciąg (`Imie [4 msc] 509562635 (NOWA)`),
  budowany z czterech kolumn naraz — Sheets robi to element po elemencie.
- `TEXTJOIN(separator; PRAWDA; …)` — skleja wyniki w jedną komórkę.
  `PRAWDA` na drugiej pozycji **pomija puste wartości**; przy `FAŁSZ`
  dostalibyśmy sznur separatorów bez treści.
- `IFERROR(…; "- brak zgłoszeń -")` — `FILTER` bez żadnego trafienia zwraca
  `#N/D`. Pusty slot ma wyglądać na pusty, a nie na zepsuty.

---

## 4. Formatowanie warunkowe (kolor całego wiersza)

*Format → Formatowanie warunkowe → Formuła niestandardowa*,
zakres `A2:H200`, cztery reguły **w tej kolejności** (pierwsza pasująca wygrywa):

| # | Formuła | Kolor tła | Znaczenie |
|:-:|---|---|---|
| 1 | `=$E2>=$F2` | `#F4CCCC` czerwony | komplet — nie przyjmuj więcej |
| 2 | `=$E2>=PROG_STARTU` | `#D9EAD3` zielony | płyniemy |
| 3 | `=$E2>0` | `#FFF2CC` żółty | dzwoń po ludzi |
| 4 | `=$B2<TODAY()` | `#EFEFEF` szary + szary tekst | termin miniony, archiwum |

Reguła 4 na końcu, ale z zaznaczonym **„Zatrzymaj, jeśli prawda"** —
wczorajszy pełny rejs ma być szary, nie czerwony.

---

## 5. Opcjonalnie: automatyczny generator siatki dnia

Zamiast wpisywać ręcznie 14 wierszy (7 godzin × 2 jednostki) na każdy dzień —
jedna formuła. Wpisz datę w `J1`, a `B2` rozleje się na kolumny B, C i D:

```excel
=ARRAYFORMULA(IFERROR(SPLIT(FLATTEN(
  TEXT($J$1;"yyyy-mm-dd") & "|" &
  FILTER(GODZINY;GODZINY<>"") & "|" &
  TRANSPOSE(FILTER(INDEX(FLOTA;0;1);INDEX(FLOTA;0;1)<>""))
);"|")))
```

Jak to działa: kolumna godzin (`N×1`) sklejona z **transponowaną** listą
jednostek (`1×M`) daje siatkę `N×M` wszystkich kombinacji — to iloczyn
kartezjański zrobiony samym operatorem `&`. `FLATTEN` układa siatkę w jedną
kolumnę, `SPLIT` rozcina każdy wiersz z powrotem na trzy komórki po znaku `|`.

⚠️ Wymaga **pustych** kolumn B, C, D poniżej — formuła rozlewająca się
(*array formula*) zwraca `#REF!`, jeśli natrafi na jakąkolwiek zajętą komórkę
w obszarze, który chce wypełnić. Kolumny A i E–H zostają z formułami per wiersz.

---

## 6. Szybka diagnostyka

| Objaw | Przyczyna | Naprawa |
|---|---|---|
| `SUMIFS` zwraca `0`, choć rezerwacje są | godzina/data raz jako tekst, raz jako wartość | zaznacz `Rezerwacje!B:D` → *Format → Liczba → Tekst zwykły*, potem przepisz feralne komórki; albo przejdź na wariant `SUMPRODUCT` (3.1) |
| `#ERROR!` zaraz po wklejeniu | arkusz w lokalizacji US | zamień `;` na `,` |
| `#N/D` w kolumnie A | brak gałęzi `TRUE` w `IFS` albo nieznana nazwa w `PROG_STARTU` | *Dane → Zakresy nazwane* — sprawdź, czy `PROG_STARTU` istnieje |
| Telefon bez wiodącego zera | kolumna G jako liczba | format `Tekst zwykły` + apostrof przed numerem (webhook robi to sam) |
| `#REF!` w B2 | generator z sekcji 5 nie ma miejsca | wyczyść B:D poniżej wiersza z formułą |
| Wszystko liczy się z opóźnieniem | zakresy otwarte (`$H$2:$H`) przy >5000 wierszy | domknij zakresy do realnej liczby wierszy |
