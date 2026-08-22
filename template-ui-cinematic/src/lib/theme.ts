/* ==========================================================================
 *  theme.ts — WSTRZYKIWANIE KOLORU AKCENTU DO CSS
 * --------------------------------------------------------------------------
 *  PROBLEM DO ROZWIĄZANIA:
 *  Kolor marki klienta żyje w pliku TypeScript (companyConfig.theme.accent),
 *  ale Tailwind generuje CSS w czasie BUDOWANIA — nie ma wtedy pojęcia
 *  o wartościach z runtime'u. Nie da się więc napisać `bg-[${accent}]`.
 *
 *  ROZWIĄZANIE — most przez zmienne CSS:
 *   1. tailwind.config.js definiuje kolor jako `rgb(var(--accent-rgb) / <alpha>)`,
 *   2. ta funkcja przy starcie aplikacji ustawia `--accent-rgb` na elemencie <html>,
 *   3. wszystkie klasy `bg-accent`, `text-accent/60`, `shadow-glow` natychmiast
 *      przyjmują kolor klienta.
 *
 *  DLACZEGO TRIPLET „14 165 233", A NIE „#0ea5e9"?
 *  Bo Tailwind wstawia przezroczystość składnią `rgb(R G B / 0.5)`. Gdyby
 *  zmienna trzymała gotowy HEX, zapis `bg-accent/50` wyprodukowałby
 *  nieprawidłowy CSS `rgb(#0ea5e9 / 0.5)` i kolor po prostu by zniknął.
 * ========================================================================== */

import type { ThemeConfig } from '@/config/companyConfig';

/**
 * Zamienia kolor HEX na tekstowy triplet RGB rozdzielony spacjami.
 * Obsługuje skrócony zapis 3-znakowy (#0af) i pełny 6-znakowy (#00aaff).
 *
 * @param hex - kolor w formacie #rgb lub #rrggbb (wielkość liter bez znaczenia)
 * @returns np. "14 165 233"; przy błędnym wejściu zwraca czerń jako bezpieczny fallback
 *
 * @example hexToRgbTriplet('#0ea5e9') → "14 165 233"
 */
export function hexToRgbTriplet(hex: string): string {
  // 1. Normalizacja: usuwamy „#" i białe znaki.
  const clean = hex.trim().replace(/^#/, '');

  // 2. Rozwinięcie zapisu skróconego: "0af" → "00aaff".
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : clean;

  // 3. Walidacja — dokładnie 6 znaków szesnastkowych.
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    // Ostrzegamy w konsoli zamiast wywalać aplikację: literówka w kolorze
    // nie powinna kosztować klienta całej strony.
    console.warn(`[theme] Nieprawidłowy kolor HEX: "${hex}". Używam czerni.`);
    return '0 0 0';
  }

  // 4. Rozbicie na pary znaków i konwersja z systemu szesnastkowego (16) na dziesiętny.
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);

  return `${r} ${g} ${b}`;
}

/**
 * Ustawia zmienne CSS motywu na elemencie <html>.
 * Wywoływana JEDEN raz w src/main.tsx, przed pierwszym renderem Reacta —
 * dzięki temu użytkownik nigdy nie zobaczy „mignięcia" domyślnym kolorem.
 *
 * @param theme - sekcja `theme` z companyConfig
 */
export function applyTheme(theme: ThemeConfig): void {
  // document.documentElement to element <html> — korzeń kaskady CSS,
  // więc zmienne ustawione tutaj widzi każdy element na stronie.
  const root = document.documentElement;

  root.style.setProperty('--accent-rgb', hexToRgbTriplet(theme.accent));
  root.style.setProperty('--accent-dark-rgb', hexToRgbTriplet(theme.accentDark));
  root.style.setProperty('--accent-contrast-rgb', hexToRgbTriplet(theme.accentContrast));
}
