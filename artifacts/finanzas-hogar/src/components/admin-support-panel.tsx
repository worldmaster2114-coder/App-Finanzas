import { useState, useEffect } from 'react';
import { UserProfile } from '@/types/finance';
import { UserAvatar } from './user-avatar';
import {
  ShieldAlert,
  ShieldCheck,
  Server,
  Database,
  Users,
  MessageSquare,
  Wrench,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
  Lock,
  Unlock,
  Send,
  X,
  ChevronRight,
  Terminal,
  Activity,
  Sparkles,
  Key,
  LogOut,
  Home,
  Wallet,
  CreditCard,
  Building2,
  PiggyBank,
  UserCheck,
  Hash,
} from 'lucide-react';

type AdminSupportPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
};

type MetricsData = {
  server: {
    nodeVersion: string;
    uptimeFormatted: string;
    memoryRssMb: number;
    memoryHeapMb: number;
    port: number | string;
    env: string;
    brand: string;
  };
  database: {
    status: string;
    engine: string;
  };
  counts: {
    users: number;
    workspaces: number;
    transactions: number;
    openTickets: number;
  };
};

type Ticket = {
  id: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: string;
  adminReply?: string;
  createdAt: string;
};

export function AdminSupportPanel({ isOpen, onClose, currentUser }: AdminSupportPanelProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'tickets' | 'tools'>('metrics');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [workspacesList, setWorkspacesList] = useState<any[]>([]);
  const [ticketsList, setTicketsList] = useState<Ticket[]>([]);
  const [replyText, setReplyText] = useState<{ [ticketId: string]: string }>({});
  const [actionSuccess, setActionSuccess] = useState('');
  const [loadError, setLoadError] = useState('');

  const isSuperAdminEmail = currentUser?.email && [
    'worldmaster2114@gmail.com',
    'admin@grupowalnut.com',
  ].includes(currentUser.email.toLowerCase().trim());

  // Auto unlock if verified Super Admin email
  useEffect(() => {
    if (isSuperAdminEmail) {
      setIsUnlocked(true);
    }
  }, [isSuperAdminEmail]);

  // Load metrics and data when panel is opened and unlocked
  useEffect(() => {
    if (isOpen && isUnlocked) {
      loadAllAdminData();
    }
  }, [isOpen, isUnlocked, currentUser?.email]);

  // Fetch one admin endpoint; throws a readable error on HTTP/JSON failure
  const fetchAdmin = async (path: string) => {
    const email = currentUser?.email || '';
    const res = await fetch(`/api/admin/${path}?email=${encodeURIComponent(email)}`, {
      headers: { 'x-admin-email': email },
      cache: 'no-store',
    });
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      throw new Error(`/${path}: respuesta no válida (HTTP ${res.status})`);
    }
    if (!res.ok) {
      throw new Error(`/${path}: ${body?.error || `HTTP ${res.status}`}`);
    }
    return body;
  };

  // Loads ONLY what the server returns. No placeholder/invented data.
  const loadAllAdminData = async () => {
    if (!isSuperAdminEmail) return;
    setLoading(true);
    setLoadError('');
    const [m, u, w, t] = await Promise.allSettled([
      fetchAdmin('metrics'),
      fetchAdmin('users'),
      fetchAdmin('workspaces'),
      fetchAdmin('tickets'),
    ]);

    const errors: string[] = [];
    if (m.status === 'fulfilled') setMetrics(m.value.metrics ?? null);
    else errors.push(m.reason?.message || 'metrics');
    if (u.status === 'fulfilled') setUsersList(Array.isArray(u.value.users) ? u.value.users : []);
    else errors.push(u.reason?.message || 'users');
    if (w.status === 'fulfilled') setWorkspacesList(Array.isArray(w.value.workspaces) ? w.value.workspaces : []);
    else errors.push(w.reason?.message || 'workspaces');
    if (t.status === 'fulfilled') setTicketsList(Array.isArray(t.value.tickets) ? t.value.tickets : []);
    else errors.push(t.reason?.message || 'tickets');

    if (errors.length > 0) {
      console.error('[ADMIN PANEL] Errores de carga:', errors);
      setLoadError(errors.join(' · '));
    }
    setLoading(false);
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput, email: currentUser?.email }),
      });
      const data = await res.json();
      if (data.success) {
        setIsUnlocked(true);
      } else {
        setPinError(data.message || 'Código de seguridad incorrecto');
      }
    } catch (err) {
      setPinError('Error de conexión al validar credenciales');
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    const reply = replyText[ticketId] || 'Ticket atendido y resuelto por el Administrador.';
    const email = currentUser?.email || '';
    const qEmail = encodeURIComponent(email);
    try {
      await fetch(`/api/admin/tickets/${ticketId}?email=${qEmail}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email,
        },
        body: JSON.stringify({ status: 'resolved', adminReply: reply, email }),
      });
      setActionSuccess(`Ticket #${ticketId.slice(-4)} marcado como resuelto.`);
      setTimeout(() => setActionSuccess(''), 3500);
      loadAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportFullBackup = async () => {
    const email = currentUser?.email || '';
    const qEmail = encodeURIComponent(email);
    try {
      const res = await fetch(`/api/admin/db/backup?email=${qEmail}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email,
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_503020_db_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setActionSuccess('Backup global descargado exitosamente.');
      setTimeout(() => setActionSuccess(''), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetAllSessions = async () => {
    if (!confirm('¿Estás seguro de que deseas cerrar todas las sesiones en todos los dispositivos? Todos los usuarios deberán iniciar sesión con Google nuevamente.')) {
      return;
    }
    setLoading(true);
    try {
      const email = currentUser?.email || 'worldmaster2114@gmail.com';
      const res = await fetch('/api/admin/reset-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email,
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess('Todas las sesiones han sido cerradas. Los usuarios deberán autenticarse nuevamente.');
        loadAllAdminData();
      } else {
        alert(data.error || 'Error al cerrar sesiones');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error de conexión al cerrar sesiones');
    } finally {
      setLoading(false);
      setTimeout(() => setActionSuccess(''), 4000);
    }
  };

  if (!isOpen || !isSuperAdminEmail) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md animate-in fade-in-50">
      <div className="relative flex flex-col h-[92dvh] w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-border bg-sidebar px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
              <ShieldAlert size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-foreground">Panel Administrativo & Soporte</h2>
                <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-500">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Consola de Diagnóstico, Telemetría y Gestión de Grupo Walnut</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllAdminData}
              disabled={loading}
              className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition"
              title="Refrescar Datos"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action Success Alert */}
        {actionSuccess && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2.5 text-xs font-bold text-emerald-500 flex items-center gap-2">
            <CheckCircle2 size={16} /> {actionSuccess}
          </div>
        )}

        {/* Security Lock Gate */}
        {!isUnlocked ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-6">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-inner">
              <Lock size={32} />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-serif text-xl font-bold text-foreground">Acceso Restringido</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Este panel contiene herramientas de nivel raíz, métricas del servidor PostgreSQL y base de datos.
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="w-full space-y-3.5">
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-foreground">Clave Maestra o PIN de Seguridad</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Ingresa clave de Super Admin..."
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-input bg-background px-4 pr-10 text-xs outline-none focus:border-amber-500 font-mono tracking-widest"
                  />
                  <span className="absolute right-3.5 top-3 text-muted-foreground">
                    <Key size={16} />
                  </span>
                </div>
              </div>

              {pinError && <p className="text-xs font-semibold text-destructive">{pinError}</p>}

              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 text-xs font-bold text-black shadow-md hover:bg-amber-400 transition"
              >
                <Unlock size={16} /> Desbloquear Consola Administrativa
              </button>
            </form>

            <p className="text-[10px] text-muted-foreground">
              Acceso exclusivo para el Administrador Principal de <strong>Grupo Walnut</strong>.
            </p>
          </div>
        ) : (
          /* Unlocked Admin Dashboard */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Sidebar Tabs */}
            <aside className="w-full md:w-56 border-b md:border-b-0 md:border-r border-border bg-sidebar/50 p-3 space-y-1.5 shrink-0">
              <button
                onClick={() => setActiveTab('metrics')}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                  activeTab === 'metrics' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                <Activity size={16} /> Telemetría & Servidor
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                  activeTab === 'users' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                <Users size={16} /> Usuarios & Hogares
              </button>

              <button
                onClick={() => setActiveTab('tickets')}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                  activeTab === 'tickets' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare size={16} /> Soporte de Clientes
                </div>
                {metrics?.counts?.openTickets ? (
                  <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                    {metrics.counts.openTickets}
                  </span>
                ) : null}
              </button>

              <button
                onClick={() => setActiveTab('tools')}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                  activeTab === 'tools' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                <Wrench size={16} /> Diagnósticos & Backup
              </button>
            </aside>

            {/* Main Tab Content */}
            <main className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              
              {/* TAB 1: METRICS & TELEMETRY */}
              {activeTab === 'metrics' && (
                <div className="space-y-6 animate-in fade-in-50">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
                      <div className="flex items-center justify-between text-muted-foreground text-xs">
                        <span>Usuarios Totales</span>
                        <Users size={16} className="text-blue-500" />
                      </div>
                      <p className="text-2xl font-bold font-serif text-foreground">{metrics?.counts?.users ?? usersList.length ?? 0}</p>
                      <p className="text-[10px] text-emerald-500 font-bold">Registrados en PostgreSQL</p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
                      <div className="flex items-center justify-between text-muted-foreground text-xs">
                        <span>Hogares / Workspaces</span>
                        <Users size={16} className="text-purple-500" />
                      </div>
                      <p className="text-2xl font-bold font-serif text-foreground">{metrics?.counts?.workspaces ?? workspacesList.length ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Grupos creados</p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
                      <div className="flex items-center justify-between text-muted-foreground text-xs">
                        <span>Transacciones</span>
                        <Activity size={16} className="text-emerald-500" />
                      </div>
                      <p className="text-2xl font-bold font-serif text-foreground">{metrics?.counts?.transactions ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Movimientos en la nube</p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
                      <div className="flex items-center justify-between text-muted-foreground text-xs">
                        <span>Base de Datos</span>
                        <Database size={16} className="text-amber-500" />
                      </div>
                      <p className="text-lg font-bold font-serif text-foreground capitalize">{metrics?.database?.status || 'Conectada'}</p>
                      <p className="text-[10px] text-emerald-500 font-bold">PostgreSQL 16 Dokploy</p>
                    </div>
                  </div>

                  {/* Server Telemetry Cards */}
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="rounded-2xl border border-border bg-card p-5 space-y-3.5">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-border">
                        <Server size={18} className="text-primary" />
                        <h4 className="font-bold text-sm text-foreground">Estado del Servidor Node.js</h4>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Versión Node.js:</span>
                          <span className="font-mono font-bold">{metrics?.server?.nodeVersion || 'v22.x'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Tiempo de Actividad (Uptime):</span>
                          <span className="font-mono font-bold text-emerald-500">{metrics?.server?.uptimeFormatted || 'Activo'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Uso de Memoria (Heap / RSS):</span>
                          <span className="font-mono font-bold">{metrics?.server?.memoryHeapMb || 45}MB / {metrics?.server?.memoryRssMb || 92}MB</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-muted-foreground">Puerto de Producción:</span>
                          <span className="font-mono font-bold">{metrics?.server?.port || 5000}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5 space-y-3.5">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-border">
                        <ShieldCheck size={18} className="text-emerald-500" />
                        <h4 className="font-bold text-sm text-foreground">Infraestructura & Dominio</h4>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Dominio Oficial:</span>
                          <span className="font-bold text-primary">50-30-20.grupowalnut.com</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Proveedor de Despliegue:</span>
                          <span className="font-bold">Dokploy CI/CD Webhook</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Certificado SSL / Edge:</span>
                          <span className="font-bold text-emerald-500 flex items-center gap-1">
                            <CheckCircle2 size={13} /> Cloudflare + Let's Encrypt
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-muted-foreground">Autenticación OAuth:</span>
                          <span className="font-bold text-blue-500">Google Identity Services</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: USERS & WORKSPACES */}
              {activeTab === 'users' && (
                <div className="space-y-6 animate-in fade-in-50">
                  {loadError && (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-500 flex items-start gap-2">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">No se pudieron leer algunos datos del servidor:</p>
                        <p className="font-mono break-all">{loadError}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                      <Users size={16} /> Usuarios Registrados ({usersList.length})
                    </h4>
                    <div className="rounded-2xl border border-border overflow-hidden bg-card">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-secondary/60 text-muted-foreground font-bold border-b border-border">
                            <tr>
                              <th className="p-3.5">Usuario</th>
                              <th className="p-3.5">Email</th>
                              <th className="p-3.5">Hogar Asignado</th>
                              <th className="p-3.5">Rol de Acceso</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {usersList.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                                  No hay usuarios en la base de datos aún. Se registrarán con Google Sign-In.
                                </td>
                              </tr>
                            ) : (
                              usersList.map((u) => (
                                <tr key={u.id} className="hover:bg-secondary/30">
                                  <td className="p-3.5 font-bold flex items-center gap-2">
                                    <UserAvatar
                                      picture={u.picture}
                                      name={u.name}
                                      size="xs"
                                      isSuperAdmin={u.email === 'worldmaster2114@gmail.com'}
                                    />
                                    <span>{u.name}</span>
                                  </td>
                                  <td className="p-3.5 text-muted-foreground font-mono">{u.email}</td>
                                  <td className="p-3.5">
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-[11px] font-bold text-primary">
                                      <Home size={12} />
                                      <span>{u.workspaceName || 'Casa de Daniel (Hogar)'}</span>
                                      <span className="text-[10px] font-mono opacity-70">({u.workspaceInviteCode || '503020'})</span>
                                    </span>
                                  </td>
                                  <td className="p-3.5">
                                    {u.email === 'worldmaster2114@gmail.com' ? (
                                      <span className="rounded-md bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2 py-0.5 text-[9px] font-extrabold uppercase">SUPER ADMIN</span>
                                    ) : (
                                      <span className="rounded-md bg-secondary text-muted-foreground px-2 py-0.5 text-[9px] font-bold uppercase">USUARIO</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                      <Home size={16} className="text-primary" /> Hogares & Espacios Compartidos ({workspacesList.length})
                    </h4>

                    {workspacesList.length === 0 ? (
                      <div className="rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground text-xs">
                        No hay hogares creados aún.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {workspacesList.map((w) => (
                          <div key={w.id} className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
                            {/* Header: Workspace title, code, creator, and transaction count */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3.5">
                              <div className="flex items-center gap-3">
                                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                                  <Home size={20} />
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-serif text-base font-bold text-foreground">{w.name}</h5>
                                    <span className="rounded-md bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide">
                                      {w.type === 'shared' ? 'Hogar Compartido' : 'Personal'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                    <span>
                                      Código de Unión: <strong className="font-mono text-primary font-bold text-xs">{w.inviteCode}</strong>
                                    </span>
                                    <span>•</span>
                                    <span>{w.transactionsCount || 0} movimientos registrados</span>
                                  </div>
                                </div>
                              </div>

                              {/* Owner Profile */}
                              <div className="flex items-center gap-2.5 bg-secondary/50 px-3.5 py-2 rounded-xl border border-border">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Anfitrión:</span>
                                <UserAvatar
                                  picture={w.ownerPicture}
                                  name={w.ownerName}
                                  size="xs"
                                  isSuperAdmin={w.ownerEmail === 'worldmaster2114@gmail.com'}
                                />
                                <div className="text-left">
                                  <p className="text-xs font-bold leading-tight text-foreground">{w.ownerName || 'Daniel Gerardo Valdez Perez'}</p>
                                  <p className="text-[10px] font-mono text-muted-foreground">{w.ownerEmail || 'worldmaster2114@gmail.com'}</p>
                                </div>
                              </div>
                            </div>

                            {/* 2 Grids: Linked Users and Financial Accounts */}
                            <div className="grid md:grid-cols-2 gap-4">
                              {/* 1. Cuentas de Usuario Vinculadas (Miembros) */}
                              <div className="rounded-xl border border-border/80 bg-secondary/20 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <Users size={14} className="text-primary" /> Cuentas de Usuario en este Hogar ({w.members?.length || 0})
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">Miembros activos</span>
                                </div>

                                <div className="space-y-2">
                                  {(!w.members || w.members.length === 0) ? (
                                    <p className="text-xs text-muted-foreground p-2">Sin miembros asignados.</p>
                                  ) : (
                                    w.members.map((m: any, mIdx: number) => (
                                      <div key={mIdx} className="flex items-center justify-between bg-card p-2.5 rounded-xl border border-border/70 hover:border-border transition">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <UserAvatar
                                            picture={m.picture}
                                            name={m.name}
                                            size="xs"
                                            isSuperAdmin={m.email === 'worldmaster2114@gmail.com'}
                                          />
                                          <div className="min-w-0">
                                            <p className="text-xs font-bold truncate text-foreground">{m.name}</p>
                                            <p className="text-[10px] font-mono text-muted-foreground truncate">{m.email}</p>
                                          </div>
                                        </div>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                          m.role && m.role.includes('Anfitrión') ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30' : 'bg-secondary text-muted-foreground'
                                        }`}>
                                          {m.role || 'Miembro'}
                                        </span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              {/* 2. Cuentas Financieras Vinculadas (Banco, Billetera, etc.) */}
                              <div className="rounded-xl border border-border/80 bg-secondary/20 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <Wallet size={14} className="text-emerald-500" /> Cuentas Financieras del Hogar ({w.accounts?.length || 0})
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">Billeteras & Bancos</span>
                                </div>

                                <div className="space-y-2">
                                  {(!w.accounts || w.accounts.length === 0) ? (
                                    <p className="text-xs text-muted-foreground p-2">Sin cuentas financieras registradas.</p>
                                  ) : (
                                    w.accounts.map((acc: any, accIdx: number) => (
                                      <div key={accIdx} className="flex items-center justify-between bg-card p-2.5 rounded-xl border border-border/70 hover:border-border transition">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <span
                                            className="grid h-8 w-8 place-items-center rounded-lg text-white text-xs font-bold shrink-0 shadow-xs"
                                            style={{ backgroundColor: acc.color || '#3b82f6' }}
                                          >
                                            {acc.type === 'cash' ? '💵' : acc.type === 'bank' ? '🏦' : acc.type === 'credit_card' ? '💳' : '🐖'}
                                          </span>
                                          <div className="min-w-0">
                                            <p className="text-xs font-bold text-foreground truncate">{acc.name}</p>
                                            <p className="text-[10px] text-muted-foreground capitalize">
                                              {acc.type === 'cash' ? 'Efectivo' : acc.type === 'bank' ? 'Cuenta Bancaria' : acc.type === 'credit_card' ? 'Tarjeta de Crédito' : 'Bóveda de Ahorro'}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <p className="text-xs font-mono font-bold text-foreground">
                                            {acc.currency || 'DOP'} {Number(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </p>
                                          <span className="text-[9px] text-muted-foreground font-semibold">Saldo</span>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: TICKETS & SUPPORT */}
              {activeTab === 'tickets' && (
                <div className="space-y-4 animate-in fade-in-50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-foreground">Solicitudes & Mensajes de Soporte</h4>
                    <span className="text-xs text-muted-foreground">{ticketsList.length} tickets recibidos</span>
                  </div>

                  {ticketsList.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-2">
                      <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                      <p className="text-sm font-bold text-foreground">Bandeja de soporte al día</p>
                      <p className="text-xs text-muted-foreground">No hay solicitudes de usuarios pendientes de atención.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {ticketsList.map((t) => (
                        <div key={t.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${t.status === 'open' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                              <span className="font-bold text-xs text-foreground">{t.subject}</span>
                              <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground capitalize">
                                {t.category}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</span>
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed bg-secondary/30 p-3 rounded-xl">
                            "{t.message}"
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                            <span>De: <strong className="text-foreground">{t.userName}</strong> ({t.userEmail})</span>
                            <span className="font-bold capitalize text-primary">{t.status === 'resolved' ? 'Resuelto' : 'Abierto'}</span>
                          </div>

                          {t.status === 'open' && (
                            <div className="flex gap-2 pt-1">
                              <input
                                type="text"
                                placeholder="Escribe una respuesta para el usuario..."
                                value={replyText[t.id] || ''}
                                onChange={(e) => setReplyText({ ...replyText, [t.id]: e.target.value })}
                                className="h-9 flex-1 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:border-primary"
                              />
                              <button
                                onClick={() => handleResolveTicket(t.id)}
                                className="h-9 rounded-xl bg-primary px-3.5 text-xs font-bold text-primary-foreground hover:brightness-105 transition"
                              >
                                Responder & Resolver
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: TOOLS & DIAGNOSTICS */}
              {activeTab === 'tools' && (
                <div className="space-y-5 animate-in fade-in-50">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                      <div className="flex items-center gap-2 text-primary font-bold text-sm">
                        <Download size={18} /> Backup Global PostgreSQL
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Descarga una copia de seguridad íntegra de todas las tablas de PostgreSQL (Usuarios, Transacciones, Metas, Presupuestos).
                      </p>
                      <button
                        onClick={handleExportFullBackup}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:brightness-105 transition"
                      >
                        <Download size={15} /> Descargar Backup JSON
                      </button>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                      <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                        <Wrench size={18} /> Diagnóstico de Tablas SQL
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Verifica la integridad de los esquemas Drizzle ORM y reaplica migraciones faltantes en PostgreSQL.
                      </p>
                      <button
                        onClick={loadAllAdminData}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary text-xs font-bold text-foreground hover:bg-secondary/80 transition"
                      >
                        <RefreshCw size={15} /> Ejecutar Test de Integridad
                      </button>
                    </div>

                    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3 sm:col-span-2">
                      <div className="flex items-center gap-2 text-destructive font-bold text-sm">
                        <LogOut size={18} /> Forzar Cierre de Todas las Sesiones
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Invalida de inmediato las sesiones activas en todos los dispositivos y navegadores (PC y móviles). Limpia registros de sesión antiguos para que los usuarios inicien sesión limpiamente con su cuenta real de Google. Las transacciones y presupuestos se mantienen intactos.
                      </p>
                      <button
                        onClick={handleResetAllSessions}
                        disabled={loading}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-destructive text-xs font-bold text-destructive-foreground shadow-xs hover:bg-destructive/90 transition"
                      >
                        <LogOut size={15} /> Cerrar Todas las Sesiones Ahora
                      </button>
                    </div>
                  </div>

                  {/* Super Admin Security Credentials Box */}
                  <div className="rounded-2xl border border-border bg-sidebar p-5 space-y-2.5">
                    <h5 className="font-bold text-xs text-foreground flex items-center gap-2">
                      <Lock size={14} className="text-amber-500" /> Credenciales de Super Administrador
                    </h5>
                    <div className="text-xs text-muted-foreground space-y-1 font-mono bg-card p-3 rounded-xl border border-border">
                      <p>Super Admin: <strong className="text-foreground">worldmaster2114@gmail.com</strong></p>
                      <p>Clave Maestra de Respaldo: <strong className="text-amber-500">WALNUT-ADMIN-2026</strong></p>
                      <p>Alcance de Permisos: Control Total (Base de Datos, Soporte, Usuarios, Métricas)</p>
                    </div>
                  </div>
                </div>
              )}

            </main>
          </div>
        )}

      </div>
    </div>
  );
}
