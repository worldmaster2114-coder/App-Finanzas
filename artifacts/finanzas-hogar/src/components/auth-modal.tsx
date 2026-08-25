import { useEffect, useRef, useState } from 'react';
import { UserProfile } from '@/types/finance';
import { LogIn, LogOut, ShieldCheck, ShieldAlert, User as UserIcon, Sparkles, CheckCircle2, X, AlertCircle } from 'lucide-react';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onGoogleLogin: (user: Partial<UserProfile>) => void;
  onLogout: () => void;
  onOpenAdminPanel?: () => void;
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

export function AuthModal({ isOpen, onClose, user, onGoogleLogin, onLogout, onOpenAdminPanel }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

  const isSuperAdmin = user?.email && [
    'worldmaster2114@gmail.com',
    'admin@grupowalnut.com',
  ].includes(user.email.toLowerCase().trim());

  // Initialize Google Identity Services
  useEffect(() => {
    if (!isOpen || user) return;

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
              onClose();
            }
          },
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          win.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
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
  }, [isOpen, user, clientId]);

  if (!isOpen) return null;

  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');

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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="font-serif text-lg font-bold">Cuenta & Autenticación</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-center">
          {user ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="h-16 w-16 rounded-full border-2 border-primary shadow-xs" />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary text-xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-base text-foreground">{user.name}</h4>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/30 p-3 text-left space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Propósito Principal:</span>
                  <span className="font-bold capitalize text-primary">{user.purpose || 'Controlar Gastos'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Modo de Uso:</span>
                  <span className="font-bold capitalize text-foreground">{user.useCase === 'shared' ? 'Compartido (Hogar)' : 'Personal'}</span>
                </div>
              </div>

              {isSuperAdmin && onOpenAdminPanel && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAdminPanel();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 py-2.5 text-xs font-bold text-amber-500 hover:bg-amber-500/25 transition shadow-xs"
                >
                  <ShieldAlert size={16} /> Abrir Panel Super Admin & Soporte
                </button>
              )}

              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 py-2.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition"
              >
                <LogOut size={16} /> Cerrar Sesión
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-primary/15 text-primary">
                  <ShieldCheck size={24} />
                </span>
                <h4 className="font-bold text-base text-foreground">Acceso de Usuario</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ingresa para sincronizar tus finanzas de forma segura en la nube.
                </p>
              </div>

              {/* Official Google GIS Button Target */}
              <div ref={googleBtnRef} className="flex justify-center min-h-[44px]"></div>

              {authMode === 'email' ? (
                <form onSubmit={handleEmailSubmit} className="space-y-3 text-left animate-in fade-in-50">
                  <div>
                    <label className="text-xs font-bold text-foreground">Tu Nombre</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. María Pérez"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      placeholder="correo@ejemplo.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-10 w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:brightness-105"
                  >
                    Ingresar con Correo
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthMode('email')}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary text-xs font-bold text-foreground hover:bg-secondary/80"
                >
                  Continuar con Correo
                </button>
              )}

              <p className="text-[10px] text-muted-foreground">
                Protegido por Google OAuth 2.0 • Grupo Walnut
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
