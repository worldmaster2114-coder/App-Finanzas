import { useState, useMemo, useEffect } from 'react';
import { Account, Category, Transaction, TransactionType, UserProfile } from '@/types/finance';
import { Collaborator, getHouseholdCollaborators, isSamePerson, normalizeCollaboratorName } from '@/lib/household-authors';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Check, ChevronDown, Delete, X, Wallet, Building2, CreditCard, PiggyBank, ShoppingBasket, Home, Zap, Car, HeartPulse, GraduationCap, Coffee, Tag, Landmark, Briefcase, TrendingUp, CircleDollarSign, Users, UserCheck } from 'lucide-react';

type FastEntryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  transactions?: Transaction[];
  currentUser?: UserProfile | null;
  collaborators?: Collaborator[];
  onSaveTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
};

const ICON_MAP: Record<string, any> = {
  Wallet, Building2, CreditCard, PiggyBank,
  ShoppingBasket, Home, Zap, Car, HeartPulse, GraduationCap, Coffee, Tag,
  Landmark, Briefcase, TrendingUp, CircleDollarSign
};

export function CategoryIcon({ iconName, size = 16 }: { iconName: string; size?: number }) {
  const IconComponent = ICON_MAP[iconName] || Tag;
  return <IconComponent size={size} strokeWidth={2} />;
}

// Safe math expression evaluator for the calculator keypad
function evaluateMath(expr: string): number | null {
  if (!expr.trim()) return null;
  const sanitized = expr.replace(/[^0-9.+\-*/]/g, '');
  if (!sanitized) return null;
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

export function FastEntryModal({ isOpen, onClose, accounts, categories, transactions = [], currentUser, collaborators, onSaveTransaction }: FastEntryModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [destinationAccountId, setDestinationAccountId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [error, setError] = useState('');

  // Dynamic household collaborators resolution
  const collaboratorList = useMemo(() => {
    if (collaborators && collaborators.length > 0) return collaborators;
    return getHouseholdCollaborators(transactions, currentUser);
  }, [collaborators, transactions, currentUser]);

  const initialAuthor = useMemo<string>(() => {
    if (currentUser?.name && currentUser.name.trim() !== 'Usuario') {
      const match = collaboratorList.find((c) => isSamePerson(c.name, currentUser.name));
      if (match) return match.name;
      return normalizeCollaboratorName(currentUser.name);
    }
    return collaboratorList[0]?.name || 'Daniel';
  }, [currentUser, collaboratorList]);

  const [registeredBy, setRegisteredBy] = useState<string>(initialAuthor);

  useEffect(() => {
    setRegisteredBy(initialAuthor);
  }, [initialAuthor, isOpen]);

  // Shared household split feature (50/50 or custom)
  const [isSharedSplit, setIsSharedSplit] = useState(false);
  const [splitRatio, setSplitRatio] = useState<number>(50);

  // Calculated live amount
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

    const matchedCollab = collaboratorList.find((c) => isSamePerson(c.name, registeredBy));
    const cleanRegisteredBy = matchedCollab?.name || normalizeCollaboratorName(registeredBy) || 'Colaborador';
    const authorUserId = matchedCollab?.id || (currentUser?.name && isSamePerson(currentUser.name, registeredBy) ? currentUser.id : `usr-${cleanRegisteredBy.toLowerCase().replace(/[^a-z0-9]/g, '')}`);

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
        createdByName: cleanRegisteredBy,
        createdByUserId: authorUserId,
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-xs transition-opacity sm:items-center sm:p-4">
      {/* Modal Dialog Container with Safe Area Inset Support */}
      <div className="w-full max-w-lg max-h-[92dvh] sm:max-h-[88vh] overflow-y-auto overscroll-contain rounded-t-3xl border border-border bg-card px-3.5 pt-2 sm:px-6 sm:pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom,20px))] shadow-2xl animate-in slide-in-from-bottom-5 sm:rounded-3xl">
        
        {/* Mobile Drag Indicator Handle */}
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-muted-foreground/30 sm:hidden" />

        {/* Top Header: Account Picker, Member Switcher & Close Button */}
        <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-2.5">
          {/* Account Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="flex items-center gap-1.5 rounded-xl bg-secondary/80 px-2.5 py-1.5 text-xs font-bold text-foreground transition hover:bg-secondary focus-ring"
            >
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: currentAccount?.color || '#3b82f6' }} />
              <span className="truncate max-w-[100px] sm:max-w-[130px]">{currentAccount?.name || 'Cuenta'}</span>
              <ChevronDown size={13} className="text-muted-foreground shrink-0" />
            </button>

            {isAccountMenuOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-xl border border-border bg-popover p-1.5 shadow-xl animate-in fade-in-50">
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

          {/* Member Author Pills (Dynamically mapped with real collaborator names) */}
          <div className="flex items-center gap-1 rounded-xl bg-secondary/60 p-0.5 border border-border/50 max-w-[210px] overflow-x-auto">
            {collaboratorList.map((col) => {
              const isSelected = isSamePerson(registeredBy, col.name);
              return (
                <button
                  key={col.name}
                  type="button"
                  onClick={() => setRegisteredBy(col.name)}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition shrink-0 ${
                    isSelected
                      ? col.pillActiveClass
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title={`Registrar a nombre de ${col.name}`}
                >
                  <span className={`h-2 w-2 rounded-full shrink-0 ${col.dotClass}`} />
                  <span className="truncate max-w-[75px]">{col.name}</span>
                </button>
              );
            })}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-muted-foreground transition hover:text-foreground hover:bg-secondary/80 focus-ring shrink-0"
            title="Cerrar"
          >
            <X size={15} />
          </button>
        </div>

        {/* Transaction Type Tabs */}
        <div className="mt-2.5 grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold transition ${
              type === 'expense' ? 'bg-card text-destructive shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowDownLeft size={13} /> Gasto
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold transition ${
              type === 'income' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowUpRight size={13} /> Ingreso
          </button>
          <button
            type="button"
            onClick={() => setType('transfer')}
            className={`flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold transition ${
              type === 'transfer' ? 'bg-card text-blue-600 dark:text-blue-400 shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowLeftRight size={13} /> Trsf.
          </button>
        </div>

        {/* Display Amount & Live Expression */}
        <div className="mt-2 flex flex-col items-center justify-center rounded-2xl bg-secondary/40 py-2 px-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {type === 'expense' ? 'Monto a gastar' : type === 'income' ? 'Monto ingresado' : 'Monto a transferir'}
          </p>
          <div className="mt-0.5 flex items-baseline gap-1 font-mono">
            <span className="text-xs font-bold text-muted-foreground">RD$</span>
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground truncate max-w-full">
              {amountStr ? amountStr : '0.00'}
            </span>
          </div>

          {/[+\-*/]/.test(amountStr) && computedValue > 0 && (
            <p className="text-[11px] font-mono text-primary font-bold">
              = RD$ {computedValue.toFixed(2)}
            </p>
          )}

          {error && <p className="mt-1 text-[11px] font-bold text-destructive animate-shake">{error}</p>}
        </div>

        {/* Shared Household Split Checkbox (Compact) */}
        {type === 'expense' && (
          <div className="mt-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-purple-950 dark:text-purple-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSharedSplit}
                  onChange={(e) => setIsSharedSplit(e.target.checked)}
                  className="rounded border-purple-400 text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                />
                <span className="flex items-center gap-1 text-[11px]">
                  <Users size={13} /> Gasto Compartido (Dividir en el Hogar)
                </span>
              </label>

              {isSharedSplit && (
                <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-extrabold text-purple-700 dark:text-purple-300 font-mono">
                  {splitRatio}% / {100 - splitRatio}%
                </span>
              )}
            </div>

            {isSharedSplit && computedValue > 0 && (
              <div className="mt-1.5 flex items-center justify-between border-t border-purple-500/20 pt-1.5 text-[10px] text-purple-900 dark:text-purple-200 font-mono">
                <span>Tu parte: <strong>RD$ {(computedValue * (splitRatio / 100)).toFixed(2)}</strong></span>
                <span>Pareja/Hogar: <strong>RD$ {(computedValue * ((100 - splitRatio) / 100)).toFixed(2)}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Transfer Destination Picker */}
        {type === 'transfer' && (
          <div className="mt-2 flex items-center justify-between rounded-xl border border-border bg-card p-2.5 text-xs">
            <span className="font-bold text-muted-foreground text-[11px]">Transferir hacia:</span>
            <select
              value={destinationAccountId}
              onChange={(e) => setDestinationAccountId(e.target.value)}
              className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            >
              {accounts.filter((a) => a.id !== selectedAccountId).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Visual Category Grid (Compact & Responsive) */}
        {type !== 'transfer' && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Categoría: <strong className="text-foreground">{currentCategory?.name || 'Selecciona'}</strong>
              </p>
            </div>
            <div className="grid grid-cols-4 gap-1.5 max-h-28 overflow-y-auto pr-0.5">
              {activeCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id || (!selectedCategoryId && activeCategories[0]?.id === cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 px-1 text-center transition active:scale-95 focus-ring ${
                      isSelected
                        ? 'border-2 border-primary bg-primary/15 text-primary shadow-xs font-bold'
                        : 'border border-border/60 bg-card text-muted-foreground hover:border-border hover:bg-secondary/50'
                    }`}
                  >
                    <span
                      className="grid h-6 w-6 place-items-center rounded-lg text-white shadow-xs shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon iconName={cat.icon} size={13} />
                    </span>
                    <span className="w-full truncate text-[9px] font-medium leading-tight">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Note & Date Fields (Compact Row) */}
        <div className="mt-2 grid grid-cols-[1fr_115px] gap-2">
          <input
            type="text"
            placeholder="Nota / Concepto (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-8 rounded-xl border border-input bg-background px-2.5 text-xs outline-none transition placeholder:text-muted-foreground/60 focus:border-primary"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-8 rounded-xl border border-input bg-background px-2 text-[11px] outline-none transition focus:border-primary font-mono"
          />
        </div>

        {/* In-App Ergonomic Calculator Keypad */}
        <div className="mt-2.5 grid grid-cols-4 gap-1 sm:gap-1.5">
          {/* Row 1 */}
          {['7', '8', '9', '+'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeypadPress(k)}
              className={`h-10 rounded-xl text-sm font-bold transition active:scale-95 focus-ring ${
                k === '+' ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {k}
            </button>
          ))}

          {/* Row 2 */}
          {['4', '5', '6', '-'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeypadPress(k)}
              className={`h-10 rounded-xl text-sm font-bold transition active:scale-95 focus-ring ${
                k === '-' ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {k}
            </button>
          ))}

          {/* Row 3 */}
          {['1', '2', '3', '*'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeypadPress(k)}
              className={`h-10 rounded-xl text-sm font-bold transition active:scale-95 focus-ring ${
                k === '*' ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {k === '*' ? '×' : k}
            </button>
          ))}

          {/* Row 4 */}
          {['.', '0', 'BACKSPACE', '/'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeypadPress(k)}
              className={`h-10 rounded-xl text-sm font-bold transition active:scale-95 focus-ring flex items-center justify-center ${
                k === '/'
                  ? 'bg-primary/20 text-primary hover:bg-primary/30'
                  : k === 'BACKSPACE'
                  ? 'bg-secondary text-muted-foreground hover:text-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {k === '/' ? '÷' : k === 'BACKSPACE' ? <Delete size={17} /> : k}
            </button>
          ))}

          {/* Row 5: Action Buttons (Clear & Save) */}
          <button
            type="button"
            onClick={() => handleKeypadPress('C')}
            className="col-span-1 h-10 rounded-xl bg-destructive/15 text-destructive hover:bg-destructive/25 text-xs font-bold active:scale-95 transition focus-ring"
            title="Limpiar"
          >
            C
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="col-span-3 flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-extrabold text-primary-foreground shadow-md transition hover:brightness-105 active:scale-98 focus-ring"
          >
            <Check size={16} /> Guardar Transacción
          </button>
        </div>

      </div>
    </div>
  );
}
