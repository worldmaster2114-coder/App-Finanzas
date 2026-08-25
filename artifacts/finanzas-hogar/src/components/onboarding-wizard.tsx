import { useState } from 'react';
import { UserProfile, UserPurpose, UserUseCase, Workspace } from '@/types/finance';
import { Sparkles, Target, Users, User as UserIcon, Check, KeyRound, Wallet, ArrowRight, ShieldCheck, HeartHandshake, TrendingUp, LogIn } from 'lucide-react';

type OnboardingWizardProps = {
  isOpen: boolean;
  initialUser?: Partial<UserProfile> | null;
  onOpenGoogleLogin?: () => void;
  onComplete: (data: {
    name: string;
    currency: string;
    purpose: UserPurpose;
    useCase: UserUseCase;
    workspaceName: string;
    inviteCodeToJoin?: string;
  }) => void;
};

const PURPOSES: { id: UserPurpose; title: string; desc: string; icon: any }[] = [
  { id: 'ahorrar', title: 'Ahorrar para metas futuras', desc: 'Vacaciones, laptop, fondo de emergencia o compras importantes.', icon: Target },
  { id: 'controlar', title: 'Controlar y reducir gastos', desc: 'Entender a dónde se va tu dinero cada mes y frenar compras impulsivas.', icon: TrendingUp },
  { id: 'deudas', title: 'Salir de deudas y presupuestar', desc: 'Organizar tus compromisos fijos y mantener disponible diario.', icon: ShieldCheck },
  { id: 'hogar', title: 'Gestionar economía del hogar', desc: 'Llevar las cuentas de la casa con la regla 50/30/20.', icon: HeartHandshake },
];

export function OnboardingWizard({ isOpen, initialUser, onOpenGoogleLogin, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(initialUser?.name || '');
  const [currency, setCurrency] = useState('DOP');
  const [purpose, setPurpose] = useState<UserPurpose>('controlar');
  const [useCase, setUseCase] = useState<UserUseCase>('personal');
  const [workspaceName, setWorkspaceName] = useState('Mi Presupuesto');
  const [joinAction, setJoinAction] = useState<'create' | 'join'>('create');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleNext = () => {
    if (!name.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleFinish = () => {
    if (step === 2 && useCase === 'shared' && joinAction === 'join' && !inviteCodeInput.trim()) {
      setError('Ingresa el código de invitación de 6 dígitos');
      return;
    }

    onComplete({
      name: name.trim(),
      currency,
      purpose,
      useCase,
      workspaceName: useCase === 'shared' && joinAction === 'create' ? (workspaceName.trim() || 'Hogar Compartido') : 'Presupuesto Personal',
      inviteCodeToJoin: joinAction === 'join' ? inviteCodeInput.trim().toUpperCase() : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-xl max-h-[90dvh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 sm:p-8">
        
        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Wallet size={20} />
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold leading-tight">Configuración Inicial 50-30-20</h2>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary">Grupo Walnut</p>
            </div>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground">
            Paso {step} de 2
          </span>
        </div>

        {/* Step 1: User details & Purpose */}
        {step === 1 && (
          <div className="mt-6 space-y-5 animate-in fade-in-50">
            {/* Quick Google Sign In Banner */}
            {onOpenGoogleLogin && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <div>
                    <p className="text-xs font-bold text-foreground">¿Ya tienes cuenta o prefieres Google?</p>
                    <p className="text-[10px] text-muted-foreground">Inicia sesión con 1 solo clic</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenGoogleLogin}
                  className="shrink-0 rounded-xl bg-card border border-border px-3 py-1.5 text-xs font-bold text-primary shadow-xs hover:bg-secondary transition"
                >
                  Acceder con Google
                </button>
              </div>
            )}

            <div>
              <h3 className="font-serif text-xl font-bold text-foreground">¡Bienvenido! Personalicemos tu espacio</h3>
              <p className="text-xs text-muted-foreground mt-1">Cuéntanos un poco sobre ti y cuál es tu meta financiera principal.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-foreground">Tu Nombre o Apodo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos o Ana"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Moneda Principal</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3.5 text-xs outline-none focus:border-primary font-bold"
                >
                  <option value="DOP">DOP - Peso Dominicano (RD$)</option>
                  <option value="USD">USD - Dólar Estadounidense ($)</option>
                  <option value="EUR">EUR - Euro (€)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground mb-2 block">¿Cuál es tu propósito principal?</label>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {PURPOSES.map((p) => {
                  const Icon = p.icon;
                  const isSelected = purpose === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPurpose(p.id)}
                      className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition focus-ring ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-xs'
                          : 'border-border bg-card hover:bg-secondary/40'
                      }`}
                    >
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                        <Icon size={16} />
                      </span>
                      <div>
                        <p className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>{p.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{p.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <p className="text-xs font-semibold text-destructive">{error}</p>}

            <button
              onClick={handleNext}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md transition hover:brightness-105"
            >
              Siguiente <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Personal vs Shared (2-3 people) */}
        {step === 2 && (
          <div className="mt-6 space-y-5 animate-in fade-in-50">
            <div>
              <h3 className="font-serif text-xl font-bold text-foreground">¿Cómo vas a usar la aplicación?</h3>
              <p className="text-xs text-muted-foreground mt-1">Puedes administrar tus finanzas de forma individual o compartir el presupuesto con 2 o 3 personas (pareja, familia, hogar).</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Option: Personal */}
              <button
                type="button"
                onClick={() => setUseCase('personal')}
                className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition focus-ring ${
                  useCase === 'personal'
                    ? 'border-primary bg-primary/10 shadow-xs'
                    : 'border-border bg-card hover:bg-secondary/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                      <UserIcon size={20} />
                    </span>
                    {useCase === 'personal' && <Check size={18} className="text-primary" />}
                  </div>
                  <h4 className="mt-3 font-bold text-sm text-foreground">Uso Personal</h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Espacio individual privado. Solo tú podrás ver y registrar tus movimientos.
                  </p>
                </div>
              </button>

              {/* Option: Shared (2-3 people) */}
              <button
                type="button"
                onClick={() => setUseCase('shared')}
                className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition focus-ring ${
                  useCase === 'shared'
                    ? 'border-primary bg-primary/10 shadow-xs'
                    : 'border-border bg-card hover:bg-secondary/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                      <Users size={20} />
                    </span>
                    {useCase === 'shared' && <Check size={18} className="text-primary" />}
                  </div>
                  <h4 className="mt-3 font-bold text-sm text-foreground">Uso Compartido (Hogar)</h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Para 2 o 3 personas (parejas, compañeros). Permite llevar el balance y registrar gastos en conjunto.
                  </p>
                </div>
              </button>
            </div>

            {/* Sub-options for Shared Mode */}
            {useCase === 'shared' && (
              <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3 animate-in fade-in-50">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setJoinAction('create')}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                      joinAction === 'create' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
                    }`}
                  >
                    Crear nuevo Hogar
                  </button>
                  <button
                    type="button"
                    onClick={() => setJoinAction('join')}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                      joinAction === 'join' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
                    }`}
                  >
                    Unirme con Código
                  </button>
                </div>

                {joinAction === 'create' ? (
                  <div>
                    <label className="text-xs font-bold text-foreground">Nombre de tu Hogar / Grupo</label>
                    <input
                      type="text"
                      placeholder="Ej. Casa Familia Pérez, Pareja Amor..."
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Generaremos un código de invitación único para que agregues a 2 personas más.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-foreground flex items-center gap-1">
                      <KeyRound size={14} className="text-primary" /> Código de Invitación (6 dígitos)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Ej. HOG503"
                      value={inviteCodeInput}
                      onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                      className="mt-1 h-10 w-full font-mono text-sm tracking-widest font-extrabold uppercase rounded-xl border border-input bg-background px-3 outline-none focus:border-primary"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Pídele el código de 6 dígitos al creador del Hogar para vincular tus cuentas.
                    </p>
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-xs font-semibold text-destructive">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-11 flex-1 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-secondary"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="h-11 flex-[2] rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md hover:brightness-105"
              >
                Comenzar a usar 50-30-20
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
