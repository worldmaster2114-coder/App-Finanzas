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
} from 'lucide-react';

type ShareHouseholdModalProps = {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace | null;
  currentUser: UserProfile | null;
  onEnsureSharedCode: () => string;
};

export function ShareHouseholdModal({
  isOpen,
  onClose,
  workspace,
  currentUser,
  onEnsureSharedCode,
}: ShareHouseholdModalProps) {
  const [copied, setCopied] = useState(false);

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

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `¡Hola! Te invito a unirte a mi espacio compartido en 50-30-20 (Grupo Walnut) para gestionar y compartir juntos los gastos del hogar o de la vivienda.\n\nHaz clic aquí para registrarte y unirte:\n${inviteUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in-50">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-purple-500/15 text-purple-400 shadow-xs">
              <HeartHandshake size={20} />
            </span>
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">Compartir Hogar</h3>
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Enlace de Invitación</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Workspace Info Badge */}
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/15 via-card to-purple-500/10 p-4 space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Users size={15} className="text-purple-400" /> Espacio: {workspaceName}
            </span>
            <span className="rounded-md bg-purple-500/20 px-2 py-0.5 font-mono text-[10px] font-extrabold text-purple-300">
              CÓDIGO: {inviteCode}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Comparte este enlace con tu pareja, familiar o compañero para registrar gastos juntos bajo la regla 50-30-20.
          </p>
        </div>

        {/* Invite Link Box */}
        <div className="space-y-2 text-left">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <LinkIcon size={14} className="text-primary" /> Enlace de Registro & Unión Directa
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background p-2.5">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 bg-transparent text-xs font-mono text-foreground outline-none select-all truncate"
            />
            <button
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
          onClick={handleShareWhatsApp}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-md hover:bg-emerald-500 active:scale-98 transition"
        >
          <MessageCircle size={18} /> Enviar Invitación por WhatsApp
        </button>

        {/* How it works 3-step explanation */}
        <div className="rounded-2xl border border-border bg-secondary/30 p-3.5 space-y-2 text-left text-xs">
          <p className="font-bold text-[11px] text-foreground uppercase tracking-wider">¿Cómo funciona?</p>
          <div className="space-y-1.5 text-[11px] text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">1</span>
              <span>Le envías el enlace a la otra persona por WhatsApp o mensaje.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">2</span>
              <span>Al hacer clic, se registrará con su propia cuenta de Google o correo.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">3</span>
              <span>Te llegará una notificación en tu pantalla para <strong>Aceptar y Compartir Hogar</strong>.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
