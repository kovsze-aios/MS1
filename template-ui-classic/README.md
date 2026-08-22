# `template-ui-classic` — Wariant B (Fast & Trust Focus)

Jasny, maksymalnie szybki landing nastawiony na jedno działanie: **telefon do klienta**.

```bash
npm install
npm run dev      # http://localhost:5174
npm run build
```

---

## Założenie projektowe

Odbiorca stoi na plaży, trzyma telefon w słońcu i ma słaby zasięg. W 5 sekund musi
poznać cenę i móc zadzwonić jednym kciukiem.

Konsekwencje techniczne — świadome **braki** względem wariantu kinowego:

| Czego nie ma | Dlaczego |
|---|---|
| `framer-motion`, `lenis` | ~180 kB JS mniej; animacje nic tu nie sprzedają |
| wideo tła | zero megabajtów transferu |
| ciemnego motywu | jasny jest czytelniejszy w pełnym słońcu |
| rozmyć i poświat | `backdrop-filter` obciąża GPU starszych telefonów |

Płynne przewijanie kotwic realizuje czysty CSS (`scroll-behavior: smooth`) — bez ani
jednego kilobajta JavaScriptu.

## Numer telefonu w czterech miejscach

Klient nigdy nie musi go szukać: górny pasek → nagłówek → karta w hero →
**przyklejony pasek na dole ekranu mobilnego** (`MobileCallBar`, `sm:hidden`).
Każde wystąpienie to `href="tel:..."` z numerem bez spacji — spacje potrafią rozbić
click-to-call na części urządzeń.

---

## Sekcje

1. **Pasek górny** — lokalizacja + ocena Google (dwa pierwsze pytania klienta lokalnego)
2. **Nagłówek** — przyklejony, z przyciskiem połączenia
3. **Hero** — obietnica + wielki, klikalny numer + parametry rejsu
4. **Cennik** — semantyczna `<table>` (czytniki ekranu zapowiadają nagłówki kolumn,
   a wyszukiwarki mogą pokazać cenę wprost w wynikach)
5. **Flota** — kafelki motorówek
6. **Foki** — sekcja edukacyjna (buduje wartość oferty i pozycjonuje na frazy informacyjne)
7. **Opinie** — karty z cytatami i oceną
8. **Dane firmy i mapa** — NIP, REGON, numer konta + osadzona mapa (`loading="lazy"`)

---

## Struktura

```
src/
├── App.tsx                    wszystkie sekcje, zero zależności animacyjnych
├── main.tsx                   montaż Reacta + kolory marki
├── index.css                  @tailwind + klasy .card / .btn-* / .badge
├── config/companyConfig.ts    ⭐ IDENTYCZNY plik jak w wariancie kinowym
└── lib/                       cn, format, icons, theme (wspólne z wariantem A)
```

> **Uwaga:** `companyConfig.ts` musi pozostać identyczny w obu frontendach.
> Weryfikacja: `diff template-ui-cinematic/src/config/companyConfig.ts template-ui-classic/src/config/companyConfig.ts`
