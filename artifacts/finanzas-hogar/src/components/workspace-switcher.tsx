import { useState } from 'react';
import { UserProfile, Workspace } from '@/types/finance';
import { Users, User, KeyRound, Copy, Check, Plus, ChevronDown, ShieldCheck, Sparkles, X } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [error, setError] = useState('');

  const copyInviteCode = () => {
    if (!activeWorkspace?.inviteCode) return;
    navigator.clipboard.writeText(activeWorkspace.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        className="flex items-center gap-2 rounded-xl bg-secondary/80 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition focus-ring"
      >
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary/15 text-primary">
          {activeWorkspace?.type === 'shared' ? <Users size={14} /> : <User size={14} />}
        </span>
        <span className="max-w-[120px] truncate">{activeWorkspace?.name || 'Mi Presupuesto'}</span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>

      {/* Switcher Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-1.5 w-64 rounded-2xl border border-border bg-popover p-2 shadow-xl animate-in fade-in-50">
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tus Espacios</p>
          
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

          {/* Shared Workspace Info / Code */}
          {activeWorkspace?.type === 'shared' && (
            <div className="mt-2 rounded-xl border border-border bg-secondary/50 p-2.5 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
                <span className="flex items-center gap-1">
                  <KeyRound size={13} className="text-primary" /> Código de Hogar:
                </span>
                <span className="font-mono text-primary font-extrabold uppercase">{activeWorkspace.inviteCode}</span>
              </div>
              <button
                onClick={copyInviteCode}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-card py-1.5 text-[11px] font-bold text-muted-foreground hover:text-foreground border border-border"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                {copied ? '¡Código Copiado!' : 'Copiar Código para 2-3 personas'}
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-border/60 mt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsModalOpen(true);
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition"
            >
              <Plus size={15} /> Crear o Unirse a Hogar
            </button>
          </div>
        </div>
      )}

      {/* Modal Create or Join Shared Workspace */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-serif text-lg font-bold">Espacio Compartido (Hogar)</h3>
              <button onClick={() => setIsModalOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground">
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
                  Crear Nuevo Hogar
                </button>
                <button
                  type="button"
                  onClick={() => setTab('join')}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${tab === 'join' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'}`}
                >
                  Unirme con Código
                </button>
              </div>

              {tab === 'create' ? (
                <form onSubmit={handleCreate} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-foreground">Nombre del Hogar / Pareja</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Casa Familia Pérez"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-10 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:brightness-105"
                  >
                    Crear Hogar y Generar Código
                  </button>
                </form>
              ) : (
                <form onSubmit={handleJoin} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-foreground">Código de Invitación (6 dígitos)</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Ej. HOG503"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      className="mt-1 h-10 w-full font-mono text-sm tracking-widest font-extrabold uppercase rounded-xl border border-input bg-background px-3 outline-none focus:border-primary"
                    />
                  </div>
                  {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
                  <button
                    type="submit"
                    className="w-full h-10 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:brightness-105"
                  >
                    Unirme al Hogar
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
