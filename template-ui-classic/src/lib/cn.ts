/* ==========================================================================
 *  cn.ts — łączenie klas CSS bez konfliktów
 * --------------------------------------------------------------------------
 *  Funkcja `cn` rozwiązuje dwa PODSTAWOWE problemy pracy z Tailwindem.
 *
 *  PROBLEM 1 — warunkowe klasy (rozwiązuje `clsx`)
 *     Ręcznie:  className={'btn ' + (active ? 'bg-accent ' : '') + (big ? 'p-8' : '')}
 *     Z clsx:   cn('btn', active && 'bg-accent', big && 'p-8')
 *     clsx po cichu pomija wartości false / null / undefined.
 *
 *  PROBLEM 2 — konflikt klas (rozwiązuje `tailwind-merge`)
 *     W CSS wygrywa reguła zdefiniowana PÓŹNIEJ w arkuszu, a nie ta wpisana
 *     później w atrybucie class. Zapis "p-4 p-8" daje więc nieprzewidywalny
 *     wynik — Tailwind nie wie, którą chciałeś.
 *     twMerge rozumie semantykę klas i zostawia ostatnią z danej rodziny:
 *       twMerge('p-4 p-8')                → 'p-8'
 *       twMerge('bg-red-500 bg-blue-500') → 'bg-blue-500'
 *
 *  To kluczowe przy komponentach przyjmujących `className` z zewnątrz:
 *  rodzic MUSI móc nadpisać domyślny styl dziecka.
 * ========================================================================== */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Scala listę klas CSS: najpierw normalizuje warunki (clsx),
 * potem usuwa konflikty Tailwinda (twMerge).
 *
 * @param inputs - dowolna liczba stringów, tablic, obiektów lub wartości fałszywych
 * @returns gotowy string do atrybutu `className`
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-accent', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
