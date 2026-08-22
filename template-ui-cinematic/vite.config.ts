/* ==========================================================================
 *  vite.config.ts — konfiguracja bundlera i serwera deweloperskiego
 * --------------------------------------------------------------------------
 *  Vite pełni dwie role:
 *   • w trybie `npm run dev`  → serwer ESM z błyskawicznym Hot Module Replacement,
 *   • w trybie `npm run build` → produkcyjny bundler (minifikacja, code splitting,
 *     hashowanie nazw plików pod cache przeglądarki).
 * ========================================================================== */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// defineConfig to wyłącznie „opakowanie" dające podpowiedzi typów w IDE —
// w runtime zwraca ten sam obiekt, który mu podasz.
export default defineConfig({
  plugins: [
    /*
     * Plugin React odpowiada za:
     *  - transformację JSX → JavaScript,
     *  - Fast Refresh (zmiana w komponencie nie resetuje stanu aplikacji).
     */
    react(),
  ],

  resolve: {
    alias: {
      /*
       * ALIAS ŚCIEŻEK: '@' wskazuje na katalog src/.
       * Zamiast kruchych ścieżek względnych `../../../config/companyConfig`
       * piszemy `@/config/companyConfig` — import nie psuje się przy
       * przenoszeniu plików.
       *
       * UWAGA: alias musi być zadeklarowany W DWÓCH miejscach —
       * tutaj (dla bundlera) oraz w tsconfig.app.json w sekcji "paths"
       * (dla TypeScripta i podpowiedzi w edytorze).
       */
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    // Port serwera deweloperskiego. Wariant klasyczny startuje na 5174,
    // dzięki czemu oba UI można porównywać obok siebie w dwóch kartach.
    port: 5173,
    // Automatycznie otwiera przeglądarkę po `npm run dev`.
    open: true,
  },

  build: {
    // Katalog wynikowy (ignorowany przez Git — patrz .gitignore).
    outDir: 'dist',
    // Sourcemapy ułatwiają debugowanie produkcji; wyłącz, jeśli nie chcesz
    // udostępniać struktury kodu źródłowego publicznie.
    sourcemap: true,
    /*
     * Ostrzeżenie o zbyt dużej paczce podnosimy do 1 MB — framer-motion
     * i lucide-react to znane, „ciężkie" zależności tego wariantu, więc
     * domyślne 500 kB generowałoby szum przy każdym buildzie.
     */
    chunkSizeWarningLimit: 1000,
  },
});
