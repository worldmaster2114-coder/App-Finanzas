import { useState } from 'react';
import { Account, Category, Transaction, TransactionType } from '@/types/finance';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Check, ChevronDown, Delete, X, Wallet, Building2, CreditCard, PiggyBank, ShoppingBasket, Home, Zap, Car, HeartPulse, GraduationCap, Coffee, Tag, Landmark, Briefcase, TrendingUp, CircleDollarSign } from 'lucide-react';

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

  if (!isOpen) return null;

  const activeCategories = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense'));
  const currentCategory = categories.find((c) => c.id === selectedCategoryId) || activeCategories[0];

  // In-app Keypad handler
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
    if (val === '.') {
      if (amountStr.includes('.')) return;
      setAmountStr((prev) => (prev === '' ? '0.' : prev + '.'));
      return;
    }
    // Limit decimals to 2 places
    if (amountStr.includes('.')) {
      const [, decimals] = amountStr.split('.');
      if (decimals && decimals.length >= 2) return;
    }
    // Limit total digits
    if (amountStr.replace('.', '').length >= 8) return;

    setAmountStr((prev) => (prev === '0' ? val : prev + val));
  };

  const handleSave = () => {
    const numAmount = parseFloat(amountStr);
    if (isNaN(numAmount) || numAmount <= 0) {
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
      amount: numAmount,
      type,
      date: new Date(`${date}T12:00:00`).toISOString(),
      note: note.trim() || undefined,
      isRecurring: false,
    });

    // Reset & Close
    setAmountStr('');
    setNote('');
    setError('');
    onClose();
  };

  const currentAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-xs transition-opacity sm:items-center sm:p-4">
      <div className="w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-2xl animate-in slide-in-from-bottom-5 sm:rounded-3xl sm:p-6">
        
        {/* Header with Account Switcher & Close */}
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="relative">
            <button
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="flex items-center gap-2 rounded-xl bg-secondary/80 px-3 py-1.5 text-xs font-bold text-foreground transition hover:bg-secondary focus-ring"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: currentAccount?.color || '#3b82f6' }} />
              <span>{currentAccount?.name || 'Cuenta'}</span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>

            {isAccountMenuOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded-xl border border-border bg-popover p-1.5 shadow-lg animate-in fade-in-50">
                <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Seleccionar Cuenta</p>
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      setIsAccountMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                      acc.id === selectedAccountId ? 'bg-primary/10 text-primary' : 'text-popover-foreground hover:bg-secondary'
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
                type === 'expense' ? 'bg-card text-destructive shadow-xs' : 'text-muted-foreground'
              }`}
            >
              <ArrowDownLeft size={14} /> Gasto
            </button>
            <button
              onClick={() => setType('income')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                type === 'income' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-muted-foreground'
              }`}
            >
              <ArrowUpRight size={14} /> Ingreso
            </button>
            <button
              onClick={() => setType('transfer')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                type === 'transfer' ? 'bg-card text-blue-600 dark:text-blue-400 shadow-xs' : 'text-muted-foreground'
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

        {/* Display Amount */}
        <div className="mt-4 flex flex-col items-center justify-center rounded-2xl bg-secondary/40 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {type === 'expense' ? 'Monto a gastar' : type === 'income' ? 'Monto ingresado' : 'Monto a transferir'}
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-lg font-bold text-muted-foreground">RD$</span>
            <span className="font-mono text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {amountStr || '0.00'}
            </span>
          </div>
          {error && <p className="mt-2 text-xs font-semibold text-destructive">{error}</p>}
        </div>

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

        {/* Visual Category Grid (Monefy Style) */}
        {type !== 'transfer' && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Categoría</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
              {activeCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id || (!selectedCategoryId && activeCategories[0]?.id === cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-2.5 text-center transition focus-ring ${
                      isSelected
                        ? 'border-2 border-primary bg-primary/10 text-primary shadow-xs font-bold'
                        : 'border border-border/60 bg-card text-muted-foreground hover:border-border hover:bg-secondary/50'
                    }`}
                  >
                    <span
                      className="grid h-9 w-9 place-items-center rounded-xl text-white shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon iconName={cat.icon} size={18} />
                    </span>
                    <span className="w-full truncate text-[11px] font-medium leading-tight">
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
            className="h-10 rounded-xl border border-input bg-background px-3 text-xs outline-none transition placeholder:text-muted-foreground/60 focus:border-primary"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 rounded-xl border border-input bg-background px-3 text-xs outline-none transition focus:border-primary"
          />
        </div>

        {/* In-App Numeric Keypad */}
        <div className="mt-4 grid grid-cols-4 gap-1.5">
          {['7', '8', '9', 'C'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeypadPress(k)}
              className={`h-11 rounded-xl text-sm font-bold transition focus-ring ${
                k === 'C' ? 'bg-destructive/15 text-destructive hover:bg-destructive/25' : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {k}
            </button>
          ))}
          {['4', '5', '6', 'BACKSPACE'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeypadPress(k)}
              className={`h-11 rounded-xl text-sm font-bold transition focus-ring ${
                k === 'BACKSPACE' ? 'bg-secondary text-muted-foreground hover:bg-secondary/80 flex items-center justify-center' : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {k === 'BACKSPACE' ? <Delete size={18} /> : k}
            </button>
          ))}
          {['1', '2', '3', '.'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeypadPress(k)}
              className="h-11 rounded-xl bg-secondary text-sm font-bold text-foreground transition hover:bg-secondary/80 focus-ring"
            >
              {k}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleKeypadPress('0')}
            className="col-span-2 h-11 rounded-xl bg-secondary text-sm font-bold text-foreground transition hover:bg-secondary/80 focus-ring"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="col-span-2 flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md transition hover:brightness-105 active:scale-98 focus-ring"
          >
            <Check size={18} /> Guardar
          </button>
        </div>

      </div>
    </div>
  );
}
