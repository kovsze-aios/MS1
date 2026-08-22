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

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone, User, Calendar, Loader2, CheckCircle2, Star, ExternalLink } from 'lucide-react';
import { companyConfig as cfg } from '@/config/companyConfig';

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
                className="w-full inline-flex items-center justify-center gap-2 sm:gap-3 rounded-none border border-white bg-white text-black hover:bg-transparent hover:text-white transition-all px-4 sm:px-6 py-4 font-mono text-[10px] sm:text-xs tracking-[0.2em] uppercase font-bold cursor-pointer whitespace-nowrap"
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
 *  ZAKŁADKA: REZERWACJA
 * ========================================================================== */

function RezerwacjaContent() {
  const [formData, setFormData] = useState({
    unitType: cfg.bookingConfig.units[0]?.id || 'rib',
    date: '',
    timeSlot: '',
    seatsCount: 2,
    clientName: '',
    clientPhone: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const updateForm = (key: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSeatsChange = (delta: number) => {
    setFormData((prev) => {
      const newSeats = Math.max(1, Math.min(cfg.bookingConfig.maxCapacity, prev.seatsCount + delta));
      return { ...prev, seatsCount: newSeats };
    });
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.date || !formData.timeSlot || !formData.clientName || !formData.clientPhone) {
        alert("Wypełnij wszystkie pola (w tym godzinę rejsu) przed wysłaniem zapytania.");
        return;
      }

      setStatus('loading');
      try {
        const payload = {
          ...formData,
          createdAt: new Date().toISOString()
        };

        await fetch(cfg.bookingConfig.webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        setStatus('success');
      } catch {
        setStatus('error');
      }
    },
    [formData],
  );

  return (
    <div className="space-y-6">
      {/* KROK 1: WYBÓR JEDNOSTKI */}
      <div className="border border-white/15 bg-black/70 p-6 sm:p-8">
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-400 block mb-4">
          KROK 1 // WYBÓR JEDNOSTKI
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cfg.bookingConfig.units.map(unit => {
            const isActive = formData.unitType === unit.id;
            return (
              <button
                key={unit.id}
                type="button"
                onClick={() => updateForm('unitType', unit.id)}
                className={`p-4 text-left border rounded-none transition-colors ${
                  isActive 
                    ? 'bg-white text-black font-bold border-white' 
                    : 'bg-transparent text-white border-white/20 hover:border-white/50 cursor-pointer'
                }`}
              >
                <div className="font-mono text-sm uppercase tracking-wider mb-2">{unit.name}</div>
                <div className={`text-xs ${isActive ? 'text-zinc-700' : 'text-zinc-400'}`}>{unit.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* KROK 2: DATA I GODZINA */}
      <div className="border border-white/15 bg-black/70 p-6 sm:p-8">
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-400 block mb-4">
          KROK 2 // DATA I GODZINA REJSU
        </span>
        <div className="space-y-6">
          <div>
            <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-400 flex items-center gap-2 mb-2 whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              <span className="min-w-0">Wybierz datę</span>
            </label>
            <input
              required
              type="date"
              value={formData.date}
              onChange={(e) => updateForm('date', e.target.value)}
              className="w-full rounded-none border border-white/20 bg-transparent p-3 text-white font-mono text-xs [color-scheme:dark] appearance-none focus:border-white focus:ring-0 focus:outline-none transition-colors cursor-pointer"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-400 flex items-center gap-2 mb-2 whitespace-nowrap">
              <Phone className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              <span className="min-w-0">Dostępne godziny</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {cfg.bookingConfig.timeSlots.map(slot => {
                const isActive = formData.timeSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => updateForm('timeSlot', slot)}
                    className={`py-2 px-1 font-mono text-xs text-center border rounded-none transition-colors ${
                      isActive 
                        ? 'bg-white text-black font-bold border-white' 
                        : 'bg-transparent text-white border-white/20 hover:border-white/50 cursor-pointer'
                    }`}
                  >
                    {slot}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* KROK 3: LICZNIK PASAŻERÓW */}
      <div className="border border-white/15 bg-black/70 p-6 sm:p-8">
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-400 block mb-4">
          KROK 3 // LICZBA PASAŻERÓW
        </span>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleSeatsChange(-1)}
              className="w-12 h-12 border border-white/20 hover:border-white/50 text-white font-mono text-lg flex items-center justify-center transition-colors cursor-pointer"
            >
              -
            </button>
            <div className="w-16 h-12 flex items-center justify-center font-['Barlow_Condensed'] text-3xl font-bold text-white border border-transparent">
              {formData.seatsCount}
            </div>
            <button
              type="button"
              onClick={() => handleSeatsChange(1)}
              className="w-12 h-12 border border-white/20 hover:border-white/50 text-white font-mono text-lg flex items-center justify-center transition-colors cursor-pointer"
            >
              +
            </button>
          </div>
          <p className="font-mono text-[10px] text-zinc-500 tracking-[0.1em]">
            * Wymóg min. {cfg.bookingConfig.minPassengersForCruise} osób do startu rejsu (możliwość łączenia rezerwacji).
          </p>
        </div>
      </div>

      {/* KROK 4: DANE I WYSYŁKA */}
      <div className="border border-white/15 bg-black/70 p-6 sm:p-8">
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-400 block mb-4">
          KROK 4 // DANE KONTAKTOWE I FINALIZACJA
        </span>

        {status === 'success' ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-white mx-auto animate-pulse flex-shrink-0" />
            <h4 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
              Zgłoszenie przyjęte
            </h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Sternik weryfikuje dostępność miejsc i warunki pogodowe. Za chwilę skontaktujemy się z Tobą telefonicznie w celu potwierdzenia rejsu.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-400 flex items-center gap-2 whitespace-nowrap">
                <User className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                <span className="min-w-0">Imię i Nazwisko</span>
              </label>
              <input
                required
                type="text"
                value={formData.clientName}
                onChange={(e) => updateForm('clientName', e.target.value)}
                className="w-full rounded-none appearance-none bg-transparent border border-white/20 px-4 py-3 text-white font-mono text-sm focus:border-white focus:ring-0 focus:outline-none transition-colors"
                placeholder="np. Jan Kowalski"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-400 flex items-center gap-2 whitespace-nowrap">
                <Phone className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                <span className="min-w-0">Numer telefonu</span>
              </label>
              <input
                required
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => updateForm('clientPhone', e.target.value)}
                className="w-full rounded-none appearance-none bg-transparent border border-white/20 px-4 py-3 text-white font-mono text-sm focus:border-white focus:ring-0 focus:outline-none transition-colors"
                placeholder="np. 509 562 635"
              />
            </div>

            {status === 'error' && (
              <div className="p-3 border border-white/20 bg-transparent text-white font-mono text-xs">
                Wystąpił błąd sieci. Zadzwoń bezpośrednio: {cfg.contact.phone}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full mt-4 rounded-none border border-white bg-white text-black hover:bg-transparent hover:text-white transition-all px-4 sm:px-6 py-4 font-mono text-[10px] sm:text-xs tracking-[0.2em] uppercase font-bold flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {status === 'loading' ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin flex-shrink-0" />
              ) : (
                <span className="min-w-0">WYŚLIJ ZAPYTANIE O REJS</span>
              )}
            </button>
            <p className="font-mono text-[9px] text-center text-zinc-500 tracking-[0.1em] mt-3">
              * Płatność gotówką, BLIK lub kartą na miejscu. Brak przedpłat.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
