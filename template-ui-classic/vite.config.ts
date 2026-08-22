/* ==========================================================================
 *  vite.config.ts — WARIANT KLASYCZNY
 * --------------------------------------------------------------------------
 *  Konfiguracja niemal bliźniacza wobec wariantu kinowego. Jedyna istotna
 *  różnica to PORT serwera deweloperskiego: 5174 zamiast 5173.
 *
 *  Dzięki temu oba warianty da się uruchomić JEDNOCZEŚNIE i porównać
 *  w dwóch kartach przeglądarki — a to najszybszy sposób na decyzję klienta,
 *  którą wersję strony wybiera.
 * ========================================================================== */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // Alias '@' → katalog src/. Musi odpowiadać sekcji "paths" w tsconfig.app.json.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 5174, // wariant kinowy zajmuje 5173
    open: true,
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    /*
     * Tutaj ZOSTAWIAMY domyślny próg ostrzeżenia (500 kB).
     * Ten wariant ma być lekki, więc przekroczenie limitu MA nas zaniepokoić —
     * to sygnał, że do paczki wpełzła ciężka zależność wbrew założeniom.
     */
  },
});
