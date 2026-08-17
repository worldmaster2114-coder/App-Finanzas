import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowDownLeft, ArrowUpRight, BarChart3, CalendarDays, Check, ChevronDown, CircleDollarSign, Coffee, CreditCard, Filter, Home as HomeIcon, Landmark, LayoutDashboard, Menu, Plus, Search, Settings2, ShoppingBasket, Sparkles, Trash2, TrendingUp, Utensils, Wallet, X } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import type { ReactNode } from 'react';

const queryClient = new QueryClient();
const STORAGE_KEY = 'finanzas-hogar:transactions';
const incomeCategories = ['Salario', 'Trabajos Extras', 'Inversiones', 'Otros'];
const expenseCategories = ['Supermercado/Comida', 'Servicios', 'Vivienda', 'Transporte/Combustible', 'Salud', 'Educación', 'Mantenimiento', 'Entretenimiento', 'Otros'];
const categoryColors: Record<string, string> = {
  'Supermercado/Comida': '#e59466',
  Servicios: '#78a6a0',
  Vivienda: '#5f7774',
  'Transporte/Combustible': '#e2bd62',
  Salud: '#c48778',
  Educación: '#89a9c2',
  Mantenimiento: '#9b9b79',
  Entretenimiento: '#b68ba6',
  Otros: '#a89e8c',
};

type TransactionModel = {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
};

const money = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 2 });
const shortDate = new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'short' });
const longDate = new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'long', year: 'numeric' });
const monthFormatter = new Intl.DateTimeFormat('es-DO', { month: 'long', year: 'numeric' });
const monthNames = Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat('es-DO', { month: 'long' }).format(new Date(2024, i, 1)));

function makeSeedData(): TransactionModel[] {
  const now = new Date();
  const day = (n: number) => new Date(now.getFullYear(), now.getMonth(), n, 12).toISOString();
  return [
    { id: 'seed-1', title: 'Nómina mensual', amount: 68500, type: 'income', category: 'Salario', date: day(1) },
    { id: 'seed-2', title: 'Compra del súper', amount: 8420, type: 'expense', category: 'Supermercado/Comida', date: day(3) },
    { id: 'seed-3', title: 'Renta del apartamento', amount: 22000, type: 'expense', category: 'Vivienda', date: day(5) },
    { id: 'seed-4', title: 'Plan de internet', amount: 2599, type: 'expense', category: 'Servicios', date: day(7) },
    { id: 'seed-5', title: 'Metro y gasolina', amount: 3760, type: 'expense', category: 'Transporte/Combustible', date: day(10) },
    { id: 'seed-6', title: 'Diseño freelance', amount: 12500, type: 'income', category: 'Trabajos Extras', date: day(12) },
    { id: 'seed-7', title: 'Cena con amigos', amount: 2880, type: 'expense', category: 'Entretenimiento', date: day(15) },
  ];
}

function readTransactions(): TransactionModel[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    }
    const seed = makeSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  } catch {
    return makeSeedData();
  }
}

function formatMonth(date: Date) {
  const result = monthFormatter.format(date);
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function CategoryIcon({ category, size = 17 }: { category: string; size?: number }) {
  const Icon = category.includes('Super') || category.includes('Comida') ? ShoppingBasket : category === 'Vivienda' ? HomeIcon : category.includes('Transporte') ? CreditCard : category === 'Salud' ? Sparkles : category === 'Salario' ? Landmark : category.includes('Entretenimiento') ? Coffee : category === 'Inversiones' ? TrendingUp : CircleDollarSign;
  return <Icon size={size} strokeWidth={1.8} />;
}

function AppShell({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const goTo = (target: 'dashboard' | 'history') => {
    setLocation('/');
    window.setTimeout(() => document.getElementById(target === 'history' ? 'history' : 'dashboard')?.scrollIntoView({ behavior: 'smooth' }), 50);
    setMobileMenu(false);
  };
  return (
    <div className="min-h-[100dvh] bg-background md:flex">
      <aside className="hidden md:flex md:w-[240px] lg:w-[268px] shrink-0 flex-col bg-sidebar px-5 py-6 text-sidebar-foreground">
        <button onClick={() => goTo('dashboard')} className="focus-ring flex items-center gap-3 px-2 text-left" data-testid="button-brand">
          <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"><Wallet size={21} strokeWidth={2.3} /></span>
          <span><span className="block font-serif text-[22px] leading-none tracking-tight">Al día</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-[.22em] text-sidebar-foreground/55">finanzas personales</span></span>
        </button>
        <div className="mt-14">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[.2em] text-sidebar-foreground/40">Tu espacio</p>
          <nav className="mt-3 space-y-1">
            <button onClick={() => goTo('dashboard')} className="group flex w-full items-center gap-3 rounded-xl bg-sidebar-accent px-3 py-3 text-sm font-semibold text-sidebar-accent-foreground transition hover:bg-sidebar-accent/80 focus-ring" data-testid="button-nav-dashboard"><LayoutDashboard size={18} /><span>Resumen</span><span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" /></button>
            <button onClick={() => goTo('history')} className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-sidebar-foreground/68 transition hover:bg-sidebar-accent/60 hover:text-sidebar-foreground focus-ring" data-testid="button-nav-history"><BarChart3 size={18} /><span>Historial</span></button>
          </nav>
        </div>
        <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-4">
          <span className="mb-3 grid h-8 w-8 place-items-center rounded-full bg-sidebar-primary/15 text-sidebar-primary"><Sparkles size={15} /></span>
          <p className="font-serif text-[17px] leading-tight">Cada peso claro es un poco de calma.</p>
          <p className="mt-2 text-[11px] leading-relaxed text-sidebar-foreground/52">Pequeños registros, decisiones más tranquilas.</p>
        </div>
        <div className="mt-5 flex items-center gap-3 border-t border-sidebar-border pt-5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#d6a985] text-xs font-extrabold text-[#3a3029]">TÚ</span>
          <div><p className="text-xs font-bold">Mi hogar</p><p className="text-[10px] text-sidebar-foreground/45">Solo en este dispositivo</p></div>
          <Settings2 size={15} className="ml-auto text-sidebar-foreground/40" />
        </div>
      </aside>
       <header className="mobile-header flex h-[74px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md md:hidden">
        <button onClick={() => setMobileMenu(!mobileMenu)} className="focus-ring rounded-lg p-2 text-foreground" data-testid="button-mobile-menu" aria-label="Abrir menú"><Menu size={21} /></button>
        <button onClick={() => goTo('dashboard')} className="flex items-center gap-2.5 font-serif text-[22px] focus-ring" data-testid="button-mobile-brand"><span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary text-primary-foreground"><Wallet size={17} /></span>Al día</button>
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-transaction'))} className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground transition hover:brightness-95 focus-ring" data-testid="button-mobile-add" aria-label="Añadir movimiento"><Plus size={19} /></button>
      </header>
      {mobileMenu && <div className="fixed inset-0 z-30 bg-foreground/20 md:hidden" onClick={() => setMobileMenu(false)}><nav className="w-[78%] max-w-[290px] h-full bg-sidebar p-5 text-sidebar-foreground shadow-xl" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between"><span className="font-serif text-2xl">Al día</span><button onClick={() => setMobileMenu(false)} className="focus-ring rounded-lg p-2" data-testid="button-close-menu"><X size={19} /></button></div><p className="mt-12 px-2 text-[10px] font-bold uppercase tracking-[.2em] text-sidebar-foreground/40">Tu espacio</p><button onClick={() => goTo('dashboard')} className="mt-3 flex w-full items-center gap-3 rounded-xl bg-sidebar-accent px-3 py-3 text-sm font-semibold focus-ring" data-testid="button-mobile-nav-dashboard"><LayoutDashboard size={18} />Resumen</button><button onClick={() => goTo('history')} className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm focus-ring" data-testid="button-mobile-nav-history"><BarChart3 size={18} />Historial</button></nav></div>}
       <main className="min-w-0 flex-1 pb-24 md:pb-8">{children}</main>
       <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-border/80 bg-card/95 px-4 backdrop-blur-lg md:hidden">
        <button onClick={() => goTo('dashboard')} className="flex flex-col items-center gap-1 text-primary focus-ring" data-testid="button-bottom-dashboard"><LayoutDashboard size={19} /><span className="text-[10px] font-bold">Resumen</span></button>
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-transaction'))} className="grid h-12 w-12 -translate-y-2 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md focus-ring" data-testid="button-bottom-add"><Plus size={23} /></button>
        <button onClick={() => goTo('history')} className="flex flex-col items-center gap-1 text-muted-foreground focus-ring" data-testid="button-bottom-history"><BarChart3 size={19} /><span className="text-[10px] font-bold">Historial</span></button>
      </nav>
    </div>
  );
}

function StatCard({ label, amount, kind, detail, delay }: { label: string; amount: number; kind: 'income' | 'expense' | 'balance'; detail: string; delay: string }) {
  const positive = kind === 'income' || kind === 'balance';
  return <div className={`animate-rise ${delay} rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${kind === 'balance' ? 'border-primary/20 bg-primary text-primary-foreground' : 'border-card-border bg-card'}`} data-testid={`card-stat-${kind}`}>
    <div className="flex items-center justify-between"><span className={`text-xs font-semibold ${kind === 'balance' ? 'text-primary-foreground/65' : 'text-muted-foreground'}`}>{label}</span><span className={`grid h-8 w-8 place-items-center rounded-full ${kind === 'balance' ? 'bg-primary-foreground/12 text-accent' : positive ? 'bg-[#dcece3] text-primary' : 'bg-[#f7dfd4] text-[#b45e4c]'}`}>{positive ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}</span></div>
    <p className={`mt-5 font-mono text-[clamp(1.25rem,2.2vw,1.65rem)] font-bold tracking-tight ${kind === 'balance' ? 'text-primary-foreground' : 'text-foreground'}`}>{money.format(amount)}</p>
    <p className={`mt-2 text-[11px] ${kind === 'balance' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{detail}</p>
  </div>;
}

function DistributionChart({ data, total }: { data: { name: string; value: number; color: string }[]; total: number }) {
  const [active, setActive] = useState<number | undefined>();
  if (!data.length) return <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl bg-secondary/35 px-8 text-center"><span className="grid h-12 w-12 place-items-center rounded-full bg-accent/25 text-primary"><BarChart3 size={22} /></span><p className="mt-4 font-serif text-xl">Aún no hay gastos aquí</p><p className="mt-1 max-w-[240px] text-xs leading-relaxed text-muted-foreground">Registra tu primer gasto del mes y verás cómo se reparte.</p></div>;
  return <div className="grid items-center gap-2 sm:grid-cols-[minmax(200px,1fr)_minmax(150px,.8fr)]">
    <div className="relative h-[260px] min-w-0">
      <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="88%" paddingAngle={3} stroke="none" onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(undefined)}>{data.map((entry, index) => <Cell key={entry.name} fill={entry.color} opacity={active === undefined || active === index ? 1 : .42} />)}</Pie><Tooltip formatter={(value: number) => money.format(value)} contentStyle={{ borderRadius: 12, border: '1px solid #e3dccc', background: '#fffaf1', fontSize: 12, color: '#29403b' }} /></PieChart></ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><p className="font-mono text-lg font-bold text-foreground">{money.format(total)}</p><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">en gastos</p></div>
    </div>
    <div className="space-y-3 px-2 pb-2 sm:px-0">{data.slice(0, 5).map((item, index) => <div key={item.name} className="flex items-center gap-2 text-xs" onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(undefined)}><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className={`min-w-0 flex-1 truncate ${active === index ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>{item.name}</span><span className="font-mono text-[11px] font-bold text-foreground">{Math.round(item.value / total * 100)}%</span></div>)}{data.length > 5 && <p className="pt-1 text-[10px] text-muted-foreground">+ {data.length - 5} categorías más</p>}</div>
  </div>;
}

function TransactionRow({ transaction, onDelete }: { transaction: TransactionModel; onDelete: (transaction: TransactionModel) => void }) {
  const income = transaction.type === 'income';
  return <div className="group flex items-center gap-3 border-b border-border/60 py-3.5 last:border-0" data-testid={`row-transaction-${transaction.id}`}>
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${income ? 'bg-[#dcece3] text-primary' : 'bg-[#f8e5d9] text-[#b45e4c]'}`}><CategoryIcon category={transaction.category} /></span>
     <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-foreground" data-testid={`text-transaction-title-${transaction.id}`}>{transaction.title}</p><div className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground"><span className="truncate">{transaction.category}</span><span className="shrink-0 text-border">·</span><span className="shrink-0">{shortDate.format(new Date(transaction.date))}</span></div></div>
    <span className={`shrink-0 font-mono text-xs font-bold ${income ? 'text-primary' : 'text-foreground'}`} data-testid={`text-transaction-amount-${transaction.id}`}>{income ? '+' : '−'} {money.format(transaction.amount)}</span>
     <button onClick={() => onDelete(transaction)} className="ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground opacity-100 transition hover:bg-[#f8e5d9] hover:text-destructive focus:opacity-100 focus-ring sm:h-8 sm:w-8 sm:opacity-0 sm:group-hover:opacity-100" data-testid={`button-delete-transaction-${transaction.id}`} aria-label={`Eliminar ${transaction.title}`}><Trash2 size={15} /></button>
  </div>;
}

function TransactionModal({ onClose, onSave }: { onClose: () => void; onSave: (transaction: TransactionModel) => void }) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(expenseCategories[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const categories = type === 'income' ? incomeCategories : expenseCategories;
  useEffect(() => { setCategory(categories[0]); }, [type]);
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) { setError('Completa el concepto y un monto válido.'); return; }
    onSave({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title: title.trim(), amount: Number(amount), type, category, date: new Date(`${date}T12:00:00`).toISOString() });
  };
   return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="transaction-title">
     <form onSubmit={submit} className="animate-modal max-h-[calc(100dvh-0.75rem)] w-full max-w-[520px] overflow-y-auto rounded-t-[26px] border border-card-border bg-card p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-[26px] sm:p-8">
      <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">Nuevo registro</p><h2 id="transaction-title" className="mt-1 font-serif text-[29px] leading-tight">¿Qué pasó con tu dinero?</h2></div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-muted-foreground transition hover:text-foreground focus-ring" data-testid="button-close-transaction"><X size={18} /></button></div>
      <div className="mt-7 grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1"><button type="button" onClick={() => setType('expense')} className={`rounded-lg py-2.5 text-xs font-bold transition ${type === 'expense' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`} data-testid="button-type-expense"><ArrowDownLeft size={15} className="mr-1 inline" />Gasto</button><button type="button" onClick={() => setType('income')} className={`rounded-lg py-2.5 text-xs font-bold transition ${type === 'income' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`} data-testid="button-type-income"><ArrowUpRight size={15} className="mr-1 inline" />Ingreso</button></div>
      <div className="mt-6 grid gap-4"><label className="grid gap-1.5"><span className="text-xs font-bold">Concepto</span><input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === 'expense' ? 'Ej. Compra del súper' : 'Ej. Nómina mensual'} className="h-11 rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-transaction-title" /></label><div className="grid grid-cols-2 gap-3"><label className="grid gap-1.5"><span className="text-xs font-bold">Monto</span><div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">RD$</span><input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="h-11 w-full rounded-xl border border-input bg-background pl-12 pr-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-transaction-amount" /></div></label><label className="grid gap-1.5"><span className="text-xs font-bold">Fecha</span><div className="relative"><CalendarDays size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-transaction-date" /></div></label></div><label className="grid gap-1.5"><span className="text-xs font-bold">Categoría</span><div className="relative"><select value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 w-full appearance-none rounded-xl border border-input bg-background px-3.5 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="select-transaction-category">{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" /></div></label></div>
      {error && <p className="mt-3 text-xs font-semibold text-destructive" data-testid="status-form-error">{error}</p>}
      <div className="mt-7 flex gap-3"><button type="button" onClick={onClose} className="h-11 flex-1 rounded-xl border border-border bg-transparent text-sm font-bold text-muted-foreground transition hover:bg-secondary focus-ring" data-testid="button-cancel-transaction">Cancelar</button><button type="submit" className="h-11 flex-[1.4] rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-ring" data-testid="button-save-transaction"><Check size={16} className="mr-2 inline" />Guardar movimiento</button></div>
    </form>
  </div>;
}

function DeleteDialog({ transaction, onCancel, onConfirm }: { transaction: TransactionModel; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 p-5 backdrop-blur-[2px]" role="alertdialog" aria-modal="true"><div className="animate-modal w-full max-w-[390px] rounded-[24px] border border-card-border bg-card p-7 shadow-2xl"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#f8e5d9] text-destructive"><Trash2 size={19} /></span><h2 className="mt-5 font-serif text-2xl">¿Eliminar este movimiento?</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Se quitará <strong className="text-foreground">{transaction.title}</strong> del historial. Esta acción no se puede deshacer.</p><div className="mt-7 flex gap-3"><button onClick={onCancel} className="h-11 flex-1 rounded-xl border border-border text-sm font-bold text-muted-foreground transition hover:bg-secondary focus-ring" data-testid="button-cancel-delete">Conservar</button><button onClick={onConfirm} className="h-11 flex-1 rounded-xl bg-destructive text-sm font-bold text-destructive-foreground transition hover:brightness-95 focus-ring" data-testid="button-confirm-delete">Sí, eliminar</button></div></div></div>;
}

function Dashboard() {
  const now = new Date();
  const [transactions, setTransactions] = useState<TransactionModel[]>(readTransactions);
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TransactionModel | null>(null);
  const [savedMessage, setSavedMessage] = useState('');
  const [showAll, setShowAll] = useState(false);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { const open = () => setModalOpen(true); window.addEventListener('open-transaction', open); return () => window.removeEventListener('open-transaction', open); }, []);
  useEffect(() => { if (!savedMessage) return; const timer = window.setTimeout(() => setSavedMessage(''), 2800); return () => window.clearTimeout(timer); }, [savedMessage]);
  const monthTransactions = useMemo(() => transactions.filter((t) => { const date = new Date(t.date); return date.getMonth() === month && date.getFullYear() === year; }), [transactions, month, year]);
  const income = monthTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = monthTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const categoryData = useMemo(() => Object.entries(monthTransactions.filter((t) => t.type === 'expense').reduce<Record<string, number>>((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {})).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value, color: categoryColors[name] || '#a89e8c' })), [monthTransactions]);
  const years = useMemo(() => Array.from(new Set([now.getFullYear(), ...transactions.map((t) => new Date(t.date).getFullYear())])).sort((a, b) => b - a), [transactions, now]);
  const filteredHistory = useMemo(() => monthTransactions.filter((t) => (categoryFilter === 'Todas' || t.category === categoryFilter) && t.title.toLowerCase().includes(search.toLowerCase())).sort((a, b) => +new Date(b.date) - +new Date(a.date)), [monthTransactions, categoryFilter, search]);
  const visibleHistory = showAll ? filteredHistory : filteredHistory.slice(0, 6);
  const allCategories = Array.from(new Set(monthTransactions.map((t) => t.category)));
  const saveTransaction = (transaction: TransactionModel) => { setTransactions((current) => [...current, transaction]); setModalOpen(false); setSavedMessage('Movimiento guardado'); setMonth(new Date(transaction.date).getMonth()); setYear(new Date(transaction.date).getFullYear()); };
  const confirmDelete = () => { if (!deleteTarget) return; setTransactions((current) => current.filter((t) => t.id !== deleteTarget.id)); setDeleteTarget(null); setSavedMessage('Movimiento eliminado'); };
  const displayMonth = formatMonth(new Date(year, month, 1));
  return <div id="dashboard" className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div className="animate-rise"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-primary">Resumen de tu hogar</p><h1 className="mt-2 max-w-[610px] font-serif text-[clamp(2rem,4vw,3.25rem)] leading-[1.03] tracking-tight">Tu dinero, con espacio para respirar.</h1><p className="mt-3 text-sm text-muted-foreground">Una mirada amable a lo que entra y sale este mes.</p></div><button onClick={() => setModalOpen(true)} className="animate-rise delay-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-ring sm:w-auto" data-testid="button-add-transaction"><Plus size={18} />Añadir movimiento</button></div>
    <div className="mt-9 flex flex-wrap items-center gap-2.5 border-b border-border/80 pb-5"><div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"><CalendarDays size={16} className="text-primary" /><select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-transparent text-xs font-bold capitalize outline-none" data-testid="select-filter-month">{monthNames.map((name, index) => <option value={index} key={name}>{name}</option>)}</select><span className="h-4 w-px bg-border" /><select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-transparent text-xs font-bold outline-none" data-testid="select-filter-year">{years.map((item) => <option value={item} key={item}>{item}</option>)}</select></div><span className="ml-1 hidden text-xs text-muted-foreground sm:inline">Mostrando {displayMonth}</span>{savedMessage && <span className="ml-auto flex animate-rise items-center gap-1.5 text-xs font-bold text-primary" data-testid="status-save-feedback"><Check size={14} />{savedMessage}</span>}</div>
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Balance del mes" amount={income - expenses} kind="balance" detail={income - expenses >= 0 ? 'Vas por buen camino' : 'Revisa tus gastos este mes'} delay="delay-1" /><StatCard label="Ingresos" amount={income} kind="income" detail={`${monthTransactions.filter((t) => t.type === 'income').length} ${monthTransactions.filter((t) => t.type === 'income').length === 1 ? 'movimiento' : 'movimientos'}`} delay="delay-2" /><StatCard label="Gastos" amount={expenses} kind="expense" detail={`${monthTransactions.filter((t) => t.type === 'expense').length} ${monthTransactions.filter((t) => t.type === 'expense').length === 1 ? 'movimiento' : 'movimientos'}`} delay="delay-3" /><div className="animate-rise delay-4 rounded-2xl border border-card-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-muted-foreground">Tasa de ahorro</span><span className="grid h-8 w-8 place-items-center rounded-full bg-[#e2eee6] text-primary"><TrendingUp size={17} /></span></div><p className="mt-5 font-mono text-[clamp(1.25rem,2.2vw,1.65rem)] font-bold tracking-tight">{income ? `${Math.max(0, Math.round((income - expenses) / income * 100))}%` : '—'}</p><p className="mt-2 text-[11px] text-muted-foreground">de tus ingresos permanecen</p></div></section>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.03fr_.97fr]"><section className="animate-rise delay-2 rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Distribución</p><h2 className="mt-1 font-serif text-2xl">¿A dónde se fue?</h2></div><span className="rounded-lg bg-secondary px-2.5 py-1 text-[10px] font-bold text-muted-foreground">Gastos</span></div><div className="mt-4"><DistributionChart data={categoryData} total={expenses} /></div></section><section id="history" className="animate-rise delay-3 rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Actividad reciente</p><h2 className="mt-1 font-serif text-2xl">Tu historial</h2></div><span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-muted-foreground">{filteredHistory.length} registros</span></div><div className="mt-5 flex gap-2"><label className="relative min-w-0 flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar movimiento" className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-xs outline-none transition placeholder:text-muted-foreground/65 focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-search-history" /></label><div className="relative"><Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-10 max-w-[135px] appearance-none rounded-xl border border-input bg-background pl-8 pr-7 text-xs outline-none focus:border-primary" data-testid="select-filter-category"><option value="Todas">Todas</option>{allCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" /></div></div><div className="mt-2">{visibleHistory.length ? visibleHistory.map((t) => <TransactionRow key={t.id} transaction={t} onDelete={setDeleteTarget} />) : <div className="flex min-h-[190px] flex-col items-center justify-center px-4 text-center"><span className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground"><Search size={21} /></span><p className="mt-4 font-serif text-xl">{search || categoryFilter !== 'Todas' ? 'No encontramos movimientos' : 'Tu historial está en blanco'}</p><p className="mt-1 max-w-[250px] text-xs leading-relaxed text-muted-foreground">{search || categoryFilter !== 'Todas' ? 'Prueba otra búsqueda o categoría.' : 'Los movimientos que registres aparecerán aquí.'}</p></div>}</div>{filteredHistory.length > 6 && <button onClick={() => setShowAll(!showAll)} className="mt-3 w-full rounded-xl py-2.5 text-xs font-bold text-primary transition hover:bg-secondary focus-ring" data-testid="button-toggle-history">{showAll ? 'Ver menos' : `Ver todos los movimientos (${filteredHistory.length})`}</button>}</section></div>
    <p className="mt-7 flex items-center justify-center gap-2 text-center text-[11px] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-primary/60" />Tus datos se guardan solo en este dispositivo.</p>
    {modalOpen && <TransactionModal onClose={() => setModalOpen(false)} onSave={saveTransaction} />}
    {deleteTarget && <DeleteDialog transaction={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />}
  </div>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return <RoutedErrorBoundary><AppShell><Switch><Route path="/" component={Dashboard} /><Route component={() => <div className="p-10 font-serif text-3xl">Página no encontrada</div>} /></Switch></AppShell></RoutedErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;