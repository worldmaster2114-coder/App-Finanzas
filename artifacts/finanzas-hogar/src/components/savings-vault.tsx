import { useState, useMemo } from 'react';
import { Account, DebtItem, SavingsGoal } from '@/types/finance';
import { CategoryIcon } from './fast-entry-modal';
import { Plus, Target, CheckCircle2, PauseCircle, Palmtree, Laptop, Wrench, PiggyBank, ArrowUpRight, ArrowDownLeft, X, Sparkles, CalendarDays, Flame, CreditCard, ShieldCheck, TrendingDown, ArrowRight, Zap } from 'lucide-react';

type SavingsVaultProps = {
  goals: SavingsGoal[];
  accounts: Account[];
  debts?: DebtItem[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onUpdateGoalAmount: (goalId: string, deltaAmount: number, accountId: string) => void;
  onAddDebt?: (debt: Omit<DebtItem, 'id'>) => void;
  onDeleteDebt?: (debtId: string) => void;
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(amount);

const GOAL_ICONS = ['Target', 'Palmtree', 'Laptop', 'Wrench', 'PiggyBank', 'Sparkles'];
const GOAL_COLORS = ['#06b6d4', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];

const DEFAULT_DEMO_DEBTS: DebtItem[] = [
  { id: 'debt-1', name: 'Tarjeta de Crédito Oro', totalBalance: 45000, minimumPayment: 3500, interestRate: 28, category: 'credit_card' },
  { id: 'debt-2', name: 'Préstamo Personal', totalBalance: 120000, minimumPayment: 6200, interestRate: 16.5, category: 'loan' },
];

export function SavingsVault({
  goals,
  accounts,
  debts = DEFAULT_DEMO_DEBTS,
  onAddGoal,
  onUpdateGoalAmount,
  onAddDebt,
  onDeleteDebt,
}: SavingsVaultProps) {
  const [activeTab, setActiveTab] = useState<'goals' | 'snowball'>('goals');
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

  // Snowball Simulator State
  const [extraPayment, setExtraPayment] = useState<number>(2000);
  const [debtStrategy, setDebtStrategy] = useState<'snowball' | 'avalanche'>('snowball');
  const [isAddDebtModalOpen, setIsAddDebtModalOpen] = useState(false);
  const [debtName, setDebtName] = useState('');
  const [debtBalance, setDebtBalance] = useState('');
  const [debtMinPay, setDebtMinPay] = useState('');
  const [debtRate, setDebtRate] = useState('');
  const [debtCategory, setDebtCategory] = useState<'credit_card' | 'loan' | 'mortgage' | 'personal'>('credit_card');

  // Local state for debts if not provided via props handler
  const [localDebts, setLocalDebts] = useState<DebtItem[]>(() => debts.length > 0 ? debts : DEFAULT_DEMO_DEBTS);

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

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(debtBalance);
    const minP = parseFloat(debtMinPay);
    const rate = parseFloat(debtRate) || 0;
    if (!debtName.trim() || isNaN(bal) || bal <= 0 || isNaN(minP) || minP <= 0) return;

    const newDebt: DebtItem = {
      id: `debt-${Date.now()}`,
      name: debtName.trim(),
      totalBalance: bal,
      minimumPayment: minP,
      interestRate: rate,
      category: debtCategory,
    };

    if (onAddDebt) {
      onAddDebt(newDebt);
    } else {
      setLocalDebts((prev) => [...prev, newDebt]);
    }

    setDebtName('');
    setDebtBalance('');
    setDebtMinPay('');
    setDebtRate('');
    setIsAddDebtModalOpen(false);
  };

  const handleDeleteDebtItem = (id: string) => {
    if (onDeleteDebt) {
      onDeleteDebt(id);
    } else {
      setLocalDebts((prev) => prev.filter((d) => d.id !== id));
    }
  };

  // Debt Snowball Calculation
  const sortedDebts = useMemo(() => {
    return [...localDebts].sort((a, b) => {
      if (debtStrategy === 'snowball') {
        return a.totalBalance - b.totalBalance; // Smallest balance first
      }
      return b.interestRate - a.interestRate; // Highest interest rate first (Avalanche)
    });
  }, [localDebts, debtStrategy]);

  const totalDebtBalance = useMemo(() => localDebts.reduce((sum, d) => sum + d.totalBalance, 0), [localDebts]);
  const totalMinPayment = useMemo(() => localDebts.reduce((sum, d) => sum + d.minimumPayment, 0), [localDebts]);

  // Estimated months to become debt-free
  const debtFreeMonths = useMemo(() => {
    const totalMonthly = totalMinPayment + (extraPayment || 0);
    if (totalMonthly <= 0) return 0;
    return Math.ceil(totalDebtBalance / totalMonthly);
  }, [totalDebtBalance, totalMinPayment, extraPayment]);

  const debtFreeMonthsWithoutExtra = useMemo(() => {
    if (totalMinPayment <= 0) return 0;
    return Math.ceil(totalDebtBalance / totalMinPayment);
  }, [totalDebtBalance, totalMinPayment]);

  const monthsSaved = Math.max(0, debtFreeMonthsWithoutExtra - debtFreeMonths);

  return (
    <div className="space-y-6">
      {/* Header & Tab Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">Bóveda de Ahorros & Deudas</h2>
            <div className="flex items-center gap-1 rounded-xl bg-secondary p-1 border border-border/60">
              <button
                onClick={() => setActiveTab('goals')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition ${
                  activeTab === 'goals' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <PiggyBank size={14} /> Metas de Ahorro
              </button>
              <button
                onClick={() => setActiveTab('snowball')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition ${
                  activeTab === 'snowball' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Flame size={14} /> Bola de Nieve (Deudas)
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {activeTab === 'goals'
              ? 'Define tus metas de futuro, visualiza tu progreso y calcula tu ritmo mensual de ahorro.'
              : 'Estrategia probada para liquidar deudas rápidamente y liberar tu flujo de caja.'}
          </p>
        </div>

        {activeTab === 'goals' ? (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs transition hover:brightness-105 active:scale-98 focus-ring"
          >
            <Plus size={16} /> Crear Meta de Ahorro
          </button>
        ) : (
          <button
            onClick={() => setIsAddDebtModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground shadow-xs transition hover:brightness-105 active:scale-98 focus-ring"
          >
            <Plus size={16} /> Registrar Deuda / Tarjeta
          </button>
        )}
      </div>

      {/* TAB 1: SAVINGS GOALS */}
      {activeTab === 'goals' && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

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

                  <div className="mt-5 space-y-2">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-mono font-extrabold text-foreground text-base">
                        {formatMoney(goal.currentAmount)}
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        de <strong className="font-mono font-semibold text-foreground">{formatMoney(goal.targetAmount)}</strong>
                      </span>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: goal.color,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                      <span>{pct}% completado</span>
                      <span>Faltan {formatMoney(remaining)}</span>
                    </div>
                  </div>

                  {remaining > 0 && (
                    <div className="mt-4 rounded-xl bg-secondary/50 p-2.5 text-[11px] text-muted-foreground flex items-center gap-2">
                      <Sparkles size={14} className="text-primary shrink-0" />
                      <span>Ritmo recomendado: <strong>{formatMoney(suggestedMonthly)}/mes</strong></span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-border/60 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setDepositGoal(goal);
                      setDepositType('deposit');
                    }}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-primary/10 border border-primary/20 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition"
                  >
                    <ArrowUpRight size={14} /> Abonar
                  </button>
                  <button
                    onClick={() => {
                      setDepositGoal(goal);
                      setDepositType('withdraw');
                    }}
                    className="flex items-center justify-center rounded-xl bg-secondary p-2 text-xs text-muted-foreground hover:text-foreground transition"
                    title="Retirar fondos"
                  >
                    <ArrowDownLeft size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: DEBT SNOWBALL & AVALANCHE SIMULATOR */}
      {activeTab === 'snowball' && (
        <div className="space-y-6">
          {/* Snowball KPI & Free Date Card */}
          <div className="rounded-2xl border border-destructive/30 bg-gradient-to-r from-destructive/10 via-card to-card p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/60 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-destructive/15 text-destructive font-bold">
                    <Flame size={18} />
                  </span>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-foreground">Estrategia Bola de Nieve</h3>
                    <p className="text-xs text-muted-foreground">Paga el mínimo en todas y ataca una deuda con todo el excedente.</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDebtStrategy('snowball')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    debtStrategy === 'snowball' ? 'bg-destructive text-destructive-foreground shadow-xs' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  Bola de Nieve (Menor Saldo)
                </button>
                <button
                  onClick={() => setDebtStrategy('avalanche')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    debtStrategy === 'avalanche' ? 'bg-destructive text-destructive-foreground shadow-xs' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  Avalancha (Mayor Interés)
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Deuda Total Consolidada</span>
                <p className="font-mono text-xl font-extrabold text-destructive">{formatMoney(totalDebtBalance)}</p>
                <p className="text-[10px] text-muted-foreground">{localDebts.length} préstamos/tarjetas activas</p>
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Pago Mensual Base</span>
                <p className="font-mono text-xl font-extrabold text-foreground">{formatMoney(totalMinPayment)}</p>
                <p className="text-[10px] text-muted-foreground">+ Abono Extra: {formatMoney(extraPayment)}</p>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase">Tiempo para ser Libre</span>
                <p className="font-mono text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  {debtFreeMonths} meses
                </p>
                <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-semibold">
                  {monthsSaved > 0 ? `🚀 ¡Aceleras ${monthsSaved} meses con tu abono extra!` : 'Sin abono extra'}
                </p>
              </div>
            </div>

            {/* Extra Payment Slider */}
            <div className="mt-5 rounded-xl bg-secondary/40 p-4 border border-border/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Zap size={15} className="text-amber-500" /> Simular Abono Extra Mensual:
                </span>
                <span className="font-mono text-base text-primary">+{formatMoney(extraPayment)} / mes</span>
              </div>
              <input
                type="range"
                min="0"
                max="25000"
                step="500"
                value={extraPayment}
                onChange={(e) => setExtraPayment(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
          </div>

          {/* Sorted Payoff Order List */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Secuencia Óptima de Pago ({debtStrategy === 'snowball' ? 'Bola de Nieve' : 'Avalancha'})
            </h3>

            <div className="space-y-3">
              {sortedDebts.map((debt, index) => {
                const isTargetFirst = index === 0;
                return (
                  <div
                    key={debt.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border p-4 transition gap-3 ${
                      isTargetFirst
                        ? 'border-destructive/50 bg-destructive/10 shadow-xs'
                        : 'border-border/60 bg-secondary/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl font-bold text-sm ${
                        isTargetFirst ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-muted-foreground'
                      }`}>
                        #{index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-foreground">{debt.name}</h4>
                          {isTargetFirst && (
                            <span className="rounded-md bg-destructive text-destructive-foreground px-2 py-0.5 text-[9px] font-extrabold uppercase">
                              🎯 Atacar Primero
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Pago mínimo: <strong className="text-foreground">{formatMoney(debt.minimumPayment)}</strong> • Interés: {debt.interestRate}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
                      <div className="text-left sm:text-right">
                        <p className="font-mono text-base font-extrabold text-foreground">{formatMoney(debt.totalBalance)}</p>
                        <p className="text-[10px] text-muted-foreground">Saldo pendiente</p>
                      </div>
                      <button
                        onClick={() => handleDeleteDebtItem(debt.id)}
                        className="text-xs text-muted-foreground hover:text-destructive p-1 rounded-lg transition"
                        title="Eliminar registro de deuda"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h3 className="font-serif text-lg font-bold text-foreground">Nueva Meta de Ahorro</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="mt-4 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Nombre de la Meta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Fondo de Emergencia, Vacaciones, Auto"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Monto Objetivo (RD$)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="100,000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Monto Inicial (RD$)</label>
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
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Fecha Límite</label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Ícono</label>
                <div className="mt-1.5 flex gap-2">
                  {GOAL_ICONS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className={`grid h-10 w-10 place-items-center rounded-xl border transition ${
                        icon === i ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-secondary text-muted-foreground'
                      }`}
                    >
                      <CategoryIcon iconName={i} size={18} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Color</label>
                <div className="mt-1.5 flex gap-2">
                  {GOAL_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full border-2 transition ${
                        color === c ? 'scale-110 border-foreground' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:brightness-105"
              >
                Crear Meta
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Debt Modal */}
      {isAddDebtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h3 className="font-serif text-lg font-bold text-foreground">Registrar Préstamo / Tarjeta</h3>
              <button
                onClick={() => setIsAddDebtModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="mt-4 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Nombre del Pasivo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Tarjeta Banreservas, Préstamo Vehículo"
                  value={debtName}
                  onChange={(e) => setDebtName(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Saldo Adeudado (RD$)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="45,000"
                    value={debtBalance}
                    onChange={(e) => setDebtBalance(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Pago Mínimo Mensual (RD$)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="3,500"
                    value={debtMinPay}
                    onChange={(e) => setDebtMinPay(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Tasa de Interés Anual (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="28.0"
                    value={debtRate}
                    onChange={(e) => setDebtRate(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Categoría</label>
                  <select
                    value={debtCategory}
                    onChange={(e: any) => setDebtCategory(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                  >
                    <option value="credit_card">Tarjeta de Crédito</option>
                    <option value="loan">Préstamo Personal</option>
                    <option value="mortgage">Hipotecario</option>
                    <option value="personal">Otro</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-destructive py-2.5 text-xs font-bold text-destructive-foreground shadow-xs hover:brightness-105"
              >
                Guardar en Plan Bola de Nieve
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Deposit/Withdraw Amount Modal */}
      {depositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h3 className="font-serif text-base font-bold text-foreground">
                {depositType === 'deposit' ? 'Abonar a la Meta' : 'Retirar de la Meta'}
              </h3>
              <button
                onClick={() => setDepositGoal(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-bold text-foreground">{depositGoal.name}</p>
                <p className="text-[11px] text-muted-foreground">Saldo actual: {formatMoney(depositGoal.currentAmount)}</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Monto a {depositType === 'deposit' ? 'abonar' : 'retirar'} (RD$)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="5,000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-mono font-bold outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  {depositType === 'deposit' ? 'Debitar de Cuenta:' : 'Acreditar a Cuenta:'}
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatMoney(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:brightness-105"
              >
                Confirmar {depositType === 'deposit' ? 'Abono' : 'Retiro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
