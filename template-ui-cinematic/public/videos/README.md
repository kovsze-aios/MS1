# Katalog `public/videos/` — pełnoekranowe wideo tła

## ⚡ Szybka ścieżka (nowy klient / nowe wideo)

```bash
# 1. Wrzuć surowy materiał do tego katalogu pod nazwą raw.mp4
# 2. Uruchom z katalogu template-ui-cinematic:
npm run optimize-video
```

Skrypt przekoduje `raw.mp4` na `bg.mp4` do postaci, którą przeglądarka zaczyna
odtwarzać **zanim** pobierze cały plik. Wymaga ffmpeg w `PATH`
(`winget install Gyan.FFmpeg`).

Komenda zawiera komplet potrzebnych flag:

| Flaga | Po co |
| --- | --- |
| `-movflags +faststart` | przenosi metadane (atom `moov`) na początek pliku — bez tego przeglądarka czeka z odtwarzaniem do pobrania całości |
| `-an` | usuwa ścieżkę dźwiękową — wideo tła jest wyciszone, a `muted` to warunek autoodtwarzania |
| `-crf 23` | jakość: niżej = lepiej i ciężej (sensowny zakres 20–26) |
| `-pix_fmt yuv420p` | format kolorów akceptowany przez wszystkie przeglądarki (bez tego Safari pokazuje czarny prostokąt) |
| `-profile:v main -level 4.0` | profil H.264 bezpieczny dla starszych urządzeń mobilnych |

> ### ⚠️ Czego tu już NIE ma: `-g 1`
>
> Do niedawna materiał kodowaliśmy w trybie **All-Intra** (`-g 1 -keyint_min 1` —
> klatka kluczowa na każdej klatce obrazu). Miało to sens, dopóki pozycja scrolla
> sterowała klatkami wideo: skakanie po osi czasu wymaga klatki kluczowej blisko
> celu, inaczej przeglądarka dekoduje materiał od ostatniego keyframe'u.
>
> Wideo odtwarzamy teraz **liniowo, w pętli**, więc ta flaga nie daje już nic —
> a kosztuje **kilkukrotnie większy plik**. Przy tle ładowanym na starcie strony
> to bezpośrednie uderzenie w LCP i w transfer użytkownika mobilnego.
> Jeśli trafisz na starą wersję `bg.mp4` (podejrzanie duży plik przy krótkim
> materiale) — przekoduj go ponownie aktualnym skryptem.

> **Po optymalizacji skasuj `raw.mp4`.** Katalog `public/` trafia do produkcyjnego
> builda w całości, więc pozostawiony materiał źródłowy niepotrzebnie powiększa
> `dist/` o kilka megabajtów.

## Jakie pliki tu wgrać

| Plik              | Rola                                                        | Wymagany |
| ----------------- | ----------------------------------------------------------- | -------- |
| `raw.mp4`       | Surowy materiał wejściowy dla `npm run optimize-video`        | nie      |
| `bg.mp4`        | Wideo tła odtwarzane automatycznie w pętli                    | tak      |
| `bg-poster.jpg` | Klatka zastępcza pokazywana zanim wideo się wczyta            | zalecany |

Ścieżki do `bg.mp4` i `bg-poster.jpg` ustawia się w `src/config/companyConfig.ts`
(sekcja `media`) — komponent `App.tsx` nie zawiera żadnej ścieżki na sztywno.

**Poster jest ważniejszy, niż się wydaje.** To on jest widoczny, gdy:
przeglądarka odmówi autoodtwarzania, użytkownik ma włączone „ogranicz animacje"
(`prefers-reduced-motion`), albo łącze jest zbyt wolne. Powinien być realną,
reprezentatywną klatką z materiału, nie czarnym prostokątem.

## Dlaczego katalog jest pusty w repozytorium

Pliki wideo (dziesiątki–setki MB) nie należą do repozytorium Git — każda ich wersja
zostawałaby w historii na zawsze i po kilku podmianach klonowanie repo trwałoby wieczność.
Dlatego `.gitignore` ignoruje zawartość tego katalogu, zachowując sam katalog
(dzięki plikowi `.gitkeep`).

**Bez pliku wideo strona nadal działa poprawnie** — po 2 sekundach zadziała bezpiecznik
z `App.tsx` (`UI_FALLBACK_TIMEOUT_MS`) i interfejs pokaże się na samym tle.

## Ręczne kodowanie

```bash
ffmpeg -i material-zrodlowy.mp4 -an -vf "scale=1920:-2" -c:v libx264 -crf 23 -preset slow -profile:v main -level 4.0 -pix_fmt yuv420p -movflags +faststart bg.mp4
```

Poster wyciągnięty z gotowego wideo (druga sekunda materiału):

```bash
ffmpeg -i bg.mp4 -ss 00:00:02 -frames:v 1 -q:v 3 bg-poster.jpg
```

## Zalecane parametry

- **Długość:** 8–20 s. Wideo leci w pętli, więc dłuższy materiał to głównie cięższy plik.
- **Rozmiar pliku:** do ok. 4 MB (przy odtwarzaniu liniowym da się zejść znacznie
  niżej niż przy dawnym All-Intra).
- **Kadr:** poziomy 16:9, akcja w centrum — krawędzie przycina `object-cover`,
  a na mobile dodatkowo `object-[75%_center]`.
- **Treść:** powolny, ciągły ruch (przelot nad wodą, sunięcie łodzi).
- **Zapętlenie:** pierwsza i ostatnia klatka powinny być do siebie zbliżone —
  inaczej co kilkanaście sekund widać wyraźne „przeskoczenie" tła.
