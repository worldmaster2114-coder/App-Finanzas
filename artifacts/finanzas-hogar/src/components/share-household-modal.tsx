import { useState } from 'react';
import { UserProfile, Workspace } from '@/types/finance';
import {
  Users,
  Copy,
  Check,
  Share2,
  MessageCircle,
  X,
  Link as LinkIcon,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  ArrowRight,
  KeyRound,
  LogIn,
} from 'lucide-react';

type ShareHouseholdModalProps = {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace | null;
  currentUser: UserProfile | null;
  onEnsureSharedCode: () => string;
  onJoinSharedWorkspace?: (code: string) => void;
};

export function ShareHouseholdModal({
  isOpen,
  onClose,
  workspace,
  currentUser,
  onEnsureSharedCode,
  onJoinSharedWorkspace,
}: ShareHouseholdModalProps) {
  const [activeTab, setActiveTab] = useState<'invite' | 'join'>('invite');
  const [copied, setCopied] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  if (!isOpen) return null;

  const inviteCode = workspace?.inviteCode || onEnsureSharedCode();
  const workspaceName = workspace?.name || 'Mi Hogar';
  const ownerName = currentUser?.name || 'Tu Pareja o Familiar';

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://50-30-20.grupowalnut.com';
  const inviteUrl = `${baseUrl}/?join=${inviteCode}&owner=${encodeURIComponent(ownerName)}&workspace=${encodeURIComponent(workspaceName)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `¡Hola! Te invito a unirte a mi espacio compartido en 50-30-20 (Grupo Walnut) para gestionar y compartir juntos los gastos del hogar o de la vivienda.\n\nHaz clic aquí para registrarte y unirte:\n${inviteUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCodeInput.trim().toUpperCase();
    if (!clean) {
      setJoinError('Ingresa el código de 6 dígitos');
      return;
    }

    setIsJoining(true);
    setJoinError('');
    try {
      if (onJoinSharedWorkspace) {
        await onJoinSharedWorkspace(clean);
        setJoinSuccess(`¡Te has unido exitosamente al hogar (${clean})!`);
        setTimeout(() => {
          setJoinSuccess('');
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setJoinError('No se pudo unir al hogar. Verifica el código.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in-50">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-2xl animate-in zoom-in-95 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-purple-500/15 text-purple-400 shadow-xs">
              <HeartHandshake size={20} />
            </span>
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">Hogar Compartido</h3>
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Sincronización en Pareja</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher: Invitar vs Unirme */}
        <div className="flex rounded-2xl bg-secondary p-1 border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab('invite')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'invite' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Invitar a mi Hogar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'join' ? 'bg-card text-purple-400 font-extrabold shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Unirme con Código
          </button>
        </div>

        {/* TAB 1: INVITAR A MI HOGAR */}
        {activeTab === 'invite' && (
          <div className="space-y-4">
            {/* Workspace Info & Direct 6-Digit Code */}
            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/15 via-card to-purple-500/10 p-4 space-y-2.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Users size={15} className="text-purple-400" /> {workspaceName}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">Código del Hogar</span>
              </div>

              {/* Big Prominent Code Display */}
              <div className="flex items-center justify-between bg-card/80 border border-purple-500/30 rounded-xl p-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Código de 6 dígitos:</p>
                  <p className="font-mono text-2xl font-extrabold tracking-widest text-purple-400">{inviteCode}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 rounded-xl bg-purple-500/20 px-3 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/30 transition"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copiado' : 'Copiar Código'}
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Tu pareja puede ingresar este código directamente en su teléfono para sincronizarse al instante.
              </p>
            </div>

            {/* Invite Link Box */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <LinkIcon size={14} className="text-primary" /> Enlace de Invitación Directa
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-background p-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="flex-1 bg-transparent text-xs font-mono text-foreground outline-none select-all truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:brightness-105 transition"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Quick WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-md hover:bg-emerald-500 active:scale-98 transition"
            >
              <MessageCircle size={17} /> Enviar Invitación por WhatsApp
            </button>
          </div>
        )}

        {/* TAB 2: UNIRME CON CÓDIGO (Para que la esposa ingrese el código y se sincronice en 1 segundo) */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoinSubmit} className="space-y-4 text-left">
            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                <KeyRound size={16} /> ¿Tu pareja te dio un código?
              </div>
              <p className="text-[11px] text-foreground/90 leading-snug">
                Ingresa el código de 6 dígitos de tu hogar para vincularte de inmediato y ver los mismos gastos y cuentas en tu teléfono.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Código de Invitación</label>
              <input
                type="text"
                required
                maxLength={8}
                placeholder="Ej. 503020 o X3K8P1"
                value={joinCodeInput}
                onChange={(e) => {
                  setJoinCodeInput(e.target.value.toUpperCase());
                  setJoinError('');
                }}
                className="mt-1.5 h-12 w-full text-center font-mono text-xl font-extrabold tracking-widest rounded-2xl border border-input bg-background px-3 text-foreground outline-none focus:border-primary uppercase"
              />
            </div>

            {joinError && <p className="text-xs font-bold text-destructive">{joinError}</p>}
            {joinSuccess && <p className="text-xs font-bold text-emerald-500">{joinSuccess}</p>}

            <button
              type="submit"
              disabled={isJoining}
              className="h-11 w-full flex items-center justify-center gap-2 rounded-2xl bg-purple-600 text-xs font-bold text-white shadow-md hover:bg-purple-500 active:scale-98 transition"
            >
              <LogIn size={15} /> {isJoining ? 'Vinculando Hogar...' : 'Vincular y Sincronizar Ahora'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
