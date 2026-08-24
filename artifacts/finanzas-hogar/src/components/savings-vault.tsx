import { useState } from 'react';
import { Account, SavingsGoal } from '@/types/finance';
import { CategoryIcon } from './fast-entry-modal';
import { Plus, Target, CheckCircle2, PauseCircle, Palmtree, Laptop, Wrench, PiggyBank, ArrowUpRight, ArrowDownLeft, X, Sparkles, CalendarDays } from 'lucide-react';

type SavingsVaultProps = {
  goals: SavingsGoal[];
  accounts: Account[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onUpdateGoalAmount: (goalId: string, deltaAmount: number, accountId: string) => void;
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(amount);

const GOAL_ICONS = ['Target', 'Palmtree', 'Laptop', 'Wrench', 'PiggyBank', 'Sparkles'];
const GOAL_COLORS = ['#06b6d4', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];

export function SavingsVault({ goals, accounts, onAddGoal, onUpdateGoalAmount }: SavingsVaultProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);
  const [depositType, setDepositType] = useState<'deposit' | 'withdraw'>('deposit');
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');

  // Add Goal Form State
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState('Target');
  const [color, setColor] = useState('#3b82f6');

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const initial = parseFloat(initialAmount) || 0;
    if (!name.trim() || isNaN(target) || target <= 0 || !deadline) return;

    onAddGoal({
      name: name.trim(),
      targetAmount: target,
      currentAmount: initial,
      deadline,
      color,
      icon,
      status: initial >= target ? 'completed' : 'active',
    });

    setName('');
    setTargetAmount('');
    setInitialAmount('');
    setDeadline('');
    setIsAddModalOpen(false);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;

    const delta = depositType === 'deposit' ? amount : -amount;
    onUpdateGoalAmount(depositGoal.id, delta, selectedAccountId);

    setDepositGoal(null);
    setDepositAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">Bóveda de Ahorros</h2>
          <p className="text-xs text-muted-foreground">Define tus metas de futuro, visualiza tu progreso y calcula tu ritmo mensual de ahorro.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs transition hover:brightness-105 active:scale-98 focus-ring"
        >
          <Plus size={16} /> Crear Meta de Ahorro
        </button>
      </div>

      {/* Goals Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

          // Calculate recommended monthly deposit
          const deadlineDate = new Date(goal.deadline);
          const now = new Date();
          const monthsRemaining = Math.max(
            1,
            (deadlineDate.getFullYear() - now.getFullYear()) * 12 + (deadlineDate.getMonth() - now.getMonth())
          );
          const suggestedMonthly = remaining > 0 ? Math.ceil(remaining / monthsRemaining) : 0;

          return (
            <div
              key={goal.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/40 hover:shadow-md"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl text-white shadow-xs" style={{ backgroundColor: goal.color }}>
                      <CategoryIcon iconName={goal.icon} size={20} />
                    </span>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{goal.name}</h3>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <CalendarDays size={12} /> Meta: {new Date(goal.deadline).toLocaleDateString('es-DO', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                      goal.status === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : goal.status === 'paused'
                        ? 'bg-amber-500/15 text-amber-600'
                        : 'bg-primary/15 text-primary'
                    }`}
                  >
                    {goal.status === 'completed' ? 'Completado' : goal.status === 'paused' ? 'Pausado' : 'Activo'}
                  </span>
                </div>

                {/* Amount Progress */}
                <div className="mt-5 space-y-2">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-mono font-extrabold text-foreground text-base">
                      {formatMoney(goal.currentAmount)}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      de <strong className="font-mono font-semibold text-foreground">{formatMoney(goal.targetAmount)}</strong>
                    </span>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: goal.color }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>{pct}% completado</span>
                    {remaining > 0 && <span>Faltan {formatMoney(remaining)}</span>}
                  </div>
                </div>

                {/* Suggested Monthly Calculation */}
                {goal.status === 'active' && remaining > 0 && (
                  <div className="mt-4 rounded-xl border border-border/60 bg-secondary/40 p-2.5 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ahorro Mensual Sugerido</p>
                    <p className="font-mono text-xs font-bold text-primary mt-0.5">
                      {formatMoney(suggestedMonthly)} / mes durante {monthsRemaining} {monthsRemaining === 1 ? 'mes' : 'meses'}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-5 flex gap-2 pt-3 border-t border-border/50">
                <button
                  onClick={() => {
                    setDepositGoal(goal);
                    setDepositType('deposit');
                  }}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/20 py-2 text-xs font-bold transition focus-ring"
                >
                  <ArrowUpRight size={14} /> Depositar
                </button>
                <button
                  onClick={() => {
                    setDepositGoal(goal);
                    setDepositType('withdraw');
                  }}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-secondary text-muted-foreground hover:text-foreground py-2 text-xs font-bold transition focus-ring"
                >
                  <ArrowDownLeft size={14} /> Retirar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Goal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form onSubmit={handleCreateGoal} className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-serif text-xl font-bold">Nueva Meta de Ahorro</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground">Nombre de la Meta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Fondo para Viaje, Nueva Laptop..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-foreground">Monto Objetivo (RD$)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="50000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Monto Inicial (opcional)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Fecha Límite</label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Icono y Color</label>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {GOAL_ICONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setIcon(ic)}
                        className={`grid h-8 w-8 place-items-center rounded-lg border ${icon === ic ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
                      >
                        <CategoryIcon iconName={ic} size={16} />
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5 ml-auto">
                    {GOAL_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`h-6 w-6 rounded-full border-2 ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
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
                Guardar Meta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Deposit / Withdraw */}
      {depositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form onSubmit={handleDepositSubmit} className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-serif text-lg font-bold">
                {depositType === 'deposit' ? 'Abonar a' : 'Retirar de'} {depositGoal.name}
              </h3>
              <button type="button" onClick={() => setDepositGoal(null)} className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground">Monto (RD$)</label>
                <input
                  type="number"
                  required
                  min="1"
                  autoFocus
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 font-mono text-base font-bold outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Desde / Hacia Cuenta</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({formatMoney(acc.balance)})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setDepositGoal(null)}
                className="flex-1 h-10 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 h-10 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:brightness-105"
              >
                Confirmar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
