import { useState } from 'react';
import { UserProfile, Workspace } from '@/types/finance';
import {
  HeartHandshake,
  User,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  Home,
  Check,
  X,
} from 'lucide-react';

type HouseholdChoiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onJoinHousehold: (code: string) => Promise<void>;
  onContinuePersonal: () => void;
  activeWorkspace?: Workspace;
};

export function HouseholdChoiceModal({
  isOpen,
  onClose,
  user,
  onJoinHousehold,
  onContinuePersonal,
  activeWorkspace,
}: HouseholdChoiceModalProps) {
  const [selectedOption, setSelectedOption] = useState<'daniel' | 'custom_code' | 'personal'>('daniel');
  const [customCode, setCustomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const firstName = user?.name ? user.name.split(' ')[0] : 'Usuario';

  const handleConfirm = async () => {
    setError('');
    setIsLoading(true);

    try {
      if (selectedOption === 'daniel') {
        await onJoinHousehold('503020');
        onClose();
      } else if (selectedOption === 'custom_code') {
        const clean = customCode.trim().toUpperCase();
        if (!clean) {
          setError('Ingresa el código de 6 dígitos');
          setIsLoading(false);
          return;
        }
        await onJoinHousehold(clean);
        onClose();
      } else {
        onContinuePersonal();
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Error al vincular el hogar. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in-50">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 space-y-6 text-left relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-purple-500/15 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-primary/15 blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-bold text-primary">
              <Sparkles size={13} /> Bienvenido(a), {firstName}
            </div>
            <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
              ¿Cómo deseas usar tu cuenta?
            </h2>
            <p className="text-xs text-muted-foreground">
              Selecciona si deseas vincularte al hogar compartido o llevar una cuenta independiente.
            </p>
          </div>

          <button
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-3.5">
          
          {/* OPTION 1: Join Daniel's House (Recommended for spouse / household) */}
          <div
            onClick={() => setSelectedOption('daniel')}
            className={`cursor-pointer rounded-2xl border p-4 sm:p-5 transition relative ${
              selectedOption === 'daniel'
                ? 'border-purple-500 bg-gradient-to-r from-purple-500/15 via-card to-purple-500/5 shadow-md ring-2 ring-purple-500/20'
                : 'border-border bg-card/60 hover:bg-secondary/40'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-purple-500/20 text-purple-400 shadow-xs">
                  <Home size={22} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-base font-bold text-foreground">
                      Asociarme a la Casa de Daniel
                    </h3>
                    <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[9px] font-extrabold text-purple-300 uppercase tracking-wider">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Sincroniza tus finanzas en vivo con el espacio de <strong>Daniel (Código: 503020)</strong>. Ambos verán los gastos del hogar, presupuestos y balances en tiempo real.
                  </p>
                </div>
              </div>

              <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition ${
                selectedOption === 'daniel' ? 'border-purple-500 bg-purple-500 text-white' : 'border-muted-foreground/40'
              }`}>
                {selectedOption === 'daniel' && <Check size={14} strokeWidth={3} />}
              </div>
            </div>
          </div>

          {/* OPTION 2: Independent / Personal Account */}
          <div
            onClick={() => setSelectedOption('personal')}
            className={`cursor-pointer rounded-2xl border p-4 sm:p-5 transition relative ${
              selectedOption === 'personal'
                ? 'border-blue-500 bg-gradient-to-r from-blue-500/15 via-card to-blue-500/5 shadow-md ring-2 ring-blue-500/20'
                : 'border-border bg-card/60 hover:bg-secondary/40'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-500/20 text-blue-400 shadow-xs">
                  <User size={22} />
                </span>
                <div>
                  <h3 className="font-serif text-base font-bold text-foreground">
                    Cuenta Independiente (Personal)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Gestiona tus finanzas, ingresos y gastos de forma totalmente privada, individual y separada de cualquier otro usuario.
                  </p>
                </div>
              </div>

              <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition ${
                selectedOption === 'personal' ? 'border-blue-500 bg-blue-500 text-white' : 'border-muted-foreground/40'
              }`}>
                {selectedOption === 'personal' && <Check size={14} strokeWidth={3} />}
              </div>
            </div>
          </div>

          {/* OPTION 3: Join other household code */}
          <div
            onClick={() => setSelectedOption('custom_code')}
            className={`cursor-pointer rounded-2xl border p-4 sm:p-4.5 transition relative ${
              selectedOption === 'custom_code'
                ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20'
                : 'border-border bg-card/60 hover:bg-secondary/40'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary shadow-xs">
                  <KeyRound size={20} />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-foreground">
                    Unirme con otro código de invitación
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Si tienes un código de 6 dígitos diferente.
                  </p>
                </div>
              </div>

              <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition ${
                selectedOption === 'custom_code' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
              }`}>
                {selectedOption === 'custom_code' && <Check size={14} strokeWidth={3} />}
              </div>
            </div>

            {selectedOption === 'custom_code' && (
              <div className="mt-3 pt-3 border-t border-border/60 animate-in fade-in-50">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Ej. AB12CD"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-mono font-bold uppercase tracking-widest outline-none focus:border-primary"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>

        </div>

        {error && (
          <p className="text-xs font-semibold text-destructive text-center">{error}</p>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`w-full h-12 rounded-2xl font-bold text-sm text-white shadow-md transition flex items-center justify-center gap-2 ${
              selectedOption === 'daniel'
                ? 'bg-purple-600 hover:bg-purple-700'
                : selectedOption === 'personal'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-primary text-primary-foreground hover:brightness-105'
            }`}
          >
            {isLoading ? (
              'Sincronizando...'
            ) : selectedOption === 'daniel' ? (
              <>
                <HeartHandshake size={18} /> Confirmar y Entrar a la Casa de Daniel
              </>
            ) : selectedOption === 'personal' ? (
              <>
                <User size={18} /> Continuar con Cuenta Independiente
              </>
            ) : (
              <>
                Vincular y Continuar <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
