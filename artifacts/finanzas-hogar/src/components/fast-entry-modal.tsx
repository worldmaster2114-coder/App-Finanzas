import { useState, useMemo } from 'react';
import { Account, Category, Transaction, TransactionType } from '@/types/finance';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Check, ChevronDown, Delete, X, Wallet, Building2, CreditCard, PiggyBank, ShoppingBasket, Home, Zap, Car, HeartPulse, GraduationCap, Coffee, Tag, Landmark, Briefcase, TrendingUp, CircleDollarSign, Users, Calculator, Sparkles, Percent } from 'lucide-react';

type FastEntryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  onSaveTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
};

const ICON_MAP: Record<string, any> = {
  Wallet, Building2, CreditCard, PiggyBank,
  ShoppingBasket, Home, Zap, Car, HeartPulse, GraduationCap, Coffee, Tag,
  Landmark, Briefcase, TrendingUp, CircleDollarSign
};

export function CategoryIcon({ iconName, size = 18 }: { iconName: string; size?: number }) {
  const IconComponent = ICON_MAP[iconName] || Tag;
  return <IconComponent size={size} strokeWidth={2} />;
}

// Safe math expression evaluator for the calculator keypad
function evaluateMath(expr: string): number | null {
  if (!expr.trim()) return null;
  // Clean expression: only allow numbers, dots, and basic operators
  const sanitized = expr.replace(/[^0-9.+\-*/]/g, '');
  if (!sanitized) return null;
  // Check if expression ends with an operator
  if (/[+\-*/.]$/.test(sanitized)) return null;

  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`'use strict'; return (${sanitized})`)();
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return Math.round(result * 100) / 100;
    }
  } catch (e) {
    return null;
  }
  return null;
}

export function FastEntryModal({ isOpen, onClose, accounts, categories, onSaveTransaction }: FastEntryModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [destinationAccountId, setDestinationAccountId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [error, setError] = useState('');

  // Shared household split feature (50/50 or custom)
  const [isSharedSplit, setIsSharedSplit] = useState(false);
  const [splitRatio, setSplitRatio] = useState<number>(50); // 50 = 50/50

  // Calculated live amount (Hook must run unconditionally in every render)
  const computedValue = useMemo(() => {
    if (!amountStr) return 0;
    if (/[+\-*/]/.test(amountStr)) {
      const val = evaluateMath(amountStr);
      return val !== null ? val : 0;
    }
    const num = parseFloat(amountStr);
    return isNaN(num) ? 0 : num;
  }, [amountStr]);

  if (!isOpen) return null;

  const activeCategories = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense'));
  const currentCategory = categories.find((c) => c.id === selectedCategoryId) || activeCategories[0];

  // In-app Keypad handler with math operations (+, -, *, /)
  const handleKeypadPress = (val: string) => {
    setError('');
    if (val === 'C') {
      setAmountStr('');
      return;
    }
    if (val === 'BACKSPACE') {
      setAmountStr((prev) => prev.slice(0, -1));
      return;
    }
    if (val === '=') {
      const result = evaluateMath(amountStr);
      if (result !== null) {
        setAmountStr(result.toString());
      }
      return;
    }
    if (['+', '-', '*', '/'].includes(val)) {
      if (!amountStr) return;
      // If already ends in an operator, replace it
      if (/[+\-*/]$/.test(amountStr)) {
        setAmountStr((prev) => prev.slice(0, -1) + val);
      } else {
        setAmountStr((prev) => prev + val);
      }
      return;
    }
    if (val === '.') {
      const parts = amountStr.split(/[+\-*/]/);
      const lastPart = parts[parts.length - 1] || '';
      if (lastPart.includes('.')) return;
      setAmountStr((prev) => (prev === '' || /[+\-*/]$/.test(prev) ? prev + '0.' : prev + '.'));
      return;
    }

    // Limit decimals to 2 places in current token
    const parts = (amountStr + val).split(/[+\-*/]/);
    const lastPart = parts[parts.length - 1] || '';
    if (lastPart.includes('.')) {
      const [, decimals] = lastPart.split('.');
      if (decimals && decimals.length > 2) return;
    }

    setAmountStr((prev) => (prev === '0' && val !== '.' ? val : prev + val));
  };

  const handleSave = () => {
    let finalAmount = computedValue;
    if (/[+\-*/]/.test(amountStr)) {
      const evaluated = evaluateMath(amountStr);
      if (evaluated !== null && evaluated > 0) {
        finalAmount = evaluated;
      }
    }

    if (isNaN(finalAmount) || finalAmount <= 0) {
      setError('Ingresa un monto válido mayor a 0');
      return;
    }

    if (type !== 'transfer' && !currentCategory) {
      setError('Selecciona una categoría');
      return;
    }

    if (type === 'transfer' && selectedAccountId === destinationAccountId) {
      setError('La cuenta destino debe ser diferente a la origen');
      return;
    }

    onSaveTransaction({
      accountId: selectedAccountId,
      destinationAccountId: type === 'transfer' ? destinationAccountId : undefined,
      categoryId: type === 'transfer' ? 'cat-exp-8' : (currentCategory?.id || 'cat-exp-8'),
      amount: finalAmount,
      type,
      date: new Date(`${date}T12:00:00`).toISOString(),
      note: note.trim() || undefined,
      isRecurring: false,
      isShared: isSharedSplit && type === 'expense',
      splitRatio: isSharedSplit && type === 'expense' ? splitRatio : undefined,
    });

    // Reset & Close
    setAmountStr('');
    setNote('');
    setError('');
    setIsSharedSplit(false);
    onClose();
  };

  const currentAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-xs transition-opacity sm:items-center sm:p-4">
      <div className="w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl border border-border bg-card p-4 sm:p-6 shadow-2xl animate-in slide-in-from-bottom-5 sm:rounded-3xl">
        
        {/* Header with Account Switcher & Type Tabs */}
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="relative">
            <button
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="flex items-center gap-2 rounded-xl bg-secondary/80 px-3 py-1.5 text-xs font-bold text-foreground transition hover:bg-secondary focus-ring"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: currentAccount?.color || '#3b82f6' }} />
              <span className="truncate max-w-[110px]">{currentAccount?.name || 'Cuenta'}</span>
              <ChevronDown size={14} className="text-muted-foreground shrink-0" />
            </button>

            {isAccountMenuOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-xl border border-border bg-popover p-1.5 shadow-xl animate-in fade-in-50">
                <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Seleccionar Cuenta</p>
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      setIsAccountMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                      acc.id === selectedAccountId ? 'bg-primary/10 text-primary font-bold' : 'text-popover-foreground hover:bg-secondary'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <CategoryIcon iconName={acc.icon} size={15} />
                      {acc.name}
                    </span>
                    {acc.id === selectedAccountId && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-secondary p-1">
            <button
              onClick={() => setType('expense')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                type === 'expense' ? 'bg-card text-destructive shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowDownLeft size={14} /> Gasto
            </button>
            <button
              onClick={() => setType('income')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                type === 'income' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowUpRight size={14} /> Ingreso
            </button>
            <button
              onClick={() => setType('transfer')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                type === 'transfer' ? 'bg-card text-blue-600 dark:text-blue-400 shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowLeftRight size={14} /> Trsf.
            </button>
          </div>

          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground transition hover:text-foreground focus-ring"
          >
            <X size={16} />
          </button>
        </div>

        {/* Display Amount & Live Expression */}
        <div className="mt-3 flex flex-col items-center justify-center rounded-2xl bg-secondary/40 p-3.5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {type === 'expense' ? 'Monto a gastar' : type === 'income' ? 'Monto ingresado' : 'Monto a transferir'}
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-base font-bold text-muted-foreground">RD$</span>
            <span className="font-mono text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {amountStr || '0.00'}
            </span>
          </div>

          {/* Mathematical calculation result preview */}
          {/[+\-*/]/.test(amountStr) && computedValue > 0 && (
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary font-mono">
              <Calculator size={12} /> = RD$ {computedValue.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </div>
          )}

          {error && <p className="mt-2 text-xs font-semibold text-destructive">{error}</p>}
        </div>

        {/* Shared Household Expense Split Feature (Monefy + Splitwise Power) */}
        {type === 'expense' && (
          <div className="mt-3 rounded-xl border border-purple-500/30 bg-purple-500/10 p-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-purple-950 dark:text-purple-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSharedSplit}
                  onChange={(e) => setIsSharedSplit(e.target.checked)}
                  className="rounded border-purple-400 text-purple-600 focus:ring-purple-500"
                />
                <span className="flex items-center gap-1">
                  <Users size={14} /> Gasto Compartido (Dividir en el Hogar)
                </span>
              </label>

              {isSharedSplit && (
                <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-extrabold text-purple-700 dark:text-purple-300">
                  {splitRatio}% / {100 - splitRatio}%
                </span>
              )}
            </div>

            {isSharedSplit && computedValue > 0 && (
              <div className="mt-2 flex items-center justify-between border-t border-purple-500/20 pt-2 text-[11px] text-purple-900 dark:text-purple-200 font-mono">
                <span>Tu parte: <strong>RD$ {(computedValue * (splitRatio / 100)).toFixed(2)}</strong></span>
                <span>Hogar/Pareja: <strong>RD$ {(computedValue * ((100 - splitRatio) / 100)).toFixed(2)}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Transfer Destination Picker */}
        {type === 'transfer' && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-card p-3 text-xs">
            <span className="font-bold text-muted-foreground">Transferir hacia:</span>
            <select
              value={destinationAccountId}
              onChange={(e) => setDestinationAccountId(e.target.value)}
              className="rounded-lg bg-secondary px-3 py-1.5 font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            >
              {accounts.filter((a) => a.id !== selectedAccountId).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Visual Category Grid (Monefy Style with High-Touch Buttons) */}
        {type !== 'transfer' && (
          <div className="mt-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Categoría</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 max-h-40 overflow-y-auto pr-1">
              {activeCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id || (!selectedCategoryId && activeCategories[0]?.id === cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-2 text-center transition focus-ring ${
                      isSelected
                        ? 'border-2 border-primary bg-primary/10 text-primary shadow-xs font-bold'
                        : 'border border-border/60 bg-card text-muted-foreground hover:border-border hover:bg-secondary/50'
                    }`}
                  >
                    <span
                      className="grid h-8 w-8 place-items-center rounded-xl text-white shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon iconName={cat.icon} size={16} />
                    </span>
                    <span className="w-full truncate text-[10px] font-medium leading-tight">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Note & Date optional fields */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Nota / Concepto (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-9 rounded-xl border border-input bg-background px-3 text-xs outline-none transition placeholder:text-muted-foreground/60 focus:border-primary"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 rounded-xl border border-input bg-background px-3 text-xs outline-none transition focus:border-primary"
          />
        </div>

        {/* In-App Numeric Keypad with Real Calculator Operators (+, -, *, /) */}
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {['7', '8', '9', '+'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeypadPress(k)}
              className={`h-11 rounded-xl text-sm font-bold transition active:scale-95 focus-ring ${
                k === '+' ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {k}
            </button>
          ))}
          {['4', '5', '6', '-'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeypadPress(k)}
              className={`h-11 rounded-xl text-sm font-bold transition active:scale-95 focus-ring ${
                k === '-' ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {k}
            </button>
          ))}
          {['1', '2', '3', '*'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeypadPress(k)}
              className={`h-11 rounded-xl text-sm font-bold transition active:scale-95 focus-ring ${
                k === '*' ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {k === '*' ? '×' : k}
            </button>
          ))}
          {['C', '0', '.', '/'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeypadPress(k)}
              className={`h-11 rounded-xl text-sm font-bold transition active:scale-95 focus-ring ${
                k === 'C'
                  ? 'bg-destructive/15 text-destructive hover:bg-destructive/25'
                  : k === '/'
                  ? 'bg-primary/20 text-primary hover:bg-primary/30'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {k === '/' ? '÷' : k}
            </button>
          ))}
          
          {/* Bottom Action Row with Backspace & Save */}
          <button
            type="button"
            onClick={() => handleKeypadPress('BACKSPACE')}
            className="col-span-1 h-11 rounded-xl bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 flex items-center justify-center active:scale-95 transition focus-ring"
            title="Borrar dígito"
          >
            <Delete size={18} />
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="col-span-3 flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md transition hover:brightness-105 active:scale-98 focus-ring"
          >
            <Check size={18} /> Guardar Transacción
          </button>
        </div>

      </div>
    </div>
  );
}
