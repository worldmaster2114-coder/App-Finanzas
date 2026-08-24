import { useState } from 'react';
import { Budget, Category, Transaction } from '@/types/finance';
import { CategoryIcon } from './fast-entry-modal';
import { Plus, AlertTriangle, CheckCircle2, XCircle, Calendar, DollarSign, X } from 'lucide-react';

type BudgetManagerProps = {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  selectedMonth: number;
  selectedYear: number;
  onAddBudget: (budget: Omit<Budget, 'id'>) => void;
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(amount);

export function BudgetManager({ budgets, categories, transactions, selectedMonth, selectedYear, onAddBudget }: BudgetManagerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories.filter((c) => c.type === 'expense')[0]?.id || '');
  const [limitAmount, setLimitAmount] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('80');

  // Days remaining in month
  const now = new Date();
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const currentDay = now.getMonth() === selectedMonth && now.getFullYear() === selectedYear ? now.getDate() : 1;
  const daysRemaining = Math.max(1, daysInMonth - currentDay + 1);

  // Calculate spent per category for the month
  const monthExpenseTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(limitAmount);
    if (isNaN(limit) || limit <= 0) return;

    onAddBudget({
      categoryId: selectedCategoryId,
      amountLimit: limit,
      period: 'monthly',
      startDate: new Date(selectedYear, selectedMonth, 1).toISOString(),
      alertThreshold: parseInt(alertThreshold) || 80,
    });

    setLimitAmount('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">Presupuestos Inteligentes</h2>
          <p className="text-xs text-muted-foreground">Sistema de semáforos y disponible diario para mantener tus finanzas en orden sin sorpresas.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs transition hover:brightness-105 active:scale-98 focus-ring"
        >
          <Plus size={16} /> Crear Presupuesto
        </button>
      </div>

      {/* Budgets List */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          const category = categories.find((c) => c.id === budget.categoryId);
          const spent = monthExpenseTransactions
            .filter((t) => t.categoryId === budget.categoryId)
            .reduce((sum, t) => sum + t.amount, 0);

          const pct = Math.round((spent / budget.amountLimit) * 100);
          const remaining = budget.amountLimit - spent;
          const dailyAvailable = Math.max(0, Math.floor(remaining / daysRemaining));

          // Traffic Light status definition
          let statusColor = 'emerald';
          let statusBadge = 'Bajo Control';
          let StatusIcon = CheckCircle2;

          if (pct >= 90 || spent > budget.amountLimit) {
            statusColor = 'red';
            statusBadge = spent > budget.amountLimit ? 'Excedido' : 'Crítico';
            StatusIcon = XCircle;
          } else if (pct >= 70) {
            statusColor = 'amber';
            statusBadge = 'Alerta';
            StatusIcon = AlertTriangle;
          }

          return (
            <div key={budget.id} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/40 hover:shadow-md">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl text-white shadow-xs" style={{ backgroundColor: category?.color || '#3b82f6' }}>
                      <CategoryIcon iconName={category?.icon || 'Tag'} size={18} />
                    </span>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{category?.name || 'Presupuesto General'}</h3>
                      <p className="text-[11px] text-muted-foreground">Mensual</p>
                    </div>
                  </div>

                  {/* Traffic Light Status Badge */}
                  <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    statusColor === 'emerald' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                    statusColor === 'amber' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                    'bg-red-500/15 text-red-600 dark:text-red-400'
                  }`}>
                    <StatusIcon size={12} />
                    {statusBadge}
                  </span>
                </div>

                {/* Amount details */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-mono text-base font-extrabold text-foreground">{formatMoney(spent)}</span>
                    <span className="text-[11px] text-muted-foreground">
                      de <strong className="font-mono text-foreground font-semibold">{formatMoney(budget.amountLimit)}</strong>
                    </span>
                  </div>

                  {/* Traffic Light Progress Bar */}
                  <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        statusColor === 'emerald' ? 'bg-emerald-500' :
                        statusColor === 'amber' ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                    <span>{pct}% gastado</span>
                    <span>{remaining >= 0 ? `Quedan ${formatMoney(remaining)}` : `Superado por ${formatMoney(Math.abs(remaining))}`}</span>
                  </div>
                </div>
              </div>

              {/* Daily Available Spending Metric */}
              <div className="mt-4 rounded-xl border border-border/60 bg-secondary/40 p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Disponible Diario</p>
                  <p className="text-[11px] text-muted-foreground">{daysRemaining} días restantes</p>
                </div>
                <span className={`font-mono text-sm font-extrabold ${remaining <= 0 ? 'text-destructive' : 'text-primary'}`}>
                  {formatMoney(dailyAvailable)} / día
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Budget */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form onSubmit={handleCreateBudget} className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-serif text-lg font-bold">Nuevo Presupuesto</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground">Categoría de Gasto</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                >
                  {categories.filter((c) => c.type === 'expense').map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Límite Mensual (RD$)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="15000"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Umbral de Alerta (%)</label>
                <select
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                >
                  <option value="70">70% (Preventivo)</option>
                  <option value="80">80% (Estándar)</option>
                  <option value="90">90% (Crítico)</option>
                </select>
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
                Guardar Presupuesto
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
