/* ==========================================================================
 *  main.tsx — PUNKT WEJŚCIA APLIKACJI
 * --------------------------------------------------------------------------
 *  Ten plik wykonuje się jako pierwszy. Odpowiada za trzy rzeczy:
 *   1. wczytanie globalnych stylów (Tailwind),
 *   2. wstrzyknięcie kolorów marki klienta do zmiennych CSS,
 *   3. zamontowanie drzewa Reacta w elemencie <div id="root"> z index.html.
 * ========================================================================== */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/App';
import { companyConfig } from '@/config/companyConfig';
import { applyTheme } from '@/lib/theme';

/*
 * Import CSS w pliku .tsx nie jest standardem JavaScriptu — to funkcja Vite.
 * Bundler wyłapuje go, przepuszcza przez PostCSS/Tailwind i w produkcji
 * wypuszcza osobny, zahaszowany plik .css dołączony do <head>.
 */
import '@/index.css';

/*
 * MOTYW PRZED RENDEREM.
 * applyTheme wywołujemy PRZED createRoot celowo: zmienne CSS są wtedy
 * ustawione zanim pojawi się pierwszy piksel, więc użytkownik nie zobaczy
 * mignięcia domyślnym błękitem przed kolorem klienta (efekt FOUC).
 */
applyTheme(companyConfig.theme);

/*
 * Szukamy kontenera montowania. Wykrzyknik (`!`) to asercja niepustości —
 * mówimy TypeScriptowi „gwarantuję, że ten element istnieje". Gwarancję daje
 * index.html, w którym <div id="root"> jest zapisany na stałe.
 */
const container = document.getElementById('root')!;

/*
 * createRoot to API współbieżnego Reacta (od wersji 18). Umożliwia dzielenie
 * renderowania na kawałki, dzięki czemu ciężkie sekcje nie blokują animacji.
 */
createRoot(container).render(
  /*
   * <StrictMode> działa WYŁĄCZNIE w trybie deweloperskim (w produkcji jest
   * usuwany). Celowo montuje komponenty dwukrotnie, żeby ujawnić efekty bez
   * poprawnego sprzątania — np. pętlę rAF albo instancję Lenis, której nikt
   * nie zniszczył. Jeśli coś „dubluje się" w dev, a znika w build — to jest
   * właśnie ten mechanizm, i sygnał, że warto sprawdzić funkcje czyszczące.
   */
  <StrictMode>
    <App />
  </StrictMode>,
);
