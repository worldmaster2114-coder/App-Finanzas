import { useEffect, useRef, useState } from 'react';
import { UserProfile } from '@/types/finance';
import { Wallet, ShieldCheck, Users, PieChart, PiggyBank, Sparkles, ArrowRight, Mail, User, Lock } from 'lucide-react';

type LoginScreenProps = {
  onGoogleLogin: (user: Partial<UserProfile>) => void;
  onEnterAsGuest: () => void;
};

// Helper to decode Google JWT token
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

const DEFAULT_GOOGLE_CLIENT_ID = '1040799510505-bj3p40579m6h29aq7nac9rqmkvh35829.apps.googleusercontent.com';

export function LoginScreen({ onGoogleLogin, onEnterAsGuest }: LoginScreenProps) {
  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Read invite query params from URL
  const [inviteParams] = useState(() => {
    if (typeof window === 'undefined') return { code: null, owner: null, workspace: null };
    const params = new URLSearchParams(window.location.search);
    return {
      code: params.get('join'),
      owner: params.get('owner') || 'Tu Pareja o Familiar',
      workspace: params.get('workspace') || 'Hogar Compartido',
    };
  });

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

  // Initialize Google Identity Services SDK
  useEffect(() => {
    const win = window as any;
    if (win.google?.accounts?.id && clientId) {
      try {
        win.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential: string }) => {
            const payload = parseJwt(response.credential);
            if (payload && payload.email) {
              onGoogleLogin({
                id: `google-${payload.sub}`,
                googleId: payload.sub,
                email: payload.email,
                name: payload.name || payload.email.split('@')[0],
                picture: payload.picture,
              });
            }
          },
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          win.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_blue',
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'pill',
          });
          setGoogleLoaded(true);
        }
      } catch (err) {
        console.warn('Google Identity initialization notice:', err);
      }
    }
  }, [clientId, onGoogleLogin]);

  // Handle Real Email / Name Registration
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setLoading(true);
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanName = nameInput.trim() || cleanEmail.split('@')[0];

    onGoogleLogin({
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      email: cleanEmail,
      name: cleanName,
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-card to-background text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-12 relative overflow-hidden">
      
      {/* Decorative background glow */}
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Top Header Branding */}
      <header className="flex items-center justify-between relative z-10 max-w-6xl mx-auto w-full pb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <Wallet size={22} strokeWidth={2.4} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight">50-30-20</span>
              <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-primary">
                Grupo Walnut
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">Plataforma de Finanzas Personales & Hogar</p>
          </div>
        </div>
      </header>

      {/* Main Content: Mobile Order 1 for Login Card */}
      <main className="flex-1 flex items-center justify-center py-4 sm:py-8 relative z-10 max-w-5xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center w-full">
          
          {/* Card: Mobile First (order-1 lg:order-2) */}
          <div className="order-1 lg:order-2 w-full max-w-md mx-auto">
            <div className="rounded-3xl border border-border bg-card/95 p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-5 text-center">
              
              <div className="space-y-1.5">
                <span className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-primary/15 text-primary shadow-xs">
                  <ShieldCheck size={26} />
                </span>
                <h2 className="font-serif text-2xl font-bold text-foreground">Iniciar Sesión</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ingresa para acceder a tus finanzas sincronizadas y seguras.
                </p>
              </div>

              {/* Dynamic Invitation Banner from Link */}
              {inviteParams.code && (
                <div className="rounded-2xl border border-purple-500/40 bg-purple-500/15 p-3.5 text-left space-y-1 animate-in zoom-in-95">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
                    <Sparkles size={14} /> Invitación de {inviteParams.owner}
                  </div>
                  <p className="text-[11px] text-foreground/90 leading-snug">
                    Te ha invitado a compartir los gastos del hogar en <strong className="text-purple-300">"{inviteParams.workspace}"</strong>. Inicia sesión con tus datos para unirte.
                  </p>
                </div>
              )}

              {/* Official Google Identity Button */}
              <div className="space-y-3">
                <div ref={googleBtnRef} className="flex justify-center min-h-[44px]"></div>

                {/* Email Registration / Alternative */}
                {authMode === 'email' ? (
                  <form onSubmit={handleEmailSubmit} className="space-y-3 text-left animate-in fade-in-50">
                    <div>
                      <label className="text-xs font-bold text-foreground">Tu Nombre Completo</label>
                      <div className="relative mt-1">
                        <input
                          type="text"
                          required
                          placeholder="Ej. María Rodríguez"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          className="h-10 w-full rounded-xl border border-input bg-background px-3 pl-9 text-xs outline-none focus:border-primary"
                        />
                        <User size={14} className="absolute left-3 top-3 text-muted-foreground" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground">Correo Electrónico</label>
                      <div className="relative mt-1">
                        <input
                          type="email"
                          required
                          placeholder="nombre@ejemplo.com"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="h-10 w-full rounded-xl border border-input bg-background px-3 pl-9 text-xs outline-none focus:border-primary"
                        />
                        <Mail size={14} className="absolute left-3 top-3 text-muted-foreground" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="h-11 w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:brightness-105 transition"
                    >
                      {loading ? 'Ingresando...' : 'Crear Cuenta / Iniciar Sesión'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuthMode('google')}
                      className="text-center w-full text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      ← Volver a Iniciar con Google
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAuthMode('email')}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/60 text-xs font-bold text-foreground hover:bg-secondary transition"
                  >
                    <Mail size={15} /> Continuar con Correo Electrónico
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-border w-full" />
                <span className="bg-card px-3 text-[10px] font-bold uppercase text-muted-foreground relative">O prueba sin cuenta</span>
              </div>

              {/* Guest / Demo Mode Button */}
              <button
                onClick={onEnterAsGuest}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-secondary/80 text-xs font-bold text-foreground hover:bg-secondary transition focus-ring"
              >
                Explorar en Modo Demo <ArrowRight size={14} />
              </button>

              <p className="text-[10px] text-muted-foreground">
                Protegido por Google OAuth 2.0 • <strong>Grupo Walnut</strong>
              </p>
            </div>
          </div>

          {/* Left Column: Mobile Second (order-2 lg:order-1) */}
          <div className="order-2 lg:order-1 space-y-5 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
              <Sparkles size={13} /> Regla Financiera 50 / 30 / 20
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.2]">
              Toma el control total de tu dinero hoy.
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Organiza tus ingresos en <strong>50% Necesidades</strong>, <strong>30% Deseos</strong> y <strong>20% Ahorro</strong>. Registra gastos en 2 segundos y sincroniza las finanzas con tu hogar.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card/60 p-3 backdrop-blur-xs">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-500/15 text-blue-500">
                  <PieChart size={16} />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Regla 50/30/20</p>
                  <p className="text-[10px] text-muted-foreground">Presupuestos visuales</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card/60 p-3 backdrop-blur-xs">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-purple-500/15 text-purple-500">
                  <Users size={16} />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Hogar Compartido</p>
                  <p className="text-[10px] text-muted-foreground">2 a 3 personas</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card/60 p-3 backdrop-blur-xs">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-500">
                  <PiggyBank size={16} />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Bóveda de Ahorro</p>
                  <p className="text-[10px] text-muted-foreground">Metas financieras</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card/60 p-3 backdrop-blur-xs">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-500">
                  <ShieldCheck size={16} />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Nube PostgreSQL</p>
                  <p className="text-[10px] text-muted-foreground">Seguridad en vivo</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-muted-foreground relative z-10 max-w-6xl mx-auto w-full pt-4 border-t border-border/40">
        <p>50-30-20 — Desarrollada por <strong className="text-foreground font-semibold">Grupo Walnut</strong> · 2026</p>
      </footer>
    </div>
  );
}
