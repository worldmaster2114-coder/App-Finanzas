import { useMemo, useState } from 'react';
import { Account, Category, Transaction } from '@/types/finance';
import { CategoryIcon } from './fast-entry-modal';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp, CircleDollarSign, CalendarDays } from 'lucide-react';

type DashboardAnalyticsProps = {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 2 }).format(amount);

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function DashboardAnalytics({
  accounts,
  categories,
  transactions,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
}: DashboardAnalyticsProps) {
  const [activePieIndex, setActivePieIndex] = useState<number | undefined>();

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

  // 50-30-20 Rule Calculation
  const rule503020 = useMemo(() => {
    let needs = 0; // 50% (Needs: Vivienda, Supermercado, Servicios, Salud, Transporte)
    let wants = 0; // 30% (Wants: Entretenimiento, Educación, Otros)

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

    return { needs, wants, savings, needsPct, wantsPct, savingsPct };
  }, [monthTransactions, categories, monthlyIncome]);

  return (
    <div className="space-y-6">
      {/* Month / Year Selector Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">Analítica Visual</h2>
          <p className="text-xs text-muted-foreground">Monitorea tu balance consolidado, flujo de caja y distribución de gastos.</p>
        </div>

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

      {/* Summary KPI Cards */}
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

        {/* Monthly Income */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ingresos del Mes</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight size={18} />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatMoney(monthlyIncome)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {monthTransactions.filter((t) => t.type === 'income').length} movimientos
          </p>
        </div>

        {/* Monthly Expenses */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gastos del Mes</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-destructive/15 text-destructive">
              <ArrowDownLeft size={18} />
            </span>
          </div>
          <p className="mt-3 font-mono text-2xl font-extrabold text-foreground">{formatMoney(monthlyExpenses)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {monthTransactions.filter((t) => t.type === 'expense').length} movimientos
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

      {/* 50-30-20 Rule Breakdown Widget */}
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card p-5 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div>
            <h3 className="font-serif text-lg font-bold text-foreground">Regla de Presupuesto 50 / 30 / 20</h3>
            <p className="text-xs text-muted-foreground">50% Necesidades • 30% Deseos • 20% Ahorro e Inversión</p>
          </div>
          <span className="rounded-lg bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-primary">Regla 50-30-20</span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {/* Needs 50% */}
          <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-600 dark:text-amber-400">50% Necesidades</span>
              <span className="font-mono text-xs font-bold text-foreground">{rule503020.needsPct}% / 50%</span>
            </div>
            <p className="font-mono text-lg font-bold text-foreground">{formatMoney(rule503020.needs)}</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all duration-500 ${rule503020.needsPct > 50 ? 'bg-destructive' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, rule503020.needsPct)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">Vivienda, Comida, Salud, Transporte</p>
          </div>

          {/* Wants 30% */}
          <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-600 dark:text-blue-400">30% Deseos y Ocio</span>
              <span className="font-mono text-xs font-bold text-foreground">{rule503020.wantsPct}% / 30%</span>
            </div>
            <p className="font-mono text-lg font-bold text-foreground">{formatMoney(rule503020.wants)}</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all duration-500 ${rule503020.wantsPct > 30 ? 'bg-destructive' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, rule503020.wantsPct)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">Entretenimiento, Ocio, Varios</p>
          </div>

          {/* Savings 20% */}
          <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">20% Ahorros e Inversión</span>
              <span className="font-mono text-xs font-bold text-foreground">{rule503020.savingsPct}% / 20%</span>
            </div>
            <p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(rule503020.savings)}</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, rule503020.savingsPct)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">Metas de ahorro, Fondo de reserva</p>
          </div>
        </div>
      </div>

      {/* Account Balances Grid */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Saldos por Cuenta</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {accounts.map((acc) => (
            <div key={acc.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 p-3">
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
            <span className="rounded-lg bg-secondary px-2 py-1 text-[10px] font-bold text-muted-foreground">Mobills Analytics</span>
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
    </div>
  );
}
