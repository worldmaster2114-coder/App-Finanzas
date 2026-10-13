import { Transaction, UserProfile } from '@/types/finance';

export type Collaborator = {
  name: string;
  userId?: string;
  colorHex: string;
  borderClass: string;
  badgeClass: string;
  dotClass: string;
  rowBgClass: string;
  tagLabel: string;
  pillActiveClass: string;
  pillInactiveClass: string;
};

// Preset styling palette for household members
// Member 1 = Emerald Green, Member 2 = Amber Yellow, Member 3 = Blue, Member 4 = Purple
const COLLABORATOR_STYLES = [
  {
    colorHex: '#10b981',
    borderClass: 'border-l-[5px] border-l-emerald-500 dark:border-l-emerald-400',
    badgeClass: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/40',
    dotClass: 'bg-emerald-500 dark:bg-emerald-400',
    rowBgClass: 'hover:bg-emerald-500/[0.04]',
    tagLabel: '🟢',
    pillActiveClass: 'border-2 border-emerald-500 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 shadow-xs font-bold',
    pillInactiveClass: 'border border-border/70 bg-card text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10',
  },
  {
    colorHex: '#eab308',
    borderClass: 'border-l-[5px] border-l-amber-400 dark:border-l-yellow-400',
    badgeClass: 'bg-amber-400/20 text-amber-800 dark:text-amber-200 border-amber-400/40',
    dotClass: 'bg-amber-400 dark:bg-yellow-400',
    rowBgClass: 'hover:bg-amber-400/[0.04]',
    tagLabel: '🟡',
    pillActiveClass: 'border-2 border-amber-400 bg-amber-400/25 text-amber-900 dark:text-amber-100 shadow-xs font-bold',
    pillInactiveClass: 'border border-border/70 bg-card text-amber-800 dark:text-amber-200 hover:bg-amber-400/10',
  },
  {
    colorHex: '#3b82f6',
    borderClass: 'border-l-[5px] border-l-blue-500 dark:border-l-blue-400',
    badgeClass: 'bg-blue-500/20 text-blue-800 dark:text-blue-200 border-blue-500/40',
    dotClass: 'bg-blue-500 dark:bg-blue-400',
    rowBgClass: 'hover:bg-blue-500/[0.04]',
    tagLabel: '🔵',
    pillActiveClass: 'border-2 border-blue-500 bg-blue-500/20 text-blue-800 dark:text-blue-200 shadow-xs font-bold',
    pillInactiveClass: 'border border-border/70 bg-card text-blue-700 dark:text-blue-300 hover:bg-blue-500/10',
  },
  {
    colorHex: '#a855f7',
    borderClass: 'border-l-[5px] border-l-purple-500 dark:border-l-purple-400',
    badgeClass: 'bg-purple-500/20 text-purple-800 dark:text-purple-200 border-purple-500/40',
    dotClass: 'bg-purple-500 dark:bg-purple-400',
    rowBgClass: 'hover:bg-purple-500/[0.04]',
    tagLabel: '🟣',
    pillActiveClass: 'border-2 border-purple-500 bg-purple-500/20 text-purple-800 dark:text-purple-200 shadow-xs font-bold',
    pillInactiveClass: 'border border-border/70 bg-card text-purple-700 dark:text-purple-300 hover:bg-purple-500/10',
  },
];

/**
 * Normalizes user/author names:
 * - Fixes legacy misspellings ("Ariadna" -> "Arianna").
 * - Trims and cleans empty strings or generic keywords.
 */
export function normalizeCollaboratorName(rawName?: string | null): string {
  if (!rawName) return '';
  const trimmed = rawName.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (lower === 'usuario' || lower === 'usr' || lower === 'null' || lower === 'undefined') return '';

  // Partner's real name is Arianna (with double n). Correct any legacy "Ariadna".
  if (lower === 'ariadna' || lower.includes('ariadna') || lower === 'arianna' || lower.includes('arianna')) {
    return 'Arianna';
  }

  return trimmed;
}

/**
 * Checks whether two names correspond to the same individual in the household:
 * - "Daniel" vs "Daniel Gerardo Valdez Perez" -> true (same person!)
 * - "Arianna" vs "Ariadna" -> true (same person!)
 * - Name containing another name as a full word -> true (same person!)
 */
export function isSamePerson(nameA?: string | null, nameB?: string | null): boolean {
  const normA = normalizeCollaboratorName(nameA).toLowerCase();
  const normB = normalizeCollaboratorName(nameB).toLowerCase();
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  // Partner identity check (Arianna)
  const isAriannaA = normA.includes('arianna') || normA.includes('ariadna') || normA.includes('lucero');
  const isAriannaB = normB.includes('arianna') || normB.includes('ariadna') || normB.includes('lucero');
  if (isAriannaA && isAriannaB) return true;

  // Primary user identity check (Daniel / Daniel Gerardo Valdez Perez)
  const isDanielA = normA.includes('daniel');
  const isDanielB = normB.includes('daniel');
  if (isDanielA && isDanielB) return true;

  // Word overlap comparison (e.g. "Daniel Valdez" and "Daniel")
  const wordsA = normA.split(/\s+/).filter((w) => w.length > 2);
  const wordsB = normB.split(/\s+/).filter((w) => w.length > 2);
  if (wordsA.length > 0 && wordsB.length > 0 && wordsA[0] === wordsB[0]) {
    return true;
  }

  return false;
}

/**
 * Extracts and returns the distinct active collaborators of a household.
 * Takes real names from the active users, transactions, or workspace membership.
 * Automatically eliminates duplicates (e.g. "Daniel" and "Daniel Gerardo Valdez Perez").
 */
export function getHouseholdCollaborators(
  transactions: Transaction[] = [],
  currentUser?: UserProfile | null,
  knownMembers?: Array<{ name: string; userId?: string }>
): Collaborator[] {
  const nameList: string[] = [];

  const addOrMergeName = (rawName?: string | null, isPrimary = false) => {
    const normalized = normalizeCollaboratorName(rawName);
    if (!normalized) return;

    // Check if this person is already in nameList
    const existingIndex = nameList.findIndex((existing) => isSamePerson(existing, normalized));
    if (existingIndex !== -1) {
      // If the incoming name is the current user's profile name (e.g. "Daniel Gerardo Valdez Perez"),
      // prioritize the user's real profile name over a shorter or generic alias!
      if (isPrimary || normalized.length > nameList[existingIndex].length) {
        nameList[existingIndex] = normalized;
      }
      return;
    }

    nameList.push(normalized);
  };

  // 1. Add current user first (marked as primary user)
  if (currentUser?.name && currentUser.name.trim() !== 'Usuario') {
    addOrMergeName(currentUser.name, true);
  }

  // 2. Add known members if passed
  if (Array.isArray(knownMembers)) {
    knownMembers.forEach((m) => addOrMergeName(m.name));
  }

  // 3. Extract names from existing transactions
  transactions.forEach((tx) => {
    if (tx.createdByName) {
      addOrMergeName(tx.createdByName);
    } else if (tx.createdByUserId) {
      const uid = tx.createdByUserId.toLowerCase();
      if (uid.includes(':::')) {
        addOrMergeName(tx.createdByUserId.split(':::')[1]);
      } else if (uid.includes('arianna') || uid.includes('ariadna') || uid.includes('lucero')) {
        addOrMergeName('Arianna');
      } else if (uid.includes('daniel')) {
        addOrMergeName('Daniel');
      }
    }
  });

  // 4. Default fallback: if list is empty
  if (nameList.length === 0) {
    nameList.push(normalizeCollaboratorName(currentUser?.name) || 'Daniel');
  }

  // 5. Shared household partner fallback:
  // If only 1 collaborator found in a shared household context, add the partner
  if (nameList.length === 1) {
    const existing = nameList[0];
    if (isSamePerson(existing, 'Daniel')) {
      nameList.push('Arianna');
    } else if (isSamePerson(existing, 'Arianna')) {
      nameList.unshift(normalizeCollaboratorName(currentUser?.name) || 'Daniel');
    }
  }

  return nameList.map((name, index) => {
    const style = COLLABORATOR_STYLES[index % COLLABORATOR_STYLES.length];
    return {
      name,
      ...style,
      tagLabel: `${style.tagLabel} ${name}`,
    };
  });
}

/**
 * Resolves which collaborator authored a transaction and provides consistent styling.
 */
export function resolveTransactionAuthor(
  tx: Transaction,
  currentUser?: UserProfile | null,
  collaborators?: Collaborator[]
): Collaborator {
  const cols = collaborators && collaborators.length > 0 
    ? collaborators 
    : getHouseholdCollaborators([tx], currentUser);

  const rawName = normalizeCollaboratorName(tx.createdByName);
  const rawId = (tx.createdByUserId || '').trim().toLowerCase();

  // 1. Check if matches any collaborator via isSamePerson
  if (rawName) {
    const matched = cols.find((c) => isSamePerson(c.name, rawName));
    if (matched) return matched;
  }

  // 2. Check current user match
  if (currentUser) {
    if (rawId === currentUser.id.toLowerCase() || rawId === currentUser.email?.toLowerCase()) {
      const matched = cols.find((c) => isSamePerson(c.name, currentUser.name));
      if (matched) return matched;
    }
  }

  // 3. Check keywords in rawId (e.g. 'usr-daniel', 'usr-arianna', 'usr-ariadna', 'usr:::Arianna')
  if (rawId.includes('arianna') || rawId.includes('ariadna') || rawId.includes('lucero')) {
    const matched = cols.find((c) => isSamePerson(c.name, 'Arianna'));
    if (matched) return matched;
    if (cols.length > 1) return cols[1];
  }

  if (rawId.includes('daniel')) {
    const matched = cols.find((c) => isSamePerson(c.name, 'Daniel'));
    if (matched) return matched;
    return cols[0];
  }

  // Fallback to first collaborator
  return cols[0];
}
