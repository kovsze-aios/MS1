# `template-ui-cinematic` — Wariant A (High-End Video Scroll)

Ciemny, „filmowy" landing z **pełnoekranowym wideo tła odtwarzanym w pętli** i kinowym
reveal typografii sterowanym przewijaniem.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
```

---

## Wideo tła

Cała mechanika mieści się w dwóch efektach w [`src/App.tsx`](src/App.tsx).

**1. Odtwarzanie.** Wideo leci samo, w pętli, bez dźwięku:

```tsx
<video autoPlay loop muted playsInline preload="auto"
       className="absolute inset-0 w-full h-full object-cover …" />
```

Cztery atrybuty, każdy obowiązkowy z innego powodu:

| Atrybut | Po co |
|---|---|
| `autoPlay` | start bez interakcji użytkownika |
| `muted` | **warunek konieczny** — żadna przeglądarka nie wystartuje sama materiału z dźwiękiem |
| `playsInline` | iOS bez tego otwiera wideo na pełnym ekranie zamiast odtwarzać w miejscu |
| `loop` | tło nie może się skończyć czarną klatką |

⚠️ Zapis reactowy: `autoPlay` i `playsInline` **z wielką literą w środku**. Napisane
małymi (`autoplay`, `playsinline`) React uzna za nieznany atrybut DOM i po cichu pominie.

Dodatkowo `useEffect` woła jawnie `video.play()` na `canplay` i po powrocie do karty —
przeglądarka potrafi odrzucić autostart, gdy karta wstaje w tle, a iOS pauzuje wideo
po przełączeniu aplikacji. Obietnica z `play()` bywa odrzucona i **musi** mieć `catch`,
inaczej konsola zapełnia się błędami przy każdym wejściu na stronę.

Przy ustawieniu systemowym „ogranicz animacje" (`prefers-reduced-motion: reduce`)
wideo zostaje zapauzowane i widać sam poster.

**2. Przypięcie do okna.** Wideo siedzi w kontenerze `fixed inset-0 h-[100dvh]`,
a samo ma `absolute inset-0 w-full h-full object-cover`. Rodzic sekcji ma ~400vh,
więc `absolute` bez tego wrappera rozciągnęłoby wideo na całą wysokość dokumentu
i `object-cover` przyciąłby kadr do wąskiego paska.

> **Czego tu już nie ma: scroll-scrubbingu.** Wcześniej pozycja przewijania sterowała
> klatkami (`video.currentTime` ustawiane w pętli rAF, `video.pause()` na `loadeddata`).
> Skutek uboczny był taki, że atrybuty `autoPlay`/`loop` nie miały żadnego znaczenia —
> JavaScript zatrzymywał odtwarzanie zaraz po starcie, a przy krótkiej stronie tło
> zamarzało na pierwszej klatce. Mechanizm został usunięty, nie poprawiony.

Pętla `requestAnimationFrame` **zostaje**, ale napędza wyłącznie Lenisa
([`useSmoothScroll`](src/hooks/useSmoothScroll.ts) tworzy go z `autoRaf: false`).
Jej usunięcie zabiłoby płynne przewijanie całej strony.

### Bramkowanie interfejsu

UI pojawia się dopiero, gdy wideo zgłosi `canplay` (stan `videoReady`), a `<AnimatePresence>`
animuje zniknięcie ekranu ładowania. Dwa zabezpieczenia gwarantują, że strona
**nigdy** nie zostanie pusta:

- `loadeddata` / `canplay` — normalna ścieżka,
- `UI_FALLBACK_TIMEOUT_MS` (2 s) — wolne łącze, brak pliku wideo albo blokada autoodtwarzania.

---

## Materiał wideo

Katalog `public/videos/` jest pusty w repozytorium (wideo nie należy do Gita).
Instrukcja kodowania z `ffmpeg`: [`public/videos/README.md`](public/videos/README.md).

Materiał odtwarzamy liniowo, więc **nie potrzebuje już kodowania All-Intra (`-g 1`)**,
które obsługiwało scrubbing kosztem kilkukrotnie większego pliku. Wystarczy zwykły
H.264 z `-movflags +faststart` (metadane na początku pliku — przeglądarka zaczyna
odtwarzać przed pobraniem całości).

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
przewijanie, skraca wszystkie przejścia do zera **i pauzuje wideo tła** (zostaje
poster) — dla części odbiorców taki ruch wywołuje mdłości. To wymóg, nie opcja.
Media query jest obserwowane na żywo (`matchMedia(...).addEventListener('change')`),
więc zmiana ustawienia działa bez przeładowania strony.
