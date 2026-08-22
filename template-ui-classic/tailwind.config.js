/** @type {import('tailwindcss').Config} */

/* ==========================================================================
 *  tailwind.config.js — WARIANT KLASYCZNY (jasny motyw)
 * --------------------------------------------------------------------------
 *  Ta konfiguracja jest CELOWO uboższa od kinowej. Brak tu animacji
 *  dekoracyjnych, poświat i rozmyć — każdy taki efekt kosztuje pracę GPU,
 *  a ten wariant projektujemy pod starsze telefony i słabszy zasięg na plaży.
 *
 *  Zachowujemy natomiast mechanizm koloru akcentu przez zmienną CSS — jest
 *  identyczny w obu wariantach, więc ten sam companyConfig.ts przemalowuje
 *  obie strony bez żadnej zmiany w kodzie.
 * ========================================================================== */

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],

  theme: {
    extend: {
      colors: {
        /* Składnia rgb(var(--zmienna) / <alpha-value>) pozwala używać
         * przezroczystości (bg-accent/10) mimo że kolor pochodzi z runtime'u.
         * Szczegóły mechanizmu: src/lib/theme.ts */
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        'accent-dark': 'rgb(var(--accent-dark-rgb) / <alpha-value>)',
        'accent-contrast': 'rgb(var(--accent-contrast-rgb) / <alpha-value>)',
      },

      fontFamily: {
        // Jedna rodzina dla nagłówków i treści — spójnie i szybko.
        sans: ['"Plus Jakarta Sans"', 'Segoe UI', 'system-ui', 'sans-serif'],
      },

      /* Typografia płynna — bez breakpointów, bez skoków rozmiaru. */
      fontSize: {
        'fluid-hero': ['clamp(2rem, 5.5vw, 3.75rem)', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        'fluid-h2': ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
      },

      boxShadow: {
        /* Delikatne, „papierowe" cienie zamiast neonowych poświat.
         * Jasny motyw buduje głębię cieniem, nie światłem. */
        card: '0 1px 2px rgba(15, 23, 42, 0.06), 0 8px 24px -12px rgba(15, 23, 42, 0.18)',
        'card-hover': '0 2px 4px rgba(15, 23, 42, 0.08), 0 16px 32px -12px rgba(15, 23, 42, 0.22)',
      },
    },
  },

  plugins: [],
};
