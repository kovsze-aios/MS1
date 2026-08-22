/* ==========================================================================
 *  icons.ts — MOST MIĘDZY KONFIGURACJĄ A BIBLIOTEKĄ IKON
 * --------------------------------------------------------------------------
 *  companyConfig.ts jest celowo „czystymi danymi" — nie importuje Reacta ani
 *  żadnej biblioteki UI. Dzięki temu ten sam plik konfiguracyjny działa
 *  w obu wariantach frontendu, a w przyszłości mógłby zasilić np. aplikację
 *  mobilną albo generator PDF-ów.
 *
 *  Konfiguracja mówi więc tylko „chcę ikonę o kluczu `ship`", a TEN plik
 *  tłumaczy klucz na konkretny komponent z lucide-react.
 *
 *  ZYSK: podmiana biblioteki ikon = zmiana jednego pliku. Żaden komponent
 *  ani plik konfiguracyjny nie wymaga wtedy poprawki.
 * ========================================================================== */

import {
  Ship,
  Anchor,
  Waves,
  Compass,
  Gauge,
  Clock,
  Users,
  LifeBuoy,
  Fish,
  Camera,
  Sun,
  Wind,
  type LucideIcon,
} from 'lucide-react';

import type { IconKey } from '@/config/companyConfig';

/**
 * Mapa: klucz z konfiguracji → komponent ikony.
 *
 * `Record<IconKey, LucideIcon>` to zabezpieczenie kompilatora: gdy dopiszesz
 * nową wartość do typu `IconKey`, a zapomnisz dodać ją tutaj — projekt się
 * NIE zbuduje. Nie da się więc wypuścić strony z brakującą ikoną.
 */
export const iconMap: Record<IconKey, LucideIcon> = {
  ship: Ship,
  anchor: Anchor,
  waves: Waves,
  compass: Compass,
  gauge: Gauge,
  clock: Clock,
  users: Users,
  lifebuoy: LifeBuoy,
  fish: Fish,
  camera: Camera,
  sun: Sun,
  wind: Wind,
};

/**
 * Zwraca komponent ikony dla podanego klucza.
 * Gdy klucz jest nieznany (np. dane z zewnętrznego CMS-a), oddaje ikonę
 * zastępczą — strona renderuje się dalej zamiast wyrzucić biały ekran.
 *
 * @param key - klucz ikony z companyConfig
 *
 * @example
 * const Icon = getIcon(boat.icon);
 * return <Icon className="h-6 w-6 text-accent" />;
 */
export function getIcon(key: IconKey): LucideIcon {
  return iconMap[key] ?? Waves;
}
