import { Account, Budget, Category, FinanceDataState, RecurringTransaction, SavingsGoal, Transaction } from '@/types/finance';

// Storage Key for Local Cache
const STORAGE_KEY = 'finanzas-hogar:v3-clean';

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc-1', name: 'Efectivo Billetera', type: 'cash', balance: 0, currency: 'DOP', color: '#10b981', icon: 'Wallet', createdAt: new Date().toISOString() },
  { id: 'acc-2', name: 'Cuenta de Banco', type: 'bank', balance: 0, currency: 'DOP', color: '#3b82f6', icon: 'Building2', createdAt: new Date().toISOString() },
  { id: 'acc-3', name: 'Tarjeta de Crédito', type: 'credit_card', balance: 0, currency: 'DOP', color: '#ef4444', icon: 'CreditCard', createdAt: new Date().toISOString() },
  { id: 'acc-4', name: 'Bóveda de Ahorros', type: 'savings', balance: 0, currency: 'DOP', color: '#8b5cf6', icon: 'PiggyBank', createdAt: new Date().toISOString() },
];

export const DEFAULT_CATEGORIES: Category[] = [
  // Income Categories
  { id: 'cat-inc-1', name: 'Salario / Nómina', type: 'income', icon: 'Landmark', color: '#10b981', isDefault: true },
  { id: 'cat-inc-2', name: 'Trabajos Extras', type: 'income', icon: 'Briefcase', color: '#06b6d4', isDefault: true },
  { id: 'cat-inc-3', name: 'Inversiones', type: 'income', icon: 'TrendingUp', color: '#8b5cf6', isDefault: true },
  { id: 'cat-inc-4', name: 'Otros Ingresos', type: 'income', icon: 'CircleDollarSign', color: '#64748b', isDefault: true },
  
  // Expense Categories (Needs 50%, Wants 30%)
  { id: 'cat-exp-1', name: 'Supermercado y Comida', type: 'expense', icon: 'ShoppingBasket', color: '#f97316', isDefault: true },
  { id: 'cat-exp-2', name: 'Vivienda y Renta', type: 'expense', icon: 'Home', color: '#ef4444', isDefault: true },
  { id: 'cat-exp-3', name: 'Servicios e Internet', type: 'expense', icon: 'Zap', color: '#0ea5e9', isDefault: true },
  { id: 'cat-exp-4', name: 'Transporte y Combustible', type: 'expense', icon: 'Car', color: '#eab308', isDefault: true },
  { id: 'cat-exp-5', name: 'Salud y Farmacia', type: 'expense', icon: 'HeartPulse', color: '#ec4899', isDefault: true },
  { id: 'cat-exp-6', name: 'Educación y Cursos', type: 'expense', icon: 'GraduationCap', color: '#6366f1', isDefault: true },
  { id: 'cat-exp-7', name: 'Entretenimiento y Ocio', type: 'expense', icon: 'Coffee', color: '#a855f7', isDefault: true },
  { id: 'cat-exp-8', name: 'Otros Gastos', type: 'expense', icon: 'Tag', color: '#94a3b8', isDefault: true },
];

export function getInitialSeedData(): FinanceDataState {
  const defaultWorkspace = {
    id: 'ws-default',
    name: 'Presupuesto Personal',
    type: 'personal' as const,
    inviteCode: '503020',
    ownerId: 'usr-default',
    membersCount: 1,
  };

  return {
    user: null,
    workspaces: [defaultWorkspace],
    activeWorkspace: defaultWorkspace,
    accounts: DEFAULT_ACCOUNTS,
    categories: DEFAULT_CATEGORIES,
    transactions: [],
    budgets: [],
    savingsGoals: [],
    recurringTransactions: [],
  };
}

export function loadFinanceData(): FinanceDataState {
  const initial = getInitialSeedData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const safeWorkspaces = Array.isArray(parsed.workspaces) && parsed.workspaces.length > 0 ? parsed.workspaces : initial.workspaces;
        const safeActiveWorkspace = parsed.activeWorkspace || safeWorkspaces[0] || initial.activeWorkspace;
        const safeAccounts = Array.isArray(parsed.accounts) && parsed.accounts.length > 0 ? parsed.accounts : initial.accounts;
        const safeCategories = Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : initial.categories;
        const safeTransactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
        const safeBudgets = Array.isArray(parsed.budgets) ? parsed.budgets : [];
        const safeSavingsGoals = Array.isArray(parsed.savingsGoals) ? parsed.savingsGoals : [];
        const safeRecurring = Array.isArray(parsed.recurringTransactions) ? parsed.recurringTransactions : [];

        return {
          user: parsed.user || null,
          workspaces: safeWorkspaces,
          activeWorkspace: safeActiveWorkspace,
          accounts: safeAccounts,
          categories: safeCategories,
          transactions: safeTransactions,
          budgets: safeBudgets,
          savingsGoals: safeSavingsGoals,
          recurringTransactions: safeRecurring,
        };
      }
    }
  } catch (err) {
    console.error('Failed to parse storage, initializing clean data:', err);
  }

  saveToLocalStorage(initial);
  return initial;
}

// 1. Save strictly to Local Storage
export function saveToLocalStorage(data: FinanceDataState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

// 2. Explicit Immediate or Debounced Sync to PostgreSQL Cloud Backend
let syncTimeout: any = null;

export function syncFinanceDataToCloud(data: FinanceDataState, immediate = false): void {
  // Always update local cache
  saveToLocalStorage(data);

  if (immediate) {
    if (syncTimeout) clearTimeout(syncTimeout);
    fetch('/api/finance/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch((err) => {
      console.warn('[CLOUD SYNC] Error pushing to PostgreSQL:', err);
    });
    return;
  }

  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    fetch('/api/finance/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch((err) => {
      console.warn('[CLOUD SYNC] Error pushing to PostgreSQL:', err);
    });
  }, 400);
}

// Backwards-compatible saveFinanceData alias
export const saveFinanceData = syncFinanceDataToCloud;

export function exportToJSON(data: FinanceDataState): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finanzas_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToCSV(data: FinanceDataState): void {
  const accountMap = new Map(data.accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(data.categories.map((c) => [c.id, c.name]));

  const headers = ['ID', 'Fecha', 'Tipo', 'Cuenta', 'Categoría', 'Monto', 'Nota', 'Es Recurrente'];
  const rows = data.transactions.map((t) => [
    t.id,
    t.date.slice(0, 10),
    t.type,
    `"${accountMap.get(t.accountId) || t.accountId}"`,
    `"${categoryMap.get(t.categoryId) || t.categoryId}"`,
    t.amount,
    `"${t.note || ''}"`,
    t.isRecurring ? 'Sí' : 'No',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transacciones_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
