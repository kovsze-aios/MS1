/* ==========================================================================
 *  App.tsx — WARIANT KLASYCZNY (Fast & Trust Focus)
 * --------------------------------------------------------------------------
 *  ZAŁOŻENIE PROJEKTOWE
 *  Wariant kinowy sprzedaje emocją. Ten sprzedaje KONKRETEM i szybkością.
 *  Typowy odbiorca: osoba stojąca na plaży, z telefonem w ręku, w słońcu,
 *  na słabym zasięgu. Ma w 5 sekund poznać cenę i móc jednym kciukiem zadzwonić.
 *
 *  KONSEKWENCJE TECHNICZNE:
 *   • zero bibliotek animacji (framer-motion, lenis) — mniejsza paczka JS,
 *   • zero wideo — brak megabajtów transferu,
 *   • jasny motyw — czytelny w pełnym słońcu,
 *   • numer telefonu powtórzony w 4 miejscach: górny pasek, nagłówek, hero
 *     i przyklejony pasek mobilny. Klient nigdy nie musi go szukać.
 *
 *  KOLEJNOŚĆ SEKCJI ODWZOROWUJE ŚCIEŻKĘ DECYZYJNĄ:
 *   gdzie to jest → czy warto zaufać → ile kosztuje → czym płyniemy →
 *   co zobaczę → co mówią inni → dane firmy i dojazd.
 * ========================================================================== */

import type { ComponentType } from 'react';
import {
  Anchor,
  Building2,
  Calendar,
  Check,
  Clock,
  CreditCard,
  Fish,
  Gauge,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Quote,
  ShieldCheck,
  Star,
  Users,
  Waves,
} from 'lucide-react';

import { companyConfig } from '@/config/companyConfig';
import { formatDuration, formatNumber, formatPrice, formatRating, yearsSince } from '@/lib/format';
import { getIcon } from '@/lib/icons';

/** Skrót do konfiguracji — wszystkie sekcje czerpią z jednego źródła. */
const cfg = companyConfig;

/* ==========================================================================
 *  KOMPONENT GŁÓWNY — składa stronę z sekcji w kolejności ścieżki decyzyjnej
 * ========================================================================== */
export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Header />

      <main>
        <Hero />
        <PricingSection />
        <FleetSection />
        <SealsSection />
        <ReviewsSection />
        <CompanyAndMapSection />
      </main>

      <SiteFooter />
      <MobileCallBar />
    </div>
  );
}

/* --------------------------------------------------------------------------
 *  PASEK GÓRNY — lokalizacja i ocena Google
 *  Pierwsze dwie informacje, jakich szuka klient lokalnej usługi:
 *  „gdzie to jest?" oraz „czy inni to polecają?".
 * ------------------------------------------------------------------------ */
function TopBar() {
  return (
    <div className="border-b border-slate-200 bg-slate-50">
      <div className="container-page flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
        {/* Lokalizacja */}
        <p className="flex items-center gap-1.5 text-slate-600">
          <MapPin className="h-4 w-4 shrink-0 text-accent" />
          <span className="font-medium">
            {cfg.contact.city}, {cfg.contact.street}
          </span>
        </p>

        {/* Ocena Google — klikalna, prowadzi wprost do wizytówki.
            Możliwość weryfikacji buduje wiarygodność mocniej niż sama liczba. */}
        <a
          href={cfg.google.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-slate-600 transition hover:text-accent"
        >
          {/* fill-amber-400 wypełnia gwiazdkę kolorem — sam `text-` pokoloruje
              wyłącznie kontur, co wygląda na „pustą" ocenę. */}
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="font-bold text-slate-900">{formatRating(cfg.google.rating)}</span>
          <span>({formatNumber(cfg.google.reviewsCount)} opinii Google)</span>
        </a>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
 *  NAGŁÓWEK — przyklejony do góry, z telefonem zawsze pod ręką
 * ------------------------------------------------------------------------ */
function Header() {
  return (
    /* sticky top-0 + z-30: pasek zostaje na ekranie przy przewijaniu.
     * backdrop-blur ratuje czytelność, gdy przesuwa się pod nim treść. */
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-page flex items-center justify-between gap-4 py-3">
        <a href="#top" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-contrast">
            <Anchor className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            {cfg.brand.name}
          </span>
        </a>

        {/* Nawigacja kotwicowa. Ukryta na telefonie (tam liczy się tylko
            przycisk „Zadzwoń"), widoczna od breakpointu md. */}
        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          <a href="#cennik" className="transition hover:text-accent">
            Cennik
          </a>
          <a href="#flota" className="transition hover:text-accent">
            Flota
          </a>
          <a href="#foki" className="transition hover:text-accent">
            Foki
          </a>
          <a href="#kontakt" className="transition hover:text-accent">
            Kontakt
          </a>
        </nav>

        <a href={cfg.contact.phoneHref} className="btn-primary px-4 py-2.5 text-sm">
          <Phone className="h-4 w-4" />
          <span className="hidden sm:inline">{cfg.contact.phone}</span>
          <span className="sm:hidden">Zadzwoń</span>
        </a>
      </div>
    </header>
  );
}

/* --------------------------------------------------------------------------
 *  HERO — obietnica, numer telefonu i przycisk połączenia
 * ------------------------------------------------------------------------ */
function Hero() {
  const years = yearsSince(cfg.brand.foundedYear);

  return (
    <section id="top" className="border-b border-slate-200 bg-gradient-to-b from-sky-50 to-white">
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1.15fr_1fr] lg:py-20">
        {/* --- Kolumna lewa: komunikat sprzedażowy --------------------- */}
        <div>
          <p className="eyebrow">
            <Waves className="h-4 w-4" />
            {cfg.cruise.departurePoint}
          </p>

          <h1 className="text-fluid-hero text-balance">{cfg.brand.claim}</h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            {cfg.brand.tagline} {cfg.cruise.routeDescription}
          </p>

          {/* Trzy powody, by zaufać — krótkie, konkretne, bez marketingowej waty. */}
          <ul className="mt-6 space-y-2">
            {[
              `${years} lat doświadczenia na wodzie`,
              cfg.cruise.safetyNote,
              cfg.contact.seasonNote,
            ].map((item) => (
              <li key={item} className="flex gap-2 text-sm text-slate-700">
                <Check className="h-5 w-5 shrink-0 text-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* --- Kolumna prawa: karta kontaktowa (główny cel konwersji) --- */}
        <div className="card p-6 lg:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Rezerwacja telefoniczna
          </p>

          {/*
           * NUMER JAKO ELEMENT GRAFICZNY.
           * Duży, wytłuszczony, klikalny — na telefonie to jedno dotknięcie
           * do połączenia, na desktopie numer do przepisania. `tabular-nums`
           * wymusza cyfry o równej szerokości, dzięki czemu numer nie „tańczy".
           */}
          <a
            href={cfg.contact.phoneHref}
            className="mt-2 block text-4xl font-extrabold tabular-nums tracking-tight text-slate-900 transition hover:text-accent sm:text-5xl"
          >
            {cfg.contact.phone}
          </a>

          <a href={cfg.contact.phoneHref} className="btn-primary mt-5 w-full">
            <Phone className="h-5 w-5" />
            {cfg.tickets.ctaLabel}
          </a>

          {/* Kluczowe parametry rejsu — odpowiedź na pytania,
              które klienci i tak zadają w pierwszej minucie rozmowy. */}
          <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-200 pt-6 text-center">
            <FactTile
              icon={Clock}
              label="Czas rejsu"
              value={`~${formatDuration(cfg.cruise.durationMinutes)}`}
            />
            <FactTile icon={Gauge} label="Prędkość" value={`do ${cfg.cruise.maxSpeedKmh} km/h`} />
            <FactTile icon={Users} label="Maks. osób" value={`${cfg.cruise.maxPassengers}`} />
          </dl>

          <p className="mt-4 flex gap-2 text-xs leading-relaxed text-slate-500">
            <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
            Nie pobieramy przedpłat online — rezerwację potwierdzamy telefonicznie.
          </p>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
 *  CENNIK — klasyczna tabela HTML
 *  Świadomie <table>, a nie siatka <div>-ów: to dane tabelaryczne, więc
 *  czytnik ekranu poprawnie zapowie nagłówki kolumn, a wyszukiwarki mają
 *  szansę pokazać cenę bezpośrednio w wynikach.
 * ------------------------------------------------------------------------ */
function PricingSection() {
  return (
    <section id="cennik" className="border-b border-slate-200 py-14 lg:py-20">
      <div className="container-page">
        <p className="eyebrow">
          <CreditCard className="h-4 w-4" />
          Cennik
        </p>
        <h2 className="text-fluid-h2 text-balance">Proste ceny, bez ukrytych kosztów</h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Płatność gotówką lub przelewem na miejscu, przed rejsem. Dzieci do 3. roku życia
          wymagają wcześniejszego uzgodnienia telefonicznego.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* --- Tabela cen ------------------------------------------- */}
          <div className="card overflow-hidden">
            {/* overflow-x-auto: na wąskim ekranie tabela przewija się w poziomie
                zamiast rozpychać całą stronę. */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Rodzaj biletu
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Dla kogo
                    </th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">
                      Cena
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {cfg.tickets.types.map((type) => (
                    <tr key={type.id} className="transition hover:bg-slate-50">
                      <th scope="row" className="px-5 py-4 font-bold text-slate-900">
                        {type.label}
                      </th>
                      <td className="px-5 py-4 text-sm text-slate-600">{type.description}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-xl font-extrabold text-accent">
                        {formatPrice(type.price, cfg.tickets.currency)}
                      </td>
                    </tr>
                  ))}

                  {/* Parametry rejsu w tym samym miejscu co ceny — klient
                      nie musi szukać ich w innej sekcji. */}
                  <tr className="bg-slate-50/60">
                    <th scope="row" className="px-5 py-4 font-bold text-slate-900">
                      Czas trwania
                    </th>
                    <td className="px-5 py-4 text-sm text-slate-600">Rejs w obie strony</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-slate-900">
                      ~{formatDuration(cfg.cruise.durationMinutes)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/60">
                    <th scope="row" className="px-5 py-4 font-bold text-slate-900">
                      Prędkość
                    </th>
                    <td className="px-5 py-4 text-sm text-slate-600">Maksymalna na wodzie</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-slate-900">
                      do {cfg.cruise.maxSpeedKmh} km/h
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="border-t border-slate-200 bg-white px-5 py-4 text-xs leading-relaxed text-slate-500">
              {cfg.tickets.disclaimer}
            </p>
          </div>

          {/* --- Karta rezerwacji obok cennika ------------------------ */}
          <div className="card flex flex-col justify-center p-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Rezerwacja
            </p>
            <p className="mt-3 text-slate-600">
              Zadzwoń i podaj liczbę osób oraz preferowaną godzinę. Potwierdzenie otrzymasz
              od razu, podczas rozmowy.
            </p>

            <a
              href={cfg.contact.phoneHref}
              className="mt-4 text-3xl font-extrabold tabular-nums text-slate-900 transition hover:text-accent"
            >
              {cfg.contact.phone}
            </a>

            <a href={cfg.contact.phoneHref} className="btn-primary mt-4">
              <Phone className="h-5 w-5" />
              {cfg.tickets.ctaLabel}
            </a>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <Calendar className="h-4 w-4" />
              {cfg.contact.seasonNote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
 *  FLOTA — kafelki motorówek
 * ------------------------------------------------------------------------ */
function FleetSection() {
  return (
    <section id="flota" className="border-b border-slate-200 bg-slate-50 py-14 lg:py-20">
      <div className="container-page">
        <p className="eyebrow">
          <Anchor className="h-4 w-4" />
          Nasza flota
        </p>
        <h2 className="text-fluid-h2 text-balance">Trzy motorówki do wyboru</h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Każda jednostka jest regularnie serwisowana i wyposażona w komplet kamizelek
          asekuracyjnych. Konkretną łódź dobieramy do liczebności grupy.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {cfg.boats.map((boat) => {
            // Ikona pochodzi z konfiguracji (klucz tekstowy) i jest tłumaczona
            // na komponent w src/lib/icons.ts — konfiguracja nie zna Reacta.
            const Icon = getIcon(boat.icon);

            return (
              <article key={boat.id} className="card-interactive flex flex-col p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon className="h-6 w-6" />
                </span>

                <h3 className="mt-4 text-xl">{boat.name}</h3>
                <p className="text-sm font-semibold text-accent">{boat.tagline}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                  {boat.description}
                </p>

                <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-200 pt-4 text-center">
                  <SpecCell label="Miejsca" value={`${boat.capacity}`} />
                  <SpecCell label="Silnik" value={boat.enginePower} />
                  <SpecCell label="Prędkość" value={`${boat.topSpeedKmh} km/h`} />
                </dl>

                <ul className="mt-4 space-y-1.5">
                  {boat.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-2 text-xs text-slate-500">
                      <Check className="h-4 w-4 shrink-0 text-accent" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
 *  FOKI — sekcja edukacyjna
 *  Treść merytoryczna pełni podwójną rolę: buduje wartość oferty
 *  („będę wiedział, na co patrzę") i wzmacnia pozycjonowanie na frazy
 *  informacyjne typu „jakie foki są w Bałtyku".
 * ------------------------------------------------------------------------ */
function SealsSection() {
  return (
    <section id="foki" className="border-b border-slate-200 py-14 lg:py-20">
      <div className="container-page">
        <p className="eyebrow">
          <Fish className="h-4 w-4" />
          Mieszkańcy rezerwatu
        </p>
        <h2 className="text-fluid-h2 text-balance">Trzy gatunki fok, które możesz spotkać</h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Foki są dzikimi zwierzętami — nie karmimy ich i nie zbliżamy się bardziej,
          niż pozwalają na to zasady ochrony rezerwatu.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {cfg.seals.map((seal) => (
            <article key={seal.id} className="card p-6">
              <h3 className="text-xl">{seal.name}</h3>
              {/* Nazwa łacińska kursywą — konwencja zapisu w biologii. */}
              <p className="text-sm italic text-slate-500">{seal.latinName}</p>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">{seal.description}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="badge">{seal.sizeLabel}</span>
                <span className="badge">{seal.weightLabel}</span>
              </div>

              <p className="mt-4 rounded-xl bg-sky-50 p-3 text-xs leading-relaxed text-slate-600">
                <span className="font-bold text-slate-900">Ciekawostka: </span>
                {seal.funFact}
              </p>

              <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
                {seal.protectionStatus}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
 *  OPINIE — karty z cytatami
 * ------------------------------------------------------------------------ */
function ReviewsSection() {
  return (
    <section className="border-b border-slate-200 bg-slate-50 py-14 lg:py-20">
      <div className="container-page">
        <p className="eyebrow">
          <Star className="h-4 w-4" />
          Opinie klientów
        </p>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-fluid-h2 text-balance">
            {formatRating(cfg.google.rating)} / 5 w opiniach Google
          </h2>
          <a
            href={cfg.google.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-accent hover:underline"
          >
            Zobacz wszystkie {formatNumber(cfg.google.reviewsCount)} opinii →
          </a>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {cfg.testimonials.map((testimonial) => (
            <figure key={testimonial.id} className="card p-6">
              <div className="flex items-center justify-between">
                {/* Gwiazdki z oceny liczbowej: Array.from tworzy tablicę
                    o zadanej długości, po której da się mapować. */}
                <div className="flex gap-0.5">
                  {Array.from({ length: testimonial.rating }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Quote className="h-5 w-5 text-slate-300" />
              </div>

              <blockquote className="mt-4 leading-relaxed text-slate-700">
                „{testimonial.text}"
              </blockquote>

              <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-200 pt-4">
                {/* Awatar z inicjałów — brak zdjęcia nie psuje układu karty. */}
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                  {testimonial.initials}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{testimonial.author}</p>
                  <p className="text-xs text-slate-500">
                    {testimonial.source} · {testimonial.date}
                  </p>
                </div>
                {testimonial.verified && (
                  <span className="badge ml-auto text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Zweryfikowana
                  </span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
 *  DANE FIRMY I MAPA DOJAZDU
 *  Pełne dane rejestrowe to nie tylko obowiązek informacyjny — to najtańszy
 *  sposób udowodnienia, że po drugiej stronie stoi realna, zarejestrowana firma.
 * ------------------------------------------------------------------------ */
function CompanyAndMapSection() {
  return (
    <section id="kontakt" className="py-14 lg:py-20">
      <div className="container-page">
        <p className="eyebrow">
          <Building2 className="h-4 w-4" />
          Kontakt i dane firmy
        </p>
        <h2 className="text-fluid-h2 text-balance">Jak do nas trafić</h2>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* --- Mapa --------------------------------------------------- */}
          <div className="card overflow-hidden">
            <iframe
              /* loading="lazy" odracza pobranie mapy (~1 MB) do chwili, gdy
               * użytkownik faktycznie do niej doscrolluje. Bez tego mapa
               * psułaby czas ładowania całej strony. */
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={cfg.contact.mapsEmbedUrl}
              title={`Mapa dojazdu — ${cfg.brand.name}`}
              className="h-[340px] w-full border-0 lg:h-full lg:min-h-[460px]"
              allowFullScreen
            />
          </div>

          {/* --- Kolumna z danymi -------------------------------------- */}
          <div className="flex flex-col gap-5">
            {/* Adres i dojazd */}
            <div className="card p-6">
              <h3 className="text-lg">Przystań</h3>
              <p className="mt-2 text-slate-700">
                {cfg.contact.street}
                <br />
                {cfg.contact.postalCode} {cfg.contact.city}, {cfg.contact.region}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                {cfg.contact.directionsHint}
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <a href={cfg.contact.phoneHref} className="btn-primary flex-1 py-3 text-sm">
                  <Phone className="h-4 w-4" />
                  {cfg.contact.phone}
                </a>
                <a
                  href={cfg.contact.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex-1 py-3 text-sm"
                >
                  <Navigation className="h-4 w-4" />
                  Wyznacz trasę
                </a>
              </div>

              <a
                href={`mailto:${cfg.contact.email}`}
                className="mt-4 flex items-center gap-2 text-sm text-slate-600 transition hover:text-accent"
              >
                <Mail className="h-4 w-4" />
                {cfg.contact.email}
              </a>
            </div>

            {/* Godziny */}
            <div className="card p-6">
              <h3 className="text-lg">Godziny rejsów</h3>
              <dl className="mt-3 space-y-1.5 text-sm">
                {cfg.contact.openingHours.map((entry) => (
                  <div key={entry.days} className="flex justify-between gap-4">
                    <dt className="text-slate-600">{entry.days}</dt>
                    <dd className="font-semibold text-slate-900">{entry.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Dane rejestrowe */}
            <div className="card p-6">
              <h3 className="text-lg">Dane firmy</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <LegalRow label="Nazwa" value={cfg.legal.legalName} />
                <LegalRow label="NIP" value={cfg.legal.nip} />
                <LegalRow label="REGON" value={cfg.legal.regon} />
                <LegalRow label="Bank" value={cfg.legal.bankName} />
                {/* break-all zapobiega rozpychaniu karty przez długi numer IBAN
                    na wąskich ekranach — łamie go w dowolnym miejscu. */}
                <LegalRow label="Nr konta" value={cfg.legal.bankAccount} breakAll />
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
 *  STOPKA
 * ------------------------------------------------------------------------ */
function SiteFooter() {
  return (
    /* pb-24 na telefonie robi miejsce dla przyklejonego paska z telefonem,
     * który inaczej zasłoniłby ostatnie linijki stopki. */
    <footer className="border-t border-slate-200 bg-slate-900 pb-24 pt-12 text-slate-300 sm:pb-12">
      <div className="container-page grid gap-8 md:grid-cols-3">
        <div>
          <p className="flex items-center gap-2 text-lg font-extrabold text-white">
            <Anchor className="h-5 w-5 text-accent" />
            {cfg.brand.name}
          </p>
          <p className="mt-2 text-sm text-slate-400">{cfg.brand.tagline}</p>
        </div>

        <div className="text-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Kontakt</p>
          <a href={cfg.contact.phoneHref} className="block transition hover:text-accent">
            {cfg.contact.phone}
          </a>
          <a href={`mailto:${cfg.contact.email}`} className="block transition hover:text-accent">
            {cfg.contact.email}
          </a>
          <p className="mt-2 text-slate-400">
            {cfg.contact.street}, {cfg.contact.postalCode} {cfg.contact.city}
          </p>
        </div>

        <div className="text-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            Dane rejestrowe
          </p>
          <p className="text-slate-400">NIP: {cfg.legal.nip}</p>
          <p className="text-slate-400">REGON: {cfg.legal.regon}</p>
        </div>
      </div>

      {/* PODPIS AGENCJI — stały element każdej realizacji Aios Studio. */}
      <div className="container-page mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row">
        <p>
          © {new Date().getFullYear()} {cfg.brand.name}. Wszelkie prawa zastrzeżone.
        </p>
        <a
          href={cfg.agency.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-slate-400 transition hover:text-accent"
        >
          {cfg.agency.credit}
        </a>
      </div>
    </footer>
  );
}

/* --------------------------------------------------------------------------
 *  PRZYKLEJONY PASEK POŁĄCZENIA (tylko telefon)
 *  Pojedynczy, najważniejszy element konwersji na urządzeniach mobilnych:
 *  przycisk „Zadzwoń" widoczny NIEZALEŻNIE od miejsca, w którym jest
 *  użytkownik. `sm:hidden` ukrywa go na desktopie, gdzie numer i tak
 *  znajduje się w przyklejonym nagłówku.
 * ------------------------------------------------------------------------ */
function MobileCallBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:hidden">
      <a href={cfg.contact.phoneHref} className="btn-primary w-full">
        <Phone className="h-5 w-5" />
        Zadzwoń: {cfg.contact.phone}
      </a>
    </div>
  );
}

/* --------------------------------------------------------------------------
 *  MIKROKOMPONENTY
 * ------------------------------------------------------------------------ */

/**
 * Kafelek faktu z ikoną (czas rejsu / prędkość / liczba miejsc).
 * `ComponentType<{ className?: string }>` opisuje „dowolny komponent
 * przyjmujący className" — pasuje każda ikona lucide-react, a mikrokomponent
 * nie jest przywiązany do tej konkretnej biblioteki.
 */
function FactTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div>
      <Icon className="mx-auto h-5 w-5 text-accent" />
      <dt className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="text-sm font-bold text-slate-900">{value}</dd>
    </div>
  );
}

/** Parametr techniczny na karcie łodzi. */
function SpecCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-sm font-bold text-slate-900">{value}</dd>
    </div>
  );
}

/** Wiersz danych rejestrowych („etykieta → wartość"). */
function LegalRow({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className={`text-right font-semibold text-slate-900 ${breakAll ? 'break-all' : ''}`}>
        {value}
      </dd>
    </div>
  );
}
