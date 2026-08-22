/* ==========================================================================
 *  postcss.config.js — potok przetwarzania CSS
 * --------------------------------------------------------------------------
 *  PostCSS działa jak taśma produkcyjna dla arkuszy stylów: bierze plik CSS
 *  i przepuszcza go kolejno przez wtyczki. Vite wykrywa ten plik automatycznie.
 *
 *  KOLEJNOŚĆ WTYCZEK MA ZNACZENIE — wykonują się z góry na dół:
 *   1. tailwindcss  → zamienia dyrektywy @tailwind / @apply na realny CSS
 *                     i generuje wyłącznie te klasy, których faktycznie użyto,
 *   2. autoprefixer → dopisuje prefiksy producentów (-webkit-, -moz-)
 *                     na podstawie listy wspieranych przeglądarek.
 *
 *  Odwrotna kolejność nie zadziałałaby: autoprefixer nie miałby czego
 *  prefiksować, bo Tailwind nie wygenerowałby jeszcze reguł.
 * ========================================================================== */

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
