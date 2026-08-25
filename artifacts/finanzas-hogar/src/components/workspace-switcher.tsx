import { useState } from 'react';
import { UserProfile, Workspace } from '@/types/finance';
import { Users, User, KeyRound, Copy, Check, Plus, ChevronDown, Share2, MessageCircle, X, Link } from 'lucide-react';

type WorkspaceSwitcherProps = {
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  user: UserProfile | null;
  onSwitchWorkspace: (workspaceId: string) => void;
  onCreateSharedWorkspace: (name: string) => void;
  onJoinSharedWorkspace: (code: string) => void;
};

export function WorkspaceSwitcher({
  activeWorkspace,
  workspaces,
  user,
  onSwitchWorkspace,
  onCreateSharedWorkspace,
  onJoinSharedWorkspace,
}: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [tab, setTab] = useState<'create' | 'join' | 'share'>('create');
  const [error, setError] = useState('');

  const getInviteUrl = () => {
    if (!activeWorkspace?.inviteCode) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://50-30-20.grupowalnut.com';
    return `${baseUrl}/?join=${activeWorkspace.inviteCode}&owner=${encodeURIComponent(user?.name || 'Tu Pareja o Familiar')}&workspace=${encodeURIComponent(activeWorkspace.name)}`;
  };

  const copyInviteLink = () => {
    const url = getInviteUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareViaWhatsApp = () => {
    const url = getInviteUrl();
    const text = encodeURIComponent(
      `¡Hola! Te invito a unirte a mi espacio compartido en 50-30-20 (Grupo Walnut) para gestionar y compartir juntos los gastos del hogar o de la vivienda.\n\nHaz clic aquí para registrarte y unirte:\n${url}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    onCreateSharedWorkspace(newWorkspaceName.trim());
    setNewWorkspaceName('');
    setIsModalOpen(false);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) {
      setError('Ingresa el código de 6 dígitos');
      return;
    }
    onJoinSharedWorkspace(joinCodeInput.trim().toUpperCase());
    setJoinCodeInput('');
    setIsModalOpen(false);
  };

  return (
    <div className="relative">
      {/* Active Workspace Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl bg-secondary/80 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition focus-ring w-full justify-between"
      >
        <span className="flex items-center gap-2 truncate">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
            {activeWorkspace?.type === 'shared' ? <Users size={14} /> : <User size={14} />}
          </span>
          <span className="truncate">{activeWorkspace?.name || 'Mi Presupuesto'}</span>
        </span>
        <ChevronDown size={14} className="text-muted-foreground shrink-0" />
      </button>

      {/* Switcher Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-1.5 w-72 rounded-2xl border border-border bg-popover p-2.5 shadow-xl animate-in fade-in-50">
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tus Espacios & Hogares</p>
          
          <div className="space-y-1 my-1">
            {workspaces.map((ws) => {
              const isSelected = activeWorkspace?.id === ws.id;
              return (
                <button
                  key={ws.id}
                  onClick={() => {
                    onSwitchWorkspace(ws.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                    isSelected ? 'bg-primary/10 text-primary font-bold' : 'text-popover-foreground hover:bg-secondary'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {ws.type === 'shared' ? <Users size={14} className="text-purple-500" /> : <User size={14} className="text-blue-500" />}
                    <span className="truncate">{ws.name}</span>
                  </span>
                  {isSelected && <Check size={14} />}
                </button>
              );
            })}
          </div>

          {/* Shared Workspace Quick Share Link */}
          {activeWorkspace?.type === 'shared' && (
            <div className="mt-2 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
                <span className="flex items-center gap-1.5 text-purple-400">
                  <Share2 size={13} /> Compartir este Hogar:
                </span>
                <span className="font-mono text-purple-400 font-extrabold">{activeWorkspace.inviteCode}</span>
              </div>
              
              <div className="flex gap-1.5">
                <button
                  onClick={copyInviteLink}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-card py-2 text-[11px] font-bold text-foreground border border-border hover:bg-secondary transition"
                >
                  {copiedLink ? <Check size={13} className="text-emerald-500" /> : <Link size={13} />}
                  {copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}
                </button>
                <button
                  onClick={shareViaWhatsApp}
                  className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-500 transition"
                  title="Compartir por WhatsApp"
                >
                  <MessageCircle size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-border/60 mt-2 space-y-1">
            <button
              onClick={() => {
                setIsOpen(false);
                setTab('create');
                setIsModalOpen(true);
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition"
            >
              <Plus size={15} /> Crear o Unirse a Hogar
            </button>
          </div>
        </div>
      )}

      {/* Modal Create, Join, or Share Workspace */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-50">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500/15 text-purple-500">
                  <Users size={16} />
                </span>
                <h3 className="font-serif text-lg font-bold">Hogar Compartido</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex gap-2 rounded-xl bg-secondary p-1">
                <button
                  type="button"
                  onClick={() => setTab('create')}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${tab === 'create' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'}`}
                >
                  Crear Hogar
                </button>
                <button
                  type="button"
                  onClick={() => setTab('join')}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${tab === 'join' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'}`}
                >
                  Unirme
                </button>
                {activeWorkspace?.type === 'shared' && (
                  <button
                    type="button"
                    onClick={() => setTab('share')}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${tab === 'share' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'}`}
                  >
                    Invitar
                  </button>
                )}
              </div>

              {tab === 'create' && (
                <form onSubmit={handleCreate} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-foreground">Nombre del Hogar o Pareja</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Casa Familia Pérez"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3.5 text-xs outline-none focus:border-primary"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Se generará un enlace de invitación único para registrarse y compartir gastos.
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:brightness-105"
                  >
                    Crear Hogar & Obtener Enlace
                  </button>
                </form>
              )}

              {tab === 'join' && (
                <form onSubmit={handleJoin} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-foreground">Código de Unión</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Ej. HOG503"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      className="mt-1 h-11 w-full font-mono text-sm tracking-widest font-extrabold uppercase rounded-xl border border-input bg-background px-3.5 outline-none focus:border-primary"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Si te enviaron un enlace directo, al abrirlo te unirás automáticamente.
                    </p>
                  </div>
                  {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
                  <button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:brightness-105"
                  >
                    Solicitar Unirme al Hogar
                  </button>
                </form>
              )}

              {tab === 'share' && activeWorkspace && (
                <div className="space-y-3.5 text-center">
                  <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 space-y-2 text-left">
                    <p className="text-xs font-bold text-foreground">Enlace para invitar:</p>
                    <p className="text-[11px] text-muted-foreground break-all bg-card p-2 rounded-xl border border-border font-mono">
                      {getInviteUrl()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={copyInviteLink}
                      className="flex-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:brightness-105"
                    >
                      {copiedLink ? <Check size={15} /> : <Copy size={15} />}
                      {copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}
                    </button>
                    <button
                      onClick={shareViaWhatsApp}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      <MessageCircle size={16} /> WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
