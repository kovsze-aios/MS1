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
├── hooks/useSmoothScroll.ts   Lenis z autoRaf: false
└── lib/
    ├── cn.ts                  clsx + tailwind-merge
    ├── format.ts              ceny, oceny, czas (Intl, locale pl-PL)
    ├── icons.ts               klucz z konfiguracji → komponent lucide-react
    └── theme.ts               HEX → triplet RGB → zmienna CSS
```

**Sekcje strony:** Hero → Cennik / konfigurator biletów → Flota i foki → Lokalizacja i kontakt.

---

## Dostępność

Ustawienie systemowe „ogranicz animacje" (`prefers-reduced-motion`) wyłącza płynne
przewijanie i skraca wszystkie przejścia do zera — dla części odbiorców taki ruch
wywołuje mdłości. To wymóg, nie opcja.
