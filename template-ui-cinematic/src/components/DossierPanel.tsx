/* ==========================================================================
 *  DossierPanel.tsx — BOCZNY PANEL DOSSIER (Slide-Over Drawer)
 * --------------------------------------------------------------------------
 *  Zastępuje 6 centralnych modali jednym panelem wysuwanym z prawej strony.
 *  Kliknięcie zakładki w headerze otwiera odpowiednią sekcję treści.
 *
 *  ARCHITEKTURA:
 *  - Backdrop (fixed, przyciemnienie lewej części ekranu) — kliknięcie zamyka
 *  - Drawer (fixed right-0, 40–48vw na desktop, pełna szerokość na mobile)
 *  - data-lenis-prevent="true" + stopPropagation na onWheel/onTouchMove dla izolacji scrolla
 *  - AnimatePresence + motion.div: x: '100%' → 0 → '100%'
 *  - Obsługa ESC zamyka panel
 *  - Niezależny wewnętrzny scroll: header i footer przypięte, środek flex-1 overflow-y-auto
 *
 *  Wszystkie dane pochodzą z companyConfig.ts — zero hardkodowanych treści.
 * ========================================================================== */

import { useEffect, useState, useCallback, useMemo } from 'react';
/* `verbatimModuleSyntax: true` w tsconfig wymaga oznaczenia importów samych
 * typów słowem `type` — dzięki temu nie trafiają do finalnej paczki JS. */
import type { ReactNode, FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Phone,
  User,
  Calendar,
  Clock,
  Users,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Star,
  ExternalLink,
} from 'lucide-react';
import { companyConfig as cfg } from '@/config/companyConfig';
import { cn } from '@/lib/cn';
import { osoby, miejsca } from '@/lib/format';

/* --------------------------------------------------------------------------
 *  TYPY
 * ------------------------------------------------------------------------ */

export type DossierTab = 'flota' | 'rezerwat' | 'cennik' | 'opinie' | 'rezerwacja' | null;

interface DossierPanelProps {
  activeTab: DossierTab;
  onClose: () => void;
}

/* --------------------------------------------------------------------------
 *  STAŁE ANIMACJI
 * ------------------------------------------------------------------------ */

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const TAB_TITLES: Record<Exclude<DossierTab, null>, string> = {
  flota: 'FLOTA MOTORÓWEK RIB',
  rezerwat: 'REZERWAT MEWIA ŁACHA',
  cennik: 'CENNIK BILETÓW I CZARTERÓW',
  opinie: 'OPINIE KLIENTÓW',
  rezerwacja: 'REZERWACJA & KONTAKT',
};

/* ==========================================================================
 *  KOMPONENT GŁÓWNY
 * ========================================================================== */

export default function DossierPanel({ activeTab, onClose }: DossierPanelProps) {
  const isOpen = activeTab !== null;

  /* --- Obsługa klawisza ESC --- */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── BACKDROP ── */}
          <motion.div
            key="dossier-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/70 z-[90]"
            onClick={onClose}
          />

          {/* ── DRAWER ── */}
          <motion.aside
            key="dossier-drawer"
            aria-label="Panel informacyjny"
            data-lenis-prevent="true"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: EXPO_OUT }}
            className="fixed top-0 right-0 h-[100dvh] w-full md:w-[48vw] lg:w-[40vw] z-[100] bg-[#080808]/98 backdrop-blur-2xl border-l border-white/20 flex flex-col pointer-events-auto rounded-none shadow-2xl overflow-hidden"
          >
            {/* Nagłówek panelu — stały, nieprzewijalny */}
            <div className="flex-none p-6 md:p-8 border-b border-white/10 flex justify-between items-center gap-4 bg-[#080808]">
              <p className="font-mono text-[10px] sm:text-xs tracking-[0.3em] text-zinc-400 uppercase min-w-0 flex-1 truncate">
                {activeTab && TAB_TITLES[activeTab]}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="font-mono text-[10px] sm:text-xs tracking-[0.2em] text-white hover:text-zinc-400 cursor-pointer transition-colors p-3 -mr-3 flex-shrink-0 whitespace-nowrap"
              >
                ZAMKNIJ [ ✕ ]
              </button>
            </div>

            {/* Przewijalna zawartość panelu z izolacją scrolla */}
            <div
              data-lenis-prevent="true"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="flex-1 overflow-y-auto overscroll-contain p-6 md:p-10 space-y-6 scrollbar-thin scrollbar-thumb-white/20"
            >
              {activeTab === 'flota' && <FlotaContent />}
              {activeTab === 'rezerwat' && <RezerwatContent />}
              {activeTab === 'cennik' && <CennikContent />}
              {activeTab === 'opinie' && <OpinieContent />}
              {activeTab === 'rezerwacja' && <RezerwacjaContent />}
            </div>

            {/* Stopka panelu — stała z przyciskiem CTA */}
            <div className="p-6 md:p-8 border-t border-white/10 bg-[#080808] shrink-0">
              <a
                href={cfg.contact.phoneHref}
                className="w-full inline-flex items-center justify-center gap-2 sm:gap-3 rounded-none border border-white bg-white text-black hover:bg-transparent hover:text-white transition-all px-4 sm:px-6 py-4 font-mono text-[10px] sm:text-xs tracking-[0.2em] uppercase font-bold cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="min-w-0">ZADZWOŃ: {cfg.contact.phone}</span>
              </a>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ==========================================================================
 *  ZAKŁADKA: FLOTA
 * ========================================================================== */

function FlotaContent() {
  return (
    <div className="space-y-8">
      <p className="font-mono text-xs text-zinc-400 leading-relaxed">
        {cfg.boats.length} profesjonalne jednostki morskie przystosowane do ekstremalnych
        prędkości i bezpiecznej obserwacji fauny.
      </p>

      {cfg.boats.map((boat, index) => (
        <article
          key={boat.id}
          className="border border-white/15 bg-black/70 p-6 sm:p-8 rounded-none"
        >
          {/* Nagłówek łodzi */}
          <div className="flex items-baseline justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs tracking-[0.3em] uppercase text-zinc-500">
                [ 0{index + 1} ]
              </span>
              <h3 className="font-['Barlow_Condensed'] uppercase font-bold tracking-tight text-white text-3xl sm:text-4xl">
                {boat.name}
              </h3>
            </div>
            <span className="font-mono text-[10px] tracking-[0.1em] text-zinc-400 uppercase bg-white/5 px-3 py-1 border border-white/10">
              V-MAX: {boat.topSpeedKmh} KM/H
            </span>
          </div>

          {/* Tagline i opis */}
          <p className="font-mono text-xs tracking-[0.2em] text-zinc-400 uppercase mb-2">
            {boat.tagline}
          </p>
          <p className="text-sm leading-relaxed text-zinc-300 mb-6">
            {boat.description}
          </p>

          {/* Parametry techniczne */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="border border-white/10 bg-white/5 p-4">
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-zinc-500 block mb-1">
                Pojemność
              </span>
              <p className="font-mono text-sm font-bold text-white">{boat.capacity} osób</p>
            </div>
            <div className="border border-white/10 bg-white/5 p-4">
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-zinc-500 block mb-1">
                Silnik
              </span>
              <p className="font-mono text-sm font-bold text-white">{boat.enginePower}</p>
            </div>
            <div className="border border-white/10 bg-white/5 p-4">
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-zinc-500 block mb-1">
                Prędkość
              </span>
              <p className="font-mono text-sm font-bold text-white">{boat.topSpeedKmh} km/h</p>
            </div>
          </div>

          {/* Wyróżniki */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-500 mb-3">
              Cechy szczególne
            </p>
            <div className="flex flex-wrap gap-2">
              {boat.highlights.map((h, idx) => (
                <span
                  key={idx}
                  className="font-mono text-xs text-zinc-300 border border-white/10 bg-white/5 px-3 py-1.5 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-white inline-block" />
                  {h}
                </span>
              ))}
            </div>
          </div>
        </article>
      ))}

      <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
        Czas rejsu: ~{cfg.cruise.durationMinutes} min · Max {cfg.cruise.maxPassengers} pasażerów
      </p>
    </div>
  );
}

/* ==========================================================================
 *  ZAKŁADKA: REZERWAT
 * ========================================================================== */

function RezerwatContent() {
  return (
    <div className="space-y-8">
      {/* Intro */}
      <div className="border border-white/15 bg-black/60 p-6 sm:p-8">
        <h3 className="font-['Barlow_Condensed'] uppercase font-bold tracking-tight text-white text-2xl mb-3">
          {cfg.cruise.reserveName || 'REZERWAT MEWIA ŁACHA'}
        </h3>
        <p className="text-sm leading-relaxed text-zinc-300 mb-4">
          {cfg.cruise.routeDescription}
        </p>
        <p className="text-sm leading-relaxed text-zinc-400">
          {cfg.cruise.safetyNote}
        </p>
      </div>

      {/* Gatunki fok */}
      <p className="font-mono text-xs tracking-[0.3em] text-zinc-400 uppercase">
        ATLAS GATUNKÓW FOK
      </p>

      {cfg.seals.map((seal, i) => (
        <article
          key={seal.id}
          className="border border-white/15 bg-black/70 p-6 sm:p-8 rounded-none"
        >
          <div className="flex items-baseline justify-between mb-4">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-500">
                [ SP.{String(i + 1).padStart(2, '0')} ]
              </span>
              <h4 className="font-['Barlow_Condensed'] uppercase font-bold tracking-tight text-white text-2xl sm:text-3xl">
                {seal.name}
              </h4>
            </div>
          </div>

          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-500 mb-3">
            {seal.latinName} / {seal.sizeLabel} / {seal.weightLabel}
          </p>

          <p className="text-sm leading-relaxed text-zinc-300 mb-4">
            {seal.description}
          </p>

          <div className="p-4 border border-white/10 bg-white/5 mb-3">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-400 mb-2">
              Ciekawostka
            </p>
            <p className="text-sm text-zinc-200">{seal.funFact}</p>
          </div>

          <p className="font-mono text-[10px] tracking-[0.1em] text-zinc-500 uppercase">
            Status: {seal.protectionStatus}
          </p>
        </article>
      ))}
    </div>
  );
}

/* ==========================================================================
 *  ZAKŁADKA: CENNIK
 * ========================================================================== */

function CennikContent() {
  return (
    <div className="space-y-8">
      {/* Bilety regularne */}
      <div className="border border-white/15 bg-black/70 p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <span className="font-mono text-xs tracking-[0.25em] uppercase text-zinc-400">
            REJSY REGULARNE
          </span>
          <span className="font-mono text-[10px] tracking-[0.1em] text-zinc-500 uppercase">
            ~{cfg.cruise.durationMinutes} MINUT
          </span>
        </div>

        <div className="divide-y divide-white/10">
          {cfg.tickets.types.map((ticket) => (
            <div key={ticket.id} className="py-4 flex items-baseline justify-between">
              <div>
                <h4 className="font-mono text-sm uppercase font-bold text-white tracking-wider">
                  {ticket.label}
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">{ticket.description}</p>
              </div>
              <div className="text-right">
                <span className="font-['Barlow_Condensed'] text-3xl font-bold text-white tracking-wider">
                  {ticket.price} {cfg.tickets.currency}
                </span>
                <span className="font-mono text-[9px] text-zinc-500 block uppercase">
                  brutto / os.
                </span>
              </div>
            </div>
          ))}

          <div className="py-4 flex items-baseline justify-between">
            <div>
              <h4 className="font-mono text-sm uppercase font-bold text-white tracking-wider">
                Dzieci do 3 lat
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">Pod opieką rodziców</p>
            </div>
            <div className="text-right">
              <span className="font-['Barlow_Condensed'] text-3xl font-bold text-emerald-400 tracking-wider">
                0 PLN
              </span>
              <span className="font-mono text-[9px] text-zinc-500 block uppercase">
                Bezpłatnie
              </span>
            </div>
          </div>
        </div>

        <p className="mt-4 pt-4 border-t border-white/10 font-mono text-[10px] text-zinc-400 leading-relaxed">
          * W cenie: komplet kamizelek asekuracyjnych, opieka certyfikowanego sternika,
          ubezpieczenie NNW.
        </p>
      </div>

      {/* Czarter */}
      <div className="border border-white/15 bg-black/70 p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <span className="font-mono text-xs tracking-[0.25em] uppercase text-zinc-400">
            CZARTER NA WYŁĄCZNOŚĆ
          </span>
          <span className="font-mono text-[10px] tracking-[0.1em] text-zinc-500 uppercase">
            DO {cfg.cruise.maxPassengers} OSÓB
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h4 className="font-mono text-sm uppercase font-bold text-white tracking-wider">
              Wynajem całej łodzi
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Indywidualna godzina wypłynięcia, cała jednostka do dyspozycji
            </p>
          </div>
          <div className="text-right">
            <span className="font-['Barlow_Condensed'] text-3xl font-bold text-white tracking-wider">
              750 {cfg.tickets.currency}
            </span>
            <span className="font-mono text-[9px] text-zinc-500 block uppercase">cała łódź</span>
          </div>
        </div>

        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-3">
          Opcje dodatkowe w czarterze:
        </p>
        <ul className="space-y-1.5 font-mono text-xs text-zinc-300">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-white inline-block" /> Dedykowane postoje fotograficzne
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-white inline-block" /> Rejsy o wschodzie / zachodzie
            słońca
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-white inline-block" /> Obsługa wyjazdów firmowych i
            integracji
          </li>
        </ul>
      </div>

      {/* Regulamin */}
      <div className="border border-white/15 bg-black/60 p-6 sm:p-8">
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-400 mb-4">
          ZASADY REALIZACJI REJSÓW
        </p>
        <div className="space-y-4 font-mono text-xs text-zinc-400">
          <div>
            <span className="font-bold uppercase text-white block mb-1">Punktualność</span>
            <p className="font-sans text-xs text-zinc-400 leading-relaxed">
              Zbiórka na przystani w Mikoszewie na 10 minut przed wyznaczoną godziną wypłynięcia.
            </p>
          </div>
          <div>
            <span className="font-bold uppercase text-white block mb-1">Warunki Pogodowe</span>
            <p className="font-sans text-xs text-zinc-400 leading-relaxed">
              Ostateczną decyzję o wypłynięciu podejmuje sternik na podstawie aktualnego stanu morza
              i wiatru.
            </p>
          </div>
          <div>
            <span className="font-bold uppercase text-white block mb-1">Formy Płatności</span>
            <p className="font-sans text-xs text-zinc-400 leading-relaxed">
              Płatność na miejscu gotówką, BLIK-iem lub kartą. Dla firm wystawiamy faktury VAT
              (stawka 8%).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
 *  ZAKŁADKA: OPINIE
 * ========================================================================== */

function OpinieContent() {
  return (
    <div className="space-y-8">
      {/* Ocena zbiorcza */}
      <div className="border border-white/15 bg-black/70 p-6 sm:p-8 text-center">
        <div className="flex justify-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
          ))}
        </div>
        <p className="font-['Barlow_Condensed'] text-5xl font-bold text-white tracking-wider">
          {cfg.google.rating}/5
        </p>
        <p className="font-mono text-xs tracking-[0.2em] text-zinc-400 uppercase mt-2">
          {cfg.google.reviewsCount} OPINII W GOOGLE
        </p>
      </div>

      {/* Cytaty */}
      {cfg.testimonials.map((review) => (
        <article
          key={review.id}
          className="border border-white/15 bg-black/70 p-6 sm:p-8 rounded-none"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 border border-white/20 bg-white/5 flex items-center justify-center font-mono text-xs font-bold text-white uppercase">
              {review.initials}
            </div>
            <div>
              <p className="font-mono text-sm font-bold text-white">{review.author}</p>
              <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                {review.date} · {review.source}
                {review.verified && ' · Zweryfikowana'}
              </p>
            </div>
          </div>

          <div className="flex gap-0.5 mb-3">
            {Array.from({ length: review.rating }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 text-yellow-500 fill-current" />
            ))}
          </div>

          <p className="text-sm leading-relaxed text-zinc-300 italic">
            &ldquo;{review.text}&rdquo;
          </p>
        </article>
      ))}

      {/* Przycisk "WYSTAW OPINIĘ" */}
      <a
        href={cfg.google.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-flex items-center justify-center gap-3 rounded-none border border-white/30 bg-white/5 hover:bg-white hover:text-black transition-all px-6 py-4 font-mono text-xs tracking-[0.2em] uppercase font-bold text-white cursor-pointer"
      >
        <ExternalLink className="w-4 h-4" />
        <span>WYSTAW OPINIĘ W GOOGLE</span>
      </a>
    </div>
  );
}

/* ==========================================================================
 *  ZAKŁADKA: REZERWACJA — JEDNA PŁYNNIE PRZEWIJANA SEKCJA
 * --------------------------------------------------------------------------
 *  DLACZEGO NIE KREATOR KROKOWY (świadomy rollback)
 *  Podział na cztery ekrany z paskiem postępu wyglądał porządnie, ale zabrał
 *  telefonowi to, w czym jest najlepszy: ciągłe przewijanie kciukiem. Każdy
 *  krok kończył się przyciskiem „DALEJ", więc zamiast jednego ruchu palca
 *  użytkownik wykonywał cztery precyzyjne kliknięcia w cel wielkości palca,
 *  a panel podmieniał zawartość pod ręką. Do tego dochodził koszt ukryty:
 *  nie dało się jednym spojrzeniem sprawdzić, co się właściwie zamawia.
 *
 *  Wracamy do układu, który pasuje do reszty panelu (FLOTA, CENNIK, OPINIE
 *  też są jednym długim zwojem): wszystkie pola widoczne, cztery sekcje
 *  oddzielone linią, jeden przycisk wysyłki na końcu. Zero stanu nawigacji,
 *  zero paska postępu, zero animacji przejść między krokami.
 *
 *  ARCHITEKTURA WYSYŁKI (najważniejszy fragment tego pliku)
 *  Google Apps Script nie obsługuje metody OPTIONS, więc nie da się przejść
 *  przez preflight CORS. Omijamy go dwiema decyzjami, które MUSZĄ wystąpić
 *  razem:
 *    1. `Content-Type: application/x-www-form-urlencoded` — jedna z trzech
 *       wartości, przy których przeglądarka klasyfikuje żądanie jako „proste"
 *       i preflightu w ogóle nie wysyła,
 *    2. `mode: 'no-cors'` — pas bezpieczeństwa: nawet gdyby coś w żądaniu
 *       zdyskwalifikowało je jako proste, przeglądarka i tak je wypuści.
 *
 *  CENA TEGO ROZWIĄZANIA: odpowiedź jest „opaque" — status, nagłówki i treść
 *  są dla nas niewidoczne. `await fetch(...)` kończy się sukcesem także wtedy,
 *  gdy serwer zwrócił 500. Dlatego:
 *    • „sukces" w tym UI znaczy „żądanie opuściło przeglądarkę", nie
 *      „rezerwacja zapisana" — i copy ekranu potwierdzenia mówi dokładnie to,
 *      obiecując potwierdzenie telefoniczne,
 *    • kontrola przepełnienia rejsu jest WYŁĄCZNIE po stronie Apps Script
 *      (patrz `automatyzacje/apps-script/Kod.gs`, status LISTA_REZERWOWA).
 *
 *  Jeżeli kiedyś ten kompromis przestanie wystarczać — przełącz `webhookUrl`
 *  na n8n. Węzeł Webhook wystawia prawdziwe nagłówki CORS, więc wystarczy
 *  usunąć `mode: 'no-cors'` i zacząć czytać `response.json()`.
 *
 *  MIKROEKRAN 320 px — trzy reguły, których tu nie wolno złamać:
 *    • przyciski, CTA i nagłówki sekcji: `flex-shrink-0 whitespace-nowrap`,
 *    • teksty zmienne w siatkach: `min-w-0 truncate` (samo `truncate` NIE
 *      zadziała — domyślne `min-width: auto` elementu flex blokuje zwężenie),
 *    • długie etykiety CTA: dwa `<span>` (`sm:hidden` / `hidden sm:inline`)
 *      zamiast zawijania w środku słowa.
 * ========================================================================== */

/* --------------------------------------------------------------------------
 *  KLASY WSPÓŁDZIELONE
 *  Wyciągnięte ze znaczników, bo powtarzają się kilka razy, a każde ich
 *  wystąpienie musi nieść komplet zabezpieczeń mikroekranu.
 * ------------------------------------------------------------------------ */

const KL_PRZYCISK_GLOWNY =
  'inline-flex w-full flex-shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-none border border-white bg-white px-4 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-black transition-all hover:bg-transparent hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:text-xs';

const KL_PRZYCISK_POBOCZNY =
  'inline-flex w-full flex-shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-none border border-white/30 bg-transparent px-4 py-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white transition-colors hover:border-white disabled:opacity-30 sm:text-xs';

const KL_POLE =
  'w-full appearance-none rounded-none border border-white/20 bg-transparent px-4 py-3 font-mono text-sm text-white transition-colors placeholder:text-zinc-600 focus:border-white focus:outline-none focus:ring-0';

const KL_ETYKIETA =
  'mb-2 flex items-center gap-2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400';

const KL_LICZNIK =
  'flex h-12 w-12 flex-shrink-0 cursor-pointer items-center justify-center rounded-none border border-white/25 font-mono text-xl leading-none text-white transition-colors hover:border-white disabled:cursor-not-allowed disabled:opacity-25';

/* --------------------------------------------------------------------------
 *  NARZĘDZIA
 * ------------------------------------------------------------------------ */

/**
 * Data w formacie `RRRR-MM-DD` w strefie LOKALNEJ użytkownika.
 *
 * ⚠️ Świadomie bez `toISOString().slice(0,10)` — ta metoda zwraca czas UTC,
 * więc dla kogoś w Polsce między 00:00 a 02:00 (czas letni) podałaby datę
 * WCZORAJSZĄ. Skutek: pole daty pozwoliłoby wybrać termin, który backend
 * odrzuci jako przeszły, a przy `no-cors` użytkownik nie zobaczyłby błędu.
 */
function dataISO(przesuniecieDni = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + przesuniecieDni);
  const rok = d.getFullYear();
  const miesiac = String(d.getMonth() + 1).padStart(2, '0');
  const dzien = String(d.getDate()).padStart(2, '0');
  return `${rok}-${miesiac}-${dzien}`;
}

/**
 * Czy dany slot już „przepadł". Sprawdzamy tylko dla dzisiejszej daty —
 * dla dat przyszłych wszystkie godziny są dostępne.
 *
 * Bufor 60 minut: nie ma sensu przyjmować zgłoszenia na rejs, który wypływa
 * za kwadrans. Klient i tak nie zdąży dojechać na przystań, a załoga dostanie
 * telefon, którego nie da się obsłużyć.
 */
function slotMinal(data: string, godzina: string): boolean {
  if (!data || data !== dataISO()) return false;
  const [g, m] = godzina.split(':').map(Number);
  const teraz = new Date();
  return g * 60 + m <= teraz.getHours() * 60 + teraz.getMinutes() + 60;
}

/** Same cyfry — telefon wpisuje się ze spacjami, myślnikami albo z `+48`. */
const sameCyfry = (v: string): string => v.replace(/\D/g, '');

/* --------------------------------------------------------------------------
 *  KOMPONENT GŁÓWNY
 * ------------------------------------------------------------------------ */

function RezerwacjaContent() {
  const rez = cfg.bookingConfig;

  const [status, setStatus] = useState<'idle' | 'wysylka' | 'sukces' | 'blad'>('idle');
  /* Komunikaty walidacji pokazujemy dopiero po pierwszej próbie wysyłki —
   * krzyczenie „uzupełnij pole" na puste pole, którego nikt jeszcze nie
   * dotknął, jest po prostu niegrzeczne. */
  const [proba, setProba] = useState(false);

  const [form, setForm] = useState({
    unitId: rez.units[0]?.id ?? '',
    date: '',
    timeSlot: '',
    seats: rez.defaultSeats,
    name: '',
    phone: '',
  });

  const jednostka = useMemo(
    () => rez.units.find((u) => u.id === form.unitId) ?? rez.units[0],
    [rez.units, form.unitId],
  );

  /* Limit bierzemy z WYBRANEJ jednostki, nie z globalnego maxCapacity —
   * inaczej mniejsza łódź przyjęłaby rezerwację na 12 osób. */
  const limitMiejsc = Math.min(jednostka?.capacity ?? rez.maxCapacity, rez.maxCapacity);

  /**
   * Walidacja całego formularza naraz — bez kroków nie ma czego bramkować
   * po drodze, więc sprawdzamy wszystko w momencie wysyłki i pokazujemy
   * pierwszy napotkany problem razem z podświetleniem winnego pola.
   *
   * Zwraca `null`, gdy komplet jest poprawny.
   */
  const bledy = useMemo(() => {
    const lista: { pole: 'date' | 'timeSlot' | 'seats' | 'name' | 'phone'; tekst: string }[] = [];

    if (!form.date) {
      lista.push({ pole: 'date', tekst: 'Wybierz datę rejsu.' });
    } else if (form.date < dataISO()) {
      /* Porównanie STRINGÓW jest tu poprawne i celowe: format RRRR-MM-DD
       * układa się chronologicznie także alfabetycznie, więc nie trzeba
       * parsować dat ani martwić się o strefy czasowe. */
      lista.push({ pole: 'date', tekst: 'Ta data już minęła.' });
    } else if (form.date > dataISO(rez.bookingHorizonDays)) {
      lista.push({ pole: 'date', tekst: `Rezerwujemy najdalej ${rez.bookingHorizonDays} dni w przód.` });
    }

    if (!form.timeSlot) {
      lista.push({ pole: 'timeSlot', tekst: 'Wybierz godzinę wypłynięcia.' });
    } else if (slotMinal(form.date, form.timeSlot)) {
      lista.push({ pole: 'timeSlot', tekst: 'Ta godzina już minęła.' });
    }

    if (form.seats < 1 || form.seats > limitMiejsc) {
      lista.push({ pole: 'seats', tekst: `Ta jednostka zabiera maksymalnie ${osoby(limitMiejsc)}.` });
    }

    if (form.name.trim().length < 3) {
      lista.push({ pole: 'name', tekst: 'Podaj imię i nazwisko (min. 3 znaki).' });
    }

    if (sameCyfry(form.phone).length < 9) {
      lista.push({ pole: 'phone', tekst: 'Numer telefonu: minimum 9 cyfr.' });
    }

    return lista;
  }, [form, limitMiejsc, rez.bookingHorizonDays]);

  /** Czy dane pole ma błąd — steruje obramowaniem i atrybutem aria-invalid. */
  const zleUzupelnione = (pole: string): boolean => proba && bledy.some((b) => b.pole === pole);

  const zmienMiejsca = useCallback(
    (delta: number) => {
      setForm((p) => ({ ...p, seats: Math.max(1, Math.min(limitMiejsc, p.seats + delta)) }));
    },
    [limitMiejsc],
  );

  /* ------------------------------------------------------------------------
   *  WYSYŁKA — patrz nagłówek pliku po pełne uzasadnienie trybu no-cors
   * ---------------------------------------------------------------------- */
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (status === 'wysylka') return;

      if (bledy.length > 0) {
        setProba(true);
        return;
      }

      setStatus('wysylka');

      /*
       * URLSearchParams robi trzy rzeczy naraz:
       *  • koduje procentowo znaki spoza ASCII (polskie znaki w nazwisku),
       *  • escapuje `&` i `=` w wartościach, więc nie da się rozbić payloadu,
       *  • `toString()` daje dokładnie format oczekiwany przez `e.parameter`
       *    w Apps Script. Ręczne sklejanie stringa potrafiłoby wysłać
       *    „Anna & Piotr" jako dwa osobne parametry.
       */
      const payload = new URLSearchParams();
      payload.set('unitType', jednostka?.name ?? '');
      payload.set('date', form.date);
      payload.set('timeSlot', form.timeSlot);
      payload.set('seatsCount', String(form.seats));
      payload.set('clientName', form.name.trim());
      payload.set('clientPhone', sameCyfry(form.phone));

      /* Bez limitu czasu zawieszone żądanie zostawia spinner na zawsze.
       * 15 s to z zapasem więcej niż zimny start Apps Script (~2–4 s). */
      const kontroler = new AbortController();
      const licznik = window.setTimeout(() => kontroler.abort(), 15000);

      try {
        await fetch(rez.webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: payload.toString(),
          signal: kontroler.signal,
        });
        setStatus('sukces');
      } catch (err) {
        /* Tu trafiamy TYLKO przy awarii sieci albo przekroczeniu limitu czasu.
         * Błąd 500 po stronie serwera przejdzie jako „sukces" — to wpisana
         * w tryb no-cors ślepota, którą rekompensuje telefoniczne
         * potwierdzenie rezerwacji. */
        console.error('Wysyłka rezerwacji nieudana:', err);
        setStatus('blad');
      } finally {
        window.clearTimeout(licznik);
      }
    },
    [bledy, form, jednostka, rez.webhookUrl, status],
  );

  const resetuj = useCallback(() => {
    setStatus('idle');
    setProba(false);
    setForm({
      unitId: rez.units[0]?.id ?? '',
      date: '',
      timeSlot: '',
      seats: rez.defaultSeats,
      name: '',
      phone: '',
    });
  }, [rez.units, rez.defaultSeats]);

  /* --- EKRAN POTWIERDZENIA (zastępuje cały formularz) --- */
  if (status === 'sukces') {
    return (
      <EkranPotwierdzenia
        jednostka={jednostka?.name ?? ''}
        termin={`${form.date} · ${form.timeSlot}`}
        miejsca={form.seats}
        telefon={form.phone}
        onNowa={resetuj}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-10">
      <p className="text-xs leading-relaxed text-zinc-400">
        Rezerwacja w jednym przewinięciu: wybierz jednostkę, termin i liczbę miejsc,
        zostaw numer — oddzwaniamy z potwierdzeniem. Bez przedpłat.
      </p>

      {/* ── 01 · JEDNOSTKA ─────────────────────────────────────────────── */}
      <Sekcja indeks="01" tytul="JEDNOSTKA">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rez.units.map((u) => {
            const aktywny = u.id === form.unitId;
            return (
              <button
                key={u.id}
                type="button"
                aria-pressed={aktywny}
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    unitId: u.id,
                    // Zmiana jednostki może obniżyć limit — przycinamy licznik,
                    // żeby nie zostać z 12 miejscami na 8-osobowej łodzi.
                    seats: Math.min(p.seats, u.capacity),
                  }))
                }
                className={cn(
                  'min-w-0 cursor-pointer rounded-none border p-4 text-left transition-colors',
                  aktywny
                    ? 'border-white bg-white text-black'
                    : 'border-white/20 bg-transparent text-white hover:border-white/60',
                )}
              >
                <span className="block truncate font-mono text-[11px] font-bold uppercase tracking-[0.15em] sm:text-sm">
                  {u.name}
                </span>
                <span
                  className={cn(
                    'mt-2 block truncate text-[11px]',
                    aktywny ? 'text-zinc-700' : 'text-zinc-400',
                  )}
                  title={u.desc}
                >
                  {u.desc}
                </span>
                <span
                  className={cn(
                    'mt-3 block whitespace-nowrap font-mono text-[10px] tracking-[0.2em]',
                    aktywny ? 'text-zinc-600' : 'text-zinc-500',
                  )}
                >
                  MAX {osoby(u.capacity).toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      </Sekcja>

      {/* ── 02 · TERMIN ────────────────────────────────────────────────── */}
      <Sekcja indeks="02" tytul="TERMIN REJSU">
        <div className="space-y-6">
          <div>
            <label htmlFor="rez-data" className={KL_ETYKIETA}>
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="min-w-0 truncate">Data</span>
            </label>
            <input
              id="rez-data"
              type="date"
              value={form.date}
              /* `min`/`max` wygaszają w natywnym kalendarzu terminy, których
                 backend i tak by nie przyjął — użytkownik nie zdąży się pomylić. */
              min={dataISO()}
              max={dataISO(rez.bookingHorizonDays)}
              aria-invalid={zleUzupelnione('date')}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value, timeSlot: '' }))}
              className={cn(
                KL_POLE,
                'cursor-pointer [color-scheme:dark]',
                zleUzupelnione('date') && 'border-white',
              )}
            />
          </div>

          <div>
            <label className={KL_ETYKIETA}>
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="min-w-0 truncate">Godzina wypłynięcia</span>
            </label>

            {/* Siatka flex: `flex-wrap` zawija wiersz, `flex-shrink-0` na
                kafelkach pilnuje, żeby godzina nigdy się nie ścisnęła. */}
            <div className="flex flex-wrap gap-2">
              {rez.timeSlots.map((slot) => {
                const zablokowany = !form.date || slotMinal(form.date, slot);
                const aktywny = form.timeSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={zablokowany}
                    aria-pressed={aktywny}
                    onClick={() => setForm((p) => ({ ...p, timeSlot: slot }))}
                    className={cn(
                      'flex-shrink-0 whitespace-nowrap rounded-none border px-3 py-2 font-mono text-xs tabular-nums transition-colors',
                      aktywny
                        ? 'border-white bg-white font-bold text-black'
                        : 'cursor-pointer border-white/20 text-white hover:border-white/60',
                      zablokowany &&
                        'cursor-not-allowed border-white/10 text-zinc-600 line-through hover:border-white/10',
                    )}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>

            <p className="mt-3 font-mono text-[10px] leading-relaxed tracking-[0.1em] text-zinc-500">
              {!form.date
                ? '↑ Najpierw wybierz datę — dopiero wtedy poznamy wolne godziny.'
                : 'Przekreślone godziny na dziś już minęły (potrzebujesz min. godziny na dojazd).'}
            </p>
          </div>
        </div>
      </Sekcja>

      {/* ── 03 · MIEJSCA ───────────────────────────────────────────────── */}
      <Sekcja indeks="03" tytul="LICZBA MIEJSC">
        <div className="space-y-5">
          <label className={KL_ETYKIETA}>
            <Users className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="min-w-0 truncate">Pasażerowie</span>
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => zmienMiejsca(-1)}
              disabled={form.seats <= 1}
              aria-label="Zmniejsz liczbę miejsc"
              className={KL_LICZNIK}
            >
              −
            </button>

            <output
              aria-live="polite"
              className="flex h-12 min-w-[3.5rem] flex-shrink-0 items-center justify-center font-['Barlow_Condensed'] text-4xl font-bold leading-none tabular-nums text-white"
            >
              {form.seats}
            </output>

            <button
              type="button"
              onClick={() => zmienMiejsca(1)}
              disabled={form.seats >= limitMiejsc}
              aria-label="Zwiększ liczbę miejsc"
              className={KL_LICZNIK}
            >
              +
            </button>

            <span className="min-w-0 flex-1 truncate text-right font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              limit {osoby(limitMiejsc)}
            </span>
          </div>

          {/* Pasek obłożenia — wizualnie tłumaczy, czym jest próg startu. */}
          <div className="flex h-1.5 w-full gap-[2px]" aria-hidden="true">
            {Array.from({ length: limitMiejsc }, (_, i) => (
              <span
                key={i}
                className={cn(
                  'min-w-0 flex-1',
                  i < form.seats
                    ? 'bg-white'
                    : i < rez.minPassengersForCruise
                      ? 'bg-white/25'
                      : 'bg-white/10',
                )}
              />
            ))}
          </div>

          {/* Polska odmiana przez liczbę ma TRZY formy, nie dwie — helper
              `osoby`/`miejsca` z lib/format.ts pilnuje, żeby nie wyszło
              „4 miejsc" ani „1 osób". */}
          <p className="font-mono text-[10px] leading-relaxed tracking-[0.1em] text-zinc-500">
            {form.seats >= rez.minPassengersForCruise
              ? `Komplet — ${osoby(form.seats)} wystarczy, żeby rejs wypłynął bez łączenia z inną grupą.`
              : `Rejs startuje od ${osoby(rez.minPassengersForCruise)}. Do kompletu: ${miejsca(rez.minPassengersForCruise - form.seats)}. Dobieramy je ze zgłoszeń na ten sam termin — dlatego rezerwację potwierdzamy telefonicznie.`}
          </p>
        </div>
      </Sekcja>

      {/* ── 04 · KONTAKT ───────────────────────────────────────────────── */}
      <Sekcja indeks="04" tytul="DANE KONTAKTOWE">
        <div className="space-y-5">
          <div>
            <label htmlFor="rez-imie" className={KL_ETYKIETA}>
              <User className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="min-w-0 truncate">Imię i nazwisko</span>
            </label>
            <input
              id="rez-imie"
              type="text"
              autoComplete="name"
              value={form.name}
              aria-invalid={zleUzupelnione('name')}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="np. Jan Kowalski"
              className={cn(KL_POLE, zleUzupelnione('name') && 'border-white')}
            />
          </div>

          <div>
            <label htmlFor="rez-telefon" className={KL_ETYKIETA}>
              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="min-w-0 truncate">Numer telefonu</span>
            </label>
            <input
              id="rez-telefon"
              type="tel"
              /* `inputMode="tel"` otwiera na telefonie klawiaturę numeryczną,
                 ale nie blokuje wklejenia numeru ze spacjami czy `+48`. */
              inputMode="tel"
              autoComplete="tel"
              value={form.phone}
              aria-invalid={zleUzupelnione('phone')}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="np. 509 562 635"
              className={cn(KL_POLE, zleUzupelnione('phone') && 'border-white')}
            />
            <p className="mt-2 font-mono text-[10px] tracking-[0.1em] text-zinc-500">
              Na ten numer oddzwaniamy z potwierdzeniem — to jedyny sposób,
              w jaki domykamy rezerwację.
            </p>
          </div>
        </div>
      </Sekcja>

      {/* ── PODSUMOWANIE ───────────────────────────────────────────────── */}
      <div className="border-t border-white/10 pt-8">
        {/* Każda komórka ma `min-w-0 truncate` — długa nazwa jednostki
            nie rozepchnie siatki na mikroekranie. */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border border-white/10 bg-white/5 p-4">
          <PolePodsumowania etykieta="Jednostka" wartosc={jednostka?.name ?? '—'} />
          <PolePodsumowania
            etykieta="Termin"
            wartosc={form.date && form.timeSlot ? `${form.date} · ${form.timeSlot}` : '—'}
          />
          <PolePodsumowania etykieta="Miejsca" wartosc={`${form.seats}`} />
          <PolePodsumowania etykieta="Płatność" wartosc="na przystani" />
        </dl>
      </div>

      {/* ── KOMUNIKATY ─────────────────────────────────────────────────── */}
      {proba && bledy.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-3 border border-white/40 bg-white/5 p-4 font-mono text-xs text-white"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span className="min-w-0">{bledy[0]?.tekst}</span>
        </div>
      )}

      {status === 'blad' && (
        <div
          role="alert"
          className="flex items-start gap-3 border border-white/40 bg-white/5 p-4 font-mono text-xs text-white"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span className="min-w-0">
            Zgłoszenie nie wyszło — sprawdź połączenie i spróbuj ponownie.
            Zawsze możesz zadzwonić: {cfg.contact.phone}.
          </span>
        </div>
      )}

      {/* ── WYSYŁKA ────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <button type="submit" disabled={status === 'wysylka'} className={KL_PRZYCISK_GLOWNY}>
          {status === 'wysylka' ? (
            <>
              <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
              <span>WYSYŁAM…</span>
            </>
          ) : (
            <>
              {/* Dwa warianty etykiety zamiast jednej łamiącej się w środku
                  słowa: pełny tekst nie mieści się w 272 px panelu. */}
              <span className="sm:hidden">WYŚLIJ ZGŁOSZENIE</span>
              <span className="hidden sm:inline">WYŚLIJ ZAPYTANIE O REJS</span>
            </>
          )}
        </button>

        <p className="font-mono text-[10px] leading-relaxed tracking-[0.1em] text-zinc-500">
          {rez.paymentNote}
        </p>
        <p className="text-[10px] leading-relaxed text-zinc-600">{rez.privacyNote}</p>
      </div>
    </form>
  );
}

/* --------------------------------------------------------------------------
 *  PODKOMPONENTY
 * ------------------------------------------------------------------------ */

/**
 * Sekcja formularza — linia, indeks porządkowy i tytuł.
 *
 * To NIE jest krok kreatora: numer jest wyłącznie typograficzny (tak samo jak
 * `[ 01 ]` przy łodziach w zakładce FLOTA) i niczego nie bramkuje. Wszystkie
 * sekcje są widoczne naraz i przewijają się jednym ruchem.
 */
function Sekcja({
  indeks,
  tytul,
  children,
}: {
  indeks: string;
  tytul: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-white/10 pt-8 first:border-t-0 first:pt-0">
      <div className="mb-6 flex items-baseline gap-3">
        <span className="flex-shrink-0 whitespace-nowrap font-mono text-[10px] tracking-[0.3em] text-zinc-600">
          [ {indeks} ]
        </span>
        <h4 className="min-w-0 flex-1 truncate whitespace-nowrap font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-white">
          {tytul}
        </h4>
      </div>
      {children}
    </section>
  );
}

/** Jedna pozycja podsumowania: etykieta nad wartością, obie ucinane. */
function PolePodsumowania({ etykieta, wartosc }: { etykieta: string; wartosc: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
        {etykieta}
      </dt>
      <dd className="mt-1 truncate font-mono text-xs text-white" title={wartosc}>
        {wartosc}
      </dd>
    </div>
  );
}

/**
 * Ekran potwierdzenia — zastępuje formularz w całości.
 *
 * Copy jest tu celowo ostrożne. Tryb `no-cors` nie pozwala potwierdzić, że
 * wiersz naprawdę wylądował w arkuszu, więc obiecujemy dokładnie tyle, ile
 * wiemy na pewno: zgłoszenie poszło, a wiążące potwierdzenie przyjdzie
 * telefonicznie. Napisanie tu „Rezerwacja potwierdzona" byłoby kłamstwem,
 * które wraca do klienta na przystani.
 */
function EkranPotwierdzenia({
  jednostka,
  termin,
  miejsca: liczbaMiejsc,
  telefon,
  onNowa,
}: {
  jednostka: string;
  termin: string;
  miejsca: number;
  telefon: string;
  onNowa: () => void;
}) {
  return (
    <div className="border border-white/15 bg-black/80 px-5 py-12 text-center sm:px-10 sm:py-16">
      <div
        className="mx-auto mb-8 flex h-14 w-14 flex-shrink-0 items-center justify-center border border-white/30"
        aria-hidden="true"
      >
        <CheckCircle2 className="h-7 w-7 text-white" />
      </div>

      {/*
        Nagłówek rozbity na dwa wiersze CELOWO. „ZGŁOSZENIE PRZYJĘTE" w jednej
        linii z `whitespace-nowrap` ma przy 36 px ~274 px szerokości i wychodzi
        poza 232 px dostępne na ekranie 320 px. Dwa osobne `<span>`, każdy
        z własnym `whitespace-nowrap`, dają ten sam efekt typograficzny
        i zerowe ryzyko poziomego scrolla.
      */}
      <h4 className="mt-4 font-['Barlow_Condensed'] text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
        <span className="block flex-shrink-0 whitespace-nowrap">ZGŁOSZENIE</span>
        <span className="block flex-shrink-0 whitespace-nowrap">PRZYJĘTE</span>
      </h4>

      <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-zinc-400">
        {cfg.bookingConfig.successNote}
      </p>

      <dl className="mx-auto mt-10 grid max-w-sm grid-cols-2 gap-x-4 gap-y-4 border-y border-white/10 py-6 text-left">
        <PolePodsumowania etykieta="Jednostka" wartosc={jednostka} />
        <PolePodsumowania etykieta="Termin" wartosc={termin} />
        <PolePodsumowania etykieta="Miejsca" wartosc={`${liczbaMiejsc}`} />
        <PolePodsumowania etykieta="Oddzwonimy na" wartosc={telefon} />
      </dl>

      <a href={cfg.contact.phoneHref} className={cn(KL_PRZYCISK_GLOWNY, 'mt-10')}>
        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
        <span>NIE CZEKAJ — ZADZWOŃ</span>
      </a>

      <button type="button" onClick={onNowa} className={cn(KL_PRZYCISK_POBOCZNY, 'mt-3')}>
        <span>ZGŁOŚ KOLEJNY REJS</span>
      </button>
    </div>
  );
}
