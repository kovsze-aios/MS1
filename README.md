# `_szablon-master` — Enterprise Monorepo Template (Aios Studio)

Wzorzec, z którego klonujemy każdą nową realizację. **Nie pracujemy bezpośrednio w tym
katalogu** — kopiujemy go do `projekt-XX-nazwa/` i dopiero tam wprowadzamy dane klienta.

---

## Struktura

```
_szablon-master/
├── .vscode/                  ← wspólna konfiguracja edytora dla zespołu
│   ├── settings.json         formatowanie, TypeScript, Tailwind IntelliSense
│   └── extensions.json       rekomendowane rozszerzenia
├── template-api/             ← backend: Node.js + Express + TypeScript
├── template-ui-cinematic/    ← frontend A: dark, wideo sterowane scrollem
├── template-ui-classic/      ← frontend B: jasny, maksymalnie szybki
├── docker-compose.yml        ← n8n (automatyzacja) na porcie 5678
└── .gitignore
```

### Dlaczego DWA osobne frontendy, a nie jeden z przełącznikiem motywu

To dwa różne **modele sprzedaży**, nie dwa zestawy kolorów:

| | Wariant kinowy | Wariant klasyczny |
|---|---|---|
| Cel | zbudować pożądanie, efekt „wow" | dać cenę i telefon w 5 sekund |
| Motyw | ciemny, glassmorphism | jasny, wysoki kontrast |
| Ruch | scroll steruje klatkami wideo | brak animacji |
| Zależności | + `framer-motion`, `lenis` | tylko React + Tailwind |
| Waga JS | ~395 kB (~125 kB gzip) | ~215 kB (~68 kB gzip) |
| Port dev | 5173 | 5174 |
| Sprawdza się | premium, oferta uznaniowa | usługa lokalna, decyzja „tu i teraz" |

Trzymanie ich osobno oznacza, że lekki wariant **naprawdę** jest lekki — nie wlecze za
sobą bibliotek animacji „na wypadek gdyby". Cenę płacimy jedną: pilnujemy, by
`src/config/companyConfig.ts` pozostał identyczny w obu projektach.

### Element wspólny: `src/config/companyConfig.ts`

Ten sam plik leży w obu frontendach i jest **jedynym źródłem prawdy** o kliencie:
dane kontaktowe, cennik, flota, gatunki fok, opinie, kolor akcentu. Zero logiki,
zero importów Reacta — czyste, otypowane dane.

Kolor marki wędruje do CSS przez zmienną `--accent-rgb` (patrz `src/lib/theme.ts`),
więc zmiana **jednej** wartości HEX przemalowuje całą stronę.

---

## Uruchomienie

Każdy projekt jest niezależny i ma własny `package.json`. Instalacja osobno w każdym:

```bash
cd template-ui-cinematic && npm install && npm run dev
```

| Katalog | Komenda | Adres |
|---|---|---|
| `template-ui-cinematic` | `npm run dev` | http://localhost:5173 |
| `template-ui-classic` | `npm run dev` | http://localhost:5174 |
| `template-api` | `npm run dev` | http://localhost:4000 |
| n8n (Docker) | `docker compose up -d` | http://localhost:5678 |

Dostępne skrypty w obu frontendach: `dev`, `build`, `preview`, `typecheck`.
W backendzie: `dev` (tsx watch), `build`, `start`, `typecheck`.

---

## Klonowanie pod nowego klienta

```bash
# 1. Kopia szablonu (bez node_modules — te instalujemy od nowa)
cp -r _szablon-master projekt-02-nazwa-klienta

# 2. Dane klienta — podmień w OBU frontendach (pliki muszą pozostać identyczne)
#    projekt-02-nazwa-klienta/template-ui-cinematic/src/config/companyConfig.ts
#    projekt-02-nazwa-klienta/template-ui-classic/src/config/companyConfig.ts

# 3. Materiał wideo dla wariantu kinowego
#    → template-ui-cinematic/public/videos/hero.mp4
#    (instrukcja kodowania: README w tym katalogu — klatki kluczowe mają znaczenie!)

# 4. Instalacja i weryfikacja
cd projekt-02-nazwa-klienta/template-ui-cinematic && npm install && npm run build
cd ../template-ui-classic && npm install && npm run build
```

### Lista kontrolna przed oddaniem projektu

- [ ] `companyConfig.ts` identyczny w obu frontendach (`diff` musi być pusty)
- [ ] Usunięte wszystkie znaczniki `// TODO:` z konfiguracji
- [ ] Dane rejestrowe potwierdzone z klientem (NIP, REGON, numer konta)
- [ ] Ocena i liczba opinii zgodne z aktualną wizytówką Google
- [ ] `mapsEmbedUrl` wskazuje realny adres (format `?q=...&output=embed`)
- [ ] Numer telefonu przetestowany klikalnie **na prawdziwym telefonie**
- [ ] `npm run build` przechodzi w obu frontendach bez ostrzeżeń
- [ ] Wideo tła zakodowane z `-g 1` (bez tego scroll szarpie)

---

## Backend i automatyzacja

`template-api` wystawia `POST /api/estimate`. Kluczowa zasada: **serwer przelicza cenę
po swojej stronie** i nigdy nie ufa kwocie przysłanej przez przeglądarkę.

`docker-compose.yml` uruchamia n8n, które może odbierać te zapytania webhookiem
i rozsyłać dalej (e-mail, SMS, CRM). Instrukcja połączenia znajduje się w komentarzu
na końcu pliku `docker-compose.yml`.

---

*Projekt przygotowany przez Aios Studio.*
