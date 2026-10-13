import { Transaction, UserProfile } from '@/types/finance';

export type AuthorInfo = {
  name: string;
  isDaniel: boolean;
  isAriadna: boolean;
  colorHex: string;
  borderClass: string;
  badgeClass: string;
  dotClass: string;
  rowBgClass: string;
  tagLabel: string;
};

/**
 * Resolves the author of a transaction and provides consistent color styles.
 * By request: Daniel = Green (Verde), Ariadna / Lucero = Yellow (Amarillo).
 */
export function resolveTransactionAuthor(
  tx: Transaction,
  currentUser?: UserProfile | null
): AuthorInfo {
  const rawName = (tx.createdByName || '').trim();
  const rawId = (tx.createdByUserId || '').trim().toLowerCase();

  let detectedName = '';

  if (rawName) {
    detectedName = rawName;
  } else if (currentUser && (rawId === currentUser.id.toLowerCase() || rawId === currentUser.email?.toLowerCase())) {
    detectedName = currentUser.name;
  } else if (rawId.includes('ariadna') || rawId.includes('arianna') || rawId.includes('lucero')) {
    detectedName = 'Ariadna';
  } else if (rawId.includes('daniel') || rawId === 'default-owner' || rawId === 'usr-default' || !rawId) {
    detectedName = 'Daniel';
  } else {
    // If there's an email or generic user id
    if (rawId.includes('@')) {
      detectedName = rawId.split('@')[0];
    } else {
      detectedName = 'Daniel';
    }
  }

  const normalized = detectedName.toLowerCase();
  const isAriadna = normalized.includes('ariadna') || normalized.includes('arianna') || normalized.includes('lucero');
  const isDaniel = !isAriadna && (normalized.includes('daniel') || true);

  if (isAriadna) {
    return {
      name: 'Ariadna',
      isDaniel: false,
      isAriadna: true,
      colorHex: '#eab308', // Amarillo / Amber
      borderClass: 'border-l-[5px] border-l-amber-400 dark:border-l-yellow-400',
      badgeClass: 'bg-amber-400/20 text-amber-800 dark:text-amber-200 border-amber-400/40',
      dotClass: 'bg-amber-400 dark:bg-yellow-400',
      rowBgClass: 'hover:bg-amber-400/[0.04]',
      tagLabel: '🟡 Ariadna',
    };
  }

  // Default to Daniel (Verde)
  return {
    name: 'Daniel',
    isDaniel: true,
    isAriadna: false,
    colorHex: '#10b981', // Verde / Emerald
    borderClass: 'border-l-[5px] border-l-emerald-500 dark:border-l-emerald-400',
    badgeClass: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/40',
    dotClass: 'bg-emerald-500 dark:bg-emerald-400',
    rowBgClass: 'hover:bg-emerald-500/[0.04]',
    tagLabel: '🟢 Daniel',
  };
}
