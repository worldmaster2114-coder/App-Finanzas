import { useMemo, useState } from 'react';
import { Account, Category, RecurringTransaction } from '@/types/finance';
import { CategoryIcon } from './fast-entry-modal';
import { CalendarDays, ArrowUpRight, ArrowDownLeft, Plus, Sparkles, CheckCircle2, Clock, X } from 'lucide-react';

type FinancialForecastProps = {
  accounts: Account[];
  categories: Category[];
  recurringTransactions: RecurringTransaction[];
  selectedMonth: number;
  selectedYear: number;
  onAddRecurring: (item: Omit<RecurringTransaction, 'id'>) => void;
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 2 }).format(amount);

export function FinancialForecast({
  accounts,
  categories,
  recurringTransactions,
  selectedMonth,
  selectedYear,
  onAddRecurring,
}: FinancialForecastProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [nextExecutionDate, setNextExecutionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');

  // Total current balance across accounts
  const currentTotalBalance = useMemo(() => accounts.reduce((acc, a) => acc + a.balance, 0), [accounts]);

  // Filter pending recurring transactions for the selected month
  const pendingItems = useMemo(() => {
    return recurringTransactions.filter((rec) => {
      const d = new Date(rec.nextExecutionDate);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [recurringTransactions, selectedMonth, selectedYear]);

  const pendingIncome = useMemo(
    () => pendingItems.filter((i) => i.type === 'income').reduce((sum, i) => sum + i.amount, 0),
    [pendingItems]
  );

  const pendingExpense = useMemo(
    () => pendingItems.filter((i) => i.type === 'expense').reduce((sum, i) => sum + i.amount, 0),
    [pendingItems]
  );

  // Projected End-of-Month Balance
  const projectedBalance = currentTotalBalance + pendingIncome - pendingExpense;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;

    onAddRecurring({
      accountId: selectedAccountId,
      categoryId: selectedCategoryId || (type === 'income' ? 'cat-inc-1' : 'cat-exp-2'),
      amount,
      type,
      frequency,
      nextExecutionDate,
      autoApply: true,
      note: note.trim() || undefined,
    });

    setAmountStr('');
    setNote('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">Gastos Fijos y Proyección</h2>
          <p className="text-xs text-muted-foreground">Planifica tus pagos recurrentes y visualiza el saldo estimado a fin de mes.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs transition hover:brightness-105 active:scale-98 focus-ring"
        >
          <Plus size={16} /> Programar Pago Fijo
        </button>
      </div>

      {/* End-of-Month Forecast Widget */}
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 via-card to-card p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles size={18} />
            </span>
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">Proyección a Fin de Mes</h3>
              <p className="text-xs text-muted-foreground">Basada en saldo actual y pagos recurrentes pendientes</p>
            </div>
          </div>
          <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">Estimación Inteligente</span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border/60 bg-card p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Saldo Actual</p>
            <p className="font-mono text-lg font-bold text-foreground mt-1">{formatMoney(currentTotalBalance)}</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ArrowUpRight size={14} /> + Ingresos Pendientes
            </p>
            <p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatMoney(pendingIncome)}</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-destructive flex items-center gap-1">
              <ArrowDownLeft size={14} /> - Gastos Fijos Pendientes
            </p>
            <p className="font-mono text-lg font-bold text-destructive mt-1">{formatMoney(pendingExpense)}</p>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Saldo Proyectado Estimado</p>
            <p className="font-mono text-xl font-extrabold text-foreground mt-1">{formatMoney(projectedBalance)}</p>
          </div>
        </div>
      </div>

      {/* Recurring Transactions Calendar List */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="font-serif text-lg font-bold text-foreground">Calendario de Pagos y Recurrentes</h3>
          <span className="text-xs font-bold text-muted-foreground">{pendingItems.length} pendientes este mes</span>
        </div>

        <div className="mt-4 space-y-2.5">
          {recurringTransactions.map((item) => {
            const category = categories.find((c) => c.id === item.categoryId);
            const account = accounts.find((a) => a.id === item.accountId);
            const isIncome = item.type === 'income';

            return (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 p-3.5 transition hover:bg-secondary/60">
                <div className="flex items-center gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl text-white shadow-xs`} style={{ backgroundColor: category?.color || '#3b82f6' }}>
                    <CategoryIcon iconName={category?.icon || 'Tag'} size={18} />
                  </span>
                  <div>
                    <p className="font-bold text-sm text-foreground">{item.note || category?.name}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <span>{account?.name}</span>
                      <span>•</span>
                      <span className="capitalize">{item.frequency}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-primary font-semibold">
                        <Clock size={12} /> {new Date(item.nextExecutionDate).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-mono text-sm font-extrabold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                    {isIncome ? '+' : '-'} {formatMoney(item.amount)}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    <CheckCircle2 size={10} /> Auto-aplicar
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Add Recurring */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form onSubmit={handleCreate} className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-serif text-lg font-bold">Programar Pago o Ingreso Fijo</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`rounded-lg py-2 text-xs font-bold transition ${type === 'expense' ? 'bg-card text-destructive shadow-xs' : 'text-muted-foreground'}`}
                >
                  Gasto Fijo
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`rounded-lg py-2 text-xs font-bold transition ${type === 'income' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-muted-foreground'}`}
                >
                  Ingreso Fijo
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Concepto / Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Renta, Netflix, Salario..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-foreground">Monto (RD$)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="2500"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Frecuencia</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-foreground">Cuenta</label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Próximo Pago</label>
                  <input
                    type="date"
                    required
                    value={nextExecutionDate}
                    onChange={(e) => setNextExecutionDate(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 h-10 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 h-10 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:brightness-105"
              >
                Programar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
