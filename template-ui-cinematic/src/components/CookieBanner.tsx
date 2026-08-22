import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('morskie_safari_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('morskie_safari_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 bg-[#080808] border border-white/20 p-6 max-w-xs font-mono text-xs text-zinc-400 flex flex-col gap-4 rounded-none pointer-events-auto shadow-2xl">
      <p className="leading-relaxed">
        Strona wykorzystuje pliki cookies do celów analitycznych.
      </p>
      <button
        type="button"
        onClick={handleAccept}
        className="border border-white/40 text-white hover:bg-white hover:text-black py-3 px-5 text-center transition-all cursor-pointer rounded-none uppercase font-bold tracking-wider"
      >
        ROZUMIEM [ X ]
      </button>
    </div>
  );
}
