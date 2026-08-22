/* ==========================================================================
 *  main.tsx — PUNKT WEJŚCIA (wariant klasyczny)
 * --------------------------------------------------------------------------
 *  Identyczna sekwencja jak w wariancie kinowym:
 *   1. globalne style, 2. kolory marki, 3. montaż Reacta.
 *  Spójność między wariantami jest zamierzona — developer przesiadający się
 *  z jednego projektu na drugi nie musi uczyć się nowego układu plików.
 * ========================================================================== */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/App';
import { companyConfig } from '@/config/companyConfig';
import { applyTheme } from '@/lib/theme';

import '@/index.css';

// Kolory marki ustawiamy PRZED pierwszym renderem — bez mignięcia domyślnym
// odcieniem (efekt FOUC: Flash Of Unstyled Content).
applyTheme(companyConfig.theme);

const container = document.getElementById('root')!;

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
