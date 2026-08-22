# Katalog `public/videos/` — wideo tła sterowane scrollem

## ⚡ Szybka ścieżka (nowy klient / nowe wideo)

```bash
# 1. Wrzuć surowy materiał do tego katalogu pod nazwą raw.mp4
# 2. Uruchom z katalogu template-ui-cinematic:
npm run optimize-video
```

Skrypt przekoduje `raw.mp4` na `bg.mp4` w formacie **All-Intra** (`-g 1` — klatka
kluczowa na każdej klatce obrazu). To warunek konieczny płynnego scrubbingu:
bez niego przeglądarka przy każdym ruchu kółka dekoduje materiał od ostatniej
klatki kluczowej. Zmierzone na tym projekcie: **mediana szukania klatki spadła
ze 109 ms do 8 ms** (budżet jednej klatki przy 60 FPS to 16,7 ms).

Skrypt wymaga ffmpeg w `PATH` (`winget install Gyan.FFmpeg`).

Komenda zawiera komplet potrzebnych flag:

| Flaga | Po co |
| --- | --- |
| `-g 1` | klatka kluczowa na każdej klatce obrazu (All-Intra) — sedno płynności |
| `-movflags +faststart` | metadane na początek pliku, więc `video.duration` jest znane od razu, a nie po pobraniu całości |
| `-an` | usuwa ścieżkę dźwiękową — wideo tła i tak jest wyciszone |
| `-crf 23` | jakość: niżej = lepiej i ciężej (sensowny zakres 20–26) |
| `-pix_fmt yuv420p` | format kolorów akceptowany przez wszystkie przeglądarki |

Długość filmu nie ma znaczenia — silnik czyta `video.duration` w każdej klatce
i rozciąga oś czasu równomiernie na całą wysokość przewijania strony.

> **Po optymalizacji skasuj `raw.mp4`.** Katalog `public/` trafia do produkcyjnego
> builda w całości, więc pozostawiony materiał źródłowy niepotrzebnie powiększa
> `dist/` o kilka megabajtów.

## Jakie pliki tu wgrać

| Plik              | Rola                                                        | Wymagany |
| ----------------- | ----------------------------------------------------------- | -------- |
| `raw.mp4`       | Surowy materiał wejściowy dla `npm run optimize-video`        | nie      |
| `bg.mp4`        | Wideo tła scrubowane przewijaniem strony                     | tak      |
| `bg-poster.jpg` | Klatka zastępcza pokazywana zanim wideo się wczyta           | zalecany |

Ścieżki do `bg.mp4` i `bg-poster.jpg` ustawia się w `src/config/companyConfig.ts`
(sekcja `media`) — komponent `App.tsx` nie zawiera żadnej ścieżki na sztywno.


## Dlaczego katalog jest pusty w repozytorium

Pliki wideo (dziesiątki–setki MB) nie należą do repozytorium Git — każda ich wersja
zostawałaby w historii na zawsze i po kilku podmianach klonowanie repo trwałoby wieczność.
Dlatego `.gitignore` w `_szablon-master` ignoruje zawartość tego katalogu,
zachowując sam katalog (dzięki plikowi `.gitkeep`).

**Bez pliku wideo strona nadal działa poprawnie** — po 2 sekundach zadziała bezpiecznik
z `App.tsx` (`UI_FALLBACK_TIMEOUT_MS`) i interfejs pokaże się na samym tle.

## Jak przygotować materiał (to ma realny wpływ na płynność)

Scrubowanie polega na skakaniu po osi czasu, a przeglądarka może wyświetlić klatkę tylko
wtedy, gdy trafi na tzw. **klatkę kluczową** (keyframe). Standardowe wideo ma je co 2–5 sekund,
przez co przewijanie wygląda na „zacinające się". Rozwiązanie: zakodować materiał z klatką
kluczową w **każdej** klatce obrazu.

```bash
ffmpeg -i material-zrodlowy.mp4 -an -vf "scale=1920:-2,fps=30" -c:v libx264 -crf 24 -preset slow -g 1 -keyint_min 1 -movflags +faststart bg.mp4
```

Co robi każda flaga:

- `-an` — usuwa ścieżkę audio (wideo i tak jest wyciszone; mniejszy plik)
- `-vf scale=1920:-2` — skaluje do szerokości 1920 px, wysokość dobiera parzystą automatycznie
- `-fps 30` — stała liczba klatek; zmienna psuje precyzję scrubowania
- `-crf 24` — jakość (niżej = lepiej i ciężej; 20–26 to sensowny zakres)
- **`-g 1 -keyint_min 1`** — najważniejsze: każda klatka staje się kluczowa
- `-movflags +faststart` — przenosi metadane na początek pliku, więc przeglądarka
  zna długość wideo natychmiast, nie po pobraniu całości

## Zalecane parametry

- **Długość:** 8–20 s (dłuższe = cięższy plik bez zysku dla odbiorcy)
- **Rozmiar pliku:** do ok. 8 MB
- **Kadr:** poziomy 16:9, akcja w centrum — krawędzie przycina `object-cover`
- **Treść:** powolny, ciągły ruch (przelot nad wodą, sunięcie łodzi). Cięcia montażowe
  i gwałtowne zmiany kadru rozbijają wrażenie sterowania obrazem przez scroll.

## Poster

```bash
ffmpeg -i bg.mp4 -vframes 1 -q:v 3 bg-poster.jpg
```
