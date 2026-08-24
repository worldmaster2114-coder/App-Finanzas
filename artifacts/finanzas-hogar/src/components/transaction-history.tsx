import { useMemo, useState } from 'react';
import { Account, Category, Transaction } from '@/types/finance';
import { CategoryIcon } from './fast-entry-modal';
import { exportToCSV, exportToJSON } from '@/services/storage';
import { Search, Filter, Trash2, Download, FileJson, FileSpreadsheet, ChevronDown } from 'lucide-react';

type TransactionHistoryProps = {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  fullDataState: any;
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
  onDeleteTransaction,
}: TransactionHistoryProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [accountFilter, setAccountFilter] = useState('Todas');
  const [typeFilter, setTypeFilter] = useState('Todos');

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        if (categoryFilter !== 'Todas' && t.categoryId !== categoryFilter) return false;
        if (accountFilter !== 'Todas' && t.accountId !== accountFilter) return false;
        if (typeFilter !== 'Todos' && t.type !== typeFilter) return false;
        if (search.trim()) {
          const note = (t.note || '').toLowerCase();
          const catName = (categories.find((c) => c.id === t.categoryId)?.name || '').toLowerCase();
          const q = search.toLowerCase();
          if (!note.includes(q) && !catName.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, categories, categoryFilter, accountFilter, typeFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header & Export Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">Historial y Exportación</h2>
          <p className="text-xs text-muted-foreground">Consulta, filtra y exporta todos los registros de tu hogar.</p>
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

      {/* Filter Bar */}
      <div className="grid gap-2 sm:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por concepto..."
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

      {/* List */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border/50 px-2 text-xs font-bold text-muted-foreground">
          <span>{filtered.length} registros encontrados</span>
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

              return (
                <div key={t.id} className="flex items-center justify-between py-3 px-2 hover:bg-secondary/40 rounded-xl transition">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl text-white shadow-xs`}
                      style={{ backgroundColor: isTransfer ? '#3b82f6' : cat?.color || '#94a3b8' }}
                    >
                      <CategoryIcon iconName={cat?.icon || 'Tag'} size={18} />
                    </span>
                    <div>
                      <p className="font-bold text-sm text-foreground">{t.note || cat?.name || 'Movimiento'}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <span>{isTransfer ? `${acc?.name} ➔ ${destAcc?.name}` : acc?.name}</span>
                        <span>•</span>
                        <span>{shortDate.format(new Date(t.date))}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-sm font-extrabold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                      {isIncome ? '+' : isTransfer ? '' : '-'} {formatMoney(t.amount)}
                    </span>
                    <button
                      onClick={() => onDeleteTransaction(t.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition focus-ring"
                      title="Eliminar registro"
                    >
                      <Trash2 size={15} />
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
