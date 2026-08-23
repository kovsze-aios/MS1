/* ==========================================================================
 *  companyConfig.ts — JEDYNE ŹRÓDŁO PRAWDY O KLIENCIE
 * --------------------------------------------------------------------------
 *  Ten plik jest sercem całego szablonu. Zawiera WYŁĄCZNIE dane — zero logiki,
 *  zero importów Reacta — dzięki czemu:
 *
 *   1. Jest IDENTYCZNY w obu wariantach UI (cinematic i classic). Kopiujemy go
 *      1:1, a oba frontendy renderują spójne treści i ceny.
 *   2. Osoba nietechniczna może podmienić dane klienta bez dotykania kodu
 *      komponentów — edytuje tylko wartości w obiekcie `companyConfig`.
 *   3. TypeScript pilnuje kompletności: gdy zapomnisz pola (np. telefonu),
 *      build padnie natychmiast, a nie dopiero u klienta na produkcji.
 *
 *  KONWENCJA:
 *    `interface` = kontrakt (kształt danych) — NIE ruszasz przy nowym kliencie.
 *    `companyConfig` = konkretne wartości — TO podmieniasz.
 * ========================================================================== */

/* --------------------------------------------------------------------------
 *  SEKCJA 1 — TYPY POMOCNICZE
 *  Union types zamiast gołego `string`: IDE podpowiada dozwolone wartości,
 *  a literówka staje się błędem kompilacji, nie cichym bugiem na produkcji.
 * ------------------------------------------------------------------------ */

/** Waluta w standardzie ISO 4217 — używana przez formatter cen. */
export type Currency = 'PLN' | 'EUR' | 'USD';

/**
 * Klucz ikony. Konfiguracja NIE importuje komponentów Reacta (zostaje czystymi
 * danymi), więc trzyma tylko "klucz", który warstwa UI mapuje na konkretną
 * ikonę z biblioteki lucide-react. Mapowanie: `src/lib/icons.ts`.
 */
export type IconKey =
  | 'ship'      // motorówka, rejs
  | 'anchor'    // port, przystań
  | 'waves'     // morze, fale
  | 'compass'   // nawigacja, trasa
  | 'gauge'     // prędkość, osiągi
  | 'clock'     // czas trwania
  | 'users'     // liczba miejsc, grupa
  | 'lifebuoy'  // bezpieczeństwo, kamizelki
  | 'fish'      // fauna morska, foki
  | 'camera'    // zdjęcia, obserwacja
  | 'sun'       // sezon letni, pogoda
  | 'wind';     // warunki na wodzie

/* --------------------------------------------------------------------------
 *  SEKCJA 2 — KONTRAKTY DANYCH (INTERFEJSY)
 * ------------------------------------------------------------------------ */

/** Jeden wiersz tabeli godzin otwarcia, np. "Pon–Nd" → "09:00–19:00". */
export interface OpeningHours {
  /** Zakres dni gotowy do wyświetlenia, np. "Poniedziałek – Niedziela". */
  days: string;
  /** Godziny albo słowo "Zamknięte". */
  hours: string;
}

/** Komplet danych kontaktowych i adresowych (tzw. NAP: Name–Address–Phone). */
export interface ContactInfo {
  /** Telefon CZYTELNY dla człowieka (ze spacjami) — trafia do widocznego tekstu. */
  phone: string;
  /**
   * Ten sam numer w formie technicznej dla atrybutu `href="tel:..."`.
   * Spacje potrafią rozbić click-to-call na części telefonów, dlatego
   * trzymamy osobne pole bez spacji.
   */
  phoneHref: string;
  /** Adres e-mail (formularz kontaktowy, link mailto:). */
  email: string;
  /** Ulica z numerem. */
  street: string;
  /** Kod pocztowy (PL: 00-000). */
  postalCode: string;
  /** Miejscowość — kluczowa dla SEO lokalnego, pojawia się w nagłówkach. */
  city: string;
  /** Region / województwo — dopowiedzenie w stopce. */
  region: string;
  /** Krótki opis, jak trafić na przystań (parking, punkt orientacyjny). */
  directionsHint: string;
  /** Link do wizytówki / pinezki w Google Maps (przycisk "Wyznacz trasę"). */
  mapsUrl: string;
  /**
   * URL do `<iframe>` z mapą.
   * ⚠️ Musi być adresem typu `.../maps?...&output=embed` — zwykły link do map
   * Google blokuje osadzanie nagłówkiem X-Frame-Options.
   */
  mapsEmbedUrl: string;
  /** Tabela godzin otwarcia. */
  openingHours: OpeningHours[];
  /** Informacja o sezonie, np. "Rejsy od maja do września". */
  seasonNote: string;
}

/**
 * Dane rejestrowe firmy — wymagane w stopce serwisu usługowego
 * i budujące zaufanie (klient widzi, że firma jest realna i zarejestrowana).
 */
export interface LegalInfo {
  /** Pełna nazwa prawna (jak w CEIDG/KRS). */
  legalName: string;
  /** NIP — format z myślnikami lub spacjami, jak na fakturze. */
  nip: string;
  /** REGON. */
  regon: string;
  /** Nazwa banku prowadzącego rachunek. */
  bankName: string;
  /** Numer rachunku (IBAN) — do przedpłat i rezerwacji grupowych. */
  bankAccount: string;
}

/**
 * "Społeczny dowód słuszności" z Google — w lokalnych usługach turystycznych
 * to najsilniejszy element budujący zaufanie, dlatego w OBU wariantach UI
 * ląduje nad linią przewijania (widoczny bez scrollowania).
 */
export interface GoogleTrust {
  /** Średnia ocena 0–5, np. 4.9. */
  rating: number;
  /** Liczba opinii — działa mocniej niż sama ocena. */
  reviewsCount: number;
  /** Link do listy opinii w wizytówce Google. */
  profileUrl: string;
  /** Etykieta odznaki, np. "Zweryfikowana firma w Google". */
  badgeLabel: string;
}

/** Motyw kolorystyczny — jeden akcent steruje identyfikacją całej strony. */
export interface ThemeConfig {
  /**
   * Kolor akcentu w HEX (#rrggbb). Przy starcie aplikacji zamieniamy go na
   * zmienną CSS `--accent`, więc zmiana TEJ JEDNEJ wartości przemalowuje
   * przyciski, ikony, obramowania i poświaty w całym serwisie.
   * Szczegóły mechanizmu: `src/lib/theme.ts`.
   */
  accent: string;
  /** Ciemniejszy wariant akcentu — gradienty i stan :hover. */
  accentDark: string;
  /** Kolor tekstu NA tle akcentu — pilnuje kontrastu (WCAG AA). */
  accentContrast: string;
}

/** Zasoby multimedialne wariantu kinowego. */
export interface MediaConfig {
  /**
   * Wideo tła sterowane scrollem.
   * Ścieżka lokalna z katalogu `public/` — dzięki temu strona działa offline
   * i nie zależy od zewnętrznego CDN, który może przestać odpowiadać.
   * Plik wgraj do: `public/videos/hero.mp4` (instrukcja w README tego folderu).
   */
  heroVideoUrl: string;
  /**
   * Poster — klatka pokazywana zanim wideo się wczyta. Pełni też rolę planu B,
   * gdy przeglądarka zablokuje autoodtwarzanie albo pliku wideo brakuje.
   */
  heroVideoPoster: string;
  /** Opcjonalne logo. Gdy brak — UI renderuje logotyp tekstowy. */
  logoUrl?: string;
}

/** Parametry samego rejsu — zasilają kafelki "fakty w liczbach". */
export interface CruiseInfo {
  /** Czas trwania rejsu w minutach (UI sam dopisze "~ min"). */
  durationMinutes: number;
  /** Maksymalna prędkość motorówki w km/h — element "wow" oferty. */
  maxSpeedKmh: number;
  /** Nazwa punktu, z którego wypływają łodzie. */
  departurePoint: string;
  /**
   * Nazwa własna celu wyprawy — rezerwatu, wyspy, akwenu.
   * Trafia na wielki nagłówek sekcji „Rezerwat" w wariancie kinowym, więc
   * działa najlepiej jako 1–2 wyraziste słowa (np. „Mewia Łacha").
   * W innej branży wpisz tu odpowiednik celu usługi.
   */
  reserveName: string;
  /** Opis trasy rejsu (1–2 zdania). */
  routeDescription: string;
  /** Zdanie o bezpieczeństwie (kamizelki, uprawnienia sternika). */
  safetyNote: string;
  /** Największa liczba pasażerów na jednym rejsie. */
  maxPassengers: number;
}

/** Pojedynczy typ biletu (dorosły / dziecko / grupa). */
export interface TicketType {
  /** Identyfikator techniczny — klucz Reacta i wartość wysyłana do API. */
  id: string;
  /** Nazwa widoczna dla klienta, np. "Bilet normalny". */
  label: string;
  /** Doprecyzowanie, np. "Osoba dorosła". */
  description: string;
  /** Cena jednostkowa BRUTTO w walucie z `tickets.currency`. */
  price: number;
  /** Klucz ikony na kafelku. */
  icon: IconKey;
  /**
   * Domyślna liczba sztuk w konfiguratorze przy pierwszym wejściu.
   * Zwykle 2 dorosłych i 0 dzieci — najczęstszy scenariusz rezerwacji.
   */
  defaultQuantity: number;
  /** Maksymalna liczba sztuk możliwa do wybrania w konfiguratorze. */
  maxQuantity: number;
}

/** Ustawienia konfiguratora biletów (kalkulator ceny na żywo). */
export interface TicketsConfig {
  /** Waluta cennika. */
  currency: Currency;
  /** Lista typów biletów. */
  types: TicketType[];
  /**
   * Stawka VAT jako ułamek (0.08 = 8% — stawka dla usług turystycznych).
   * Ceny w `types` traktujemy jako BRUTTO, więc kwotę netto wyliczamy wstecz:
   *   netto = brutto / (1 + vatRate)
   */
  vatRate: number;
  /** Tekst przycisku finalizującego rezerwację. */
  ctaLabel: string;
  /** Zastrzeżenie prawne — wycena orientacyjna, nie oferta w rozumieniu KC. */
  disclaimer: string;
  /**
   * Adres backendu (`template-api`) przyjmującego zapytanie o rezerwację.
   * Pusty string `''` = tryb demo: UI nie wykona żadnego zapytania sieciowego.
   */
  apiEndpoint: string;
}

/** Motorówka z floty. */
export interface Boat {
  /** Identyfikator techniczny. */
  id: string;
  /** Nazwa własna łodzi, np. "Fenix". */
  name: string;
  /** Jednozdaniowy haczyk, np. "Najszybsza jednostka we flocie". */
  tagline: string;
  /** Opis 1–2 zdania. */
  description: string;
  /** Liczba miejsc dla pasażerów. */
  capacity: number;
  /** Moc silnika gotowa do wyświetlenia, np. "250 KM". */
  enginePower: string;
  /** Prędkość maksymalna w km/h. */
  topSpeedKmh: number;
  /** 2–3 wyróżniki (bullety na kafelku). */
  highlights: string[];
  /** Klucz ikony. */
  icon: IconKey;
}

/** Gatunek foki obserwowany podczas rejsu (sekcja edukacyjna). */
export interface SealSpecies {
  /** Identyfikator techniczny. */
  id: string;
  /** Nazwa polska, np. "Foka szara". */
  name: string;
  /** Nazwa łacińska — dodaje wiarygodności sekcji edukacyjnej. */
  latinName: string;
  /** Opis 1–2 zdania: jak wygląda, gdzie ją spotkasz. */
  description: string;
  /** Długość ciała gotowa do wyświetlenia, np. "do 3 m". */
  sizeLabel: string;
  /** Masa gotowa do wyświetlenia, np. "do 300 kg". */
  weightLabel: string;
  /** Ciekawostka — treść, którą klienci najchętniej zapamiętują. */
  funFact: string;
  /** Status ochronny, np. "Gatunek objęty ochroną ścisłą". */
  protectionStatus: string;
}

/** Opinia klienta. */
export interface Testimonial {
  /** Identyfikator techniczny (klucz listy w React). */
  id: string;
  /** Autor opinii. */
  author: string;
  /** Inicjały do awatara zastępczego. */
  initials: string;
  /** Ocena 1–5. */
  rating: number;
  /** Data gotowa do wyświetlenia, np. "sierpień 2025". */
  date: string;
  /** Treść opinii. */
  text: string;
  /** Źródło — podpis pod kartą. */
  source: 'Google' | 'Facebook' | 'Strona WWW';
  /** `true` → plakietka "Zweryfikowana opinia". */
  verified: boolean;
}

/** Podpis agencji wykonawczej w stopce. */
export interface AgencyCredit {
  /** Nazwa agencji. */
  name: string;
  /** Link do portfolio. */
  url: string;
  /** Pełna formuła podpisu. */
  credit: string;
}

/** Linki do kanałów w mediach społecznościowych. */
export interface SocialLinks {
  facebook?: string;
  x?: string;
  youtube?: string;
  instagram?: string;
}

export interface BookingUnit {
  id: string;
  name: string;
  capacity: number;
  desc: string;
}

export interface BookingConfig {
  webhookUrl: string;
  timeSlots: string[];
  units: BookingUnit[];
  minPassengersForCruise: number;
  maxCapacity: number;
}

/** Główny kontrakt — spina wszystkie sekcje powyżej. */
export interface CompanyConfig {
  brand: {
    /** Pełna nazwa marki (nagłówki, <title>). */
    name: string;
    /** Skrót do logo i wąskiego navbara na mobile. */
    shortName: string;
    /** Slogan — jedno zdanie pod nagłówkiem hero. */
    tagline: string;
    /** Główna obietnica sprzedażowa (duży nagłówek H1). */
    claim: string;
    /** Rok rozpoczęcia działalności — zasila licznik "X lat na wodzie". */
    foundedYear: number;
  };
  contact: ContactInfo;
  legal: LegalInfo;
  google: GoogleTrust;
  theme: ThemeConfig;
  media: MediaConfig;
  cruise: CruiseInfo;
  tickets: TicketsConfig;
  boats: Boat[];
  seals: SealSpecies[];
  testimonials: Testimonial[];
  agency: AgencyCredit;
  socials?: SocialLinks;
  bookingConfig: BookingConfig;
}

/* --------------------------------------------------------------------------
 *  SEKCJA 3 — DANE KLIENTA: MORSKIE SAFARI (Mikoszewo)
 *
 *  To jest konfiguracja PRODUKCYJNA projektu `projekt-01-morskie-safari`.
 *  Ten sam plik leży w obu frontendach (cinematic i classic) i musi pozostać
 *  identyczny — weryfikacja:
 *
 *    diff template-ui-cinematic/src/config/companyConfig.ts \
 *         template-ui-classic/src/config/companyConfig.ts
 *
 *  ⚠️  PRZED PUBLIKACJĄ potwierdź z klientem wszystkie pola oznaczone `TODO:`.
 *      Są to dane, których nie da się ustalić bez dostępu do dokumentów firmy
 *      lub panelu wizytówki Google.
 * ------------------------------------------------------------------------ */

export const companyConfig: CompanyConfig = {
  brand: {
    name: 'Morskie Safari',
    shortName: 'MS',
    tagline: 'Rejsy motorówką do rezerwatu fok u ujścia Wisły.',
    claim: 'Foki, prędkość i Bałtyk z pierwszego rzędu',
    foundedYear: 2016, // TODO: potwierdź rok rozpoczęcia działalności
  },

  contact: {
    // Format czytelny dla człowieka — trafia do widocznego tekstu przycisków.
    phone: '509 562 635',
    // Wersja techniczna dla atrybutu href — BEZ spacji, inaczej część
    // telefonów urwie numer przy click-to-call.
    phoneHref: 'tel:509562635',
    email: 'kontakt@morskiesafari.pl',
    street: 'ul. Gdańska 104',
    postalCode: '82-103',
    city: 'Mikoszewo',
    region: 'woj. pomorskie',
    directionsHint:
      'Mikoszewo, ul. Gdańska 104 (obok przystani Promu Świbno). Przystań znajduje się przy ujściu Wisły, w pobliżu przeprawy promowej Świbno – Mikoszewo. Dojazd drogą wojewódzką nr 501, parking bezpośrednio przy przystani.',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Mikoszewo+ul.+Gda%C5%84ska+104',
    // Format "?q=...&output=embed" to jedyny, który Google pozwala osadzić
    // w <iframe> — zwykły link do map blokuje nagłówek X-Frame-Options.
    mapsEmbedUrl: 'https://www.google.com/maps?q=Mikoszewo%20ul.%20Gda%C5%84ska%20104&output=embed',
    openingHours: [
      { days: 'Poniedziałek – Piątek', hours: '09:00 – 19:00' },
      { days: 'Sobota – Niedziela', hours: '09:00 – 20:00' },
    ],
    seasonNote:
      'Rejsy realizujemy sezonowo od maja do września. O wypłynięciu decydują warunki na wodzie — w razie sztormu proponujemy nowy termin.',
  },

  legal: {
    legalName: 'Morskie Safari',
    nip: '5781445804',
    regon: '170319474',
    bankName: 'Bank Spółdzielczy',
    bankAccount: 'PL68 8308 0001 2003 0000 0265 0001',
  },

  google: {
    rating: 4.9,
    reviewsCount: 186,
    profileUrl: 'https://www.google.com/maps/search/?api=1&query=Morskie+Safari+Mikoszewo',
    badgeLabel: 'Zweryfikowana firma w Google',
  },

  theme: {
    // Głęboki morski błękit — kolor identyfikacji Morskiego Safari.
    accent: '#0284c7',
    accentDark: '#075985',
    accentContrast: '#ffffff',
  },

  media: {
    heroVideoUrl: '/videos/bg.mp4',
    heroVideoPoster: '/videos/bg-poster.jpg',
  },

  cruise: {
    durationMinutes: 40,
    maxSpeedKmh: 100,
    departurePoint: 'Mikoszewo, ul. Gdańska 104 (obok przystani Promu Świbno)',
    reserveName: 'Mewia Łacha',
    routeDescription:
      'Wypływamy z Mikoszewa w stronę Zatoki Gdańskiej, mijamy rezerwat Mewia Łacha i podchodzimy na bezpieczną odległość do piaszczystych łach, na których wylegują się foki.',
    safetyNote:
      'Każdy pasażer otrzymuje kamizelkę asekuracyjną, a rejsy prowadzą sternicy z uprawnieniami motorowodnymi. Foki obserwujemy z dystansu wyznaczonego zasadami ochrony rezerwatu — nigdy ich nie karmimy ani nie płoszymy.',
    maxPassengers: 12,
  },

  tickets: {
    currency: 'PLN',
    types: [
      {
        id: 'adult',
        label: 'Bilet normalny',
        description: 'Osoba dorosła',
        price: 70,
        icon: 'users',
        defaultQuantity: 2,
        maxQuantity: 12,
      },
      {
        id: 'child',
        label: 'Bilet ulgowy',
        description: 'Dziecko do 12 lat',
        price: 50,
        icon: 'lifebuoy',
        defaultQuantity: 0,
        maxQuantity: 12,
      },
    ],
    vatRate: 0.08,
    ctaLabel: 'Zarezerwuj ten termin telefonicznie',
    disclaimer:
      'Kalkulacja ma charakter orientacyjny i nie stanowi oferty w rozumieniu art. 66 §1 Kodeksu cywilnego. Rezerwację potwierdzamy telefonicznie, płatność następuje na miejscu przed rejsem.',
    apiEndpoint: '',
  },

  boats: [
    {
      id: 'fenix',
      name: 'Fenix',
      tagline: 'Najszybsza jednostka we flocie',
      description:
        'Motorówka zbudowana pod dynamiczne rejsy. Odcinek do rezerwatu pokonuje najszybciej z całej floty, dzięki czemu zostaje więcej czasu na obserwację fok.',
      capacity: 12, // TODO: potwierdź liczbę miejsc z dokumentacją jednostki
      enginePower: '250 KM', // TODO: potwierdź moc silnika
      topSpeedKmh: 100,
      highlights: ['Zadaszona część pokładu', 'Miejsca siedzące dla całej grupy'],
      icon: 'ship',
    },
    {
      id: 'komandor',
      name: 'Komandor',
      tagline: 'Komfort dla rodzin z dziećmi',
      description:
        'Stabilna jednostka o łagodnym prowadzeniu. Najczęściej wybierana przez rodziny oraz osoby, które pierwszy raz płyną motorówką po otwartej wodzie.',
      capacity: 10, // TODO: potwierdź liczbę miejsc
      enginePower: '200 KM', // TODO: potwierdź moc silnika
      topSpeedKmh: 80,
      highlights: ['Łagodne prowadzenie', 'Szerokie, wygodne siedziska'],
      icon: 'anchor',
    },
    {
      id: 'posejdon',
      name: 'Posejdon',
      tagline: 'Rejsy grupowe i firmowe',
      description:
        'Jednostka dedykowana wycieczkom szkolnym, grupom zorganizowanym i wyjazdom integracyjnym. Mieści komplet pasażerów wraz ze sprzętem fotograficznym.',
      capacity: 12, // TODO: potwierdź liczbę miejsc
      enginePower: '225 KM', // TODO: potwierdź moc silnika
      topSpeedKmh: 85,
      highlights: ['Idealna dla grup zorganizowanych', 'Miejsce na bagaż i sprzęt foto'],
      icon: 'compass',
    },
  ],

  seals: [
    {
      id: 'foka-szara',
      name: 'Foka szara',
      latinName: 'Halichoerus grypus',
      description:
        'Najczęściej spotykany gatunek w rejonie ujścia Wisły i największa z bałtyckich fok. Rozpoznasz ją po wydłużonym, końskim pysku i szarym, plamistym futrze.',
      sizeLabel: 'do 3 m długości',
      weightLabel: 'do 300 kg',
      funFact:
        'Potrafi nurkować na kilkadziesiąt metrów i pozostać pod wodą kilkanaście minut, polując na ryby przy dnie.',
      protectionStatus: 'Gatunek objęty ochroną ścisłą',
    },
    {
      id: 'foka-pospolita',
      name: 'Foka pospolita',
      latinName: 'Phoca vitulina',
      description:
        'Mniejsza i smuklejsza od foki szarej, z krótszym, bardziej „psim" pyskiem. W polskiej części Bałtyku spotykana znacznie rzadziej.',
      sizeLabel: 'do 1,9 m długości',
      weightLabel: 'do 130 kg',
      funFact:
        'Młode foki pospolite potrafią pływać praktycznie od pierwszych godzin życia — inaczej niż młode fok szarych.',
      protectionStatus: 'Gatunek objęty ochroną ścisłą',
    },
    {
      id: 'foka-obraczkowana',
      name: 'Foka obrączkowana',
      latinName: 'Pusa hispida',
      description:
        'Najmniejsza z bałtyckich fok, nazwana od jasnych, obrączkowatych wzorów na ciemnym futrze. Najrzadszy gość naszych rejsów.',
      sizeLabel: 'do 1,5 m długości',
      weightLabel: 'do 100 kg',
      funFact:
        'W północnym Bałtyku wychowuje młode w jamach wydrążonych w śniegu i lodzie — dlatego łagodne zimy są dla niej zagrożeniem.',
      protectionStatus: 'Gatunek objęty ochroną ścisłą',
    },
  ],

  /*
   * ⚠️ OPINIE PRZYKŁADOWE — TREŚCI DEMONSTRACYJNE, NIE CYTATY KLIENTÓW.
   * Przed publikacją zastąp je autentycznymi wypowiedziami z wizytówki Google:
   * zachowaj oryginalną pisownię, imię autora i datę. Publikowanie wymyślonych
   * opinii jako prawdziwych to nieuczciwa praktyka rynkowa (i realne ryzyko
   * kary z UOKiK), a doświadczeni czytelnicy i tak je rozpoznają.
   */
  testimonials: [
    {
      id: 'opinia-1',
      author: 'Katarzyna W.',
      initials: 'KW',
      rating: 5,
      date: 'lipiec 2025',
      text: 'Rejs trwał około 40 minut i widzieliśmy kilkanaście fok wygrzewających się na piachu. Sternik po drodze opowiadał o rezerwacie i zwolnił, żeby wszyscy zdążyli zrobić zdjęcia. Dzieci zachwycone prędkością w drodze powrotnej.',
      source: 'Google',
      verified: true,
    },
    {
      id: 'opinia-2',
      author: 'Marcin P.',
      initials: 'MP',
      rating: 5,
      date: 'sierpień 2025',
      text: 'Rezerwacja telefoniczna zajęła minutę, wypłynęliśmy o umówionej godzinie. Kamizelki dla wszystkich, konkretny instruktaż przed startem. Cena adekwatna do tego, co się dostaje.',
      source: 'Google',
      verified: true,
    },
    {
      id: 'opinia-3',
      author: 'Anna i Tomasz K.',
      initials: 'AK',
      rating: 5,
      date: 'czerwiec 2025',
      text: 'Byliśmy z rodzicami po siedemdziesiątce i obawialiśmy się, czy dadzą radę. Załoga pomogła przy wejściu na łódź i dobrała spokojniejsze tempo. Foki pokazały się tuż obok motorówki.',
      source: 'Google',
      verified: true,
    },
  ],

  agency: {
    name: 'Aios Studio',
    url: 'https://aiosstudio.pl',
    credit: 'Projekt przygotowany przez Aios Studio',
  },

  socials: {
    facebook: 'https://facebook.com/morskiesafari',
    x: 'https://x.com',
    youtube: 'https://youtube.com',
  },

  bookingConfig: {
    webhookUrl: "https://script.google.com/macros/s/AKfycbybu61ulS0HxViMrg5GXb7OYDy31K96u5WP5Mw4YxnQh2CPLnb_Y4GIxNWJIwwCf_yVPg/exec",
    timeSlots: ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00"],
    units: [
      { id: "rib", name: "SZYBKA MOTORÓWKA RIB", capacity: 12, desc: "100 km/h · Foki · Adrenalina · 12 miejsc" },
      { id: "slow", name: "STATEK WOLNY", capacity: 12, desc: "Spokojny rejs widokowy · Komfort · 12 miejsc" }
    ],
    minPassengersForCruise: 8,
    maxCapacity: 12
  },
};

/**
 * Eksport domyślny — pozwala importować krócej:
 *   import config from '@/config/companyConfig';
 * Eksport nazwany (powyżej) zostaje dla czytelności w większych plikach.
 */
export default companyConfig;
