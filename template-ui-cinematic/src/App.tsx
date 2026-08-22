/* ==========================================================================
 *  App.tsx — MONOCHROME EDITORIAL BRUTALISM v2
 * --------------------------------------------------------------------------
 *  ARCHITEKTURA:
 *  Fizyczny scroll (4 sekcje × 100vh) z kinowym reveal typografii (whileInView).
 *  Wideo tła: fixed, sterowane scroll-scrubbingiem w requestAnimationFrame.
 *  Szczegółowe dane → wysuwany boczny Panel Dossier (zamiast centralnych modali).
 *
 *  PALETA: #050505 / #080808 / biały / zinc-300/400/500/600 — zero koloru.
 *  TYPOGRAFIA: Barlow Condensed (nagłówki), system mono (etykiety).
 * ========================================================================== */

import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone } from 'lucide-react';

import { companyConfig as cfg } from '@/config/companyConfig';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import DossierPanel from '@/components/DossierPanel';
import type { DossierTab } from '@/components/DossierPanel';
import CookieBanner from '@/components/CookieBanner';

/* --------------------------------------------------------------------------
 *  STAŁE ANIMACJI
 * ------------------------------------------------------------------------ */

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const UI_FALLBACK_TIMEOUT_MS = 2000;
const FALLBACK_DURATION_S = 7.0;

/** Wspólna konfiguracja animacji whileInView dla sekcji treści. */
const SECTION_REVEAL = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { amount: 0.4 as const },
  transition: { duration: 0.9, ease: EXPO_OUT },
};

/* ==========================================================================
 *  KOMPONENT GŁÓWNY
 * ========================================================================== */

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [activeTab, setActiveTab] = useState<DossierTab>(null);

  const lenisRef = useSmoothScroll();

  /* ====================================================================
   *  SILNIK SCROLL-SCRUBBINGU WIDEO (60 FPS)
   * ==================================================================== */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Wymuszenie załadowania bufora (iOS/Safari quirk)
    if (videoRef.current) videoRef.current.load();
    video.pause();

    let targetTime = 0;
    let currentTime = 0;
    let animationFrameId: number;

    let maxScroll = 0;
    const recalcMaxScroll = () => {
      maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    };
    recalcMaxScroll();

    window.addEventListener('resize', recalcMaxScroll);
    const resizeObserver = new ResizeObserver(recalcMaxScroll);
    resizeObserver.observe(document.body);

    const renderLoop = (time: number) => {
      lenisRef.current?.raf(time);

      const scrollY = window.scrollY;

      if (maxScroll > 0) {
        const progress = Math.max(0, Math.min(scrollY / maxScroll, 1));
        const duration =
          video.duration && !isNaN(video.duration) ? video.duration : FALLBACK_DURATION_S;
        targetTime = progress * duration;
      }

      // Lerp wideo
      currentTime += (targetTime - currentTime) * 0.1;
      if (video.readyState >= 2 && Math.abs(video.currentTime - currentTime) > 0.03) {
        video.currentTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    let firstFrameForced = false;
    const handleLoaded = () => {
      video.pause();
      if (!firstFrameForced) {
        video.currentTime = 0.01;
        firstFrameForced = true;
      }
      setVideoReady(true);
    };

    video.addEventListener('loadedmetadata', handleLoaded);
    video.addEventListener('loadeddata', handleLoaded);
    video.addEventListener('canplay', handleLoaded);
    video.addEventListener('canplaythrough', handleLoaded);

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      video.removeEventListener('loadedmetadata', handleLoaded);
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('canplay', handleLoaded);
      video.removeEventListener('canplaythrough', handleLoaded);
      window.removeEventListener('resize', recalcMaxScroll);
      resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lenisRef]);

  // Fallback timer — wymuś widoczność UI nawet jeśli wideo nie chce się załadować
  useEffect(() => {
    const timer = window.setTimeout(() => setVideoReady(true), UI_FALLBACK_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  /* ====================================================================
   *  ZATRZYMANIE I WZNOWIENIE SILNIKA LENIS PRZY OTWARTYM PANELU DOSSIER
   * ==================================================================== */
  useEffect(() => {
    if (activeTab) {
      lenisRef.current?.stop();
      document.body.style.overflow = 'hidden';
    } else {
      lenisRef.current?.start();
      document.body.style.overflow = '';
    }
    return () => {
      lenisRef.current?.start();
      document.body.style.overflow = '';
    };
  }, [activeTab, lenisRef]);

  const openTab = useCallback((tab: DossierTab) => setActiveTab(tab), []);
  const closePanel = useCallback(() => setActiveTab(null), []);

  return (
    <div className="relative w-full bg-[#050505] text-white selection:bg-white selection:text-black font-sans antialiased overflow-x-hidden">
      {/* ================================================================
       *  WARSTWA 0 — PEŁNOEKRANOWE WIDEO TŁA
       * ================================================================ */}
      <video
        ref={videoRef}
        src={cfg.media.heroVideoUrl}
        poster={cfg.media.heroVideoPoster}
        playsInline
        autoPlay
        muted
        loop
        preload="auto"
        className="fixed inset-0 w-screen h-[100dvh] object-cover object-[75%_center] md:object-center scale-[1.15] pointer-events-none z-0"
      />

      {/* Warstwa przyciemniająca */}
      <div
        className="fixed inset-0 w-screen h-[100dvh] bg-black/55 pointer-events-none z-[1]"
        aria-hidden="true"
      />

      {/* ================================================================
       *  EKRAN ŁADOWANIA
       * ================================================================ */}
      <AnimatePresence>
        {!videoReady && (
          <motion.div
            key="loader"
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#050505]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EXPO_OUT }}
          >
            <div className="h-3 w-3 rounded-none bg-white animate-pulse" />
            <p className="mt-6 font-mono text-xs tracking-[0.4em] uppercase text-white">
              {cfg.brand.name}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================
       *  GÓRNY PASEK NAWIGACJI
       * ================================================================ */}
      <header className="fixed top-0 left-0 w-full z-50 bg-black/85 backdrop-blur-md border-b border-white/20 px-8 py-5 flex justify-between items-center rounded-none">
        <button
          type="button"
          aria-label="Strona główna"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="font-mono text-sm sm:text-base tracking-[0.25em] font-bold text-white uppercase cursor-pointer hover:text-zinc-300 transition-colors"
        >
          <span className="hidden sm:inline">{cfg.brand.name}</span>
          <span className="sm:hidden">{cfg.brand.shortName}</span>
        </button>

        <nav className="flex items-center gap-3 sm:gap-6 md:gap-8">
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {(
              [
                ['flota', 'FLOTA'],
                ['rezerwat', 'REZERWAT'],
                ['cennik', 'CENNIK'],
                ['opinie', 'OPINIE'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => openTab(key)}
                className="font-mono text-xs tracking-[0.2em] text-zinc-300 hover:text-white cursor-pointer px-4 py-2 uppercase transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => openTab('rezerwacja')}
            className="rounded-none border border-white/40 hover:bg-white hover:text-black transition-all px-6 py-2.5 font-mono text-xs tracking-[0.2em] uppercase font-semibold cursor-pointer"
          >
            REZERWACJA
          </button>
        </nav>
      </header>

      {/* ================================================================
       *  GŁÓWNY KONTENER — 4 FIZYCZNE SEKCJE 100vh
       * ================================================================ */}
      <main className="relative z-10 w-full flex flex-col min-h-[400dvh]">
        {/* ── SEKCJA 01 — HERO ── */}
        <section className="min-h-[100dvh] w-full flex flex-col justify-end pb-24 items-start px-8 md:px-20 relative">
          <motion.div {...SECTION_REVEAL}>
            <p className="font-mono text-xs tracking-[0.3em] text-zinc-400 uppercase">
              01 // START
            </p>
            <h1 className="font-['Barlow_Condensed'] uppercase text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-white leading-none my-3">
              {cfg.brand.name}
            </h1>
            <p className="font-mono text-xs tracking-[0.25em] text-zinc-300 uppercase">
              {cfg.brand.claim} · {cfg.contact.city}
            </p>
            <p className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mt-6 animate-pulse uppercase">
              EKSPLORUJ W DÓŁ ↓
            </p>
          </motion.div>
        </section>

        {/* ── SEKCJA 02 — PRĘDKOŚĆ & FLOTA ── */}
        <section className="min-h-[100dvh] w-full flex flex-col justify-center items-end text-right px-8 md:px-20 relative">
          <motion.div {...SECTION_REVEAL}>
            <p className="font-mono text-xs tracking-[0.3em] text-zinc-400 uppercase">
              02 // VELOCITY
            </p>
            <h2 className="font-['Barlow_Condensed'] uppercase text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white my-3">
              {cfg.cruise.maxSpeedKmh} KM/H NA FALACH
            </h2>
            <p className="font-mono text-xs tracking-[0.2em] text-zinc-300 uppercase">
              {cfg.boats.length} JEDNOSTKI RIB · {cfg.cruise.maxPassengers} MIEJSC ·
              ~{cfg.cruise.durationMinutes} MINUT ADRENALINY
            </p>
          </motion.div>
        </section>

        {/* ── SEKCJA 03 — REZERWAT & NATURA ── */}
        <section className="min-h-[100dvh] w-full flex flex-col justify-center items-start text-left px-8 md:px-20 relative">
          <motion.div {...SECTION_REVEAL}>
            <p className="font-mono text-xs tracking-[0.3em] text-zinc-400 uppercase">
              03 // WILDLIFE
            </p>
            <h2 className="font-['Barlow_Condensed'] uppercase text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white my-3">
              {cfg.cruise.reserveName || 'REZERWAT MEWIA ŁACHA'}
            </h2>
            <p className="font-mono text-xs tracking-[0.2em] text-zinc-300 uppercase">
              NATURALNE SIEDLISKO DZIKICH FOK SZARYCH I POSPOLITYCH
            </p>
          </motion.div>
        </section>

        {/* ── SEKCJA 04 — FINAŁ & CENNIK ── */}
        <section className="min-h-[100dvh] w-full flex flex-col justify-between items-center text-center pt-24 pb-12 px-8 md:px-20 relative">
          <motion.div
            {...SECTION_REVEAL}
            className="flex flex-col items-center"
          >
            <p className="font-mono text-xs tracking-[0.3em] text-zinc-400 uppercase">
              04 // ACCESS
            </p>
            <h2 className="font-['Barlow_Condensed'] uppercase text-6xl md:text-8xl font-bold tracking-tighter text-white my-2">
              POCZUJ BAŁTYK
            </h2>

            {/* Cennik skrócony */}
            <div className="font-mono text-xs tracking-[0.25em] text-zinc-300 mb-6 space-y-1">
              {cfg.tickets.types.map((t) => (
                <p key={t.id}>
                  {t.label.toUpperCase()}: {t.price} {cfg.tickets.currency}
                </p>
              ))}
            </div>

            {/* CTA */}
            <a
              href={cfg.contact.phoneHref}
              className="rounded-none border border-white bg-white text-black hover:bg-transparent hover:text-white transition-all duration-300 px-10 py-5 font-mono text-xs tracking-[0.25em] uppercase font-bold cursor-pointer inline-flex items-center gap-3"
            >
              <Phone className="w-4 h-4" />
              <span>ZADZWOŃ: {cfg.contact.phone}</span>
            </a>
          </motion.div>

          {/* ── STOPKA (Na dole Sekcji 04) ── */}
          <footer className="w-full flex flex-col items-center gap-4 mt-auto pt-8">
            {/* Social Media */}
            <div className="flex items-center gap-6 text-zinc-400 my-4">
              {cfg.socials?.facebook && (
                <a
                  href={cfg.socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              )}
              {cfg.socials?.x && (
                <a
                  href={cfg.socials.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}
              {cfg.socials?.youtube && (
                <a
                  href={cfg.socials.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              )}
            </div>

            {/* Nawigacja GPS */}
            <a
              href={cfg.contact.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-zinc-400 hover:text-white tracking-[0.2em] underline underline-offset-4 uppercase transition-colors break-words text-center px-4"
            >
              {cfg.contact.street}, {cfg.contact.city} [ NAWIGUJ GPS → ]
            </a>

            {/* Agency Credit */}
            <p className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase mt-4">
              AIOS STUDIO // 2026
            </p>
          </footer>
        </section>
      </main>

      {/* ================================================================
       *  STICKY MOBILE CALL BAR
       * ================================================================ */}
      <div className="fixed bottom-0 left-0 w-full z-40 bg-black/90 backdrop-blur-md border-t border-white/20 p-3 pointer-events-auto flex justify-center rounded-none md:hidden">
        <a
          href={cfg.contact.phoneHref}
          className="w-full text-center py-3 bg-white text-black font-mono text-xs tracking-[0.2em] font-bold uppercase rounded-none"
        >
          ZADZWOŃ: {cfg.contact.phone}
        </a>
      </div>

      {/* ================================================================
       *  COOKIE BANNER / RODO
       * ================================================================ */}
      <CookieBanner />

      {/* ================================================================
       *  BOCZNY PANEL DOSSIER
       * ================================================================ */}
      <DossierPanel activeTab={activeTab} onClose={closePanel} />
    </div>
  );
}
