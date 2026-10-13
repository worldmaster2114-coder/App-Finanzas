import { useMemo, useState } from 'react';
import { Account, Category, Transaction, UserProfile } from '@/types/finance';
import { CategoryIcon } from './fast-entry-modal';
import { exportToCSV, exportToJSON } from '@/services/storage';
import { resolveTransactionAuthor } from '@/lib/household-authors';
import { Search, Trash2, FileJson, FileSpreadsheet, ChevronDown, Users, UserCheck } from 'lucide-react';

type TransactionHistoryProps = {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  fullDataState: any;
  currentUser?: UserProfile | null;
  onDeleteTransaction: (id: string) => void;
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 2 }).format(amount);

const shortDate = new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'short', year: 'numeric' });

export function TransactionHistory({
  transactions,
  accounts,
  categories,
  fullDataState,
  currentUser,
  onDeleteTransaction,
}: TransactionHistoryProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [accountFilter, setAccountFilter] = useState('Todas');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'prev_month'>('month');
  const [sharedFilter, setSharedFilter] = useState<'all' | 'shared_only' | 'personal_only'>('all');
  const [memberFilter, setMemberFilter] = useState<'all' | 'daniel' | 'ariadna'>('all');

  // Household member stats calculation across active timeframe
  const memberStats = useMemo(() => {
    let danielExpenses = 0;
    let danielIncomes = 0;
    let danielCount = 0;

    let ariadnaExpenses = 0;
    let ariadnaIncomes = 0;
    let ariadnaCount = 0;

    transactions.forEach((tx) => {
      const author = resolveTransactionAuthor(tx, currentUser);
      if (author.isAriadna) {
        ariadnaCount += 1;
        if (tx.type === 'expense') ariadnaExpenses += tx.amount;
        if (tx.type === 'income') ariadnaIncomes += tx.amount;
      } else {
        danielCount += 1;
        if (tx.type === 'expense') danielExpenses += tx.amount;
        if (tx.type === 'income') danielIncomes += tx.amount;
      }
    });

    const totalExpenses = danielExpenses + ariadnaExpenses;
    const danielRatio = totalExpenses > 0 ? Math.round((danielExpenses / totalExpenses) * 100) : 50;
    const ariadnaRatio = totalExpenses > 0 ? 100 - danielRatio : 50;

    return {
      danielExpenses,
      danielIncomes,
      danielCount,
      ariadnaExpenses,
      ariadnaIncomes,
      ariadnaCount,
      totalExpenses,
      danielRatio,
      ariadnaRatio,
    };
  }, [transactions, currentUser]);

  const filtered = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions
      .filter((t) => {
        const tDate = new Date(t.date);

        // Timeframe filtering
        if (timeframeFilter === 'today') {
          const isToday = tDate.getDate() === now.getDate() && tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (timeframeFilter === 'week') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (tDate < sevenDaysAgo) return false;
        } else if (timeframeFilter === 'month') {
          if (tDate.getMonth() !== currentMonth || tDate.getFullYear() !== currentYear) return false;
        } else if (timeframeFilter === 'prev_month') {
          const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
          if (tDate.getMonth() !== prevMonthDate.getMonth() || tDate.getFullYear() !== prevMonthDate.getFullYear()) return false;
        }

        // Member author filtering (Daniel vs Ariadna)
        if (memberFilter !== 'all') {
          const author = resolveTransactionAuthor(t, currentUser);
          if (memberFilter === 'daniel' && !author.isDaniel) return false;
          if (memberFilter === 'ariadna' && !author.isAriadna) return false;
        }

        // Shared expense filtering
        if (sharedFilter === 'shared_only' && !t.isShared) return false;
        if (sharedFilter === 'personal_only' && t.isShared) return false;

        // Standard dropdown filters
        if (categoryFilter !== 'Todas' && t.categoryId !== categoryFilter) return false;
        if (accountFilter !== 'Todas' && t.accountId !== accountFilter) return false;
        if (typeFilter !== 'Todos' && t.type !== typeFilter) return false;

        // Search text
        if (search.trim()) {
          const note = (t.note || '').toLowerCase();
          const catName = (categories.find((c) => c.id === t.categoryId)?.name || '').toLowerCase();
          const author = resolveTransactionAuthor(t, currentUser);
          const authorName = author.name.toLowerCase();
          const q = search.toLowerCase();
          if (!note.includes(q) && !catName.includes(q) && !authorName.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, categories, categoryFilter, accountFilter, typeFilter, timeframeFilter, sharedFilter, memberFilter, search, currentUser]);

  return (
    <div className="space-y-6">
      {/* Header & Export Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">Historial del Hogar</h2>
          <p className="text-xs text-muted-foreground">
            Consulta, filtra y separa los registros de <strong className="text-emerald-600 dark:text-emerald-400">Daniel (Verde)</strong> y <strong className="text-amber-600 dark:text-amber-400">Ariadna (Amarillo)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(fullDataState)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground transition hover:bg-secondary focus-ring"
          >
            <FileSpreadsheet size={15} className="text-emerald-600 dark:text-emerald-400" /> Exportar CSV
          </button>
          <button
            onClick={() => exportToJSON(fullDataState)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground transition hover:bg-secondary focus-ring"
          >
            <FileJson size={15} className="text-primary" /> Backup JSON
          </button>
        </div>
      </div>

      {/* Household Split Summary Cards & Color Legend (Daniel = Verde, Ariadna = Amarillo) */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold flex items-center gap-1.5 text-foreground">
            <Users size={15} className="text-primary" /> Distribución de Gastos por Miembro
          </span>
          <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
            Separación de registros por código de color
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Daniel Card (Verde) */}
          <button
            type="button"
            onClick={() => setMemberFilter(memberFilter === 'daniel' ? 'all' : 'daniel')}
            className={`flex flex-col gap-1 p-3 rounded-xl border-l-[6px] border-l-emerald-500 border transition text-left ${
              memberFilter === 'daniel'
                ? 'bg-emerald-500/15 border-emerald-500/50 shadow-xs'
                : 'bg-emerald-500/5 border-border/80 hover:bg-emerald-500/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Daniel
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {memberStats.danielCount} movs
              </span>
            </div>
            <p className="font-mono text-base font-extrabold text-foreground">
              {formatMoney(memberStats.danielExpenses)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {memberStats.danielRatio}% del gasto total
            </p>
          </button>

          {/* Ariadna Card (Amarillo) */}
          <button
            type="button"
            onClick={() => setMemberFilter(memberFilter === 'ariadna' ? 'all' : 'ariadna')}
            className={`flex flex-col gap-1 p-3 rounded-xl border-l-[6px] border-l-amber-400 border transition text-left ${
              memberFilter === 'ariadna'
                ? 'bg-amber-400/20 border-amber-400/50 shadow-xs'
                : 'bg-amber-400/5 border-border/80 hover:bg-amber-400/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Ariadna
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300">
                {memberStats.ariadnaCount} movs
              </span>
            </div>
            <p className="font-mono text-base font-extrabold text-foreground">
              {formatMoney(memberStats.ariadnaExpenses)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {memberStats.ariadnaRatio}% del gasto total
            </p>
          </button>
        </div>

        {/* Visual Ratio Bar */}
        {memberStats.totalExpenses > 0 && (
          <div className="space-y-1 pt-1">
            <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden flex">
              <div
                style={{ width: `${memberStats.danielRatio}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Daniel: ${memberStats.danielRatio}%`}
              />
              <div
                style={{ width: `${memberStats.ariadnaRatio}%` }}
                className="bg-amber-400 transition-all duration-500"
                title={`Ariadna: ${memberStats.ariadnaRatio}%`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Member Filter Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-muted-foreground shrink-0 flex items-center gap-1">
          <UserCheck size={14} /> Filtrar por:
        </span>
        <button
          onClick={() => setMemberFilter('all')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 ${
            memberFilter === 'all'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'border border-border/70 bg-card text-muted-foreground hover:bg-secondary'
          }`}
        >
          Todos los miembros ({transactions.length})
        </button>
        <button
          onClick={() => setMemberFilter('daniel')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 ${
            memberFilter === 'daniel'
              ? 'border-2 border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 shadow-xs'
              : 'border border-border/70 bg-card text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Daniel ({memberStats.danielCount})
        </button>
        <button
          onClick={() => setMemberFilter('ariadna')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 ${
            memberFilter === 'ariadna'
              ? 'border-2 border-amber-400 bg-amber-400/25 text-amber-900 dark:text-amber-100 shadow-xs'
              : 'border border-border/70 bg-card text-amber-800 dark:text-amber-200 hover:bg-amber-400/10'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          Ariadna ({memberStats.ariadnaCount})
        </button>
      </div>

      {/* Quick Timeframe Filter Pills */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 bg-secondary/50 p-1 rounded-xl border border-border/60 shrink-0">
          {[
            { id: 'month' as const, label: 'Este Mes' },
            { id: 'today' as const, label: 'Hoy' },
            { id: 'week' as const, label: 'Últimos 7 días' },
            { id: 'prev_month' as const, label: 'Mes Anterior' },
            { id: 'all' as const, label: 'Todo el Historial' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setTimeframeFilter(pill.id)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                timeframeFilter === pill.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Shared filter toggle */}
        <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/60 shrink-0">
          <button
            onClick={() => setSharedFilter('all')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              sharedFilter === 'all' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSharedFilter('shared_only')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              sharedFilter === 'shared_only' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-600 dark:text-purple-400'
            }`}
          >
            <Users size={13} /> Compartidos
          </button>
        </div>
      </div>

      {/* Search and Secondary Filter Bar */}
      <div className="grid gap-2 sm:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por concepto o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-xs outline-none focus:border-primary"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 w-full appearance-none rounded-xl border border-input bg-card px-3 pr-8 text-xs outline-none focus:border-primary"
          >
            <option value="Todas">Todas las Categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Account Filter */}
        <div className="relative">
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="h-10 w-full appearance-none rounded-xl border border-input bg-card px-3 pr-8 text-xs outline-none focus:border-primary"
          >
            <option value="Todas">Todas las Cuentas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 w-full appearance-none rounded-xl border border-input bg-card px-3 pr-8 text-xs outline-none focus:border-primary"
          >
            <option value="Todos">Todos los Tipos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
            <option value="transfer">Transferencias</option>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {/* Transactions Table-Style List */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/50 px-2 gap-2 text-xs font-bold text-muted-foreground">
          <span>{filtered.length} registros encontrados</span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-mono">
              + {formatMoney(filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0))}
            </span>
            <span className="text-destructive font-mono">
              - {formatMoney(filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0))}
            </span>
          </div>
        </div>

        <div className="divide-y divide-border/60">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              No se encontraron movimientos con los filtros seleccionados.
            </div>
          ) : (
            filtered.map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId);
              const acc = accounts.find((a) => a.id === t.accountId);
              const destAcc = accounts.find((a) => a.id === t.destinationAccountId);
              const isIncome = t.type === 'income';
              const isTransfer = t.type === 'transfer';
              const author = resolveTransactionAuthor(t, currentUser);

              return (
                <div
                  key={t.id}
                  className={`flex items-center justify-between py-3 px-3 transition rounded-xl my-1 border border-border/50 ${author.borderClass} ${author.rowBgClass}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white shadow-xs"
                      style={{ backgroundColor: isTransfer ? '#3b82f6' : cat?.color || '#94a3b8' }}
                    >
                      <CategoryIcon iconName={isTransfer ? 'Landmark' : cat?.icon || 'Tag'} size={18} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-xs text-foreground truncate">
                          {t.note || (isTransfer ? `Trsf. a ${destAcc?.name || 'Cuenta'}` : cat?.name || 'Sin Categoría')}
                        </p>
                        
                        {/* Member Attribution Badge (🟢 Daniel | 🟡 Ariadna) */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold border ${author.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${author.dotClass}`} />
                          {author.name}
                        </span>

                        {t.isShared && (
                          <span className="flex items-center gap-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.2 text-[8px] font-extrabold text-purple-600 dark:text-purple-300">
                            <Users size={9} /> {t.splitRatio || 50}% Hogar
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {acc?.name || 'Cuenta'} {destAcc && `➔ ${destAcc.name}`} • {shortDate.format(new Date(t.date))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-mono text-xs font-extrabold ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : isTransfer ? 'text-blue-500' : 'text-foreground'
                      }`}
                    >
                      {isIncome ? '+ ' : isTransfer ? '⇄ ' : '- '}
                      {formatMoney(t.amount)}
                    </span>
                    <button
                      onClick={() => onDeleteTransaction(t.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-lg transition"
                      title="Eliminar registro"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
