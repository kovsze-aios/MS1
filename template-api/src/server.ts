/* ==========================================================================
 *  server.ts — BACKEND API (Node.js + Express + TypeScript)
 * --------------------------------------------------------------------------
 *  ZADANIE TEJ USŁUGI
 *  Przyjąć zapytanie o rezerwację/wycenę wysłane z frontendu (konfigurator
 *  biletów w wariancie kinowym), zweryfikować dane, PRZELICZYĆ CENĘ PO SWOJEJ
 *  STRONIE i zwrócić podsumowanie.
 *
 *  ⚠️ KLUCZOWA ZASADA BEZPIECZEŃSTWA
 *  Backend NIGDY nie ufa kwocie przysłanej przez przeglądarkę. Frontend liczy
 *  cenę wyłącznie po to, by pokazać ją użytkownikowi na żywo. Wiążąca jest
 *  kalkulacja serwera — inaczej wystarczyłoby narzędzie deweloperskie
 *  przeglądarki, żeby „kupić" rejs za złotówkę.
 *
 *  ARCHITEKTURA PRZEPŁYWU DANYCH:
 *
 *    [Frontend]  POST /api/estimate  { items: [{id, quantity}], contact }
 *         │
 *         ▼
 *    [Express]  cors → express.json → walidacja → wycena → odpowiedź JSON
 *         │
 *         ▼
 *    [n8n]  (opcjonalnie) webhook → e-mail do właściciela, wpis w CRM,
 *           powiadomienie SMS. Konfiguracja: docker-compose.yml
 * ========================================================================== */

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config';

/* ==========================================================================
 *  SEKCJA 1 — TYPY (KONTRAKT API)
 *  Opisanie kształtu żądania i odpowiedzi to nie formalność: te typy są
 *  dokumentacją, z której korzysta każdy, kto podłącza się do tego endpointu.
 * ========================================================================== */

/** Pozycja zamówienia przysłana przez frontend. */
interface EstimateItemInput {
  /** Identyfikator biletu zgodny z `tickets.types[].id` w companyConfig.ts. */
  id: string;
  /** Liczba sztuk. */
  quantity: number;
}

/** Dane kontaktowe osoby rezerwującej (opcjonalne — rezerwacja bywa telefoniczna). */
interface ContactInput {
  name?: string;
  phone?: string;
  email?: string;
  note?: string;
}

/** Pełne ciało żądania POST /api/estimate. */
interface EstimateRequestBody {
  items?: EstimateItemInput[];
  contact?: ContactInput;
}

/** Pojedyncza, przeliczona pozycja w odpowiedzi. */
interface EstimateLine {
  id: string;
  label: string;
  quantity: number;
  /** Cena jednostkowa brutto (ustalona przez SERWER, nie przez klienta). */
  unitPrice: number;
  /** quantity × unitPrice */
  lineTotal: number;
}

/** Odpowiedź serwera przy poprawnym żądaniu. */
interface EstimateResponse {
  ok: true;
  /** Identyfikator zapytania — do powiązania z rozmową telefoniczną lub CRM. */
  reference: string;
  currency: string;
  lines: EstimateLine[];
  totals: {
    passengers: number;
    net: number;
    vat: number;
    gross: number;
  };
  receivedAt: string;
}

/** Ujednolicony kształt błędu — front zawsze wie, gdzie szukać komunikatu. */
interface ErrorResponse {
  ok: false;
  error: string;
  details?: string[];
}

/* ==========================================================================
 *  SEKCJA 2 — CENNIK PO STRONIE SERWERA
 *  Jedyne wiążące źródło cen.
 *
 *  W docelowym wdrożeniu te dane powinny pochodzić z bazy danych lub panelu
 *  administracyjnego. Na etapie szablonu trzymamy je w kodzie — ważne, by
 *  wartości BYŁY ZGODNE z `tickets` w companyConfig.ts obu frontendów.
 * ========================================================================== */

interface PriceListEntry {
  label: string;
  price: number;
  maxQuantity: number;
}

const PRICE_LIST: Record<string, PriceListEntry> = {
  adult: { label: 'Bilet normalny', price: 70, maxQuantity: 12 },
  child: { label: 'Bilet ulgowy', price: 50, maxQuantity: 12 },
};

/** Stawka VAT dla usług turystycznych (8%). */
const VAT_RATE = 0.08;

/** Waluta rozliczeniowa. */
const CURRENCY = 'PLN';

/** Górny limit pasażerów na jeden rejs — zabezpiecza przed absurdalnymi zamówieniami. */
const MAX_PASSENGERS = 12;

/* ==========================================================================
 *  SEKCJA 3 — FUNKCJE POMOCNICZE
 * ========================================================================== */

/**
 * Zaokrągla kwotę do dwóch miejsc po przecinku.
 *
 * DLACZEGO TO KONIECZNE: liczby zmiennoprzecinkowe w JavaScripcie są
 * niedokładne (klasyczne `0.1 + 0.2 === 0.30000000000000004`). Bez zaokrąglenia
 * na fakturze potrafią pojawić się kwoty w rodzaju „129,99999999 zł".
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Generuje czytelny identyfikator zapytania, np. "MS-LX3F9A".
 * Pracownik odbierający telefon może poprosić o ten kod i natychmiast
 * odnaleźć zgłoszenie.
 */
function createReference(): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MS-${random}`;
}

/**
 * Waliduje ciało żądania i zwraca listę błędów.
 * Pusta tablica = dane są poprawne.
 *
 * Walidujemy WSZYSTKIE pola naraz (zamiast przerywać na pierwszym błędzie),
 * żeby użytkownik zobaczył komplet problemów w jednej odpowiedzi.
 */
function validateEstimateBody(body: EstimateRequestBody): string[] {
  const errors: string[] = [];

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push('Pole "items" musi być niepustą tablicą pozycji.');
    // Dalsza walidacja nie ma sensu bez tablicy — zwracamy od razu.
    return errors;
  }

  let passengers = 0;

  body.items.forEach((item, index) => {
    if (typeof item?.id !== 'string' || !(item.id in PRICE_LIST)) {
      errors.push(`items[${index}].id: nieznany typ biletu ("${String(item?.id)}").`);
      return;
    }

    const quantity = Number(item.quantity);

    // Number.isInteger odsiewa jednocześnie ułamki, NaN i Infinity.
    if (!Number.isInteger(quantity) || quantity < 0) {
      errors.push(`items[${index}].quantity: oczekiwano liczby całkowitej >= 0.`);
      return;
    }

    const entry = PRICE_LIST[item.id];
    if (entry && quantity > entry.maxQuantity) {
      errors.push(`items[${index}].quantity: maksymalnie ${entry.maxQuantity} szt.`);
      return;
    }

    passengers += quantity;
  });

  if (passengers === 0) {
    errors.push('Łączna liczba pasażerów musi być większa od zera.');
  }

  if (passengers > MAX_PASSENGERS) {
    errors.push(`Maksymalna liczba pasażerów na rejs to ${MAX_PASSENGERS}.`);
  }

  // Prosta kontrola formatu e-maila — tylko gdy pole zostało przysłane.
  if (body.contact?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.contact.email)) {
    errors.push('contact.email: nieprawidłowy adres e-mail.');
  }

  return errors;
}

/**
 * Przelicza pozycje zamówienia na podstawie CENNIKA SERWERA.
 * Ceny w cenniku są brutto, więc netto wyliczamy wstecz: netto = brutto / (1 + VAT).
 */
function calculateEstimate(items: EstimateItemInput[]) {
  const lines: EstimateLine[] = [];
  let gross = 0;
  let passengers = 0;

  for (const item of items) {
    const entry = PRICE_LIST[item.id];
    // Pozycje o zerowej ilości pomijamy — nie zaśmiecają podsumowania.
    if (!entry || item.quantity <= 0) continue;

    const lineTotal = round2(entry.price * item.quantity);

    lines.push({
      id: item.id,
      label: entry.label,
      quantity: item.quantity,
      unitPrice: entry.price,
      lineTotal,
    });

    gross += lineTotal;
    passengers += item.quantity;
  }

  gross = round2(gross);
  const net = round2(gross / (1 + VAT_RATE));
  const vat = round2(gross - net);

  return { lines, totals: { passengers, net, vat, gross } };
}

/* ==========================================================================
 *  SEKCJA 4 — APLIKACJA EXPRESS
 * ========================================================================== */

const app = express();

/* --- Konfiguracja ze zmiennych środowiskowych (.env) ---------------------
 * process.env.PORT bywa `undefined`, dlatego podajemy wartość domyślną.
 * Number(...) jest konieczne, bo zmienne środowiskowe to ZAWSZE stringi. */
const PORT = Number(process.env.PORT ?? 4000);

/*
 * CORS (Cross-Origin Resource Sharing)
 * Przeglądarka domyślnie BLOKUJE zapytania między różnymi originami —
 * frontend na porcie 5173 nie dosięgnie API na 4000 bez wyraźnej zgody.
 * Nagłówek Access-Control-Allow-Origin wysyła tu właśnie ten middleware.
 *
 * Lista dozwolonych adresów pochodzi z .env (CORS_ORIGIN, wartości po przecinku).
 * ⚠️ Na produkcji NIE zostawiaj gwiazdki — wpisz konkretne domeny klienta.
 */
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  }),
);

/*
 * Parser JSON — bez niego `req.body` byłoby `undefined`.
 * `limit` chroni przed próbą zapchania serwera gigantycznym ładunkiem.
 */
app.use(express.json({ limit: '100kb' }));

/*
 * Prosty logger żądań. W produkcyjnym wdrożeniu zastąp go biblioteką
 * (pino, morgan), która daje poziomy logowania i rotację plików.
 */
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  // Wywołanie next() przekazuje sterowanie dalej. Jego brak = zawieszone żądanie.
  next();
});

/* --------------------------------------------------------------------------
 *  GET /api/health — kontrola stanu usługi
 *  Standardowy endpoint, którego oczekują Docker, load balancery i monitoring.
 * ------------------------------------------------------------------------ */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'aios-template-api',
    uptimeSeconds: Math.round(process.uptime()),
  });
});

/* --------------------------------------------------------------------------
 *  GET /api/pricing — cennik dla frontendu
 *  Pozwala docelowo trzymać ceny w JEDNYM miejscu (na serwerze) i pobierać je
 *  do interfejsu, zamiast duplikować w plikach konfiguracyjnych.
 * ------------------------------------------------------------------------ */
app.get('/api/pricing', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    currency: CURRENCY,
    vatRate: VAT_RATE,
    maxPassengers: MAX_PASSENGERS,
    items: Object.entries(PRICE_LIST).map(([id, entry]) => ({ id, ...entry })),
  });
});

/* --------------------------------------------------------------------------
 *  POST /api/estimate — GŁÓWNY ENDPOINT
 *  Odbiera konfigurację z kalkulatora i zwraca wiążącą wycenę.
 *
 *  Przykładowe żądanie:
 *    curl -X POST http://localhost:4000/api/estimate \
 *         -H "Content-Type: application/json" \
 *         -d '{"items":[{"id":"adult","quantity":2},{"id":"child","quantity":1}]}'
 * ------------------------------------------------------------------------ */
app.post('/api/estimate', (req: Request, res: Response) => {
  const body = req.body as EstimateRequestBody;

  /* KROK 1 — walidacja.
   * Kod 400 (Bad Request) oznacza „to Ty przysłałeś złe dane", w odróżnieniu
   * od 500, które mówi „to my mamy awarię". Rozróżnienie jest istotne:
   * przy 400 klient nie powinien ponawiać tego samego żądania. */
  const errors = validateEstimateBody(body);

  if (errors.length > 0) {
    const errorResponse: ErrorResponse = {
      ok: false,
      error: 'Nieprawidłowe dane zapytania.',
      details: errors,
    };
    return res.status(400).json(errorResponse);
  }

  /* KROK 2 — wycena według cennika serwera.
   * `body.items` jest tu już pewne, bo walidacja przepuściła żądanie. */
  const { lines, totals } = calculateEstimate(body.items ?? []);

  /* KROK 3 — odpowiedź. */
  const response: EstimateResponse = {
    ok: true,
    reference: createReference(),
    currency: CURRENCY,
    lines,
    totals,
    receivedAt: new Date().toISOString(),
  };

  /*
   * MIEJSCE NA INTEGRACJĘ Z n8n.
   * Odkomentuj i ustaw N8N_WEBHOOK_URL w pliku .env, aby każde zapytanie
   * automatycznie trafiało do workflow (e-mail do właściciela, wpis w CRM, SMS):
   *
   *   const webhook = process.env.N8N_WEBHOOK_URL;
   *   if (webhook) {
   *     // Świadomie BEZ await — klient nie może czekać na integrację.
   *     // .catch() jest obowiązkowy: nieobsłużone odrzucenie obietnicy
   *     // potrafi wywrócić cały proces Node.js.
   *     fetch(webhook, {
   *       method: 'POST',
   *       headers: { 'Content-Type': 'application/json' },
   *       body: JSON.stringify({ ...response, contact: body.contact }),
   *     }).catch((error) => console.error('[n8n] Webhook nieudany:', error));
   *   }
   */

  console.log(
    `[estimate] ${response.reference}: ${totals.passengers} os., ${totals.gross} ${CURRENCY}`,
  );

  return res.status(200).json(response);
});

/* --------------------------------------------------------------------------
 *  OBSŁUGA NIEZNANYCH ŚCIEŻEK (404)
 *  Musi stać PO wszystkich prawidłowych trasach — Express dopasowuje
 *  middleware w kolejności rejestracji, więc wcześniej przechwyciłaby wszystko.
 * ------------------------------------------------------------------------ */
app.use((req: Request, res: Response) => {
  const errorResponse: ErrorResponse = {
    ok: false,
    error: `Nie znaleziono trasy: ${req.method} ${req.path}`,
  };
  res.status(404).json(errorResponse);
});

/* --------------------------------------------------------------------------
 *  CENTRALNA OBSŁUGA BŁĘDÓW
 *  Express rozpoznaje middleware błędów po CZTERECH argumentach — parametr
 *  `next` musi tu być, nawet jeśli go nie używamy (stąd podkreślenie w nazwie).
 * ------------------------------------------------------------------------ */
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[error]', error);

  const errorResponse: ErrorResponse = {
    ok: false,
    error: 'Wewnętrzny błąd serwera.',
  };
  res.status(500).json(errorResponse);
});

/* --------------------------------------------------------------------------
 *  START SERWERA
 * ------------------------------------------------------------------------ */
app.listen(PORT, () => {
  console.log('─────────────────────────────────────────────');
  console.log('  Aios Studio — Template API');
  console.log(`  Nasłuchiwanie:  http://localhost:${PORT}`);
  console.log(`  Health check:   http://localhost:${PORT}/api/health`);
  console.log(`  Wycena (POST):  http://localhost:${PORT}/api/estimate`);
  console.log(`  Dozwolone CORS: ${allowedOrigins.join(', ')}`);
  console.log('─────────────────────────────────────────────');
});
