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
| `poster.webp`   | Klatka zastępcza pokazywana zanim wideo się wczyta             | zalecany |
| `bg-poster.jpg` | Źródło JPEG dla `poster.webp` (i materiał na `og:image`)      | nie      |

Ścieżki do `bg.mp4` i `poster.webp` ustawia się w `src/config/companyConfig.ts`
(sekcja `media`) — komponent `App.tsx` nie zawiera żadnej ścieżki na sztywno.

**Poster jest ważniejszy, niż się wydaje.** To on jest widoczny, gdy:
przeglądarka odmówi autoodtwarzania, użytkownik ma włączone „ogranicz animacje"
(`prefers-reduced-motion`), albo łącze jest zbyt wolne. Powinien być realną,
reprezentatywną klatką z materiału, nie czarnym prostokątem.

## Ten katalog a Git — stan faktyczny

Zamysł był taki, żeby pliki wideo (dziesiątki–setki MB) NIE trafiały do repozytorium:
każda ich wersja zostawałaby w historii na zawsze i po kilku podmianach klonowanie repo
trwałoby wieczność. Główny `.gitignore` ma nawet odpowiednią regułę:

```gitignore
public/videos/*
!public/videos/.gitkeep
!public/videos/README.md
```

**Ta reguła w tym repozytorium nie działa.** Wzorzec zawierający ukośnik jest
w `.gitignore` *zakotwiczony* w katalogu samego pliku `.gitignore`, więc
`public/videos/*` dopasowuje wyłącznie `<root>/public/videos/*` — a realna ścieżka
to `template-ui-cinematic/public/videos/`. Skutek: `bg.mp4` (8 MB), `bg-poster.jpg`
i `poster.webp` **są śledzone przez Gita** i jadą na Vercela razem z kodem.

Na dziś to działa na naszą korzyść (Vercel buduje z repo, więc tło jest na produkcji),
ale kolejna podmiana 8-megabajtowego wideo trwale powiększy historię. Docelowo:
albo poprawić wzorzec na `**/public/videos/*` i przenieść materiał na CDN,
albo świadomie zostawić jak jest i pilnować rozmiaru pliku.

Sprawdzenie stanu:

```bash
git ls-files template-ui-cinematic/public/videos/
```

**Bez pliku wideo strona nadal działa poprawnie** — po 2 sekundach zadziała bezpiecznik
z `App.tsx` (`UI_FALLBACK_TIMEOUT_MS`) i interfejs pokaże się na samym tle.

## Ręczne kodowanie

```bash
ffmpeg -i material-zrodlowy.mp4 -an -vf "scale=1920:-2" -c:v libx264 -crf 23 -preset slow -profile:v main -level 4.0 -pix_fmt yuv420p -movflags +faststart bg.mp4
```

Poster wyciągnięty z gotowego wideo (druga sekunda materiału), a potem
przekodowany na WebP — ta sama klatka waży wtedy o ok. jedną trzecią mniej:

```bash
ffmpeg -y -i bg.mp4 -ss 00:00:02 -frames:v 1 -q:v 3 bg-poster.jpg
```
```bash
ffmpeg -y -i bg-poster.jpg -c:v libwebp -quality 82 -compression_level 6 -preset picture poster.webp
```

Zmierzone na tym projekcie: **116 750 B → 76 876 B (−34%)** przy tych samych
wymiarach 1280×720. Poster ładuje się od pierwszej klatki renderowania, więc
jego waga wchodzi wprost w LCP.

⚠️ `<video poster>` przyjmuje **jeden** adres — nie ma tu odpowiednika
`<picture>` z listą formatów. WebP obsługują wszystkie przeglądarki od 2020 r.
(Safari 14+); na starszej przeglądarce poster się po prostu nie pokaże, a wideo
i tak zadziała. Jeśli musisz obsłużyć takie urządzenia, wskaż w konfiguracji
`bg-poster.jpg` zamiast `poster.webp`.

## Zalecane parametry

- **Długość:** 8–20 s. Wideo leci w pętli, więc dłuższy materiał to głównie cięższy plik.
- **Rozmiar pliku:** do ok. 4 MB (przy odtwarzaniu liniowym da się zejść znacznie
  niżej niż przy dawnym All-Intra).
- **Kadr:** poziomy 16:9, akcja w centrum — krawędzie przycina `object-cover`,
  a na mobile dodatkowo `object-[75%_center]`.
- **Treść:** powolny, ciągły ruch (przelot nad wodą, sunięcie łodzi).
- **Zapętlenie:** pierwsza i ostatnia klatka powinny być do siebie zbliżone —
  inaczej co kilkanaście sekund widać wyraźne „przeskoczenie" tła.
