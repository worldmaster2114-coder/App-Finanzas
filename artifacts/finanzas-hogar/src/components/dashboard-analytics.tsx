import { useMemo, useState } from 'react';
import { Account, Budget, BudgetRuleConfig, BudgetRuleStrategy, Category, RecurringTransaction, Transaction } from '@/types/finance';
import { CategoryIcon } from './fast-entry-modal';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp, CircleDollarSign, CalendarDays, Share2, Users, Sliders, ShieldCheck, Zap, AlertCircle, ChevronRight, Check, PieChart as PieChartIcon, ArrowRight, Target, Plus, AlertTriangle } from 'lucide-react';

type DashboardAnalyticsProps = {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets?: Budget[];
  recurringTransactions?: RecurringTransaction[];
  budgetRuleConfig?: BudgetRuleConfig;
  onUpdateBudgetRule?: (config: BudgetRuleConfig) => void;
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onOpenShareHousehold?: () => void;
  onNavigateToBudgets?: () => void;
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(amount);

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function DashboardAnalytics({
  accounts,
  categories,
  transactions,
  budgets = [],
  recurringTransactions = [],
  budgetRuleConfig = { strategy: '50-30-20', needs: 50, wants: 30, savings: 20 },
  onUpdateBudgetRule,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onOpenShareHousehold,
  onNavigateToBudgets,
}: DashboardAnalyticsProps) {
  const [activePieIndex, setActivePieIndex] = useState<number | undefined>();
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  // Custom rule form state
  const [selectedStrategy, setSelectedStrategy] = useState<BudgetRuleStrategy>(budgetRuleConfig.strategy || '50-30-20');
  const [customNeeds, setCustomNeeds] = useState<number>(budgetRuleConfig.needs || 50);
  const [customWants, setCustomWants] = useState<number>(budgetRuleConfig.wants || 30);
  const [customSavings, setCustomSavings] = useState<number>(budgetRuleConfig.savings || 20);

  // Filter transactions for selected month/year
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Total balance consolidated across accounts
  const totalBalance = useMemo(() => accounts.reduce((acc, a) => acc + a.balance, 0), [accounts]);

  // Monthly Income and Expenses
  const monthlyIncome = useMemo(
    () => monthTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions]
  );

  const monthlyExpenses = useMemo(
    () => monthTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions]
  );

  const netSavings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? Math.max(0, Math.round((netSavings / monthlyIncome) * 100)) : 0;

  // Days left in current selected month for "Safe to Spend Today"
  const now = new Date();
  const isCurrentMonth = now.getMonth() === selectedMonth && now.getFullYear() === selectedYear;
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const currentDay = isCurrentMonth ? now.getDate() : 1;
  const daysRemaining = isCurrentMonth ? Math.max(1, daysInMonth - currentDay + 1) : daysInMonth;

  // Active Budget Rule Ratios
  const activeNeedsRatio = budgetRuleConfig.needs || 50;
  const activeWantsRatio = budgetRuleConfig.wants || 30;
  const activeSavingsRatio = budgetRuleConfig.savings || 20;

  // Pending recurring expenses for this month
  const pendingRecurringExpenses = useMemo(() => {
    return recurringTransactions
      .filter((rec) => {
        const d = new Date(rec.nextExecutionDate);
        return rec.type === 'expense' && d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && (!isCurrentMonth || d.getDate() >= currentDay);
      })
      .reduce((sum, r) => sum + r.amount, 0);
  }, [recurringTransactions, selectedMonth, selectedYear, isCurrentMonth, currentDay]);

  // Safe to Spend Today / Ritmo Diario Calculator
  const safeDailySpend = useMemo(() => {
    if (monthlyIncome <= 0) return 0;
    const totalExpenseBudget = monthlyIncome * ((activeNeedsRatio + activeWantsRatio) / 100);
    const availablePool = totalExpenseBudget - monthlyExpenses - pendingRecurringExpenses;
    return Math.max(0, Math.round(availablePool / daysRemaining));
  }, [monthlyIncome, activeNeedsRatio, activeWantsRatio, monthlyExpenses, pendingRecurringExpenses, daysRemaining]);

  // -------------------------------------------------------------
  // PRESUPUESTO PREVISTO VS GASTADO REAL
  // -------------------------------------------------------------
  const budgetSummary = useMemo(() => {
    // Total from user-defined category budgets
    const totalExplicit = (budgets || []).reduce((sum, b) => sum + b.amountLimit, 0);
    // Planned expense budget from rule if income is recorded
    const plannedFromRule = monthlyIncome > 0 ? monthlyIncome * ((activeNeedsRatio + activeWantsRatio) / 100) : 0;

    const totalPlanned = totalExplicit > 0 ? totalExplicit : plannedFromRule;
    const remaining = totalPlanned - monthlyExpenses;
    const percentUsed = totalPlanned > 0 ? Math.round((monthlyExpenses / totalPlanned) * 100) : 0;
    const percentRemaining = Math.max(0, 100 - percentUsed);

    // Detailed per-category budget progress
    const categoryBudgetList = (budgets || []).map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId);
      const spent = monthTransactions
        .filter((t) => t.type === 'expense' && t.categoryId === b.categoryId)
        .reduce((sum, t) => sum + t.amount, 0);
      const catRemaining = b.amountLimit - spent;
      const catPct = Math.round((spent / b.amountLimit) * 100);
      return {
        id: b.id,
        categoryName: cat?.name || 'Categoría',
        color: cat?.color || '#3b82f6',
        icon: cat?.icon || 'Tag',
        plannedLimit: b.amountLimit,
        spent,
        remaining: catRemaining,
        percent: catPct,
        isOver: spent > b.amountLimit,
      };
    });

    return {
      hasBudgets: totalExplicit > 0,
      totalPlanned,
      totalSpent: monthlyExpenses,
      remaining,
      percentUsed,
      percentRemaining,
      isOverBudget: totalPlanned > 0 && monthlyExpenses > totalPlanned,
      categoryBudgetList,
    };
  }, [budgets, monthlyIncome, activeNeedsRatio, activeWantsRatio, monthlyExpenses, categories, monthTransactions]);

  // Shared Expenses in Household
  const sharedExpensesSummary = useMemo(() => {
    const sharedTxs = monthTransactions.filter((t) => t.type === 'expense' && t.isShared);
    const totalShared = sharedTxs.reduce((sum, t) => sum + t.amount, 0);
    return {
      count: sharedTxs.length,
      total: totalShared,
    };
  }, [monthTransactions]);

  // Category Expense Distribution Data for Donut Chart
  const categoryData = useMemo(() => {
    const expMap: Record<string, number> = {};
    monthTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = categories.find((c) => c.id === t.categoryId);
        const name = cat ? cat.name : 'Otros Gastos';
        expMap[name] = (expMap[name] || 0) + t.amount;
      });

    return Object.entries(expMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => {
        const cat = categories.find((c) => c.name === name);
        return {
          name,
          value,
          color: cat?.color || '#94a3b8',
        };
      });
  }, [monthTransactions, categories]);

  // Cashflow Data (Last 6 months comparison)
  const cashflowData = useMemo(() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(selectedYear, selectedMonth - i, 1);
      const m = targetDate.getMonth();
      const y = targetDate.getFullYear();

      const txs = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === m && d.getFullYear() === y;
      });

      const inc = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      result.push({
        monthName: monthNames[m].slice(0, 3),
        Ingresos: inc,
        Gastos: exp,
      });
    }
    return result;
  }, [transactions, selectedMonth, selectedYear]);

  const yearsList = useMemo(() => {
    const set = new Set([new Date().getFullYear(), selectedYear]);
    transactions.forEach((t) => set.add(new Date(t.date).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [transactions, selectedYear]);

  // Adaptive Budget Rule Calculation
  const ruleAnalysis = useMemo(() => {
    let needs = 0;
    let wants = 0;

    monthTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = categories.find((c) => c.id === t.categoryId);
        const name = cat ? cat.name : '';
        if (
          name.includes('Super') ||
          name.includes('Vivienda') ||
          name.includes('Servicios') ||
          name.includes('Salud') ||
          name.includes('Transporte')
        ) {
          needs += t.amount;
        } else {
          wants += t.amount;
        }
      });

    const savings = Math.max(0, monthlyIncome - (needs + wants));

    const needsPct = monthlyIncome > 0 ? Math.round((needs / monthlyIncome) * 100) : 0;
    const wantsPct = monthlyIncome > 0 ? Math.round((wants / monthlyIncome) * 100) : 0;
    const savingsPct = monthlyIncome > 0 ? Math.round((savings / monthlyIncome) * 100) : 0;

    const idealNeeds = monthlyIncome * (activeNeedsRatio / 100);
    const idealWants = monthlyIncome * (activeWantsRatio / 100);
    const idealSavings = monthlyIncome * (activeSavingsRatio / 100);

    return {
      needs, wants, savings,
      needsPct, wantsPct, savingsPct,
      idealNeeds, idealWants, idealSavings,
    };
  }, [monthTransactions, categories, monthlyIncome, activeNeedsRatio, activeWantsRatio, activeSavingsRatio]);

  // Quick month selectors
  const handleQuickPeriod = (type: 'this_month' | 'prev_month') => {
    const current = new Date();
    if (type === 'this_month') {
      onMonthChange(current.getMonth());
      onYearChange(current.getFullYear());
    } else if (type === 'prev_month') {
      const prevDate = new Date(current.getFullYear(), current.getMonth() - 1, 1);
      onMonthChange(prevDate.getMonth());
      onYearChange(prevDate.getFullYear());
    }
  };

  // Smart Financial Health Diagnostic Advice
  const financialAdvice = useMemo(() => {
    if (monthlyIncome <= 0) {
      return {
        type: 'info',
        title: 'Registra tus ingresos',
        message: 'Añade tu salario o ingresos del mes para que el motor financiero analice tu distribución en tiempo real.',
      };
    }
    if (ruleAnalysis.needsPct > activeNeedsRatio) {
      return {
        type: 'warning',
        title: `Necesidades al ${ruleAnalysis.needsPct}% (Meta: ${activeNeedsRatio}%)`,
        message: `Tus necesidades consumen ${formatMoney(ruleAnalysis.needs)} (supera tu límite ideal de ${formatMoney(ruleAnalysis.idealNeeds)}). Revisa gastos fijos para ganar holgura.`,
      };
    }
    if (ruleAnalysis.wantsPct > activeWantsRatio) {
      return {
        type: 'warning',
        title: `Deseos y Ocio al ${ruleAnalysis.wantsPct}% (Meta: ${activeWantsRatio}%)`,
        message: `Estás destinando ${formatMoney(ruleAnalysis.wants)} a deseos (límite ideal: ${formatMoney(ruleAnalysis.idealWants)}). Intenta moderar salidas recreativas.`,
      };
    }
    if (ruleAnalysis.savingsPct >= activeSavingsRatio) {
      return {
        type: 'success',
        title: `¡Excelente Salud Financiera! (${ruleAnalysis.savingsPct}% de Ahorro)`,
        message: `Cumples tu objetivo: estás ahorrando ${formatMoney(ruleAnalysis.savings)} este mes. ¡Buen momento para abonar a tu Bóveda de Ahorros!`,
      };
    }
    return {
      type: 'neutral',
      title: `Distribución equilibrada (${ruleAnalysis.savingsPct}% de Ahorro)`,
      message: `Tus gastos están en rango saludable. Mantén el ritmo para alcanzar tu meta de ahorro del ${activeSavingsRatio}%.`,
    };
  }, [monthlyIncome, ruleAnalysis, activeNeedsRatio, activeWantsRatio, activeSavingsRatio]);

  const handleApplyRuleStrategy = (strategy: BudgetRuleStrategy) => {
    let n = 50, w = 30, s = 20;
    if (strategy === '70-20-10') { n = 70; w = 20; s = 10; }
    else if (strategy === '60-20-20') { n = 60; w = 20; s = 20; }
    else if (strategy === '80-20') { n = 80; w = 0; s = 20; }
    else if (strategy === 'custom') { n = customNeeds; w = customWants; s = customSavings; }

    setSelectedStrategy(strategy);
    setCustomNeeds(n);
    setCustomWants(w);
    setCustomSavings(s);

    if (onUpdateBudgetRule) {
      onUpdateBudgetRule({ strategy, needs: n, wants: w, savings: s });
    }
  };

  const handleSaveCustomRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (customNeeds + customWants + customSavings !== 100) return;
    if (onUpdateBudgetRule) {
      onUpdateBudgetRule({
        strategy: 'custom',
        needs: customNeeds,
        wants: customWants,
        savings: customSavings,
      });
    }
    setIsRuleModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Month / Year Selector Header with Quick Filter Chips */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">Analítica Visual</h2>
            <button
              onClick={() => setIsRuleModalOpen(true)}
              className="flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-extrabold text-primary hover:bg-primary/20 transition"
              title="Cambiar Estrategia Presupuestaria"
            >
              <Sliders size={11} /> Regla {activeNeedsRatio}/{activeWantsRatio}/{activeSavingsRatio}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Monitorea tu balance consolidado, flujo de caja y control presupuestario.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick period selectors */}
          <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/60">
            <button
              onClick={() => handleQuickPeriod('this_month')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear()
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Este Mes
            </button>
            <button
              onClick={() => handleQuickPeriod('prev_month')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-muted-foreground hover:text-foreground transition"
            >
              Mes Anterior
            </button>
          </div>

          {onOpenShareHousehold && (
            <button
              onClick={onOpenShareHousehold}
              className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/15 px-3 py-1.5 text-xs font-bold text-purple-400 hover:bg-purple-500/25 transition shadow-xs"
            >
              <Share2 size={14} /> Compartir Hogar
            </button>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 shadow-xs">
            <CalendarDays size={16} className="text-primary" />
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-foreground outline-none cursor-pointer"
            >
              {monthNames.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
            <span className="h-4 w-px bg-border" />
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-foreground outline-none cursor-pointer"
            >
              {yearsList.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 🌟 HERO CARD: CONTROL PRESUPUESTARIO (GASTADO VS PREVISTO) */}
      {/* ------------------------------------------------------------------ */}
      <div className={`rounded-3xl border p-5 sm:p-6 shadow-md transition-all ${
        budgetSummary.isOverBudget
          ? 'border-destructive/40 bg-gradient-to-br from-destructive/15 via-card to-card'
          : 'border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/60 gap-2">
          <div className="flex items-center gap-2.5">
            <span className={`grid h-9 w-9 place-items-center rounded-2xl ${
              budgetSummary.isOverBudget ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'
            } shadow-xs`}>
              <Target size={18} strokeWidth={2.5} />
            </span>
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">Control Presupuestario del Mes</h3>
              <p className="text-xs text-muted-foreground">
                {monthNames[selectedMonth]} {selectedYear} • {budgetSummary.hasBudgets ? 'Presupuestos Asignados' : 'Límite Estimado por Regla'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-extrabold capitalize ${
              budgetSummary.isOverBudget
                ? 'bg-destructive/20 text-destructive border border-destructive/30'
                : budgetSummary.percentUsed >= 80
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            }`}>
              {budgetSummary.isOverBudget
                ? '⚠️ Presupuesto Excedido'
                : budgetSummary.percentUsed >= 80
                ? '⚡ Cerca del Límite'
                : '✅ En Rango Saludable'}
            </span>
            {onNavigateToBudgets && (
              <button
                onClick={onNavigateToBudgets}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                Ajustar <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>

        {/* 3 Prominent Metrics: Previsto vs Gastado vs Quedó Disponible */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* 1. Presupuesto Previsto */}
          <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-xs">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Presupuesto Previsto
            </span>
            <p className="mt-1 font-mono text-2xl font-extrabold text-foreground">
              {budgetSummary.totalPlanned > 0 ? formatMoney(budgetSummary.totalPlanned) : 'Sin Definir'}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {budgetSummary.hasBudgets ? `${budgets.length} categorías presupuestadas` : `Base regla (${activeNeedsRatio + activeWantsRatio}%)`}
            </p>
          </div>

          {/* 2. Total Gastado */}
          <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-xs">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Total Gastado
            </span>
            <p className="mt-1 font-mono text-2xl font-extrabold text-destructive">
              {formatMoney(budgetSummary.totalSpent)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground font-semibold">
              {budgetSummary.percentUsed}% del presupuesto consumido
            </p>
          </div>

          {/* 3. Quedó Disponible / Restante */}
          <div className={`rounded-2xl border p-4 shadow-xs ${
            budgetSummary.isOverBudget
              ? 'border-destructive/40 bg-destructive/10'
              : 'border-emerald-500/40 bg-emerald-500/10'
          }`}>
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${
              budgetSummary.isOverBudget ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400'
            }`}>
              {budgetSummary.isOverBudget ? 'Déficit Excedido' : 'Quedó Disponible (Restante)'}
            </span>
            <p className={`mt-1 font-mono text-2xl font-extrabold ${
              budgetSummary.isOverBudget ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {budgetSummary.isOverBudget ? `- ${formatMoney(Math.abs(budgetSummary.remaining))}` : formatMoney(budgetSummary.remaining)}
            </p>
            <p className={`mt-1 text-[11px] font-medium ${
              budgetSummary.isOverBudget ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400'
            }`}>
              {budgetSummary.isOverBudget
                ? `Excediste el plan por ${formatMoney(Math.abs(budgetSummary.remaining))}`
                : `${budgetSummary.percentRemaining}% disponible para el resto del mes`}
            </p>
          </div>
        </div>

        {/* Global Progress Bar */}
        {budgetSummary.totalPlanned > 0 && (
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-muted-foreground">Progreso de Consumo:</span>
              <span className={`font-mono ${budgetSummary.isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
                {budgetSummary.percentUsed}% gastado
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-secondary/80">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  budgetSummary.isOverBudget
                    ? 'bg-destructive'
                    : budgetSummary.percentUsed >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, budgetSummary.percentUsed)}%` }}
              />
            </div>
          </div>
        )}

        {/* Category Budget Breakdown Preview */}
        {budgetSummary.categoryBudgetList.length > 0 && (
          <div className="mt-5 pt-4 border-t border-border/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Desglose de Presupuestos Activos ({budgetSummary.categoryBudgetList.length})
            </h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {budgetSummary.categoryBudgetList.map((catB) => (
                <div key={catB.id} className="rounded-2xl border border-border/60 bg-card/90 p-3.5 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-lg text-white" style={{ backgroundColor: catB.color }}>
                        <CategoryIcon iconName={catB.icon} size={14} />
                      </span>
                      <span className="text-xs font-bold text-foreground truncate">{catB.categoryName}</span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold ${catB.isOver ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {catB.percent}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs font-mono">
                    <span className="font-bold text-foreground">{formatMoney(catB.spent)}</span>
                    <span className="text-[11px] text-muted-foreground">de {formatMoney(catB.plannedLimit)}</span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all ${
                        catB.isOver ? 'bg-destructive' : catB.percent >= 80 ? 'bg-amber-500' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(100, catB.percent)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">
                      {catB.isOver ? 'Excedido:' : 'Quedan:'}
                    </span>
                    <span className={`font-mono font-bold ${catB.isOver ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatMoney(Math.abs(catB.remaining))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Smart Financial Diagnostic Alert */}
      <div className={`rounded-2xl border p-4 shadow-xs transition ${
        financialAdvice.type === 'success'
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200'
          : financialAdvice.type === 'warning'
          ? 'border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200'
          : 'border-blue-500/30 bg-blue-500/10 text-blue-950 dark:text-blue-200'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-background/80 shadow-xs text-base">
              {financialAdvice.type === 'success' ? '🏆' : financialAdvice.type === 'warning' ? '⚠️' : '💡'}
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-extrabold">{financialAdvice.title}</h4>
              <p className="mt-0.5 text-[11px] opacity-90 leading-relaxed">{financialAdvice.message}</p>
            </div>
          </div>
          <button
            onClick={() => setIsRuleModalOpen(true)}
            className="shrink-0 flex items-center gap-1 text-[11px] font-bold underline opacity-80 hover:opacity-100"
          >
            Ajustar Regla <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards + Safe Daily Spend (Ritmo Diario) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Consolidated Total Balance */}
        <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Patrimonio Neto</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
              <Wallet size={18} />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-extrabold text-foreground">{formatMoney(totalBalance)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{accounts.length} cuentas vinculadas</p>
        </div>

        {/* Safe Daily Spend (Ritmo Diario para Gastar Hoy) */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Gasto Seguro Hoy</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Zap size={18} />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {monthlyIncome > 0 ? formatMoney(safeDailySpend) : 'RD$ 0'}
            <span className="text-xs font-semibold text-muted-foreground"> / día</span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {daysRemaining} días restantes en el mes
          </p>
        </div>

        {/* Monthly Income & Expenses Ratio */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Flujo Mensual</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-destructive/15 text-destructive">
              <ArrowDownLeft size={18} />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-extrabold text-foreground">{formatMoney(monthlyExpenses)}</p>
          <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            Ingresos: +{formatMoney(monthlyIncome)}
          </p>
        </div>

        {/* Savings Rate KPI */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tasa de Ahorro</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <TrendingUp size={18} />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-extrabold text-foreground">{savingsRate}%</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {netSavings >= 0 ? `+${formatMoney(netSavings)} ahorrados` : `Déficit de ${formatMoney(Math.abs(netSavings))}`}
          </p>
        </div>
      </div>

      {/* Adaptive Budget Rule Breakdown Widget */}
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/60 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg font-bold text-foreground">
                Estrategia Presupuestaria ({activeNeedsRatio} / {activeWantsRatio} / {activeSavingsRatio})
              </h3>
              <button
                onClick={() => setIsRuleModalOpen(true)}
                className="text-xs font-bold text-primary hover:underline"
              >
                Cambiar
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {activeNeedsRatio}% Necesidades • {activeWantsRatio}% Deseos • {activeSavingsRatio}% Ahorro e Inversión
            </p>
          </div>
          <span className="rounded-lg bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-primary self-start sm:self-auto">
            Meta del Mes: {formatMoney(monthlyIncome)}
          </span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {/* Needs */}
          <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-600 dark:text-amber-400">{activeNeedsRatio}% Necesidades</span>
              <span className="font-mono text-xs font-bold text-foreground">{ruleAnalysis.needsPct}% / {activeNeedsRatio}%</span>
            </div>
            <p className="font-mono text-lg font-bold text-foreground">{formatMoney(ruleAnalysis.needs)}</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all duration-500 ${ruleAnalysis.needsPct > activeNeedsRatio ? 'bg-destructive' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, (ruleAnalysis.needsPct / activeNeedsRatio) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Tope ideal: {formatMoney(ruleAnalysis.idealNeeds)}</span>
              {ruleAnalysis.needs > ruleAnalysis.idealNeeds && (
                <span className="text-destructive font-bold">Excedido en {formatMoney(ruleAnalysis.needs - ruleAnalysis.idealNeeds)}</span>
              )}
            </div>
          </div>

          {/* Wants */}
          <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-600 dark:text-blue-400">{activeWantsRatio}% Deseos y Ocio</span>
              <span className="font-mono text-xs font-bold text-foreground">{ruleAnalysis.wantsPct}% / {activeWantsRatio}%</span>
            </div>
            <p className="font-mono text-lg font-bold text-foreground">{formatMoney(ruleAnalysis.wants)}</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all duration-500 ${ruleAnalysis.wantsPct > activeWantsRatio ? 'bg-destructive' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, activeWantsRatio > 0 ? (ruleAnalysis.wantsPct / activeWantsRatio) * 100 : 0)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Tope ideal: {formatMoney(ruleAnalysis.idealWants)}</span>
              {ruleAnalysis.wants > ruleAnalysis.idealWants && (
                <span className="text-destructive font-bold">Excedido en {formatMoney(ruleAnalysis.wants - ruleAnalysis.idealWants)}</span>
              )}
            </div>
          </div>

          {/* Savings */}
          <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{activeSavingsRatio}% Ahorro e Inversión</span>
              <span className="font-mono text-xs font-bold text-foreground">{ruleAnalysis.savingsPct}% / {activeSavingsRatio}%</span>
            </div>
            <p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(ruleAnalysis.savings)}</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, activeSavingsRatio > 0 ? (ruleAnalysis.savingsPct / activeSavingsRatio) * 100 : 0)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Meta ideal: {formatMoney(ruleAnalysis.idealSavings)}</span>
              {ruleAnalysis.savings >= ruleAnalysis.idealSavings ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">¡Meta lograda!</span>
              ) : (
                <span>Faltan {formatMoney(ruleAnalysis.idealSavings - ruleAnalysis.savings)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shared Household Expense Summary Card */}
      {sharedExpensesSummary.count > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-300">
              <Users size={20} />
            </span>
            <div>
              <h4 className="text-xs font-bold text-purple-950 dark:text-purple-200">Gastos Compartidos del Hogar</h4>
              <p className="text-[11px] text-purple-800 dark:text-purple-300">
                {sharedExpensesSummary.count} transacciones compartidas divididas en pareja/hogar.
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-base font-extrabold text-purple-950 dark:text-purple-200">
              {formatMoney(sharedExpensesSummary.total)}
            </p>
            <p className="text-[10px] text-purple-700 dark:text-purple-300 font-bold">Total Compartido</p>
          </div>
        </div>
      )}

      {/* Account Balances Grid */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Saldos por Cuenta</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {accounts.map((acc) => (
            <div key={acc.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 p-3 transition hover:bg-secondary/50">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl text-white shadow-xs" style={{ backgroundColor: acc.color }}>
                  <CategoryIcon iconName={acc.icon} size={16} />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">{acc.name}</p>
                  <p className="text-[10px] capitalize text-muted-foreground">{acc.type.replace('_', ' ')}</p>
                </div>
              </div>
              <span className={`font-mono text-xs font-bold ${acc.balance < 0 ? 'text-destructive' : 'text-foreground'}`}>
                {formatMoney(acc.balance)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Expense Category Distribution Donut Chart */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">Distribución de Gastos</h3>
              <p className="text-xs text-muted-foreground">Desglose por categoría del mes seleccionado</p>
            </div>
            <span className="rounded-lg bg-secondary px-2 py-1 text-[10px] font-bold text-muted-foreground">Visual Mobills</span>
          </div>

          {categoryData.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <CircleDollarSign size={36} className="text-muted-foreground/40 mb-2" />
              <p className="text-sm font-semibold text-muted-foreground">No hay gastos registrados este mes</p>
            </div>
          ) : (
            <div className="mt-4 grid items-center gap-4 sm:grid-cols-[1fr_180px]">
              <div className="relative h-60 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="65%"
                      outerRadius="88%"
                      paddingAngle={3}
                      stroke="none"
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onMouseLeave={() => setActivePieIndex(undefined)}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                          opacity={activePieIndex === undefined || activePieIndex === index ? 1 : 0.45}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => formatMoney(val)}
                      contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="font-mono text-base font-bold text-foreground">{formatMoney(monthlyExpenses)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Gastos</p>
                </div>
              </div>

              <div className="space-y-2">
                {categoryData.slice(0, 6).map((item, idx) => {
                  const pct = Math.round((item.value / monthlyExpenses) * 100);
                  return (
                    <div
                      key={item.name}
                      onMouseEnter={() => setActivePieIndex(idx)}
                      onMouseLeave={() => setActivePieIndex(undefined)}
                      className={`flex items-center gap-2 rounded-lg p-1.5 text-xs transition cursor-pointer ${
                        activePieIndex === idx ? 'bg-secondary font-bold' : ''
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate flex-1 text-foreground">{item.name}</span>
                      <span className="font-mono font-bold text-muted-foreground">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Cashflow Bar Chart (Income vs Expense 6-Month Trend) */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">Flujo de Caja (Últimos 6 meses)</h3>
              <p className="text-xs text-muted-foreground">Comparativa de Ingresos vs. Gastos</p>
            </div>
          </div>

          <div className="mt-4 h-60 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="monthName" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(val: number) => formatMoney(val)} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 12 }} />
                <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Budget Rule Strategy Selector Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Sliders size={18} />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground">Estrategia Presupuestaria</h3>
                  <p className="text-[11px] text-muted-foreground">Personaliza tus ratios según tu realidad financiera.</p>
                </div>
              </div>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {[
                { id: '50-30-20' as const, title: '50 / 30 / 20 (Clásica)', desc: '50% Necesidades • 30% Deseos • 20% Ahorro' },
                { id: '70-20-10' as const, title: '70 / 20 / 10 (Vida Real / Inflación)', desc: '70% Necesidades • 20% Deseos • 10% Ahorro' },
                { id: '60-20-20' as const, title: '60 / 20 / 20 (Equilibrio Progresivo)', desc: '60% Necesidades • 20% Deseos • 20% Ahorro' },
                { id: '80-20' as const, title: '80 / 20 (Regla de Pareto)', desc: '80% Gastos Totales • 20% Ahorro e Inversión' },
                { id: 'custom' as const, title: 'Personalizada (Ajuste Libre)', desc: 'Define tus propios porcentajes a medida.' },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => handleApplyRuleStrategy(opt.id)}
                  className={`flex items-start justify-between rounded-2xl border p-3 cursor-pointer transition ${
                    selectedStrategy === opt.id
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                      : 'border-border/60 bg-card hover:bg-secondary/40 text-foreground'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">{opt.title}</p>
                    <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                  </div>
                  {selectedStrategy === opt.id && <Check size={18} className="text-primary mt-0.5 shrink-0" />}
                </div>
              ))}
            </div>

            {/* Custom Sliders if Custom Selected */}
            {selectedStrategy === 'custom' && (
              <form onSubmit={handleSaveCustomRule} className="mt-4 space-y-3 rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Necesidades:</span>
                    <span className="font-mono text-primary">{customNeeds}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={customNeeds}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCustomNeeds(val);
                      const rem = 100 - val;
                      setCustomWants(Math.round(rem * 0.6));
                      setCustomSavings(Math.round(rem * 0.4));
                    }}
                    className="w-full accent-primary"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Deseos y Ocio:</span>
                    <span className="font-mono text-blue-500">{customWants}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={100 - customNeeds}
                    value={customWants}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCustomWants(val);
                      setCustomSavings(100 - customNeeds - val);
                    }}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Ahorro e Inversión:</span>
                    <span className="font-mono text-emerald-500">{customSavings}%</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Suma total: {customNeeds + customWants + customSavings}% {customNeeds + customWants + customSavings === 100 ? '✅' : '⚠️ Debe sumar 100%'}
                  </p>
                </div>
              </form>
            )}

            <button
              type="button"
              onClick={() => setIsRuleModalOpen(false)}
              className="mt-5 w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:brightness-105"
            >
              Cerrar y Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
