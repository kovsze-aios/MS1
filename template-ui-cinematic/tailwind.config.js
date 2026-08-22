/** @type {import('tailwindcss').Config} */

/* ==========================================================================
 *  tailwind.config.js — WARIANT KINOWY (dark / glassmorphism)
 * --------------------------------------------------------------------------
 *  Tailwind to generator CSS „na żądanie": skanuje pliki wskazane w `content`,
 *  wyłapuje użyte nazwy klas i tworzy TYLKO odpowiadające im reguły.
 *  Efekt: produkcyjny arkusz waży kilkanaście kB zamiast megabajtów.
 *
 *  ⚠️ NAJCZĘSTSZY BŁĄD: klasy budowane dynamicznie, np. `bg-${kolor}-500`,
 *  nie zostaną znalezione przez skaner i nie trafią do CSS. Dlatego kolor
 *  akcentu wstrzykujemy zmienną CSS (--accent-rgb), a nie sklejaniem nazw klas.
 * ========================================================================== */

export default {
  /* --- 1. GDZIE SZUKAĆ KLAS --------------------------------------------- */
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],

  /* --- 2. MOTYW ---------------------------------------------------------- */
  theme: {
    extend: {
      /*
       * KOLORY
       * Zapis `rgb(var(--accent-rgb) / <alpha-value>)` to celowy zabieg:
       * zmienna CSS trzyma same składowe RGB („14 165 233"), a Tailwind
       * podstawia w miejsce <alpha-value> przezroczystość z nazwy klasy.
       * Dzięki temu `bg-accent`, `bg-accent/20` i `text-accent/70` działają
       * poprawnie, mimo że kolor pochodzi z companyConfig.ts w czasie startu
       * aplikacji (patrz: src/lib/theme.ts).
       */
      colors: {
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        'accent-dark': 'rgb(var(--accent-dark-rgb) / <alpha-value>)',
        'accent-contrast': 'rgb(var(--accent-contrast-rgb) / <alpha-value>)',
        /* Paleta „atramentowa" — tła i powierzchnie ciemnego motywu. */
        ink: {
          950: '#020617',
          900: '#0b1120',
          800: '#111c33',
          700: '#1c2b47',
        },
      },

      /*
       * TYPOGRAFIA
       * Nagłówki: Barlow Condensed — wąska, plakatowa, „filmowa".
       * Treść: Plus Jakarta Sans — nowoczesny, wysoce czytelny grotesk.
       * Na końcu każdej listy stoją czcionki systemowe: jeśli Google Fonts
       * się nie wczyta, strona nadal wygląda profesjonalnie.
       */
      fontFamily: {
        display: ['"Barlow Condensed"', 'Impact', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'Segoe UI', 'system-ui', 'sans-serif'],
      },

      /*
       * TYPOGRAFIA PŁYNNA (fluid) — clamp(min, preferowany, max).
       * Rozmiar skaluje się z szerokością okna BEZ progów breakpointów:
       * na telefonie nie przepełnia ekranu, na 4K nie wygląda mizernie.
       */
      fontSize: {
        'fluid-hero': ['clamp(2.75rem, 9vw, 8rem)', { lineHeight: '0.92', letterSpacing: '-0.02em' }],
        'fluid-h2': ['clamp(2rem, 5vw, 4rem)', { lineHeight: '1.02', letterSpacing: '-0.01em' }],
        'fluid-h3': ['clamp(1.25rem, 2.2vw, 1.875rem)', { lineHeight: '1.2' }],
        'fluid-body': ['clamp(0.95rem, 1.15vw, 1.125rem)', { lineHeight: '1.7' }],
      },

      /* Rozmycie tła — fundament efektu „matowego szkła". */
      backdropBlur: {
        xs: '2px',
        glass: '18px',
      },

      /* Poświata wokół elementów akcentowych (przyciski CTA, aktywne karty). */
      boxShadow: {
        glow: '0 0 40px -8px rgb(var(--accent-rgb) / 0.55)',
        'glow-lg': '0 0 90px -10px rgb(var(--accent-rgb) / 0.45)',
        glass: '0 20px 60px -20px rgba(2, 6, 23, 0.85)',
      },

      /* Klatki kluczowe animacji dekoracyjnych. */
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'scroll-hint': {
          '0%': { transform: 'translateY(0)', opacity: '0' },
          '35%': { opacity: '1' },
          '100%': { transform: 'translateY(14px)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'scroll-hint': 'scroll-hint 1.8s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },

  /* --- 3. WTYCZKI --------------------------------------------------------
   * Świadomie zero zewnętrznych pluginów: własne klasy komponentowe
   * (.glass-card, .btn-accent) definiujemy w src/index.css w @layer components.
   * Mniej zależności = szybszy build i mniej niespodzianek przy aktualizacjach. */
  plugins: [],
};
