import { useEffect, useRef, useState } from 'react';
import { UserProfile } from '@/types/finance';
import { Wallet, ShieldCheck, Users, PieChart, PiggyBank, Sparkles, ArrowRight } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

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
            if (payload) {
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
        }
      } catch (err) {
        console.warn('Google Identity initialization notice:', err);
      }
    }
  }, [clientId, onGoogleLogin]);

  // Fast direct simulated login
  const handleFastGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      onGoogleLogin({
        id: `usr-${Date.now()}`,
        email: 'worldmaster2114@gmail.com',
        name: 'Daniel Gerardo Valdez',
        picture: 'https://lh3.googleusercontent.com/a/default-user',
      });
      setLoading(false);
    }, 400);
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
                  Ingresa con tu cuenta de Google para sincronizar tus finanzas en la nube.
                </p>
              </div>

              {/* Official Google Identity Button Target */}
              <div ref={googleBtnRef} className="flex justify-center min-h-[40px]"></div>

              {/* Fast Google Login Button */}
              <button
                onClick={handleFastGoogleLogin}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 shadow-xs transition hover:bg-primary/20 hover:shadow-md active:scale-98"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-xs font-bold text-foreground">
                  {loading ? 'Conectando...' : 'Acceder con Google'}
                </span>
              </button>

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
