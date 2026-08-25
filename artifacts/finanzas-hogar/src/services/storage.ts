import { Account, Budget, Category, FinanceDataState, RecurringTransaction, SavingsGoal, Transaction } from '@/types/finance';

const STORAGE_KEY = 'finanzas-hogar:v2-state';

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc-1', name: 'Efectivo Billetera', type: 'cash', balance: 4500, currency: 'DOP', color: '#10b981', icon: 'Wallet', createdAt: new Date().toISOString() },
  { id: 'acc-2', name: 'Cuenta Banco Ahorros', type: 'bank', balance: 85400, currency: 'DOP', color: '#3b82f6', icon: 'Building2', createdAt: new Date().toISOString() },
  { id: 'acc-3', name: 'Tarjeta Banreservas', type: 'credit_card', balance: -12800, currency: 'DOP', color: '#ef4444', icon: 'CreditCard', createdAt: new Date().toISOString() },
  { id: 'acc-4', name: 'Fondo de Emergencia', type: 'savings', balance: 150000, currency: 'DOP', color: '#8b5cf6', icon: 'PiggyBank', createdAt: new Date().toISOString() },
];

export const DEFAULT_CATEGORIES: Category[] = [
  // Income
  { id: 'cat-inc-1', name: 'Salario / Nómina', type: 'income', icon: 'Landmark', color: '#10b981', isDefault: true },
  { id: 'cat-inc-2', name: 'Trabajos Extras', type: 'income', icon: 'Briefcase', color: '#06b6d4', isDefault: true },
  { id: 'cat-inc-3', name: 'Inversiones', type: 'income', icon: 'TrendingUp', color: '#8b5cf6', isDefault: true },
  { id: 'cat-inc-4', name: 'Otros Ingresos', type: 'income', icon: 'CircleDollarSign', color: '#64748b', isDefault: true },
  
  // Expenses
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
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const isoDay = (d: number) => new Date(year, month, d, 12, 0).toISOString();

  const transactions: Transaction[] = [
    { id: 't-1', accountId: 'acc-2', categoryId: 'cat-inc-1', amount: 75000, type: 'income', date: isoDay(1), note: 'Pago de nómina quincenal', isRecurring: true, createdAt: isoDay(1) },
    { id: 't-2', accountId: 'acc-2', categoryId: 'cat-exp-2', amount: 22000, type: 'expense', date: isoDay(2), note: 'Renta del apartamento', isRecurring: true, createdAt: isoDay(2) },
    { id: 't-3', accountId: 'acc-3', categoryId: 'cat-exp-1', amount: 9850, type: 'expense', date: isoDay(4), note: 'Supermercado Bravo', isRecurring: false, createdAt: isoDay(4) },
    { id: 't-4', accountId: 'acc-2', categoryId: 'cat-exp-3', amount: 2890, type: 'expense', date: isoDay(6), note: 'Luz Claro e Internet', isRecurring: true, createdAt: isoDay(6) },
    { id: 't-5', accountId: 'acc-1', categoryId: 'cat-exp-4', amount: 4200, type: 'expense', date: isoDay(8), note: 'Gasolina y peaje', isRecurring: false, createdAt: isoDay(8) },
    { id: 't-6', accountId: 'acc-2', categoryId: 'cat-inc-2', amount: 18500, type: 'income', date: isoDay(10), note: 'Proyecto Freelance Web', isRecurring: false, createdAt: isoDay(10) },
    { id: 't-7', accountId: 'acc-3', categoryId: 'cat-exp-7', amount: 3400, type: 'expense', date: isoDay(12), note: 'Cena familiar de fin de semana', isRecurring: false, createdAt: isoDay(12) },
    { id: 't-8', accountId: 'acc-2', categoryId: 'cat-exp-5', amount: 1500, type: 'expense', date: isoDay(15), note: 'Farmacia Carol', isRecurring: false, createdAt: isoDay(15) },
  ];

  const budgets: Budget[] = [
    { id: 'b-1', categoryId: 'cat-exp-1', amountLimit: 18000, period: 'monthly', startDate: isoDay(1), alertThreshold: 80 },
    { id: 'b-2', categoryId: 'cat-exp-4', amountLimit: 8000, period: 'monthly', startDate: isoDay(1), alertThreshold: 75 },
    { id: 'b-3', categoryId: 'cat-exp-7', amountLimit: 6000, period: 'monthly', startDate: isoDay(1), alertThreshold: 85 },
  ];

  const savingsGoals: SavingsGoal[] = [
    { id: 'sg-1', name: 'Vacaciones en la Playa', targetAmount: 45000, currentAmount: 28000, deadline: new Date(year, month + 3, 15).toISOString().slice(0, 10), color: '#06b6d4', icon: 'Palmtree', status: 'active' },
    { id: 'sg-2', name: 'Fondo de Laptop Nueva', targetAmount: 80000, currentAmount: 52000, deadline: new Date(year, month + 5, 30).toISOString().slice(0, 10), color: '#3b82f6', icon: 'Laptop', status: 'active' },
    { id: 'sg-3', name: 'Mantenimiento de Vehículo', targetAmount: 25000, currentAmount: 25000, deadline: new Date(year, month - 1, 1).toISOString().slice(0, 10), color: '#10b981', icon: 'Wrench', status: 'completed' },
  ];

  const recurringTransactions: RecurringTransaction[] = [
    { id: 'rec-1', accountId: 'acc-2', categoryId: 'cat-inc-1', amount: 75000, type: 'income', frequency: 'monthly', nextExecutionDate: new Date(year, month + 1, 1).toISOString().slice(0, 10), autoApply: true, note: 'Nómina quincenal' },
    { id: 'rec-2', accountId: 'acc-2', categoryId: 'cat-exp-2', amount: 22000, type: 'expense', frequency: 'monthly', nextExecutionDate: new Date(year, month + 1, 5).toISOString().slice(0, 10), autoApply: true, note: 'Renta del apartamento' },
    { id: 'rec-3', accountId: 'acc-2', categoryId: 'cat-exp-3', amount: 2890, type: 'expense', frequency: 'monthly', nextExecutionDate: new Date(year, month + 1, 7).toISOString().slice(0, 10), autoApply: true, note: 'Plan Claro Internet' },
  ];

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
    transactions,
    budgets,
    savingsGoals,
    recurringTransactions,
  };
}

export function loadFinanceData(): FinanceDataState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FinanceDataState;
      if (parsed && Array.isArray(parsed.accounts) && Array.isArray(parsed.transactions)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse storage, reinitializing seed data:', err);
  }

  const initial = getInitialSeedData();
  saveFinanceData(initial);
  return initial;
}

// Background Debounced Sync to PostgreSQL Backend
let syncTimeout: any = null;

export function saveFinanceData(data: FinanceDataState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }

  // Sync to PostgreSQL Backend API
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    fetch('/api/finance/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch((err) => {
      console.warn('[SYNC] PostgreSQL sync in progress or offline:', err);
    });
  }, 1000);
}

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
