# `template-ui-cinematic` — Wariant A (High-End Video Scroll)

Ciemny, „filmowy" landing, w którym **przewijanie strony steruje klatkami wideo tła**.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
```

---

## Jak działa scroll-scrubbing

Cała mechanika mieści się w jednym efekcie w [`src/App.tsx`](src/App.tsx).

1. **Wideo jest zapauzowane** — nie ma `autoPlay` ani `loop`. Klatkę wybiera scroll.
2. **Postęp przewijania** → `window.scrollY / (scrollHeight - innerHeight)`, przycięty do `0–1`.
3. **Pozycja docelowa** → `target = progress × video.duration`.
4. **Wygładzenie** w pętli `requestAnimationFrame`:

```ts
current += (target - current) * (1 - Math.exp(-dt * 8));
video.currentTime = current;
```

Obecność `dt` (czasu między klatkami) jest tu kluczowa: dzięki niej efekt wygląda
identycznie na monitorze 60 Hz i 144 Hz. Popularny skrót `current += (target - current) * 0.1`
byłby na 144 Hz ponad dwukrotnie szybszy — to najczęstszy błąd w takich implementacjach.

Jedna pętla `rAF` obsługuje **jednocześnie** Lenis (płynne przewijanie) i wideo — obie
wartości aktualizują się w tej samej klatce, więc obraz nie „pływa" względem scrolla.

### Bramkowanie interfejsu

UI pojawia się dopiero, gdy wideo zgłosi `canPlay` (stan `videoReady`), a `<AnimatePresence>`
animuje zniknięcie ekranu ładowania. Trzy zabezpieczenia gwarantują, że strona
**nigdy** nie zostanie pusta:

- `onCanPlay` — normalna ścieżka,
- `onError` — brak pliku wideo (pokazujemy treść na gradiencie),
- `UI_FALLBACK_TIMEOUT_MS` (2,5 s) — wolne łącze lub blokada autoodtwarzania.

---

## Materiał wideo

Katalog `public/videos/` jest pusty w repozytorium (wideo nie należy do Gita).
**Instrukcja kodowania z `ffmpeg` znajduje się w [`public/videos/README.md`](public/videos/README.md)** —
najważniejsza jest flaga `-g 1`, która czyni każdą klatkę kluczową. Bez niej
przeglądarka nie potrafi płynnie skakać po osi czasu i scroll wyraźnie szarpie.

---

## Struktura

```
src/
├── App.tsx                    pętla rAF + 4 sekcje po 100vh (kontener min-h-[400vh])
├── main.tsx                   montaż Reacta, wstrzyknięcie kolorów marki
├── index.css                  @tailwind + klasy .glass-* (glassmorphism)
├── config/companyConfig.ts    ⭐ dane klienta — jedyny plik do podmiany
├── components/
│   ├── DossierPanel.tsx       panel wysuwany + jednosekcyjny formularz rezerwacji
│   └── CookieBanner.tsx       zgoda na cookies analityczne
├── hooks/useSmoothScroll.ts   Lenis z autoRaf: false
└── lib/
    ├── cn.ts                  clsx + tailwind-merge
    ├── format.ts              ceny, oceny, czas, odmiana przez liczbę (locale pl-PL)
    ├── icons.ts               klucz z konfiguracji → komponent lucide-react
    └── theme.ts               HEX → triplet RGB → zmienna CSS
```

**Sekcje strony:** Hero → Cennik / konfigurator biletów → Flota i foki → Lokalizacja i kontakt.

---

## Formularz rezerwacji (`DossierPanel.tsx`)

Zakładka „REZERWACJA" to **jedna płynnie przewijana sekcja**, nie kreator krokowy:
cztery bloki (jednostka → termin → miejsca → kontakt) oddzielone linią, wszystkie
pola widoczne naraz, jeden przycisk wysyłki na końcu.

> **Dlaczego nie kreator.** Podział na cztery ekrany z paskiem postępu wyglądał
> porządnie, ale zabrał telefonowi to, w czym jest najlepszy: ciągłe przewijanie
> kciukiem. Zamiast jednego ruchu palca użytkownik wykonywał cztery precyzyjne
> kliknięcia „DALEJ", a panel podmieniał zawartość pod ręką. Do tego nie dało się
> jednym spojrzeniem sprawdzić, co się właściwie zamawia. Reszta panelu (FLOTA,
> CENNIK, OPINIE) też jest jednym długim zwojem — teraz REZERWACJA do niej pasuje.

Walidacja odpala się przy wysyłce (nie ma czego bramkować po drodze): pokazuje
pierwszy napotkany problem i podświetla winne pole przez `aria-invalid`.

Dane lecą `POST`-em jako `x-www-form-urlencoded` w trybie `mode: 'no-cors'` pod adres
`bookingConfig.webhookUrl`, spakowane przez `new URLSearchParams()` w sześć pól:
`unitType`, `date`, `timeSlot`, `seatsCount`, `clientName`, `clientPhone`.
Pełne uzasadnienie tej pary decyzji — i tego, czym za nią płacimy — stoi
w komentarzu nad `RezerwacjaContent`. Warstwa serwerowa:
[`../automatyzacje/README.md`](../automatyzacje/README.md).

### Reguły mikroekranu (320 px)

Panel na najwęższym telefonie daje ~272 px użytecznej szerokości. Trzy zasady,
których w tym pliku **nie wolno łamać**:

| Element | Klasy | Po co |
|---|---|---|
| przyciski, CTA, nagłówki sekcji | `flex-shrink-0 whitespace-nowrap` | nie zwężają się poniżej treści i nie łamią etykiety na dwie linie |
| teksty zmienne w siatkach (nazwy, daty, telefony) | `min-w-0 truncate` | `truncate` **nie zadziała** bez `min-w-0` — domyślne `min-width: auto` elementu flex blokuje zwężenie |
| długie etykiety CTA | dwa `<span>`: `sm:hidden` / `hidden sm:inline` | „WYŚLIJ ZGŁOSZENIE" na telefonie, „WYŚLIJ ZAPYTANIE O REJS" od `sm` — krótszy wariant zamiast zawijania w środku słowa |
| długie nagłówki display | osobny `<span class="block whitespace-nowrap">` na wiersz | „ZGŁOSZENIE PRZYJĘTE" w jednej linii ma przy 36 px ~274 px i wychodzi poza 232 px dostępne na 320 px — łamiemy je ręcznie, zamiast liczyć na zawijanie |

Weryfikacja po każdej zmianie w panelu: DevTools → 320 px → sprawdź, czy
`document.documentElement.scrollWidth === clientWidth`.

---

## Dostępność

Ustawienie systemowe „ogranicz animacje" (`prefers-reduced-motion`) wyłącza płynne
przewijanie i skraca wszystkie przejścia do zera — dla części odbiorców taki ruch
wywołuje mdłości. To wymóg, nie opcja.
