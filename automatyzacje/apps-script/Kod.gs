/* ==========================================================================
 *  Kod.gs — BACKEND REZERWACJI (Google Apps Script jako Web App)
 * --------------------------------------------------------------------------
 *  CZYM JEST TEN PLIK
 *  Apps Script to serwerowy JavaScript uruchamiany przez Google — za darmo,
 *  bez własnego hostingu. Opublikowany jako „Web App" dostaje stały adres
 *  https://script.google.com/macros/s/<ID>/exec i zachowuje się jak zwykłe
 *  API HTTP. Dla nas jest to WARSTWA ZAPISU do arkusza: frontend nie dotyka
 *  Google Sheets bezpośrednio (nie ma i nie może mieć klucza API w przeglądarce).
 *
 *  DLACZEGO x-www-form-urlencoded, A NIE JSON
 *  Przeglądarka wysyła zapytanie „proste" (simple request) — czyli BEZ
 *  wcześniejszego zapytania OPTIONS (preflight) — tylko wtedy, gdy nagłówek
 *  Content-Type ma jedną z trzech wartości: text/plain, multipart/form-data
 *  albo application/x-www-form-urlencoded. Apps Script NIE obsługuje metody
 *  OPTIONS (nie da się zdefiniować doOptions), więc każdy JSON-owy POST
 *  rozbiłby się o preflight. Formularzowe kodowanie omija problem u źródła.
 *
 *  Efekt uboczny: Apps Script wypakowuje parametry do `e.parameter`
 *  (obiekt płaski string→string), a nie do `e.postData`. Kod niżej obsługuje
 *  OBA warianty, bo ten sam endpoint przyjmuje też JSON z n8n.
 *
 *  KONTRAKT ODPOWIEDZI
 *  Zwracamy JSON, ale front woła nas w trybie `mode: 'no-cors'` i odpowiedzi
 *  NIE PRZECZYTA (dostaje „opaque response"). Odpowiedź jest więc dla n8n,
 *  dla testów curl-em i dla logów. To świadomy kompromis — patrz komentarz
 *  w DossierPanel.tsx nad handleSubmit.
 *
 *  INSTALACJA (jednorazowo)
 *   1. Otwórz arkusz → Rozszerzenia → Apps Script.
 *   2. Wklej ten plik jako Kod.gs (podmień całą zawartość).
 *   3. Uruchom ręcznie funkcję `inicjalizujArkusz` — utworzy zakładki,
 *      nagłówki, formaty kolumn i formuły. Zaakceptuj zgody OAuth.
 *   4. Wdróż → Nowe wdrożenie → typ „Aplikacja internetowa":
 *          Wykonaj jako:  Ja (właściciel arkusza)
 *          Kto ma dostęp: Wszyscy
 *   5. Skopiuj adres /exec do companyConfig.bookingConfig.webhookUrl
 *      albo do zmiennej VITE_BOOKING_WEBHOOK_URL w Vercelu.
 *
 *  ⚠️ KAŻDA ZMIANA KODU WYMAGA NOWEGO WDROŻENIA (Wdróż → Zarządzaj wdrożeniami
 *     → ołówek → Wersja: Nowa). Sam zapis pliku NIC nie publikuje — to
 *     najczęstsza przyczyna „poprawiłem, a dalej nie działa".
 * ========================================================================== */

/* --------------------------------------------------------------------------
 *  SEKCJA 1 — KONFIGURACJA
 *  Jedyne miejsce do edycji przy wdrożeniu u innego klienta.
 * ------------------------------------------------------------------------ */

var KONFIG = {
  /** ID arkusza z adresu URL: /spreadsheets/d/<TO_JEST_ID>/edit */
  arkuszId: '1XyubWN8VUSXjE9rxt2OhxjnBM6ifcv3jc9p3dRHLzbw',

  /** Nazwy zakładek. Muszą zgadzać się co do znaku z tym, co jest w arkuszu. */
  zakladkaRezerwacje: 'Rezerwacje',
  zakladkaGrafik: 'Grafik_Dnia',
  zakladkaUstawienia: 'Ustawienia',

  /** Strefa czasowa — bez niej Apps Script liczyłby daty według UTC. */
  strefa: 'Europe/Warsaw',

  /**
   * Kolejność kolumn zakładki „Rezerwacje". Kod NIE zakłada jej na sztywno
   * w indeksach — buduje wiersz z tej tablicy, więc dodanie kolumny sprowadza
   * się do dopisania nazwy tutaj i w `zbudujWiersz_`.
   */
  naglowki: [
    'ID', 'DataWpisu', 'DataRejsu', 'Godzina', 'Jednostka',
    'Imie', 'Telefon', 'Miejsca', 'Status', 'Zrodlo',
  ],

  /** Status nadawany zgłoszeniom z www. Załoga zmienia go ręcznie w arkuszu. */
  statusNowej: 'NOWA',
  /** Status, który formuły w Grafik_Dnia WYKLUCZAJĄ z sumowania miejsc. */
  statusAnulowana: 'ANULOWANA',

  /**
   * Awaryjna pojemność jednostek. Używana tylko wtedy, gdy zakładka
   * „Ustawienia" nie istnieje albo nie zna danej jednostki.
   */
  pojemnoscDomyslna: 12,
  progStartuDomyslny: 8,

  /** Najdalszy termin, jaki przyjmujemy (ochrona przed rezerwacją na 2049 rok). */
  horyzontDni: 120,

  /**
   * Adres e-mail powiadamiany o nowym zgłoszeniu. Pusty string = wyłączone.
   * Limit darmowego konta Gmail: 100 wiadomości/dobę — w zupełności wystarczy.
   */
  emailPowiadomien: '',

  /**
   * Opcjonalny współdzielony sekret. Gdy ustawisz tu niepusty ciąg, żądanie
   * MUSI zawierać parametr `sekret` o tej wartości. Uwaga: w aplikacji
   * przeglądarkowej taki sekret jest widoczny w kodzie źródłowym — realną
   * ochronę daje dopiero, gdy pośrednikiem jest n8n (sekret zostaje na serwerze).
   */
  sekret: '',
};

/* --------------------------------------------------------------------------
 *  SEKCJA 2 — PUNKTY WEJŚCIA HTTP
 * ------------------------------------------------------------------------ */

/**
 * doPost — jedyny endpoint zapisu. Wywoływany przez:
 *   • frontend (fetch, x-www-form-urlencoded, mode: 'no-cors'),
 *   • n8n (HTTP Request node, JSON lub form-urlencoded),
 *   • dowolne narzędzie testowe (curl, Postman).
 *
 * @param {Object} e zdarzenie Apps Script: e.parameter, e.postData
 * @returns {TextOutput} odpowiedź JSON
 */
function doPost(e) {
  /*
   * BLOKADA (LockService) — fundament poprawności przy równoczesnych zapisach.
   * Bez niej dwie osoby klikające „wyślij" w tej samej sekundzie mogą obie
   * odczytać „zajęte: 10 z 12", obie dopisać po 2 miejsca i przepełnić rejs.
   * Blokada skryptowa serializuje CAŁĄ sekcję odczyt→sprawdzenie→zapis.
   */
  var blokada = LockService.getScriptLock();
  try {
    blokada.waitLock(25000); // 25 s; po tym czasie rzuca wyjątek
  } catch (err) {
    return odpowiedz_(503, {
      ok: false,
      kod: 'ZAJETE',
      komunikat: 'Serwer chwilowo przetwarza inne zgloszenie. Sprobuj ponownie.',
    });
  }

  try {
    var dane = odczytajPayload_(e);

    /* --- Kontrola sekretu (jeśli włączona) --- */
    if (KONFIG.sekret && dane.sekret !== KONFIG.sekret) {
      return odpowiedz_(401, { ok: false, kod: 'BRAK_AUTORYZACJI' });
    }

    /* --- Walidacja --- */
    var bledy = zwaliduj_(dane);
    if (bledy.length > 0) {
      return odpowiedz_(400, { ok: false, kod: 'WALIDACJA', bledy: bledy });
    }

    var arkusz = SpreadsheetApp.openById(KONFIG.arkuszId);
    var zakladka = arkusz.getSheetByName(KONFIG.zakladkaRezerwacje);
    if (!zakladka) {
      return odpowiedz_(500, {
        ok: false,
        kod: 'BRAK_ZAKLADKI',
        komunikat: 'Nie znaleziono zakladki ' + KONFIG.zakladkaRezerwacje + '. Uruchom inicjalizujArkusz().',
      });
    }

    /* --- Kontrola przepełnienia (jedyne miejsce, które MOŻE ją zrobić) ---
     * Frontend w trybie no-cors nie odczyta odpowiedzi, więc nie da się
     * pokazać użytkownikowi „brak miejsc". Dlatego zapisujemy zgłoszenie
     * mimo wszystko, ale ze statusem LISTA_REZERWOWA — załoga widzi je
     * w arkuszu i oddzwania z propozycją innej godziny. Nic nie ginie. */
    var pojemnosc = pobierzPojemnosc_(arkusz, dane.jednostka);
    var zajete = policzZajete_(zakladka, dane.dataRejsu, dane.godzina, dane.jednostka);
    var przepelnienie = (zajete + dane.miejsca) > pojemnosc;
    var status = przepelnienie ? 'LISTA_REZERWOWA' : KONFIG.statusNowej;

    /* --- Zapis --- */
    var id = zbudujId_(zakladka, dane);
    var wiersz = zbudujWiersz_(id, dane, status);
    zakladka.appendRow(wiersz);
    SpreadsheetApp.flush(); // wymusza zapis PRZED zwolnieniem blokady

    /* --- Powiadomienie (nie może wywrócić zapisu) --- */
    try {
      wyslijPowiadomienie_(id, dane, status, zajete, pojemnosc);
    } catch (errMail) {
      console.error('Powiadomienie e-mail nieudane: ' + errMail);
    }

    return odpowiedz_(200, {
      ok: true,
      id: id,
      status: status,
      zajeteDotad: zajete,
      pojemnosc: pojemnosc,
      wolnePo: Math.max(0, pojemnosc - zajete - dane.miejsca),
    });
  } catch (err) {
    console.error('doPost: ' + err + '\n' + (err && err.stack));
    return odpowiedz_(500, { ok: false, kod: 'BLAD_SERWERA', komunikat: String(err) });
  } finally {
    /* finally = zwalniamy blokadę ZAWSZE, także po wyjątku. Pominięcie tego
     * zablokowałoby endpoint dla wszystkich na czas wygaśnięcia blokady. */
    blokada.releaseLock();
  }
}

/**
 * doGet — endpoint odczytu. Dwie role:
 *   • ?akcja=zdrowie  → prosty health-check wdrożenia,
 *   • ?akcja=wolne&data=2026-08-25&jednostka=... → liczba wolnych miejsc.
 *
 * GET z przeglądarki działa bez `no-cors`, bo Apps Script zwraca dla niego
 * nagłówek Access-Control-Allow-Origin: *. Można więc w przyszłości wygasić
 * w UI godziny, w których nie ma już miejsc.
 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  var akcja = p.akcja || 'zdrowie';

  if (akcja === 'zdrowie') {
    return odpowiedz_(200, {
      ok: true,
      usluga: 'rezerwacje-morskie-safari',
      czas: Utilities.formatDate(new Date(), KONFIG.strefa, "yyyy-MM-dd'T'HH:mm:ssXXX"),
    });
  }

  if (akcja === 'wolne') {
    var arkusz = SpreadsheetApp.openById(KONFIG.arkuszId);
    var zakladka = arkusz.getSheetByName(KONFIG.zakladkaRezerwacje);
    var data = naTekstDaty_(p.data);
    var jednostka = String(p.jednostka || '').trim();
    var pojemnosc = pobierzPojemnosc_(arkusz, jednostka);
    var godziny = pobierzGodziny_(arkusz);

    var wynik = godziny.map(function (g) {
      var zajete = policzZajete_(zakladka, data, g, jednostka);
      return { godzina: g, zajete: zajete, pojemnosc: pojemnosc, wolne: Math.max(0, pojemnosc - zajete) };
    });

    return odpowiedz_(200, { ok: true, data: data, jednostka: jednostka, sloty: wynik });
  }

  return odpowiedz_(400, { ok: false, kod: 'NIEZNANA_AKCJA' });
}

/* --------------------------------------------------------------------------
 *  SEKCJA 3 — ODCZYT I WALIDACJA PAYLOADU
 * ------------------------------------------------------------------------ */

/**
 * Scala dane z trzech możliwych źródeł do jednego, znormalizowanego obiektu:
 *   1. e.parameter          — form-urlencoded oraz query string (frontend),
 *   2. e.postData.contents  — surowy JSON (n8n, curl z Content-Type: application/json),
 *   3. wartości domyślne.
 *
 * Akceptujemy zarówno nazwy pól z frontendu (unitType, timeSlot, seatsCount…),
 * jak i „arkuszowe" (Jednostka, Godzina, Miejsca…) — dzięki temu ten sam
 * endpoint obsłuży formularz WWW i przepływ z n8n bez mapowania po drodze.
 */
function odczytajPayload_(e) {
  var p = {};
  var k;

  if (e && e.parameter) {
    for (k in e.parameter) { p[k] = e.parameter[k]; }
  }

  if (e && e.postData && e.postData.contents) {
    var typ = String(e.postData.type || '');
    if (typ.indexOf('application/json') === 0) {
      try {
        var json = JSON.parse(e.postData.contents);
        for (k in json) { p[k] = json[k]; }
      } catch (err) {
        console.warn('Cialo zadania nie jest poprawnym JSON-em - pomijam.');
      }
    }
  }

  /** Pierwsza niepusta wartość z listy aliasów. */
  function pierwszy() {
    for (var i = 0; i < arguments.length; i++) {
      var v = p[arguments[i]];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
  }

  return {
    jednostka: pierwszy('jednostka', 'unitType', 'unitName', 'Jednostka'),
    dataRejsu: naTekstDaty_(pierwszy('dataRejsu', 'date', 'DataRejsu')),
    godzina: naTekstGodziny_(pierwszy('godzina', 'timeSlot', 'Godzina')),
    imie: pierwszy('imie', 'clientName', 'Imie'),
    telefon: normalizujTelefon_(pierwszy('telefon', 'clientPhone', 'Telefon')),
    miejsca: parseInt(pierwszy('miejsca', 'seatsCount', 'Miejsca') || '0', 10),
    zrodlo: pierwszy('zrodlo', 'source', 'Zrodlo') || 'WWW',
    uwagi: pierwszy('uwagi', 'notes'),
    sekret: pierwszy('sekret', 'secret'),
  };
}

/**
 * Zwraca listę komunikatów o błędach. Pusta lista = dane poprawne.
 * Walidujemy PONOWNIE, mimo że robi to też przeglądarka — walidacja
 * po stronie klienta jest wygodą dla użytkownika, nie zabezpieczeniem.
 * Żądanie da się wysłać curl-em z dowolną treścią.
 */
function zwaliduj_(d) {
  var bledy = [];

  if (!d.jednostka) bledy.push('Brak nazwy jednostki.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.dataRejsu)) bledy.push('Data rejsu musi miec format RRRR-MM-DD.');
  if (!/^\d{2}:\d{2}$/.test(d.godzina)) bledy.push('Godzina musi miec format GG:MM.');
  if (d.imie.length < 3) bledy.push('Imie i nazwisko: minimum 3 znaki.');
  if (!/^\d{9,12}$/.test(d.telefon)) bledy.push('Numer telefonu: 9-12 cyfr.');
  if (!(d.miejsca >= 1 && d.miejsca <= 60)) bledy.push('Liczba miejsc poza zakresem 1-60.');

  /* Termin z przeszłości albo absurdalnie odległy — najczęstszy objaw bota. */
  if (bledy.length === 0) {
    var dzis = new Date(Utilities.formatDate(new Date(), KONFIG.strefa, 'yyyy-MM-dd') + 'T00:00:00Z');
    var rejs = new Date(d.dataRejsu + 'T00:00:00Z');
    var roznicaDni = Math.round((rejs - dzis) / 86400000);
    if (roznicaDni < 0) bledy.push('Data rejsu jest z przeszlosci.');
    if (roznicaDni > KONFIG.horyzontDni) bledy.push('Data rejsu dalej niz ' + KONFIG.horyzontDni + ' dni.');
  }

  return bledy;
}

/* --------------------------------------------------------------------------
 *  SEKCJA 4 — LOGIKA ARKUSZA
 * ------------------------------------------------------------------------ */

/**
 * Sumuje zajęte miejsca dla trójki (data, godzina, jednostka),
 * pomijając rezerwacje anulowane. To dokładnie ten sam rachunek, który
 * w Grafik_Dnia wykonuje formuła SUMIFS — trzymamy go tu po raz drugi,
 * bo formuła jest dla ludzi, a ta funkcja dla maszyny (i musi działać
 * także wtedy, gdy ktoś skasuje formułę w arkuszu).
 */
function policzZajete_(zakladka, dataRejsu, godzina, jednostka) {
  var ostatni = zakladka.getLastRow();
  if (ostatni < 2) return 0;

  // Kolumny C–I (DataRejsu…Status) — jeden odczyt zamiast wielu.
  var dane = zakladka.getRange(2, 3, ostatni - 1, 7).getValues();
  var suma = 0;
  var szukanaJednostka = String(jednostka).trim().toUpperCase();

  for (var i = 0; i < dane.length; i++) {
    var w = dane[i];
    var wData = naTekstDaty_(w[0]);                          // C — DataRejsu
    var wGodz = naTekstGodziny_(w[1]);                       // D — Godzina
    var wJedn = String(w[2] || '').trim().toUpperCase();     // E — Jednostka
    var wMiejsca = parseInt(w[5], 10) || 0;                  // H — Miejsca
    var wStatus = String(w[6] || '').trim().toUpperCase();   // I — Status

    if (wStatus === KONFIG.statusAnulowana) continue;
    if (wData !== dataRejsu) continue;
    if (wGodz !== godzina) continue;
    if (wJedn !== szukanaJednostka) continue;

    suma += wMiejsca;
  }
  return suma;
}

/**
 * Pojemność jednostki. Najpierw pyta zakładkę „Ustawienia" (jedno źródło
 * prawdy współdzielone z formułami arkusza), potem wraca do stałej z KONFIG.
 */
function pobierzPojemnosc_(arkusz, jednostka) {
  var u = arkusz.getSheetByName(KONFIG.zakladkaUstawienia);
  if (!u) return KONFIG.pojemnoscDomyslna;

  var ostatni = u.getLastRow();
  if (ostatni < 2) return KONFIG.pojemnoscDomyslna;

  var flota = u.getRange(2, 1, ostatni - 1, 2).getValues(); // A: nazwa, B: pojemność
  var szukana = String(jednostka || '').trim().toUpperCase();

  for (var i = 0; i < flota.length; i++) {
    if (String(flota[i][0]).trim().toUpperCase() === szukana) {
      return parseInt(flota[i][1], 10) || KONFIG.pojemnoscDomyslna;
    }
  }
  return KONFIG.pojemnoscDomyslna;
}

/** Lista godzin rejsów z zakładki „Ustawienia" (kolumna G). */
function pobierzGodziny_(arkusz) {
  var u = arkusz.getSheetByName(KONFIG.zakladkaUstawienia);
  if (!u) return [];
  var ostatni = u.getLastRow();
  if (ostatni < 2) return [];

  return u.getRange(2, 7, ostatni - 1, 1).getValues()
    .map(function (r) { return naTekstGodziny_(r[0]); })
    .filter(function (g) { return g !== ''; });
}

/**
 * Identyfikator czytelny dla człowieka: MS-260825-1300-RIB-03
 *   MS      — marka
 *   260825  — data rejsu (RRMMDD)
 *   1300    — godzina
 *   RIB     — skrót jednostki
 *   03      — kolejny numer w obrębie tego slotu
 *
 * Załoga potrafi go podyktować przez telefon — dlatego nie używamy UUID.
 */
function zbudujId_(zakladka, d) {
  var skrot = String(d.jednostka).toUpperCase().indexOf('RIB') >= 0 ? 'RIB' : 'STA';
  var prefiks = 'MS-' + d.dataRejsu.slice(2).replace(/-/g, '') +
                '-' + d.godzina.replace(':', '') +
                '-' + skrot;

  var kolejny = 1;
  var ostatni = zakladka.getLastRow();
  if (ostatni >= 2) {
    var kolumnaId = zakladka.getRange(2, 1, ostatni - 1, 1).getValues();
    for (var i = 0; i < kolumnaId.length; i++) {
      if (String(kolumnaId[i][0]).indexOf(prefiks) === 0) kolejny++;
    }
  }

  return prefiks + '-' + ('0' + kolejny).slice(-2);
}

/** Buduje wiersz w kolejności KONFIG.naglowki. */
function zbudujWiersz_(id, d, status) {
  return [
    id,
    Utilities.formatDate(new Date(), KONFIG.strefa, 'yyyy-MM-dd HH:mm'), // DataWpisu
    d.dataRejsu,
    d.godzina,
    d.jednostka,
    d.imie,
    "'" + d.telefon, // apostrof = wymuszenie tekstu; bez niego Sheets zjada wiodące zero
    d.miejsca,
    status,
    d.zrodlo + (d.uwagi ? ' | ' + d.uwagi : ''),
  ];
}

/** Powiadomienie e-mail do właściciela. Cicho pomijane, gdy adres pusty. */
function wyslijPowiadomienie_(id, d, status, zajeteWczesniej, pojemnosc) {
  if (!KONFIG.emailPowiadomien) return;

  var razem = zajeteWczesniej + d.miejsca;
  var temat = '[' + status + '] Rezerwacja ' + d.dataRejsu + ' ' + d.godzina + ' - ' + d.imie;
  var tresc =
    'Nowe zgloszenie ze strony WWW\n\n' +
    'ID:         ' + id + '\n' +
    'Jednostka:  ' + d.jednostka + '\n' +
    'Termin:     ' + d.dataRejsu + ', godz. ' + d.godzina + '\n' +
    'Klient:     ' + d.imie + ', tel. ' + d.telefon + '\n' +
    'Miejsca:    ' + d.miejsca + '\n' +
    'Oblozenie:  ' + razem + '/' + pojemnosc + '\n' +
    'Status:     ' + status + '\n\n' +
    (status === 'LISTA_REZERWOWA'
      ? 'UWAGA: TEN REJS JEST JUZ PELNY. Zadzwon i zaproponuj inna godzine.\n\n'
      : '') +
    'Arkusz: https://docs.google.com/spreadsheets/d/' + KONFIG.arkuszId + '/edit\n';

  MailApp.sendEmail(KONFIG.emailPowiadomien, temat, tresc);
}

/* --------------------------------------------------------------------------
 *  SEKCJA 5 — NARZĘDZIA
 * ------------------------------------------------------------------------ */

/**
 * Normalizuje datę do „RRRR-MM-DD" niezależnie od tego, czy przyszła jako
 * tekst z formularza, czy jako obiekt Date odczytany z komórki arkusza.
 */
function naTekstDaty_(v) {
  if (v === null || v === undefined || v === '') return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, KONFIG.strefa, 'yyyy-MM-dd');
  }
  var s = String(v).trim();
  var m = s.match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : s;
}

/** To samo dla godziny: „GG:MM". Komórka sformatowana jako czas wraca jako Date. */
function naTekstGodziny_(v) {
  if (v === null || v === undefined || v === '') return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, KONFIG.strefa, 'HH:mm');
  }
  var s = String(v).trim();
  var m = s.match(/^(\d{1,2}):(\d{2})/);
  return m ? ('0' + m[1]).slice(-2) + ':' + m[2] : s;
}

/** Zostawia same cyfry i obcina prefiks +48 / 0048 — arkusz ma mieć jeden format. */
function normalizujTelefon_(v) {
  var cyfry = String(v || '').replace(/\D/g, '');
  if (cyfry.length === 11 && cyfry.indexOf('48') === 0) cyfry = cyfry.slice(2);
  if (cyfry.length === 13 && cyfry.indexOf('0048') === 0) cyfry = cyfry.slice(4);
  return cyfry;
}

/**
 * Buduje odpowiedź JSON.
 * ⚠️ Apps Script NIE pozwala ustawić kodu statusu HTTP w Web Appie — każda
 * odpowiedź wychodzi jako 200. Dlatego kod błędu przekazujemy W TREŚCI
 * (pole `httpStatus` + `ok`), a konsument (n8n) rozgałęzia się po `ok`.
 */
function odpowiedz_(kodHttp, obiekt) {
  obiekt.httpStatus = kodHttp;
  return ContentService
    .createTextOutput(JSON.stringify(obiekt))
    .setMimeType(ContentService.MimeType.JSON);
}

/* --------------------------------------------------------------------------
 *  SEKCJA 6 — INICJALIZACJA ARKUSZA (uruchom RĘCZNIE, jednorazowo)
 * ------------------------------------------------------------------------ */

/**
 * Tworzy komplet zakładek, nagłówki, formaty kolumn, formuły i zakresy
 * nazwane. Bezpieczna do ponownego uruchomienia — nie kasuje istniejących
 * danych, tylko uzupełnia brakujące elementy.
 */
function inicjalizujArkusz() {
  var ss = SpreadsheetApp.openById(KONFIG.arkuszId);
  ss.setSpreadsheetTimeZone(KONFIG.strefa);

  /* --- 1. Zakładka Rezerwacje ------------------------------------------ */
  var rez = ss.getSheetByName(KONFIG.zakladkaRezerwacje) || ss.insertSheet(KONFIG.zakladkaRezerwacje);
  if (rez.getLastRow() === 0 || String(rez.getRange(1, 1).getValue()).trim() !== 'ID') {
    rez.getRange(1, 1, 1, KONFIG.naglowki.length).setValues([KONFIG.naglowki]);
  }
  rez.setFrozenRows(1);
  rez.getRange(1, 1, 1, KONFIG.naglowki.length)
    .setFontWeight('bold').setBackground('#111111').setFontColor('#ffffff');

  /*
   * ⚠️ NAJWAŻNIEJSZE TRZY LINIE W CAŁEJ INICJALIZACJI.
   * Kolumny DataRejsu (C), Godzina (D) i Telefon (G) ustawiamy jako TEKST („@").
   * Bez tego Sheets sam zamienia „13:00" na wartość czasu, a „0501…" na liczbę
   * bez wiodącego zera — i porównania w SUMIFS przestają trafiać.
   */
  rez.getRange('C2:D').setNumberFormat('@');
  rez.getRange('G2:G').setNumberFormat('@');
  rez.getRange('B2:B').setNumberFormat('@');

  /* --- 2. Zakładka Ustawienia ------------------------------------------ */
  var ust = ss.getSheetByName(KONFIG.zakladkaUstawienia) || ss.insertSheet(KONFIG.zakladkaUstawienia);
  if (ust.getLastRow() === 0) {
    ust.getRange('A1:B1').setValues([['Jednostka', 'Pojemnosc']]);
    ust.getRange('A2:B3').setValues([
      ['SZYBKA MOTORÓWKA RIB', 12],
      ['STATEK WOLNY', 12],
    ]);
    ust.getRange('D1').setValue('Prog startu rejsu (min. osob)');
    ust.getRange('E1').setValue(KONFIG.progStartuDomyslny);
    ust.getRange('G1').setValue('Godziny');
    ust.getRange('G2:G8').setNumberFormat('@').setValues([
      ['10:00'], ['11:30'], ['13:00'], ['14:30'], ['16:00'], ['17:30'], ['19:00'],
    ]);
    ust.getRange('A1:G1').setFontWeight('bold');
  }

  /* --- 3. Zakresy nazwane ----------------------------------------------
   * Formuła `PROG_STARTU` czyta się lepiej niż `Ustawienia!$E$1` i nie psuje
   * się, gdy ktoś wstawi wiersz w zakładce Ustawienia. */
  ustawZakresNazwany_(ss, 'PROG_STARTU', ust.getRange('E1'));
  ustawZakresNazwany_(ss, 'FLOTA', ust.getRange('A2:B20'));
  ustawZakresNazwany_(ss, 'GODZINY', ust.getRange('G2:G20'));

  /* --- 4. Zakładka Grafik_Dnia ----------------------------------------- */
  var graf = ss.getSheetByName(KONFIG.zakladkaGrafik) || ss.insertSheet(KONFIG.zakladkaGrafik);
  if (graf.getLastRow() === 0 || String(graf.getRange(1, 2).getValue()).trim() !== 'Data') {
    graf.getRange('A1:H1').setValues([[
      'WIDOK GLOWNY (STATUS)', 'Data', 'Godzina', 'Jednostka',
      'Zajete Miejsca', 'Pojemnosc', 'Wolne', 'Pasazerowie (imie / miejsca / telefon)',
    ]]);
  }
  graf.setFrozenRows(1);
  graf.getRange('A1:H1').setFontWeight('bold').setBackground('#111111').setFontColor('#ffffff');
  graf.getRange('B2:C').setNumberFormat('@');
  graf.setColumnWidth(1, 420);
  graf.setColumnWidth(8, 460);

  wstawFormulyGrafiku(2, 200);

  SpreadsheetApp.getActiveSpreadsheet().toast('Arkusz zainicjalizowany.', 'Morskie Safari', 5);
}

/**
 * Wstawia formuły dashboardu do wskazanego zakresu wierszy Grafik_Dnia.
 * Wydzielone z inicjalizacji, żeby dało się odświeżyć same formuły po tym,
 * jak ktoś je przypadkiem nadpisze.
 */
function wstawFormulyGrafiku(odWiersza, doWiersza) {
  var ss = SpreadsheetApp.openById(KONFIG.arkuszId);
  var graf = ss.getSheetByName(KONFIG.zakladkaGrafik);
  var ile = doWiersza - odWiersza + 1;

  var kolA = [], kolE = [], kolF = [], kolG = [], kolH = [];
  for (var w = odWiersza; w <= doWiersza; w++) {
    kolA.push([formulaStatus_(w)]);
    kolE.push([formulaZajete_(w)]);
    kolF.push([formulaPojemnosc_(w)]);
    kolG.push([formulaWolne_(w)]);
    kolH.push([formulaPasazerowie_(w)]);
  }

  graf.getRange(odWiersza, 1, ile, 1).setFormulas(kolA);
  graf.getRange(odWiersza, 5, ile, 1).setFormulas(kolE);
  graf.getRange(odWiersza, 6, ile, 1).setFormulas(kolF);
  graf.getRange(odWiersza, 7, ile, 1).setFormulas(kolG);
  graf.getRange(odWiersza, 8, ile, 1).setFormulas(kolH);
}

/* Formuły trzymamy w funkcjach, żeby numer wiersza wstawiać w jednym miejscu.
 * UWAGA: separator argumentów to ŚREDNIK — polska lokalizacja arkusza.
 * Przy arkuszu w lokalizacji US podmień „;" na „,". */

function formulaZajete_(w) {
  var R = KONFIG.zakladkaRezerwacje;
  return '=IF($B' + w + '="";"";SUMIFS(' +
    R + '!$H$2:$H;' +
    R + '!$C$2:$C;TEXT($B' + w + ';"yyyy-mm-dd");' +
    R + '!$D$2:$D;TEXT($C' + w + ';"hh:mm");' +
    R + '!$E$2:$E;$D' + w + ';' +
    R + '!$I$2:$I;"<>' + KONFIG.statusAnulowana + '"))';
}

function formulaPojemnosc_(w) {
  return '=IF($D' + w + '="";"";IFERROR(VLOOKUP($D' + w + ';FLOTA;2;FALSE);' + KONFIG.pojemnoscDomyslna + '))';
}

function formulaWolne_(w) {
  return '=IF($F' + w + '="";"";MAX(0;$F' + w + '-$E' + w + '))';
}

function formulaStatus_(w) {
  return '=IF($B' + w + '="";"";TEXT($B' + w + ';"yyyy-mm-dd")&" | "&$D' + w + '&" ➜ "&IFS(' +
    '$E' + w + '>=$F' + w + ';"🔴 REJS PELNY ("&$E' + w + '&"/"&$F' + w + '&")";' +
    '$E' + w + '>=PROG_STARTU;"🟢 PLYNIEMY ("&$E' + w + '&"/"&$F' + w + '&")";' +
    '$E' + w + '>0;"🟡 SZUKAJ LUDZI ("&$E' + w + '&"/"&$F' + w + '&") - BRAKUJE "&(PROG_STARTU-$E' + w + ')&" DO STARTU";' +
    'TRUE;"⚪ BRAK ZGLOSZEN (0/"&$F' + w + '&")"))';
}

function formulaPasazerowie_(w) {
  var R = KONFIG.zakladkaRezerwacje;
  return '=IF($B' + w + '="";"";IFERROR(TEXTJOIN("  ·  ";TRUE;FILTER(' +
    R + '!$F$2:$F&" ["&' + R + '!$H$2:$H&" msc] "&' + R + '!$G$2:$G&" ("&' + R + '!$I$2:$I&")";' +
    'TEXT(' + R + '!$C$2:$C;"yyyy-mm-dd")=TEXT($B' + w + ';"yyyy-mm-dd");' +
    'TEXT(' + R + '!$D$2:$D;"hh:mm")=TEXT($C' + w + ';"hh:mm");' +
    R + '!$E$2:$E=$D' + w + ';' +
    R + '!$I$2:$I<>"' + KONFIG.statusAnulowana + '"));"- brak zgloszen -"))';
}

/** Tworzy albo nadpisuje zakres nazwany (Apps Script nie ma „upsert"). */
function ustawZakresNazwany_(ss, nazwa, zakres) {
  var istniejace = ss.getNamedRanges();
  for (var i = 0; i < istniejace.length; i++) {
    if (istniejace[i].getName() === nazwa) istniejace[i].remove();
  }
  ss.setNamedRange(nazwa, zakres);
}

/* --------------------------------------------------------------------------
 *  SEKCJA 7 — TEST LOKALNY
 *  Uruchom z edytora Apps Script (Wykonaj → testDoPost). Sprawdza cały tor
 *  zapisu bez potrzeby stawiania frontendu.
 * ------------------------------------------------------------------------ */

function testDoPost() {
  var zdarzenie = {
    parameter: {
      unitType: 'SZYBKA MOTORÓWKA RIB',
      date: Utilities.formatDate(new Date(Date.now() + 86400000), KONFIG.strefa, 'yyyy-MM-dd'),
      timeSlot: '13:00',
      seatsCount: '2',
      clientName: 'Test Automatyczny',
      clientPhone: '+48 509 562 635',
      source: 'TEST',
    },
  };
  var odp = doPost(zdarzenie);
  console.log(odp.getContent());
}
