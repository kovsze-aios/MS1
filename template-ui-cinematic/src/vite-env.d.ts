/// <reference types="vite/client" />

/* ==========================================================================
 *  vite-env.d.ts — DEKLARACJE TYPÓW ŚRODOWISKA
 * --------------------------------------------------------------------------
 *  Dyrektywa `/// <reference types="vite/client" />` powyżej dociąga typy Vite,
 *  dzięki czemu TypeScript rozumie m.in.:
 *    • import.meta.env       (zmienne środowiskowe)
 *    • import.meta.hot       (Hot Module Replacement)
 *    • importy plików statycznych: `import logo from './logo.svg'`
 *
 *  Poniżej opisujemy WŁASNE zmienne środowiskowe. Vite udostępnia w kodzie
 *  przeglądarki wyłącznie te z prefiksem VITE_ — to zabezpieczenie przed
 *  przypadkowym wysłaniem sekretów backendu do klienta.
 * ========================================================================== */

interface ImportMetaEnv {
  /** Adres backendu, np. http://localhost:4000. Gdy pusty — UI działa w trybie demo. */
  readonly VITE_API_URL?: string;

  /**
   * Endpoint przyjmujący zgłoszenia rezerwacji: wdrożony Google Apps Script
   * (`https://script.google.com/macros/s/<ID>/exec`) albo produkcyjny webhook
   * n8n. Nadpisuje `companyConfig.bookingConfig.webhookUrl`, dzięki czemu
   * podgląd (preview) i produkcja mogą pisać do dwóch różnych arkuszy.
   *
   * Gdy pusta — obowiązuje adres wpisany w companyConfig.ts.
   */
  readonly VITE_BOOKING_WEBHOOK_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
