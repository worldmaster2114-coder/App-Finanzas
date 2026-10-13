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
 * Extracts and returns the distinct active collaborators of a household.
 * Takes real names from the active users, transactions, or workspace membership.
 */
export function getHouseholdCollaborators(
  transactions: Transaction[] = [],
  currentUser?: UserProfile | null,
  knownMembers?: Array<{ name: string; userId?: string }>
): Collaborator[] {
  const nameSet = new Set<string>();
  const nameList: string[] = [];

  const addName = (rawName?: string) => {
    if (!rawName) return;
    const trimmed = rawName.trim();
    if (!trimmed || trimmed.toLowerCase() === 'usuario' || trimmed.toLowerCase() === 'usr') return;
    const lower = trimmed.toLowerCase();
    if (!nameSet.has(lower)) {
      nameSet.add(lower);
      nameList.push(trimmed);
    }
  };

  // 1. Add current user first if valid
  if (currentUser?.name && currentUser.name.trim() !== 'Usuario') {
    addName(currentUser.name);
  }

  // 2. Add known members if passed
  if (Array.isArray(knownMembers)) {
    knownMembers.forEach((m) => addName(m.name));
  }

  // 3. Extract names from existing transactions
  transactions.forEach((tx) => {
    if (tx.createdByName) {
      addName(tx.createdByName);
    } else if (tx.createdByUserId) {
      const uid = tx.createdByUserId.toLowerCase();
      if (uid.includes(':::')) {
        addName(tx.createdByUserId.split(':::')[1]);
      } else if (uid.includes('ariadna') || uid.includes('arianna') || uid.includes('lucero')) {
        addName('Ariadna');
      } else if (uid.includes('daniel')) {
        addName('Daniel');
      }
    }
  });

  // 4. Default fallback: if list is empty or only has 1 and this is a shared household
  if (nameList.length === 0) {
    nameList.push(currentUser?.name || 'Daniel');
  }

  // If only 1 collaborator found so far, check if the other household partner exists
  if (nameList.length === 1) {
    const existing = nameList[0].toLowerCase();
    if (existing.includes('daniel')) {
      nameList.push('Ariadna');
    } else if (existing.includes('ariadna') || existing.includes('lucero')) {
      nameList.unshift('Daniel');
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

  const rawName = (tx.createdByName || '').trim().toLowerCase();
  const rawId = (tx.createdByUserId || '').trim().toLowerCase();

  // 1. Check exact or partial match on collaborator names
  if (rawName) {
    const matched = cols.find((c) => c.name.toLowerCase() === rawName || rawName.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(rawName));
    if (matched) return matched;
  }

  // 2. Check current user id/email match
  if (currentUser && (rawId === currentUser.id.toLowerCase() || rawId === currentUser.email?.toLowerCase())) {
    const matched = cols.find((c) => c.name.toLowerCase() === currentUser.name.toLowerCase());
    if (matched) return matched;
  }

  // 3. Check rawId keywords
  if (rawId.includes('ariadna') || rawId.includes('arianna') || rawId.includes('lucero')) {
    const matched = cols.find((c) => {
      const n = c.name.toLowerCase();
      return n.includes('ariadna') || n.includes('arianna') || n.includes('lucero');
    });
    if (matched) return matched;
    if (cols.length > 1) return cols[1];
  }

  if (rawId.includes('daniel')) {
    const matched = cols.find((c) => c.name.toLowerCase().includes('daniel'));
    if (matched) return matched;
    return cols[0];
  }

  // Fallback to first collaborator
  return cols[0];
}
