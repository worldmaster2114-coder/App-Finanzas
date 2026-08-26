import { useEffect, useRef, useState } from 'react';
import { UserProfile, UserPurpose, UserUseCase } from '@/types/finance';
import { UserAvatar } from './user-avatar';
import {
  LogIn,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon,
  Sparkles,
  CheckCircle2,
  X,
  Edit3,
  Save,
  Target,
  TrendingUp,
  HeartHandshake,
  Image,
  Camera,
  Layers,
  Settings,
  Mail,
} from 'lucide-react';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onGoogleLogin: (user: Partial<UserProfile>) => void;
  onUpdateUser?: (updatedUser: Partial<UserProfile>) => void;
  onLogout: () => void;
  onOpenAdminPanel?: () => void;
};

// Preset Avatars for custom selection
const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
];

const PURPOSES: { id: UserPurpose; title: string; desc: string; icon: any }[] = [
  { id: 'ahorrar', title: 'Ahorrar para metas', desc: 'Vacaciones, compras y fondo de emergencia.', icon: Target },
  { id: 'controlar', title: 'Controlar y reducir gastos', desc: 'Frenar gastos hormiga y optimizar.', icon: TrendingUp },
  { id: 'deudas', title: 'Salir de deudas', desc: 'Controlar compromisos y disponible diario.', icon: ShieldCheck },
  { id: 'hogar', title: 'Economía del hogar', desc: 'Cuentas de la casa y gastos familiares.', icon: HeartHandshake },
];

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

export function AuthModal({
  isOpen,
  onClose,
  user,
  onGoogleLogin,
  onUpdateUser,
  onLogout,
  onOpenAdminPanel,
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Edit Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [picture, setPicture] = useState(user?.picture || '');
  const [purpose, setPurpose] = useState<UserPurpose>(user?.purpose || 'controlar');
  const [useCase, setUseCase] = useState<UserUseCase>(user?.useCase || 'personal');
  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

  const isSuperAdmin = Boolean(
    user?.email &&
    ['worldmaster2114@gmail.com', 'admin@grupowalnut.com'].includes(user.email.toLowerCase().trim())
  );

  // Sync state when user changes
  useEffect(() => {
    if (user) {
      setName(user.name);
      setPicture(user.picture || '');
      setPurpose(user.purpose || 'controlar');
      setUseCase(user.useCase || 'personal');
    }
  }, [user]);

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
            if (payload && payload.email) {
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
            theme: 'filled_blue',
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'pill',
          });
        }
      } catch (err) {
        console.warn('Google Identity notice:', err);
      }
    }
  }, [isOpen, user, clientId, onGoogleLogin, onClose]);

  if (!isOpen) return null;

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updatedData: Partial<UserProfile> = {
      name: name.trim(),
      picture: picture.trim() || undefined,
      purpose,
      useCase,
    };

    if (onUpdateUser) {
      onUpdateUser(updatedData);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveTab('view');
    }, 1200);
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in-50">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
              <Settings size={16} />
            </span>
            <h3 className="font-serif text-lg font-bold">Perfil & Configuración</h3>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Save Success Banner */}
        {saveSuccess && (
          <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-500 flex items-center gap-2 animate-in fade-in-50">
            <CheckCircle2 size={16} /> ¡Perfil y configuración actualizados con éxito!
          </div>
        )}

        <div className="mt-4 space-y-4">
          {user ? (
            activeTab === 'view' ? (
              /* VIEW PROFILE MODE */
              <div className="space-y-4 text-center">
                <div className="flex flex-col items-center gap-2.5">
                  <UserAvatar picture={user.picture} name={user.name} size="xl" isSuperAdmin={isSuperAdmin} />
                  <div>
                    <div className="flex items-center justify-center gap-1.5">
                      <h4 className="font-bold text-lg text-foreground">{user.name}</h4>
                      {isSuperAdmin && (
                        <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 text-[8px] font-extrabold uppercase text-amber-500">
                          SUPER ADMIN
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
                  </div>
                </div>

                {/* Configuration Summary Card */}
                <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-left space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Target size={14} className="text-primary" /> Propósito Financiero:
                    </span>
                    <span className="font-bold capitalize text-primary">
                      {PURPOSES.find((p) => p.id === user.purpose)?.title || 'Controlar Gastos'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Layers size={14} className="text-purple-500" /> Modo de Presupuesto:
                    </span>
                    <span className="font-bold capitalize text-foreground">
                      {user.useCase === 'shared' ? 'Compartido (Hogar)' : 'Personal'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => setActiveTab('edit')}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:brightness-105 transition"
                  >
                    <Edit3 size={15} /> Editar Datos y Configuración
                  </button>

                  {isSuperAdmin && onOpenAdminPanel && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAdminPanel();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/15 py-2.5 text-xs font-bold text-amber-500 hover:bg-amber-500/25 transition shadow-xs"
                    >
                      <ShieldAlert size={16} /> Abrir Panel Super Admin & Soporte
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 py-2.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition"
                  >
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </div>
              </div>
            ) : (
              /* EDIT PROFILE & CONFIGURATION MODE */
              <form onSubmit={handleSaveChanges} className="space-y-4 animate-in fade-in-50 text-left">
                
                {/* 1. Name */}
                <div>
                  <label className="text-xs font-bold text-foreground">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary font-bold"
                  />
                </div>

                {/* 2. Avatar Selection */}
                <div>
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5">
                    <Camera size={14} className="text-primary" /> Foto de Perfil
                  </label>
                  
                  {/* Preset Avatars Grid */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {AVATAR_PRESETS.map((presetUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPicture(presetUrl)}
                        className={`h-11 w-11 rounded-full overflow-hidden shrink-0 border-2 transition ${
                          picture === presetUrl ? 'border-primary scale-110 shadow-md ring-2 ring-primary/30' : 'border-border opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={presetUrl} alt={`Avatar ${idx + 1}`} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>

                  <input
                    type="url"
                    placeholder="O pega aquí la URL de tu imagen..."
                    value={picture}
                    onChange={(e) => setPicture(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                  />
                </div>

                {/* 3. Purpose Selection */}
                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block">Propósito Principal</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PURPOSES.map((p) => {
                      const Icon = p.icon;
                      const isSelected = purpose === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPurpose(p.id)}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            isSelected ? 'border-primary bg-primary/10 font-bold' : 'border-border bg-card hover:bg-secondary/50'
                          }`}
                        >
                          <Icon size={16} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                          <p className="text-[11px] font-bold mt-1 text-foreground">{p.title}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Use Case (Personal vs Shared) */}
                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block">Modo de Uso</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUseCase('personal')}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        useCase === 'personal' ? 'border-primary bg-primary/10 font-bold' : 'border-border bg-card'
                      }`}
                    >
                      <p className="text-xs font-bold">Personal</p>
                      <p className="text-[10px] text-muted-foreground">Individual</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseCase('shared')}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        useCase === 'shared' ? 'border-purple-500 bg-purple-500/10 font-bold text-purple-400' : 'border-border bg-card'
                      }`}
                    >
                      <p className="text-xs font-bold">Compartido</p>
                      <p className="text-[10px] text-muted-foreground">Hogar o Pareja</p>
                    </button>
                  </div>
                </div>

                {/* Save and Cancel Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('view')}
                    className="flex-1 h-11 rounded-2xl border border-border bg-secondary text-xs font-bold text-foreground hover:bg-secondary/80 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl bg-primary text-xs font-bold text-primary-foreground shadow-md hover:brightness-105 transition"
                  >
                    <Save size={15} /> Guardar Cambios
                  </button>
                </div>

              </form>
            )
          ) : (
            /* LOGIN MODE (FOR UNLOGGED USERS) */
            <div className="space-y-4 text-center">
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
