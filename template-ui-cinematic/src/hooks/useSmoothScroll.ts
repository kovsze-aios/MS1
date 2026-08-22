/* ==========================================================================
 *  useSmoothScroll.ts — PŁYNNE PRZEWIJANIE (Lenis)
 * --------------------------------------------------------------------------
 *  PO CO TO W OGÓLE JEST?
 *  Natywne przewijanie kółkiem myszy jest SKOKOWE — przeglądarka przesuwa
 *  stronę o ~100 px na „klik" kółka. Przy scrubowaniu wideo scrollem oznacza
 *  to szarpane przeskoki klatek zamiast płynnego filmu.
 *
 *  Lenis przechwytuje zdarzenia kółka i zamienia je na animowaną interpolację
 *  pozycji. Efekt: pozycja scrolla zmienia się gładko w każdej klatce, a wideo
 *  przewija się jak na osi czasu w programie do montażu.
 *
 *  ⚠️ WAŻNE — JEDNA PĘTLA rAF W CAŁEJ APLIKACJI.
 *  Ustawiamy `autoRaf: false`, więc Lenis NIE tworzy własnej pętli animacji.
 *  Zamiast tego App.tsx w swojej pętli requestAnimationFrame woła
 *  `lenis.raf(time)` tuż przed przeliczeniem klatki wideo. Dzięki temu
 *  pozycja scrolla i czas wideo są aktualizowane w TEJ SAMEJ klatce —
 *  gdyby działały w dwóch niezależnych pętlach, obraz „pływałby" o klatkę.
 * ========================================================================== */

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

/**
 * Inicjalizuje płynne przewijanie i zwraca referencję do instancji Lenis.
 *
 * @returns ref, którego `.current` zawiera instancję Lenis albo `null`
 *          (zanim efekt się wykona lub gdy użytkownik wyłączył animacje)
 */
export function useSmoothScroll() {
  // useRef przechowuje wartość między renderami i — w odróżnieniu od useState —
  // jej zmiana NIE powoduje ponownego renderu. Idealne dla obiektów imperatywnych.
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    /*
     * DOSTĘPNOŚĆ: honorujemy systemowe ustawienie „ogranicz animacje".
     * Dla części osób płynny scroll wywołuje zawroty głowy i mdłości,
     * dlatego w takim przypadku zostawiamy natywne przewijanie przeglądarki.
     */
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      /* Czas dobiegania do pozycji docelowej (w sekundach).
       * Więcej = bardziej „ciężko" i kinowo, mniej = ostrzej i responsywniej. */
      duration: 1.1,

      /* Krzywa wygładzania: gwałtowny start, długie, miękkie hamowanie.
       * To wykładniczy easing-out — ten sam charakter ruchu, który stosujemy
       * w animacjach Framer Motion (stała EXPO_OUT), więc całość jest spójna. */
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),

      /* Wygładzamy kółko myszy, ale NIE dotyk. Na telefonach natywne
       * przewijanie jest już płynne, a nadpisywanie go psuje wrażenia. */
      smoothWheel: true,
      syncTouch: false,

      /* Mnożnik czułości kółka — 1 to zachowanie zbliżone do natywnego. */
      wheelMultiplier: 1,

      /* KLUCZOWE: własną pętlę rAF prowadzi App.tsx (patrz komentarz u góry). */
      autoRaf: false,
    });

    lenisRef.current = lenis;

    /*
     * SPRZĄTANIE. Funkcja zwrócona z useEffect uruchamia się przy odmontowaniu
     * komponentu. Bez `lenis.destroy()` nasłuchiwacze zdarzeń zostałyby
     * podpięte do `window` na zawsze — klasyczny wyciek pamięci, szczególnie
     * dotkliwy przy Hot Module Replacement w trybie deweloperskim.
     */
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []); // pusta tablica zależności = uruchom raz, przy montowaniu

  return lenisRef;
}
