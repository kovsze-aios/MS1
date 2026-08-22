/* ==========================================================================
 *  format.ts — formatowanie liczb, cen i czasu
 * --------------------------------------------------------------------------
 *  Korzystamy z wbudowanego API `Intl` (International API), które jest częścią
 *  standardu JavaScript. Zaleta: zero zależności, a formatowanie automatycznie
 *  respektuje polskie konwencje — spacja jako separator tysięcy, przecinek
 *  dziesiętny i symbol „zł" po liczbie (1 234,00 zł, a nie $1,234.00).
 * ========================================================================== */

import type { Currency } from '@/config/companyConfig';

/** Stała lokalizacja — wszystkie formattery mówią po polsku. */
const LOCALE = 'pl-PL';

/**
 * Formatuje kwotę jako cenę w podanej walucie.
 *
 * `maximumFractionDigits: 0` przy kwotach całkowitych to decyzja projektowa:
 * „70 zł" czyta się szybciej i wygląda pewniej sprzedażowo niż „70,00 zł".
 * Grosze pokazujemy tylko wtedy, gdy realnie występują (np. po naliczeniu VAT).
 *
 * @param value - kwota w jednostkach głównych (złotych, nie groszach)
 * @param currency - kod waluty z konfiguracji klienta
 *
 * @example formatPrice(1234.5, 'PLN') → "1234,50 zł"
 * @example formatPrice(70, 'PLN')     → "70 zł"
 */
export function formatPrice(value: number, currency: Currency = 'PLN'): string {
  // Number.isInteger sprawdza, czy liczba nie ma części ułamkowej.
  const hasFraction = !Number.isInteger(value);

  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formatuje samą liczbę (bez waluty) — np. liczbę opinii Google.
 *
 * @example formatNumber(1842) → "1842"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(value);
}

/**
 * Formatuje ocenę w skali 0–5 zawsze z jednym miejscem po przecinku.
 * „4,9" buduje zaufanie skuteczniej niż „4.9" (polska konwencja zapisu)
 * i lepiej niż samo „5" (wygląda podejrzanie idealnie).
 *
 * @example formatRating(4.9) → "4,9"
 */
export function formatRating(value: number): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Zamienia liczbę minut na czytelny opis czasu trwania.
 *
 * @example formatDuration(40)  → "40 min"
 * @example formatDuration(95)  → "1 h 35 min"
 * @example formatDuration(120) → "2 h"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/**
 * Oblicza liczbę pełnych lat od podanego roku do dziś.
 * Zasila licznik „X lat na wodzie" — dzięki temu strona sama się aktualizuje
 * co Nowy Rok i nikt nie musi pamiętać o podbiciu liczby w treści.
 *
 * @param foundedYear - rok rozpoczęcia działalności z companyConfig
 */
export function yearsSince(foundedYear: number): number {
  return Math.max(0, new Date().getFullYear() - foundedYear);
}
