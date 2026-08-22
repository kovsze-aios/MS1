# `template-api` — Backend (Node.js + Express + TypeScript)

```bash
npm install
cp .env.example .env
npm run dev      # tsx watch → http://localhost:4000
npm run build && npm start   # wersja produkcyjna z dist/
```

---

## Endpointy

| Metoda | Ścieżka | Opis |
|---|---|---|
| `GET` | `/api/health` | kontrola stanu usługi (dla Dockera i monitoringu) |
| `GET` | `/api/pricing` | cennik po stronie serwera |
| `POST` | `/api/estimate` | **główny** — przyjmuje konfigurację i zwraca wycenę |

Gotowe zapytania testowe: [`requests.http`](requests.http) — otwórz w VS Code
z rozszerzeniem *REST Client* i klikaj „Send Request".

### `POST /api/estimate`

```bash
curl -X POST http://localhost:4000/api/estimate \
     -H "Content-Type: application/json" \
     -d '{"items":[{"id":"adult","quantity":2},{"id":"child","quantity":1}]}'
```

```json
{
  "ok": true,
  "reference": "MS-0L226K",
  "currency": "PLN",
  "lines": [
    { "id": "adult", "label": "Bilet normalny", "quantity": 2, "unitPrice": 70, "lineTotal": 140 },
    { "id": "child", "label": "Bilet ulgowy",  "quantity": 1, "unitPrice": 50, "lineTotal": 50 }
  ],
  "totals": { "passengers": 3, "net": 175.93, "vat": 14.07, "gross": 190 },
  "receivedAt": "2026-08-20T11:41:26.247Z"
}
```

Błędy walidacji wracają z kodem **400** i listą **wszystkich** problemów naraz:

```json
{
  "ok": false,
  "error": "Nieprawidłowe dane zapytania.",
  "details": ["items[0].id: nieznany typ biletu (\"senior\")."]
}
```

---

## Zasada nadrzędna: nie ufamy przeglądarce

Frontend liczy cenę **wyłącznie** po to, by pokazać ją użytkownikowi na żywo.
Wiążąca jest kalkulacja serwera na podstawie stałej `PRICE_LIST` w `src/server.ts`.
Gdyby backend przyjmował kwotę z żądania, wystarczyłyby narzędzia deweloperskie
przeglądarki, żeby „kupić" rejs za złotówkę.

⚠️ Ceny w `PRICE_LIST` muszą być zgodne z sekcją `tickets` w `companyConfig.ts`
obu frontendów. Docelowo warto przenieść je do bazy danych i pobierać przez `/api/pricing`.

---

## Konfiguracja (`.env`)

| Zmienna | Domyślnie | Znaczenie |
|---|---|---|
| `PORT` | `4000` | port nasłuchu |
| `CORS_ORIGIN` | `localhost:5173,localhost:5174` | adresy frontendów, po przecinku |
| `N8N_WEBHOOK_URL` | *(puste)* | webhook automatyzacji; puste = wyłączone |

Bez poprawnego `CORS_ORIGIN` przeglądarka **zablokuje** zapytania z frontendu — to nie
błąd serwera, tylko polityka bezpieczeństwa przeglądarki (Same-Origin Policy).
Na produkcji wpisz konkretne domeny klienta, nigdy gwiazdki.

## Integracja z n8n

Blok gotowy do odkomentowania znajduje się w `/api/estimate` (sekcja
„MIEJSCE NA INTEGRACJĘ Z n8n"). Wysyłka jest celowo **bez `await`** — klient nie może
czekać na integrację — i z obowiązkowym `.catch()`, bo nieobsłużone odrzucenie
obietnicy potrafi wywrócić proces Node.js.

Instrukcja podłączenia: komentarz na końcu `../docker-compose.yml`.
